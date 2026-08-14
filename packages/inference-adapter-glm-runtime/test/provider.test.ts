import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FetchGlmRuntimeHeavyPlannerTransport,
  GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
  GLM_RUNTIME_HEAVY_PLANNER_MAX_ATTEMPTS,
  GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS,
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS,
  GlmRuntimeHeavyPlannerProvider,
  GlmRuntimeHeavyPlannerTransportFailure,
  classifyGlmRuntimeHeavyPlannerFailure,
  classifyGlmRuntimeHeavyPlannerTransportFailure,
  createGlmRuntimeChatCompletionRequest,
  extractJsonObjectText,
  normalizeGlmRuntimePlannerResult,
  type GlmRuntimeHeavyPlannerTransport
} from "../src";

const fixedRequest = {
  providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  utterance: "Plan a safe two-step review workflow.",
  source: "text",
  routedAt: "2026-08-07T00:00:00.000Z",
  routerDecision: {
    intent: "chat.answer",
    confidence: 0.72,
    requiresApproval: false,
    slots: {},
    reason: "Fixture routing decision."
  },
  context: {
    allowedToolIds: ["chat.answer", "memory.search"]
  }
} as const;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GlmRuntimeHeavyPlannerProvider", () => {
  it("uses only the fixed GLM profile with bounded JSON and no tools", async () => {
    const transport = fixedTransport(chatResponse(plannedResult()));
    const provider = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport,
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result).toMatchObject({
      status: "planned",
      directActionAttempted: false
    });
    expect(transport.lastRequest).toMatchObject({
      url: GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
      timeoutMs: GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS,
      body: {
        model: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
        response_format: { type: "json_object" },
        stream: false,
        temperature: 0,
        max_tokens: GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS
      }
    });
    expect(transport.lastRequest?.headers.Authorization).toMatch(/^Bearer /u);
    expect(transport.lastRequest?.body.messages).toHaveLength(2);
    expect(transport.lastRequest?.body.messages[0]?.content).toContain(
      "Return one JSON object only"
    );
    expect(transport.lastRequest?.body.messages[0]?.content).toContain(
      "status must be planned, clarify, blocked, or unavailable"
    );
    expect(transport.lastRequest?.body).not.toHaveProperty("tools");
    expect(transport.lastRequest?.body).not.toHaveProperty("tool_choice");
    expect(JSON.stringify(result)).not.toContain("test-key");
  });

  it("uses a bounded one-attempt timeout strategy for future approved windows", async () => {
    const transport = fixedTransport(chatResponse(plannedResult()));
    const provider = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport,
      now: fixedNow
    });

    await provider.plan(fixedRequest);

    expect(GLM_RUNTIME_HEAVY_PLANNER_MAX_ATTEMPTS).toBe(1);
    expect(transport.lastRequest?.timeoutMs).toBe(45_000);
    expect(transport.lastRequest?.timeoutMs).toBe(
      GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS
    );
  });

  it("does not retry failed transport calls inside the bounded timeout strategy", async () => {
    let calls = 0;
    const provider = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: {
        async send() {
          calls += 1;
          throw new GlmRuntimeHeavyPlannerTransportFailure("timeout");
        }
      },
      now: fixedNow
    });

    await expect(provider.plan(fixedRequest)).resolves.toMatchObject({
      status: "unavailable",
      reasonCode: "PROVIDER_FAILED",
      failureClass: "PROVIDER_EXECUTION_FAILED",
      directActionAttempted: false
    });
    expect(calls).toBe(GLM_RUNTIME_HEAVY_PLANNER_MAX_ATTEMPTS);
  });

  it.each([
    [401, "authentication_rejected"],
    [429, "rate_limited"],
    [404, "model_unavailable"],
    [503, "provider_unavailable"],
    [500, "provider_execution_failed"]
  ] as const)(
    "maps HTTP %i to the fixed %s classification without retaining the response body",
    async (status, expectedFailureClass) => {
      const provider = new GlmRuntimeHeavyPlannerProvider({
        credential: { apiKey: "test-key" },
        transport: fixedTransport(
          { error: { message: "private provider diagnostic" } },
          status
        ),
        now: fixedNow
      });

      const result = await provider.plan(fixedRequest);
      const classification = classifyGlmRuntimeHeavyPlannerFailure({
        kind: "http",
        status
      });

      expect(classification.failureClass).toBe(expectedFailureClass);
      expect(result.status).toBe("unavailable");
      expect(JSON.stringify(result)).not.toContain("private provider diagnostic");
    }
  );

  it("fails closed for transport, invalid output, and unsafe output", async () => {
    const transportFailure = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: {
        async send() {
          throw new Error("private transport failure");
        }
      },
      now: fixedNow
    });
    const invalidOutput = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(chatResponse("not-json")),
      now: fixedNow
    });
    const unsafeOutput = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(
        chatResponse(plannedResult({ toolId: "shell.run" }))
      ),
      now: fixedNow
    });

    await expect(transportFailure.plan(fixedRequest)).resolves.toMatchObject({
      status: "unavailable",
      reasonCode: "PROVIDER_FAILED",
      directActionAttempted: false
    });
    await expect(invalidOutput.plan(fixedRequest)).resolves.toMatchObject({
      status: "unavailable",
      reasonCode: "INVALID_PLAN",
      directActionAttempted: false
    });
    await expect(unsafeOutput.plan(fixedRequest)).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "UNSAFE_PLAN",
      directActionAttempted: false
    });
  });

  it("normalizes common GLM JSON variants without exposing raw diagnostics", async () => {
    const provider = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(
        chatResponse(
          fencedJson({
            plannerResult: {
              status: "success",
              plan: {
                summary: "Review public notes.",
                risk: "medium",
                steps: [
                  {
                    tool: "memory.search",
                    name: "Search Memory"
                  }
                ]
              }
            }
          })
        )
      ),
      now: fixedNow
    });

    await expect(provider.plan(fixedRequest)).resolves.toMatchObject({
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      status: "planned",
      reasonCode: "COMPLEX_REQUEST",
      failureClass: "none",
      plan: {
        requiresConfirmation: true,
        steps: [
          {
            toolId: "memory.search",
            title: "Search Memory",
            requiresConfirmation: true,
            directActionAttempted: false
          }
        ],
        directActionAttempted: false
      },
      directActionAttempted: false,
      plannedAt: "2026-08-07T00:00:00.000Z"
    });
    expect(JSON.stringify(await provider.plan(fixedRequest))).not.toContain(
      "test-key"
    );
  });

  it("normalizes clarify and blocked variants into bounded BrainPlannerResult shapes", async () => {
    const clarifyProvider = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(
        chatResponse({
          result: {
            status: "needs clarification",
            question: "Which notes should I review?"
          }
        })
      ),
      now: fixedNow
    });
    const blockedProvider = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(
        chatResponse({
          status: "unsafe",
          message: "This plan is not allowed."
        })
      ),
      now: fixedNow
    });

    await expect(clarifyProvider.plan(fixedRequest)).resolves.toMatchObject({
      status: "clarify",
      reasonCode: "CLARIFY_REQUIRED",
      failureClass: "CLARIFY_REQUIRED",
      clarifyQuestion: "Which notes should I review?",
      directActionAttempted: false
    });
    await expect(blockedProvider.plan(fixedRequest)).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "UNSAFE_PLAN",
      failureClass: "UNSAFE_PLAN",
      directActionAttempted: false
    });
  });

  it("extracts fenced or prefixed JSON objects and keeps malformed text fail-closed", () => {
    expect(extractJsonObjectText(fencedJson({ status: "clarify" }))).toBe(
      '{"status":"clarify"}'
    );
    expect(
      extractJsonObjectText('GLM output: {"status":"blocked"} trailing note')
    ).toBe('{"status":"blocked"}');
    expect(() => extractJsonObjectText("not-json")).toThrow(
      "GLM_RUNTIME_HEAVY_PLANNER_OUTPUT_INVALID"
    );
  });

  it("normalizes missing safe fields but preserves explicit unsafe fields for rejection", () => {
    expect(
      normalizeGlmRuntimePlannerResult(
        {
          status: "success",
          plan: {
            risk: "medium",
            steps: [{ tool: "memory.search" }]
          }
        },
        fixedNow
      )
    ).toMatchObject({
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      status: "planned",
      reasonCode: "COMPLEX_REQUEST",
      failureClass: "none",
      plan: {
        requiresConfirmation: true,
        steps: [
          {
            toolId: "memory.search",
            requiresConfirmation: true,
            directActionAttempted: false
          }
        ],
        directActionAttempted: false
      },
      directActionAttempted: false
    });
    expect(
      normalizeGlmRuntimePlannerResult(
        {
          status: "success",
          directActionAttempted: true,
          plan: {
            risk: "medium",
            steps: [{ tool: "memory.search" }]
          }
        },
        fixedNow
      )
    ).toMatchObject({
      directActionAttempted: true
    });
  });

  it("blocks direct action output and rejects a plan without required confirmation", async () => {
    const directActionOutput = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(
        chatResponse(plannedResult({ directActionAttempted: true }))
      ),
      now: fixedNow
    });
    const missingConfirmation = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(
        chatResponse(plannedResult({ planRequiresConfirmation: false }))
      ),
      now: fixedNow
    });

    await expect(directActionOutput.plan(fixedRequest)).resolves.toMatchObject(
      {
        status: "blocked",
        reasonCode: "UNSAFE_PLAN",
        directActionAttempted: false
      }
    );
    await expect(missingConfirmation.plan(fixedRequest)).resolves.toMatchObject(
      {
        status: "unavailable",
        reasonCode: "INVALID_PLAN",
        directActionAttempted: false
      }
    );
  });

  it("rejects a provider mismatch before the transport can run", async () => {
    const transport = fixedTransport(chatResponse(plannedResult()));
    const provider = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport,
      now: fixedNow
    });

    await expect(
      provider.plan({
        ...fixedRequest,
        providerId: "heavy-planner.openai"
      })
    ).rejects.toThrow("GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_MISMATCH");
    expect(transport.lastRequest).toBeUndefined();
  });

  it("uses the fixed endpoint with local fetch mocking only", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ input, init });
        return new Response(JSON.stringify(chatResponse(plannedResult())), {
          status: 200
        });
      }
    );
    const transport = new FetchGlmRuntimeHeavyPlannerTransport();
    const provider = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport,
      now: fixedNow
    });

    await expect(provider.plan(fixedRequest)).resolves.toMatchObject({
      status: "planned",
      directActionAttempted: false
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      input: GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
      init: {
        method: "POST"
      }
    });
    expect(
      String(
        (calls[0]?.init?.headers as Record<string, string> | undefined)
          ?.Authorization ?? ""
      )
    ).toMatch(/^Bearer /u);
  });

  it("classifies a malformed successful fetch response as invalid output", async () => {
    vi.stubGlobal(
      "fetch",
      async () => new Response("not-json", { status: 200 })
    );
    const provider = new GlmRuntimeHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: new FetchGlmRuntimeHeavyPlannerTransport(),
      now: fixedNow
    });

    await expect(provider.plan(fixedRequest)).resolves.toMatchObject({
      status: "unavailable",
      reasonCode: "INVALID_PLAN",
      failureClass: "PROVIDER_RESULT_INVALID",
      directActionAttempted: false
    });
  });

  it("reduces rejected fetch failures to fixed sanitized categories", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("private connection diagnostic");
    });
    const transport = new FetchGlmRuntimeHeavyPlannerTransport();

    await expect(
      transport.send({
        url: GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
        headers: {
          Authorization: "Bearer test-key",
          "Content-Type": "application/json"
        },
        body: createGlmRuntimeChatCompletionRequest(fixedRequest),
        timeoutMs: GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS
      })
    ).rejects.toMatchObject({
      name: "Error",
      message: "GLM_RUNTIME_HEAVY_PLANNER_TRANSPORT_FAILURE",
      category: "connection"
    });
  });

  it("classifies timeout, connection, and unknown transport failures without error text", () => {
    expect(
      classifyGlmRuntimeHeavyPlannerTransportFailure(
        new Error("private timeout diagnostic"),
        true
      )
    ).toBe("timeout");
    expect(
      classifyGlmRuntimeHeavyPlannerTransportFailure(
        new TypeError("private connection diagnostic"),
        false
      )
    ).toBe("connection");
    expect(
      classifyGlmRuntimeHeavyPlannerTransportFailure(
        new Error("private unknown diagnostic"),
        false
      )
    ).toBe("unknown");

    const failure = new GlmRuntimeHeavyPlannerTransportFailure("unknown");
    expect(failure.message).not.toContain("private");
  });
});

function plannedResult(
  options: {
    toolId?: string;
    directActionAttempted?: boolean;
    planRequiresConfirmation?: boolean;
  } = {}
): Record<string, unknown> {
  return {
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    status: "planned",
    reasonCode: "COMPLEX_REQUEST",
    failureClass: "none",
    plan: {
      summary: "Bounded GLM runtime plan.",
      risk: "medium",
      requiresConfirmation: options.planRequiresConfirmation ?? true,
      steps: [
        {
          id: "step-1",
          toolId: options.toolId ?? "memory.search",
          title: "Search bounded Memory context",
          args: {},
          risk: "medium",
          requiresConfirmation: true,
          directActionAttempted: false
        }
      ],
      directActionAttempted: false
    },
    directActionAttempted: options.directActionAttempted ?? false,
    plannedAt: "2026-08-07T00:00:00.000Z"
  };
}

function chatResponse(content: Record<string, unknown> | string) {
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

function fencedJson(content: Record<string, unknown>): string {
  return `\`\`\`json\n${JSON.stringify(content)}\n\`\`\``;
}

function fixedTransport(
  body: unknown,
  status = 200
): GlmRuntimeHeavyPlannerTransport & {
  lastRequest?: Parameters<GlmRuntimeHeavyPlannerTransport["send"]>[0];
} {
  return {
    async send(request) {
      this.lastRequest = request;
      return { status, body };
    }
  };
}

function fixedNow(): Date {
  return new Date("2026-08-07T00:00:00.000Z");
}
