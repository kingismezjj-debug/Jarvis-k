import {
  Task,
  TaskEvent,
  TaskEventType,
  TaskState,
  TaskStep,
  TaskStepState,
  TaskStepVerificationStatus
} from "@jarvis-k/contracts";

export interface TaskCreateInput {
  id: string;
  title: string;
  state: TaskState;
  createdAt: string;
  updatedAt: string;
  source?: Task["source"];
  intent?: Task["intent"];
  routeSource?: Task["routeSource"];
}

export interface TaskStepCreateInput {
  id: string;
  taskId: string;
  title: string;
  state: TaskStepState;
  verificationStatus: TaskStepVerificationStatus;
  toolId?: string;
  toolInput?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  resultSummary?: string;
  failureReason?: string;
}

export interface TaskEventCreateInput {
  id: string;
  taskId: string;
  stepId?: string;
  type: TaskEventType;
  message: string;
  createdAt: string;
}

export interface TaskRepository {
  initialize(): Promise<void>;
  recoverRunningTasksAsInterrupted(now: string): Promise<void>;
  createTask(input: TaskCreateInput): Promise<Task>;
  updateTask(input: {
    id: string;
    state: TaskState;
    updatedAt: string;
    startedAt?: string;
    completedAt?: string;
    verificationSummary?: string;
  }): Promise<Task>;
  createStep(input: TaskStepCreateInput): Promise<TaskStep>;
  updateStep(input: {
    id: string;
    taskId: string;
    state: TaskStepState;
    verificationStatus: TaskStepVerificationStatus;
    completedAt?: string;
    resultSummary?: string;
    failureReason?: string;
  }): Promise<TaskStep>;
  createEvent(input: TaskEventCreateInput): Promise<TaskEvent>;
  listTasks(): Promise<Task[]>;
}
