import { describe, expect, it } from "vitest";
import type { OpenAiCompatibleHeavyPlannerFixtureTransport } from "@jarvis-k/inference-adapter-openai-planner";
import { createCoreHostOpenAiCompatibleHeavyPlannerComposition } from "../src/openai-compatible-heavy-planner-composition";

function allGateOptions(
  fixtureTransport: OpenAiCompatibleHeavyPlannerFixtureTransport =
    fixedTransport()
) {
  return {
    enabled: true,
    profileId: "deepseek.v4-flash" as const,
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

describe("Core Host OpenAI-compatible Heavy Planner fixture composition", () => {
  it("selects fixed default-off OpenAI-compatible fixture profiles", () => {
    const cases = [
      {
        profileId: "openai.gpt-4.1-mini",
        provider: "heavy-planner.openai-compatible.openai",
        family: "openai",
        selectedModelId: "gpt-4.1-mini"
      },
      {
        profileId: "deepseek.v4-flash",
        provider: "heavy-planner.openai-compatible.deepseek",
        family: "deepseek",
        selectedModelId: "deepseek-v4-flash"
      },
      {
        profileId: "qwen.flash",
        provider: "heavy-planner.openai-compatible.qwen",
        family: "qwen",
        selectedModelId: "qwen-flash"
      },
      {
        profileId: "glm.4.7-flash",
        provider: "heavy-planner.openai-compatible.glm",
        family: "glm",
        selectedModelId: "glm-4.7-flash"
      }
    ] as const;

    for (const item of cases) {
      const composition = createCoreHostOpenAiCompatibleHeavyPlannerComposition({
        ...allGateOptions(),
        profileId: item.profileId
      });

      expect(composition.provider, item.profileId).toBeDefined();
      expect(composition.compositionReport).toMatchObject({
        provider: item.provider,
        profileId: item.profileId,
        family: item.family,
        selectedModelId: item.selectedModelId,
        status: "available",
        reasonCodes: ["OPENAI_COMPATIBLE_HEAVY_PLANNER_FIXTURE_AVAILABLE"],
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
      expect(composition.compositionReport.gates).toMatchObject({
        profileDefaultOff: true,
        exactRuntimeApprovalRequired: true,
        networkAccessDisabled: true,
        realCredentialAccessDisabled: true,
        qwenRulesFallbackPreserved: true,
        executorOnlySideEffectsPreserved: true
      });
    }
  });

  it("fails closed and does not construct a provider when any fixture-only gate is missing", () => {
    const gateCases = [
      {
        name: "disabled",
        options: { ...allGateOptions(), enabled: false },
        reasonCode: "OPENAI_COMPATIBLE_HEAVY_PLANNER_FIXTURE_DISABLED"
      },
      {
        name: "fixture transport missing",
        options: omitFixtureTransport(allGateOptions()),
        reasonCode:
          "OPENAI_COMPATIBLE_HEAVY_PLANNER_FIXTURE_TRANSPORT_MISSING"
      },
      {
        name: "network access not disabled",
        options: { ...allGateOptions(), networkAccessDisabled: false },
        reasonCode:
          "OPENAI_COMPATIBLE_HEAVY_PLANNER_NETWORK_ACCESS_NOT_DISABLED"
      },
      {
        name: "real credential access not disabled",
        options: {
          ...allGateOptions(),
          realCredentialAccessDisabled: false
        },
        reasonCode:
          "OPENAI_COMPATIBLE_HEAVY_PLANNER_REAL_CREDENTIAL_ACCESS_NOT_DISABLED"
      },
      {
        name: "contract not ready",
        options: { ...allGateOptions(), contractReady: false },
        reasonCode: "OPENAI_COMPATIBLE_HEAVY_PLANNER_CONTRACT_NOT_READY"
      },
      {
        name: "parser not ready",
        options: { ...allGateOptions(), parserReady: false },
        reasonCode: "OPENAI_COMPATIBLE_HEAVY_PLANNER_PARSER_NOT_READY"
      },
      {
        name: "bounds not ready",
        options: {
          ...allGateOptions(),
          timeoutAndOutputBoundsReady: false
        },
        reasonCode: "OPENAI_COMPATIBLE_HEAVY_PLANNER_BOUNDS_NOT_READY"
      },
      {
        name: "fallback not preserved",
        options: {
          ...allGateOptions(),
          qwenRulesFallbackPreserved: false
        },
        reasonCode: "OPENAI_COMPATIBLE_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED"
      },
      {
        name: "executor-only not preserved",
        options: {
          ...allGateOptions(),
          executorOnlySideEffectsPreserved: false
        },
        reasonCode:
          "OPENAI_COMPATIBLE_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED"
      }
    ] as const;

    for (const item of gateCases) {
      const composition = createCoreHostOpenAiCompatibleHeavyPlannerComposition(
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
    const composition = createCoreHostOpenAiCompatibleHeavyPlannerComposition(
      allGateOptions(transport)
    );

    expect(composition.provider).toBeDefined();
    const result = await composition.provider?.plan(fixedPlannerRequest());

    expect(result).toMatchObject({
      providerId: "heavy-planner.openai-compatible.deepseek",
      status: "planned",
      directActionAttempted: false
    });
    expect(transport.lastRequest).toMatchObject({
      providerId: "heavy-planner.openai-compatible.deepseek",
      profileId: "deepseek.v4-flash",
      modelId: "deepseek-v4-flash"
    });
    expect(JSON.stringify(transport.lastRequest)).not.toMatch(
      /(?:Bearer\s+[A-Za-z0-9._-]+|"?(?:api[_-]?key|access[_-]?token|secret|private provider body)"?\s*[:=])/iu
    );
    expect(transport.lastRequest?.body).not.toHaveProperty("tools");
    expect(transport.lastRequest?.body).not.toHaveProperty("tool_choice");
  });

  it("returns sanitized unavailable results from fixture provider failures", async () => {
    const composition = createCoreHostOpenAiCompatibleHeavyPlannerComposition(
      allGateOptions(fixedTransport({ error: { message: "private body" } }, 429))
    );

    const result = await composition.provider?.plan(fixedPlannerRequest());

    expect(result).toMatchObject({
      status: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      failureClass: "PROVIDER_UNAVAILABLE",
      directActionAttempted: false
    });
    expect(JSON.stringify(result)).not.toMatch(
      /(?:private body|Bearer\s+[A-Za-z0-9._-]+|"?(?:api[_-]?key|access[_-]?token|secret)"?\s*[:=])/iu
    );
  });
});

function fixedPlannerRequest() {
  return {
    providerId: "heavy-planner.openai-compatible.deepseek",
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
            providerId: "heavy-planner.openai-compatible.deepseek",
            status: "planned",
            reasonCode: "COMPLEX_REQUEST",
            failureClass: "none",
            plan: {
              summary: "Fixture-only bounded compatible plan.",
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

function omitFixtureTransport(
  options: ReturnType<typeof allGateOptions>
): Omit<ReturnType<typeof allGateOptions>, "fixtureTransport"> {
  const { fixtureTransport: _fixtureTransport, ...rest } = options;
  return rest;
}
