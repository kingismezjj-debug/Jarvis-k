import { describe, expect, it } from "vitest";
import {
  OPENAI_HEAVY_PLANNER_PROVIDER_ID,
  OpenAiHeavyPlannerProvider,
  parseOpenAiHeavyPlannerOutput,
  type OpenAiHeavyPlannerTransport
} from "../src";

const fixedRequest = {
  providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
  utterance: "Plan a safe project review workflow",
  source: "text",
  routedAt: "2026-08-07T00:00:00.000Z",
  routerDecision: {
    intent: "chat.answer",
    confidence: 0.72,
    requiresApproval: false,
    slots: {},
    reason: "Defaulted to chat."
  },
  context: {
    allowedToolIds: ["chat.answer", "memory.search"]
  }
} as const;

describe("OpenAiHeavyPlannerProvider", () => {
  it("parses bounded planner JSON from a mocked Responses transport", async () => {
    const transport = fixedTransport({
      output_text: JSON.stringify(plannedResult())
    });
    const provider = new OpenAiHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport,
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result.status).toBe("planned");
    expect(result.plan?.requiresConfirmation).toBe(true);
    expect(result.directActionAttempted).toBe(false);
    expect(transport.lastRequest?.headers.Authorization).toBe(
      "Bearer test-key"
    );
    expect(JSON.stringify(result)).not.toMatch(/test-key|Bearer/iu);
  });

  it("accepts clarify planner results without a plan", async () => {
    const provider = new OpenAiHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport({
        output_text: JSON.stringify({
          providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
          status: "clarify",
          reasonCode: "CLARIFY_REQUIRED",
          failureClass: "CLARIFY_REQUIRED",
          clarifyQuestion: "Which repository should be reviewed?",
          directActionAttempted: false,
          plannedAt: "2026-08-07T00:00:00.000Z"
        })
      }),
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result.status).toBe("clarify");
    expect(result.clarifyQuestion).toContain("repository");
  });

  it("fails closed for invalid JSON output", async () => {
    const provider = new OpenAiHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport({ output_text: "not-json" }),
      now: fixedNow
    });

    await expect(provider.plan(fixedRequest)).rejects.toThrow();
  });

  it("rejects unsupported tool ids from provider output", () => {
    expect(() =>
      parseOpenAiHeavyPlannerOutput(
        JSON.stringify(
          plannedResult({
            toolId: "shell.run"
          })
        ),
        fixedNow
      )
    ).toThrow("OPENAI_HEAVY_PLANNER_TOOL_UNSUPPORTED");
  });

  it("maps provider HTTP failures to unavailable planner results", async () => {
    const provider = new OpenAiHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport({}, 429),
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result.status).toBe("unavailable");
    expect(result.reasonCode).toBe("PROVIDER_UNAVAILABLE");
    expect(result.failureClass).toBe("PROVIDER_UNAVAILABLE");
    expect(result.directActionAttempted).toBe(false);
  });

  it("classifies non-retryable HTTP failures without retaining response data", async () => {
    const provider = new OpenAiHeavyPlannerProvider({
      credential: { apiKey: "test-key" },
      transport: fixedTransport({ error: { message: "private provider body" } }, 500),
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result).toMatchObject({
      status: "unavailable",
      reasonCode: "PROVIDER_FAILED",
      failureClass: "PROVIDER_EXECUTION_FAILED",
      directActionAttempted: false
    });
    expect(JSON.stringify(result)).not.toContain("private provider body");
  });
});

function plannedResult(
  options: { toolId?: string } = {}
): Record<string, unknown> {
  return {
    providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
    status: "planned",
    reasonCode: "COMPLEX_REQUEST",
    failureClass: "none",
    plan: {
      summary: "Fixture bounded plan.",
      risk: "medium",
      requiresConfirmation: true,
      steps: [
        {
          id: "step-1",
          toolId: options.toolId ?? "memory.search",
          title: "Search Memory context",
          args: {},
          risk: "medium",
          requiresConfirmation: true,
          directActionAttempted: false
        }
      ],
      directActionAttempted: false
    },
    directActionAttempted: false,
    plannedAt: "2026-08-07T00:00:00.000Z"
  };
}

function fixedTransport(
  body: unknown,
  status = 200
): OpenAiHeavyPlannerTransport & {
  lastRequest?: Parameters<OpenAiHeavyPlannerTransport["send"]>[0];
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
