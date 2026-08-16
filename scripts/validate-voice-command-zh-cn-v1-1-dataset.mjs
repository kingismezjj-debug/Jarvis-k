import { readFileSync } from "node:fs";
import {
  buildComponents,
  countBy,
  validateV11Records,
  v11ParentDigest,
} from "./voice-command-zh-cn-v1-1-split-lib.mjs";
import {
  auditDataset,
  currentGitCommit,
  readJsonl,
  sha256File,
} from "./voice-command-zh-cn-evaluator-lib.mjs";

const datasetPath =
  process.argv.find((arg) => arg.startsWith("--dataset="))?.slice("--dataset=".length) ??
  "datasets/voice-command-zh-cn-v1.1.jsonl";
const parentPath =
  process.argv.find((arg) => arg.startsWith("--parent="))?.slice("--parent=".length) ??
  "datasets/voice-command-zh-cn-v1.jsonl";
const manifestPath =
  process.argv.find((arg) => arg.startsWith("--manifest="))?.slice("--manifest=".length) ??
  "datasets/voice-command-zh-cn-v1.1-manifest.json";

const parentDigest = sha256File(parentPath);
const records = readJsonl(datasetPath);
const parentRecords = readJsonl(parentPath);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const currentDigest = sha256File(datasetPath);
const validation = validateV11Records(records, parentRecords, {
  currentDigest,
  manifest,
});
const audit = auditDataset(records);
const components = buildComponents(records);
const hardFailures = [...validation.failures];

if (parentDigest !== v11ParentDigest) {
  hardFailures.push(`parent digest mismatch: expected ${v11ParentDigest}, got ${parentDigest}`);
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
      parentPath,
      manifestPath,
      parentDigest,
      datasetDigest: currentDigest,
      gitCommit: currentGitCommit(),
      records: records.length,
      splitCounts: countBy(records, (record) => record.split),
      categoryCounts: countBy(records, (record) => record.category),
      groupCounts: {
        totalGroups: new Set(records.map((record) => record.groupId)).size,
        totalSimilarityComponents: components.length,
        largestComponent: Math.max(...components.map((component) => component.recordIndexes.length), 0),
      },
      leakage: validation.leakage,
      audit: {
        duplicateRawTranscriptCount: audit.duplicateRawTranscriptCount,
        duplicateRawTranscriptContextCount: audit.duplicateRawTranscriptContextCount,
        duplicateNormalizedTranscriptCount: audit.duplicateNormalizedTranscriptCount,
        similarPairsAtOrAbove090: audit.similarPairsAtOrAbove090,
        crossSplitSimilarPairs: audit.crossSplitSimilarPairs,
        uniqueGroupIds: audit.uniqueGroupIds,
        maxGroupSize: audit.maxGroupSize,
        crossSplitGroupCount: audit.crossSplitGroupCount,
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
