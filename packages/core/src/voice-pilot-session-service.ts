import { createHash } from "node:crypto";

import {
  type VoiceAsrProviderId,
  type VoicePilotPromptStatus,
  type VoicePilotExpectedProviderId,
  type VoicePilotInvalidationReason,
  type VoicePilotSessionEvidence,
  VoicePilotSessionEvidenceSchema,
  type VoicePilotSessionProjection,
  VoicePilotSessionProjectionSchema,
  type VoiceRegressionDualFeedback,
  type VoiceRegressionSample,
  type VoiceInputMode,
  type VoiceInputModeSource,
  createId,
} from "@jarvis-k/contracts";

import type { EffectfulActionAuditProjection } from "./effectful-action-audit-service";
import {
  VOICE_PILOT_MANIFEST,
  type VoicePilotManifestPrompt,
} from "./voice-pilot-manifest";

export interface VoicePilotSessionServiceOptions {
  expectedProviderId?: VoicePilotExpectedProviderId | undefined;
  inputMode: "command";
  inputModeSource: "explicit_ui";
  repositoryPathProjection?: string | undefined;
  now: () => Date;
  getAudit: () => EffectfulActionAuditProjection;
  getRequiredContext?: (() => Promise<VoicePilotRequiredContextResult>) | undefined;
}

export interface VoicePilotRequiredContextResult {
  routeAliases: readonly string[];
  readonlyPlugins: readonly string[];
  missing: readonly string[];
}

export interface VoicePilotBinding {
  sessionId: string;
  manifestId: string;
  manifestDigest: string;
  promptId: string;
  ordinal: number;
}

export interface VoicePilotSaveDecision {
  allowed: boolean;
  reason?: VoicePilotInvalidationReason | "VOICE_PILOT_PROMPT_FEEDBACK_WARNING";
  warning?: string | undefined;
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
  promptStates: Map<string, VoicePilotPromptStatus>;
  promptOutcomes: Map<
    string,
    {
      status: VoicePilotPromptStatus;
      recordId?: string | undefined;
      recordDigestSha256?: string | undefined;
    }
  >;
  activePromptId?: string | undefined;
  currentSampleId?: string | undefined;
  duplicatePromptCount: number;
  outOfOrderAttemptCount: number;
  nonManifestRecordCount: number;
  feedbackWarningCount: number;
  feedbackWarningOverrideCount: number;
  requiredContext: VoicePilotRequiredContextResult;
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

  public async prepare(): Promise<VoicePilotSessionProjection> {
    if (!this.options.expectedProviderId) {
      return this.inactive("EXPECTED_PROVIDER_MISSING");
    }
    const requiredContext =
      (await this.options.getRequiredContext?.()) ??
      emptyRequiredContextResult();
    if (requiredContext.missing.length > 0) {
      return this.inactive("REQUIRED_CONTEXT_MISSING", requiredContext);
    }
    if (!REAL_PROVIDER_IDS.has(this.actualProviderId)) {
      return this.inactive("ACTUAL_PROVIDER_UNAVAILABLE", requiredContext);
    }
    if (this.options.expectedProviderId !== this.actualProviderId) {
      return this.inactive("PROVIDER_MISMATCH", requiredContext);
    }
    const audit = this.options.getAudit();
    if (audit.realWindowsExecutionEnabled) {
      return this.inactive("REAL_WINDOWS_EXECUTION_ENABLED", requiredContext);
    }
    if (!audit.brainOpenActionsDisabled) {
      return this.inactive("BRAIN_OPEN_ACTIONS_NOT_DISABLED", requiredContext);
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
      promptStates: new Map(
        VOICE_PILOT_MANIFEST.prompts.map((promptItem) => [
          promptItem.promptId,
          "pending" as const,
        ]),
      ),
      promptOutcomes: new Map(),
      duplicatePromptCount: 0,
      outOfOrderAttemptCount: 0,
      nonManifestRecordCount: 0,
      feedbackWarningCount: 0,
      feedbackWarningOverrideCount: 0,
      requiredContext,
    };
    return this.project();
  }

  public getProjection(): VoicePilotSessionProjection {
    if (!this.session) {
      return this.inactive();
    }
    return this.project();
  }

  public startPrompt(): VoicePilotSessionProjection {
    const session = this.session;
    if (!session || session.state === "completed") {
      return this.inactive("NO_ACTIVE_PROMPT");
    }
    if (session.state === "invalidated") {
      return this.project();
    }
    if (session.activePromptId) {
      session.outOfOrderAttemptCount += 1;
      this.invalidate("PROMPT_ORDER_VIOLATION");
      return this.project();
    }
    const next = this.nextPendingPrompt(session);
    if (!next) {
      return this.project();
    }
    session.promptStates.set(next.promptId, "active");
    session.activePromptId = next.promptId;
    return this.project();
  }

  public beforeCapture(input: {
    providerId: VoiceAsrProviderId;
    mode: VoiceInputMode;
    modeSource: VoiceInputModeSource;
  }): { allowed: true; pilot?: VoicePilotBinding | undefined } | { allowed: false; reason: VoicePilotInvalidationReason } {
    const session = this.session;
    if (!session || session.state === "completed") {
      return { allowed: true };
    }
    session.actualProviderIdsObserved.add(input.providerId);
    if (session.expectedProviderId !== input.providerId) {
      session.providerMismatchCount += 1;
      this.invalidate("PROVIDER_MISMATCH");
      return { allowed: false, reason: "PROVIDER_MISMATCH" };
    }
    if (input.mode !== "command" || input.modeSource !== "explicit_ui") {
      this.invalidate("MODE_MISMATCH");
      return { allowed: false, reason: "MODE_MISMATCH" };
    }
    if (session.state === "invalidated") {
      return {
        allowed: false,
        reason: session.invalidationReason ?? "SESSION_INTERRUPTED",
      };
    }
    const promptId = session.activePromptId;
    if (!promptId) {
      session.outOfOrderAttemptCount += 1;
      return { allowed: false, reason: "NO_ACTIVE_PROMPT" };
    }
    if (session.currentSampleId) {
      session.duplicatePromptCount += 1;
      this.invalidate("PROMPT_ALREADY_HAS_TRANSCRIPT");
      return { allowed: false, reason: "PROMPT_ALREADY_HAS_TRANSCRIPT" };
    }
    if (session.state === "ready") {
      session.state = "collecting";
    }
    if (session.state !== "collecting") {
      return {
        allowed: false,
        reason: session.invalidationReason ?? "SESSION_INTERRUPTED",
      };
    }
    const prompt = getPrompt(promptId);
    session.promptStates.set(promptId, "transcript_received");
    return {
      allowed: true,
      pilot: {
        sessionId: session.sessionId,
        manifestId: VOICE_PILOT_MANIFEST.manifestId,
        manifestDigest: VOICE_PILOT_MANIFEST.digest,
        promptId,
        ordinal: prompt.ordinal,
      },
    };
  }

  public attachPendingSample(sample: VoiceRegressionSample): void {
    const session = this.session;
    if (!session || !sample.pilot) {
      return;
    }
    if (
      sample.pilot.sessionId !== session.sessionId ||
      sample.pilot.manifestId !== VOICE_PILOT_MANIFEST.manifestId ||
      sample.pilot.manifestDigest !== VOICE_PILOT_MANIFEST.digest
    ) {
      session.nonManifestRecordCount += 1;
      this.invalidate("PROMPT_ORDER_VIOLATION");
      return;
    }
    session.currentSampleId = sample.id;
  }

  public beforeSave(input: {
    sample: VoiceRegressionSample;
    feedback: VoiceRegressionDualFeedback;
    overrideFeedbackWarning?: boolean | undefined;
  }): VoicePilotSaveDecision {
    const session = this.session;
    if (!session) {
      return { allowed: true };
    }
    if (session.state === "invalidated") {
      return {
        allowed: false,
        reason: session.invalidationReason ?? "SESSION_INTERRUPTED",
      };
    }
    const pilot = input.sample.pilot;
    if (!pilot || pilot.sessionId !== session.sessionId) {
      session.nonManifestRecordCount += 1;
      return { allowed: false, reason: "PROMPT_ORDER_VIOLATION" };
    }
    session.actualProviderIdsObserved.add(input.sample.asr.providerId);
    if (session.expectedProviderId !== input.sample.asr.providerId) {
      session.providerMismatchCount += 1;
      this.invalidate("PROVIDER_MISMATCH");
      return { allowed: false, reason: "PROVIDER_MISMATCH" };
    }
    if (
      session.activePromptId !== pilot.promptId ||
      session.currentSampleId !== input.sample.id ||
      session.promptOutcomes.has(pilot.promptId)
    ) {
      session.outOfOrderAttemptCount += 1;
      this.invalidate("PROMPT_ORDER_VIOLATION");
      return { allowed: false, reason: "PROMPT_ORDER_VIOLATION" };
    }
    const warning = this.assessFeedbackWarning(input.sample, input.feedback);
    if (warning) {
      session.feedbackWarningCount += 1;
      if (!input.overrideFeedbackWarning) {
        return {
          allowed: false,
          reason: "VOICE_PILOT_PROMPT_FEEDBACK_WARNING",
          warning,
        };
      }
      session.feedbackWarningOverrideCount += 1;
    }
    return { allowed: true, warning };
  }

  public recordSaved(input: {
    record: VoiceRegressionSample & { feedback?: unknown };
  }): void {
    const session = this.session;
    if (!session) {
      return;
    }
    const pilot = input.record.pilot;
    if (!pilot || pilot.sessionId !== session.sessionId) {
      session.nonManifestRecordCount += 1;
      return;
    }
    session.actualProviderIdsObserved.add(input.record.asr.providerId);
    session.recordCount += 1;
    session.promptStates.set(pilot.promptId, "feedback_saved");
    session.promptOutcomes.set(pilot.promptId, {
      status: "feedback_saved",
      recordId: input.record.id,
      recordDigestSha256: createHash("sha256")
        .update(JSON.stringify(input.record), "utf8")
        .digest("hex"),
    });
    session.activePromptId = undefined;
    session.currentSampleId = undefined;
  }

  public recordDiscard(sample: VoiceRegressionSample): VoicePilotSaveDecision {
    const session = this.session;
    const pilot = sample.pilot;
    if (!session || !pilot) {
      return { allowed: true };
    }
    if (pilot.sessionId !== session.sessionId || pilot.promptId !== session.activePromptId) {
      session.outOfOrderAttemptCount += 1;
      return { allowed: false, reason: "PROMPT_ORDER_VIOLATION" };
    }
    session.promptStates.set(pilot.promptId, "discarded");
    session.promptOutcomes.set(pilot.promptId, { status: "discarded" });
    session.activePromptId = undefined;
    session.currentSampleId = undefined;
    return { allowed: true };
  }

  public markNoFinalTranscript(): VoicePilotSessionProjection {
    const session = this.session;
    if (!session || !session.activePromptId) {
      return this.inactive("NO_ACTIVE_PROMPT");
    }
    if (session.state === "invalidated") {
      return this.project();
    }
    const promptId = session.activePromptId;
    session.promptStates.set(promptId, "no_final_transcript");
    session.promptOutcomes.set(promptId, { status: "no_final_transcript" });
    session.activePromptId = undefined;
    session.currentSampleId = undefined;
    if (session.state === "ready") {
      session.state = "collecting";
    }
    return this.project();
  }

  public markOperatorDeviation(): VoicePilotSessionProjection {
    const session = this.session;
    if (!session || !session.activePromptId) {
      return this.inactive("NO_ACTIVE_PROMPT");
    }
    const promptId = session.activePromptId;
    session.promptStates.set(promptId, "invalidated");
    session.promptOutcomes.set(promptId, { status: "invalidated" });
    this.invalidate("OPERATOR_DEVIATION");
    session.activePromptId = undefined;
    session.currentSampleId = undefined;
    return this.project();
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
      this.allPromptsTerminal(this.session) &&
      this.countPromptsByStatus(this.session, "discarded") === 0 &&
      this.countPromptsByStatus(this.session, "invalidated") === 0 &&
      this.session.duplicatePromptCount === 0 &&
      this.session.outOfOrderAttemptCount === 0 &&
      this.session.nonManifestRecordCount === 0 &&
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
      manifestId: VOICE_PILOT_MANIFEST.manifestId,
      manifestDigest: VOICE_PILOT_MANIFEST.digest,
      expectedPromptCount: VOICE_PILOT_MANIFEST.promptCount,
      terminalPromptCount: this.terminalPromptCount(this.session),
      savedRecordCount: this.session.recordCount,
      noFinalTranscriptCount: this.countPromptsByStatus(
        this.session,
        "no_final_transcript",
      ),
      discardedCount: this.countPromptsByStatus(this.session, "discarded"),
      operatorDeviationCount: this.countPromptsByStatus(
        this.session,
        "invalidated",
      ),
      duplicatePromptCount: this.session.duplicatePromptCount,
      outOfOrderAttemptCount: this.session.outOfOrderAttemptCount,
      nonManifestRecordCount: this.session.nonManifestRecordCount,
      feedbackWarningCount: this.session.feedbackWarningCount,
      feedbackWarningOverrideCount: this.session.feedbackWarningOverrideCount,
      requiredContext: normalizeRequiredContext(this.session.requiredContext),
      promptOutcomes: VOICE_PILOT_MANIFEST.prompts.map((promptItem) => {
        const outcome = this.session?.promptOutcomes.get(promptItem.promptId);
        return {
          promptId: promptItem.promptId,
          ordinal: promptItem.ordinal,
          status:
            outcome?.status ??
            this.session?.promptStates.get(promptItem.promptId) ??
            "pending",
          ...(outcome?.recordId ? { recordId: outcome.recordId } : {}),
          ...(outcome?.recordDigestSha256
            ? { recordDigestSha256: outcome.recordDigestSha256 }
            : {}),
        };
      }),
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
      manifestId: VOICE_PILOT_MANIFEST.manifestId,
      manifestDigest: VOICE_PILOT_MANIFEST.digest,
      expectedPromptCount: VOICE_PILOT_MANIFEST.promptCount,
      currentPrompt: this.currentPromptProjection(this.session),
      terminalPromptCount: this.terminalPromptCount(this.session),
      noFinalTranscriptCount: this.countPromptsByStatus(
        this.session,
        "no_final_transcript",
      ),
      discardedCount: this.countPromptsByStatus(this.session, "discarded"),
      operatorDeviationCount: this.countPromptsByStatus(
        this.session,
        "invalidated",
      ),
      duplicatePromptCount: this.session.duplicatePromptCount,
      outOfOrderAttemptCount: this.session.outOfOrderAttemptCount,
      nonManifestRecordCount: this.session.nonManifestRecordCount,
      feedbackWarningCount: this.session.feedbackWarningCount,
      feedbackWarningOverrideCount: this.session.feedbackWarningOverrideCount,
      requiredContext: normalizeRequiredContext(this.session.requiredContext),
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
        (this.session.state === "ready" || this.session.state === "collecting") &&
        providerMatchesExpected &&
        !audit.realWindowsExecutionEnabled &&
        audit.brainOpenActionsDisabled,
      providerMatchesExpected,
    });
  }

  private inactive(
    invalidationReason?: VoicePilotInvalidationReason,
    requiredContext?: VoicePilotRequiredContextResult,
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
      manifestId: VOICE_PILOT_MANIFEST.manifestId,
      manifestDigest: VOICE_PILOT_MANIFEST.digest,
      expectedPromptCount: VOICE_PILOT_MANIFEST.promptCount,
      requiredContext: normalizeRequiredContext(
        requiredContext ?? emptyRequiredContextResult(),
      ),
      sessionState: "inactive",
      ...(invalidationReason ? { invalidationReason } : {}),
      recordCount: 0,
      providerMismatchCount: 0,
      allowManualPilot: false,
      providerMatchesExpected: false,
    });
  }

  private nextPendingPrompt(
    session: ActiveVoicePilotSession,
  ): VoicePilotManifestPrompt | undefined {
    return VOICE_PILOT_MANIFEST.prompts.find(
      (promptItem) => session.promptStates.get(promptItem.promptId) === "pending",
    );
  }

  private currentPromptProjection(
    session: ActiveVoicePilotSession,
  ): VoicePilotSessionProjection["currentPrompt"] {
    const promptId = session.activePromptId ?? this.nextPendingPrompt(session)?.promptId;
    if (!promptId) {
      return undefined;
    }
    const promptItem = getPrompt(promptId);
    return {
      promptId: promptItem.promptId,
      ordinal: promptItem.ordinal,
      displayText: promptItem.displayText,
      expectedOutcomeClass: promptItem.expectedOutcomeClass,
      ...(promptItem.expectedIntent
        ? { expectedIntent: promptItem.expectedIntent }
        : {}),
      expectedSlotKeys: [...promptItem.expectedSlotKeys],
      candidateRequired: promptItem.candidateRequired,
      safetyClass: promptItem.safetyClass,
      requiredContext: [...promptItem.requiredContext],
      status: session.promptStates.get(promptId) ?? "pending",
    };
  }

  private countPromptsByStatus(
    session: ActiveVoicePilotSession,
    status: VoicePilotPromptStatus,
  ): number {
    return [...session.promptStates.values()].filter((value) => value === status)
      .length;
  }

  private terminalPromptCount(session: ActiveVoicePilotSession): number {
    return [...session.promptStates.values()].filter((status) =>
      ["feedback_saved", "no_final_transcript", "discarded", "invalidated"].includes(
        status,
      ),
    ).length;
  }

  private allPromptsTerminal(session: ActiveVoicePilotSession): boolean {
    return this.terminalPromptCount(session) === VOICE_PILOT_MANIFEST.promptCount;
  }

  private assessFeedbackWarning(
    sample: VoiceRegressionSample,
    feedback: VoiceRegressionDualFeedback,
  ): string | undefined {
    const prompt = sample.pilot ? getPrompt(sample.pilot.promptId) : undefined;
    if (!prompt || feedback.transcript.status === "rejected") {
      return undefined;
    }
    if (
      feedback.resolution.status === "accepted" &&
      (sample.resolver.outcomeClass === "no_candidate" ||
        sample.resolver.outcomeClass === "clarification") &&
      prompt.expectedIntent !== undefined
    ) {
      return "accepted_resolution_without_candidate";
    }
    const topIntent = sample.resolver.candidates[0]?.intent;
    if (
      feedback.resolution.status === "wrong_intent" &&
      prompt.expectedIntent !== undefined &&
      topIntent === prompt.expectedIntent
    ) {
      return "expected_intent_matched_prefer_wrong_slots";
    }
    if (
      feedback.resolution.status === "accepted" &&
      prompt.expectedOutcomeClass === "blocked" &&
      !sample.resolver.blocked
    ) {
      return "dangerous_prompt_should_block";
    }
    if (
      feedback.resolution.status === "accepted" &&
      prompt.safetyClass === "negative_or_quoted" &&
      sample.resolver.candidates.length > 0
    ) {
      return "negative_prompt_should_not_route";
    }
    return undefined;
  }
}

function getPrompt(promptId: string): VoicePilotManifestPrompt {
  const promptItem = VOICE_PILOT_MANIFEST.prompts.find(
    (candidate) => candidate.promptId === promptId,
  );
  if (!promptItem) {
    throw new Error("VOICE_PILOT_PROMPT_UNKNOWN");
  }
  return promptItem;
}

function emptyRequiredContextResult(): VoicePilotRequiredContextResult {
  return {
    routeAliases: [],
    readonlyPlugins: [],
    missing: [],
  };
}

function normalizeRequiredContext(
  input: VoicePilotRequiredContextResult,
): VoicePilotRequiredContextResult {
  return {
    routeAliases: [...input.routeAliases],
    readonlyPlugins: [...input.readonlyPlugins],
    missing: [...input.missing],
  };
}
