import { describe, expect, it } from "vitest";
import type {
  BrainPlannerResult,
  BrainPlannerSelectionReport,
} from "@jarvis-k/contracts";
import { PlannerStatusProjector } from "../src/planner/planner-status-projector";

const basePlan = [
  { id: "intake", title: "Receive command", status: "completed" as const },
  { id: "route", title: "Route intent: chat.answer", status: "completed" as const },
  { id: "dispatch", title: "Dispatch bounded capability", status: "pending" as const },
];

function plannerResult(overrides: Partial<BrainPlannerResult> = {}): BrainPlannerResult {
  return {
    providerId: "planner.deterministic.rules",
    status: "planned",
    reasonCode: "COMPLEX_REQUEST",
    failureClass: "none",
    plan: {
      summary: "Safe draft",
      risk: "medium",
      requiresConfirmation: true,
      directActionAttempted: false,
      steps: [
        {
          id: "memory",
          toolId: "memory.status",
          title: "Review memory",
          args: {},
          risk: "medium",
          requiresConfirmation: true,
          directActionAttempted: false,
        },
      ],
    },
    directActionAttempted: false,
    plannedAt: "2026-08-14T00:00:00.000Z",
    ...overrides,
  };
}

function selection(
  status: "planned" | "clarify" | "blocked",
): BrainPlannerSelectionReport {
  return {
    providerId: "planner.deterministic.rules",
    status,
    reasonCode:
      status === "clarify"
        ? "CLARIFY_REQUIRED"
        : status === "blocked"
          ? "UNSAFE_PLAN"
          : "COMPLEX_REQUEST",
    failureClass:
      status === "clarify"
        ? "CLARIFY_REQUIRED"
        : status === "blocked"
          ? "UNSAFE_PLAN"
          : "none",
    usedPlanner: true,
    usedRulesFallback: false,
    directActionAttempted: false,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("PlannerStatusProjector", () => {
  it("does not accept repository, lifecycle, clock, or id dependencies", () => {
    expect(PlannerStatusProjector.length).toBe(0);
  });

  it("returns deterministic output for identical planned inputs", () => {
    const projector = new PlannerStatusProjector();
    const input = {
      planning: {
        selection: selection("planned"),
        result: plannerResult(),
      },
      basePlan,
    };

    expect(projector.project(input)).toEqual(projector.project(clone(input)));
  });

  it("does not mutate the input object", () => {
    const projector = new PlannerStatusProjector();
    const input = {
      planning: {
        selection: selection("planned"),
        result: plannerResult(),
      },
      basePlan,
    };
    const before = clone(input);

    projector.project(input);

    expect(input).toEqual(before);
  });

  it("projects planned drafts without persistence side effects", () => {
    const projection = new PlannerStatusProjector().project({
      planning: {
        selection: selection("planned"),
        result: plannerResult(),
      },
      basePlan,
    });

    expect(projection).toMatchObject({
      dispatchStatus: "needs_approval",
      summary:
        "Minimal Planner prepared a bounded plan and saved it to Task Runtime for review. No tool execution was attempted.",
    });
    expect(projection?.plan.map((step) => step.id)).toEqual([
      "intake",
      "route",
      "planner",
      "planned-1",
      "confirmation",
    ]);
  });

  it("projects clarify and blocked outcomes as blocked plans", () => {
    const projector = new PlannerStatusProjector();

    const clarify = projector.project({
      planning: {
        selection: selection("clarify"),
        result: plannerResult({
          status: "clarify",
          reasonCode: "CLARIFY_REQUIRED",
          failureClass: "CLARIFY_REQUIRED",
          clarifyQuestion: "Which project?",
        }),
      },
      basePlan,
    });
    const blocked = projector.project({
      planning: {
        selection: selection("blocked"),
        result: plannerResult({
          status: "blocked",
          reasonCode: "UNSAFE_PLAN",
          failureClass: "UNSAFE_PLAN",
        }),
      },
      basePlan,
    });

    expect(clarify).toMatchObject({
      dispatchStatus: "blocked",
      summary: "Which project?",
    });
    expect(blocked).toMatchObject({
      dispatchStatus: "blocked",
      summary: "Heavy Planner blocked this request before execution.",
    });
    expect(clarify?.plan.find((step) => step.id === "dispatch")?.status).toBe(
      "blocked",
    );
    expect(blocked?.plan.find((step) => step.id === "dispatch")?.status).toBe(
      "blocked",
    );
  });
});
