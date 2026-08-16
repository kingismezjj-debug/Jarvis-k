import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditDataset,
  evaluateRecord,
  metricsFor,
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
