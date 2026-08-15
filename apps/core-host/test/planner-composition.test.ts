import { describe, expect, it } from "vitest";
import { loadRuntimeConfig } from "../src/config/runtime-config";
import {
  createCoreHostPlannerComposition,
  parseHeavyPlannerProviderConfigurationMessage,
} from "../src/composition/planner-composition";

describe("Core Host planner composition", () => {
  it("keeps deterministic planner fallback when heavy planner is off", () => {
    const composition = createCoreHostPlannerComposition(loadRuntimeConfig({}));

    expect(composition.activeHeavyPlanner).toBeUndefined();
    expect(composition.configurableHeavyPlannerProvider).toBeUndefined();
    expect(composition.brainPlannerOptions).toEqual({
      enabled: true,
      providerId: "planner.deterministic.rules",
      escalateIntents: [],
    });
  });

  it("selects exactly one configured heavy planner provider", () => {
    const openAi = createCoreHostPlannerComposition(
      loadRuntimeConfig({
        JARVIS_K_ENABLE_HEAVY_PLANNER_OPENAI: "1",
        JARVIS_K_HEAVY_PLANNER_OPENAI_ONE_WINDOW_APPROVED: "1",
      }),
    );
    const glm = createCoreHostPlannerComposition(
      loadRuntimeConfig({
        JARVIS_K_ENABLE_HEAVY_PLANNER_GLM: "1",
      }),
    );

    expect(openAi.activeHeavyPlanner).toMatchObject({
      provider: "openai",
      providerId: "heavy-planner.openai",
      networkWindowApproved: true,
    });
    expect(openAi.brainPlannerOptions).toMatchObject({
      enabled: true,
      providerId: "heavy-planner.openai",
    });
    expect(glm.activeHeavyPlanner).toMatchObject({
      provider: "glm",
      providerId: "heavy-planner.glm",
      networkWindowApproved: false,
    });
  });

  it("returns an unavailable result until credentials configure a provider", async () => {
    const composition = createCoreHostPlannerComposition(
      loadRuntimeConfig({ JARVIS_K_ENABLE_HEAVY_PLANNER_OPENAI: "1" }),
    );

    await expect(
      composition.configurableHeavyPlannerProvider?.plan({
        utterance: "Plan a bounded task.",
        locale: "en",
        now: "2026-08-15T00:00:00.000Z",
        context: {},
      }),
    ).resolves.toMatchObject({
      status: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      directActionAttempted: false,
    });
  });

  it("parses bounded provider configuration messages", () => {
    expect(
      parseHeavyPlannerProviderConfigurationMessage({
        kind: "heavy-planner-provider.configure",
        configuration: {
          provider: "glm",
          credentials: {
            apiKey: " not-a-real-key ",
          },
        },
      }),
    ).toEqual({
      provider: "glm",
      credentials: {
        apiKey: "not-a-real-key",
      },
    });
  });

  it("rejects unsupported providers and short credentials", () => {
    expect(
      parseHeavyPlannerProviderConfigurationMessage({
        kind: "heavy-planner-provider.configure",
        configuration: {
          provider: "other",
          credentials: {
            apiKey: "not-a-real-key",
          },
        },
      }),
    ).toBeNull();
    expect(
      parseHeavyPlannerProviderConfigurationMessage({
        kind: "heavy-planner-provider.configure",
        configuration: {
          provider: "openai",
          credentials: {
            ["apiKey"]: "short",
          },
        },
      }),
    ).toBeNull();
  });
});
