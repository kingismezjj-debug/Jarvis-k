import type { EmbeddingInferenceProvider } from "@jarvis-k/capabilities";
import type {
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult
} from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import { describe, expect, it } from "vitest";
import type {
  EmbeddingMemoryQuery,
  EmbeddingMemoryRetrievalResult
} from "@jarvis-k/memory";
import type { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "../src/core-memory-retrieval-env-wiring-approval-gate";
import {
  CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_MODEL_ID,
  createCoreHostMemoryRetrievalEnvWiring,
  isMemoryRetrievalProviderQueryVectorOptInEnabled,
  isMemoryRetrievalRoutingOptInEnabled
} from "../src/core-memory-retrieval-env-wiring";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "../src/local-embedding-composition";
import { LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV } from "../src/local-embedding-runtime-session-factory";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "../src/memory-retrieval-provider-query-vector-approval-gate";

describe("Core Host memory retrieval env wiring", () => {
  it("keeps Memory retrieval wiring disabled by default", () => {
    const repository = new FakeSqliteMemoryRepository();
    const wiring = createCoreHostMemoryRetrievalEnvWiring({
      env: {},
      memoryRepository: repository.asRepository()
    });

    expect(isMemoryRetrievalRoutingOptInEnabled({})).toBe(false);
    expect(wiring).toEqual({
      enabled: false
    });
    expect(repository.calls).toBe(0);
  });

  it("enables fixture-only routing only with explicit env opt-in", async () => {
    const repository = new FakeSqliteMemoryRepository();
    const wiring = createCoreHostMemoryRetrievalEnvWiring({
      env: {
        [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: " 1 "
      },
      memoryRepository: repository.asRepository()
    });

    expect(
      isMemoryRetrievalRoutingOptInEnabled({
        [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: " 1 "
      })
    ).toBe(true);
    expect(wiring.enabled).toBe(true);
    expect(wiring.routingOptions).toMatchObject({
      enabled: true,
      modelId: CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_MODEL_ID,
      limit: 5
    });

    const vector = await wiring.routingOptions?.resolveQueryVector({
      messageId: "msg-1",
      conversationId: "primary",
      createdAt: "2026-08-03T00:00:00.000Z",
      queryText: "Fixture routing should ignore this text."
    });
    expect(vector).toEqual([1, 0, 0]);

    const result = await wiring.retrievalPort?.retrieve({
      modelId: CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_MODEL_ID,
      vector: [1, 0, 0],
      limit: 5,
      conversationId: "primary"
    });
    expect(repository.calls).toBe(1);
    expect(repository.lastQuery).toEqual({
      modelId: CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_MODEL_ID,
      vector: [1, 0, 0],
      limit: 5,
      conversationId: "primary"
    });
    expect(result).toMatchObject({
      status: "ok",
      modelId: CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_MODEL_ID,
      queryDimensions: 3,
      matches: []
    });
    expect(JSON.stringify(wiring)).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("uses provider-backed query vectors only when every explicit opt-in gate is enabled", async () => {
    const repository = new FakeSqliteMemoryRepository();
    const embeddingProvider = new FakeEmbeddingInferenceProvider();
    const wiring = createCoreHostMemoryRetrievalEnvWiring({
      env: {
        [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
        [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
        [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
        [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1"
      },
      memoryRepository: repository.asRepository(),
      embeddingProvider
    });
    const rawText = `  Find\tthis recall topic.\n${"x".repeat(2_200)}  `;

    expect(
      isMemoryRetrievalProviderQueryVectorOptInEnabled({
        [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: " 1 "
      })
    ).toBe(true);
    const vector = await wiring.routingOptions?.resolveQueryVector({
      messageId: "msg-provider",
      conversationId: "primary",
      createdAt: "2026-08-03T00:00:00.000Z",
      queryText: rawText
    });

    expect(vector).toEqual([0.25, 0.5, 0.75]);
    expect(embeddingProvider.calls).toBe(1);
    expect(embeddingProvider.lastRequest).toEqual({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      inputs: [
        {
          id: "msg-provider",
          text: expect.stringMatching(/^Find this recall topic\. x/u)
        }
      ]
    });
    expect(embeddingProvider.lastRequest?.inputs[0]?.text.length).toBeLessThanOrEqual(
      2_000
    );
    expect(JSON.stringify({ vector })).not.toContain(rawText);
  });

  it("fails closed when provider-backed query vectors are opted in without provider execution gates", async () => {
    const repository = new FakeSqliteMemoryRepository();
    const embeddingProvider = new FakeEmbeddingInferenceProvider();
    const wiring = createCoreHostMemoryRetrievalEnvWiring({
      env: {
        [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
        [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
        [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
        [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "0"
      },
      memoryRepository: repository.asRepository(),
      embeddingProvider
    });

    await expect(
      wiring.routingOptions?.resolveQueryVector({
        messageId: "msg-provider",
        conversationId: "primary",
        createdAt: "2026-08-03T00:00:00.000Z",
        queryText: "Do not route without all gates."
      })
    ).rejects.toThrow("MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_UNAVAILABLE");
    expect(embeddingProvider.calls).toBe(0);
    expect(repository.calls).toBe(0);
  });

  it("fails closed for invalid provider query text and invalid provider vectors", async () => {
    const repository = new FakeSqliteMemoryRepository();
    const embeddingProvider = new FakeEmbeddingInferenceProvider();
    const wiring = createCoreHostMemoryRetrievalEnvWiring({
      env: {
        [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
        [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
        [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
        [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1"
      },
      memoryRepository: repository.asRepository(),
      embeddingProvider
    });

    await expect(
      wiring.routingOptions?.resolveQueryVector({
        messageId: "msg-empty",
        conversationId: "primary",
        createdAt: "2026-08-03T00:00:00.000Z",
        queryText: " \n\t "
      })
    ).rejects.toThrow("MEMORY_RETRIEVAL_PROVIDER_QUERY_TEXT_INVALID");
    expect(embeddingProvider.calls).toBe(0);

    embeddingProvider.vector = [Number.NaN];
    await expect(
      wiring.routingOptions?.resolveQueryVector({
        messageId: "msg-invalid-vector",
        conversationId: "primary",
        createdAt: "2026-08-03T00:00:00.000Z",
        queryText: "Valid query text"
      })
    ).rejects.toThrow("MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_INVALID");
  });

  it("rejects non-exact opt-in values without creating a port", () => {
    const repository = new FakeSqliteMemoryRepository();
    for (const value of ["", "true", "0", "2", "yes"]) {
      const wiring = createCoreHostMemoryRetrievalEnvWiring({
        env: {
          [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: value
        },
        memoryRepository: repository.asRepository()
      });

      expect(wiring.enabled).toBe(false);
      expect(wiring.retrievalPort).toBeUndefined();
      expect(wiring.routingOptions).toBeUndefined();
    }
    expect(repository.calls).toBe(0);
  });
});

class FakeSqliteMemoryRepository {
  public calls = 0;
  public lastQuery: EmbeddingMemoryQuery | undefined;

  public asRepository(): SqliteMemoryRepository {
    return this as unknown as SqliteMemoryRepository;
  }

  public async querySimilar(
    query: EmbeddingMemoryQuery
  ): Promise<EmbeddingMemoryRetrievalResult> {
    this.calls += 1;
    this.lastQuery = { ...query, vector: [...query.vector] };
    return {
      status: "ok",
      modelId: query.modelId,
      queryDimensions: query.vector.length,
      matches: [],
      generatedAt: "2026-08-03T00:00:00.000Z"
    };
  }
}

class FakeEmbeddingInferenceProvider implements EmbeddingInferenceProvider {
  public calls = 0;
  public lastRequest: EmbeddingGenerationRequest | undefined;
  public vector: number[] = [0.25, 0.5, 0.75];

  public async embed(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    this.calls += 1;
    this.lastRequest = {
      ...request,
      inputs: request.inputs.map((input) => ({ ...input }))
    };
    return {
      modelId: request.modelId,
      dimensions: this.vector.length,
      vectors: [
        {
          inputId: request.inputs[0]?.id,
          values: [...this.vector]
        }
      ],
      generatedAt: "2026-08-03T00:00:00.000Z"
    };
  }
}
