import { describe, expect, it } from "vitest";
import { StaticInferenceProviderRegistry } from "../src";
import type { InferenceProviderDescriptor } from "@jarvis-k/contracts";

const descriptors: InferenceProviderDescriptor[] = [
  {
    capability: "embedding",
    provider: "embedding.unconfigured",
    status: "unconfigured",
    execution: "disabled",
    modelIds: [],
    reasons: ["No embedding provider has been composed."]
  },
  {
    capability: "ocr",
    provider: "ocr.unconfigured",
    status: "unconfigured",
    execution: "disabled",
    modelIds: [],
    reasons: ["No OCR provider has been composed."]
  }
];

describe("StaticInferenceProviderRegistry", () => {
  it("lists defensive inference provider descriptor copies", async () => {
    const registry = new StaticInferenceProviderRegistry(descriptors);
    const first = (await registry.listProviders())[0];

    first?.reasons.push("mutated");

    expect((await registry.listProviders())[0]?.reasons).toEqual([
      "No embedding provider has been composed."
    ]);
  });

  it("filters descriptors by capability", async () => {
    const registry = new StaticInferenceProviderRegistry(descriptors);

    await expect(
      registry.listProviders({ capability: "ocr" })
    ).resolves.toEqual([
      expect.objectContaining({
        capability: "ocr",
        provider: "ocr.unconfigured"
      })
    ]);
  });
});
