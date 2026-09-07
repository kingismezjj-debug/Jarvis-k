import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { _electron } from 'playwright';
import P from './profile.cjs';
import processes from './processes.cjs';
import state from './state.cjs';

export async function launch(p, phase) {
  p = P.validateTree(p); assert.ok(processes.inactive(p), 'PROFILE_BUSY');
  assert.ok(fs.existsSync(path.join(p.control, 'seeded')));
  if (phase === 'preparation') { assert.equal(p.scenario, 'B'); assert.equal(P.counts(p).preparationFakeProviderCalls, 0); }
  else if (p.scenario === 'B') assert.equal(P.counts(p).preparationFakeProviderCalls, 1);
  for (const name of ['core-attestation.json', 'recovery-ready.json']) {
    const file = path.join(p.control, name); if (fs.existsSync(file)) fs.unlinkSync(P.canonical(file));
  }
  fs.writeFileSync(path.join(p.control, 'launch.lock'), p.nonce, { flag: 'wx' });
  fs.writeFileSync(path.join(p.control, 'ever-launched'), 'yes');
  let app;
  let stage = 'electron_start';
  try {
    app = await _electron.launch({ cwd: P.REPO, args: ['tests/recovery/bootstrap.cjs', `--jarvis-recovery-nonce=${p.nonce}`], env: P.environment(p, phase), timeout: 30000 });
    stage = 'first_window'; const page = await app.firstWindow(); page.setDefaultTimeout(15000);
    stage = 'ui_ready';
    await page.getByTestId('jarvis-app').waitFor();
    stage = 'snapshot_ready';
    await page.waitForFunction(async () => {
      const r = await window.jarvis.getSnapshot(); return r.ok && (r.data.health === 'ready' || r.data.assistantRecoveryBlocked === true);
    });
    stage = 'durable_ready';
    // Wait for the durable startup barrier, including the intentionally blocked F state.
    for (let n = 0; !fs.existsSync(path.join(p.control, 'recovery-ready.json')); n++) {
      assert.ok(n < 200, 'RECOVERY_TIMEOUT'); await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (phase === 'preparation') {
      stage = 'native_approval';
      await page.getByTestId('assistant-native-approval').waitFor();
      assert.equal(await page.getByTestId('assistant-tool-allow').isEnabled(), true);
      assert.equal(await page.getByTestId('assistant-tool-deny').isEnabled(), true);
      const native = await page.evaluate(async () => {
        const snapshot = (await window.jarvis.getSnapshot()).data;
        return { proposals: snapshot.assistantTurn?.proposals?.length,
          awaitingApproval: snapshot.assistantTurn?.status === 'awaiting_approval',
          pendingTasks: snapshot.tasks.filter(task => task.state === 'awaiting_confirmation').length };
      });
      assert.deepEqual(native, { proposals: 1, awaitingApproval: true, pendingTasks: 1 });
    } else {
      stage = 'recovery_ui';
      await page.waitForFunction(async () => {
        const r = await window.jarvis.getSnapshot(); return r.ok && (r.data.assistantRecoveries?.length > 0 || r.data.assistantRecoveryBlocked || r.data.health === 'ready');
      });
      assert.equal(await page.getByTestId('assistant-native-approval').count(), 0);
      assert.equal(await page.getByTestId('assistant-streaming-turn').count(), 0);
      const expected = ['A', 'B', 'C', 'D'].includes(p.scenario) ? 1 : 0;
      await page.waitForFunction(expected => document.querySelectorAll('[data-testid="assistant-recovery-notice"]').length === expected, expected);
      // Current product blocks submission during recovery, but keeps draft editing
      // available. Do not turn this into a false claim that the input is disabled.
      await page.waitForFunction(blocked => document.querySelector('[data-testid="send-command"]')?.disabled === blocked, p.scenario === 'F');
      assert.equal(await page.getByTestId('command-input').isEditable(), true);
      if (p.scenario === 'C') {
        const notice = await page.getByTestId('assistant-recovery-notice').innerText();
        assert.match(notice, /执行结果未知|execution result is unknown/i);
        assert.doesNotMatch(notice, /启动成功|执行成功|执行失败/);
      }
      if (p.scenario === 'E') assert.equal(await page.getByText('Synthetic completed response.', { exact: true }).count(), 1);
    }
    const core = JSON.parse(fs.readFileSync(P.canonical(path.join(p.control, 'core-attestation.json')), 'utf8'));
    stage = 'process_capture';
    assert.equal(core.nonce, p.nonce);
    const mainPid = await app.evaluate(() => process.pid);
    const currentProcesses = processes.rows();
    assert.equal(currentProcesses.find(row => row.pid === core.pid)?.parent, core.parent);
    const renderer = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map(w => w.webContents.getOSProcessId()));
    const roles = { [core.pid]: 'core_host', ...Object.fromEntries(renderer.map(pid => [pid, 'renderer'])) };
    const captured = processes.capture(p, mainPid, roles, currentProcesses);
    processes.attestNonce(p, captured.entries);
    P.validateZero(p);
    return { app, page, p, phase, async close() {
      await app.evaluate(({ app }) => app.quit()); await app.close();
      for (let i = 0; i < 100; i++) {
        const live = processes.rows(); const manifest = JSON.parse(fs.readFileSync(path.join(p.control, 'processes.json'), 'utf8'));
        if (manifest.entries.every(e => !live.some(r => r.pid === e.pid || r.parent === e.pid))) {
          fs.unlinkSync(path.join(p.control, 'launch.lock')); assert.ok(processes.inactive(p, live)); P.validateZero(p); return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('PROCESS_REMAINS');
    } };
  } catch (error) {
    const setup = /RECOVERY_BOOTSTRAP_FAILURE:(\{"classification":"[a-z_0-9]+"\})/.exec(error?.message || '');
    const site = /(?:processes\.cjs|desktop\.mjs):(\d+)/.exec(error?.stack || '');
    P.atomic(path.join(p.control, 'diagnostic.json'), { stage, classification: setup ? JSON.parse(setup[1]).classification : error?.name === 'TimeoutError' ? 'timeout' : site ? 'harness_check_' + site[1] : 'assertion_or_startup_failure' });
    // Graceful exit only; no fallback kill. Uncertain ownership/lock is retained for inspection.
    if (app) { try { await app.evaluate(({ app }) => app.quit()); await app.close(); } catch {} }
    throw new Error('ISOLATED_DESKTOP_LAUNCH_FAILED');
  }
}

export async function smoke() {
  const output = [];
  for (const scenario of ['A', 'B', 'C', 'D', 'E', 'F']) {
    const p = P.create(scenario); await state.seed(p);
    if (scenario === 'B') { const app = await launch(p, 'preparation'); await app.close(); }
    let first;
    for (let n = 0; n < 2; n++) {
      const app = await launch(p, 'recovery'); await app.close();
      const result = await state.inspect(p);
      if (scenario === 'B') {
        const { tasks } = await state.repositories(p);
        const { PlannerApprovalService } = await import('../../packages/core/dist/planner/planner-approval-service.js');
        const task = (await tasks.listTasks())[0]; assert.equal(task.state, 'interrupted');
        const approval = new PlannerApprovalService({ repository: tasks, now: state.now });
        assert.equal((await approval.approve({ taskId: task.id, executeStep: async () => {
          P.count(p, 'recoveryExecutorCalls'); throw new Error('STALE_APPROVAL_EXECUTION');
        } })).ok, false);
      }
      if (first) assert.deepEqual(result, first); else first = result;
      assert.equal(result.finalMessageCount, scenario === 'E' ? 1 : 0);
      assert.equal(result.quarantineCount, scenario === 'F' ? 1 : 0);
    }
    output.push({ scenario, classification: scenario === 'F' ? 'quarantined_submission_blocked_input_editable' : first.classification, counts: P.validateZero(p), pass: true });
    P.remove(p, processes.inactive);
  }
  return output;
}
