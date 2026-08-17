import {
  type VoiceAsrProviderId,
  type VoicePilotExpectedProviderId,
  type VoicePilotInvalidationReason,
  type VoicePilotSessionEvidence,
  VoicePilotSessionEvidenceSchema,
  type VoicePilotSessionProjection,
  VoicePilotSessionProjectionSchema,
  createId,
} from "@jarvis-k/contracts";

import type { EffectfulActionAuditProjection } from "./effectful-action-audit-service";

export interface VoicePilotSessionServiceOptions {
  expectedProviderId?: VoicePilotExpectedProviderId | undefined;
  inputMode: "command";
  inputModeSource: "explicit_ui";
  repositoryPathProjection?: string | undefined;
  now: () => Date;
  getAudit: () => EffectfulActionAuditProjection;
}

type VoicePilotSessionState =
  | "inactive"
  | "ready"
  | "collecting"
  | "completed"
  | "invalidated";

interface ActiveVoicePilotSession {
  sessionId: string;
  sessionStartedAt: string;
  expectedProviderId: VoicePilotExpectedProviderId;
  actualProviderIdsObserved: Set<VoiceAsrProviderId>;
  auditBaseline: {
    windowsExecutorInvocationCount: number;
    effectfulActionBlockedBeforeExecutorCount: number;
  };
  state: VoicePilotSessionState;
  invalidationReason?: VoicePilotInvalidationReason | undefined;
  recordCount: number;
  providerMismatchCount: number;
}

const REAL_PROVIDER_IDS = new Set<VoiceAsrProviderId>([
  "xunfei",
  "volcengine",
]);

export class VoicePilotSessionService {
  private actualProviderId: VoiceAsrProviderId = "unavailable";
  private session: ActiveVoicePilotSession | undefined;

  public constructor(private readonly options: VoicePilotSessionServiceOptions) {}

  public setActualProvider(providerId: VoiceAsrProviderId): void {
    this.actualProviderId = providerId;
    if (!this.session || this.session.state === "completed") {
      return;
    }
    this.session.actualProviderIdsObserved.add(providerId);
    if (
      this.session.expectedProviderId !== providerId &&
      this.session.state !== "invalidated"
    ) {
      this.invalidate("PROVIDER_SWITCHED");
    }
  }

  public prepare(): VoicePilotSessionProjection {
    if (!this.options.expectedProviderId) {
      return this.inactive("EXPECTED_PROVIDER_MISSING");
    }
    if (!REAL_PROVIDER_IDS.has(this.actualProviderId)) {
      return this.inactive("ACTUAL_PROVIDER_UNAVAILABLE");
    }
    if (this.options.expectedProviderId !== this.actualProviderId) {
      return this.inactive("PROVIDER_MISMATCH");
    }
    const audit = this.options.getAudit();
    if (audit.realWindowsExecutionEnabled) {
      return this.inactive("REAL_WINDOWS_EXECUTION_ENABLED");
    }
    if (!audit.brainOpenActionsDisabled) {
      return this.inactive("BRAIN_OPEN_ACTIONS_NOT_DISABLED");
    }
    if (this.session?.state === "invalidated") {
      return this.project();
    }
    if (this.session?.state === "ready" || this.session?.state === "collecting") {
      return this.project();
    }
    this.session = {
      sessionId: createId("voice-pilot-session"),
      sessionStartedAt: this.options.now().toISOString(),
      expectedProviderId: this.options.expectedProviderId,
      actualProviderIdsObserved: new Set([this.actualProviderId]),
      auditBaseline: {
        windowsExecutorInvocationCount: audit.windowsExecutorInvocationCount,
        effectfulActionBlockedBeforeExecutorCount:
          audit.effectfulActionBlockedBeforeExecutorCount,
      },
      state: "ready",
      recordCount: 0,
      providerMismatchCount: 0,
    };
    return this.project();
  }

  public getProjection(): VoicePilotSessionProjection {
    if (!this.session) {
      return this.inactive();
    }
    return this.project();
  }

  public beforeCapture(providerId: VoiceAsrProviderId): boolean {
    const session = this.session;
    if (!session || session.state === "completed") {
      return true;
    }
    session.actualProviderIdsObserved.add(providerId);
    if (session.expectedProviderId !== providerId) {
      session.providerMismatchCount += 1;
      this.invalidate("PROVIDER_MISMATCH");
      return false;
    }
    if (session.state === "ready") {
      session.state = "collecting";
    }
    return session.state === "collecting";
  }

  public beforeSave(providerId: VoiceAsrProviderId): boolean {
    return this.beforeCapture(providerId);
  }

  public recordSaved(providerId: VoiceAsrProviderId): void {
    const session = this.session;
    if (!session) {
      return;
    }
    session.actualProviderIdsObserved.add(providerId);
    session.recordCount += 1;
  }

  public complete(recordExportDigestSha256: string): VoicePilotSessionEvidence | undefined {
    const session = this.session;
    if (!session) {
      return undefined;
    }
    const evidence = this.createEvidence(recordExportDigestSha256);
    if (session.state !== "invalidated") {
      session.state = "completed";
    }
    return evidence;
  }

  public invalidate(reason: VoicePilotInvalidationReason): void {
    if (!this.session) {
      return;
    }
    this.session.state = "invalidated";
    this.session.invalidationReason = reason;
  }

  private createEvidence(recordExportDigestSha256: string): VoicePilotSessionEvidence {
    if (!this.session) {
      throw new Error("VOICE_PILOT_SESSION_UNAVAILABLE");
    }
    const audit = this.options.getAudit();
    const executorDelta =
      audit.windowsExecutorInvocationCount -
      this.session.auditBaseline.windowsExecutorInvocationCount;
    const blockedDelta =
      audit.effectfulActionBlockedBeforeExecutorCount -
      this.session.auditBaseline.effectfulActionBlockedBeforeExecutorCount;
    const sessionValid =
      this.session.state !== "invalidated" &&
      executorDelta === 0 &&
      !audit.realWindowsExecutionEnabled &&
      audit.brainOpenActionsDisabled &&
      [...this.session.actualProviderIdsObserved].every(
        (providerId) => providerId === this.session?.expectedProviderId,
      );
    const evidence = VoicePilotSessionEvidenceSchema.parse({
      schemaVersion: 1,
      sessionId: this.session.sessionId,
      sessionStartedAt: this.session.sessionStartedAt,
      sessionEndedAt: this.options.now().toISOString(),
      expectedProviderId: this.session.expectedProviderId,
      actualProviderIdsObserved: [...this.session.actualProviderIdsObserved],
      recordCount: this.session.recordCount,
      recordExportDigestSha256,
      executorInvocationBaseline:
        this.session.auditBaseline.windowsExecutorInvocationCount,
      executorInvocationFinal: audit.windowsExecutorInvocationCount,
      executorInvocationDelta: Math.max(0, executorDelta),
      blockedBeforeExecutorBaseline:
        this.session.auditBaseline.effectfulActionBlockedBeforeExecutorCount,
      blockedBeforeExecutorFinal:
        audit.effectfulActionBlockedBeforeExecutorCount,
      blockedBeforeExecutorDelta: Math.max(0, blockedDelta),
      realWindowsExecutionEnabled: audit.realWindowsExecutionEnabled,
      brainOpenActionsDisabled: audit.brainOpenActionsDisabled,
      sessionValid,
      ...(this.session.invalidationReason
        ? { invalidationReason: this.session.invalidationReason }
        : {}),
    });
    if (!evidence.sessionValid && !this.session.invalidationReason) {
      this.invalidate(
        evidence.executorInvocationDelta > 0
          ? "EXECUTOR_INVOKED"
          : "PROVIDER_MISMATCH",
      );
    }
    return evidence;
  }

  private project(): VoicePilotSessionProjection {
    if (!this.session) {
      return this.inactive();
    }
    const audit = this.options.getAudit();
    const expected = this.session.expectedProviderId;
    const providerMatchesExpected =
      this.actualProviderId === expected &&
      this.session.providerMismatchCount === 0 &&
      this.session.state !== "invalidated";
    return VoicePilotSessionProjectionSchema.parse({
      sessionId: this.session.sessionId,
      sessionShortId: this.session.sessionId.slice(-8),
      sessionStartedAt: this.session.sessionStartedAt,
      expectedProviderId: expected,
      actualProviderId: this.actualProviderId,
      inputMode: this.options.inputMode,
      inputModeSource: this.options.inputModeSource,
      ...(this.options.repositoryPathProjection
        ? { repositoryPathProjection: this.options.repositoryPathProjection }
        : {}),
      auditBaseline: this.session.auditBaseline,
      auditCurrent: {
        windowsExecutorInvocationCount: audit.windowsExecutorInvocationCount,
        effectfulActionBlockedBeforeExecutorCount:
          audit.effectfulActionBlockedBeforeExecutorCount,
      },
      sessionState: this.session.state,
      ...(this.session.invalidationReason
        ? { invalidationReason: this.session.invalidationReason }
        : {}),
      recordCount: this.session.recordCount,
      providerMismatchCount: this.session.providerMismatchCount,
      allowManualPilot:
        this.session.state === "ready" &&
        providerMatchesExpected &&
        !audit.realWindowsExecutionEnabled &&
        audit.brainOpenActionsDisabled,
      providerMatchesExpected,
    });
  }

  private inactive(
    invalidationReason?: VoicePilotInvalidationReason,
  ): VoicePilotSessionProjection {
    return VoicePilotSessionProjectionSchema.parse({
      actualProviderId: this.actualProviderId,
      inputMode: this.options.inputMode,
      inputModeSource: this.options.inputModeSource,
      ...(this.options.expectedProviderId
        ? { expectedProviderId: this.options.expectedProviderId }
        : {}),
      ...(this.options.repositoryPathProjection
        ? { repositoryPathProjection: this.options.repositoryPathProjection }
        : {}),
      sessionState: "inactive",
      ...(invalidationReason ? { invalidationReason } : {}),
      recordCount: 0,
      providerMismatchCount: 0,
      allowManualPilot: false,
      providerMatchesExpected: false,
    });
  }
}
