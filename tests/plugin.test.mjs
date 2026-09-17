import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Context } from '@deepseek-ai/cordis';
import { createScope, scopeOf } from '@deepseek-ai/dsh-scope';
import SystemPrompt, { renderPrompt } from '@deepseek-ai/dsh-system-prompt';
import * as plugin from '../lib/index.js';

async function host(t) {
  const ctx = new Context();
  await ctx.plugin(SystemPrompt, {});
  t.after(() => ctx.fiber.dispose());
  return ctx;
}

async function sections(ctx) {
  return (await ctx.systemPrompt.assemble({})).sections.filter(s => s.name.startsWith('git-style-zeta:'));
}

test('empty defaults contribute no instructions', async t => {
  const ctx = await host(t);
  await ctx.plugin(plugin, {});
  assert.deepEqual(await sections(ctx), []);
});

test('commit and PR instructions reach the native prompt literally and preserve attribution', async t => {
  const ctx = await host(t);
  const commit = 'Use Conventional Commits.\nCo-authored-by: Example <example@example.com>\nKeep {{literal}}.';
  const pr = 'Report tests.\nPreserve `{{template}}` and 中文.';
  await ctx.plugin(plugin, { 'git-commit-instructions': commit, 'git-pr-instructions': pr });
  const parts = await sections(ctx);
  assert.equal(parts.length, 2);
  const rendered = renderPrompt(await ctx.systemPrompt.assemble({}));
  assert.ok(rendered.includes(commit));
  assert.ok(rendered.includes(pr));
  assert.match(rendered, /Preserve existing.*attribution/i);
  assert.match(rendered, /duplicate/i);
});

for (const field of ['git-commit-instructions', 'git-pr-instructions']) {
  test(`${field} can be enabled independently and unloads cleanly`, async t => {
    const ctx = await host(t);
    ctx.systemPrompt.section({ name: 'other-plugin', order: 1, text: 'Other authors stay.' });
    const baseline = renderPrompt(await ctx.systemPrompt.assemble({}));
    const fork = await ctx.plugin(plugin, { [field]: '  Exact text\n' });
    assert.equal((await sections(ctx)).length, 1);
    assert.ok(renderPrompt(await ctx.systemPrompt.assemble({})).includes('  Exact text\n'));
    await fork.dispose();
    assert.equal(renderPrompt(await ctx.systemPrompt.assemble({})), baseline);
    const replacement = await ctx.plugin(plugin, { [field]: 'Replacement' });
    assert.equal((await sections(ctx)).length, 1);
    assert.ok(renderPrompt(await ctx.systemPrompt.assemble({})).includes('Replacement'));
    await replacement.dispose();
  });
}

test('whitespace-only values disable both sections', async t => {
  const ctx = await host(t);
  await ctx.plugin(plugin, { 'git-commit-instructions': ' \t\r\n', 'git-pr-instructions': '\n' });
  assert.deepEqual(await sections(ctx), []);
});

test('a separate DSH context does not receive this plugin guidance', async t => {
  const enabled = await host(t);
  const untouched = await host(t);
  await enabled.plugin(plugin, { 'git-commit-instructions': 'DSH-specific guidance' });
  assert.equal((await sections(enabled)).length, 1);
  assert.deepEqual(await sections(untouched), []);
});

test('host-level guidance reaches native agent scopes without replacing their instructions', async t => {
  const ctx = await host(t);
  const scopes = [];
  await ctx.plugin(Object.assign(inner => {
    for (const name of ['parent', 'child']) scopes.push(createScope(inner, { name }));
  }, { inject: ['systemPrompt'] }));
  scopes[0].ctx.systemPrompt.section({ name: 'agent-only', order: 2, text: 'Parent-only instructions' });
  const fork = await ctx.plugin(plugin, { 'git-commit-instructions': 'Shared commit guidance' });
  const render = scope => ctx.systemPrompt.assemble({ scope: scopeOf(scope.ctx) }).then(renderPrompt);
  assert.match(await render(scopes[0]), /Shared commit guidance/);
  assert.match(await render(scopes[0]), /Parent-only instructions/);
  assert.match(await render(scopes[1]), /Shared commit guidance/);
  assert.doesNotMatch(await render(scopes[1]), /Parent-only instructions/);
  await fork.dispose();
  assert.doesNotMatch(await render(scopes[0]), /Shared commit guidance/);
  assert.match(await render(scopes[0]), /Parent-only instructions/);
  for (const scope of scopes) await scope.dispose();
});

test('schema rejects non-string instruction values other than native null defaults', () => {
  for (const field of ['git-commit-instructions', 'git-pr-instructions']) {
    for (const value of [false, 42, [], {}]) {
      assert.throws(() => plugin.Config({ [field]: value }));
    }
  }
});

test('omitted and YAML null values use the native empty defaults', () => {
  assert.deepEqual(plugin.Config({}), { 'git-commit-instructions': '', 'git-pr-instructions': '' });
  assert.deepEqual(plugin.Config({ 'git-commit-instructions': null, 'git-pr-instructions': null }), plugin.Config({}));
});

test('repeated assemblies preserve arbitrary braces, whitespace and existing prompt data', async t => {
  const ctx = await host(t);
  ctx.systemPrompt.variable('unrelated', () => 'original');
  ctx.systemPrompt.section({ name: 'unrelated', order: -1, text: '{{unrelated}}' });
  const instructions = '\n  {{ model }} {{nested {{x}}}} {{constructor}} {{\nCo-authored-by: Claude <noreply@anthropic.com>\n';
  const fork = await ctx.plugin(plugin, { 'git-commit-instructions': instructions });
  const first = renderPrompt(await ctx.systemPrompt.assemble({}));
  assert.ok(first.includes(instructions));
  assert.equal(renderPrompt(await ctx.systemPrompt.assemble({})), first);
  await fork.dispose();
  const assembly = await ctx.systemPrompt.assemble({});
  assert.deepEqual(assembly.variables, { unrelated: 'original' });
  assert.ok(renderPrompt(assembly).includes('original'));
});
