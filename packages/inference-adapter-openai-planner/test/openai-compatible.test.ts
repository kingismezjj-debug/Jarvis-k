import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OpenAiCompatibleFixtureHeavyPlannerProvider,
  classifyOpenAiCompatibleFixtureFailure,
  createOpenAiCompatibleHeavyPlannerFixtureRequest,
  listOpenAiCompatibleHeavyPlannerProfiles,
  parseOpenAiCompatibleHeavyPlannerFixtureResponse,
  type OpenAiCompatibleHeavyPlannerFixtureTransport
} from "../src";

const fixedRequest = {
  providerId: "heavy-planner.openai-compatible.deepseek",
  utterance: "Plan a safe project review workflow",
  source: "text",
  routedAt: "2026-08-07T00:00:00.000Z",
  routerDecision: {
    intent: "chat.answer",
    confidence: 0.62,
    requiresApproval: false,
    slots: {},
    reason: "Complex request needs planning."
  },
  context: {
    allowedToolIds: ["chat.answer", "memory.search"]
  }
} as const;

describe("OpenAI-compatible Heavy Planner fixture layer", () => {
  it("registers fixed default-off provider profiles", () => {
    const profiles = listOpenAiCompatibleHeavyPlannerProfiles();

    expect(profiles.map((profile) => profile.profileId)).toEqual([
      "openai.gpt-4.1-mini",
      "deepseek.v4-flash",
      "qwen.flash",
      "glm.4.7-flash"
    ]);
    expect(profiles.map((profile) => profile.providerId)).toEqual([
      "heavy-planner.openai-compatible.openai",
      "heavy-planner.openai-compatible.deepseek",
      "heavy-planner.openai-compatible.qwen",
      "heavy-planner.openai-compatible.glm"
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
          profile.heavyPlannerAcceptanceApproved === false
      )
    ).toBe(true);
  });

  it("creates a bounded OpenAI-compatible Chat Completions fixture request", () => {
    const request = createOpenAiCompatibleHeavyPlannerFixtureRequest(
      fixedRequest,
      "deepseek.v4-flash"
    );

    expect(request).toMatchObject({
      providerId: "heavy-planner.openai-compatible.deepseek",
      profileId: "deepseek.v4-flash",
      modelId: "deepseek-v4-flash",
      timeoutMs: 30_000,
      body: {
        model: "deepseek-v4-flash",
        response_format: { type: "json_object" },
        stream: false,
        temperature: 0,
        max_tokens: 700
      }
    });
    expect(request.body.messages).toHaveLength(2);
    expect(request.body.messages[0].content).toContain(
      "Return only bounded BrainPlannerResult JSON"
    );
    expect(request.body.messages[0].content).toContain(
      "directActionAttempted false"
    );
    expect(request.body).not.toHaveProperty("tools");
    expect(request.body).not.toHaveProperty("tool_choice");
  });

  it("parses planned results from a mocked chat-completions transport", async () => {
    const transport = fixedTransport(chatResponse(plannedResult()));
    const provider = new OpenAiCompatibleFixtureHeavyPlannerProvider({
      profileId: "deepseek.v4-flash",
      transport,
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result).toMatchObject({
      providerId: "heavy-planner.openai-compatible.deepseek",
      status: "planned",
      reasonCode: "COMPLEX_REQUEST",
      failureClass: "none",
      directActionAttempted: false
    });
    expect(result.plan?.requiresConfirmation).toBe(true);
    expect(transport.lastRequest?.body.model).toBe("deepseek-v4-flash");
    expect(JSON.stringify(result)).not.toContain("private provider body");
  });

  it("accepts clarify results without a plan", async () => {
    const provider = new OpenAiCompatibleFixtureHeavyPlannerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        chatResponse({
          providerId: "heavy-planner.openai-compatible.deepseek",
          status: "clarify",
          reasonCode: "CLARIFY_REQUIRED",
          failureClass: "CLARIFY_REQUIRED",
          plan: null,
          clarifyQuestion: "Which repository should be reviewed?",
          directActionAttempted: false
        })
      ),
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result.status).toBe("clarify");
    expect(result.clarifyQuestion).toContain("repository");
  });

  it("fails closed for invalid and unsafe provider outputs", async () => {
    const invalidProvider = new OpenAiCompatibleFixtureHeavyPlannerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(chatResponse("not-json")),
      now: fixedNow
    });
    const unsafeProvider = new OpenAiCompatibleFixtureHeavyPlannerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport(
        chatResponse({
          ...plannedResult(),
          directActionAttempted: true
        })
      ),
      now: fixedNow
    });

    await expect(invalidProvider.plan(fixedRequest)).resolves.toMatchObject({
      status: "unavailable",
      reasonCode: "INVALID_PLAN",
      failureClass: "PROVIDER_RESULT_INVALID",
      directActionAttempted: false
    });
    await expect(unsafeProvider.plan(fixedRequest)).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "UNSAFE_PLAN",
      failureClass: "UNSAFE_PLAN",
      directActionAttempted: false
    });
  });

  it("maps HTTP failures into sanitized planner results", async () => {
    const provider = new OpenAiCompatibleFixtureHeavyPlannerProvider({
      profileId: "deepseek.v4-flash",
      transport: fixedTransport({ error: { message: "private provider body" } }, 429),
      now: fixedNow
    });

    const result = await provider.plan(fixedRequest);

    expect(result).toMatchObject({
      providerId: "heavy-planner.openai-compatible.deepseek",
      status: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      failureClass: "PROVIDER_UNAVAILABLE",
      directActionAttempted: false
    });
    expect(JSON.stringify(result)).not.toContain("private provider body");
  });

  it("rejects unsupported tool ids from parsed planner output", () => {
    expect(() =>
      parseOpenAiCompatibleHeavyPlannerFixtureResponse(
        chatResponse(
          plannedResult({
            toolId: "shell.run"
          })
        ),
        fixedRequest,
        "deepseek.v4-flash",
        fixedNow
      )
    ).toThrow("OPENAI_COMPATIBLE_TOOL_UNSUPPORTED");
  });

  it("classifies provider failure categories", () => {
    expect(
      classifyOpenAiCompatibleFixtureFailure({ kind: "http", status: 401 })
        .failureClass
    ).toBe("authentication_rejected");
    expect(
      classifyOpenAiCompatibleFixtureFailure({ kind: "http", status: 404 })
        .failureClass
    ).toBe("model_unavailable");
    expect(
      classifyOpenAiCompatibleFixtureFailure({ kind: "transport" })
        .plannerFailureClass
    ).toBe("PROVIDER_EXECUTION_FAILED");
  });

  it("keeps the fixture module free of runtime-only surfaces", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "packages",
        "inference-adapter-openai-planner",
        "src",
        "openai-compatible.ts"
      ),
      "utf8"
    );

    for (const forbidden of [
      "fetch(",
      "safeStorage",
      "SecureHeavyPlannerProviderStore",
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

function plannedResult(options: { toolId?: string } = {}) {
  return {
    providerId: "heavy-planner.openai-compatible.deepseek",
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
    clarifyQuestion: null,
    directActionAttempted: false
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
): OpenAiCompatibleHeavyPlannerFixtureTransport & {
  lastRequest?: Parameters<
    OpenAiCompatibleHeavyPlannerFixtureTransport["send"]
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
  return new Date("2026-08-07T00:00:00.000Z");
}
