import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { VoiceRegressionRecordSchema } from "@jarvis-k/contracts";
import { VOICE_PILOT_MANIFEST } from "../src/voice-pilot-manifest";

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

  it("reviews Pilot session evidence without requiring legacy exports to include it", () => {
    const record = recordFixture("pilot-record", {
      kind: "dual_layer",
      transcript: { status: "accepted" },
      resolution: { status: "accepted" },
    });
    const exportData = exportFixture([record], {
      schemaVersion: 1,
      sessionId: "voice-pilot-session:test",
      sessionStartedAt: "2026-08-16T00:00:00.000Z",
      sessionEndedAt: "2026-08-16T00:01:00.000Z",
      expectedProviderId: "xunfei",
      actualProviderIdsObserved: ["xunfei"],
      recordCount: 1,
      recordExportDigestSha256: "",
      executorInvocationBaseline: 0,
      executorInvocationFinal: 0,
      executorInvocationDelta: 0,
      blockedBeforeExecutorBaseline: 2,
      blockedBeforeExecutorFinal: 5,
      blockedBeforeExecutorDelta: 3,
      realWindowsExecutionEnabled: false,
      brainOpenActionsDisabled: true,
      sessionValid: true,
    });
    exportData.pilotSessionEvidence.recordExportDigestSha256 =
      exportData.digestSha256;
    const output = runReview(writeExport(exportData));

    expect(output.status).toBe(0);
    expect(output.stdout).toContain('"status": "PASS"');
    expect(output.stdout).toContain('"pilotSessionEvidence"');
    expect(output.stdout).toContain('"executorInvocationDelta": 0');

    const legacy = exportFixture([record]);
    const legacyOutput = runReview(writeExport(legacy));
    expect(legacyOutput.status).toBe(0);
    expect(legacyOutput.stdout).toContain('"status": "PASS"');
  });

  it("fails Pilot review when evidence is not bound to the export or session", () => {
    const record = recordFixture("pilot-record", {
      kind: "dual_layer",
      transcript: { status: "accepted" },
      resolution: { status: "accepted" },
    });
    const base = exportFixture([record], {
      schemaVersion: 1,
      sessionId: "voice-pilot-session:test",
      sessionStartedAt: "2026-08-16T00:00:00.000Z",
      sessionEndedAt: "2026-08-16T00:01:00.000Z",
      expectedProviderId: "xunfei",
      actualProviderIdsObserved: ["xunfei"],
      recordCount: 1,
      recordExportDigestSha256: "",
      executorInvocationBaseline: 0,
      executorInvocationFinal: 0,
      executorInvocationDelta: 0,
      blockedBeforeExecutorBaseline: 0,
      blockedBeforeExecutorFinal: 0,
      blockedBeforeExecutorDelta: 0,
      realWindowsExecutionEnabled: false,
      brainOpenActionsDisabled: true,
      sessionValid: true,
    });
    base.pilotSessionEvidence.recordExportDigestSha256 = base.digestSha256;

    const cases = [
      {
        mutate: (value: typeof base) => {
          value.pilotSessionEvidence.recordExportDigestSha256 =
            "0".repeat(64);
        },
        message: "VOICE_PILOT_EVIDENCE_EXPORT_DIGEST_MISMATCH",
      },
      {
        mutate: (value: typeof base) => {
          value.pilotSessionEvidence.executorInvocationDelta = 1;
          value.pilotSessionEvidence.executorInvocationFinal = 1;
        },
        message: "VOICE_PILOT_EVIDENCE_EXECUTOR_DELTA_NONZERO",
      },
      {
        mutate: (value: typeof base) => {
          value.pilotSessionEvidence.sessionValid = false;
          value.pilotSessionEvidence.invalidationReason =
            "PROVIDER_MISMATCH";
        },
        message: "VOICE_PILOT_EVIDENCE_SESSION_INVALID",
      },
      {
        mutate: (value: typeof base) => {
          value.pilotSessionEvidence.actualProviderIdsObserved = [
            "xunfei",
            "volcengine",
          ];
        },
        message: "VOICE_PILOT_EVIDENCE_PROVIDER_MISMATCH",
      },
      {
        mutate: (value: typeof base) => {
          value.records[0].asr.providerId = "volcengine";
          value.jsonl = `${JSON.stringify(value.records[0])}\n`;
          value.digestSha256 = createHash("sha256")
            .update(value.jsonl, "utf8")
            .digest("hex");
          value.pilotSessionEvidence.recordExportDigestSha256 =
            value.digestSha256;
        },
        message: "VOICE_PILOT_RECORD_PROVIDER_MISMATCH",
      },
    ];

    for (const { mutate, message } of cases) {
      const copy = JSON.parse(JSON.stringify(base)) as typeof base;
      mutate(copy);
      const output = runReview(writeExport(copy));

      expect(output.status).not.toBe(0);
      expect(output.stderr).toContain(message);
    }
  });

  it("strictly validates manifest prompt outcomes for new Pilot exports", () => {
    const sessionId = "voice-pilot-session:test";
    const record = {
      ...recordFixture("pilot-record", {
        kind: "dual_layer",
        transcript: { status: "accepted" },
        resolution: { status: "accepted" },
      }),
      pilot: {
        sessionId,
        manifestId: VOICE_PILOT_MANIFEST.manifestId,
        manifestDigest: VOICE_PILOT_MANIFEST.digest,
        promptId: "P01",
        ordinal: 1,
      },
    };
    const parsedRecord = VoiceRegressionRecordSchema.parse(record);
    const recordDigestSha256 = createHash("sha256")
      .update(JSON.stringify(parsedRecord), "utf8")
      .digest("hex");
    const exportData = exportFixture([parsedRecord], {
      schemaVersion: 1,
      sessionId,
      sessionStartedAt: "2026-08-16T00:00:00.000Z",
      sessionEndedAt: "2026-08-16T00:01:00.000Z",
      expectedProviderId: "xunfei",
      actualProviderIdsObserved: ["xunfei"],
      recordCount: 1,
      manifestId: VOICE_PILOT_MANIFEST.manifestId,
      manifestDigest: VOICE_PILOT_MANIFEST.digest,
      expectedPromptCount: 20,
      terminalPromptCount: 20,
      savedRecordCount: 1,
      noFinalTranscriptCount: 19,
      discardedCount: 0,
      operatorDeviationCount: 0,
      duplicatePromptCount: 0,
      outOfOrderAttemptCount: 0,
      nonManifestRecordCount: 0,
      feedbackWarningCount: 0,
      feedbackWarningOverrideCount: 0,
      requiredContext: {
        routeAliases: ["route_alias:jarvis_project_homepage"],
        readonlyPlugins: [
          "plugin:cn.example.hello-readonly:hello.lookup:readonly_enabled",
        ],
        missing: [],
      },
      promptOutcomes: VOICE_PILOT_MANIFEST.prompts.map((prompt) =>
        prompt.promptId === "P01"
          ? {
              promptId: prompt.promptId,
              ordinal: prompt.ordinal,
              status: "feedback_saved",
              recordId: record.id,
              recordDigestSha256,
            }
          : {
              promptId: prompt.promptId,
              ordinal: prompt.ordinal,
              status: "no_final_transcript",
            },
      ),
      recordExportDigestSha256: "",
      executorInvocationBaseline: 0,
      executorInvocationFinal: 0,
      executorInvocationDelta: 0,
      blockedBeforeExecutorBaseline: 0,
      blockedBeforeExecutorFinal: 0,
      blockedBeforeExecutorDelta: 0,
      realWindowsExecutionEnabled: false,
      brainOpenActionsDisabled: true,
      sessionValid: true,
    });
    exportData.pilotSessionEvidence.recordExportDigestSha256 =
      exportData.digestSha256;

    const pass = runReview(writeExport(exportData));
    expect(pass.status).toBe(0);
    expect(pass.stdout).toContain(VOICE_PILOT_MANIFEST.manifestId);

    const wrongDigest = JSON.parse(JSON.stringify(exportData)) as typeof exportData;
    wrongDigest.pilotSessionEvidence.manifestDigest = "0".repeat(64);
    const fail = runReview(writeExport(wrongDigest));
    expect(fail.status).not.toBe(0);
    expect(fail.stderr).toContain("VOICE_PILOT_MANIFEST_DIGEST_MISMATCH");
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

function exportFixture(
  records: Array<ReturnType<typeof recordFixture>>,
  pilotSessionEvidence?: Record<string, unknown>,
) {
  const jsonl =
    records.length === 0
      ? ""
      : `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
  const digestSha256 = createHash("sha256")
    .update(jsonl, "utf8")
    .digest("hex");
  return {
    schemaVersion: 1,
    exportedAt: "2026-08-16T00:00:00.000Z",
    provenance: "USER_INITIATED_LOCAL_VOICE_REGRESSION_EXPORT",
    localOnly: true,
    uploadAllowed: false,
    containsAudio: false,
    format: "jsonl",
    digestSha256,
    recordCount: records.length,
    records,
    jsonl,
    ...(pilotSessionEvidence ? { pilotSessionEvidence } : {}),
  };
}

function writeExport(exportData: unknown) {
  const exportPath = path.join(
    mkdtempSync(path.join(tmpdir(), "jarvis-voice-export-review-")),
    "voice-regression-export.json",
  );
  writeFileSync(exportPath, JSON.stringify(exportData), "utf8");
  return exportPath;
}

function runReview(exportPath: string) {
  return spawnSync(
    process.execPath,
    ["scripts/review-voice-regression-export.mjs", exportPath],
    {
      cwd: path.resolve(import.meta.dirname, "..", "..", ".."),
      encoding: "utf8",
    },
  );
}
