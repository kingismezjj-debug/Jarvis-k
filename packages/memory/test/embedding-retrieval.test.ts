import { describe, expect, it } from "vitest";
import {
  EmbeddingMemoryQuerySchema,
  EmbeddingMemoryRetrievalResultSchema,
  type EmbeddingMemoryRecord,
  type EmbeddingMemoryRetrievalPort
} from "../src";

const records: EmbeddingMemoryRecord[] = [
  {
    id: "memory-1",
    conversationId: "primary",
    sourceType: "message",
    sourceId: "message-1",
    modelId: "fixture/embedding",
    dimensions: 2,
    vector: [1, 0],
    createdAt: "2026-08-01T00:00:00.000Z"
  },
  {
    id: "memory-2",
    conversationId: "primary",
    sourceType: "summary",
    sourceId: "summary-1",
    modelId: "fixture/embedding",
    dimensions: 2,
    vector: [0, 1],
    createdAt: "2026-08-01T00:00:01.000Z"
  }
];

describe("embedding memory retrieval contract", () => {
  it("accepts bounded provider-neutral queries and sanitized matches", async () => {
    const executor: EmbeddingMemoryRetrievalPort =
      new FixtureEmbeddingMemoryRetrieval(records);
    const result = await executor.retrieve({
      modelId: "fixture/embedding",
      vector: [1, 0],
      limit: 2,
      minScore: 0
    });

    expect(result).toMatchObject({
      status: "ok",
      modelId: "fixture/embedding",
      queryDimensions: 2
    });
    expect(result.matches.map((match) => match.id)).toEqual([
      "memory-1",
      "memory-2"
    ]);
    expect(result.matches[0]?.score).toBeCloseTo(1);
    expect(result).not.toHaveProperty("vector");
    expect(result).not.toHaveProperty("text");
  });

  it("keeps retrieval deterministic and bounded by conversation and limit", async () => {
    const executor: EmbeddingMemoryRetrievalPort =
      new FixtureEmbeddingMemoryRetrieval([
        ...records,
        {
          id: "memory-3",
          conversationId: "other",
          sourceType: "message",
          sourceId: "message-3",
          modelId: "fixture/embedding",
          dimensions: 2,
          vector: [1, 0],
          createdAt: "2026-08-01T00:00:02.000Z"
        }
      ]);

    const result = await executor.retrieve({
      modelId: "fixture/embedding",
      vector: [1, 0],
      limit: 1,
      conversationId: "primary"
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.id).toBe("memory-1");
    expect(result.matches[0]?.conversationId).toBe("primary");
  });

  it("returns a sanitized degraded result when no record matches", async () => {
    const executor: EmbeddingMemoryRetrievalPort =
      new FixtureEmbeddingMemoryRetrieval(records);
    const result = await executor.retrieve({
      modelId: "fixture/unknown",
      vector: [1, 0],
      limit: 3
    });

    expect(result).toEqual({
      status: "degraded",
      modelId: "fixture/unknown",
      queryDimensions: 2,
      matches: [],
      reasonCode: "NO_MATCHES",
      generatedAt: "2026-08-01T00:00:00.000Z"
    });
  });

  it("rejects vector dimension mismatches and unsafe result shapes", () => {
    expect(() =>
      EmbeddingMemoryQuerySchema.parse({
        modelId: "fixture/embedding",
        vector: [],
        limit: 1
      })
    ).toThrow();

    expect(() =>
      EmbeddingMemoryRetrievalResultSchema.parse({
        status: "ok",
        modelId: "fixture/embedding",
        queryDimensions: 2,
        matches: [
          {
            id: "memory-1",
            conversationId: "primary",
            sourceType: "message",
            sourceId: "message-1",
            modelId: "fixture/other",
            score: 1,
            createdAt: "2026-08-01T00:00:00.000Z"
          }
        ],
        generatedAt: "2026-08-01T00:00:00.000Z"
      })
    ).toThrow();
  });
});

class FixtureEmbeddingMemoryRetrieval
  implements EmbeddingMemoryRetrievalPort
{
  public constructor(private readonly records: EmbeddingMemoryRecord[]) {}

  public async retrieve(queryInput: Parameters<
    EmbeddingMemoryRetrievalPort["retrieve"]
  >[0]) {
    const query = EmbeddingMemoryQuerySchema.parse(queryInput);
    const matches = this.records
      .filter(
        (record) =>
          record.modelId === query.modelId &&
          (query.conversationId === undefined ||
            record.conversationId === query.conversationId) &&
          record.dimensions === query.vector.length
      )
      .map((record) => ({
        record,
        score: cosineSimilarity(record.vector, query.vector)
      }))
      .filter(
        (candidate) =>
          query.minScore === undefined || candidate.score >= query.minScore
      )
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.record.createdAt.localeCompare(left.record.createdAt) ||
          left.record.id.localeCompare(right.record.id)
      )
      .slice(0, query.limit)
      .map(({ record, score }) => ({
        id: record.id,
        conversationId: record.conversationId,
        sourceType: record.sourceType,
        sourceId: record.sourceId,
        modelId: record.modelId,
        score,
        createdAt: record.createdAt
      }));

    if (matches.length === 0) {
      return EmbeddingMemoryRetrievalResultSchema.parse({
        status: "degraded",
        modelId: query.modelId,
        queryDimensions: query.vector.length,
        matches: [],
        reasonCode: "NO_MATCHES",
        generatedAt: "2026-08-01T00:00:00.000Z"
      });
    }

    return EmbeddingMemoryRetrievalResultSchema.parse({
      status: "ok",
      modelId: query.modelId,
      queryDimensions: query.vector.length,
      matches,
      generatedAt: "2026-08-01T00:00:00.000Z"
    });
  }
}

function cosineSimilarity(left: number[], right: number[]): number {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}
