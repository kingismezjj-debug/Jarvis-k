import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  BrainPlannerRequestSchema,
  BrainPlannerResultSchema,
  type BrainPlannerRequest,
  type BrainPlannerResult
} from "@jarvis-k/contracts";

export type OpenAiCompatibleProviderFamily =
  | "openai"
  | "deepseek"
  | "qwen"
  | "glm";

export type OpenAiCompatibleHeavyPlannerProfileId =
  | "openai.gpt-4.1-mini"
  | "deepseek.v4-flash"
  | "qwen.flash"
  | "glm.4.7-flash";

export type OpenAiCompatibleHeavyPlannerProviderId =
  | "heavy-planner.openai-compatible.openai"
  | "heavy-planner.openai-compatible.deepseek"
  | "heavy-planner.openai-compatible.qwen"
  | "heavy-planner.openai-compatible.glm";

export interface OpenAiCompatibleHeavyPlannerProfile {
  readonly providerId: OpenAiCompatibleHeavyPlannerProviderId;
  readonly family: OpenAiCompatibleProviderFamily;
  readonly profileId: OpenAiCompatibleHeavyPlannerProfileId;
  readonly baseUrl: string;
  readonly chatCompletionsEndpoint: string;
  readonly defaultModelId: string;
  readonly candidateModelIds: readonly string[];
  readonly runtimeDefaultEnabled: false;
  readonly exactRuntimeApprovalRequired: true;
  readonly credentialConfigured: false;
  readonly credentialAccessApproved: false;
  readonly networkAccessApproved: false;
  readonly healthDiagnosticApproved: false;
  readonly heavyPlannerAcceptanceApproved: false;
}

export interface OpenAiCompatibleHeavyPlannerFixtureRequest {
  readonly providerId: OpenAiCompatibleHeavyPlannerProviderId;
  readonly profileId: OpenAiCompatibleHeavyPlannerProfileId;
  readonly modelId: string;
  readonly timeoutMs: 30_000;
  readonly body: OpenAiCompatibleChatCompletionFixtureRequestBody;
}

export interface OpenAiCompatibleChatCompletionFixtureRequestBody {
  readonly model: string;
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
  readonly max_tokens: 700;
}

export interface OpenAiCompatibleHeavyPlannerFixtureTransportResponse {
  readonly status: number;
  readonly body: unknown;
}

export interface OpenAiCompatibleHeavyPlannerFixtureTransport {
  send(
    request: OpenAiCompatibleHeavyPlannerFixtureRequest
  ): Promise<OpenAiCompatibleHeavyPlannerFixtureTransportResponse>;
}

export interface OpenAiCompatibleHeavyPlannerFixtureProviderOptions {
  readonly profileId: OpenAiCompatibleHeavyPlannerProfileId;
  readonly transport: OpenAiCompatibleHeavyPlannerFixtureTransport;
  readonly now?: () => Date;
}

export type OpenAiCompatibleFixtureFailureClass =
  | "authentication_rejected"
  | "rate_limited"
  | "model_unavailable"
  | "provider_unavailable"
  | "provider_execution_failed"
  | "invalid_output"
  | "unsafe_output";

export interface OpenAiCompatibleFixtureFailureClassification {
  readonly failureClass: OpenAiCompatibleFixtureFailureClass;
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

const OPENAI_COMPATIBLE_HEAVY_PLANNER_TIMEOUT_MS = 30_000;
const OPENAI_COMPATIBLE_HEAVY_PLANNER_MAX_OUTPUT_TOKENS = 700;
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

const PROFILES = [
  {
    providerId: "heavy-planner.openai-compatible.openai",
    family: "openai",
    profileId: "openai.gpt-4.1-mini",
    baseUrl: "https://api.openai.com/v1",
    chatCompletionsEndpoint: "https://api.openai.com/v1/chat/completions",
    defaultModelId: "gpt-4.1-mini",
    candidateModelIds: ["gpt-4.1-mini"],
    runtimeDefaultEnabled: false,
    exactRuntimeApprovalRequired: true,
    credentialConfigured: false,
    credentialAccessApproved: false,
    networkAccessApproved: false,
    healthDiagnosticApproved: false,
    heavyPlannerAcceptanceApproved: false
  },
  {
    providerId: "heavy-planner.openai-compatible.deepseek",
    family: "deepseek",
    profileId: "deepseek.v4-flash",
    baseUrl: "https://api.deepseek.com",
    chatCompletionsEndpoint: "https://api.deepseek.com/chat/completions",
    defaultModelId: "deepseek-v4-flash",
    candidateModelIds: ["deepseek-v4-flash", "deepseek-v4-pro"],
    runtimeDefaultEnabled: false,
    exactRuntimeApprovalRequired: true,
    credentialConfigured: false,
    credentialAccessApproved: false,
    networkAccessApproved: false,
    healthDiagnosticApproved: false,
    heavyPlannerAcceptanceApproved: false
  },
  {
    providerId: "heavy-planner.openai-compatible.qwen",
    family: "qwen",
    profileId: "qwen.flash",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    chatCompletionsEndpoint:
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    defaultModelId: "qwen-flash",
    candidateModelIds: ["qwen-flash", "qwen-plus", "qwen-turbo"],
    runtimeDefaultEnabled: false,
    exactRuntimeApprovalRequired: true,
    credentialConfigured: false,
    credentialAccessApproved: false,
    networkAccessApproved: false,
    healthDiagnosticApproved: false,
    heavyPlannerAcceptanceApproved: false
  },
  {
    providerId: "heavy-planner.openai-compatible.glm",
    family: "glm",
    profileId: "glm.4.7-flash",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    chatCompletionsEndpoint:
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    defaultModelId: "glm-4.7-flash",
    candidateModelIds: ["glm-4.7-flash", "glm-4.7-flashx"],
    runtimeDefaultEnabled: false,
    exactRuntimeApprovalRequired: true,
    credentialConfigured: false,
    credentialAccessApproved: false,
    networkAccessApproved: false,
    healthDiagnosticApproved: false,
    heavyPlannerAcceptanceApproved: false
  }
] as const satisfies readonly OpenAiCompatibleHeavyPlannerProfile[];

export class OpenAiCompatibleFixtureHeavyPlannerProvider
  implements HeavyPlannerProvider
{
  private readonly profile: OpenAiCompatibleHeavyPlannerProfile;
  private readonly now: () => Date;

  public constructor(
    private readonly options: OpenAiCompatibleHeavyPlannerFixtureProviderOptions
  ) {
    this.profile = getOpenAiCompatibleHeavyPlannerProfile(options.profileId);
    this.now = options.now ?? (() => new Date());
  }

  public async plan(
    request: BrainPlannerRequest
  ): Promise<BrainPlannerResult> {
    const parsedRequest = BrainPlannerRequestSchema.parse(request);
    if (parsedRequest.providerId !== this.profile.providerId) {
      throw new Error("OPENAI_COMPATIBLE_PROVIDER_MISMATCH");
    }

    let response: OpenAiCompatibleHeavyPlannerFixtureTransportResponse;
    try {
      response = await this.options.transport.send(
        createOpenAiCompatibleHeavyPlannerFixtureRequest(
          parsedRequest,
          this.profile.profileId
        )
      );
    } catch {
      return failureResult(
        classifyOpenAiCompatibleFixtureFailure({ kind: "transport" }),
        this.profile.providerId,
        this.now
      );
    }

    if (response.status < 200 || response.status >= 300) {
      return failureResult(
        classifyOpenAiCompatibleFixtureFailure({
          kind: "http",
          status: response.status
        }),
        this.profile.providerId,
        this.now
      );
    }

    try {
      return parseOpenAiCompatibleHeavyPlannerFixtureResponse(
        response.body,
        parsedRequest,
        this.profile.profileId,
        this.now
      );
    } catch (error) {
      return failureResult(
        classifyOpenAiCompatibleFixtureFailure({
          kind: isUnsafePlannerRejection(error)
            ? "unsafe_output"
            : "invalid_output"
        }),
        this.profile.providerId,
        this.now
      );
    }
  }
}

export function listOpenAiCompatibleHeavyPlannerProfiles(): readonly OpenAiCompatibleHeavyPlannerProfile[] {
  return PROFILES.map(cloneProfile);
}

export function getOpenAiCompatibleHeavyPlannerProfile(
  profileId: OpenAiCompatibleHeavyPlannerProfileId
): OpenAiCompatibleHeavyPlannerProfile {
  const profile = PROFILES.find((candidate) => candidate.profileId === profileId);
  if (!profile) {
    throw new Error("OPENAI_COMPATIBLE_PROFILE_UNSUPPORTED");
  }
  return cloneProfile(profile);
}

export function createOpenAiCompatibleHeavyPlannerFixtureRequest(
  request: BrainPlannerRequest,
  profileId: OpenAiCompatibleHeavyPlannerProfileId
): OpenAiCompatibleHeavyPlannerFixtureRequest {
  const parsedRequest = BrainPlannerRequestSchema.parse(request);
  const profile = getOpenAiCompatibleHeavyPlannerProfile(profileId);
  if (parsedRequest.providerId !== profile.providerId) {
    throw new Error("OPENAI_COMPATIBLE_PROVIDER_MISMATCH");
  }
  return {
    providerId: profile.providerId,
    profileId: profile.profileId,
    modelId: profile.defaultModelId,
    timeoutMs: OPENAI_COMPATIBLE_HEAVY_PLANNER_TIMEOUT_MS,
    body: {
      model: profile.defaultModelId,
      messages: [
        {
          role: "system",
          content:
            "Return only bounded BrainPlannerResult JSON. Do not call tools. Use directActionAttempted false."
        },
        {
          role: "user",
          content: JSON.stringify({
            providerId: profile.providerId,
            utterance: parsedRequest.utterance,
            source: parsedRequest.source,
            routerDecision: parsedRequest.routerDecision,
            allowedToolIds: parsedRequest.context?.allowedToolIds ?? []
          })
        }
      ],
      response_format: {
        type: "json_object"
      },
      stream: false,
      temperature: 0,
      max_tokens: OPENAI_COMPATIBLE_HEAVY_PLANNER_MAX_OUTPUT_TOKENS
    }
  };
}

export function parseOpenAiCompatibleHeavyPlannerFixtureResponse(
  body: unknown,
  request: BrainPlannerRequest,
  profileId: OpenAiCompatibleHeavyPlannerProfileId,
  now: () => Date = () => new Date()
): BrainPlannerResult {
  const parsedRequest = BrainPlannerRequestSchema.parse(request);
  const profile = getOpenAiCompatibleHeavyPlannerProfile(profileId);
  if (parsedRequest.providerId !== profile.providerId) {
    throw new Error("OPENAI_COMPATIBLE_PROVIDER_MISMATCH");
  }

  const output = extractAssistantContent(body);
  if (output.length > MAX_OUTPUT_CHARS || SECRET_PATTERN.test(output)) {
    throw new Error("OPENAI_COMPATIBLE_OUTPUT_INVALID");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(output);
  } catch {
    throw new Error("OPENAI_COMPATIBLE_OUTPUT_INVALID");
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
    throw new Error("OPENAI_COMPATIBLE_DIRECT_ACTION_REJECTED");
  }

  let plannerResult: BrainPlannerResult;
  try {
    plannerResult = BrainPlannerResultSchema.parse(normalized);
  } catch {
    throw new Error("OPENAI_COMPATIBLE_OUTPUT_INVALID");
  }
  if (plannerResult.providerId !== profile.providerId) {
    throw new Error("OPENAI_COMPATIBLE_PROVIDER_MISMATCH");
  }
  if (plannerResult.directActionAttempted !== false) {
    throw new Error("OPENAI_COMPATIBLE_DIRECT_ACTION_REJECTED");
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
        throw new Error("OPENAI_COMPATIBLE_TOOL_UNSUPPORTED");
      }
    }
  }
  return plannerResult;
}

export function classifyOpenAiCompatibleFixtureFailure(
  input:
    | { readonly kind: "http"; readonly status: number }
    | { readonly kind: "transport" }
    | { readonly kind: "invalid_output" }
    | { readonly kind: "unsafe_output" }
): OpenAiCompatibleFixtureFailureClassification {
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
    throw new Error("OPENAI_COMPATIBLE_RESPONSE_INVALID");
  }
  const choice = body.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    throw new Error("OPENAI_COMPATIBLE_RESPONSE_INVALID");
  }
  const message = choice.message;
  if (
    message.role !== "assistant" ||
    hasOwn(message, "tool_calls") ||
    hasOwn(message, "function_call") ||
    typeof message.content !== "string"
  ) {
    throw new Error("OPENAI_COMPATIBLE_TOOL_CALL_REJECTED");
  }
  return message.content;
}

function failureResult(
  classification: OpenAiCompatibleFixtureFailureClassification,
  providerId: OpenAiCompatibleHeavyPlannerProviderId,
  now: () => Date
): BrainPlannerResult {
  return BrainPlannerResultSchema.parse({
    providerId,
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
    "OPENAI_COMPATIBLE_TOOL_CALL_REJECTED",
    "OPENAI_COMPATIBLE_DIRECT_ACTION_REJECTED",
    "OPENAI_COMPATIBLE_TOOL_UNSUPPORTED"
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

function cloneProfile(
  profile: OpenAiCompatibleHeavyPlannerProfile
): OpenAiCompatibleHeavyPlannerProfile {
  return {
    ...profile,
    candidateModelIds: [...profile.candidateModelIds]
  };
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
