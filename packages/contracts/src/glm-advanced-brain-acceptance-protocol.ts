import { z } from "zod";

export const IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_STATUS_CHANNEL =
  "jarvis-k:glm-advanced-brain-acceptance-status";
export const IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_MODEL_SET_CHANNEL =
  "jarvis-k:glm-advanced-brain-acceptance-model-set";
export const IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL =
  "jarvis-k:glm-advanced-brain-acceptance-credential-save";
export const IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL =
  "jarvis-k:glm-advanced-brain-acceptance-credential-delete";
export const IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_CHANNEL =
  "jarvis-k:glm-advanced-brain-acceptance-preflight";
export const IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_DIAGNOSTIC_CHANNEL =
  "jarvis-k:glm-advanced-brain-acceptance-diagnostic";

export const GLM_ADVANCED_BRAIN_ACCEPTANCE_PROVIDER_ID =
  "advanced-brain.glm" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_DEPLOYMENT_ID =
  "standard_paas_v4" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_ENDPOINT_PROFILE_ID =
  "standard_paas_v4" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN =
  "https://open.bigmodel.cn" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION =
  "chat.completions" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH =
  "/api/paas/v4/chat/completions" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT =
  `${GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN}${GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH}` as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID =
  "glm.advanced-brain.api-key" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_REDIRECT_POLICY = "none" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE =
  "platform_api_key" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_V1_ID =
  "glm-advanced-brain-acceptance-fixed-request" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID =
  "glm-advanced-brain-acceptance-fixed-request-v2" as const;
export const GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION = 2 as const;

export const GlmAdvancedBrainAcceptanceIdSchema = z.literal(
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
);
export type GlmAdvancedBrainAcceptanceId = z.infer<
  typeof GlmAdvancedBrainAcceptanceIdSchema
>;

export const GlmAdvancedBrainAcceptanceVersionSchema = z.literal(
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
);
export type GlmAdvancedBrainAcceptanceVersion = z.infer<
  typeof GlmAdvancedBrainAcceptanceVersionSchema
>;

export const GlmAdvancedBrainAcceptanceStateSchema = z.enum([
  "ready",
  "running",
  "consumed",
  "blocked",
]);
export type GlmAdvancedBrainAcceptanceState = z.infer<
  typeof GlmAdvancedBrainAcceptanceStateSchema
>;

export const GlmAdvancedBrainAcceptanceModelIdSchema = z.enum([
  "glm-5.2",
  "glm-5.3",
]);
export type GlmAdvancedBrainAcceptanceModelId = z.infer<
  typeof GlmAdvancedBrainAcceptanceModelIdSchema
>;

export const GlmAdvancedBrainAcceptanceEndpointProfileIdSchema =
  z.literal(GLM_ADVANCED_BRAIN_ACCEPTANCE_ENDPOINT_PROFILE_ID);
export type GlmAdvancedBrainAcceptanceEndpointProfileId = z.infer<
  typeof GlmAdvancedBrainAcceptanceEndpointProfileIdSchema
>;

export const GlmAdvancedBrainAcceptanceReasonCodeSchema = z.enum([
  "ready",
  "acceptance_flag_missing",
  "provider_disabled",
  "model_not_selected",
  "credential_missing",
  "credential_invalid",
  "credential_type_unconfirmed",
  "secure_store_unavailable",
  "endpoint_profile_mismatch",
  "cloud_egress_not_allowed",
  "consent_missing",
  "timeout_unbounded",
  "max_output_tokens_unbounded",
  "automatic_retry_enabled",
  "automatic_fallback_enabled",
  "tool_capability_present",
  "windows_executor_present",
  "plugin_runtime_present",
  "user_content_present",
  "acceptance_already_running",
  "acceptance_already_submitted",
  "acceptance_already_consumed",
  "invalid_structured_response",
  "transport_timeout",
  "transport_authentication_failed",
  "transport_permission_denied",
  "transport_rate_limited",
  "transport_server_error",
  "transport_network_failed",
  "transport_failed",
]);
export type GlmAdvancedBrainAcceptanceReasonCode = z.infer<
  typeof GlmAdvancedBrainAcceptanceReasonCodeSchema
>;

export const GlmAdvancedBrainAcceptanceProviderErrorCategorySchema = z.enum([
  "none",
  "credential_rejected",
  "credential_type_mismatch_possible",
  "permission_denied",
  "account_or_quota_restricted",
  "authentication_response_unrecognized",
  "provider_error_unrecognized",
]);
export type GlmAdvancedBrainAcceptanceProviderErrorCategory = z.infer<
  typeof GlmAdvancedBrainAcceptanceProviderErrorCategorySchema
>;

export const GlmAdvancedBrainAcceptanceSetModelRequestSchema = z
  .object({
    modelId: GlmAdvancedBrainAcceptanceModelIdSchema.nullable(),
  })
  .strict();
export type GlmAdvancedBrainAcceptanceSetModelRequest = z.infer<
  typeof GlmAdvancedBrainAcceptanceSetModelRequestSchema
>;

export const GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema = z
  .object({
    apiKey: z.string().trim().min(8).max(1024),
    credentialTypeConfirmation: z.literal(
      GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
    ),
  })
  .strict();
export type GlmAdvancedBrainAcceptanceSaveCredentialRequest = z.infer<
  typeof GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema
>;

export const GlmAdvancedBrainAcceptanceConsentRequestSchema = z
  .object({
    cloudEgressAllowed: z.boolean(),
    acceptanceConsent: z.boolean(),
  })
  .strict();
export type GlmAdvancedBrainAcceptanceConsentRequest = z.infer<
  typeof GlmAdvancedBrainAcceptanceConsentRequestSchema
>;

export const GlmAdvancedBrainAcceptanceStatusSchema = z
  .object({
    acceptanceId: GlmAdvancedBrainAcceptanceIdSchema,
    acceptanceVersion: GlmAdvancedBrainAcceptanceVersionSchema,
    acceptanceState: GlmAdvancedBrainAcceptanceStateSchema,
    providerId: z.literal("advanced-brain.glm"),
    providerEnabled: z.boolean(),
    acceptanceFlagEnabled: z.boolean(),
    selectedModelId: GlmAdvancedBrainAcceptanceModelIdSchema.optional(),
    modelExplicitlySelected: z.boolean(),
    credentialConfigured: z.boolean(),
    secureStorageAvailable: z.boolean(),
    credentialStorageEncrypted: z.boolean(),
    acceptanceConsumed: z.boolean(),
    credentialBindingId: z.literal(
      GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
    ),
    credentialTypeConfirmed: z
      .literal(GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE)
      .optional(),
    endpointProfileId: GlmAdvancedBrainAcceptanceEndpointProfileIdSchema,
    endpointOrigin: z.literal(GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN),
    operationPath: z.literal(GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH),
    fullEndpointMatch: z.boolean(),
    officialEndpointProfile: z.boolean(),
    credentialExposed: z.literal(false),
    promptExposed: z.literal(false),
    rawResponseExposed: z.literal(false),
    rendererWritableTrustedGates: z.literal(false),
    reasonCodes: z.array(GlmAdvancedBrainAcceptanceReasonCodeSchema).max(16),
  })
  .strict();
export type GlmAdvancedBrainAcceptanceStatus = z.infer<
  typeof GlmAdvancedBrainAcceptanceStatusSchema
>;

export const GlmAdvancedBrainAcceptanceCommandResultSchema = z
  .object({
    ok: z.boolean(),
    status: GlmAdvancedBrainAcceptanceStatusSchema,
    safeMessage: z.string().min(1).max(300).optional(),
  })
  .strict();
export type GlmAdvancedBrainAcceptanceCommandResult = z.infer<
  typeof GlmAdvancedBrainAcceptanceCommandResultSchema
>;

export const GlmAdvancedBrainAcceptancePreflightResultSchema = z
  .object({
    acceptanceId: GlmAdvancedBrainAcceptanceIdSchema,
    acceptanceVersion: GlmAdvancedBrainAcceptanceVersionSchema,
    acceptanceState: GlmAdvancedBrainAcceptanceStateSchema,
    allowRealAcceptance: z.boolean(),
    providerId: z.literal("advanced-brain.glm"),
    modelId: GlmAdvancedBrainAcceptanceModelIdSchema.optional(),
    endpointProfileId: GlmAdvancedBrainAcceptanceEndpointProfileIdSchema,
    endpointOrigin: z.literal(GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN),
    operationPath: z.literal(GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH),
    fullEndpointMatch: z.boolean(),
    credentialBindingId: z.literal(
      GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
    ),
    credentialConfigured: z.boolean(),
    credentialStorageEncrypted: z.boolean(),
    credentialTypeConfirmed: z
      .literal(GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE)
      .optional(),
    selectedModelExplicit: z.boolean(),
    checkedAt: z.string().datetime(),
    reasonCodes: z.array(GlmAdvancedBrainAcceptanceReasonCodeSchema).max(16),
    cloudRequestFixed: z.literal(true),
    requestBodyFixed: z.literal(true),
    userContentIncluded: z.literal(false),
    fileIncluded: z.literal(false),
    imageIncluded: z.literal(false),
    maximumOutputTokens: z.number().int().min(1).max(64),
    maxOutputTokens: z.literal(64),
    boundedTimeoutMs: z.number().int().min(100).max(10_000),
    streaming: z.literal(false),
    toolsEnabled: z.literal(false),
    retryEnabled: z.literal(false),
    fallbackEnabled: z.literal(false),
    executorReachable: z.literal(false),
    allowSingleRealAcceptance: z.boolean(),
    priorRealRequestCount: z.number().int().min(0).max(1),
    automaticRetry: z.literal(false),
    automaticFallback: z.literal(false),
    toolCapabilityCount: z.literal(0),
    windowsExecutorAllowed: z.literal(false),
    pluginRuntimeAllowed: z.literal(false),
    directActionAttempted: z.literal(false),
    realRequestAttempted: z.boolean(),
    realNetworkRequestSent: z.literal(false),
    credentialExposed: z.literal(false),
    promptExposed: z.literal(false),
    rawResponseExposed: z.literal(false),
  })
  .strict();
export type GlmAdvancedBrainAcceptancePreflightResult = z.infer<
  typeof GlmAdvancedBrainAcceptancePreflightResultSchema
>;

export const GlmAdvancedBrainAcceptanceDiagnosticReportSchema = z
  .object({
    acceptanceId: GlmAdvancedBrainAcceptanceIdSchema,
    acceptanceVersion: GlmAdvancedBrainAcceptanceVersionSchema,
    acceptanceState: z.literal("consumed"),
    providerId: z.literal("advanced-brain.glm"),
    modelId: GlmAdvancedBrainAcceptanceModelIdSchema,
    endpointProfileId: GlmAdvancedBrainAcceptanceEndpointProfileIdSchema,
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime(),
    latencyMs: z.number().int().nonnegative(),
    httpStatusClass: z.enum([
      "success",
      "blocked",
      "client_error",
      "auth_failure",
      "rate_limited",
      "server_error",
      "timeout",
      "cancelled",
      "network_error",
      "invalid_response",
      "failed",
    ]),
    structuredResultValidation: z.enum(["PASS", "FAIL"]),
    tokenUsage: z
      .object({
        promptTokens: z.number().int().nonnegative(),
        completionTokens: z.number().int().nonnegative(),
        totalTokens: z.number().int().nonnegative(),
      })
      .strict(),
    retryCount: z.literal(0),
    fallbackCount: z.literal(0),
    toolCallCount: z.literal(0),
    directActionAttempted: z.literal(false),
    reasonCode: GlmAdvancedBrainAcceptanceReasonCodeSchema,
    providerErrorCategory:
      GlmAdvancedBrainAcceptanceProviderErrorCategorySchema,
    requestSent: z.boolean(),
    responseStarted: z.boolean(),
    responseCompleted: z.boolean(),
    responseByteCount: z.number().int().nonnegative().max(4_000),
    timeout: z.boolean(),
    cancelled: z.boolean(),
    toolsObserved: z.literal(false),
    executorInvocationDelta: z.literal(0),
    sanitizedResponseCategory: z.enum([
      "fixed_diagnostic_ok",
      "invalid_structured_response",
      "transport_failure",
    ]),
    acceptanceConsumed: z.literal(true),
    realNetworkRequestSent: z.boolean(),
    credentialExposed: z.literal(false),
    promptExposed: z.literal(false),
    rawResponseExposed: z.literal(false),
  })
  .strict();
export type GlmAdvancedBrainAcceptanceDiagnosticReport = z.infer<
  typeof GlmAdvancedBrainAcceptanceDiagnosticReportSchema
>;
