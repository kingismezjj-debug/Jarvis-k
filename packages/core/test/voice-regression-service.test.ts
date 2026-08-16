import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type {
  VoiceRegressionConsentLevel,
  VoiceRegressionRecord,
} from "@jarvis-k/contracts";
import {
  VoiceRegressionService,
  type VoiceRegressionRepository,
  type VoiceRegressionRetentionPolicy,
  type VoiceRegressionRetentionResult,
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

  public async applyRetention(
    policy: VoiceRegressionRetentionPolicy,
  ): Promise<VoiceRegressionRetentionResult> {
    const cutoffMs =
      policy.now.getTime() - policy.maxAgeDays * 24 * 60 * 60 * 1000;
    const retained = this.records
      .filter((record) => new Date(record.createdAt).getTime() >= cutoffMs)
      .slice(-policy.maxRecords);
    while (
      retained.length > 0 &&
      Buffer.byteLength(JSON.stringify(retained), "utf8") > policy.maxBytes
    ) {
      retained.shift();
    }
    const deletedCount = this.records.length - retained.length;
    this.records.splice(0, this.records.length, ...retained);
    return {
      deletedCount,
      recordCount: this.records.length,
      approximateBytes: Buffer.byteLength(JSON.stringify(retained), "utf8"),
      appliedAt: policy.now.toISOString(),
    };
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
      retentionMaxRecords: 10_000,
      retentionMaxAgeDays: 30,
      retentionMaxBytes: 5 * 1024 * 1024,
      retentionPolicy: "local_text_30d_10000_records_5mb",
      uploadAllowed: false,
      audioRetained: false,
      storage: "local_json",
    });
    expect(captured.pending).toBe(false);
    expect(service.listPendingSamples()).toHaveLength(0);
    expect(repository.records).toHaveLength(0);
  });

  it("applies explicit retention before status, list, and export", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    repository.records.push(
      recordFixture("old", "2026-07-01T00:00:00.000Z"),
      recordFixture("current", "2026-08-16T00:00:00.000Z"),
    );
    const service = new VoiceRegressionService(repository, fixedNow);

    const status = await service.getStatus();

    expect(status).toMatchObject({
      recordCount: 1,
      retentionDeletedCount: 1,
      retentionLastAppliedAt: "2026-08-16T00:00:00.000Z",
    });
    await expect(service.listRecords()).resolves.toMatchObject([
      { id: "voice-regression_current" },
    ]);
    const exported = await service.exportRecords();
    expect(exported.recordCount).toBe(1);
    expect(exported.jsonl).toContain("voice-regression_current");
    expect(exported.jsonl).not.toContain("voice-regression_old");
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

    expect(captured.pending).toBe(true);
    expect(repository.records).toHaveLength(0);
    expect(service.listPendingSamples()).toHaveLength(1);
    const saved = await service.savePendingSample({
      sampleId: captured.sample?.id ?? "",
      status: "accepted",
      selectedCandidateIndex: 0,
    });
    expect(saved?.asr).toMatchObject({
      providerId: "xunfei",
      rawTranscript: "\u6253\u5f00\u8bb0\u4e8b\u672c",
      providerConfidence: 0.82,
      isFinal: true,
      latencyMs: 123,
    });
    expect(saved?.resolver).toMatchObject({
      version: "voice-command-resolver.deterministic.v1",
      normalizedText: "\u6253\u5f00\u8bb0\u4e8b\u672c",
      outcomeClass: "candidate",
      clarificationRequired: false,
      blocked: false,
      latencyMs: 6,
    });
    expect(saved?.resolver.candidates[0]?.safeSlots).toEqual({
      target: "notepad",
      text: "[redacted]",
      apiToken: "[redacted]",
    });
    expect(saved?.privacy).toEqual({
      redactions: ["slot:text", "slot:apiToken"],
      containsAudio: false,
      uploadAllowed: false,
    });
    expect(repository.records).toHaveLength(1);
  });

  it("rejects credential-shaped ASR provider IDs without creating pending samples", async () => {
    const credentialLikeProviderId = [
      "https",
      "://asr.example.test/path?api_",
      "key=fake",
    ].join("");
    const service = new VoiceRegressionService(
      new InMemoryVoiceRegressionRepository(),
      fixedNow,
    );
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });

    await expect(
      service.captureResolution({
        correction: correctionFixture(),
        asrProviderId: credentialLikeProviderId,
      }),
    ).rejects.toThrow("VOICE_REGRESSION_ASR_PROVIDER_ID_INVALID");
    expect(service.listPendingSamples()).toHaveLength(0);
  });

  it("preserves ASR provider identity across accepted, corrected, and rejected feedback", async () => {
    const service = new VoiceRegressionService(
      new InMemoryVoiceRegressionRepository(),
      fixedNow,
    );
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });

    const cases = [
      { status: "accepted" as const, providerId: "xunfei" as const },
      { status: "corrected" as const, providerId: "volcengine" as const },
      { status: "rejected" as const, providerId: "fixture-asr" as const },
    ];
    for (const [index, item] of cases.entries()) {
      const captured = await service.captureResolution({
        correction: correctionFixture({
          rawTranscript: `打开记事本 ${index}`,
          normalizedTranscript: `打开记事本 ${index}`,
        }),
        asrProviderId: item.providerId,
      });
      const saved = await service.savePendingSample({
        sampleId: captured.sample?.id ?? "",
        status: item.status,
        ...(item.status === "corrected"
          ? { correctedText: "打开记事本", intendedIntent: "localApp.open" as const }
          : {}),
      });

      expect(saved?.feedback.status).toBe(item.status);
      expect(saved?.asr.providerId).toBe(item.providerId);
    }
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
    expect(captured.pending).toBe(true);
    const saved = await service.savePendingSample({
      sampleId: captured.sample?.id ?? "",
      status: "accepted",
      selectedCandidateIndex: 0,
    });
    const id = saved?.id ?? "";

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
    const exported = await service.exportRecords();
    expect(exported).toMatchObject({
      provenance: "USER_INITIATED_LOCAL_VOICE_REGRESSION_EXPORT",
      localOnly: true,
      uploadAllowed: false,
      containsAudio: false,
      format: "jsonl",
      recordCount: 1,
    });
    expect(exported.digestSha256).toBe(
      createHash("sha256").update(exported.jsonl, "utf8").digest("hex"),
    );
    expect(exported.jsonl).toContain(id);
    await expect(service.deleteRecord(id)).resolves.toBe(true);
    await expect(service.clearRecords()).resolves.toBe(0);
  });

  it("discards pending samples without persisting abandoned records", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    const service = new VoiceRegressionService(repository, fixedNow);
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });

    const captured = await service.captureResolution({
      correction: correctionFixture(),
    });

    expect(captured.pending).toBe(true);
    expect(service.discardPendingSample(captured.sample?.id ?? "")).toBe(true);
    expect(service.listPendingSamples()).toHaveLength(0);
    expect(repository.records).toHaveLength(0);
  });

  it("deduplicates repeated final resolver outputs until feedback is saved", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    const service = new VoiceRegressionService(repository, fixedNow);
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });

    const first = await service.captureResolution({
      correction: correctionFixture(),
    });
    const second = await service.captureResolution({
      correction: correctionFixture(),
    });

    expect(first.sample?.id).toBe(second.sample?.id);
    expect(service.listPendingSamples()).toHaveLength(1);
    await service.savePendingSample({
      sampleId: first.sample?.id ?? "",
      status: "accepted",
    });
    const third = await service.captureResolution({
      correction: correctionFixture(),
    });
    expect(third.pending).toBe(false);
    expect(repository.records).toHaveLength(1);
  });

  it("clears pending samples when consent is disabled", async () => {
    const service = new VoiceRegressionService(
      new InMemoryVoiceRegressionRepository(),
      fixedNow,
    );
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });
    await service.captureResolution({ correction: correctionFixture() });
    expect(service.listPendingSamples()).toHaveLength(1);

    await service.setConsent({ consentLevel: "off" });

    expect(service.listPendingSamples()).toHaveLength(0);
    await expect(service.getStatus()).resolves.toMatchObject({
      consentLevel: "off",
      pendingCount: 0,
    });
  });

  it("does not scan trusted ids, timestamps, and numeric metrics as user text", async () => {
    const randomUuid = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("1234-5678-9012-1234-567890123456");
    try {
      const repository = new InMemoryVoiceRegressionRepository();
      const service = new VoiceRegressionService(repository, fixedNow);
      await service.setConsent({
        consentLevel: "local_text",
        confirmation: "explicit_ui_confirmation",
      });

      const captured = await service.captureResolution({
        correction: correctionFixture({
          rawTranscript: "open notepad",
          normalizedTranscript: "open notepad",
        }),
        providerConfidence: 0.1234567890123456,
        asrLatencyMs: 1234567890,
        resolverLatencyMs: 5678901234,
      });

      expect(captured.pending).toBe(true);
      expect(captured.sample?.id).toContain("1234-5678-9012");
      await expect(
        service.savePendingSample({
          sampleId: captured.sample?.id ?? "",
          status: "accepted",
        }),
      ).resolves.toMatchObject({
        id: expect.stringContaining("1234-5678-9012"),
        createdAt: "2026-08-16T00:00:00.000Z",
      });
    } finally {
      randomUuid.mockRestore();
    }
  });

  it("redacts phone numbers from raw and normalized transcripts before scanning", async () => {
    const service = new VoiceRegressionService(
      new InMemoryVoiceRegressionRepository(),
      fixedNow,
    );
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });

    const captured = await service.captureResolution({
      correction: correctionFixture({
        rawTranscript: "please remember 138-1234-5678",
        normalizedTranscript: "please remember 138-1234-5678",
      }),
    });

    expect(captured.pending).toBe(true);
    expect(captured.sample?.asr.rawTranscript).toContain("[redacted:phone]");
    expect(captured.sample?.resolver.normalizedText).toContain(
      "[redacted:phone]",
    );
    expect(JSON.stringify(captured.sample)).not.toContain("138-1234-5678");
  });

  it("redacts sensitive corrected feedback without dropping the pending sample", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    const service = new VoiceRegressionService(repository, fixedNow);
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });
    const captured = await service.captureResolution({
      correction: correctionFixture(),
    });

    const saved = await service.savePendingSample({
      sampleId: captured.sample?.id ?? "",
      status: "corrected",
      correctedText: "correct phrase 138-1234-5678",
    });

    expect(saved?.feedback.correctedText).toBe(
      "correct phrase [redacted:phone]",
    );
    expect(JSON.stringify(saved)).not.toContain("138-1234-5678");
    expect(saved?.privacy.redactions).toContain("feedback");
    expect(repository.records).toHaveLength(1);
  });

  it("redacts sensitive slot values before save and export", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    const service = new VoiceRegressionService(repository, fixedNow);
    const sensitive = sensitiveSlotFixture();
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });
    const captured = await service.captureResolution({
      correction: correctionFixture({
        slots: {
          target: "notepad",
          bearer: sensitive.bearer,
          jwt: sensitive.jwt,
          email: sensitive.email,
          win: sensitive.win,
          unc: sensitive.unc,
          url: sensitive.url,
          ip: sensitive.ip,
        },
      }),
    });

    await service.savePendingSample({
      sampleId: captured.sample?.id ?? "",
      status: "accepted",
    });
    const exported = await service.exportRecords();

    expect(exported.jsonl).not.toContain(sensitive.bearer);
    expect(exported.jsonl).not.toContain(sensitive.jwt.split(".")[0]);
    expect(exported.jsonl).not.toContain(sensitive.email);
    expect(exported.jsonl).not.toContain(sensitive.win);
    expect(exported.jsonl).not.toContain(sensitive.unc);
    expect(exported.jsonl).not.toContain(sensitive.url.split("?")[1]);
    expect(exported.jsonl).not.toContain(sensitive.ip);
    expect(exported.jsonl).toContain("[redacted");
  });

  it("fails closed when exported candidate user content contains sensitive text", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    repository.records.push({
      ...recordFixture("candidate-sensitive", "2026-08-16T00:00:00.000Z"),
      resolver: {
        ...recordFixture("candidate-sensitive", "2026-08-16T00:00:00.000Z")
          .resolver,
        candidates: [
          {
            intent: "localApp.open",
            safeSlots: { reason: "call 138-1234-5678" },
            confidence: 0.95,
            source: "structured_candidate_selector",
          },
        ],
      },
    });
    const service = new VoiceRegressionService(repository, fixedNow);

    await expect(service.exportRecords()).rejects.toThrow(
      "VOICE_REGRESSION_SENSITIVE_CONTENT:phone",
    );
  });

  it("fails closed on illegal exported record fields before content scanning", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    repository.records.push({
      ...recordFixture("extra-field", "2026-08-16T00:00:00.000Z"),
      unexpectedField: "not allowed",
    } as unknown as VoiceRegressionRecord);
    const service = new VoiceRegressionService(repository, fixedNow);

    await expect(service.exportRecords()).rejects.toThrow();
  });

  it("keeps a pending sample when repository save fails", async () => {
    const repository = new InMemoryVoiceRegressionRepository();
    repository.appendRecord = async () => {
      throw new Error("WRITE_FAILED");
    };
    const service = new VoiceRegressionService(repository, fixedNow);
    await service.setConsent({
      consentLevel: "local_text",
      confirmation: "explicit_ui_confirmation",
    });
    const captured = await service.captureResolution({
      correction: correctionFixture(),
    });

    await expect(
      service.savePendingSample({
        sampleId: captured.sample?.id ?? "",
        status: "accepted",
      }),
    ).rejects.toThrow("WRITE_FAILED");

    expect(service.listPendingSamples()).toHaveLength(1);
    expect(repository.records).toHaveLength(0);
  });
});

function fixedNow(): Date {
  return new Date("2026-08-16T00:00:00.000Z");
}

function sensitiveSlotFixture(): Record<string, string> {
  return {
    bearer: `Bearer ${"abcdefghijklmnop"}`,
    jwt: ["eyJaaaaaaaa", "bbbbbbbbb", "ccccccccc"].join("."),
    email: ["fake", "example.test"].join("@"),
    win: ["C:", "Fake", "secret.txt"].join("\\"),
    unc: `\\\\${"server"}\\${"share"}\\secret.txt`,
    url: `https://example.test/path?${"token"}=fake`,
    ip: ["192", "168", "1", "1"].join("."),
  };
}

function correctionFixture(input?: {
  slots?: Record<string, unknown>;
  rawTranscript?: string;
  normalizedTranscript?: string;
}) {
  return {
    rawTranscript: input?.rawTranscript ?? "\u6253\u5f00\u8bb0\u4e8b\u672c",
    normalizedTranscript:
      input?.normalizedTranscript ?? "\u6253\u5f00\u8bb0\u4e8b\u672c",
    inputMode: "command" as const,
    correctionSource: "slot_grammar" as const,
    correctionConfidence: 0.98,
    correctionCandidates: [
      {
        id: "open.notepad",
        normalizedTranscript:
          input?.normalizedTranscript ?? "\u6253\u5f00\u8bb0\u4e8b\u672c",
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

function recordFixture(
  suffix: string,
  createdAt: string,
): VoiceRegressionRecord {
  return {
    id: `voice-regression_${suffix}`,
    schemaVersion: 1,
    createdAt,
    consentLevel: "local_text",
    locale: "zh-CN",
    mode: "command",
    asr: {
      providerId: "fixture-asr",
      rawTranscript: `open notepad ${suffix}`,
      isFinal: true,
    },
    resolver: {
      version: "voice-command-resolver.deterministic.v1",
      normalizedText: `open notepad ${suffix}`,
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
  };
}
