import { describe, expect, it } from "vitest";
import {
  InMemoryResourceScheduler,
  PolicyInferenceExecutionPlanner,
  StaticInferenceProviderRegistry
} from "../src";
import type {
  DeviceCapability,
  InferenceProviderDescriptor,
  ModelManifest
} from "@jarvis-k/contracts";

describe("PolicyInferenceExecutionPlanner", () => {
  it("blocks preflight when no provider is available", async () => {
    const planner = new PolicyInferenceExecutionPlanner({
      inferenceProviderRegistry: new StaticInferenceProviderRegistry([
        {
          capability: "embedding",
          provider: "embedding.unconfigured",
          status: "unconfigured",
          execution: "disabled",
          modelIds: [],
          reasons: ["No embedding provider has been composed."]
        }
      ])
    });

    const report = await planner.preview({
      capability: "embedding",
      manifest: manifest()
    });

    expect(report).toMatchObject({
      allowed: false,
      reasons: [
        "No available inference provider is configured for the requested capability."
      ]
    });
  });

  it("allows preflight with a matching available provider and resources", async () => {
    const planner = new PolicyInferenceExecutionPlanner({
      inferenceProviderRegistry: new StaticInferenceProviderRegistry([
        availableProvider()
      ]),
      resourceScheduler: new InMemoryResourceScheduler({
        device: device({ availableMemoryBytes: gib(8) })
      })
    });

    await expect(
      planner.preview({
        capability: "embedding",
        manifest: manifest({ minMemoryBytes: gib(1) })
      })
    ).resolves.toMatchObject({
      allowed: true,
      reasons: []
    });
  });

  it("blocks preflight for capability mismatch", async () => {
    const planner = new PolicyInferenceExecutionPlanner({
      inferenceProviderRegistry: new StaticInferenceProviderRegistry([
        availableProvider()
      ]),
      resourceScheduler: new InMemoryResourceScheduler({
        device: device({ availableMemoryBytes: gib(1) })
      })
    });

    const report = await planner.preview({
      capability: "embedding",
      manifest: manifest({
        capability: "ocr",
        minMemoryBytes: gib(2)
      })
    });

    expect(report.allowed).toBe(false);
    expect(report.reasons.join(" ")).toContain("capability");
  });

  it("blocks preflight when resources are unavailable", async () => {
    const planner = new PolicyInferenceExecutionPlanner({
      inferenceProviderRegistry: new StaticInferenceProviderRegistry([
        availableProvider()
      ]),
      resourceScheduler: new InMemoryResourceScheduler({
        device: device({ availableMemoryBytes: gib(1) })
      })
    });

    const report = await planner.preview({
      capability: "embedding",
      manifest: manifest({
        minMemoryBytes: gib(2)
      })
    });

    expect(report.allowed).toBe(false);
    expect(report.reasons).toEqual(["RESOURCE_MEMORY_UNAVAILABLE"]);
  });
});

function availableProvider(): InferenceProviderDescriptor {
  return {
    capability: "embedding",
    provider: "embedding.fake",
    status: "available",
    execution: "local",
    modelIds: ["jarvis-fixture/local-embedding-smoke"],
    reasons: []
  };
}

function manifest(overrides: Partial<ModelManifest> = {}): ModelManifest {
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
    ...overrides
  };
}

function device(
  overrides: {
    availableMemoryBytes?: number;
  } = {}
): DeviceCapability {
  const totalMemoryBytes = gib(16);
  return {
    checkedAt: "2026-07-31T00:00:00.000Z",
    platform: "win32",
    arch: "x64",
    cpuLogicalCores: 16,
    totalMemoryBytes,
    availableMemoryBytes: overrides.availableMemoryBytes ?? gib(8),
    gpus: [],
    accelerationBackends: ["cpu"],
    recommendedMode: "standard",
    reasons: []
  };
}

function gib(value: number): number {
  return value * 1024 * 1024 * 1024;
}
