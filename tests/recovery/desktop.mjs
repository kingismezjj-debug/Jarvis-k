import fs from 'node:fs';
import path from 'node:path';
import { _electron } from 'playwright';
import P from './profile.cjs';
import processes from './processes.cjs';
import state from './state.cjs';
import D from './diagnostics.cjs';
import I from './inspection.cjs';
import Exit from './exit-verifier.cjs';

export async function launch(p, phase) {
  const ctx = D.context('launch');
  try {
    p = await ctx.read('profile_ownership', 'inspection_error', () => P.validateTree(p));
    const c = await ctx.read('recovery_run_count', 'persistence_unavailable', () => P.counts(p));
    return await launchOwned(p, phase, D.context(phase === 'preparation' ? 'launch' : c.recoveryRuns === 0 ? 'first_recovery' : 'second_recovery'));
  } catch (error) { throw new D.SafeFailure(D.safeFailure(error, ctx.stage),error?.safeProcessSummary); }
}
async function launchOwned(p, phase, ctx) {
  let app;
  let stage = 'profile_ownership';
  try {
  ctx.check('process_exit_state', true, await ctx.read('process_exit_state', 'process_state_unavailable', () => Exit.cleanupGuard(p)));
  ctx.check('profile_seed', true, fs.existsSync(path.join(p.control, 'seeded')));
  const initialCounts = await ctx.read('preparation_provider_count', 'persistence_unavailable', () => P.counts(p));
  ctx.check('preparation_provider_count', phase === 'preparation' ? 0 : p.scenario === 'B' ? 1 : 0, initialCounts.preparationFakeProviderCalls);
  ctx.check('recovery_run_count', ctx.stage === 'second_recovery' ? 1 : 0, initialCounts.recoveryRuns);
  for (const name of ['core-attestation.json', 'recovery-ready.json']) {
    const file = path.join(p.control, name); if (fs.existsSync(file)) fs.unlinkSync(P.canonical(file));
  }
  const exitStage = phase === 'preparation' ? 'launch' : ctx.stage === 'first_recovery' ? 'first_exit' : 'second_exit';
  Exit.beginLaunch(p,exitStage);
  fs.writeFileSync(path.join(p.control, 'launch.lock'), p.nonce, { flag: 'wx' });
  fs.writeFileSync(path.join(p.control, 'ever-launched'), 'yes');
    stage = 'desktop_start';
    app = await _electron.launch({ cwd: P.REPO, args: ['tests/recovery/bootstrap.cjs', `--jarvis-recovery-nonce=${p.nonce}`], env: P.environment(p, phase), timeout: 30000 });
    const launchProcess = app.process();
    let launchExited = launchProcess.exitCode !== null || launchProcess.signalCode !== null;
    const launchExit = launchExited ? Promise.resolve() : new Promise(resolve => launchProcess.once('exit', () => { launchExited = true; resolve(); }));
    const page = await app.firstWindow(); page.setDefaultTimeout(15000);
    await page.getByTestId('jarvis-app').waitFor();
    stage = 'recovery_barrier';
    await page.waitForFunction(async () => {
      const r = await window.jarvis.getSnapshot(); return r.ok && (r.data.health === 'ready' || r.data.assistantRecoveryBlocked === true);
    });
    // Wait for the durable startup barrier, including the intentionally blocked F state.
    for (let n = 0; !fs.existsSync(path.join(p.control, 'recovery-ready.json')); n++) {
      ctx.check('recovery_barrier', true, n < 200); await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (phase === 'preparation') {
      stage = 'native_approval_projection';
      await page.getByTestId('assistant-native-approval').waitFor();
      ctx.check('native_approval_projection', true, await page.getByTestId('assistant-tool-allow').isEnabled());
      ctx.check('native_approval_projection', true, await page.getByTestId('assistant-tool-deny').isEnabled());
      const native = await page.evaluate(async () => {
        const snapshot = (await window.jarvis.getSnapshot()).data;
        return { proposals: snapshot.assistantTurn?.proposals?.length,
          awaitingApproval: snapshot.assistantTurn?.status === 'awaiting_approval',
          pendingTasks: snapshot.tasks.filter(task => task.state === 'awaiting_confirmation').length };
      });
      ctx.check('native_approval_projection', true, native.proposals === 1 && native.awaitingApproval === true && native.pendingTasks === 1);
    } else {
      stage = 'recovery_barrier';
      await page.waitForFunction(async () => {
        const r = await window.jarvis.getSnapshot(); return r.ok && (r.data.assistantRecoveries?.length > 0 || r.data.assistantRecoveryBlocked || r.data.health === 'ready');
      });
      ctx.check('native_approval_projection', 0, await page.getByTestId('assistant-native-approval').count());
      ctx.check('streaming_bubble_count', 0, await page.getByTestId('assistant-streaming-turn').count());
      const expected = ['A', 'B', 'C', 'D'].includes(p.scenario) ? 1 : 0;
      stage = 'recovery_notice_count';
      await page.waitForFunction(expected => document.querySelectorAll('[data-testid="assistant-recovery-notice"]').length === expected, expected)
        .catch(error => { if (error?.name !== 'TimeoutError') throw error; });
      ctx.check('recovery_notice_count', expected, await page.getByTestId('assistant-recovery-notice').count());
      stage = 'send_state';
      await page.waitForFunction(blocked => document.querySelector('[data-testid="send-command"]')?.disabled === blocked, p.scenario === 'F')
        .catch(error => { if (error?.name !== 'TimeoutError') throw error; });
      ctx.check('send_state', p.scenario === 'F', await page.getByTestId('send-command').isDisabled());
      stage = 'editor_state';
      ctx.check('editor_state', p.scenario !== 'F', await page.getByTestId('command-input').isEditable());
      if (p.scenario === 'F') {
        ctx.check('editor_state', true, await page.getByTestId('command-input').isDisabled());
        ctx.check('editor_state', true, (await page.getByTestId('command-input').getAttribute('aria-disabled')) === 'true');
        await page.getByTestId('command-input').evaluate(input => input.focus());
        ctx.check('editor_state', false, await page.getByTestId('command-input').evaluate(input => input === document.activeElement));
        stage = 'alternate_submit_blocked';
        await page.keyboard.type('Synthetic blocked draft'); await page.keyboard.press('Enter'); await page.keyboard.press('Control+Enter');
        ctx.check('alternate_submit_blocked', true, (await page.getByTestId('command-input').inputValue()) === '');
        await page.getByTestId('command-input').evaluate(input => input.closest('form').requestSubmit());
        // Exercise the existing bridge's alternate text and synthetic voice-submit
        // routes directly, without microphone/ASR, a provider, or any real executor.
        const result = await page.evaluate(async () => {
          const before = (await window.jarvis.getSnapshot()).data.messages.length;
          const commands = [
            { type: 'agent.sendMessage', payload: { text: 'Synthetic blocked input' } },
            { type: 'agent.runBrainCommand', payload: { source: 'text', text: 'Synthetic blocked input' } },
            { type: 'agent.runBrainCommand', payload: { source: 'voice', voiceInputMode: 'dictation', text: 'Synthetic blocked input' } },
            { type: 'agent.confirmVoiceCommandCorrection', payload: { rawAlias: 'synthetic', normalizedTranscript: 'Synthetic blocked input', intent: 'chat.answer', slots: {} } },
          ];
          const results = []; for (const command of commands) results.push(await window.jarvis.sendCommand(command));
          return { before, after: (await window.jarvis.getSnapshot()).data.messages.length,
            blocked: results.every(r => !r.ok && r.error.code === 'ASSISTANT_RECOVERY_BLOCKED') };
        });
        ctx.check('canonical_message_count', 0, result.before);
        ctx.check('canonical_message_count', 0, result.after);
        ctx.check('alternate_submit_blocked', true, result.blocked);
      }
      if (p.scenario === 'C') {
        const notice = await page.getByTestId('assistant-recovery-notice').innerText();
        ctx.check('safe_recovery_wording', true, /执行结果未知|execution result is unknown/i.test(notice));
        ctx.check('safe_recovery_wording', false, /启动成功|执行成功|执行失败/.test(notice));
      }
      if (p.scenario === 'E') ctx.check('canonical_final_message_count', 1, await page.getByText('Synthetic completed response.', { exact: true }).count());
    }
    stage = 'process_identity';
    const core = await ctx.read('process_identity', 'process_state_unavailable', () => JSON.parse(fs.readFileSync(P.canonical(path.join(p.control, 'core-attestation.json')), 'utf8')));
    ctx.check('process_identity', true, core.nonce === p.nonce);
    const mainPid = await app.evaluate(() => process.pid);
    const currentProcesses = processes.rows();
    ctx.check('process_identity', true, currentProcesses.find(row => row.pid === core.pid)?.parent === core.parent);
    const renderer = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map(w => w.webContents.getOSProcessId()));
    const roles = { [core.pid]: 'core_host', ...Object.fromEntries(renderer.map(pid => [pid, 'renderer'])) };
    const captured = processes.capture(p, mainPid, roles, currentProcesses);
    processes.attestNonce(p, captured.entries);
    const c = await ctx.read('recovery_run_count', 'persistence_unavailable', () => P.counts(p));
    I.checkCounters(ctx, c, p.scenario, true);
    const inspection = phase === 'preparation' ? D.writeResult(p, D.result(p.scenario, ctx, c)) : I.requirePass(await I.inspect(p, ctx.stage));
    async function finishExit() {
      const exit = D.context(exitStage);
      try {
        await Exit.verify(p,exitStage,{ launchExitObserved: () => launchExited });
        // Only close the automation connection after the launch and captured identities exited.
        await app.close();
        if (phase !== 'preparation') return I.requirePass(await I.inspect(p, exit.stage));
        const counts = P.counts(p); I.checkCounters(exit, counts, p.scenario, true);
        return D.writeResult(p, D.result(p.scenario, exit, counts));
      } catch (error) { D.recordFailure(p, exit, error); }
    }
    return { app, page, p, phase, inspection, finishExit, waitForLaunchExit: () => launchExit, async close() {
      try { await app.evaluate(({ app }) => app.quit()); }
      catch { throw D.failure('process_exit_state', ctx.stage === 'first_recovery' ? 'first_exit' : 'second_exit', 'process_state_unavailable'); }
      return finishExit();
    } };
  } catch (error) {
    // Graceful exit only; no fallback kill. Uncertain ownership/lock is retained for inspection.
    if (app) { try { await app.evaluate(({ app }) => app.quit()); await app.close(); } catch {} }
    D.recordFailure(p, ctx, new D.SafeFailure(D.safeFailure(error, ctx.stage, stage,
      stage === 'process_identity' ? 'process_state_unavailable' : 'inspection_error')));
  }
}

export async function smoke() {
  const output = [];
  for (const scenario of ['A', 'B', 'C', 'D', 'E', 'F']) {
    const prepare = D.context('prepare');
    const p = await prepare.read('profile_ownership', 'inspection_error', () => P.create(scenario));
    await prepare.read('profile_seed', 'persistence_unavailable', () => state.seed(p));
    I.requirePass(await I.inspect(p, 'prepare'));
    if (scenario === 'B') { const app = await launch(p, 'preparation'); await app.close(); }
    let result;
    for (let n = 0; n < 2; n++) {
      const app = await launch(p, 'recovery'); result = await app.close();
      if (scenario === 'B') {
        const ctx = D.context(n === 0 ? 'first_exit' : 'second_exit');
        try {
        const { tasks } = await state.repositories(p);
        const { PlannerApprovalService } = await import('../../packages/core/dist/planner/planner-approval-service.js');
        const task = (await tasks.listTasks())[0]; ctx.check('stale_approval_rejected', true, task.state === 'interrupted');
        const approval = new PlannerApprovalService({ repository: tasks, now: state.now });
        ctx.check('stale_approval_rejected', false, (await approval.approve({ taskId: task.id, executeStep: async () => {
          P.count(p, 'recoveryExecutorCalls'); throw new Error('STALE_APPROVAL_EXECUTION');
        } })).ok);
        I.checkCounters(ctx, P.counts(p), scenario, true);
        } catch (error) { D.recordFailure(p, ctx, new D.SafeFailure(D.safeFailure(error, ctx.stage, 'stale_approval_rejected'))); }
      }
    }
    output.push(result);
    const cleanup = D.context('cleanup');
    await cleanup.read('profile_cleanup', 'inspection_error', () => P.remove(p, Exit.cleanupGuard));
  }
  return output;
}
