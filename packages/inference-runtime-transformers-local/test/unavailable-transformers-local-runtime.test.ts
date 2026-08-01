import { describe, expect, it } from "vitest";
import type { ModelManifest } from "@jarvis-k/contracts";
import {
  createTransformersLocalRuntimeDescriptor,
  createTransformersLocalRuntimeHealth,
  createUnavailableTransformersLocalRuntimeAdapter,
  mapTransformersLocalRuntimeError,
  TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
  TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_LOCATION,
  TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
  TRANSFORMERS_LOCAL_RUNTIME_UNAVAILABLE_REASON
} from "../src";

describe("unavailable Transformers local runtime scaffold", () => {
  it("exposes only a sanitized fake runtime descriptor and health report", () => {
    const descriptor = createTransformersLocalRuntimeDescriptor();
    const health = createTransformersLocalRuntimeHealth();
    const serialized = JSON.stringify({ descriptor, health });

    expect(descriptor).toMatchObject({
      runtime: "transformers",
      capabilities: ["embedding"],
      accelerationBackends: []
    });
    expect(health).toMatchObject({
      packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
      packageLocation: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_LOCATION,
      compositionRoot: TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
      status: "unavailable",
      packageScaffolded: true,
      fakeRuntimeOnly: true,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      modelArtifactsAccessed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("C:\\");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });

  it("fails closed instead of loading a local model", async () => {
    const runtime = createUnavailableTransformersLocalRuntimeAdapter();

    expect(runtime.canLoad(createManifest())).toBe(false);
    await expect(
      runtime.load({
        manifest: createManifest(),
        resourceLeaseId: "test-resource-lease"
      })
    ).rejects.toThrow(TRANSFORMERS_LOCAL_RUNTIME_UNAVAILABLE_REASON);
  });

  it("maps arbitrary runtime errors to a sanitized unavailable error", () => {
    expect(
      mapTransformersLocalRuntimeError(
        new Error("raw helper failure with local paths")
      )
    ).toEqual({
      code: "runtime_unavailable",
      message: TRANSFORMERS_LOCAL_RUNTIME_UNAVAILABLE_REASON,
      recoverable: true
    });
  });
});

function createManifest(): ModelManifest {
  return {
    id: "test.embedding.model",
    capability: "embedding",
    source: "jarvis",
    revision: "test-revision",
    license: "Apache-2.0",
    runtime: "transformers",
    sizeBytes: 0,
    licenseRisk: "yellow"
  };
}
