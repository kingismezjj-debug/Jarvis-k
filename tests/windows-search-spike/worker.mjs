// TEST ONLY. Trusted fixed worker, never imported by product packages.
// The parent supplies only a newly-created synthetic fixture; no user scope source exists.
import { opendir, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
const B = Object.freeze({ results: 20, entries: 2000, directories: 256, depth: 4, ms: 3000, bytes: 16384 });
let cancelled = false, release;
process.on('message', message => {
  if (message?.kind === 'cancel') { cancelled = true; release?.(); }
  if (message?.kind === 'continue') release?.();
});
const send = value => new Promise(resolve => {
  if (!process.connected) return resolve();
  process.send(value, () => resolve());
});
const fault = reason => { throw { safeReason: reason }; };
let counts = { scannedEntries: 0, visitedDirectories: 0, openDirectories: 0 };
let deadline, probe;
function check() {
  if (cancelled) fault('cancelled');
  if (Date.now() >= deadline) fault('timed_out');
}
async function checkpoint(at) {
  if (!(Array.isArray(probe) ? probe.includes(at) : probe === at)) return;
  await new Promise(resolve => { release = resolve; void send({ kind: 'checkpoint', category: at, counts: { ...counts } }); });
  release = undefined;
  check();
}
function inside(base, candidate) {
  const rel = path.relative(base, candidate);
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`));
}
async function identity(candidate) {
  const value = await lstat(candidate, { bigint: true });
  if (value.isSymbolicLink()) fault('reparse_rejected');
  if (!value.isDirectory()) fault('root_unavailable');
  if (value.ino === 0n) fault('identity_unavailable');
  return { dev: String(value.dev), ino: String(value.ino), canonical: await realpath(candidate) };
}
function equal(a, b) { return a.dev === b.dev && a.ino === b.ino && a.canonical === b.canonical; }
const safeName = name => name.length > 0 && name.length <= 255 &&
  !/[\\/:\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(name) && name !== '.' && name !== '..';
async function search(input) {
  const base = path.resolve(input.fixtureBase), root = path.resolve(input.root);
  // Reject before any filesystem call; mapped drives/system roots cannot acquire a fixture grant.
  if (/^(?:\\\\|\/\/)/u.test(input.root) || root === path.parse(root).root) fault('scope_rejected');
  if (!inside(base, root) || root === base) fault('scope_rejected');
  await checkpoint('before_validation');
  const initial = await identity(root);
  // Inspect ancestors within the newly created fixture, not system/user directories.
  for (let ancestor = path.dirname(root); inside(base, ancestor); ancestor = path.dirname(ancestor)) {
    await identity(ancestor);
    if (ancestor === base) break;
  }
  if (!inside(base, initial.canonical)) fault('identity_unavailable');
  await checkpoint('after_root_check');
  const matches = [];
  let truncated = false;
  const visited = new Set();
  async function verify(candidate, expected) {
    check();
    if (!equal(initial, await identity(root)) || !equal(expected, await identity(candidate))) fault('result_not_verified');
  }
  async function visit(directory, relative, depth) {
    check();
    if (counts.visitedDirectories >= B.directories) fault('search_limit_reached');
    const before = await identity(directory);
    if (!inside(initial.canonical, before.canonical)) fault('result_not_verified');
    const key = before.dev + ':' + before.ino;
    if (visited.has(key)) fault('result_not_verified');
    visited.add(key);
    await checkpoint('before_open');
    let dir;
    try {
      dir = await opendir(directory, { bufferSize: 1 });
      counts.openDirectories++; counts.visitedDirectories++;
      await checkpoint("opened_before_verify");
      // Experiment intentionally keeps path/handle TOCTOU observable; this is not a security proof.
      await verify(directory, before);
      await checkpoint('after_open');
      if (probe === 'uncooperative') { await send({ kind: 'checkpoint', category: 'uncooperative', counts: { ...counts } }); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0); }
      while (true) {
        check();
        if (counts.scannedEntries >= B.entries) fault('search_limit_reached');
        const entry = await dir.read();
        if (!entry) break;
        counts.scannedEntries++;
        await checkpoint('during_enumeration');
        await verify(directory, before);
        const rel = relative ? `${relative}/${entry.name}` : entry.name;
        if (!safeName(entry.name) || rel.length > 512) { truncated = true; continue; }
        const candidate = path.join(directory, entry.name);
        const item = await lstat(candidate, { bigint: true });
        if (item.isSymbolicLink()) continue;
        if (!item.isFile() && !item.isDirectory()) continue;
        const canonical = await realpath(candidate);
        if (!inside(initial.canonical, canonical)) fault('result_not_verified');
        if (entry.name.normalize('NFC').toLowerCase().includes(input.query.normalize('NFC').toLowerCase())) {
          if (matches.length >= B.results) { truncated = true; return; }
          const candidateResult = { name: entry.name, relativePath: rel, entryType: item.isDirectory() ? 'directory' : 'file' };
          if (Buffer.byteLength(JSON.stringify({ matches: [...matches, candidateResult], truncated: true, counts })) > B.bytes - 256) { truncated = true; return; }
          matches.push(candidateResult);
        }
        if (item.isDirectory()) {
          if (depth >= B.depth) truncated = true;
          else await visit(candidate, rel, depth + 1);
        }
        if (truncated && matches.length >= B.results) return;
      }
      await verify(directory, before);
    } finally {
      if (dir) { await dir.close(); counts.openDirectories--; }
    }
  }
  await visit(root, '', 0);
  await verify(root, initial);
  matches.sort((a, b) => a.relativePath < b.relativePath ? -1 : a.relativePath > b.relativePath ? 1 : 0);
  await checkpoint('after_result');
  check();
  return { kind: 'result', category: 'completed', matches, truncated, counts };
}
process.once('message', async input => {
  if (input?.kind !== 'start') { process.exitCode = 1; process.disconnect(); return; }
  await send({ kind: "ready", category: process.arch === "arm64" ? "arch_arm64" : process.arch === "x64" ? "arch_x64" : "arch_other" });
  deadline = Date.now() + B.ms; probe = input.probe;
  let output;
  try {
    if (probe === 'abnormal_exit') process.exit(7);
    output = await search(input);
  } catch (error) {
    const reasons = new Set(['cancelled', 'timed_out', 'scope_rejected', 'root_unavailable', 'reparse_rejected', 'identity_unavailable', 'result_not_verified', 'search_limit_reached']);
    const category = reasons.has(error?.safeReason) ? error.safeReason : error?.code === 'EACCES' || error?.code === 'EPERM' ? 'access_denied' : error?.code === 'ENOENT' || error?.code === 'ENOTDIR' ? 'root_unavailable' : 'internal_unavailable';
    output = { kind: 'result', category, counts };
  }
  if (cancelled) output = { kind: 'result', category: 'cancelled', counts };
  await send(output);
  process.disconnect();
});
