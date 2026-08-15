import {
  BrainIntent,
  Task,
  TaskStepVerificationStatus,
  createId,
} from "@jarvis-k/contracts";
import type { TaskRepository } from "./task-runtime";

export interface TaskDispatchServiceOptions {
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

export interface CreatedTaskDispatch {
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

export class TaskDispatchService {
  private readonly repository: TaskRepository;
  private readonly now: () => Date;

  public constructor(options: TaskDispatchServiceOptions) {
    this.repository = options.repository;
    this.now = options.now;
  }

  public async createQueuedTask(
    input: CreateQueuedTaskInput,
  ): Promise<CreatedTaskDispatch> {
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
  }): Promise<void> {
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
  ): Promise<{ verified: boolean }> {
    const verified = input.verificationStatus === "verified";
    const completedAt = this.now().toISOString();
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
    return { verified };
  }
}
