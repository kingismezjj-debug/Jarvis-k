import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  buildV11Manifest,
  migrateV1ToV11,
  v11ParentDigest,
} from "./voice-command-zh-cn-v1-1-split-lib.mjs";
import {
  readJsonl,
  sha256File,
} from "./voice-command-zh-cn-evaluator-lib.mjs";

const inputPath = "datasets/voice-command-zh-cn-v1.jsonl";
const outputPath = "datasets/voice-command-zh-cn-v1.1.jsonl";
const manifestPath = "datasets/voice-command-zh-cn-v1.1-manifest.json";
const args = new Set(process.argv.slice(2));
const canWrite =
  args.has("--write-v1.1") &&
  args.has("--maintainer-confirm-fixed-benchmark-update");

if (!canWrite) {
  throw new Error(
    "Refusing to generate v1.1 without --write-v1.1 --maintainer-confirm-fixed-benchmark-update.",
  );
}
if ((existsSync(outputPath) || existsSync(manifestPath)) && !args.has("--overwrite-v1.1")) {
  throw new Error(
    "Refusing to overwrite existing v1.1 artifacts without --overwrite-v1.1.",
  );
}

const parentDigest = sha256File(inputPath);
if (parentDigest !== v11ParentDigest) {
  throw new Error(
    `Parent dataset digest mismatch: expected ${v11ParentDigest}, got ${parentDigest}`,
  );
}

const parentRecords = readJsonl(inputPath);
const records = migrateV1ToV11(parentRecords);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`);

const currentDigest = sha256File(outputPath);
const manifest = buildV11Manifest(records, { currentDigest });
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      status: "PASS",
      parentDigest,
      currentDigest,
      outputPath,
      manifestPath,
      records: records.length,
      splitCounts: manifest.splitCounts,
      totalGroups: manifest.totalGroups,
      totalSimilarityComponents: manifest.totalSimilarityComponents,
      largestComponent: manifest.largestComponent,
      crossGroupLeakage: manifest.crossGroupLeakage,
      crossSimilarityLeakage: manifest.crossSimilarityLeakage,
    },
    null,
    2,
  ),
);
