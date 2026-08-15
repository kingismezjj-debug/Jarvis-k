import { createHash } from "node:crypto";
import {
  BrainIntent,
  BrainPlannerResult,
  Task,
  createId,
} from "@jarvis-k/contracts";
import { TaskLifecycleService } from "../task-lifecycle-service";
import type { TaskRepository } from "../task-runtime";

export const PLANNER_DRAFT_VERSION = "v1";

export interface PlannerDraftServiceOptions {
  repository: TaskRepository | undefined;
  now: () => Date;
  allowedToolIds: readonly string[];
}

export interface PlannerDraftCreateInput {
  source: "text" | "voice";
  intent: BrainIntent;
  plannerResult: BrainPlannerResult;
}

export type PlannerDraftCreateResult =
  | {
      ok: true;
      task: Task;
      version: typeof PLANNER_DRAFT_VERSION;
      digest: string;
      stepCount: number;
    }
  | {
      ok: false;
      code: string;
      message: string;
      retryable: boolean;
    };

export interface PlannerDraftStepDigestInput {
  title: string;
  toolId: string | undefined;
  toolInput: Record<string, unknown> | undefined;
}

export class PlannerDraftService {
  private readonly allowedToolIds: Set<string>;
  private readonly lifecycle: TaskLifecycleService | undefined;

  public constructor(private readonly options: PlannerDraftServiceOptions) {
    this.allowedToolIds = new Set(options.allowedToolIds);
    this.lifecycle =
      options.repository === undefined
        ? undefined
        : new TaskLifecycleService({
            repository: options.repository,
            now: options.now,
          });
  }

  public async createDraft(
    input: PlannerDraftCreateInput,
  ): Promise<PlannerDraftCreateResult> {
    const repository = this.options.repository;
    const plan = input.plannerResult.plan;
    if (!repository) {
      return {
        ok: false,
        code: "TASK_REPOSITORY_UNAVAILABLE",
        message:
          "Planner draft persistence is unavailable because Task Runtime storage is not configured.",
        retryable: true,
      };
    }
    if (!plan || plan.steps.length === 0) {
      return {
        ok: false,
        code: "PLANNER_DRAFT_EMPTY",
        message: "Planner draft persistence failed closed because no plan steps exist.",
        retryable: false,
      };
    }
    const blockedStep = plan.steps.find(
      (step) => !this.allowedToolIds.has(step.toolId),
    );
    if (blockedStep) {
      return {
        ok: false,
        code: "PLANNER_DRAFT_TOOL_NOT_ALLOWLISTED",
        message: `Planner draft persistence failed closed because tool ${blockedStep.toolId} is not allowlisted.`,
        retryable: false,
      };
    }

    const draftSteps = plan.steps.slice(0, 6).map((step, index) => ({
      title: `${index + 1}. ${step.title} [${step.toolId}]`,
      toolId: step.toolId,
      toolInput: step.args,
    }));
    try {
      const digest = createPlannerDraftDigest(draftSteps);
      const existing = (await repository.listTasks()).find((task) => {
        const persisted = readPlannerDraftVersionDigest(task);
        return (
          task.state === "awaiting_confirmation" &&
          persisted?.version === PLANNER_DRAFT_VERSION &&
          persisted.digest === digest
        );
      });
      if (existing) {
        return {
          ok: true,
          task: existing,
          version: PLANNER_DRAFT_VERSION,
          digest,
          stepCount: existing.steps.length,
        };
      }
      const taskId = createId("task");
      const createdAt = this.options.now().toISOString();

      await repository.createTask({
        id: taskId,
        title: "Review Minimal Plan",
        state: "planning",
        createdAt,
        updatedAt: createdAt,
        source: input.source,
        intent: input.intent,
        routeSource: "intent-router.deterministic.rules",
      });
      await repository.createEvent({
        id: createId("task-event"),
        taskId,
        type: "created",
        message: `Task created from Planner draft route (${PLANNER_DRAFT_VERSION}/${digest}).`,
        createdAt,
      });
      for (const step of draftSteps) {
        await repository.createStep({
          id: createId("step"),
          taskId,
          title: step.title,
          state: "pending",
          verificationStatus: "not_applicable",
          toolId: step.toolId,
          toolInput: step.toolInput,
        });
      }

      this.lifecycle?.assertTransition("planning", "awaiting_confirmation");
      const waitingAt = this.options.now().toISOString();
      const updated = await repository.updateTask({
        id: taskId,
        state: "awaiting_confirmation",
        updatedAt: waitingAt,
        verificationSummary: `Planner draft ${PLANNER_DRAFT_VERSION}/${digest} saved from ${input.plannerResult.providerId}; approval required; no tool execution was attempted.`,
      });
      await repository.createEvent({
        id: createId("task-event"),
        taskId,
        type: "state_changed",
        message: `Planner draft ${PLANNER_DRAFT_VERSION}/${digest} from ${input.plannerResult.providerId} is awaiting explicit user confirmation before any step can run.`,
        createdAt: waitingAt,
      });
      return {
        ok: true,
        task: updated,
        version: PLANNER_DRAFT_VERSION,
        digest,
        stepCount: draftSteps.length,
      };
    } catch {
      return {
        ok: false,
        code: "TASK_REPOSITORY_WRITE_FAILED",
        message:
          "Planner draft persistence failed closed because Task Repository write failed.",
        retryable: true,
      };
    }
  }
}

export function createPlannerDraftDigest(
  steps: readonly PlannerDraftStepDigestInput[],
): string {
  const normalized = steps.map((step, index) => ({
    index,
    title: step.title,
    toolId: step.toolId ?? null,
    toolInput: normalizePlannerDraftValue(step.toolInput ?? {}),
  }));
  return createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex")
    .slice(0, 16);
}

export function createPlannerDraftDigestFromTask(task: Task): string {
  return createPlannerDraftDigest(
    task.steps.map((step) => ({
      title: step.title,
      toolId: step.toolId,
      toolInput: step.toolInput,
    })),
  );
}

export function readPlannerDraftVersionDigest(
  task: Task,
): { version: typeof PLANNER_DRAFT_VERSION; digest: string } | undefined {
  const source = [
    task.verificationSummary,
    ...task.events.map((event) => event.message),
  ]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
  const match = new RegExp(`${PLANNER_DRAFT_VERSION}/([a-f0-9]{16})`, "u").exec(
    source,
  );
  if (!match?.[1]) {
    return undefined;
  }
  return {
    version: PLANNER_DRAFT_VERSION,
    digest: match[1],
  };
}

export function plannerDraftDigestMatches(task: Task): boolean {
  const persisted = readPlannerDraftVersionDigest(task);
  return (
    persisted !== undefined &&
    persisted.digest === createPlannerDraftDigestFromTask(task)
  );
}

function normalizePlannerDraftValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizePlannerDraftValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalizePlannerDraftValue(nested)]),
    );
  }
  return value;
}
