import { describe, expect, it } from "vitest";
import {
  InMemoryModelOperationSupervisor,
  InMemoryResourceScheduler,
  PolicyModelInstallationPlanner,
  PolicyModelInstallWorkflowOrchestrator
} from "../src";
import type { DeviceCapability, ModelManifest } from "@jarvis-k/contracts";
import type {
  ModelOperationSupervisor,
  ModelOperationStartInput,
  ModelOperationUpdateInput,
  ResourceRequest,
  ResourceScheduler
} from "../src/ports";

describe("PolicyModelInstallWorkflowOrchestrator", () => {
  it("prepares an install workflow without fetching artifacts", async () => {
    const operationSupervisor = new InMemoryModelOperationSupervisor(
      () => new Date("2026-07-31T00:00:00.000Z")
    );
    const orchestrator = new PolicyModelInstallWorkflowOrchestrator({
      installationPlanner: new PolicyModelInstallationPlanner(),
      operationSupervisor,
      resourceScheduler: new InMemoryResourceScheduler({
        device: device({
          availableMemoryBytes: gib(16),
          dedicatedMemoryBytes: gib(8)
        })
      })
    });

    const operation = await orchestrator.prepare({
      manifest: manifest({
        minMemoryBytes: gib(4),
        minVramBytes: gib(2)
      }),
      device: device({
        availableMemoryBytes: gib(16),
        dedicatedMemoryBytes: gib(8)
      })
    });

    expect(operation).toMatchObject({
      modelId: "vendor/local-stt-small",
      phase: "queued",
      reasons: ["Install workflow prepared; artifact fetch is not enabled."]
    });
    expect(await operationSupervisor.list({ activeOnly: true })).toHaveLength(1);
  });

  it("blocks manifests that fail installability policy", async () => {
    const orchestrator = new PolicyModelInstallWorkflowOrchestrator({
      installationPlanner: new PolicyModelInstallationPlanner(),
      operationSupervisor: new InMemoryModelOperationSupervisor(),
      resourceScheduler: new InMemoryResourceScheduler({ device: device() })
    });

    const operation = await orchestrator.prepare({
      manifest: manifest({
        revision: "main",
        sha256: undefined
      }),
      device: device()
    });

    expect(operation.phase).toBe("blocked");
    expect(operation.reasons.join(" ")).toContain("revision");
    expect(operation.reasons.join(" ")).toContain("SHA-256");
  });

  it("blocks workflows when resource leases cannot be acquired", async () => {
    const scheduler = new InMemoryResourceScheduler({
      device: device({
        availableMemoryBytes: gib(4),
        dedicatedMemoryBytes: gib(2)
      })
    });
    const orchestrator = new PolicyModelInstallWorkflowOrchestrator({
      installationPlanner: new PolicyModelInstallationPlanner(),
      operationSupervisor: new InMemoryModelOperationSupervisor(),
      resourceScheduler: scheduler
    });

    const operation = await orchestrator.prepare({
      manifest: manifest({
        minMemoryBytes: gib(8)
      }),
      device: device({
        availableMemoryBytes: gib(16),
        dedicatedMemoryBytes: gib(8)
      })
    });

    expect(operation).toMatchObject({
      phase: "blocked",
      reasons: ["RESOURCE_MEMORY_UNAVAILABLE"]
    });
  });

  it("releases acquired resource leases after preparation succeeds", async () => {
    const scheduler = new TrackingResourceScheduler();
    const orchestrator = new PolicyModelInstallWorkflowOrchestrator({
      installationPlanner: new PolicyModelInstallationPlanner(),
      operationSupervisor: new InMemoryModelOperationSupervisor(),
      resourceScheduler: scheduler
    });

    await expect(
      orchestrator.prepare({
        manifest: manifest({
          minMemoryBytes: gib(1)
        }),
        device: device()
      })
    ).resolves.toMatchObject({
      phase: "queued"
    });

    expect(scheduler.acquireCalls).toBe(1);
    expect(scheduler.releaseCalls).toBe(1);
  });

  it("releases acquired leases before reporting downstream operation failures", async () => {
    const scheduler = new TrackingResourceScheduler();
    const orchestrator = new PolicyModelInstallWorkflowOrchestrator({
      installationPlanner: new PolicyModelInstallationPlanner(),
      operationSupervisor: new FailingUpdateOperationSupervisor(),
      resourceScheduler: scheduler
    });

    await expect(
      orchestrator.prepare({
        manifest: manifest({
          minMemoryBytes: gib(1)
        }),
        device: device()
      })
    ).rejects.toThrow("UPDATE_FAILED");

    expect(scheduler.acquireCalls).toBe(1);
    expect(scheduler.releaseCalls).toBe(1);
  });

  it("sanitizes unexpected preparation errors", async () => {
    const orchestrator = new PolicyModelInstallWorkflowOrchestrator({
      installationPlanner: {
        preview: async () => ({
          modelId: manifest().id,
          allowed: true,
          reasons: [],
          runtimeMode: "standard"
        })
      },
      operationSupervisor: new InMemoryModelOperationSupervisor(),
      resourceScheduler: {
        acquire: async () => {
          throw new Error("ENOENT: C:\\Users\\secret\\model-cache");
        },
        diagnostics: async () => {
          throw new Error("not used");
        }
      }
    });

    const operation = await orchestrator.prepare({
      manifest: manifest(),
      device: device()
    });

    expect(operation).toMatchObject({
      phase: "failed",
      error: {
        code: "MODEL_INSTALL_WORKFLOW_FAILED",
        message: "Model install workflow failed."
      }
    });
    expect(JSON.stringify(operation)).not.toContain("C:\\Users\\secret");
  });
});

function manifest(overrides: Partial<ModelManifest> = {}): ModelManifest {
  const value: ModelManifest = {
    id: "vendor/local-stt-small",
    capability: "speech_to_text",
    source: "huggingface",
    revision: "commit-a",
    license: "MIT",
    runtime: "ctranslate2",
    quantization: "int8",
    sizeBytes: 512,
    sha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    licenseRisk: "green",
    ...overrides
  };
  if (overrides.sha256 === undefined && "sha256" in overrides) {
    delete (value as Partial<ModelManifest>).sha256;
  }
  return value;
}

function device(
  overrides: {
    availableMemoryBytes?: number;
    dedicatedMemoryBytes?: number;
  } = {}
): DeviceCapability {
  const totalMemoryBytes = gib(32);
  return {
    checkedAt: "2026-07-31T00:00:00.000Z",
    platform: "win32",
    arch: "x64",
    cpuLogicalCores: 16,
    totalMemoryBytes,
    availableMemoryBytes: overrides.availableMemoryBytes ?? gib(16),
    gpus: [
      {
        name: "NVIDIA Test GPU",
        vendor: "nvidia",
        dedicatedMemoryBytes: overrides.dedicatedMemoryBytes ?? gib(8)
      }
    ],
    accelerationBackends: ["cpu", "cuda"],
    recommendedMode: "local_enhanced",
    reasons: []
  };
}

function gib(value: number): number {
  return value * 1024 * 1024 * 1024;
}

class TrackingResourceScheduler implements ResourceScheduler {
  public acquireCalls = 0;
  public releaseCalls = 0;

  public async acquire(_input: ResourceRequest) {
    this.acquireCalls += 1;
    return {
      leaseId: "lease-test",
      capability: "speech_to_text" as const,
      modelId: "vendor/local-stt-small",
      createdAt: "2026-07-31T00:00:00.000Z",
      release: async () => {
        this.releaseCalls += 1;
      }
    };
  }

  public async diagnostics() {
    return {
      checkedAt: "2026-07-31T00:00:00.000Z",
      totalMemoryBytes: gib(32),
      availableMemoryBytes: gib(16),
      leasedMemoryBytes: 0,
      totalVramBytes: gib(8),
      availableVramBytes: gib(8),
      leasedVramBytes: 0,
      activeLeaseCount: 0,
      exclusiveGpuLeaseActive: false
    };
  }
}

class FailingUpdateOperationSupervisor implements ModelOperationSupervisor {
  public async start(
    input: ModelOperationStartInput
  ) {
    return {
      operationId: "model-op-failing-update",
      modelId: input.modelId,
      capability: input.capability,
      phase: input.phase ?? "queued",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
      reasons: []
    };
  }

  public async update(_input: ModelOperationUpdateInput) {
    throw new Error("UPDATE_FAILED");
  }

  public async cancel() {
    throw new Error("not used");
  }

  public async get() {
    return undefined;
  }

  public async list() {
    return [];
  }
}
