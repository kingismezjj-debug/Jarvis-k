import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { VoiceCommandResolver } from "../packages/core/dist/voice-command-resolver.js";

const datasetPath = resolve("datasets/voice-command-zh-cn-v1.jsonl");
const reportJsonPath = resolve("reports/voice-command-zh-cn-v1-baseline.json");
const reportMarkdownPath = resolve("reports/voice-command-zh-cn-v1-baseline.md");
const errorsPath = resolve("reports/voice-command-zh-cn-v1-errors.jsonl");

const resolver = new VoiceCommandResolver();
const records = readJsonl(datasetPath);

const results = records.map(evaluateRecord);
const summary = summarize(results);

mkdirSync(dirname(reportJsonPath), { recursive: true });
writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(errorsPath, `${results.filter((result) => !result.taskSuccess).map((result) => JSON.stringify(result)).join("\n")}\n`);
writeFileSync(reportMarkdownPath, renderMarkdown(summary));

console.log(
  JSON.stringify(
    {
      status: "PASS",
      datasetPath,
      reportJsonPath,
      reportMarkdownPath,
      errorsPath,
      records: summary.records,
      taskSuccessRate: summary.metrics.taskSuccessRate,
      intentAccuracy: summary.metrics.intentAccuracy,
      slotAccuracy: summary.metrics.slotAccuracy,
      safeNonExecutionRate: summary.metrics.safeNonExecutionRate,
    },
    null,
    2,
  ),
);

function readJsonl(path) {
  return readFileSync(path, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at line ${index + 1}: ${error.message}`);
      }
    });
}

function evaluateRecord(record) {
  const correction = resolver.resolve({
    rawTranscript: record.rawTranscript,
    requestedMode: record.mode,
    aliases: record.context.voiceAliases ?? [],
    pluginCapabilities: record.context.enabledPlugins ?? [],
  });
  const topCandidate = correction.correctionCandidates[0];
  const prediction = projectPrediction(record, correction, topCandidate);
  const intentOk = prediction.intent === record.expected.intent;
  const slotOk = slotsMatch(record.expected.slots ?? {}, prediction.slots ?? {});
  const clarificationOk =
    Boolean(record.expected.clarificationRequired) === prediction.clarificationRequired;
  const blockedOk = Boolean(record.expected.blocked) === prediction.blocked;
  const autoExecuteOk =
    Boolean(record.expected.autoExecuteAllowed) === prediction.autoExecuteAllowed;
  const safeNonExecutionOk =
    !record.expected.blocked && !record.tags.includes("dangerous")
      ? true
      : prediction.autoExecuteAllowed === false &&
        correction.directActionAttempted === false;
  const taskSuccess =
    intentOk && slotOk && clarificationOk && blockedOk && autoExecuteOk;
  const errorCategories = classifyErrors({
    record,
    prediction,
    correction,
    intentOk,
    slotOk,
    clarificationOk,
    blockedOk,
    autoExecuteOk,
    safeNonExecutionOk,
  });

  return {
    id: record.id,
    split: record.split,
    category: record.category,
    subcategory: record.subcategory,
    rawTranscript: record.rawTranscript,
    expected: record.expected,
    prediction,
    resolver: {
      inputMode: correction.inputMode,
      correctionSource: correction.correctionSource,
      correctionConfidence: correction.correctionConfidence,
      requiresUserSelection: correction.requiresUserSelection,
      directActionAttempted: correction.directActionAttempted,
      candidateCount: correction.correctionCandidates.length,
      topCandidateId: topCandidate?.id ?? null,
    },
    intentOk,
    slotOk,
    clarificationOk,
    blockedOk,
    autoExecuteOk,
    safeNonExecutionOk,
    taskSuccess,
    errorCategories,
  };
}

function projectPrediction(record, correction, topCandidate) {
  if (correction.inputMode === "conversation") {
    return {
      intent: "chat.answer",
      slots: {},
      autoExecuteAllowed: false,
      clarificationRequired: false,
      blocked: false,
    };
  }
  if (correction.inputMode === "dictation") {
    return {
      intent: "notepad.write_text",
      slots: { text: stripDictationPrefix(correction.normalizedTranscript) },
      autoExecuteAllowed: false,
      clarificationRequired: false,
      blocked: false,
    };
  }
  if (!topCandidate) {
    return {
      intent: "clarify",
      slots: {},
      autoExecuteAllowed: false,
      clarificationRequired: true,
      blocked: false,
    };
  }
  return {
    intent: correction.requiresUserSelection ? "clarify" : topCandidate.intent,
    slots: correction.requiresUserSelection ? {} : topCandidate.slots,
    autoExecuteAllowed:
      !correction.requiresUserSelection &&
      isResolverAutoExecutable(topCandidate.intent, topCandidate.slots),
    clarificationRequired: correction.requiresUserSelection,
    blocked: topCandidate.intent === "blocked",
  };
}

function stripDictationPrefix(text) {
  return text.replace(/^(听写：|帮我记：)/u, "").replace(/[。.!！]$/u, "").trim();
}

function isResolverAutoExecutable(intent, slots) {
  if (intent === "localApp.open") {
    return ["vscode", "notepad", "calculator"].includes(String(slots?.target ?? ""));
  }
  return ["browser.open", "filesystem.search", "plugin.invoke", "memory.search", "observability.status", "model.status"].includes(intent);
}

function slotsMatch(expected, actual) {
  for (const [key, value] of Object.entries(expected)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!slotsMatch(value, actual?.[key] ?? {})) {
        return false;
      }
      continue;
    }
    if (actual?.[key] !== value) {
      return false;
    }
  }
  return true;
}

function classifyErrors(input) {
  const errors = [];
  if (input.correction.directActionAttempted) {
    errors.push("resolver_attempted_direct_action");
  }
  if (!input.correction.correctionCandidates.length && input.record.mode === "command") {
    errors.push("no_candidate");
  }
  if (!input.intentOk) {
    errors.push("intent_mismatch");
  }
  if (!input.slotOk) {
    errors.push("slot_mismatch");
  }
  if (!input.clarificationOk) {
    errors.push(input.prediction.clarificationRequired ? "unexpected_clarification" : "missing_clarification");
  }
  if (!input.blockedOk) {
    errors.push("blocked_mismatch");
  }
  if (!input.autoExecuteOk) {
    errors.push(input.prediction.autoExecuteAllowed ? "unsafe_auto_execute" : "missed_auto_execute");
  }
  if (!input.safeNonExecutionOk) {
    errors.push("dangerous_auto_execute");
  }
  if (
    input.record.expected.intent === "plugin.invoke" &&
    input.prediction.intent !== "plugin.invoke"
  ) {
    errors.push("plugin_not_resolved");
  }
  if (
    input.record.expected.intent.startsWith?.("window.") &&
    input.prediction.intent !== input.record.expected.intent
  ) {
    errors.push("window_control_not_supported");
  }
  if (
    input.record.expected.intent === "notepad.write_text" &&
    input.record.mode === "command" &&
    input.prediction.intent !== "notepad.write_text"
  ) {
    errors.push("write_text_command_not_supported");
  }
  return [...new Set(errors)];
}

function summarize(results) {
  const records = results.length;
  const categories = countBy(results, (result) => result.category);
  const subcategories = countBy(results, (result) => result.subcategory);
  const splits = countBy(results, (result) => result.split);
  const byCategory = groupMetrics(results, (result) => result.category);
  const bySplit = groupMetrics(results, (result) => result.split);
  const errorCategories = countMany(results.flatMap((result) => result.errorCategories));
  const confusion = topConfusions(results);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    benchmark: "voice-command-zh-cn-v1",
    executionLayer: "resolver_only",
    realWindowsExecution: false,
    microphoneUsed: false,
    asrProviderUsed: false,
    resolverRulesModifiedForBenchmark: false,
    records,
    dataset: {
      path: "datasets/voice-command-zh-cn-v1.jsonl",
      categories,
      subcategories,
      splits,
    },
    metrics: metricsFor(results),
    byCategory,
    bySplit,
    errorCategories,
    confusion,
    reportArtifacts: {
      json: "reports/voice-command-zh-cn-v1-baseline.json",
      markdown: "reports/voice-command-zh-cn-v1-baseline.md",
      errorsJsonl: "reports/voice-command-zh-cn-v1-errors.jsonl",
    },
  };
}

function groupMetrics(results, selector) {
  const groups = new Map();
  for (const result of results) {
    const key = selector(result);
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }
  return Object.fromEntries(
    [...groups.entries()].map(([key, group]) => [key, metricsFor(group)]),
  );
}

function metricsFor(results) {
  const actionable = results.filter((result) => !["clarify", "blocked"].includes(result.expected.intent));
  const dangerous = results.filter((result) => result.expected.blocked || result.errorCategories.includes("dangerous_auto_execute") || result.category === "ambiguous_or_dangerous");
  return {
    records: results.length,
    intentAccuracy: rate(results, (result) => result.intentOk),
    slotAccuracy: rate(actionable, (result) => result.slotOk),
    clarificationAccuracy: rate(results, (result) => result.clarificationOk),
    blockedAccuracy: rate(results, (result) => result.blockedOk),
    autoExecutePolicyAccuracy: rate(results, (result) => result.autoExecuteOk),
    safeNonExecutionRate: rate(dangerous, (result) => result.safeNonExecutionOk),
    taskSuccessRate: rate(results, (result) => result.taskSuccess),
    noDirectActionRate: rate(results, (result) => result.resolver.directActionAttempted === false),
  };
}

function rate(results, predicate) {
  if (results.length === 0) {
    return 1;
  }
  return Number((results.filter(predicate).length / results.length).toFixed(4));
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

function renderMarkdown(summary) {
  const lines = [
    "# Voice Command zh-CN v1 Baseline",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "## Scope",
    "",
    "- Execution layer: resolver_only",
    "- Real Windows execution: false",
    "- Microphone used: false",
    "- ASR provider used: false",
    "- Resolver rules modified for benchmark: false",
    "",
    "## Dataset",
    "",
    `- Records: ${summary.records}`,
    `- Splits: ${JSON.stringify(summary.dataset.splits)}`,
    `- Categories: ${JSON.stringify(summary.dataset.categories)}`,
    "",
    "## Metrics",
    "",
    ...Object.entries(summary.metrics).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Category Metrics",
    "",
    ...Object.entries(summary.byCategory).map(
      ([key, metrics]) =>
        `- ${key}: intent=${metrics.intentAccuracy}, slot=${metrics.slotAccuracy}, task=${metrics.taskSuccessRate}, safeNonExecution=${metrics.safeNonExecutionRate}`,
    ),
    "",
    "## Error Categories",
    "",
    ...Object.entries(summary.errorCategories)
      .sort((left, right) => right[1] - left[1])
      .map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Top Intent Confusions",
    "",
    ...summary.confusion.map((item) => `- ${item.pair}: ${item.count}`),
    "",
    "## Notes",
    "",
    "This is a fixed benchmark baseline. It intentionally does not tune resolver rules, aliases, ASR providers, Qwen, or hotwords.",
    "Dangerous samples are measured for safe non-execution separately from exact blocked-intent prediction because this resolver layer never executes actions directly.",
    "",
  ];
  return `${lines.join("\n")}`;
}
