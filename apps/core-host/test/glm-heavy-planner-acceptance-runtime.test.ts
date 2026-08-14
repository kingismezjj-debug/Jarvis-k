import { describe, expect, it } from "vitest";
import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  BrainCommandResultSchema,
  createCommandEnvelope
} from "@jarvis-k/contracts";
import { GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID } from "@jarvis-k/inference-adapter-glm-runtime";
import { createGlmHeavyPlannerAcceptanceRuntime } from "../src/glm-heavy-planner-acceptance-runtime";

describe("GLM Heavy Planner acceptance runtime", () => {
  it("places the provider in the heavy-planner slot", async () => {
    let calls = 0;
    const provider: HeavyPlannerProvider = {
      async plan() {
        calls += 1;
        return {
          providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
          status: "planned",
          reasonCode: "COMPLEX_REQUEST",
          failureClass: "none",
          plan: {
            summary: "Fixture-only acceptance plan.",
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
        };
      }
    };
    const runtime = createGlmHeavyPlannerAcceptanceRuntime(provider);

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.runBrainCommand",
        payload: {
          source: "text",
          text: "Plan a safe two-step review of public project notes."
        }
      })
    );
    const brain = BrainCommandResultSchema.parse(
      result.ok ? result.data?.brain : undefined
    );

    expect(calls).toBe(1);
    expect(brain.plannerSelection).toMatchObject({
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      status: "planned",
      usedPlanner: true,
      usedRulesFallback: false,
      directActionAttempted: false
    });
  });
});
