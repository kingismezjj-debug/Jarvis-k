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

const options = parseArgs(process.argv.slice(2));
const records = readJsonl(options.datasetPath);
const selectedRecords = filterRecordsBySplit(records, options.split);
const resolver = new VoiceCommandResolver();
const results = runResolverBenchmark(selectedRecords, resolver);
const performanceSummary = measureResolverPerformance(selectedRecords, resolver, {
  warmupRuns: options.warmupRuns,
  performanceRuns: options.performanceRuns,
});
const summary = summarizeResults(results, records, {
  audit: auditDataset(records),
  datasetDigest: sha256File(options.datasetPath),
  datasetPath: options.datasetPath,
  gitCommit: currentGitCommit(),
  performanceSummary,
  split: options.split,
});
const suffix = options.split === "all" ? "" : `-${options.split}`;
const reportJsonPath = `${options.reportPrefix}${suffix}.json`;
const reportMarkdownPath = `${options.reportPrefix}${suffix}.md`;
const errorsPath = `reports/voice-command-zh-cn-v1-errors${suffix}.jsonl`;

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
      safeNonExecutionRate: summary.metrics.safeNonExecutionRate,
      noDirectActionRate: summary.metrics.noDirectActionRate,
    },
    null,
    2,
  ),
);
