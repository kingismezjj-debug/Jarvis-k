const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const P = require('./profile.cjs');
// No termination API is provided by this module or the CLI.
function rows() {
  assert.equal(process.platform, 'win32', 'WINDOWS_ONLY');
  const script = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,@{n="created";e={$_.CreationDate.ToUniversalTime().ToString("o")}},Name | ConvertTo-Json -Compress';
  const output = cp.execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(output).map(r => ({ pid: r.ProcessId, parent: r.ParentProcessId, created: r.created,
    executable: /^(electron|node)\.exe$/i.test(r.Name) ? r.Name.toLowerCase() : 'other', notepad: /^notepad\.exe$/i.test(r.Name) }));
}
function noNotepad(p, current = rows()) {
  if (current.some(r => r.notepad)) { P.count(p, 'notepadObservedCount'); throw new Error('NOTEPAD_PRESENT'); }
}
function verify(expected, actual, nonce) {
  assert.equal(expected.nonce, nonce, 'NONCE_MISMATCH');
  assert.ok(actual, 'PROCESS_MISSING');
  for (const field of ['pid', 'parent', 'created', 'executable']) assert.equal(expected[field], actual[field], 'PROCESS_IDENTITY_MISMATCH');
  assert.ok(expected.pid > 0 && expected.created && ['electron.exe', 'node.exe'].includes(expected.executable));
  return true;
}
function capture(p, mainPid, roles, current = rows()) {
  p = P.load(p.id); noNotepad(p, current);
  const main = current.find(r => r.pid === mainPid); assert.ok(main, 'MAIN_MISSING');
  const selected = new Set([mainPid]);
  for (let i = 0; i < 8; i++) for (const r of current) if (selected.has(r.parent)) selected.add(r.pid);
  const entries = current.filter(r => selected.has(r.pid)).map(r => ({ pid: r.pid, parent: r.parent, created: r.created,
    executable: r.executable, role: r.pid === mainPid ? 'desktop_main' : roles[r.pid] || 'utility', nonce: p.nonce }));
  assert.ok(entries.length <= 32 && entries.some(r => r.role === 'core_host') && entries.some(r => r.role === 'renderer'));
  for (const e of entries) { assert.notEqual(e.executable, 'other'); verify(e, current.find(r => r.pid === e.pid), p.nonce); }
  const control = { nonce: p.nonce, entries };
  P.atomic(path.join(p.control, 'processes.json'), control);
  return control;
}
function attestNonce(p, entries) {
  p = P.load(p.id);
  const targets = entries.filter(e => e.role === 'desktop_main' || e.role === 'core_host');
  assert.equal(targets.length, 2); for (const e of targets) assert.ok(Number.isInteger(e.pid) && e.pid > 0);
  // Query command lines only for the already captured two test processes; return a
  // boolean attestation, never command lines or environment values.
  const script = `$ids=@(${targets.map(e => e.pid).join(',')}); & { foreach($id in $ids){$r=Get-CimInstance Win32_Process -Filter "ProcessId=$id"; [pscustomobject]@{id=$id;matches=($null -ne $r -and $r.CommandLine -like '*--jarvis-recovery-nonce=${p.nonce}*')}} } | ConvertTo-Json -Compress`;
  const raw = cp.execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, encoding: 'utf8' });
  const matches = JSON.parse(raw); assert.ok(Array.isArray(matches) && matches.length === 2 && matches.every(r => r.matches === true), 'LIVE_NONCE_MISMATCH');
}
function resolve(p, current = rows(), nonceCheck = attestNonce) {
  p = P.load(p.id); noNotepad(p, current);
  const manifest = JSON.parse(fs.readFileSync(P.canonical(path.join(p.control, 'processes.json')), 'utf8'));
  assert.equal(manifest.nonce, p.nonce);
  assert.ok(manifest.entries.length > 0 && manifest.entries.length <= 32);
  const main = manifest.entries.find(e => e.role === 'desktop_main'); assert.ok(main);
  for (const e of manifest.entries) {
    verify(e, current.find(r => r.pid === e.pid), p.nonce);
    if (e !== main) assert.ok(manifest.entries.some(parent => parent.pid === e.parent), 'PARENT_OUTSIDE_INSTANCE');
  }
  // Newly appeared descendants require a fresh capture; never silently extend kill targets.
  assert.ok(!current.some(r => manifest.entries.some(e => e.pid === r.parent) && !manifest.entries.some(e => e.pid === r.pid)), 'UNRECORDED_CHILD');
  nonceCheck(p, manifest.entries);
  return manifest.entries;
}
function inactive(p, current = rows()) {
  p = P.load(p.id); noNotepad(p, current);
  const lock = path.join(p.control, 'launch.lock');
  if (fs.existsSync(lock)) return false;
  const file = path.join(p.control, 'processes.json');
  if (!fs.existsSync(file)) return !fs.existsSync(path.join(p.control, 'ever-launched'));
  const m = JSON.parse(fs.readFileSync(P.canonical(file), 'utf8'));
  if (m.nonce !== p.nonce || !Array.isArray(m.entries) || !m.entries.length) return false;
  // PID reuse is uncertainty, not permission to remove or terminate.
  return m.entries.every(e => e.nonce === p.nonce && !current.some(r => r.pid === e.pid || r.parent === e.pid));
}
module.exports = { rows, noNotepad, verify, capture, resolve, inactive, attestNonce };
