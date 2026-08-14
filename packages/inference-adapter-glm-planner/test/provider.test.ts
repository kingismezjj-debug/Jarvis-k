import { describe, expect, it } from "vitest";
import {
  classifyGlmHeavyPlannerFixtureFailure,
  GLM_HEAVY_PLANNER_FIXTURE_MODEL_ID,
  GLM_HEAVY_PLANNER_FIXTURE_TIMEOUT_MS,
  GLM_HEAVY_PLANNER_MAX_OUTPUT_TOKENS,
  GLM_HEAVY_PLANNER_PROVIDER_ID,
  GlmHeavyPlannerProvider,
  type GlmHeavyPlannerFixtureTransport
} from "../src";

const fixedRequest = {
  providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
  utterance: "Plan a safe two-step project review workflow.",
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

describe("GlmHeavyPlannerProvider fixture-only", () => {
  it("builds bounded Chat Completions-shaped fixture input without credential or tools", async () => {
    const transport = fixedTransport(chatResponse(plannedResult()));
    const provider = new GlmHeavyPlannerProvider({
      credential: { value: "fixture-glm-key" },
      transport,
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result.status).toBe("planned");
    expect(transport.lastRequest).toMatchObject({
      timeoutMs: GLM_HEAVY_PLANNER_FIXTURE_TIMEOUT_MS,
      body: {
        model: GLM_HEAVY_PLANNER_FIXTURE_MODEL_ID,
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: GLM_HEAVY_PLANNER_MAX_OUTPUT_TOKENS
      }
    });
    expect(transport.lastRequest?.body.messages).toHaveLength(2);
    expect(transport.lastRequest?.body).not.toHaveProperty("tools");
    expect(transport.lastRequest?.body).not.toHaveProperty("tool_choice");
    expect(JSON.stringify(transport.lastRequest)).not.toContain(
      "fixture-glm-key"
    );
  });

  it("accepts bounded clarify and blocked planner results", async () => {
    const clarifyProvider = new GlmHeavyPlannerProvider({
      credential: { value: "fixture-glm-key" },
      transport: fixedTransport(
        chatResponse({
          providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
          status: "clarify",
          reasonCode: "CLARIFY_REQUIRED",
          failureClass: "CLARIFY_REQUIRED",
          clarifyQuestion: "Which project should be reviewed?",
          directActionAttempted: false,
          plannedAt: "2026-08-07T00:00:00.000Z"
        })
      ),
      now: fixedNow
    });
    const blockedProvider = new GlmHeavyPlannerProvider({
      credential: { value: "fixture-glm-key" },
      transport: fixedTransport(
        chatResponse({
          providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
          status: "blocked",
          reasonCode: "UNSAFE_PLAN",
          failureClass: "UNSAFE_PLAN",
          directActionAttempted: false,
          plannedAt: "2026-08-07T00:00:00.000Z"
        })
      ),
      now: fixedNow
    });

    await expect(clarifyProvider.plan(fixedRequest)).resolves.toMatchObject({
      status: "clarify",
      directActionAttempted: false
    });
    await expect(blockedProvider.plan(fixedRequest)).resolves.toMatchObject({
      status: "blocked",
      directActionAttempted: false
    });
  });

  it.each([
    [401, "authentication_rejected"],
    [429, "rate_limited"],
    [404, "model_unavailable"],
    [503, "provider_unavailable"],
    [500, "provider_execution_failed"]
  ] as const)(
    "maps fixture HTTP %i to the fixed %s classification",
    async (status, expectedFailureClass) => {
      const provider = new GlmHeavyPlannerProvider({
        credential: { value: "fixture-glm-key" },
        transport: fixedTransport(
          { error: { message: "private fixture provider body" } },
          status
        ),
        now: fixedNow
      });

      const result = await provider.plan(fixedRequest);
      const classification = classifyGlmHeavyPlannerFixtureFailure({
        kind: "http",
        status
      });

      expect(classification.failureClass).toBe(expectedFailureClass);
      expect(result.status).toBe("unavailable");
      expect(result.directActionAttempted).toBe(false);
      expect(JSON.stringify(result)).not.toContain("private fixture provider body");
    }
  );

  it("maps fixture transport failure without retaining an error message", async () => {
    const provider = new GlmHeavyPlannerProvider({
      credential: { value: "fixture-glm-key" },
      transport: {
        async send() {
          throw new Error("private fixture transport failure");
        }
      },
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result).toMatchObject({
      status: "unavailable",
      reasonCode: "PROVIDER_FAILED",
      failureClass: "PROVIDER_EXECUTION_FAILED",
      directActionAttempted: false
    });
    expect(JSON.stringify(result)).not.toContain("private fixture transport failure");
  });

  it("fails closed for malformed or invalid fixture output", async () => {
    const malformedProvider = new GlmHeavyPlannerProvider({
      credential: { value: "fixture-glm-key" },
      transport: fixedTransport({ choices: [] }),
      now: fixedNow
    });
    const invalidJsonProvider = new GlmHeavyPlannerProvider({
      credential: { value: "fixture-glm-key" },
      transport: fixedTransport(
        chatResponse("not-json")
      ),
      now: fixedNow
    });

    for (const provider of [malformedProvider, invalidJsonProvider]) {
      await expect(provider.plan(fixedRequest)).resolves.toMatchObject({
        status: "unavailable",
        reasonCode: "INVALID_PLAN",
        failureClass: "PROVIDER_RESULT_INVALID",
        directActionAttempted: false
      });
    }
  });

  it("blocks tool/function-call responses and unsafe tool outputs", async () => {
    const functionCallProvider = new GlmHeavyPlannerProvider({
      credential: { value: "fixture-glm-key" },
      transport: fixedTransport({
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify(plannedResult()),
              tool_calls: []
            }
          }
        ]
      }),
      now: fixedNow
    });
    const unsupportedToolProvider = new GlmHeavyPlannerProvider({
      credential: { value: "fixture-glm-key" },
      transport: fixedTransport(
        chatResponse(
          plannedResult({
            toolId: "shell.run"
          })
        )
      ),
      now: fixedNow
    });

    for (const provider of [functionCallProvider, unsupportedToolProvider]) {
      await expect(provider.plan(fixedRequest)).resolves.toMatchObject({
        status: "blocked",
        reasonCode: "UNSAFE_PLAN",
        failureClass: "UNSAFE_PLAN",
        directActionAttempted: false
      });
    }
  });

  it.each([
    ["result", { directActionAttempted: true }],
    ["plan", { planDirectActionAttempted: true }],
    ["step", { stepDirectActionAttempted: true }]
  ] as const)(
    "blocks an explicit direct action attempt in the %s",
    async (_location, options) => {
      const provider = new GlmHeavyPlannerProvider({
        credential: { value: "fixture-glm-key" },
        transport: fixedTransport(chatResponse(plannedResult(options))),
        now: fixedNow
      });

      await expect(provider.plan(fixedRequest)).resolves.toMatchObject({
        status: "blocked",
        reasonCode: "UNSAFE_PLAN",
        failureClass: "UNSAFE_PLAN",
        directActionAttempted: false
      });
    }
  );

  it.each(["medium", "high", "blocked"] as const)(
    "rejects %s plan risk when confirmation is omitted",
    async (risk) => {
      const provider = new GlmHeavyPlannerProvider({
        credential: { value: "fixture-glm-key" },
        transport: fixedTransport(
          chatResponse(
            plannedResult({
              planRisk: risk,
              planRequiresConfirmation: false,
              stepRisk: "low",
              stepRequiresConfirmation: false
            })
          )
        ),
        now: fixedNow
      });

      await expect(provider.plan(fixedRequest)).resolves.toMatchObject({
        status: "unavailable",
        reasonCode: "INVALID_PLAN",
        failureClass: "PROVIDER_RESULT_INVALID",
        directActionAttempted: false
      });
    }
  );

  it.each(["medium", "high", "blocked"] as const)(
    "rejects %s step risk when step confirmation is omitted",
    async (risk) => {
      const provider = new GlmHeavyPlannerProvider({
        credential: { value: "fixture-glm-key" },
        transport: fixedTransport(
          chatResponse(
            plannedResult({
              planRisk: "low",
              planRequiresConfirmation: true,
              stepRisk: risk,
              stepRequiresConfirmation: false
            })
          )
        ),
        now: fixedNow
      });

      await expect(provider.plan(fixedRequest)).resolves.toMatchObject({
        status: "unavailable",
        reasonCode: "INVALID_PLAN",
        failureClass: "PROVIDER_RESULT_INVALID",
        directActionAttempted: false
      });
    }
  );

  it("rejects non-fixture credentials before any transport call", () => {
    expect(() => {
      new GlmHeavyPlannerProvider({
        credential: { value: "not-a-real-key" },
        transport: fixedTransport(chatResponse(plannedResult())),
        now: fixedNow
      });
    }).toThrow("GLM_HEAVY_PLANNER_FIXTURE_CREDENTIAL_INVALID");
  });
});

function plannedResult(
  options: {
    toolId?: string;
    planRisk?: "low" | "medium" | "high" | "blocked";
    planRequiresConfirmation?: boolean;
    stepRisk?: "low" | "medium" | "high" | "blocked";
    stepRequiresConfirmation?: boolean;
    directActionAttempted?: boolean;
    planDirectActionAttempted?: boolean;
    stepDirectActionAttempted?: boolean;
  } = {}
): Record<string, unknown> {
  return {
    providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
    status: "planned",
    reasonCode: "COMPLEX_REQUEST",
    failureClass: "none",
    plan: {
      summary: "Fixture-only bounded GLM plan.",
      risk: options.planRisk ?? "medium",
      requiresConfirmation: options.planRequiresConfirmation ?? true,
      steps: [
        {
          id: "step-1",
          toolId: options.toolId ?? "memory.search",
          title: "Search bounded Memory context",
          args: {},
          risk: options.stepRisk ?? "medium",
          requiresConfirmation: options.stepRequiresConfirmation ?? true,
          directActionAttempted: options.stepDirectActionAttempted ?? false
        }
      ],
      directActionAttempted: options.planDirectActionAttempted ?? false
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

function fixedTransport(
  body: unknown,
  status = 200
): GlmHeavyPlannerFixtureTransport & {
  lastRequest?: Parameters<GlmHeavyPlannerFixtureTransport["send"]>[0];
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
