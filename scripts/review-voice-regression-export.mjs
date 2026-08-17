#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractsPath = path.join(
  __dirname,
  "..",
  "packages",
  "contracts",
  "dist",
  "index.js",
);

const SENSITIVE_RULES = [
  ["bearer_token", /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/giu],
  [
    "jwt",
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/gu,
  ],
  ["api_key", /\b(?:sk-(?:ant-)?|AIza|xox[baprs]-)[A-Za-z0-9_-]{16,}\b/giu],
  ["email", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu],
  [
    "phone",
    /(?<!\w)(?:\+?\d{1,3}[-.\s])?\(?\d{3,4}\)?[-.\s]\d{3,4}[-.\s]\d{4}(?!\w)/gu,
  ],
  ["windows_path", /\b[A-Z]:\\[^\s"'<>|]+/giu],
  ["unc_path", /\\\\[^\s\\/"'<>|]+\\[^\s"'<>|]+/gu],
  ["url_parameters", /(https?:\/\/[^\s?#]+)[?#][^\s"'<>]+/giu],
  [
    "ip_address",
    /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/gu,
  ],
  ["long_number", /\b\d{16,}\b/gu],
  [
    "secret_assignment",
    /\b(?:password|passwd|secret|token|api[_-]?key|authorization|credential)\s*[:=]\s*\S+/giu,
  ],
];

const filePath = process.argv[2];
if (!filePath) {
  fail("USAGE: node scripts/review-voice-regression-export.mjs <export.json>");
}

const {
  VoicePilotSessionEvidenceSchema,
  VoiceRegressionExportSchema,
  VoiceRegressionRecordSchema,
} =
  await import(pathToFileURL(contractsPath).href);
const raw = await readFile(filePath, "utf8");
const parsed = parseExport(raw);
const exportResult = VoiceRegressionExportSchema.safeParse(parsed);
if (!exportResult.success) {
  fail("VOICE_REGRESSION_EXPORT_SCHEMA_INVALID");
}

const exportData = exportResult.data;
const digest = createHash("sha256")
  .update(exportData.jsonl, "utf8")
  .digest("hex");
if (digest !== exportData.digestSha256) {
  fail("VOICE_REGRESSION_EXPORT_DIGEST_MISMATCH");
}

const findings = scanSensitive(exportData.jsonl);
if (findings.length > 0) {
  fail(`VOICE_REGRESSION_EXPORT_SENSITIVE_CONTENT:${findings.join(",")}`);
}

const lineRecords = exportData.jsonl.trim()
  ? exportData.jsonl
      .trim()
      .split("\n")
      .map((line) => VoiceRegressionRecordSchema.parse(JSON.parse(line)))
  : [];
if (lineRecords.length !== exportData.recordCount) {
  fail("VOICE_REGRESSION_EXPORT_JSONL_COUNT_MISMATCH");
}

const pilotSessionEvidence = exportData.pilotSessionEvidence
  ? VoicePilotSessionEvidenceSchema.parse(exportData.pilotSessionEvidence)
  : undefined;
if (pilotSessionEvidence) {
  validatePilotSessionEvidence(pilotSessionEvidence, exportData, lineRecords);
}

const ids = new Set();
const duplicateIds = [];
const providerDistribution = {};
const modeDistribution = {};
const legacyFeedbackDistribution = {};
const transcriptFeedbackDistribution = {};
const resolutionFeedbackDistribution = {};
const manualReviewIds = [];
for (const record of lineRecords) {
  if (ids.has(record.id)) {
    duplicateIds.push(record.id);
  }
  ids.add(record.id);
  increment(providerDistribution, record.asr.providerId);
  increment(modeDistribution, record.mode);
  if (record.feedback.kind === "dual_layer") {
    increment(transcriptFeedbackDistribution, record.feedback.transcript.status);
    increment(resolutionFeedbackDistribution, record.feedback.resolution.status);
  } else {
    increment(legacyFeedbackDistribution, record.feedback.status);
  }
  if (
    (record.feedback.kind === "dual_layer"
      ? record.feedback.transcript.status === "corrected" ||
        record.feedback.resolution.status !== "accepted"
      : record.feedback.status === "corrected") ||
    record.resolver.clarificationRequired ||
    record.resolver.blocked
  ) {
    manualReviewIds.push(record.id);
  }
}

const summary = {
  status: "PASS",
  recordCount: exportData.recordCount,
  duplicateIds,
  providerDistribution,
  modeDistribution,
  legacyFeedbackDistribution,
  transcriptFeedbackDistribution,
  resolutionFeedbackDistribution,
  manualReviewIds,
  pilotSessionEvidence: pilotSessionEvidence
    ? {
        sessionId: pilotSessionEvidence.sessionId,
        expectedProviderId: pilotSessionEvidence.expectedProviderId,
        actualProviderIdsObserved:
          pilotSessionEvidence.actualProviderIdsObserved,
        executorInvocationDelta:
          pilotSessionEvidence.executorInvocationDelta,
        sessionValid: pilotSessionEvidence.sessionValid,
      }
    : undefined,
  uploadAttempted: false,
  datasetModified: false,
  rulesGenerated: false,
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

function parseExport(input) {
  const trimmed = input.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  const records = trimmed
    ? trimmed.split("\n").map((line) => VoiceRegressionRecordSchema.parse(JSON.parse(line)))
    : [];
  const jsonl = records.length === 0 ? "" : `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
  return {
    schemaVersion: 1,
    exportedAt: new Date(0).toISOString(),
    provenance: "USER_INITIATED_LOCAL_VOICE_REGRESSION_EXPORT",
    localOnly: true,
    uploadAllowed: false,
    containsAudio: false,
    format: "jsonl",
    digestSha256: createHash("sha256").update(jsonl, "utf8").digest("hex"),
    recordCount: records.length,
    records,
    jsonl,
  };
}

function validatePilotSessionEvidence(evidence, exportData, records) {
  if (evidence.recordExportDigestSha256 !== exportData.digestSha256) {
    fail("VOICE_PILOT_EVIDENCE_EXPORT_DIGEST_MISMATCH");
  }
  if (evidence.recordCount !== exportData.recordCount) {
    fail("VOICE_PILOT_EVIDENCE_RECORD_COUNT_MISMATCH");
  }
  if (evidence.executorInvocationDelta !== 0) {
    fail("VOICE_PILOT_EVIDENCE_EXECUTOR_DELTA_NONZERO");
  }
  if (evidence.realWindowsExecutionEnabled !== false) {
    fail("VOICE_PILOT_EVIDENCE_REAL_EXECUTION_ENABLED");
  }
  if (evidence.brainOpenActionsDisabled !== true) {
    fail("VOICE_PILOT_EVIDENCE_DISABLE_GATE_MISSING");
  }
  if (!evidence.sessionValid || evidence.invalidationReason) {
    fail("VOICE_PILOT_EVIDENCE_SESSION_INVALID");
  }
  for (const providerId of evidence.actualProviderIdsObserved) {
    if (providerId !== evidence.expectedProviderId) {
      fail("VOICE_PILOT_EVIDENCE_PROVIDER_MISMATCH");
    }
  }
  for (const record of records) {
    if (record.asr.providerId !== evidence.expectedProviderId) {
      fail("VOICE_PILOT_RECORD_PROVIDER_MISMATCH");
    }
  }
  const evidenceText = JSON.stringify(evidence);
  if (
    /rawTranscript|normalizedText|correctedText|safeSlots|[A-Z]:\\|\\\\|https?:\/\//u.test(
      evidenceText,
    )
  ) {
    fail("VOICE_PILOT_EVIDENCE_CONTAINS_USER_CONTENT");
  }
}

function scanSensitive(input) {
  const findings = [];
  for (const [label, pattern] of SENSITIVE_RULES) {
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      findings.push(label);
    }
    pattern.lastIndex = 0;
  }
  return [...new Set(findings)];
}

function increment(target, key) {
  target[key] = (target[key] ?? 0) + 1;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
