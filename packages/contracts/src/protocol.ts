import { z } from "zod";
import {
  ToolCleanupStateSchema,
  ToolExecutionLifecycleStatusSchema,
  ToolExecutionModeSchema,
  ToolFailureClassSchema,
  ToolPolicyDecisionSchema,
  ToolReasonCodeSchema,
  ToolRiskSchema,
  ToolRollbackStateSchema,
} from "./tool-protocol";
import {
  PluginInvocationRequestSchema,
  PluginInvocationResultSchema,
  LocalPluginEnabledStateSetRequestSchema,
  PluginManagementStatusResultSchema,
} from "./plugin-protocol";
import { CommandRouterQwenProductRoutingActivationStatusSchema } from "./qwen-product-routing-activation";

export const PROTOCOL_VERSION = 1 as const;
export const IPC_COMMAND_CHANNEL = "jarvis-k:command";
export const IPC_EVENT_CHANNEL = "jarvis-k:event";
export const IPC_VOICE_AUDIO_CHANNEL = "jarvis-k:voice-audio";
export const IPC_VOICE_SETTINGS_OPEN_CHANNEL = "jarvis-k:voice-settings-open";
export const IPC_VOICE_SETTINGS_STATUS_CHANNEL =
  "jarvis-k:voice-settings-status";
export const IPC_TTS_SETTINGS_OPEN_CHANNEL = "jarvis-k:tts-settings-open";
export const IPC_TTS_SETTINGS_STATUS_CHANNEL = "jarvis-k:tts-settings-status";
export const IPC_TTS_SETTINGS_SAVE_CHANNEL = "jarvis-k:tts-settings-save";
export const IPC_TTS_SETTINGS_CLEAR_CHANNEL = "jarvis-k:tts-settings-clear";
export const IPC_TTS_SYNTHESIZE_CHANNEL = "jarvis-k:tts-synthesize";
export const IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL =
  "jarvis-k:chat-answer-product-mode-status";
export const IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL =
  "jarvis-k:chat-answer-product-mode-set";
export const IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL =
  "jarvis-k:command-router-product-mode-status";
export const IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL =
  "jarvis-k:command-router-product-mode-set";
export const IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL =
  "jarvis-k:qwen-runtime-control-status";
export const IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL =
  "jarvis-k:qwen-runtime-control-set";

export const TaskStateSchema = z.enum([
  "queued",
  "planning",
  "awaiting_confirmation",
  "running",
  "completed",
  "failed",
  "cancelled",
  "interrupted",
  "rolling_back",
  "rolled_back",
]);

export type TaskState = z.infer<typeof TaskStateSchema>;

export const TaskStepStateSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "blocked",
]);
export type TaskStepState = z.infer<typeof TaskStepStateSchema>;

export const TaskStepVerificationStatusSchema = z.enum([
  "pending",
  "verified",
  "unverified",
  "verification_failed",
  "not_applicable",
]);
export type TaskStepVerificationStatus = z.infer<
  typeof TaskStepVerificationStatusSchema
>;

export const TaskEventTypeSchema = z.enum([
  "created",
  "state_changed",
  "step_started",
  "step_completed",
  "verification_completed",
  "verification_failed",
  "interrupted",
  "failed",
  "cancelled",
]);
export type TaskEventType = z.infer<typeof TaskEventTypeSchema>;

export const VoiceStateSchema = z.enum([
  "idle",
  "connecting",
  "ready",
  "recording",
  "finalizing",
  "speaking",
  "interrupted",
  "recovering",
  "error",
]);

export type VoiceState = z.infer<typeof VoiceStateSchema>;

export const VoiceModeSchema = z.enum(["disabled", "ptt", "continuous"]);
export type VoiceMode = z.infer<typeof VoiceModeSchema>;

export const VoicePermissionStateSchema = z.enum([
  "unknown",
  "prompt",
  "granted",
  "denied",
]);
export type VoicePermissionState = z.infer<typeof VoicePermissionStateSchema>;

export const VoiceServiceStatusSchema = z
  .object({
    configured: z.boolean(),
    secureStorageAvailable: z.boolean(),
    provider: z.enum(["xunfei", "volcengine"]).optional(),
    language: z.enum(["zh", "en"]).optional(),
    resourceId: z.string().min(1).max(128).optional(),
  })
  .strict();
export type VoiceServiceStatus = z.infer<typeof VoiceServiceStatusSchema>;

export const TtsServiceStatusSchema = z
  .object({
    configured: z.boolean(),
    secureStorageAvailable: z.boolean(),
    provider: z.literal("doubao").optional(),
    resourceId: z.string().min(1).max(128).optional(),
    voiceId: z.string().min(1).max(128).optional(),
  })
  .strict();
export type TtsServiceStatus = z.infer<typeof TtsServiceStatusSchema>;

const TtsAudioBytesSchema = z.custom<Uint8Array>(
  (value) =>
    value instanceof Uint8Array ||
    (ArrayBuffer.isView(value) &&
      "BYTES_PER_ELEMENT" in value &&
      value.BYTES_PER_ELEMENT === 1),
  "Expected TTS audio bytes as Uint8Array.",
);

export const TtsSynthesisResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      audio: TtsAudioBytesSchema,
      contentType: z.literal("audio/mpeg"),
      provider: z.literal("doubao"),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      code: z.enum([
        "TTS_NOT_CONFIGURED",
        "TTS_NETWORK_FAILED",
        "TTS_PROVIDER_REJECTED",
        "TTS_RESPONSE_INVALID",
        "TTS_REQUEST_REJECTED",
      ]),
      message: z.string().min(1).max(500),
    })
    .strict(),
]);
export type TtsSynthesisResult = z.infer<typeof TtsSynthesisResultSchema>;

export const ChatAnswerProductModeStatusSchema = z
  .object({
    enabled: z.boolean(),
    providerId: z.literal("chat-answer.openai-compatible.deepseek"),
    profileId: z.literal("deepseek.v4-flash.compact_json_object_256"),
    status: z.enum([
      "disabled",
      "credential_missing",
      "secure_store_unavailable",
      "control_enabled_runtime_locked",
      "control_enabled_runtime_armed",
    ]),
    secureStorageAvailable: z.boolean(),
    credentialConfigured: z.boolean(),
    credentialExposed: z.literal(false),
    realProviderRuntimeEnabled: z.boolean(),
    networkAccessApproved: z.boolean(),
    defaultBehaviorChanged: z.literal(false),
    fallbackPreserved: z.literal(true),
    reasonCodes: z
      .array(
        z
          .string()
          .regex(/^[A-Z0-9_]+$/)
          .max(128),
      )
      .max(8),
  })
  .strict();
export type ChatAnswerProductModeStatus = z.infer<
  typeof ChatAnswerProductModeStatusSchema
>;

export const ChatAnswerProductModeSetResultSchema = z
  .object({
    ok: z.boolean(),
    status: ChatAnswerProductModeStatusSchema,
    message: z.string().min(1).max(500).optional(),
  })
  .strict();
export type ChatAnswerProductModeSetResult = z.infer<
  typeof ChatAnswerProductModeSetResultSchema
>;

export const CommandRouterQwenFastRouterBindingSchema = z
  .object({
    providerId: z.literal("intent-router.qwen3-0.6b"),
    modelId: z.literal("Qwen/Qwen3-0.6B"),
    status: z.enum(["disabled", "unconfigured"]),
    mode: z.literal("no_runtime_status_only"),
    productRoutingEnabled: z.literal(false),
    realRuntimeEnabled: z.literal(false),
    runtimeAccessed: z.literal(false),
    artifactAccessed: z.literal(false),
    persistentCacheChanged: z.literal(false),
    directActionAttempted: z.literal(false),
    activation: CommandRouterQwenProductRoutingActivationStatusSchema,
    conversationSurfaceProductRoute: z
      .object({
        policyId: z.literal(
          "qwen-conversation-surface.product-route.default-off.v1",
        ),
        status: z.enum(["disabled", "ready", "prepared", "blocked"]),
        explicitOptInRequired: z.literal(true),
        explicitOptInEnabled: z.literal(false),
        activeRouteSource: z.literal("intent-router.deterministic.fixture"),
        fallbackRouteSource: z.literal("intent-router.deterministic.fixture"),
        qwenRouteSelectable: z.literal(false),
        productRouteExecutionEnabled: z.literal(false),
        directActionEnabled: z.literal(false),
        browserUrlOpeningEnabled: z.literal(false),
        vsCodeBlocked: z.literal(true),
        allowlistTargets: z.tuple([
          z.literal("notepad"),
          z.literal("calculator"),
        ]),
        persistentOptIn: z
          .object({
            policyId: z.literal(
              "qwen-conversation-surface.persistent-opt-in.default-off.v1",
            ),
            status: z.enum(["disabled", "prepared", "blocked"]),
            localDeveloperOptInRequired: z.literal(true),
            localDeveloperOptInEnabled: z.literal(false),
            qwenRouteSelectableByDefault: z.literal(false),
            productRouteExecutionEnabledByDefault: z.literal(false),
            limitedProductSessionOnly: z.literal(true),
            routeRequestLimit: z.literal(3),
            retainedSessionRequired: z.literal(true),
            helperStartupAllowedByPolicyState: z.literal(false),
            generationPortInvocationAllowedByPolicyState: z.literal(false),
            activeRouteSource: z.literal("intent-router.deterministic.fixture"),
            fallbackRouteSource: z.literal(
              "intent-router.deterministic.fixture",
            ),
            rollbackRouteSource: z.literal(
              "intent-router.deterministic.fixture",
            ),
            defaultBehaviorChanged: z.literal(false),
            releaseBehaviorChanged: z.literal(false),
            reasonCodes: z
              .array(
                z
                  .string()
                  .regex(/^[A-Z0-9_]+$/)
                  .max(128),
              )
              .max(12),
          })
          .strict(),
        rollbackState: z.enum(["not_needed", "ready", "completed"]),
        implementationPrepared: z.boolean(),
        defaultBehaviorChanged: z.literal(false),
        releaseBehaviorChanged: z.literal(false),
        reasonCodes: z
          .array(
            z
              .string()
              .regex(/^[A-Z0-9_]+$/)
              .max(128),
          )
          .max(12),
      })
      .strict(),
    gates: z
      .object({
        explicitEnablementRequired: z.literal(true),
        artifactDigestApprovalRequired: z.literal(true),
        modelLifecycleReadinessRequired: z.literal(true),
        runtimeGenerationPortReadinessRequired: z.literal(true),
        selectionPolicyReadinessRequired: z.literal(true),
        defaultOffPreserved: z.literal(true),
        deterministicFallbackPreserved: z.literal(true),
        singleEnvVarSufficient: z.literal(false),
        normalCoreHostStartupInstantiatesQwen: z.literal(false),
      })
      .strict(),
    reasonCodes: z
      .array(
        z
          .string()
          .regex(/^[A-Z0-9_]+$/)
          .max(128),
      )
      .max(12),
  })
  .strict();
export type CommandRouterQwenFastRouterBinding = z.infer<
  typeof CommandRouterQwenFastRouterBindingSchema
>;

export const CommandRouterProductModeStatusSchema = z
  .object({
    enabled: z.boolean(),
    providerId: z.literal("intent-router.deterministic.fixture"),
    mode: z.literal("fixture_only"),
    status: z.enum(["disabled", "control_enabled_fixture_only"]),
    fixtureOnly: z.literal(true),
    directActionEnabled: z.literal(false),
    realQwenRuntimeEnabled: z.literal(false),
    networkAccessApproved: z.literal(false),
    defaultBehaviorChanged: z.literal(false),
    chatAnswerFallbackPreserved: z.literal(true),
    qwenFastRouterBinding: CommandRouterQwenFastRouterBindingSchema,
    reasonCodes: z
      .array(
        z
          .string()
          .regex(/^[A-Z0-9_]+$/)
          .max(128),
      )
      .max(8),
  })
  .strict();
export type CommandRouterProductModeStatus = z.infer<
  typeof CommandRouterProductModeStatusSchema
>;

export const CommandRouterProductModeSetResultSchema = z
  .object({
    ok: z.boolean(),
    status: CommandRouterProductModeStatusSchema,
    message: z.string().min(1).max(500).optional(),
  })
  .strict();
export type CommandRouterProductModeSetResult = z.infer<
  typeof CommandRouterProductModeSetResultSchema
>;

export const QwenRuntimeControlActionSchema = z.enum([
  "start",
  "stop",
  "rollback",
]);
export type QwenRuntimeControlAction = z.infer<
  typeof QwenRuntimeControlActionSchema
>;

export const QwenRuntimeControlStatusSchema = z
  .object({
    mode: z.literal("developer_alpha_local"),
    status: z.enum(["disabled", "prepared", "active", "fallback", "blocked"]),
    retainedSessionId: z.literal("qwen-retained-product-session-2026-08-10"),
    retainedSessionAvailable: z.boolean(),
    explicitOptInRequired: z.literal(true),
    explicitOptInEnabled: z.boolean(),
    activeRouteSource: z.enum([
      "intent-router.deterministic.fixture",
      "intent-router.qwen3-0.6b",
    ]),
    fallbackRouteSource: z.literal("intent-router.deterministic.fixture"),
    helperLifecycle: z.enum([
      "stopped",
      "start_prepared",
      "running",
      "shutdown_after_verification",
    ]),
    helperStartCount: z.number().int().min(0).max(1),
    generationPortReadinessProbeCount: z.number().int().min(0).max(1),
    routeRequestCount: z.number().int().min(0).max(10),
    helperShutdownVerified: z.boolean(),
    routeRequestLimit: z.union([z.literal(3), z.literal(5), z.literal(10)]),
    controls: z
      .object({
        start: z.enum(["available", "blocked"]),
        stop: z.enum(["available", "blocked"]),
        rollback: z.enum(["available", "blocked"]),
      })
      .strict(),
    directActionEnabled: z.literal(false),
    browserUrlOpeningEnabled: z.literal(false),
    vsCodeBlocked: z.literal(true),
    allowlistTargets: z.tuple([z.literal("notepad"), z.literal("calculator")]),
    defaultBehaviorChanged: z.literal(false),
    releaseBehaviorChanged: z.literal(false),
    telemetryChanged: z.literal(false),
    activation: CommandRouterQwenProductRoutingActivationStatusSchema,
    reasonCodes: z
      .array(
        z
          .string()
          .regex(/^[A-Z0-9_]+$/)
          .max(128),
      )
      .max(16),
  })
  .strict();
export type QwenRuntimeControlStatus = z.infer<
  typeof QwenRuntimeControlStatusSchema
>;

export const QwenRuntimeControlSetResultSchema = z
  .object({
    ok: z.boolean(),
    action: QwenRuntimeControlActionSchema,
    status: QwenRuntimeControlStatusSchema,
    message: z.string().min(1).max(500).optional(),
  })
  .strict();
export type QwenRuntimeControlSetResult = z.infer<
  typeof QwenRuntimeControlSetResultSchema
>;

export const CommandRouterLocalAppLaunchResultSchema = z
  .object({
    status: z.enum(["completed", "blocked"]),
    target: z.enum(["notepad", "calculator", "blocked"]),
    label: z.enum(["notepad", "calculator", "blocked"]),
    reasonCode: z.enum([
      "ALLOWLISTED_TARGET_OPENED",
      "BRAIN_ACTIONS_DISABLED",
      "COMMAND_ROUTER_PRODUCT_MODE_DISABLED",
      "TARGET_NOT_ALLOWLISTED",
      "TARGET_UNAVAILABLE",
      "OPEN_FAILED",
    ]),
    confirmationRequired: z.literal(true),
    confirmationGranted: z.literal(true),
    directActionAttempted: z.boolean(),
    persisted: z.literal(false),
    rawDiagnosticsExposed: z.literal(false),
  })
  .strict();
export type CommandRouterLocalAppLaunchResult = z.infer<
  typeof CommandRouterLocalAppLaunchResultSchema
>;

export const VoiceAudioFrameMetadataSchema = z
  .object({
    captureId: z.string().min(1).max(128),
    sequenceId: z.number().int().nonnegative(),
    capturedAt: z.string().datetime(),
    sampleRate: z.literal(16_000),
    channels: z.literal(1),
    encoding: z.literal("pcm_s16le"),
    byteLength: z.number().int().positive().max(65_536),
  })
  .strict();
export type VoiceAudioFrameMetadata = z.infer<
  typeof VoiceAudioFrameMetadataSchema
>;

const Uint8ArraySchema = z.custom<Uint8Array>(
  (value) =>
    value instanceof Uint8Array ||
    (ArrayBuffer.isView(value) &&
      "BYTES_PER_ELEMENT" in value &&
      value.BYTES_PER_ELEMENT === 1),
  "Expected PCM bytes as Uint8Array.",
);

export const VoiceAudioFrameSchema = z
  .object({
    metadata: VoiceAudioFrameMetadataSchema,
    pcm: Uint8ArraySchema,
  })
  .strict()
  .superRefine((frame, context) => {
    if (frame.pcm.byteLength !== frame.metadata.byteLength) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pcm"],
        message: "PCM byte length does not match audio frame metadata.",
      });
    }
    if (frame.pcm.byteLength % 2 !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pcm"],
        message: "PCM16 audio frames must contain complete 16-bit samples.",
      });
    }
  });
export type VoiceAudioFrame = z.infer<typeof VoiceAudioFrameSchema>;

export const CoreVoiceAudioMessageSchema = z
  .object({
    kind: z.literal("voice-audio"),
    frame: VoiceAudioFrameSchema,
  })
  .strict();
export type CoreVoiceAudioMessage = z.infer<typeof CoreVoiceAudioMessageSchema>;

const EmptyPayloadSchema = z.object({}).strict();

export const BrainCommandSourceSchema = z.enum(["text", "voice"]);
export type BrainCommandSource = z.infer<typeof BrainCommandSourceSchema>;

export const BrainIntentSchema = z.enum([
  "chat.answer",
  "browser.open",
  "coding.task",
  "localApp.open",
  "notepad.write_text",
  "window.focus",
  "window.minimize",
  "window.restore",
  "filesystem.search",
  "plugin.invoke",
  "memory.search",
  "memory.preference.set",
  "observability.status",
  "model.status",
  "clarify",
  "blocked",
]);
export type BrainIntent = z.infer<typeof BrainIntentSchema>;

export const BrainDispatchStatusSchema = z.enum([
  "completed",
  "blocked",
  "needs_approval",
  "degraded",
]);
export type BrainDispatchStatus = z.infer<typeof BrainDispatchStatusSchema>;

export const BrainPlanStepStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "blocked",
]);
export type BrainPlanStepStatus = z.infer<typeof BrainPlanStepStatusSchema>;

export const BrainPlanStepSchema = z
  .object({
    id: z.string().min(1).max(128),
    title: z.string().min(1).max(300),
    status: BrainPlanStepStatusSchema,
  })
  .strict();
export type BrainPlanStep = z.infer<typeof BrainPlanStepSchema>;

export const BrainRouterDecisionSchema = z
  .object({
    intent: BrainIntentSchema,
    confidence: z.number().min(0).max(1),
    requiresApproval: z.boolean(),
    slots: z.record(z.unknown()).default({}),
    reason: z.string().min(1).max(500),
  })
  .strict();
export type BrainRouterDecision = z.infer<typeof BrainRouterDecisionSchema>;

export const VoiceInputModeSchema = z.enum([
  "command",
  "dictation",
  "conversation",
]);
export type VoiceInputMode = z.infer<typeof VoiceInputModeSchema>;

export const VoiceCommandCorrectionSourceSchema = z.enum([
  "raw",
  "alias",
  "english_normalization",
  "pinyin_similarity",
  "slot_grammar",
  "structured_candidate_selector",
  "unknown",
]);
export type VoiceCommandCorrectionSource = z.infer<
  typeof VoiceCommandCorrectionSourceSchema
>;

export const VoiceCommandCorrectionCandidateSchema = z
  .object({
    id: z.string().min(1).max(128),
    normalizedTranscript: z.string().trim().min(1).max(500),
    inputMode: VoiceInputModeSchema,
    intent: BrainIntentSchema,
    confidence: z.number().min(0).max(1),
    correctionSource: VoiceCommandCorrectionSourceSchema,
    label: z.string().trim().min(1).max(160),
    slots: z.record(z.unknown()).default({}),
  })
  .strict();
export type VoiceCommandCorrectionCandidate = z.infer<
  typeof VoiceCommandCorrectionCandidateSchema
>;

export const VoiceCommandCorrectionSchema = z
  .object({
    rawTranscript: z.string().trim().min(1).max(20_000),
    normalizedTranscript: z.string().trim().min(1).max(500),
    inputMode: VoiceInputModeSchema,
    correctionSource: VoiceCommandCorrectionSourceSchema,
    correctionConfidence: z.number().min(0).max(1),
    correctionCandidates: z
      .array(VoiceCommandCorrectionCandidateSchema)
      .max(2)
      .default([]),
    requiresUserSelection: z.boolean(),
    rawTranscriptPreserved: z.literal(true),
    directActionAttempted: z.literal(false),
  })
  .strict();
export type VoiceCommandCorrection = z.infer<
  typeof VoiceCommandCorrectionSchema
>;

export const VoiceCommandAliasRecordSchema = z
  .object({
    id: z.string().min(1).max(128),
    rawAlias: z.string().trim().min(1).max(200),
    normalizedTranscript: z.string().trim().min(1).max(500),
    intent: BrainIntentSchema,
    slots: z.record(z.unknown()).default({}),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type VoiceCommandAliasRecord = z.infer<
  typeof VoiceCommandAliasRecordSchema
>;

export const UserRouteAliasRecordSchema = z
  .object({
    id: z.string().min(1).max(128),
    label: z.string().trim().min(1).max(120),
    aliases: z.array(z.string().trim().min(1).max(160)).min(1).max(12),
    intent: z.literal("browser.open"),
    targetUrl: z.string().url().max(500),
    targetHostname: z.string().trim().min(1).max(253),
    source: z.literal("user_confirmed"),
    risk: z.literal("medium"),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type UserRouteAliasRecord = z.infer<
  typeof UserRouteAliasRecordSchema
>;

export const UserRouteAliasLearningProposalSchema = z
  .object({
    id: z.string().min(1).max(128),
    label: z.string().trim().min(1).max(120),
    aliases: z.array(z.string().trim().min(1).max(160)).min(1).max(12),
    intent: z.literal("browser.open"),
    targetUrl: z.string().url().max(500),
    targetHostname: z.string().trim().min(1).max(253),
    requiresConfirmation: z.literal(true),
    urlPolicy: z.literal("https_only_no_credentials_no_sensitive_query"),
    directActionAttempted: z.literal(false),
  })
  .strict();
export type UserRouteAliasLearningProposal = z.infer<
  typeof UserRouteAliasLearningProposalSchema
>;

export const UserPreferenceMemoryKeySchema = z.enum([
  "response_language",
  "response_length",
  "response_style",
]);
export type UserPreferenceMemoryKey = z.infer<
  typeof UserPreferenceMemoryKeySchema
>;

export const UserPreferenceMemoryValueSchema = z.enum([
  "zh",
  "short",
  "detailed",
  "concise",
  "friendly",
  "technical",
]);
export type UserPreferenceMemoryValue = z.infer<
  typeof UserPreferenceMemoryValueSchema
>;

export const UserPreferenceMemoryRecordSchema = z
  .object({
    id: z.string().min(1).max(128),
    key: UserPreferenceMemoryKeySchema,
    label: z.string().trim().min(1).max(120),
    value: UserPreferenceMemoryValueSchema,
    summary: z.string().trim().min(1).max(240),
    source: z.literal("user_confirmed_preference"),
    risk: z.literal("low"),
    enabled: z.literal(true),
    appliesTo: z.literal("ui_projection_only"),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((preference, context) => {
    const allowedValuesByKey: Record<string, readonly string[]> = {
      response_language: ["zh"],
      response_length: ["short", "detailed"],
      response_style: ["concise", "friendly", "technical"],
    };
    if (!allowedValuesByKey[preference.key]?.includes(preference.value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Preference value is not valid for the selected key.",
      });
    }
  });
export type UserPreferenceMemoryRecord = z.infer<
  typeof UserPreferenceMemoryRecordSchema
>;

export const UserControlledMemoryKindSchema = z.enum([
  "voice_command_alias",
  "route_alias",
  "preference",
]);
export type UserControlledMemoryKind = z.infer<
  typeof UserControlledMemoryKindSchema
>;

export const UserControlledMemoryRecordSchema = z
  .object({
    id: z.string().min(1).max(160),
    sourceId: z.string().min(1).max(128),
    kind: UserControlledMemoryKindSchema,
    label: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(500),
    preferenceKey: UserPreferenceMemoryKeySchema.optional(),
    preferenceValue: UserPreferenceMemoryValueSchema.optional(),
    source: z.enum([
      "voice_correction_alias",
      "user_confirmed_route_alias",
      "user_confirmed_preference",
    ]),
    risk: z.enum(["low", "medium", "high"]),
    deletable: z.literal(true),
    rawContentExposed: z.literal(false),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type UserControlledMemoryRecord = z.infer<
  typeof UserControlledMemoryRecordSchema
>;

export const BrainRouterSelectionStatusSchema = z.enum([
  "accepted",
  "fallback",
  "blocked",
  "unavailable",
]);
export type BrainRouterSelectionStatus = z.infer<
  typeof BrainRouterSelectionStatusSchema
>;

export const BrainRouterSelectionReasonCodeSchema = z.enum([
  "PROVIDER_ACCEPTED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_PREFLIGHT_BLOCKED",
  "PROVIDER_FAILED",
  "RESULT_INVALID",
  "CANDIDATE_MISSING",
  "INTENT_UNSUPPORTED",
  "CONFIDENCE_LOW",
  "ALLOWLIST_MISMATCH",
  "UNSAFE_OR_BLOCKED",
]);
export type BrainRouterSelectionReasonCode = z.infer<
  typeof BrainRouterSelectionReasonCodeSchema
>;

export const BrainRouterSelectionFailureClassSchema = z.enum([
  "none",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_PREFLIGHT_BLOCKED",
  "PROVIDER_EXECUTION_FAILED",
  "PROVIDER_RESULT_INVALID",
  "CANDIDATE_MISSING",
  "INTENT_UNSUPPORTED",
  "CONFIDENCE_LOW",
  "ALLOWLIST_MISMATCH",
  "UNSAFE_OR_BLOCKED",
]);
export type BrainRouterSelectionFailureClass = z.infer<
  typeof BrainRouterSelectionFailureClassSchema
>;

export const BrainRouterSelectionReportSchema = z
  .object({
    selectedProviderId: z.string().min(1).max(128),
    fallbackProviderId: z.string().min(1).max(128).optional(),
    status: BrainRouterSelectionStatusSchema,
    reasonCode: BrainRouterSelectionReasonCodeSchema,
    failureClass: BrainRouterSelectionFailureClassSchema,
    confidenceBand: z.enum(["none", "low", "accepted"]),
    usedRulesFallback: z.boolean(),
    directActionAttempted: z.literal(false),
  })
  .strict();
export type BrainRouterSelectionReport = z.infer<
  typeof BrainRouterSelectionReportSchema
>;

export const BrainPlannerStatusSchema = z.enum([
  "planned",
  "clarify",
  "blocked",
  "unavailable",
]);
export type BrainPlannerStatus = z.infer<typeof BrainPlannerStatusSchema>;

export const BrainPlannerSelectionStatusSchema = z.enum([
  "not_needed",
  "planned",
  "clarify",
  "fallback",
  "blocked",
  "unavailable",
]);
export type BrainPlannerSelectionStatus = z.infer<
  typeof BrainPlannerSelectionStatusSchema
>;

export const BrainPlannerReasonCodeSchema = z.enum([
  "PLANNER_NOT_NEEDED",
  "COMPLEX_REQUEST",
  "FUZZY_REQUEST",
  "FAST_ROUTER_LOW_CONFIDENCE",
  "UNSUPPORTED_INTENT",
  "CLARIFY_REQUIRED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_FAILED",
  "INVALID_PLAN",
  "UNSAFE_PLAN",
  "FIXTURE_FALLBACK",
]);
export type BrainPlannerReasonCode = z.infer<
  typeof BrainPlannerReasonCodeSchema
>;

export const BrainPlannerFailureClassSchema = z.enum([
  "none",
  "PLANNER_NOT_NEEDED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_EXECUTION_FAILED",
  "PROVIDER_RESULT_INVALID",
  "UNSAFE_PLAN",
  "CLARIFY_REQUIRED",
  "FIXTURE_FALLBACK",
]);
export type BrainPlannerFailureClass = z.infer<
  typeof BrainPlannerFailureClassSchema
>;

export const ChatAnswerStatusSchema = z.enum([
  "answered",
  "clarify",
  "blocked",
  "unavailable",
]);
export type ChatAnswerStatus = z.infer<typeof ChatAnswerStatusSchema>;

export const ChatAnswerReasonCodeSchema = z.enum([
  "FIXTURE_ANSWER",
  "CLARIFY_REQUIRED",
  "UNSAFE_OR_BLOCKED",
  "PROVIDER_UNAVAILABLE",
  "INVALID_OUTPUT",
  "PROVIDER_FAILED",
]);
export type ChatAnswerReasonCode = z.infer<typeof ChatAnswerReasonCodeSchema>;

export const ChatAnswerFailureClassSchema = z.enum([
  "none",
  "CLARIFY_REQUIRED",
  "UNSAFE_OR_BLOCKED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_RESULT_INVALID",
  "PROVIDER_EXECUTION_FAILED",
]);
export type ChatAnswerFailureClass = z.infer<
  typeof ChatAnswerFailureClassSchema
>;

export const ChatAnswerPreferenceProjectionSchema = z
  .object({
    status: z.enum(["not_configured", "none", "applied", "unavailable"]),
    appliesTo: z.literal("chat.answer"),
    preferredResponseLanguage: z.literal("zh").optional(),
    preferredResponseLength: z.enum(["short", "detailed"]).optional(),
    preferredResponseStyle: z
      .enum(["concise", "friendly", "technical"])
      .optional(),
    source: z.enum(["none", "user_preference_memory"]),
    rawContentExposed: z.literal(false),
    vectorRetrievalUsed: z.literal(false),
    providerNeutral: z.literal(true),
  })
  .strict()
  .superRefine((projection, context) => {
    const hasAppliedPreference =
      projection.preferredResponseLanguage !== undefined ||
      projection.preferredResponseLength !== undefined ||
      projection.preferredResponseStyle !== undefined;
    if (
      projection.status === "applied" &&
      !hasAppliedPreference
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message:
          "Applied Chat Answer preference projections require at least one preference.",
      });
    }
    if (
      projection.status !== "applied" &&
      hasAppliedPreference
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message:
          "Inactive Chat Answer preference projections must not carry preferences.",
      });
    }
  });
export type ChatAnswerPreferenceProjection = z.infer<
  typeof ChatAnswerPreferenceProjectionSchema
>;

export const ChatAnswerRequestSchema = z
  .object({
    providerId: z.string().trim().min(1).max(128),
    utterance: z.string().trim().min(1).max(20_000),
    source: BrainCommandSourceSchema,
    routedAt: z.string().datetime(),
    routerDecision: BrainRouterDecisionSchema,
    routerSelection: BrainRouterSelectionReportSchema.optional(),
    preferenceProjection: ChatAnswerPreferenceProjectionSchema.optional(),
  })
  .strict();
export type ChatAnswerRequest = z.infer<typeof ChatAnswerRequestSchema>;

export const ChatAnswerResultSchema = z
  .object({
    providerId: z.string().trim().min(1).max(128),
    status: ChatAnswerStatusSchema,
    reasonCode: ChatAnswerReasonCodeSchema,
    failureClass: ChatAnswerFailureClassSchema,
    answer: z.string().trim().min(1).max(2_000).optional(),
    clarifyQuestion: z.string().trim().min(1).max(500).optional(),
    fallbackUsed: z.boolean(),
    directActionAttempted: z.literal(false),
    rawProviderResponsePersisted: z.literal(false),
    credentialExposed: z.literal(false),
    preferenceProjection: ChatAnswerPreferenceProjectionSchema.optional(),
    answeredAt: z.string().datetime(),
  })
  .strict()
  .superRefine((result, context) => {
    if (result.status === "answered" && result.answer === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answer"],
        message: "Answered results require bounded answer text.",
      });
    }
    if (result.status === "clarify" && result.clarifyQuestion === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clarifyQuestion"],
        message: "Clarify results require a bounded follow-up question.",
      });
    }
    if (
      (result.status === "blocked" || result.status === "unavailable") &&
      (result.answer !== undefined || result.clarifyQuestion !== undefined)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Blocked and unavailable results must not carry answer content.",
      });
    }
  });
export type ChatAnswerResult = z.infer<typeof ChatAnswerResultSchema>;

export const BrainPlanRiskClassSchema = z.enum([
  "low",
  "medium",
  "high",
  "blocked",
]);
export type BrainPlanRiskClass = z.infer<typeof BrainPlanRiskClassSchema>;

export const BrainPlannedToolStepSchema = z
  .object({
    id: z.string().min(1).max(128),
    toolId: z.string().min(1).max(128),
    title: z.string().min(1).max(300),
    args: z.record(z.unknown()).default({}),
    risk: BrainPlanRiskClassSchema,
    requiresConfirmation: z.boolean(),
    directActionAttempted: z.literal(false),
  })
  .strict()
  .superRefine((step, context) => {
    if (
      (step.risk === "medium" ||
        step.risk === "high" ||
        step.risk === "blocked") &&
      !step.requiresConfirmation
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiresConfirmation"],
        message:
          "Medium, high, and blocked BrainPlan steps require confirmation.",
      });
    }
  });
export type BrainPlannedToolStep = z.infer<typeof BrainPlannedToolStepSchema>;

export const BrainPlanSchema = z
  .object({
    summary: z.string().trim().min(1).max(2_000),
    risk: BrainPlanRiskClassSchema,
    requiresConfirmation: z.boolean(),
    steps: z.array(BrainPlannedToolStepSchema).min(1).max(8),
    directActionAttempted: z.literal(false),
  })
  .strict()
  .superRefine((plan, context) => {
    const requiresConfirmation =
      plan.risk === "medium" ||
      plan.risk === "high" ||
      plan.risk === "blocked" ||
      plan.steps.some((step) => step.requiresConfirmation);
    if (requiresConfirmation && !plan.requiresConfirmation) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiresConfirmation"],
        message:
          "BrainPlan must require confirmation when the plan or any step is medium, high, or blocked risk.",
      });
    }
  });
export type BrainPlan = z.infer<typeof BrainPlanSchema>;

export const BrainPlannerSelectionReportSchema = z
  .object({
    providerId: z.string().min(1).max(128),
    fallbackProviderId: z.string().min(1).max(128).optional(),
    status: BrainPlannerSelectionStatusSchema,
    reasonCode: BrainPlannerReasonCodeSchema,
    failureClass: BrainPlannerFailureClassSchema,
    usedPlanner: z.boolean(),
    usedRulesFallback: z.boolean(),
    directActionAttempted: z.literal(false),
  })
  .strict();
export type BrainPlannerSelectionReport = z.infer<
  typeof BrainPlannerSelectionReportSchema
>;

export const BrainPlannerProviderConfigurationReportSchema = z
  .object({
    providerId: z.string().min(1).max(128),
    status: z.enum(["configured", "unconfigured", "unavailable"]),
    credentialConfigured: z.boolean(),
    credentialExposed: z.literal(false),
    networkAccessApproved: z.literal(false),
    reasons: z.array(z.string().min(1).max(500)).max(8).default([]),
  })
  .strict();
export type BrainPlannerProviderConfigurationReport = z.infer<
  typeof BrainPlannerProviderConfigurationReportSchema
>;

export const BrainPlannerRequestSchema = z
  .object({
    providerId: z.string().min(1).max(128),
    utterance: z.string().trim().min(1).max(20_000),
    source: BrainCommandSourceSchema,
    routedAt: z.string().datetime(),
    routerDecision: BrainRouterDecisionSchema,
    routerSelection: BrainRouterSelectionReportSchema.optional(),
    context: z
      .object({
        activeConversationId: z.string().min(1).max(128).optional(),
        allowedToolIds: z.array(z.string().min(1).max(128)).max(64),
      })
      .strict()
      .optional(),
  })
  .strict();
export type BrainPlannerRequest = z.infer<typeof BrainPlannerRequestSchema>;

export const BrainPlannerResultSchema = z
  .object({
    providerId: z.string().min(1).max(128),
    status: BrainPlannerStatusSchema,
    reasonCode: BrainPlannerReasonCodeSchema,
    failureClass: BrainPlannerFailureClassSchema,
    plan: BrainPlanSchema.optional(),
    clarifyQuestion: z.string().trim().min(1).max(500).optional(),
    directActionAttempted: z.literal(false),
    plannedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((result, context) => {
    if (result.status === "planned" && result.plan === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["plan"],
        message: "A planned BrainPlannerResult must include a BrainPlan.",
      });
    }
    if (result.status === "clarify" && result.clarifyQuestion === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clarifyQuestion"],
        message:
          "A clarify BrainPlannerResult must include a clarify question.",
      });
    }
  });
export type BrainPlannerResult = z.infer<typeof BrainPlannerResultSchema>;

export const BrainToolProductLoopStageSchema = z.enum([
  "received",
  "routed",
  "planned",
  "tool_selected",
  "safety_checked",
  "confirmation",
  "fixture_replayed",
  "fallback",
  "rollback",
  "result",
]);
export type BrainToolProductLoopStage = z.infer<
  typeof BrainToolProductLoopStageSchema
>;

export const BrainToolProductLoopStepSchema = z
  .object({
    stage: BrainToolProductLoopStageSchema,
    status: z.enum([
      "completed",
      "pending",
      "needs_confirmation",
      "blocked",
      "degraded",
    ]),
    label: z.string().trim().min(1).max(160),
    reasonCode: z
      .string()
      .regex(/^[A-Z0-9_]{1,128}$/u)
      .optional(),
  })
  .strict();
export type BrainToolProductLoopStep = z.infer<
  typeof BrainToolProductLoopStepSchema
>;

export const BrainToolDescriptorProjectionSchema = z
  .object({
    id: z.string().min(1).max(128),
    version: z.string().min(1).max(32),
    label: z.string().trim().min(1).max(120),
    risk: ToolRiskSchema,
    execution: ToolExecutionModeSchema,
    requiresConfirmation: z.boolean(),
    permissionCount: z.number().int().min(0).max(16),
  })
  .strict();
export type BrainToolDescriptorProjection = z.infer<
  typeof BrainToolDescriptorProjectionSchema
>;

export const BrainToolProductLoopSchema = z
  .object({
    mode: z.literal("fixture_replay"),
    registryVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
    descriptors: z.array(BrainToolDescriptorProjectionSchema).min(1).max(16),
    selectedToolId: z.string().min(1).max(128).optional(),
    routeReasonCode: z.string().regex(/^[A-Z0-9_]{1,128}$/u),
    safety: ToolPolicyDecisionSchema.optional(),
    execution: z
      .object({
        status: ToolExecutionLifecycleStatusSchema,
        resultCode: ToolReasonCodeSchema,
        failureClasses: z.array(ToolFailureClassSchema).max(16),
        rollbackState: ToolRollbackStateSchema,
        cleanupState: ToolCleanupStateSchema,
      })
      .strict()
      .optional(),
    lifecycle: z.array(BrainToolProductLoopStepSchema).min(1).max(12),
    fallbackReasonCode: z
      .string()
      .regex(/^[A-Z0-9_]{1,128}$/u)
      .optional(),
    retryState: z.enum(["not_started", "not_available", "blocked"]),
    rollbackState: ToolRollbackStateSchema,
    summary: z.string().trim().min(1).max(500),
    persisted: z.literal(false),
    rawDiagnosticsExposed: z.literal(false),
    directActionAttempted: z.literal(false),
  })
  .strict();
export type BrainToolProductLoop = z.infer<typeof BrainToolProductLoopSchema>;

export const BrainAlphaMemoryContextSchema = z
  .object({
    status: z.enum(["available", "unavailable", "not_requested"]),
    mode: z.enum(["fixture_only", "provider_vector", "unknown"]),
    matchCount: z.number().int().min(0).max(5),
    queryDimensions: z.number().int().min(0).max(16_384),
    readOnly: z.literal(true),
    rawContentExposed: z.literal(false),
  })
  .strict();
export type BrainAlphaMemoryContext = z.infer<
  typeof BrainAlphaMemoryContextSchema
>;

export const BrainAlphaRetrySchema = z
  .object({
    status: z.enum(["available", "completed", "not_available", "blocked"]),
    attemptCount: z.number().int().min(0).max(3),
    safetyPathReentered: z.literal(true),
    reasonCode: z
      .string()
      .regex(/^[A-Z0-9_]{1,128}$/u)
      .optional(),
  })
  .strict();
export type BrainAlphaRetry = z.infer<typeof BrainAlphaRetrySchema>;

export const BrainAlphaRollbackSchema = z
  .object({
    status: z.enum(["available", "completed", "not_available", "blocked"]),
    safetyPreserved: z.literal(true),
    reasonCode: z
      .string()
      .regex(/^[A-Z0-9_]{1,128}$/u)
      .optional(),
  })
  .strict();
export type BrainAlphaRollback = z.infer<typeof BrainAlphaRollbackSchema>;

export const BrainAlphaTtsSchema = z
  .object({
    status: z.enum([
      "disabled",
      "eligible",
      "played",
      "cancelled",
      "unavailable",
    ]),
    localOnly: z.literal(true),
    defaultOff: z.literal(true),
    boundedText: z.literal(true),
    rawTextPersisted: z.literal(false),
  })
  .strict();
export type BrainAlphaTts = z.infer<typeof BrainAlphaTtsSchema>;

export const BrainAlphaHardeningSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    sessionEntryId: z.string().min(1).max(128),
    memoryContext: BrainAlphaMemoryContextSchema,
    retry: BrainAlphaRetrySchema,
    rollback: BrainAlphaRollbackSchema,
    tts: BrainAlphaTtsSchema,
    persisted: z.literal(false),
    rawDiagnosticsExposed: z.literal(false),
    directActionAttempted: z.literal(false),
    memoryWriteAttempted: z.literal(false),
  })
  .strict();
export type BrainAlphaHardening = z.infer<typeof BrainAlphaHardeningSchema>;

export const SessionHistoryEntrySchema = z
  .object({
    id: z.string().min(1).max(128),
    createdAt: z.string().datetime(),
    source: BrainCommandSourceSchema,
    intent: BrainIntentSchema,
    selectedToolId: z.string().min(1).max(128).optional(),
    dispatchStatus: BrainDispatchStatusSchema,
    confirmation: z.enum(["not_required", "required", "granted", "blocked"]),
    resultStatus: z.enum([
      "completed",
      "blocked",
      "degraded",
      "needs_approval",
    ]),
    reasonCode: z.string().regex(/^[A-Z0-9_]{1,128}$/u),
    memoryContextStatus: BrainAlphaMemoryContextSchema.shape.status,
    retryStatus: BrainAlphaRetrySchema.shape.status,
    rollbackStatus: BrainAlphaRollbackSchema.shape.status,
    ttsStatus: BrainAlphaTtsSchema.shape.status,
    persisted: z.literal(false),
    rawContentExposed: z.literal(false),
  })
  .strict();
export type SessionHistoryEntry = z.infer<typeof SessionHistoryEntrySchema>;

export const BrainCommandResultSchema = z
  .object({
    source: BrainCommandSourceSchema,
    text: z.string().trim().min(1).max(20_000),
    rawTranscript: z.string().trim().min(1).max(20_000).optional(),
    normalizedTranscript: z.string().trim().min(1).max(500).optional(),
    voiceInputMode: VoiceInputModeSchema.optional(),
    correctionSource: VoiceCommandCorrectionSourceSchema.optional(),
    correctionConfidence: z.number().min(0).max(1).optional(),
    correctionCandidates: z
      .array(VoiceCommandCorrectionCandidateSchema)
      .max(2)
      .optional(),
    voiceCorrection: VoiceCommandCorrectionSchema.optional(),
    routedAt: z.string().datetime(),
    decision: BrainRouterDecisionSchema,
    routerSelection: BrainRouterSelectionReportSchema.optional(),
    plannerSelection: BrainPlannerSelectionReportSchema.optional(),
    plannerResult: BrainPlannerResultSchema.optional(),
    chatAnswer: ChatAnswerResultSchema.optional(),
    pluginResult: PluginInvocationResultSchema.optional(),
    plan: z.array(BrainPlanStepSchema).min(1).max(8),
    dispatchStatus: BrainDispatchStatusSchema,
    summary: z.string().min(1).max(2_000),
    messageId: z.string().min(1).optional(),
    assistantMessageId: z.string().min(1).optional(),
    memoryRecall: z.unknown().optional(),
    toolProductLoop: BrainToolProductLoopSchema.optional(),
    alphaHardening: BrainAlphaHardeningSchema.optional(),
    userRouteAliasProposal: UserRouteAliasLearningProposalSchema.optional(),
  })
  .strict();
export type BrainCommandResult = z.infer<typeof BrainCommandResultSchema>;

export const AgentCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("agent.ping"),
    payload: z.object({ sentAt: z.string().datetime() }).strict(),
  }),
  z.object({
    type: z.literal("agent.getSnapshot"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.runBrainCommand"),
    payload: z
      .object({
        source: BrainCommandSourceSchema.default("text"),
        conversationId: z.string().min(1).max(128).optional(),
        text: z.string().trim().min(1).max(20_000),
        voiceInputMode: VoiceInputModeSchema.optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.confirmVoiceCommandCorrection"),
    payload: z
      .object({
        rawAlias: z.string().trim().min(1).max(200),
        normalizedTranscript: z.string().trim().min(1).max(500),
        intent: BrainIntentSchema,
        slots: z.record(z.unknown()).default({}),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.listVoiceCommandAliases"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.deleteVoiceCommandAlias"),
    payload: z
      .object({
        aliasId: z.string().trim().min(1).max(128),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.confirmUserRouteAlias"),
    payload: z
      .object({
        proposalId: z.string().trim().min(1).max(128),
        confirmation: z.literal("explicit_ui_confirmation"),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.listUserRouteAliases"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.deleteUserRouteAlias"),
    payload: z
      .object({
        aliasId: z.string().trim().min(1).max(128),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.listUserControlledMemories"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.deleteUserControlledMemory"),
    payload: z
      .object({
        kind: UserControlledMemoryKindSchema,
        sourceId: z.string().trim().min(1).max(128),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.cancelTask"),
    payload: z
      .object({
        taskId: z.string().trim().min(1).max(128),
        reason: z.string().trim().min(1).max(300).optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.approveTask"),
    payload: z
      .object({
        taskId: z.string().trim().min(1).max(128),
        confirmation: z.literal("explicit_ui_confirmation"),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.confirmCommandRouterLocalAppLaunch"),
    payload: z
      .object({
        target: z.string().trim().min(1).max(64),
        confirmation: z.literal("explicit_ui_confirmation"),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.clearSessionHistory"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.getCapabilities"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.listModelManifests"),
    payload: z
      .object({
        capability: z.lazy(() => LocalModelCapabilitySchema).optional(),
        includeRedRisk: z.boolean().optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.listModelCandidates"),
    payload: z
      .object({
        capability: z.lazy(() => LocalModelCapabilitySchema).optional(),
        includeRedRisk: z.boolean().optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.listModelInventory"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.listModelRuntimeAdapters"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.listInferenceProviders"),
    payload: z
      .object({
        capability: z.lazy(() => LocalModelCapabilitySchema).optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.listInferenceProviderRequirements"),
    payload: z
      .object({
        capability: z.lazy(() => LocalModelCapabilitySchema).optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.previewInferenceExecution"),
    payload: z
      .object({
        capability: z.lazy(() => LocalModelCapabilitySchema),
        modelId: z.string().min(1).max(300),
        exclusiveGpu: z.boolean().optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.generateEmbeddings"),
    payload: z.lazy(() => EmbeddingGenerationRequestSchema),
  }),
  z.object({
    type: z.literal("agent.routeIntent"),
    payload: z.lazy(() => IntentRoutingRequestSchema),
  }),
  z.object({
    type: z.literal("agent.recognizeOcr"),
    payload: z.lazy(() => OcrRecognitionRequestSchema),
  }),
  z.object({
    type: z.literal("agent.rerank"),
    payload: z.lazy(() => RerankRequestSchema),
  }),
  z.object({
    type: z.literal("agent.listModelOperations"),
    payload: z
      .object({
        modelId: z.string().min(1).max(300).optional(),
        activeOnly: z.boolean().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.getResourceDiagnostics"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.prepareModelInstall"),
    payload: z
      .object({
        modelId: z.string().min(1).max(300),
        allowYellowRisk: z.boolean().optional(),
        allowUnknownRisk: z.boolean().optional(),
        exclusiveGpu: z.boolean().optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.listPlugins"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.getPluginManagementStatus"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.getLocalPluginManifestDeveloperStatus"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.setLocalPluginEnabledState"),
    payload: LocalPluginEnabledStateSetRequestSchema,
  }),
  z.object({
    type: z.literal("agent.invokePlugin"),
    payload: PluginInvocationRequestSchema,
  }),
  z.object({
    type: z.literal("agent.previewModelInstallability"),
    payload: z
      .object({
        modelId: z.string().min(1).max(300),
        allowYellowRisk: z.boolean().optional(),
        allowUnknownRisk: z.boolean().optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.getMemoryHealth"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.exportMemorySnapshot"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.importMemorySnapshot"),
    payload: z
      .object({
        snapshot: z.lazy(() => MemorySnapshotSchema),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.getMemoryAlphaStatus"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.probeMemoryAlphaRecall"),
    payload: z
      .object({
        conversationId: z.string().min(1).max(128).optional(),
        text: z.string().trim().min(1).max(2_000),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.disableMemoryAlpha"),
    payload: EmptyPayloadSchema,
  }),
  z.object({
    type: z.literal("agent.listConversations"),
    payload: z
      .object({
        limit: z.number().int().min(1).max(500).optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.createConversation"),
    payload: z
      .object({
        title: z.string().trim().min(1).max(200).optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.selectConversation"),
    payload: z
      .object({
        conversationId: z.string().min(1).max(128),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.renameConversation"),
    payload: z
      .object({
        conversationId: z.string().min(1).max(128),
        title: z.string().trim().min(1).max(200),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("agent.sendMessage"),
    payload: z
      .object({
        conversationId: z.string().min(1).max(128).optional(),
        text: z.string().trim().min(1).max(20_000),
      })
      .strict(),
  }),
]);

export type AgentCommand = z.infer<typeof AgentCommandSchema>;

export const VoiceCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("voice.setMode"),
    payload: z.object({ mode: VoiceModeSchema }).strict(),
  }),
  z.object({
    type: z.literal("voice.startPtt"),
    payload: z
      .object({
        captureId: z.string().min(1).max(128).optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("voice.stopPtt"),
    payload: z
      .object({
        captureId: z.string().min(1).max(128).optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("voice.cancel"),
    payload: z
      .object({
        reason: z.enum(["user", "window-blur", "capture-error", "shutdown"]),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("voice.suspendForTts"),
    payload: z
      .object({
        playbackId: z.string().min(1).max(128),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("voice.resumeAfterTts"),
    payload: z
      .object({
        playbackId: z.string().min(1).max(128),
        interrupted: z.boolean(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("voice.reportPermission"),
    payload: z
      .object({
        permission: VoicePermissionStateSchema,
      })
      .strict(),
  }),
]);

export type VoiceCommand = z.infer<typeof VoiceCommandSchema>;

export const AppCommandSchema = z.union([
  AgentCommandSchema,
  VoiceCommandSchema,
]);

export type AppCommand = z.infer<typeof AppCommandSchema>;

export const CommandEnvelopeSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    commandId: z.string().min(1).max(128),
    correlationId: z.string().min(1).max(128),
    createdAt: z.string().datetime(),
    command: AppCommandSchema,
  })
  .strict();

export type CommandEnvelope = z.infer<typeof CommandEnvelopeSchema>;

export const StructuredErrorSchema = z
  .object({
    code: z.string().min(1).max(128),
    message: z.string().min(1).max(2_000),
    retryable: z.boolean(),
    details: z.record(z.unknown()).optional(),
  })
  .strict();

export type StructuredError = z.infer<typeof StructuredErrorSchema>;

export const CommandResultSchema = z.union([
  z
    .object({
      protocolVersion: z.literal(PROTOCOL_VERSION),
      commandId: z.string().min(1),
      correlationId: z.string().min(1),
      completedAt: z.string().datetime(),
      ok: z.literal(true),
      data: z.unknown().optional(),
    })
    .strict(),
  z
    .object({
      protocolVersion: z.literal(PROTOCOL_VERSION),
      commandId: z.string().min(1),
      correlationId: z.string().min(1),
      completedAt: z.string().datetime(),
      ok: z.literal(false),
      error: StructuredErrorSchema,
    })
    .strict(),
]);

export type CommandResult = z.infer<typeof CommandResultSchema>;

export const MessageSchema = z
  .object({
    id: z.string().min(1),
    conversationId: z.string().min(1),
    role: z.enum(["user", "assistant", "system"]),
    text: z.string(),
    createdAt: z.string().datetime(),
  })
  .strict();

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z
  .object({
    id: z.string().min(1).max(128),
    title: z.string().trim().min(1).max(200),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    lastMessageAt: z.string().datetime().optional(),
  })
  .strict();

export type Conversation = z.infer<typeof ConversationSchema>;

export const MemoryHealthSchema = z
  .object({
    status: z.enum(["ok", "degraded"]),
    checkedAt: z.string().datetime(),
    code: z.string().min(1).max(128).optional(),
    message: z.string().min(1).max(2_000).optional(),
  })
  .strict();

export type MemoryHealth = z.infer<typeof MemoryHealthSchema>;

export const MemorySummarySchema = z
  .object({
    id: z.string().min(1).max(128),
    conversationId: z.string().min(1).max(128),
    text: z.string().trim().min(1).max(20_000),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    fromMessageId: z.string().min(1).max(128).optional(),
    toMessageId: z.string().min(1).max(128).optional(),
  })
  .strict();

export type MemorySummary = z.infer<typeof MemorySummarySchema>;

export const MemorySnapshotSchema = z
  .object({
    messages: z.array(MessageSchema),
    conversations: z.array(ConversationSchema).default([]),
    summaries: z.array(MemorySummarySchema).default([]),
    activeConversationId: z.string().min(1).max(128).optional(),
  })
  .strict();

export type MemorySnapshot = z.infer<typeof MemorySnapshotSchema>;

export const MemoryAlphaStateSchema = z.enum([
  "disabled",
  "active",
  "degraded",
]);

export type MemoryAlphaState = z.infer<typeof MemoryAlphaStateSchema>;

export const MemoryAlphaReasonCodeSchema = z.enum([
  "memory_alpha_opt_in_missing",
  "memory_alpha_disabled",
  "memory_alpha_retention_limit_reached",
  "provider_vector_rollback_failed",
  "memory_alpha_unavailable",
]);

export type MemoryAlphaReasonCode = z.infer<typeof MemoryAlphaReasonCodeSchema>;

export const MemoryAlphaRollbackStatusSchema = z.enum([
  "not_started",
  "passed",
  "degraded",
]);

export type MemoryAlphaRollbackStatus = z.infer<
  typeof MemoryAlphaRollbackStatusSchema
>;

export const MemoryAlphaStatusSchema = z
  .object({
    state: MemoryAlphaStateSchema,
    enabled: z.boolean(),
    retentionScope: z.literal("new_accepted_user_messages"),
    maxMessageCount: z.number().int().min(1).max(5),
    trackedMessageCount: z.number().int().min(0).max(5),
    rollbackStatus: MemoryAlphaRollbackStatusSchema,
    rollbackDeletedCount: z.number().int().nonnegative().max(5),
    reasonCodes: z.array(MemoryAlphaReasonCodeSchema).max(8).default([]),
  })
  .strict();

export type MemoryAlphaStatus = z.infer<typeof MemoryAlphaStatusSchema>;

export const MemoryAlphaRecallFailureClassSchema = z.enum([
  "QUERY_EMBEDDING_TIMEOUT",
  "QUERY_EMBEDDING_FAILED",
  "VECTOR_QUERY_EXECUTION_FAILED",
  "VECTOR_QUERY_RESULT_INVALID",
  "HELPER_LIFECYCLE_FAILED",
  "MEMORY_RETRIEVAL_ROUTING_FAILED",
]);

export type MemoryAlphaRecallFailureClass = z.infer<
  typeof MemoryAlphaRecallFailureClassSchema
>;

export const MemoryAlphaRecallProbeResultSchema = z
  .object({
    status: z.enum(["ok", "degraded", "disabled"]),
    mode: z.enum(["fixture_only", "provider_vector"]),
    enabled: z.boolean(),
    matchCount: z.number().int().nonnegative().max(5),
    queryDimensions: z.number().int().nonnegative().max(8192),
    generatedAt: z.string().datetime(),
    reasonCode: z
      .string()
      .regex(/^[A-Z0-9_]{1,128}$/u)
      .optional(),
    failureClass: MemoryAlphaRecallFailureClassSchema.optional(),
  })
  .strict();

export type MemoryAlphaRecallProbeResult = z.infer<
  typeof MemoryAlphaRecallProbeResultSchema
>;

export const DeviceRuntimeModeSchema = z.enum([
  "lite",
  "standard",
  "local_enhanced",
  "private_offline",
]);

export type DeviceRuntimeMode = z.infer<typeof DeviceRuntimeModeSchema>;

export const AccelerationBackendSchema = z.enum([
  "cpu",
  "cuda",
  "directml",
  "openvino",
  "onnxruntime",
]);

export type AccelerationBackend = z.infer<typeof AccelerationBackendSchema>;

export const GpuDeviceSchema = z
  .object({
    name: z.string().min(1).max(300),
    vendor: z
      .enum(["nvidia", "amd", "intel", "microsoft", "unknown"])
      .optional(),
    dedicatedMemoryBytes: z.number().int().nonnegative().optional(),
    driverVersion: z.string().min(1).max(128).optional(),
  })
  .strict();

export type GpuDevice = z.infer<typeof GpuDeviceSchema>;

export const DeviceCapabilitySchema = z
  .object({
    checkedAt: z.string().datetime(),
    platform: z.enum(["win32", "darwin", "linux", "unknown"]),
    arch: z.string().min(1).max(64),
    cpuLogicalCores: z.number().int().positive(),
    totalMemoryBytes: z.number().int().nonnegative(),
    availableMemoryBytes: z.number().int().nonnegative(),
    gpus: z.array(GpuDeviceSchema).default([]),
    accelerationBackends: z.array(AccelerationBackendSchema).default(["cpu"]),
    recommendedMode: DeviceRuntimeModeSchema,
    reasons: z.array(z.string().min(1).max(300)).default([]),
  })
  .strict();

export type DeviceCapability = z.infer<typeof DeviceCapabilitySchema>;

export const LocalModelCapabilitySchema = z.enum([
  "speech_to_text",
  "text_to_speech",
  "ocr",
  "embedding",
  "reranker",
  "intent_router",
  "vision",
]);

export type LocalModelCapability = z.infer<typeof LocalModelCapabilitySchema>;

export const ModelRuntimeSchema = z.enum([
  "ctranslate2",
  "onnxruntime",
  "llama_cpp",
  "transformers",
  "paddle",
  "system",
  "remote",
]);

export type ModelRuntime = z.infer<typeof ModelRuntimeSchema>;

export const ModelRuntimeAdapterDescriptorSchema = z
  .object({
    runtime: ModelRuntimeSchema,
    capabilities: z.array(LocalModelCapabilitySchema),
    accelerationBackends: z.array(AccelerationBackendSchema).default([]),
    notes: z.array(z.string().min(1).max(500)).default([]),
  })
  .strict();

export type ModelRuntimeAdapterDescriptor = z.infer<
  typeof ModelRuntimeAdapterDescriptorSchema
>;

export const InferenceProviderStatusSchema = z.enum([
  "available",
  "unconfigured",
  "degraded",
]);

export type InferenceProviderStatus = z.infer<
  typeof InferenceProviderStatusSchema
>;

export const InferenceProviderDescriptorSchema = z
  .object({
    capability: LocalModelCapabilitySchema,
    provider: z.string().min(1).max(128),
    status: InferenceProviderStatusSchema,
    execution: z.enum(["local", "cloud", "system", "disabled"]),
    modelIds: z.array(z.string().min(1).max(300)).default([]),
    reasons: z.array(z.string().min(1).max(500)).default([]),
  })
  .strict();

export type InferenceProviderDescriptor = z.infer<
  typeof InferenceProviderDescriptorSchema
>;

export const InferenceProviderRequirementSourceSchema = z.enum([
  "environment",
  "safe_storage",
  "file",
  "runtime",
  "manual",
  "unknown",
]);

export type InferenceProviderRequirementSource = z.infer<
  typeof InferenceProviderRequirementSourceSchema
>;

export const InferenceProviderRequirementSchema = z
  .object({
    key: z.string().min(1).max(128),
    source: InferenceProviderRequirementSourceSchema,
    required: z.boolean(),
    configured: z.boolean(),
    description: z.string().min(1).max(500).optional(),
    reasons: z.array(z.string().min(1).max(500)).default([]),
  })
  .strict();

export type InferenceProviderRequirement = z.infer<
  typeof InferenceProviderRequirementSchema
>;

export const InferenceProviderConfigurationReportSchema = z
  .object({
    capability: LocalModelCapabilitySchema,
    provider: z.string().min(1).max(128),
    status: InferenceProviderStatusSchema,
    requirements: z.array(InferenceProviderRequirementSchema).default([]),
    reasons: z.array(z.string().min(1).max(500)).default([]),
  })
  .strict();

export type InferenceProviderConfigurationReport = z.infer<
  typeof InferenceProviderConfigurationReportSchema
>;

export const InferencePreflightReportSchema = z
  .object({
    capability: LocalModelCapabilitySchema,
    modelId: z.string().min(1).max(300),
    allowed: z.boolean(),
    providers: z.array(InferenceProviderDescriptorSchema).default([]),
    reasons: z.array(z.string().min(1).max(500)).default([]),
  })
  .strict();

export type InferencePreflightReport = z.infer<
  typeof InferencePreflightReportSchema
>;

export const ModelDistributionStatusSchema = z.enum([
  "not_downloaded",
  "available",
  "loaded",
  "unavailable",
  "cloud_only",
]);

export type ModelDistributionStatus = z.infer<
  typeof ModelDistributionStatusSchema
>;

export const ModelManifestSchema = z
  .object({
    id: z.string().min(1).max(300),
    capability: LocalModelCapabilitySchema,
    source: z.enum(["huggingface", "jarvis", "system", "third_party"]),
    revision: z.string().min(1).max(128),
    license: z.string().min(1).max(128),
    runtime: ModelRuntimeSchema,
    quantization: z.string().min(1).max(64).optional(),
    sizeBytes: z.number().int().nonnegative(),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    minMemoryBytes: z.number().int().nonnegative().optional(),
    minVramBytes: z.number().int().nonnegative().optional(),
    licenseRisk: z.enum(["green", "yellow", "red", "unknown"]),
  })
  .strict();

export type ModelManifest = z.infer<typeof ModelManifestSchema>;

export const ModelAuditRecordSchema = z
  .object({
    checkedAt: z.string().datetime(),
    evidenceUrls: z.array(z.string().url()).min(1),
    pinStatus: z.enum(["candidate", "pending_pin", "pinned", "rejected"]),
    notes: z.array(z.string().min(1).max(500)).default([]),
  })
  .strict();

export type ModelAuditRecord = z.infer<typeof ModelAuditRecordSchema>;

export const ModelCandidateSchema = z
  .object({
    id: z.string().min(1).max(300),
    capability: LocalModelCapabilitySchema,
    source: z.enum(["huggingface", "jarvis", "system", "third_party"]),
    officialUrl: z.string().url(),
    license: z.string().min(1).max(128),
    licenseRisk: z.enum(["green", "yellow", "red", "unknown"]),
    distributionRisk: z.enum(["green", "yellow", "red", "unknown"]),
    runtime: ModelRuntimeSchema,
    recommendedMode: DeviceRuntimeModeSchema.optional(),
    downloadEnabled: z.literal(false),
    audit: ModelAuditRecordSchema,
  })
  .strict();

export type ModelCandidate = z.infer<typeof ModelCandidateSchema>;

export const ModelInventoryItemSchema = z
  .object({
    manifest: ModelManifestSchema,
    status: ModelDistributionStatusSchema,
    lastVerifiedAt: z.string().datetime().optional(),
  })
  .strict();

export type ModelInventoryItem = z.infer<typeof ModelInventoryItemSchema>;

export const EmbeddingInputSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    text: z.string().trim().min(1).max(20_000),
  })
  .strict();

export type EmbeddingInput = z.infer<typeof EmbeddingInputSchema>;

export const EmbeddingVectorSchema = z
  .object({
    inputId: z.string().min(1).max(128).optional(),
    values: z.array(z.number().finite()).min(1).max(8192),
  })
  .strict();

export type EmbeddingVector = z.infer<typeof EmbeddingVectorSchema>;

export const EmbeddingGenerationRequestSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    inputs: z.array(EmbeddingInputSchema).min(1).max(128),
    dimensions: z.number().int().positive().max(8192).optional(),
  })
  .strict();

export type EmbeddingGenerationRequest = z.infer<
  typeof EmbeddingGenerationRequestSchema
>;

export const EmbeddingGenerationResultSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    dimensions: z.number().int().positive().max(8192),
    vectors: z.array(EmbeddingVectorSchema).min(1).max(128),
    generatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((result, ctx) => {
    if (result.vectors.length === 0) {
      return;
    }
    for (const [index, vector] of result.vectors.entries()) {
      if (vector.values.length !== result.dimensions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["vectors", index, "values"],
          message: "Embedding vector length must match dimensions.",
        });
      }
    }
  });

export type EmbeddingGenerationResult = z.infer<
  typeof EmbeddingGenerationResultSchema
>;

const OcrImageBytesSchema = z.custom<Uint8Array>(
  (value) =>
    value instanceof Uint8Array ||
    (ArrayBuffer.isView(value) &&
      "BYTES_PER_ELEMENT" in value &&
      value.BYTES_PER_ELEMENT === 1),
  "Expected image bytes as Uint8Array.",
);

export const OcrImageInputSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/bmp"]),
    bytes: OcrImageBytesSchema,
    width: z.number().int().positive().max(100_000).optional(),
    height: z.number().int().positive().max(100_000).optional(),
  })
  .strict()
  .superRefine((image, ctx) => {
    if (image.bytes.byteLength > 20 * 1024 * 1024) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bytes"],
        message: "OCR image input must not exceed 20 MiB.",
      });
    }
  });

export type OcrImageInput = z.infer<typeof OcrImageInputSchema>;

export const OcrBoundingBoxSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .strict()
  .superRefine((box, ctx) => {
    if (box.x + box.width > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: "OCR bounding box must stay within normalized image width.",
      });
    }
    if (box.y + box.height > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height"],
        message: "OCR bounding box must stay within normalized image height.",
      });
    }
  });

export type OcrBoundingBox = z.infer<typeof OcrBoundingBoxSchema>;

export const OcrTextBlockSchema = z
  .object({
    text: z.string().trim().min(1).max(20_000),
    confidence: z.number().min(0).max(1).optional(),
    boundingBox: OcrBoundingBoxSchema.optional(),
  })
  .strict();

export type OcrTextBlock = z.infer<typeof OcrTextBlockSchema>;

export const OcrRecognitionRequestSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    image: OcrImageInputSchema,
    languages: z
      .array(z.enum(["zh", "en"]))
      .min(1)
      .max(8)
      .optional(),
  })
  .strict();

export type OcrRecognitionRequest = z.infer<typeof OcrRecognitionRequestSchema>;

export const OcrRecognitionResultSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    imageId: z.string().min(1).max(128).optional(),
    text: z.string().max(100_000),
    blocks: z.array(OcrTextBlockSchema).max(2000).default([]),
    recognizedAt: z.string().datetime(),
  })
  .strict();

export type OcrRecognitionResult = z.infer<typeof OcrRecognitionResultSchema>;

export const ScreenCaptureRegionSchema = z
  .object({
    x: z.number().int().nonnegative().max(100_000),
    y: z.number().int().nonnegative().max(100_000),
    width: z.number().int().positive().max(100_000),
    height: z.number().int().positive().max(100_000),
  })
  .strict();

export type ScreenCaptureRegion = z.infer<typeof ScreenCaptureRegionSchema>;

export const ScreenCaptureRequestSchema = z
  .object({
    captureId: z.string().min(1).max(128).optional(),
    displayId: z.string().min(1).max(128).optional(),
    region: ScreenCaptureRegionSchema.optional(),
  })
  .strict();

export type ScreenCaptureRequest = z.infer<typeof ScreenCaptureRequestSchema>;

export const ScreenCaptureResultSchema = z
  .object({
    captureId: z.string().min(1).max(128),
    image: OcrImageInputSchema,
    capturedAt: z.string().datetime(),
    source: z.enum(["fixture", "screen"]),
  })
  .strict();

export type ScreenCaptureResult = z.infer<typeof ScreenCaptureResultSchema>;

export const VisionAnalysisTaskSchema = z.enum([
  "describe",
  "classify",
  "detect_objects",
]);

export type VisionAnalysisTask = z.infer<typeof VisionAnalysisTaskSchema>;

export const VisionAnalysisRequestSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    image: OcrImageInputSchema,
    tasks: z.array(VisionAnalysisTaskSchema).min(1).max(3),
    prompt: z.string().trim().min(1).max(2_000).optional(),
  })
  .strict();

export type VisionAnalysisRequest = z.infer<typeof VisionAnalysisRequestSchema>;

export const VisionLabelSchema = z
  .object({
    label: z.string().trim().min(1).max(256),
    confidence: z.number().min(0).max(1).optional(),
    boundingBox: OcrBoundingBoxSchema.optional(),
  })
  .strict();

export type VisionLabel = z.infer<typeof VisionLabelSchema>;

export const VisionAnalysisResultSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    imageId: z.string().min(1).max(128).optional(),
    summary: z.string().max(20_000),
    labels: z.array(VisionLabelSchema).max(200).default([]),
    analyzedAt: z.string().datetime(),
  })
  .strict();

export type VisionAnalysisResult = z.infer<typeof VisionAnalysisResultSchema>;

export const IntentRoutingContextSchema = z
  .object({
    locale: z.enum(["zh", "en"]).optional(),
    activeConversationId: z.string().min(1).max(128).optional(),
    allowedIntents: z.array(z.string().min(1).max(128)).max(200).optional(),
  })
  .strict();

export type IntentRoutingContext = z.infer<typeof IntentRoutingContextSchema>;

export const IntentRoutingRequestSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    utterance: z.string().trim().min(1).max(20_000),
    context: IntentRoutingContextSchema.optional(),
  })
  .strict();

export type IntentRoutingRequest = z.infer<typeof IntentRoutingRequestSchema>;

export const IntentCandidateSchema = z
  .object({
    intent: z.string().min(1).max(128),
    confidence: z.number().min(0).max(1),
    slots: z.record(z.unknown()).default({}),
    reasons: z.array(z.string().min(1).max(500)).default([]),
  })
  .strict();

export type IntentCandidate = z.infer<typeof IntentCandidateSchema>;

export const IntentRoutingResultSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    utterance: z.string().trim().min(1).max(20_000),
    candidates: z.array(IntentCandidateSchema).max(20).default([]),
    routedAt: z.string().datetime(),
  })
  .strict();

export type IntentRoutingResult = z.infer<typeof IntentRoutingResultSchema>;

export const RerankDocumentSchema = z
  .object({
    id: z.string().min(1).max(128),
    text: z.string().trim().min(1).max(20_000),
    metadata: z.record(z.unknown()).default({}),
  })
  .strict();

export type RerankDocument = z.infer<typeof RerankDocumentSchema>;

export const RerankRequestSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    query: z.string().trim().min(1).max(20_000),
    documents: z.array(RerankDocumentSchema).min(1).max(200),
    topK: z.number().int().positive().max(200).optional(),
  })
  .strict();

export type RerankRequest = z.infer<typeof RerankRequestSchema>;

export const RerankResultItemSchema = z
  .object({
    documentId: z.string().min(1).max(128),
    score: z.number().finite(),
    rank: z.number().int().positive(),
  })
  .strict();

export type RerankResultItem = z.infer<typeof RerankResultItemSchema>;

export const RerankResultSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    query: z.string().trim().min(1).max(20_000),
    results: z.array(RerankResultItemSchema).max(200),
    rankedAt: z.string().datetime(),
  })
  .strict();

export type RerankResult = z.infer<typeof RerankResultSchema>;

export const ModelInstallabilityReportSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    allowed: z.boolean(),
    reasons: z.array(z.string().min(1).max(500)).default([]),
    runtimeMode: DeviceRuntimeModeSchema,
  })
  .strict();

export type ModelInstallabilityReport = z.infer<
  typeof ModelInstallabilityReportSchema
>;

export const ModelOperationPhaseSchema = z.enum([
  "queued",
  "prechecking",
  "blocked",
  "downloading",
  "verifying",
  "available",
  "loading",
  "loaded",
  "executing",
  "completed",
  "releasing",
  "removing",
  "cancelled",
  "failed",
]);

export type ModelOperationPhase = z.infer<typeof ModelOperationPhaseSchema>;

export const ModelOperationProgressSchema = z
  .object({
    downloadedBytes: z.number().int().nonnegative(),
    totalBytes: z.number().int().nonnegative().optional(),
  })
  .strict();

export type ModelOperationProgress = z.infer<
  typeof ModelOperationProgressSchema
>;

export const ModelOperationSnapshotSchema = z
  .object({
    operationId: z.string().min(1).max(128),
    modelId: z.string().min(1).max(300),
    capability: LocalModelCapabilitySchema,
    phase: ModelOperationPhaseSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    progress: ModelOperationProgressSchema.optional(),
    reasons: z.array(z.string().min(1).max(500)).default([]),
    error: StructuredErrorSchema.optional(),
  })
  .strict();

export type ModelOperationSnapshot = z.infer<
  typeof ModelOperationSnapshotSchema
>;

export const ResourceSchedulerDiagnosticsSchema = z
  .object({
    checkedAt: z.string().datetime(),
    totalMemoryBytes: z.number().int().nonnegative(),
    availableMemoryBytes: z.number().int().nonnegative(),
    leasedMemoryBytes: z.number().int().nonnegative(),
    totalVramBytes: z.number().int().nonnegative(),
    availableVramBytes: z.number().int().nonnegative(),
    leasedVramBytes: z.number().int().nonnegative(),
    activeLeaseCount: z.number().int().nonnegative(),
    exclusiveGpuLeaseActive: z.boolean(),
  })
  .strict();

export type ResourceSchedulerDiagnostics = z.infer<
  typeof ResourceSchedulerDiagnosticsSchema
>;

export const ProviderSelectionSchema = z
  .object({
    capability: LocalModelCapabilitySchema,
    provider: z.string().min(1).max(128),
    execution: z.enum(["local", "cloud", "system", "disabled"]),
    loadPolicy: z.enum(["resident", "on_demand", "remote", "disabled"]),
    reason: z.string().min(1).max(500),
  })
  .strict();

export type ProviderSelection = z.infer<typeof ProviderSelectionSchema>;

export const CapabilitySnapshotSchema = z
  .object({
    checkedAt: z.string().datetime(),
    device: DeviceCapabilitySchema,
    runtimeMode: DeviceRuntimeModeSchema,
    providerPlan: z.array(ProviderSelectionSchema),
    modelInventory: z.array(ModelInventoryItemSchema).default([]),
  })
  .strict();

export type CapabilitySnapshot = z.infer<typeof CapabilitySnapshotSchema>;

export const TaskStepSchema = z
  .object({
    id: z.string().min(1).max(128),
    taskId: z.string().min(1).max(128),
    title: z.string().min(1).max(300),
    state: TaskStepStateSchema,
    verificationStatus: TaskStepVerificationStatusSchema,
    toolId: z.string().min(1).max(128).optional(),
    toolInput: z.record(z.unknown()).optional(),
    startedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    resultSummary: z.string().min(1).max(500).optional(),
    failureReason: z.string().min(1).max(300).optional(),
  })
  .strict();

export type TaskStep = z.infer<typeof TaskStepSchema>;

export const TaskEventSchema = z
  .object({
    id: z.string().min(1).max(128),
    taskId: z.string().min(1).max(128),
    stepId: z.string().min(1).max(128).optional(),
    type: TaskEventTypeSchema,
    message: z.string().min(1).max(500),
    createdAt: z.string().datetime(),
  })
  .strict();

export type TaskEvent = z.infer<typeof TaskEventSchema>;

export const TaskSchema = z
  .object({
    id: z.string().min(1).max(128),
    title: z.string().min(1).max(300),
    state: TaskStateSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    startedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    source: BrainCommandSourceSchema.optional(),
    intent: BrainIntentSchema.optional(),
    routeSource: z
      .enum([
        "intent-router.deterministic.rules",
        "intent-router.deterministic.fixture",
        "intent-router.qwen3-0.6b",
        "unknown",
      ])
      .default("unknown"),
    verificationSummary: z.string().min(1).max(500).optional(),
    steps: z.array(TaskStepSchema).default([]),
    events: z.array(TaskEventSchema).default([]),
  })
  .strict();

export type Task = z.infer<typeof TaskSchema>;

export const VoiceTranscriptSchema = z
  .object({
    sessionId: z.string().min(1).max(128),
    text: z.string().max(20_000),
    isFinal: z.boolean(),
    segmentId: z.string().min(1).max(128).optional(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type VoiceTranscript = z.infer<typeof VoiceTranscriptSchema>;

export const VoiceSnapshotSchema = z
  .object({
    state: VoiceStateSchema,
    mode: VoiceModeSchema,
    permission: VoicePermissionStateSchema.optional(),
    sessionId: z.string().min(1).max(128).optional(),
    transcript: VoiceTranscriptSchema.optional(),
  })
  .strict();
export type VoiceSnapshot = z.infer<typeof VoiceSnapshotSchema>;

export const TextOnlyAcceptanceModeSchema = z
  .object({
    enabled: z.literal(true),
    voiceInputEnabled: z.literal(false),
    reasonCode: z.literal("CHAT_ANSWER_TEXT_ONLY_ACCEPTANCE"),
  })
  .strict();
export type TextOnlyAcceptanceMode = z.infer<
  typeof TextOnlyAcceptanceModeSchema
>;

export const CoreSnapshotSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    coreInstanceId: z.string().min(1),
    sequenceId: z.number().int().nonnegative(),
    health: z.enum(["starting", "ready", "degraded"]),
    startedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    voice: VoiceSnapshotSchema,
    textOnlyAcceptance: TextOnlyAcceptanceModeSchema.optional(),
    messages: z.array(MessageSchema),
    conversations: z.array(ConversationSchema).default([]),
    activeConversationId: z.string().min(1).max(128).optional(),
    memoryHealth: MemoryHealthSchema.optional(),
    memoryAlpha: MemoryAlphaStatusSchema.optional(),
    sessionHistory: z.array(SessionHistoryEntrySchema).max(12).default([]),
    capabilities: CapabilitySnapshotSchema.optional(),
    modelOperations: z.array(ModelOperationSnapshotSchema).default([]),
    resourceDiagnostics: ResourceSchedulerDiagnosticsSchema.optional(),
    tasks: z.array(TaskSchema),
  })
  .strict();

export type CoreSnapshot = z.infer<typeof CoreSnapshotSchema>;

export const AgentEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("system.core.ready"),
    payload: z
      .object({
        coreInstanceId: z.string().min(1),
        startedAt: z.string().datetime(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("system.health"),
    payload: z
      .object({
        status: z.enum(["ready", "degraded"]),
        uptimeMs: z.number().nonnegative(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("system.core.lifecycle"),
    payload: z
      .object({
        status: z.enum([
          "starting",
          "online",
          "restarting",
          "stopped",
          "failed",
        ]),
        attempt: z.number().int().nonnegative(),
        reason: z.string().optional(),
        processId: z.number().int().positive().optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("state.snapshot"),
    payload: CoreSnapshotSchema,
  }),
  z.object({
    type: z.literal("model.operation.updated"),
    payload: ModelOperationSnapshotSchema,
  }),
  z.object({
    type: z.literal("agent.message.accepted"),
    payload: MessageSchema,
  }),
]);

export type AgentEvent = z.infer<typeof AgentEventSchema>;

export const VoiceEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("voice.state.changed"),
    payload: z
      .object({
        state: VoiceStateSchema,
        mode: VoiceModeSchema,
        sessionId: z.string().min(1).max(128).optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("voice.transcript.updated"),
    payload: VoiceTranscriptSchema,
  }),
  z.object({
    type: z.literal("voice.permission.changed"),
    payload: z
      .object({
        permission: VoicePermissionStateSchema,
      })
      .strict(),
  }),
  z.object({
    type: z.literal("voice.playback.interrupted"),
    payload: z
      .object({
        playbackId: z.string().min(1).max(128),
        reason: z.literal("barge-in"),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("voice.diagnostic"),
    payload: z
      .object({
        level: z.enum(["info", "warning"]),
        code: z
          .string()
          .regex(/^[A-Z0-9_]+$/)
          .max(128),
        attempt: z.number().int().nonnegative().optional(),
        bufferedFrames: z.number().int().nonnegative().optional(),
        connectionCount: z.number().int().nonnegative().optional(),
      })
      .strict(),
  }),
  z.object({
    type: z.literal("voice.error"),
    payload: z
      .object({
        state: VoiceStateSchema,
        error: StructuredErrorSchema,
      })
      .strict(),
  }),
]);

export type VoiceEvent = z.infer<typeof VoiceEventSchema>;

export const AppEventSchema = z.union([AgentEventSchema, VoiceEventSchema]);

export type AppEvent = z.infer<typeof AppEventSchema>;

export const EventEnvelopeSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    eventId: z.string().min(1),
    sequenceId: z.number().int().nonnegative(),
    correlationId: z.string().min(1).optional(),
    createdAt: z.string().datetime(),
    source: z.enum(["core", "supervisor"]),
    event: AppEventSchema,
  })
  .strict();

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

export const CoreCommandMessageSchema = z
  .object({
    kind: z.literal("command"),
    envelope: CommandEnvelopeSchema,
  })
  .strict();

export const CoreInboundMessageSchema = z.union([
  CoreCommandMessageSchema,
  CoreVoiceAudioMessageSchema,
]);

export type CoreInboundMessage = z.infer<typeof CoreInboundMessageSchema>;

export const CoreOutboundMessageSchema = z.union([
  z
    .object({
      kind: z.literal("result"),
      envelope: CommandResultSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("event"),
      envelope: EventEnvelopeSchema,
    })
    .strict(),
]);

export type CoreOutboundMessage = z.infer<typeof CoreOutboundMessageSchema>;

function fallbackId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
}

export function createId(prefix: string): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  return randomUuid ? `${prefix}-${randomUuid}` : fallbackId(prefix);
}

export function createCommandEnvelope(command: AppCommand): CommandEnvelope {
  return CommandEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    commandId: createId("cmd"),
    correlationId: createId("corr"),
    createdAt: new Date().toISOString(),
    command,
  });
}

export interface JarvisBridge {
  sendCommand(command: AppCommand): Promise<CommandResult>;
  sendVoiceAudio(frame: VoiceAudioFrame): void;
  getSnapshot(): Promise<CommandResult>;
  getCommandRouterProductModeStatus(): Promise<CommandRouterProductModeStatus>;
  setCommandRouterProductModeEnabled(
    enabled: boolean,
  ): Promise<CommandRouterProductModeSetResult>;
  getQwenRuntimeControlStatus(): Promise<QwenRuntimeControlStatus>;
  setQwenRuntimeControlAction(
    action: QwenRuntimeControlAction,
  ): Promise<QwenRuntimeControlSetResult>;
  getChatAnswerProductModeStatus(): Promise<ChatAnswerProductModeStatus>;
  setChatAnswerProductModeEnabled(
    enabled: boolean,
  ): Promise<ChatAnswerProductModeSetResult>;
  getVoiceServiceStatus(): Promise<VoiceServiceStatus>;
  openVoiceSettings(): Promise<VoiceServiceStatus>;
  getTtsServiceStatus(): Promise<TtsServiceStatus>;
  openTtsSettings(): Promise<TtsServiceStatus>;
  synthesizeTts(text: string, voiceId?: string): Promise<TtsSynthesisResult>;
  onEvent(listener: (event: EventEnvelope) => void): () => void;
}
