import { describe, expect, it } from "vitest";

import {
  type VoiceRegressionDualFeedback,
  type VoiceRegressionSample,
  VoiceRegressionSampleSchema,
} from "@jarvis-k/contracts";
import { VOICE_PILOT_MANIFEST } from "../src/voice-pilot-manifest";
import {
  VoicePilotSessionService,
  type VoicePilotBinding,
} from "../src/voice-pilot-session-service";

const DIGEST = "a".repeat(64);
const ACCEPTED_FEEDBACK: VoiceRegressionDualFeedback = {
  kind: "dual_layer",
  transcript: { status: "accepted" },
  resolution: { status: "accepted" },
};

describe("VoicePilotSessionService", () => {
  it("creates ready sessions only when expected and actual real providers match", async () => {
    for (const providerId of ["xunfei", "volcengine"] as const) {
      const service = createService({ expectedProviderId: providerId });
      service.setActualProvider(providerId);

      const projection = await service.prepare();

      expect(projection).toMatchObject({
        expectedProviderId: providerId,
        actualProviderId: providerId,
        inputMode: "command",
        inputModeSource: "explicit_ui",
        sessionState: "ready",
        allowManualPilot: true,
        providerMatchesExpected: true,
        recordCount: 0,
        manifestId: VOICE_PILOT_MANIFEST.manifestId,
        manifestDigest: VOICE_PILOT_MANIFEST.digest,
        expectedPromptCount: 20,
        terminalPromptCount: 0,
        currentPrompt: { promptId: "P01", status: "pending" },
      });
    }
  });

  it("fails closed when provider or required context is missing", async () => {
    const missingExpected = createService();
    missingExpected.setActualProvider("xunfei");
    await expect(missingExpected.prepare()).resolves.toMatchObject({
      sessionState: "inactive",
      allowManualPilot: false,
      invalidationReason: "EXPECTED_PROVIDER_MISSING",
    });

    const missingContext = createService({
      expectedProviderId: "xunfei",
      getRequiredContext: async () => ({
        routeAliases: [],
        readonlyPlugins: [],
        missing: ["route_alias:jarvis_project_homepage"],
      }),
    });
    missingContext.setActualProvider("xunfei");
    await expect(missingContext.prepare()).resolves.toMatchObject({
      sessionState: "inactive",
      allowManualPilot: false,
      invalidationReason: "REQUIRED_CONTEXT_MISSING",
      requiredContext: {
        missing: ["route_alias:jarvis_project_homepage"],
      },
    });

    const service = createService({ expectedProviderId: "xunfei" });
    service.setActualProvider("fixture-asr");
    await expect(service.prepare()).resolves.toMatchObject({
      sessionState: "inactive",
      actualProviderId: "fixture-asr",
      invalidationReason: "ACTUAL_PROVIDER_UNAVAILABLE",
    });
  });

  it("binds one final transcript to the active prompt in manifest order", async () => {
    const service = await prepareReadyService();

    expect(service.startPrompt()).toMatchObject({
      currentPrompt: { promptId: "P01", status: "active" },
    });
    const decision = service.beforeCapture({
      providerId: "xunfei",
      mode: "command",
      modeSource: "explicit_ui",
    });
    expect(decision).toMatchObject({
      allowed: true,
      pilot: { promptId: "P01", ordinal: 1 },
    });
    const sample = sampleFor((decision as { pilot: VoicePilotBinding }).pilot);
    service.attachPendingSample(sample);
    expect(service.beforeSave({ sample, feedback: ACCEPTED_FEEDBACK })).toEqual({
      allowed: true,
      warning: undefined,
    });
    service.recordSaved({ record: { ...sample, feedback: ACCEPTED_FEEDBACK } });

    expect(service.getProjection()).toMatchObject({
      terminalPromptCount: 1,
      recordCount: 1,
      currentPrompt: { promptId: "P02", status: "pending" },
    });
  });

  it("rejects duplicate, out-of-order, non-manifest, provider, and mode drift", async () => {
    const service = await prepareReadyService();
    expect(service.beforeCapture({
      providerId: "xunfei",
      mode: "command",
      modeSource: "explicit_ui",
    })).toMatchObject({ allowed: false, reason: "NO_ACTIVE_PROMPT" });

    service.startPrompt();
    expect(service.startPrompt()).toMatchObject({
      sessionState: "invalidated",
      invalidationReason: "PROMPT_ORDER_VIOLATION",
    });

    const providerMismatch = await prepareReadyService();
    providerMismatch.startPrompt();
    expect(providerMismatch.beforeCapture({
      providerId: "volcengine",
      mode: "command",
      modeSource: "explicit_ui",
    })).toEqual({ allowed: false, reason: "PROVIDER_MISMATCH" });

    const modeMismatch = await prepareReadyService();
    modeMismatch.startPrompt();
    expect(modeMismatch.beforeCapture({
      providerId: "xunfei",
      mode: "conversation",
      modeSource: "explicit_ui",
    })).toEqual({ allowed: false, reason: "MODE_MISMATCH" });

    const duplicate = await prepareReadyService();
    duplicate.startPrompt();
    const first = duplicate.beforeCapture({
      providerId: "xunfei",
      mode: "command",
      modeSource: "explicit_ui",
    }) as { allowed: true; pilot: VoicePilotBinding };
    duplicate.attachPendingSample(sampleFor(first.pilot));
    expect(duplicate.beforeCapture({
      providerId: "xunfei",
      mode: "command",
      modeSource: "explicit_ui",
    })).toEqual({
      allowed: false,
      reason: "PROMPT_ALREADY_HAS_TRANSCRIPT",
    });

    const nonManifest = await prepareReadyService();
    nonManifest.startPrompt();
    const bad = sampleFor({
      ...first.pilot,
      sessionId: "voice-pilot-session-other",
    });
    expect(
      nonManifest.beforeSave({ sample: bad, feedback: ACCEPTED_FEEDBACK }),
    ).toMatchObject({ allowed: false, reason: "PROMPT_ORDER_VIOLATION" });
  });

  it("records no-final, discard, and operator deviation as prompt outcomes only", async () => {
    const noFinal = await prepareReadyService();
    noFinal.startPrompt();
    expect(noFinal.markNoFinalTranscript()).toMatchObject({
      terminalPromptCount: 1,
      noFinalTranscriptCount: 1,
      currentPrompt: { promptId: "P02" },
    });

    const discarded = await prepareReadyService();
    discarded.startPrompt();
    const captured = discarded.beforeCapture({
      providerId: "xunfei",
      mode: "command",
      modeSource: "explicit_ui",
    }) as { allowed: true; pilot: VoicePilotBinding };
    const sample = sampleFor(captured.pilot);
    discarded.attachPendingSample(sample);
    expect(discarded.recordDiscard(sample)).toEqual({ allowed: true });
    expect(discarded.getProjection()).toMatchObject({
      terminalPromptCount: 1,
      discardedCount: 1,
      recordCount: 0,
    });
    expect(discarded.complete(DIGEST)).toMatchObject({
      sessionValid: false,
      discardedCount: 1,
    });

    const deviated = await prepareReadyService();
    deviated.startPrompt();
    expect(deviated.markOperatorDeviation()).toMatchObject({
      sessionState: "invalidated",
      invalidationReason: "OPERATOR_DEVIATION",
      operatorDeviationCount: 1,
    });
  });

  it("warns on obviously inconsistent feedback and counts overrides", async () => {
    const service = await prepareReadyService();
    service.startPrompt();
    const captured = service.beforeCapture({
      providerId: "xunfei",
      mode: "command",
      modeSource: "explicit_ui",
    }) as { allowed: true; pilot: VoicePilotBinding };
    const sample = sampleFor(captured.pilot, {
      outcomeClass: "clarification",
      candidates: [],
    });
    service.attachPendingSample(sample);

    const warned = service.beforeSave({
      sample,
      feedback: ACCEPTED_FEEDBACK,
    });
    expect(warned).toMatchObject({
      allowed: false,
      reason: "VOICE_PILOT_PROMPT_FEEDBACK_WARNING",
      warning: "accepted_resolution_without_candidate",
    });
    expect(service.beforeSave({
      sample,
      feedback: ACCEPTED_FEEDBACK,
      overrideFeedbackWarning: true,
    })).toMatchObject({ allowed: true });
    service.recordSaved({ record: { ...sample, feedback: ACCEPTED_FEEDBACK } });

    expect(service.getProjection()).toMatchObject({
      feedbackWarningCount: 2,
      feedbackWarningOverrideCount: 1,
    });
  });

  it("binds evidence to audit counters without writing user content", async () => {
    const audit = {
      windowsExecutorInvocationCount: 3,
      effectfulActionBlockedBeforeExecutorCount: 5,
      lastBlockedReason: undefined,
      realWindowsExecutionEnabled: false,
      brainOpenActionsDisabled: true,
      auditSessionStartedAt: "2026-08-17T00:00:00.000Z",
    };
    const service = createService({
      expectedProviderId: "xunfei",
      getAudit: () => audit,
    });
    service.setActualProvider("xunfei");
    await service.prepare();
    for (let index = 0; index < 20; index += 1) {
      service.startPrompt();
      service.markNoFinalTranscript();
    }
    audit.effectfulActionBlockedBeforeExecutorCount = 9;

    const evidence = service.complete(DIGEST);

    expect(evidence).toMatchObject({
      manifestId: VOICE_PILOT_MANIFEST.manifestId,
      expectedPromptCount: 20,
      terminalPromptCount: 20,
      noFinalTranscriptCount: 20,
      recordCount: 0,
      executorInvocationBaseline: 3,
      executorInvocationFinal: 3,
      executorInvocationDelta: 0,
      blockedBeforeExecutorBaseline: 5,
      blockedBeforeExecutorFinal: 9,
      blockedBeforeExecutorDelta: 4,
      sessionValid: true,
    });
    expect(evidence?.promptOutcomes).toHaveLength(20);
    expect(JSON.stringify(evidence)).not.toMatch(
      /rawTranscript|normalizedText|correctedText|safeSlots|https?:\/\/|[A-Z]:\\/u,
    );
  });

  it("invalidates evidence when executor counters move after baseline", async () => {
    const audit = {
      windowsExecutorInvocationCount: 0,
      effectfulActionBlockedBeforeExecutorCount: 0,
      lastBlockedReason: undefined,
      realWindowsExecutionEnabled: false,
      brainOpenActionsDisabled: true,
      auditSessionStartedAt: "2026-08-17T00:00:00.000Z",
    };
    const service = createService({
      expectedProviderId: "xunfei",
      getAudit: () => audit,
    });
    service.setActualProvider("xunfei");
    await service.prepare();
    for (let index = 0; index < 20; index += 1) {
      service.startPrompt();
      service.markNoFinalTranscript();
    }
    audit.windowsExecutorInvocationCount = 1;

    expect(service.complete("b".repeat(64))).toMatchObject({
      executorInvocationDelta: 1,
      sessionValid: false,
    });
    expect(service.getProjection()).toMatchObject({
      sessionState: "invalidated",
      invalidationReason: "EXECUTOR_INVOKED",
    });
  });
});

async function prepareReadyService(): Promise<VoicePilotSessionService> {
  const service = createService({ expectedProviderId: "xunfei" });
  service.setActualProvider("xunfei");
  await expect(service.prepare()).resolves.toMatchObject({
    allowManualPilot: true,
  });
  return service;
}

function createService(
  overrides: Partial<ConstructorParameters<typeof VoicePilotSessionService>[0]> = {},
) {
  return new VoicePilotSessionService({
    expectedProviderId: undefined,
    inputMode: "command",
    inputModeSource: "explicit_ui",
    repositoryPathProjection:
      "LocalAppData/Jarvis-K/voice-regression-pilot-2.json",
    now: () => new Date("2026-08-17T00:00:00.000Z"),
    getAudit: () => ({
      windowsExecutorInvocationCount: 0,
      effectfulActionBlockedBeforeExecutorCount: 0,
      lastBlockedReason: undefined,
      realWindowsExecutionEnabled: false,
      brainOpenActionsDisabled: true,
      auditSessionStartedAt: "2026-08-17T00:00:00.000Z",
    }),
    getRequiredContext: async () => ({
      routeAliases: ["route_alias:jarvis_project_homepage"],
      readonlyPlugins: [
        "plugin:cn.example.hello-readonly:hello.lookup:readonly_enabled",
      ],
      missing: [],
    }),
    ...overrides,
  });
}

function sampleFor(
  pilot: VoicePilotBinding,
  resolver?: Partial<VoiceRegressionSample["resolver"]>,
): VoiceRegressionSample {
  return VoiceRegressionSampleSchema.parse({
    id: `voice-regression-pending-${pilot.promptId}`,
    schemaVersion: 1,
    createdAt: "2026-08-17T00:00:01.000Z",
    consentLevel: "local_text",
    locale: "zh-CN",
    mode: "command",
    modeSource: "explicit_ui",
    asr: {
      providerId: "xunfei",
      rawTranscript: "打开记事本",
      isFinal: true,
      latencyMs: 42,
    },
    resolver: {
      version: "voice-command-resolver.deterministic.v1",
      normalizedText: "打开记事本",
      outcomeClass: "candidate",
      candidates: [
        {
          intent: "localApp.open",
          safeSlots: { target: "notepad" },
          confidence: 0.9,
          source: "structured_candidate_selector",
        },
      ],
      clarificationRequired: false,
      blocked: false,
      latencyMs: 7,
      ...resolver,
    },
    context: {
      activeView: "voice",
    },
    privacy: {
      redactions: [],
      containsAudio: false,
      uploadAllowed: false,
    },
    pilot,
  });
}
