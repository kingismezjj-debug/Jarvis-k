import { z } from "zod";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudReasoningTransportReasonCodeSchema,
  CloudReasoningTransportStatusClassSchema,
} from "./advanced-brain-protocol";

export const IPC_CLOUD_PROVIDER_ACCEPTANCE_STATUS_CHANNEL =
  "jarvis-k:cloud-provider-acceptance-status";
export const IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL =
  "jarvis-k:cloud-provider-acceptance-credential-save";
export const IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL =
  "jarvis-k:cloud-provider-acceptance-credential-delete";
export const IPC_CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_CHANNEL =
  "jarvis-k:cloud-provider-acceptance-preflight";
export const IPC_CLOUD_PROVIDER_ACCEPTANCE_FAKE_RUN_CHANNEL =
  "jarvis-k:cloud-provider-acceptance-fake-run";

export const CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID =
  "deepseek-v4-flash-advanced-brain-acceptance-v1" as const;
export const CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION = 1 as const;
export const CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID =
  "deepseek-v4-flash-no-thinking-stream-v1" as const;
export const CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID =
  "deepseek-standard-chat-completions" as const;
export const CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN =
  "https://api.deepseek.com" as const;
export const CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH =
  "/chat/completions" as const;
export const CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID =
  "advanced-brain.deepseek" as const;
export const CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID =
  "deepseek-v4-flash" as const;
export const CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID =
  "deepseek.advanced-brain.api-key" as const;
export const CLOUD_PROVIDER_ACCEPTANCE_GLM_BINDING_ID =
  "glm.advanced-brain.api-key" as const;
export const CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE =
  "platform_api_key" as const;

export const CloudProviderCredentialBindingIdSchema = z.enum([
  CLOUD_PROVIDER_ACCEPTANCE_GLM_BINDING_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  "qwen.advanced-brain.api-key",
  "openai.advanced-brain.api-key",
]);
export type CloudProviderCredentialBindingId = z.infer<
  typeof CloudProviderCredentialBindingIdSchema
>;

export const CloudProviderAcceptanceIdSchema = z.literal(
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
);
export type CloudProviderAcceptanceId = z.infer<
  typeof CloudProviderAcceptanceIdSchema
>;

export const CloudProviderAcceptanceCredentialTypeSchema = z.literal(
  CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
);
export type CloudProviderAcceptanceCredentialType = z.infer<
  typeof CloudProviderAcceptanceCredentialTypeSchema
>;

export const CloudProviderAcceptanceStateSchema = z.enum([
  "ready",
  "running",
  "consumed",
  "blocked",
]);
export type CloudProviderAcceptanceState = z.infer<
  typeof CloudProviderAcceptanceStateSchema
>;

export const CloudProviderAcceptanceReasonCodeSchema = z.enum([
  "ready",
  "capability_flag_missing",
  "provider_disabled",
  "credential_missing",
  "credential_invalid",
  "credential_type_unconfirmed",
  "secure_store_unavailable",
  "endpoint_profile_mismatch",
  "cloud_egress_not_allowed",
  "consent_missing",
  "request_contract_invalid",
  "ledger_unavailable",
  "acceptance_already_running",
  "acceptance_already_consumed",
  "real_run_disabled",
  "transport_timeout",
  "transport_cancelled",
  "transport_authentication_failed",
  "transport_permission_denied",
  "transport_rate_limited",
  "transport_server_error",
  "transport_network_failed",
  "invalid_provider_output",
  "output_budget_exhausted_before_final",
  "no_final_answer",
  "untrusted_tool_proposal_blocked",
  "provider_content_filtered",
  "provider_capacity_unavailable",
  "provider_contract_deviation",
  "transport_failed",
]);
export type CloudProviderAcceptanceReasonCode = z.infer<
  typeof CloudProviderAcceptanceReasonCodeSchema
>;

export const CloudProviderCredentialBindingProfileSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    credentialBindingId: CloudProviderCredentialBindingIdSchema,
    providerId: z.string().min(1).max(128),
    credentialType: CloudProviderAcceptanceCredentialTypeSchema,
    displayName: z.string().min(1).max(80),
    storageScope: z.literal("desktop_main_user_data"),
    releaseChannelScope: z.enum(["development", "alpha", "stable", "test"]),
    allowedProtocolFamilies: z
      .array(z.literal("openai_chat_completions"))
      .min(1)
      .max(1),
    cloudProvider: z.literal(true),
    userConfirmationRequired: z.literal(true),
    enabledForProduct: z.literal(false),
  })
  .strict();
export type CloudProviderCredentialBindingProfile = z.infer<
  typeof CloudProviderCredentialBindingProfileSchema
>;

export const CloudProviderCredentialStatusSchema = z
  .object({
    bindingId: CloudProviderCredentialBindingIdSchema,
    providerId: z.string().min(1).max(128),
    credentialType: CloudProviderAcceptanceCredentialTypeSchema,
    configured: z.boolean(),
    encrypted: z.boolean(),
    secureStorageAvailable: z.boolean(),
    status: z.enum(["configured", "unconfigured", "unavailable", "invalid"]),
    credentialExposed: z.literal(false),
  })
  .strict();
export type CloudProviderCredentialStatus = z.infer<
  typeof CloudProviderCredentialStatusSchema
>;

export const CloudProviderAcceptanceProfileSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    acceptanceId: CloudProviderAcceptanceIdSchema,
    acceptanceVersion: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
    ),
    providerId: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID),
    modelId: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID),
    endpointProfileId: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
    ),
    endpointOrigin: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN),
    operationPath: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
    ),
    credentialBindingId: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
    ),
    protocolFamily: z.literal("openai_chat_completions"),
    requestContractId: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
    ),
    fixedPromptId: z.literal("cloud-provider-acceptance-fixed-diagnostic-v1"),
    stream: z.literal(true),
    streamUsageIncluded: z.literal(true),
    thinkingType: z.literal("disabled"),
    reasoningEffortPresent: z.literal(false),
    maxTokens: z.literal(512),
    responseFormatPresent: z.literal(false),
    toolsEnabled: z.literal(false),
    retryEnabled: z.literal(false),
    fallbackEnabled: z.literal(false),
    timeoutPolicy: z
      .object({
        policyId: z.literal("deepseek-acceptance-stream-v1"),
        headersMs: z.literal(15_000),
        firstEventMs: z.literal(60_000),
        idleMs: z.literal(30_000),
        overallMs: z.literal(180_000),
      })
      .strict(),
    expectedOutputSchemaId: z.literal("fixed-cloud-diagnostic-v1"),
    enabledByReleaseGate: z.boolean(),
    pricingTier: z.literal("low"),
  })
  .strict();
export type CloudProviderAcceptanceProfile = z.infer<
  typeof CloudProviderAcceptanceProfileSchema
>;

export const CloudProviderAcceptanceConsentRequestSchema = z
  .object({
    acceptanceId: CloudProviderAcceptanceIdSchema,
    cloudEgressAllowed: z.boolean(),
    acceptanceConsent: z.boolean(),
  })
  .strict();
export type CloudProviderAcceptanceConsentRequest = z.infer<
  typeof CloudProviderAcceptanceConsentRequestSchema
>;

export const CloudProviderAcceptanceSaveCredentialRequestSchema = z
  .object({
    bindingId: CloudProviderCredentialBindingIdSchema,
    credentialTypeConfirmation: CloudProviderAcceptanceCredentialTypeSchema,
    credential: z.string().trim().min(8).max(1024),
  })
  .strict();
export type CloudProviderAcceptanceSaveCredentialRequest = z.infer<
  typeof CloudProviderAcceptanceSaveCredentialRequestSchema
>;

export const CloudProviderAcceptanceDeleteCredentialRequestSchema = z
  .object({
    bindingId: CloudProviderCredentialBindingIdSchema,
  })
  .strict();
export type CloudProviderAcceptanceDeleteCredentialRequest = z.infer<
  typeof CloudProviderAcceptanceDeleteCredentialRequestSchema
>;

export const CloudProviderAcceptanceLedgerProjectionSchema = z
  .object({
    acceptanceId: CloudProviderAcceptanceIdSchema,
    acceptanceVersion: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
    ),
    providerId: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID),
    modelId: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID),
    state: CloudProviderAcceptanceStateSchema,
    consumed: z.boolean(),
    requestCount: z.number().int().min(0).max(1),
    attemptedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    sanitizedResultCategory: z
      .union([
        z.literal("not_run"),
        CloudReasoningTransportReasonCodeSchema,
        z.literal("fixed_diagnostic_ok"),
      ])
      .optional(),
  })
  .strict();
export type CloudProviderAcceptanceLedgerProjection = z.infer<
  typeof CloudProviderAcceptanceLedgerProjectionSchema
>;

export const CloudProviderAcceptanceStatusSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    capabilityFlagEnabled: z.boolean(),
    source: z.literal("desktop-main"),
    productRoutingEnabled: z.literal(false),
    realRunCapabilityEnabled: z.literal(false),
    profiles: z.array(CloudProviderAcceptanceProfileSchema).min(1).max(8),
    credentialBindings: z
      .array(CloudProviderCredentialBindingProfileSchema)
      .min(1)
      .max(8),
    credentialStatuses: z
      .array(CloudProviderCredentialStatusSchema)
      .min(1)
      .max(8),
    ledger: CloudProviderAcceptanceLedgerProjectionSchema,
    credentialExposed: z.literal(false),
    promptExposed: z.literal(false),
    rawResponseExposed: z.literal(false),
    rendererWritableTrustedGates: z.literal(false),
  })
  .strict();
export type CloudProviderAcceptanceStatus = z.infer<
  typeof CloudProviderAcceptanceStatusSchema
>;

export const CloudProviderAcceptanceCommandResultSchema = z
  .object({
    ok: z.boolean(),
    status: CloudProviderAcceptanceStatusSchema,
    safeMessage: z.string().min(1).max(300).optional(),
  })
  .strict();
export type CloudProviderAcceptanceCommandResult = z.infer<
  typeof CloudProviderAcceptanceCommandResultSchema
>;

export const CloudProviderAcceptancePreflightResultSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    acceptanceId: CloudProviderAcceptanceIdSchema,
    acceptanceVersion: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
    ),
    acceptanceState: CloudProviderAcceptanceStateSchema,
    providerId: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID),
    modelId: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID),
    endpointProfileId: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
    ),
    endpointOrigin: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN),
    operationPath: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
    ),
    fullEndpointMatch: z.boolean(),
    credentialBindingId: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
    ),
    credentialConfigured: z.boolean(),
    credentialStorageEncrypted: z.boolean(),
    credentialTypeConfirmed: CloudProviderAcceptanceCredentialTypeSchema.optional(),
    protocolFamily: z.literal("openai_chat_completions"),
    requestContractId: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
    ),
    fixedInput: z.literal(true),
    userContentIncluded: z.literal(false),
    stream: z.literal(true),
    streamUsageIncluded: z.literal(true),
    thinkingType: z.literal("disabled"),
    reasoningEffortPresent: z.literal(false),
    maxTokens: z.literal(512),
    timeoutHeadersMs: z.literal(15_000),
    timeoutFirstEventMs: z.literal(60_000),
    timeoutIdleMs: z.literal(30_000),
    timeoutOverallMs: z.literal(180_000),
    timeoutBounded: z.literal(true),
    toolsEnabled: z.literal(false),
    retryEnabled: z.literal(false),
    fallbackEnabled: z.literal(false),
    executorReachable: z.literal(false),
    productRoutingEnabled: z.literal(false),
    cloudEgressConfirmed: z.boolean(),
    pricingTier: z.literal("low"),
    priorRequestCount: z.number().int().min(0).max(1),
    consumed: z.boolean(),
    allowSingleRealAcceptance: z.literal(false),
    allowFakeAcceptance: z.boolean(),
    realNetworkRequestSent: z.literal(false),
    reasonCodes: z.array(CloudProviderAcceptanceReasonCodeSchema).max(20),
    credentialExposed: z.literal(false),
    promptExposed: z.literal(false),
    rawResponseExposed: z.literal(false),
  })
  .strict();
export type CloudProviderAcceptancePreflightResult = z.infer<
  typeof CloudProviderAcceptancePreflightResultSchema
>;

export const CloudProviderAcceptanceDiagnosticReportSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    acceptanceId: CloudProviderAcceptanceIdSchema,
    acceptanceVersion: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
    ),
    acceptanceState: z.literal("consumed"),
    providerId: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID),
    modelId: z.literal(CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID),
    endpointProfileId: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
    ),
    requestContractId: z.literal(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
    ),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime(),
    latencyMs: z.number().int().nonnegative(),
    httpStatus: z.number().int().min(100).max(599).optional(),
    httpStatusClass: CloudReasoningTransportStatusClassSchema,
    sanitizedResultCategory: z.union([
      z.literal("fixed_diagnostic_ok"),
      CloudReasoningTransportReasonCodeSchema,
    ]),
    structuredResultValidation: z.enum(["PASS", "FAIL"]),
    tokenUsage: z
      .object({
        promptTokens: z.number().int().nonnegative(),
        completionTokens: z.number().int().nonnegative(),
        totalTokens: z.number().int().nonnegative(),
      })
      .strict(),
    requestSent: z.boolean(),
    responseStarted: z.boolean(),
    responseCompleted: z.boolean(),
    responseByteCount: z.number().int().nonnegative().max(128_000),
    reasoningObserved: z.boolean(),
    finalContentPresent: z.boolean(),
    finalContentBytes: z.number().int().nonnegative().max(128_000),
    toolProposalObserved: z.boolean(),
    retryCount: z.literal(0),
    fallbackCount: z.literal(0),
    toolCallCount: z.literal(0),
    directActionAttempted: z.literal(false),
    executorInvocationDelta: z.literal(0),
    acceptanceConsumed: z.literal(true),
    realNetworkRequestSent: z.literal(false),
    credentialExposed: z.literal(false),
    promptExposed: z.literal(false),
    rawResponseExposed: z.literal(false),
    rawSsePersisted: z.literal(false),
  })
  .strict();
export type CloudProviderAcceptanceDiagnosticReport = z.infer<
  typeof CloudProviderAcceptanceDiagnosticReportSchema
>;
