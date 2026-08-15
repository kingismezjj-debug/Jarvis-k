import type { TaskRepository } from "./task-runtime";
import {
  TaskLifecycleService,
  type CompleteTaskVerificationInput,
  type CreateQueuedTaskInput,
  type CreatedTaskLifecycle,
} from "./task-lifecycle-service";

export interface TaskDispatchServiceOptions {
  repository: TaskRepository;
  now: () => Date;
}

export class TaskDispatchService {
  private readonly lifecycle: TaskLifecycleService;

  public constructor(options: TaskDispatchServiceOptions) {
    this.lifecycle = new TaskLifecycleService(options);
  }

  public async createQueuedTask(
    input: CreateQueuedTaskInput,
  ): Promise<CreatedTaskLifecycle> {
    return this.lifecycle.createQueuedTask(input);
  }

  public async markRunning(input: {
    taskId: string;
    stepId: string;
    message: string;
  }): Promise<void> {
    await this.lifecycle.markRunning(input);
  }

  public async completeVerification(
    input: CompleteTaskVerificationInput,
  ): Promise<{ verified: boolean }> {
    return this.lifecycle.completeVerification(input);
  }
}
