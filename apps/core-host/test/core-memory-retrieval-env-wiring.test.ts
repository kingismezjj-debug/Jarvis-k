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
  isMemoryRetrievalRoutingOptInEnabled
} from "../src/core-memory-retrieval-env-wiring";

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
      createdAt: "2026-08-03T00:00:00.000Z"
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
