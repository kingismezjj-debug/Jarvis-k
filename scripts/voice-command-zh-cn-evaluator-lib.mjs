import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { execFileSync } from "node:child_process";
import os from "node:os";

export const benchmarkName = "voice-command-zh-cn-v1";
export const defaultDatasetPath = "datasets/voice-command-zh-cn-v1.jsonl";
export const supportedSplits = new Set(["all", "train", "dev", "test"]);

const autoEligibleLocalApps = new Set(["vscode", "notepad", "calculator"]);
const autoEligibleIntents = new Set([
  "browser.open",
  "filesystem.search",
  "plugin.invoke",
  "memory.search",
  "observability.status",
  "model.status",
]);
const executableIntents = new Set([
  "localApp.open",
  "browser.open",
  "filesystem.search",
  "notepad.write_text",
  "window.focus",
  "window.minimize",
  "window.restore",
  "plugin.invoke",
  "coding.task",
  "memory.search",
  "observability.status",
  "model.status",
]);
const validIntents = new Set([
  ...executableIntents,
  "chat.answer",
  "clarify",
  "blocked",
]);

export function parseArgs(argv) {
  const options = {
    split: "dev",
    datasetPath: defaultDatasetPath,
    reportPrefix: "reports/voice-command-zh-cn-v1-baseline",
    warmupRuns: 2,
    performanceRuns: 3,
  };
  for (const arg of argv) {
    if (arg.startsWith("--split=")) {
      options.split = arg.slice("--split=".length);
    } else if (arg.startsWith("--dataset=")) {
      options.datasetPath = arg.slice("--dataset=".length);
    } else if (arg.startsWith("--report-prefix=")) {
      options.reportPrefix = arg.slice("--report-prefix=".length);
    } else if (arg.startsWith("--warmup-runs=")) {
      options.warmupRuns = Number(arg.slice("--warmup-runs=".length));
    } else if (arg.startsWith("--performance-runs=")) {
      options.performanceRuns = Number(arg.slice("--performance-runs=".length));
    }
  }
  if (!supportedSplits.has(options.split)) {
    throw new Error(`Unsupported split ${options.split}. Use train, dev, test, or all.`);
  }
  return options;
}

export function readJsonl(path) {
  return readFileSync(path, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at ${path}:${index + 1}: ${error.message}`);
      }
    });
}

export function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function currentGitCommit() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "not_available";
  }
}

export function filterRecordsBySplit(records, split) {
  return split === "all" ? records : records.filter((record) => record.split === split);
}

export function runResolverBenchmark(records, resolver) {
  return records.map((record) => {
    const start = performance.now();
    const correction = resolver.resolve({
      rawTranscript: record.rawTranscript,
      requestedMode: record.mode,
      aliases: record.context.voiceAliases ?? [],
      routeAliases: record.context.routeAliases ?? [],
      pluginCapabilities: record.context.enabledPlugins ?? [],
    });
    const latencyMs = performance.now() - start;
    return evaluateRecord(record, correction, latencyMs);
  });
}

export function evaluateRecord(record, correction, latencyMs = 0) {
  const candidateCount = correction.correctionCandidates.length;
  const topCandidate = correction.correctionCandidates[0] ?? null;
  const topTwoCandidates = correction.correctionCandidates.slice(0, 2);
  const top1CandidateOk = candidateMatches(record, topCandidate);
  const top2CandidateOk = topTwoCandidates.some((candidate) => candidateMatches(record, candidate));
  const prediction = projectPrediction(record, correction, topCandidate);
  const intentOk = prediction.intent === record.expected.intent;
  const slotOkAllSamples = slotsExactMatch(record.expected.slots ?? {}, prediction.slots ?? {});
  const slotOkGivenCorrectIntent = intentOk ? slotOkAllSamples : null;
  const jointIntentSlotsOk = intentOk && slotOkAllSamples;
  const clarificationOk = Boolean(record.expected.clarificationRequired) === prediction.clarificationRequired;
  const blockedOk = Boolean(record.expected.blocked) === prediction.blocked;
  const eligibilityOk = Boolean(record.expected.autoExecuteAllowed) === prediction.eligibleForAutoExecution;
  const taskSuccess = intentOk && slotOkAllSamples && clarificationOk && blockedOk && eligibilityOk;
  const safeNonExecutionOk = !isRisky(record) || prediction.eligibleForAutoExecution === false;
  const errorCategories = classifyErrors({
    record,
    prediction,
    correction,
    intentOk,
    slotOkAllSamples,
    clarificationOk,
    blockedOk,
    eligibilityOk,
    safeNonExecutionOk,
  });

  return {
    id: record.id,
    split: record.split,
    category: record.category,
    subcategory: record.subcategory,
    mode: record.mode,
    provenance: record.provenance,
    risk: riskForRecord(record),
    rawTranscript: record.rawTranscript,
    expected: record.expected,
    prediction,
    resolver: {
      inputMode: correction.inputMode,
      correctionSource: correction.correctionSource,
      correctionConfidence: correction.correctionConfidence,
      requiresUserSelection: correction.requiresUserSelection,
      directActionAttempted: correction.directActionAttempted,
      candidateCount,
      topCandidateId: topCandidate?.id ?? null,
      topCandidateIntent: topCandidate?.intent ?? null,
    },
    latencyMs,
    intentOk,
    slotOkAllSamples,
    slotOkGivenCorrectIntent,
    jointIntentSlotsOk,
    top1CandidateOk,
    top2CandidateOk,
    clarificationOk,
    blockedOk,
    eligibilityOk,
    safeNonExecutionOk,
    taskSuccess,
    errorCategories,
  };
}

export function projectPrediction(record, correction, topCandidate) {
  if (correction.inputMode === "conversation") {
    return {
      intent: "chat.answer",
      slots: {},
      eligibleForAutoExecution: false,
      clarificationRequired: false,
      blocked: false,
    };
  }
  if (correction.inputMode === "dictation") {
    return {
      intent: "notepad.write_text",
      slots: { text: stripDictationPrefix(correction.normalizedTranscript) },
      eligibleForAutoExecution: false,
      clarificationRequired: false,
      blocked: false,
    };
  }
  if (!topCandidate) {
    return {
      intent: "clarify",
      slots: {},
      eligibleForAutoExecution: false,
      clarificationRequired: true,
      blocked: false,
    };
  }
  if (correction.requiresUserSelection) {
    return {
      intent: "clarify",
      slots: {},
      eligibleForAutoExecution: false,
      clarificationRequired: true,
      blocked: false,
    };
  }
  return {
    intent: topCandidate.intent,
    slots: topCandidate.slots,
    eligibleForAutoExecution: isResolverAutoEligible(topCandidate.intent, topCandidate.slots),
    clarificationRequired: false,
    blocked: topCandidate.intent === "blocked",
  };
}

export function summarizeResults(results, records, options = {}) {
  const audit = options.audit ?? auditDataset(records);
  const split = options.split ?? "all";
  const datasetDigest = options.datasetDigest ?? "not_available";
  const gitCommit = options.gitCommit ?? "not_available";
  const performanceSummary = options.performanceSummary ?? performanceMetrics(results.map((result) => result.latencyMs));
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    benchmark: benchmarkName,
    evaluatorVersion: 2,
    split,
    executionLayer: "resolver_only",
    realWindowsExecution: false,
    microphoneUsed: false,
    asrProviderUsed: false,
    qwenUsed: false,
    executorUsed: false,
    resolverRulesModifiedForBenchmark: false,
    gitCommit,
    datasetDigest,
    records: results.length,
    dataset: {
      path: options.datasetPath ?? defaultDatasetPath,
      totalRecords: records.length,
      categories: countBy(records, (record) => record.category),
      subcategories: countBy(records, (record) => record.subcategory),
      splits: countBy(records, (record) => record.split),
      modes: countBy(records, (record) => record.mode),
      provenance: countBy(records, (record) => record.provenance ?? "unknown"),
    },
    metricDefinitions: metricDefinitions(),
    metrics: metricsFor(results),
    bySplit: groupMetrics(results, (result) => result.split),
    byCategory: groupMetrics(results, (result) => result.category),
    bySubcategory: groupMetrics(results, (result) => result.subcategory),
    byMode: groupMetrics(results, (result) => result.mode),
    byIntent: groupMetrics(results, (result) => result.expected.intent),
    byRisk: groupMetrics(results, (result) => result.risk),
    byProvenance: groupMetrics(results, (result) => result.provenance ?? "unknown"),
    topK: topKMetrics(results),
    performance: performanceSummary,
    errorCategories: countMany(results.flatMap((result) => result.errorCategories)),
    topErrors: topConfusions(results),
    audit,
    reportArtifacts: reportArtifactsForSplit(split),
  };
}

export function metricDefinitions() {
  return {
    intentAccuracy: "Predicted resolver-layer intent equals expected intent.",
    slotExactMatchAllSamples: "Strict normalized expected slots equal predicted slots for every sample; extra slots fail.",
    slotExactMatchGivenCorrectIntent: "Strict slot exact match over samples whose intent is correct; denominator zero returns not_available.",
    jointIntentSlotsAccuracy: "Intent accuracy and slot exact match both true.",
    taskSuccessRate: "Resolver-only exact success: intent, slots, clarification, block, and auto-execution eligibility all match expected.",
    top1CandidateAccuracy: "First resolver candidate matches expected by candidate id or intent+slots. Clarification text is not a candidate.",
    top2CandidateRecall: "Any of the first two resolver candidates matches expected by candidate id or intent+slots.",
    autoExecutionEligibilityAccuracy: "Resolver candidate eligibility matches expected autoExecuteAllowed. This is not product execution.",
    safeNonExecutionRate: "Risky samples are not marked eligible for auto execution by resolver-layer policy.",
    noDirectActionRate: "Resolver invariant: directActionAttempted is false. It is not an auto-execution success metric.",
  };
}

export function metricsFor(results) {
  const clarification = precisionRecallF1(
    results,
    (result) => result.prediction.clarificationRequired,
    (result) => Boolean(result.expected.clarificationRequired),
  );
  const block = precisionRecallF1(
    results,
    (result) => result.prediction.blocked,
    (result) => Boolean(result.expected.blocked),
  );
  const dangerous = results.filter((result) => result.risk === "dangerous");
  const negative = results.filter((result) => result.category === "negative");
  const safeCommands = results.filter((result) => result.expected.autoExecuteAllowed);
  const dictation = results.filter((result) => result.mode === "dictation");
  const conversation = results.filter((result) => result.mode === "conversation");
  const command = results.filter((result) => result.mode === "command");

  return {
    records: results.length,
    intentAccuracy: rate(results, (result) => result.intentOk),
    slotExactMatchAllSamples: rate(results, (result) => result.slotOkAllSamples),
    slotExactMatchGivenCorrectIntent: nullableRate(
      results.filter((result) => result.intentOk),
      (result) => result.slotOkAllSamples,
    ),
    jointIntentSlotsAccuracy: rate(results, (result) => result.jointIntentSlotsOk),
    taskSuccessRate: rate(results, (result) => result.taskSuccess),
    top1CandidateAccuracy: rate(results, (result) => result.top1CandidateOk),
    top2CandidateRecall: rate(results, (result) => result.top2CandidateOk),
    clarificationPrecision: clarification.precision,
    clarificationRecall: clarification.recall,
    clarificationF1: clarification.f1,
    unexpectedClarification: results.filter((result) => result.errorCategories.includes("unexpected_clarification")).length,
    missedClarification: results.filter((result) => result.errorCategories.includes("missed_clarification")).length,
    blockPrecision: block.precision,
    blockRecall: block.recall,
    blockF1: block.f1,
    falseBlock: results.filter((result) => result.errorCategories.includes("false_block")).length,
    missedBlock: results.filter((result) => result.errorCategories.includes("missed_block")).length,
    autoExecutionEligibilityAccuracy: rate(results, (result) => result.eligibilityOk),
    dangerousFalseEligibilityRate: nullableRate(dangerous, (result) => result.prediction.eligibleForAutoExecution),
    negativeFalseEligibilityRate: nullableRate(negative, (result) => result.prediction.eligibleForAutoExecution),
    safeCommandMissedEligibilityRate: nullableRate(safeCommands, (result) => !result.prediction.eligibleForAutoExecution),
    safeNonExecutionRate: nullableRate(results.filter(isRiskyResult), (result) => result.safeNonExecutionOk),
    noDirectActionRate: rate(results, (result) => result.resolver.directActionAttempted === false),
    dictationToCommandErrorRate: nullableRate(dictation, (result) => executableIntents.has(result.prediction.intent) && result.prediction.intent !== "notepad.write_text"),
    conversationToExecutableCommandErrorRate: nullableRate(conversation, (result) => executableIntents.has(result.prediction.intent)),
    commandToConversationErrorRate: nullableRate(command, (result) => result.prediction.intent === "chat.answer"),
  };
}

export function topKMetrics(results) {
  const withCandidate = results.filter((result) => result.resolver.candidateCount > 0);
  const withoutCandidate = results.filter((result) => result.resolver.candidateCount === 0);
  const singleCandidate = results.filter((result) => result.resolver.candidateCount === 1);
  const multipleCandidates = results.filter((result) => result.resolver.candidateCount > 1);
  return {
    withCandidate: withCandidate.length,
    withoutCandidate: withoutCandidate.length,
    singleCandidate: singleCandidate.length,
    multipleCandidates: multipleCandidates.length,
    top1CandidateAccuracy: rate(results, (result) => result.top1CandidateOk),
    top2CandidateRecall: rate(results, (result) => result.top2CandidateOk),
    averageCandidateCount: round(
      results.reduce((sum, result) => sum + result.resolver.candidateCount, 0) /
        Math.max(results.length, 1),
    ),
  };
}

export function measureResolverPerformance(records, resolver, options = {}) {
  const warmupRuns = options.warmupRuns ?? 2;
  const performanceRuns = options.performanceRuns ?? 3;
  const coldStart = measureOnePass(records, resolver);
  for (let index = 0; index < warmupRuns; index += 1) {
    measureOnePass(records, resolver);
  }
  const runs = [];
  for (let index = 0; index < performanceRuns; index += 1) {
    runs.push(measureOnePass(records, resolver));
  }
  const latencies = runs.flatMap((run) => run.latenciesMs);
  return {
    nodeVersion: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    recordsPerRun: records.length,
    warmupRuns,
    performanceRuns,
    coldStartMs: round(coldStart.totalMs),
    warmAverageMs: round(latencies.reduce((sum, value) => sum + value, 0) / Math.max(latencies.length, 1)),
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    maxMs: round(Math.max(...latencies, 0)),
    throughputPerSecond: round((records.length * performanceRuns * 1000) / Math.max(runs.reduce((sum, run) => sum + run.totalMs, 0), 1)),
    runTotalMs: runs.map((run) => round(run.totalMs)),
  };
}

export function auditDataset(records) {
  const rawCounts = countBy(records, (record) => record.rawTranscript);
  const rawContextCounts = countBy(records, (record) => `${record.rawTranscript}\u0000${stableStringify(record.context)}`);
  const normalizedCounts = countBy(records, (record) => normalizeAuditText(record.rawTranscript));
  const groupCounts = countBy(records, deriveGroupId);
  const categoryGroupIds = {};
  for (const record of records) {
    const groupId = deriveGroupId(record);
    categoryGroupIds[record.category] ??= new Set();
    categoryGroupIds[record.category].add(groupId);
  }
  const similarPairs = findSimilarPairs(records, 0.9);
  const suspicious = findSuspiciousLabels(records);
  const privacy = privacyAudit(records);
  const sentencePatterns = countBy(records, (record) => sentencePattern(record.rawTranscript));
  const crossSplitSimilarPairs = similarPairs.filter((pair) => pair.leftSplit !== pair.rightSplit);
  const crossSplitGroups = Object.entries(groupRecords(records)).filter(([, group]) => new Set(group.map((record) => record.split)).size > 1);
  const highFrequencySentencePatterns = Object.entries(sentencePatterns)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)
    .map(([pattern, count]) => ({ pattern, count }));

  return {
    duplicateRawTranscriptCount: duplicateCount(rawCounts),
    duplicateRawTranscriptContextCount: duplicateCount(rawContextCounts),
    duplicateNormalizedTranscriptCount: duplicateCount(normalizedCounts),
    similarPairsAtOrAbove090: similarPairs.length,
    crossSplitSimilarPairs: crossSplitSimilarPairs.length,
    uniqueGroupIds: Object.keys(groupCounts).length,
    maxGroupSize: Math.max(...Object.values(groupCounts), 0),
    groupCounts,
    categoryUniqueGroupIds: Object.fromEntries(
      Object.entries(categoryGroupIds).map(([category, ids]) => [category, ids.size]),
    ),
    crossSplitGroupCount: crossSplitGroups.length,
    crossSplitGroupIds: crossSplitGroups.slice(0, 50).map(([groupId]) => groupId),
    highFrequencySentencePatterns,
    templateLikeGroupCount: Object.values(groupCounts).filter((count) => count >= 8).length,
    onlyEntityReplacementGroupCount: Object.entries(groupCounts).filter(
      ([groupId, count]) => count >= 4 && /\{entity\}|\{url\}|\{number\}/u.test(groupId),
    ).length,
    splitDistribution: distributionBy(records, "split"),
    categoryBySplit: nestedCount(records, (record) => record.split, (record) => record.category),
    modeBySplit: nestedCount(records, (record) => record.split, (record) => record.mode),
    riskBySplit: nestedCount(records, (record) => record.split, riskForRecord),
    intentBySplit: nestedCount(records, (record) => record.split, (record) => record.expected.intent),
    provenance: countBy(records, (record) => record.provenance ?? "unknown"),
    privacy,
    suspiciousSampleCount: suspicious.length,
    suspiciousSampleIds: suspicious.map((item) => item.id),
    suspiciousSamples: suspicious.slice(0, 100),
  };
}

export function findSuspiciousLabels(records) {
  const suspicious = [];
  for (const record of records) {
    const intent = record.expected?.intent;
    const slots = record.expected?.slots ?? {};
    if (!validIntents.has(intent)) {
      suspicious.push({ id: record.id, reason: "unknown_intent", intent });
    }
    if (intent === "localApp.open" && !record.context.installedApps.includes(String(slots.target))) {
      suspicious.push({ id: record.id, reason: "local_app_target_not_installed", target: slots.target });
    }
    if (intent === "plugin.invoke") {
      const enabled = record.context.enabledPlugins.some(
        (plugin) => plugin.pluginId === slots.pluginId && plugin.capability === slots.capability,
      );
      if (!enabled) {
        suspicious.push({ id: record.id, reason: "plugin_not_enabled", pluginId: slots.pluginId, capability: slots.capability });
      }
    }
    if (record.mode === "conversation" && record.expected.autoExecuteAllowed) {
      suspicious.push({ id: record.id, reason: "conversation_auto_execute_allowed" });
    }
    if (record.mode === "dictation" && intent !== "notepad.write_text") {
      suspicious.push({ id: record.id, reason: "dictation_not_write_text", intent });
    }
    if (record.tags?.includes("dangerous") && record.expected.autoExecuteAllowed) {
      suspicious.push({ id: record.id, reason: "dangerous_auto_execute_allowed" });
    }
    if (record.expected.blocked && record.expected.clarificationRequired) {
      suspicious.push({ id: record.id, reason: "blocked_and_clarification_required" });
    }
    if (record.expected.blocked && intent !== "blocked") {
      suspicious.push({ id: record.id, reason: "blocked_flag_without_blocked_intent", intent });
    }
    if (intent === "clarify" && !record.expected.clarificationRequired) {
      suspicious.push({ id: record.id, reason: "clarify_intent_without_clarification_required" });
    }
  }
  return suspicious;
}

export function privacyAudit(records) {
  const checks = [
    ["phone", /(?:\+?86[-\s]?)?1[3-9]\d{9}/u],
    ["email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu],
    ["api_key", /(sk-[A-Za-z0-9]{20,}|api[_-]?key|secret|credential|token\s*[:=])/iu],
    ["windows_private_path", /C:\\Users\\(?!Administrator\\Documents\\Jarvis-k)[^\\\s]+/iu],
    ["address_like", /\d{2,}号|[A-Za-z0-9._%+-]+\s+(street|road|avenue|lane)/iu],
  ];
  const hits = [];
  for (const record of records) {
    const text = stableStringify(record);
    for (const [kind, pattern] of checks) {
      if (pattern.test(text)) {
        hits.push({ id: record.id, kind });
      }
    }
  }
  return {
    hitCount: hits.length,
    hits,
  };
}

export function renderMarkdown(summary) {
  const metricEntries = Object.entries(summary.metrics).map(([key, value]) => `- ${key}: ${formatMetric(value)}`);
  const topErrorEntries = Object.entries(summary.errorCategories)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([key, value]) => `- ${key}: ${value}`);
  return [
    `# ${summary.benchmark ?? benchmarkName} Baseline`,
    "",
    `Generated: ${summary.generatedAt}`,
    `Git commit: ${summary.gitCommit}`,
    `Dataset digest: ${summary.datasetDigest}`,
    `Evaluator version: ${summary.evaluatorVersion}`,
    "",
    "## Scope",
    "",
    "- Execution layer: resolver_only",
    "- Real Windows execution: false",
    "- Microphone used: false",
    "- ASR provider used: false",
    "- Qwen used: false",
    "- Product executor used: false",
    "- Resolver rules modified for benchmark: false",
    "",
    "## Dataset",
    "",
    `- Selected split: ${summary.split}`,
    `- Evaluated records: ${summary.records}`,
    `- Total records: ${summary.dataset.totalRecords}`,
    `- Splits: ${JSON.stringify(summary.dataset.splits)}`,
    `- Categories: ${JSON.stringify(summary.dataset.categories)}`,
    `- Modes: ${JSON.stringify(summary.dataset.modes)}`,
    `- Provenance: ${JSON.stringify(summary.dataset.provenance)}`,
    "",
    "## Split Policy",
    "",
    "- train: development-visible examples for rule work.",
    "- dev: comparison split for threshold and rule selection.",
    "- test: locked final evaluation split; Phase 2 daily optimization should not inspect per-sample test errors.",
    "- validation naming is represented by dev to keep the public split vocabulary short.",
    "- test changes require a benchmark version bump or a documented audit repair with the previous digest preserved.",
    "",
    "## Metric Definitions",
    "",
    ...Object.entries(summary.metricDefinitions).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Metrics",
    "",
    ...metricEntries,
    "",
    "## Top-k",
    "",
    ...Object.entries(summary.topK).map(([key, value]) => `- ${key}: ${formatMetric(value)}`),
    "",
    "## Performance",
    "",
    ...Object.entries(summary.performance).map(([key, value]) => `- ${key}: ${Array.isArray(value) ? JSON.stringify(value) : value}`),
    "",
    "## Split Metrics",
    "",
    ...renderMetricMap(summary.bySplit),
    "",
    "## Category Metrics",
    "",
    ...renderMetricMap(summary.byCategory),
    "",
    "## Mode Metrics",
    "",
    ...renderMetricMap(summary.byMode),
    "",
    "## Risk Metrics",
    "",
    ...renderMetricMap(summary.byRisk),
    "",
    "## Error Top 10",
    "",
    ...topErrorEntries,
    "",
    "## Audit",
    "",
    `- Duplicate raw transcripts: ${summary.audit.duplicateRawTranscriptCount}`,
    `- Duplicate raw+context: ${summary.audit.duplicateRawTranscriptContextCount}`,
    `- Duplicate normalized transcripts: ${summary.audit.duplicateNormalizedTranscriptCount}`,
    `- Similar pairs >= 0.90: ${summary.audit.similarPairsAtOrAbove090}`,
    `- Cross-split similar pairs: ${summary.audit.crossSplitSimilarPairs}`,
    `- Unique derived group IDs: ${summary.audit.uniqueGroupIds}`,
    `- Max group size: ${summary.audit.maxGroupSize}`,
    `- Cross-split derived groups: ${summary.audit.crossSplitGroupCount}`,
    `- Template-like groups: ${summary.audit.templateLikeGroupCount}`,
    `- Privacy hits: ${summary.audit.privacy.hitCount}`,
    `- Suspicious label samples: ${summary.audit.suspiciousSampleCount}`,
    `- Suspicious sample IDs: ${summary.audit.suspiciousSampleIds.join(", ") || "none"}`,
    "",
    "## Limitations",
    "",
    "- This benchmark uses text transcripts only; it contains no real ASR audio.",
    "- It does not call Qwen, ASR providers, microphones, Windows Executor, or product runtime execution.",
    "- safeNonExecutionRate means risky samples were not marked resolver-eligible for auto execution; it is not inferred from the absence of an executor.",
    "- noDirectActionRate is an invariant for this resolver layer and should remain 1.",
    "",
  ].join("\n");
}

function reportArtifactsForSplit(split) {
  const suffix = split === "all" ? "" : `-${split}`;
  return {
    json: `reports/voice-command-zh-cn-v1-baseline${suffix}.json`,
    markdown: `reports/voice-command-zh-cn-v1-baseline${suffix}.md`,
    errorsJsonl: `reports/voice-command-zh-cn-v1-errors${suffix}.jsonl`,
  };
}

function classifyErrors(input) {
  const errors = [];
  if (input.correction.directActionAttempted) errors.push("resolver_attempted_direct_action");
  if (!input.correction.correctionCandidates.length && input.record.mode === "command") errors.push("no_candidate");
  if (!input.intentOk) errors.push("intent_mismatch");
  if (!input.slotOkAllSamples) errors.push("slot_mismatch");
  if (!input.clarificationOk) errors.push(input.prediction.clarificationRequired ? "unexpected_clarification" : "missed_clarification");
  if (!input.blockedOk) errors.push(input.prediction.blocked ? "false_block" : "missed_block");
  if (!input.eligibilityOk) {
    if (input.prediction.eligibleForAutoExecution) errors.push("unsafe_eligibility");
    else errors.push("missed_eligibility");
  }
  if (!input.safeNonExecutionOk) errors.push("dangerous_false_eligibility");
  if (input.record.category === "negative" && input.prediction.eligibleForAutoExecution) errors.push("negative_false_eligibility");
  if (input.record.expected.autoExecuteAllowed && !input.prediction.eligibleForAutoExecution) errors.push("safe_command_missed_eligibility");
  if (input.record.expected.intent === "plugin.invoke" && input.prediction.intent !== "plugin.invoke") errors.push("plugin_not_resolved");
  if (input.record.expected.intent?.startsWith?.("window.") && input.prediction.intent !== input.record.expected.intent) errors.push("window_control_not_supported");
  if (input.record.expected.intent === "notepad.write_text" && input.record.mode === "command" && input.prediction.intent !== "notepad.write_text") errors.push("write_text_command_not_supported");
  return [...new Set(errors)];
}

function stripDictationPrefix(text) {
  return text.replace(/^(听写：|帮我记：)/u, "").replace(/[。?!？！]$/u, "").trim();
}

function isResolverAutoEligible(intent, slots) {
  if (intent === "localApp.open") {
    return autoEligibleLocalApps.has(String(slots?.target ?? ""));
  }
  return autoEligibleIntents.has(intent);
}

function candidateMatches(record, candidate) {
  if (!candidate) return false;
  if (record.expected.acceptableCandidateIds?.includes(candidate.id)) return true;
  return candidate.intent === record.expected.intent && slotsExactMatch(record.expected.slots ?? {}, candidate.slots ?? {});
}

export function slotsExactMatch(expected, actual) {
  return stableStringify(normalizeSlotValue(expected)) === stableStringify(normalizeSlotValue(actual ?? {}));
}

function normalizeSlotValue(value) {
  if (Array.isArray(value)) return value.map(normalizeSlotValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeSlotValue(entry)]),
    );
  }
  if (typeof value === "string") {
    if (/^https?:\/\//iu.test(value) || /\.[a-z]{2,}/iu.test(value)) {
      return value.normalize("NFKC").trim().toLowerCase().replace(/\/+$/u, "");
    }
    return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
  }
  if (typeof value === "number") return Number(value);
  return value;
}

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function groupMetrics(results, selector) {
  const groups = new Map();
  for (const result of results) {
    const key = selector(result);
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }
  return Object.fromEntries([...groups.entries()].map(([key, group]) => [key, metricsFor(group)]));
}

function renderMetricMap(metricMap) {
  return Object.entries(metricMap).map(
    ([key, metrics]) =>
      `- ${key}: intent=${formatMetric(metrics.intentAccuracy)}, joint=${formatMetric(metrics.jointIntentSlotsAccuracy)}, task=${formatMetric(metrics.taskSuccessRate)}, eligibility=${formatMetric(metrics.autoExecutionEligibilityAccuracy)}`,
  );
}

function precisionRecallF1(results, predicted, expected) {
  const tp = results.filter((result) => predicted(result) && expected(result)).length;
  const fp = results.filter((result) => predicted(result) && !expected(result)).length;
  const fn = results.filter((result) => !predicted(result) && expected(result)).length;
  const precision = tp + fp === 0 ? "not_available" : round(tp / (tp + fp));
  const recall = tp + fn === 0 ? "not_available" : round(tp / (tp + fn));
  const f1 =
    typeof precision === "number" && typeof recall === "number" && precision + recall > 0
      ? round((2 * precision * recall) / (precision + recall))
      : "not_available";
  return { precision, recall, f1 };
}

function rate(results, predicate) {
  if (results.length === 0) return 0;
  return round(results.filter(predicate).length / results.length);
}

function nullableRate(results, predicate) {
  if (results.length === 0) return "not_available";
  return rate(results, predicate);
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function countMany(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function topConfusions(results) {
  const pairs = countBy(
    results.filter((result) => !result.intentOk),
    (result) => `${result.expected.intent} -> ${result.prediction.intent}`,
  );
  return Object.entries(pairs)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)
    .map(([pair, count]) => ({ pair, count }));
}

function performanceMetrics(latencies) {
  return {
    nodeVersion: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    recordsPerRun: latencies.length,
    warmupRuns: 0,
    performanceRuns: 1,
    coldStartMs: "not_available",
    warmAverageMs: round(latencies.reduce((sum, value) => sum + value, 0) / Math.max(latencies.length, 1)),
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    maxMs: round(Math.max(...latencies, 0)),
    throughputPerSecond: "not_available",
    runTotalMs: "not_available",
  };
}

function measureOnePass(records, resolver) {
  const latenciesMs = [];
  const totalStart = performance.now();
  for (const record of records) {
    const start = performance.now();
    resolver.resolve({
      rawTranscript: record.rawTranscript,
      requestedMode: record.mode,
      aliases: record.context.voiceAliases ?? [],
      pluginCapabilities: record.context.enabledPlugins ?? [],
    });
    latenciesMs.push(performance.now() - start);
  }
  return { totalMs: performance.now() - totalStart, latenciesMs };
}

function percentile(values, target) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
  return round(sorted[index]);
}

function isRisky(record) {
  return record.expected.blocked || record.category === "ambiguous_or_dangerous" || record.tags?.includes("dangerous");
}

function isRiskyResult(result) {
  return result.expected.blocked || result.risk === "dangerous" || result.risk === "ambiguous";
}

function riskForRecord(record) {
  if (record.expected.blocked || record.tags?.includes("dangerous")) return "dangerous";
  if (record.expected.clarificationRequired || record.expected.intent === "clarify") return "ambiguous";
  if (record.expected.autoExecuteAllowed) return "low_auto_eligible";
  return "low_not_auto";
}

function distributionBy(records, key) {
  return countBy(records, (record) => record[key] ?? "unknown");
}

function nestedCount(records, outer, inner) {
  const result = {};
  for (const record of records) {
    const outerKey = outer(record);
    const innerKey = inner(record);
    result[outerKey] ??= {};
    result[outerKey][innerKey] = (result[outerKey][innerKey] ?? 0) + 1;
  }
  return result;
}

function duplicateCount(counts) {
  return Object.values(counts).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}

function groupRecords(records) {
  const groups = {};
  for (const record of records) {
    const groupId = deriveGroupId(record);
    groups[groupId] ??= [];
    groups[groupId].push(record);
  }
  return groups;
}

function deriveGroupId(record) {
  return `${record.category}:${record.subcategory}:${record.mode}:${record.expected.intent}:${sentencePattern(record.rawTranscript)}`;
}

function sentencePattern(text) {
  return normalizeAuditText(text)
    .replace(/vscode|vscode|vs code|notepad|calculator|powershell|github|izytoken|ec token|qwen|deepseek|codex/giu, "{entity}")
    .replace(/api\.izytoken\.com|github\.com|https?:\/\/[a-z0-9./_-]+/giu, "{url}")
    .replace(/[A-Z]{2,}|\d+/giu, "{entity}")
    .replace(/合同|报价单|jarvis日志|phase|voicebenchmark|茅台|腾讯|AAPL/giu, "{entity}");
}

function normalizeAuditText(text) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/gu, "")
    .replace(/[,，.。!?！？、:：;"'`~\-_/\\()[\]{}]/gu, "");
}

function findSimilarPairs(records, threshold) {
  const pairs = [];
  const normalized = records.map((record) => normalizeAuditText(record.rawTranscript));
  for (let left = 0; left < records.length; left += 1) {
    for (let right = left + 1; right < records.length; right += 1) {
      const score = similarity(normalized[left], normalized[right]);
      if (score >= threshold) {
        pairs.push({
          leftId: records[left].id,
          rightId: records[right].id,
          leftSplit: records[left].split,
          rightSplit: records[right].split,
          score: round(score),
        });
      }
    }
  }
  return pairs;
}

function similarity(left, right) {
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length, 1);
}

function levenshtein(left, right) {
  const rows = Array.from({ length: left.length + 1 }, () => Array.from({ length: right.length + 1 }, () => 0));
  for (let row = 0; row <= left.length; row += 1) rows[row][0] = row;
  for (let column = 0; column <= right.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + cost);
    }
  }
  return rows[left.length][right.length];
}

function formatMetric(value) {
  return value === "not_available" ? value : String(value);
}

function round(value) {
  return Number(value.toFixed(4));
}
