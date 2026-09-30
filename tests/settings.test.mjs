/*
 * The settings half: the settings page writes the plugin's volatile fields into
 * its profile entry, and the Loader commits each change into the running
 * references instead of remounting. These drive the real Loader over an
 * in-memory entry tree, so nothing here touches a profile document.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Context } from '@deepseek-ai/cordis';
import Loader from '@deepseek-ai/cordis-plugin-loader';
import SystemPrompt, { renderPrompt } from '@deepseek-ai/dsh-system-prompt';
import * as plugin from '../lib/index.js';

const ID = plugin.SETTINGS_NAMESPACE;
const COMMIT = 'git-commit-instructions';
const PR = 'git-pr-instructions';

/** A host with the prompt service and a Loader holding the plugin's entry. */
async function host(t, config) {
  const ctx = new Context();
  await ctx.plugin(SystemPrompt, {});
  await ctx.plugin(Loader, { baseUrl: import.meta.url });
  await ctx.loader.create({ id: ID, name: '../lib/index.js', config });
  await ctx.loader.await();
  t.after(() => ctx.fiber.dispose());
  return ctx;
}

/** Apply a settings-page edit the way the settings service persists it. */
async function edit(ctx, config) {
  ctx.loader.update(ID, { config });
  await ctx.loader.await();
}

/** The plugin's own prompt sections, in assembly order. */
async function sections(ctx) {
  const assembled = await ctx.systemPrompt.assemble({});
  return assembled.sections.filter((s) => s.name.startsWith('git-style-zeta:')).map((s) => s.name);
}

async function rendered(ctx) {
  return renderPrompt(await ctx.systemPrompt.assemble({}));
}

test('the settings namespace is the bundle row id', async () => {
  const { parse } = await import('yaml');
  const { readFile } = await import('node:fs/promises');
  const patch = parse(await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8'));
  assert.equal(patch[0].insert[0].id, ID);
});

test('both instruction fields are volatile so the settings form exposes them', () => {
  for (const field of [COMMIT, PR]) {
    assert.equal(plugin.Config.dict[field].meta.volatile, true, `${field} is volatile`);
  }
});

test('an edit replaces the row text in place without remounting', async (t) => {
  const ctx = await host(t, { [COMMIT]: 'from the row' });
  const fiber = ctx.loader.resolve(ID).fiber;
  await edit(ctx, { [COMMIT]: 'from the settings page' });
  assert.equal(ctx.loader.resolve(ID).fiber, fiber, 'the running fiber is kept');
  const text = await rendered(ctx);
  assert.ok(text.includes('from the settings page'));
  assert.ok(!text.includes('from the row'));
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit']);
});

test('an edit turns a section on for a row that configured nothing', async (t) => {
  const ctx = await host(t, {});
  assert.deepEqual(await sections(ctx), []);
  await edit(ctx, { [PR]: 'List the checks actually run.' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:pr']);
  assert.ok((await rendered(ctx)).includes('List the checks actually run.'));
});

test('emptying a field turns its section off', async (t) => {
  const ctx = await host(t, { [COMMIT]: 'from the row', [PR]: 'row PR text' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit', 'git-style-zeta:pr']);
  await edit(ctx, { [COMMIT]: '', [PR]: 'row PR text' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:pr']);
  assert.ok(!(await rendered(ctx)).includes('from the row'));
});

test('an edit is applied literally, braces and all', async (t) => {
  const ctx = await host(t, {});
  const instructions = 'Keep {{template}} markers.\n\nUse ${VAR} and 中文 as written.';
  await edit(ctx, { [COMMIT]: instructions });
  assert.ok((await rendered(ctx)).includes(instructions));
});

test('repeated edits leave one section per field and no stale text', async (t) => {
  const ctx = await host(t, {});
  for (const text of ['first', 'second', 'third']) await edit(ctx, { [COMMIT]: text });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit']);
  const text = await rendered(ctx);
  assert.ok(text.includes('third'));
  assert.ok(!text.includes('first'));
  assert.ok(!text.includes('second'));
});

test('removing the entry after an edit removes its sections and leaves other prompt data', async (t) => {
  const ctx = await host(t, { [COMMIT]: 'from the row' });
  ctx.systemPrompt.section({ name: 'other-plugin', order: 1, text: 'Other authors stay.' });
  await edit(ctx, { [COMMIT]: 'from the settings page' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit']);
  await ctx.loader.remove(ID);
  await ctx.loader.await();
  assert.deepEqual(await sections(ctx), []);
  assert.ok((await rendered(ctx)).includes('Other authors stay.'));
});

test('a mounted settings service is told this entry ships its own page', async (t) => {
  const ctx = new Context();
  await ctx.plugin(SystemPrompt, {});
  const policies = [];
  ctx.provide('settings', {
    configure(presentation, owner) {
      const record = { presentation, owner, disposed: false };
      policies.push(record);
      return () => { record.disposed = true; };
    },
  });
  t.after(() => ctx.fiber.dispose());
  const fork = await ctx.plugin(plugin, { [COMMIT]: 'from the row' });
  assert.equal(policies.length, 1);
  assert.deepEqual({ ...policies[0].presentation }, { auto: false });
  assert.equal(policies[0].owner, fork);
  await fork.dispose();
  assert.equal(policies[0].disposed, true);
});

test('without a settings service the row config still applies on its own', async (t) => {
  const ctx = new Context();
  await ctx.plugin(SystemPrompt, {});
  t.after(() => ctx.fiber.dispose());
  assert.equal(ctx.settings, undefined);
  await ctx.plugin(plugin, { [COMMIT]: 'from the row' });
  assert.deepEqual(await sections(ctx), ['git-style-zeta:commit']);
  assert.ok((await rendered(ctx)).includes('from the row'));
});
