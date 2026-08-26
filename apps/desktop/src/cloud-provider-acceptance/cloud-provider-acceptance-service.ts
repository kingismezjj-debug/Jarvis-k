import {
  CloudReasoningRuntime,
  type CloudReasoningFetch,
  type CloudReasoningRuntimeRequest,
  type CloudReasoningTransportSendOptions,
} from "@jarvis-k/capabilities";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
  CloudProviderAcceptanceCommandResultSchema,
  CloudProviderAcceptanceConsentRequestSchema,
  CloudProviderAcceptanceDiagnosticReportSchema,
  CloudProviderAcceptancePreflightResultSchema,
  CloudProviderAcceptanceSaveCredentialRequestSchema,
  CloudProviderAcceptanceStatusSchema,
  CloudProviderEndpointProfileSchema,
  CloudReasoningModelCapabilityProfileSchema,
  CloudReasoningTimeoutPolicySchema,
  CloudReasoningTransportRequestSchema,
  CloudReasoningTransportResultSchema,
  type CloudProviderAcceptanceCommandResult,
  type CloudProviderAcceptanceConsentRequest,
  type CloudProviderAcceptanceDiagnosticReport,
  type CloudProviderAcceptancePreflightResult,
  type CloudProviderAcceptanceProfile,
  type CloudProviderAcceptanceReasonCode,
  type CloudProviderAcceptanceStatus,
  type CloudReasoningTransportResult,
} from "@jarvis-k/contracts";
import type { CloudProviderCredentialBroker } from "./cloud-provider-credential-broker";
import type { CloudProviderAcceptanceLedger } from "./cloud-provider-acceptance-ledger";
import type { CloudProviderAcceptanceProfileRegistry } from "./cloud-provider-acceptance-profile-registry";
import type { CloudProviderCredentialVault } from "./cloud-provider-credential-vault";
import type { CloudProviderCredentialBindingRegistry } from "./credential-binding-registry";
import type { CloudProviderAcceptanceReleaseChannel } from "./credential-binding-registry";

const DEEPSEEK_DEPLOYMENT_ID = "deepseek-openai-chat-completions-v1";
const DEEPSEEK_OPERATION = "chat.completions";
const MAX_RESPONSE_BYTES = 128_000;

export interface CloudProviderAcceptanceTransport {
  send(
    request: Parameters<CloudReasoningRuntime["runOpenAiChatCompletions"]>[0]["transportRequest"],
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult>;
}

export class CloudProviderAcceptanceService {
  private running = false;

  public constructor(
    private readonly options: {
      readonly bindingRegistry: CloudProviderCredentialBindingRegistry;
      readonly credentialVault: CloudProviderCredentialVault;
      readonly credentialBroker: CloudProviderCredentialBroker;
      readonly profileRegistry: CloudProviderAcceptanceProfileRegistry;
      readonly ledger: CloudProviderAcceptanceLedger;
      readonly capabilityFlagEnabled: boolean;
      readonly realRunCapabilityEnabled: boolean;
      readonly releaseChannel: CloudProviderAcceptanceReleaseChannel;
      readonly fakeAcceptanceCapabilityEnabled?: boolean;
      readonly now?: () => Date;
      readonly transport?: CloudProviderAcceptanceTransport;
      readonly fetch?: CloudReasoningFetch;
    },
  ) {}

  public async getStatus(): Promise<CloudProviderAcceptanceStatus> {
    const [credentialStatuses, ledger] = await Promise.all([
      this.options.credentialVault.listStatuses(),
      this.options.ledger.projection(this.currentProfile()),
    ]);
    return CloudProviderAcceptanceStatusSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      capabilityFlagEnabled: this.options.capabilityFlagEnabled,
      source: "desktop-main",
      productRoutingEnabled: false,
      realRunCapabilityEnabled: this.options.realRunCapabilityEnabled,
      realAcceptanceCapabilityEnabled: this.realAcceptanceCapabilityEnabled(),
      fakeAcceptanceCapabilityEnabled: this.fakeAcceptanceCapabilityEnabled(),
      releaseChannel: this.options.releaseChannel,
      secureStorageAvailable: credentialStatuses.some(
        (status) => status.secureStorageAvailable,
      ),
      profiles: this.options.profileRegistry.list(),
      credentialBindings: this.options.bindingRegistry.list(),
      credentialStatuses,
      ledger,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
      rendererWritableTrustedGates: false,
    });
  }

  public async saveCredential(
    rawInput: unknown,
  ): Promise<CloudProviderAcceptanceCommandResult> {
    const parsed =
      CloudProviderAcceptanceSaveCredentialRequestSchema.safeParse(rawInput);
    if (!parsed.success) {
      return this.commandResult(false, "Cloud provider credential was rejected.");
    }
    const result = await this.options.credentialVault.save(parsed.data);
    return this.commandResult(
      result.ok,
      result.ok ? undefined : "Cloud provider credential was rejected.",
    );
  }

  public async deleteCredential(rawInput: unknown) {
    const bindingId = this.currentProfile().credentialBindingId;
    const parsedBinding =
      typeof rawInput === "object" &&
      rawInput !== null &&
      (rawInput as { bindingId?: unknown }).bindingId === bindingId;
    if (!parsedBinding) {
      return this.commandResult(false, "Cloud provider credential delete was rejected.");
    }
    await this.options.credentialVault.delete(bindingId);
    return this.commandResult(true);
  }

  public async preflight(
    rawInput: unknown,
  ): Promise<CloudProviderAcceptancePreflightResult> {
    const consent = CloudProviderAcceptanceConsentRequestSchema.parse(rawInput);
    return this.computePreflight(consent);
  }

  public async runFakeAcceptance(
    rawInput: unknown,
  ): Promise<CloudProviderAcceptanceDiagnosticReport> {
    const consent = CloudProviderAcceptanceConsentRequestSchema.parse(rawInput);
    const profile = this.currentProfile();
    if (this.running) {
      throw new Error("CLOUD_PROVIDER_ACCEPTANCE_ALREADY_RUNNING");
    }
    this.running = true;
    const startedAt = this.now();
    try {
      const preflight = await this.computePreflight(consent, {
        ignoreCurrentRun: true,
      });
      if (!preflight.allowFakeAcceptance) {
        throw new Error("CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_FAILED");
      }
      await this.options.ledger.consume(profile);
      const runtime = this.createRuntime("fake");
      const runtimeResult = await this.options.credentialBroker.withCredential(
        profile.credentialBindingId,
        (credential) =>
          runtime.runOpenAiChatCompletions(createDeepSeekRuntimeRequest(profile), {
            credential,
          }),
      );
      const completedAt = this.now();
      const structuredResultValid = validateFixedDiagnosticFinalContent(
        runtimeResult.output.finalContent,
      );
      const sanitizedResultCategory =
        runtimeResult.transport.statusClass === "success" &&
        runtimeResult.output.ok &&
        structuredResultValid
          ? "fixed_diagnostic_ok"
          : runtimeResult.transport.statusClass === "success"
            ? runtimeResult.output.category
            : runtimeResult.transport.reasonCode;
      await this.options.ledger.complete(profile, {
        completedAt,
        sanitizedResultCategory,
      });
      return CloudProviderAcceptanceDiagnosticReportSchema.parse({
        schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
        acceptanceId: profile.acceptanceId,
        acceptanceVersion: profile.acceptanceVersion,
        acceptanceState: "consumed",
        providerId: profile.providerId,
        modelId: profile.modelId,
        endpointProfileId: profile.endpointProfileId,
        requestContractId: profile.requestContractId,
        startedAt,
        completedAt,
        latencyMs: runtimeResult.transport.latencyMs,
        ...(runtimeResult.transport.httpStatus
          ? { httpStatus: runtimeResult.transport.httpStatus }
          : {}),
        httpStatusClass: runtimeResult.transport.statusClass,
        reasonCode: runtimeResult.transport.reasonCode,
        sanitizedResultCategory,
        structuredResultValidation:
          sanitizedResultCategory === "fixed_diagnostic_ok" ? "PASS" : "FAIL",
        tokenUsage: {
          promptTokens: runtimeResult.output.usage?.promptTokens ?? 0,
          completionTokens: runtimeResult.output.usage?.completionTokens ?? 0,
          totalTokens: runtimeResult.output.usage?.totalTokens ?? 0,
        },
        requestSent: runtimeResult.transport.requestSent,
        responseStarted: runtimeResult.transport.responseStarted,
        headersReceived: runtimeResult.transport.responseStarted,
        firstEventReceived:
          runtimeResult.transport.responseStarted &&
          runtimeResult.output.finalContentBytes > 0,
        responseCompleted: runtimeResult.transport.responseCompleted,
        streamCompleted: runtimeResult.transport.responseCompleted,
        doneObserved:
          runtimeResult.transport.responseCompleted &&
          runtimeResult.transport.statusClass === "success",
        contentTypeAllowed:
          runtimeResult.transport.safeHeaders.contentType === "text/event-stream",
        responseByteCount: runtimeResult.transport.responseByteCount ?? 0,
        reasoningObserved: runtimeResult.output.reasoningObserved,
        finalContentPresent:
          typeof runtimeResult.output.finalContent === "string" &&
          runtimeResult.output.finalContent.length > 0,
        finalContentBytes: runtimeResult.output.finalContentBytes,
        toolProposalObserved: runtimeResult.output.toolProposalObserved,
        retryCount: 0,
        fallbackCount: 0,
        toolCallCount: 0,
        directActionAttempted: false,
        executorInvocationDelta: 0,
        acceptanceConsumed: true,
        realNetworkRequestSent: false,
        credentialExposed: false,
        promptExposed: false,
        rawResponseExposed: false,
        rawSsePersisted: false,
      });
    } finally {
      this.running = false;
    }
  }

  public async runRealAcceptance(
    rawInput: unknown,
  ): Promise<CloudProviderAcceptanceDiagnosticReport> {
    const consent = CloudProviderAcceptanceConsentRequestSchema.parse(rawInput);
    const profile = this.currentProfile();
    if (this.running) {
      throw new Error("CLOUD_PROVIDER_ACCEPTANCE_ALREADY_RUNNING");
    }
    this.running = true;
    const startedAt = this.now();
    try {
      const preflight = await this.computePreflight(consent, {
        ignoreCurrentRun: true,
      });
      if (!preflight.allowSingleRealAcceptance) {
        throw new Error("CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_FAILED");
      }
      await this.options.ledger.consume(profile);
      const runtime = this.createRuntime("real");
      const runtimeResult = await this.options.credentialBroker.withCredential(
        profile.credentialBindingId,
        (credential) =>
          runtime.runOpenAiChatCompletions(createDeepSeekRuntimeRequest(profile), {
            credential,
          }),
      );
      const completedAt = this.now();
      const structuredResultValid = validateFixedDiagnosticFinalContent(
        runtimeResult.output.finalContent,
      );
      const sanitizedResultCategory =
        runtimeResult.transport.statusClass === "success" &&
        runtimeResult.output.ok &&
        structuredResultValid
          ? "fixed_diagnostic_ok"
          : runtimeResult.transport.statusClass === "success"
            ? runtimeResult.output.category
            : runtimeResult.transport.reasonCode;
      await this.options.ledger.complete(profile, {
        completedAt,
        sanitizedResultCategory,
      });
      return CloudProviderAcceptanceDiagnosticReportSchema.parse({
        schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
        acceptanceId: profile.acceptanceId,
        acceptanceVersion: profile.acceptanceVersion,
        acceptanceState: "consumed",
        providerId: profile.providerId,
        modelId: profile.modelId,
        endpointProfileId: profile.endpointProfileId,
        requestContractId: profile.requestContractId,
        startedAt,
        completedAt,
        latencyMs: runtimeResult.transport.latencyMs,
        ...(runtimeResult.transport.httpStatus
          ? { httpStatus: runtimeResult.transport.httpStatus }
          : {}),
        httpStatusClass: runtimeResult.transport.statusClass,
        reasonCode: runtimeResult.transport.reasonCode,
        sanitizedResultCategory,
        structuredResultValidation:
          sanitizedResultCategory === "fixed_diagnostic_ok" ? "PASS" : "FAIL",
        tokenUsage: {
          promptTokens: runtimeResult.output.usage?.promptTokens ?? 0,
          completionTokens: runtimeResult.output.usage?.completionTokens ?? 0,
          totalTokens: runtimeResult.output.usage?.totalTokens ?? 0,
        },
        requestSent: runtimeResult.transport.requestSent,
        responseStarted: runtimeResult.transport.responseStarted,
        headersReceived: runtimeResult.transport.responseStarted,
        firstEventReceived:
          runtimeResult.transport.responseStarted &&
          runtimeResult.output.finalContentBytes > 0,
        responseCompleted: runtimeResult.transport.responseCompleted,
        streamCompleted: runtimeResult.transport.responseCompleted,
        doneObserved:
          runtimeResult.transport.responseCompleted &&
          runtimeResult.transport.statusClass === "success",
        contentTypeAllowed:
          runtimeResult.transport.safeHeaders.contentType === "text/event-stream",
        responseByteCount: runtimeResult.transport.responseByteCount ?? 0,
        reasoningObserved: runtimeResult.output.reasoningObserved,
        finalContentPresent:
          typeof runtimeResult.output.finalContent === "string" &&
          runtimeResult.output.finalContent.length > 0,
        finalContentBytes: runtimeResult.output.finalContentBytes,
        toolProposalObserved: runtimeResult.output.toolProposalObserved,
        retryCount: 0,
        fallbackCount: 0,
        toolCallCount: 0,
        directActionAttempted: false,
        executorInvocationDelta: 0,
        acceptanceConsumed: true,
        realNetworkRequestSent: this.realNetworkTransportUsed(),
        credentialExposed: false,
        promptExposed: false,
        rawResponseExposed: false,
        rawSsePersisted: false,
      });
    } finally {
      this.running = false;
    }
  }

  private async commandResult(
    ok: boolean,
    safeMessage?: string,
  ): Promise<CloudProviderAcceptanceCommandResult> {
    return CloudProviderAcceptanceCommandResultSchema.parse({
      ok,
      status: await this.getStatus(),
      ...(safeMessage ? { safeMessage } : {}),
    });
  }

  private async computePreflight(
    consent: CloudProviderAcceptanceConsentRequest,
    options: { readonly ignoreCurrentRun?: boolean } = {},
  ): Promise<CloudProviderAcceptancePreflightResult> {
    const profile = this.currentProfile();
    const status = await this.getStatus();
    const credentialStatus = status.credentialStatuses.find(
      (item) => item.bindingId === profile.credentialBindingId,
    );
    const reasons: CloudProviderAcceptanceReasonCode[] = [];
    if (!this.options.capabilityFlagEnabled) {
      reasons.push("capability_flag_missing", "provider_disabled");
    }
    if (!profile.enabledByReleaseGate) {
      reasons.push("provider_disabled");
    }
    if (!this.realAcceptanceCapabilityEnabled()) {
      reasons.push("real_run_disabled");
    }
    if (this.options.releaseChannel !== "development") {
      reasons.push("unsupported_release_channel");
    }
    if (!credentialStatus?.secureStorageAvailable) {
      reasons.push("secure_store_unavailable");
    } else if (credentialStatus.status === "invalid") {
      reasons.push("credential_invalid");
    } else if (!credentialStatus.configured) {
      reasons.push("credential_missing");
    } else if (credentialStatus.credentialType !== CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE) {
      reasons.push("credential_type_unconfirmed");
    } else if (!credentialStatus.encrypted) {
      reasons.push("credential_invalid");
    }
    if (!this.fullEndpointMatches(profile)) {
      reasons.push("endpoint_profile_mismatch");
    }
    if (!this.fixedRequestMatches(profile)) {
      reasons.push("request_contract_invalid");
    }
    if (!consent.cloudEgressAllowed) {
      reasons.push("cloud_egress_not_allowed");
    }
    if (!consent.acceptanceConsent) {
      reasons.push("consent_missing");
    }
    if (!consent.providerKeyTypeConfirmed) {
      reasons.push("credential_type_unconfirmed");
    }
    if (!consent.apiBalanceConfirmedByUser) {
      reasons.push("api_balance_unconfirmed");
    }
    if (this.running && options.ignoreCurrentRun !== true) {
      reasons.push("acceptance_already_running");
    }
    if (status.ledger.consumed) {
      reasons.push("acceptance_already_consumed");
    }
    const uniqueReasons = [...new Set(reasons)];
    const realReady = uniqueReasons.length === 0;
    const fakeReasons = uniqueReasons.filter(
      (reason) =>
        reason !== "real_run_disabled" &&
        reason !== "unsupported_release_channel" &&
        reason !== "api_balance_unconfirmed",
    );
    const fakeReady = fakeReasons.length === 0 && this.fakeAcceptanceCapabilityEnabled();
    return CloudProviderAcceptancePreflightResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      acceptanceId: profile.acceptanceId,
      acceptanceVersion: profile.acceptanceVersion,
      acceptanceState: status.ledger.consumed
        ? "consumed"
        : realReady
          ? "ready"
          : "blocked",
      providerId: profile.providerId,
      modelId: profile.modelId,
      endpointProfileId: profile.endpointProfileId,
      endpointOrigin: profile.endpointOrigin,
      operationPath: profile.operationPath,
      httpMethod: "POST",
      redirectPolicy: "none",
      fullEndpointMatch: this.fullEndpointMatches(profile),
      credentialBindingId: profile.credentialBindingId,
      credentialConfigured: credentialStatus?.configured === true,
      credentialStorageEncrypted: credentialStatus?.encrypted === true,
      secureStorageAvailable: credentialStatus?.secureStorageAvailable === true,
      providerKeyTypeConfirmed: consent.providerKeyTypeConfirmed,
      apiBalanceConfirmedByUser: consent.apiBalanceConfirmedByUser,
      ...(credentialStatus?.configured === true
        ? { credentialTypeConfirmed: credentialStatus.credentialType }
        : {}),
      protocolFamily: profile.protocolFamily,
      requestContractId: profile.requestContractId,
      fixedInput: true,
      userContentIncluded: false,
      stream: profile.stream,
      streamUsageIncluded: profile.streamUsageIncluded,
      includeUsage: true,
      thinkingType: profile.thinkingType,
      reasoningEffortPresent: profile.reasoningEffortPresent,
      reasoningEffort: "absent",
      maxTokens: profile.maxTokens,
      timeoutHeadersMs: profile.timeoutPolicy.headersMs,
      timeoutFirstEventMs: profile.timeoutPolicy.firstEventMs,
      timeoutIdleMs: profile.timeoutPolicy.idleMs,
      timeoutOverallMs: profile.timeoutPolicy.overallMs,
      timeoutBounded: true,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      executorReachable: false,
      productRoutingEnabled: false,
      cloudEgressConfirmed: consent.cloudEgressAllowed,
      realAcceptanceCapability: this.realAcceptanceCapabilityEnabled(),
      pricingTier: profile.pricingTier,
      priorRequestCount: status.ledger.requestCount,
      consumed: status.ledger.consumed,
      allowSingleRealAcceptance: realReady,
      allowFakeAcceptance: fakeReady,
      realNetworkRequestSent: false,
      reasonCodes: realReady ? ["ready"] : uniqueReasons,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });
  }

  private currentProfile(): CloudProviderAcceptanceProfile {
    const profile = this.options.profileRegistry.get(
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
    );
    if (!profile) {
      throw new Error("CLOUD_PROVIDER_ACCEPTANCE_PROFILE_MISSING");
    }
    return profile;
  }

  private createRuntime(kind: "fake" | "real"): CloudReasoningRuntime {
    const profile = this.currentProfile();
    const transport =
      kind === "fake"
        ? this.options.transport ?? new DeepSeekFakeAcceptanceTransport()
        : this.options.transport;
    const fetchImpl =
      kind === "real" && !transport
        ? this.options.fetch ?? realDeepSeekFetch()
        : undefined;
    return new CloudReasoningRuntime({
      endpointProfiles: [createEndpointProfile()],
      modelProfiles: [createModelProfile(profile)],
      timeoutPolicies: [createTimeoutPolicy(profile)],
      ...(transport ? { transport } : {}),
      ...(fetchImpl ? { fetch: fetchImpl } : {}),
      now: () => new Date(this.now()),
    });
  }

  private realAcceptanceCapabilityEnabled(): boolean {
    return (
      this.options.capabilityFlagEnabled &&
      this.options.realRunCapabilityEnabled &&
      this.options.releaseChannel === "development"
    );
  }

  private fakeAcceptanceCapabilityEnabled(): boolean {
    return (
      this.options.fakeAcceptanceCapabilityEnabled ??
      !this.options.realRunCapabilityEnabled
    );
  }

  private realNetworkTransportUsed(): boolean {
    return this.options.transport === undefined && this.options.fetch === undefined;
  }

  private fullEndpointMatches(profile: CloudProviderAcceptanceProfile): boolean {
    const endpoint = new URL(profile.operationPath, `${profile.endpointOrigin}/`);
    return (
      endpoint.href === `${CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN}${CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH}` &&
      endpoint.protocol === "https:" &&
      endpoint.search === "" &&
      endpoint.hash === ""
    );
  }

  private fixedRequestMatches(profile: CloudProviderAcceptanceProfile): boolean {
    const request = createDeepSeekRuntimeRequest(profile);
    const body = request.transportRequest.bodyJson;
    return (
      request.stream === true &&
      body.model === CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID &&
      body.stream === true &&
      isRecord(body.thinking) &&
      body.thinking.type === "disabled" &&
      body.max_tokens === 512 &&
      !Object.prototype.hasOwnProperty.call(body, "reasoning_effort") &&
      !Object.prototype.hasOwnProperty.call(body, "response_format") &&
      !Object.prototype.hasOwnProperty.call(body, "tools") &&
      !Object.prototype.hasOwnProperty.call(body, "tool_choice") &&
      !Object.prototype.hasOwnProperty.call(body, "function_call")
    );
  }

  private now(): string {
    return (this.options.now?.() ?? new Date()).toISOString();
  }
}

function realDeepSeekFetch(): CloudReasoningFetch {
  const fetchImpl = globalThis.fetch?.bind(globalThis);
  if (!fetchImpl) {
    return async () => {
      throw new Error("CLOUD_PROVIDER_ACCEPTANCE_FETCH_UNAVAILABLE");
    };
  }
  return (url, init) => fetchImpl(url, init as RequestInit);
}

export class DeepSeekFakeAcceptanceTransport {
  public invocationCount = 0;

  public async send(
    request: CloudReasoningRuntimeRequest["transportRequest"],
    _options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    this.invocationCount += 1;
    const content = JSON.stringify({
      diagnostic: "ok",
      directActionAttempted: false,
      toolCallCount: 0,
    });
    const sseText = [
      `data: ${JSON.stringify({
        choices: [{ delta: { content }, finish_reason: undefined }],
      })}`,
      "",
      `data: ${JSON.stringify({
        choices: [{ delta: {}, finish_reason: "stop" }],
        usage: {
          prompt_tokens: 8,
          completion_tokens: 10,
          total_tokens: 18,
        },
      })}`,
      "",
      "data: [DONE]",
      "",
    ].join("\n");
    return CloudReasoningTransportResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      requestId: request.requestId,
      providerId: request.providerId,
      deploymentId: request.deploymentId,
      operation: request.operation,
      statusClass: "success",
      reasonCode: "completed",
      httpStatus: 200,
      responseJson: { sseText },
      safeHeaders: { contentType: "text/event-stream" },
      latencyMs: 1,
      responseByteCount: new TextEncoder().encode(sseText).byteLength,
      requestSent: true,
      responseStarted: true,
      responseCompleted: true,
      cancelled: false,
      timeout: false,
      automaticRetry: false,
      automaticFallback: false,
      credentialExposed: false,
      requestBodyExposed: false,
      responseBodyLogged: false,
    });
  }
}

function createEndpointProfile() {
  return CloudProviderEndpointProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
    deploymentId: DEEPSEEK_DEPLOYMENT_ID,
    trustClass: "provider_managed",
    allowedOrigins: [CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN],
    allowedOperationPaths: [
      {
        operation: DEEPSEEK_OPERATION,
        path: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
      },
    ],
    region: "mainland_china",
    requiresHttps: true,
    redirectPolicy: "none",
    maxRequestBytes: 64_000,
    maxResponseBytes: MAX_RESPONSE_BYTES,
    timeoutBounds: {
      minTimeoutMs: 1_000,
      defaultTimeoutMs: 45_000,
      maxTimeoutMs: 180_000,
    },
    credentialBindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  });
}

function createModelProfile(profile: CloudProviderAcceptanceProfile) {
  return CloudReasoningModelCapabilityProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: profile.providerId,
    modelId: profile.modelId,
    protocolFamily: profile.protocolFamily,
    deploymentId: DEEPSEEK_DEPLOYMENT_ID,
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
    recommendedOutputTokens: profile.maxTokens,
    requestTimeoutPolicyId: profile.timeoutPolicy.policyId,
    credentialBindingId: profile.credentialBindingId,
    endpointProfileId: profile.endpointProfileId,
    executionSemantics: "real_provider",
    dataEgressClass: "cloud_user_content",
    pricingTier: profile.pricingTier,
    enabled: true,
  });
}

function createTimeoutPolicy(profile: CloudProviderAcceptanceProfile) {
  return CloudReasoningTimeoutPolicySchema.parse({
    policyId: profile.timeoutPolicy.policyId,
    connectOrHeadersTimeoutMs: profile.timeoutPolicy.headersMs,
    firstEventTimeoutMs: profile.timeoutPolicy.firstEventMs,
    streamIdleTimeoutMs: profile.timeoutPolicy.idleMs,
    overallTimeoutMs: profile.timeoutPolicy.overallMs,
  });
}

function createDeepSeekRuntimeRequest(
  profile: CloudProviderAcceptanceProfile,
): CloudReasoningRuntimeRequest {
  return {
    transportRequest: CloudReasoningTransportRequestSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      requestId: profile.acceptanceId,
      providerId: profile.providerId,
      deploymentId: DEEPSEEK_DEPLOYMENT_ID,
      operation: DEEPSEEK_OPERATION,
      method: "POST",
      contentType: "application/json",
      bodyJson: {
        model: profile.modelId,
        messages: [
          {
            role: "system",
            content:
              "Return fixed diagnostic JSON only. Do not call tools or include user content.",
          },
          {
            role: "user",
            content: JSON.stringify({
              diagnostic: "deepseek_advanced_brain_acceptance_v1",
            }),
          },
        ],
        stream: true,
        stream_options: { include_usage: true },
        max_tokens: profile.maxTokens,
        thinking: { type: "disabled" },
      },
      credentialBindingId: profile.credentialBindingId,
      timeoutMs: profile.timeoutPolicy.overallMs,
      maxResponseBytes: MAX_RESPONSE_BYTES,
    }),
    modelProfile: createModelProfile(profile),
    timeoutPolicyId: profile.timeoutPolicy.policyId,
    stream: true,
    maxFinalContentChars: 4_000,
    retryPolicy: {
      automaticRetry: false,
      maxAttempts: 1,
    },
    toolsEnabled: false,
  };
}

function validateFixedDiagnosticFinalContent(content: string | undefined): boolean {
  if (!content) {
    return false;
  }
  try {
    const parsed = JSON.parse(content);
    return (
      isRecord(parsed) &&
      parsed.diagnostic === "ok" &&
      parsed.directActionAttempted === false &&
      parsed.toolCallCount === 0
    );
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
