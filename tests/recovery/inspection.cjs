// Formal inspections of owned synthetic profiles; never runs recovery or initializes a repository.
const fs = require('node:fs');
const path = require('node:path');
const P = require('./profile.cjs');
const R = require('./processes.cjs');
const S = require('./state.cjs');
const D = require('./diagnostics.cjs');
const Exit = require('./exit-verifier.cjs');
const RECOVERY = Object.freeze({ A: 'interrupted_before_execution', B: 'interrupted_while_awaiting_approval',
  C: 'interrupted_unknown_execution_result', D: 'interrupted_after_tool_result', E: 'completed', F: 'invalid_journal' });
const SEED_EVENTS = Object.freeze({ A: 3, B: 0, C: 5, D: 6, E: 7, F: 4 });
async function facts(p) {
  const basic = await S.inspect(p);
  const file = P.canonical(path.join(p.localData, 'task-runtime.sqlite'));
  if (fs.statSync(file).size > 32 * 1024 * 1024) throw Error();
  const SQL = await require('sql.js')(); const db = new SQL.Database(fs.readFileSync(file));
  try {
    const validDatabase = db.exec('PRAGMA integrity_check')[0]?.values[0]?.[0] === 'ok';
    const rows = db.exec('SELECT turn_id,sequence,event_json FROM assistant_turn_events ORDER BY turn_id,sequence')[0]?.values ?? [];
    if (rows.length > 128) throw Error();
    const events = rows.map(r => JSON.parse(r[2]));
    const { validateAssistantJournal } = require('../../packages/core/dist/assistant-turn-repository.js');
    let invalid = 0;
    for (const id of new Set(rows.map(r => r[0]))) {
      const group = rows.map((r,i) => ({ r, e: events[i] })).filter(x => x.r[0] === id);
      try {
        if (!group.every((x,i) => x.r[1] === i)) throw Error();
        validateAssistantJournal(group.map(x => x.e));
      } catch { invalid++; }
    }
    const terminal = events.filter(e => ['turn.interrupted','turn.completed','turn.cancelled','turn.failed'].includes(e.type));
    const recovered = terminal.find(e => e.type === 'turn.interrupted' || e.type === 'turn.completed');
    return { ...basic, journalIntegrity: !validDatabase ? 'invalid' : invalid === 0 ? 'valid' :
      p.scenario === 'F' && invalid === 1 && rows.length === 4 ? 'synthetic_invalid' : 'invalid',
      recoveryClassification: basic.quarantineCount ? 'invalid_journal' : recovered?.type === 'turn.completed' ? 'completed' : recovered?.data.classification ?? 'none',
      terminalEventCount: terminal.length, toolResultCount: events.filter(e => e.type === 'tool.resulted').length,
      continuationCount: events.filter(e => e.type === 'provider.continued').length };
  } finally { db.close(); }
}
function checkCounters(ctx, counts, scenario, prepared) {
  for (const [name,key,expected] of [
    ['preparation_provider_count','preparationFakeProviderCalls', scenario === 'B' && prepared ? 1 : 0],
    ['recovery_provider_count','recoveryProviderCalls',0], ['preparation_executor_count','preparationExecutorCalls',0],
    ['recovery_executor_count','recoveryExecutorCalls',0], ['notepad_observed_count','notepadObservedCount',0],
  ]) ctx.check(name, expected, counts[key]);
}
function evaluate(ctx, scenario, f, c) {
  const prepare = ctx.stage === 'prepare';
  const count = prepare ? 0 : ctx.stage.startsWith('second_') ? 2 : 1;
  ctx.check('journal_integrity', scenario === 'F' ? 'synthetic_invalid' : 'valid', f.journalIntegrity);
  ctx.check('scenario_classification_match', prepare ? scenario === 'B' ? 'terminal' : 'unfinished' : RECOVERY[scenario],
    prepare ? f.classification : f.recoveryClassification);
  ctx.check('recovery_terminal_count', prepare ? scenario === 'F' ? 1 : 0 : 1, f.terminalCount);
  ctx.check('terminal_event_count', prepare ? scenario === 'F' ? 1 : 0 : 1, f.terminalEventCount);
  ctx.check('recovery_event_count', prepare ? SEED_EVENTS[scenario] : scenario === 'B' ? 4 : SEED_EVENTS[scenario] + (scenario === 'F' ? 0 : 1), f.eventCount);
  ctx.check('task_interruption_count', prepare ? 0 : 1, f.taskRecoveryCount);
  ctx.check('canonical_message_count', scenario === 'E' ? 1 : 0, f.messageCount);
  ctx.check('canonical_final_message_count', scenario === 'E' ? 1 : 0, f.finalMessageCount);
  ctx.check('quarantine_count', !prepare && scenario === 'F' ? 1 : 0, f.quarantineCount);
  ctx.check('tool_result_count', ['D','E'].includes(scenario) ? 1 : 0, f.toolResultCount);
  ctx.check('continuation_count', scenario === 'E' ? 1 : 0, f.continuationCount);
  ctx.check('recovery_run_count', count, c.recoveryRuns);
  checkCounters(ctx, c, scenario, !prepare);
}
function logical(c) { return Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'recoveryRuns').sort()); }
async function inspect(p, stage, dependencies = {}) {
  const ctx = D.context(stage); let counters = {};
  try {
    p = await ctx.read('profile_ownership', 'inspection_error', () => P.validateTree(P.load(p.id)));
    ctx.check('profile_ownership', true, true);
    const closed = ['prepare','first_exit','second_exit','cleanup'].includes(stage);
    const processFact = await ctx.read('process_exit_state', 'process_state_unavailable', () =>
      dependencies.processState ? dependencies.processState(p, closed) :
        ['first_exit','second_exit'].includes(stage) ? Exit.consume(p,stage).verdict === 'PASS' :
        stage === 'cleanup' ? Exit.cleanupGuard(p) : closed ? R.inactive(p) : !!R.resolve(p).length);
    ctx.check('process_exit_state', true, processFact);
    const f = await ctx.read('journal_integrity', 'persistence_unavailable', () => (dependencies.facts || facts)(p));
    const c = await ctx.read('recovery_run_count', 'persistence_unavailable', () => (dependencies.counts || P.counts)(p));
    counters = { ...f, ...c };
    await ctx.read('inspection_operation', 'inspection_error', () => (dependencies.evaluate || evaluate)(ctx, p.scenario, f, c));
    if (stage === 'second_exit') {
      const first = await ctx.read('inspection_result_integrity', 'persistence_unavailable', () => D.readResult(p, 'first_exit'));
      ctx.check('inspection_result_integrity', true, first.verdict === 'PASS');
      const current = D.result(p.scenario, ctx, counters);
      ctx.check('recovery_idempotency', true, JSON.stringify(logical(first.safeCounters)) === JSON.stringify(logical(current.safeCounters)));
    }
    return D.writeResult(p, D.result(p.scenario, ctx, counters));
  } catch (error) {
    const result = D.result(p.scenario, ctx, counters, error);
    // Never write into an unverified profile. Output retains the safe failure even then.
    if (result.firstFailure.assertion === 'profile_ownership') return result;
    try { return D.writeResult(p, result); }
    catch (writeError) { return D.result(p.scenario, ctx, {}, writeError); }
  }
}
function requirePass(result) { if (result.verdict !== 'PASS') throw new D.SafeFailure(result.firstFailure,result.safeProcessSummary); return result; }
module.exports = { RECOVERY, SEED_EVENTS, facts, evaluate, checkCounters, inspect, requirePass };
