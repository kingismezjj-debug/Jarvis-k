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
import {
  TaskLifecycleService,
  TaskLifecycleTransitionError,
} from "../src/task-lifecycle-service";
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
    const task: Task = { ...input, routeSource: input.routeSource ?? "unknown", steps: [], events: [] };
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

function createService(repository = new InMemoryTaskRepository()): {
  repository: InMemoryTaskRepository;
  service: TaskLifecycleService;
} {
  return {
    repository,
    service: new TaskLifecycleService({
      repository,
      now: () => new Date("2026-08-14T00:00:00.000Z"),
    }),
  };
}

async function createQueued(service: TaskLifecycleService) {
  return service.createQueuedTask({
    title: "Open Notepad",
    source: "text",
    intent: "localApp.open",
    routeSource: "intent-router.deterministic.rules",
    stepTitle: "Launch Notepad",
    createdMessage: "created",
  });
}

describe("TaskLifecycleService", () => {
  it("creates queued tasks with one pending step and created event", async () => {
    const { repository, service } = createService();
    const created = await createQueued(service);
    const [task] = await repository.listTasks();

    expect(task.id).toBe(created.taskId);
    expect(task.state).toBe("queued");
    expect(task.steps).toHaveLength(1);
    expect(task.steps[0].id).toBe(created.stepId);
    expect(task.steps[0].state).toBe("pending");
    expect(repository.eventTypes()).toEqual(["created"]);
  });

  it("transitions queued to running to succeeded", async () => {
    const { repository, service } = createService();
    const ids = await createQueued(service);

    await service.markRunning({ ...ids, message: "running" });
    const result = await service.completeVerification({
      ...ids,
      verificationStatus: "verified",
      resultSummary: "verified",
    });

    const [task] = await repository.listTasks();
    expect(result).toEqual({ verified: true, projection: "verified" });
    expect(task.state).toBe("completed");
    expect(task.steps[0].state).toBe("completed");
    expect(repository.eventTypes()).toEqual([
      "created",
      "step_started",
      "verification_completed",
    ]);
  });

  it("transitions queued to running to failed", async () => {
    const { repository, service } = createService();
    const ids = await createQueued(service);

    await service.markRunning({ ...ids, message: "running" });
    const result = await service.completeVerification({
      ...ids,
      verificationStatus: "unverified",
      resultSummary: "not verified",
      failureReason: "WINDOW_NOT_FOUND",
    });

    const [task] = await repository.listTasks();
    expect(result).toEqual({ verified: false, projection: "executed" });
    expect(task.state).toBe("failed");
    expect(task.steps[0].failureReason).toBe("WINDOW_NOT_FOUND");
    expect(repository.eventTypes()).toEqual([
      "created",
      "step_started",
      "verification_failed",
    ]);
  });

  it("transitions running to interrupted", async () => {
    const { repository, service } = createService();
    const ids = await createQueued(service);

    await service.markRunning({ ...ids, message: "running" });
    await service.interruptRunning({ ...ids, reason: "interrupted" });

    const [task] = await repository.listTasks();
    expect(task.state).toBe("interrupted");
    expect(task.steps[0].verificationStatus).toBe("verification_failed");
    expect(repository.eventTypes()).toEqual([
      "created",
      "step_started",
      "interrupted",
    ]);
  });

  it("records verification failure when execution did not verify", async () => {
    const { repository, service } = createService();
    const ids = await createQueued(service);

    await service.markRunning({ ...ids, message: "running" });
    const result = await service.completeVerification({
      ...ids,
      verificationStatus: "verification_failed",
      resultSummary: "verification failed",
      failureReason: "VERIFICATION_FAILED",
    });

    const [task] = await repository.listTasks();
    expect(result.projection).toBe("verification_failed");
    expect(task.state).toBe("failed");
    expect(task.steps[0].verificationStatus).toBe("verification_failed");
  });

  it("fails closed when repository writes fail", async () => {
    const { repository, service } = createService();
    const ids = await createQueued(service);

    await service.markRunning({ ...ids, message: "running" });
    repository.failNextUpdateStep = true;

    await expect(
      service.completeVerification({
        ...ids,
        verificationStatus: "verified",
        resultSummary: "verified",
      }),
    ).rejects.toThrow("repository update failed");
    expect(repository.eventTypes()).toEqual(["created", "step_started"]);
  });

  it("rejects illegal status transitions", async () => {
    const { service } = createService();
    const ids = await createQueued(service);

    await expect(
      service.completeVerification({
        ...ids,
        verificationStatus: "verified",
        resultSummary: "verified",
      }),
    ).rejects.toBeInstanceOf(TaskLifecycleTransitionError);
  });

  it("keeps task events in lifecycle order", async () => {
    const { repository, service } = createService();
    const ids = await createQueued(service);

    await service.markRunning({ ...ids, message: "running" });
    await service.completeVerification({
      ...ids,
      verificationStatus: "verified",
      resultSummary: "verified",
    });

    expect(repository.eventTypes()).toEqual([
      "created",
      "step_started",
      "verification_completed",
    ]);
  });

  it("treats duplicate completion as idempotent", async () => {
    const { repository, service } = createService();
    const ids = await createQueued(service);

    await service.markRunning({ ...ids, message: "running" });
    await service.completeVerification({
      ...ids,
      verificationStatus: "verified",
      resultSummary: "verified",
    });
    await service.completeVerification({
      ...ids,
      verificationStatus: "verified",
      resultSummary: "verified",
    });

    expect(repository.eventTypes()).toEqual([
      "created",
      "step_started",
      "verification_completed",
    ]);
  });

  it("projects simulated results without executed or verified semantics", async () => {
    const { repository, service } = createService();
    const ids = await createQueued(service);

    await service.markRunning({ ...ids, message: "running" });
    const result = await service.completeVerification({
      ...ids,
      verificationStatus: "not_applicable",
      resultSummary: "simulated only",
      failureReason: "SIMULATED_ONLY",
    });

    const [task] = await repository.listTasks();
    expect(result).toEqual({ verified: false, projection: "simulated" });
    expect(task.state).toBe("failed");
    expect(task.steps[0].verificationStatus).toBe("not_applicable");
  });

  it("blocks before executor without verification failure semantics", async () => {
    const { repository, service } = createService();
    const ids = await createQueued(service);

    await service.markRunning({ ...ids, message: "running" });
    const result = await service.blockBeforeExecutor({
      ...ids,
      resultSummary: "Blocked before executor.",
      failureReason: "BRAIN_OPEN_ACTIONS_DISABLED:localApp.open",
    });

    const [task] = await repository.listTasks();
    expect(result).toEqual({ verified: false, projection: "simulated" });
    expect(task.state).toBe("failed");
    expect(task.steps[0]).toMatchObject({
      state: "blocked",
      verificationStatus: "not_applicable",
      failureReason: "BRAIN_OPEN_ACTIONS_DISABLED:localApp.open",
    });
    expect(task.steps[0].verificationStatus).not.toBe("verification_failed");
    expect(repository.eventTypes()).toEqual([
      "created",
      "step_started",
      "failed",
    ]);
    expect(repository.events.at(-1)?.message).toContain(
      "blocked_before_executor",
    );
  });
});
