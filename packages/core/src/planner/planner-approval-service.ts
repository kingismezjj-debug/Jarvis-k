import { createId, Task, TaskStep, TaskStepVerificationStatus } from "@jarvis-k/contracts";
import type { TaskRepository } from "../task-runtime";

export interface PlannerStepExecutionResult {
  ok: boolean;
  verificationStatus: TaskStepVerificationStatus;
  summary: string;
  failureReason?: string;
}

export interface PlannerApprovalServiceOptions {
  repository: TaskRepository | undefined;
  now: () => Date;
}

export interface PlannerTaskControlFailure {
  ok: false;
  code: string;
  message: string;
  retryable: boolean;
}

export interface PlannerCancelSuccess {
  ok: true;
  task: Task;
  cancelled: true;
}

export interface PlannerApproveSuccess {
  ok: true;
  task: Task;
  approved: true;
  executedStepCount: number;
  failedStepCount: number;
}

export type PlannerCancelResult =
  | PlannerCancelSuccess
  | PlannerTaskControlFailure;

export type PlannerApproveResult =
  | PlannerApproveSuccess
  | PlannerTaskControlFailure;

export class PlannerApprovalService {
  public constructor(private readonly options: PlannerApprovalServiceOptions) {}

  public async cancel(input: {
    taskId: string;
    reason: string | undefined;
  }): Promise<PlannerCancelResult> {
    const repository = this.options.repository;
    if (!repository) {
      return {
        ok: false,
        code: "TASK_REPOSITORY_UNAVAILABLE",
        message:
          "Task cancellation is unavailable because Task Runtime storage is not configured.",
        retryable: true,
      };
    }
    const task = await this.findTask(repository, input.taskId);
    if (!task) {
      return {
        ok: false,
        code: "TASK_NOT_FOUND",
        message: "The requested task was not found.",
        retryable: false,
      };
    }
    if (
      task.state !== "queued" &&
      task.state !== "planning" &&
      task.state !== "awaiting_confirmation"
    ) {
      return {
        ok: false,
        code: "TASK_CANCEL_NOT_ALLOWED",
        message:
          "Only queued, planning, or awaiting-confirmation tasks can be cancelled by this control.",
        retryable: false,
      };
    }

    const cancelledAt = this.options.now().toISOString();
    for (const step of task.steps) {
      if (step.state !== "pending" && step.state !== "running") {
        continue;
      }
      await repository.updateStep({
        id: step.id,
        taskId: task.id,
        state: "cancelled",
        verificationStatus:
          step.verificationStatus === "verified"
            ? "verified"
            : "not_applicable",
        completedAt: cancelledAt,
        failureReason:
          step.failureReason ??
          "Task was cancelled before this planned step executed.",
      });
    }
    const reason =
      input.reason ?? "User cancelled the pending task before execution.";
    const updated = await repository.updateTask({
      id: task.id,
      state: "cancelled",
      updatedAt: cancelledAt,
      completedAt: cancelledAt,
      verificationSummary: reason,
    });
    await repository.createEvent({
      id: createId("task-event"),
      taskId: task.id,
      type: "cancelled",
      message: reason,
      createdAt: cancelledAt,
    });
    return {
      ok: true,
      task: updated,
      cancelled: true,
    };
  }

  public async approve(input: {
    taskId: string;
    executeStep: (
      step: TaskStep,
      toolId: string | undefined,
    ) => Promise<PlannerStepExecutionResult>;
    onProgress?: () => Promise<void>;
  }): Promise<PlannerApproveResult> {
    const repository = this.options.repository;
    if (!repository) {
      return {
        ok: false,
        code: "TASK_REPOSITORY_UNAVAILABLE",
        message:
          "Task approval is unavailable because Task Runtime storage is not configured.",
        retryable: true,
      };
    }
    const task = await this.findTask(repository, input.taskId);
    if (!task) {
      return {
        ok: false,
        code: "TASK_NOT_FOUND",
        message: "The requested task was not found.",
        retryable: false,
      };
    }
    if (task.state !== "awaiting_confirmation") {
      return {
        ok: false,
        code: "TASK_APPROVAL_NOT_ALLOWED",
        message:
          "Only awaiting-confirmation planner draft tasks can be approved by this control.",
        retryable: false,
      };
    }
    if (task.steps.length === 0) {
      return {
        ok: false,
        code: "TASK_APPROVAL_EMPTY_PLAN",
        message: "Planner draft approval failed closed because no steps exist.",
        retryable: false,
      };
    }

    const startedAt = this.options.now().toISOString();
    await repository.updateTask({
      id: task.id,
      state: "running",
      updatedAt: startedAt,
      startedAt,
      verificationSummary:
        "Planner draft approved by explicit UI confirmation; bounded execution started.",
    });
    await repository.createEvent({
      id: createId("task-event"),
      taskId: task.id,
      type: "state_changed",
      message:
        "Planner draft approved by explicit UI confirmation; bounded execution started.",
      createdAt: startedAt,
    });
    await input.onProgress?.();

    let failedStepCount = 0;
    let executedStepCount = 0;
    for (const step of task.steps) {
      if (failedStepCount > 0) {
        await this.cancelRemainingApprovedPlannerStep(repository, task, step);
        continue;
      }
      const toolId = this.resolvePlannerTaskStepToolId(step);
      const runningAt = this.options.now().toISOString();
      await repository.updateStep({
        id: step.id,
        taskId: task.id,
        state: "running",
        verificationStatus: "pending",
      });
      await repository.createEvent({
        id: createId("task-event"),
        taskId: task.id,
        stepId: step.id,
        type: "step_started",
        message: `Approved planner step started: ${toolId ?? "unknown"}.`,
        createdAt: runningAt,
      });

      const result = await input.executeStep(step, toolId);
      const completedAt = this.options.now().toISOString();
      await repository.updateStep({
        id: step.id,
        taskId: task.id,
        state: result.ok ? "completed" : "failed",
        verificationStatus: result.verificationStatus,
        completedAt,
        resultSummary: result.summary,
        ...(result.ok ? {} : { failureReason: result.failureReason }),
      });
      await repository.createEvent({
        id: createId("task-event"),
        taskId: task.id,
        stepId: step.id,
        type: result.ok ? "verification_completed" : "verification_failed",
        message: result.summary,
        createdAt: completedAt,
      });
      if (result.ok) {
        executedStepCount += 1;
      } else {
        failedStepCount += 1;
      }
      await input.onProgress?.();
    }

    const completedAt = this.options.now().toISOString();
    const finalSummary =
      failedStepCount === 0
        ? `Planner draft approval completed ${executedStepCount} bounded step(s) with verified or not-applicable results.`
        : `Planner draft approval stopped after ${executedStepCount} bounded step(s); ${failedStepCount} step failed closed.`;
    const updated = await repository.updateTask({
      id: task.id,
      state: failedStepCount === 0 ? "completed" : "failed",
      updatedAt: completedAt,
      completedAt,
      verificationSummary: finalSummary,
    });
    await repository.createEvent({
      id: createId("task-event"),
      taskId: task.id,
      type: failedStepCount === 0 ? "verification_completed" : "failed",
      message: finalSummary,
      createdAt: completedAt,
    });
    await input.onProgress?.();
    return {
      ok: true,
      task: updated,
      approved: true,
      executedStepCount,
      failedStepCount,
    };
  }

  private async findTask(
    repository: TaskRepository,
    taskId: string,
  ): Promise<Task | undefined> {
    const tasks = await repository.listTasks();
    return tasks.find((candidate) => candidate.id === taskId);
  }

  private async cancelRemainingApprovedPlannerStep(
    repository: TaskRepository,
    task: Task,
    step: TaskStep,
  ): Promise<void> {
    if (step.state !== "pending" && step.state !== "running") {
      return;
    }
    const completedAt = this.options.now().toISOString();
    await repository.updateStep({
      id: step.id,
      taskId: task.id,
      state: "cancelled",
      verificationStatus: "not_applicable",
      completedAt,
      failureReason:
        "Planner approval stopped before this remaining step executed.",
    });
  }

  private resolvePlannerTaskStepToolId(step: TaskStep): string | undefined {
    if (step.toolId) {
      return step.toolId;
    }
    const match = /\[([A-Za-z0-9_.-]+)\]\s*$/u.exec(step.title);
    return match?.[1];
  }
}
