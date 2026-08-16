import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("voice regression export review script", () => {
  it("reviews dual-layer and legacy feedback exports without merging their semantics", () => {
    const exportPath = path.join(
      mkdtempSync(path.join(tmpdir(), "jarvis-voice-export-review-")),
      "voice-regression-export.json",
    );
    const records = [
      recordFixture("dual-layer", {
        kind: "dual_layer",
        transcript: {
          status: "corrected",
          correctedText: "打开 VS Code",
        },
        resolution: {
          status: "wrong_slots",
          selectedCandidateIndex: 0,
        },
      }),
      recordFixture("legacy-combined", {
        status: "accepted",
      }),
    ];
    const jsonl = `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
    writeFileSync(
      exportPath,
      JSON.stringify({
        schemaVersion: 1,
        exportedAt: "2026-08-16T00:00:00.000Z",
        provenance: "USER_INITIATED_LOCAL_VOICE_REGRESSION_EXPORT",
        localOnly: true,
        uploadAllowed: false,
        containsAudio: false,
        format: "jsonl",
        digestSha256: createHash("sha256").update(jsonl, "utf8").digest("hex"),
        recordCount: records.length,
        records,
        jsonl,
      }),
      "utf8",
    );

    const output = execFileSync(
      process.execPath,
      ["scripts/review-voice-regression-export.mjs", exportPath],
      {
        cwd: path.resolve(import.meta.dirname, "..", "..", ".."),
        encoding: "utf8",
      },
    );

    expect(output).toContain('"status": "PASS"');
    expect(output).toContain('"transcriptFeedbackDistribution"');
    expect(output).toContain('"corrected": 1');
    expect(output).toContain('"resolutionFeedbackDistribution"');
    expect(output).toContain('"wrong_slots": 1');
    expect(output).toContain('"legacyFeedbackDistribution"');
    expect(output).toContain('"accepted": 1');
  });
});

function recordFixture(id: string, feedback: unknown) {
  return {
    id,
    schemaVersion: 1,
    createdAt: "2026-08-16T00:00:00.000Z",
    consentLevel: "local_text",
    locale: "zh-CN",
    mode: "command",
    modeSource: "explicit_ui",
    asr: {
      providerId: "xunfei",
      rawTranscript: "打开微软扣",
      providerConfidence: 0.88,
      isFinal: true,
      latencyMs: 120,
    },
    resolver: {
      version: "voice-resolver.test",
      normalizedText: "打开微软扣",
      outcomeClass: "candidate",
      candidates: [
        {
          intent: "localApp.open",
          safeSlots: {
            target: "vscode",
          },
          confidence: 0.8,
          source: "structured_candidate_selector",
        },
      ],
      clarificationRequired: false,
      blocked: false,
      latencyMs: 20,
    },
    feedback,
    context: {
      enabledCapabilityIds: ["local-app"],
      activeView: "voice",
    },
    privacy: {
      redactions: [],
      containsAudio: false,
      uploadAllowed: false,
    },
  };
}
