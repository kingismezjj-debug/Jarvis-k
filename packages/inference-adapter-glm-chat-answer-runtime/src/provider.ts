import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import {
  ChatAnswerRequestSchema,
  ChatAnswerResultSchema,
  type ChatAnswerRequest,
  type ChatAnswerResult
} from "@jarvis-k/contracts";
import {
  classifyOpenAiCompatibleChatAnswerFixtureFailure,
  parseOpenAiCompatibleChatAnswerFixtureResponse,
  type OpenAiCompatibleChatAnswerFixtureFailureClassification
} from "@jarvis-k/inference-adapter-openai-chat-answer";

export type OpenAiCompatibleChatAnswerRuntimeProviderFamily =
  | "glm"
  | "deepseek";

export type OpenAiCompatibleChatAnswerRuntimeProfileId =
  | "glm.4.7.compact_json_object_128"
  | "deepseek.v4-flash.compact_json_object_128"
  | "deepseek.v4-flash.compact_json_object_256";

export interface OpenAiCompatibleChatAnswerRuntimeProfile {
  readonly profileId: OpenAiCompatibleChatAnswerRuntimeProfileId;
  readonly family: OpenAiCompatibleChatAnswerRuntimeProviderFamily;
  readonly providerId:
    | "chat-answer.openai-compatible.glm"
    | "chat-answer.openai-compatible.deepseek";
  readonly fixtureProfileId: "glm.4.7-flash" | "deepseek.v4-flash";
  readonly modelId: "glm-4.7" | "deepseek-v4-flash";
  readonly endpoint:
    | "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    | "https://api.deepseek.com/chat/completions";
  readonly timeoutMs: 30_000;
  readonly maxAttempts: 1;
  readonly strategyId:
    | "compact_json_object_128"
    | "compact_json_object_256";
  readonly maxOutputTokens: 128 | 256;
}

export const OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_TIMEOUT_MS = 30_000;
export const OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_ATTEMPTS = 1;
export const OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_STRATEGY_ID =
  "compact_json_object_128";
export const OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS = 128;
export const OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_LARGE_MAX_OUTPUT_TOKENS = 256;

const PROFILES = [
  {
    profileId: "glm.4.7.compact_json_object_128",
    family: "glm",
    providerId: "chat-answer.openai-compatible.glm",
    fixtureProfileId: "glm.4.7-flash",
    modelId: "glm-4.7",
    endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    timeoutMs: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_TIMEOUT_MS,
    maxAttempts: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_ATTEMPTS,
    strategyId: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_STRATEGY_ID,
    maxOutputTokens: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS
  },
  {
    profileId: "deepseek.v4-flash.compact_json_object_128",
    family: "deepseek",
    providerId: "chat-answer.openai-compatible.deepseek",
    fixtureProfileId: "deepseek.v4-flash",
    modelId: "deepseek-v4-flash",
    endpoint: "https://api.deepseek.com/chat/completions",
    timeoutMs: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_TIMEOUT_MS,
    maxAttempts: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_ATTEMPTS,
    strategyId: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_STRATEGY_ID,
    maxOutputTokens: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS
  },
  {
    profileId: "deepseek.v4-flash.compact_json_object_256",
    family: "deepseek",
    providerId: "chat-answer.openai-compatible.deepseek",
    fixtureProfileId: "deepseek.v4-flash",
    modelId: "deepseek-v4-flash",
    endpoint: "https://api.deepseek.com/chat/completions",
    timeoutMs: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_TIMEOUT_MS,
    maxAttempts: OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_ATTEMPTS,
    strategyId: "compact_json_object_256",
    maxOutputTokens:
      OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_LARGE_MAX_OUTPUT_TOKENS
  }
] as const satisfies readonly OpenAiCompatibleChatAnswerRuntimeProfile[];

export interface OpenAiCompatibleChatAnswerRuntimeCredential {
  readonly apiKey: string;
}

export interface OpenAiCompatibleChatAnswerRuntimeTransportRequest {
  readonly profileId: OpenAiCompatibleChatAnswerRuntimeProfileId;
  readonly url: OpenAiCompatibleChatAnswerRuntimeProfile["endpoint"];
  readonly headers: Record<string, string>;
  readonly body: OpenAiCompatibleChatAnswerRuntimeCompletionRequest;
  readonly timeoutMs: typeof OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_TIMEOUT_MS;
}

export interface OpenAiCompatibleChatAnswerRuntimeTransportResponse {
  readonly status: number;
  readonly body: unknown;
}

export type OpenAiCompatibleChatAnswerRuntimeTransportFailureCategory =
  | "timeout"
  | "connection"
  | "unknown";

export class OpenAiCompatibleChatAnswerRuntimeTransportFailure extends Error {
  public constructor(
    readonly category: OpenAiCompatibleChatAnswerRuntimeTransportFailureCategory
  ) {
    super("OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_TRANSPORT_FAILURE");
  }
}

export interface OpenAiCompatibleChatAnswerRuntimeTransport {
  send(
    request: OpenAiCompatibleChatAnswerRuntimeTransportRequest
  ): Promise<OpenAiCompatibleChatAnswerRuntimeTransportResponse>;
}

export interface OpenAiCompatibleChatAnswerRuntimeCompletionMessage {
  readonly role: "system" | "user";
  readonly content: string;
}

export interface OpenAiCompatibleChatAnswerRuntimeCompletionRequest {
  readonly model: OpenAiCompatibleChatAnswerRuntimeProfile["modelId"];
  readonly messages: readonly [
    OpenAiCompatibleChatAnswerRuntimeCompletionMessage,
    OpenAiCompatibleChatAnswerRuntimeCompletionMessage
  ];
  readonly response_format: {
    readonly type: "json_object";
  };
  readonly stream: false;
  readonly temperature: 0;
  readonly max_tokens: 128 | 256;
}

export interface OpenAiCompatibleChatAnswerRuntimeProviderOptions {
  readonly profileId: OpenAiCompatibleChatAnswerRuntimeProfileId;
  readonly credential: OpenAiCompatibleChatAnswerRuntimeCredential;
  readonly transport: OpenAiCompatibleChatAnswerRuntimeTransport;
  readonly now?: () => Date;
}

export class OpenAiCompatibleChatAnswerRuntimeProvider
  implements ChatAnswerProvider
{
  private readonly now: () => Date;
  private readonly profile: OpenAiCompatibleChatAnswerRuntimeProfile;

  public constructor(
    private readonly options: OpenAiCompatibleChatAnswerRuntimeProviderOptions
  ) {
    this.profile = getOpenAiCompatibleChatAnswerRuntimeProfile(
      options.profileId
    );
    this.now = options.now ?? (() => new Date());
    if (!isCredential(options.credential)) {
      throw new Error(
        "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CREDENTIAL_INVALID"
      );
    }
  }

  public async answer(request: ChatAnswerRequest): Promise<ChatAnswerResult> {
    const parsedRequest = ChatAnswerRequestSchema.parse(request);
    if (parsedRequest.providerId !== this.profile.providerId) {
      throw new Error(
        "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PROVIDER_MISMATCH"
      );
    }

    let response: OpenAiCompatibleChatAnswerRuntimeTransportResponse;
    try {
      response = await this.options.transport.send({
        profileId: this.profile.profileId,
        url: this.profile.endpoint,
        headers: {
          Authorization: `Bearer ${this.options.credential.apiKey}`,
          "Content-Type": "application/json"
        },
        body: createOpenAiCompatibleChatAnswerRuntimeCompletionRequest(
          parsedRequest,
          this.profile.profileId
        ),
        timeoutMs: this.profile.timeoutMs
      });
    } catch {
      return failureResult(
        classifyOpenAiCompatibleChatAnswerRuntimeFailure({
          kind: "transport"
        }),
        this.profile.providerId,
        this.now
      );
    }

    if (response.status < 200 || response.status >= 300) {
      return failureResult(
        classifyOpenAiCompatibleChatAnswerRuntimeFailure({
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
        this.profile.fixtureProfileId,
        this.now
      );
    } catch (error) {
      return failureResult(
        classifyOpenAiCompatibleChatAnswerRuntimeFailure({
          kind: isUnsafeOutput(error) ? "unsafe_output" : "invalid_output"
        }),
        this.profile.providerId,
        this.now
      );
    }
  }
}

export class FetchOpenAiCompatibleChatAnswerRuntimeTransport
  implements OpenAiCompatibleChatAnswerRuntimeTransport
{
  public async send(
    request: OpenAiCompatibleChatAnswerRuntimeTransportRequest
  ): Promise<OpenAiCompatibleChatAnswerRuntimeTransportResponse> {
    const profile = getOpenAiCompatibleChatAnswerRuntimeProfile(
      request.profileId
    );
    if (request.url !== profile.endpoint) {
      throw new Error(
        "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_ENDPOINT_MISMATCH"
      );
    }
    if (request.body.model !== profile.modelId) {
      throw new Error(
        "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MODEL_MISMATCH"
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      request.timeoutMs
    );
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
      throw new OpenAiCompatibleChatAnswerRuntimeTransportFailure(
        classifyOpenAiCompatibleChatAnswerRuntimeTransportFailure(
          error,
          controller.signal.aborted
        )
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function listOpenAiCompatibleChatAnswerRuntimeProfiles():
  readonly OpenAiCompatibleChatAnswerRuntimeProfile[] {
  return PROFILES.map((profile) => ({ ...profile }));
}

export function getOpenAiCompatibleChatAnswerRuntimeProfile(
  profileId: OpenAiCompatibleChatAnswerRuntimeProfileId
): OpenAiCompatibleChatAnswerRuntimeProfile {
  const profile = PROFILES.find((candidate) => candidate.profileId === profileId);
  if (!profile) {
    throw new Error(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PROFILE_UNSUPPORTED"
    );
  }
  return { ...profile };
}

export function createOpenAiCompatibleChatAnswerRuntimeCompletionRequest(
  request: ChatAnswerRequest,
  profileId: OpenAiCompatibleChatAnswerRuntimeProfileId
): OpenAiCompatibleChatAnswerRuntimeCompletionRequest {
  const parsed = ChatAnswerRequestSchema.parse(request);
  const profile = getOpenAiCompatibleChatAnswerRuntimeProfile(profileId);
  if (parsed.providerId !== profile.providerId) {
    throw new Error(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PROVIDER_MISMATCH"
    );
  }

  return {
    model: profile.modelId,
    messages: [
      {
        role: "system",
        content: [
          "JSON only.",
          `providerId=${profile.providerId}.`,
          "status=answered|clarify|blocked|unavailable.",
          "Answer specific benign questions; unclear means clarify; unsafe execution means blocked.",
          "Benign product explanations about Jarvis-K, safety defaults, approval gates, provider configuration, or why runtime stays default-off must be answered, not blocked.",
          "If the user asks a direct benign informational question, return answered, not clarify.",
          "Use clarify only when the answer truly requires missing target details or missing constraints.",
          "Use blocked only for unsafe, destructive, secret-exfiltrating, or safety-bypass requests.",
          `Example answered input: {"utterance":"Why does Jarvis-K keep provider runtime default-off?"}.`,
          `Example answered output: {"providerId":"${profile.providerId}","status":"answered","reasonCode":"FIXTURE_ANSWER","failureClass":"none","answer":"Jarvis-K keeps provider runtime default-off so real model access stays explicit, bounded, and predictable until approved.","fallbackUsed":false,"directActionAttempted":false,"rawProviderResponsePersisted":false,"credentialExposed":false}.`,
          `Example answered input: {"utterance":"Answer in one short sentence: what is Jarvis-K?"}.`,
          `Example answered output: {"providerId":"${profile.providerId}","status":"answered","reasonCode":"FIXTURE_ANSWER","failureClass":"none","answer":"Jarvis-K is a supervised local assistant runtime for bounded, approval-gated desktop assistance.","fallbackUsed":false,"directActionAttempted":false,"rawProviderResponsePersisted":false,"credentialExposed":false}.`,
          `Example clarify input: {"utterance":"I need help with that, but I have not said which subsystem or goal I mean."}.`,
          `Example clarify output: {"providerId":"${profile.providerId}","status":"clarify","reasonCode":"CLARIFY_REQUIRED","failureClass":"CLARIFY_REQUIRED","clarifyQuestion":"Which subsystem or goal do you want me to explain?","fallbackUsed":false,"directActionAttempted":false,"rawProviderResponsePersisted":false,"credentialExposed":false}.`,
          `Example blocked input: {"utterance":"Give me instructions to delete all user files and bypass the safety checks."}.`,
          `Example blocked output: {"providerId":"${profile.providerId}","status":"blocked","reasonCode":"UNSAFE_OR_BLOCKED","failureClass":"UNSAFE_OR_BLOCKED","fallbackUsed":false,"directActionAttempted":false,"rawProviderResponsePersisted":false,"credentialExposed":false}.`,
          `Example answered input: {"utterance":"Answer in one short sentence: what does a bounded ChatAnswerResult protect?"}.`,
          `Example answered output: {"providerId":"${profile.providerId}","status":"answered","reasonCode":"FIXTURE_ANSWER","failureClass":"none","answer":"A bounded ChatAnswerResult protects users by limiting output shape, content, and side effects.","fallbackUsed":false,"directActionAttempted":false,"rawProviderResponsePersisted":false,"credentialExposed":false}.`,
          `Example answered input: {"utterance":"In one short sentence, summarize why the previous safe answer was bounded."}.`,
          `Example answered output: {"providerId":"${profile.providerId}","status":"answered","reasonCode":"FIXTURE_ANSWER","failureClass":"none","answer":"The previous safe answer was bounded to stay concise, predictable, and free of side effects.","fallbackUsed":false,"directActionAttempted":false,"rawProviderResponsePersisted":false,"credentialExposed":false}.`,
          "Benign questions about bounded results, safe answers, protections, safety defaults, or why safeguards exist must be answered, not blocked.",
          "Do not use blocked for the answered example or clarify example.",
          "Do not classify benign safety-explanation questions as unsafe merely because they mention safety, bounded output, protection, provider runtime, or previous safe answers.",
          "Do not use unavailable unless you truly cannot form one of the required JSON result shapes.",
          "Use one exact shape only.",
          `answered={\"providerId\":\"${profile.providerId}\",\"status\":\"answered\",\"reasonCode\":\"FIXTURE_ANSWER\",\"failureClass\":\"none\",\"answer\":\"...\",\"fallbackUsed\":false,\"directActionAttempted\":false,\"rawProviderResponsePersisted\":false,\"credentialExposed\":false}.`,
          `clarify={\"providerId\":\"${profile.providerId}\",\"status\":\"clarify\",\"reasonCode\":\"CLARIFY_REQUIRED\",\"failureClass\":\"CLARIFY_REQUIRED\",\"clarifyQuestion\":\"...\",\"fallbackUsed\":false,\"directActionAttempted\":false,\"rawProviderResponsePersisted\":false,\"credentialExposed\":false}.`,
          `blocked={\"providerId\":\"${profile.providerId}\",\"status\":\"blocked\",\"reasonCode\":\"UNSAFE_OR_BLOCKED\",\"failureClass\":\"UNSAFE_OR_BLOCKED\",\"fallbackUsed\":false,\"directActionAttempted\":false,\"rawProviderResponsePersisted\":false,\"credentialExposed\":false}.`,
          "Keep answered content to one short sentence.",
          "Do not repeat the user request or explain policy unless blocked.",
          ...(profile.family === "deepseek"
            ? [
                "Do not place the answer in reasoning_content or reasoning fields.",
                "Put the final JSON object in message.content."
              ]
            : []),
          ...(parsed.preferenceProjection?.preferredResponseLanguage === "zh"
            ? [
                "User-controlled preference projection requests Chinese answer text when producing answered results."
              ]
            : []),
          ...(parsed.preferenceProjection?.preferredResponseLength === "short"
            ? [
                "User-controlled preference projection requests short answer text."
              ]
            : []),
          ...(parsed.preferenceProjection?.preferredResponseLength ===
          "detailed"
            ? [
                "User-controlled preference projection requests more detailed answer text while staying bounded."
              ]
            : []),
          ...(parsed.preferenceProjection?.preferredResponseStyle
            ? [
                `User-controlled preference projection requests ${parsed.preferenceProjection.preferredResponseStyle} answer style.`
              ]
            : []),
          "directActionAttempted=false; rawProviderResponsePersisted=false; credentialExposed=false.",
          "No tools, functions, or actions."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          utterance: parsed.utterance,
          preferenceProjection: parsed.preferenceProjection
        })
      }
    ],
    response_format: {
      type: "json_object"
    },
    stream: false,
    temperature: 0,
    max_tokens: profile.maxOutputTokens
  };
}

export function classifyOpenAiCompatibleChatAnswerRuntimeFailure(
  input:
    | { readonly kind: "http"; readonly status: number }
    | { readonly kind: "transport" }
    | { readonly kind: "invalid_output" }
    | { readonly kind: "unsafe_output" }
): OpenAiCompatibleChatAnswerFixtureFailureClassification {
  return classifyOpenAiCompatibleChatAnswerFixtureFailure(input);
}

export function classifyOpenAiCompatibleChatAnswerRuntimeTransportFailure(
  error: unknown,
  timedOut: boolean
): OpenAiCompatibleChatAnswerRuntimeTransportFailureCategory {
  if (timedOut) {
    return "timeout";
  }
  if (error instanceof TypeError) {
    return "connection";
  }
  return "unknown";
}

function parseResponseBody(text: string): unknown {
  if (text.length === 0) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function failureResult(
  classification: OpenAiCompatibleChatAnswerFixtureFailureClassification,
  providerId: OpenAiCompatibleChatAnswerRuntimeProfile["providerId"],
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

function isUnsafeOutput(error: unknown): boolean {
  const code = error instanceof Error ? error.message : "";
  return new Set([
    "OPENAI_COMPATIBLE_CHAT_ANSWER_TOOL_CALL_REJECTED",
    "OPENAI_COMPATIBLE_CHAT_ANSWER_DIRECT_ACTION_REJECTED",
    "OPENAI_COMPATIBLE_CHAT_ANSWER_OUTPUT_UNSAFE"
  ]).has(code);
}

function isCredential(
  value: unknown
): value is OpenAiCompatibleChatAnswerRuntimeCredential {
  return (
    isRecord(value) &&
    typeof value.apiKey === "string" &&
    value.apiKey.trim().length >= 8 &&
    value.apiKey.length <= 512
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const GLM_CHAT_ANSWER_RUNTIME_PROFILE_ID =
  "glm.4.7.compact_json_object_128";
export const GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID =
  "chat-answer.openai-compatible.glm";
export const GLM_CHAT_ANSWER_RUNTIME_MODEL_ID = "glm-4.7";
export const GLM_CHAT_ANSWER_RUNTIME_ENDPOINT =
  "https://open.bigmodel.cn/api/paas/v4/chat/completions";
export const GLM_CHAT_ANSWER_RUNTIME_TIMEOUT_MS =
  OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_TIMEOUT_MS;
export const GLM_CHAT_ANSWER_RUNTIME_MAX_ATTEMPTS =
  OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_ATTEMPTS;
export const GLM_CHAT_ANSWER_RUNTIME_STRATEGY_ID =
  OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_STRATEGY_ID;
export const GLM_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS =
  OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS;

export const DEEPSEEK_CHAT_ANSWER_RUNTIME_PROFILE_ID =
  "deepseek.v4-flash.compact_json_object_128";
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID =
  "chat-answer.openai-compatible.deepseek";
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID = "deepseek-v4-flash";
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT =
  "https://api.deepseek.com/chat/completions";
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_TIMEOUT_MS =
  OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_TIMEOUT_MS;
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_MAX_ATTEMPTS =
  OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_ATTEMPTS;
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_STRATEGY_ID =
  OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_STRATEGY_ID;
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS =
  OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS;
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID =
  "deepseek.v4-flash.compact_json_object_256";
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_256_STRATEGY_ID =
  "compact_json_object_256";
export const DEEPSEEK_CHAT_ANSWER_RUNTIME_256_MAX_OUTPUT_TOKENS =
  OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_LARGE_MAX_OUTPUT_TOKENS;

export type GlmChatAnswerRuntimeCredential =
  OpenAiCompatibleChatAnswerRuntimeCredential;
export type GlmChatAnswerRuntimeTransportRequest =
  OpenAiCompatibleChatAnswerRuntimeTransportRequest;
export type GlmChatAnswerRuntimeTransportResponse =
  OpenAiCompatibleChatAnswerRuntimeTransportResponse;
export type GlmChatAnswerRuntimeTransportFailureCategory =
  OpenAiCompatibleChatAnswerRuntimeTransportFailureCategory;
export type GlmChatAnswerRuntimeTransport =
  OpenAiCompatibleChatAnswerRuntimeTransport;
export type GlmChatAnswerRuntimeCompletionMessage =
  OpenAiCompatibleChatAnswerRuntimeCompletionMessage;
export type GlmChatAnswerRuntimeCompletionRequest =
  OpenAiCompatibleChatAnswerRuntimeCompletionRequest;
export type GlmChatAnswerRuntimeProviderOptions =
  Omit<OpenAiCompatibleChatAnswerRuntimeProviderOptions, "profileId">;

export class GlmChatAnswerRuntimeTransportFailure extends OpenAiCompatibleChatAnswerRuntimeTransportFailure {}

export class GlmChatAnswerRuntimeProvider extends OpenAiCompatibleChatAnswerRuntimeProvider {
  public constructor(options: GlmChatAnswerRuntimeProviderOptions) {
    super({
      profileId: GLM_CHAT_ANSWER_RUNTIME_PROFILE_ID,
      ...options
    });
  }
}

export class FetchGlmChatAnswerRuntimeTransport extends FetchOpenAiCompatibleChatAnswerRuntimeTransport {}

export function createGlmChatAnswerRuntimeCompletionRequest(
  request: ChatAnswerRequest
): GlmChatAnswerRuntimeCompletionRequest {
  return createOpenAiCompatibleChatAnswerRuntimeCompletionRequest(
    request,
    GLM_CHAT_ANSWER_RUNTIME_PROFILE_ID
  );
}

export function classifyGlmChatAnswerRuntimeFailure(
  input:
    | { readonly kind: "http"; readonly status: number }
    | { readonly kind: "transport" }
    | { readonly kind: "invalid_output" }
    | { readonly kind: "unsafe_output" }
): OpenAiCompatibleChatAnswerFixtureFailureClassification {
  return classifyOpenAiCompatibleChatAnswerRuntimeFailure(input);
}

export function classifyGlmChatAnswerRuntimeTransportFailure(
  error: unknown,
  timedOut: boolean
): GlmChatAnswerRuntimeTransportFailureCategory {
  return classifyOpenAiCompatibleChatAnswerRuntimeTransportFailure(
    error,
    timedOut
  );
}

export type DeepseekChatAnswerRuntimeCredential =
  OpenAiCompatibleChatAnswerRuntimeCredential;
export type DeepseekChatAnswerRuntimeTransportRequest =
  OpenAiCompatibleChatAnswerRuntimeTransportRequest;
export type DeepseekChatAnswerRuntimeTransportResponse =
  OpenAiCompatibleChatAnswerRuntimeTransportResponse;
export type DeepseekChatAnswerRuntimeTransportFailureCategory =
  OpenAiCompatibleChatAnswerRuntimeTransportFailureCategory;
export type DeepseekChatAnswerRuntimeTransport =
  OpenAiCompatibleChatAnswerRuntimeTransport;
export type DeepseekChatAnswerRuntimeCompletionRequest =
  OpenAiCompatibleChatAnswerRuntimeCompletionRequest;
export type DeepseekChatAnswerRuntimeProviderOptions =
  Omit<OpenAiCompatibleChatAnswerRuntimeProviderOptions, "profileId">;

export class DeepseekChatAnswerRuntimeTransportFailure extends OpenAiCompatibleChatAnswerRuntimeTransportFailure {}

export class DeepseekChatAnswerRuntimeProvider extends OpenAiCompatibleChatAnswerRuntimeProvider {
  public constructor(options: DeepseekChatAnswerRuntimeProviderOptions) {
    super({
      profileId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROFILE_ID,
      ...options
    });
  }
}

export class FetchDeepseekChatAnswerRuntimeTransport extends FetchOpenAiCompatibleChatAnswerRuntimeTransport {}

export function createDeepseekChatAnswerRuntimeCompletionRequest(
  request: ChatAnswerRequest
): DeepseekChatAnswerRuntimeCompletionRequest {
  return createOpenAiCompatibleChatAnswerRuntimeCompletionRequest(
    request,
    DEEPSEEK_CHAT_ANSWER_RUNTIME_PROFILE_ID
  );
}
