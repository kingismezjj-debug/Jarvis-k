import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import {
  ChatAnswerRequestSchema,
  ChatAnswerResultSchema,
  type ChatAnswerRequest,
  type ChatAnswerResult
} from "@jarvis-k/contracts";

export type OpenAiCompatibleChatAnswerProviderFamily =
  | "openai"
  | "deepseek"
  | "qwen"
  | "glm";

export type OpenAiCompatibleChatAnswerProfileId =
  | "openai.gpt-4.1-mini"
  | "deepseek.v4-flash"
  | "qwen.flash"
  | "glm.4.7-flash";

export type OpenAiCompatibleChatAnswerProviderId =
  | "chat-answer.openai-compatible.openai"
  | "chat-answer.openai-compatible.deepseek"
  | "chat-answer.openai-compatible.qwen"
  | "chat-answer.openai-compatible.glm";

export interface OpenAiCompatibleChatAnswerProfile {
  readonly providerId: OpenAiCompatibleChatAnswerProviderId;
  readonly family: OpenAiCompatibleChatAnswerProviderFamily;
  readonly profileId: OpenAiCompatibleChatAnswerProfileId;
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
  readonly chatAnswerAcceptanceApproved: false;
}

export interface OpenAiCompatibleChatAnswerFixtureRequest {
  readonly providerId: OpenAiCompatibleChatAnswerProviderId;
  readonly profileId: OpenAiCompatibleChatAnswerProfileId;
  readonly modelId: string;
  readonly timeoutMs: 20_000;
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
  readonly max_tokens: 350;
}

export interface OpenAiCompatibleChatAnswerFixtureTransportResponse {
  readonly status: number;
  readonly body: unknown;
}

export interface OpenAiCompatibleChatAnswerFixtureTransport {
  send(
    request: OpenAiCompatibleChatAnswerFixtureRequest
  ): Promise<OpenAiCompatibleChatAnswerFixtureTransportResponse>;
}

export interface OpenAiCompatibleChatAnswerFixtureProviderOptions {
  readonly profileId: OpenAiCompatibleChatAnswerProfileId;
  readonly transport: OpenAiCompatibleChatAnswerFixtureTransport;
  readonly now?: () => Date;
}

export type OpenAiCompatibleChatAnswerFixtureFailureClass =
  | "authentication_rejected"
  | "rate_limited"
  | "model_unavailable"
  | "provider_unavailable"
  | "provider_execution_failed"
  | "invalid_output"
  | "unsafe_output";

export interface OpenAiCompatibleChatAnswerFixtureFailureClassification {
  readonly failureClass: OpenAiCompatibleChatAnswerFixtureFailureClass;
  readonly reasonCode:
    | "PROVIDER_UNAVAILABLE"
    | "PROVIDER_FAILED"
    | "INVALID_OUTPUT"
    | "UNSAFE_OR_BLOCKED";
  readonly chatAnswerFailureClass:
    | "PROVIDER_UNAVAILABLE"
    | "PROVIDER_EXECUTION_FAILED"
    | "PROVIDER_RESULT_INVALID"
    | "UNSAFE_OR_BLOCKED";
}

const OPENAI_COMPATIBLE_CHAT_ANSWER_TIMEOUT_MS = 20_000;
const OPENAI_COMPATIBLE_CHAT_ANSWER_MAX_OUTPUT_TOKENS = 350;
const MAX_OUTPUT_CHARS = 12_000;
const JSON_FIELD_ALIASES = new Set([
  "result",
  "answerResult",
  "chatAnswerResult"
]);
const SECRET_PATTERN =
  /(?:\bBearer\b|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret|sk-[A-Za-z0-9_-]{8,})/iu;
const EXECUTION_SHAPED_OUTPUT_PATTERN =
  /(?:tool_calls|function_call|powershell|cmd\.exe|exec|spawn|delete|format|shutdown|reboot|rm\s+-rf)/iu;
const REFUSAL_SIGNAL_PATTERN =
  /(?:cannot\s+help|can't\s+help|cannot\s+comply|can't\s+comply|do\s+not\s+assist|won't\s+assist|refus|den(?:y|ied)|not\s+able\s+to\s+assist)/iu;
const QUESTION_SIGNAL_PATTERN =
  /(?:[?？]\s*$|^(?:which|what|where|when|who|why|how)\b|^(?:please|could\s+you|can\s+you)\s+(?:clarify|specify|provide)\b|^(?:please\s+share|please\s+tell|please\s+describe)\b|^(?:do\s+you\s+mean|which\s+subsystem|which\s+goal|which\s+target|what\s+goal)\b|^(?:i\s+need|need)\s+(?:more\s+detail|more\s+details|more\s+context|the\s+target|the\s+goal)\b|^(?:please)\s+(?:specify|provide)\b|^(?:请|能否|可以)\S*(?:说明|澄清|补充|提供))/iu;

const PROFILES = [
  {
    providerId: "chat-answer.openai-compatible.openai",
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
    chatAnswerAcceptanceApproved: false
  },
  {
    providerId: "chat-answer.openai-compatible.deepseek",
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
    chatAnswerAcceptanceApproved: false
  },
  {
    providerId: "chat-answer.openai-compatible.qwen",
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
    chatAnswerAcceptanceApproved: false
  },
  {
    providerId: "chat-answer.openai-compatible.glm",
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
    chatAnswerAcceptanceApproved: false
  }
] as const satisfies readonly OpenAiCompatibleChatAnswerProfile[];

export class OpenAiCompatibleFixtureChatAnswerProvider
  implements ChatAnswerProvider
{
  private readonly profile: OpenAiCompatibleChatAnswerProfile;
  private readonly now: () => Date;

  public constructor(
    private readonly options: OpenAiCompatibleChatAnswerFixtureProviderOptions
  ) {
    this.profile = getOpenAiCompatibleChatAnswerProfile(options.profileId);
    this.now = options.now ?? (() => new Date());
  }

  public async answer(request: ChatAnswerRequest): Promise<ChatAnswerResult> {
    const parsedRequest = ChatAnswerRequestSchema.parse(request);
    if (parsedRequest.providerId !== this.profile.providerId) {
      throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_PROVIDER_MISMATCH");
    }

    let response: OpenAiCompatibleChatAnswerFixtureTransportResponse;
    try {
      response = await this.options.transport.send(
        createOpenAiCompatibleChatAnswerFixtureRequest(
          parsedRequest,
          this.profile.profileId
        )
      );
    } catch {
      return failureResult(
        classifyOpenAiCompatibleChatAnswerFixtureFailure({
          kind: "transport"
        }),
        this.profile.providerId,
        this.now
      );
    }

    if (response.status < 200 || response.status >= 300) {
      return failureResult(
        classifyOpenAiCompatibleChatAnswerFixtureFailure({
          kind: "http",
          status: response.status
        }),
        this.profile.providerId,
        this.now
      );
    }

    try {
      return parseOpenAiCompatibleChatAnswerFixtureResponse(
        response.body,
        parsedRequest,
        this.profile.profileId,
        this.now
      );
    } catch (error) {
      return failureResult(
        classifyOpenAiCompatibleChatAnswerFixtureFailure({
          kind: isUnsafeChatAnswerRejection(error)
            ? "unsafe_output"
            : "invalid_output"
        }),
        this.profile.providerId,
        this.now
      );
    }
  }
}

export function listOpenAiCompatibleChatAnswerProfiles(): readonly OpenAiCompatibleChatAnswerProfile[] {
  return PROFILES.map(cloneProfile);
}

export function getOpenAiCompatibleChatAnswerProfile(
  profileId: OpenAiCompatibleChatAnswerProfileId
): OpenAiCompatibleChatAnswerProfile {
  const profile = PROFILES.find(
    (candidate) => candidate.profileId === profileId
  );
  if (!profile) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_PROFILE_UNSUPPORTED");
  }
  return cloneProfile(profile);
}

export function createOpenAiCompatibleChatAnswerFixtureRequest(
  request: ChatAnswerRequest,
  profileId: OpenAiCompatibleChatAnswerProfileId
): OpenAiCompatibleChatAnswerFixtureRequest {
  const parsedRequest = ChatAnswerRequestSchema.parse(request);
  const profile = getOpenAiCompatibleChatAnswerProfile(profileId);
  if (parsedRequest.providerId !== profile.providerId) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_PROVIDER_MISMATCH");
  }
  return {
    providerId: profile.providerId,
    profileId: profile.profileId,
    modelId: profile.defaultModelId,
    timeoutMs: OPENAI_COMPATIBLE_CHAT_ANSWER_TIMEOUT_MS,
    body: {
      model: profile.defaultModelId,
      messages: [
        {
          role: "system",
          content:
            [
              "Return only bounded ChatAnswerResult JSON. Do not call tools. Use directActionAttempted false, rawProviderResponsePersisted false, and credentialExposed false.",
              parsedRequest.preferenceProjection?.preferredResponseLanguage ===
              "zh"
                ? "User-controlled preference projection requests Chinese answer text when producing answered results."
                : "",
              parsedRequest.preferenceProjection?.preferredResponseLength ===
              "short"
                ? "User-controlled preference projection requests short answer text."
                : "",
              parsedRequest.preferenceProjection?.preferredResponseLength ===
              "detailed"
                ? "User-controlled preference projection requests more detailed answer text while staying bounded."
                : "",
              parsedRequest.preferenceProjection?.preferredResponseStyle
                ? `User-controlled preference projection requests ${parsedRequest.preferenceProjection.preferredResponseStyle} answer style.`
                : ""
            ]
              .filter((part) => part.length > 0)
              .join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            providerId: profile.providerId,
            utterance: parsedRequest.utterance,
            source: parsedRequest.source,
            routerDecision: parsedRequest.routerDecision,
            preferenceProjection: parsedRequest.preferenceProjection
          })
        }
      ],
      response_format: {
        type: "json_object"
      },
      stream: false,
      temperature: 0,
      max_tokens: OPENAI_COMPATIBLE_CHAT_ANSWER_MAX_OUTPUT_TOKENS
    }
  };
}

export function parseOpenAiCompatibleChatAnswerFixtureResponse(
  body: unknown,
  request: ChatAnswerRequest,
  profileId: OpenAiCompatibleChatAnswerProfileId,
  now: () => Date = () => new Date()
): ChatAnswerResult {
  const parsedRequest = ChatAnswerRequestSchema.parse(request);
  const profile = getOpenAiCompatibleChatAnswerProfile(profileId);
  if (parsedRequest.providerId !== profile.providerId) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_PROVIDER_MISMATCH");
  }

  const output = extractAssistantPayload(body);
  if (isUnsafeAssistantPayload(output)) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_OUTPUT_UNSAFE");
  }

  let raw: unknown;
  if (typeof output === "string") {
    try {
      raw = JSON.parse(extractJsonObjectText(output));
    } catch {
      throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_OUTPUT_INVALID");
    }
  } else {
    raw = output;
  }
  const normalized = normalizeOpenAiCompatibleChatAnswerResult(
    raw,
    profile.providerId,
    now
  );
  if (hasDirectActionAttempt(normalized)) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_DIRECT_ACTION_REJECTED");
  }

  let answerResult: ChatAnswerResult;
  try {
    answerResult = ChatAnswerResultSchema.parse(normalized);
  } catch {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_OUTPUT_INVALID");
  }
  if (answerResult.providerId !== profile.providerId) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_PROVIDER_MISMATCH");
  }
  return answerResult;
}

export function normalizeOpenAiCompatibleChatAnswerResult(
  raw: unknown,
  providerId: OpenAiCompatibleChatAnswerProviderId,
  now: () => Date = () => new Date()
): unknown {
  const unwrapped = unwrapChatAnswerResult(raw);
  if (!isRecord(unwrapped)) {
    return unwrapped;
  }
  const status = normalizeChatAnswerStatus(unwrapped);
  const answer = normalizeAnswerText(
    unwrapped.answer ??
      unwrapped.summary ??
      unwrapped.message ??
      unwrapped.content
  );
  const clarifyQuestion = normalizeClarifyQuestion(unwrapped, status);
  return {
    providerId: normalizeString(unwrapped.providerId, providerId),
    status,
    reasonCode: normalizeChatAnswerReasonCode(unwrapped.reasonCode, status),
    failureClass: normalizeChatAnswerFailureClass(
      unwrapped.failureClass,
      status
    ),
    ...(status === "answered" && answer !== undefined ? { answer } : {}),
    ...(status === "clarify" && clarifyQuestion !== undefined
      ? { clarifyQuestion }
      : {}),
    fallbackUsed: normalizeBooleanFlag(unwrapped.fallbackUsed),
    directActionAttempted: normalizeBooleanFlag(
      unwrapped.directActionAttempted
    ),
    rawProviderResponsePersisted: normalizeBooleanFlag(
      unwrapped.rawProviderResponsePersisted
    ),
    credentialExposed: normalizeBooleanFlag(unwrapped.credentialExposed),
    answeredAt: normalizeString(unwrapped.answeredAt, now().toISOString())
  };
}

export function classifyOpenAiCompatibleChatAnswerFixtureFailure(
  input:
    | { readonly kind: "http"; readonly status: number }
    | { readonly kind: "transport" }
    | { readonly kind: "invalid_output" }
    | { readonly kind: "unsafe_output" }
): OpenAiCompatibleChatAnswerFixtureFailureClassification {
  if (input.kind === "transport") {
    return {
      failureClass: "provider_execution_failed",
      reasonCode: "PROVIDER_FAILED",
      chatAnswerFailureClass: "PROVIDER_EXECUTION_FAILED"
    };
  }
  if (input.kind === "invalid_output") {
    return {
      failureClass: "invalid_output",
      reasonCode: "INVALID_OUTPUT",
      chatAnswerFailureClass: "PROVIDER_RESULT_INVALID"
    };
  }
  if (input.kind === "unsafe_output") {
    return {
      failureClass: "unsafe_output",
      reasonCode: "UNSAFE_OR_BLOCKED",
      chatAnswerFailureClass: "UNSAFE_OR_BLOCKED"
    };
  }
  if (input.status === 401 || input.status === 403) {
    return {
      failureClass: "authentication_rejected",
      reasonCode: "PROVIDER_UNAVAILABLE",
      chatAnswerFailureClass: "PROVIDER_UNAVAILABLE"
    };
  }
  if (input.status === 429) {
    return {
      failureClass: "rate_limited",
      reasonCode: "PROVIDER_UNAVAILABLE",
      chatAnswerFailureClass: "PROVIDER_UNAVAILABLE"
    };
  }
  if (input.status === 404) {
    return {
      failureClass: "model_unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      chatAnswerFailureClass: "PROVIDER_UNAVAILABLE"
    };
  }
  if (input.status === 408 || input.status === 503) {
    return {
      failureClass: "provider_unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      chatAnswerFailureClass: "PROVIDER_UNAVAILABLE"
    };
  }
  return {
    failureClass: "provider_execution_failed",
    reasonCode: "PROVIDER_FAILED",
    chatAnswerFailureClass: "PROVIDER_EXECUTION_FAILED"
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
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_OUTPUT_INVALID");
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
  throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_OUTPUT_INVALID");
}

function extractAssistantPayload(body: unknown): string | Record<string, unknown> {
  if (!isRecord(body) || !Array.isArray(body.choices)) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_RESPONSE_INVALID");
  }
  const choice = body.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_RESPONSE_INVALID");
  }
  const message = choice.message;
  if (
    message.role !== "assistant" ||
    hasOwn(message, "tool_calls") ||
    hasOwn(message, "function_call")
  ) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_TOOL_CALL_REJECTED");
  }
  const primaryContent = extractAssistantContentValue(message.content);
  if (primaryContent !== undefined) {
    return primaryContent;
  }
  const reasoningFallback = extractAssistantContentValue(
    message.reasoning_content
  );
  if (reasoningFallback !== undefined) {
    return reasoningFallback;
  }
  throw new Error("OPENAI_COMPATIBLE_CHAT_ANSWER_RESPONSE_INVALID");
}

function extractAssistantContentValue(
  value: unknown
): string | Record<string, unknown> | undefined {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value : undefined;
  }
  if (Array.isArray(value)) {
    const text = value
      .map((part) => extractContentPartText(part))
      .filter((part): part is string => part !== undefined)
      .join("")
      .trim();
    if (text.length > 0) {
      return text;
    }
  }
  if (isRecord(value)) {
    const direct =
      typeof value.text === "string"
        ? value.text
        : typeof value.content === "string"
          ? value.content
          : undefined;
    if (direct !== undefined && direct.trim().length > 0) {
      return direct;
    }
    return value;
  }
  return undefined;
}

function isUnsafeAssistantPayload(
  value: string | Record<string, unknown>
): boolean {
  const serialized =
    typeof value === "string" ? value : JSON.stringify(value);
  return (
    serialized.length > MAX_OUTPUT_CHARS ||
    SECRET_PATTERN.test(serialized) ||
    EXECUTION_SHAPED_OUTPUT_PATTERN.test(serialized)
  );
}

function extractContentPartText(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  if (typeof value.text === "string") {
    return value.text;
  }
  if (isRecord(value.text) && typeof value.text.value === "string") {
    return value.text.value;
  }
  if (typeof value.content === "string") {
    return value.content;
  }
  return undefined;
}

function failureResult(
  classification: OpenAiCompatibleChatAnswerFixtureFailureClassification,
  providerId: OpenAiCompatibleChatAnswerProviderId,
  now: () => Date
): ChatAnswerResult {
  return ChatAnswerResultSchema.parse({
    providerId,
    status:
      classification.failureClass === "unsafe_output"
        ? "blocked"
        : "unavailable",
    reasonCode: classification.reasonCode,
    failureClass: classification.chatAnswerFailureClass,
    fallbackUsed: true,
    directActionAttempted: false,
    rawProviderResponsePersisted: false,
    credentialExposed: false,
    answeredAt: now().toISOString()
  });
}

function isUnsafeChatAnswerRejection(error: unknown): boolean {
  const code = error instanceof Error ? error.message : "";
  return new Set([
    "OPENAI_COMPATIBLE_CHAT_ANSWER_TOOL_CALL_REJECTED",
    "OPENAI_COMPATIBLE_CHAT_ANSWER_DIRECT_ACTION_REJECTED",
    "OPENAI_COMPATIBLE_CHAT_ANSWER_OUTPUT_UNSAFE"
  ]).has(code);
}

function unwrapChatAnswerResult(raw: unknown): unknown {
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

function normalizeChatAnswerStatus(
  value: Record<string, unknown>
): ChatAnswerResult["status"] {
  const status = normalizeToken(
    value.status ?? value.resultStatus ?? value.answerStatus
  );
  if (
    status === "answered" ||
    status === "answer" ||
    status === "ok" ||
    status === "complete" ||
    status === "completed" ||
    status === "success"
  ) {
    return "answered";
  }
  if (
    status === "clarify" ||
    status === "clarification" ||
    status === "needs_clarification" ||
    status === "need_more_info" ||
    status === "question"
  ) {
    return "clarify";
  }
  if (
    status === "blocked" ||
    status === "unsafe" ||
    status === "denied" ||
    status === "refused" ||
    status === "refusal"
  ) {
    return "blocked";
  }
  if (isExplicitBlockedSignal(value)) {
    return "blocked";
  }
  if (hasClarifySignal(value)) {
    return "clarify";
  }
  if (hasAnsweredSignal(value)) {
    return "answered";
  }
  return "unavailable";
}

function normalizeChatAnswerReasonCode(
  value: unknown,
  status: ChatAnswerResult["status"]
): ChatAnswerResult["reasonCode"] {
  const reasonCode = normalizeToken(value).toUpperCase();
  if (isChatAnswerReasonCode(reasonCode)) {
    return reasonCode;
  }
  if (status === "answered") {
    return "FIXTURE_ANSWER";
  }
  if (status === "clarify") {
    return "CLARIFY_REQUIRED";
  }
  if (status === "blocked") {
    return "UNSAFE_OR_BLOCKED";
  }
  return "INVALID_OUTPUT";
}

function normalizeChatAnswerFailureClass(
  value: unknown,
  status: ChatAnswerResult["status"]
): ChatAnswerResult["failureClass"] {
  const normalized = normalizeToken(value);
  if (normalized === "none") {
    return "none";
  }
  const failureClass = normalized.toUpperCase();
  if (isChatAnswerFailureClassUpper(failureClass)) {
    return failureClass;
  }
  if (status === "answered") {
    return "none";
  }
  if (status === "clarify") {
    return "CLARIFY_REQUIRED";
  }
  if (status === "blocked") {
    return "UNSAFE_OR_BLOCKED";
  }
  return "PROVIDER_RESULT_INVALID";
}

function normalizeAnswerText(value: unknown): string | undefined {
  return normalizeBoundedText(value, 2_000);
}

function normalizeClarifyQuestion(
  value: Record<string, unknown>,
  status?: ChatAnswerResult["status"]
): string | undefined {
  const explicit = normalizeBoundedText(
    value.clarifyQuestion ??
      value.clarificationQuestion ??
      value.question,
    500
  );
  if (explicit !== undefined) {
    return explicit;
  }

  for (const candidate of [
    value.answer,
    value.message,
    value.reason,
    value.summary,
    value.content
  ]) {
    const normalized = normalizeBoundedText(candidate, 500);
    if (
      normalized !== undefined &&
      (looksLikeClarifyQuestion(normalized) || status === "clarify")
    ) {
      return normalized;
    }
  }
  return undefined;
}

function normalizeBoundedText(
  value: unknown,
  maxLength: number
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().replace(/\s+/gu, " ").slice(0, maxLength);
  if (
    normalized.length === 0 ||
    SECRET_PATTERN.test(normalized) ||
    EXECUTION_SHAPED_OUTPUT_PATTERN.test(normalized)
  ) {
    return undefined;
  }
  return normalized;
}

function normalizeBooleanFlag(value: unknown): boolean {
  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    normalizeToken(value) === "true"
  ) {
    return true;
  }
  return false;
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

function isExplicitBlockedSignal(value: Record<string, unknown>): boolean {
  if (
    value.blocked === true ||
    value.refusal === true ||
    value.denied === true ||
    value.isUnsafe === true ||
    value.safe === false
  ) {
    return true;
  }

  const reasonCode = normalizeToken(value.reasonCode);
  if (
    reasonCode === "unsafe_or_blocked" ||
    reasonCode === "blocked" ||
    reasonCode === "refused" ||
    reasonCode === "refusal"
  ) {
    return true;
  }

  return [
    value.refusalMessage,
    value.message,
    value.reason,
    value.reasonCode,
    value.summary,
    value.answer
  ].some(
    (candidate) =>
      typeof candidate === "string" &&
      REFUSAL_SIGNAL_PATTERN.test(candidate)
  );
}

function hasClarifySignal(value: Record<string, unknown>): boolean {
  const reasonCode = normalizeToken(value.reasonCode);
  if (
    reasonCode === "clarify_required" ||
    reasonCode === "needs_clarification"
  ) {
    return true;
  }
  return normalizeClarifyQuestion(value) !== undefined;
}

function hasAnsweredSignal(value: Record<string, unknown>): boolean {
  for (const candidate of [
    value.answer,
    value.summary,
    value.message,
    value.content
  ]) {
    const normalized = normalizeBoundedText(candidate, 2_000);
    if (
      normalized !== undefined &&
      !looksLikeClarifyQuestion(normalized) &&
      !REFUSAL_SIGNAL_PATTERN.test(normalized)
    ) {
      return true;
    }
  }
  return false;
}

function looksLikeClarifyQuestion(value: string): boolean {
  return QUESTION_SIGNAL_PATTERN.test(value.trim());
}

function isChatAnswerReasonCode(
  value: string
): value is ChatAnswerResult["reasonCode"] {
  return new Set([
    "FIXTURE_ANSWER",
    "CLARIFY_REQUIRED",
    "UNSAFE_OR_BLOCKED",
    "PROVIDER_UNAVAILABLE",
    "INVALID_OUTPUT",
    "PROVIDER_FAILED"
  ]).has(value);
}

function isChatAnswerFailureClassUpper(
  value: string
): value is Exclude<ChatAnswerResult["failureClass"], "none"> {
  return new Set([
    "CLARIFY_REQUIRED",
    "UNSAFE_OR_BLOCKED",
    "PROVIDER_UNAVAILABLE",
    "PROVIDER_RESULT_INVALID",
    "PROVIDER_EXECUTION_FAILED"
  ]).has(value);
}

function hasDirectActionAttempt(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOwn(value, "directActionAttempted") &&
    value.directActionAttempted !== false
  );
}

function cloneProfile(
  profile: OpenAiCompatibleChatAnswerProfile
): OpenAiCompatibleChatAnswerProfile {
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
