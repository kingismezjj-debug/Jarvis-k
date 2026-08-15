import { describe, expect, it } from "vitest";
import type {
  CapabilityProvider,
  InferenceExecutionPlanner,
  InferenceProviderRegistry,
  ModelCandidateRegistry,
  ModelInstallationPlanner,
  ModelLifecycleManager,
  ModelOperationSupervisor,
  ModelRegistry,
  ModelRuntimeAdapter,
  ModelRuntimeRegistry,
  ResourceLease,
  ResourceScheduler,
} from "@jarvis-k/capabilities";
import type {
  CapabilitySnapshot,
  InferenceProviderConfigurationReport,
  InferenceProviderDescriptor,
  InferencePreflightReport,
  LocalModelCapability,
  ModelCandidate,
  ModelInstallabilityReport,
  ModelInventoryItem,
  ModelManifest,
  ModelOperationSnapshot,
  ModelRuntimeAdapterDescriptor,
  ResourceRequest,
  ResourceSchedulerDiagnostics,
} from "@jarvis-k/contracts";
import { ModelStatusService } from "../src/model/model-status-service";

describe("ModelStatusService", () => {
  it("aggregates read-only model status through existing model components", async () => {
    const lifecycle = new ReadOnlyLifecycleManager([]);
    const runtimeRegistry = new ReadOnlyRuntimeRegistry();
    const resourceScheduler = new ReadOnlyResourceScheduler();
    const service = new ModelStatusService({
      capabilityProvider: new StaticCapabilityProvider(),
      modelRegistry: new StaticRegistry([manifest()]),
      modelCandidateRegistry: new StaticCandidateRegistry([candidate()]),
      modelLifecycleManager: lifecycle,
      modelRuntimeRegistry: runtimeRegistry,
      inferenceProviderRegistry: new StaticInferenceRegistry(),
      inferenceExecutionPlanner: new AllowingPreflightPlanner(),
      modelInstallationPlanner: new AllowingInstallationPlanner(),
      modelOperationSupervisor: new StaticOperationSupervisor([
        operation("model-op-active", "executing"),
        operation("model-op-terminal", "completed"),
      ]),
      resourceScheduler,
    });

    await expect(service.inspectCapabilities()).resolves.toMatchObject({
      ok: true,
      value: {
        device: {
          recommendedMode: "standard",
        },
      },
    });
    await expect(service.listModelManifests({})).resolves.toMatchObject({
      ok: true,
      value: {
        manifests: [{ id: "jarvis-fixture/local-embedding-smoke" }],
      },
    });
    await expect(service.listModelCandidates({})).resolves.toMatchObject({
      ok: true,
      value: {
        candidates: [{ id: "openai/whisper-large-v3-turbo" }],
      },
    });
    await expect(service.listModelInventory()).resolves.toMatchObject({
      ok: true,
      value: {
        inventory: [],
      },
    });
    await expect(service.listModelRuntimeAdapters()).resolves.toMatchObject({
      ok: true,
      value: {
        runtimeAdapters: [{ runtime: "system" }],
      },
    });
    await expect(service.listInferenceProviders({})).resolves.toMatchObject({
      ok: true,
      value: {
        providers: [{ provider: "embedding.fake" }],
      },
    });
    await expect(
      service.listInferenceProviderRequirements({}),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        reports: [{ provider: "embedding.fake" }],
      },
    });
    await expect(
      service.previewInferenceExecution({
        capability: "embedding",
        modelId: "jarvis-fixture/local-embedding-smoke",
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        report: {
          allowed: true,
        },
      },
    });
    await expect(service.listModelOperations({})).resolves.toMatchObject({
      ok: true,
      value: {
        operations: [
          { operationId: "model-op-active" },
          { operationId: "model-op-terminal" },
        ],
      },
    });
    await expect(service.getResourceDiagnostics()).resolves.toMatchObject({
      ok: true,
      value: {
        resourceDiagnostics: {
          activeLeaseCount: 1,
        },
      },
    });
    await expect(
      service.previewModelInstallability({
        modelId: "jarvis-fixture/local-embedding-smoke",
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        report: {
          allowed: true,
        },
      },
    });

    expect(lifecycle.loadCalls).toBe(0);
    expect(runtimeRegistry.getAdapterCalls).toBe(0);
    expect(resourceScheduler.acquireCalls).toBe(0);
  });

  it("fails closed when model status dependencies are unavailable or invalid", async () => {
    const missingModels = new ModelStatusService({});
    await expect(missingModels.listModelManifests({})).resolves.toMatchObject({
      ok: false,
      error: {
        code: "MODEL_GOVERNANCE_UNAVAILABLE",
      },
    });

    const service = new ModelStatusService({
      modelRegistry: new StaticRegistry([]),
      inferenceExecutionPlanner: new AllowingPreflightPlanner(),
    });
    await expect(
      service.previewInferenceExecution({
        capability: "embedding",
        modelId: "missing-model",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "MODEL_MANIFEST_NOT_FOUND",
      },
    });
  });
});

class StaticCapabilityProvider implements CapabilityProvider {
  public async inspect(): Promise<CapabilitySnapshot> {
    return capabilitySnapshot();
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

class StaticCandidateRegistry implements ModelCandidateRegistry {
  public constructor(private readonly candidates: ModelCandidate[]) {}

  public async listCandidates(): Promise<ModelCandidate[]> {
    return this.candidates.map((item) => ({
      ...item,
      audit: { ...item.audit, evidenceUrls: [...item.audit.evidenceUrls] },
    }));
  }

  public async getCandidate(
    modelId: string,
  ): Promise<ModelCandidate | undefined> {
    const found = this.candidates.find((item) => item.id === modelId);
    return found
      ? { ...found, audit: { ...found.audit, evidenceUrls: [...found.audit.evidenceUrls] } }
      : undefined;
  }
}

class ReadOnlyLifecycleManager implements ModelLifecycleManager {
  public loadCalls = 0;

  public constructor(private readonly inventory: ModelInventoryItem[]) {}

  public async listInventory(): Promise<ModelInventoryItem[]> {
    return this.inventory.map((item) => ({
      ...item,
      manifest: { ...item.manifest },
    }));
  }

  public async ensureAvailable(): Promise<ModelInventoryItem> {
    throw new Error("ensureAvailable must not be called by status queries.");
  }

  public async load(): Promise<ModelInventoryItem> {
    this.loadCalls += 1;
    throw new Error("load must not be called by status queries.");
  }

  public async release(): Promise<void> {
    throw new Error("release must not be called by status queries.");
  }
}

class ReadOnlyRuntimeRegistry implements ModelRuntimeRegistry {
  public getAdapterCalls = 0;

  public async listDescriptors(): Promise<ModelRuntimeAdapterDescriptor[]> {
    return [
      {
        runtime: "system",
        capabilities: ["embedding"],
        accelerationBackends: ["cpu"],
        notes: ["Fixture descriptor."],
      },
    ];
  }

  public async getAdapter(): Promise<ModelRuntimeAdapter | undefined> {
    this.getAdapterCalls += 1;
    throw new Error("getAdapter must not be called by status queries.");
  }
}

class StaticInferenceRegistry implements InferenceProviderRegistry {
  public async listProviders(): Promise<InferenceProviderDescriptor[]> {
    return [
      {
        capability: "embedding",
        provider: "embedding.fake",
        status: "available",
        execution: "local",
        modelIds: ["jarvis-fixture/local-embedding-smoke"],
        reasons: [],
      },
    ];
  }

  public async listConfigurationRequirements(): Promise<
    InferenceProviderConfigurationReport[]
  > {
    return [
      {
        capability: "embedding",
        provider: "embedding.fake",
        status: "available",
        requirements: [],
        reasons: [],
      },
    ];
  }
}

class AllowingPreflightPlanner implements InferenceExecutionPlanner {
  public async preview(input: {
    capability: LocalModelCapability;
    manifest: ModelManifest;
  }): Promise<InferencePreflightReport> {
    return {
      capability: input.capability,
      modelId: input.manifest.id,
      allowed: true,
      providers: [],
      reasons: [],
    };
  }
}

class AllowingInstallationPlanner implements ModelInstallationPlanner {
  public async preview(input: {
    manifest: ModelManifest;
  }): Promise<ModelInstallabilityReport> {
    return {
      modelId: input.manifest.id,
      allowed: true,
      reasons: [],
      runtimeMode: "standard",
    };
  }
}

class StaticOperationSupervisor implements ModelOperationSupervisor {
  public constructor(private readonly operations: ModelOperationSnapshot[]) {}

  public async start(): Promise<ModelOperationSnapshot> {
    throw new Error("start must not be called by status queries.");
  }

  public async update(): Promise<ModelOperationSnapshot> {
    throw new Error("update must not be called by status queries.");
  }

  public async cancel(): Promise<ModelOperationSnapshot> {
    throw new Error("cancel must not be called by status queries.");
  }

  public async get(): Promise<ModelOperationSnapshot | undefined> {
    throw new Error("get must not be called by status list queries.");
  }

  public async list(): Promise<ModelOperationSnapshot[]> {
    return this.operations.map((item) => ({
      ...item,
      reasons: [...item.reasons],
    }));
  }
}

class ReadOnlyResourceScheduler implements ResourceScheduler {
  public acquireCalls = 0;

  public async acquire(_input: ResourceRequest): Promise<ResourceLease> {
    this.acquireCalls += 1;
    throw new Error("acquire must not be called by diagnostics.");
  }

  public async diagnostics(): Promise<ResourceSchedulerDiagnostics> {
    return {
      checkedAt: "2026-07-31T00:00:00.000Z",
      totalMemoryBytes: 16,
      availableMemoryBytes: 12,
      leasedMemoryBytes: 4,
      totalVramBytes: 8,
      availableVramBytes: 6,
      leasedVramBytes: 2,
      activeLeaseCount: 1,
      exclusiveGpuLeaseActive: false,
    };
  }
}

function capabilitySnapshot(): CapabilitySnapshot {
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
    providerPlan: [
      {
        capability: "embedding",
        provider: "embedding.fake",
        execution: "local",
        loadPolicy: "on_demand",
        reason: "Fixture provider.",
      },
    ],
    modelInventory: [],
  };
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

function candidate(): ModelCandidate {
  return {
    id: "openai/whisper-large-v3-turbo",
    capability: "speech_to_text",
    source: "huggingface",
    officialUrl: "https://huggingface.co/openai/whisper-large-v3-turbo",
    license: "MIT",
    licenseRisk: "yellow",
    distributionRisk: "yellow",
    runtime: "ctranslate2",
    recommendedMode: "local_enhanced",
    downloadEnabled: false,
    audit: {
      checkedAt: "2026-07-31T00:00:00.000Z",
      evidenceUrls: ["https://huggingface.co/openai/whisper-large-v3-turbo"],
      pinStatus: "pending_pin",
      notes: ["Fixture candidate."],
    },
  };
}

function operation(
  operationId: string,
  phase: ModelOperationSnapshot["phase"],
): ModelOperationSnapshot {
  return {
    operationId,
    modelId: "jarvis-fixture/local-embedding-smoke",
    capability: "embedding",
    phase,
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
    reasons: [],
  };
}
