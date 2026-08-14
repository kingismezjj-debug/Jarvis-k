import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  BrainPlannerRequestSchema,
  BrainPlannerResultSchema,
  type BrainPlannerRequest,
  type BrainPlannerResult
} from "@jarvis-k/contracts";

export const GLM_HEAVY_PLANNER_PROVIDER_ID = "heavy-planner.glm";
export const GLM_HEAVY_PLANNER_FIXTURE_MODEL_ID = "glm-fixture";
export const GLM_HEAVY_PLANNER_FIXTURE_TIMEOUT_MS = 20_000;
export const GLM_HEAVY_PLANNER_MAX_OUTPUT_TOKENS = 700;

export interface GlmHeavyPlannerFixtureCredential {
  readonly value: string;
}

export interface GlmChatCompletionFixtureMessage {
  readonly role: "system" | "user";
  readonly content: string;
}

export interface GlmChatCompletionFixtureRequest {
  readonly model: typeof GLM_HEAVY_PLANNER_FIXTURE_MODEL_ID;
  readonly messages: readonly [
    GlmChatCompletionFixtureMessage,
    GlmChatCompletionFixtureMessage
  ];
  readonly response_format: {
    readonly type: "json_object";
  };
  readonly temperature: 0;
  readonly max_tokens: typeof GLM_HEAVY_PLANNER_MAX_OUTPUT_TOKENS;
}

export interface GlmHeavyPlannerFixtureTransportRequest {
  readonly timeoutMs: typeof GLM_HEAVY_PLANNER_FIXTURE_TIMEOUT_MS;
  readonly body: GlmChatCompletionFixtureRequest;
}

export interface GlmHeavyPlannerFixtureTransportResponse {
  readonly status: number;
  readonly body: unknown;
}

export interface GlmHeavyPlannerFixtureTransport {
  send(
    request: GlmHeavyPlannerFixtureTransportRequest
  ): Promise<GlmHeavyPlannerFixtureTransportResponse>;
}

export interface GlmHeavyPlannerProviderOptions {
  readonly credential: GlmHeavyPlannerFixtureCredential;
  readonly transport: GlmHeavyPlannerFixtureTransport;
  readonly now?: () => Date;
}

export const GLM_HEAVY_PLANNER_FIXTURE_FAILURE_CLASSES = [
  "authentication_rejected",
  "rate_limited",
  "model_unavailable",
  "provider_unavailable",
  "provider_execution_failed",
  "invalid_output",
  "unsafe_output"
] as const;

export type GlmHeavyPlannerFixtureFailureClass =
  (typeof GLM_HEAVY_PLANNER_FIXTURE_FAILURE_CLASSES)[number];

export type GlmHeavyPlannerFixtureFailureInput =
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

export interface GlmHeavyPlannerFixtureFailureClassification {
  readonly failureClass: GlmHeavyPlannerFixtureFailureClass;
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

export class GlmHeavyPlannerProvider implements HeavyPlannerProvider {
  private readonly now: () => Date;

  public constructor(
    private readonly options: GlmHeavyPlannerProviderOptions
  ) {
    this.now = options.now ?? (() => new Date());
    if (!isGlmHeavyPlannerFixtureCredential(options.credential)) {
      throw new Error("GLM_HEAVY_PLANNER_FIXTURE_CREDENTIAL_INVALID");
    }
  }

  public async plan(
    request: BrainPlannerRequest
  ): Promise<BrainPlannerResult> {
    const parsedRequest = BrainPlannerRequestSchema.parse(request);
    if (parsedRequest.providerId !== GLM_HEAVY_PLANNER_PROVIDER_ID) {
      throw new Error("GLM_HEAVY_PLANNER_PROVIDER_MISMATCH");
    }

    let response: GlmHeavyPlannerFixtureTransportResponse;
    try {
      response = await this.options.transport.send({
        timeoutMs: GLM_HEAVY_PLANNER_FIXTURE_TIMEOUT_MS,
        body: createGlmHeavyPlannerFixtureRequest(parsedRequest)
      });
    } catch {
      return failureResult(
        classifyGlmHeavyPlannerFixtureFailure({ kind: "transport" }),
        this.now
      );
    }

    if (response.status < 200 || response.status >= 300) {
      return failureResult(
        classifyGlmHeavyPlannerFixtureFailure({
          kind: "http",
          status: response.status
        }),
        this.now
      );
    }

    try {
      return parseGlmHeavyPlannerFixtureResponse(
        response.body,
        parsedRequest,
        this.now
      );
    } catch (error) {
      return failureResult(
        classifyGlmHeavyPlannerFixtureFailure({
          kind: isUnsafePlannerRejection(error)
            ? "unsafe_output"
            : "invalid_output"
        }),
        this.now
      );
    }
  }
}

export function createGlmHeavyPlannerFixtureRequest(
  request: BrainPlannerRequest
): GlmChatCompletionFixtureRequest {
  const parsed = BrainPlannerRequestSchema.parse(request);
  if (parsed.providerId !== GLM_HEAVY_PLANNER_PROVIDER_ID) {
    throw new Error("GLM_HEAVY_PLANNER_PROVIDER_MISMATCH");
  }

  return {
    model: GLM_HEAVY_PLANNER_FIXTURE_MODEL_ID,
    messages: [
      {
        role: "system",
        content:
          "Return only bounded BrainPlannerResult JSON. Do not call tools or functions. Use directActionAttempted false."
      },
      {
        role: "user",
        content: JSON.stringify({
          providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
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
    temperature: 0,
    max_tokens: GLM_HEAVY_PLANNER_MAX_OUTPUT_TOKENS
  };
}

export function parseGlmHeavyPlannerFixtureResponse(
  body: unknown,
  request: BrainPlannerRequest,
  now: () => Date = () => new Date()
): BrainPlannerResult {
  const parsedRequest = BrainPlannerRequestSchema.parse(request);
  const output = extractAssistantContent(body);
  if (output.length > MAX_OUTPUT_CHARS || SECRET_PATTERN.test(output)) {
    throw new Error("GLM_HEAVY_PLANNER_OUTPUT_INVALID");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(output);
  } catch {
    throw new Error("GLM_HEAVY_PLANNER_OUTPUT_INVALID");
  }
  const normalized =
    isRecord(raw)
      ? {
          ...raw,
          ...(raw.plan === null ? { plan: undefined } : {}),
          ...(raw.clarifyQuestion === null
            ? { clarifyQuestion: undefined }
            : {}),
          ...(raw.plannedAt === undefined
            ? { plannedAt: now().toISOString() }
            : {})
        }
      : raw;
  if (hasDirectActionAttempt(normalized)) {
    throw new Error("GLM_HEAVY_PLANNER_DIRECT_ACTION_REJECTED");
  }
  let plannerResult: BrainPlannerResult;
  try {
    plannerResult = BrainPlannerResultSchema.parse(normalized);
  } catch {
    throw new Error("GLM_HEAVY_PLANNER_OUTPUT_INVALID");
  }

  if (plannerResult.providerId !== GLM_HEAVY_PLANNER_PROVIDER_ID) {
    throw new Error("GLM_HEAVY_PLANNER_PROVIDER_MISMATCH");
  }
  if (plannerResult.directActionAttempted !== false) {
    throw new Error("GLM_HEAVY_PLANNER_DIRECT_ACTION_REJECTED");
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
        throw new Error("GLM_HEAVY_PLANNER_TOOL_UNSUPPORTED");
      }
    }
  }
  return plannerResult;
}

export function classifyGlmHeavyPlannerFixtureFailure(
  input: GlmHeavyPlannerFixtureFailureInput
): GlmHeavyPlannerFixtureFailureClassification {
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

function extractAssistantContent(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.choices)) {
    throw new Error("GLM_HEAVY_PLANNER_RESPONSE_INVALID");
  }
  const choice = body.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    throw new Error("GLM_HEAVY_PLANNER_RESPONSE_INVALID");
  }
  const message = choice.message;
  if (
    message.role !== "assistant" ||
    hasOwn(message, "tool_calls") ||
    hasOwn(message, "function_call") ||
    typeof message.content !== "string"
  ) {
    throw new Error("GLM_HEAVY_PLANNER_TOOL_CALL_REJECTED");
  }
  return message.content;
}

function failureResult(
  classification: GlmHeavyPlannerFixtureFailureClassification,
  now: () => Date
): BrainPlannerResult {
  return BrainPlannerResultSchema.parse({
    providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
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
    "GLM_HEAVY_PLANNER_TOOL_CALL_REJECTED",
    "GLM_HEAVY_PLANNER_DIRECT_ACTION_REJECTED",
    "GLM_HEAVY_PLANNER_TOOL_UNSUPPORTED"
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

export function isGlmHeavyPlannerFixtureCredential(
  credential: unknown
): credential is GlmHeavyPlannerFixtureCredential {
  return (
    isRecord(credential) &&
    typeof credential.value === "string" &&
    /^fixture-[A-Za-z0-9_-]{4,120}$/u.test(credential.value)
  );
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
