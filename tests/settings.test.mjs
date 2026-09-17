/*
 * The settings half: with a provider mounted, the bundle row's config becomes
 * the base layer of the plugin's own namespace, and a user override changes the
 * assembled prompt in place. These run against the real DSH settings service
 * over an in-memory provider, so nothing here touches a settings document.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Context } from '@deepseek-ai/cordis';
import SettingsProvider from '@deepseek-ai/dsh-settings';
import SystemPrompt, { renderPrompt } from '@deepseek-ai/dsh-system-prompt';
import * as plugin from '../lib/index.js';

const NS = plugin.SETTINGS_NAMESPACE;
const COMMIT = 'git-commit-instructions';
const PR = 'git-pr-instructions';

/** A writable provider keeping the document in memory for the test's lifetime. */
class MemoryProvider extends SettingsProvider {
  writable = true;
  document = {};

  async load() {
    return this.document;
  }

  async persist(ns, section) {
    this.document = { ...this.document, [ns]: section };
  }
}

/** A host with the prompt service and, unless opted out, a settings provider. */
async function host(t, { settings = true } = {}) {
  const ctx = new Context();
  await ctx.plugin(SystemPrompt, {});
  const provider = settings ? await ctx.plugin(MemoryProvider, {}) : undefined;
  t.after(() => ctx.fiber.dispose());
  return { ctx, provider };
}

/** The plugin's own prompt sections, in assembly order. */
async function sections(ctx) {
  const assembled = await ctx.systemPrompt.assemble({});
  return assembled.sections.filter((s) => s.name.startsWith('git-style-zeta:')).map((s) => s.name);
}

async function rendered(ctx) {
  return renderPrompt(await ctx.systemPrompt.assemble({}));
}

test('the settings service appears and the row config resolves as its base', async (t) => {
  const { ctx } = await host(t);
  assert.equal(typeof ctx.settings, 'object');
  await ctx.plugin(plugin, { [COMMIT]: 'from the row' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit']);
  assert.ok((await rendered(ctx)).includes('from the row'));
  assert.equal(ctx.settings.get(NS)[COMMIT], 'from the row');
});

test('a user override replaces the row text without reloading the plugin', async (t) => {
  const { ctx } = await host(t);
  await ctx.plugin(plugin, { [COMMIT]: 'from the row' });
  await ctx.settings.update(NS, { [COMMIT]: 'from the settings page' });
  const text = await rendered(ctx);
  assert.ok(text.includes('from the settings page'));
  assert.ok(!text.includes('from the row'));
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit']);
});

test('an override turns a section on for a row that configured nothing', async (t) => {
  const { ctx } = await host(t);
  await ctx.plugin(plugin, {});
  assert.deepEqual(await sections(ctx), []);
  await ctx.settings.update(NS, { [PR]: 'List the checks actually run.' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:pr']);
  assert.ok((await rendered(ctx)).includes('List the checks actually run.'));
});

test('emptying an overridden field turns its section off', async (t) => {
  const { ctx } = await host(t);
  await ctx.plugin(plugin, { [COMMIT]: 'from the row', [PR]: 'row PR text' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit', 'git-style-zeta:pr']);
  await ctx.settings.update(NS, { [COMMIT]: '' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:pr']);
  assert.ok(!(await rendered(ctx)).includes('from the row'));
});

test('clearing the user layer hands the field back to the row', async (t) => {
  const { ctx } = await host(t);
  await ctx.plugin(plugin, { [COMMIT]: 'from the row' });
  await ctx.settings.update(NS, { [COMMIT]: 'from the settings page' });
  assert.ok((await rendered(ctx)).includes('from the settings page'));
  await ctx.settings.replace(NS, {});
  const text = await rendered(ctx);
  assert.ok(text.includes('from the row'));
  assert.ok(!text.includes('from the settings page'));
});

test('an override is applied literally, braces and all', async (t) => {
  const { ctx } = await host(t);
  await ctx.plugin(plugin, {});
  const instructions = 'Keep {{template}} markers.\n\nUse ${VAR} and 中文 as written.';
  await ctx.settings.update(NS, { [COMMIT]: instructions });
  assert.ok((await rendered(ctx)).includes(instructions));
});

test('repeated overrides leave one section per field and no stale text', async (t) => {
  const { ctx } = await host(t);
  await ctx.plugin(plugin, {});
  for (const text of ['first', 'second', 'third']) {
    await ctx.settings.update(NS, { [COMMIT]: text });
  }
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit']);
  const text = await rendered(ctx);
  assert.ok(text.includes('third'));
  assert.ok(!text.includes('first'));
  assert.ok(!text.includes('second'));
});

test('unloading the plugin removes its sections and leaves other prompt data', async (t) => {
  const { ctx } = await host(t);
  ctx.systemPrompt.section({ name: 'other-plugin', order: 1, text: 'Other authors stay.' });
  const baseline = await rendered(ctx);
  const fork = await ctx.plugin(plugin, { [COMMIT]: 'from the row' });
  await ctx.settings.update(NS, { [COMMIT]: 'from the settings page' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit']);
  await fork.dispose();
  assert.deepEqual(await sections(ctx), []);
  assert.equal(await rendered(ctx), baseline);
});

test('without a provider the row config still applies on its own', async (t) => {
  const { ctx } = await host(t, { settings: false });
  assert.equal(ctx.settings, undefined);
  await ctx.plugin(plugin, { [COMMIT]: 'from the row' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit']);
  assert.ok((await rendered(ctx)).includes('from the row'));
});

test('losing the provider falls back to the row config', async (t) => {
  const { ctx, provider } = await host(t);
  await ctx.plugin(plugin, { [COMMIT]: 'from the row' });
  await ctx.settings.update(NS, { [COMMIT]: 'from the settings page' });
  assert.ok((await rendered(ctx)).includes('from the settings page'));
  await provider.dispose();
  const text = await rendered(ctx);
  assert.ok(text.includes('from the row'));
  assert.ok(!text.includes('from the settings page'));
});

test('the namespace is described for a configuration surface with both layers', async (t) => {
  const { ctx } = await host(t);
  await ctx.plugin(plugin, { [COMMIT]: 'from the row' });
  await ctx.settings.update(NS, { [COMMIT]: 'from the settings page' });
  const described = ctx.settings.describe().find((entry) => entry.ns === NS);
  assert.ok(described, 'the plugin namespace is listed');
  assert.equal(described.base[COMMIT], 'from the row');
  assert.equal(described.user[COMMIT], 'from the settings page');
});
