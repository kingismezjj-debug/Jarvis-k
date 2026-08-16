import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { VoiceCommandResolver } from "../packages/core/dist/voice-command-resolver.js";
import {
  auditDataset,
  currentGitCommit,
  filterRecordsBySplit,
  measureResolverPerformance,
  parseArgs,
  readJsonl,
  renderMarkdown,
  runResolverBenchmark,
  sha256File,
  summarizeResults,
} from "./voice-command-zh-cn-evaluator-lib.mjs";
import {
  assertV11LockedSplitAllowed,
  v11DatasetVersion,
  v11ParentDigest,
  v11ParentVersion,
} from "./voice-command-zh-cn-v1-1-split-lib.mjs";

const rawArgs = process.argv.slice(2);
const options = parseArgs(withV11Defaults(rawArgs));
const allowLockedTest = rawArgs.includes("--allow-locked-test");
try {
  assertV11LockedSplitAllowed(options.split, allowLockedTest);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const records = readJsonl(options.datasetPath);
const selectedRecords = filterRecordsBySplit(records, options.split);
const resolver = new VoiceCommandResolver();
const results = runResolverBenchmark(selectedRecords, resolver);
const performanceSummary = measureResolverPerformance(selectedRecords, resolver, {
  warmupRuns: options.warmupRuns,
  performanceRuns: options.performanceRuns,
});
const suffix = options.split === "all" ? "" : `-${options.split}`;
const reportJsonPath = `${options.reportPrefix}${suffix}.json`;
const reportMarkdownPath = `${options.reportPrefix}${suffix}.md`;
const errorsPath = `reports/voice-command-zh-cn-v1.1-errors${suffix}.jsonl`;
const summary = summarizeResults(results, records, {
  audit: auditDataset(records),
  datasetDigest: sha256File(options.datasetPath),
  datasetPath: options.datasetPath,
  gitCommit: currentGitCommit(),
  performanceSummary,
  split: options.split,
});

summary.benchmark = "voice-command-zh-cn-v1.1";
summary.datasetVersion = v11DatasetVersion;
summary.parentVersion = v11ParentVersion;
summary.parentDigest = v11ParentDigest;
summary.reportArtifacts = {
  json: reportJsonPath,
  markdown: reportMarkdownPath,
  errorsJsonl: errorsPath,
};

mkdirSync(dirname(reportJsonPath), { recursive: true });
writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(
  errorsPath,
  `${results.filter((result) => !result.taskSuccess).map((result) => JSON.stringify(result)).join("\n")}\n`,
);
writeFileSync(reportMarkdownPath, renderMarkdown(summary));

console.log(
  JSON.stringify(
    {
      status: "PASS",
      split: options.split,
      datasetPath: options.datasetPath,
      datasetDigest: summary.datasetDigest,
      reportJsonPath,
      reportMarkdownPath,
      errorsPath,
      records: summary.records,
      taskSuccessRate: summary.metrics.taskSuccessRate,
      intentAccuracy: summary.metrics.intentAccuracy,
      slotExactMatchAllSamples: summary.metrics.slotExactMatchAllSamples,
      jointIntentSlotsAccuracy: summary.metrics.jointIntentSlotsAccuracy,
      legacyAllSampleTop2CandidateRecall: summary.metrics.legacyAllSampleTop2CandidateRecall,
      candidateRequiredTop2Recall: summary.metrics.candidateRequiredTop2Recall,
      qwenEligibleTop2Recall: summary.metrics.qwenEligibleTop2Recall,
      qwenEligibleTheoreticalMaxRerankGain: summary.qwenRerankEligible.theoreticalMaxRerankGain,
      safeNonExecutionRate: summary.metrics.safeNonExecutionRate,
      noDirectActionRate: summary.metrics.noDirectActionRate,
      lockedTestAllowed: allowLockedTest,
    },
    null,
    2,
  ),
);

function withV11Defaults(args) {
  const hasDataset = args.some((arg) => arg.startsWith("--dataset="));
  const hasReportPrefix = args.some((arg) => arg.startsWith("--report-prefix="));
  return [
    ...(hasDataset ? [] : ["--dataset=datasets/voice-command-zh-cn-v1.1.jsonl"]),
    ...(hasReportPrefix ? [] : ["--report-prefix=reports/voice-command-zh-cn-v1.1-baseline"]),
    ...args,
  ];
}
