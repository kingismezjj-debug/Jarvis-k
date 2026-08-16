import { describe, expect, it } from "vitest";
import type {
  VoiceRegressionConsentLevel,
  VoiceRegressionRecord,
} from "@jarvis-k/contracts";
import {
  VoiceRegressionService,
  type VoiceRegressionRepository,
} from "../src/voice-regression-service";

class InMemoryVoiceRegressionRepository implements VoiceRegressionRepository {
  public initialized = false;
  public consentLevel: VoiceRegressionConsentLevel = "off";
  public readonly records: VoiceRegressionRecord[] = [];

  public async initialize(): Promise<void> {
    this.initialized = true;
  }

  public async getConsentLevel(): Promise<VoiceRegressionConsentLevel> {
    return this.consentLevel;
  }

  public async setConsentLevel(
    level: VoiceRegressionConsentLevel,
  ): Promise<void> {
    this.consentLevel = level;
  }

  public async countRecords(): Promise<number> {
    return this.records.length;
  }

  public async appendRecord(
    record: VoiceRegressionRecord,
  ): Promise<VoiceRegressionRecord> {
    this.records.push(record);
    return record;
  }

  public async listRecords(options?: {
    limit?: number | undefined;
  }): Promise<VoiceRegressionRecord[]> {
    return this.records.slice(-(options?.limit ?? this.records.length)).reverse();
  }

  public async updateFeedback(input: {
    recordId: string;
    feedback: VoiceRegressionRecord["feedback"];
  }): Promise<VoiceRegressionRecord | undefined> {
    const index = this.records.findIndex((record) => record.id === input.recordId);
    if (index < 0) {
      return undefined;
    }
    const existing = this.records[index];
    if (!existing) {
      return undefined;
    }
    this.records[index] = {
      ...existing,
      feedback: input.feedback,
    };
    return this.records[index];
  }

  public async deleteRecord(recordId: string): Promise<boolean> {
    const index = this.records.findIndex((record) => record.id === recordId);
    if (index < 0) {
      return false;
    }
    this.records.splice(index, 1);
    return true;
  }

  public async clearRecords(): Promise<number> {
    const count = this.records.length;
    this.records.splice(0, this.records.length);
    return count;
  }
}

describe("VoiceRegressionService", () => {
  it("defaults to level 0 without writing local text records", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    const service = new VoiceRegressionService(repository, fixedNow);

    const status = await service.getStatus();
    const captured = await service.captureResolution({
      correction: correctionFixture(),
      resolverLatencyMs: 7,
    });

    expect(status).toMatchObject({
      consentLevel: "off",
      localTextCollectionEnabled: false,
      localAudioCollectionSupported: false,
      localAudioConsentLevel: "unsupported",
      uploadAllowed: false,
      audioRetained: false,
      storage: "local_json",
    });
    expect(captured.recorded).toBe(false);
    expect(repository.records).toHaveLength(0);
  });

  it("requires explicit consent before enabling level 1 collection", async () => {
    const service = new VoiceRegressionService(
      new InMemoryVoiceRegressionRepository(),
      fixedNow,
    );

    await expect(
      service.setConsent({ consentLevel: "local_text" }),
    ).rejects.toThrow("VOICE_REGRESSION_EXPLICIT_CONSENT_REQUIRED");

    await expect(
      service.setConsent({
        consentLevel: "local_text",
        confirmation: "explicit_ui_confirmation",
      }),
    ).resolves.toMatchObject({
      consentLevel: "local_text",
      localTextCollectionEnabled: true,
      localOnly: true,
      uploadAllowed: false,
    });
  });

  it("captures only sanitized local text fields when level 1 is enabled", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    const service = new VoiceRegressionService(repository, fixedNow);
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });

    const captured = await service.captureResolution({
      correction: correctionFixture({
        slots: {
          target: "notepad",
          text: "secret typed content",
          apiToken: "should-not-be-stored",
        },
      }),
      asrProviderId: "xunfei",
      providerConfidence: 0.82,
      asrLatencyMs: 123,
      resolverLatencyMs: 6,
      context: {
        activeView: "voice",
        enabledCapabilityIds: ["voice", "memory"],
      },
    });

    expect(captured.recorded).toBe(true);
    expect(captured.record?.asr).toMatchObject({
      providerId: "xunfei",
      rawTranscript: "\u6253\u5f00\u8bb0\u4e8b\u672c",
      providerConfidence: 0.82,
      isFinal: true,
      latencyMs: 123,
    });
    expect(captured.record?.resolver).toMatchObject({
      version: "voice-command-resolver.deterministic.v1",
      normalizedText: "\u6253\u5f00\u8bb0\u4e8b\u672c",
      outcomeClass: "candidate",
      clarificationRequired: false,
      blocked: false,
      latencyMs: 6,
    });
    expect(captured.record?.resolver.candidates[0]?.safeSlots).toEqual({
      target: "notepad",
      text: "[redacted]",
      apiToken: "[redacted]",
    });
    expect(captured.record?.privacy).toEqual({
      redactions: ["slot:text", "slot:apiToken"],
      containsAudio: false,
      uploadAllowed: false,
    });
  });

  it("supports local view, feedback, deletion, clearing, and export", async () => {
    const service = new VoiceRegressionService(
      new InMemoryVoiceRegressionRepository(),
      fixedNow,
    );
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });
    const captured = await service.captureResolution({
      correction: correctionFixture(),
      resolverLatencyMs: 3,
    });
    const id = captured.record?.id ?? "";

    await expect(
      service.submitFeedback({
        recordId: id,
        status: "corrected",
        correctedText: "\u6253\u5f00\u8bb0\u4e8b\u672c",
        intendedIntent: "localApp.open",
      }),
    ).resolves.toMatchObject({
      feedback: {
        status: "corrected",
        correctedText: "\u6253\u5f00\u8bb0\u4e8b\u672c",
        intendedIntent: "localApp.open",
      },
    });
    await expect(service.listRecords()).resolves.toHaveLength(1);
    await expect(service.exportRecords()).resolves.toMatchObject({
      provenance: "USER_INITIATED_LOCAL_VOICE_REGRESSION_EXPORT",
      localOnly: true,
      uploadAllowed: false,
      containsAudio: false,
      recordCount: 1,
    });
    await expect(service.deleteRecord(id)).resolves.toBe(true);
    await expect(service.clearRecords()).resolves.toBe(0);
  });
});

function fixedNow(): Date {
  return new Date("2026-08-16T00:00:00.000Z");
}

function correctionFixture(input?: { slots?: Record<string, unknown> }) {
  return {
    rawTranscript: "\u6253\u5f00\u8bb0\u4e8b\u672c",
    normalizedTranscript: "\u6253\u5f00\u8bb0\u4e8b\u672c",
    inputMode: "command" as const,
    correctionSource: "slot_grammar" as const,
    correctionConfidence: 0.98,
    correctionCandidates: [
      {
        id: "open.notepad",
        normalizedTranscript: "\u6253\u5f00\u8bb0\u4e8b\u672c",
        inputMode: "command" as const,
        intent: "localApp.open" as const,
        confidence: 0.98,
        correctionSource: "slot_grammar" as const,
        label: "Open Notepad",
        slots: input?.slots ?? { target: "notepad" },
      },
    ],
    requiresUserSelection: false,
    rawTranscriptPreserved: true as const,
    directActionAttempted: false as const,
  };
}
