import { describe, expect, it } from "vitest";
import type {
  CapabilityProvider,
  ModelInstallWorkflowOrchestrator,
  ModelRegistry,
} from "@jarvis-k/capabilities";
import type {
  CapabilitySnapshot,
  ModelInstallWorkflowPrepareInput,
  ModelManifest,
  ModelOperationSnapshot,
} from "@jarvis-k/contracts";
import { ModelInstallCoordinator } from "../src/model/model-install-coordinator";

describe("ModelInstallCoordinator", () => {
  it("prepares install workflows through the existing orchestrator", async () => {
    const orchestrator = new RecordingInstallOrchestrator();
    const updates: ModelOperationSnapshot[] = [];
    const service = new ModelInstallCoordinator({
      capabilityProvider: new CountingCapabilityProvider(),
      modelRegistry: new StaticRegistry([manifest()]),
      modelInstallWorkflowOrchestrator: orchestrator,
      onOperationUpdated: (operation) => updates.push(operation),
    });

    const result = await service.prepare({
      modelId: "jarvis-fixture/local-embedding-smoke",
      allowYellowRisk: true,
      exclusiveGpu: false,
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        capabilities: {
          device: {
            recommendedMode: "standard",
          },
        },
        operation: {
          operationId: "model-op-install",
          phase: "queued",
        },
      },
    });
    expect(orchestrator.prepared).toMatchObject({
      manifest: {
        id: "jarvis-fixture/local-embedding-smoke",
      },
      allowYellowRisk: true,
      exclusiveGpu: false,
    });
    expect(updates.map((item) => item.operationId)).toEqual([
      "model-op-install",
    ]);
  });

  it("does not inspect capabilities or call the orchestrator for missing models", async () => {
    const capabilityProvider = new CountingCapabilityProvider();
    const orchestrator = new RecordingInstallOrchestrator();
    const service = new ModelInstallCoordinator({
      capabilityProvider,
      modelRegistry: new StaticRegistry([]),
      modelInstallWorkflowOrchestrator: orchestrator,
    });

    await expect(
      service.prepare({
        modelId: "missing-model",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "MODEL_MANIFEST_NOT_FOUND",
      },
    });
    expect(capabilityProvider.calls).toBe(0);
    expect(orchestrator.prepared).toBeUndefined();
  });

  it("fails closed when the existing install orchestrator fails", async () => {
    const service = new ModelInstallCoordinator({
      capabilityProvider: new CountingCapabilityProvider(),
      modelRegistry: new StaticRegistry([manifest()]),
      modelInstallWorkflowOrchestrator: new FailingInstallOrchestrator(),
    });

    await expect(
      service.prepare({
        modelId: "jarvis-fixture/local-embedding-smoke",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "MODEL_INSTALL_PREPARE_FAILED",
        retryable: true,
      },
    });
  });
});

class CountingCapabilityProvider implements CapabilityProvider {
  public calls = 0;

  public async inspect(): Promise<CapabilitySnapshot> {
    this.calls += 1;
    return {
      checkedAt: "2026-07-31T00:00:00.000Z",
      runtimeMode: "standard",
      device: {
        checkedAt: "2026-07-31T00:00:00.000Z",
        platform: "win32",
        arch: "x64",
        cpuLogicalCores: 16,
        totalMemoryBytes: 16,
        availableMemoryBytes: 12,
        gpus: [],
        accelerationBackends: ["cpu"],
        recommendedMode: "standard",
        reasons: [],
      },
      providerPlan: [],
      modelInventory: [],
    };
  }
}

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

class RecordingInstallOrchestrator implements ModelInstallWorkflowOrchestrator {
  public prepared: ModelInstallWorkflowPrepareInput | undefined;

  public async prepare(
    input: ModelInstallWorkflowPrepareInput,
  ): Promise<ModelOperationSnapshot> {
    this.prepared = input;
    return {
      operationId: "model-op-install",
      modelId: input.manifest.id,
      capability: input.manifest.capability,
      phase: "queued",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
      reasons: ["Install workflow prepared."],
    };
  }
}

class FailingInstallOrchestrator implements ModelInstallWorkflowOrchestrator {
  public async prepare(): Promise<ModelOperationSnapshot> {
    throw new Error("network path C:\\Users\\secret\\token-cache");
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
