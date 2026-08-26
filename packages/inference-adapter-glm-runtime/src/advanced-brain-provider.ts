import type { AdvancedReasoningProvider } from "@jarvis-k/capabilities";
import type {
  CloudReasoningRuntimeCredential,
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
import {
  isGlmProviderModelCandidateId,
  type GlmProviderModelCandidateId,
} from "./model-origin-strategy";

export const GLM_ADVANCED_BRAIN_PROVIDER_ID = "advanced-brain.glm";
export const GLM_ADVANCED_BRAIN_DEPLOYMENT_ID = "standard_paas_v4";
export const GLM_ADVANCED_BRAIN_ORIGIN = "https://open.bigmodel.cn";
export const GLM_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID =
  "glm.advanced-brain.api-key";
export const GLM_ADVANCED_BRAIN_OPERATION = "chat.completions";
export const GLM_ADVANCED_BRAIN_OPERATION_PATH =
  "/api/paas/v4/chat/completions";
export const GLM_ADVANCED_BRAIN_DEFAULT_MODEL_ID = "glm-5.2";
export const GLM_ADVANCED_BRAIN_RECOMMENDED_MODEL_ID =
  GLM_ADVANCED_BRAIN_DEFAULT_MODEL_ID;
export const GLM_ADVANCED_BRAIN_UNSELECTED_MODEL_ID = "model_not_selected";
export const GLM_ADVANCED_BRAIN_DEFAULT_TIMEOUT_MS = 45_000;
export const GLM_ADVANCED_BRAIN_MAX_REQUEST_BYTES = 64_000;
export const GLM_ADVANCED_BRAIN_MAX_RESPONSE_BYTES = 128_000;

export const GLM_ADVANCED_BRAIN_SUPPORTED_CATEGORIES = [
  "advanced_chat",
  "coding",
  "research",
  "long_document",
  "multi_step_plan",
  "creative_generation",
] as const satisfies readonly AdvancedBrainTaskCategory[];

export type GlmAdvancedReasoningFailureReasonCode =
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
  | "invalid_response"
  | "invalid_structured_output"
  | "response_too_large"
  | "budget_exceeded"
  | "provider_unavailable"
  | "network_failed";

export type GlmAdvancedReasoningProviderStatusValue =
  | "ready"
  | "disabled"
  | "missing_credential"
  | "missing_model"
  | "unavailable"
  | "failed";

export interface GlmAdvancedReasoningCredential {
  readonly apiKey: string;
}

export interface GlmAdvancedReasoningCredentialProvider {
  getCredential(): Promise<GlmAdvancedReasoningCredential | undefined>;
}

export interface GlmAdvancedReasoningTransport {
  send(
    request: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult>;
}

export interface GlmAdvancedReasoningProviderOptions {
  readonly enabled?: boolean;
  readonly modelId?: string;
  readonly transport: GlmAdvancedReasoningTransport;
  readonly credentialProvider: GlmAdvancedReasoningCredentialProvider;
  readonly endpointProfile?: CloudProviderEndpointProfile;
  readonly now?: () => Date;
}

export interface GlmAdvancedReasoningProviderStatus {
  readonly providerId: typeof GLM_ADVANCED_BRAIN_PROVIDER_ID;
  readonly modelId?: GlmProviderModelCandidateId;
  readonly configured: boolean;
  readonly enabled: boolean;
  readonly supportedCategories: readonly AdvancedBrainTaskCategory[];
  readonly cloudEgressRequired: true;
  readonly status: GlmAdvancedReasoningProviderStatusValue;
  readonly lastProbeAt?: string;
  readonly lastSuccessAt?: string;
  readonly lastFailureReason?: GlmAdvancedReasoningFailureReasonCode;
  readonly credentialExposed: false;
}

export interface GlmAdvancedReasoningProbeResult
  extends GlmAdvancedReasoningProviderStatus {
  readonly probed: boolean;
  readonly requestSent: boolean;
}

export class GlmAdvancedReasoningProviderError extends Error {
  public constructor(
    public readonly reasonCode: GlmAdvancedReasoningFailureReasonCode,
  ) {
    super(`GLM_ADVANCED_REASONING_${reasonCode.toUpperCase()}`);
  }
}

export class GlmAdvancedReasoningProvider
  implements AdvancedReasoningProvider
{
  public readonly profile: AdvancedBrainProviderCapabilityProfile;
  private readonly enabled: boolean;
  private readonly modelId: GlmProviderModelCandidateId | undefined;
  private readonly transport: GlmAdvancedReasoningTransport;
  private readonly credentialProvider: GlmAdvancedReasoningCredentialProvider;
  private readonly endpointProfile: CloudProviderEndpointProfile;
  private readonly now: () => Date;
  private lastProbeAt: string | undefined;
  private lastSuccessAt: string | undefined;
  private lastFailureReason: GlmAdvancedReasoningFailureReasonCode | undefined;

  public constructor(options: GlmAdvancedReasoningProviderOptions) {
    this.enabled = options.enabled === true;
    this.transport = options.transport;
    this.credentialProvider = options.credentialProvider;
    this.endpointProfile =
      options.endpointProfile ?? createGlmAdvancedReasoningEndpointProfile();
    this.now = options.now ?? (() => new Date());
    this.modelId =
      options.modelId && isGlmProviderModelCandidateId(options.modelId)
        ? options.modelId
        : undefined;
    this.profile = createGlmAdvancedReasoningProfile({
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
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
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
      prepared.providerId !== GLM_ADVANCED_BRAIN_PROVIDER_ID ||
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

    const transportResult = await this.transport.send(
      createGlmAdvancedReasoningTransportRequest(prepared),
      {
        credential: toRuntimeCredential(credential),
        ...(options?.signal ? { signal: options.signal } : {}),
      },
    );
    if (transportResult.statusClass !== "success") {
      return this.resultFromTransportFailure(prepared, transportResult);
    }
    try {
      const result = parseGlmAdvancedReasoningResponse({
        responseJson: transportResult.responseJson,
        prepared,
        completedAt: this.now().toISOString(),
      });
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

  public async getStatus(): Promise<GlmAdvancedReasoningProviderStatus> {
    const credential = await this.credentialProvider.getCredential();
    return this.statusForCredential(credential);
  }

  public async probe(input: {
    readonly requestId: string;
    readonly timeoutMs?: number;
    readonly signal?: AbortSignal;
  }): Promise<GlmAdvancedReasoningProbeResult> {
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
        providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
        deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
        operation: GLM_ADVANCED_BRAIN_OPERATION,
        method: "POST",
        contentType: "application/json",
        bodyJson: createGlmProbeRequestBody(this.modelId),
        credentialBindingId: GLM_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
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
      this.lastFailureReason = mapTransportFailure(transportResult);
    }
    return {
      ...(await this.getStatus()),
      probed: true,
      requestSent: transportResult.requestSent,
    };
  }

  public toJSON(): {
    readonly providerId: typeof GLM_ADVANCED_BRAIN_PROVIDER_ID;
    readonly modelId?: GlmProviderModelCandidateId;
    readonly enabled: boolean;
    readonly credentialExposed: false;
    readonly endpointConfigured: true;
  } {
    return {
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      ...(this.modelId ? { modelId: this.modelId } : {}),
      enabled: this.enabled,
      credentialExposed: false,
      endpointConfigured: true,
    };
  }

  private async assertCanPrepare(request: AdvancedBrainRequest): Promise<void> {
    if (!this.enabled) {
      throw this.prepareError("provider_disabled");
    }
    if (!this.modelId) {
      throw this.prepareError("model_not_selected");
    }
    if (!isSupportedCategory(request.category)) {
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
    if (!this.endpointProfileIsValid()) {
      throw this.prepareError("provider_unavailable");
    }
    const credential = await this.credentialProvider.getCredential();
    if (!isCredentialConfigured(credential)) {
      throw this.prepareError("credential_missing");
    }
  }

  private endpointProfileIsValid(): boolean {
    return CloudProviderEndpointProfileSchema.safeParse(this.endpointProfile)
      .success;
  }

  private prepareError(
    reasonCode: GlmAdvancedReasoningFailureReasonCode,
  ): GlmAdvancedReasoningProviderError {
    this.lastFailureReason = reasonCode;
    return new GlmAdvancedReasoningProviderError(reasonCode);
  }

  private resultFromTransportFailure(
    prepared: AdvancedBrainPreparedRequest,
    transportResult: CloudReasoningTransportResult,
  ): AdvancedBrainProviderResult {
    const reason = mapTransportFailure(transportResult);
    this.lastFailureReason = reason;
    if (
      reason === "timeout" ||
      reason === "cancelled" ||
      reason === "provider_unavailable" ||
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

  private unavailable(
    prepared: AdvancedBrainPreparedRequest,
    _reason: GlmAdvancedReasoningFailureReasonCode,
    networkRequestIssued: boolean,
  ): AdvancedBrainProviderResult {
    return AdvancedBrainProviderResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
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
    reason: GlmAdvancedReasoningFailureReasonCode,
    input: { readonly networkRequestIssued: boolean },
  ): AdvancedBrainProviderResult {
    return AdvancedBrainProviderResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
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
    credential: GlmAdvancedReasoningCredential | undefined,
  ): GlmAdvancedReasoningProviderStatus {
    const configured = isCredentialConfigured(credential);
    const status: GlmAdvancedReasoningProviderStatusValue = !this.enabled
      ? "disabled"
      : !this.modelId
        ? "missing_model"
        : !configured
          ? "missing_credential"
          : this.lastFailureReason
            ? "failed"
            : "ready";
    return {
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      ...(this.modelId ? { modelId: this.modelId } : {}),
      configured,
      enabled: this.enabled,
      supportedCategories: GLM_ADVANCED_BRAIN_SUPPORTED_CATEGORIES,
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

export function createGlmAdvancedReasoningEndpointProfile(): CloudProviderEndpointProfile {
  return CloudProviderEndpointProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    trustClass: "provider_managed",
    allowedOrigins: [GLM_ADVANCED_BRAIN_ORIGIN],
    allowedOperationPaths: [
      {
        operation: GLM_ADVANCED_BRAIN_OPERATION,
        path: GLM_ADVANCED_BRAIN_OPERATION_PATH,
      },
    ],
    region: "mainland_china",
    requiresHttps: true,
    redirectPolicy: "none",
    maxRequestBytes: GLM_ADVANCED_BRAIN_MAX_REQUEST_BYTES,
    maxResponseBytes: GLM_ADVANCED_BRAIN_MAX_RESPONSE_BYTES,
    timeoutBounds: {
      minTimeoutMs: 1_000,
      defaultTimeoutMs: GLM_ADVANCED_BRAIN_DEFAULT_TIMEOUT_MS,
      maxTimeoutMs: 120_000,
    },
    credentialBindingId: GLM_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
  });
}

export function createGlmAdvancedReasoningProfile(input: {
  readonly enabled?: boolean;
  readonly modelId?: GlmProviderModelCandidateId;
  readonly healthStatus?: AdvancedBrainProviderCapabilityProfile["healthStatus"];
}): AdvancedBrainProviderCapabilityProfile {
  return AdvancedBrainProviderCapabilityProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    modelId: input.modelId ?? GLM_ADVANCED_BRAIN_UNSELECTED_MODEL_ID,
    deploymentClass: "cloud",
    executionSemantics: "real_provider",
    automaticRetry: false,
    automaticFallback: false,
    inputModalities: ["text", "structured_context"],
    outputModalities: ["text", "structured_context"],
    supportsStructuredOutput: true,
    supportsFunctionCalling: false,
    supportsReasoning: true,
    supportsStreaming: false,
    supportsCancellation: true,
    maxContextClass: "very_long",
    latencyClass: "standard",
    costClass: "medium",
    regionAvailability: ["mainland_china"],
    privacyClass: "cloud",
    taskCategories: GLM_ADVANCED_BRAIN_SUPPORTED_CATEGORIES,
    enabled: input.enabled === true,
    healthStatus: input.healthStatus ?? "unknown",
  });
}

export function createGlmCloudReasoningModelCapabilityProfile(input: {
  readonly enabled?: boolean;
  readonly modelId: GlmProviderModelCandidateId;
}): CloudReasoningModelCapabilityProfile {
  const thinkingPolicy =
    input.modelId === "glm-5.3" ? "mandatory" : "optional";
  return CloudReasoningModelCapabilityProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    modelId: input.modelId,
    protocolFamily: "openai_chat_completions",
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    trustClass: "provider_managed",
    region: "mainland_china",
    supportsStreaming: true,
    supportsNonStreaming: true,
    supportsThinking: true,
    thinkingPolicy,
    supportsReasoningEffort: false,
    supportsTools: false,
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsImages: false,
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    recommendedOutputTokens: input.modelId === "glm-5.3" ? 1_024 : 256,
    requestTimeoutPolicyId: "reasoning-default-v1",
    credentialBindingId: GLM_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
    endpointProfileId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    executionSemantics: "real_provider",
    dataEgressClass: "cloud_user_content",
    pricingTier: "medium",
    enabled: input.enabled === true,
  });
}

export function createGlmAdvancedReasoningTransportRequest(
  prepared: AdvancedBrainPreparedRequest,
): CloudReasoningTransportRequest {
  const parsed = AdvancedBrainPreparedRequestSchema.parse(prepared);
  return CloudReasoningTransportRequestSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: parsed.request.requestId,
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    method: "POST",
    contentType: "application/json",
    bodyJson: createGlmAdvancedReasoningRequestBody(parsed),
    credentialBindingId: GLM_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
    timeoutMs: parsed.request.timeoutMs,
    maxResponseBytes: GLM_ADVANCED_BRAIN_MAX_RESPONSE_BYTES,
  });
}

export function createGlmAdvancedReasoningRequestBody(
  prepared: AdvancedBrainPreparedRequest,
): Record<string, unknown> {
  const parsed = AdvancedBrainPreparedRequestSchema.parse(prepared);
  const request = parsed.request;
  return {
    model: parsed.modelId,
    messages: [
      {
        role: "system",
        content: [
          "Return one JSON object only.",
          "Do not call tools, functions, plugins, browsers, shell, filesystem, or Windows automation.",
          "Set directActionAttempted to false.",
          "For plans, return an approval-bound BrainPlan proposal only.",
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
    response_format: { type: "json_object" },
    stream: false,
    temperature: 0,
    max_tokens: maxTokensForBudget(request.tokenBudgetClass),
  };
}

export function parseGlmAdvancedReasoningResponse(input: {
  readonly responseJson: unknown;
  readonly prepared: AdvancedBrainPreparedRequest;
  readonly completedAt: string;
}): AdvancedBrainProviderResult {
  const prepared = AdvancedBrainPreparedRequestSchema.parse(input.prepared);
  const message = extractGlmAssistantMessage(input.responseJson);
  if (message.model !== undefined && message.model !== prepared.modelId) {
    throw new GlmAdvancedReasoningProviderError("provider_model_mismatch");
  }
  if (message.toolCallsPresent) {
    return AdvancedBrainProviderResultSchema.parse({
      ...baseResult(prepared, input.completedAt),
      resultClass: "failed",
      reasonCode: "INVALID_OUTPUT",
      untrustedProposals: [
        {
          proposalType: "tool_call",
          proposalId: `${prepared.request.requestId}:tool_call`,
          requiresPlannerApproval: true,
          directActionAttempted: false,
        },
      ],
      networkRequestIssued: true,
    });
  }
  const parsedContent = parseAssistantJsonContent(message.content);
  return normalizeGlmAdvancedReasoningOutput(
    parsedContent,
    prepared,
    input.completedAt,
  );
}

export function mapTransportFailure(
  transportResult: CloudReasoningTransportResult,
): GlmAdvancedReasoningFailureReasonCode {
  if (transportResult.reasonCode === "timeout") {
    return "timeout";
  }
  if (transportResult.reasonCode === "cancelled") {
    return "cancelled";
  }
  if (transportResult.reasonCode === "authentication_transport_failure") {
    return transportResult.httpStatus === 403
      ? "permission_denied"
      : "authentication_failed";
  }
  if (transportResult.reasonCode === "rate_limited") {
    return "rate_limited";
  }
  if (transportResult.reasonCode === "response_too_large") {
    return "response_too_large";
  }
  if (transportResult.reasonCode === "invalid_response") {
    return "invalid_response";
  }
  if (transportResult.statusClass === "network_error") {
    return "network_failed";
  }
  if (
    transportResult.statusClass === "server_error" ||
    transportResult.statusClass === "blocked"
  ) {
    return "provider_unavailable";
  }
  return "provider_unavailable";
}

function normalizeGlmAdvancedReasoningOutput(
  output: unknown,
  prepared: AdvancedBrainPreparedRequest,
  completedAt: string,
): AdvancedBrainProviderResult {
  if (!isRecord(output)) {
    throw new GlmAdvancedReasoningProviderError("invalid_response");
  }
  if (output.directActionAttempted !== undefined && output.directActionAttempted !== false) {
    throw new GlmAdvancedReasoningProviderError("invalid_structured_output");
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
  throw new GlmAdvancedReasoningProviderError("invalid_response");
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
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
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

function extractGlmAssistantMessage(body: unknown): {
  readonly model?: string;
  readonly content: string;
  readonly toolCallsPresent: boolean;
} {
  if (!isRecord(body) || !Array.isArray(body.choices)) {
    throw new GlmAdvancedReasoningProviderError("invalid_response");
  }
  const choice = body.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    throw new GlmAdvancedReasoningProviderError("invalid_response");
  }
  const message = choice.message;
  if (message.role !== "assistant" || typeof message.content !== "string") {
    throw new GlmAdvancedReasoningProviderError("invalid_response");
  }
  return {
    ...(typeof body.model === "string" ? { model: body.model } : {}),
    content: message.content,
    toolCallsPresent:
      Object.prototype.hasOwnProperty.call(message, "tool_calls") ||
      Object.prototype.hasOwnProperty.call(message, "function_call"),
  };
}

function parseAssistantJsonContent(content: string): unknown {
  if (content.length > GLM_ADVANCED_BRAIN_MAX_RESPONSE_BYTES) {
    throw new GlmAdvancedReasoningProviderError("response_too_large");
  }
  try {
    return JSON.parse(extractJsonObjectText(content));
  } catch {
    throw new GlmAdvancedReasoningProviderError("invalid_response");
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
    throw new Error("GLM_ADVANCED_REASONING_OUTPUT_JSON_MISSING");
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
  throw new Error("GLM_ADVANCED_REASONING_OUTPUT_JSON_INCOMPLETE");
}

function normalizeResultClass(output: Record<string, unknown>): AdvancedBrainProviderResult["resultClass"] {
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
  if (normalized === "clarify") {
    return "clarification";
  }
  if (normalized === "refuse") {
    return "refusal";
  }
  if (normalized === "block") {
    return "blocked";
  }
  if (typeof output.answer === "string" || typeof output.content === "string") {
    return "answer";
  }
  if (isRecord(output.structuredPlan) || isRecord(output.plan)) {
    return "structured_plan";
  }
  if (
    typeof output.clarifyQuestion === "string" ||
    typeof output.question === "string"
  ) {
    return "clarification";
  }
  if (
    typeof output.refusalSummary === "string" ||
    typeof output.reason === "string"
  ) {
    return "refusal";
  }
  return "failed";
}

function normalizeStructuredPlan(value: unknown): BrainPlan {
  const parsed = BrainPlanSchema.safeParse(value);
  if (!parsed.success) {
    throw new GlmAdvancedReasoningProviderError("invalid_structured_output");
  }
  if (parsed.data.directActionAttempted !== false) {
    throw new GlmAdvancedReasoningProviderError("invalid_structured_output");
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

function createGlmProbeRequestBody(
  modelId: GlmProviderModelCandidateId,
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
        content: JSON.stringify({ probe: "advanced_brain_glm_health" }),
      },
    ],
    response_format: { type: "json_object" },
    stream: false,
    temperature: 0,
    max_tokens: 64,
  };
}

function safeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    throw new GlmAdvancedReasoningProviderError("invalid_response");
  }
  const normalized = value.trim().replace(/\s+/gu, " ").slice(0, maxLength);
  if (normalized.length === 0) {
    throw new GlmAdvancedReasoningProviderError("invalid_response");
  }
  return normalized;
}

function maxTokensForBudget(budget: AdvancedBrainRequest["tokenBudgetClass"]): number {
  if (budget === "tiny") {
    return 256;
  }
  if (budget === "small") {
    return 512;
  }
  if (budget === "medium") {
    return 1_024;
  }
  return 2_048;
}

function toRuntimeCredential(
  credential: GlmAdvancedReasoningCredential,
): CloudReasoningRuntimeCredential {
  return {
    scheme: "bearer",
    value: credential.apiKey,
  };
}

function isCredentialConfigured(
  credential: GlmAdvancedReasoningCredential | undefined,
): credential is GlmAdvancedReasoningCredential {
  return (
    typeof credential?.apiKey === "string" &&
    credential.apiKey.trim().length >= 8 &&
    credential.apiKey.length <= 1024
  );
}

function isSupportedCategory(
  category: AdvancedBrainTaskCategory,
): category is (typeof GLM_ADVANCED_BRAIN_SUPPORTED_CATEGORIES)[number] {
  return GLM_ADVANCED_BRAIN_SUPPORTED_CATEGORIES.some(
    (supported) => supported === category,
  );
}

function isInvalidStructuredOutput(error: unknown): boolean {
  return (
    error instanceof GlmAdvancedReasoningProviderError &&
    error.reasonCode === "invalid_structured_output"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
