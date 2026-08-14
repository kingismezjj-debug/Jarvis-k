import { describe, expect, it } from "vitest";
import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  BrainCommandResultSchema,
  createCommandEnvelope
} from "@jarvis-k/contracts";
import { CoreRuntime } from "@jarvis-k/core";
import {
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  type GlmRuntimeHeavyPlannerTransport
} from "@jarvis-k/inference-adapter-glm-runtime";
import { createCoreHostGlmRuntimeHeavyPlannerComposition } from "../src/glm-heavy-planner-runtime-composition";

function allGateOptions(
  transport: GlmRuntimeHeavyPlannerTransport = fixedTransport()
) {
  return {
    enabled: true,
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    modelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    fixedProfileApproved: true,
    secureCredentialStoreAvailable: true,
    credential: {
      apiKey: "test-key"
    },
    credentialExposed: false,
    networkWindowApproved: true,
    contractReady: true,
    parserReady: true,
    timeoutAndOutputBoundsReady: true,
    defaultOffPreserved: true,
    qwenRulesFallbackPreserved: true,
    executorOnlySideEffectsPreserved: true,
    transport
  };
}

describe("Core Host GLM runtime Heavy Planner composition", () => {
  it("fails closed without constructing a provider when any runtime gate is missing", () => {
    const gateCases = [
      {
        options: { ...allGateOptions(), enabled: false },
        reasonCode: "GLM_RUNTIME_HEAVY_PLANNER_DISABLED"
      },
      {
        options: {
          ...allGateOptions(),
          providerId: "heavy-planner.openai"
        },
        reasonCode: "GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_NOT_APPROVED"
      },
      {
        options: {
          ...allGateOptions(),
          modelId: "glm-fixture"
        },
        reasonCode: "GLM_RUNTIME_HEAVY_PLANNER_FIXED_PROFILE_NOT_APPROVED"
      },
      {
        options: {
          ...allGateOptions(),
          secureCredentialStoreAvailable: false
        },
        reasonCode: "GLM_RUNTIME_HEAVY_PLANNER_SECURE_STORE_UNAVAILABLE"
      },
      {
        options: omitCredential(allGateOptions()),
        reasonCode: "GLM_RUNTIME_HEAVY_PLANNER_CREDENTIAL_MISSING"
      },
      {
        options: { ...allGateOptions(), credentialExposed: true },
        reasonCode: "GLM_RUNTIME_HEAVY_PLANNER_CREDENTIAL_EXPOSED"
      },
      {
        options: { ...allGateOptions(), networkWindowApproved: false },
        reasonCode: "GLM_RUNTIME_HEAVY_PLANNER_NETWORK_WINDOW_NOT_APPROVED"
      },
      {
        options: {
          ...allGateOptions(),
          qwenRulesFallbackPreserved: false
        },
        reasonCode: "GLM_RUNTIME_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED"
      },
      {
        options: {
          ...allGateOptions(),
          executorOnlySideEffectsPreserved: false
        },
        reasonCode:
          "GLM_RUNTIME_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED"
      }
    ] as const;

    for (const item of gateCases) {
      const composition = createCoreHostGlmRuntimeHeavyPlannerComposition(
        item.options
      );

      expect(composition.provider).toBeUndefined();
      expect(composition.compositionReport.reasonCodes).toContain(
        item.reasonCode
      );
      expect(composition.compositionReport).toMatchObject({
        directActionAttempted: false,
        credentialExposed: false,
        networkAccessed: false,
        realApiCalled: false,
        defaultBehaviorChanged: false,
        uiIpcBehaviorChanged: false,
        telemetryChanged: false,
        releaseBehaviorChanged: false
      });
    }
  });

  it("constructs only the fixed runtime provider with an injected transport", async () => {
    const transport = fixedTransport();
    const composition = createCoreHostGlmRuntimeHeavyPlannerComposition(
      allGateOptions(transport)
    );

    expect(composition.provider).toBeDefined();
    expect(composition.compositionReport).toMatchObject({
      provider: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      model: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
      status: "available",
      reasonCodes: ["GLM_RUNTIME_HEAVY_PLANNER_AVAILABLE"],
      networkAccessed: false,
      realApiCalled: false
    });

    const result = await composition.provider?.plan(fixedPlannerRequest());

    expect(result).toMatchObject({
      status: "planned",
      directActionAttempted: false
    });
    expect(JSON.stringify(transport.lastRequest?.body)).not.toContain(
      "test-key"
    );
    expect(JSON.stringify(composition.compositionReport)).not.toContain(
      "test-key"
    );
    expect(transport.lastRequest?.body).not.toHaveProperty("tools");
  });

  it("preserves rules fallback for a sanitized GLM unavailable result", async () => {
    const composition = createCoreHostGlmRuntimeHeavyPlannerComposition(
      allGateOptions(fixedTransport({}, 429))
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
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      fallbackProviderId: "brain.rules",
      status: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      usedPlanner: false,
      usedRulesFallback: true,
      directActionAttempted: false
    });
  });
});

function fixedPlannerRequest() {
  return {
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
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
            providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
            status: "planned",
            reasonCode: "COMPLEX_REQUEST",
            failureClass: "none",
            plan: {
              summary: "Bounded GLM runtime plan.",
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
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID
    }
  );
}

function omitCredential(
  options: ReturnType<typeof allGateOptions>
): Omit<ReturnType<typeof allGateOptions>, "credential"> {
  const { credential: _credential, ...rest } = options;
  return rest;
}
