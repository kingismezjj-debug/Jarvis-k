import { z } from "zod";
import {
  EmbeddingMemoryRetrievalResultSchema,
  type EmbeddingMemoryRetrievalResult
} from "./embedding-retrieval";

const BenchmarkCaseIdSchema = z.string().min(1).max(128);

export const EmbeddingMemoryRetrievalBenchmarkCaseSchema = z
  .object({
    id: BenchmarkCaseIdSchema,
    k: z.number().int().min(1).max(50),
    expectedSourceIds: z.array(BenchmarkCaseIdSchema).min(1).max(50),
    result: EmbeddingMemoryRetrievalResultSchema
  })
  .strict()
  .superRefine((benchmarkCase, ctx) => {
    if (
      new Set(benchmarkCase.expectedSourceIds).size !==
      benchmarkCase.expectedSourceIds.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expectedSourceIds"],
        message: "Expected source IDs must be unique."
      });
    }
  });

export type EmbeddingMemoryRetrievalBenchmarkCase = z.infer<
  typeof EmbeddingMemoryRetrievalBenchmarkCaseSchema
>;

const BenchmarkCaseArraySchema = z
  .array(EmbeddingMemoryRetrievalBenchmarkCaseSchema)
  .min(1)
  .max(100);

export interface EmbeddingMemoryRetrievalBenchmarkPolicy {
  fixtureOnly: true;
  executionDeferred: true;
  realRuntimeMetricsCaptured: false;
  metricValuesPersisted: false;
  rawTextIncluded: false;
  vectorValuesIncluded: false;
  maxCases: 100;
}

export interface EmbeddingMemoryRetrievalBenchmarkPlan {
  status: "ready_for_fixture_execution";
  caseCount: number;
  fixtureOnly: true;
  executionDeferred: true;
  realRuntimeMetricsCaptured: false;
  metricValuesPersisted: false;
  rawTextIncluded: false;
  vectorValuesIncluded: false;
}

export interface EmbeddingMemoryRetrievalBenchmarkMetrics {
  caseCount: number;
  degradedCaseCount: number;
  recallAtK: number;
  meanReciprocalRank: number;
}

export interface EmbeddingMemoryRetrievalBenchmarkReport {
  status: "fixture_only";
  fixtureOnly: true;
  executionDeferred: true;
  realRuntimeMetricsCaptured: false;
  metricValuesPersisted: false;
  rawTextIncluded: false;
  vectorValuesIncluded: false;
  metrics: EmbeddingMemoryRetrievalBenchmarkMetrics;
}

export function createEmbeddingMemoryRetrievalBenchmarkPolicy(): EmbeddingMemoryRetrievalBenchmarkPolicy {
  return {
    fixtureOnly: true,
    executionDeferred: true,
    realRuntimeMetricsCaptured: false,
    metricValuesPersisted: false,
    rawTextIncluded: false,
    vectorValuesIncluded: false,
    maxCases: 100
  };
}

export function createEmbeddingMemoryRetrievalBenchmarkPlan(
  cases: unknown[]
): EmbeddingMemoryRetrievalBenchmarkPlan {
  const parsedCases = BenchmarkCaseArraySchema.parse(cases);
  return {
    status: "ready_for_fixture_execution",
    caseCount: parsedCases.length,
    fixtureOnly: true,
    executionDeferred: true,
    realRuntimeMetricsCaptured: false,
    metricValuesPersisted: false,
    rawTextIncluded: false,
    vectorValuesIncluded: false
  };
}

export function evaluateEmbeddingMemoryRetrievalFixtureBenchmark(
  cases: unknown[]
): EmbeddingMemoryRetrievalBenchmarkReport {
  const parsedCases = BenchmarkCaseArraySchema.parse(cases);
  let recallAtKTotal = 0;
  let reciprocalRankTotal = 0;
  let degradedCaseCount = 0;

  for (const benchmarkCase of parsedCases) {
    const topMatches = benchmarkCase.result.matches.slice(0, benchmarkCase.k);
    const expected = new Set(benchmarkCase.expectedSourceIds);
    const topSourceIds = topMatches.map((match) => match.sourceId);
    const relevantCount = benchmarkCase.expectedSourceIds.filter((sourceId) =>
      topSourceIds.includes(sourceId)
    ).length;
    recallAtKTotal += relevantCount / expected.size;

    const firstRelevantIndex = topSourceIds.findIndex((sourceId) =>
      expected.has(sourceId)
    );
    reciprocalRankTotal +=
      firstRelevantIndex === -1 ? 0 : 1 / (firstRelevantIndex + 1);

    if (benchmarkCase.result.status === "degraded") {
      degradedCaseCount += 1;
    }
  }

  return {
    status: "fixture_only",
    fixtureOnly: true,
    executionDeferred: true,
    realRuntimeMetricsCaptured: false,
    metricValuesPersisted: false,
    rawTextIncluded: false,
    vectorValuesIncluded: false,
    metrics: {
      caseCount: parsedCases.length,
      degradedCaseCount,
      recallAtK: roundMetric(recallAtKTotal / parsedCases.length),
      meanReciprocalRank: roundMetric(
        reciprocalRankTotal / parsedCases.length
      )
    }
  };
}

export function parseEmbeddingMemoryRetrievalBenchmarkResult(
  result: EmbeddingMemoryRetrievalResult
): EmbeddingMemoryRetrievalResult {
  return EmbeddingMemoryRetrievalResultSchema.parse(result);
}

function roundMetric(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
