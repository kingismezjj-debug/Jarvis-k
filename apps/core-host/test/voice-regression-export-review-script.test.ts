import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("voice regression export review script", () => {
  it("validates schema, digest, and safe distribution without side effects", async () => {
    const tempDir = await mkdtemp(
      path.join(tmpdir(), "jarvis-voice-export-review-"),
    );
    try {
      const exportPath = path.join(tempDir, "export.json");
      const exportData = createExport();
      await writeFile(exportPath, JSON.stringify(exportData), "utf8");

      const result = spawnSync(
        process.execPath,
        ["scripts/review-voice-regression-export.mjs", exportPath],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(result.status).toBe(0);
      const summary = JSON.parse(result.stdout) as {
        status: string;
        recordCount: number;
        uploadAttempted: boolean;
        datasetModified: boolean;
      };
      expect(summary).toMatchObject({
        status: "PASS",
        recordCount: 1,
        uploadAttempted: false,
        datasetModified: false,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed when export jsonl contains sensitive text", async () => {
    const tempDir = await mkdtemp(
      path.join(tmpdir(), "jarvis-voice-export-review-"),
    );
    try {
      const exportPath = path.join(tempDir, "export.json");
      const exportData = createExport({
        asr: {
          providerId: "fixture-asr",
          rawTranscript: "email me at user@example.com",
          isFinal: true,
        },
      });
      await writeFile(exportPath, JSON.stringify(exportData), "utf8");

      const result = spawnSync(
        process.execPath,
        ["scripts/review-voice-regression-export.mjs", exportPath],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "VOICE_REGRESSION_EXPORT_SENSITIVE_CONTENT",
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

function createExport(overrides?: Partial<Record<string, unknown>>) {
  const record = {
    id: "voice-regression_one",
    schemaVersion: 1,
    createdAt: "2026-08-16T00:00:00.000Z",
    consentLevel: "local_text",
    locale: "zh-CN",
    mode: "command",
    asr: {
      providerId: "fixture-asr",
      rawTranscript: "open notepad",
      isFinal: true,
    },
    resolver: {
      version: "voice-command-resolver.deterministic.v1",
      normalizedText: "open notepad",
      outcomeClass: "candidate",
      candidates: [
        {
          intent: "localApp.open",
          safeSlots: { target: "notepad" },
          confidence: 0.95,
          source: "structured_candidate_selector",
        },
      ],
      clarificationRequired: false,
      blocked: false,
      latencyMs: 1,
    },
    feedback: {
      status: "accepted",
      selectedCandidateIndex: 0,
    },
    context: {
      activeView: "voice",
    },
    privacy: {
      redactions: [],
      containsAudio: false,
      uploadAllowed: false,
    },
    ...overrides,
  };
  const jsonl = `${JSON.stringify(record)}\n`;
  return {
    schemaVersion: 1,
    exportedAt: "2026-08-16T00:00:00.000Z",
    provenance: "USER_INITIATED_LOCAL_VOICE_REGRESSION_EXPORT",
    localOnly: true,
    uploadAllowed: false,
    containsAudio: false,
    format: "jsonl",
    digestSha256: createHash("sha256").update(jsonl, "utf8").digest("hex"),
    recordCount: 1,
    records: [record],
    jsonl,
  };
}
