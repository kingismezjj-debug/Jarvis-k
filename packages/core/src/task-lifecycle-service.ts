import {
  BrainIntent,
  Task,
  TaskState,
  TaskStepVerificationStatus,
  createId,
} from "@jarvis-k/contracts";
import type { TaskRepository } from "./task-runtime";

export interface TaskLifecycleServiceOptions {
  repository: TaskRepository;
  now: () => Date;
}

export interface CreateQueuedTaskInput {
  title: string;
  source: Task["source"];
  intent: BrainIntent;
  routeSource: Task["routeSource"];
  stepTitle: string;
  createdMessage: string;
}

export interface CreatedTaskLifecycle {
  taskId: string;
  stepId: string;
}

export interface CompleteTaskVerificationInput {
  taskId: string;
  stepId: string;
  verificationStatus: TaskStepVerificationStatus;
  resultSummary: string;
  failureReason?: string | undefined;
}

export interface BlockTaskBeforeExecutorInput {
  taskId: string;
  stepId: string;
  resultSummary: string;
  failureReason: string;
}

export type TaskExecutionProjection =
  | "simulated"
  | "executed"
  | "verified"
  | "verification_failed";

export class TaskLifecycleTransitionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "TaskLifecycleTransitionError";
  }
}

const TASK_TRANSITIONS: ReadonlyMap<TaskState, readonly TaskState[]> = new Map([
  ["queued", ["running", "cancelled", "interrupted"]],
  ["planning", ["awaiting_confirmation", "cancelled", "interrupted"]],
  ["awaiting_confirmation", ["running", "cancelled", "interrupted"]],
  ["running", ["completed", "failed", "cancelled", "interrupted"]],
  ["rolling_back", ["rolled_back", "failed", "interrupted"]],
  ["completed", []],
  ["failed", []],
  ["cancelled", []],
  ["interrupted", []],
  ["rolled_back", []],
]);

export class TaskLifecycleService {
  private readonly repository: TaskRepository;
  private readonly now: () => Date;

  public constructor(options: TaskLifecycleServiceOptions) {
    this.repository = options.repository;
    this.now = options.now;
  }

  public async createQueuedTask(
    input: CreateQueuedTaskInput,
  ): Promise<CreatedTaskLifecycle> {
    const taskId = createId("task");
    const stepId = createId("step");
    const createdAt = this.now().toISOString();
    await this.repository.createTask({
      id: taskId,
      title: input.title,
      state: "queued",
      createdAt,
      updatedAt: createdAt,
      source: input.source,
      intent: input.intent,
      routeSource: input.routeSource,
    });
    await this.repository.createStep({
      id: stepId,
      taskId,
      title: input.stepTitle,
      state: "pending",
      verificationStatus: "pending",
    });
    await this.repository.createEvent({
      id: createId("task-event"),
      taskId,
      type: "created",
      message: input.createdMessage,
      createdAt,
    });
    return { taskId, stepId };
  }

  public async markRunning(input: {
    taskId: string;
    stepId: string;
    message: string;
    fromState?: TaskState;
  }): Promise<void> {
    this.assertTransition(input.fromState ?? "queued", "running");
    const runningAt = this.now().toISOString();
    await this.repository.updateTask({
      id: input.taskId,
      state: "running",
      updatedAt: runningAt,
      startedAt: runningAt,
    });
    await this.repository.updateStep({
      id: input.stepId,
      taskId: input.taskId,
      state: "running",
      verificationStatus: "pending",
    });
    await this.repository.createEvent({
      id: createId("task-event"),
      taskId: input.taskId,
      stepId: input.stepId,
      type: "step_started",
      message: input.message,
      createdAt: runningAt,
    });
  }

  public async completeVerification(
    input: CompleteTaskVerificationInput,
  ): Promise<{
    verified: boolean;
    projection: TaskExecutionProjection;
  }> {
    const verified = input.verificationStatus === "verified";
    const desiredState: TaskState = verified ? "completed" : "failed";
    const existingTask = (await this.repository.listTasks()).find(
      (task) => task.id === input.taskId,
    );
    const existingStep = existingTask?.steps.find(
      (step) => step.id === input.stepId,
    );
    if (
      (existingTask?.state === "completed" || existingTask?.state === "failed") &&
      (existingStep?.state === "completed" || existingStep?.state === "failed")
    ) {
      return {
        verified,
        projection: this.projectVerificationStatus(input.verificationStatus),
      };
    }
    this.assertTransition(existingTask?.state ?? "running", desiredState);
    const completedAt = this.now().toISOString();
    const projection = this.projectVerificationStatus(input.verificationStatus);
    await this.repository.updateStep({
      id: input.stepId,
      taskId: input.taskId,
      state: verified ? "completed" : "failed",
      verificationStatus: input.verificationStatus,
      completedAt,
      resultSummary: input.resultSummary,
      ...(verified || input.failureReason === undefined
        ? {}
        : { failureReason: input.failureReason }),
    });
    await this.repository.updateTask({
      id: input.taskId,
      state: verified ? "completed" : "failed",
      updatedAt: completedAt,
      completedAt,
      verificationSummary: input.resultSummary,
    });
    await this.repository.createEvent({
      id: createId("task-event"),
      taskId: input.taskId,
      stepId: input.stepId,
      type: verified ? "verification_completed" : "verification_failed",
      message: input.resultSummary,
      createdAt: completedAt,
    });
    return { verified, projection };
  }

  public async interruptRunning(input: {
    taskId: string;
    stepId: string;
    reason: string;
  }): Promise<void> {
    this.assertTransition("running", "interrupted");
    const interruptedAt = this.now().toISOString();
    await this.repository.updateStep({
      id: input.stepId,
      taskId: input.taskId,
      state: "failed",
      verificationStatus: "verification_failed",
      completedAt: interruptedAt,
      failureReason: input.reason,
    });
    await this.repository.updateTask({
      id: input.taskId,
      state: "interrupted",
      updatedAt: interruptedAt,
      completedAt: interruptedAt,
      verificationSummary: input.reason,
    });
    await this.repository.createEvent({
      id: createId("task-event"),
      taskId: input.taskId,
      stepId: input.stepId,
      type: "interrupted",
      message: input.reason,
      createdAt: interruptedAt,
    });
  }

  public async blockBeforeExecutor(
    input: BlockTaskBeforeExecutorInput,
  ): Promise<{
    verified: false;
    projection: Extract<TaskExecutionProjection, "simulated">;
  }> {
    const existingTask = (await this.repository.listTasks()).find(
      (task) => task.id === input.taskId,
    );
    const existingStep = existingTask?.steps.find(
      (step) => step.id === input.stepId,
    );
    if (
      (existingTask?.state === "completed" || existingTask?.state === "failed") &&
      (existingStep?.state === "blocked" || existingStep?.state === "failed")
    ) {
      return { verified: false, projection: "simulated" };
    }
    this.assertTransition(existingTask?.state ?? "running", "failed");
    const blockedAt = this.now().toISOString();
    await this.repository.updateStep({
      id: input.stepId,
      taskId: input.taskId,
      state: "blocked",
      verificationStatus: "not_applicable",
      completedAt: blockedAt,
      resultSummary: input.resultSummary,
      failureReason: input.failureReason,
    });
    await this.repository.updateTask({
      id: input.taskId,
      state: "failed",
      updatedAt: blockedAt,
      completedAt: blockedAt,
      verificationSummary: input.resultSummary,
    });
    await this.repository.createEvent({
      id: createId("task-event"),
      taskId: input.taskId,
      stepId: input.stepId,
      type: "failed",
      message: `blocked_before_executor: ${input.resultSummary}`,
      createdAt: blockedAt,
    });
    return { verified: false, projection: "simulated" };
  }

  public assertTransition(from: TaskState, to: TaskState): void {
    if (!TASK_TRANSITIONS.get(from)?.includes(to)) {
      throw new TaskLifecycleTransitionError(
        `Illegal task state transition: ${from} -> ${to}.`,
      );
    }
  }

  private projectVerificationStatus(
    status: TaskStepVerificationStatus,
  ): TaskExecutionProjection {
    switch (status) {
      case "verified":
        return "verified";
      case "unverified":
        return "executed";
      case "not_applicable":
        return "simulated";
      case "pending":
      case "verification_failed":
        return "verification_failed";
    }
  }
}
