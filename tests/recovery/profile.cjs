// External test infrastructure only. Never imported by a product entrypoint.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const REPO = path.resolve(__dirname, '../..');
const BASE = process.env.JARVIS_RECOVERY_TEST_ID ? process.env.JARVIS_RECOVERY_TEST_BASE : path.join(os.tmpdir(), 'jarvis-recovery-acceptance');
const ID = /^jarvis-recovery-([A-F])-([a-f0-9]{32})$/;
function inside(child, parent) {
  const relative = path.relative(parent, child);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}
function canonical(target) {
  assert.ok(typeof target === 'string' && target && path.isAbsolute(target), 'INVALID_PATH');
  const resolved = path.resolve(target);
  let current = resolved;
  while (true) {
    assert.ok(!fs.lstatSync(current).isSymbolicLink(), 'REPARSE_PATH');
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  assert.equal(fs.realpathSync.native(resolved).toLowerCase(), resolved.toLowerCase(), 'NON_CANONICAL_PATH');
  return resolved;
}
function atomic(file, value) {
  const pending = `${file}.pending`;
  const fd = fs.openSync(pending, 'wx');
  try { fs.writeFileSync(fd, JSON.stringify(value)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(pending, file);
}
function create(scenario) {
  assert.ok(!process.env.JARVIS_RECOVERY_TEST_ID, 'CHILD_CANNOT_CREATE_PROFILE');
  assert.match(scenario, /^[A-F]$/);
  fs.mkdirSync(BASE, { recursive: true }); canonical(BASE);
  const nonce = crypto.randomBytes(16).toString('hex');
  const id = `jarvis-recovery-${scenario}-${nonce}`;
  const root = path.join(BASE, id); fs.mkdirSync(root);
  for (const name of ['user-data', 'local-data', 'temp', 'control', 'counts']) fs.mkdirSync(path.join(root, name));
  atomic(path.join(root, 'control', 'owner.json'), { version: 1, id, scenario, nonce });
  // Registry is separate from the deletable profile: a random directory alone is not ownership.
  atomic(path.join(BASE, `${id}.owner`), { nonce, id });
  const p = load(id);
  atomic(path.join(p.userData, 'jarvis-k-desktop-settings.json'), {
    firstRunOnboardingVersion: 1, firstRunOnboardingState: 'completed', desktopPetEnabled: false,
    closeButtonBehavior: 'quit', launchAtLoginEnabled: false,
  });
  return p;
}
function load(id) {
  assert.ok(typeof id === 'string' && ID.test(id), 'INVALID_SCENARIO_ID');
  const base = canonical(BASE); const root = canonical(path.join(base, id));
  assert.ok(inside(root, base) && !inside(root, REPO), 'WRONG_ROOT');
  const control = canonical(path.join(root, 'control'));
  const ownerPath = canonical(path.join(control, 'owner.json'));
  const registryPath = canonical(path.join(base, `${id}.owner`));
  const owner = JSON.parse(fs.readFileSync(ownerPath, 'utf8'));
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  assert.deepEqual(Object.keys(owner).sort(), ['id', 'nonce', 'scenario', 'version']);
  assert.deepEqual(Object.keys(registry).sort(), ['id', 'nonce']);
  assert.equal(owner.version, 1); assert.equal(owner.id, id); assert.equal(registry.id, id);
  assert.equal(owner.nonce, ID.exec(id)[2]); assert.equal(owner.nonce, registry.nonce);
  assert.equal(owner.scenario, ID.exec(id)[1]);
  const p = { ...owner, root, control };
  for (const [key, name] of Object.entries({ userData: 'user-data', localData: 'local-data', temp: 'temp', counts: 'counts' })) {
    p[key] = canonical(path.join(root, name)); assert.ok(inside(p[key], root));
  }
  return p;
}
const KEYS = ['preparationFakeProviderCalls', 'recoveryProviderCalls', 'preparationExecutorCalls', 'recoveryExecutorCalls', 'notepadObservedCount', 'recoveryRuns'];
function count(p, key) {
  p = load(p.id); assert.ok(KEYS.includes(key));
  const events = fs.readdirSync(p.counts); assert.ok(events.length < 128, 'COUNT_LIMIT');
  const file = path.join(p.counts, `${crypto.randomBytes(12).toString('hex')}.json`);
  fs.writeFileSync(file, JSON.stringify({ key, value: 1 }), { flag: 'wx' });
}
function counts(p) {
  p = load(p.id); const result = Object.fromEntries(KEYS.map(key => [key, 0]));
  const files = fs.readdirSync(p.counts); assert.ok(files.length <= 128);
  for (const file of files) {
    assert.match(file, /^[a-f0-9]{24}\.json$/);
    const e = JSON.parse(fs.readFileSync(canonical(path.join(p.counts, file)), 'utf8'));
    assert.deepEqual(Object.keys(e).sort(), ['key', 'value']); assert.ok(KEYS.includes(e.key)); assert.equal(e.value, 1);
    result[e.key]++;
  }
  return result;
}
function environment(p, phase, providerMode) {
  p = load(p.id); assert.ok(['preparation', 'recovery'].includes(phase));
  require('./provider-mode.cjs').validate(p.scenario, phase, providerMode);
  const allowed = /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|PROGRAMFILES|PROGRAMFILES\(X86\)|PROGRAMW6432|SYSTEMDRIVE|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE|OS)$/i;
  return { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.test(key))),
    // Standard OS overrides also isolate startup temp cleanup and Electron fallback storage.
    TEMP: p.temp, TMP: p.temp, APPDATA: p.userData, LOCALAPPDATA: p.localData, USERPROFILE: p.root,
    JARVIS_K_USER_DATA_PATH: p.userData, JARVIS_K_LOCAL_DATA_PATH: p.localData,
    JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: '1', JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION: '1',
    JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS: '0',
    // Consumed only by the external --require bootstrap, never by production code.
    JARVIS_RECOVERY_TEST_ID: p.id, JARVIS_RECOVERY_TEST_BASE: BASE, JARVIS_RECOVERY_TEST_PHASE: phase,
    JARVIS_RECOVERY_TEST_PROVIDER_MODE: providerMode,
  };
}
function validateTree(p) {
  p = load(p.id);
  function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = canonical(path.join(dir, e.name)); assert.ok(inside(file, p.root)); if (e.isDirectory()) walk(file);
  } }
  walk(p.root); return p;
}
function validateZero(p) {
  const c = counts(p);
  assert.equal(c.preparationFakeProviderCalls, p.scenario === 'B' ? 1 : 0, 'PREPARATION_COUNT');
  for (const key of ['recoveryProviderCalls', 'preparationExecutorCalls', 'recoveryExecutorCalls', 'notepadObservedCount']) assert.equal(c[key], 0, 'UNEXPECTED_CALL');
  return c;
}
function remove(p, processCheck) {
  p = load(p.id); assert.equal(processCheck(p), true, 'ACTIVE_OR_UNCERTAIN_PROCESS');
  // Reject links anywhere, including links planted in an otherwise owned directory.
  validateTree(p); load(p.id);
  fs.rmSync(p.root, { recursive: true }); fs.unlinkSync(path.join(BASE, `${p.id}.owner`));
}
module.exports = { BASE, REPO, canonical, inside, atomic, create, load, count, counts, environment, validateTree, validateZero, remove };
