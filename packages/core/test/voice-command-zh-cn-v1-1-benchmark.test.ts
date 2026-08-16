import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertV11LockedSplitAllowed,
  buildV11Manifest,
  countBy,
  migrateV1ToV11,
  stableStringify,
  validateV11Records,
  v11ParentDigest,
} from "../../../scripts/voice-command-zh-cn-v1-1-split-lib.mjs";

interface BenchmarkRecord {
  id: string;
  schemaVersion: number;
  datasetVersion?: string;
  split: "train" | "dev" | "test";
  groupId?: string;
  similarityGroupId?: string;
  category: string;
  subcategory: string;
  provenance: string;
  locale: "zh-CN";
  rawTranscript: string;
  intendedText: string;
  mode: "command" | "dictation" | "conversation";
  context: Record<string, unknown>;
  expected: {
    intent: string;
    slots: Record<string, unknown>;
    acceptableCandidateIds: string[];
    autoExecuteAllowed: boolean;
    clarificationRequired: boolean;
    blocked: boolean;
  };
  tags: string[];
}

const parentPath = resolve("datasets/voice-command-zh-cn-v1.jsonl");
const datasetPath = resolve("datasets/voice-command-zh-cn-v1.1.jsonl");
const manifestPath = resolve("datasets/voice-command-zh-cn-v1.1-manifest.json");
const parentRecords = readJsonl(parentPath);
const records = readJsonl(datasetPath);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const datasetDigest = sha256File(datasetPath);
const heavyDatasetValidationTimeoutMs = 45_000;

describe("zh-CN voice command benchmark v1.1", () => {
  it("keeps the immutable v1 parent dataset digest unchanged", () => {
    expect(sha256File(parentPath)).toBe(v11ParentDigest);
  });

  it("only changes versioning, split, grouping, and quality metadata from v1", () => {
    const parentById = new Map(parentRecords.map((record) => [record.id, record]));

    expect(records).toHaveLength(parentRecords.length);
    for (const record of records) {
      const parent = parentById.get(record.id);
      expect(parent).toBeDefined();
      expect(record.datasetVersion).toBe("1.1");
      expect(record.groupId).toMatch(/^grp:/u);
      expect(record.similarityGroupId).toMatch(/^sim-/u);

      for (const field of [
        "id",
        "schemaVersion",
        "category",
        "subcategory",
        "provenance",
        "locale",
        "rawTranscript",
        "intendedText",
        "mode",
      ] as const) {
        expect(record[field]).toEqual(parent?.[field]);
      }
      expect(stableStringify(record.context)).toEqual(stableStringify(parent?.context));
      expect(stableStringify(record.expected)).toEqual(stableStringify(parent?.expected));
      expect(stableStringify(record.tags)).toEqual(stableStringify(parent?.tags));
    }
  });

  it("matches the fixed group-aware migration output", () => {
    const expectedRecords = migrateV1ToV11(parentRecords);

    expect(
      records.map((record) => ({
        id: record.id,
        split: record.split,
        groupId: record.groupId,
        similarityGroupId: record.similarityGroupId,
      })),
    ).toEqual(
      expectedRecords.map((record) => ({
        id: record.id,
        split: record.split,
        groupId: record.groupId,
        similarityGroupId: record.similarityGroupId,
      })),
    );
  }, heavyDatasetValidationTimeoutMs);

  it("fails closed on cross-split group or similarity leakage", () => {
    const validation = validateV11Records(records, parentRecords, {
      currentDigest: datasetDigest,
      manifest,
    });

    expect(validation.status).toBe("PASS");
    expect(validation.leakage.crossGroupLeakage.count).toBe(0);
    expect(validation.leakage.crossSimilarityLeakage.count).toBe(0);
    expect(validation.failures).toEqual([]);
  }, heavyDatasetValidationTimeoutMs);

  it("keeps test split locked while preserving required coverage", () => {
    const testRecords = records.filter((record) => record.split === "test");
    const categoryCounts = countBy(testRecords, (record) => record.category);
    const intents = new Set(testRecords.map((record) => record.expected.intent));

    expect(() => assertV11LockedSplitAllowed("test", false)).toThrow(
      /LOCKED_TEST_SPLIT_REQUIRES_ALLOW_LOCKED_TEST/u,
    );
    expect(() => assertV11LockedSplitAllowed("all", false)).toThrow(
      /LOCKED_TEST_SPLIT_REQUIRES_ALLOW_LOCKED_TEST/u,
    );
    expect(() => assertV11LockedSplitAllowed("test", true)).not.toThrow();
    expect(() => assertV11LockedSplitAllowed("dev", false)).not.toThrow();
    expect(categoryCounts.normal_command).toBeGreaterThanOrEqual(45);
    expect(categoryCounts.asr_error).toBeGreaterThanOrEqual(15);
    expect(categoryCounts.ambiguous_or_dangerous).toBeGreaterThanOrEqual(15);
    expect(categoryCounts.plugin_command).toBeGreaterThanOrEqual(8);
    expect(categoryCounts.negative).toBeGreaterThanOrEqual(8);
    expect([...intents]).toEqual(
      expect.arrayContaining([
        "localApp.open",
        "browser.open",
        "filesystem.search",
        "plugin.invoke",
        "chat.answer",
        "clarify",
        "blocked",
      ]),
    );
  });

  it("records manifest metadata without resolver predictions or expected details", () => {
    const regenerated = buildV11Manifest(records, { currentDigest: datasetDigest });

    expect(manifest).toEqual(regenerated);
    expect(manifest.currentDigest).toBe(datasetDigest);
    expect(manifest.parentDigest).toBe(v11ParentDigest);
    expect(JSON.stringify(manifest)).not.toContain("rawTranscript");
    expect(JSON.stringify(manifest)).not.toContain("intendedText");
    expect(JSON.stringify(manifest)).not.toContain("expected");
    expect(JSON.stringify(manifest)).not.toContain("prediction");
    expect(JSON.stringify(manifest)).not.toContain("resolver");
  }, heavyDatasetValidationTimeoutMs);

  it("validation is read-only for the fixed artifacts", () => {
    const beforeDataset = statSync(datasetPath).mtimeMs;
    const beforeManifest = statSync(manifestPath).mtimeMs;

    const validation = validateV11Records(records, parentRecords, {
      currentDigest: datasetDigest,
      manifest,
    });

    expect(validation.status).toBe("PASS");
    expect(statSync(datasetPath).mtimeMs).toBe(beforeDataset);
    expect(statSync(manifestPath).mtimeMs).toBe(beforeManifest);
  }, heavyDatasetValidationTimeoutMs);
});

function readJsonl(path: string): BenchmarkRecord[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as BenchmarkRecord);
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
