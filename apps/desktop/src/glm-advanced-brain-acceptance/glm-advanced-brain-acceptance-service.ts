import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudReasoningTransportRequestSchema,
  CloudReasoningTransportResultSchema,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_DEPLOYMENT_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_ENDPOINT_PROFILE_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_PROVIDER_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_REDIRECT_POLICY,
  GlmAdvancedBrainAcceptanceCommandResultSchema,
  GlmAdvancedBrainAcceptanceConsentRequestSchema,
  GlmAdvancedBrainAcceptanceDiagnosticReportSchema,
  GlmAdvancedBrainAcceptancePreflightResultSchema,
  GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema,
  GlmAdvancedBrainAcceptanceSetModelRequestSchema,
  GlmAdvancedBrainAcceptanceStatusSchema,
  type CloudReasoningTransportRequest,
  type CloudReasoningTransportResult,
  type GlmAdvancedBrainAcceptanceCommandResult,
  type GlmAdvancedBrainAcceptanceConsentRequest,
  type GlmAdvancedBrainAcceptanceDiagnosticReport,
  type GlmAdvancedBrainAcceptanceModelId,
  type GlmAdvancedBrainAcceptancePreflightResult,
  type GlmAdvancedBrainAcceptanceReasonCode,
  type GlmAdvancedBrainAcceptanceStatus,
} from "@jarvis-k/contracts";
import type { SecureGlmAdvancedBrainAcceptanceCredentialStore } from "./secure-glm-advanced-brain-credential-store";

const FIXED_TIMEOUT_MS = 2_000;
const FIXED_MAX_OUTPUT_TOKENS = 64;
const FIXED_MAX_RESPONSE_BYTES = 4_000;
const FIXED_ACCEPTANCE_ID = "glm-advanced-brain-acceptance-fixed-request";

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
}

export class GlmAdvancedBrainAcceptanceService {
  private settings: GlmAdvancedBrainAcceptanceSettings | null = null;
  private running = false;
  private readonly submittedAcceptanceIds = new Set<string>();

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
    const input = GlmAdvancedBrainAcceptanceConsentRequestSchema.parse(rawInput);
    const status = await this.getStatus();
    const reasonCodes = [
      ...status.reasonCodes.filter((reason) => reason !== "ready"),
      ...this.consentReasonCodes(input),
      ...this.fixedRequestReasonCodes(),
      ...(this.running ? ["acceptance_already_running" as const] : []),
      ...(this.submittedAcceptanceIds.has(FIXED_ACCEPTANCE_ID)
        ? ["acceptance_already_submitted" as const]
        : []),
    ];
    return this.preflightResult(status, reasonCodes);
  }

  public async runDiagnostic(
    rawInput: unknown,
  ): Promise<GlmAdvancedBrainAcceptanceDiagnosticReport> {
    const preflight = await this.preflight(rawInput);
    if (!preflight.allowRealAcceptance || !preflight.modelId) {
      throw new Error("GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_FAILED");
    }
    const credential = await this.options.credentialStore.load();
    if (!credential) {
      throw new Error("GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_MISSING");
    }
    if (this.running) {
      throw new Error("GLM_ADVANCED_BRAIN_ACCEPTANCE_ALREADY_RUNNING");
    }
    this.running = true;
    const startedAt = this.options.now?.() ?? new Date();
    try {
      const request = createFixedDiagnosticRequest(preflight.modelId);
      this.submittedAcceptanceIds.add(request.requestId);
      const transport = this.options.transport ?? new FakeGlmAcceptanceTransport();
      const transportResult = await transport.send(request, {
        credential: { scheme: "bearer", value: credential.apiKey },
      });
      const completedAt = this.options.now?.() ?? new Date();
      const structuredResultValid = validateFixedDiagnosticResponse(
        transportResult,
      );
      return GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse({
        acceptanceId: request.requestId,
        providerId: GLM_ADVANCED_BRAIN_ACCEPTANCE_PROVIDER_ID,
        modelId: preflight.modelId,
        endpointProfileId: GLM_ADVANCED_BRAIN_ACCEPTANCE_ENDPOINT_PROFILE_ID,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        latencyMs: transportResult.latencyMs,
        httpStatusClass: transportResult.statusClass,
        structuredResultValidation: structuredResultValid ? "PASS" : "FAIL",
        tokenUsage: extractTokenUsage(transportResult.responseJson),
        retryCount: 0,
        fallbackCount: 0,
        toolCallCount: 0,
        directActionAttempted: false,
        reasonCode: mapDiagnosticReasonCode(transportResult),
        requestSent: transportResult.requestSent,
        responseStarted: transportResult.responseStarted,
        responseCompleted: transportResult.responseCompleted,
        responseByteCount: extractResponseByteCount(transportResult),
        timeout: transportResult.timeout,
        cancelled: transportResult.cancelled,
        toolsObserved: false,
        executorInvocationDelta: 0,
        sanitizedResponseCategory: structuredResultValid
          ? "fixed_diagnostic_ok"
          : transportResult.statusClass === "success"
            ? "invalid_structured_response"
            : "transport_failure",
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
    const request = createFixedDiagnosticRequest("glm-5.2");
    const body = request.bodyJson as Record<string, unknown>;
    const reasons: GlmAdvancedBrainAcceptanceReasonCode[] = [];
    if (request.timeoutMs !== FIXED_TIMEOUT_MS) {
      reasons.push("timeout_unbounded");
    }
    if (body.max_tokens !== FIXED_MAX_OUTPUT_TOKENS) {
      reasons.push("max_output_tokens_unbounded");
    }
    if (body.stream !== false) {
      reasons.push("tool_capability_present");
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
    return reasons;
  }

  private preflightResult(
    status: GlmAdvancedBrainAcceptanceStatus,
    reasonCodes: GlmAdvancedBrainAcceptanceReasonCode[],
  ): GlmAdvancedBrainAcceptancePreflightResult {
    const uniqueReasons = [...new Set(reasonCodes)];
    return GlmAdvancedBrainAcceptancePreflightResultSchema.parse({
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
      maximumOutputTokens: FIXED_MAX_OUTPUT_TOKENS,
      maxOutputTokens: FIXED_MAX_OUTPUT_TOKENS,
      boundedTimeoutMs: FIXED_TIMEOUT_MS,
      streaming: false,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      executorReachable: false,
      allowSingleRealAcceptance:
        uniqueReasons.length === 0 ||
        (uniqueReasons.length === 1 && uniqueReasons[0] === "ready"),
      priorRealRequestCount: this.submittedAcceptanceIds.has(FIXED_ACCEPTANCE_ID)
        ? 1
        : 0,
      automaticRetry: false,
      automaticFallback: false,
      toolCapabilityCount: 0,
      windowsExecutorAllowed: false,
      pluginRuntimeAllowed: false,
      directActionAttempted: false,
      realRequestAttempted: false,
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
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
    let requestSent = false;
    try {
      requestSent = true;
      const response = await this.fetchImpl(GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: `${options.credential.scheme} ${options.credential.value}`,
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
      const normalizedJson = normalizeGlmChatCompletionsResponse(parsedJson);
      return transportResult(request, {
        statusClass: statusClassForHttp(response.status, normalizedJson !== null),
        reasonCode: reasonCodeForHttp(response.status, normalizedJson !== null),
        httpStatus: response.status,
        responseJson: normalizedJson ?? undefined,
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
        statusClass: aborted ? "timeout" : "network_error",
        reasonCode: aborted ? "timeout" : "network_unavailable",
        safeHeaders: {},
        latencyMs: elapsed(startedAt),
        requestSent,
        responseStarted: false,
        responseCompleted: false,
        timeout: aborted,
        cancelled: false,
        responseByteCount: 0,
      });
    } finally {
      clearTimeout(timeout);
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
): Record<string, unknown> | null {
  if (!responseJson) {
    return null;
  }
  const content = extractAssistantContent(responseJson);
  if (!content) {
    return null;
  }
  const parsedContent = parseJsonObject(content);
  if (!parsedContent) {
    return null;
  }
  return {
    diagnostic: parsedContent.diagnostic,
    directActionAttempted: parsedContent.directActionAttempted,
    toolCallCount: parsedContent.toolCallCount,
    usage: isRecord(responseJson.usage) ? responseJson.usage : {},
  };
}

function extractAssistantContent(responseJson: Record<string, unknown>): string | null {
  if (!Array.isArray(responseJson.choices)) {
    return null;
  }
  const firstChoice = responseJson.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return null;
  }
  return typeof firstChoice.message.content === "string"
    ? firstChoice.message.content
    : null;
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
  validResponseShape: boolean,
): CloudReasoningTransportResult["reasonCode"] {
  if (status >= 200 && status < 300) {
    return validResponseShape ? "completed" : "invalid_response";
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
  return CloudReasoningTransportRequestSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: FIXED_ACCEPTANCE_ID,
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
      response_format: { type: "json_object" },
      stream: false,
      temperature: 0,
      max_tokens: FIXED_MAX_OUTPUT_TOKENS,
    },
    credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
    timeoutMs: FIXED_TIMEOUT_MS,
    maxResponseBytes: FIXED_MAX_RESPONSE_BYTES,
  });
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
  if (transportResult.statusClass === "success") {
    return validateFixedDiagnosticResponse(transportResult)
      ? "ready"
      : "invalid_structured_response";
  }
  if (transportResult.statusClass === "timeout") {
    return "transport_timeout";
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
