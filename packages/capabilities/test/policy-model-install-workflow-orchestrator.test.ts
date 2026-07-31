import { describe, expect, it } from "vitest";
import {
  InMemoryModelOperationSupervisor,
  InMemoryResourceScheduler,
  PolicyModelInstallationPlanner,
  PolicyModelInstallWorkflowOrchestrator
} from "../src";
import type { DeviceCapability, ModelManifest } from "@jarvis-k/contracts";

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
