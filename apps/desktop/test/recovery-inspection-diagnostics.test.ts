import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
const require = createRequire(import.meta.url);
const P = require('../../../tests/recovery/profile.cjs');
const S = require('../../../tests/recovery/state.cjs');
const D = require('../../../tests/recovery/diagnostics.cjs');
const I = require('../../../tests/recovery/inspection.cjs');
const owned: any[] = [];
const make = (scenario = 'D') => { const p = P.create(scenario); owned.push(p); return p; };
const processState = () => true;
afterEach(() => { vi.restoreAllMocks(); for (const p of owned.splice(0)) P.remove(p, () => true); });
const fakeError = () => new Error(['private', 'prompt', 'answer', 'credential', 'stack', 'SELECT', 'nonce', 'C:\\private\\synthetic'].join(' '));
const checkSafe = (value: unknown) => {
  expect(JSON.stringify(value)).not.toMatch(/C:\\|private|SELECT|credential|prompt|answer|stack|nonce|"pid"|event_json/i);
};

describe('bounded diagnostic catalog', () => {
  it.each(D.CATALOG)('locates %s without raw errors', (name: string) => {
    const ctx = D.context('first_exit'); let failure;
    try { ctx.check(name, 1, 0); } catch (e) { failure = D.safeFailure(e, 'first_exit'); }
    expect(failure).toEqual({ assertion: name, expected: 1, actual: 0, stage: 'first_exit', classification: 'assertion_failed' });
    checkSafe(failure);
  });
  it.each([-1, 4097, Infinity, NaN, 'C:\\private', { raw: 'private' }, null, undefined])('bounds hostile actual values', value => {
    const ctx = D.context('first_exit'); let f;
    try { ctx.check('recovery_event_count', 7, value); } catch (e) { f = D.safeFailure(e, 'first_exit'); }
    expect(f.classification).toBe('inspection_error');
    expect(['invalid_value', 'out_of_bounds']).toContain(f.actual); checkSafe(f);
  });
  it('never infers a failure class from a raw exception name/message', async () => {
    const ctx = D.context('first_exit');
    await expect(ctx.read('inspection_operation', 'inspection_error', () => { throw fakeError(); })).rejects.toMatchObject({
      failure: { assertion: 'inspection_operation', classification: 'inspection_error', actual: 'unavailable' },
    });
    checkSafe(D.safeFailure(fakeError(), 'first_exit'));
    expect(D.safeFailure({ failure: { assertion: 'private' } }, 'first_exit').assertion).toBe('inspection_operation');
  });
});

describe('formal owned-profile inspection', () => {
  async function first() { const p = make(); await S.seed(p); await S.recoverOffline(p); return p; }
  it('D first and second inspections preserve logical counts and define runs as startup attempts', async () => {
    const p = await first();
    const a = await I.inspect(p, 'first_exit', { processState });
    expect(a).toMatchObject({ schemaVersion: 1, scenario: 'D', verdict: 'PASS', safeCounters: {
      eventCount: 7, terminalCount: 1, terminalEventCount: 1, taskRecoveryCount: 1,
      messageCount: 0, finalMessageCount: 0, recoveryRuns: 1, recoveryProviderCalls: 0, recoveryExecutorCalls: 0,
    } });
    await S.recoverOffline(p);
    const b = await I.inspect(p, 'second_exit', { processState });
    expect(b.verdict).toBe('PASS'); expect(b.safeCounters.recoveryRuns).toBe(2);
    expect({ ...b.safeCounters, recoveryRuns: 1 }).toEqual(a.safeCounters); checkSafe(b);
  });
  it.each([
    ['recoveryClassification', 'none', 'scenario_classification_match', 'interrupted_after_tool_result'],
    ['terminalCount', 0, 'recovery_terminal_count', 1], ['terminalEventCount', 0, 'terminal_event_count', 1],
    ['eventCount', 8, 'recovery_event_count', 7], ['taskRecoveryCount', 0, 'task_interruption_count', 1],
    ['messageCount', 1, 'canonical_message_count', 0], ['finalMessageCount', 1, 'canonical_final_message_count', 0],
    ['quarantineCount', 1, 'quarantine_count', 0], ['journalIntegrity', 'invalid', 'journal_integrity', 'valid'],
    ['toolResultCount', 0, 'tool_result_count', 1], ['continuationCount', 1, 'continuation_count', 0],
  ])('D mismatch %s has an exact bounded assertion', async (field, actual, assertion, expected) => {
    const p = await first(); const f = await I.facts(p);
    const r = await I.inspect(p, 'first_exit', { processState, facts: () => ({ ...f, [field]: actual }) });
    expect(r.firstFailure).toEqual({ assertion, expected, actual, stage: 'first_exit', classification: 'assertion_failed' });
    expect(D.readResult(p, 'first_exit')).toEqual(r); checkSafe(r);
  });
  it.each([
    ['recoveryRuns', 'recovery_run_count', 1], ['preparationFakeProviderCalls', 'preparation_provider_count', 0],
    ['recoveryProviderCalls', 'recovery_provider_count', 0], ['preparationExecutorCalls', 'preparation_executor_count', 0],
    ['recoveryExecutorCalls', 'recovery_executor_count', 0], ['notepadObservedCount', 'notepad_observed_count', 0],
  ])('D counter mismatch %s is not folded into a generic failure', async (key, assertion, expected) => {
    const p = await first(); const counts = P.counts(p);
    const r = await I.inspect(p, 'first_exit', { processState, counts: () => ({ ...counts, [key]: 3 }) });
    expect(r.firstFailure).toMatchObject({ assertion, expected, actual: 3, classification: 'assertion_failed' });
  });
  it.each([
    ['facts', 'journal_integrity', 'persistence_unavailable'],
    ['counts', 'recovery_run_count', 'persistence_unavailable'],
    ['processState', 'process_exit_state', 'process_state_unavailable'],
    ['evaluate', 'inspection_operation', 'inspection_error'],
  ])('separates %s inspection exceptions from mismatched facts', async (port, assertion, classification) => {
    const p = await first();
    const r = await I.inspect(p, 'first_exit', { processState, [port]: () => { throw fakeError(); } });
    expect(r.verdict).toBe('FAIL'); expect(r.firstFailure).toMatchObject({ assertion, classification, actual: 'unavailable' });
    checkSafe(r); checkSafe(fs.readFileSync(path.join(p.control, 'inspection-first_exit.json'), 'utf8'));
  });
  it('reports a read process fact false as assertion_failed', async () => {
    const p = await first(); const r = await I.inspect(p, 'first_exit', { processState: () => false });
    expect(r.firstFailure).toMatchObject({ assertion: 'process_exit_state', expected: true, actual: false, classification: 'assertion_failed' });
  });
  it('second recovery without a valid first result cannot pass idempotency', async () => {
    const p = await first(); await S.recoverOffline(p);
    const r = await I.inspect(p, 'second_exit', { processState });
    expect(r.firstFailure).toMatchObject({ assertion: 'inspection_result_integrity', stage: 'second_exit', classification: 'persistence_unavailable' });
  });
  it('rejects a changed first baseline even when second counts match absolute expectations', async () => {
    const p = await first(); const a = await I.inspect(p, 'first_exit', { processState });
    a.safeCounters.eventCount = 6; D.writeResult(p, a); await S.recoverOffline(p);
    const b = await I.inspect(p, 'second_exit', { processState });
    expect(b.firstFailure.assertion).toBe('recovery_idempotency');
  });
  it.each(['A','C','D','E','F'])('%s prepare and twice-recovered facts pass through the formal inspector', async scenario => {
    const p = make(scenario); await S.seed(p);
    expect((await I.inspect(p, 'prepare', { processState })).verdict).toBe('PASS');
    await S.recoverOffline(p); expect((await I.inspect(p, 'first_exit', { processState })).verdict).toBe('PASS');
    await S.recoverOffline(p); expect((await I.inspect(p, 'second_exit', { processState })).verdict).toBe('PASS');
  });
});

describe('atomic strict result envelope', () => {
  it('records a missing-baseline error even when no previous failure artifact exists', () => {
    const p = make(); const error = D.failure('inspection_result_integrity', 'second_exit', 'persistence_unavailable');
    expect(() => D.recordFailure(p, D.context('second_exit'), error)).toThrow();
    expect(D.readResult(p, 'second_exit').firstFailure).toEqual(error.failure);
  });
  it('outer CLI failure recording preserves the original stage, assertion and counters', () => {
    const p = make(); const ctx = D.context('first_exit');
    const error = D.failure('recovery_event_count', 'first_exit', 'assertion_failed', 7, 8);
    const r = D.result('D', ctx, { eventCount: 8, recoveryRuns: 1 }, error); D.writeResult(p, r);
    expect(() => D.recordFailure(p, ctx, error)).toThrow();
    expect(D.readResult(p, 'first_exit')).toEqual(r);
  });
  it('publishes only after fsync/close and rename; pending is never a completed result', () => {
    const p = make(); const r = D.result('D', D.context('first_exit'));
    const rename = fs.renameSync; let observed = false;
    vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      observed = true; expect(fs.existsSync(from)).toBe(true); expect(fs.existsSync(to)).toBe(false);
      expect(() => D.readResult(p, 'first_exit')).toThrow(); return rename(from, to);
    });
    D.writeResult(p, r); expect(observed).toBe(true); expect(D.readResult(p, 'first_exit')).toEqual(r);
  });
  it('failed rename leaves no valid result and exposes only persistence_unavailable', () => {
    const p = make(); vi.spyOn(fs, 'renameSync').mockImplementation(() => { throw fakeError(); });
    let error; try { D.writeResult(p, D.result('D', D.context('first_exit'))); } catch (e) { error = e; }
    expect(D.safeFailure(error, 'first_exit')).toMatchObject({ assertion: 'inspection_result_write', classification: 'persistence_unavailable' });
    expect(() => D.readResult(p, 'first_exit')).toThrow(); checkSafe(D.safeFailure(error, 'first_exit'));
  });
  it.each(['truncated', 'unknown_schema', 'extra_field', 'oversize_count', 'pending', 'wrong_stage', 'wrong_scenario'])('fails closed on %s result', kind => {
    const p = make(); const r = D.result('D', D.context('first_exit'));
    const file = path.join(p.control, 'inspection-first_exit.json');
    if (kind === 'unknown_schema') r.schemaVersion = 2;
    if (kind === 'extra_field') r.raw = 'private';
    if (kind === 'oversize_count') r.safeCounters.eventCount = 999999;
    if (kind === 'wrong_stage') r.stage = 'second_exit';
    if (kind === 'wrong_scenario') r.scenario = 'A';
    fs.writeFileSync(file, kind === 'truncated' ? '{' : JSON.stringify(r));
    if (kind === 'pending') fs.writeFileSync(file + '.pending', '{');
    expect(() => D.readResult(p, 'first_exit')).toThrow();
    expect(() => D.writeResult(p, D.result('D', D.context('first_exit')))).toThrow();
  });
});
