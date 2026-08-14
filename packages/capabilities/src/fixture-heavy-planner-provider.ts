import {
  BrainPlannerRequestSchema,
  BrainPlannerResultSchema,
  type BrainPlannerRequest,
  type BrainPlannerResult
} from "@jarvis-k/contracts";
import type { HeavyPlannerProvider } from "./ports";

export class FixtureHeavyPlannerProvider implements HeavyPlannerProvider {
  public constructor(
    private readonly providerId = "heavy-planner.fixture"
  ) {}

  public async plan(
    request: BrainPlannerRequest
  ): Promise<BrainPlannerResult> {
    const parsed = BrainPlannerRequestSchema.parse(request);
    const text = parsed.utterance.trim();
    const plannedAt = new Date().toISOString();
    if (text.length < 8 || parsed.routerDecision.intent === "clarify") {
      return BrainPlannerResultSchema.parse({
        providerId: this.providerId,
        status: "clarify",
        reasonCode: "CLARIFY_REQUIRED",
        failureClass: "CLARIFY_REQUIRED",
        clarifyQuestion:
          "Please add the target, desired outcome, and any constraints.",
        directActionAttempted: false,
        plannedAt
      });
    }
    if (parsed.routerDecision.intent === "blocked") {
      return BrainPlannerResultSchema.parse({
        providerId: this.providerId,
        status: "blocked",
        reasonCode: "UNSAFE_PLAN",
        failureClass: "UNSAFE_PLAN",
        directActionAttempted: false,
        plannedAt
      });
    }
    return BrainPlannerResultSchema.parse({
      providerId: this.providerId,
      status: "planned",
      reasonCode:
        parsed.routerSelection?.reasonCode === "CONFIDENCE_LOW"
          ? "FAST_ROUTER_LOW_CONFIDENCE"
          : "COMPLEX_REQUEST",
      failureClass: "none",
      plan: {
        summary: "Fixture-only bounded BrainPlan.",
        risk: "medium",
        requiresConfirmation: true,
        steps: [
          {
            id: "step-1",
            toolId: "chat.answer",
            title: "Prepare a bounded response plan",
            args: {},
            risk: "medium",
            requiresConfirmation: true,
            directActionAttempted: false
          }
        ],
        directActionAttempted: false
      },
      directActionAttempted: false,
      plannedAt
    });
  }
}
