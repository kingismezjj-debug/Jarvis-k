import { describe, expect, it } from "vitest";
import {
  createFixtureEmbeddingProviderConfigurationReport,
  createFixtureEmbeddingProviderDescriptor,
  FIXTURE_EMBEDDING_MODEL_ID,
  FIXTURE_EMBEDDING_PROVIDER_ID,
  FixtureEmbeddingProvider
} from "../src";
import {
  createFixtureIntentRouterConfigurationReport,
  createFixtureIntentRouterDescriptor,
  FIXTURE_INTENT_ROUTER_MODEL_ID,
  FIXTURE_INTENT_ROUTER_PROVIDER_ID,
  FixtureIntentRoutingProvider
} from "../src";
import {
  createFixtureOcrConfigurationReport,
  createFixtureOcrDescriptor,
  FIXTURE_OCR_MODEL_ID,
  FIXTURE_OCR_PROVIDER_ID,
  FixtureOcrProvider
} from "../src";
import {
  createFixtureRerankerConfigurationReport,
  createFixtureRerankerDescriptor,
  FIXTURE_RERANKER_MODEL_ID,
  FIXTURE_RERANKER_PROVIDER_ID,
  FixtureRerankingProvider
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

  it("routes deterministic intent fixtures with explicit availability reports", async () => {
    expect(
      createFixtureIntentRouterDescriptor({ enabled: true })
    ).toMatchObject({
      capability: "intent_router",
      provider: FIXTURE_INTENT_ROUTER_PROVIDER_ID,
      status: "available",
      modelIds: [FIXTURE_INTENT_ROUTER_MODEL_ID]
    });
    expect(
      createFixtureIntentRouterConfigurationReport({ enabled: false })
    ).toMatchObject({
      capability: "intent_router",
      status: "unconfigured",
      requirements: [
        {
          key: "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
          configured: false
        }
      ]
    });

    const provider = new FixtureIntentRoutingProvider({
      now: () => new Date("2026-07-31T00:00:00.000Z")
    });
    await expect(
      provider.route({
        modelId: FIXTURE_INTENT_ROUTER_MODEL_ID,
        utterance: "search memory"
      })
    ).resolves.toMatchObject({
      modelId: FIXTURE_INTENT_ROUTER_MODEL_ID,
      candidates: [
        {
          intent: "memory.search",
          confidence: 0.98
        }
      ],
      routedAt: "2026-07-31T00:00:00.000Z"
    });
  });

  it("recognizes deterministic OCR fixtures from binary image input", async () => {
    expect(createFixtureOcrDescriptor({ enabled: true })).toMatchObject({
      capability: "ocr",
      provider: FIXTURE_OCR_PROVIDER_ID,
      status: "available",
      modelIds: [FIXTURE_OCR_MODEL_ID]
    });
    expect(
      createFixtureOcrConfigurationReport({ enabled: false })
    ).toMatchObject({
      capability: "ocr",
      status: "unconfigured",
      requirements: [
        {
          key: "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
          configured: false
        }
      ]
    });

    const provider = new FixtureOcrProvider({
      now: () => new Date("2026-07-31T00:00:00.000Z")
    });
    await expect(
      provider.recognize({
        modelId: FIXTURE_OCR_MODEL_ID,
        image: {
          id: "fixture-image",
          mimeType: "image/png",
          bytes: new Uint8Array([137, 80, 78, 71]),
          width: 1,
          height: 1
        }
      })
    ).resolves.toMatchObject({
      modelId: FIXTURE_OCR_MODEL_ID,
      imageId: "fixture-image",
      text: "fixture ocr text",
      blocks: [
        {
          text: "fixture ocr text",
          confidence: 0.99,
          boundingBox: {
            x: 0.1,
            y: 0.1,
            width: 0.8,
            height: 0.2
          }
        }
      ],
      recognizedAt: "2026-07-31T00:00:00.000Z"
    });
  });

  it("reranks deterministic fixture documents with explicit availability reports", async () => {
    expect(createFixtureRerankerDescriptor({ enabled: true })).toMatchObject({
      capability: "reranker",
      provider: FIXTURE_RERANKER_PROVIDER_ID,
      status: "available",
      modelIds: [FIXTURE_RERANKER_MODEL_ID]
    });
    expect(
      createFixtureRerankerConfigurationReport({ enabled: false })
    ).toMatchObject({
      capability: "reranker",
      status: "unconfigured",
      requirements: [
        {
          key: "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
          configured: false
        }
      ]
    });

    const provider = new FixtureRerankingProvider({
      now: () => new Date("2026-07-31T00:00:00.000Z")
    });
    await expect(
      provider.rerank({
        modelId: FIXTURE_RERANKER_MODEL_ID,
        query: "model ports",
        documents: [
          {
            id: "doc-model-ports",
            text: "Core uses injected model ports for inference."
          },
          {
            id: "doc-voice-settings",
            text: "Desktop owns safeStorage voice settings."
          }
        ],
        topK: 1
      })
    ).resolves.toMatchObject({
      modelId: FIXTURE_RERANKER_MODEL_ID,
      query: "model ports",
      results: [
        {
          documentId: "doc-model-ports",
          rank: 1
        }
      ],
      rankedAt: "2026-07-31T00:00:00.000Z"
    });
  });
});
