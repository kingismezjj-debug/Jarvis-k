import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingProviderConfigurationReport,
  createLocalEmbeddingProviderDescriptor,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  UnavailableLocalEmbeddingProvider
} from "../src";

describe("local embedding readiness provider", () => {
  it("reports the planned provider as unconfigured and disabled", () => {
    expect(createLocalEmbeddingProviderDescriptor()).toMatchObject({
      capability: "embedding",
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      status: "unconfigured",
      execution: "disabled",
      modelIds: [LOCAL_EMBEDDING_MODEL_ID]
    });
  });

  it("lists all blocking gates before real execution can be enabled", () => {
    expect(
      createLocalEmbeddingProviderConfigurationReport()
    ).toMatchObject({
      capability: "embedding",
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      status: "unconfigured",
      requirements: [
        { key: "model.revision", configured: false },
        { key: "model.artifact_sha256", configured: false },
        { key: "runtime.adapter", configured: false },
        { key: "runtime.packaging", configured: false },
        { key: "license.redistribution_review", configured: false },
        { key: "benchmarks.local_resource_profile", configured: false }
      ]
    });
  });

  it("fails closed instead of executing a local model", async () => {
    const provider = new UnavailableLocalEmbeddingProvider();

    await expect(
      provider.embed({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        inputs: [{ text: "phase six readiness" }]
      })
    ).rejects.toThrow("Local embedding provider is not configured.");
  });
});
