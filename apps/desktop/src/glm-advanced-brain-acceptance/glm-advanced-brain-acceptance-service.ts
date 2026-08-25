import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudReasoningTransportRequestSchema,
  CloudReasoningTransportResultSchema,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_DEPLOYMENT_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_ENDPOINT_PROFILE_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM52_MAX_TOKENS,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_REASONING_EFFORT,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_PROVIDER_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_REDIRECT_POLICY,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
  GlmAdvancedBrainAcceptanceCommandResultSchema,
  GlmAdvancedBrainAcceptanceConsentRequestSchema,
  GlmAdvancedBrainAcceptanceDiagnosticReportSchema,
  GlmAdvancedBrainAcceptanceProviderErrorCategorySchema,
  GlmAdvancedBrainAcceptancePreflightResultSchema,
  GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema,
  GlmAdvancedBrainAcceptanceSetModelRequestSchema,
  GlmAdvancedBrainAcceptanceStatusSchema,
  type CloudReasoningTransportRequest,
  type CloudReasoningTransportResult,
  type GlmAdvancedBrainAcceptanceCommandResult,
  type GlmAdvancedBrainAcceptanceConsentRequest,
  type GlmAdvancedBrainAcceptanceDiagnosticReport,
  type GlmAdvancedBrainAcceptanceFinishReason,
  type GlmAdvancedBrainAcceptanceModelId,
  type GlmAdvancedBrainAcceptanceOutputValidationCategory,
  type GlmAdvancedBrainAcceptanceProviderErrorCategory,
  type GlmAdvancedBrainAcceptanceRequestContractProfileId,
  type GlmAdvancedBrainAcceptancePreflightResult,
  type GlmAdvancedBrainAcceptanceReasonCode,
  type GlmAdvancedBrainAcceptanceStatus,
} from "@jarvis-k/contracts";
import type { SecureGlmAdvancedBrainAcceptanceCredentialStore } from "./secure-glm-advanced-brain-credential-store";

const FIXED_TIMEOUT_MS = GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS;
const FIXED_MAX_RESPONSE_BYTES = 4_000;
const GLM_ACCEPTANCE_RESPONSE_EVIDENCE_KEY = "acceptanceResponseEvidence";

export interface GlmAdvancedBrainAcceptanceSettings {
  readonly selectedModelId?: GlmAdvancedBrainAcceptanceModelId;
}

interface StoredSettings {
  readonly version: 1;
  readonly selectedModelId?: GlmAdvancedBrainAcceptanceModelId;
}

export interface GlmAdvancedBrainAcceptanceServiceOptions {
  readonly settingsPath: string;
  readonly credentialStore: SecureGlmAdvancedBrainAcceptanceCredentialStore;
  readonly acceptanceFlagEnabled: boolean;
  readonly now?: () => Date;
  readonly transport?: GlmAdvancedBrainAcceptanceTransport;
  readonly endpointProfileValid?: boolean;
}

export interface GlmAdvancedBrainAcceptanceTransport {
  send(
    request: CloudReasoningTransportRequest,
    options: GlmAdvancedBrainAcceptanceTransportSendOptions,
  ): Promise<CloudReasoningTransportResult>;
}

export interface GlmAdvancedBrainAcceptanceTransportSendOptions {
  readonly credential: {
    readonly scheme: "bearer";
    readonly value: string;
  };
  readonly signal?: AbortSignal;
}

export class GlmAdvancedBrainAcceptanceService {
  private settings: GlmAdvancedBrainAcceptanceSettings | null = null;
  private running = false;
  private acceptanceConsumed = false;
  private realRequestAttempted = false;

  public constructor(
    private readonly options: GlmAdvancedBrainAcceptanceServiceOptions,
  ) {}

  public async getStatus(): Promise<GlmAdvancedBrainAcceptanceStatus> {
    const [settings, credentialStatus] = await Promise.all([
      this.loadSettings(),
      this.options.credentialStore.status(),
    ]);
    const reasonCodes = this.statusReasonCodes(settings, credentialStatus);
    return GlmAdvancedBrainAcceptanceStatusSchema.parse({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: this.acceptanceState(reasonCodes),
      providerId: GLM_ADVANCED_BRAIN_ACCEPTANCE_PROVIDER_ID,
      providerEnabled: this.options.acceptanceFlagEnabled,
      acceptanceFlagEnabled: this.options.acceptanceFlagEnabled,
      ...(settings.selectedModelId
        ? { selectedModelId: settings.selectedModelId }
        : {}),
      modelExplicitlySelected: settings.selectedModelId !== undefined,
      credentialConfigured: credentialStatus.credentialConfigured,
      secureStorageAvailable: credentialStatus.secureStorageAvailable,
      credentialStorageEncrypted: credentialStatus.credentialStorageEncrypted,
      acceptanceConsumed: this.acceptanceConsumed,
      credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
      ...(credentialStatus.credentialTypeConfirmed
        ? { credentialTypeConfirmed: credentialStatus.credentialTypeConfirmed }
        : {}),
      endpointProfileId: GLM_ADVANCED_BRAIN_ACCEPTANCE_ENDPOINT_PROFILE_ID,
      endpointOrigin: GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
      operationPath: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
      fullEndpointMatch: this.fullEndpointMatches(),
      officialEndpointProfile: this.endpointProfileIsValid(),
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
      rendererWritableTrustedGates: false,
      reasonCodes,
    });
  }

  public async setModel(
    rawInput: unknown,
  ): Promise<GlmAdvancedBrainAcceptanceCommandResult> {
    const parsed = GlmAdvancedBrainAcceptanceSetModelRequestSchema.parse(rawInput);
    this.settings = {
      ...(parsed.modelId ? { selectedModelId: parsed.modelId } : {}),
    };
    await this.persistSettings(this.settings);
    return GlmAdvancedBrainAcceptanceCommandResultSchema.parse({
      ok: true,
      status: await this.getStatus(),
    });
  }

  public async saveCredential(
    rawInput: unknown,
  ): Promise<GlmAdvancedBrainAcceptanceCommandResult> {
    try {
      const parsed =
        GlmAdvancedBrainAcceptanceConsentCredentialInputSchema.parse(rawInput);
      await this.options.credentialStore.save({ apiKey: parsed.apiKey });
      return GlmAdvancedBrainAcceptanceCommandResultSchema.parse({
        ok: true,
        status: await this.getStatus(),
      });
    } catch {
      return GlmAdvancedBrainAcceptanceCommandResultSchema.parse({
        ok: false,
        status: await this.getStatus(),
        safeMessage: "GLM Advanced Brain credential was rejected.",
      });
    }
  }

  public async deleteCredential(): Promise<GlmAdvancedBrainAcceptanceCommandResult> {
    await this.options.credentialStore.clear();
    return GlmAdvancedBrainAcceptanceCommandResultSchema.parse({
      ok: true,
      status: await this.getStatus(),
    });
  }

  public async preflight(
    rawInput: unknown,
  ): Promise<GlmAdvancedBrainAcceptancePreflightResult> {
    return this.computePreflight(rawInput, true);
  }

  private async computePreflight(
    rawInput: unknown,
    includeRunningState: boolean,
  ): Promise<GlmAdvancedBrainAcceptancePreflightResult> {
    const input = GlmAdvancedBrainAcceptanceConsentRequestSchema.parse(rawInput);
    const status = await this.getStatus();
    const reasonCodes = [
      ...status.reasonCodes.filter((reason) => reason !== "ready"),
      ...this.consentReasonCodes(input),
      ...this.fixedRequestReasonCodes(),
      ...(includeRunningState && this.running
        ? ["acceptance_already_running" as const]
        : []),
      ...(this.acceptanceConsumed
        ? ["acceptance_already_consumed" as const]
        : []),
    ];
    return this.preflightResult(status, reasonCodes);
  }

  public async runDiagnostic(
    rawInput: unknown,
  ): Promise<GlmAdvancedBrainAcceptanceDiagnosticReport> {
    if (this.running) {
      throw new Error("GLM_ADVANCED_BRAIN_ACCEPTANCE_ALREADY_RUNNING");
    }
    this.running = true;
    const startedAt = this.options.now?.() ?? new Date();
    try {
      const preflight = await this.computePreflight(rawInput, false);
      if (!preflight.allowRealAcceptance || !preflight.modelId) {
        throw new Error("GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_FAILED");
      }
      const credential = await this.options.credentialStore.load();
      if (!credential) {
        throw new Error("GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_MISSING");
      }
      const request = createFixedDiagnosticRequest(preflight.modelId);
      this.acceptanceConsumed = true;
      this.realRequestAttempted = true;
      const transport = this.options.transport ?? new FakeGlmAcceptanceTransport();
      const transportResult = await transport.send(request, {
        credential: { scheme: "bearer", value: credential.apiKey },
      });
      const completedAt = this.options.now?.() ?? new Date();
      const structuredResultValid = validateFixedDiagnosticResponse(
        transportResult,
      );
      const responseEvidence = extractResponseEvidence(transportResult);
      return GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse({
        acceptanceId: request.requestId,
        acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
        acceptanceState: "consumed",
        providerId: GLM_ADVANCED_BRAIN_ACCEPTANCE_PROVIDER_ID,
        modelId: preflight.modelId,
        endpointProfileId: GLM_ADVANCED_BRAIN_ACCEPTANCE_ENDPOINT_PROFILE_ID,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        latencyMs: transportResult.latencyMs,
        ...(transportResult.httpStatus
          ? { httpStatus: transportResult.httpStatus }
          : {}),
        httpStatusClass: transportResult.statusClass,
        structuredResultValidation: structuredResultValid ? "PASS" : "FAIL",
        tokenUsage: extractTokenUsage(transportResult.responseJson),
        retryCount: 0,
        fallbackCount: 0,
        toolCallCount: 0,
        directActionAttempted: false,
        reasonCode: mapDiagnosticReasonCode(transportResult),
        providerErrorCategory: classifyProviderError(transportResult),
        requestSent: transportResult.requestSent,
        responseStarted: transportResult.responseStarted,
        responseCompleted: transportResult.responseCompleted,
        responseByteCount: extractResponseByteCount(transportResult),
        timeout: transportResult.timeout,
        cancelled: transportResult.cancelled,
        toolsObserved: false,
        executorInvocationDelta: 0,
        contentTypeAllowed: responseEvidence.contentTypeAllowed,
        jsonDecoded: responseEvidence.jsonDecoded,
        choicesPresent: responseEvidence.choicesPresent,
        finalContentPresent: responseEvidence.finalContentPresent,
        reasoningContentObserved: responseEvidence.reasoningContentObserved,
        finishReason: responseEvidence.finishReason,
        usagePresent: responseEvidence.usagePresent,
        outputValidationCategory: responseEvidence.outputValidationCategory,
        sanitizedResponseCategory: responseEvidence.outputValidationCategory,
        acceptanceConsumed: true,
        realNetworkRequestSent: transportResult.requestSent,
        credentialExposed: false,
        promptExposed: false,
        rawResponseExposed: false,
      });
    } finally {
      this.running = false;
    }
  }

  private async loadSettings(): Promise<GlmAdvancedBrainAcceptanceSettings> {
    if (this.settings) {
      return this.settings;
    }
    let rawFile: string;
    try {
      rawFile = await readFile(this.options.settingsPath, "utf8");
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        this.settings = {};
        return this.settings;
      }
      throw new Error("GLM Advanced Brain acceptance settings are unavailable.");
    }
    try {
      const raw = JSON.parse(rawFile);
      this.settings = parseStoredSettings(raw);
      return this.settings;
    } catch {
      this.settings = {};
      return this.settings;
    }
  }

  private async persistSettings(
    settings: GlmAdvancedBrainAcceptanceSettings,
  ): Promise<void> {
    const stored: StoredSettings = {
      version: 1,
      ...(settings.selectedModelId
        ? { selectedModelId: settings.selectedModelId }
        : {}),
    };
    await mkdir(path.dirname(this.options.settingsPath), { recursive: true });
    await writeFile(
      `${this.options.settingsPath}.tmp`,
      `${JSON.stringify(stored, null, 2)}\n`,
      "utf8",
    );
    await rename(`${this.options.settingsPath}.tmp`, this.options.settingsPath);
  }

  private statusReasonCodes(
    settings: GlmAdvancedBrainAcceptanceSettings,
    credentialStatus: {
      readonly secureStorageAvailable: boolean;
      readonly credentialConfigured: boolean;
      readonly credentialStorageEncrypted: boolean;
      readonly credentialTypeConfirmed?: typeof GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE;
      readonly status?: "configured" | "unconfigured" | "unavailable" | "invalid";
    },
  ): GlmAdvancedBrainAcceptanceReasonCode[] {
    const reasons: GlmAdvancedBrainAcceptanceReasonCode[] = [];
    if (!this.options.acceptanceFlagEnabled) {
      reasons.push("acceptance_flag_missing", "provider_disabled");
    }
    if (!settings.selectedModelId) {
      reasons.push("model_not_selected");
    }
    if (!credentialStatus.secureStorageAvailable) {
      reasons.push("secure_store_unavailable");
    } else if (credentialStatus.status === "invalid") {
      reasons.push("credential_invalid");
    } else if (!credentialStatus.credentialConfigured) {
      reasons.push("credential_missing");
    } else if (
      credentialStatus.credentialTypeConfirmed !==
      GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE
    ) {
      reasons.push("credential_type_unconfirmed");
    } else if (!credentialStatus.credentialStorageEncrypted) {
      reasons.push("credential_invalid");
    }
    if (!this.endpointProfileIsValid()) {
      reasons.push("endpoint_profile_mismatch");
    }
    if (this.acceptanceConsumed) {
      reasons.push("acceptance_already_consumed");
    }
    return reasons.length ? reasons : ["ready"];
  }

  private consentReasonCodes(
    input: GlmAdvancedBrainAcceptanceConsentRequest,
  ): GlmAdvancedBrainAcceptanceReasonCode[] {
    const reasons: GlmAdvancedBrainAcceptanceReasonCode[] = [];
    if (!input.cloudEgressAllowed) {
      reasons.push("cloud_egress_not_allowed");
    }
    if (!input.acceptanceConsent) {
      reasons.push("consent_missing");
    }
    return reasons;
  }

  private fixedRequestReasonCodes(): GlmAdvancedBrainAcceptanceReasonCode[] {
    const reasons: GlmAdvancedBrainAcceptanceReasonCode[] = [];
    for (const modelId of ["glm-5.2", "glm-5.3"] as const) {
      const request = createFixedDiagnosticRequest(modelId);
      const body = request.bodyJson as Record<string, unknown>;
      const contract = fixedDiagnosticRequestContract(modelId);
      if (request.timeoutMs !== FIXED_TIMEOUT_MS) {
        reasons.push("timeout_unbounded");
      }
      if (body.max_tokens !== contract.maxTokens) {
        reasons.push("max_output_tokens_unbounded");
      }
      if (body.stream !== false) {
        reasons.push("tool_capability_present");
      }
      if (Object.prototype.hasOwnProperty.call(body, "max_output_tokens")) {
        reasons.push("max_output_tokens_unbounded");
      }
      if (Object.prototype.hasOwnProperty.call(body, "tools")) {
        reasons.push("tool_capability_present");
      }
      if (Object.prototype.hasOwnProperty.call(body, "tool_choice")) {
        reasons.push("tool_capability_present");
      }
      if (Object.prototype.hasOwnProperty.call(body, "function_call")) {
        reasons.push("tool_capability_present");
      }
      if (modelId === "glm-5.3" && hasThinkingDisabled(body)) {
        reasons.push("invalid_provider_output");
      }
    }
    return reasons;
  }

  private preflightResult(
    status: GlmAdvancedBrainAcceptanceStatus,
    reasonCodes: GlmAdvancedBrainAcceptanceReasonCode[],
  ): GlmAdvancedBrainAcceptancePreflightResult {
    const uniqueReasons = [...new Set(reasonCodes)];
    const contract = fixedDiagnosticRequestContract(
      status.selectedModelId ?? "glm-5.2",
    );
    return GlmAdvancedBrainAcceptancePreflightResultSchema.parse({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: this.acceptanceState(uniqueReasons),
      allowRealAcceptance:
        uniqueReasons.length === 0 ||
        (uniqueReasons.length === 1 && uniqueReasons[0] === "ready"),
      providerId: GLM_ADVANCED_BRAIN_ACCEPTANCE_PROVIDER_ID,
      ...(status.selectedModelId ? { modelId: status.selectedModelId } : {}),
      endpointProfileId: GLM_ADVANCED_BRAIN_ACCEPTANCE_ENDPOINT_PROFILE_ID,
      endpointOrigin: GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
      operationPath: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
      fullEndpointMatch: status.fullEndpointMatch,
      credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
      credentialConfigured: status.credentialConfigured,
      credentialStorageEncrypted: status.credentialStorageEncrypted,
      ...(status.credentialTypeConfirmed
        ? { credentialTypeConfirmed: status.credentialTypeConfirmed }
        : {}),
      selectedModelExplicit: status.modelExplicitlySelected,
      checkedAt: (this.options.now?.() ?? new Date()).toISOString(),
      reasonCodes:
        uniqueReasons.length === 0 ? ["ready"] : uniqueReasons.filter((r) => r !== "ready"),
      cloudRequestFixed: true,
      requestBodyFixed: true,
      userContentIncluded: false,
      fileIncluded: false,
      imageIncluded: false,
      requestContractProfileId: contract.profileId,
      maximumOutputTokens: contract.maxTokens,
      maxOutputTokens: contract.maxTokens,
      mandatoryThinking: contract.mandatoryThinking,
      thinkingDisabled: contract.thinkingDisabled,
      ...(contract.reasoningEffort
        ? { reasoningEffort: contract.reasoningEffort }
        : {}),
      requestedTimeoutMs: FIXED_TIMEOUT_MS,
      effectiveTimeoutMs: FIXED_TIMEOUT_MS,
      timeoutBounded: true,
      boundedTimeoutMs: FIXED_TIMEOUT_MS,
      streaming: false,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      executorReachable: false,
      allowSingleRealAcceptance:
        !this.acceptanceConsumed &&
        (uniqueReasons.length === 0 ||
          (uniqueReasons.length === 1 && uniqueReasons[0] === "ready")),
      priorRealRequestCount: this.acceptanceConsumed ? 1 : 0,
      automaticRetry: false,
      automaticFallback: false,
      toolCapabilityCount: 0,
      windowsExecutorAllowed: false,
      pluginRuntimeAllowed: false,
      directActionAttempted: false,
      realRequestAttempted: this.realRequestAttempted,
      realNetworkRequestSent: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });
  }

  private endpointProfileIsValid(): boolean {
    if (this.options.endpointProfileValid === false) {
      return false;
    }
    return this.fullEndpointMatches();
  }

  private fullEndpointMatches(): boolean {
    try {
      const endpoint = new URL(GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT);
      return (
        endpoint.href === GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT &&
        endpoint.protocol === "https:" &&
        endpoint.origin === GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN &&
        endpoint.pathname === GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH &&
        endpoint.search === "" &&
        endpoint.hash === "" &&
        GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION === "chat.completions" &&
        GLM_ADVANCED_BRAIN_ACCEPTANCE_REDIRECT_POLICY === "none"
      );
    } catch {
      return false;
    }
  }

  private acceptanceState(
    reasonCodes: readonly GlmAdvancedBrainAcceptanceReasonCode[],
  ): "ready" | "running" | "consumed" | "blocked" {
    if (this.running) {
      return "running";
    }
    if (this.acceptanceConsumed) {
      return "consumed";
    }
    return reasonCodes.some((reason) => reason !== "ready")
      ? "blocked"
      : "ready";
  }
}

export class RealGlmAcceptanceTransport
  implements GlmAdvancedBrainAcceptanceTransport
{
  private readonly fetchImpl: typeof fetch | null;

  public constructor(fetchImpl?: typeof fetch) {
    this.fetchImpl = fetchImpl ?? globalThis.fetch?.bind(globalThis) ?? null;
  }

  public async send(
    request: CloudReasoningTransportRequest,
    options: GlmAdvancedBrainAcceptanceTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    const startedAt = Date.now();
    if (!this.fetchImpl) {
      return transportResult(request, {
        statusClass: "network_error",
        reasonCode: "network_unavailable",
        safeHeaders: {},
        latencyMs: 0,
        requestSent: false,
        responseStarted: false,
        responseCompleted: false,
        timeout: false,
        cancelled: false,
        responseByteCount: 0,
      });
    }
    const controller = new AbortController();
    let timedOut = false;
    let externallyCancelled = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, request.timeoutMs);
    const abortFromExternalSignal = () => {
      externallyCancelled = true;
      controller.abort();
    };
    options.signal?.addEventListener("abort", abortFromExternalSignal, {
      once: true,
    });
    let requestSent = false;
    try {
      requestSent = true;
      const response = await this.fetchImpl(GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${options.credential.value}`,
          "Content-Type": request.contentType,
          Accept: "application/json",
        },
        body: JSON.stringify(request.bodyJson),
      });
      const responseStarted = true;
      const contentType = response.headers.get("content-type") ?? undefined;
      const boundedBody = await readBoundedResponseText(
        response,
        request.maxResponseBytes,
      );
      if (!boundedBody.ok) {
        return transportResult(request, {
          statusClass: "blocked",
          reasonCode: "response_too_large",
          httpStatus: response.status,
          safeHeaders: safeHeaders(contentType),
          latencyMs: elapsed(startedAt),
          requestSent,
          responseStarted,
          responseCompleted: false,
          timeout: false,
          cancelled: false,
          responseByteCount: request.maxResponseBytes,
        });
      }
      const parsedJson = parseJsonObject(boundedBody.text);
      const contentTypeAllowed = isAllowedJsonContentType(contentType);
      const httpSuccess = response.status >= 200 && response.status < 300;
      const normalizedJson = httpSuccess
        ? normalizeGlmChatCompletionsResponse(parsedJson, {
            contentTypeAllowed,
          })
        : providerHttpErrorResponseProjection({
            contentTypeAllowed,
            jsonDecoded: parsedJson !== null,
          });
      const outputValidationCategory = httpSuccess
        ? extractOutputValidationCategory(normalizedJson)
        : "provider_http_error";
      return transportResult(request, {
        statusClass: statusClassForHttp(
          response.status,
          outputValidationCategory === "fixed_diagnostic_ok",
        ),
        reasonCode: reasonCodeForHttp(response.status, outputValidationCategory),
        httpStatus: response.status,
        responseJson: normalizedJson,
        safeHeaders: safeHeaders(contentType),
        latencyMs: elapsed(startedAt),
        requestSent,
        responseStarted,
        responseCompleted: true,
        timeout: false,
        cancelled: false,
        responseByteCount: boundedBody.byteCount,
      });
    } catch (error) {
      const aborted = isAbortError(error);
      return transportResult(request, {
        statusClass: aborted
          ? timedOut
            ? "timeout"
            : externallyCancelled
              ? "cancelled"
              : "network_error"
          : "network_error",
        reasonCode: aborted
          ? timedOut
            ? "timeout"
            : externallyCancelled
              ? "cancelled"
              : "network_unavailable"
          : "network_unavailable",
        safeHeaders: {},
        latencyMs: elapsed(startedAt),
        requestSent,
        responseStarted: false,
        responseCompleted: false,
        timeout: timedOut,
        cancelled: externallyCancelled,
        responseByteCount: 0,
      });
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromExternalSignal);
    }
  }
}

class FakeGlmAcceptanceTransport implements GlmAdvancedBrainAcceptanceTransport {
  public async send(
    request: CloudReasoningTransportRequest,
    _options: GlmAdvancedBrainAcceptanceTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    return CloudReasoningTransportResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      requestId: request.requestId,
      providerId: request.providerId,
      deploymentId: request.deploymentId,
      operation: request.operation,
      statusClass: "success",
      reasonCode: "completed",
      httpStatus: 200,
      responseJson: {
        diagnostic: "ok",
        directActionAttempted: false,
        toolCallCount: 0,
        usage: {
          prompt_tokens: 6,
          completion_tokens: 4,
          total_tokens: 10,
        },
      },
      safeHeaders: { contentType: "application/json" },
      latencyMs: 1,
      requestSent: false,
      responseByteCount: 0,
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

function transportResult(
  request: CloudReasoningTransportRequest,
  input: {
    readonly statusClass: CloudReasoningTransportResult["statusClass"];
    readonly reasonCode: CloudReasoningTransportResult["reasonCode"];
    readonly httpStatus?: number;
    readonly responseJson?: unknown;
    readonly safeHeaders: CloudReasoningTransportResult["safeHeaders"];
    readonly latencyMs: number;
    readonly requestSent: boolean;
    readonly responseStarted: boolean;
    readonly responseCompleted: boolean;
    readonly timeout: boolean;
    readonly cancelled: boolean;
    readonly responseByteCount: number;
  },
): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: request.requestId,
    providerId: request.providerId,
    deploymentId: request.deploymentId,
    operation: request.operation,
    statusClass: input.statusClass,
    reasonCode: input.reasonCode,
    ...(input.httpStatus ? { httpStatus: input.httpStatus } : {}),
    ...(input.responseJson ? { responseJson: input.responseJson } : {}),
    safeHeaders: input.safeHeaders,
    latencyMs: input.latencyMs,
    responseByteCount: input.responseByteCount,
    requestSent: input.requestSent,
    responseStarted: input.responseStarted,
    responseCompleted: input.responseCompleted,
    cancelled: input.cancelled,
    timeout: input.timeout,
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  });
}

async function readBoundedResponseText(
  response: Response,
  maxBytes: number,
): Promise<
  | { readonly ok: true; readonly text: string; readonly byteCount: number }
  | { readonly ok: false }
> {
  const body = response.body;
  if (!body) {
    const text = await response.text();
    const byteCount = Buffer.byteLength(text, "utf8");
    return byteCount <= maxBytes ? { ok: true, text, byteCount } : { ok: false };
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let byteCount = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      byteCount += value.byteLength;
      if (byteCount > maxBytes) {
        await reader.cancel();
        return { ok: false };
      }
      chunks.push(value);
    }
  }
  return {
    ok: true,
    text: Buffer.concat(chunks).toString("utf8"),
    byteCount,
  };
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeGlmChatCompletionsResponse(
  responseJson: Record<string, unknown> | null,
  options: { readonly contentTypeAllowed: boolean } = {
    contentTypeAllowed: true,
  },
): Record<string, unknown> {
  const evidence = analyzeGlmChatCompletionsResponse(responseJson, options);
  const parsedContent =
    typeof evidence.finalContent === "string"
      ? parseJsonObject(evidence.finalContent)
      : null;
  return {
    ...(parsedContent
      ? {
          diagnostic: parsedContent.diagnostic,
          directActionAttempted: parsedContent.directActionAttempted,
          toolCallCount: parsedContent.toolCallCount,
        }
      : {}),
    usage: isRecord(responseJson?.usage) ? responseJson.usage : {},
    [GLM_ACCEPTANCE_RESPONSE_EVIDENCE_KEY]: toSafeResponseEvidence(evidence),
  };
}

function providerHttpErrorResponseProjection(input: {
  readonly contentTypeAllowed: boolean;
  readonly jsonDecoded: boolean;
}): Record<string, unknown> {
  return {
    usage: {},
    [GLM_ACCEPTANCE_RESPONSE_EVIDENCE_KEY]: {
      contentTypeAllowed: input.contentTypeAllowed,
      jsonDecoded: input.jsonDecoded,
      choicesPresent: false,
      finalContentPresent: false,
      reasoningContentObserved: false,
      finishReason: "absent",
      usagePresent: false,
      outputValidationCategory: "provider_http_error",
    },
  };
}

function analyzeGlmChatCompletionsResponse(
  responseJson: Record<string, unknown> | null,
  options: { readonly contentTypeAllowed: boolean },
): GlmAcceptanceResponseAnalysis {
  const base: Omit<
    GlmAcceptanceResponseAnalysis,
    "outputValidationCategory"
  > = {
    contentTypeAllowed: options.contentTypeAllowed,
    jsonDecoded: responseJson !== null,
    choicesPresent: false,
    finalContentPresent: false,
    reasoningContentObserved: false,
    finishReason: "absent",
    usagePresent: isRecord(responseJson?.usage),
  };
  if (!options.contentTypeAllowed || !responseJson) {
    return {
      ...base,
      outputValidationCategory: "invalid_provider_output",
    };
  }
  if (!Array.isArray(responseJson.choices) || responseJson.choices.length === 0) {
    return {
      ...base,
      outputValidationCategory: "invalid_provider_output",
    };
  }
  const firstChoice = responseJson.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return {
      ...base,
      choicesPresent: true,
      finishReason: normalizeFinishReason(firstChoice),
      outputValidationCategory: "invalid_provider_output",
    };
  }
  const finishReason = normalizeFinishReason(firstChoice);
  const reasoningContentObserved =
    typeof firstChoice.message.reasoning_content === "string" &&
    firstChoice.message.reasoning_content.length > 0;
  const toolProposalObserved =
    (Array.isArray(firstChoice.message.tool_calls) &&
      firstChoice.message.tool_calls.length > 0) ||
    isRecord(firstChoice.message.function_call) ||
    finishReason === "tool_calls" ||
    finishReason === "function_call";
  const finalContent =
    typeof firstChoice.message.content === "string"
      ? firstChoice.message.content
      : undefined;
  const finalContentPresent = typeof finalContent === "string" && finalContent.trim().length > 0;
  if (toolProposalObserved) {
    return {
      ...base,
      choicesPresent: true,
      finalContentPresent,
      reasoningContentObserved,
      finishReason,
      ...(finalContent !== undefined ? { finalContent } : {}),
      outputValidationCategory: "untrusted_tool_proposal_blocked",
    };
  }
  if (!finalContentPresent) {
    return {
      ...base,
      choicesPresent: true,
      finalContentPresent: false,
      reasoningContentObserved,
      finishReason,
      outputValidationCategory:
        finishReason === "length"
          ? "output_budget_exhausted_before_final"
          : reasoningContentObserved
            ? "no_final_answer"
            : "invalid_provider_output",
    };
  }
  const parsedContent = parseJsonObject(finalContent);
  const validDiagnostic =
    parsedContent?.diagnostic === "ok" &&
    parsedContent.directActionAttempted === false &&
    parsedContent.toolCallCount === 0;
  return {
    ...base,
    choicesPresent: true,
    finalContentPresent: true,
    reasoningContentObserved,
    finishReason,
    ...(finalContent !== undefined ? { finalContent } : {}),
    outputValidationCategory: validDiagnostic
      ? "fixed_diagnostic_ok"
      : "invalid_provider_output",
  };
}

function statusClassForHttp(
  status: number,
  validResponseShape: boolean,
): CloudReasoningTransportResult["statusClass"] {
  if (status >= 200 && status < 300) {
    return validResponseShape ? "success" : "invalid_response";
  }
  if (status === 401 || status === 403) {
    return "auth_failure";
  }
  if (status === 429) {
    return "rate_limited";
  }
  if (status >= 500) {
    return "server_error";
  }
  if (status >= 400) {
    return "client_error";
  }
  return "failed";
}

function reasonCodeForHttp(
  status: number,
  outputValidationCategory: GlmAdvancedBrainAcceptanceOutputValidationCategory,
): CloudReasoningTransportResult["reasonCode"] {
  if (status >= 200 && status < 300) {
    return outputValidationCategory === "fixed_diagnostic_ok"
      ? "completed"
      : transportReasonCodeForOutputValidation(outputValidationCategory);
  }
  if (status === 401 || status === 403) {
    return "authentication_transport_failure";
  }
  if (status === 429) {
    return "rate_limited";
  }
  if (status >= 500) {
    return "provider_server_error";
  }
  if (status >= 400) {
    return "provider_client_error";
  }
  return "transport_failed";
}

function safeHeaders(
  contentType: string | undefined,
): CloudReasoningTransportResult["safeHeaders"] {
  return contentType ? { contentType: contentType.slice(0, 128) } : {};
}

function isAllowedJsonContentType(contentType: string | undefined): boolean {
  if (!contentType) {
    return false;
  }
  const normalized = contentType.split(";")[0]?.trim().toLowerCase();
  return normalized === "application/json" || normalized?.endsWith("+json") === true;
}

function elapsed(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function extractResponseByteCount(
  transportResult: CloudReasoningTransportResult,
): number {
  const possibleValue = (transportResult as { responseByteCount?: unknown })
    .responseByteCount;
  return typeof possibleValue === "number" &&
    Number.isInteger(possibleValue) &&
    possibleValue >= 0
    ? possibleValue
    : 0;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.includes("aborted"))
  );
}

function createFixedDiagnosticRequest(
  modelId: GlmAdvancedBrainAcceptanceModelId,
): CloudReasoningTransportRequest {
  const contract = fixedDiagnosticRequestContract(modelId);
  return CloudReasoningTransportRequestSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
    providerId: GLM_ADVANCED_BRAIN_ACCEPTANCE_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_ACCEPTANCE_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION,
    method: "POST",
    contentType: "application/json",
    bodyJson: {
      model: modelId,
      messages: [
        {
          role: "system",
          content:
            "Return fixed diagnostic JSON only. Do not call tools or include user content.",
        },
        {
          role: "user",
          content: JSON.stringify({
            diagnostic: "glm_advanced_brain_acceptance_v1",
          }),
        },
      ],
      stream: false,
      max_tokens: contract.maxTokens,
      ...(contract.thinkingDisabled
        ? { thinking: { type: "disabled" } }
        : {}),
      ...(contract.reasoningEffort
        ? { reasoning_effort: contract.reasoningEffort }
        : {}),
    },
    credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
    timeoutMs: FIXED_TIMEOUT_MS,
    maxResponseBytes: FIXED_MAX_RESPONSE_BYTES,
  });
}

function fixedDiagnosticRequestContract(
  modelId: GlmAdvancedBrainAcceptanceModelId,
): {
  readonly profileId: GlmAdvancedBrainAcceptanceRequestContractProfileId;
  readonly maxTokens:
    | typeof GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM52_MAX_TOKENS
    | typeof GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS;
  readonly mandatoryThinking: boolean;
  readonly thinkingDisabled: boolean;
  readonly reasoningEffort?: typeof GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_REASONING_EFFORT;
} {
  return modelId === "glm-5.3"
    ? {
        profileId: "glm-5.3-fixed-diagnostic-mandatory-thinking",
        maxTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
        mandatoryThinking: true,
        thinkingDisabled: false,
        reasoningEffort: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_REASONING_EFFORT,
      }
    : {
        profileId: "glm-5.2-fixed-diagnostic-no-thinking",
        maxTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM52_MAX_TOKENS,
        mandatoryThinking: false,
        thinkingDisabled: true,
      };
}

function parseStoredSettings(value: unknown): GlmAdvancedBrainAcceptanceSettings {
  if (!isRecord(value) || value.version !== 1) {
    return {};
  }
  const parsedModel = GlmAdvancedBrainAcceptanceSetModelRequestSchema.safeParse({
    modelId: value.selectedModelId ?? null,
  });
  return parsedModel.success && parsedModel.data.modelId
    ? { selectedModelId: parsedModel.data.modelId }
    : {};
}

const GlmAdvancedBrainAcceptanceConsentCredentialInputSchema =
  GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema;

function validateFixedDiagnosticResponse(
  transportResult: CloudReasoningTransportResult,
): boolean {
  if (transportResult.statusClass !== "success" || !isRecord(transportResult.responseJson)) {
    return false;
  }
  return (
    transportResult.responseJson.diagnostic === "ok" &&
    transportResult.responseJson.directActionAttempted === false &&
    transportResult.responseJson.toolCallCount === 0
  );
}

function extractTokenUsage(responseJson: unknown): {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
} {
  if (!isRecord(responseJson) || !isRecord(responseJson.usage)) {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }
  return {
    promptTokens: safeNonNegativeInteger(responseJson.usage.prompt_tokens),
    completionTokens: safeNonNegativeInteger(
      responseJson.usage.completion_tokens,
    ),
    totalTokens: safeNonNegativeInteger(responseJson.usage.total_tokens),
  };
}

function mapDiagnosticReasonCode(
  transportResult: CloudReasoningTransportResult,
): GlmAdvancedBrainAcceptanceReasonCode {
  const outputValidationCategory =
    extractResponseEvidence(transportResult).outputValidationCategory;
  if (transportResult.statusClass === "success") {
    return validateFixedDiagnosticResponse(transportResult)
      ? "ready"
      : outputValidationCategory === "fixed_diagnostic_ok"
        ? "invalid_provider_output"
        : acceptanceReasonCodeForOutputValidation(outputValidationCategory);
  }
  if (
    transportResult.statusClass === "invalid_response" &&
    outputValidationCategory !== "fixed_diagnostic_ok" &&
    outputValidationCategory !== "provider_http_error" &&
    outputValidationCategory !== "transport_failure"
  ) {
    return acceptanceReasonCodeForOutputValidation(outputValidationCategory);
  }
  if (transportResult.statusClass === "timeout") {
    return "transport_timeout";
  }
  if (transportResult.statusClass === "cancelled") {
    return "transport_cancelled";
  }
  if (transportResult.statusClass === "auth_failure") {
    return transportResult.httpStatus === 403
      ? "transport_permission_denied"
      : "transport_authentication_failed";
  }
  if (transportResult.statusClass === "rate_limited") {
    return "transport_rate_limited";
  }
  if (transportResult.statusClass === "server_error") {
    return "transport_server_error";
  }
  if (transportResult.statusClass === "network_error") {
    return "transport_network_failed";
  }
  return "transport_failed";
}

function classifyProviderError(
  transportResult: CloudReasoningTransportResult,
): GlmAdvancedBrainAcceptanceProviderErrorCategory {
  const outputValidationCategory =
    extractResponseEvidence(transportResult).outputValidationCategory;
  if (
    !transportResult.responseStarted &&
    !transportResult.responseCompleted &&
    extractResponseByteCount(transportResult) === 0 &&
    (transportResult.statusClass === "timeout" ||
      transportResult.statusClass === "cancelled" ||
      transportResult.statusClass === "network_error")
  ) {
    return GlmAdvancedBrainAcceptanceProviderErrorCategorySchema.parse(
      "not_applicable",
    );
  }
  const category =
    transportResult.statusClass === "success"
      ? "none"
      : transportResult.statusClass === "invalid_response" &&
          isOutputValidationProviderCategory(outputValidationCategory)
        ? outputValidationCategory
      : transportResult.statusClass === "auth_failure" &&
          transportResult.httpStatus === 401
        ? "credential_rejected"
        : transportResult.statusClass === "auth_failure" &&
            transportResult.httpStatus === 403
          ? "permission_denied"
          : transportResult.statusClass === "auth_failure"
            ? "authentication_response_unrecognized"
            : transportResult.statusClass === "rate_limited"
              ? "account_or_quota_restricted"
              : "provider_error_unrecognized";
  return GlmAdvancedBrainAcceptanceProviderErrorCategorySchema.parse(category);
}

interface GlmAcceptanceResponseAnalysis {
  readonly contentTypeAllowed: boolean;
  readonly jsonDecoded: boolean;
  readonly choicesPresent: boolean;
  readonly finalContentPresent: boolean;
  readonly reasoningContentObserved: boolean;
  readonly finishReason: GlmAdvancedBrainAcceptanceFinishReason;
  readonly usagePresent: boolean;
  readonly outputValidationCategory: GlmAdvancedBrainAcceptanceOutputValidationCategory;
  readonly finalContent?: string;
}

function toSafeResponseEvidence(
  analysis: GlmAcceptanceResponseAnalysis,
): Omit<GlmAcceptanceResponseAnalysis, "finalContent"> {
  return {
    contentTypeAllowed: analysis.contentTypeAllowed,
    jsonDecoded: analysis.jsonDecoded,
    choicesPresent: analysis.choicesPresent,
    finalContentPresent: analysis.finalContentPresent,
    reasoningContentObserved: analysis.reasoningContentObserved,
    finishReason: analysis.finishReason,
    usagePresent: analysis.usagePresent,
    outputValidationCategory: analysis.outputValidationCategory,
  };
}

function extractResponseEvidence(
  transportResult: CloudReasoningTransportResult,
): Omit<GlmAcceptanceResponseAnalysis, "finalContent"> {
  if (
    isRecord(transportResult.responseJson) &&
    isRecord(transportResult.responseJson[GLM_ACCEPTANCE_RESPONSE_EVIDENCE_KEY])
  ) {
    const evidence = transportResult.responseJson[
      GLM_ACCEPTANCE_RESPONSE_EVIDENCE_KEY
    ];
    return {
      contentTypeAllowed: evidence.contentTypeAllowed === true,
      jsonDecoded: evidence.jsonDecoded === true,
      choicesPresent: evidence.choicesPresent === true,
      finalContentPresent: evidence.finalContentPresent === true,
      reasoningContentObserved: evidence.reasoningContentObserved === true,
      finishReason: isSafeFinishReason(evidence.finishReason)
        ? evidence.finishReason
        : "unknown",
      usagePresent: evidence.usagePresent === true,
      outputValidationCategory: isOutputValidationCategory(
        evidence.outputValidationCategory,
      )
        ? evidence.outputValidationCategory
        : "invalid_provider_output",
    };
  }
  if (transportResult.statusClass === "success") {
    return {
      contentTypeAllowed: true,
      jsonDecoded: true,
      choicesPresent: true,
      finalContentPresent: validateFixedDiagnosticResponse(transportResult),
      reasoningContentObserved: false,
      finishReason: "unknown",
      usagePresent: isRecord(transportResult.responseJson) && isRecord(transportResult.responseJson.usage),
      outputValidationCategory: validateFixedDiagnosticResponse(transportResult)
        ? "fixed_diagnostic_ok"
        : "invalid_provider_output",
    };
  }
  return {
    contentTypeAllowed: Boolean(transportResult.safeHeaders.contentType),
    jsonDecoded: false,
    choicesPresent: false,
    finalContentPresent: false,
    reasoningContentObserved: false,
    finishReason: "absent",
    usagePresent: false,
    outputValidationCategory:
      transportResult.responseStarted && transportResult.httpStatus
        ? "provider_http_error"
        : "transport_failure",
  };
}

function extractOutputValidationCategory(
  responseJson: Record<string, unknown>,
): GlmAdvancedBrainAcceptanceOutputValidationCategory {
  const evidence = extractResponseEvidence({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
    providerId: GLM_ADVANCED_BRAIN_ACCEPTANCE_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_ACCEPTANCE_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION,
    statusClass: "invalid_response",
    reasonCode: "invalid_response",
    responseJson,
    safeHeaders: {},
    latencyMs: 0,
    requestSent: false,
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
  return evidence.outputValidationCategory;
}

function normalizeFinishReason(
  choice: Record<string, unknown>,
): GlmAdvancedBrainAcceptanceFinishReason {
  const value = choice.finish_reason;
  return isSafeFinishReason(value) ? value : value === undefined ? "absent" : "unknown";
}

function isSafeFinishReason(
  value: unknown,
): value is GlmAdvancedBrainAcceptanceFinishReason {
  return (
    value === "stop" ||
    value === "length" ||
    value === "tool_calls" ||
    value === "function_call" ||
    value === "content_filter" ||
    value === "unknown" ||
    value === "absent"
  );
}

function isOutputValidationCategory(
  value: unknown,
): value is GlmAdvancedBrainAcceptanceOutputValidationCategory {
  return (
    value === "fixed_diagnostic_ok" ||
    value === "invalid_provider_output" ||
    value === "output_budget_exhausted_before_final" ||
    value === "no_final_answer" ||
    value === "untrusted_tool_proposal_blocked" ||
    value === "provider_http_error" ||
    value === "transport_failure"
  );
}

function isOutputValidationProviderCategory(
  value: GlmAdvancedBrainAcceptanceOutputValidationCategory,
): value is Extract<
  GlmAdvancedBrainAcceptanceOutputValidationCategory,
  GlmAdvancedBrainAcceptanceProviderErrorCategory
> {
  return (
    value === "invalid_provider_output" ||
    value === "output_budget_exhausted_before_final" ||
    value === "no_final_answer" ||
    value === "untrusted_tool_proposal_blocked"
  );
}

function transportReasonCodeForOutputValidation(
  value: GlmAdvancedBrainAcceptanceOutputValidationCategory,
): CloudReasoningTransportResult["reasonCode"] {
  switch (value) {
    case "fixed_diagnostic_ok":
      return "completed";
    case "invalid_provider_output":
    case "output_budget_exhausted_before_final":
    case "no_final_answer":
    case "untrusted_tool_proposal_blocked":
      return value;
    case "provider_http_error":
    case "transport_failure":
      return "transport_failed";
  }
}

function acceptanceReasonCodeForOutputValidation(
  value: GlmAdvancedBrainAcceptanceOutputValidationCategory,
): GlmAdvancedBrainAcceptanceReasonCode {
  switch (value) {
    case "fixed_diagnostic_ok":
      return "ready";
    case "invalid_provider_output":
    case "output_budget_exhausted_before_final":
    case "no_final_answer":
    case "untrusted_tool_proposal_blocked":
      return value;
    case "provider_http_error":
    case "transport_failure":
      return "transport_failed";
  }
}

function hasThinkingDisabled(body: Record<string, unknown>): boolean {
  return isRecord(body.thinking) && body.thinking.type === "disabled";
}

function safeNonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
