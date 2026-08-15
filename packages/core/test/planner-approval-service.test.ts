import { describe, expect, it } from "vitest";
import type {
  Task,
  TaskEvent,
  TaskEventType,
  TaskState,
  TaskStep,
  TaskStepState,
  TaskStepVerificationStatus,
} from "@jarvis-k/contracts";
import { PlannerApprovalService } from "../src/planner/planner-approval-service";
import { createPlannerDraftDigestFromTask } from "../src/planner/planner-draft-service";
import type {
  TaskCreateInput,
  TaskEventCreateInput,
  TaskRepository,
  TaskStepCreateInput,
} from "../src/task-runtime";

class InMemoryTaskRepository implements TaskRepository {
  public readonly tasks = new Map<string, Task>();
  public readonly events: TaskEvent[] = [];
  public failNextUpdateStep = false;

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
    const existing = this.requireTask(input.id);
    const updated: Task = { ...existing, ...input };
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
    completedAt?: string;
    resultSummary?: string;
    failureReason?: string;
  }): Promise<TaskStep> {
    if (this.failNextUpdateStep) {
      this.failNextUpdateStep = false;
      throw new Error("repository update failed");
    }
    const task = this.requireTask(input.taskId);
    const index = task.steps.findIndex((step) => step.id === input.id);
    if (index < 0) {
      throw new Error("step not found");
    }
    const updated: TaskStep = { ...task.steps[index], ...input };
    task.steps[index] = updated;
    return updated;
  }

  public async createEvent(input: TaskEventCreateInput): Promise<TaskEvent> {
    const task = this.requireTask(input.taskId);
    const event: TaskEvent = { ...input };
    task.events.push(event);
    this.events.push(event);
    return event;
  }

  public async listTasks(): Promise<Task[]> {
    return [...this.tasks.values()].map((task) => ({
      ...task,
      steps: [...task.steps],
      events: [...task.events],
    }));
  }

  public eventTypes(): TaskEventType[] {
    return this.events.map((event) => event.type);
  }

  private requireTask(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error("task not found");
    }
    return task;
  }
}

function createService(repository = new InMemoryTaskRepository()) {
  return {
    repository,
    service: new PlannerApprovalService({
      repository,
      now: () => new Date("2026-08-14T00:00:00.000Z"),
    }),
  };
}

async function createDraft(
  repository: InMemoryTaskRepository,
  input: { state?: TaskState; stepCount?: number } = {},
): Promise<Task> {
  const task = await repository.createTask({
    id: "task-planner-draft",
    title: "Review Minimal Plan",
    state: input.state ?? "awaiting_confirmation",
    createdAt: "2026-08-14T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
    source: "text",
    intent: "chat.answer",
    routeSource: "intent-router.deterministic.rules",
  });
  for (let index = 0; index < (input.stepCount ?? 2); index += 1) {
    await repository.createStep({
      id: `step-${index + 1}`,
      taskId: task.id,
      title: `${index + 1}. Step ${index + 1} [memory.status]`,
      state: "pending",
      verificationStatus: "not_applicable",
      toolId: "memory.status",
      toolInput: {},
    });
  }
  const [created] = await repository.listTasks();
  const draft = created ?? task;
  const digest = createPlannerDraftDigestFromTask(draft);
  return repository.updateTask({
    id: draft.id,
    state: draft.state,
    updatedAt: draft.updatedAt,
    verificationSummary: `Planner draft v1/${digest} saved from planner.provider.fixture; approval required; no tool execution was attempted.`,
  });
}

describe("PlannerApprovalService", () => {
  it("cancels awaiting-confirmation drafts and keeps verified steps verified", async () => {
    const { repository, service } = createService();
    await createDraft(repository);
    await repository.updateStep({
      id: "step-1",
      taskId: "task-planner-draft",
      state: "running",
      verificationStatus: "verified",
    });

    const result = await service.cancel({
      taskId: "task-planner-draft",
      reason: "User cancelled.",
    });

    expect(result.ok).toBe(true);
    const [task] = await repository.listTasks();
    expect(task?.state).toBe("cancelled");
    expect(task?.verificationSummary).toBe("User cancelled.");
    expect(task?.steps.map((step) => step.state)).toEqual([
      "cancelled",
      "cancelled",
    ]);
    expect(task?.steps.map((step) => step.verificationStatus)).toEqual([
      "verified",
      "not_applicable",
    ]);
    expect(repository.eventTypes()).toEqual(["cancelled"]);
  });

  it("rejects non-awaiting-confirmation approvals", async () => {
    const { repository, service } = createService();
    await createDraft(repository, { state: "queued" });

    const result = await service.approve({
      taskId: "task-planner-draft",
      executeStep: async () => {
        throw new Error("must not execute");
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: "TASK_APPROVAL_NOT_ALLOWED",
      retryable: false,
    });
  });

  it("rejects cancelled planner drafts before execution", async () => {
    const { repository, service } = createService();
    await createDraft(repository, { state: "cancelled" });

    const result = await service.approve({
      taskId: "task-planner-draft",
      executeStep: async () => {
        throw new Error("must not execute");
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: "TASK_APPROVAL_NOT_ALLOWED",
      retryable: false,
    });
  });

  it("rejects empty planner drafts before execution", async () => {
    const { repository, service } = createService();
    await createDraft(repository, { stepCount: 0 });

    const result = await service.approve({
      taskId: "task-planner-draft",
      executeStep: async () => {
        throw new Error("must not execute");
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: "TASK_APPROVAL_EMPTY_PLAN",
      retryable: false,
    });
  });

  it("runs approved steps in order and records verification events", async () => {
    const { repository, service } = createService();
    await createDraft(repository);
    const toolIds: Array<string | undefined> = [];
    let progressCalls = 0;

    const result = await service.approve({
      taskId: "task-planner-draft",
      executeStep: async (_step, toolId) => {
        toolIds.push(toolId);
        return {
          ok: true,
          verificationStatus: "verified",
          summary: `Verified ${toolId}.`,
        };
      },
      onProgress: async () => {
        progressCalls += 1;
      },
    });

    expect(result).toMatchObject({
      ok: true,
      approved: true,
      executedStepCount: 2,
      failedStepCount: 0,
    });
    expect(toolIds).toEqual(["memory.status", "memory.status"]);
    expect(progressCalls).toBe(4);
    const [task] = await repository.listTasks();
    expect(task?.state).toBe("completed");
    expect(task?.steps.every((step) => step.state === "completed")).toBe(true);
    expect(repository.eventTypes()).toEqual([
      "state_changed",
      "step_started",
      "verification_completed",
      "step_started",
      "verification_completed",
      "verification_completed",
    ]);
  });

  it("fails closed when the persisted plan digest no longer matches steps", async () => {
    const { repository, service } = createService();
    await createDraft(repository);
    const task = repository.tasks.get("task-planner-draft");
    if (!task?.steps[0]) {
      throw new Error("expected draft step");
    }
    task.steps[0] = {
      ...task.steps[0],
      title: "1. Tampered step [memory.status]",
    };
    let calls = 0;

    const result = await service.approve({
      taskId: "task-planner-draft",
      executeStep: async () => {
        calls += 1;
        throw new Error("must not execute");
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: "TASK_APPROVAL_DIGEST_MISMATCH",
      retryable: false,
    });
    expect(calls).toBe(0);
  });

  it("fails closed and cancels remaining steps after the first failed step", async () => {
    const { repository, service } = createService();
    await createDraft(repository, { stepCount: 3 });
    let calls = 0;

    const result = await service.approve({
      taskId: "task-planner-draft",
      executeStep: async () => {
        calls += 1;
        return {
          ok: false,
          verificationStatus: "verification_failed",
          summary: "Step failed closed.",
          failureReason: "STEP_FAILED",
        };
      },
    });

    expect(result).toMatchObject({
      ok: true,
      approved: true,
      executedStepCount: 0,
      failedStepCount: 1,
    });
    expect(calls).toBe(1);
    const [task] = await repository.listTasks();
    expect(task?.state).toBe("failed");
    expect(task?.steps.map((step) => step.state)).toEqual([
      "failed",
      "cancelled",
      "cancelled",
    ]);
    expect(task?.steps[0]?.failureReason).toBe("STEP_FAILED");
  });

  it("does not report success when repository writes fail", async () => {
    const { repository, service } = createService();
    await createDraft(repository);
    repository.failNextUpdateStep = true;

    await expect(
      service.approve({
        taskId: "task-planner-draft",
        executeStep: async () => ({
          ok: true,
          verificationStatus: "verified",
          summary: "Verified.",
        }),
      }),
    ).rejects.toThrow("repository update failed");
  });
});
