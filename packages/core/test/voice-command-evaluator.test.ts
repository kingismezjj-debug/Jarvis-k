import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditDataset,
  candidateScopeMetrics,
  evaluateRecord,
  isQwenRerankEligibleRecord,
  metricsFor,
  outcomeClassForRecord,
  readJsonl,
  sha256File,
  slotsExactMatch,
  summarizeResults,
} from "../../../scripts/voice-command-zh-cn-evaluator-lib.mjs";

describe("voice command zh-CN evaluator metrics", () => {
  it("reports perfect resolver predictions as complete success", () => {
    const result = evaluateRecord(
      record({ intent: "localApp.open", slots: { target: "vscode" }, autoExecuteAllowed: true }),
      correction(candidate("open.vscode", "localApp.open", { target: "vscode" })),
    );

    expect(metricsFor([result])).toMatchObject({
      intentAccuracy: 1,
      slotExactMatchAllSamples: 1,
      slotExactMatchGivenCorrectIntent: 1,
      jointIntentSlotsAccuracy: 1,
      taskSuccessRate: 1,
      top1CandidateAccuracy: 1,
      top2CandidateRecall: 1,
      autoExecutionEligibilityAccuracy: 1,
      noDirectActionRate: 1,
    });
  });

  it("separates intent and slot failures even when slots happen to match", () => {
    const sameSlotsWrongIntent = evaluateRecord(
      record({ intent: "browser.open", slots: { target: "GitHub" }, autoExecuteAllowed: true }),
      correction(candidate("wrong", "localApp.open", { target: "GitHub" })),
    );
    const correctIntentWrongSlot = evaluateRecord(
      record({ intent: "browser.open", slots: { target: "GitHub" }, autoExecuteAllowed: true }),
      correction(candidate("open.github", "browser.open", { target: "GitLab" })),
    );

    expect(sameSlotsWrongIntent.intentOk).toBe(false);
    expect(sameSlotsWrongIntent.slotOkAllSamples).toBe(true);
    expect(sameSlotsWrongIntent.slotOkGivenCorrectIntent).toBeNull();
    expect(correctIntentWrongSlot.intentOk).toBe(true);
    expect(correctIntentWrongSlot.slotOkAllSamples).toBe(false);
    expect(correctIntentWrongSlot.slotOkGivenCorrectIntent).toBe(false);
  });

  it("counts Top-2 recall independently from Top-1 accuracy", () => {
    const result = evaluateRecord(
      record({ intent: "browser.open", slots: { target: "GitHub" }, autoExecuteAllowed: true }),
      correction(
        candidate("open.gitlab", "browser.open", { target: "GitLab" }),
        candidate("open.github", "browser.open", { target: "GitHub" }),
      ),
    );

    expect(result.top1CandidateOk).toBe(false);
    expect(result.top2CandidateOk).toBe(true);
  });

  it("derives candidate applicability from expected outcome instead of resolver output", () => {
    const executable = record({ intent: "localApp.open", slots: { target: "vscode" } });
    const chat = record({ category: "negative", mode: "conversation", intent: "chat.answer", slots: {} });
    const clarify = record({ intent: "clarify", slots: {}, clarificationRequired: true });
    const blocked = record({ intent: "blocked", slots: {}, blocked: true, tags: ["dangerous"] });
    const dictation = record({ mode: "dictation", intent: "notepad.write_text", slots: { text: "hello" } });
    const blockedWithExecutableCandidate = evaluateRecord(
      blocked,
      correction(candidate("open.vscode", "localApp.open", { target: "vscode" })),
    );

    expect(outcomeClassForRecord(executable)).toBe("candidate_required");
    expect(outcomeClassForRecord(chat)).toBe("direct_non_action_decision");
    expect(outcomeClassForRecord(clarify)).toBe("clarification_expected");
    expect(outcomeClassForRecord(blocked)).toBe("blocked_expected");
    expect(outcomeClassForRecord(dictation)).toBe("direct_non_action_decision");
    expect(blockedWithExecutableCandidate.candidateRequired).toBe(false);
    expect(blockedWithExecutableCandidate.candidateFailureClass).toBe("not_applicable");
  });

  it("scopes candidate metrics to candidate-required records and keeps legacy all-sample metrics separate", () => {
    const rankOne = evaluateRecord(
      record({ intent: "localApp.open", slots: { target: "vscode" } }),
      correction(candidate("open.vscode", "localApp.open", { target: "vscode" })),
    );
    const rankTwo = evaluateRecord(
      record({ intent: "browser.open", slots: { target: "GitHub" } }),
      correction(
        candidate("open.gitlab", "browser.open", { target: "GitLab" }),
        candidate("open.github", "browser.open", { target: "GitHub" }),
      ),
    );
    const wrongSlot = evaluateRecord(
      record({ intent: "filesystem.search", slots: { query: "release notes" } }),
      correction(candidate("search.wrong", "filesystem.search", { query: "release" })),
    );
    const noCandidate = evaluateRecord(record({ intent: "window.focus", slots: { target: "notepad" } }), correction());
    const chat = evaluateRecord(
      record({ category: "negative", mode: "conversation", intent: "chat.answer", slots: {} }),
      nonCommandCorrection("conversation"),
    );
    const clarify = evaluateRecord(
      record({ intent: "clarify", slots: {}, clarificationRequired: true }),
      correction(undefined, undefined, { requiresUserSelection: true }),
    );
    const blocked = evaluateRecord(
      record({ intent: "blocked", slots: {}, blocked: true, tags: ["dangerous"] }),
      correction(candidate("blocked", "blocked", {})),
    );
    const results = [rankOne, rankTwo, wrongSlot, noCandidate, chat, clarify, blocked];
    const metrics = metricsFor(results);
    const candidateMetrics = candidateScopeMetrics(results, (result) => result.candidateRequired);

    expect(candidateMetrics.records).toBe(4);
    expect(candidateMetrics.top1CandidateAccuracy).toBe(0.25);
    expect(candidateMetrics.top2CandidateRecall).toBe(0.5);
    expect(candidateMetrics.noCandidateRate).toBe(0.25);
    expect(candidateMetrics.missingCandidateRate).toBe(0.25);
    expect(candidateMetrics.failureClasses).toMatchObject({
      expected_at_rank_1: 1,
      expected_at_rank_2: 1,
      candidate_correct_but_slot_incorrect: 1,
      no_candidates_returned: 1,
    });
    expect(metrics.legacyAllSampleTop2CandidateRecall).toBe(0.4286);
    expect(metrics.candidateRequiredTop2Recall).toBe(0.5);
    expect(metrics.nonCandidateOutcomeAccuracy).toBe(1);
  });

  it("separates Qwen rerank eligibility from candidate-required status and reports ranking gap", () => {
    const rerankable = evaluateRecord(
      record({ intent: "localApp.open", slots: { target: "vscode" } }),
      correction(
        candidate("open.notepad", "localApp.open", { target: "notepad" }),
        candidate("open.vscode", "localApp.open", { target: "vscode" }),
      ),
    );
    const statusReadOnly = evaluateRecord(
      record({ intent: "model.status", slots: {}, autoExecuteAllowed: true }),
      correction(candidate("status.model", "model.status", {})),
    );
    const blocked = evaluateRecord(
      record({ intent: "blocked", slots: {}, blocked: true, tags: ["dangerous"] }),
      correction(candidate("blocked", "blocked", {})),
    );
    const negative = evaluateRecord(
      record({ category: "negative", mode: "conversation", intent: "chat.answer", slots: {} }),
      nonCommandCorrection("conversation"),
    );
    const results = [rerankable, statusReadOnly, blocked, negative];
    const qwenMetrics = candidateScopeMetrics(results, (result) => result.qwenRerankEligible);

    expect(isQwenRerankEligibleRecord(resultToRecord(rerankable))).toBe(true);
    expect(isQwenRerankEligibleRecord(resultToRecord(statusReadOnly))).toBe(false);
    expect(rerankable.qwenRerankEligible).toBe(true);
    expect(statusReadOnly.candidateRequired).toBe(true);
    expect(statusReadOnly.qwenRerankEligible).toBe(false);
    expect(blocked.qwenRerankEligible).toBe(false);
    expect(negative.qwenRerankEligible).toBe(false);
    expect(qwenMetrics.records).toBe(1);
    expect(qwenMetrics.top1CandidateAccuracy).toBe(0);
    expect(qwenMetrics.top2CandidateRecall).toBe(1);
    expect(qwenMetrics.expectedInTopKButNotTop1).toBe(1);
    expect(qwenMetrics.rankingGapRate).toBe(1);
    expect(qwenMetrics.theoreticalMaxRerankGain).toBe(1);
  });

  it("reports not_available for empty candidate scopes", () => {
    const metrics = candidateScopeMetrics([], () => true);

    expect(metrics.records).toBe(0);
    expect(metrics.candidatePresenceRate).toBe("not_available");
    expect(metrics.top1CandidateAccuracy).toBe("not_available");
    expect(metrics.top2CandidateRecall).toBe("not_available");
    expect(metrics.rankingGapRate).toBe("not_available");
    expect(metrics.byIntent).toEqual({});
  });

  it("classifies no-candidate, unexpected clarification, and missed clarification", () => {
    const noCandidate = evaluateRecord(
      record({ intent: "localApp.open", slots: { target: "vscode" }, autoExecuteAllowed: true }),
      correction(),
    );
    const unexpectedClarification = evaluateRecord(
      record({ intent: "browser.open", slots: { target: "GitHub" }, autoExecuteAllowed: true }),
      correction(candidate("open.github", "browser.open", { target: "GitHub" }), undefined, {
        requiresUserSelection: true,
      }),
    );
    const missedClarification = evaluateRecord(
      record({
        intent: "clarify",
        slots: {},
        autoExecuteAllowed: false,
        clarificationRequired: true,
      }),
      correction(candidate("open.vscode", "localApp.open", { target: "vscode" })),
    );

    expect(noCandidate.errorCategories).toContain("no_candidate");
    expect(unexpectedClarification.errorCategories).toContain("unexpected_clarification");
    expect(missedClarification.errorCategories).toContain("missed_clarification");
  });

  it("classifies false block, missed block, and false auto-execution eligibility", () => {
    const falseBlock = evaluateRecord(
      record({ intent: "localApp.open", slots: { target: "vscode" }, autoExecuteAllowed: true }),
      correction(candidate("blocked", "blocked", {})),
    );
    const missedBlock = evaluateRecord(
      record({ intent: "blocked", slots: {}, blocked: true, tags: ["dangerous"] }),
      correction(candidate("open.vscode", "localApp.open", { target: "vscode" })),
    );

    expect(falseBlock.errorCategories).toContain("false_block");
    expect(missedBlock.errorCategories).toContain("missed_block");
    expect(missedBlock.errorCategories).toContain("dangerous_false_eligibility");
  });

  it("measures negative and safe-command eligibility mistakes", () => {
    const negativeFalseEligibility = evaluateRecord(
      record({
        category: "negative",
        mode: "conversation",
        intent: "chat.answer",
        slots: {},
        autoExecuteAllowed: false,
      }),
      correction(candidate("open.vscode", "localApp.open", { target: "vscode" }), undefined, {
        inputMode: "command",
      }),
    );
    const safeCommandMissedEligibility = evaluateRecord(
      record({ intent: "browser.open", slots: { target: "GitHub" }, autoExecuteAllowed: true }),
      correction(candidate("open.github", "browser.open", { target: "GitHub" }), undefined, {
        requiresUserSelection: true,
      }),
    );

    expect(negativeFalseEligibility.errorCategories).toContain("negative_false_eligibility");
    expect(safeCommandMissedEligibility.errorCategories).toContain("safe_command_missed_eligibility");
  });

  it("reports dictation and conversation mode safety errors", () => {
    const dictationError = evaluateRecord(
      record({ mode: "dictation", intent: "notepad.write_text", slots: { text: "hello" } }),
      correction(candidate("open.vscode", "localApp.open", { target: "vscode" }), undefined, {
        inputMode: "command",
      }),
    );
    const conversationError = evaluateRecord(
      record({ category: "negative", mode: "conversation", intent: "chat.answer", slots: {} }),
      correction(candidate("open.vscode", "localApp.open", { target: "vscode" }), undefined, {
        inputMode: "command",
      }),
    );
    const summary = metricsFor([dictationError, conversationError]);

    expect(summary.dictationToCommandErrorRate).toBe(1);
    expect(summary.conversationToExecutableCommandErrorRate).toBe(1);
  });

  it("uses strict slot equality with normalization, extra-slot failure, and deep plugin input comparison", () => {
    expect(slotsExactMatch({ target: "HTTPS://GitHub.com/" }, { target: "https://github.com" })).toBe(true);
    expect(slotsExactMatch({}, { extra: true })).toBe(false);
    expect(
      slotsExactMatch(
        { pluginId: "stock-analysis", capability: "stock.quote", input: { symbol: "AAPL", range: ["1d", "5d"] } },
        { capability: "stock.quote", pluginId: "stock-analysis", input: { range: ["1d", "5d"], symbol: "AAPL" } },
      ),
    ).toBe(true);
  });

  it("rejects strict matching counterexamples for top-k, clarification, block, aliases, plugins, and urls", () => {
    const cases = [
      evaluateRecord(
        record({ intent: "browser.open", slots: { target: "GitHub" }, autoExecuteAllowed: true }),
        correction(candidate("open.github.extra", "browser.open", { target: "GitHub", extra: true })),
      ),
      evaluateRecord(
        record({ intent: "browser.open", slots: { target: "GitHub" }, autoExecuteAllowed: true }),
        correction(candidate("open.gitlab", "browser.open", { target: "GitHub login" })),
      ),
      evaluateRecord(
        record({ intent: "browser.open", slots: { target: "GitHub" }, autoExecuteAllowed: true }),
        correction(candidate("open.local.github", "localApp.open", { target: "GitHub" })),
      ),
      evaluateRecord(
        record({ intent: "filesystem.search", slots: { query: "release notes" }, autoExecuteAllowed: true }),
        correction(candidate("search.textual", "chat.answer", { query: "release notes" })),
      ),
      evaluateRecord(
        record({ intent: "localApp.open", slots: { target: "notepad" }, autoExecuteAllowed: true }),
        correction(undefined, undefined, { requiresUserSelection: true }),
      ),
      evaluateRecord(
        record({ intent: "clarify", slots: {}, clarificationRequired: true, autoExecuteAllowed: false }),
        correction(candidate("blocked", "blocked", {})),
      ),
      evaluateRecord(
        record({ intent: "browser.open", slots: { target: "Admin console" }, autoExecuteAllowed: true }),
        correction(candidate("route.alias", "browser.open", { target: "Admin console staging" })),
      ),
      evaluateRecord(
        record({
          intent: "plugin.invoke",
          slots: { pluginId: "readonly", capability: "example.status", input: { scope: "summary" } },
          autoExecuteAllowed: true,
        }),
        correction(candidate("plugin.readonly", "plugin.invoke", { pluginId: "readonly", capability: "example.status", input: {} })),
      ),
      evaluateRecord(
        record({ intent: "browser.open", slots: { target: "https://github.com" }, autoExecuteAllowed: true }),
        correction(candidate("open.url", "browser.open", { target: "https://github.com.evil.test" })),
      ),
      evaluateRecord(
        record({ intent: "observability.status", slots: {}, autoExecuteAllowed: true }),
        correction(candidate("status.extra", "observability.status", { target: "system" })),
      ),
    ];

    for (const result of cases) {
      expect(result.taskSuccess).toBe(false);
      expect(result.top1CandidateOk).toBe(false);
    }
  });

  it("aggregates category and split metrics and handles zero denominators explicitly", () => {
    const result = evaluateRecord(
      record({ split: "dev", category: "negative", mode: "conversation", intent: "chat.answer", slots: {} }),
      nonCommandCorrection("conversation"),
    );
    const summary = summarizeResults([result], [resultToRecord(result)], {
      split: "dev",
      datasetDigest: "digest",
      gitCommit: "commit",
    });

    expect(summary.bySplit.dev.records).toBe(1);
    expect(summary.byCategory.negative.records).toBe(1);
    expect(metricsFor([]).slotExactMatchGivenCorrectIntent).toBe("not_available");
    expect(metricsFor([]).safeNonExecutionRate).toBe("not_available");
  });

  it("keeps dataset digest stable, reads JSONL, and does not mutate evaluator input", () => {
    const path = join(tmpdir(), `voice-eval-${Date.now()}.jsonl`);
    const sample = record({ id: "sample-1", rawTranscript: "打开 VS Code" });
    mkdirSync(tmpdir(), { recursive: true });
    writeFileSync(path, `${JSON.stringify(sample)}\n`);
    const before = JSON.stringify(sample);

    expect(readJsonl(path)).toHaveLength(1);
    expect(sha256File(path)).toBe(sha256File(path));
    evaluateRecord(sample, correction(candidate("open.vscode", "localApp.open", { target: "vscode" })));
    expect(JSON.stringify(sample)).toBe(before);
  });

  it("audits duplicates, privacy, and suspicious labels without using executors or side effects", () => {
    const records = [
      record({ id: "a", rawTranscript: "打开 VS Code", intent: "localApp.open", slots: { target: "vscode" } }),
      record({ id: "b", rawTranscript: "打开 VS Code", intent: "localApp.open", slots: { target: "vscode" } }),
      record({ id: "c", rawTranscript: "我的邮箱是 test@example.com", intent: "chat.answer", slots: {}, category: "negative", mode: "conversation" }),
      record({ id: "d", rawTranscript: "打开未知应用", intent: "localApp.open", slots: { target: "unknown" } }),
    ];

    const audit = auditDataset(records);

    expect(audit.duplicateRawTranscriptCount).toBe(1);
    expect(audit.privacy.hitCount).toBe(1);
    expect(audit.suspiciousSampleIds).toContain("d");
  });
});

function record(overrides = {}) {
  const intent = overrides.intent ?? "localApp.open";
  const slots = overrides.slots ?? { target: "vscode" };
  return {
    id: overrides.id ?? "zh-cn-test",
    schemaVersion: 1,
    split: overrides.split ?? "train",
    category: overrides.category ?? "normal_command",
    subcategory: overrides.subcategory ?? "unit",
    provenance: overrides.provenance ?? "synthetic_curated",
    locale: "zh-CN",
    rawTranscript: overrides.rawTranscript ?? "打开 VS Code",
    intendedText: overrides.intendedText ?? "打开 VS Code",
    mode: overrides.mode ?? "command",
    context: overrides.context ?? {
      activeWindow: null,
      installedApps: ["vscode", "notepad", "calculator"],
      enabledPlugins: [],
      routeAliases: [],
      voiceAliases: [],
    },
    expected: {
      acceptableCandidateIds: overrides.acceptableCandidateIds ?? [],
      autoExecuteAllowed: overrides.autoExecuteAllowed ?? false,
      clarificationRequired: overrides.clarificationRequired ?? false,
      blocked: overrides.blocked ?? false,
      intent,
      slots,
    },
    tags: overrides.tags ?? [],
  };
}

function resultToRecord(result) {
  return record({
    id: result.id,
    split: result.split,
    category: result.category,
    subcategory: result.subcategory,
    provenance: result.provenance,
    mode: result.mode,
    intent: result.expected.intent,
    slots: result.expected.slots,
    autoExecuteAllowed: result.expected.autoExecuteAllowed,
    clarificationRequired: result.expected.clarificationRequired,
    blocked: result.expected.blocked,
  });
}

function candidate(id, intent, slots, confidence = 0.98) {
  return {
    id,
    normalizedTranscript: id,
    inputMode: "command",
    intent,
    confidence,
    correctionSource: "alias",
    label: id,
    slots,
  };
}

function correction(first, second, overrides = {}) {
  const candidates = [first, second].filter(Boolean);
  return {
    rawTranscript: "raw",
    normalizedTranscript: candidates[0]?.normalizedTranscript ?? "raw",
    inputMode: overrides.inputMode ?? "command",
    correctionSource: "alias",
    correctionConfidence: candidates[0]?.confidence ?? 0,
    correctionCandidates: candidates,
    requiresUserSelection: overrides.requiresUserSelection ?? false,
    rawTranscriptPreserved: true,
    directActionAttempted: false,
  };
}

function nonCommandCorrection(inputMode) {
  return {
    rawTranscript: "raw",
    normalizedTranscript: "raw",
    inputMode,
    correctionSource: "raw",
    correctionConfidence: 1,
    correctionCandidates: [],
    requiresUserSelection: false,
    rawTranscriptPreserved: true,
    directActionAttempted: false,
  };
}
