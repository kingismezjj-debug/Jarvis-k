import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  BrainPlannerRequestSchema,
  BrainPlannerResultSchema,
  type BrainPlannerRequest,
  type BrainPlannerResult
} from "@jarvis-k/contracts";

export const GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID = "heavy-planner.glm";
export const GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID = "glm-4.7";
export const GLM_RUNTIME_HEAVY_PLANNER_ORIGIN =
  "https://open.bigmodel.cn/api/coding/paas/v4";
export const GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT =
  `${GLM_RUNTIME_HEAVY_PLANNER_ORIGIN}/chat/completions`;
export const GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS = 45_000;
export const GLM_RUNTIME_HEAVY_PLANNER_MAX_ATTEMPTS = 1;
export const GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS = 512;

export interface GlmRuntimeHeavyPlannerCredential {
  readonly apiKey: string;
}

export interface GlmRuntimeHeavyPlannerTransportRequest {
  readonly url: typeof GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT;
  readonly headers: Record<string, string>;
  readonly body: GlmRuntimeChatCompletionRequest;
  readonly timeoutMs: typeof GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS;
}

export interface GlmRuntimeHeavyPlannerTransportResponse {
  readonly status: number;
  readonly body: unknown;
}

export type GlmRuntimeHeavyPlannerTransportFailureCategory =
  | "timeout"
  | "connection"
  | "unknown";

export class GlmRuntimeHeavyPlannerTransportFailure extends Error {
  public constructor(
    readonly category: GlmRuntimeHeavyPlannerTransportFailureCategory
  ) {
    super("GLM_RUNTIME_HEAVY_PLANNER_TRANSPORT_FAILURE");
  }
}

export interface GlmRuntimeHeavyPlannerTransport {
  send(
    request: GlmRuntimeHeavyPlannerTransportRequest
  ): Promise<GlmRuntimeHeavyPlannerTransportResponse>;
}

export interface GlmRuntimeHeavyPlannerProviderOptions {
  readonly credential: GlmRuntimeHeavyPlannerCredential;
  readonly transport: GlmRuntimeHeavyPlannerTransport;
  readonly now?: () => Date;
}

export interface GlmRuntimeChatCompletionMessage {
  readonly role: "system" | "user";
  readonly content: string;
}

export interface GlmRuntimeChatCompletionRequest {
  readonly model: typeof GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID;
  readonly messages: readonly [
    GlmRuntimeChatCompletionMessage,
    GlmRuntimeChatCompletionMessage
  ];
  readonly response_format: {
    readonly type: "json_object";
  };
  readonly stream: false;
  readonly temperature: 0;
  readonly max_tokens: typeof GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS;
}

export type GlmRuntimeHeavyPlannerFailureClass =
  | "authentication_rejected"
  | "rate_limited"
  | "model_unavailable"
  | "provider_unavailable"
  | "provider_execution_failed"
  | "invalid_output"
  | "unsafe_output";

export type GlmRuntimeHeavyPlannerFailureInput =
  | {
      readonly kind: "http";
      readonly status: number;
    }
  | {
      readonly kind: "transport";
    }
  | {
      readonly kind: "invalid_output";
    }
  | {
      readonly kind: "unsafe_output";
    };

export interface GlmRuntimeHeavyPlannerFailureClassification {
  readonly failureClass: GlmRuntimeHeavyPlannerFailureClass;
  readonly reasonCode:
    | "PROVIDER_UNAVAILABLE"
    | "PROVIDER_FAILED"
    | "INVALID_PLAN"
    | "UNSAFE_PLAN";
  readonly plannerFailureClass:
    | "PROVIDER_UNAVAILABLE"
    | "PROVIDER_EXECUTION_FAILED"
    | "PROVIDER_RESULT_INVALID"
    | "UNSAFE_PLAN";
}

const MAX_OUTPUT_CHARS = 20_000;
const JSON_FIELD_ALIASES = new Set([
  "result",
  "plannerResult",
  "brainPlannerResult"
]);
const ALLOWED_TOOL_IDS = new Set([
  "browser.open",
  "localApp.open",
  "chat.answer",
  "memory.search",
  "memory.status",
  "model.status",
  "observability.status",
  "system.settings"
]);
const SECRET_PATTERN =
  /(?:\bBearer\b|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret|sk-[A-Za-z0-9_-]{8,})/iu;

export class GlmRuntimeHeavyPlannerProvider implements HeavyPlannerProvider {
  private readonly now: () => Date;

  public constructor(
    private readonly options: GlmRuntimeHeavyPlannerProviderOptions
  ) {
    this.now = options.now ?? (() => new Date());
    if (!isGlmRuntimeCredential(options.credential)) {
      throw new Error("GLM_RUNTIME_HEAVY_PLANNER_CREDENTIAL_INVALID");
    }
  }

  public async plan(
    request: BrainPlannerRequest
  ): Promise<BrainPlannerResult> {
    const parsedRequest = BrainPlannerRequestSchema.parse(request);
    if (parsedRequest.providerId !== GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID) {
      throw new Error("GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_MISMATCH");
    }

    let response: GlmRuntimeHeavyPlannerTransportResponse;
    try {
      response = await this.options.transport.send({
        url: GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
        timeoutMs: GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${this.options.credential.apiKey}`,
          "Content-Type": "application/json"
        },
        body: createGlmRuntimeChatCompletionRequest(parsedRequest)
      });
    } catch {
      return failureResult(
        classifyGlmRuntimeHeavyPlannerFailure({ kind: "transport" }),
        this.now
      );
    }

    if (response.status < 200 || response.status >= 300) {
      return failureResult(
        classifyGlmRuntimeHeavyPlannerFailure({
          kind: "http",
          status: response.status
        }),
        this.now
      );
    }

    try {
      return parseGlmRuntimeHeavyPlannerResponse(
        response.body,
        parsedRequest,
        this.now
      );
    } catch (error) {
      return failureResult(
        classifyGlmRuntimeHeavyPlannerFailure({
          kind: isUnsafePlannerRejection(error)
            ? "unsafe_output"
            : "invalid_output"
        }),
        this.now
      );
    }
  }
}

export class FetchGlmRuntimeHeavyPlannerTransport
  implements GlmRuntimeHeavyPlannerTransport
{
  public async send(
    request: GlmRuntimeHeavyPlannerTransportRequest
  ): Promise<GlmRuntimeHeavyPlannerTransportResponse> {
    if (request.url !== GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT) {
      throw new Error("GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT_MISMATCH");
    }
    if (request.body.model !== GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID) {
      throw new Error("GLM_RUNTIME_HEAVY_PLANNER_MODEL_MISMATCH");
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
        body: parseResponseBody(text)
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

export function createGlmRuntimeChatCompletionRequest(
  request: BrainPlannerRequest
): GlmRuntimeChatCompletionRequest {
  const parsed = BrainPlannerRequestSchema.parse(request);
  if (parsed.providerId !== GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID) {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_MISMATCH");
  }

  return {
    model: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    messages: [
      {
        role: "system",
        content:
          [
            "Return one JSON object only. No Markdown.",
            `Use bounded BrainPlannerResult with providerId ${GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID}.`,
            "status must be planned, clarify, blocked, or unavailable.",
            "planned needs plan.summary, risk, requiresConfirmation, steps.",
            "clarify needs clarifyQuestion; blocked uses UNSAFE_PLAN.",
            "No tools, functions, execution, or direct actions.",
            "All directActionAttempted fields must be false."
          ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
          utterance: parsed.utterance,
          source: parsed.source,
          routerDecision: parsed.routerDecision,
          allowedToolIds: parsed.context?.allowedToolIds ?? []
        })
      }
    ],
    response_format: {
      type: "json_object"
    },
    stream: false,
    temperature: 0,
    max_tokens: GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS
  };
}

export function parseGlmRuntimeHeavyPlannerResponse(
  body: unknown,
  request: BrainPlannerRequest,
  now: () => Date = () => new Date()
): BrainPlannerResult {
  const parsedRequest = BrainPlannerRequestSchema.parse(request);
  const output = extractAssistantContent(body);
  if (output.length > MAX_OUTPUT_CHARS || SECRET_PATTERN.test(output)) {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_OUTPUT_INVALID");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(extractJsonObjectText(output));
  } catch {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_OUTPUT_INVALID");
  }
  const normalized = normalizeGlmRuntimePlannerResult(raw, now);
  if (hasDirectActionAttempt(normalized)) {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_DIRECT_ACTION_REJECTED");
  }

  let plannerResult: BrainPlannerResult;
  try {
    plannerResult = BrainPlannerResultSchema.parse(normalized);
  } catch {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_OUTPUT_INVALID");
  }
  if (plannerResult.providerId !== GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID) {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_MISMATCH");
  }
  if (plannerResult.plan) {
    const requestAllowedToolIds = new Set(
      parsedRequest.context?.allowedToolIds ?? []
    );
    for (const step of plannerResult.plan.steps) {
      if (
        !ALLOWED_TOOL_IDS.has(step.toolId) ||
        !requestAllowedToolIds.has(step.toolId)
      ) {
        throw new Error("GLM_RUNTIME_HEAVY_PLANNER_TOOL_UNSUPPORTED");
      }
    }
  }
  return plannerResult;
}

export function normalizeGlmRuntimePlannerResult(
  raw: unknown,
  now: () => Date = () => new Date()
): unknown {
  const unwrapped = unwrapPlannerResult(raw);
  if (!isRecord(unwrapped)) {
    return unwrapped;
  }
  const status = normalizePlannerStatus(unwrapped.status);
  const plan = normalizePlannerPlan(unwrapped.plan ?? unwrapped, status);
  const clarifyQuestion = normalizeClarifyQuestion(unwrapped);
  return {
    providerId: normalizeString(
      unwrapped.providerId,
      GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID
    ),
    status,
    reasonCode: normalizePlannerReasonCode(unwrapped.reasonCode, status),
    failureClass: normalizePlannerFailureClass(
      unwrapped.failureClass,
      status
    ),
    ...(plan === undefined ? {} : { plan }),
    ...(clarifyQuestion === undefined ? {} : { clarifyQuestion }),
    directActionAttempted:
      unwrapped.directActionAttempted === undefined
        ? false
        : unwrapped.directActionAttempted,
    plannedAt: normalizeString(unwrapped.plannedAt, now().toISOString())
  };
}

export function classifyGlmRuntimeHeavyPlannerFailure(
  input: GlmRuntimeHeavyPlannerFailureInput
): GlmRuntimeHeavyPlannerFailureClassification {
  if (input.kind === "transport") {
    return {
      failureClass: "provider_execution_failed",
      reasonCode: "PROVIDER_FAILED",
      plannerFailureClass: "PROVIDER_EXECUTION_FAILED"
    };
  }
  if (input.kind === "invalid_output") {
    return {
      failureClass: "invalid_output",
      reasonCode: "INVALID_PLAN",
      plannerFailureClass: "PROVIDER_RESULT_INVALID"
    };
  }
  if (input.kind === "unsafe_output") {
    return {
      failureClass: "unsafe_output",
      reasonCode: "UNSAFE_PLAN",
      plannerFailureClass: "UNSAFE_PLAN"
    };
  }
  if (input.status === 401 || input.status === 403) {
    return {
      failureClass: "authentication_rejected",
      reasonCode: "PROVIDER_UNAVAILABLE",
      plannerFailureClass: "PROVIDER_UNAVAILABLE"
    };
  }
  if (input.status === 429) {
    return {
      failureClass: "rate_limited",
      reasonCode: "PROVIDER_UNAVAILABLE",
      plannerFailureClass: "PROVIDER_UNAVAILABLE"
    };
  }
  if (input.status === 404) {
    return {
      failureClass: "model_unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      plannerFailureClass: "PROVIDER_UNAVAILABLE"
    };
  }
  if (input.status === 408 || input.status === 503) {
    return {
      failureClass: "provider_unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      plannerFailureClass: "PROVIDER_UNAVAILABLE"
    };
  }
  return {
    failureClass: "provider_execution_failed",
    reasonCode: "PROVIDER_FAILED",
    plannerFailureClass: "PROVIDER_EXECUTION_FAILED"
  };
}

export function extractJsonObjectText(output: string): string {
  const trimmed = output.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "")
    .trim();
  if (unfenced.startsWith("{") && unfenced.endsWith("}")) {
    return unfenced;
  }

  const start = unfenced.indexOf("{");
  if (start < 0) {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_OUTPUT_INVALID");
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < unfenced.length; index += 1) {
    const character = unfenced[index];
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
        return unfenced.slice(start, index + 1);
      }
    }
  }
  throw new Error("GLM_RUNTIME_HEAVY_PLANNER_OUTPUT_INVALID");
}

export function classifyGlmRuntimeHeavyPlannerTransportFailure(
  error: unknown,
  timedOut: boolean
): GlmRuntimeHeavyPlannerTransportFailureCategory {
  if (timedOut) {
    return "timeout";
  }
  if (error instanceof TypeError) {
    return "connection";
  }
  return "unknown";
}

function unwrapPlannerResult(raw: unknown): unknown {
  if (!isRecord(raw)) {
    return raw;
  }
  for (const key of JSON_FIELD_ALIASES) {
    const value = raw[key];
    if (isRecord(value)) {
      return value;
    }
  }
  return raw;
}

function normalizePlannerStatus(value: unknown): BrainPlannerResult["status"] {
  const status = normalizeToken(value);
  if (
    status === "planned" ||
    status === "plan" ||
    status === "success" ||
    status === "ok"
  ) {
    return "planned";
  }
  if (
    status === "clarify" ||
    status === "clarification" ||
    status === "clarification_required" ||
    status === "needs_clarification" ||
    status === "need_clarification"
  ) {
    return "clarify";
  }
  if (
    status === "blocked" ||
    status === "block" ||
    status === "unsafe" ||
    status === "denied" ||
    status === "deny"
  ) {
    return "blocked";
  }
  return "unavailable";
}

function normalizePlannerReasonCode(
  value: unknown,
  status: BrainPlannerResult["status"]
): BrainPlannerResult["reasonCode"] {
  const reasonCode = normalizeToken(value).toUpperCase();
  if (isPlannerReasonCode(reasonCode)) {
    return reasonCode;
  }
  if (status === "planned") {
    return "COMPLEX_REQUEST";
  }
  if (status === "clarify") {
    return "CLARIFY_REQUIRED";
  }
  if (status === "blocked") {
    return "UNSAFE_PLAN";
  }
  return "INVALID_PLAN";
}

function normalizePlannerFailureClass(
  value: unknown,
  status: BrainPlannerResult["status"]
): BrainPlannerResult["failureClass"] {
  const normalized = normalizeToken(value);
  if (normalized === "none") {
    return "none";
  }
  const failureClass = normalized.toUpperCase();
  if (isPlannerFailureClassUpper(failureClass)) {
    return failureClass;
  }
  if (status === "planned") {
    return "none";
  }
  if (status === "clarify") {
    return "CLARIFY_REQUIRED";
  }
  if (status === "blocked") {
    return "UNSAFE_PLAN";
  }
  return "PROVIDER_RESULT_INVALID";
}

function normalizePlannerPlan(
  value: unknown,
  status: BrainPlannerResult["status"]
): Record<string, unknown> | undefined {
  if (status !== "planned" || !isRecord(value)) {
    return undefined;
  }
  const rawSteps = Array.isArray(value.steps) ? value.steps : undefined;
  if (rawSteps === undefined) {
    return undefined;
  }
  const risk = normalizePlanRisk(value.risk);
  return {
    summary: normalizeString(value.summary, "Bounded GLM runtime plan."),
    risk,
    requiresConfirmation:
      value.requiresConfirmation === undefined ||
      value.requiresConfirmation === null
        ? risk !== "low"
        : value.requiresConfirmation,
    steps: rawSteps.slice(0, 8).map((step, index) =>
      normalizePlannerStep(step, index)
    ),
    directActionAttempted:
      value.directActionAttempted === undefined
        ? false
        : value.directActionAttempted
  };
}

function normalizePlannerStep(
  value: unknown,
  index: number
): Record<string, unknown> {
  const record = isRecord(value) ? value : {};
  const risk = normalizePlanRisk(record.risk);
  return {
    id: normalizeString(record.id, `step-${index + 1}`),
    toolId: normalizeString(
      record.toolId ?? record.tool ?? record.action,
      "memory.search"
    ),
    title: normalizeString(record.title ?? record.name, "Bounded tool step"),
    args: isRecord(record.args) ? record.args : {},
    risk,
    requiresConfirmation:
      record.requiresConfirmation === undefined ||
      record.requiresConfirmation === null
        ? risk !== "low"
        : record.requiresConfirmation,
    directActionAttempted:
      record.directActionAttempted === undefined
        ? false
        : record.directActionAttempted
  };
}

function normalizePlanRisk(value: unknown): "low" | "medium" | "high" | "blocked" {
  const risk = normalizeToken(value);
  if (risk === "low" || risk === "read_only" || risk === "readonly") {
    return "low";
  }
  if (risk === "medium" || risk === "mutating") {
    return "medium";
  }
  if (risk === "high" || risk === "destructive") {
    return "high";
  }
  if (risk === "blocked" || risk === "unsafe") {
    return "blocked";
  }
  return "medium";
}

function normalizeClarifyQuestion(
  value: Record<string, unknown>
): string | undefined {
  const candidate =
    value.clarifyQuestion ??
    value.clarificationQuestion ??
    value.question ??
    value.message;
  if (typeof candidate !== "string") {
    return undefined;
  }
  const normalized = candidate.trim().replace(/\s+/gu, " ").slice(0, 500);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().replace(/\s+/gu, " ");
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeToken(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/[\s-]+/gu, "_").toLowerCase()
    : "";
}

function isPlannerReasonCode(
  value: string
): value is BrainPlannerResult["reasonCode"] {
  return new Set([
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
    "FIXTURE_FALLBACK"
  ]).has(value);
}

function isPlannerFailureClassUpper(
  value: string
): value is Exclude<BrainPlannerResult["failureClass"], "none"> {
  return new Set([
    "PLANNER_NOT_NEEDED",
    "PROVIDER_UNAVAILABLE",
    "PROVIDER_EXECUTION_FAILED",
    "PROVIDER_RESULT_INVALID",
    "UNSAFE_PLAN",
    "CLARIFY_REQUIRED",
    "FIXTURE_FALLBACK"
  ]).has(value);
}

function extractAssistantContent(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.choices)) {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_RESPONSE_INVALID");
  }
  const choice = body.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_RESPONSE_INVALID");
  }
  const message = choice.message;
  if (
    message.role !== "assistant" ||
    hasOwn(message, "tool_calls") ||
    hasOwn(message, "function_call") ||
    typeof message.content !== "string"
  ) {
    throw new Error("GLM_RUNTIME_HEAVY_PLANNER_TOOL_CALL_REJECTED");
  }
  return message.content;
}

function parseResponseBody(text: string): unknown {
  if (text.length === 0) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    // Keep malformed successful responses inside the parser's fail-closed path.
    return {};
  }
}

function failureResult(
  classification: GlmRuntimeHeavyPlannerFailureClassification,
  now: () => Date
): BrainPlannerResult {
  return BrainPlannerResultSchema.parse({
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    status:
      classification.failureClass === "unsafe_output"
        ? "blocked"
        : "unavailable",
    reasonCode: classification.reasonCode,
    failureClass: classification.plannerFailureClass,
    directActionAttempted: false,
    plannedAt: now().toISOString()
  });
}

function isUnsafePlannerRejection(error: unknown): boolean {
  const code = error instanceof Error ? error.message : "";
  return new Set([
    "GLM_RUNTIME_HEAVY_PLANNER_TOOL_CALL_REJECTED",
    "GLM_RUNTIME_HEAVY_PLANNER_DIRECT_ACTION_REJECTED",
    "GLM_RUNTIME_HEAVY_PLANNER_TOOL_UNSUPPORTED"
  ]).has(code);
}

function hasDirectActionAttempt(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  if (
    hasOwn(value, "directActionAttempted") &&
    value.directActionAttempted !== false
  ) {
    return true;
  }
  const plan = value.plan;
  if (!isRecord(plan)) {
    return false;
  }
  if (
    hasOwn(plan, "directActionAttempted") &&
    plan.directActionAttempted !== false
  ) {
    return true;
  }
  return Array.isArray(plan.steps)
    ? plan.steps.some(
        (step) =>
          isRecord(step) &&
          hasOwn(step, "directActionAttempted") &&
          step.directActionAttempted !== false
      )
    : false;
}

function isGlmRuntimeCredential(
  credential: unknown
): credential is GlmRuntimeHeavyPlannerCredential {
  return (
    isRecord(credential) &&
    typeof credential.apiKey === "string" &&
    credential.apiKey.trim().length >= 8 &&
    credential.apiKey.length <= 1024
  );
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
