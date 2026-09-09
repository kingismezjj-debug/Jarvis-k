import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const P = require('../../../tests/recovery/profile.cjs');
const S = require('../../../tests/recovery/state.cjs');
const Process = require('../../../tests/recovery/processes.cjs');
const { provider } = require('../../../tests/recovery/provider.cjs');
const Modes = require('../../../tests/recovery/provider-mode.cjs');
const profiles: any[] = [];
const make = (s: string) => { const p = P.create(s); profiles.push(p); return p; };
afterEach(() => {
  for (const p of profiles.splice(0)) if (fs.existsSync(p.root)) P.remove(p, () => true);
});

describe('isolated recovery harness boundaries', () => {
  it('creates independent owned profiles with USER_DATA LOCAL_DATA TEMP TMP and no inherited provider environment', () => {
    const items = ['A', 'B', 'C', 'D', 'E', 'F'].map(make);
    expect(new Set(items.map(p => p.root)).size).toBe(6);
    for (const p of items) {
      const env = P.environment(p, 'recovery', 'absent');
      for (const key of ['JARVIS_K_USER_DATA_PATH', 'JARVIS_K_LOCAL_DATA_PATH', 'TEMP', 'TMP']) {
        expect(P.inside(P.canonical(env[key]), p.root)).toBe(true);
      }
      expect(Object.keys(env).some(key => /credential|api.key|authorization|node_options/i.test(key))).toBe(false);
      expect(P.load(p.id).nonce).toBe(p.nonce);
    }
  });
  it.each(['', '.', '..', os.tmpdir(), P.BASE, P.REPO, os.homedir(), 'jarvis-recovery-A-not-owned'])('rejects unsafe or unowned scenario %s', value => {
    expect(() => P.load(value)).toThrow();
  });
  it('rejects a mismatched invocation registry and wrong-root cleanup', () => {
    const p = make('A'); const file = path.join(P.BASE, `${p.id}.owner`); const saved = fs.readFileSync(file);
    fs.writeFileSync(file, JSON.stringify({ id: p.id, nonce: 'wrong' }));
    expect(() => P.load(p.id)).toThrow(); expect(() => P.remove(p, () => true)).toThrow();
    fs.writeFileSync(file, saved); expect(() => P.remove({ id: P.BASE }, () => true)).toThrow();
  });
  it('rejects junction/reparse traversal and cleanup through a planted link', () => {
    const p = make('A'); const other = make('C'); const link = path.join(p.temp, 'linked');
    fs.symlinkSync(other.root, link, 'junction');
    try { expect(() => P.canonical(link)).toThrow(); expect(() => P.remove(p, () => true)).toThrow(); }
    finally { fs.unlinkSync(link); }
    expect(fs.existsSync(other.root)).toBe(true);
  });
  it('refuses active and uncertain cleanup, and removes only the owned profile', () => {
    const p = make('A'); const other = make('C');
    expect(() => P.remove(p, () => false)).toThrow(); expect(() => P.remove(p, () => { throw Error('uncertain'); })).toThrow();
    P.remove(p, () => true); expect(fs.existsSync(p.root)).toBe(false); expect(fs.existsSync(other.root)).toBe(true);
  });
  it('checks PID parent creation time executable and nonce, rejecting PID reuse', () => {
    const row = { pid: 123, parent: 10, created: 'synthetic-time', executable: 'electron.exe' };
    const expected = { ...row, nonce: 'synthetic-nonce' };
    expect(Process.verify(expected, row, 'synthetic-nonce')).toBe(true);
    for (const field of ['pid', 'parent', 'created', 'executable']) expect(() => Process.verify(expected, { ...row, [field]: 'wrong' }, expected.nonce)).toThrow();
    expect(() => Process.verify(expected, row, 'wrong')).toThrow(); expect(() => Process.verify(expected, undefined, expected.nonce)).toThrow();
  });
  it('resolves only the captured tree and fails on unrecorded descendants or reused IDs', () => {
    const p = make('A'); const current = [
      { pid: 11, parent: 1, created: 'one', executable: 'electron.exe' },
      { pid: 12, parent: 11, created: 'two', executable: 'node.exe' },
      { pid: 13, parent: 11, created: 'three', executable: 'electron.exe' },
    ];
    Process.capture(p, 11, { 12: 'core_host', 13: 'renderer' }, current);
    expect(Process.resolve(p, current, () => true)).toHaveLength(3);
    expect(() => Process.resolve(p, current, () => { throw Error('LIVE_NONCE_MISMATCH'); })).toThrow();
    expect(Process.inactive(p, current)).toBe(false);
    expect(() => Process.resolve(p, [...current, { pid: 14, parent: 11 }])).toThrow();
    expect(() => Process.resolve(p, current.map(r => ({ ...r, created: 'changed' })))).toThrow();
    expect(Process.inactive(p, [])).toBe(true);
  });
  it('records unexpected Notepad presence and fails closed', () => {
    const p = make('A'); Process.noNotepad(p, []);
    expect(() => Process.noNotepad(p, [{ notepad: true }])).toThrow(); expect(P.counts(p).notepadObservedCount).toBe(1);
  });
  it('fake provider permits exactly one B preparation proposal and has no continuation/recovery fallback', async () => {
    const p = make('B'); const context = { tool: { turnId: 'synthetic-turn', proposalId: 'synthetic-proposal' } };
    Modes.begin(p,'preparation','guarded_fake','offline');
    const fake = provider(p, 'preparation','guarded_fake');
    const proposals = []; for await (const e of fake.startTextTurn({}, context)) proposals.push(e);
    expect(proposals[0].proposal.toolId).toBe('localApp.open'); expect(P.counts(p).preparationFakeProviderCalls).toBe(1);
    await expect(fake.startTextTurn({}, context).next()).rejects.toThrow();
    Modes.begin(p,'recovery','absent','offline');
    expect(()=>provider(p, 'recovery','absent')).toThrow();
    expect(()=>Modes.transport(p,'recovery','absent')).toThrow();
    expect(P.counts(p).recoveryProviderCalls).toBe(0);
  });
  it('counter files contain only bounded enum keys and counts, never request/result/identity data', () => {
    const p = make('A'); P.count(p, 'recoveryRuns');
    expect(() => P.count(p, 'rawPayload')).toThrow();
    const content = fs.readdirSync(p.counts).map((f: string) => fs.readFileSync(path.join(p.counts, f), 'utf8')).join('');
    expect(content).not.toMatch(/prompt|answer|payload|toolId|pid|path|credential|Authorization/i);
    expect(P.validateZero(p).recoveryRuns).toBe(1);
  });
  it.each(['preparation', 'recovery'])('%s executor and network guards count then reject without any real delegate', phase => {
    const p = make('A'); const { rejectCall } = require('../../../tests/recovery/guards.cjs');
    expect(() => rejectCall(p, phase, 'executor', 'spawn')).toThrow('RECOVERY_TEST_FORBIDDEN_CALL');
    expect(() => rejectCall(p, phase, 'provider')).toThrow('RECOVERY_TEST_FORBIDDEN_CALL');
    expect(P.counts(p)[phase === 'preparation' ? 'preparationExecutorCalls' : 'recoveryExecutorCalls']).toBe(1);
    expect(P.counts(p)[phase === 'preparation' ? 'preparationFakeProviderCalls' : 'recoveryProviderCalls']).toBe(1);
    expect(() => P.validateZero(p)).toThrow();
  });
  it('CLI inspection returns only safe classification/counts and rejects raw path input', async () => {
    const { main } = await import('../../../tests/recovery/cli.mjs');
    const p = make('A'); await S.seed(p);
    const result = await main(['inspect', '--scenario', p.id]);
    expect(result).toMatchObject({ schemaVersion: 1, scenario: 'A', stage: 'prepare', verdict: 'PASS' });
    expect(JSON.stringify(result)).not.toMatch(/Authorization|credential|payload|synthetic-final|[A-Z]:\\|"pid"/i);
    await expect(main(['inspect', '--scenario', p.root])).rejects.toThrow();
  });
});

describe('validated synthetic recovery scenes', () => {
  it.each(['A', 'C', 'D', 'E', 'F'])('%s uses existing repositories and repeated recovery is idempotent', async scenario => {
    const p = make(scenario); await S.seed(p); expect(() => P.validateZero(p)).not.toThrow();
    const firstRecovery = await S.recoverOffline(p); const first = await S.inspect(p);
    const secondRecovery = await S.recoverOffline(p); expect(await S.inspect(p)).toEqual(first); expect(secondRecovery).toEqual(firstRecovery);
    expect(first.finalMessageCount).toBe(scenario === 'E' ? 1 : 0);
    expect(first.quarantineCount).toBe(scenario === 'F' ? 1 : 0);
    expect(P.validateZero(p).recoveryRuns).toBe(2);
    if (scenario === 'F') { expect(first.eventCount).toBe(4); expect(first.terminalCount).toBe(1); }
    else if (scenario !== 'E') expect(firstRecovery.notices[0].classification).toBe({ A: 'interrupted_before_execution', C: 'interrupted_unknown_execution_result', D: 'interrupted_after_tool_result' }[scenario]);
  });
  it('B cannot be forged by offline seed; preparation must use the running governed turn', async () => {
    const p = make('B'); await S.seed(p); expect((await S.inspect(p)).eventCount).toBe(0);
    expect(P.counts(p).preparationFakeProviderCalls).toBe(0); await expect(S.seed(p)).rejects.toThrow();
  });
  it('offline helpers refuse a profile reserved by an active launcher', async () => {
    const p = make('A'); const lock = path.join(p.control, 'launch.lock'); fs.writeFileSync(lock, p.nonce);
    await expect(S.seed(p)).rejects.toThrow('REPOSITORY_REQUIRES_CLOSED_PROFILE');
    await expect(S.recoverOffline(p)).rejects.toThrow('REPOSITORY_REQUIRES_CLOSED_PROFILE'); fs.unlinkSync(lock);
  });
  it('normal journal metadata has no prompts raw results reasoning paths or execution arguments', () => {
    for (const scene of ['A', 'C', 'D', 'E']) expect(JSON.stringify(S.history(scene))).not.toMatch(/text|prompt|reasoning|payload|arguments|credential|Authorization|[a-z]:\\|"pid"/i);
  });
});

describe('test-only production exclusion', () => {
  const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  it('production imports cannot reach the harness and no compiled product contains its bootstrap switches', () => {
    const owners = ['apps/desktop', 'apps/core-host', 'apps/ui', ...fs.readdirSync(path.join(P.REPO, 'packages')).map((n: string) => `packages/${n}`)];
    for (const owner of owners) for (const directory of ['src', 'dist']) {
      const root = path.join(P.REPO, owner, directory); if (!fs.existsSync(root)) continue;
      for (const file of files(root).filter(f => /\.[cm]?[jt]sx?$/.test(f))) {
        const source = fs.readFileSync(file, 'utf8'); expect(source.includes('JARVIS_RECOVERY_TEST')).toBe(false);
        expect(source).not.toMatch(/provider-mode\.cjs|provider-runtime\.cjs|crash-gate|crash-controller|crash-observations|crash-timeline|authorize-crash|authorization-input|authorize-input-selftest|terminal-foreground|authorization-(?:window|startup)|window-predicates|pending-monitor|pending-reader|pending-calibration|controller-(?:engine|backend|session|receipt|worker|selftest|fixture)/);
        for (const ref of ts.preProcessFile(source, true, true).importedFiles) {
          expect(ref.fileName).not.toMatch(/(?:^|\/)(?:tests?|recovery)\//);
          if (ref.fileName.startsWith('.')) expect(path.resolve(path.dirname(file), ref.fileName)).not.toContain(`${path.sep}tests${path.sep}`);
        }
      }
    }
  });
  it('build roots and electron-builder file selection explicitly exclude helpers', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(P.REPO, 'package.json'), 'utf8'));
    expect(pkg.build.files).toContain('!tests/**'); expect(pkg.build.files).toContain('!**/test/**');
    expect(pkg.build.extraMetadata.main).toBe('apps/desktop/dist/main.js');
    for (const app of ['desktop', 'core-host']) {
      const config = JSON.parse(fs.readFileSync(path.join(P.REPO, `apps/${app}/tsconfig.json`), 'utf8'));
      expect(config.compilerOptions.rootDir).toBe('src'); expect(config.include).toEqual(['src/**/*.ts']);
    }
    const bootstrap = fs.readFileSync(path.join(P.REPO, 'tests/recovery/bootstrap.cjs'), 'utf8');
    expect(bootstrap).toContain("electron.app.isPackaged, false");
    expect(bootstrap).toContain("cp[name] = () => forbidden('executor', name)");
    expect(bootstrap).toContain("globalThis.fetch = () => forbidden('provider')");
    expect(bootstrap).not.toMatch(/Bearer|https:\/\/|apiKey/);
  });
});
