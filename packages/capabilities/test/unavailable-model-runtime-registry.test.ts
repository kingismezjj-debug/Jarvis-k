import { describe, expect, it } from "vitest";
import {
  runtimeUnsupportedReason,
  UnavailableModelRuntimeRegistry
} from "../src";
import type { ModelManifest } from "@jarvis-k/contracts";

describe("UnavailableModelRuntimeRegistry", () => {
  it("does not advertise runtime adapters before real runtimes are composed", async () => {
    const registry = new UnavailableModelRuntimeRegistry();

    await expect(registry.listDescriptors()).resolves.toEqual([]);
    await expect(registry.getAdapter(manifest())).resolves.toBeUndefined();
  });

  it("formats runtime unsupported reasons without provider details", () => {
    expect(runtimeUnsupportedReason("onnxruntime")).toBe(
      "Model runtime 'onnxruntime' is not configured."
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
