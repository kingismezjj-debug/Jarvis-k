import {
  InferencePreflightReportSchema,
  ModelManifestSchema,
  ModelOperationSnapshotSchema,
  type ModelOperationPhase,
  type LocalModelCapability,
  type ModelOperationSnapshot,
  type StructuredError,
} from "@jarvis-k/contracts";
import type {
  InferenceExecutionPlanner,
  ModelOperationSupervisor,
  ModelRegistry,
} from "@jarvis-k/capabilities";
import {
  modelServiceFailure,
  modelServiceSuccess,
  type ModelServiceResult,
} from "./model-service-result";

export interface ModelOperationsServiceOptions {
  modelRegistry?: ModelRegistry | undefined;
  inferenceExecutionPlanner?: InferenceExecutionPlanner | undefined;
  modelOperationSupervisor?: ModelOperationSupervisor | undefined;
  onOperationUpdated?: (
    operation: ModelOperationSnapshot,
    correlationId?: string,
  ) => void;
}

export interface ExecuteInferenceOperationInput<T> {
  capability: LocalModelCapability;
  modelId: string;
  execute: () => Promise<unknown>;
  parseResult: (result: unknown) => T;
  completedReason: string;
  failureCode: string;
  failureMessage: string;
  correlationId?: string;
}

export class ModelOperationsService {
  public constructor(private readonly options: ModelOperationsServiceOptions) {}

  public async cancelOperation(input: {
    operationId: string;
    reason?: string;
    correlationId?: string;
  }): Promise<ModelServiceResult<{ operation: ModelOperationSnapshot }>> {
    if (!this.options.modelOperationSupervisor) {
      return modelsUnavailable();
    }
    try {
      const existing = await this.options.modelOperationSupervisor.get(
        input.operationId,
      );
      if (!existing) {
        return modelServiceFailure({
          code: "MODEL_OPERATION_NOT_FOUND",
          message: "Model operation was not found.",
          retryable: false,
        });
      }
      const parsedExisting = ModelOperationSnapshotSchema.parse(existing);
      if (parsedExisting.phase === "cancelled") {
        return modelServiceSuccess({ operation: parsedExisting });
      }
      if (isTerminalOperationPhase(parsedExisting.phase)) {
        return modelServiceFailure({
          code: "MODEL_OPERATION_TERMINAL",
          message: "Terminal model operations cannot be cancelled again.",
          retryable: false,
          details: { operationId: parsedExisting.operationId },
        });
      }
      const operation = ModelOperationSnapshotSchema.parse(
        await this.options.modelOperationSupervisor.cancel(
          input.operationId,
          input.reason,
        ),
      );
      this.options.onOperationUpdated?.(operation, input.correlationId);
      return modelServiceSuccess({ operation });
    } catch {
      return modelServiceFailure({
        code: "MODEL_OPERATION_CANCEL_FAILED",
        message: "Unable to cancel model operation.",
        retryable: true,
      });
    }
  }

  public async executeInferenceOperation<T>(
    input: ExecuteInferenceOperationInput<T>,
  ): Promise<
    ModelServiceResult<{
      result: T;
      operation?: ModelOperationSnapshot;
    }>
  > {
    if (!this.options.modelRegistry || !this.options.inferenceExecutionPlanner) {
      return modelsUnavailable();
    }

    let operation: ModelOperationSnapshot | undefined;
    try {
      operation = await this.startOperation(
        {
          modelId: input.modelId,
          capability: input.capability,
          phase: "prechecking",
        },
        input.correlationId,
      );
      const manifest = await this.options.modelRegistry.getManifest(
        input.modelId,
      );
      if (!manifest) {
        operation = await this.updateOperation(
          operation,
          {
            phase: "blocked",
            reasons: ["Model manifest was not found."],
          },
          input.correlationId,
        );
        return modelServiceFailure({
          code: "MODEL_MANIFEST_NOT_FOUND",
          message: "Model manifest was not found.",
          retryable: false,
          ...(operation
            ? { details: { operationId: operation.operationId } }
            : {}),
        });
      }

      const report = InferencePreflightReportSchema.parse(
        await this.options.inferenceExecutionPlanner.preview({
          capability: input.capability,
          manifest: ModelManifestSchema.parse(manifest),
        }),
      );
      if (!report.allowed) {
        operation = await this.updateOperation(
          operation,
          {
            phase: "blocked",
            reasons: report.reasons,
          },
          input.correlationId,
        );
        return modelServiceFailure({
          code: "INFERENCE_PREFLIGHT_BLOCKED",
          message: "Inference preflight blocked execution.",
          retryable: false,
          details: {
            capability: report.capability,
            modelId: report.modelId,
            reasons: report.reasons,
            ...(operation ? { operationId: operation.operationId } : {}),
          },
        });
      }

      operation = await this.updateOperation(
        operation,
        {
          phase: "executing",
          reasons: [`${input.capability} inference preflight passed.`],
        },
        input.correlationId,
      );
      const result = input.parseResult(await input.execute());
      operation = await this.updateOperation(
        operation,
        {
          phase: "completed",
          reasons: [input.completedReason],
        },
        input.correlationId,
      );
      return modelServiceSuccess({
        result,
        ...(operation ? { operation } : {}),
      });
    } catch {
      await this.updateOperation(
        operation,
        {
          phase: "failed",
          reasons: [input.failureMessage],
          error: {
            code: input.failureCode,
            message: input.failureMessage,
            retryable: true,
          },
        },
        input.correlationId,
      );
      return modelServiceFailure({
        code: input.failureCode,
        message: input.failureMessage,
        retryable: true,
      });
    }
  }

  public async startOperation(
    input: {
      modelId: string;
      capability: LocalModelCapability;
      phase: ModelOperationSnapshot["phase"];
    },
    correlationId: string | undefined,
  ): Promise<ModelOperationSnapshot | undefined> {
    if (!this.options.modelOperationSupervisor) {
      return undefined;
    }
    const operation = ModelOperationSnapshotSchema.parse(
      await this.options.modelOperationSupervisor.start(input),
    );
    this.options.onOperationUpdated?.(operation, correlationId);
    return operation;
  }

  public async updateOperation(
    operation: ModelOperationSnapshot | undefined,
    input: {
      phase: ModelOperationSnapshot["phase"];
      reasons?: string[];
      error?: StructuredError;
    },
    correlationId: string | undefined,
  ): Promise<ModelOperationSnapshot | undefined> {
    if (!operation || !this.options.modelOperationSupervisor) {
      return operation;
    }
    if (
      isTerminalOperationPhase(operation.phase) &&
      input.phase !== operation.phase
    ) {
      throw new ModelOperationTransitionError(
        `Illegal model operation phase transition: ${operation.phase} -> ${input.phase}.`,
      );
    }
    const updated = ModelOperationSnapshotSchema.parse(
      await this.options.modelOperationSupervisor.update({
        operationId: operation.operationId,
        ...input,
      }),
    );
    this.options.onOperationUpdated?.(updated, correlationId);
    return updated;
  }
}

export class ModelOperationTransitionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ModelOperationTransitionError";
  }
}

function isTerminalOperationPhase(phase: ModelOperationPhase): boolean {
  return (
    phase === "completed" ||
    phase === "failed" ||
    phase === "cancelled" ||
    phase === "blocked"
  );
}

function modelsUnavailable(): ModelServiceResult<never> {
  return modelServiceFailure({
    code: "MODEL_GOVERNANCE_UNAVAILABLE",
    message: "Model governance is unavailable.",
    retryable: true,
  });
}
