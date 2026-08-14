import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OpenAiCompatibleFixtureChatAnswerProvider,
  classifyOpenAiCompatibleChatAnswerFixtureFailure,
  createOpenAiCompatibleChatAnswerFixtureRequest,
  listOpenAiCompatibleChatAnswerProfiles,
  parseOpenAiCompatibleChatAnswerFixtureResponse,
  type OpenAiCompatibleChatAnswerFixtureTransport
} from "../src";

const fixedRequest = {
  providerId: "chat-answer.openai-compatible.deepseek",
  utterance: "Explain why Jarvis-K keeps providers default-off.",
  source: "text",
  routedAt: "2026-08-08T00:00:00.000Z",
  routerDecision: {
    intent: "chat.answer",
    confidence: 0.82,
    requiresApproval: false,
    slots: {},
    reason: "Fixture Chat Answer route."
  }
} as const;

describe("OpenAI-compatible Chat Answer fixture layer", () => {
  it("registers fixed default-off provider profiles", () => {
    const profiles = listOpenAiCompatibleChatAnswerProfiles();

    expect(profiles.map((profile) => profile.profileId)).toEqual([
      "openai.gpt-4.1-mini",
      "deepseek.v4-flash",
      "qwen.flash",
      "glm.4.7-flash"
    ]);
    expect(profiles.map((profile) => profile.providerId)).toEqual([
      "chat-answer.openai-compatible.openai",
      "chat-answer.openai-compatible.deepseek",
      "chat-answer.openai-compatible.qwen",
      "chat-answer.openai-compatible.glm"
    ]);
    expect(
      profiles.every(
        (profile) =>
          profile.runtimeDefaultEnabled === false &&
          profile.exactRuntimeApprovalRequired === true &&
          profile.credentialConfigured === false &&
          profile.credentialAccessApproved === false &&
          profile.networkAccessApproved === false &&
          profile.healthDiagnosticApproved === false &&
          profile.chatAnswerAcceptanceApproved === false
      )
    ).toBe(true);
  });

  it("creates a bounded OpenAI-compatible Chat Completions fixture request", () => {
    const request = createOpenAiCompatibleChatAnswerFixtureRequest(
      fixedRequest,
      "deepseek.v4-flash"
    );

    expect(request).toMatchObject({
      providerId: "chat-answer.openai-compatible.deepseek",
      profileId: "deepseek.v4-flash",
      modelId: "deepseek-v4-flash",
      timeoutMs: 20_000,
      body: {
        model: "deepseek-v4-flash",
        response_format: { type: "json_object" },
        stream: false,
        temperature: 0,
        max_tokens: 350
      }
    });
    expect(request.body.messages).toHaveLength(2);
    expect(request.body.messages[0].content).toContain(
      "Return only bounded ChatAnswerResult JSON"
    );
    expect(request.body.messages[0].content).toContain(
      "directActionAttempted false"
    );
    expect(request.body).not.toHaveProperty("tools");
    expect(request.body).not.toHaveProperty("tool_choice");
  });

  it("adds only sanitized preference projection to fixture requests", () => {
    const request = createOpenAiCompatibleChatAnswerFixtureRequest(
      {
        ...fixedRequest,
        preferenceProjection: {
          status: "applied",
        appliesTo: "chat.answer",
        preferredResponseLanguage: "zh",
        preferredResponseLength: "short",
        preferredResponseStyle: "friendly",
        source: "user_preference_memory",
        rawContentExposed: false,
          vectorRetrievalUsed: false,
          providerNeutral: true
        }
      },
      "deepseek.v4-flash"
    );
    const userPayload = JSON.parse(request.body.messages[1].content) as {
      preferenceProjection?: unknown;
    };

    expect(request.body.messages[0].content).toContain(
      "requests Chinese answer text"
    );
    expect(request.body.messages[0].content).toContain(
      "requests short answer text"
    );
    expect(request.body.messages[0].content).toContain(
      "requests friendly answer style"
    );
    expect(userPayload.preferenceProjection).toMatchObject({
      preferredResponseLanguage: "zh",
      preferredResponseLength: "short",
      preferredResponseStyle: "friendly",
      rawContentExposed: false,
      vectorRetrievalUsed: false
    });
    expect(JSON.stringify(request)).not.toContain("Prefer Chinese replies");
  });

  it("parses answered results from a mocked chat-completions transport", async () => {
    const transport = fixedTransport(chatResponse(answeredResult()));
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport,
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      providerId: "chat-answer.openai-compatible.deepseek",
      status: "answered",
      reasonCode: "FIXTURE_ANSWER",
      failureClass: "none",
      fallbackUsed: false,
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false
    });
    expect(result.answer).toContain("Default-off providers");
    expect(transport.lastRequest?.body.model).toBe("deepseek-v4-flash");
    expect(JSON.stringify(result)).not.toContain("private provider body");
  });

  it("normalizes clarify wrappers and omits answer content", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        chatResponse({
          answerResult: {
            providerId: "chat-answer.openai-compatible.deepseek",
            status: "needs clarification",
            question: "Which subsystem should I explain?",
            directActionAttempted: false
          }
        })
      ),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      status: "clarify",
      reasonCode: "CLARIFY_REQUIRED",
      failureClass: "CLARIFY_REQUIRED"
    });
    expect(result.clarifyQuestion).toContain("subsystem");
    expect(result.answer).toBeUndefined();
  });

  it("derives clarify questions from answer-shaped question text", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        chatResponse({
          providerId: "chat-answer.openai-compatible.deepseek",
          status: "clarify",
          answer: "Which subsystem or goal do you want me to explain?",
          directActionAttempted: false
        })
      ),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      status: "clarify",
      reasonCode: "CLARIFY_REQUIRED",
      failureClass: "CLARIFY_REQUIRED",
      clarifyQuestion: "Which subsystem or goal do you want me to explain?"
    });
    expect(result.answer).toBeUndefined();
  });

  it("accepts clarify statements without a trailing question mark when status is clarify", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        chatResponse({
          providerId: "chat-answer.openai-compatible.deepseek",
          status: "clarify",
          message: "Please specify which subsystem or goal you mean.",
          directActionAttempted: false
        })
      ),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      status: "clarify",
      reasonCode: "CLARIFY_REQUIRED",
      failureClass: "CLARIFY_REQUIRED",
      clarifyQuestion: "Please specify which subsystem or goal you mean."
    });
  });

  it("normalizes blocked refusal wrappers and string boolean flags", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        chatResponse({
          answerResult: {
            providerId: "chat-answer.openai-compatible.deepseek",
            blocked: true,
            refusalMessage: "I cannot help with harmful or unsafe actions.",
            fallbackUsed: "false",
            directActionAttempted: "false",
            rawProviderResponsePersisted: "false",
            credentialExposed: "false"
          }
        })
      ),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      status: "blocked",
      reasonCode: "UNSAFE_OR_BLOCKED",
      failureClass: "UNSAFE_OR_BLOCKED",
      fallbackUsed: false,
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false
    });
  });

  it("normalizes blocked refusal text stored in answer fields", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        chatResponse({
          providerId: "chat-answer.openai-compatible.deepseek",
          answer: "I can't help with deleting user files or bypassing safety checks.",
          directActionAttempted: false
        })
      ),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      status: "blocked",
      reasonCode: "UNSAFE_OR_BLOCKED",
      failureClass: "UNSAFE_OR_BLOCKED"
    });
    expect(result.answer).toBeUndefined();
  });

  it("parses assistant content arrays with text parts", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport({
        choices: [
          {
            message: {
              role: "assistant",
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    providerId: "chat-answer.openai-compatible.deepseek",
                    status: "answered",
                    reasonCode: "FIXTURE_ANSWER",
                    failureClass: "none",
                    answer: "Array content now normalizes correctly.",
                    fallbackUsed: false,
                    directActionAttempted: false,
                    rawProviderResponsePersisted: false,
                    credentialExposed: false,
                    answeredAt: "2026-08-09T00:00:00.000Z"
                  })
                }
              ]
            }
          }
        ]
      }),
      now: fixedNow
    });

    const result = await provider.answer({
      ...fixedRequest,
      providerId: "chat-answer.openai-compatible.deepseek"
    });

    expect(result).toMatchObject({
      providerId: "chat-answer.openai-compatible.deepseek",
      status: "answered",
      answer: "Array content now normalizes correctly."
    });
  });

  it("parses object-shaped assistant content directly", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport({
        choices: [
          {
            message: {
              role: "assistant",
              content: {
                providerId: "chat-answer.openai-compatible.deepseek",
                status: "answered",
                answer: "Object content now normalizes correctly.",
                directActionAttempted: false
              }
            }
          }
        ]
      }),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      providerId: "chat-answer.openai-compatible.deepseek",
      status: "answered",
      reasonCode: "FIXTURE_ANSWER",
      failureClass: "none",
      answer: "Object content now normalizes correctly."
    });
  });

  it("falls back to reasoning_content when assistant content is empty", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport({
        choices: [
          {
            message: {
              role: "assistant",
              content: "",
              reasoning_content: JSON.stringify({
                providerId: "chat-answer.openai-compatible.deepseek",
                status: "answered",
                reasonCode: "FIXTURE_ANSWER",
                failureClass: "none",
                answer:
                  "Reasoning-content fallback now rescues compact JSON answers.",
                fallbackUsed: false,
                directActionAttempted: false,
                rawProviderResponsePersisted: false,
                credentialExposed: false,
                answeredAt: "2026-08-09T00:00:00.000Z"
              })
            }
          }
        ]
      }),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      providerId: "chat-answer.openai-compatible.deepseek",
      status: "answered",
      reasonCode: "FIXTURE_ANSWER",
      failureClass: "none",
      answer: "Reasoning-content fallback now rescues compact JSON answers."
    });
  });

  it("falls back to object-shaped reasoning_content when assistant content is empty", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport({
        choices: [
          {
            message: {
              role: "assistant",
              content: "",
              reasoning_content: {
                providerId: "chat-answer.openai-compatible.deepseek",
                status: "clarify",
                message: "Please specify which subsystem or goal you mean.",
                directActionAttempted: false
              }
            }
          }
        ]
      }),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      providerId: "chat-answer.openai-compatible.deepseek",
      status: "clarify",
      reasonCode: "CLARIFY_REQUIRED",
      failureClass: "CLARIFY_REQUIRED",
      clarifyQuestion: "Please specify which subsystem or goal you mean."
    });
  });

  it("treats answer text as answered when status is omitted", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        chatResponse({
          providerId: "chat-answer.openai-compatible.deepseek",
          answer:
            "Jarvis-K keeps provider runtime default-off until an explicit approval window is opened.",
          directActionAttempted: false
        })
      ),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      status: "answered",
      reasonCode: "FIXTURE_ANSWER",
      failureClass: "none"
    });
    expect(result.answer).toContain("default-off");
  });

  it("fails closed for invalid and unsafe provider outputs", async () => {
    const invalidProvider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(chatResponse("not-json")),
      now: fixedNow
    });
    const unsafeProvider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        chatResponse({
          ...answeredResult(),
          directActionAttempted: true
        })
      ),
      now: fixedNow
    });

    await expect(invalidProvider.answer(fixedRequest)).resolves.toMatchObject({
      status: "unavailable",
      reasonCode: "INVALID_OUTPUT",
      failureClass: "PROVIDER_RESULT_INVALID",
      directActionAttempted: false
    });
    await expect(unsafeProvider.answer(fixedRequest)).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "UNSAFE_OR_BLOCKED",
      failureClass: "UNSAFE_OR_BLOCKED",
      directActionAttempted: false
    });
  });

  it("maps HTTP failures into sanitized unavailable results", async () => {
    const provider = new OpenAiCompatibleFixtureChatAnswerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        { error: { message: "private provider body" } },
        429
      ),
      now: fixedNow
    });

    const result = await provider.answer(fixedRequest);

    expect(result).toMatchObject({
      providerId: "chat-answer.openai-compatible.deepseek",
      status: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      failureClass: "PROVIDER_UNAVAILABLE",
      directActionAttempted: false
    });
    expect(JSON.stringify(result)).not.toContain("private provider body");
  });

  it("rejects tool-call shaped chat completion responses", () => {
    expect(() =>
      parseOpenAiCompatibleChatAnswerFixtureResponse(
        {
          choices: [
            {
              message: {
                role: "assistant",
                content: JSON.stringify(answeredResult()),
                tool_calls: []
              }
            }
          ]
        },
        fixedRequest,
        "deepseek.v4-flash",
        fixedNow
      )
    ).toThrow("OPENAI_COMPATIBLE_CHAT_ANSWER_TOOL_CALL_REJECTED");
  });

  it("classifies provider failure categories", () => {
    expect(
      classifyOpenAiCompatibleChatAnswerFixtureFailure({
        kind: "http",
        status: 401
      }).failureClass
    ).toBe("authentication_rejected");
    expect(
      classifyOpenAiCompatibleChatAnswerFixtureFailure({
        kind: "http",
        status: 404
      }).failureClass
    ).toBe("model_unavailable");
    expect(
      classifyOpenAiCompatibleChatAnswerFixtureFailure({
        kind: "transport"
      }).chatAnswerFailureClass
    ).toBe("PROVIDER_EXECUTION_FAILED");
  });

  it("keeps the fixture module free of runtime-only surfaces", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "packages",
        "inference-adapter-openai-chat-answer",
        "src",
        "openai-compatible.ts"
      ),
      "utf8"
    );

    for (const forbidden of [
      "fetch(",
      "safeStorage",
      "process.env",
      "BrowserWindow",
      "ipcMain",
      "ipcRenderer",
      "app.quit()",
      "console.log(",
      "JSON.stringify(error"
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});

function answeredResult() {
  return {
    providerId: "chat-answer.openai-compatible.deepseek",
    status: "answered",
    reasonCode: "FIXTURE_ANSWER",
    failureClass: "none",
    answer:
      "Default-off providers keep Jarvis-K predictable until a runtime window is explicitly approved.",
    fallbackUsed: false,
    directActionAttempted: false,
    rawProviderResponsePersisted: false,
    credentialExposed: false,
    answeredAt: "2026-08-08T00:00:00.000Z"
  };
}

function chatResponse(content: unknown) {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content:
            typeof content === "string" ? content : JSON.stringify(content)
        }
      }
    ]
  };
}

function fixedTransport(
  body: unknown,
  status = 200
): OpenAiCompatibleChatAnswerFixtureTransport & {
  lastRequest?: Parameters<
    OpenAiCompatibleChatAnswerFixtureTransport["send"]
  >[0];
} {
  return {
    async send(request) {
      this.lastRequest = request;
      return { status, body };
    }
  };
}

function fixedNow(): Date {
  return new Date("2026-08-08T00:00:00.000Z");
}
