import { describe, expect, it } from "vitest";
import {
  createEmbeddingMemoryRetrievalBenchmarkPlan,
  createEmbeddingMemoryRetrievalBenchmarkPolicy,
  evaluateEmbeddingMemoryRetrievalFixtureBenchmark
} from "../src";

const benchmarkCases = [
  {
    id: "case-1",
    k: 2,
    expectedSourceIds: ["message-1", "summary-1"],
    result: {
      status: "ok" as const,
      modelId: "fixture/embedding",
      queryDimensions: 2,
      matches: [
        {
          id: "memory-1",
          conversationId: "primary",
          sourceType: "message" as const,
          sourceId: "message-1",
          modelId: "fixture/embedding",
          score: 1,
          createdAt: "2026-08-01T00:00:00.000Z"
        },
        {
          id: "memory-2",
          conversationId: "primary",
          sourceType: "summary" as const,
          sourceId: "summary-1",
          modelId: "fixture/embedding",
          score: 0.75,
          createdAt: "2026-08-01T00:00:01.000Z"
        }
      ],
      generatedAt: "2026-08-01T00:00:02.000Z"
    }
  },
  {
    id: "case-2",
    k: 1,
    expectedSourceIds: ["message-missing"],
    result: {
      status: "degraded" as const,
      modelId: "fixture/embedding",
      queryDimensions: 2,
      matches: [],
      reasonCode: "NO_MATCHES",
      generatedAt: "2026-08-01T00:00:03.000Z"
    }
  }
];

describe("embedding memory retrieval benchmark harness", () => {
  it("defines a fixture-only, non-persisting benchmark policy", () => {
    const policy = createEmbeddingMemoryRetrievalBenchmarkPolicy();

    expect(policy).toMatchObject({
      fixtureOnly: true,
      executionDeferred: true,
      realRuntimeMetricsCaptured: false,
      metricValuesPersisted: false,
      rawTextIncluded: false,
      vectorValuesIncluded: false,
      maxCases: 100
    });
    expect(JSON.stringify(policy)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(policy)).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("plans and evaluates sanitized fixture cases", () => {
    const plan = createEmbeddingMemoryRetrievalBenchmarkPlan(benchmarkCases);
    const report =
      evaluateEmbeddingMemoryRetrievalFixtureBenchmark(benchmarkCases);

    expect(plan).toEqual({
      status: "ready_for_fixture_execution",
      caseCount: 2,
      fixtureOnly: true,
      executionDeferred: true,
      realRuntimeMetricsCaptured: false,
      metricValuesPersisted: false,
      rawTextIncluded: false,
      vectorValuesIncluded: false
    });
    expect(report).toEqual({
      status: "fixture_only",
      fixtureOnly: true,
      executionDeferred: true,
      realRuntimeMetricsCaptured: false,
      metricValuesPersisted: false,
      rawTextIncluded: false,
      vectorValuesIncluded: false,
      metrics: {
        caseCount: 2,
        degradedCaseCount: 1,
        recallAtK: 0.5,
        meanReciprocalRank: 0.5
      }
    });
  });

  it("keeps degraded retrieval results measurable without exposing input content", () => {
    const report = evaluateEmbeddingMemoryRetrievalFixtureBenchmark([
      {
        id: "case-degraded",
        k: 3,
        expectedSourceIds: ["secret-source"],
        result: {
          status: "degraded",
          modelId: "fixture/embedding",
          queryDimensions: 2,
          matches: [],
          reasonCode: "NO_MATCHES",
          generatedAt: "2026-08-01T00:00:00.000Z"
        }
      }
    ]);
    const serialized = JSON.stringify(report);

    expect(report.metrics).toEqual({
      caseCount: 1,
      degradedCaseCount: 1,
      recallAtK: 0,
      meanReciprocalRank: 0
    });
    expect(serialized).not.toContain("secret-source");
    expect(report).not.toHaveProperty("vectors");
    expect(report).not.toHaveProperty("rawText");
  });

  it("rejects duplicate expectations and malformed benchmark results", () => {
    expect(() =>
      createEmbeddingMemoryRetrievalBenchmarkPlan([
        {
          ...benchmarkCases[0],
          expectedSourceIds: ["message-1", "message-1"]
        }
      ])
    ).toThrow();

    expect(() =>
      evaluateEmbeddingMemoryRetrievalFixtureBenchmark([
        {
          ...benchmarkCases[0],
          result: {
            ...benchmarkCases[0].result,
            matches: [
              {
                ...benchmarkCases[0].result.matches[0],
                modelId: "fixture/other"
              }
            ]
          }
        }
      ])
    ).toThrow();
  });
});
