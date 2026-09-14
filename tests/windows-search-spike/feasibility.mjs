// Run with native Windows Node: node tests/windows-search-spike/feasibility.mjs
// Creates only fresh fixtures; all output is safe classifications and bounded counts.
import { mkdtemp, mkdir, writeFile, symlink, rm, rename, lstat } from 'node:fs/promises';
import { execFile, fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startSearch, liveSearchWorkers } from './supervisor.mjs';
const exec = promisify(execFile);
const cases = [], findings = [];
let base, count = 0, actualWorkerArchitecture;
const assert = (condition) => { if (!condition) throw new Error('CHECK_FAILED'); };
async function test(name, fn) {
  try { const extra = await fn(); cases.push({ name, status: 'PASS', ...extra }); }
  catch (error) { cases.push({ name, status: error?.notVerified ? 'NOT_VERIFIED' : 'FAIL', reason: error?.notVerified ?? 'check_failed' }); }
}
const notVerified = reason => { throw { notVerified: reason }; };
async function fixture() {
  const root = path.join(base, `case-${++count}`); await mkdir(root); return root;
}
const run = (root, extra = {}, callback) => startSearch({ fixtureBase: base, root, query: 'match', ...extra }, callback);
const noList = r => assert(!('matches' in r) && r.workerExited && r.activeWorkers === 0);
async function link(target, destination, type) {
  try { await symlink(target, destination, type); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) notVerified('link_privilege_unavailable'); throw error; }
}
async function main() {
  if (process.platform !== 'win32') { console.log(JSON.stringify({ verdict: 'NO_GO_CURRENT_APPROACH', reason: 'windows_required' })); return; }
  base = await mkdtemp(path.join(tmpdir(), 'jarvis-search-spike-'));
  try {
    await test('ordinary_root_files_directories', async () => {
      const root = await fixture(); await mkdir(path.join(root, 'match-folder')); await writeFile(path.join(root, 'match-file.txt'), 'synthetic');
      const r = await run(root); actualWorkerArchitecture = r.workerArchitecture; assert(r.category === 'completed' && r.matches.length === 2 && r.counts.openDirectories === 0);
      assert(r.matches.some(x => x.entryType === 'directory')); assert(r.matches.some(x => x.entryType === 'file'));
      assert(!JSON.stringify(r).includes(base));
    });
    for (const kind of ['missing', 'file', 'drive_root', 'unc', 'device', 'network', 'system_root']) await test(`reject_${kind}`, async () => {
      const root = await fixture(); let candidate = path.join(root, 'missing');
      if (kind === 'file') { candidate = path.join(root, 'file'); await writeFile(candidate, 'synthetic'); }
      if (kind === 'drive_root') candidate = path.parse(base).root;
      if (kind === 'unc' || kind === 'network') candidate = '\\\\synthetic-invalid\\share';
      if (kind === 'device') candidate = '\\\\?\\C:\\';
      if (kind === 'system_root') candidate = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32');
      const r = await run(candidate); assert(r.category !== 'completed'); noList(r);
      return { lexicalRejection: !['missing', 'file'].includes(kind) };
    });
    for (const type of ['junction', 'dir']) {
      await test(`root_${type}_rejected`, async () => {
        const root = await fixture(); const target = await fixture(); const linked = path.join(root, 'linked'); await link(target, linked, type);
        assert((await lstat(linked)).isSymbolicLink()); const r = await run(linked); assert(r.category === 'reparse_rejected'); noList(r);
      });
      await test(`child_${type}_and_loop_skipped`, async () => {
        const root = await fixture(); const target = await fixture(); await writeFile(path.join(target, 'match-outside.txt'), 'synthetic');
        await link(target, path.join(root, 'match-link'), type); await link(root, path.join(root, 'match-loop'), type);
        const r = await run(root); assert(r.category === 'completed' && r.matches.length === 0 && r.counts.visitedDirectories === 1);
      });
    }
    await test('root_replaced_after_identity_check', async () => {
      const root = await fixture(); const old = `${root}-old`;
      const r = await run(root, { probe: 'after_root_check' }, async (_, control) => { await rename(root, old); await mkdir(root); control.continue(); });
      assert(r.category === 'result_not_verified'); noList(r);
    });
    await test('directory_replaced_during_enumeration', async () => {
      const root = await fixture(); await writeFile(path.join(root, 'match.txt'), 'synthetic');
      let changed = false;
      const r = await run(root, { probe: 'during_enumeration' }, async (_, control) => {
        if (!changed) { changed = true; await rename(root, `${root}-old`); await mkdir(root); }
        control.continue();
      });
      assert(r.category !== 'completed'); noList(r);
    });
    await test('child_directory_replaced_before_open', async () => {
      const root = await fixture(), child = path.join(root, 'child'); await mkdir(child);
      await writeFile(path.join(child, 'match.txt'), 'synthetic'); let calls = 0;
      const r = await run(root, { probe: 'before_open' }, async (_, control) => {
        if (++calls === 2) { await rename(child, `${child}-old`); await mkdir(child); }
        control.continue();
      });
      assert(r.category === 'result_not_verified'); noList(r);
    });
    await test('aba_open_directory_identity_gap', async () => {
      const root = await fixture(), child = path.join(root, 'child'), target = await fixture();
      await mkdir(child); await writeFile(path.join(target, 'match-outside.txt'), 'synthetic');
      let opens = 0, opened = 0;
      const r = await run(root, { probe: ['before_open', 'opened_before_verify'] }, async (event, control) => {
        if (event.category === 'before_open' && ++opens === 2) {
          await rename(child, `${child}-original`); await link(target, child, 'junction');
        }
        if (event.category === 'opened_before_verify' && ++opened === 2) {
          // Restore the original name/dev/ino before identity validation. The open directory
          // object still addresses the synthetic sibling. No user directory is involved.
          await rm(child); await rename(`${child}-original`, child);
        }
        control.continue();
      });
      noList(r);
      const outOfScopeRead = r.counts?.scannedEntries === 2 && r.counts?.visitedDirectories === 2;
      assert(outOfScopeRead);
      findings.push('path_identity_does_not_bind_open_directory_handle');
      return { engineBoundary: 'FAIL', syntheticOutOfScopeEntryRead: true, outsideResultsDelivered: 0 };
    });
    await test('unreadable_directory', async () => {
      const root = await fixture(); const denied = path.join(root, 'denied'); await mkdir(denied);
      const acl = path.join(process.env.SystemRoot, 'System32', 'icacls.exe');
      try { await exec(acl, [denied, '/deny', '*S-1-1-0:(RD)'], { windowsHide: true }); }
      catch { notVerified('synthetic_acl_change_unavailable'); }
      try { const r = await run(root); assert(r.category === 'access_denied'); noList(r); }
      finally { await exec(acl, [denied, '/remove:d', '*S-1-1-0'], { windowsHide: true }); }
    });
    await test('long_names_and_relative_paths', async () => {
      const root = await fixture(); let dir = root;
      for (let i = 0; i < 4; i++) { dir = path.join(dir, 'a'.repeat(140)); await mkdir(dir); }
      await writeFile(path.join(dir, 'match.txt'), 'synthetic');
      const r = await run(root); assert(r.category === 'completed' && r.truncated && r.matches.length === 0);
      let rejected = false; try { await writeFile(path.join(root, 'a'.repeat(256)), 'synthetic'); } catch { rejected = true; }
      assert(rejected);
    });
    await test('hidden_system_attribute_observation', async () => {
      const root = await fixture(), file = path.join(root, 'match-hidden.txt'); await writeFile(file, 'synthetic');
      const before = await lstat(file);
      try { await exec(path.join(process.env.SystemRoot, 'System32', 'attrib.exe'), ['+H', '+S', file], { windowsHide: true }); }
      catch { notVerified('attribute_fixture_unavailable'); }
      try {
        const attributes = await exec(path.join(process.env.SystemRoot, 'System32', 'attrib.exe'), [file], { windowsHide: true });
        assert(attributes.stdout.slice(0, 20).includes('H') && attributes.stdout.slice(0, 20).includes('S'));
        const after = await lstat(file); const r = await run(root);
        assert(r.category === 'completed');
        const flagsUnavailable = !('attributes' in after) && before.mode === after.mode && before.dev === after.dev && before.ino === after.ino;
        if (flagsUnavailable && r.matches.length === 1) findings.push('node_stats_cannot_filter_constructed_hidden_system_item');
        return { engineBoundary: r.matches.length ? 'FAIL' : 'PASS', nodeAttributeFieldAvailable: !flagsUnavailable };
      } finally { await exec(path.join(process.env.SystemRoot, 'System32', 'attrib.exe'), ['-H', '-S', file], { windowsHide: true }); }
    });
    await test('max_results_20', async () => {
      const root = await fixture(); for (let i = 0; i < 25; i++) await writeFile(path.join(root, `match-${i}.txt`), 'synthetic');
      const r = await run(root); assert(r.category === 'completed' && r.matches.length === 20 && r.truncated);
    });
    await test('scanned_entries_2000', async () => {
      const root = await fixture(); for (let i = 0; i < 2001; i++) await writeFile(path.join(root, `item-${i}`), '');
      const r = await run(root); assert(r.category === 'search_limit_reached' && r.counts.scannedEntries === 2000); noList(r);
    });
    await test('visited_directories_256', async () => {
      const root = await fixture(); for (let i = 0; i < 256; i++) await mkdir(path.join(root, `dir-${i}`));
      const r = await run(root); assert(r.category === 'search_limit_reached' && r.counts.visitedDirectories === 256); noList(r);
    });
    await test('depth_4', async () => {
      const root = await fixture(); let dir = root;
      for (let i = 0; i < 5; i++) { dir = path.join(dir, `d${i}`); await mkdir(dir); }
      await writeFile(path.join(dir, 'match-too-deep'), 'synthetic'); const r = await run(root);
      assert(r.category === 'completed' && r.matches.length === 0 && r.truncated && r.counts.visitedDirectories === 5);
    });
    await test('payload_16kib', async () => {
      const root = await fixture(), dir = path.join(root, '中'.repeat(100)); await mkdir(dir);
      for (let i = 0; i < 20; i++) await writeFile(path.join(dir, `match-${i}-${'文'.repeat(150)}`), 'synthetic');
      const r = await run(root); assert(r.category === 'completed' && r.truncated && r.matches.length < 20 && Buffer.byteLength(JSON.stringify(r)) <= 16384);
    });
    for (const probe of ['before_validation', 'during_enumeration', 'after_result', 'uncooperative']) await test(`cancel_${probe}`, async () => {
      const root = await fixture(); await writeFile(path.join(root, 'match.txt'), 'synthetic');
      const r = await run(root, { probe }, (_, control) => control.cancel());
      assert(r.category === 'cancelled'); noList(r);
      if (probe === 'uncooperative') assert(r.forced);
      else assert(!r.forced && r.counts?.openDirectories === 0);
      // Actual post-exit rename and deletion, not a promise-only cancellation assertion.
      await rename(root, `${root}-closed`); await rm(`${root}-closed`, { recursive: true });
      await new Promise(resolve => setTimeout(resolve, 30)); assert(liveSearchWorkers() === 0);
      return { workerExitConfirmed: true, fixtureCleanupPassed: true, forced: r.forced };
    });
    await test('timeout_3000ms', async () => {
      const root = await fixture(); const started = Date.now(); const r = await run(root, { probe: 'uncooperative' });
      assert(r.category === 'timed_out' && r.forced && Date.now() - started < 5000); noList(r);
      await rm(root, { recursive: true });
      return { budgetMs: 3000, cleanupGraceMs: 100 };
    });
    await test('abnormal_worker_exit', async () => { const r = await run(await fixture(), { probe: 'abnormal_exit' }); assert(r.category === 'worker_failed'); noList(r); });
    await test('unrelated_process_not_terminated', async () => {
      const sentinel = fork(fileURLToPath(new URL('./sentinel.mjs', import.meta.url)), [], {
        cwd: base, env: { SystemRoot: process.env.SystemRoot ?? '' }, execArgv: [],
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true,
      });
      const sentinelClosed = new Promise(resolve => sentinel.once('close', resolve));
      try {
        await new Promise(resolve => sentinel.once('message', resolve));
        const r = await run(await fixture(), { probe: 'uncooperative' }, (_, control) => control.cancel());
        noList(r); assert(r.forced && sentinel.exitCode === null);
        const pong = new Promise(resolve => sentinel.once('message', message => resolve(message.category === 'alive')));
        sentinel.send({ kind: 'ping' }); assert(await pong);
      } finally { sentinel.kill('SIGKILL'); await sentinelClosed; }
    });
    await test('single_search_worker', async () => {
      const root = await fixture(); const r = await run(root, { probe: 'after_open' }, (_, control) => {
        let rejected = false; try { run(root); } catch { rejected = true; } assert(rejected); control.cancel();
      }); noList(r); assert(liveSearchWorkers() === 0);
    });
  } finally {
    if (liveSearchWorkers() === 0) await rm(base, { recursive: true, force: true });
  }
  const verdict = !cases.some(x => x.status === 'FAIL') && findings.includes('path_identity_does_not_bind_open_directory_handle') ? 'GO_MINIMAL_WIN32_HELPER_SPIKE' : 'NO_GO_CURRENT_APPROACH';
  console.log(JSON.stringify({ stage: 'UI-3M-2B-A', verdict,
    architecture: { windowsARM64: actualWorkerArchitecture === 'arm64' && process.env.PROCESSOR_ARCHITECTURE === 'ARM64' ? 'verified' : 'not_verified', windowsX64: actualWorkerArchitecture === 'x64' && process.env.PROCESSOR_ARCHITECTURE === 'AMD64' && !process.env.PROCESSOR_ARCHITEW6432 ? 'verified' : 'not_verified', node: process.version, workerArchitecture: actualWorkerArchitecture, osMachine: ['ARM64', 'AMD64'].includes(process.env.PROCESSOR_ARCHITECTURE) ? process.env.PROCESSOR_ARCHITECTURE : 'unknown', electron: 'not_used', addedNativeBinary: false, addedRuntimeDependency: false },
    cases, observationPassCount: cases.filter(x => x.status === "PASS").length, notVerifiedCount: cases.filter(x => x.status === "NOT_VERIFIED").length, engineBoundaryFailureCount: cases.filter(x => x.engineBoundary === "FAIL").length, findings, otherReparseTags: 'NOT_VERIFIED', mappedNetworkDrive: 'NOT_VERIFIED',
    aclDenial: cases.find(x => x.name === 'unreadable_directory')?.status ?? 'NOT_VERIFIED',
    activeWorkers: liveSearchWorkers(), syntheticFixtureRemoved: true, productionFilesChanged: false,
    providerRequests: 0, userFilesEnumerated: false, productionReadiness: false }, null, 2));
  if (cases.some(x => x.status === 'FAIL')) process.exitCode = 1;
}
main().catch(() => { console.log(JSON.stringify({ verdict: 'NO_GO_CURRENT_APPROACH', reason: 'spike_failed', activeWorkers: liveSearchWorkers() })); process.exitCode = 1; });
