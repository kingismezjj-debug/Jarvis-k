import { LocalAppOpenArgumentsSchema, LocalAppOpenResultSchema } from "@jarvis-k/contracts";
import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import {
  ASSISTANT_LOOP_STREAM_BUFFER_MAX_CHARS,
  AssistantModelAdapterEventSchema,
  AssistantToolContextSchema,
  AssistantToolContinuationSchema,
  AssistantModelStatusArgumentsSchema,
  AssistantModelStatusResultSchema,
  ToolProposalSchema,
  type AssistantToolContext,
  type AssistantToolContinuation,
  type ToolProposal,
  AssistantProviderFailureReasonSchema,
  ChatAnswerRequestSchema,
  ChatAnswerResultSchema,
  type ChatAnswerRequest,
  type ChatAnswerResult,
  type AssistantModelAdapterEvent,
  type AssistantProviderFailureReason
} from "@jarvis-k/contracts";
import {
  classifyOpenAiCompatibleChatAnswerFixtureFailure,
  parseOpenAiCompatibleChatAnswerFixtureResponse,
  type OpenAiCompatibleChatAnswerFixtureFailureClassification
} from "@jarvis-k/inference-adapter-openai-chat-answer";

const MODEL_STATUS_FUNCTION = {
  type: "function",
  function: { name: "model_status", description: "Read current local model runtime mode and bounded operation counts.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false } },
} as const;

const LOCAL_APP_OPEN_FUNCTION = {
  type: "function",
  function: { name: "local_app_open", description: "Request opening Notepad after explicit user approval in Jarvis.",
    parameters: { type: "object", properties: { app: { type: "string", enum: ["notepad"] } }, required: ["app"], additionalProperties: false } },
} as const;
export function providerToolId(name: string): "model.status" | "localApp.open" | undefined {
  return name === "model_status" ? "model.status" : name === "local_app_open" ? "localApp.open" : undefined;
}
export function internalToolName(id: string): "model_status" | "local_app_open" | undefined {
  return id === "model.status" ? "model_status" : id === "localApp.open" ? "local_app_open" : undefined;
}
interface ProviderToolCall {
  readonly id: string;
  readonly type: "function";
  readonly function: { readonly name: "model_status" | "local_app_open"; readonly arguments: string };
}

function collectProviderToolCall(chunk: unknown, state: { id: string; name: string; arguments: string; started: boolean }): "none" | "partial" | "complete" | "invalid" {
  if (!isRecord(chunk) || !Array.isArray(chunk.choices)) return "none";
  if (chunk.choices.length === 0) return "none";
  if (chunk.choices.length !== 1) return "invalid";
  const choice = chunk.choices[0];
  if (!isRecord(choice) || !isRecord(choice.delta)) return "none";
  if (hasOwn(choice.delta, "function_call")) return "invalid";
  const calls = choice.delta.tool_calls;
  if (calls !== undefined) {
    if (!Array.isArray(calls) || calls.length !== 1) return "invalid";
    const call = calls[0];
    if (!isRecord(call) || call.index !== 0 ||
      Object.keys(call).some(key => !["index", "id", "type", "function"].includes(key))) return "invalid";
    if (call.type !== undefined && call.type !== "function") return "invalid";
    if (call.id !== undefined) {
      if (state.id || typeof call.id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(call.id)) return "invalid";
      state.id = call.id;
    }
    if (!isRecord(call.function) || Object.keys(call.function).some(key => !["name", "arguments"].includes(key))) return "invalid";
    for (const key of ["name", "arguments"] as const) {
      const value = call.function[key];
      if (value !== undefined && typeof value !== "string") return "invalid";
      state[key] += typeof value === "string" ? value : "";
    }
    if (state.name.length > 64 || state.arguments.length > 256 ||
      (typeof choice.delta.content === "string" && choice.delta.content.length > 0)) return "invalid";
    state.started = true;
  }
  if (choice.finish_reason === "tool_calls") return state.started ? "complete" : "invalid";
  if (calls !== undefined) return choice.finish_reason == null ? "partial" : "invalid";
  return "none";
}

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
const SECRET_PATTERN =
  /(?:\bBearer\b|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret|sk-[A-Za-z0-9_-]{8,})/iu;
const EXECUTION_SHAPED_OUTPUT_PATTERN =
  /(?:tool_calls|function_call|powershell|cmd\.exe|exec|spawn|delete|format|shutdown|reboot|rm\s+-rf)/iu;

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
  readonly body:
    | OpenAiCompatibleChatAnswerRuntimeCompletionRequest
    | OpenAiCompatibleChatAnswerRuntimeStreamingCompletionRequest;
  readonly timeoutMs: typeof OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_TIMEOUT_MS;
  readonly signal?: AbortSignal;
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
  stream?(
    request: OpenAiCompatibleChatAnswerRuntimeTransportRequest
  ): AsyncIterable<unknown>;
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

export interface OpenAiCompatibleChatAnswerRuntimeStreamingCompletionRequest {
  readonly model: OpenAiCompatibleChatAnswerRuntimeProfile["modelId"];
  readonly messages: readonly (OpenAiCompatibleChatAnswerRuntimeCompletionMessage |
    { readonly role: "assistant"; readonly content: string | null; readonly tool_calls: readonly ProviderToolCall[] } |
    { readonly role: "tool"; readonly tool_call_id: string; readonly content: string })[];
  readonly tools?: readonly [typeof MODEL_STATUS_FUNCTION | typeof LOCAL_APP_OPEN_FUNCTION];
  readonly parallel_tool_calls?: false;
  readonly tool_choice?: "auto" | "none";
  readonly stream: true;
  readonly temperature: 0;
  readonly max_tokens: 2048;
  readonly thinking?: { readonly type: "disabled" };
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
  private readonly pendingTools = new WeakMap<AbortSignal, {
    request: ChatAnswerRequest; proposal: ToolProposal; call: ProviderToolCall; content: string;
  }>();

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

  public async *startTextTurn(
    request: ChatAnswerRequest,
    context: AssistantToolContext,
    signal: AbortSignal
  ): AsyncIterable<AssistantModelAdapterEvent> {
    yield* this.streamTurn(request, AssistantToolContextSchema.parse(context), signal);
  }

  public async *continueTextTurn(
    input: AssistantToolContinuation,
    signal: AbortSignal,
  ): AsyncIterable<AssistantModelAdapterEvent> {
    const continuation = AssistantToolContinuationSchema.parse(input);
    const pending = this.pendingTools.get(signal);
    this.pendingTools.delete(signal);
    if (signal.aborted || !pending || pending.proposal.proposalId !== continuation.proposal.proposalId ||
      pending.proposal.turnId !== continuation.turnId || continuation.proposal.toolId !== pending.proposal.toolId ||
      continuation.result.toolId !== pending.proposal.toolId) {
      yield adapterFailure("unsupported_tool_call", "The status result does not match this answer.", false);
      return;
    }
    const action = pending.proposal.toolId === "localApp.open";
    (action ? LocalAppOpenArgumentsSchema : AssistantModelStatusArgumentsSchema).parse(continuation.proposal.arguments);
    const result = continuation.result;
    const safeResult = result.status === "completed"
      ? { status: "completed", data: (action ? LocalAppOpenResultSchema : AssistantModelStatusResultSchema).parse(result.structuredResult) }
      : { status: "failed", reason: action ? "NOTEPAD_LAUNCH_NOT_VERIFIED" : "MODEL_STATUS_UNAVAILABLE" };
    const body = createOpenAiCompatibleChatAnswerRuntimeStreamingCompletionRequest(pending.request, this.profile.profileId, action ? "localApp.open" : true);
    yield* this.streamTurn(pending.request, {}, signal, {
      ...body, tool_choice: "none",
      messages: [...body.messages,
        { role: "assistant", content: pending.content || null, tool_calls: [pending.call] },
        { role: "tool", tool_call_id: pending.call.id, content: JSON.stringify(safeResult) }],
    });
  }

  private async *streamTurn(
    request: ChatAnswerRequest,
    context: AssistantToolContext,
    signal: AbortSignal,
    continuationBody?: OpenAiCompatibleChatAnswerRuntimeStreamingCompletionRequest,
  ): AsyncIterable<AssistantModelAdapterEvent> {
    const parsedRequest = ChatAnswerRequestSchema.parse(request);
    if (parsedRequest.providerId !== this.profile.providerId) {
      throw new Error(
        "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PROVIDER_MISMATCH"
      );
    }
    if (!this.options.transport.stream) {
      yield adapterFailure(
        "provider_unavailable",
        "The configured answer provider does not support streaming.",
        true
      );
      return;
    }

    let accumulated = "";
    let completed = false;
    const toolEnabled = context.tool !== undefined && this.profile.family === "deepseek";
    const toolCall = { id: "", name: "", arguments: "", started: false };
    let chunkCount = 0;
    try {
      const chunks = this.options.transport.stream({
        profileId: this.profile.profileId,
        url: this.profile.endpoint,
        headers: {
          Authorization: `Bearer ${this.options.credential.apiKey}`,
          "Content-Type": "application/json"
        },
        body: continuationBody ?? createOpenAiCompatibleChatAnswerRuntimeStreamingCompletionRequest(
          parsedRequest,
          this.profile.profileId,
          toolEnabled ? (context.tool?.toolId === "localApp.open" ? "localApp.open" : true) : false
        ),
        timeoutMs: this.profile.timeoutMs,
        signal
      });
      for await (const chunk of chunks) {
        if (signal.aborted) {
          yield adapterFailure("cancelled", "The answer was cancelled.", false);
          return;
        }
        if (++chunkCount > 2048) throw new Error("STREAM_LIMIT");
        const toolChunk = collectProviderToolCall(chunk, toolCall);
        if (toolChunk !== "none") {
          if (!toolEnabled || toolChunk === "invalid") {
            yield adapterFailure("unsupported_tool_call", "The provider attempted an unsupported tool call.", false);
            return;
          }
          if (toolChunk === "complete") {
            const expected = context.tool?.toolId ?? "model.status";
            const action = expected === "localApp.open";
            const args = (action ? LocalAppOpenArgumentsSchema : AssistantModelStatusArgumentsSchema).safeParse(JSON.parse(toolCall.arguments));
            if (!context.tool || !toolCall.id || providerToolId(toolCall.name) !== expected || !args.success) {
              yield adapterFailure("unsupported_tool_call", "The status request was invalid.", false);
              return;
            }
            const proposal = ToolProposalSchema.parse({ turnId: context.tool.turnId, proposalId: context.tool.proposalId, toolId: expected, risk: action ? "mutating" : "read_only",
              arguments: args.data, proposedAt: this.now().toISOString(), safeSummary: action ? "Request opening Notepad with user approval." : "Check current model status." });
            this.pendingTools.set(signal, { request: parsedRequest, proposal, content: accumulated,
              call: { id: toolCall.id, type: "function", function: { name: internalToolName(proposal.toolId)!, arguments: JSON.stringify(args.data) } } });
            signal.addEventListener("abort", () => this.pendingTools.delete(signal), { once: true });
            yield AssistantModelAdapterEventSchema.parse({ type: "tool_proposal", proposal });
            return;
          }
          continue;
        }
        if (toolCall.started) {
          yield adapterFailure("unsupported_tool_call", "The status request ended incorrectly.", false);
          return;
        }
        const parsedChunk = parseOpenAiCompatibleStreamingChunk(chunk);
        if (parsedChunk.type === "finished") {
          completed = true;
          break;
        }
        if (parsedChunk.type === "empty") {
          continue;
        }
        if (parsedChunk.type === "tool_call") {
          yield adapterFailure(
            "unsupported_tool_call",
            "The provider attempted an unsupported tool call.",
            false
          );
          return;
        }
        if (parsedChunk.type === "malformed") {
          yield adapterFailure(
            "malformed_response",
            "The provider returned malformed streaming data.",
            true
          );
          return;
        }
        if (parsedChunk.type === "delta") {
          accumulated += parsedChunk.text;
          if (
            accumulated.length > ASSISTANT_LOOP_STREAM_BUFFER_MAX_CHARS ||
            isUnsafeStreamText(accumulated)
          ) {
            yield adapterFailure(
              "malformed_response",
              "The provider returned unsafe or oversized streaming data.",
              false
            );
            return;
          }
          yield AssistantModelAdapterEventSchema.parse({
            type: "delta",
            delta: {
              kind: "text",
              text: parsedChunk.text
            }
          });
          if (parsedChunk.finished) {
            completed = true;
            break;
          }
        }
      }
    } catch (error) {
      yield adapterFailure(
        classifyStreamingProviderFailure(error, signal.aborted),
        signal.aborted
          ? "The answer was cancelled."
          : "The provider connection failed while streaming.",
        !signal.aborted
      );
      return;
    }

    if (signal.aborted) {
      yield adapterFailure("cancelled", "The answer was cancelled.", false);
      return;
    }
    if (!completed) {
      yield adapterFailure("malformed_response", "The answer ended before completion.", true);
      return;
    }
    const finalText = accumulated.trim();
    if (finalText.length === 0) {
      yield adapterFailure(
        "malformed_response",
        "The provider completed without answer text.",
        true
      );
      return;
    }
    yield AssistantModelAdapterEventSchema.parse({
      type: "final",
      text: finalText
    });
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

    const abortScope = createTransportAbortScope(
      request.signal,
      request.timeoutMs
    );
    try {
      const response = await fetch(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: abortScope.signal
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
          abortScope.timedOut()
        )
      );
    } finally {
      abortScope.dispose();
    }
  }

  public async *stream(
    request: OpenAiCompatibleChatAnswerRuntimeTransportRequest
  ): AsyncIterable<unknown> {
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

    const abortScope = createTransportAbortScope(
      request.signal,
      request.timeoutMs
    );
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetch(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: abortScope.signal
      });
      if (!response.ok) {
        throw new OpenAiCompatibleChatAnswerRuntimeHttpFailure(response.status);
      }
      if (!response.body) {
        throw new OpenAiCompatibleChatAnswerRuntimeTransportFailure("connection");
      }
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        if (buffer.length > 65_536) {
          throw new OpenAiCompatibleChatAnswerRuntimeTransportFailure("connection");
        }
        const events = drainSseEvents(buffer);
        buffer = events.remainder;
        for (const eventText of events.events) {
          const trimmed = eventText.trim();
          if (!trimmed || trimmed === "[DONE]") {
            continue;
          }
          yield JSON.parse(trimmed);
        }
      }
      buffer += decoder.decode();
      const events = drainSseEvents(`${buffer}\n\n`);
      for (const eventText of events.events) {
        const trimmed = eventText.trim();
        if (!trimmed || trimmed === "[DONE]") {
          continue;
        }
        yield JSON.parse(trimmed);
      }
    } catch (error) {
      if (error instanceof OpenAiCompatibleChatAnswerRuntimeHttpFailure) {
        throw error;
      }
      throw new OpenAiCompatibleChatAnswerRuntimeTransportFailure(
        classifyOpenAiCompatibleChatAnswerRuntimeTransportFailure(
          error,
          abortScope.timedOut()
        )
      );
    } finally {
      await reader?.cancel().catch(() => undefined);
      reader?.releaseLock();
      abortScope.dispose();
    }
  }
}

class OpenAiCompatibleChatAnswerRuntimeHttpFailure extends Error {
  public constructor(readonly status: number) {
    super("OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_HTTP_FAILURE");
  }
}

function createTransportAbortScope(
  upstream: AbortSignal | undefined,
  timeoutMs: number
): {
  readonly signal: AbortSignal;
  readonly timedOut: () => boolean;
  readonly dispose: () => void;
} {
  const controller = new AbortController();
  let didTimeout = false;
  const abortFromUpstream = () => controller.abort();
  if (upstream?.aborted) {
    controller.abort();
  } else {
    upstream?.addEventListener("abort", abortFromUpstream, { once: true });
  }
  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    dispose: () => {
      clearTimeout(timeout);
      upstream?.removeEventListener("abort", abortFromUpstream);
    }
  };
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

export function createOpenAiCompatibleChatAnswerRuntimeStreamingCompletionRequest(
  request: ChatAnswerRequest,
  profileId: OpenAiCompatibleChatAnswerRuntimeProfileId,
  enableModelStatus: boolean | "localApp.open" = false,
): OpenAiCompatibleChatAnswerRuntimeStreamingCompletionRequest {
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
          "Answer the user's benign question directly as plain text.",
          ...(enableModelStatus === "localApp.open" ? ["Only request local_app_open with app notepad. Jarvis requires user approval before opening it. Never claim success before a verified tool result. Do not request paths, arguments, other apps, browser, shell, or writing. After a failed result explain that the launch was not verified."] : enableModelStatus ? ["Only use model_status when the user asks about current local model status. Its arguments must be an empty object. Use at most one call. For ordinary knowledge questions, answer directly without tools. Never invent status values. After a tool result, explain it concisely without internal identifiers. A failed result means status is unavailable."] : ["Do not call tools, functions, plugins, or actions."]),
          "Do not include credentials, URLs with query strings, command lines, or raw provider metadata.",
          "Other operations are unsupported.",
          "Keep the answer concise and user-facing.",
          ...(profile.family === "deepseek"
            ? ["Put final answer text in delta.content only; do not use reasoning_content."]
            : []),
          ...(parsed.preferenceProjection?.preferredResponseLanguage === "zh"
            ? ["Use Chinese answer text."]
            : []),
          ...(parsed.preferenceProjection?.preferredResponseLength === "short"
            ? ["Keep the answer short."]
            : []),
          ...(parsed.preferenceProjection?.preferredResponseStyle
            ? [
                `Use ${parsed.preferenceProjection.preferredResponseStyle} answer style.`
              ]
            : [])
        ].join(" ")
      },
      {
        role: "user",
        content: parsed.utterance
      }
    ],
    stream: true,
    temperature: 0,
    max_tokens: 2048,
    ...(enableModelStatus ? { tools: [enableModelStatus === "localApp.open" ? LOCAL_APP_OPEN_FUNCTION : MODEL_STATUS_FUNCTION] as const, parallel_tool_calls: false as const, tool_choice: "auto" as const } : {}),
    ...(profile.family === "deepseek" ? { thinking: { type: "disabled" as const } } : {})
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

type StreamingChunkParseResult =
  | { readonly type: "empty" }
  | { readonly type: "finished" }
  | { readonly type: "delta"; readonly text: string; readonly finished: boolean }
  | { readonly type: "tool_call" }
  | { readonly type: "malformed" };

function parseOpenAiCompatibleStreamingChunk(
  chunk: unknown
): StreamingChunkParseResult {
  if (!isRecord(chunk) || !Array.isArray(chunk.choices)) {
    return { type: "malformed" };
  }
  const choice = chunk.choices[0];
  if (!isRecord(choice)) {
    return { type: "empty" };
  }
  if (choice.finish_reason === "tool_calls" || choice.finish_reason === "function_call") {
    return { type: "tool_call" };
  }
  if (choice.finish_reason != null && choice.finish_reason !== "stop") {
    return { type: "malformed" };
  }
  const finished = choice.finish_reason === "stop";
  const delta = choice.delta;
  if (!isRecord(delta)) {
    return { type: "malformed" };
  }
  if (hasOwn(delta, "tool_calls") || hasOwn(delta, "function_call")) {
    return { type: "tool_call" };
  }
  const content = delta.content;
  if (typeof content !== "string") {
    return content == null
      ? { type: finished ? "finished" : "empty" }
      : { type: "malformed" };
  }
  const normalized = content.replace(/\s+/gu, " ");
  if (normalized.length === 0) {
    return { type: finished ? "finished" : "empty" };
  }
  return { type: "delta", text: normalized, finished };
}

function drainSseEvents(buffer: string): {
  readonly events: string[];
  readonly remainder: string;
} {
  const parts = buffer.split(/\r?\n\r?\n/u);
  const remainder = parts.pop() ?? "";
  const events = parts
    .map((part) =>
      part
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trim())
        .join("\n")
    )
    .filter((part) => part.length > 0);
  return { events, remainder };
}

function adapterFailure(
  reason: AssistantProviderFailureReason,
  safeMessage: string,
  retryable: boolean
): AssistantModelAdapterEvent {
  return AssistantModelAdapterEventSchema.parse({
    type: "failure",
    reason: AssistantProviderFailureReasonSchema.parse(reason),
    safeMessage,
    retryable
  });
}

function classifyStreamingProviderFailure(
  error: unknown,
  aborted: boolean
): AssistantProviderFailureReason {
  if (aborted) {
    return "cancelled";
  }
  if (error instanceof OpenAiCompatibleChatAnswerRuntimeHttpFailure) {
    if (error.status === 401) {
      return "authentication_failed";
    }
    if (error.status === 403) {
      return "access_forbidden";
    }
    if (error.status === 429) {
      return "rate_limited";
    }
    if (error.status === 408 || error.status === 504) {
      return "provider_timeout";
    }
    if (error.status === 404 || error.status === 503) {
      return "provider_unavailable";
    }
    return "transport_failed";
  }
  if (
    error instanceof OpenAiCompatibleChatAnswerRuntimeTransportFailure &&
    error.category === "timeout"
  ) {
    return "provider_timeout";
  }
  if (error instanceof SyntaxError) {
    return "malformed_response";
  }
  if (error instanceof TypeError) {
    return "transport_failed";
  }
  return "unknown_provider_failure";
}

function isUnsafeStreamText(value: string): boolean {
  return SECRET_PATTERN.test(value) || EXECUTION_SHAPED_OUTPUT_PATTERN.test(value) ||
    /(?:ToolProposal|ToolResult|CoreHost|[A-Za-z]:[\\/]|\\\\)/iu.test(value);
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
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
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
