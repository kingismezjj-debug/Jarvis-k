// Test-only bounded diagnostics. Never retain the original exception or its cause.
const fs = require('node:fs');
const path = require('node:path');
const P = require('./profile.cjs');
const ProcessSummary = require('./exit-summary.cjs');
const ProviderSummary = require('./provider-mode.cjs');
const CATALOG = Object.freeze([...require('./controller-receipt.cjs').FAILURES.map(x=>'controller_'+x),...require('./pending-monitor.cjs').ASSERTIONS,'authorization_window_result','authorization_helper_identity','authorization_window_owner','authorization_window_foreground','authorization_helper_lifecycle','authorization_pipe_state','authorization_pipe_single_use','authorization_binding','authorization_window_decision',
  'local_authorization_input','local_authorization_channel','local_authorization_deadline','local_authorization_foreground','canonical_approval_state','approval_command_count','execution_started_count','harness_cancel_count','application_close_state','crash_deadline','local_authorization_calibration',
  'scenario_classification_match', 'recovery_terminal_count', 'terminal_event_count',
  'recovery_event_count', 'task_interruption_count', 'canonical_message_count',
  'canonical_final_message_count', 'recovery_run_count', 'preparation_provider_count',
  'recovery_provider_count', 'preparation_executor_count', 'recovery_executor_count',
  'notepad_observed_count', 'process_exit_state', 'profile_ownership', 'journal_integrity',
  'quarantine_count', 'native_approval_projection', 'stale_approval_rejected',
  'inspection_result_integrity', 'inspection_result_write', 'inspection_stage',
  'recovery_idempotency', 'desktop_start', 'recovery_barrier', 'recovery_notice_count',
  'streaming_bubble_count', 'editor_state', 'send_state', 'alternate_submit_blocked',
  'safe_recovery_wording', 'process_identity', 'profile_seed', 'profile_cleanup',
  'inspection_operation', 'tool_result_count', 'continuation_count',
  'provider_mode','provider_policy','provider_configured','provider_instantiated',
  'provider_factory_calls','provider_transport_calls','provider_network_calls','provider_status','provider_configuration_files',
]);
const STAGES = Object.freeze(['authorization_wait', 'prepare', 'launch', 'first_recovery', 'first_exit', 'second_recovery', 'second_exit', 'cleanup']);
const CLASSES = Object.freeze(['assertion_failed', 'inspection_error', 'persistence_unavailable', 'process_state_unavailable']);
const ENUMS = Object.freeze(['timeout','error','cancelled','failed',...require('./pending-monitor.cjs').CAUSES,...require('./authorization-window-protocol.cjs').RESULTS,'challenge_match','input_mismatch','open','eof','readable','input_error','within_45s','expired','pending','changed','aborted','tty_unavailable','foreground_unverified','verified','within_75s','granted','unavailable', 'invalid_value', 'out_of_bounds', 'valid', 'invalid', 'synthetic_invalid',
  'absent','guarded_fake','unconfigured','available',
  'unfinished', 'terminal', 'invalid_journal', 'none', 'completed', 'preparation_required',
  'interrupted_before_execution', 'interrupted_while_awaiting_approval',
  'interrupted_unknown_execution_result', 'interrupted_after_tool_result']);
const COUNTERS = Object.freeze(['terminalCount', 'terminalEventCount', 'eventCount', 'taskRecoveryCount',
  'messageCount', 'finalMessageCount', 'quarantineCount', 'toolResultCount', 'continuationCount',
  'preparationFakeProviderCalls', 'recoveryProviderCalls', 'preparationExecutorCalls',
  'recoveryExecutorCalls', 'notepadObservedCount', 'recoveryRuns']);
const MAX = 4096;
function bounded(v) {
  if (typeof v === 'boolean' || ENUMS.includes(v)) return v;
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0 && v <= MAX ? v : 'out_of_bounds';
  return 'invalid_value';
}
class SafeFailure extends Error {
  constructor(failure, summary) {
    super('SAFE_INSPECTION_FAILURE'); this.failure = failure;
    if (ProcessSummary.valid(summary)) this.safeProcessSummary = summary;
  }
}
function failure(assertion, stage, classification = 'inspection_error', expected = true, actual = 'unavailable') {
  return new SafeFailure({ assertion: CATALOG.includes(assertion) ? assertion : 'inspection_operation',
    expected: bounded(expected), actual: bounded(actual), stage: STAGES.includes(stage) ? stage : 'launch',
    classification: CLASSES.includes(classification) ? classification : 'inspection_error' });
}
function context(stage) {
  if (!STAGES.includes(stage)) throw failure('inspection_stage', 'launch');
  return { stage, assertions: 0,
    check(name, expected, actual) {
      this.assertions++;
      if (!CATALOG.includes(name) || bounded(expected) !== expected) throw failure(name, stage);
      if (bounded(actual) !== actual) throw failure(name, stage, 'inspection_error', expected, bounded(actual));
      if (expected !== actual) throw failure(name, stage, 'assertion_failed', expected, actual);
    },
    async read(name, classification, operation) {
      try { return await operation(); }
      catch (error) { if (error instanceof SafeFailure) throw error; throw failure(name, stage, classification); }
    },
  };
}
function safeFailure(error, stage, name = 'inspection_operation', classification = 'inspection_error') {
  if (error instanceof SafeFailure && validFailure(error.failure)) return error.failure;
  return failure(name, stage, classification).failure;
}
function exact(o, keys) { return o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).sort().join('|') === [...keys].sort().join('|'); }
function validFailure(f) {
  return exact(f, ['assertion', 'expected', 'actual', 'stage', 'classification']) && CATALOG.includes(f.assertion) &&
    STAGES.includes(f.stage) && CLASSES.includes(f.classification) && bounded(f.expected) === f.expected && bounded(f.actual) === f.actual;
}
function validCounters(c) {
  return c && typeof c === 'object' && !Array.isArray(c) && Object.entries(c).every(([k,v]) =>
    COUNTERS.includes(k) && typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX);
}
function validateResult(r) {
  const keys = ['schemaVersion', 'scenario', 'stage', 'verdict', 'assertions', 'safeCounters', 'generatedAt'];
  if (r?.verdict === 'FAIL') keys.push('firstFailure');
  if (r?.safeProcessSummary !== undefined) keys.push('safeProcessSummary');
  if (r?.provider !== undefined) keys.push('provider');
  if (!exact(r, keys) || r.schemaVersion !== 1 || !['A','B','C','D','E','F'].includes(r.scenario) ||
    !STAGES.includes(r.stage) || !['PASS','FAIL'].includes(r.verdict) || !Number.isInteger(r.assertions) || r.assertions < 0 || r.assertions > MAX ||
    !validCounters(r.safeCounters) || r.generatedAt !== 'stage_completed' ||
    (r.safeProcessSummary !== undefined && !ProcessSummary.valid(r.safeProcessSummary)) ||
    (r.provider !== undefined && !ProviderSummary.valid(r.provider)) ||
    (r.verdict === 'FAIL' && (!validFailure(r.firstFailure) || r.firstFailure.stage !== r.stage))) throw failure('inspection_result_integrity', r?.stage);
  return r;
}
function result(scenario, ctx, counters = {}, error) {
  const safeCounters = Object.fromEntries(Object.entries(counters).filter(([k,v]) => COUNTERS.includes(k) && typeof v === 'number' && bounded(v) === v));
  return validateResult({ schemaVersion: 1, scenario, stage: ctx.stage, verdict: error ? 'FAIL' : 'PASS', assertions: ctx.assertions,
    ...(error ? { firstFailure: { ...safeFailure(error, ctx.stage), stage: ctx.stage } } : {}),
    ...(ProcessSummary.valid(error?.safeProcessSummary) ? { safeProcessSummary: error.safeProcessSummary } : {}),
    ...(ctx.provider === undefined ? {} : {provider: ctx.provider}),
    safeCounters, generatedAt: 'stage_completed' });
}
function resultPath(p, stage) {
  if (!STAGES.includes(stage)) throw failure('inspection_stage', 'launch');
  return path.join(p.control, `inspection-${stage}.json`);
}
function writeResult(p, r) {
  try {
    p = P.load(p.id); validateResult(r);
    const file = resultPath(p, r.stage);
    if (fs.existsSync(file)) readResult(p, r.stage);
    // P.atomic uses exclusive pending creation, fsync, close, then rename.
    P.atomic(file, r);
  } catch { throw failure('inspection_result_write', r?.stage, 'persistence_unavailable'); }
  return r;
}
function readResult(p, stage) {
  try {
    p = P.load(p.id); const file = resultPath(p, stage);
    if (fs.existsSync(file + '.pending')) throw failure('inspection_result_integrity', stage);
    const size = fs.statSync(P.canonical(file)).size;
    if (size > 16384) throw failure('inspection_result_integrity', stage);
    const r = validateResult(JSON.parse(fs.readFileSync(file, 'utf8')));
    if (r.scenario !== p.scenario || r.stage !== stage) throw failure('inspection_result_integrity', stage);
    return r;
  } catch { throw failure('inspection_result_integrity', stage, 'persistence_unavailable'); }
}
function recordFailure(p, ctx, error, counters = {}) {
  const r = result(p.scenario, ctx, counters, error);
  // Outer CLI/launcher boundaries must not erase the inner inspection's counters.
  let previous;
  try { previous = readResult(p, ctx.stage); } catch { /* writeResult still refuses corrupt/pending files. */ }
  if (previous?.verdict === 'FAIL' && JSON.stringify(previous.firstFailure) === JSON.stringify(r.firstFailure)) {
    throw new SafeFailure(previous.firstFailure, previous.safeProcessSummary);
  }
  try { writeResult(p, r); } catch (writeError) { throw writeError; }
  throw new SafeFailure(r.firstFailure, r.safeProcessSummary);
}
module.exports = { validFailure, CATALOG, STAGES, CLASSES, ENUMS, COUNTERS, MAX, SafeFailure, bounded, failure, context,
  safeFailure, validateResult, result, writeResult, readResult, recordFailure };
