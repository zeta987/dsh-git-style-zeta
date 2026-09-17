/*
 * The browser half is served as a file, not imported, so these tests evaluate
 * it the way the loader does: in a sandbox holding only the globals the page
 * gets. React is a stub that records the element tree instead of rendering it.
 *
 * Values crossing the sandbox boundary carry the sandbox's prototypes, so
 * structural assertions spread them into this realm first.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const CLIENT_PATH = new URL('../lib/client.js', import.meta.url);

/** Evaluate `lib/client.js` and return its registration and module exports. */
async function loadClient(overrides = {}) {
  const source = await readFile(CLIENT_PATH, 'utf8');
  let registration;
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    Fragment: Symbol('Fragment'),
    useCallback: (fn) => fn,
    useEffect: () => {},
    useMemo: (fn) => fn(),
    useState: (value) => [typeof value === 'function' ? value() : value, () => {}],
    useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  };
  const created = [];
  const document = overrides.document ?? {
    head: { appendChild: (node) => created.push(node) },
    getElementById: () => null,
    createElement: () => ({ id: '', textContent: '' }),
  };
  const window = { __ModuleLoader__: { load(value) { registration = value; } }, document };
  const sandbox = { console, document, window };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'client.js' });
  const exports = registration.factory((id) => {
    if (id === 'react') return React;
    throw new Error(`unexpected require: ${id}`);
  });
  return { registration, exports, styles: created };
}

/** Copy sandbox-realm ops into this realm so structural assertions apply. */
function normalize(ops) {
  return Array.from(ops, (op) => ({ ...op }));
}

/** A settings scope stub recording every mutation the page queues. */
function scopeStub(snapshot) {
  const calls = [];
  return {
    calls,
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    set: async (field, value) => { calls.push({ op: 'set', field, value }); },
    unset: async (field) => { calls.push({ op: 'unset', field }); },
  };
}

test('registers under the package id and exports the loader shape', async () => {
  const { registration, exports } = await loadClient();
  assert.equal(registration.id, 'dsh-git-style-zeta');
  assert.equal(typeof registration.factory, 'function');
  assert.deepEqual([...exports.inject], ['slots', 'locale', 'settingsScope']);
  assert.equal(typeof exports.apply, 'function');
});

test('both dictionaries cover the same strings and Chinese locales read Chinese', async () => {
  const { exports } = await loadClient();
  const en = exports.pickStrings('en');
  const zhTw = exports.pickStrings('zh-TW');
  const zhCn = exports.pickStrings('zh-CN');
  assert.deepEqual([...Object.keys(zhTw)].sort(), [...Object.keys(en)].sort());
  assert.equal(zhTw, zhCn, 'one Chinese dictionary serves both Chinese locales');
  assert.notEqual(zhTw.title, en.title);
  for (const [key, value] of Object.entries(en)) {
    assert.equal(typeof value, 'string', `${key} is a plain string`);
    assert.ok(value.length > 0, `${key} is not empty`);
    assert.ok(zhTw[key].length > 0, `zh ${key} is not empty`);
  }
});

test('an unknown or missing locale falls back to English', async () => {
  const { exports } = await loadClient();
  const en = exports.pickStrings('en');
  assert.equal(exports.pickStrings(undefined), en);
  assert.equal(exports.pickStrings(''), en);
  assert.equal(exports.pickStrings('ja-JP'), en);
});

test('only more than whitespace turns a prompt section on', async () => {
  const { exports } = await loadClient();
  assert.equal(exports.enabled(''), false);
  assert.equal(exports.enabled('   \n\t '), false);
  assert.equal(exports.enabled('use conventional commits'), true);
});

test('the preview shows each enabled section and nothing for empty fields', async () => {
  const { exports } = await loadClient();
  assert.equal(exports.previewOf({ commit: '', pr: '  ' }, exports.SECTIONS), '');

  const commitOnly = exports.previewOf({ commit: 'Explain why.', pr: '' }, exports.SECTIONS);
  assert.match(commitOnly, /^## Git commit instructions\n/);
  assert.match(commitOnly, /Explain why\./);
  assert.doesNotMatch(commitOnly, /pull request instructions/);

  const both = exports.previewOf({ commit: 'Explain why.', pr: 'List the checks.' }, exports.SECTIONS);
  assert.ok(both.indexOf('## Git commit instructions') < both.indexOf('## Git pull request instructions'));
  assert.match(both, /List the checks\./);
});

test('the preview keeps braces and inner blank lines literally', async () => {
  const { exports } = await loadClient();
  const instructions = 'Keep {{template}} markers.\n\nUse ${VAR} as written.';
  const preview = exports.previewOf({ commit: instructions, pr: '' }, exports.SECTIONS);
  assert.ok(preview.includes(instructions));
});

test('a draft reads the resolved section and tolerates missing or wrong types', async () => {
  const { exports } = await loadClient();
  assert.deepEqual({ ...exports.draftFrom(undefined) }, { commit: '', pr: '' });
  assert.deepEqual({ ...exports.draftFrom(null) }, { commit: '', pr: '' });
  assert.deepEqual({ ...exports.draftFrom({}) }, { commit: '', pr: '' });
  assert.deepEqual({ ...exports.draftFrom({ 'git-commit-instructions': 7 }) }, { commit: '', pr: '' });
  assert.deepEqual(
    { ...exports.draftFrom({ 'git-commit-instructions': 'a', 'git-pr-instructions': 'b' }) },
    { commit: 'a', pr: 'b' },
  );
});

test('presence in the user layer is what marks a field overridden', async () => {
  const { exports } = await loadClient();
  const field = exports.FIELDS.commit;
  assert.equal(exports.overridden(undefined, field), false);
  assert.equal(exports.overridden({}, field), false);
  assert.equal(exports.overridden({ [field]: '' }, field), true, 'an empty override is still an override');
  assert.equal(exports.overridden({ [field]: 'x' }, field), true);
});

test('saving writes only the changed fields', async () => {
  const { exports } = await loadClient();
  const snapshot = { status: 'ready', base: {}, user: {}, value: {} };
  const ops = normalize(exports.opsFor({ commit: 'Explain why.', pr: '' }, snapshot));
  assert.deepEqual(ops, [{ field: 'git-commit-instructions', value: 'Explain why.' }]);
});

test('saving a value equal to the profile layer clears the override instead', async () => {
  const { exports } = await loadClient();
  const snapshot = {
    status: 'ready',
    base: { 'git-commit-instructions': 'from the row' },
    user: { 'git-commit-instructions': 'edited here' },
    value: { 'git-commit-instructions': 'edited here' },
  };
  const ops = normalize(exports.opsFor({ commit: 'from the row', pr: '' }, snapshot));
  assert.deepEqual(ops, [{ field: 'git-commit-instructions' }], 'no value means clear the field');
});

test('saving an unchanged draft queues nothing', async () => {
  const { exports } = await loadClient();
  const snapshot = {
    status: 'ready',
    base: { 'git-pr-instructions': 'row text' },
    user: { 'git-commit-instructions': 'mine' },
    value: { 'git-commit-instructions': 'mine', 'git-pr-instructions': 'row text' },
  };
  assert.deepEqual(normalize(exports.opsFor({ commit: 'mine', pr: 'row text' }, snapshot)), []);
});

test('clearing a field the profile does not set removes the override', async () => {
  const { exports } = await loadClient();
  const snapshot = {
    status: 'ready',
    base: {},
    user: { 'git-pr-instructions': 'mine' },
    value: { 'git-pr-instructions': 'mine' },
  };
  const ops = normalize(exports.opsFor({ commit: '', pr: '' }, snapshot));
  assert.deepEqual(ops, [{ field: 'git-pr-instructions' }]);
});

test('apply binds the plugin namespace and registers one settings section', async () => {
  const { exports } = await loadClient();
  const registered = [];
  const bound = [];
  let active = 'en';
  const scope = scopeStub({ status: 'ready', base: {}, user: {}, value: {} });
  const ctx = {
    locale: { getSnapshot: () => ({ active }), subscribe: () => () => {} },
    settingsScope: { bind: (spec) => { bound.push({ ...spec }); return scope; } },
    slots: {
      inject: (_name, run) => run(),
      register: (options, component) => registered.push({ options, component }),
    },
  };
  exports.apply(ctx);
  assert.deepEqual(bound, [{ namespace: 'git-style-zeta' }]);
  assert.equal(registered.length, 1);
  const { options, component } = registered[0];
  assert.equal(options.name, 'settings.section');
  assert.equal(options.id, 'git-style-zeta');
  assert.equal(typeof options.order, 'number');
  assert.equal(typeof component, 'function');
  assert.equal(options.label(), exports.pickStrings('en').title);
  active = 'zh-TW';
  assert.equal(options.label(), exports.pickStrings('zh-TW').title);
});

test('apply adds its stylesheet once and tolerates a repeated load', async () => {
  const nodes = [];
  const ids = new Set();
  const document = {
    head: { appendChild: (node) => { nodes.push(node); ids.add(node.id); } },
    getElementById: (id) => (ids.has(id) ? {} : null),
    createElement: () => ({ id: '', textContent: '' }),
  };
  const { exports } = await loadClient({ document });
  const scope = scopeStub({ status: 'ready', base: {}, user: {}, value: {} });
  const ctx = {
    locale: { getSnapshot: () => ({ active: 'en' }), subscribe: () => () => {} },
    settingsScope: { bind: () => scope },
    slots: { inject: (_name, run) => run(), register: () => {} },
  };
  exports.apply(ctx);
  exports.apply(ctx);
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].id, 'dsh-git-style-zeta-style');
  assert.ok(nodes[0].textContent.includes('.gz{'));
});
