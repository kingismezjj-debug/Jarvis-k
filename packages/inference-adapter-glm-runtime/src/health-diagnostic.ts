import {
  GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  GlmRuntimeHeavyPlannerTransportFailure,
  classifyGlmRuntimeHeavyPlannerTransportFailure
} from "./provider";
import {
  GLM_STANDARD_PAAS_V4_ENDPOINT,
  getGlmProviderModelOriginProfile,
  type GlmProviderOriginProfileId
} from "./model-origin-strategy";

export const GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS = 20_000;
export const GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS = 64;
const MAX_HEALTH_CONTENT_CHARS = 2_000;
const HEALTH_SECRET_PATTERN =
  /(?:\bBearer\b|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret|sk-[A-Za-z0-9_-]{8,})/iu;

export type GlmProviderHealthDiagnosticStatus =
  | "healthy"
  | "timeout"
  | "connection_failed"
  | "http_authentication_rejected"
  | "http_rate_limited"
  | "http_model_unavailable"
  | "http_provider_unavailable"
  | "invalid_minimal_response"
  | "unavailable"
  | "blocked_preflight";

export interface GlmProviderHealthDiagnosticCredential {
  readonly apiKey: string;
}

export interface GlmProviderHealthDiagnosticRequest {
  readonly url:
    | typeof GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT
    | typeof GLM_STANDARD_PAAS_V4_ENDPOINT;
  readonly headers: Record<string, string>;
  readonly body: GlmProviderHealthChatCompletionRequest;
  readonly timeoutMs: typeof GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS;
}

export interface GlmProviderHealthDiagnosticTransportResponse {
  readonly status: number;
  readonly body: unknown;
}

export interface GlmProviderHealthDiagnosticTransport {
  send(
    request: GlmProviderHealthDiagnosticRequest
  ): Promise<GlmProviderHealthDiagnosticTransportResponse>;
}

export interface GlmProviderHealthChatCompletionRequest {
  readonly model: typeof GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID;
  readonly messages: readonly [
    {
      readonly role: "system";
      readonly content: string;
    },
    {
      readonly role: "user";
      readonly content: string;
    }
  ];
  readonly response_format: {
    readonly type: "json_object";
  };
  readonly stream: false;
  readonly temperature: 0;
  readonly max_tokens: typeof GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS;
}

export interface GlmProviderHealthDiagnosticResult {
  readonly diagnosticStatus: GlmProviderHealthDiagnosticStatus;
  readonly elapsedMs: number;
  readonly requestCount: 0 | 1;
  readonly networkAttempted: boolean;
  readonly transportFailureCounts: {
    readonly timeout: number;
    readonly connection: number;
    readonly unknown: number;
  };
  readonly httpFailureCounts: {
    readonly authenticationRejected: number;
    readonly rateLimited: number;
    readonly modelUnavailable: number;
    readonly providerUnavailable: number;
  };
  readonly rawRequestPersisted: false;
  readonly rawResponsePersisted: false;
  readonly credentialExposed: false;
  readonly directActionAttempted: false;
  readonly coreRuntimePlannerActivated: false;
  readonly defaultBehaviorChanged: false;
  readonly uiIpcBehaviorChanged: false;
  readonly telemetryChanged: false;
  readonly releaseBehaviorChanged: false;
}

export class FetchGlmProviderHealthDiagnosticTransport
  implements GlmProviderHealthDiagnosticTransport
{
  public constructor(
    private readonly endpoint:
      | typeof GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT
      | typeof GLM_STANDARD_PAAS_V4_ENDPOINT =
      GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT
  ) {}

  public async send(
    request: GlmProviderHealthDiagnosticRequest
  ): Promise<GlmProviderHealthDiagnosticTransportResponse> {
    if (request.url !== this.endpoint) {
      throw new Error("GLM_PROVIDER_HEALTH_ENDPOINT_MISMATCH");
    }
    if (request.body.model !== GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID) {
      throw new Error("GLM_PROVIDER_HEALTH_MODEL_MISMATCH");
    }
    if (request.timeoutMs !== GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS) {
      throw new Error("GLM_PROVIDER_HEALTH_TIMEOUT_MISMATCH");
    }
    if (
      request.body.max_tokens !==
      GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS
    ) {
      throw new Error("GLM_PROVIDER_HEALTH_OUTPUT_BOUND_MISMATCH");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
    try {
      const response = await fetch(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: controller.signal
      });
      const text = await response.text();
      return {
        status: response.status,
        body: parseHealthResponseBody(text)
      };
    } catch (error) {
      throw new GlmRuntimeHeavyPlannerTransportFailure(
        classifyGlmRuntimeHeavyPlannerTransportFailure(
          error,
          controller.signal.aborted
        )
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function runGlmProviderHealthDiagnostic(input: {
  readonly credential: GlmProviderHealthDiagnosticCredential;
  readonly transport: GlmProviderHealthDiagnosticTransport;
  readonly profileId?: GlmProviderOriginProfileId;
  readonly now?: () => number;
}): Promise<GlmProviderHealthDiagnosticResult> {
  if (!isHealthCredential(input.credential)) {
    throw new Error("GLM_PROVIDER_HEALTH_CREDENTIAL_INVALID");
  }
  const now = input.now ?? (() => Date.now());
  const startedAt = now();
  const request = createGlmProviderHealthDiagnosticRequest(
    input.credential,
    input.profileId === undefined ? {} : { profileId: input.profileId }
  );
  let requestCount: 0 | 1 = 0;
  try {
    requestCount = 1;
    const response = await input.transport.send(request);
    const elapsedMs = Math.max(0, now() - startedAt);
    return resultForHttpResponse(response, elapsedMs, requestCount);
  } catch (error) {
    const elapsedMs = Math.max(0, now() - startedAt);
    return resultForTransportFailure(error, elapsedMs, requestCount);
  }
}

export function createGlmProviderHealthDiagnosticRequest(
  credential: GlmProviderHealthDiagnosticCredential,
  options: {
    readonly profileId?: GlmProviderOriginProfileId;
  } = {}
): GlmProviderHealthDiagnosticRequest {
  if (!isHealthCredential(credential)) {
    throw new Error("GLM_PROVIDER_HEALTH_CREDENTIAL_INVALID");
  }
  const profile = getGlmProviderModelOriginProfile(
    options.profileId ?? "coding_paas_v4"
  );
  if (profile.defaultModelId !== GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID) {
    throw new Error("GLM_PROVIDER_HEALTH_MODEL_MISMATCH");
  }
  return {
    url:
      profile.profileId === "standard_paas_v4"
        ? GLM_STANDARD_PAAS_V4_ENDPOINT
        : GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
    timeoutMs: GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${credential.apiKey}`,
      "Content-Type": "application/json"
    },
    body: {
      model: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
      messages: [
        {
          role: "system",
          content:
            "Return exactly one tiny JSON object. No planning, tools, actions, markdown, or diagnostics."
        },
        {
          role: "user",
          content: JSON.stringify({
            providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
            diagnostic: "health",
            expected: { status: "ok" }
          })
        }
      ],
      response_format: {
        type: "json_object"
      },
      stream: false,
      temperature: 0,
      max_tokens: GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS
    }
  };
}

export function classifyGlmProviderHealthHttpStatus(
  status: number
): GlmProviderHealthDiagnosticStatus | undefined {
  if (status === 401 || status === 403) {
    return "http_authentication_rejected";
  }
  if (status === 429) {
    return "http_rate_limited";
  }
  if (status === 404) {
    return "http_model_unavailable";
  }
  if (status === 408 || status === 503) {
    return "http_provider_unavailable";
  }
  if (status < 200 || status >= 300) {
    return "unavailable";
  }
  return undefined;
}

function resultForHttpResponse(
  response: GlmProviderHealthDiagnosticTransportResponse,
  elapsedMs: number,
  requestCount: 0 | 1
): GlmProviderHealthDiagnosticResult {
  const httpStatus = classifyGlmProviderHealthHttpStatus(response.status);
  const diagnosticStatus =
    httpStatus ?? (isMinimalHealthyResponse(response.body)
      ? "healthy"
      : "invalid_minimal_response");
  return baseResult({
    diagnosticStatus,
    elapsedMs,
    requestCount,
    networkAttempted: true,
    httpFailureCounts: httpFailureCountsFor(diagnosticStatus)
  });
}

function resultForTransportFailure(
  error: unknown,
  elapsedMs: number,
  requestCount: 0 | 1
): GlmProviderHealthDiagnosticResult {
  const category =
    error instanceof GlmRuntimeHeavyPlannerTransportFailure
      ? error.category
      : "unknown";
  return baseResult({
    diagnosticStatus:
      category === "timeout"
        ? "timeout"
        : category === "connection"
          ? "connection_failed"
          : "unavailable",
    elapsedMs,
    requestCount,
    networkAttempted: requestCount > 0,
    transportFailureCounts: {
      timeout: category === "timeout" ? 1 : 0,
      connection: category === "connection" ? 1 : 0,
      unknown: category === "unknown" ? 1 : 0
    }
  });
}

function baseResult(input: {
  readonly diagnosticStatus: GlmProviderHealthDiagnosticStatus;
  readonly elapsedMs: number;
  readonly requestCount: 0 | 1;
  readonly networkAttempted: boolean;
  readonly transportFailureCounts?: {
    readonly timeout: number;
    readonly connection: number;
    readonly unknown: number;
  };
  readonly httpFailureCounts?: {
    readonly authenticationRejected: number;
    readonly rateLimited: number;
    readonly modelUnavailable: number;
    readonly providerUnavailable: number;
  };
}): GlmProviderHealthDiagnosticResult {
  return {
    diagnosticStatus: input.diagnosticStatus,
    elapsedMs: input.elapsedMs,
    requestCount: input.requestCount,
    networkAttempted: input.networkAttempted,
    transportFailureCounts: input.transportFailureCounts ?? {
      timeout: 0,
      connection: 0,
      unknown: 0
    },
    httpFailureCounts: input.httpFailureCounts ?? {
      authenticationRejected: 0,
      rateLimited: 0,
      modelUnavailable: 0,
      providerUnavailable: 0
    },
    rawRequestPersisted: false,
    rawResponsePersisted: false,
    credentialExposed: false,
    directActionAttempted: false,
    coreRuntimePlannerActivated: false,
    defaultBehaviorChanged: false,
    uiIpcBehaviorChanged: false,
    telemetryChanged: false,
    releaseBehaviorChanged: false
  };
}

function httpFailureCountsFor(
  status: GlmProviderHealthDiagnosticStatus
): GlmProviderHealthDiagnosticResult["httpFailureCounts"] {
  return {
    authenticationRejected:
      status === "http_authentication_rejected" ? 1 : 0,
    rateLimited: status === "http_rate_limited" ? 1 : 0,
    modelUnavailable: status === "http_model_unavailable" ? 1 : 0,
    providerUnavailable: status === "http_provider_unavailable" ? 1 : 0
  };
}

function isMinimalHealthyResponse(body: unknown): boolean {
  if (!isRecord(body) || !Array.isArray(body.choices)) {
    return false;
  }
  const choice = body.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    return false;
  }
  const message = choice.message;
  if (
    (message.role !== undefined && message.role !== "assistant") ||
    Object.prototype.hasOwnProperty.call(message, "tool_calls") ||
    Object.prototype.hasOwnProperty.call(message, "function_call") ||
    hasUnsafeHealthOutput(message)
  ) {
    return false;
  }

  try {
    const content = parseMinimalHealthContent(message.content);
    if (!isRecord(content)) {
      return false;
    }
    return isHealthyContentObject(content);
  } catch {
    return false;
  }
}

function parseMinimalHealthContent(value: unknown): unknown {
  if (isRecord(value)) {
    return value;
  }
  if (typeof value !== "string") {
    throw new Error("GLM_PROVIDER_HEALTH_RESPONSE_INVALID");
  }
  if (
    value.length === 0 ||
    value.length > MAX_HEALTH_CONTENT_CHARS ||
    HEALTH_SECRET_PATTERN.test(value)
  ) {
    throw new Error("GLM_PROVIDER_HEALTH_RESPONSE_INVALID");
  }
  return JSON.parse(extractFirstJsonObject(value));
}

function isHealthyContentObject(value: Record<string, unknown>): boolean {
  if (hasUnsafeHealthOutput(value)) {
    return false;
  }
  const unwrapped = unwrapHealthContent(value);
  if (!isRecord(unwrapped) || hasUnsafeHealthOutput(unwrapped)) {
    return false;
  }

  const status = normalizeHealthToken(
    unwrapped.status ??
      unwrapped.health ??
      unwrapped.state ??
      unwrapped.result ??
      unwrapped.message
  );
  if (
    status === "ok" ||
    status === "healthy" ||
    status === "ready" ||
    status === "success" ||
    status === "successful" ||
    status === "passed" ||
    status === "available"
  ) {
    return true;
  }
  return (
    unwrapped.ok === true ||
    unwrapped.healthy === true ||
    unwrapped.ready === true ||
    unwrapped.success === true ||
    unwrapped.available === true ||
    unwrapped.alive === true
  );
}

function unwrapHealthContent(value: Record<string, unknown>): unknown {
  for (const key of ["result", "data", "output", "response", "health"]) {
    const nested = value[key];
    if (isRecord(nested)) {
      return nested;
    }
  }
  return value;
}

function normalizeHealthToken(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/[\s-]+/gu, "_").toLowerCase()
    : "";
}

function hasUnsafeHealthOutput(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  if (
    Object.prototype.hasOwnProperty.call(value, "tool_calls") ||
    Object.prototype.hasOwnProperty.call(value, "function_call") ||
    value.directActionAttempted === true ||
    value.execute === true ||
    value.action === "execute"
  ) {
    return true;
  }
  return false;
}

function extractFirstJsonObject(value: string): string {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("GLM_PROVIDER_HEALTH_RESPONSE_INVALID");
  }
  return value.slice(start, end + 1);
}

function parseHealthResponseBody(text: string): unknown {
  if (text.length === 0 || text.length > 20_000) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function isHealthCredential(
  credential: unknown
): credential is GlmProviderHealthDiagnosticCredential {
  return (
    isRecord(credential) &&
    typeof credential.apiKey === "string" &&
    credential.apiKey.trim().length >= 8 &&
    credential.apiKey.length <= 512
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
