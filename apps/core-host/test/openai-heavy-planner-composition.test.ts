import { describe, expect, it } from "vitest";
import {
  OPENAI_HEAVY_PLANNER_PROVIDER_ID,
  type OpenAiHeavyPlannerTransport
} from "@jarvis-k/inference-adapter-openai-planner";
import { createCoreHostOpenAiHeavyPlannerComposition } from "../src/openai-heavy-planner-composition";

function allGateOptions(
  transport: OpenAiHeavyPlannerTransport = fixedTransport()
) {
  return {
    enabled: true,
    providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
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

describe("Core Host OpenAI Heavy Planner composition", () => {
  it("fails closed and does not construct a provider when any required gate is missing", () => {
    const gateCases = [
      {
        name: "disabled",
        options: { ...allGateOptions(), enabled: false },
        reasonCode: "OPENAI_HEAVY_PLANNER_DISABLED"
      },
      {
        name: "provider not approved",
        options: { ...allGateOptions(), providerId: "heavy-planner.glm" },
        reasonCode: "OPENAI_HEAVY_PLANNER_PROVIDER_NOT_APPROVED"
      },
      {
        name: "secure store unavailable",
        options: {
          ...allGateOptions(),
          secureCredentialStoreAvailable: false
        },
        reasonCode: "OPENAI_HEAVY_PLANNER_SECURE_STORE_UNAVAILABLE"
      },
      {
        name: "credential missing",
        options: omitCredential(allGateOptions()),
        reasonCode: "OPENAI_HEAVY_PLANNER_CREDENTIAL_MISSING"
      },
      {
        name: "credential exposed",
        options: { ...allGateOptions(), credentialExposed: true },
        reasonCode: "OPENAI_HEAVY_PLANNER_CREDENTIAL_EXPOSED"
      },
      {
        name: "network window not approved",
        options: { ...allGateOptions(), networkWindowApproved: false },
        reasonCode: "OPENAI_HEAVY_PLANNER_NETWORK_WINDOW_NOT_APPROVED"
      },
      {
        name: "contract not ready",
        options: { ...allGateOptions(), contractReady: false },
        reasonCode: "OPENAI_HEAVY_PLANNER_CONTRACT_NOT_READY"
      },
      {
        name: "parser not ready",
        options: { ...allGateOptions(), parserReady: false },
        reasonCode: "OPENAI_HEAVY_PLANNER_PARSER_NOT_READY"
      },
      {
        name: "bounds not ready",
        options: {
          ...allGateOptions(),
          timeoutAndOutputBoundsReady: false
        },
        reasonCode: "OPENAI_HEAVY_PLANNER_BOUNDS_NOT_READY"
      },
      {
        name: "fallback not preserved",
        options: {
          ...allGateOptions(),
          qwenRulesFallbackPreserved: false
        },
        reasonCode: "OPENAI_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED"
      },
      {
        name: "executor-only not preserved",
        options: {
          ...allGateOptions(),
          executorOnlySideEffectsPreserved: false
        },
        reasonCode: "OPENAI_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED"
      }
    ] as const;

    for (const item of gateCases) {
      const composition = createCoreHostOpenAiHeavyPlannerComposition(
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
        defaultBehaviorChanged: false,
        uiIpcBehaviorChanged: false,
        telemetryChanged: false,
        releaseBehaviorChanged: false
      });
    }
  });

  it("constructs a provider only when all gates are satisfied", async () => {
    const transport = fixedTransport();
    const composition = createCoreHostOpenAiHeavyPlannerComposition(
      allGateOptions(transport)
    );

    expect(composition.provider).toBeDefined();
    expect(composition.compositionReport).toMatchObject({
      status: "available",
      reasonCodes: ["OPENAI_HEAVY_PLANNER_AVAILABLE"],
      credentialExposed: false,
      networkAccessed: false
    });

    const result = await composition.provider?.plan({
      providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
      utterance: "Plan a safe review workflow",
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
    });

    expect(result?.status).toBe("planned");
    expect(result?.plan?.requiresConfirmation).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/test-key|Bearer/iu);
  });
});

function fixedTransport(): OpenAiHeavyPlannerTransport {
  return {
    async send() {
      return {
        status: 200,
        body: {
          output_text: JSON.stringify({
            providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
            status: "planned",
            reasonCode: "COMPLEX_REQUEST",
            failureClass: "none",
            plan: {
              summary: "Mocked bounded plan.",
              risk: "medium",
              requiresConfirmation: true,
              steps: [
                {
                  id: "step-1",
                  toolId: "memory.search",
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
          })
        }
      };
    }
  };
}

function omitCredential(
  options: ReturnType<typeof allGateOptions>
): Omit<ReturnType<typeof allGateOptions>, "credential"> {
  const { credential: _credential, ...rest } = options;
  return rest;
}
