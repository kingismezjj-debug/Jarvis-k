import { describe, expect, it } from "vitest";
import { InMemoryModelOperationSupervisor } from "@jarvis-k/capabilities";
import type {
  InferenceExecutionPlanner,
  ModelRegistry,
} from "@jarvis-k/capabilities";
import type {
  InferencePreflightReport,
  ModelManifest,
  ModelOperationSnapshot,
} from "@jarvis-k/contracts";
import {
  ModelOperationsService,
  ModelOperationTransitionError,
} from "../src/model/model-operations-service";

describe("ModelOperationsService", () => {
  it("runs inference through precheck, execute, and completed phases", async () => {
    const updates: ModelOperationSnapshot[] = [];
    const service = new ModelOperationsService({
      modelRegistry: new StaticRegistry([manifest()]),
      inferenceExecutionPlanner: new StaticPreflightPlanner(true),
      modelOperationSupervisor: new InMemoryModelOperationSupervisor(fixedNow),
      onOperationUpdated: (operation) => updates.push(operation),
    });

    const result = await service.executeInferenceOperation({
      capability: "embedding",
      modelId: "jarvis-fixture/local-embedding-smoke",
      execute: async () => ({ ok: true }),
      parseResult: (value) => value as { ok: true },
      completedReason: "Embedding inference completed.",
      failureCode: "EMBEDDING_FAILED",
      failureMessage: "Unable to generate embeddings.",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        result: {
          ok: true,
        },
        operation: {
          phase: "completed",
        },
      },
    });
    expect(updates.map((item) => item.phase)).toEqual([
      "prechecking",
      "executing",
      "completed",
    ]);
  });

  it("blocks inference before provider execution when preflight fails", async () => {
    let executeCalls = 0;
    const updates: ModelOperationSnapshot[] = [];
    const service = new ModelOperationsService({
      modelRegistry: new StaticRegistry([manifest()]),
      inferenceExecutionPlanner: new StaticPreflightPlanner(false),
      modelOperationSupervisor: new InMemoryModelOperationSupervisor(fixedNow),
      onOperationUpdated: (operation) => updates.push(operation),
    });

    const result = await service.executeInferenceOperation({
      capability: "embedding",
      modelId: "jarvis-fixture/local-embedding-smoke",
      execute: async () => {
        executeCalls += 1;
        return { ok: true };
      },
      parseResult: (value) => value,
      completedReason: "Embedding inference completed.",
      failureCode: "EMBEDDING_FAILED",
      failureMessage: "Unable to generate embeddings.",
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "INFERENCE_PREFLIGHT_BLOCKED",
      },
    });
    expect(executeCalls).toBe(0);
    expect(updates.map((item) => item.phase)).toEqual([
      "prechecking",
      "blocked",
    ]);
  });

  it("fails closed for missing manifests and execution parse errors", async () => {
    const missingManifest = new ModelOperationsService({
      modelRegistry: new StaticRegistry([]),
      inferenceExecutionPlanner: new StaticPreflightPlanner(true),
      modelOperationSupervisor: new InMemoryModelOperationSupervisor(fixedNow),
    });

    await expect(
      missingManifest.executeInferenceOperation({
        capability: "embedding",
        modelId: "missing-model",
        execute: async () => ({ ok: true }),
        parseResult: (value) => value,
        completedReason: "Embedding inference completed.",
        failureCode: "EMBEDDING_FAILED",
        failureMessage: "Unable to generate embeddings.",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "MODEL_MANIFEST_NOT_FOUND",
      },
    });

    const updates: ModelOperationSnapshot[] = [];
    const providerFailure = new ModelOperationsService({
      modelRegistry: new StaticRegistry([manifest()]),
      inferenceExecutionPlanner: new StaticPreflightPlanner(true),
      modelOperationSupervisor: new InMemoryModelOperationSupervisor(fixedNow),
      onOperationUpdated: (operation) => updates.push(operation),
    });

    await expect(
      providerFailure.executeInferenceOperation({
        capability: "embedding",
        modelId: "jarvis-fixture/local-embedding-smoke",
        execute: async () => ({ malformed: true }),
        parseResult: () => {
          throw new Error("provider returned malformed output");
        },
        completedReason: "Embedding inference completed.",
        failureCode: "EMBEDDING_FAILED",
        failureMessage: "Unable to generate embeddings.",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "EMBEDDING_FAILED",
        message: "Unable to generate embeddings.",
      },
    });
    expect(updates.map((item) => item.phase)).toEqual([
      "prechecking",
      "executing",
      "failed",
    ]);
    expect(JSON.stringify(updates)).not.toContain("malformed");
  });

  it("rejects non-idempotent terminal transitions and keeps cancel idempotent", async () => {
    const supervisor = new InMemoryModelOperationSupervisor(fixedNow);
    const service = new ModelOperationsService({
      modelOperationSupervisor: supervisor,
    });
    const operation = await service.startOperation(
      {
        modelId: "jarvis-fixture/local-embedding-smoke",
        capability: "embedding",
        phase: "executing",
      },
      undefined,
    );
    const completed = await service.updateOperation(
      operation,
      {
        phase: "completed",
        reasons: ["Completed."],
      },
      undefined,
    );

    await expect(
      service.updateOperation(
        completed,
        {
          phase: "executing",
          reasons: ["Do not revive terminal operations."],
        },
        undefined,
      ),
    ).rejects.toBeInstanceOf(ModelOperationTransitionError);

    const cancellable = await service.startOperation(
      {
        modelId: "jarvis-fixture/local-embedding-smoke",
        capability: "embedding",
        phase: "executing",
      },
      undefined,
    );
    expect(cancellable).toBeDefined();
    const firstCancel = await service.cancelOperation({
      operationId: cancellable?.operationId ?? "",
      reason: "User cancelled.",
    });
    const secondCancel = await service.cancelOperation({
      operationId: cancellable?.operationId ?? "",
      reason: "Duplicate cancellation.",
    });

    expect(firstCancel).toMatchObject({
      ok: true,
      value: {
        operation: {
          phase: "cancelled",
          reasons: ["User cancelled."],
        },
      },
    });
    expect(secondCancel).toMatchObject({
      ok: true,
      value: {
        operation: {
          phase: "cancelled",
          reasons: ["User cancelled."],
        },
      },
    });
  });

  it("does not require an operation supervisor to execute an allowed provider", async () => {
    const service = new ModelOperationsService({
      modelRegistry: new StaticRegistry([manifest()]),
      inferenceExecutionPlanner: new StaticPreflightPlanner(true),
    });

    await expect(
      service.executeInferenceOperation({
        capability: "embedding",
        modelId: "jarvis-fixture/local-embedding-smoke",
        execute: async () => ({ ok: true }),
        parseResult: (value) => value,
        completedReason: "Embedding inference completed.",
        failureCode: "EMBEDDING_FAILED",
        failureMessage: "Unable to generate embeddings.",
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        result: {
          ok: true,
        },
      },
    });
  });
});

class StaticRegistry implements ModelRegistry {
  public constructor(private readonly manifests: ModelManifest[]) {}

  public async listManifests(): Promise<ModelManifest[]> {
    return this.manifests.map((item) => ({ ...item }));
  }

  public async getManifest(
    modelId: string,
  ): Promise<ModelManifest | undefined> {
    const found = this.manifests.find((item) => item.id === modelId);
    return found ? { ...found } : undefined;
  }
}

class StaticPreflightPlanner implements InferenceExecutionPlanner {
  public constructor(private readonly allowed: boolean) {}

  public async preview(input: {
    manifest: ModelManifest;
  }): Promise<InferencePreflightReport> {
    return {
      capability: input.manifest.capability,
      modelId: input.manifest.id,
      allowed: this.allowed,
      providers: [],
      reasons: this.allowed ? [] : ["Fixture preflight blocked execution."],
    };
  }
}

function manifest(): ModelManifest {
  return {
    id: "jarvis-fixture/local-embedding-smoke",
    capability: "embedding",
    source: "jarvis",
    revision: "fixture-2026-07-31-embedding",
    license: "Jarvis-K Fixture",
    runtime: "system",
    quantization: "fixture",
    sizeBytes: 2048,
    sha256:
      "2222222222222222222222222222222222222222222222222222222222222222",
    licenseRisk: "green",
  };
}

function fixedNow(): Date {
  return new Date("2026-07-31T00:00:00.000Z");
}
