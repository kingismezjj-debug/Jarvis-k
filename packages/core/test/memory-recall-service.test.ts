import { describe, expect, it } from "vitest";
import type {
  EmbeddingMemoryRetrievalPort,
  EmbeddingMemoryRetrievalResult,
} from "@jarvis-k/memory";
import {
  MemoryRecallService,
  type CoreMemoryRetrievalRoutingOptions,
} from "../src/memory/memory-recall-service";

const message = {
  id: "msg-1",
  conversationId: "conversation-a",
  role: "user" as const,
  text: "  remember this\nwithout raw control chars  ",
  createdAt: "2026-08-14T00:00:00.000Z",
};

class RetrievalPort implements EmbeddingMemoryRetrievalPort {
  public calls = 0;
  public lastQuery:
    | Parameters<EmbeddingMemoryRetrievalPort["retrieve"]>[0]
    | undefined;
  public result: unknown = {
    status: "ok",
    modelId: "fixture/core-memory-retrieval",
    queryDimensions: 3,
    matches: [
      {
        id: "match-1",
        conversationId: "conversation-a",
        sourceType: "message",
        sourceId: "msg-source",
        modelId: "fixture/core-memory-retrieval",
        score: 0.91,
        createdAt: "2026-08-14T00:00:01.000Z",
      },
    ],
    generatedAt: "2026-08-14T00:00:02.000Z",
  } satisfies EmbeddingMemoryRetrievalResult;
  public throwOnRetrieve = false;

  public async retrieve(
    input: Parameters<EmbeddingMemoryRetrievalPort["retrieve"]>[0],
  ): Promise<EmbeddingMemoryRetrievalResult> {
    this.calls += 1;
    this.lastQuery = input;
    if (this.throwOnRetrieve) {
      throw new Error("provider unavailable");
    }
    return this.result as EmbeddingMemoryRetrievalResult;
  }
}

function routing(
  overrides: Partial<CoreMemoryRetrievalRoutingOptions> = {},
): CoreMemoryRetrievalRoutingOptions {
  return {
    enabled: true,
    modelId: "fixture/core-memory-retrieval",
    resolveQueryVector: () => [1, 0, 0],
    ...overrides,
  };
}

function service(input: {
  port?: RetrievalPort | undefined;
  routing?: CoreMemoryRetrievalRoutingOptions | undefined;
} = {}) {
  return new MemoryRecallService({
    retrievalPort: input.port,
    routing: input.routing,
    now: () => new Date("2026-08-14T00:00:03.000Z"),
  });
}

describe("MemoryRecallService", () => {
  it("returns no observation when recall routing is disabled", async () => {
    const port = new RetrievalPort();
    const observation = await service({
      port,
      routing: routing({ enabled: false }),
    }).retrieveForAcceptedMessage(message);

    expect(observation).toBeUndefined();
    expect(port.calls).toBe(0);
  });

  it("returns sanitized fixture recall matches scoped to the conversation", async () => {
    const port = new RetrievalPort();
    const observation = await service({ port, routing: routing({ limit: 99 }) })
      .retrieveForAcceptedMessage(message);

    expect(port.lastQuery).toEqual({
      modelId: "fixture/core-memory-retrieval",
      vector: [1, 0, 0],
      limit: 5,
      conversationId: "conversation-a",
    });
    expect(observation).toMatchObject({
      status: "ok",
      mode: "fixture_only",
      injectedIntoTurnAssembly: true,
      matchCount: 1,
      matches: [
        {
          id: "match-1",
          conversationId: "conversation-a",
          sourceId: "msg-source",
        },
      ],
    });
  });

  it("keeps empty recall results successful without injection", async () => {
    const port = new RetrievalPort();
    port.result = {
      status: "ok",
      modelId: "fixture/core-memory-retrieval",
      queryDimensions: 3,
      matches: [],
      generatedAt: "2026-08-14T00:00:02.000Z",
    };

    await expect(
      service({ port, routing: routing() }).retrieveForAcceptedMessage(message),
    ).resolves.toMatchObject({
      status: "ok",
      injectedIntoTurnAssembly: false,
      matchCount: 0,
    });
  });

  it("fails closed when the retrieval port is unavailable", async () => {
    await expect(
      service({ routing: routing() }).retrieveForAcceptedMessage(message),
    ).resolves.toMatchObject({
      status: "degraded",
      reasonCode: "MEMORY_RETRIEVAL_PORT_UNAVAILABLE",
      matchCount: 0,
    });
  });

  it("degrades when the provider throws", async () => {
    const port = new RetrievalPort();
    port.throwOnRetrieve = true;

    await expect(
      service({ port, routing: routing() }).retrieveForAcceptedMessage(message),
    ).resolves.toMatchObject({
      status: "degraded",
      failureClass: "VECTOR_QUERY_EXECUTION_FAILED",
      reasonCode: "MEMORY_RETRIEVAL_ROUTING_FAILED",
    });
  });

  it("degrades invalid provider results", async () => {
    const port = new RetrievalPort();
    port.result = { status: "ok", modelId: "fixture/core-memory-retrieval" };

    await expect(
      service({ port, routing: routing() }).retrieveForAcceptedMessage(message),
    ).resolves.toMatchObject({
      status: "degraded",
      failureClass: "MEMORY_RETRIEVAL_ROUTING_FAILED",
      reasonCode: "MEMORY_RETRIEVAL_RESULT_INVALID",
    });
  });

  it("blocks provider-vector results that do not match the allowed model", async () => {
    const port = new RetrievalPort();
    port.result = {
      status: "ok",
      modelId: "fixture/core-memory-retrieval",
      queryDimensions: 3,
      matches: [],
      generatedAt: "2026-08-14T00:00:02.000Z",
    };

    await expect(
      service({
        port,
        routing: routing({
          mode: "provider_vector",
          modelId: "Qwen/Qwen3-Embedding-0.6B",
          allowedModelId: "Qwen/Qwen3-Embedding-0.6B",
          resolveQueryVector: () => [0.2, 0.4, 0.6],
        }),
      }).retrieveForAcceptedMessage(message),
    ).resolves.toMatchObject({
      status: "degraded",
      mode: "provider_vector",
      modelId: "blocked",
      reasonCode: "MEMORY_RETRIEVAL_RESULT_MODEL_BLOCKED",
    });
  });
});
