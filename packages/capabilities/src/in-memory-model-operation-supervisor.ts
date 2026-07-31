import {
  ModelOperationSnapshotSchema,
  createId,
  type ModelOperationPhase,
  type ModelOperationSnapshot
} from "@jarvis-k/contracts";
import type {
  ModelOperationListOptions,
  ModelOperationStartInput,
  ModelOperationSupervisor,
  ModelOperationUpdateInput
} from "./ports";

const ACTIVE_PHASES = new Set<ModelOperationPhase>([
  "queued",
  "prechecking",
  "downloading",
  "verifying",
  "loading",
  "releasing",
  "removing"
]);

export class InMemoryModelOperationSupervisor
  implements ModelOperationSupervisor
{
  private readonly operations = new Map<string, ModelOperationSnapshot>();

  public constructor(private readonly now: () => Date = () => new Date()) {}

  public async start(
    input: ModelOperationStartInput
  ): Promise<ModelOperationSnapshot> {
    const timestamp = this.now().toISOString();
    const operation = ModelOperationSnapshotSchema.parse({
      operationId: input.operationId ?? createId("model-op"),
      modelId: input.modelId,
      capability: input.capability,
      phase: input.phase ?? "queued",
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.operations.set(operation.operationId, operation);
    return cloneOperation(operation);
  }

  public async update(
    input: ModelOperationUpdateInput
  ): Promise<ModelOperationSnapshot> {
    const existing = this.operations.get(input.operationId);
    if (!existing) {
      throw new Error("MODEL_OPERATION_NOT_FOUND");
    }
    const updated = ModelOperationSnapshotSchema.parse({
      ...existing,
      phase: input.phase,
      updatedAt: this.now().toISOString(),
      ...(input.progress === undefined ? {} : { progress: input.progress }),
      ...(input.reasons === undefined ? {} : { reasons: input.reasons }),
      ...(input.error === undefined ? {} : { error: input.error })
    });
    this.operations.set(updated.operationId, updated);
    return cloneOperation(updated);
  }

  public async cancel(
    operationId: string,
    reason = "Operation cancelled."
  ): Promise<ModelOperationSnapshot> {
    return this.update({
      operationId,
      phase: "cancelled",
      reasons: [reason]
    });
  }

  public async get(
    operationId: string
  ): Promise<ModelOperationSnapshot | undefined> {
    const operation = this.operations.get(operationId);
    return operation ? cloneOperation(operation) : undefined;
  }

  public async list(
    options: ModelOperationListOptions = {}
  ): Promise<ModelOperationSnapshot[]> {
    const limit = options.limit ?? Number.POSITIVE_INFINITY;
    return Array.from(this.operations.values())
      .filter((operation) =>
        options.modelId ? operation.modelId === options.modelId : true
      )
      .filter((operation) =>
        options.activeOnly ? ACTIVE_PHASES.has(operation.phase) : true
      )
      .sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt)
      )
      .slice(0, limit)
      .map((operation) => cloneOperation(operation));
  }
}

function cloneOperation(
  operation: ModelOperationSnapshot
): ModelOperationSnapshot {
  return ModelOperationSnapshotSchema.parse({
    ...operation,
    ...(operation.progress
      ? { progress: { ...operation.progress } }
      : {}),
    reasons: [...operation.reasons],
    ...(operation.error ? { error: { ...operation.error } } : {})
  });
}
