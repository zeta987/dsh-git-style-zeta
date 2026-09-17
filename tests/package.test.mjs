import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { parse } from 'yaml';
import { Config } from '../lib/index.js';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');

test('bundle points to the published native plugin and profile override config validates', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const patch = parse(await read(pkg.dsh.bundle.patch));
  assert.deepEqual(patch, [{ insert: [{ id: 'git-style-zeta', name: pkg.name }] }]);
  const [override] = parse(await read('examples/cordis.patch.yml'));
  assert.equal(override.id, patch[0].insert[0].id);
  assert.deepEqual(Config(override.config), override.config);
  assert.equal(pkg.main, 'lib/index.js');
  assert.equal(pkg.exports['.'], './lib/index.js');
  for (const topic of ['dsh-plugin', 'deepseek-harness', 'dsh']) assert.ok(pkg.keywords.includes(topic));
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(pkg.scripts[hook], undefined);
});

test('all README YAML examples use the same supported config and all local links exist', async () => {
  for (const file of ['README.md', 'README.zh-TW.md', 'README.zh-CN.md']) {
    const text = await read(file);
    const yaml = /```yaml\r?\n([\s\S]*?)\r?\n```/.exec(text);
    assert.ok(yaml, `${file} needs a configuration example`);
    const [row] = parse(yaml[1]);
    assert.equal(row.id, 'git-style-zeta');
    assert.deepEqual(Config(row.config), row.config);
    for (const [, link] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (!link.startsWith('https://')) await read(link);
    }
  }
});
