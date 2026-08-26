import { z } from "zod";
import { BrainPlanSchema } from "./protocol";

export const ADVANCED_BRAIN_SCHEMA_VERSION = 1 as const;

const ProviderIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u);

const ModelIdSchema = z.string().trim().min(1).max(160);
const RequestIdSchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/u);
const DeploymentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u);
const CredentialBindingIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u);
const CloudOperationSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-z][a-z0-9._:-]*$/u);
const OperationPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(256)
  .regex(/^\/[A-Za-z0-9/_:.-]*$/u)
  .refine((value) => !value.includes(".."), "Path traversal is not allowed.")
  .refine((value) => !value.includes("\\"), "Backslashes are not allowed.")
  .refine((value) => !value.includes("//"), "Duplicate separators are not allowed.")
  .refine((value) => !value.includes("?"), "Query strings are not allowed.")
  .refine((value) => !value.includes("#"), "Fragments are not allowed.");

export const CloudReasoningTrustClassSchema = z.enum([
  "provider_managed",
  "jarvis_test",
  "custom_unapproved",
]);
export type CloudReasoningTrustClass = z.infer<
  typeof CloudReasoningTrustClassSchema
>;

export const CloudReasoningRedirectPolicySchema = z.enum(["none"]);
export type CloudReasoningRedirectPolicy = z.infer<
  typeof CloudReasoningRedirectPolicySchema
>;

export const CloudReasoningProtocolFamilySchema = z.enum([
  "openai_chat_completions",
  "openai_responses",
  "anthropic_messages",
  "dashscope_native",
  "local_openai_compatible",
  "custom_adapter",
]);
export type CloudReasoningProtocolFamily = z.infer<
  typeof CloudReasoningProtocolFamilySchema
>;

export const CloudReasoningThinkingPolicySchema = z.enum([
  "unsupported",
  "optional",
  "mandatory",
]);
export type CloudReasoningThinkingPolicy = z.infer<
  typeof CloudReasoningThinkingPolicySchema
>;

export const CloudReasoningTimeoutPolicyIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u);
export type CloudReasoningTimeoutPolicyId = z.infer<
  typeof CloudReasoningTimeoutPolicyIdSchema
>;

export const CloudReasoningDataEgressClassSchema = z.enum([
  "none",
  "cloud_fixed_diagnostic",
  "cloud_user_content",
]);
export type CloudReasoningDataEgressClass = z.infer<
  typeof CloudReasoningDataEgressClassSchema
>;

export const CloudReasoningPricingTierSchema = z.enum([
  "free",
  "low",
  "medium",
  "high",
  "unknown",
]);
export type CloudReasoningPricingTier = z.infer<
  typeof CloudReasoningPricingTierSchema
>;

export const CloudReasoningTransportReasonCodeSchema = z.enum([
  "completed",
  "invalid_endpoint_profile",
  "endpoint_not_allowed",
  "insecure_transport",
  "request_too_large",
  "response_too_large",
  "unsupported_content_type",
  "authentication_transport_failure",
  "credential_rejected",
  "permission_denied",
  "dns_resolution_failed",
  "tls_handshake_failed",
  "connection_refused",
  "connection_reset",
  "proxy_failed",
  "headers_timeout",
  "first_event_timeout",
  "stream_idle_timeout",
  "overall_timeout",
  "rate_limited",
  "quota_restricted",
  "model_not_available",
  "invalid_request",
  "provider_client_error",
  "provider_server_error",
  "provider_error_unrecognized",
  "timeout",
  "cancelled",
  "network_unavailable",
  "network_failure_unclassified",
  "redirect_blocked",
  "invalid_response",
  "malformed_stream",
  "incomplete_stream",
  "invalid_provider_output",
  "output_budget_exhausted_before_final",
  "structured_output_invalid",
  "no_final_answer",
  "untrusted_tool_proposal_blocked",
  "provider_content_filtered",
  "provider_capacity_unavailable",
  "provider_contract_deviation",
  "transport_failed",
]);
export type CloudReasoningTransportReasonCode = z.infer<
  typeof CloudReasoningTransportReasonCodeSchema
>;

export const CloudReasoningTransportStatusClassSchema = z.enum([
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
]);
export type CloudReasoningTransportStatusClass = z.infer<
  typeof CloudReasoningTransportStatusClassSchema
>;

const CloudJsonObjectKeySchema = z.string().min(1).max(128);

const CloudJsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string().max(50_000),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(CloudJsonValueSchema).max(512),
    CloudJsonObjectSchema,
  ]),
);
const CloudJsonObjectSchema = z
  .record(CloudJsonValueSchema)
  .superRefine((value, context) => {
    const keys = Object.keys(value);
    if (keys.length > 512) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "JSON object has too many keys.",
      });
    }
    for (const key of keys) {
      const result = CloudJsonObjectKeySchema.safeParse(key);
      if (!result.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "JSON object key is invalid.",
        });
      }
    }
  });

export const CloudReasoningTimeoutBoundsSchema = z
  .object({
    minTimeoutMs: z.number().int().min(100).max(300_000),
    defaultTimeoutMs: z.number().int().min(100).max(300_000),
    maxTimeoutMs: z.number().int().min(100).max(300_000),
  })
  .strict()
  .superRefine((bounds, context) => {
    if (bounds.minTimeoutMs > bounds.defaultTimeoutMs) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultTimeoutMs"],
        message: "Default timeout must be at least the minimum timeout.",
      });
    }
    if (bounds.defaultTimeoutMs > bounds.maxTimeoutMs) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxTimeoutMs"],
        message: "Maximum timeout must be at least the default timeout.",
      });
    }
  });
export type CloudReasoningTimeoutBounds = z.infer<
  typeof CloudReasoningTimeoutBoundsSchema
>;

export const CloudReasoningTimeoutPolicySchema = z
  .object({
    policyId: CloudReasoningTimeoutPolicyIdSchema,
    connectOrHeadersTimeoutMs: z.number().int().min(100).max(120_000),
    firstEventTimeoutMs: z.number().int().min(100).max(180_000),
    streamIdleTimeoutMs: z.number().int().min(100).max(180_000),
    overallTimeoutMs: z.number().int().min(100).max(300_000),
  })
  .strict()
  .superRefine((policy, context) => {
    if (policy.connectOrHeadersTimeoutMs > policy.overallTimeoutMs) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["connectOrHeadersTimeoutMs"],
        message: "Header timeout must not exceed overall timeout.",
      });
    }
    if (policy.firstEventTimeoutMs > policy.overallTimeoutMs) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstEventTimeoutMs"],
        message: "First event timeout must not exceed overall timeout.",
      });
    }
    if (policy.streamIdleTimeoutMs > policy.overallTimeoutMs) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["streamIdleTimeoutMs"],
        message: "Idle timeout must not exceed overall timeout.",
      });
    }
  });
export type CloudReasoningTimeoutPolicy = z.infer<
  typeof CloudReasoningTimeoutPolicySchema
>;

export const CloudReasoningOperationPathSchema = z
  .object({
    operation: CloudOperationSchema,
    path: OperationPathSchema,
  })
  .strict();
export type CloudReasoningOperationPath = z.infer<
  typeof CloudReasoningOperationPathSchema
>;

export const CloudProviderEndpointProfileSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    providerId: ProviderIdSchema,
    deploymentId: DeploymentIdSchema,
    trustClass: CloudReasoningTrustClassSchema,
    allowedOrigins: z.array(z.string().trim().min(1).max(256)).min(1).max(8),
    allowedOperationPaths: z
      .array(CloudReasoningOperationPathSchema)
      .min(1)
      .max(32),
    region: z.enum(["mainland_china", "global", "local", "unknown"]),
    requiresHttps: z.literal(true),
    redirectPolicy: CloudReasoningRedirectPolicySchema,
    maxRequestBytes: z.number().int().min(2).max(2_000_000),
    maxResponseBytes: z.number().int().min(2).max(2_000_000),
    timeoutBounds: CloudReasoningTimeoutBoundsSchema,
    credentialBindingId: CredentialBindingIdSchema,
  })
  .strict()
  .superRefine((profile, context) => {
    const seenOrigins = new Set<string>();
    for (const [index, origin] of profile.allowedOrigins.entries()) {
      const validation = validateCloudReasoningOrigin(origin);
      if (!validation.valid) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["allowedOrigins", index],
          message: validation.reason,
        });
        continue;
      }
      const normalized = normalizeCloudReasoningOrigin(origin);
      if (seenOrigins.has(normalized)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["allowedOrigins", index],
          message: "Duplicate allowed origin.",
        });
      }
      seenOrigins.add(normalized);
    }

    const seenOperations = new Set<string>();
    for (const [index, item] of profile.allowedOperationPaths.entries()) {
      if (seenOperations.has(item.operation)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["allowedOperationPaths", index, "operation"],
          message: "Duplicate operation path.",
        });
      }
      seenOperations.add(item.operation);
    }
  });
export type CloudProviderEndpointProfile = z.infer<
  typeof CloudProviderEndpointProfileSchema
>;

export const CloudReasoningModelCapabilityProfileSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    providerId: ProviderIdSchema,
    modelId: ModelIdSchema,
    protocolFamily: CloudReasoningProtocolFamilySchema,
    deploymentId: DeploymentIdSchema,
    trustClass: CloudReasoningTrustClassSchema,
    region: z.enum(["mainland_china", "global", "local", "unknown"]),
    supportsStreaming: z.boolean(),
    supportsNonStreaming: z.boolean(),
    supportsThinking: z.boolean(),
    thinkingPolicy: CloudReasoningThinkingPolicySchema,
    supportsReasoningEffort: z.boolean(),
    allowedReasoningEffort: z
      .array(z.enum(["low", "high", "max"]))
      .max(3)
      .optional(),
    supportsTools: z.boolean(),
    supportsStructuredOutput: z.boolean(),
    supportsVision: z.boolean(),
    supportsImages: z.boolean(),
    contextWindow: z.number().int().positive().max(10_000_000),
    maxOutputTokens: z.number().int().positive().max(1_000_000),
    recommendedOutputTokens: z.number().int().positive().max(1_000_000),
    requestTimeoutPolicyId: CloudReasoningTimeoutPolicyIdSchema,
    credentialBindingId: CredentialBindingIdSchema,
    endpointProfileId: z.string().trim().min(1).max(128),
    executionSemantics: z.enum([
      "not_executed",
      "fixture",
      "simulated",
      "real_provider",
    ]),
    dataEgressClass: CloudReasoningDataEgressClassSchema,
    pricingTier: CloudReasoningPricingTierSchema,
    enabled: z.boolean(),
  })
  .strict()
  .superRefine((profile, context) => {
    if (!profile.supportsStreaming && !profile.supportsNonStreaming) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supportsStreaming"],
        message: "At least one response mode must be supported.",
      });
    }
    if (profile.recommendedOutputTokens > profile.maxOutputTokens) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recommendedOutputTokens"],
        message: "Recommended output tokens must not exceed the maximum.",
      });
    }
    if (profile.thinkingPolicy === "unsupported" && profile.supportsThinking) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supportsThinking"],
        message: "Unsupported thinking policy cannot advertise thinking.",
      });
    }
    if (profile.thinkingPolicy !== "unsupported" && !profile.supportsThinking) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["thinkingPolicy"],
        message: "Thinking policy requires thinking support.",
      });
    }
    if (
      profile.protocolFamily !== "openai_chat_completions" &&
      profile.enabled
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["enabled"],
        message: "Only openai_chat_completions is implemented in this phase.",
      });
    }
  });
export type CloudReasoningModelCapabilityProfile = z.infer<
  typeof CloudReasoningModelCapabilityProfileSchema
>;

export const CloudReasoningProviderHealthStateSchema = z.enum([
  "unknown",
  "ready",
  "degraded",
  "unavailable",
  "rate_limited",
  "credential_missing",
  "disabled",
]);
export type CloudReasoningProviderHealthState = z.infer<
  typeof CloudReasoningProviderHealthStateSchema
>;

export const CloudReasoningProviderHealthProjectionSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    providerId: ProviderIdSchema,
    deploymentId: DeploymentIdSchema,
    modelId: ModelIdSchema,
    state: CloudReasoningProviderHealthStateSchema,
    lastAttemptAt: z.string().datetime().optional(),
    lastSuccessAt: z.string().datetime().optional(),
    sanitizedFailureCategory: CloudReasoningTransportReasonCodeSchema.optional(),
    consecutiveFailureCount: z.number().int().nonnegative().max(10_000),
    cooldownUntil: z.string().datetime().optional(),
    source: z.literal("runtime_observation"),
  })
  .strict();
export type CloudReasoningProviderHealthProjection = z.infer<
  typeof CloudReasoningProviderHealthProjectionSchema
>;

export const CloudReasoningTransportRequestSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    requestId: RequestIdSchema,
    providerId: ProviderIdSchema,
    deploymentId: DeploymentIdSchema,
    operation: CloudOperationSchema,
    method: z.literal("POST"),
    contentType: z.literal("application/json"),
    bodyJson: CloudJsonObjectSchema,
    credentialBindingId: CredentialBindingIdSchema,
    timeoutMs: z.number().int().min(100).max(300_000),
    maxResponseBytes: z.number().int().min(2).max(2_000_000),
  })
  .strict();
export type CloudReasoningTransportRequest = z.infer<
  typeof CloudReasoningTransportRequestSchema
>;

export const CloudReasoningSafeResponseHeadersSchema = z
  .object({
    contentType: z.string().trim().min(1).max(128).optional(),
    providerRequestId: z.string().trim().min(1).max(128).optional(),
    rateLimitRemaining: z.string().trim().min(1).max(32).optional(),
  })
  .strict();
export type CloudReasoningSafeResponseHeaders = z.infer<
  typeof CloudReasoningSafeResponseHeadersSchema
>;

export const CloudReasoningTransportResultSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    requestId: RequestIdSchema,
    providerId: ProviderIdSchema,
    deploymentId: DeploymentIdSchema,
    operation: CloudOperationSchema,
    statusClass: CloudReasoningTransportStatusClassSchema,
    reasonCode: CloudReasoningTransportReasonCodeSchema,
    httpStatus: z.number().int().min(100).max(599).optional(),
    responseJson: CloudJsonValueSchema.optional(),
    safeHeaders: CloudReasoningSafeResponseHeadersSchema,
    latencyMs: z.number().int().nonnegative(),
    responseByteCount: z.number().int().nonnegative().max(2_000_000).optional(),
    requestSent: z.boolean(),
    responseStarted: z.boolean(),
    responseCompleted: z.boolean(),
    cancelled: z.boolean(),
    timeout: z.boolean(),
    automaticRetry: z.literal(false),
    automaticFallback: z.literal(false),
    credentialExposed: z.literal(false),
    requestBodyExposed: z.literal(false),
    responseBodyLogged: z.literal(false),
  })
  .strict();
export type CloudReasoningTransportResult = z.infer<
  typeof CloudReasoningTransportResultSchema
>;

export const AdvancedBrainTaskCategorySchema = z.enum([
  "advanced_chat",
  "coding",
  "research",
  "long_document",
  "multi_step_plan",
  "plugin_orchestration",
  "creative_generation",
  "visual_understanding",
]);
export type AdvancedBrainTaskCategory = z.infer<
  typeof AdvancedBrainTaskCategorySchema
>;

export const AdvancedBrainModalitySchema = z.enum([
  "text",
  "image",
  "file_reference",
  "structured_context",
]);
export type AdvancedBrainModality = z.infer<typeof AdvancedBrainModalitySchema>;

export const AdvancedBrainRequestedOutputSchema = z.enum([
  "answer",
  "structured_plan",
  "clarification",
  "refusal",
]);
export type AdvancedBrainRequestedOutput = z.infer<
  typeof AdvancedBrainRequestedOutputSchema
>;

export const AdvancedBrainCapabilityRequirementSchema = z.enum([
  "text_reasoning",
  "structured_output",
  "function_calling",
  "reasoning",
  "streaming",
  "cancellation",
  "vision_understanding",
  "file_reference_only",
]);
export type AdvancedBrainCapabilityRequirement = z.infer<
  typeof AdvancedBrainCapabilityRequirementSchema
>;

export const PrivacyRequirementSchema = z.enum([
  "local_only",
  "cloud_allowed",
  "cloud_requires_confirmation",
  "cloud_prohibited",
]);
export type PrivacyRequirement = z.infer<typeof PrivacyRequirementSchema>;

export const AdvancedBrainCloudEgressPolicySchema = z.enum([
  "local_only",
  "allow_cloud",
  "require_confirmation",
  "prohibit_cloud",
]);
export type AdvancedBrainCloudEgressPolicy = z.infer<
  typeof AdvancedBrainCloudEgressPolicySchema
>;

export const CloudEgressDecisionSchema = z.enum([
  "allowed",
  "confirmation_required",
  "blocked",
  "not_applicable",
]);
export type CloudEgressDecision = z.infer<typeof CloudEgressDecisionSchema>;

export const AdvancedBrainBudgetClassSchema = z.enum([
  "tiny",
  "small",
  "medium",
  "large",
]);
export type AdvancedBrainBudgetClass = z.infer<
  typeof AdvancedBrainBudgetClassSchema
>;

export const AdvancedBrainCostClassSchema = z.enum([
  "free",
  "low",
  "medium",
  "high",
]);
export type AdvancedBrainCostClass = z.infer<
  typeof AdvancedBrainCostClassSchema
>;

export const AdvancedBrainLatencyClassSchema = z.enum([
  "interactive",
  "standard",
  "batch",
]);
export type AdvancedBrainLatencyClass = z.infer<
  typeof AdvancedBrainLatencyClassSchema
>;

export const AdvancedBrainContextClassSchema = z.enum([
  "short",
  "medium",
  "long",
  "very_long",
]);
export type AdvancedBrainContextClass = z.infer<
  typeof AdvancedBrainContextClassSchema
>;

export const AdvancedBrainRegionAvailabilitySchema = z.enum([
  "local",
  "mainland_china",
  "global",
  "unknown",
]);
export type AdvancedBrainRegionAvailability = z.infer<
  typeof AdvancedBrainRegionAvailabilitySchema
>;

export const AdvancedBrainPrivacyClassSchema = z.enum([
  "local",
  "cloud",
  "fixture",
  "unavailable",
]);
export type AdvancedBrainPrivacyClass = z.infer<
  typeof AdvancedBrainPrivacyClassSchema
>;

export const AdvancedBrainProviderHealthSchema = z.enum([
  "healthy",
  "degraded",
  "unhealthy",
  "unavailable",
  "unknown",
]);
export type AdvancedBrainProviderHealth = z.infer<
  typeof AdvancedBrainProviderHealthSchema
>;

export const AdvancedBrainSelectionStrategySchema = z.enum([
  "local_first",
  "mainland_first",
  "quality_first",
  "cost_first",
  "custom",
]);
export type AdvancedBrainSelectionStrategy = z.infer<
  typeof AdvancedBrainSelectionStrategySchema
>;

export const AdvancedBrainProviderCapabilityProfileSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    providerId: ProviderIdSchema,
    modelId: ModelIdSchema,
    deploymentClass: z
      .enum(["local", "cloud", "fixture", "unavailable"])
      .optional(),
    executionSemantics: z
      .enum(["not_executed", "fixture", "simulated", "real_provider"])
      .optional(),
    automaticRetry: z.literal(false).optional(),
    automaticFallback: z.literal(false).optional(),
    inputModalities: z.array(AdvancedBrainModalitySchema).min(1).max(8),
    outputModalities: z.array(AdvancedBrainModalitySchema).min(1).max(8),
    supportsStructuredOutput: z.boolean(),
    supportsFunctionCalling: z.boolean(),
    supportsReasoning: z.boolean(),
    supportsStreaming: z.boolean(),
    supportsCancellation: z.boolean(),
    maxContextClass: AdvancedBrainContextClassSchema,
    latencyClass: AdvancedBrainLatencyClassSchema,
    costClass: AdvancedBrainCostClassSchema,
    regionAvailability: z
      .array(AdvancedBrainRegionAvailabilitySchema)
      .min(1)
      .max(4),
    privacyClass: AdvancedBrainPrivacyClassSchema,
    taskCategories: z.array(AdvancedBrainTaskCategorySchema).min(1).max(16),
    enabled: z.boolean(),
    healthStatus: AdvancedBrainProviderHealthSchema,
  })
  .strict();
export type AdvancedBrainProviderCapabilityProfile = z.infer<
  typeof AdvancedBrainProviderCapabilityProfileSchema
>;

export const AdvancedBrainUserConsentEvidenceSchema = z
  .object({
    kind: z.literal("explicit_user_confirmation"),
    confirmedAt: z.string().datetime(),
    scope: z.enum(["single_request", "session"]),
  })
  .strict();
export type AdvancedBrainUserConsentEvidence = z.infer<
  typeof AdvancedBrainUserConsentEvidenceSchema
>;

export const AdvancedBrainSafetyContextSchema = z
  .object({
    risk: z.enum(["low", "medium", "high", "blocked"]),
    allowedToolIds: z.array(z.string().min(1).max(128)).max(64).default([]),
    approvalRequired: z.boolean(),
    directExecutionAllowed: z.literal(false),
  })
  .strict();
export type AdvancedBrainSafetyContext = z.infer<
  typeof AdvancedBrainSafetyContextSchema
>;

export const AdvancedBrainRequestSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    requestId: RequestIdSchema,
    category: AdvancedBrainTaskCategorySchema,
    source: z.enum(["text", "voice", "developer_fixture", "test"]),
    userText: z.string().trim().min(1).max(20_000).optional(),
    minimizedInput: z.string().trim().min(1).max(20_000).optional(),
    inputModalities: z.array(AdvancedBrainModalitySchema).min(1).max(8),
    requestedOutput: AdvancedBrainRequestedOutputSchema,
    privacyRequirement: PrivacyRequirementSchema,
    cloudEgressPolicy: AdvancedBrainCloudEgressPolicySchema,
    userConsentEvidence: AdvancedBrainUserConsentEvidenceSchema.optional(),
    timeoutMs: z.number().int().min(100).max(120_000),
    tokenBudgetClass: AdvancedBrainBudgetClassSchema,
    costBudgetClass: AdvancedBrainCostClassSchema,
    allowedCapabilities: z
      .array(AdvancedBrainCapabilityRequirementSchema)
      .min(1)
      .max(16),
    conversationContextRef: z.string().min(1).max(128).optional(),
    sessionContextRef: z.string().min(1).max(128).optional(),
    safetyContext: AdvancedBrainSafetyContextSchema,
  })
  .strict()
  .superRefine((request, context) => {
    if (!request.userText && !request.minimizedInput) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userText"],
        message: "AdvancedBrainRequest requires minimized input text.",
      });
    }
    for (const [field, value] of [
      ["userText", request.userText],
      ["minimizedInput", request.minimizedInput],
    ] as const) {
      if (value && containsUnsafeLocalPath(value)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: "AdvancedBrainRequest must not contain local absolute paths.",
        });
      }
    }
    if (
      request.privacyRequirement === "cloud_requires_confirmation" &&
      request.cloudEgressPolicy === "allow_cloud" &&
      !request.userConsentEvidence
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userConsentEvidence"],
        message: "Cloud egress confirmation evidence is required.",
      });
    }
  });
export type AdvancedBrainRequest = z.infer<typeof AdvancedBrainRequestSchema>;

export const AdvancedBrainPreparedRequestSchema = z
  .object({
    request: AdvancedBrainRequestSchema,
    providerId: ProviderIdSchema,
    modelId: ModelIdSchema,
    acceptedAt: z.string().datetime(),
    credentialExposed: z.literal(false),
  })
  .strict();
export type AdvancedBrainPreparedRequest = z.infer<
  typeof AdvancedBrainPreparedRequestSchema
>;

export const AdvancedBrainResultClassSchema = z.enum([
  "answer",
  "structured_plan",
  "clarification",
  "refusal",
  "blocked",
  "unavailable",
  "failed",
]);
export type AdvancedBrainResultClass = z.infer<
  typeof AdvancedBrainResultClassSchema
>;

export const AdvancedBrainReasonCodeSchema = z.enum([
  "FIXTURE_ANSWER",
  "FIXTURE_PLAN",
  "PROVIDER_ANSWER",
  "PROVIDER_PLAN",
  "CLARIFY_REQUIRED",
  "REFUSED",
  "SAFETY_BLOCKED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_TIMEOUT",
  "PROVIDER_CANCELLED",
  "PROVIDER_FAILED",
  "INVALID_OUTPUT",
]);
export type AdvancedBrainReasonCode = z.infer<
  typeof AdvancedBrainReasonCodeSchema
>;

export const AdvancedBrainUntrustedProposalSchema = z
  .object({
    proposalType: z.enum([
      "tool_call",
      "shell_command",
      "file_operation",
      "plugin_request",
    ]),
    proposalId: z.string().min(1).max(128),
    requiresPlannerApproval: z.literal(true),
    directActionAttempted: z.literal(false),
  })
  .strict();
export type AdvancedBrainUntrustedProposal = z.infer<
  typeof AdvancedBrainUntrustedProposalSchema
>;

export const AdvancedBrainProviderResultSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    providerId: ProviderIdSchema,
    modelId: ModelIdSchema,
    requestId: RequestIdSchema,
    resultClass: AdvancedBrainResultClassSchema,
    reasonCode: AdvancedBrainReasonCodeSchema,
    answer: z.string().trim().min(1).max(4_000).optional(),
    structuredPlan: BrainPlanSchema.optional(),
    clarifyQuestion: z.string().trim().min(1).max(500).optional(),
    refusalSummary: z.string().trim().min(1).max(500).optional(),
    untrustedProposals: z
      .array(AdvancedBrainUntrustedProposalSchema)
      .max(8)
      .default([]),
    executionSemantics: z.enum([
      "not_executed",
      "fixture",
      "simulated",
      "real_provider",
    ]),
    directActionAttempted: z.literal(false),
    rawProviderResponsePersisted: z.literal(false),
    credentialExposed: z.literal(false),
    localPathExposed: z.literal(false),
    networkRequestIssued: z.boolean(),
    completedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((result, context) => {
    if (result.resultClass === "answer" && !result.answer) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answer"],
        message: "Answer results require bounded answer text.",
      });
    }
    if (result.resultClass === "structured_plan" && !result.structuredPlan) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["structuredPlan"],
        message: "Structured plan results require a bounded BrainPlan.",
      });
    }
    if (result.resultClass === "clarification" && !result.clarifyQuestion) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clarifyQuestion"],
        message: "Clarification results require a bounded question.",
      });
    }
    if (result.resultClass === "refusal" && !result.refusalSummary) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["refusalSummary"],
        message: "Refusal results require a bounded summary.",
      });
    }
  });
export type AdvancedBrainProviderResult = z.infer<
  typeof AdvancedBrainProviderResultSchema
>;

export const AdvancedBrainSelectionStatusSchema = z.enum([
  "selected",
  "confirmation_required",
  "blocked",
  "unavailable",
]);
export type AdvancedBrainSelectionStatus = z.infer<
  typeof AdvancedBrainSelectionStatusSchema
>;

export const AdvancedBrainSelectionReasonCodeSchema = z.enum([
  "SELECTED_LOCAL_FIRST",
  "SELECTED_MAINLAND_FIRST",
  "SELECTED_QUALITY_FIRST",
  "SELECTED_COST_FIRST",
  "SELECTED_CUSTOM",
  "CLOUD_CONFIRMATION_REQUIRED",
  "PRIVACY_BLOCKED",
  "CAPABILITY_MISMATCH",
  "PROVIDER_UNHEALTHY",
  "PROVIDER_UNAVAILABLE",
]);
export type AdvancedBrainSelectionReasonCode = z.infer<
  typeof AdvancedBrainSelectionReasonCodeSchema
>;

export const AdvancedBrainSelectionResultSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    status: AdvancedBrainSelectionStatusSchema,
    reasonCode: AdvancedBrainSelectionReasonCodeSchema,
    selectedProviderId: ProviderIdSchema.optional(),
    selectedModelId: ModelIdSchema.optional(),
    fallbackCandidates: z.array(ProviderIdSchema).max(8),
    cloudEgressDecision: CloudEgressDecisionSchema,
    automaticFallbackAllowed: z.literal(false),
    directExecutionAllowed: z.literal(false),
  })
  .strict();
export type AdvancedBrainSelectionResult = z.infer<
  typeof AdvancedBrainSelectionResultSchema
>;

export const AdvancedBrainDiagnosticsSchema = z
  .object({
    schemaVersion: z.literal(ADVANCED_BRAIN_SCHEMA_VERSION),
    requestId: RequestIdSchema,
    category: AdvancedBrainTaskCategorySchema,
    selectedProviderId: ProviderIdSchema.optional(),
    selectedModelId: ModelIdSchema.optional(),
    selectionReasonCode: AdvancedBrainSelectionReasonCodeSchema.optional(),
    latencyMs: z.number().int().nonnegative().optional(),
    tokenUsageCount: z.number().int().nonnegative().optional(),
    tokenBudgetClass: AdvancedBrainBudgetClassSchema,
    costBudgetClass: AdvancedBrainCostClassSchema,
    resultClass: AdvancedBrainResultClassSchema.optional(),
    errorReasonCode: AdvancedBrainReasonCodeSchema.optional(),
    cloudEgressDecision: CloudEgressDecisionSchema,
    promptExposed: z.literal(false),
    credentialExposed: z.literal(false),
    localPathExposed: z.literal(false),
    rawProviderResponsePersisted: z.literal(false),
  })
  .strict();
export type AdvancedBrainDiagnostics = z.infer<
  typeof AdvancedBrainDiagnosticsSchema
>;

function containsUnsafeLocalPath(value: string): boolean {
  return (
    /[A-Za-z]:[\\/][^\s]+/u.test(value) ||
    /\\\\[^\\/\s]+[\\/][^\\/\s]+/u.test(value) ||
    /(?:^|\s)\/(?:Users|home|etc|var|tmp)\//u.test(value)
  );
}

function validateCloudReasoningOrigin(
  value: string,
): { valid: true } | { valid: false; reason: string } {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { valid: false, reason: "Invalid origin URL." };
  }
  if (url.protocol !== "https:") {
    return { valid: false, reason: "Cloud reasoning origins must use HTTPS." };
  }
  if (url.username || url.password) {
    return { valid: false, reason: "Credentials are not allowed in origins." };
  }
  if (url.search || url.hash) {
    return { valid: false, reason: "Query strings and fragments are not allowed." };
  }
  if (url.pathname !== "/" && url.pathname !== "") {
    return { valid: false, reason: "Allowed origins must not include a path." };
  }
  if (url.port && url.port !== "443") {
    return { valid: false, reason: "Arbitrary ports are not allowed." };
  }
  if (isBlockedCloudReasoningHostname(url.hostname)) {
    return { valid: false, reason: "Private, local, or IP literal origins are not allowed." };
  }
  return { valid: true };
}

function normalizeCloudReasoningOrigin(value: string): string {
  const url = new URL(value);
  return url.origin.toLowerCase();
}

function isBlockedCloudReasoningHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/u, "");
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0" ||
    normalized === "0.0.0.0"
  ) {
    return true;
  }
  if (normalized.includes(":")) {
    return true;
  }
  const ipv4 = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u);
  if (!ipv4) {
    return false;
  }
  const parts = ipv4.slice(1).map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [first = 0, second = 0] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127)
  );
}
