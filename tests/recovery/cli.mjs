import path from 'node:path';
import P from './profile.cjs';
import processes from './processes.cjs';
import state from './state.cjs';
import D from './diagnostics.cjs';
import I from './inspection.cjs';
import Exit from './exit-verifier.cjs';
import ProcessSummary from './exit-summary.cjs';

// Every failure has allowlisted fields; no original exception is forwarded.
export async function main(args) {
  const [command, option, id, stageOption, selectedStage] = args;
  const stage = command === 'prepare' ? 'prepare' : command === 'cleanup' ? 'cleanup' :
    D.STAGES.includes(selectedStage) ? selectedStage : 'launch';
  const ctx = D.context(stage); let p;
  try {
    if(command==='authorization-window-selftest'&&args.length===1)return (await import('./authorization-window-selftest.mjs')).selftest();
    if(command==='authorize-input-selftest'&&args.length===1)return (await import('./authorize-input-selftest.mjs')).selftest();
    if (command === 'smoke' && args.length === 1) return { pass: true, scenarios: await (await import('./desktop.mjs')).smoke() };
    ctx.check('inspection_stage', true, option === '--scenario' &&
      (args.length === 3 || command === 'inspect' && args.length === 5 && stageOption === '--stage' && D.STAGES.includes(selectedStage)));
    if (command === 'authorize-crash') return (await import('./authorize-crash.mjs')).authorizeCrash([id]);
    if (command === 'prepare') {
      p = await ctx.read('profile_ownership', 'inspection_error', () => P.create(id));
      await ctx.read('notepad_observed_count', 'process_state_unavailable', () => processes.noNotepad(p));
      await ctx.read('profile_seed', 'persistence_unavailable', () => state.seed(p));
      return { profile: p.id, inspection: I.requirePass(await I.inspect(p, 'prepare')) };
    }
    p = await ctx.read('profile_ownership', 'inspection_error', () => P.load(id));
    if (command === 'launch') {
      const c = await ctx.read('recovery_run_count', 'persistence_unavailable', () => P.counts(p));
      const phase = p.scenario === 'B' && c.preparationFakeProviderCalls === 0 ? 'preparation' : 'recovery';
      const running = await (await import('./desktop.mjs')).launch(p, phase);
      console.log(JSON.stringify(running.inspection));
      await running.waitForLaunchExit();
      return await running.finishExit();
    }
    if (command === 'inspect') {
      const c = await ctx.read('recovery_run_count', 'persistence_unavailable', () => P.counts(p));
      const inspectionStage = selectedStage || (c.recoveryRuns === 0 ? 'prepare' : c.recoveryRuns === 1 ? 'first_exit' : 'second_exit');
      return await I.inspect(p, inspectionStage);
    }
    if (command === 'resolve-crash-targets') {
      await ctx.read('process_identity', 'process_state_unavailable', () => processes.resolve(p));
      ctx.check('process_identity', true, true);
      return D.result(p.scenario, ctx);
    }
    if (command === 'cleanup') {
      ctx.check('process_exit_state', true, await ctx.read('process_exit_state', 'process_state_unavailable', () => Exit.cleanupGuard(p)));
      const result = D.writeResult(p, D.result(p.scenario, ctx));
      await ctx.read('profile_cleanup', 'inspection_error', () => P.remove(p, Exit.cleanupGuard));
      return result;
    }
    throw D.failure('inspection_operation', stage);
  } catch (error) {
    if (p) D.recordFailure(p, D.context(error instanceof D.SafeFailure ? error.failure.stage : stage), error);
    throw new D.SafeFailure(D.safeFailure(error, stage),error?.safeProcessSummary);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  main(process.argv.slice(2)).then(result => {
    console.log(JSON.stringify(result)); if (result.verdict === 'FAIL'||result.result&&result.result!=='granted') process.exitCode = 1;
  }).catch(error => {
    console.log(JSON.stringify(ProcessSummary.valid(error?.safeProcessSummary) ?
      { firstFailure: D.safeFailure(error,'launch'), safeProcessSummary: error.safeProcessSummary } : D.safeFailure(error, 'launch'))); process.exitCode = 1;
  });
}
