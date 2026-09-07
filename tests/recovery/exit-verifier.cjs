// External test infrastructure only. No product exit policy, process termination, or recovery.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { performance } = require('node:perf_hooks');
const P = require('./profile.cjs');
const D = require('./diagnostics.cjs');
const S = require('./exit-summary.cjs');
const DEADLINE_MS = 15000;
const INTERVAL_MS = 200;
const RESULT_TTL_MS = 30 * 60 * 1000;
const EXIT_STAGES = ['launch', 'first_exit', 'second_exit'];
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function fail(stage, summary, classification = 'process_state_unavailable') {
  const e = D.failure('process_exit_state', stage, classification, true, classification === 'assertion_failed' ? false : 'unavailable');
  e.safeProcessSummary = summary; return e;
}
function validIdentity(r) {
  return r && Number.isSafeInteger(r.pid) && r.pid > 0 && Number.isSafeInteger(r.parent) && r.parent >= 0 &&
    typeof r.created === 'string' && Number.isFinite(Date.parse(r.created)) && ['electron.exe','node.exe','other'].includes(r.executable);
}
function validateManifest(m, nonce) {
  if (!m || m.nonce !== nonce || !Array.isArray(m.entries) || !m.entries.length || m.entries.length > 32 ||
    new Set(m.entries.map(e => e.pid)).size !== m.entries.length ||
    m.entries.filter(e => e.role === 'desktop_main').length !== 1) throw Error();
  for (const e of m.entries) {
    if (!validIdentity(e) || !S.ROLES.includes(e.role) || e.nonce !== nonce || e.executable === 'other') throw Error();
    let child = e; const visited = new Set();
    while (child.role !== 'desktop_main') {
      if (visited.has(child.pid)) throw Error(); visited.add(child.pid);
      const parent = m.entries.find(p => p.pid === child.parent);
      if (!parent || Date.parse(parent.created) > Date.parse(child.created)) throw Error(); child = parent;
    }
  }
  return m;
}
// Descendants discovered under a matching parent retain their full identity between samples,
// so parent exit cannot hide an orphan that was positively associated with this launch.
function classify(m, rows, nonce, knownChildren = []) {
  validateManifest(m, nonce);
  if (!Array.isArray(rows) || rows.length > 4096) throw Error();
  const s = S.empty(); const active = new Map(); const claimed = new Set(); const children = [...knownChildren];
  for (const expected of [...m.entries, ...knownChildren]) {
    const candidates = rows.filter(r => r.pid === expected.pid); claimed.add(expected.pid);
    if (!candidates.length) { s.identityCounts.no_matching_process++; continue; }
    const actual = candidates[0];
    if (candidates.length !== 1 || !validIdentity(actual)) { s.identityCounts.identity_unavailable++; continue; }
    if (actual.created !== expected.created || actual.executable !== expected.executable) {
      s.identityCounts.pid_reused_identity_mismatch++; claimed.delete(actual.pid); continue;
    }
    if (actual.parent !== expected.parent) { s.identityCounts.identity_unavailable++; continue; }
    s.roleCounts[expected.role]++;
    s.identityCounts[knownChildren.includes(expected) ? 'child_of_matching_identity_active' : 'matching_identity_active']++;
    active.set(actual.pid, actual);
  }
  for (let depth = 0; depth < 8; depth++) {
    let added = false;
    for (const actual of rows) {
      if (claimed.has(actual.pid) || !active.has(actual.parent)) continue;
      claimed.add(actual.pid);
      if (!validIdentity(actual) || Date.parse(actual.created) < Date.parse(active.get(actual.parent).created)) {
        s.identityCounts.identity_unavailable++; continue;
      }
      if (children.length >= 128) { s.identityCounts.identity_unavailable++; continue; }
      const child = { ...actual, role: 'utility', nonce }; children.push(child);
      active.set(actual.pid, actual); added = true;
      s.roleCounts.utility++; s.identityCounts.child_of_matching_identity_active++;
    }
    if (!added) break;
  }
  if (rows.some(r => !claimed.has(r.pid) && active.has(r.parent))) s.identityCounts.identity_unavailable++;
  s.notepadCount = rows.filter(r => r.notepad === true).length;
  return { summary: s, knownChildren: children };
}
function queryRows({ timeoutMs, signal }) {
  // The inspector subprocess, not any application process, is cancelled on timeout.
  return new Promise((resolve, reject) => {
    const script = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,@{n="created";e={if($_.CreationDate){$_.CreationDate.ToUniversalTime().ToString("o")}else{$null}}},Name | ConvertTo-Json -Compress';
    cp.execFile('powershell.exe', ['-NoProfile','-NonInteractive','-Command',script], {
      windowsHide: true, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
      timeout: Math.max(1, Math.floor(timeoutMs)), signal,
    }, (error, output) => {
      if (error) { reject({ category: signal?.aborted ? 'query_cancelled' : error.killed ? 'query_timeout' : 'query_error' }); return; }
      try {
        const raw = JSON.parse(output); if (!Array.isArray(raw) || raw.length > 4096) throw Error();
        resolve(raw.map(r => ({ pid: r.ProcessId, parent: r.ParentProcessId, created: r.created,
          executable: typeof r.Name !== 'string' || !r.Name.length ? undefined : /^(electron|node)\.exe$/i.test(r.Name) ? r.Name.toLowerCase() : 'other', notepad: /^notepad\.exe$/i.test(r.Name) })));
      } catch { reject({ category: 'query_error' }); }
    });
  });
}
async function sampleUntilStable({ manifest, nonce, stage, launchExitObserved, query = queryRows,
  now = () => performance.now(), pause = sleep, signal, startedAt = now() }) {
  const deadline = startedAt + DEADLINE_MS;
  let s = S.empty(), knownChildren = [];
  try { validateManifest(manifest, nonce); } catch { s.identityCounts.identity_unavailable = 1; throw fail(stage,s); }
  while (true) {
    const remaining = deadline - now();
    if (remaining <= 0 || s.queryAttempts >= 4096) { s.timeoutClassification = 'deadline_exceeded'; throw fail(stage,s,'assertion_failed'); }
    if (signal?.aborted) { s.timeoutClassification = 'query_cancelled'; throw fail(stage,s); }
    const controller = new AbortController(); let timer; const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    let rows;
    s.queryAttempts++;
    try {
      rows = await Promise.race([
        query({ timeoutMs: remaining, signal: controller.signal }),
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject({ category: 'query_timeout' }); }, Math.max(1,Math.floor(remaining))); }),
        new Promise((_, reject) => { controller.signal.addEventListener('abort', () => reject({ category: signal?.aborted ? 'query_cancelled' : 'query_timeout' }), { once: true }); }),
      ]);
    } catch (error) {
      s.timeoutClassification = ['query_timeout','query_error','query_cancelled'].includes(error?.category) ? error.category : 'query_error';
      throw fail(stage,s);
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
    if (now() >= deadline) { s.timeoutClassification = 'deadline_exceeded'; throw fail(stage,s,'assertion_failed'); }
    let observation;
    try { observation = classify(manifest, rows, nonce, knownChildren); }
    catch { s.identityCounts.identity_unavailable++; throw fail(stage,s); }
    knownChildren = observation.knownChildren;
    const previousStable = s.stableSampleCount, attempts = s.queryAttempts;
    s = observation.summary; s.queryAttempts = attempts;
    try { s.launchExitObserved = launchExitObserved() === true; } catch { s.identityCounts.identity_unavailable++; throw fail(stage,s); }
    if (s.identityCounts.identity_unavailable) throw fail(stage,s);
    if (s.notepadCount) throw fail(stage,s,'assertion_failed');
    const active = Object.values(s.roleCounts).some(n => n > 0);
    s.stableSampleCount = !active && s.launchExitObserved ? previousStable + 1 : 0;
    if (s.stableSampleCount === 3) return s;
    const nextSampleAt = now() + INTERVAL_MS;
    // Timers may wake early; monotonic elapsed time, not one timer callback, gates sampling.
    while (now() < nextSampleAt && now() < deadline) {
      await pause(Math.min(nextSampleAt-now(), Math.max(0,deadline-now())));
    }
  }
}
function readJson(file) {
  if (fs.existsSync(file + '.pending') || fs.statSync(P.canonical(file)).size > 32768) throw Error();
  return JSON.parse(fs.readFileSync(file,'utf8'));
}
function manifestFor(p) { return validateManifest(readJson(path.join(p.control,'processes.json')), p.nonce); }
function launchFor(p) {
  const l = readJson(path.join(p.control,'exit-launch.json'));
  if (!S.exact(l,['schemaVersion','scenario','owner','generation','stage']) || l.schemaVersion !== 1 ||
    l.scenario !== p.scenario || l.owner !== p.nonce || !/^[a-f0-9]{32}$/.test(l.generation) || !EXIT_STAGES.includes(l.stage)) throw Error();
  return l;
}
function neverLaunched(p) {
  p = P.load(p.id);
  return ['ever-launched','launch.lock','processes.json','exit-launch.json'].every(n => !fs.existsSync(path.join(p.control,n)));
}
function validateStable(r) {
  const extra = ['schemaVersion','verdict','stage','launchLock'];
  if (!S.exact(r,[...S.keys,...extra]) || r.schemaVersion !== 1 || r.verdict !== 'PASS' || !EXIT_STAGES.includes(r.stage) ||
    r.launchLock !== 'release_authorized') throw Error();
  const s = Object.fromEntries(S.keys.map(k => [k,r[k]]));
  if (!S.valid(s) || !s.launchExitObserved || s.stableSampleCount !== 3 || s.timeoutClassification !== 'none' || s.notepadCount !== 0 ||
    Object.values(s.roleCounts).some(Boolean) || s.identityCounts.identity_unavailable || s.identityCounts.matching_identity_active || s.identityCounts.child_of_matching_identity_active) throw Error();
  return r;
}
function filesFor(p,l) { const base = path.join(p.control,`stable-exit-${l.generation}`); return { result: base+'.json', binding: base+'.binding' }; }
function publishImmutable(file,value) {
  const pending = file+'.pending'; const fd = fs.openSync(pending,'wx');
  try { fs.writeFileSync(fd,JSON.stringify(value)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  // Exclusive atomic publication: unlike rename, link cannot replace an existing result.
  fs.linkSync(pending,file); fs.unlinkSync(pending);
}
function freeze(r) { Object.freeze(r.roleCounts); Object.freeze(r.identityCounts); return Object.freeze(r); }
function consume(p, stage, { wallNow = Date.now } = {}) {
  try {
    p = P.load(p.id); const l = launchFor(p), m = manifestFor(p), files = filesFor(p,l);
    if (stage !== l.stage || fs.existsSync(path.join(p.control,'launch.lock'))) throw Error();
    const r = validateStable(readJson(files.result)), b = readJson(files.binding);
    if (!S.exact(b,['schemaVersion','owner','scenario','generation','stage','manifestDigest','resultDigest','issuedAt']) ||
      b.schemaVersion !== 1 || b.owner !== p.nonce || b.scenario !== p.scenario || b.generation !== l.generation || b.stage !== stage || r.stage !== stage ||
      b.manifestDigest !== digest(JSON.stringify(m)) || b.resultDigest !== digest(JSON.stringify(r)) ||
      !Number.isSafeInteger(b.issuedAt) || wallNow() < b.issuedAt || wallNow()-b.issuedAt > RESULT_TTL_MS) throw Error();
    return freeze(r);
  } catch { const s = S.empty(); s.identityCounts.identity_unavailable = 1; throw fail(stage,s); }
}
function cleanupGuard(p) {
  try {
    p = P.load(p.id);
    if (neverLaunched(p)) return true;
    const l = launchFor(p); consume(p,l.stage); return true;
  } catch (error) {
    if (error instanceof D.SafeFailure) throw error;
    const s = S.empty(); s.identityCounts.identity_unavailable = 1; throw fail('cleanup',s);
  }
}
function beginLaunch(p, stage) {
  try {
    p = P.load(p.id); if (!EXIT_STAGES.includes(stage) || !cleanupGuard(p)) throw Error();
    const l = { schemaVersion: 1, scenario: p.scenario, owner: p.nonce, generation: crypto.randomBytes(16).toString('hex'), stage };
    P.atomic(path.join(p.control,'exit-launch.json'),l); return l;
  } catch { const s = S.empty(); s.identityCounts.identity_unavailable = 1; throw fail(stage,s); }
}
async function verify(p, stage, options) {
  const now = options?.now || (() => performance.now()); const startedAt = now();
  let s = S.empty();
  try {
    p = P.load(p.id); const l = launchFor(p), m = manifestFor(p), lock = path.join(p.control,'launch.lock');
    if (l.stage !== stage || fs.readFileSync(P.canonical(lock),'utf8') !== p.nonce) throw Error();
    s = await sampleUntilStable({ ...options, now, startedAt, manifest: m, nonce: p.nonce, stage });
    // Recheck immutable ownership/launch facts before publishing, without another process query.
    if (JSON.stringify(launchFor(p)) !== JSON.stringify(l) || JSON.stringify(manifestFor(p)) !== JSON.stringify(m) ||
      fs.readFileSync(P.canonical(lock),'utf8') !== p.nonce) throw Error();
    if (now()-startedAt >= DEADLINE_MS) { s.timeoutClassification = 'deadline_exceeded'; throw fail(stage,s,'assertion_failed'); }
    const r = validateStable({ schemaVersion: 1, verdict: 'PASS', stage, ...s, launchLock: 'release_authorized' });
    const files = filesFor(p,l);
    if (fs.existsSync(files.result) || fs.existsSync(files.binding)) throw Error();
    publishImmutable(files.result,r);
    // Restricted ownership receipt is not a diagnostic, counter, or acceptance artifact.
    publishImmutable(files.binding,{ schemaVersion: 1, owner: p.nonce, scenario: p.scenario, generation: l.generation, stage,
      manifestDigest: digest(JSON.stringify(m)), resultDigest: digest(JSON.stringify(r)), issuedAt: Date.now() });
    // Publication must not authorize lock release if its I/O consumed the remaining budget.
    if (now()-startedAt >= DEADLINE_MS) { s.timeoutClassification = 'deadline_exceeded'; throw fail(stage,s,'assertion_failed'); }
    fs.unlinkSync(lock);
    return consume(p,stage);
  } catch (error) {
    if (error instanceof D.SafeFailure) throw error;
    throw fail(stage,s);
  }
}
module.exports = { DEADLINE_MS, INTERVAL_MS, RESULT_TTL_MS, classify, validateManifest, queryRows, sampleUntilStable,
  beginLaunch, verify, consume, cleanupGuard, neverLaunched, validateStable, publishImmutable };
