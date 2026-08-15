import { describe, expect, it } from "vitest";
import type {
  BrainPlannerResult,
  BrainRouterDecision,
  BrainRouterSelectionReport,
  Task,
  TaskEvent,
  TaskState,
  TaskStep,
  TaskStepState,
  TaskStepVerificationStatus,
} from "@jarvis-k/contracts";
import { PlannerStatusProjector } from "../src/planner/planner-status-projector";
import type {
  TaskCreateInput,
  TaskEventCreateInput,
  TaskRepository,
  TaskStepCreateInput,
} from "../src/task-runtime";

class InMemoryTaskRepository implements TaskRepository {
  public readonly tasks = new Map<string, Task>();

  public async initialize(): Promise<void> {}
  public async recoverRunningTasksAsInterrupted(): Promise<void> {}

  public async createTask(input: TaskCreateInput): Promise<Task> {
    const task: Task = {
      ...input,
      routeSource: input.routeSource ?? "unknown",
      steps: [],
      events: [],
    };
    this.tasks.set(task.id, task);
    return task;
  }

  public async updateTask(input: {
    id: string;
    state: TaskState;
    updatedAt: string;
    startedAt?: string;
    completedAt?: string;
    verificationSummary?: string;
  }): Promise<Task> {
    const task = this.requireTask(input.id);
    const updated = { ...task, ...input };
    this.tasks.set(input.id, updated);
    return updated;
  }

  public async createStep(input: TaskStepCreateInput): Promise<TaskStep> {
    const task = this.requireTask(input.taskId);
    const step: TaskStep = { ...input };
    task.steps.push(step);
    return step;
  }

  public async updateStep(input: {
    id: string;
    taskId: string;
    state: TaskStepState;
    verificationStatus: TaskStepVerificationStatus;
  }): Promise<TaskStep> {
    const task = this.requireTask(input.taskId);
    const index = task.steps.findIndex((step) => step.id === input.id);
    if (index < 0) {
      throw new Error("step not found");
    }
    const updated = { ...task.steps[index], ...input };
    task.steps[index] = updated;
    return updated;
  }

  public async createEvent(input: TaskEventCreateInput): Promise<TaskEvent> {
    const task = this.requireTask(input.taskId);
    const event: TaskEvent = { ...input };
    task.events.push(event);
    return event;
  }

  public async listTasks(): Promise<Task[]> {
    return [...this.tasks.values()];
  }

  private requireTask(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error("task not found");
    }
    return task;
  }
}

const basePlan = [
  { id: "intake", title: "Receive command", status: "completed" as const },
  { id: "route", title: "Route intent: chat.answer", status: "completed" as const },
  { id: "dispatch", title: "Dispatch bounded capability", status: "pending" as const },
];

const decision: BrainRouterDecision = {
  intent: "chat.answer",
  confidence: 1,
  requiresApproval: false,
  slots: {},
  reason: "Fixture decision.",
};

const selection: BrainRouterSelectionReport = {
  selectedProviderId: "intent-router.deterministic.rules",
  fallbackProviderId: "brain.rules",
  status: "fallback",
  reasonCode: "CONFIDENCE_LOW",
  failureClass: "CONFIDENCE_LOW",
  confidenceBand: "low",
  usedRulesFallback: true,
  directActionAttempted: false,
};

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

describe("PlannerStatusProjector", () => {
  it("projects planned drafts and persists awaiting-confirmation tasks", async () => {
    const repository = new InMemoryTaskRepository();
    let persistedCallbacks = 0;
    const projector = new PlannerStatusProjector({
      repository,
      now: () => new Date("2026-08-14T00:00:00.000Z"),
    });

    const projection = await projector.project({
      planning: {
        selection: {
          providerId: "planner.deterministic.rules",
          status: "planned",
          reasonCode: "COMPLEX_REQUEST",
          failureClass: "none",
          usedPlanner: true,
          usedRulesFallback: false,
          directActionAttempted: false,
        },
        result: plannerResult(),
      },
      basePlan,
      source: "text",
      decision,
      onDraftPersisted: async () => {
        persistedCallbacks += 1;
      },
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
    expect(persistedCallbacks).toBe(1);
    const [task] = await repository.listTasks();
    expect(task).toMatchObject({
      title: "Review Minimal Plan",
      state: "awaiting_confirmation",
      routeSource: "intent-router.deterministic.rules",
    });
    expect(task?.steps).toHaveLength(1);
    expect(task?.events.map((event) => event.type)).toEqual([
      "created",
      "state_changed",
    ]);
  });

  it("projects clarify requests as blocked without persistence", async () => {
    const repository = new InMemoryTaskRepository();
    const projector = new PlannerStatusProjector({
      repository,
      now: () => new Date("2026-08-14T00:00:00.000Z"),
    });

    const projection = await projector.project({
      planning: {
        selection: {
          providerId: "heavy-planner.fixture",
          status: "clarify",
          reasonCode: "CLARIFY_REQUIRED",
          failureClass: "CLARIFY_REQUIRED",
          usedPlanner: true,
          usedRulesFallback: false,
          directActionAttempted: false,
        },
        result: plannerResult({
          status: "clarify",
          reasonCode: "CLARIFY_REQUIRED",
          failureClass: "CLARIFY_REQUIRED",
          clarifyQuestion: "Which project?",
        }),
      },
      basePlan,
      source: "text",
      decision,
    });

    expect(projection).toMatchObject({
      dispatchStatus: "blocked",
      summary: "Which project?",
    });
    expect(projection?.plan.find((step) => step.id === "dispatch")?.status).toBe(
      "blocked",
    );
    expect(await repository.listTasks()).toHaveLength(0);
  });

  it("still returns a needs-approval projection when task storage is unavailable", async () => {
    const projector = new PlannerStatusProjector({
      repository: undefined,
      now: () => new Date("2026-08-14T00:00:00.000Z"),
    });

    const projection = await projector.project({
      planning: {
        selection: {
          providerId: "planner.deterministic.rules",
          status: "planned",
          reasonCode: "COMPLEX_REQUEST",
          failureClass: "none",
          usedPlanner: true,
          usedRulesFallback: false,
          directActionAttempted: false,
        },
        result: plannerResult(),
      },
      basePlan,
      source: "text",
      decision,
    });

    expect(projection?.dispatchStatus).toBe("needs_approval");
  });
});
