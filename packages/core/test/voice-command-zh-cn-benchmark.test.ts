import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { VoiceCommandResolver } from "../src/voice-command-resolver";

interface BenchmarkRecord {
  id: string;
  schemaVersion: number;
  split: "train" | "dev" | "test";
  category:
    | "normal_command"
    | "asr_error"
    | "ambiguous_or_dangerous"
    | "plugin_command"
    | "negative";
  subcategory: string;
  provenance: "manually_curated";
  locale: "zh-CN";
  rawTranscript: string;
  intendedText: string;
  mode: "command" | "dictation" | "conversation";
  context: {
    activeWindow: string | null;
    installedApps: string[];
    enabledPlugins: Array<{
      pluginId: string;
      capability: string;
      aliases: string[];
    }>;
    routeAliases: Array<{
      label: string;
      target: string;
    }>;
    voiceAliases: Array<{
      id: string;
      rawAlias: string;
      normalizedTranscript: string;
      intent: string;
      slots: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>;
  };
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

const datasetPath = resolve("datasets/voice-command-zh-cn-v1.jsonl");
const records = readBenchmarkRecords();

describe("zh-CN voice command benchmark v1", () => {
  it("contains the fixed Phase 1 minimum category coverage", () => {
    const categoryCounts = countBy(records, (record) => record.category);
    const splitCounts = countBy(records, (record) => record.split);

    expect(records.length).toBeGreaterThanOrEqual(600);
    expect(categoryCounts).toMatchObject({
      normal_command: expect.any(Number),
      asr_error: expect.any(Number),
      ambiguous_or_dangerous: expect.any(Number),
      plugin_command: expect.any(Number),
      negative: expect.any(Number),
    });
    expect(categoryCounts.normal_command).toBeGreaterThanOrEqual(300);
    expect(categoryCounts.asr_error).toBeGreaterThanOrEqual(100);
    expect(categoryCounts.ambiguous_or_dangerous).toBeGreaterThanOrEqual(100);
    expect(categoryCounts.plugin_command).toBeGreaterThanOrEqual(50);
    expect(categoryCounts.negative).toBeGreaterThanOrEqual(50);
    expect(splitCounts.train).toBeGreaterThan(0);
    expect(splitCounts.dev).toBeGreaterThan(0);
    expect(splitCounts.test).toBeGreaterThan(0);
  });

  it("uses stable ids, schema fields, and deterministic splits", () => {
    const ids = new Set<string>();
    const transcripts = new Set<string>();

    records.forEach((record, index) => {
      const expectedId = `zh-cn-${String(index + 1).padStart(4, "0")}`;

      expect(record.id).toBe(expectedId);
      expect(record.schemaVersion).toBe(1);
      expect(record.provenance).toBe("manually_curated");
      expect(record.locale).toBe("zh-CN");
      expect(record.rawTranscript.trim()).not.toBe("");
      expect(record.intendedText.trim()).not.toBe("");
      expect(record.expected.intent.trim()).not.toBe("");
      expect(Array.isArray(record.expected.acceptableCandidateIds)).toBe(true);
      expect(Array.isArray(record.tags)).toBe(true);
      expect(record.split).toBe(splitFor(index + 1));
      expect(ids.has(record.id)).toBe(false);
      expect(transcripts.has(record.rawTranscript)).toBe(false);

      ids.add(record.id);
      transcripts.add(record.rawTranscript);
    });
  });

  it("keeps dangerous and clarification samples non-executable", () => {
    const riskyRecords = records.filter(
      (record) =>
        record.tags.includes("dangerous") ||
        record.expected.blocked ||
        record.expected.clarificationRequired,
    );

    expect(riskyRecords.length).toBeGreaterThanOrEqual(100);
    expect(
      riskyRecords.every((record) => record.expected.autoExecuteAllowed === false),
    ).toBe(true);
    expect(
      records
        .filter((record) => record.expected.blocked)
        .every((record) => record.expected.intent === "blocked"),
    ).toBe(true);
  });

  it("covers supported product intents without inventing executable intents", () => {
    const observedIntents = new Set(records.map((record) => record.expected.intent));
    const allowedIntents = new Set([
      "localApp.open",
      "browser.open",
      "filesystem.search",
      "notepad.write_text",
      "window.focus",
      "window.minimize",
      "window.restore",
      "plugin.invoke",
      "chat.answer",
      "coding.task",
      "memory.search",
      "observability.status",
      "model.status",
      "clarify",
      "blocked",
    ]);

    expect([...observedIntents].sort()).toEqual(
      expect.arrayContaining([...allowedIntents].sort()),
    );
    expect([...observedIntents].every((intent) => allowedIntents.has(intent))).toBe(
      true,
    );
  });

  it("runs through the deterministic resolver without direct action or executor semantics", () => {
    const resolver = new VoiceCommandResolver();
    const results = records.map((record) =>
      resolver.resolve({
        rawTranscript: record.rawTranscript,
        requestedMode: record.mode,
        aliases: record.context.voiceAliases,
        pluginCapabilities: record.context.enabledPlugins,
      }),
    );

    expect(results).toHaveLength(records.length);
    expect(results.every((result) => result.directActionAttempted === false)).toBe(
      true,
    );
    expect(
      results.every((result) => result.correctionCandidates.length <= 2),
    ).toBe(true);
  });
});

function readBenchmarkRecords(): BenchmarkRecord[] {
  return readFileSync(datasetPath, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line) as BenchmarkRecord;
      } catch (error) {
        throw new Error(
          `Invalid JSONL at ${datasetPath}:${index + 1}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    });
}

function splitFor(index: number): BenchmarkRecord["split"] {
  const bucket = (index - 1) % 20;
  if (bucket < 14) {
    return "train";
  }
  if (bucket < 17) {
    return "dev";
  }
  return "test";
}

function countBy<T>(
  items: readonly T[],
  selector: (item: T) => string,
): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
