import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../..');
const text = readFileSync(path.join(root,
  'artifacts/ui-3l/reduced-scope-soak/reduced-scope-soak-acceptance.json'), 'utf8');
const evidence = JSON.parse(text);

describe('UI-3L-2A reduced-scope evidence (no runtime execution)', () => {
  it('keeps the user waiver out of completed days and derives the verdict', () => {
    expect(evidence.schemaVersion).toBe(1);
    expect(evidence.stageId).toBe('UI-3L-2A');
    expect(evidence.implementationHead).toBe('b0d547ba0fefc8e0ab0ac52a25197f7311371c33');
    expect(evidence.platformClassification).toBe('windows_11_arm64_development');
    expect(evidence.requestedDays).toBe(5);
    expect(evidence.waivedDays).toEqual([5]);
    const days = evidence.dayResults;
    expect(days.map((d: { day: number }) => d.day)).toEqual([1, 2, 3, 4, 5]);
    expect(days[4]).toMatchObject({ status: 'WAIVED_BY_USER', tested: false,
      countedAsCompleted: false, reason: 'user_requested_early_closure' });
    const completed = days.filter((d: { day: number; logValid: boolean; status: string }) =>
      d.day < 5 && d.logValid && ['PASS', 'PASS_WITH_MINOR_ISSUES'].includes(d.status));
    expect(evidence.completedDays).toBe(completed.length);
    for (const d of days) expect(d.countedAsCompleted).toBe(completed.includes(d));
    const verdict = evidence.p0Count > 0 || evidence.unresolvedP1Count > 0 ? 'BLOCKED'
      : completed.length === 4 ? 'PASS_WITH_REDUCED_SCOPE' : 'INCOMPLETE_USER_STOPPED';
    expect(evidence.overallVerdict).toBe(verdict);
    expect(evidence.overallVerdict).toBe('INCOMPLETE_USER_STOPPED');
  });

  it('preserves the actual inventory and excludes the undated partial report', () => {
    expect(evidence.dayResults[0]).toMatchObject({ logPresent: true, logValid: false,
      status: 'NOT_RUN', reason: 'existing_log_missing_usage_date_not_verifiable',
      reportedDurationMinutes: 30 });
    for (const d of evidence.dayResults.slice(1, 4)) {
      expect(d).toMatchObject({ logPresent: false, logValid: false, tested: false,
        status: 'NOT_RUN', reason: 'daily_log_missing' });
    }
    expect(evidence.completedDays).toBe(0);
    expect(evidence.totalObservedDurationMinutes).toBe(evidence.dayResults.reduce(
      (sum: number, d: { reportedDurationMinutes?: number }) => sum + (d.reportedDurationMinutes ?? 0), 0));
    expect(evidence.validCompletedDayDurationMinutes).toBe(0);
    expect(evidence.coveredCapabilities).toEqual([]);
    expect(evidence.untestedCapabilities).toEqual(expect.arrayContaining([
      'cancellation', 'retry', 'model_status', 'notepad_deny', 'notepad_allow']));
    expect([evidence.p0Count, evidence.unresolvedP1Count, evidence.minorIssueCount]).toEqual([0, 0, 0]);
    expect(evidence.issueCountScope).toBe('reported_in_available_log_only_missing_days_unknown');
  });

  it('rejects sensitive content and unsupported acceptance claims', () => {
    expect(text).not.toMatch(/(?:assumed|default)[_ -]?pass/i);
    expect(text).not.toMatch(/(?:[A-Z]:\\|\/Users\/|\/home\/|Bearer\s|sk-[a-z0-9]{12})/i);
    function inspect(value: unknown): void {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        expect(key).not.toMatch(/credential|authorization|api.?key|prompt|answer|reasoning|payload|^pid$|username|sqlite|profile.?path/i);
        inspect(child);
      }
    }
    inspect(evidence);
    expect(Object.values(evidence.claims)).toEqual([false, false, false, false, false]);
    expect(evidence.realNetworkRequestSent).toBe(false);
    expect(evidence.realWindowsActionPerformed).toBe(false);
    expect(evidence.soakActivity.realNetworkRequestSent.classification).toBe('inferred_not_packet_captured');
    expect(evidence.soakActivity.realNetworkRequestSent.exactCountKnown).toBe(false);
    expect(evidence.soakActivity.realWindowsActionPerformed.recordedApprovedNotepadLaunchCount).toBe(0);
    const status = readFileSync(path.join(root, 'CURRENT_STATUS.md'), 'utf8');
    expect(status).toContain('INCOMPLETE_USER_STOPPED');
    expect(status).toContain('0 validated completed days / 5 requested');
    expect(status).toContain('WAIVED_BY_USER / NOT_TESTED');
    expect(status).toContain('UI-3K-2E remains L3');
  });
});
