import { describe, expect, it } from "vitest";
import {
  createFixtureEmbeddingProviderConfigurationReport,
  createFixtureEmbeddingProviderDescriptor,
  FIXTURE_EMBEDDING_MODEL_ID,
  FIXTURE_EMBEDDING_PROVIDER_ID,
  FixtureEmbeddingProvider
} from "../src";

describe("FixtureEmbeddingProvider", () => {
  it("reports unavailable until the explicit fixture flag is enabled", () => {
    expect(
      createFixtureEmbeddingProviderDescriptor({ enabled: false })
    ).toMatchObject({
      capability: "embedding",
      provider: FIXTURE_EMBEDDING_PROVIDER_ID,
      status: "unconfigured",
      execution: "disabled",
      modelIds: []
    });
    expect(
      createFixtureEmbeddingProviderConfigurationReport({ enabled: false })
    ).toMatchObject({
      status: "unconfigured",
      requirements: [
        {
          key: "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
          source: "environment",
          required: true,
          configured: false
        }
      ]
    });
  });

  it("reports an available local embedding provider when explicitly enabled", () => {
    expect(
      createFixtureEmbeddingProviderDescriptor({ enabled: true })
    ).toMatchObject({
      capability: "embedding",
      provider: FIXTURE_EMBEDDING_PROVIDER_ID,
      status: "available",
      execution: "local",
      modelIds: [FIXTURE_EMBEDDING_MODEL_ID],
      reasons: []
    });
    expect(
      createFixtureEmbeddingProviderConfigurationReport({ enabled: true })
    ).toMatchObject({
      status: "available",
      requirements: [
        {
          key: "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
          configured: true,
          reasons: []
        }
      ],
      reasons: []
    });
  });

  it("generates deterministic fixture vectors without model runtime dependencies", async () => {
    const provider = new FixtureEmbeddingProvider({
      now: () => new Date("2026-07-31T00:00:00.000Z")
    });

    const first = await provider.embed({
      modelId: FIXTURE_EMBEDDING_MODEL_ID,
      inputs: [{ id: "input-1", text: "phase five fixture" }],
      dimensions: 4
    });
    const second = await provider.embed({
      modelId: FIXTURE_EMBEDDING_MODEL_ID,
      inputs: [{ id: "input-1", text: "phase five fixture" }],
      dimensions: 4
    });

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      modelId: FIXTURE_EMBEDDING_MODEL_ID,
      dimensions: 4,
      generatedAt: "2026-07-31T00:00:00.000Z",
      vectors: [
        {
          inputId: "input-1"
        }
      ]
    });
    expect(first.vectors[0]?.values).toHaveLength(4);
  });

  it("fails when asked to serve an unbound model", async () => {
    const provider = new FixtureEmbeddingProvider();

    await expect(
      provider.embed({
        modelId: "vendor/other-model",
        inputs: [{ text: "not bound" }]
      })
    ).rejects.toThrow("Fixture embedding provider is not bound to this model.");
  });
});
