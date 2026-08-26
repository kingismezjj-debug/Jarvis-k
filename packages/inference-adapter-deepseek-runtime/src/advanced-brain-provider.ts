import type { AdvancedReasoningProvider } from "@jarvis-k/capabilities";
import {
  CloudReasoningRuntime,
  DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY,
} from "@jarvis-k/capabilities";
import type {
  CloudReasoningRuntimeCredential,
  CloudReasoningRuntimeRequest,
  CloudReasoningRuntimeResult,
  CloudReasoningTransportSendOptions,
} from "@jarvis-k/capabilities";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  AdvancedBrainPreparedRequestSchema,
  AdvancedBrainProviderCapabilityProfileSchema,
  AdvancedBrainProviderResultSchema,
  AdvancedBrainRequestSchema,
  BrainPlanSchema,
  CloudProviderEndpointProfileSchema,
  CloudReasoningModelCapabilityProfileSchema,
  CloudReasoningTransportRequestSchema,
  type AdvancedBrainPreparedRequest,
  type AdvancedBrainProviderCapabilityProfile,
  type AdvancedBrainProviderResult,
  type AdvancedBrainRequest,
  type AdvancedBrainTaskCategory,
  type BrainPlan,
  type CloudProviderEndpointProfile,
  type CloudReasoningModelCapabilityProfile,
  type CloudReasoningTransportRequest,
  type CloudReasoningTransportResult,
} from "@jarvis-k/contracts";

export const DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID = "advanced-brain.deepseek";
export const DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID =
  "deepseek-openai-chat-completions-v1";
export const DEEPSEEK_ADVANCED_BRAIN_ORIGIN = "https://api.deepseek.com";
export const DEEPSEEK_ADVANCED_BRAIN_OPERATION_PATH = "/chat/completions";
export const DEEPSEEK_ADVANCED_BRAIN_OPERATION = "chat.completions";
export const DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID =
  "deepseek.advanced-brain.api-key";
export const DEEPSEEK_ADVANCED_BRAIN_DEFAULT_TIMEOUT_MS = 45_000;
export const DEEPSEEK_ADVANCED_BRAIN_MAX_REQUEST_BYTES = 64_000;
export const DEEPSEEK_ADVANCED_BRAIN_MAX_RESPONSE_BYTES = 128_000;

export const DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_MODEL_IDS = [
  "deepseek-v4-flash",
  "deepseek-v4-pro",
] as const;
export type DeepSeekAdvancedBrainModelId =
  (typeof DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_MODEL_IDS)[number];

export const DEEPSEEK_ADVANCED_BRAIN_DEPRECATED_OR_UNTRUSTED_MODEL_IDS = [
  "deepseek-chat",
  "deepseek-reasoner",
  "DeepSeek V4 Pro",
  "deepseek-v4-flash-vision-exp",
] as const;

export const DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_CATEGORIES = [
  "advanced_chat",
  "coding",
  "research",
  "long_document",
  "multi_step_plan",
  "creative_generation",
] as const satisfies readonly AdvancedBrainTaskCategory[];

export type DeepSeekThinkingType = "enabled" | "disabled";
export type DeepSeekReasoningEffort = "low" | "high" | "max";
export type DeepSeekOperationProfileId =
  | "deepseek-v4-flash-no-thinking"
  | "deepseek-v4-pro-thinking";

export interface DeepSeekOperationProfile {
  readonly operationProfileId: DeepSeekOperationProfileId;
  readonly modelId: DeepSeekAdvancedBrainModelId;
  readonly thinkingType: DeepSeekThinkingType;
  readonly reasoningEffort?: DeepSeekReasoningEffort;
  readonly maxTokens: number;
  readonly stream: boolean;
  readonly structuredOutput: boolean;
  readonly toolsEnabled: false;
  readonly automaticRetry: false;
  readonly automaticFallback: false;
}

export type DeepSeekAdvancedReasoningFailureReasonCode =
  | "credential_missing"
  | "provider_disabled"
  | "cloud_egress_blocked"
  | "confirmation_required"
  | "model_not_selected"
  | "model_unavailable"
  | "provider_model_mismatch"
  | "authentication_failed"
  | "permission_denied"
  | "rate_limited"
  | "timeout"
  | "cancelled"
  | "invalid_request"
  | "invalid_response"
  | "invalid_structured_output"
  | "response_too_large"
  | "provider_content_filtered"
  | "provider_capacity_unavailable"
  | "provider_unavailable"
  | "network_failed";

export type DeepSeekAdvancedReasoningProviderStatusValue =
  | "ready"
  | "disabled"
  | "missing_credential"
  | "missing_model"
  | "unavailable"
  | "failed";

export interface DeepSeekAdvancedReasoningCredential {
  readonly apiKey: string;
}

export interface DeepSeekAdvancedReasoningCredentialProvider {
  getCredential(): Promise<DeepSeekAdvancedReasoningCredential | undefined>;
}

export interface DeepSeekAdvancedReasoningTransport {
  send(
    request: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult>;
  dispose?(): void;
}

export interface DeepSeekAdvancedReasoningProviderOptions {
  readonly enabled?: boolean;
  readonly modelId?: string;
  readonly transport: DeepSeekAdvancedReasoningTransport;
  readonly credentialProvider: DeepSeekAdvancedReasoningCredentialProvider;
  readonly endpointProfile?: CloudProviderEndpointProfile;
  readonly operationProfile?: DeepSeekOperationProfile;
  readonly now?: () => Date;
}

export interface DeepSeekAdvancedReasoningProviderStatus {
  readonly providerId: typeof DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID;
  readonly modelId?: DeepSeekAdvancedBrainModelId;
  readonly configured: boolean;
  readonly enabled: boolean;
  readonly supportedCategories: readonly AdvancedBrainTaskCategory[];
  readonly cloudEgressRequired: true;
  readonly status: DeepSeekAdvancedReasoningProviderStatusValue;
  readonly lastProbeAt?: string;
  readonly lastSuccessAt?: string;
  readonly lastFailureReason?: DeepSeekAdvancedReasoningFailureReasonCode;
  readonly credentialExposed: false;
}

export interface DeepSeekAdvancedReasoningProbeResult
  extends DeepSeekAdvancedReasoningProviderStatus {
  readonly probed: boolean;
  readonly requestSent: boolean;
}

export class DeepSeekAdvancedReasoningProviderError extends Error {
  public constructor(
    public readonly reasonCode: DeepSeekAdvancedReasoningFailureReasonCode,
  ) {
    super(`DEEPSEEK_ADVANCED_REASONING_${reasonCode.toUpperCase()}`);
  }
}

export class DeepSeekAdvancedReasoningProvider
  implements AdvancedReasoningProvider
{
  public readonly profile: AdvancedBrainProviderCapabilityProfile;
  private readonly enabled: boolean;
  private readonly modelId: DeepSeekAdvancedBrainModelId | undefined;
  private readonly transport: DeepSeekAdvancedReasoningTransport;
  private readonly credentialProvider: DeepSeekAdvancedReasoningCredentialProvider;
  private readonly endpointProfile: CloudProviderEndpointProfile;
  private readonly cloudModelProfile:
    | CloudReasoningModelCapabilityProfile
    | undefined;
  private readonly operationProfile: DeepSeekOperationProfile | undefined;
  private readonly runtime: CloudReasoningRuntime;
  private readonly now: () => Date;
  private lastProbeAt: string | undefined;
  private lastSuccessAt: string | undefined;
  private lastFailureReason:
    | DeepSeekAdvancedReasoningFailureReasonCode
    | undefined;

  public constructor(options: DeepSeekAdvancedReasoningProviderOptions) {
    this.enabled = options.enabled === true;
    this.transport = options.transport;
    this.credentialProvider = options.credentialProvider;
    this.endpointProfile =
      options.endpointProfile ?? createDeepSeekAdvancedReasoningEndpointProfile();
    this.now = options.now ?? (() => new Date());
    this.modelId =
      options.modelId && isDeepSeekAdvancedBrainModelId(options.modelId)
        ? options.modelId
        : undefined;
    this.operationProfile =
      options.operationProfile ??
      (this.modelId ? defaultOperationProfileFor(this.modelId) : undefined);
    this.cloudModelProfile = this.modelId
      ? createDeepSeekCloudReasoningModelCapabilityProfile({
          enabled: this.enabled,
          modelId: this.modelId,
        })
      : undefined;
    this.runtime = new CloudReasoningRuntime({
      endpointProfiles: [this.endpointProfile],
      modelProfiles: this.cloudModelProfile ? [this.cloudModelProfile] : [],
      timeoutPolicies: [DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY],
      transport: this.transport,
      now: this.now,
    });
    this.profile = createDeepSeekAdvancedReasoningProfile({
      enabled: this.enabled,
      ...(this.modelId ? { modelId: this.modelId } : {}),
      healthStatus: this.enabled && this.modelId ? "unknown" : "unavailable",
    });
  }

  public async prepare(
    request: AdvancedBrainRequest,
  ): Promise<AdvancedBrainPreparedRequest> {
    const parsed = AdvancedBrainRequestSchema.parse(request);
    await this.assertCanPrepare(parsed);
    return AdvancedBrainPreparedRequestSchema.parse({
      request: parsed,
      providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
      modelId: this.modelId,
      acceptedAt: this.now().toISOString(),
      credentialExposed: false,
    });
  }

  public async execute(
    preparedRequest: AdvancedBrainPreparedRequest,
    options?: { signal?: AbortSignal },
  ): Promise<AdvancedBrainProviderResult> {
    const prepared = AdvancedBrainPreparedRequestSchema.parse(preparedRequest);
    if (
      prepared.providerId !== DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID ||
      prepared.modelId !== this.modelId
    ) {
      return this.failure(prepared, "provider_model_mismatch", {
        networkRequestIssued: false,
      });
    }
    const credential = await this.credentialProvider.getCredential();
    if (!isCredentialConfigured(credential)) {
      this.lastFailureReason = "credential_missing";
      return this.unavailable(prepared, "credential_missing", false);
    }
    if (!this.cloudModelProfile || !this.operationProfile) {
      return this.failure(prepared, "model_not_selected", {
        networkRequestIssued: false,
      });
    }

    const runtimeResult = await this.runtime.runOpenAiChatCompletions(
      createDeepSeekAdvancedReasoningRuntimeRequest(prepared, {
        modelProfile: this.cloudModelProfile,
        operationProfile: this.operationProfile,
      }),
      {
        credential: toRuntimeCredential(credential),
        ...(options?.signal ? { signal: options.signal } : {}),
      },
    );
    if (runtimeResult.transport.statusClass !== "success") {
      return this.resultFromTransportFailure(prepared, runtimeResult.transport);
    }
    if (
      !transportResponseModelMatches(
        runtimeResult.transport.responseJson,
        prepared.modelId,
      )
    ) {
      return this.failure(prepared, "provider_model_mismatch", {
        networkRequestIssued: runtimeResult.transport.requestSent,
      });
    }
    if (!runtimeResult.output.ok || runtimeResult.output.toolProposalObserved) {
      return this.resultFromRuntimeOutputFailure(prepared, runtimeResult);
    }
    try {
      const result = normalizeDeepSeekAdvancedReasoningOutput(
        parseAssistantJsonContent(runtimeResult.output.finalContent ?? ""),
        prepared,
        this.now().toISOString(),
      );
      this.lastFailureReason = undefined;
      this.lastSuccessAt = result.completedAt;
      return result;
    } catch (error) {
      const reason = isInvalidStructuredOutput(error)
        ? "invalid_structured_output"
        : "invalid_response";
      this.lastFailureReason = reason;
      return this.failure(prepared, reason, { networkRequestIssued: true });
    }
  }

  public async cancel(_requestId: string, _reason?: string): Promise<void> {}

  public async getStatus(): Promise<DeepSeekAdvancedReasoningProviderStatus> {
    return this.statusForCredential(await this.credentialProvider.getCredential());
  }

  public async probe(input: {
    readonly requestId: string;
    readonly timeoutMs?: number;
    readonly signal?: AbortSignal;
  }): Promise<DeepSeekAdvancedReasoningProbeResult> {
    this.lastProbeAt = this.now().toISOString();
    const status = await this.getStatus();
    if (status.status !== "ready" || !this.modelId) {
      return { ...status, probed: false, requestSent: false };
    }
    const credential = await this.credentialProvider.getCredential();
    if (!isCredentialConfigured(credential)) {
      return {
        ...this.statusForCredential(credential),
        probed: false,
        requestSent: false,
      };
    }
    const transportResult = await this.transport.send(
      CloudReasoningTransportRequestSchema.parse({
        schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
        requestId: input.requestId,
        providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
        deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
        operation: DEEPSEEK_ADVANCED_BRAIN_OPERATION,
        method: "POST",
        contentType: "application/json",
        bodyJson: createDeepSeekProbeRequestBody(this.modelId),
        credentialBindingId: DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
        timeoutMs: input.timeoutMs ?? 2_000,
        maxResponseBytes: 4_000,
      }),
      {
        credential: toRuntimeCredential(credential),
        ...(input.signal ? { signal: input.signal } : {}),
      },
    );
    if (transportResult.statusClass === "success") {
      this.lastSuccessAt = this.now().toISOString();
      this.lastFailureReason = undefined;
    } else {
      this.lastFailureReason = mapDeepSeekTransportFailure(transportResult);
    }
    return {
      ...(await this.getStatus()),
      probed: true,
      requestSent: transportResult.requestSent,
    };
  }

  private async assertCanPrepare(request: AdvancedBrainRequest): Promise<void> {
    if (!this.enabled) {
      throw this.prepareError("provider_disabled");
    }
    if (!this.modelId) {
      throw this.prepareError("model_not_selected");
    }
    if (
      !this.operationProfile ||
      this.operationProfile.modelId !== this.modelId ||
      !isSupportedCategory(request.category)
    ) {
      throw this.prepareError("model_unavailable");
    }
    if (
      request.privacyRequirement === "local_only" ||
      request.privacyRequirement === "cloud_prohibited" ||
      request.cloudEgressPolicy === "local_only" ||
      request.cloudEgressPolicy === "prohibit_cloud"
    ) {
      throw this.prepareError("cloud_egress_blocked");
    }
    if (
      (request.privacyRequirement === "cloud_requires_confirmation" ||
        request.cloudEgressPolicy === "require_confirmation") &&
      !request.userConsentEvidence
    ) {
      throw this.prepareError("confirmation_required");
    }
    if (!CloudProviderEndpointProfileSchema.safeParse(this.endpointProfile).success) {
      throw this.prepareError("provider_unavailable");
    }
    const credential = await this.credentialProvider.getCredential();
    if (!isCredentialConfigured(credential)) {
      throw this.prepareError("credential_missing");
    }
  }

  private prepareError(
    reasonCode: DeepSeekAdvancedReasoningFailureReasonCode,
  ): DeepSeekAdvancedReasoningProviderError {
    this.lastFailureReason = reasonCode;
    return new DeepSeekAdvancedReasoningProviderError(reasonCode);
  }

  private resultFromTransportFailure(
    prepared: AdvancedBrainPreparedRequest,
    transportResult: CloudReasoningTransportResult,
  ): AdvancedBrainProviderResult {
    const reason = mapDeepSeekTransportFailure(transportResult);
    this.lastFailureReason = reason;
    if (
      reason === "timeout" ||
      reason === "cancelled" ||
      reason === "provider_unavailable" ||
      reason === "provider_capacity_unavailable" ||
      reason === "network_failed" ||
      reason === "authentication_failed" ||
      reason === "permission_denied" ||
      reason === "rate_limited"
    ) {
      return this.unavailable(prepared, reason, transportResult.requestSent);
    }
    return this.failure(prepared, reason, {
      networkRequestIssued: transportResult.requestSent,
    });
  }

  private resultFromRuntimeOutputFailure(
    prepared: AdvancedBrainPreparedRequest,
    runtimeResult: CloudReasoningRuntimeResult,
  ): AdvancedBrainProviderResult {
    const reason = mapDeepSeekRuntimeOutputFailure(runtimeResult);
    this.lastFailureReason = reason;
    if (reason === "provider_capacity_unavailable") {
      return this.unavailable(
        prepared,
        reason,
        runtimeResult.transport.requestSent,
      );
    }
    return this.failure(prepared, reason, {
      networkRequestIssued: runtimeResult.transport.requestSent,
    });
  }

  private unavailable(
    prepared: AdvancedBrainPreparedRequest,
    _reason: DeepSeekAdvancedReasoningFailureReasonCode,
    networkRequestIssued: boolean,
  ): AdvancedBrainProviderResult {
    return AdvancedBrainProviderResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
      modelId: prepared.modelId,
      requestId: prepared.request.requestId,
      resultClass: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      executionSemantics: "not_executed",
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      localPathExposed: false,
      networkRequestIssued,
      completedAt: this.now().toISOString(),
    });
  }

  private failure(
    prepared: AdvancedBrainPreparedRequest,
    reason: DeepSeekAdvancedReasoningFailureReasonCode,
    input: { readonly networkRequestIssued: boolean },
  ): AdvancedBrainProviderResult {
    return AdvancedBrainProviderResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
      modelId: prepared.modelId,
      requestId: prepared.request.requestId,
      resultClass: reason === "cloud_egress_blocked" ? "blocked" : "failed",
      reasonCode:
        reason === "cancelled"
          ? "PROVIDER_CANCELLED"
          : reason === "timeout"
            ? "PROVIDER_TIMEOUT"
            : reason === "cloud_egress_blocked"
              ? "SAFETY_BLOCKED"
              : "INVALID_OUTPUT",
      refusalSummary:
        reason === "cloud_egress_blocked"
          ? "Cloud reasoning was blocked by the local privacy policy."
          : undefined,
      executionSemantics: "not_executed",
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      localPathExposed: false,
      networkRequestIssued: input.networkRequestIssued,
      completedAt: this.now().toISOString(),
    });
  }

  private statusForCredential(
    credential: DeepSeekAdvancedReasoningCredential | undefined,
  ): DeepSeekAdvancedReasoningProviderStatus {
    const configured = isCredentialConfigured(credential);
    const status: DeepSeekAdvancedReasoningProviderStatusValue = !this.enabled
      ? "disabled"
      : !this.modelId
        ? "missing_model"
        : !configured
          ? "missing_credential"
          : this.lastFailureReason
            ? "failed"
            : "ready";
    return {
      providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
      ...(this.modelId ? { modelId: this.modelId } : {}),
      configured,
      enabled: this.enabled,
      supportedCategories: DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_CATEGORIES,
      cloudEgressRequired: true,
      status,
      ...(this.lastProbeAt ? { lastProbeAt: this.lastProbeAt } : {}),
      ...(this.lastSuccessAt ? { lastSuccessAt: this.lastSuccessAt } : {}),
      ...(this.lastFailureReason
        ? { lastFailureReason: this.lastFailureReason }
        : {}),
      credentialExposed: false,
    };
  }
}

export function createDeepSeekAdvancedReasoningEndpointProfile(): CloudProviderEndpointProfile {
  return CloudProviderEndpointProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
    trustClass: "provider_managed",
    allowedOrigins: [DEEPSEEK_ADVANCED_BRAIN_ORIGIN],
    allowedOperationPaths: [
      {
        operation: DEEPSEEK_ADVANCED_BRAIN_OPERATION,
        path: DEEPSEEK_ADVANCED_BRAIN_OPERATION_PATH,
      },
    ],
    region: "mainland_china",
    requiresHttps: true,
    redirectPolicy: "none",
    maxRequestBytes: DEEPSEEK_ADVANCED_BRAIN_MAX_REQUEST_BYTES,
    maxResponseBytes: DEEPSEEK_ADVANCED_BRAIN_MAX_RESPONSE_BYTES,
    timeoutBounds: {
      minTimeoutMs: 1_000,
      defaultTimeoutMs: DEEPSEEK_ADVANCED_BRAIN_DEFAULT_TIMEOUT_MS,
      maxTimeoutMs: DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY.overallTimeoutMs,
    },
    credentialBindingId: DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
  });
}

export function createDeepSeekAdvancedReasoningProfile(input: {
  readonly enabled?: boolean;
  readonly modelId?: DeepSeekAdvancedBrainModelId;
  readonly healthStatus?: AdvancedBrainProviderCapabilityProfile["healthStatus"];
}): AdvancedBrainProviderCapabilityProfile {
  return AdvancedBrainProviderCapabilityProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    modelId: input.modelId ?? "model_not_selected",
    deploymentClass: "cloud",
    executionSemantics: "real_provider",
    automaticRetry: false,
    automaticFallback: false,
    inputModalities: ["text", "structured_context"],
    outputModalities: ["text", "structured_context"],
    supportsStructuredOutput: true,
    supportsFunctionCalling: false,
    supportsReasoning: true,
    supportsStreaming: true,
    supportsCancellation: true,
    maxContextClass: input.modelId === "deepseek-v4-pro" ? "very_long" : "long",
    latencyClass: input.modelId === "deepseek-v4-pro" ? "standard" : "interactive",
    costClass: input.modelId === "deepseek-v4-pro" ? "medium" : "low",
    regionAvailability: ["mainland_china", "global"],
    privacyClass: "cloud",
    taskCategories: DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_CATEGORIES,
    enabled: input.enabled === true,
    healthStatus: input.healthStatus ?? "unknown",
  });
}

export function createDeepSeekCloudReasoningModelCapabilityProfile(input: {
  readonly enabled?: boolean;
  readonly modelId: DeepSeekAdvancedBrainModelId;
}): CloudReasoningModelCapabilityProfile {
  return CloudReasoningModelCapabilityProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    modelId: input.modelId,
    protocolFamily: "openai_chat_completions",
    deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
    trustClass: "provider_managed",
    region: "mainland_china",
    supportsStreaming: true,
    supportsNonStreaming: true,
    supportsThinking: true,
    thinkingPolicy: "optional",
    supportsReasoningEffort: true,
    allowedReasoningEffort: ["low", "high", "max"],
    supportsTools: true,
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsImages: false,
    contextWindow: 1_000_000,
    maxOutputTokens: 384_000,
    recommendedOutputTokens: input.modelId === "deepseek-v4-pro" ? 1_024 : 512,
    requestTimeoutPolicyId: "reasoning-default-v1",
    credentialBindingId: DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
    endpointProfileId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
    executionSemantics: "real_provider",
    dataEgressClass: "cloud_user_content",
    pricingTier: input.modelId === "deepseek-v4-pro" ? "medium" : "low",
    enabled: input.enabled === true,
  });
}

export function createDeepSeekOperationProfile(
  operationProfileId: DeepSeekOperationProfileId,
): DeepSeekOperationProfile {
  switch (operationProfileId) {
    case "deepseek-v4-flash-no-thinking":
      return {
        operationProfileId,
        modelId: "deepseek-v4-flash",
        thinkingType: "disabled",
        maxTokens: 512,
        stream: false,
        structuredOutput: false,
        toolsEnabled: false,
        automaticRetry: false,
        automaticFallback: false,
      };
    case "deepseek-v4-pro-thinking":
      return {
        operationProfileId,
        modelId: "deepseek-v4-pro",
        thinkingType: "enabled",
        reasoningEffort: "high",
        maxTokens: 1_024,
        stream: false,
        structuredOutput: false,
        toolsEnabled: false,
        automaticRetry: false,
        automaticFallback: false,
      };
    default:
      throw new DeepSeekAdvancedReasoningProviderError("model_unavailable");
  }
}

export function createDeepSeekAdvancedReasoningRuntimeRequest(
  prepared: AdvancedBrainPreparedRequest,
  input: {
    readonly modelProfile: CloudReasoningModelCapabilityProfile;
    readonly operationProfile: DeepSeekOperationProfile;
  },
): CloudReasoningRuntimeRequest {
  const parsed = AdvancedBrainPreparedRequestSchema.parse(prepared);
  const modelProfile = CloudReasoningModelCapabilityProfileSchema.parse(
    input.modelProfile,
  );
  return {
    transportRequest: CloudReasoningTransportRequestSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      requestId: parsed.request.requestId,
      providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
      deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
      operation: DEEPSEEK_ADVANCED_BRAIN_OPERATION,
      method: "POST",
      contentType: "application/json",
      bodyJson: createDeepSeekAdvancedReasoningRequestBody(parsed, {
        operationProfile: input.operationProfile,
      }),
      credentialBindingId: DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
      timeoutMs: parsed.request.timeoutMs,
      maxResponseBytes: DEEPSEEK_ADVANCED_BRAIN_MAX_RESPONSE_BYTES,
    }),
    modelProfile,
    timeoutPolicyId: modelProfile.requestTimeoutPolicyId,
    stream: input.operationProfile.stream,
    maxFinalContentChars: DEEPSEEK_ADVANCED_BRAIN_MAX_RESPONSE_BYTES,
    toolsEnabled: false,
  };
}

export function createDeepSeekAdvancedReasoningRequestBody(
  prepared: AdvancedBrainPreparedRequest,
  options: {
    readonly operationProfile: DeepSeekOperationProfile;
  },
): Record<string, unknown> {
  const parsed = AdvancedBrainPreparedRequestSchema.parse(prepared);
  const request = parsed.request;
  const operationProfile = validateOperationProfile(
    options.operationProfile,
    parsed.modelId,
  );
  return {
    model: operationProfile.modelId,
    messages: [
      {
        role: "system",
        content: [
          "Return one JSON object only.",
          "Do not call tools, functions, plugins, browsers, shell, filesystem, or Windows automation.",
          "Set directActionAttempted to false.",
          "Never include reasoning_content in the request or final JSON.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          requestId: request.requestId,
          category: request.category,
          requestedOutput: request.requestedOutput,
          input: request.minimizedInput ?? request.userText,
          safety: {
            risk: request.safetyContext.risk,
            approvalRequired: request.safetyContext.approvalRequired,
            directExecutionAllowed: false,
          },
          allowedCapabilities: request.allowedCapabilities,
          tokenBudgetClass: request.tokenBudgetClass,
        }),
      },
    ],
    stream: operationProfile.stream,
    max_tokens: operationProfile.maxTokens,
    thinking: { type: operationProfile.thinkingType },
    ...(operationProfile.thinkingType === "enabled" &&
    operationProfile.reasoningEffort
      ? { reasoning_effort: operationProfile.reasoningEffort }
      : {}),
    ...(operationProfile.structuredOutput
      ? { response_format: { type: "json_object" } }
      : {}),
  };
}

export function mapDeepSeekTransportFailure(
  transportResult: CloudReasoningTransportResult,
): DeepSeekAdvancedReasoningFailureReasonCode {
  if (
    transportResult.reasonCode === "timeout" ||
    transportResult.reasonCode === "headers_timeout" ||
    transportResult.reasonCode === "first_event_timeout" ||
    transportResult.reasonCode === "stream_idle_timeout" ||
    transportResult.reasonCode === "overall_timeout"
  ) {
    return "timeout";
  }
  if (transportResult.reasonCode === "cancelled") {
    return "cancelled";
  }
  if (
    transportResult.reasonCode === "authentication_transport_failure" ||
    transportResult.reasonCode === "credential_rejected"
  ) {
    return transportResult.httpStatus === 403
      ? "permission_denied"
      : "authentication_failed";
  }
  if (transportResult.reasonCode === "permission_denied") {
    return "permission_denied";
  }
  if (
    transportResult.reasonCode === "rate_limited" ||
    transportResult.reasonCode === "quota_restricted"
  ) {
    return "rate_limited";
  }
  if (transportResult.reasonCode === "model_not_available") {
    return "model_unavailable";
  }
  if (transportResult.reasonCode === "provider_content_filtered") {
    return "provider_content_filtered";
  }
  if (transportResult.reasonCode === "provider_capacity_unavailable") {
    return "provider_capacity_unavailable";
  }
  if (transportResult.reasonCode === "response_too_large") {
    return "response_too_large";
  }
  if (transportResult.reasonCode === "invalid_request") {
    return "invalid_request";
  }
  if (
    transportResult.reasonCode === "invalid_response" ||
    transportResult.reasonCode === "invalid_provider_output" ||
    transportResult.reasonCode === "malformed_stream" ||
    transportResult.reasonCode === "incomplete_stream" ||
    transportResult.reasonCode === "no_final_answer" ||
    transportResult.reasonCode === "output_budget_exhausted_before_final" ||
    transportResult.reasonCode === "untrusted_tool_proposal_blocked" ||
    transportResult.reasonCode === "provider_contract_deviation"
  ) {
    return "invalid_response";
  }
  if (transportResult.statusClass === "network_error") {
    return "network_failed";
  }
  return "provider_unavailable";
}

function mapDeepSeekRuntimeOutputFailure(
  runtimeResult: CloudReasoningRuntimeResult,
): DeepSeekAdvancedReasoningFailureReasonCode {
  switch (runtimeResult.output.category) {
    case "response_too_large":
      return "response_too_large";
    case "provider_content_filtered":
      return "provider_content_filtered";
    case "provider_capacity_unavailable":
      return "provider_capacity_unavailable";
    case "untrusted_tool_proposal_blocked":
    case "invalid_provider_output":
      return "invalid_structured_output";
    default:
      return "invalid_response";
  }
}

function normalizeDeepSeekAdvancedReasoningOutput(
  output: unknown,
  prepared: AdvancedBrainPreparedRequest,
  completedAt: string,
): AdvancedBrainProviderResult {
  if (!isRecord(output)) {
    throw new DeepSeekAdvancedReasoningProviderError("invalid_response");
  }
  if (output.directActionAttempted !== undefined && output.directActionAttempted !== false) {
    throw new DeepSeekAdvancedReasoningProviderError(
      "invalid_structured_output",
    );
  }
  const resultClass = normalizeResultClass(output);
  if (resultClass === "structured_plan") {
    const structuredPlan = normalizeStructuredPlan(output.structuredPlan ?? output.plan);
    return AdvancedBrainProviderResultSchema.parse({
      ...baseResult(prepared, completedAt),
      resultClass,
      reasonCode: "PROVIDER_PLAN",
      structuredPlan,
      networkRequestIssued: true,
    });
  }
  if (resultClass === "clarification") {
    return AdvancedBrainProviderResultSchema.parse({
      ...baseResult(prepared, completedAt),
      resultClass,
      reasonCode: "CLARIFY_REQUIRED",
      clarifyQuestion: safeText(
        output.clarifyQuestion ?? output.question ?? output.message,
        500,
      ),
      networkRequestIssued: true,
    });
  }
  if (resultClass === "refusal") {
    return AdvancedBrainProviderResultSchema.parse({
      ...baseResult(prepared, completedAt),
      resultClass,
      reasonCode: "REFUSED",
      refusalSummary: safeText(
        output.refusalSummary ?? output.reason ?? output.message,
        500,
      ),
      networkRequestIssued: true,
    });
  }
  if (resultClass === "blocked") {
    return AdvancedBrainProviderResultSchema.parse({
      ...baseResult(prepared, completedAt),
      resultClass,
      reasonCode: "SAFETY_BLOCKED",
      refusalSummary: safeText(
        output.refusalSummary ?? output.reason ?? output.message,
        500,
      ),
      networkRequestIssued: true,
    });
  }
  if (resultClass === "answer") {
    return AdvancedBrainProviderResultSchema.parse({
      ...baseResult(prepared, completedAt),
      resultClass,
      reasonCode: "PROVIDER_ANSWER",
      answer: safeText(output.answer ?? output.content ?? output.message, 4_000),
      networkRequestIssued: true,
    });
  }
  throw new DeepSeekAdvancedReasoningProviderError("invalid_response");
}

function baseResult(
  prepared: AdvancedBrainPreparedRequest,
  completedAt: string,
): Omit<
  AdvancedBrainProviderResult,
  | "resultClass"
  | "reasonCode"
  | "answer"
  | "structuredPlan"
  | "clarifyQuestion"
  | "refusalSummary"
  | "networkRequestIssued"
> {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    modelId: prepared.modelId,
    requestId: prepared.request.requestId,
    untrustedProposals: [],
    executionSemantics: "real_provider",
    directActionAttempted: false,
    rawProviderResponsePersisted: false,
    credentialExposed: false,
    localPathExposed: false,
    completedAt,
  };
}

function defaultOperationProfileFor(
  modelId: DeepSeekAdvancedBrainModelId,
): DeepSeekOperationProfile {
  return modelId === "deepseek-v4-pro"
    ? createDeepSeekOperationProfile("deepseek-v4-pro-thinking")
    : createDeepSeekOperationProfile("deepseek-v4-flash-no-thinking");
}

function validateOperationProfile(
  profile: DeepSeekOperationProfile,
  expectedModelId: string | undefined,
): DeepSeekOperationProfile {
  if (
    profile.modelId !== expectedModelId ||
    profile.toolsEnabled !== false ||
    profile.automaticRetry !== false ||
    profile.automaticFallback !== false ||
    !isDeepSeekAdvancedBrainModelId(profile.modelId)
  ) {
    throw new DeepSeekAdvancedReasoningProviderError("invalid_request");
  }
  if (profile.thinkingType === "disabled" && profile.reasoningEffort !== undefined) {
    throw new DeepSeekAdvancedReasoningProviderError("invalid_request");
  }
  if (
    profile.thinkingType === "enabled" &&
    profile.reasoningEffort !== undefined &&
    !isDeepSeekReasoningEffort(profile.reasoningEffort)
  ) {
    throw new DeepSeekAdvancedReasoningProviderError("invalid_request");
  }
  return profile;
}

function createDeepSeekProbeRequestBody(
  modelId: DeepSeekAdvancedBrainModelId,
): Record<string, unknown> {
  return {
    model: modelId,
    messages: [
      {
        role: "system",
        content: "Return JSON health only. Do not include user content.",
      },
      {
        role: "user",
        content: JSON.stringify({ probe: "advanced_brain_deepseek_health" }),
      },
    ],
    response_format: { type: "json_object" },
    stream: false,
    thinking: { type: "disabled" },
    max_tokens: 64,
  };
}

function parseAssistantJsonContent(content: string): unknown {
  if (content.length > DEEPSEEK_ADVANCED_BRAIN_MAX_RESPONSE_BYTES) {
    throw new DeepSeekAdvancedReasoningProviderError("response_too_large");
  }
  try {
    return JSON.parse(extractJsonObjectText(content));
  } catch {
    throw new DeepSeekAdvancedReasoningProviderError("invalid_response");
  }
}

function extractJsonObjectText(output: string): string {
  const trimmed = output
    .trim()
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "")
    .trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const start = trimmed.indexOf("{");
  if (start < 0) {
    throw new Error("DEEPSEEK_ADVANCED_REASONING_OUTPUT_JSON_MISSING");
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < trimmed.length; index += 1) {
    const character = trimmed[index];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
        continue;
      }
      if (character === "\"") {
        inString = false;
      }
      continue;
    }
    if (character === "\"") {
      inString = true;
      continue;
    }
    if (character === "{") {
      depth += 1;
      continue;
    }
    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(start, index + 1);
      }
    }
  }
  throw new Error("DEEPSEEK_ADVANCED_REASONING_OUTPUT_JSON_INCOMPLETE");
}

function normalizeResultClass(
  output: Record<string, unknown>,
): AdvancedBrainProviderResult["resultClass"] {
  const value = output.resultClass ?? output.status;
  const normalized =
    typeof value === "string"
      ? value.trim().toLowerCase().replace(/[\s-]+/gu, "_")
      : "";
  if (
    normalized === "answer" ||
    normalized === "structured_plan" ||
    normalized === "clarification" ||
    normalized === "refusal" ||
    normalized === "blocked"
  ) {
    return normalized;
  }
  if (normalized === "plan" || normalized === "planned") {
    return "structured_plan";
  }
  if (typeof output.answer === "string" || typeof output.content === "string") {
    return "answer";
  }
  if (isRecord(output.structuredPlan) || isRecord(output.plan)) {
    return "structured_plan";
  }
  return "failed";
}

function normalizeStructuredPlan(value: unknown): BrainPlan {
  const parsed = BrainPlanSchema.safeParse(value);
  if (!parsed.success || parsed.data.directActionAttempted !== false) {
    throw new DeepSeekAdvancedReasoningProviderError(
      "invalid_structured_output",
    );
  }
  return BrainPlanSchema.parse({
    ...parsed.data,
    requiresConfirmation: true,
    steps: parsed.data.steps.map((step) => ({
      ...step,
      requiresConfirmation: true,
      directActionAttempted: false,
    })),
    directActionAttempted: false,
  });
}

function safeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    throw new DeepSeekAdvancedReasoningProviderError("invalid_response");
  }
  const normalized = value.trim().replace(/\s+/gu, " ").slice(0, maxLength);
  if (normalized.length === 0) {
    throw new DeepSeekAdvancedReasoningProviderError("invalid_response");
  }
  return normalized;
}

function transportResponseModelMatches(
  responseJson: unknown,
  expectedModelId: string | undefined,
): boolean {
  if (!isRecord(responseJson) || typeof responseJson.model !== "string") {
    return true;
  }
  return responseJson.model === expectedModelId;
}

function toRuntimeCredential(
  credential: DeepSeekAdvancedReasoningCredential,
): CloudReasoningRuntimeCredential {
  return {
    scheme: "bearer",
    value: credential.apiKey,
  };
}

function isCredentialConfigured(
  credential: DeepSeekAdvancedReasoningCredential | undefined,
): credential is DeepSeekAdvancedReasoningCredential {
  return (
    typeof credential?.apiKey === "string" &&
    credential.apiKey.trim().length >= 8 &&
    credential.apiKey.length <= 1024
  );
}

function isSupportedCategory(
  category: AdvancedBrainTaskCategory,
): category is (typeof DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_CATEGORIES)[number] {
  return DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_CATEGORIES.some(
    (supported) => supported === category,
  );
}

export function isDeepSeekAdvancedBrainModelId(
  value: string,
): value is DeepSeekAdvancedBrainModelId {
  return DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_MODEL_IDS.some(
    (modelId) => modelId === value,
  );
}

export function isDeepSeekDeprecatedOrUntrustedModelId(value: string): boolean {
  return DEEPSEEK_ADVANCED_BRAIN_DEPRECATED_OR_UNTRUSTED_MODEL_IDS.some(
    (modelId) => modelId === value,
  );
}

function isDeepSeekReasoningEffort(
  value: string,
): value is DeepSeekReasoningEffort {
  return value === "low" || value === "high" || value === "max";
}

function isInvalidStructuredOutput(error: unknown): boolean {
  return (
    error instanceof DeepSeekAdvancedReasoningProviderError &&
    error.reasonCode === "invalid_structured_output"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
