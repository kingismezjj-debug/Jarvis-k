import { describe, expect, it } from "vitest";

import { VoicePilotSessionService } from "../src/voice-pilot-session-service";

describe("VoicePilotSessionService", () => {
  it("creates ready sessions only when expected and actual real providers match", () => {
    for (const providerId of ["xunfei", "volcengine"] as const) {
      const service = createService({ expectedProviderId: providerId });
      service.setActualProvider(providerId);

      const projection = service.prepare();

      expect(projection).toMatchObject({
        expectedProviderId: providerId,
        actualProviderId: providerId,
        inputMode: "command",
        inputModeSource: "explicit_ui",
        sessionState: "ready",
        allowManualPilot: true,
        providerMatchesExpected: true,
        recordCount: 0,
        providerMismatchCount: 0,
      });
      expect(projection.sessionId).toMatch(/^voice-pilot-session-/u);
      expect(projection.repositoryPathProjection).toBe(
        "LocalAppData/Jarvis-K/voice-regression-pilot-2.json",
      );
    }
  });

  it("fails closed when expected provider is missing or actual provider is not real", () => {
    const missingExpected = createService();
    missingExpected.setActualProvider("xunfei");
    expect(missingExpected.prepare()).toMatchObject({
      sessionState: "inactive",
      allowManualPilot: false,
      invalidationReason: "EXPECTED_PROVIDER_MISSING",
    });

    for (const actualProviderId of [
      "unknown",
      "unavailable",
      "fixture-asr",
      "smoke-asr",
    ] as const) {
      const service = createService({ expectedProviderId: "xunfei" });
      service.setActualProvider(actualProviderId);

      expect(service.prepare()).toMatchObject({
        sessionState: "inactive",
        actualProviderId,
        allowManualPilot: false,
        invalidationReason: "ACTUAL_PROVIDER_UNAVAILABLE",
      });
    }
  });

  it("invalidates on mismatched pending capture and cannot recover to collecting", () => {
    const service = createService({ expectedProviderId: "xunfei" });
    service.setActualProvider("xunfei");
    expect(service.prepare().sessionState).toBe("ready");

    expect(service.beforeCapture("volcengine")).toBe(false);
    expect(service.getProjection()).toMatchObject({
      sessionState: "invalidated",
      invalidationReason: "PROVIDER_MISMATCH",
      providerMismatchCount: 1,
      allowManualPilot: false,
      providerMatchesExpected: false,
    });

    expect(service.beforeCapture("xunfei")).toBe(false);
    expect(service.getProjection()).toMatchObject({
      sessionState: "invalidated",
      invalidationReason: "PROVIDER_MISMATCH",
    });
  });

  it("invalidates immediately when provider changes during an active session", () => {
    const service = createService({ expectedProviderId: "xunfei" });
    service.setActualProvider("xunfei");
    service.prepare();

    service.setActualProvider("volcengine");

    expect(service.getProjection()).toMatchObject({
      actualProviderId: "volcengine",
      sessionState: "invalidated",
      invalidationReason: "PROVIDER_SWITCHED",
      allowManualPilot: false,
      providerMatchesExpected: false,
    });
  });

  it("binds evidence to the same audit baseline and contains no user content", () => {
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
    service.prepare();
    expect(service.beforeCapture("xunfei")).toBe(true);
    service.recordSaved("xunfei");
    audit.effectfulActionBlockedBeforeExecutorCount = 9;

    const evidence = service.complete(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );

    expect(evidence).toMatchObject({
      expectedProviderId: "xunfei",
      actualProviderIdsObserved: ["xunfei"],
      recordCount: 1,
      executorInvocationBaseline: 3,
      executorInvocationFinal: 3,
      executorInvocationDelta: 0,
      blockedBeforeExecutorBaseline: 5,
      blockedBeforeExecutorFinal: 9,
      blockedBeforeExecutorDelta: 4,
      realWindowsExecutionEnabled: false,
      brainOpenActionsDisabled: true,
      sessionValid: true,
    });
    const evidenceText = JSON.stringify(evidence);
    expect(evidenceText).not.toMatch(
      /rawTranscript|normalizedText|correctedText|safeSlots|https?:\/\/|[A-Z]:\\/u,
    );
  });

  it("marks evidence invalid when executor counters move after baseline", () => {
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
    service.prepare();
    audit.windowsExecutorInvocationCount = 1;

    const evidence = service.complete(
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    );

    expect(evidence).toMatchObject({
      executorInvocationDelta: 1,
      sessionValid: false,
    });
    expect(service.getProjection()).toMatchObject({
      sessionState: "invalidated",
      invalidationReason: "EXECUTOR_INVOKED",
    });
  });
});

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
    ...overrides,
  });
}
