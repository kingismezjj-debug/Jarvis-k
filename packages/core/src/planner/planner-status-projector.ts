import {
  BrainIntent,
  BrainPlannerResult,
  BrainPlanStep,
  BrainRouterDecision,
  createId,
} from "@jarvis-k/contracts";
import type { TaskRepository } from "../task-runtime";
import { DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID } from "./deterministic-planner-service";
import type { ProviderPlannerOutcome } from "./provider-planner-service";

export interface PlannerStatusProjectorOptions {
  repository: TaskRepository | undefined;
  now: () => Date;
}

export interface PlannerStatusProjectionInput {
  planning: ProviderPlannerOutcome;
  basePlan: BrainPlanStep[];
  source: "text" | "voice";
  decision: BrainRouterDecision;
  onDraftPersisted?: () => Promise<void>;
}

export interface PlannerStatusProjection {
  dispatchStatus: "needs_approval" | "blocked";
  plan: BrainPlanStep[];
  summary: string;
}

export class PlannerStatusProjector {
  public constructor(private readonly options: PlannerStatusProjectorOptions) {}

  public async project(
    input: PlannerStatusProjectionInput,
  ): Promise<PlannerStatusProjection | undefined> {
    const result = input.planning.result;
    if (input.planning.selection.status === "planned" && result?.plan) {
      await this.persistDraftTask({
        source: input.source,
        intent: input.decision.intent,
        plannerResult: result,
      });
      await input.onDraftPersisted?.();
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

  private async persistDraftTask(input: {
    source: "text" | "voice";
    intent: BrainIntent;
    plannerResult: BrainPlannerResult;
  }): Promise<void> {
    const repository = this.options.repository;
    const plan = input.plannerResult.plan;
    if (!repository || !plan) {
      return;
    }
    const taskId = createId("task");
    const createdAt = this.options.now().toISOString();
    await repository.createTask({
      id: taskId,
      title: "Review Minimal Plan",
      state: "planning",
      createdAt,
      updatedAt: createdAt,
      source: input.source,
      intent: input.intent,
      routeSource: "intent-router.deterministic.rules",
    });
    await repository.createEvent({
      id: createId("task-event"),
      taskId,
      type: "created",
      message: "Task created from Minimal Planner draft route.",
      createdAt,
    });
    for (const [index, step] of plan.steps.slice(0, 6).entries()) {
      await repository.createStep({
        id: createId("step"),
        taskId,
        title: `${index + 1}. ${step.title} [${step.toolId}]`,
        state: "pending",
        verificationStatus: "not_applicable",
        toolId: step.toolId,
        toolInput: step.args,
      });
    }
    const waitingAt = this.options.now().toISOString();
    await repository.updateTask({
      id: taskId,
      state: "awaiting_confirmation",
      updatedAt: waitingAt,
      verificationSummary: `Minimal Planner (${input.plannerResult.providerId}) saved a bounded plan draft; no tool execution was attempted.`,
    });
    await repository.createEvent({
      id: createId("task-event"),
      taskId,
      type: "state_changed",
      message: `Planner draft from ${input.plannerResult.providerId} is awaiting explicit user confirmation before any step can run.`,
      createdAt: waitingAt,
    });
  }

  private blockFinalPlan(plan: BrainPlanStep[]): BrainPlanStep[] {
    return plan.map((step) =>
      step.id === "dispatch" ? { ...step, status: "blocked" } : step,
    );
  }
}
