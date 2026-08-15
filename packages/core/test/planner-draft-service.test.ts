import { describe, expect, it } from "vitest";
import type {
  BrainPlannerResult,
  Task,
  TaskEvent,
  TaskEventType,
  TaskState,
  TaskStep,
  TaskStepState,
  TaskStepVerificationStatus,
} from "@jarvis-k/contracts";
import {
  PLANNER_DRAFT_VERSION,
  PlannerDraftService,
  createPlannerDraftDigestFromTask,
  readPlannerDraftVersionDigest,
} from "../src/planner/planner-draft-service";
import type {
  TaskCreateInput,
  TaskEventCreateInput,
  TaskRepository,
  TaskStepCreateInput,
} from "../src/task-runtime";

class InMemoryTaskRepository implements TaskRepository {
  public readonly tasks = new Map<string, Task>();
  public readonly events: TaskEvent[] = [];
  public readonly operations: string[] = [];
  public failOnCreateStep = false;

  public async initialize(): Promise<void> {}
  public async recoverRunningTasksAsInterrupted(): Promise<void> {}

  public async createTask(input: TaskCreateInput): Promise<Task> {
    this.operations.push("createTask");
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
    this.operations.push(`updateTask:${input.state}`);
    const existing = this.requireTask(input.id);
    const updated: Task = { ...existing, ...input };
    this.tasks.set(input.id, updated);
    return updated;
  }

  public async createStep(input: TaskStepCreateInput): Promise<TaskStep> {
    this.operations.push("createStep");
    if (this.failOnCreateStep) {
      throw new Error("repository create step failed");
    }
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
    this.operations.push(`updateStep:${input.state}`);
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
    this.operations.push(`createEvent:${input.type}`);
    const task = this.requireTask(input.taskId);
    const event: TaskEvent = { ...input };
    task.events.push(event);
    this.events.push(event);
    return event;
  }

  public async listTasks(): Promise<Task[]> {
    this.operations.push("listTasks");
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

function plannerResult(
  overrides: Partial<BrainPlannerResult> = {},
): BrainPlannerResult {
  return {
    providerId: "planner.provider.fixture",
    status: "planned",
    reasonCode: "COMPLEX_REQUEST",
    failureClass: "none",
    plan: {
      summary: "Bounded plan",
      risk: "medium",
      requiresConfirmation: true,
      directActionAttempted: false,
      steps: [
        {
          id: "observe",
          toolId: "observability.status",
          title: "Check status",
          args: {},
          risk: "low",
          requiresConfirmation: true,
          directActionAttempted: false,
        },
        {
          id: "browser",
          toolId: "browser.open",
          title: "Open allowlisted URL",
          args: { target: "api.izytoken.com" },
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

function createService(repository: InMemoryTaskRepository) {
  return new PlannerDraftService({
    repository,
    now: () => new Date("2026-08-14T00:00:00.000Z"),
    allowedToolIds: ["observability.status", "browser.open"],
  });
}

describe("PlannerDraftService", () => {
  it("creates planner draft tasks, steps, and events in repository order", async () => {
    const repository = new InMemoryTaskRepository();
    const result = await createService(repository).createDraft({
      source: "text",
      intent: "chat.answer",
      plannerResult: plannerResult(),
    });

    expect(result).toMatchObject({
      ok: true,
      version: PLANNER_DRAFT_VERSION,
      stepCount: 2,
    });
    expect(repository.operations.filter((item) => item !== "listTasks")).toEqual([
      "createTask",
      "createEvent:created",
      "createStep",
      "createStep",
      "updateTask:awaiting_confirmation",
      "createEvent:state_changed",
    ]);
    const [task] = await repository.listTasks();
    expect(task).toMatchObject({
      state: "awaiting_confirmation",
      verificationSummary: expect.stringContaining(PLANNER_DRAFT_VERSION),
    });
    expect(task?.steps.map((step) => step.verificationStatus)).toEqual([
      "not_applicable",
      "not_applicable",
    ]);
    expect(task?.events.map((event) => event.type)).toEqual([
      "created",
      "state_changed",
    ]);
  });

  it("saves plan version and digest and keeps duplicate drafts idempotent", async () => {
    const repository = new InMemoryTaskRepository();
    const service = createService(repository);

    const first = await service.createDraft({
      source: "voice",
      intent: "chat.answer",
      plannerResult: plannerResult(),
    });
    const second = await service.createDraft({
      source: "voice",
      intent: "chat.answer",
      plannerResult: plannerResult(),
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      throw new Error("expected drafts to be created");
    }
    expect(second.task.id).toBe(first.task.id);
    expect(second.digest).toBe(first.digest);
    expect(readPlannerDraftVersionDigest(first.task)).toEqual({
      version: PLANNER_DRAFT_VERSION,
      digest: createPlannerDraftDigestFromTask(first.task),
    });
    expect([...repository.tasks.values()]).toHaveLength(1);
  });

  it("fails closed when repository writes fail", async () => {
    const repository = new InMemoryTaskRepository();
    repository.failOnCreateStep = true;

    await expect(
      createService(repository).createDraft({
        source: "text",
        intent: "chat.answer",
        plannerResult: plannerResult(),
      }),
    ).resolves.toMatchObject({
      ok: false,
      code: "TASK_REPOSITORY_WRITE_FAILED",
      retryable: true,
    });
  });

  it("fails closed before task creation when a provider tool is not allowlisted", async () => {
    const repository = new InMemoryTaskRepository();

    const result = await createService(repository).createDraft({
      source: "text",
      intent: "chat.answer",
      plannerResult: plannerResult({
        plan: {
          summary: "Unsafe plan",
          risk: "high",
          requiresConfirmation: true,
          directActionAttempted: false,
          steps: [
            {
              id: "shell",
              toolId: "shell.run",
              title: "Run shell",
              args: { command: "whoami" },
              risk: "high",
              requiresConfirmation: true,
              directActionAttempted: false,
            },
          ],
        },
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "PLANNER_DRAFT_TOOL_NOT_ALLOWLISTED",
      retryable: false,
    });
    expect(repository.tasks.size).toBe(0);
  });

  it("does not mark draft steps as executed or verified", async () => {
    const repository = new InMemoryTaskRepository();
    const result = await createService(repository).createDraft({
      source: "text",
      intent: "chat.answer",
      plannerResult: plannerResult(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected draft");
    }
    expect(result.task.state).toBe("awaiting_confirmation");
    expect(result.task.startedAt).toBeUndefined();
    expect(result.task.completedAt).toBeUndefined();
    expect(result.task.steps.every((step) => step.state === "pending")).toBe(
      true,
    );
    expect(
      result.task.steps.every(
        (step) => step.verificationStatus === "not_applicable",
      ),
    ).toBe(true);
  });
});
