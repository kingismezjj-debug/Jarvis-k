import {
  auditDataset,
  currentGitCommit,
  defaultDatasetPath,
  readJsonl,
  sha256File,
} from "./voice-command-zh-cn-evaluator-lib.mjs";

const datasetPath =
  process.argv.find((arg) => arg.startsWith("--dataset="))?.slice("--dataset=".length) ??
  defaultDatasetPath;
const records = readJsonl(datasetPath);
const audit = auditDataset(records);
const categoryCounts = countBy(records, (record) => record.category);
const splitCounts = countBy(records, (record) => record.split);
const minimums = {
  normal_command: 300,
  asr_error: 100,
  ambiguous_or_dangerous: 100,
  plugin_command: 50,
  negative: 50,
};
const hardFailures = [];

if (records.length < 600) {
  hardFailures.push(`expected at least 600 records, got ${records.length}`);
}
for (const [category, minimum] of Object.entries(minimums)) {
  if ((categoryCounts[category] ?? 0) < minimum) {
    hardFailures.push(`category ${category} has ${categoryCounts[category] ?? 0}, expected at least ${minimum}`);
  }
}
for (const split of ["train", "dev", "test"]) {
  if ((splitCounts[split] ?? 0) === 0) {
    hardFailures.push(`split ${split} has no records`);
  }
}
if (audit.privacy.hitCount > 0) {
  hardFailures.push(`privacy audit found ${audit.privacy.hitCount} sensitive-looking hits`);
}
if (audit.suspiciousSamples.some((item) => item.reason === "unknown_intent")) {
  hardFailures.push("dataset contains unknown intents");
}

const status = hardFailures.length === 0 ? "PASS" : "FAIL";
console.log(
  JSON.stringify(
    {
      status,
      datasetPath,
      datasetDigest: sha256File(datasetPath),
      gitCommit: currentGitCommit(),
      records: records.length,
      categoryCounts,
      splitCounts,
      provenance: countBy(records, (record) => record.provenance ?? "unknown"),
      audit: {
        duplicateRawTranscriptCount: audit.duplicateRawTranscriptCount,
        duplicateRawTranscriptContextCount: audit.duplicateRawTranscriptContextCount,
        duplicateNormalizedTranscriptCount: audit.duplicateNormalizedTranscriptCount,
        similarPairsAtOrAbove090: audit.similarPairsAtOrAbove090,
        crossSplitSimilarPairs: audit.crossSplitSimilarPairs,
        uniqueGroupIds: audit.uniqueGroupIds,
        maxGroupSize: audit.maxGroupSize,
        crossSplitGroupCount: audit.crossSplitGroupCount,
        templateLikeGroupCount: audit.templateLikeGroupCount,
        privacyHitCount: audit.privacy.hitCount,
        suspiciousSampleCount: audit.suspiciousSampleCount,
        suspiciousSampleIds: audit.suspiciousSampleIds,
      },
      hardFailures,
    },
    null,
    2,
  ),
);

if (hardFailures.length > 0) {
  process.exitCode = 1;
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
