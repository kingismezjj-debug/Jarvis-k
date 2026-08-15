import {
  BrainPlannerResult,
  BrainPlanStep,
} from "@jarvis-k/contracts";
import { DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID } from "./deterministic-planner-service";
import type { ProviderPlannerOutcome } from "./provider-planner-service";

export interface PlannerStatusProjectionInput {
  planning: ProviderPlannerOutcome;
  basePlan: BrainPlanStep[];
}

export interface PlannerStatusProjection {
  dispatchStatus: "needs_approval" | "blocked";
  plan: BrainPlanStep[];
  summary: string;
}

export class PlannerStatusProjector {
  public project(
    input: PlannerStatusProjectionInput,
  ): PlannerStatusProjection | undefined {
    const result = input.planning.result;
    if (input.planning.selection.status === "planned" && result?.plan) {
      return {
        dispatchStatus: "needs_approval",
        plan: this.projectSteps(input.basePlan, result.plan.steps),
        summary:
          result.providerId === DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID
            ? "Minimal Planner prepared a bounded plan and saved it to Task Runtime for review. No tool execution was attempted."
            : "Heavy Planner prepared a bounded plan that requires confirmation before any tool execution.",
      };
    }
    if (input.planning.selection.status === "clarify") {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalPlan([
          ...input.basePlan,
          {
            id: "planner",
            title: "Request clarification",
            status: "blocked",
          },
        ]),
        summary:
          result?.clarifyQuestion ??
          "Heavy Planner needs clarification before this can proceed safely.",
      };
    }
    if (input.planning.selection.status === "blocked") {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalPlan([
          ...input.basePlan,
          {
            id: "planner",
            title: "Block unsafe plan",
            status: "blocked",
          },
        ]),
        summary: "Heavy Planner blocked this request before execution.",
      };
    }
    return undefined;
  }

  private projectSteps(
    basePlan: BrainPlanStep[],
    plannedSteps: NonNullable<BrainPlannerResult["plan"]>["steps"],
  ): BrainPlanStep[] {
    const visiblePlannedSteps = plannedSteps.slice(0, 4).map((step, index) => ({
      id: `planned-${index + 1}`,
      title: `${step.title} [${step.toolId}]`,
      status: "pending" as const,
    }));
    return [
      ...basePlan.filter((step) => step.id !== "dispatch"),
      {
        id: "planner",
        title: "Prepare bounded BrainPlan",
        status: "completed",
      },
      ...visiblePlannedSteps,
      {
        id: "confirmation",
        title: "Wait for user confirmation before execution",
        status: "pending",
      },
    ];
  }

  private blockFinalPlan(plan: BrainPlanStep[]): BrainPlanStep[] {
    return plan.map((step) =>
      step.id === "dispatch" ? { ...step, status: "blocked" } : step,
    );
  }
}
