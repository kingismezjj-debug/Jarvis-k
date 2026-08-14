import { describe, expect, it } from "vitest";
import {
  BrainCommandResultSchema,
  createCommandEnvelope
} from "@jarvis-k/contracts";
import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import { CoreRuntime } from "@jarvis-k/core";
import {
  GLM_HEAVY_PLANNER_PROVIDER_ID,
  type GlmHeavyPlannerFixtureTransport
} from "@jarvis-k/inference-adapter-glm-planner";
import { createCoreHostGlmHeavyPlannerComposition } from "../src/glm-heavy-planner-composition";

function allGateOptions(
  fixtureTransport: GlmHeavyPlannerFixtureTransport = fixedTransport()
) {
  return {
    enabled: true,
    providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
    fixtureCredential: {
      value: "fixture-glm-key"
    },
    credentialExposed: false,
    fixtureTransport,
    networkAccessDisabled: true,
    realCredentialAccessDisabled: true,
    contractReady: true,
    parserReady: true,
    timeoutAndOutputBoundsReady: true,
    defaultOffPreserved: true,
    qwenRulesFallbackPreserved: true,
    executorOnlySideEffectsPreserved: true
  };
}

describe("Core Host GLM Heavy Planner fixture composition", () => {
  it("fails closed and does not construct a provider when any fixture-only gate is missing", () => {
    const gateCases = [
      {
        name: "disabled",
        options: { ...allGateOptions(), enabled: false },
        reasonCode: "GLM_HEAVY_PLANNER_FIXTURE_DISABLED"
      },
      {
        name: "provider not approved",
        options: { ...allGateOptions(), providerId: "heavy-planner.openai" },
        reasonCode: "GLM_HEAVY_PLANNER_PROVIDER_NOT_APPROVED"
      },
      {
        name: "fixture credential missing",
        options: omitFixtureCredential(allGateOptions()),
        reasonCode: "GLM_HEAVY_PLANNER_FIXTURE_CREDENTIAL_MISSING"
      },
      {
        name: "credential exposed",
        options: { ...allGateOptions(), credentialExposed: true },
        reasonCode: "GLM_HEAVY_PLANNER_CREDENTIAL_EXPOSED"
      },
      {
        name: "fixture transport missing",
        options: omitFixtureTransport(allGateOptions()),
        reasonCode: "GLM_HEAVY_PLANNER_FIXTURE_TRANSPORT_MISSING"
      },
      {
        name: "network access not disabled",
        options: { ...allGateOptions(), networkAccessDisabled: false },
        reasonCode: "GLM_HEAVY_PLANNER_NETWORK_ACCESS_NOT_DISABLED"
      },
      {
        name: "real credential access not disabled",
        options: {
          ...allGateOptions(),
          realCredentialAccessDisabled: false
        },
        reasonCode:
          "GLM_HEAVY_PLANNER_REAL_CREDENTIAL_ACCESS_NOT_DISABLED"
      },
      {
        name: "parser not ready",
        options: { ...allGateOptions(), parserReady: false },
        reasonCode: "GLM_HEAVY_PLANNER_PARSER_NOT_READY"
      },
      {
        name: "fallback not preserved",
        options: {
          ...allGateOptions(),
          qwenRulesFallbackPreserved: false
        },
        reasonCode: "GLM_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED"
      },
      {
        name: "executor-only not preserved",
        options: {
          ...allGateOptions(),
          executorOnlySideEffectsPreserved: false
        },
        reasonCode:
          "GLM_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED"
      }
    ] as const;

    for (const item of gateCases) {
      const composition = createCoreHostGlmHeavyPlannerComposition(
        item.options
      );

      expect(composition.provider, item.name).toBeUndefined();
      expect(composition.compositionReport.reasonCodes).toContain(
        item.reasonCode
      );
      expect(composition.compositionReport).toMatchObject({
        directActionAttempted: false,
        credentialExposed: false,
        networkAccessed: false,
        realApiCalled: false,
        modelRuntimeAccessed: false,
        defaultBehaviorChanged: false,
        uiIpcBehaviorChanged: false,
        telemetryChanged: false,
        releaseBehaviorChanged: false
      });
    }
  });

  it("constructs only an injected fixture provider with no credential in transport data", async () => {
    const transport = fixedTransport();
    const composition = createCoreHostGlmHeavyPlannerComposition(
      allGateOptions(transport)
    );

    expect(composition.provider).toBeDefined();
    expect(composition.compositionReport).toMatchObject({
      status: "available",
      reasonCodes: ["GLM_HEAVY_PLANNER_FIXTURE_AVAILABLE"],
      networkAccessed: false,
      realApiCalled: false,
      modelRuntimeAccessed: false
    });

    const result = await composition.provider?.plan(fixedPlannerRequest());

    expect(result).toMatchObject({
      status: "planned",
      directActionAttempted: false
    });
    expect(JSON.stringify(transport.lastRequest)).not.toContain(
      "fixture-glm-key"
    );
    expect(transport.lastRequest?.body).not.toHaveProperty("tools");
    expect(transport.lastRequest?.body).not.toHaveProperty("tool_choice");
  });

  it("preserves Core rules fallback when the fixture provider is unavailable", async () => {
    const composition = createCoreHostGlmHeavyPlannerComposition(
      allGateOptions(fixedTransport({ error: { message: "private body" } }, 429))
    );
    const runtime = createRuntimeWithPlanner(composition.provider);

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.runBrainCommand",
        payload: {
          source: "text",
          text: "Plan a safe multi-step review workflow."
        }
      })
    );
    const brain = BrainCommandResultSchema.parse(
      result.ok ? result.data?.brain : undefined
    );

    expect(brain.plannerSelection).toMatchObject({
      providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
      fallbackProviderId: "brain.rules",
      status: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      usedPlanner: false,
      usedRulesFallback: true,
      directActionAttempted: false
    });
    expect(brain.plannerResult).toMatchObject({
      status: "unavailable",
      directActionAttempted: false
    });
    expect(JSON.stringify(brain)).not.toMatch(
      /(?:private body|fixture-glm-key|Bearer|token|secret)/iu
    );
  });
});

function fixedPlannerRequest() {
  return {
    providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
    utterance: "Plan a safe review workflow.",
    source: "text" as const,
    routedAt: "2026-08-07T00:00:00.000Z",
    routerDecision: {
      intent: "chat.answer" as const,
      confidence: 0.72,
      requiresApproval: false,
      slots: {},
      reason: "Fixture routing decision."
    },
    context: {
      allowedToolIds: ["chat.answer", "memory.search"]
    }
  };
}

function fixedTransport(
  body = {
    choices: [
      {
        message: {
          role: "assistant",
          content: JSON.stringify({
            providerId: GLM_HEAVY_PLANNER_PROVIDER_ID,
            status: "planned",
            reasonCode: "COMPLEX_REQUEST",
            failureClass: "none",
            plan: {
              summary: "Fixture-only bounded GLM plan.",
              risk: "medium",
              requiresConfirmation: true,
              steps: [
                {
                  id: "step-1",
                  toolId: "memory.search",
                  title: "Search bounded Memory context",
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
          })
        }
      }
    ]
  },
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

function createRuntimeWithPlanner(
  heavyPlannerProvider: HeavyPlannerProvider | undefined
) {
  return new CoreRuntime(
    () => undefined,
    {
      getSnapshot: () => ({
        state: "idle",
        mode: "disabled",
        permission: "unknown"
      }),
      setMode: async () => ({ accepted: true, state: "idle" }),
      startPtt: async () => ({ accepted: true, state: "idle" }),
      stopPtt: async () => ({ accepted: true, state: "idle" }),
      cancel: async () => ({ accepted: true, state: "idle" }),
      suspendForTts: async () => ({ accepted: true, state: "idle" }),
      resumeAfterTts: async () => ({ accepted: true, state: "idle" }),
      reportPermission: async () => ({ accepted: true, state: "idle" })
    },
    () => new Date("2026-08-07T00:00:00.000Z"),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    heavyPlannerProvider,
    {
      enabled: true,
      providerId: GLM_HEAVY_PLANNER_PROVIDER_ID
    }
  );
}

function omitFixtureCredential(
  options: ReturnType<typeof allGateOptions>
): Omit<ReturnType<typeof allGateOptions>, "fixtureCredential"> {
  const { fixtureCredential: _fixtureCredential, ...rest } = options;
  return rest;
}

function omitFixtureTransport(
  options: ReturnType<typeof allGateOptions>
): Omit<ReturnType<typeof allGateOptions>, "fixtureTransport"> {
  const { fixtureTransport: _fixtureTransport, ...rest } = options;
  return rest;
}
