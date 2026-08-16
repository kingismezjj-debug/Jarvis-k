import { createHash } from "node:crypto";
import {
  type BrainIntent,
  type VoiceCommandCorrection,
  type VoiceInputMode,
  type VoiceAsrProviderId,
  VoiceAsrProviderIdSchema,
  type VoiceRegressionCollectionStatus,
  VoiceRegressionCollectionStatusSchema,
  type VoiceRegressionConsentLevel,
  type VoiceRegressionExport,
  VoiceRegressionExportSchema,
  VoiceRegressionFeedbackSchema,
  type VoiceRegressionFeedbackStatus,
  type VoiceRegressionRecord,
  VoiceRegressionRecordSchema,
  type VoiceRegressionSample,
  VoiceRegressionSampleSchema,
  createId,
} from "@jarvis-k/contracts";

import {
  redactVoiceRegressionSlots,
  redactVoiceRegressionText,
  scanVoiceRegressionSensitiveText,
} from "./voice-regression-redactor";

const RESOLVER_VERSION = "voice-command-resolver.deterministic.v1";
const MAX_RECORDS = 10_000;
const MAX_RECORD_AGE_DAYS = 30;
const MAX_STORAGE_BYTES = 5 * 1024 * 1024;
const MAX_PENDING_SAMPLES = 50;
const RETENTION_POLICY_ID = "local_text_30d_10000_records_5mb";

export interface VoiceRegressionRetentionPolicy {
  maxRecords: number;
  maxAgeDays: number;
  maxBytes: number;
  now: Date;
}

export interface VoiceRegressionRetentionResult {
  deletedCount: number;
  recordCount: number;
  approximateBytes: number;
  appliedAt: string;
}

export interface VoiceRegressionRepository {
  initialize(): Promise<void>;
  getConsentLevel(): Promise<VoiceRegressionConsentLevel>;
  setConsentLevel(level: VoiceRegressionConsentLevel): Promise<void>;
  countRecords(): Promise<number>;
  applyRetention(
    policy: VoiceRegressionRetentionPolicy,
  ): Promise<VoiceRegressionRetentionResult>;
  appendRecord(record: VoiceRegressionRecord): Promise<VoiceRegressionRecord>;
  listRecords(options?: {
    limit?: number | undefined;
  }): Promise<VoiceRegressionRecord[]>;
  updateFeedback(input: {
    recordId: string;
    feedback: VoiceRegressionRecord["feedback"];
  }): Promise<VoiceRegressionRecord | undefined>;
  deleteRecord(recordId: string): Promise<boolean>;
  clearRecords(): Promise<number>;
}

export interface VoiceRegressionCaptureInput {
  correction: VoiceCommandCorrection;
  mode?: VoiceInputMode | undefined;
  asrProviderId?: string | undefined;
  providerConfidence?: number | undefined;
  asrLatencyMs?: number | undefined;
  resolverLatencyMs?: number | undefined;
  context?:
    | {
        activeCapabilityId?: string | undefined;
        enabledCapabilityIds?: readonly string[] | undefined;
        activeView?: string | undefined;
      }
    | undefined;
}

export class VoiceRegressionService {
  private initialized = false;
  private readonly pendingSamples = new Map<string, VoiceRegressionSample>();
  private readonly pendingSampleKeys = new Map<string, string>();
  private readonly completedSampleKeys = new Set<string>();
  private lastRetentionResult: VoiceRegressionRetentionResult | undefined;

  public constructor(
    private readonly repository: VoiceRegressionRepository | undefined,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async getStatus(): Promise<VoiceRegressionCollectionStatus> {
    if (!this.repository) {
      return this.status({
        consentLevel: "off",
        recordCount: 0,
        storage: "not_configured",
      });
    }
    await this.ensureInitialized();
    const consentLevel = await this.repository.getConsentLevel();
    const retention = await this.applyRetention();
    return this.status({
      consentLevel,
      recordCount: retention.recordCount,
      storage: "local_json",
      retention,
    });
  }

  public async setConsent(input: {
    consentLevel: VoiceRegressionConsentLevel;
    confirmation?: "explicit_ui_confirmation" | undefined;
  }): Promise<VoiceRegressionCollectionStatus> {
    if (!this.repository) {
      this.clearPendingSamples();
      return this.status({
        consentLevel: "off",
        recordCount: 0,
        storage: "not_configured",
      });
    }
    if (
      input.consentLevel === "local_text" &&
      input.confirmation !== "explicit_ui_confirmation"
    ) {
      throw new Error("VOICE_REGRESSION_EXPLICIT_CONSENT_REQUIRED");
    }
    await this.ensureInitialized();
    await this.repository.setConsentLevel(input.consentLevel);
    if (input.consentLevel === "off") {
      this.clearPendingSamples();
    }
    const retention = await this.applyRetention();
    return this.status({
      consentLevel: input.consentLevel,
      recordCount: retention.recordCount,
      storage: "local_json",
      retention,
    });
  }

  public async captureResolution(
    input: VoiceRegressionCaptureInput,
  ): Promise<{ pending: boolean; sample?: VoiceRegressionSample }> {
    if (!this.repository) {
      return { pending: false };
    }
    await this.ensureInitialized();
    if ((await this.repository.getConsentLevel()) !== "local_text") {
      return { pending: false };
    }
    const sample = this.createPendingSample(input);
    if (!sample) {
      return { pending: false };
    }
    const sampleKey = createSampleKey(sample);
    if (this.completedSampleKeys.has(sampleKey)) {
      return { pending: false };
    }
    const existingId = this.pendingSampleKeys.get(sampleKey);
    if (existingId) {
      const existing = this.pendingSamples.get(existingId);
      return existing ? { pending: true, sample: existing } : { pending: false };
    }
    this.pendingSamples.set(sample.id, sample);
    this.pendingSampleKeys.set(sampleKey, sample.id);
    this.evictOldPendingSamples();
    return { pending: true, sample };
  }

  public listPendingSamples(options?: {
    limit?: number | undefined;
  }): VoiceRegressionSample[] {
    const samples = [...this.pendingSamples.values()].reverse();
    return samples.slice(0, options?.limit ?? samples.length);
  }

  public async savePendingSample(input: {
    sampleId: string;
    status: VoiceRegressionFeedbackStatus;
    selectedCandidateIndex?: number | undefined;
    correctedText?: string | undefined;
    intendedIntent?: BrainIntent | undefined;
  }): Promise<VoiceRegressionRecord | undefined> {
    if (!this.repository) {
      return undefined;
    }
    await this.ensureInitialized();
    const sample = this.pendingSamples.get(input.sampleId);
    if (!sample) {
      return undefined;
    }
    const feedback = this.createFeedback(input);
    const record = VoiceRegressionRecordSchema.parse({
      ...sample,
      feedback,
      privacy: {
        ...sample.privacy,
        redactions: unique([
          ...sample.privacy.redactions,
          ...extractFeedbackRedactions(feedback),
        ]),
      },
    });
    assertNoSensitiveVoiceRegressionRecordContent(record);
    const persisted = await this.repository.appendRecord(record);
    await this.applyRetention();
    this.removePendingSample(sample.id);
    this.completedSampleKeys.add(createSampleKey(sample));
    return persisted;
  }

  public discardPendingSample(sampleId: string): boolean {
    return this.removePendingSample(sampleId);
  }

  public clearPendingSamples(): number {
    const count = this.pendingSamples.size;
    this.pendingSamples.clear();
    this.pendingSampleKeys.clear();
    return count;
  }

  public async listRecords(options?: {
    limit?: number | undefined;
  }): Promise<VoiceRegressionRecord[]> {
    if (!this.repository) {
      return [];
    }
    await this.ensureInitialized();
    await this.applyRetention();
    return this.repository.listRecords(
      options?.limit === undefined ? undefined : { limit: options.limit },
    );
  }

  public async submitFeedback(input: {
    recordId: string;
    status: VoiceRegressionFeedbackStatus;
    selectedCandidateIndex?: number | undefined;
    correctedText?: string | undefined;
    intendedIntent?: BrainIntent | undefined;
  }): Promise<VoiceRegressionRecord | undefined> {
    if (!this.repository) {
      return undefined;
    }
    await this.ensureInitialized();
    const updated = await this.repository.updateFeedback({
      recordId: input.recordId,
      feedback: this.createFeedback(input),
    });
    await this.applyRetention();
    return updated;
  }

  public async deleteRecord(recordId: string): Promise<boolean> {
    if (!this.repository) {
      return false;
    }
    await this.ensureInitialized();
    const deleted = await this.repository.deleteRecord(recordId);
    await this.applyRetention();
    return deleted;
  }

  public async clearRecords(): Promise<number> {
    if (!this.repository) {
      return 0;
    }
    await this.ensureInitialized();
    const deleted = await this.repository.clearRecords();
    await this.applyRetention();
    return deleted;
  }

  public async exportRecords(): Promise<VoiceRegressionExport> {
    const records = await this.listRecords({ limit: MAX_RECORDS });
    for (const record of records) {
      const parsed = VoiceRegressionRecordSchema.parse(record);
      assertNoSensitiveVoiceRegressionRecordContent(parsed);
    }
    const jsonl =
      records.length === 0
        ? ""
        : `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
    return VoiceRegressionExportSchema.parse({
      schemaVersion: 1,
      exportedAt: this.now().toISOString(),
      provenance: "USER_INITIATED_LOCAL_VOICE_REGRESSION_EXPORT",
      localOnly: true,
      uploadAllowed: false,
      containsAudio: false,
      format: "jsonl",
      digestSha256: createHash("sha256").update(jsonl, "utf8").digest("hex"),
      recordCount: records.length,
      records,
      jsonl,
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized || !this.repository) {
      return;
    }
    await this.repository.initialize();
    this.initialized = true;
  }

  private async applyRetention(): Promise<VoiceRegressionRetentionResult> {
    if (!this.repository) {
      return {
        deletedCount: 0,
        recordCount: 0,
        approximateBytes: 0,
        appliedAt: this.now().toISOString(),
      };
    }
    const result = await this.repository.applyRetention({
      maxRecords: MAX_RECORDS,
      maxAgeDays: MAX_RECORD_AGE_DAYS,
      maxBytes: MAX_STORAGE_BYTES,
      now: this.now(),
    });
    this.lastRetentionResult = result;
    return result;
  }

  private status(input: {
    consentLevel: VoiceRegressionConsentLevel;
    recordCount: number;
    storage: "not_configured" | "local_json";
    retention?: VoiceRegressionRetentionResult | undefined;
  }): VoiceRegressionCollectionStatus {
    const retention = input.retention ?? this.lastRetentionResult;
    return VoiceRegressionCollectionStatusSchema.parse({
      consentLevel: input.consentLevel,
      localTextCollectionEnabled: input.consentLevel === "local_text",
      localTextCollectionSupported: input.storage === "local_json",
      localAudioCollectionSupported: false,
      localAudioConsentLevel: "unsupported",
      recordCount: input.recordCount,
      pendingCount: this.pendingSamples.size,
      retentionMaxRecords: MAX_RECORDS,
      retentionMaxAgeDays: MAX_RECORD_AGE_DAYS,
      retentionMaxBytes: MAX_STORAGE_BYTES,
      retentionApproximateBytes: retention?.approximateBytes ?? 0,
      ...(retention?.appliedAt ? { retentionLastAppliedAt: retention.appliedAt } : {}),
      retentionDeletedCount: retention?.deletedCount ?? 0,
      localOnly: true,
      uploadAllowed: false,
      audioRetained: false,
      retentionPolicy: RETENTION_POLICY_ID,
      storage: input.storage,
    });
  }

  private createPendingSample(
    input: VoiceRegressionCaptureInput,
  ): VoiceRegressionSample | undefined {
    const rawTranscript = redactVoiceRegressionText(
      input.correction.rawTranscript,
    );
    const normalizedText = redactVoiceRegressionText(
      input.correction.normalizedTranscript,
    );
    if (!rawTranscript.ok || !normalizedText.ok) {
      return undefined;
    }
    const redactions = [
      ...rawTranscript.redactions.map((label) => `raw:${label}`),
      ...normalizedText.redactions.map((label) => `normalized:${label}`),
    ];
    const candidates = [];
    for (const candidate of input.correction.correctionCandidates.slice(0, 5)) {
      const safeSlots = redactVoiceRegressionSlots(candidate.slots);
      if (!safeSlots.ok) {
        return undefined;
      }
      redactions.push(...safeSlots.redactions);
      candidates.push({
        intent: candidate.intent,
        safeSlots: safeSlots.value,
        confidence: candidate.confidence,
        source: candidate.correctionSource,
      });
    }
    const sample = VoiceRegressionSampleSchema.parse({
      id: createId("voice-regression-sample"),
      schemaVersion: 1,
      createdAt: this.now().toISOString(),
      consentLevel: "local_text",
      locale: "zh-CN",
      mode: input.mode ?? input.correction.inputMode,
      asr: {
        providerId: sanitizeProviderId(input.asrProviderId),
        rawTranscript: rawTranscript.value,
        ...(input.providerConfidence === undefined
          ? {}
          : { providerConfidence: input.providerConfidence }),
        isFinal: true,
        ...(input.asrLatencyMs === undefined
          ? {}
          : { latencyMs: input.asrLatencyMs }),
      },
      resolver: {
        version: RESOLVER_VERSION,
        normalizedText: normalizedText.value,
        outcomeClass: classifyOutcome(input.correction),
        candidates,
        clarificationRequired: input.correction.requiresUserSelection,
        blocked:
          input.correction.correctionCandidates[0]?.intent === "blocked",
        latencyMs: input.resolverLatencyMs ?? 0,
      },
      context: sanitizeContext(input.context),
      privacy: {
        redactions: unique(redactions),
        containsAudio: false,
        uploadAllowed: false,
      },
    });
    assertNoSensitiveVoiceRegressionSampleContent(sample);
    return sample;
  }

  private createFeedback(input: {
    status: VoiceRegressionFeedbackStatus;
    selectedCandidateIndex?: number | undefined;
    correctedText?: string | undefined;
    intendedIntent?: BrainIntent | undefined;
  }): VoiceRegressionRecord["feedback"] {
    const correctedText =
      input.correctedText === undefined
        ? undefined
        : redactVoiceRegressionText(input.correctedText);
    if (correctedText && !correctedText.ok) {
      throw new Error("VOICE_REGRESSION_SENSITIVE_FEEDBACK");
    }
    return VoiceRegressionFeedbackSchema.parse({
      status: input.status,
      ...(input.selectedCandidateIndex === undefined
        ? {}
        : { selectedCandidateIndex: input.selectedCandidateIndex }),
      ...(correctedText === undefined ? {} : { correctedText: correctedText.value }),
      ...(input.intendedIntent === undefined
        ? {}
        : { intendedIntent: input.intendedIntent }),
    });
  }

  private evictOldPendingSamples(): void {
    while (this.pendingSamples.size > MAX_PENDING_SAMPLES) {
      const oldestId = this.pendingSamples.keys().next().value as
        | string
        | undefined;
      if (!oldestId) {
        return;
      }
      this.removePendingSample(oldestId);
    }
  }

  private removePendingSample(sampleId: string): boolean {
    const sample = this.pendingSamples.get(sampleId);
    if (!sample) {
      return false;
    }
    this.pendingSamples.delete(sampleId);
    this.pendingSampleKeys.delete(createSampleKey(sample));
    return true;
  }
}

function classifyOutcome(
  correction: VoiceCommandCorrection,
): VoiceRegressionSample["resolver"]["outcomeClass"] {
  if (correction.correctionCandidates[0]?.intent === "blocked") {
    return "blocked";
  }
  if (correction.requiresUserSelection) {
    return "clarification";
  }
  if (correction.correctionCandidates.length === 0) {
    return "no_candidate";
  }
  return "candidate";
}

function sanitizeProviderId(providerId: string | undefined): VoiceAsrProviderId {
  const trimmed = providerId?.trim();
  if (!trimmed) {
    return "unknown";
  }
  const parsed = VoiceAsrProviderIdSchema.safeParse(trimmed);
  if (!parsed.success) {
    throw new Error("VOICE_REGRESSION_ASR_PROVIDER_ID_INVALID");
  }
  return parsed.data;
}

function sanitizeContext(input: VoiceRegressionCaptureInput["context"]) {
  return {
    ...(input?.activeCapabilityId
      ? { activeCapabilityId: input.activeCapabilityId.slice(0, 128) }
      : {}),
    ...(input?.enabledCapabilityIds
      ? {
          enabledCapabilityIds: input.enabledCapabilityIds
            .map((id) => id.trim())
            .filter((id) => id.length > 0)
            .slice(0, 16),
        }
      : {}),
    ...(input?.activeView ? { activeView: input.activeView.slice(0, 64) } : {}),
  };
}

function createSampleKey(sample: VoiceRegressionSample): string {
  return JSON.stringify({
    mode: sample.mode,
    rawTranscript: sample.asr.rawTranscript,
    normalizedText: sample.resolver.normalizedText,
    outcomeClass: sample.resolver.outcomeClass,
    candidates: sample.resolver.candidates.map((candidate) => ({
      intent: candidate.intent,
      safeSlots: candidate.safeSlots,
      source: candidate.source,
    })),
  });
}

function extractFeedbackRedactions(
  feedback: VoiceRegressionRecord["feedback"],
): string[] {
  return feedback.correctedText?.includes("[redacted") ? ["feedback"] : [];
}

function assertNoSensitiveVoiceRegressionRecordContent(
  record: VoiceRegressionRecord,
): void {
  assertNoSensitiveVoiceRegressionSampleContent(record);
  assertNoSensitiveVoiceRegressionUserContent(
    record.feedback.correctedText === undefined
      ? []
      : [record.feedback.correctedText],
  );
}

function assertNoSensitiveVoiceRegressionSampleContent(
  sample: VoiceRegressionSample,
): void {
  assertNoSensitiveVoiceRegressionUserContent([
    sample.asr.rawTranscript,
    sample.resolver.normalizedText,
    ...sample.resolver.candidates.flatMap((candidate) =>
      collectUserTextFromUnknown(candidate.safeSlots),
    ),
  ]);
}

function collectUserTextFromUnknown(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectUserTextFromUnknown(entry));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) => [
      key,
      ...collectUserTextFromUnknown(entry),
    ]);
  }
  return [];
}

function assertNoSensitiveVoiceRegressionUserContent(texts: string[]): void {
  const findings = unique(
    texts.flatMap((text) => scanVoiceRegressionSensitiveText(text)),
  );
  if (findings.length > 0) {
    throw new Error(`VOICE_REGRESSION_SENSITIVE_CONTENT:${findings.join(",")}`);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)].slice(0, 32);
}
