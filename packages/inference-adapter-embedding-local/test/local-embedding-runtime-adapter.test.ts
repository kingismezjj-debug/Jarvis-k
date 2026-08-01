import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingRuntimeAdapterDescriptor,
  LOCAL_EMBEDDING_PLANNED_RUNTIME,
  UnavailableLocalEmbeddingRuntimeAdapter
} from "../src";
import type { ModelManifest } from "@jarvis-k/contracts";

describe("local embedding runtime adapter", () => {
  it("exposes a planning-only runtime descriptor", () => {
    expect(createLocalEmbeddingRuntimeAdapterDescriptor()).toMatchObject({
      runtime: LOCAL_EMBEDDING_PLANNED_RUNTIME,
      capabilities: ["embedding"],
      accelerationBackends: [],
      notes: [
        "Planning-only descriptor; no Transformers runtime dependency is installed.",
        "Do not compose until model, packaging, redistribution, and benchmark gates pass."
      ]
    });
  });

  it("cannot load a model before the concrete runtime is composed", () => {
    const adapter = new UnavailableLocalEmbeddingRuntimeAdapter();

    expect(adapter.canLoad(manifest())).toBe(false);
  });

  it("fails closed without exposing runtime details", async () => {
    const adapter = new UnavailableLocalEmbeddingRuntimeAdapter();

    await expect(adapter.load({ manifest: manifest(), inventoryItem: {
      manifest: manifest(),
      status: "available",
      installPath: "C:\\models\\fixture.bin",
      lastVerifiedAt: "2026-08-01T00:00:00.000Z"
    }, device: device() })).rejects.toThrow(
      "Local embedding runtime adapter is not configured."
    );
  });
});

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
    minMemoryBytes: 512 * 1024 * 1024,
    licenseRisk: "green"
  };
}

function device() {
  return {
    checkedAt: "2026-08-01T00:00:00.000Z",
    platform: "win32" as const,
    arch: "x64" as const,
    cpuLogicalCores: 8,
    totalMemoryBytes: 8 * 1024 * 1024 * 1024,
    availableMemoryBytes: 4 * 1024 * 1024 * 1024,
    gpus: [],
    accelerationBackends: ["cpu" as const],
    recommendedMode: "standard" as const,
    reasons: []
  };
}
