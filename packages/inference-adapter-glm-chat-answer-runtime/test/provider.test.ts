import { describe, expect, it } from "vitest";
import {
  classifyOpenAiCompatibleChatAnswerResponseShape,
  createOpenAiCompatibleChatAnswerRuntimeStreamingCompletionRequest,
  createDeepseekChatAnswerRuntimeCompletionRequest,
  createGlmChatAnswerRuntimeCompletionRequest,
  classifyGlmChatAnswerRuntimeTransportFailure,
  DeepseekChatAnswerRuntimeProvider,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
  listOpenAiCompatibleChatAnswerRuntimeProfiles,
  GlmChatAnswerRuntimeProvider,
  GLM_CHAT_ANSWER_RUNTIME_ENDPOINT,
  GLM_CHAT_ANSWER_RUNTIME_MODEL_ID,
  GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
  type GlmChatAnswerRuntimeTransport
} from "../src";

const fixedRequest = {
  providerId: GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
  utterance: "Why is Jarvis-K keeping provider runtime default-off?",
  source: "text",
  routedAt: "2026-08-08T00:00:00.000Z",
  routerDecision: {
    intent: "chat.answer",
    confidence: 0.92,
    requiresApproval: false,
    slots: {},
    reason: "Fixed acceptance route."
  }
} as const;

describe("GLM Chat Answer runtime provider", () => {
  it("registers fixed runtime profiles for glm and deepseek", () => {
    expect(
      listOpenAiCompatibleChatAnswerRuntimeProfiles().map((profile) => ({
        profileId: profile.profileId,
        providerId: profile.providerId,
        maxOutputTokens: profile.maxOutputTokens
      }))
    ).toEqual([
      {
        profileId: "glm.4.7.compact_json_object_128",
        providerId: "chat-answer.openai-compatible.glm",
        maxOutputTokens: 128
      },
      {
        profileId: "deepseek.v4-flash.compact_json_object_128",
        providerId: "chat-answer.openai-compatible.deepseek",
        maxOutputTokens: 128
      },
      {
        profileId: "deepseek.v4-flash.compact_json_object_256",
        providerId: "chat-answer.openai-compatible.deepseek",
        maxOutputTokens: 256
      }
    ]);
  });

  it("creates a fixed bounded GLM request without tools", () => {
    const request = createGlmChatAnswerRuntimeCompletionRequest(fixedRequest);

    expect(request).toMatchObject({
      model: GLM_CHAT_ANSWER_RUNTIME_MODEL_ID,
      response_format: { type: "json_object" },
      stream: false,
      temperature: 0,
      max_tokens: 128
    });
    expect(request.messages).toHaveLength(2);
    expect(request.messages[0].content).toContain("status=answered");
    expect(request.messages[0].content).toContain("\"status\":\"blocked\"");
    expect(request.messages[0].content).toContain(
      "must be answered, not blocked"
    );
    expect(request.messages[0].content).toContain(
      "Example answered input"
    );
    expect(request.messages[0].content).toContain("what is Jarvis-K?");
    expect(request.messages[0].content).toContain(
      "supervised local assistant runtime"
    );
    expect(request.messages[0].content).toContain(
      "Which subsystem or goal do you want me to explain?"
    );
    expect(request.messages[0].content).toContain(
      "what does a bounded ChatAnswerResult protect?"
    );
    expect(request.messages[0].content).toContain(
      "previous safe answer was bounded"
    );
    expect(request.messages[0].content).toContain(
      "Benign questions about bounded results"
    );
    expect(request.messages[0].content).toContain(
      "Do not use unavailable unless you truly cannot form"
    );
    expect(request.messages[1].content).toBe(
      JSON.stringify({ utterance: fixedRequest.utterance })
    );
    expect(request).not.toHaveProperty("tools");
    expect(request).not.toHaveProperty("tool_choice");
  });

  it("adds only sanitized preference projection to runtime requests", () => {
    const request = createGlmChatAnswerRuntimeCompletionRequest({
      ...fixedRequest,
      preferenceProjection: {
        status: "applied",
        appliesTo: "chat.answer",
        preferredResponseLanguage: "zh",
        preferredResponseLength: "detailed",
        preferredResponseStyle: "technical",
        source: "user_preference_memory",
        rawContentExposed: false,
        vectorRetrievalUsed: false,
        providerNeutral: true
      }
    });
    const userPayload = JSON.parse(request.messages[1].content) as {
      preferenceProjection?: unknown;
    };

    expect(request.messages[0].content).toContain(
      "requests Chinese answer text"
    );
    expect(request.messages[0].content).toContain(
      "requests more detailed answer text"
    );
    expect(request.messages[0].content).toContain(
      "requests technical answer style"
    );
    expect(userPayload.preferenceProjection).toMatchObject({
      preferredResponseLanguage: "zh",
      preferredResponseLength: "detailed",
      preferredResponseStyle: "technical",
      rawContentExposed: false,
      vectorRetrievalUsed: false
    });
    expect(JSON.stringify(request)).not.toContain("Prefer Chinese replies");
    expect(request).not.toHaveProperty("tools");
    expect(request).not.toHaveProperty("tool_choice");
  });

  it("parses a bounded answered response through the shared normalizer", async () => {
    const transport = fixedTransport({
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify({
              status: "answered",
              answer: "Provider runtime remains opt-in and bounded.",
              directActionAttempted: false
            })
          }
        }
      ]
    });
    const provider = new GlmChatAnswerRuntimeProvider({
      credential: { apiKey: "test-glm-key" },
      transport,
      now: () => new Date("2026-08-08T00:00:00.000Z")
    });

    await expect(provider.answer(fixedRequest)).resolves.toMatchObject({
      providerId: GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
      status: "answered",
      answer: "Provider runtime remains opt-in and bounded.",
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false
    });
    expect(transport.lastRequest?.url).toBe(GLM_CHAT_ANSWER_RUNTIME_ENDPOINT);
    expect(transport.lastRequest?.timeoutMs).toBe(30_000);
    expect(transport.lastRequest?.headers.Authorization).toContain("Bearer ");
  });

  it("fails closed for unsafe output and transport failures", async () => {
    const unsafeProvider = new GlmChatAnswerRuntimeProvider({
      credential: { apiKey: "test-glm-key" },
      transport: fixedTransport({
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                status: "answered",
                answer: "Run powershell to delete all files.",
                directActionAttempted: false
              })
            }
          }
        ]
      })
    });
    const failingProvider = new GlmChatAnswerRuntimeProvider({
      credential: { apiKey: "test-glm-key" },
      transport: {
        async send() {
          throw new Error("private transport detail");
        }
      }
    });

    await expect(unsafeProvider.answer(fixedRequest)).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "UNSAFE_OR_BLOCKED",
      failureClass: "UNSAFE_OR_BLOCKED",
      directActionAttempted: false
    });
    await expect(failingProvider.answer(fixedRequest)).resolves.toMatchObject({
      status: "unavailable",
      reasonCode: "PROVIDER_FAILED",
      failureClass: "PROVIDER_EXECUTION_FAILED",
      directActionAttempted: false
    });
  });

  it("classifies aborted transport as timeout without retaining details", () => {
    expect(
      classifyGlmChatAnswerRuntimeTransportFailure(
        new Error("private detail"),
        true
      )
    ).toBe("timeout");
    expect(
      classifyGlmChatAnswerRuntimeTransportFailure(
        new TypeError("private connection detail"),
        false
      )
    ).toBe("connection");
  });

  it("creates and parses a bounded DeepSeek request through the same runtime path", async () => {
    const request = createDeepseekChatAnswerRuntimeCompletionRequest({
      ...fixedRequest,
      providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID
    });
    const transport = fixedTransport({
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify({
              status: "answered",
              answer: "DeepSeek runtime stayed inside the same bounded contract."
            })
          }
        }
      ]
    });
    const provider = new DeepseekChatAnswerRuntimeProvider({
      credential: { apiKey: "test-deepseek-key" },
      transport,
      now: () => new Date("2026-08-09T00:00:00.000Z")
    });

    expect(request.model).toBe(DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID);
    await expect(
      provider.answer({
        ...fixedRequest,
        providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID
      })
    ).resolves.toMatchObject({
      providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
      status: "answered"
    });
    expect(transport.lastRequest?.url).toBe(
      DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT
    );
  });

  it("streams DeepSeek text deltas through the single OpenAI-compatible adapter", async () => {
    const transport = fixedStreamingTransport([
      streamingChunk("你好"),
      streamingChunk("，Jarvis"),
      streamingChunk(""),
      streamingChunk("-K"),
    ]);
    const provider = new DeepseekChatAnswerRuntimeProvider({
      credential: { apiKey: "test-deepseek-key" },
      transport,
      now: () => new Date("2026-09-04T00:00:00.000Z")
    });

    const events = await collectStream(
      provider.startTextTurn(
        {
          ...fixedRequest,
          providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID
        },
        {},
        new AbortController().signal
      )
    );

    expect(events).toEqual([
      { type: "delta", delta: { kind: "text", text: "你好" } },
      { type: "delta", delta: { kind: "text", text: "，Jarvis" } },
      { type: "delta", delta: { kind: "text", text: "-K" } },
      { type: "final", text: "你好，Jarvis-K" }
    ]);
    expect(transport.lastRequest?.body).toMatchObject({
      model: DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
      stream: true,
      temperature: 0,
      max_tokens: 128
    });
    expect(transport.lastRequest?.body).not.toHaveProperty("tools");
    expect(transport.lastRequest?.body).not.toHaveProperty("tool_choice");
    expect(JSON.stringify(events)).not.toContain("test-deepseek-key");
  });

  it("suppresses DeepSeek reasoning deltas from user-visible streaming output", async () => {
    const events = await collectStream(
      streamingProvider([
        { choices: [{ delta: { reasoning_content: "hidden reasoning" } }] },
        streamingChunk("最终"),
        streamingChunk("回答"),
      ])
    );

    expect(events).toEqual([
      { type: "delta", delta: { kind: "text", text: "最终" } },
      { type: "delta", delta: { kind: "text", text: "回答" } },
      { type: "final", text: "最终回答" }
    ]);
    expect(JSON.stringify(events)).not.toContain("hidden reasoning");
    expect(JSON.stringify(events)).not.toContain("reasoning_content");
    expect(JSON.stringify(events)).not.toContain("test-deepseek-key");
  });

  it("fails closed for malformed chunks, tool calls, and partial disconnects", async () => {
    await expect(
      collectStream(
        streamingProvider([{ choices: [{ delta: { tool_calls: [] } }] }])
      )
    ).resolves.toEqual([
      {
        type: "failure",
        reason: "unsupported_tool_call",
        safeMessage: "The provider attempted an unsupported tool call.",
        retryable: false
      }
    ]);
    await expect(collectStream(streamingProvider([{ nope: true }]))).resolves.toEqual([
      {
        type: "failure",
        reason: "malformed_response",
        safeMessage: "The provider returned malformed streaming data.",
        retryable: true
      }
    ]);
    await expect(collectStream(disconnectingStreamingProvider())).resolves.toEqual([
      { type: "delta", delta: { kind: "text", text: "partial" } },
      {
        type: "failure",
        reason: "transport_failed",
        safeMessage: "The provider connection failed while streaming.",
        retryable: true
      }
    ]);
  });

  it("creates a plain-text streaming request without JSON response mode", () => {
    const request = createOpenAiCompatibleChatAnswerRuntimeStreamingCompletionRequest(
      {
        ...fixedRequest,
        providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID
      },
      "deepseek.v4-flash.compact_json_object_256"
    );

    expect(request).toMatchObject({
      model: DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
      stream: true,
      temperature: 0,
      max_tokens: 256
    });
    expect(request).not.toHaveProperty("response_format");
    expect(request).not.toHaveProperty("tools");
    expect(request.messages[0].content).toContain("Do not call tools");
    expect(request.messages[1].content).toBe(fixedRequest.utterance);
  });

  it("classifies DeepSeek array-content response shape without persisting content", () => {
    const shape = classifyOpenAiCompatibleChatAnswerResponseShape({
      choices: [
        {
          finish_reason: "stop",
          message: {
            role: "assistant",
            content: [
              {
                type: "text",
                text:
                  "{\"status\":\"answered\",\"answer\":\"ok\",\"directActionAttempted\":false}"
              }
            ]
          }
        }
      ]
    });

    expect(shape).toMatchObject({
      topLevelShape: "object",
      choicesShape: "array",
      messageShape: "assistant_message_content_array",
      contentShape: "array",
      normalizedContentKind: "string"
    });
    expect(shape.reasonCodes).toContain("CHAT_ANSWER_SHAPE_CONTENT_ARRAY");
  });
});

function fixedTransport(body: unknown, status = 200): GlmChatAnswerRuntimeTransport & {
  lastRequest?: Parameters<GlmChatAnswerRuntimeTransport["send"]>[0];
} {
  return {
    async send(request) {
      this.lastRequest = request;
      return { status, body };
    }
  };
}

function fixedStreamingTransport(
  chunks: unknown[]
): GlmChatAnswerRuntimeTransport & {
  lastRequest?: Parameters<GlmChatAnswerRuntimeTransport["send"]>[0];
} {
  return {
    async send(request) {
      this.lastRequest = request;
      return { status: 200, body: {} };
    },
    async *stream(request) {
      this.lastRequest = request;
      for (const chunk of chunks) {
        yield chunk;
      }
    }
  };
}

function streamingProvider(chunks: unknown[]) {
  const provider = new DeepseekChatAnswerRuntimeProvider({
    credential: { apiKey: "test-deepseek-key" },
    transport: fixedStreamingTransport(chunks)
  });
  return provider.startTextTurn(
    {
      ...fixedRequest,
      providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID
    },
    {},
    new AbortController().signal
  );
}

function disconnectingStreamingProvider() {
  const provider = new DeepseekChatAnswerRuntimeProvider({
    credential: { apiKey: "test-deepseek-key" },
    transport: {
      async send() {
        return { status: 200, body: {} };
      },
      async *stream() {
        yield streamingChunk("partial");
        throw new TypeError("private disconnect detail");
      }
    }
  });
  return provider.startTextTurn(
    {
      ...fixedRequest,
      providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID
    },
    {},
    new AbortController().signal
  );
}

function streamingChunk(text: string) {
  return {
    choices: [
      {
        delta: {
          content: text
        }
      }
    ]
  };
}

async function collectStream<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const events: T[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}
