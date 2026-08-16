import {
  type BrainIntent,
  type VoiceCommandCorrection,
  type VoiceInputMode,
  type VoiceRegressionCollectionStatus,
  VoiceRegressionCollectionStatusSchema,
  type VoiceRegressionConsentLevel,
  type VoiceRegressionExport,
  VoiceRegressionExportSchema,
  VoiceRegressionFeedbackSchema,
  type VoiceRegressionFeedbackStatus,
  type VoiceRegressionRecord,
  VoiceRegressionRecordSchema,
  createId,
} from "@jarvis-k/contracts";

const RESOLVER_VERSION = "voice-command-resolver.deterministic.v1";
const MAX_RECORDS = 10_000;
const SENSITIVE_SLOT_KEY_PATTERN =
  /(?:credential|password|passwd|secret|token|api[_-]?key|authorization|cookie|content|file|path|text|query)/iu;

export interface VoiceRegressionRepository {
  initialize(): Promise<void>;
  getConsentLevel(): Promise<VoiceRegressionConsentLevel>;
  setConsentLevel(level: VoiceRegressionConsentLevel): Promise<void>;
  countRecords(): Promise<number>;
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
  feedbackStatus?: VoiceRegressionFeedbackStatus | undefined;
  selectedCandidateIndex?: number | undefined;
  correctedText?: string | undefined;
  intendedIntent?: BrainIntent | undefined;
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
    return this.status({
      consentLevel,
      recordCount: await this.repository.countRecords(),
      storage: "local_json",
    });
  }

  public async setConsent(input: {
    consentLevel: VoiceRegressionConsentLevel;
    confirmation?: "explicit_ui_confirmation" | undefined;
  }): Promise<VoiceRegressionCollectionStatus> {
    if (!this.repository) {
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
    return this.status({
      consentLevel: input.consentLevel,
      recordCount: await this.repository.countRecords(),
      storage: "local_json",
    });
  }

  public async captureResolution(
    input: VoiceRegressionCaptureInput,
  ): Promise<{ recorded: boolean; record?: VoiceRegressionRecord }> {
    if (!this.repository) {
      return { recorded: false };
    }
    await this.ensureInitialized();
    if ((await this.repository.getConsentLevel()) !== "local_text") {
      return { recorded: false };
    }
    const record = VoiceRegressionRecordSchema.parse({
      id: createId("voice-regression"),
      schemaVersion: 1,
      createdAt: this.now().toISOString(),
      consentLevel: "local_text",
      locale: "zh-CN",
      mode: input.mode ?? input.correction.inputMode,
      asr: {
        providerId: sanitizeProviderId(input.asrProviderId),
        rawTranscript: input.correction.rawTranscript,
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
        normalizedText: input.correction.normalizedTranscript,
        outcomeClass: classifyOutcome(input.correction),
        candidates: input.correction.correctionCandidates.slice(0, 5).map(
          (candidate) => {
            const sanitized = sanitizeSlots(candidate.slots);
            return {
              intent: candidate.intent,
              safeSlots: sanitized.slots,
              confidence: candidate.confidence,
              source: candidate.correctionSource,
            };
          },
        ),
        clarificationRequired: input.correction.requiresUserSelection,
        blocked:
          input.correction.correctionCandidates[0]?.intent === "blocked",
        latencyMs: input.resolverLatencyMs ?? 0,
      },
      feedback: {
        status:
          input.feedbackStatus ??
          (input.correction.requiresUserSelection ? "abandoned" : "accepted"),
        ...(input.selectedCandidateIndex === undefined
          ? {}
          : { selectedCandidateIndex: input.selectedCandidateIndex }),
        ...(input.correctedText === undefined
          ? {}
          : { correctedText: input.correctedText }),
        ...(input.intendedIntent === undefined
          ? {}
          : { intendedIntent: input.intendedIntent }),
      },
      context: sanitizeContext(input.context),
      privacy: {
        redactions: input.correction.correctionCandidates
          .flatMap((candidate) => sanitizeSlots(candidate.slots).redactions)
          .filter(unique)
          .slice(0, 32),
        containsAudio: false,
        uploadAllowed: false,
      },
    });
    return {
      recorded: true,
      record: await this.repository.appendRecord(record),
    };
  }

  public async listRecords(options?: {
    limit?: number | undefined;
  }): Promise<VoiceRegressionRecord[]> {
    if (!this.repository) {
      return [];
    }
    await this.ensureInitialized();
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
    return this.repository.updateFeedback({
      recordId: input.recordId,
      feedback: VoiceRegressionFeedbackSchema.parse({
        status: input.status,
        ...(input.selectedCandidateIndex === undefined
          ? {}
          : { selectedCandidateIndex: input.selectedCandidateIndex }),
        ...(input.correctedText === undefined
          ? {}
          : { correctedText: input.correctedText }),
        ...(input.intendedIntent === undefined
          ? {}
          : { intendedIntent: input.intendedIntent }),
      }),
    });
  }

  public async deleteRecord(recordId: string): Promise<boolean> {
    if (!this.repository) {
      return false;
    }
    await this.ensureInitialized();
    return this.repository.deleteRecord(recordId);
  }

  public async clearRecords(): Promise<number> {
    if (!this.repository) {
      return 0;
    }
    await this.ensureInitialized();
    return this.repository.clearRecords();
  }

  public async exportRecords(): Promise<VoiceRegressionExport> {
    const records = await this.listRecords({ limit: MAX_RECORDS });
    return VoiceRegressionExportSchema.parse({
      schemaVersion: 1,
      exportedAt: this.now().toISOString(),
      provenance: "USER_INITIATED_LOCAL_VOICE_REGRESSION_EXPORT",
      localOnly: true,
      uploadAllowed: false,
      containsAudio: false,
      recordCount: records.length,
      records,
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized || !this.repository) {
      return;
    }
    await this.repository.initialize();
    this.initialized = true;
  }

  private status(input: {
    consentLevel: VoiceRegressionConsentLevel;
    recordCount: number;
    storage: "not_configured" | "local_json";
  }): VoiceRegressionCollectionStatus {
    return VoiceRegressionCollectionStatusSchema.parse({
      consentLevel: input.consentLevel,
      localTextCollectionEnabled: input.consentLevel === "local_text",
      localTextCollectionSupported: input.storage === "local_json",
      localAudioCollectionSupported: false,
      localAudioConsentLevel: "unsupported",
      recordCount: input.recordCount,
      localOnly: true,
      uploadAllowed: false,
      audioRetained: false,
      retentionPolicy: "user_managed",
      storage: input.storage,
    });
  }
}

function classifyOutcome(
  correction: VoiceCommandCorrection,
): VoiceRegressionRecord["resolver"]["outcomeClass"] {
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

function sanitizeProviderId(providerId: string | undefined): string {
  const trimmed = providerId?.trim();
  return trimmed && trimmed.length <= 128 ? trimmed : "unknown";
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

function sanitizeSlots(slots: Record<string, unknown>): {
  slots: Record<string, unknown>;
  redactions: string[];
} {
  const safeSlots: Record<string, unknown> = {};
  const redactions: string[] = [];
  for (const [key, value] of Object.entries(slots)) {
    if (SENSITIVE_SLOT_KEY_PATTERN.test(key)) {
      safeSlots[key] = "[redacted]";
      redactions.push(`slot:${key}`);
      continue;
    }
    if (typeof value === "string") {
      safeSlots[key] = value.slice(0, 200);
      continue;
    }
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      safeSlots[key] = value;
      continue;
    }
    safeSlots[key] = "[redacted]";
    redactions.push(`slot:${key}`);
  }
  return { slots: safeSlots, redactions };
}

function unique(value: string, index: number, values: string[]): boolean {
  return values.indexOf(value) === index;
}
