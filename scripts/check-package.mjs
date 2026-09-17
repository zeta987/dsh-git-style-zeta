import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// npm supplies the path on Windows and POSIX, avoiding shell quoting and .cmd execution.
assert.ok(process.env.npm_execpath, 'Run this check through npm run check:package');
const result = spawnSync(process.execPath, [process.env.npm_execpath, 'pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' });
if (result.error) throw result.error;
assert.equal(result.status, 0, result.stderr);
const output = JSON.parse(result.stdout);
// npm <=11 returns an array; npm 12 keys entries by package name.
const packs = Array.isArray(output) ? output : Object.values(output);
assert.equal(packs.length, 1, 'Expected exactly one packed package');
const [pack] = packs;
assert.deepEqual(pack.files.map(file => file.path).sort(), [
  'LICENSE', 'README.md', 'README.zh-CN.md', 'README.zh-TW.md',
  'cordis.patch.yml', 'docs/releasing.md', 'examples/cordis.patch.yml',
  'lib/index.js', 'package.json',
  'docs/images/README.md', 'docs/images/plugin-list-en.png', 'docs/images/plugin-list-zh.png',
  'docs/images/system-prompt-en.png', 'docs/images/system-prompt-zh.png',
].sort(), 'Published files must match the distributable allowlist');
console.log(`Package verified: ${pack.filename}, ${pack.files.length} files, ${pack.size} bytes`);
