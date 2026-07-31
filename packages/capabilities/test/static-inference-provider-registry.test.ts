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

  it("lists defensive provider configuration requirement copies", async () => {
    const registry = new StaticInferenceProviderRegistry(descriptors, [
      {
        capability: "embedding",
        provider: "embedding.unconfigured",
        status: "unconfigured",
        requirements: [
          {
            key: "runtime_adapter",
            source: "runtime",
            required: true,
            configured: false,
            reasons: ["No embedding provider has been composed."]
          }
        ],
        reasons: ["Provider is not configured."]
      }
    ]);
    const first = (await registry.listConfigurationRequirements())[0];

    first?.requirements[0]?.reasons.push("mutated");
    first?.reasons.push("mutated");

    await expect(registry.listConfigurationRequirements()).resolves.toEqual([
      expect.objectContaining({
        provider: "embedding.unconfigured",
        requirements: [
          expect.objectContaining({
            key: "runtime_adapter",
            reasons: ["No embedding provider has been composed."]
          })
        ],
        reasons: ["Provider is not configured."]
      })
    ]);
  });

  it("synthesizes empty configuration reports from descriptors", async () => {
    const registry = new StaticInferenceProviderRegistry(descriptors);

    await expect(
      registry.listConfigurationRequirements({ capability: "ocr" })
    ).resolves.toEqual([
      expect.objectContaining({
        capability: "ocr",
        provider: "ocr.unconfigured",
        requirements: []
      })
    ]);
  });
});
