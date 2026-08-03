import { describe, expect, it } from "vitest";
import {
  createEmbeddingMemoryVectorQueryImplementationPlan,
  evaluateEmbeddingMemoryVectorQueryPreflight,
  evaluateEmbeddingMemoryVectorQuerySafety
} from "../src";

const approvedInput = {
  productApprovalGranted: true,
  securityApprovalGranted: true,
  phase85SchemaMigrationComplete: true,
  phase87FixtureWriteApiComplete: true,
  providerNeutralQueryPortReviewed: true,
  sqliteQueryImplementationPlanReviewed: true,
  vectorDeserializationPlanReviewed: true,
  similarityScoringPlanReviewed: true,
  boundedResultPlanReviewed: true,
  fixtureOnlyQueryTestsPresent: true,
  sanitizedFailureMappingReviewed: true,
  vectorQueryApiImplementationApproved: false,
  vectorQueryApiImplemented: false,
  vectorQueryExecutionEnabled: false,
  sqliteRepositoryChanged: false,
  phase743VectorsPersisted: false,
  realRuntimeVectorsPersisted: false,
  coreRetrievalChanged: false,
  providerExecutionChanged: false,
  uiBehaviorChanged: false,
  rawVectorsExposed: false,
  rawTextExposed: false,
  privatePathsExposed: false,
  rawDiagnosticsExposed: false,
  modelOutputShellExecutionEnabled: false,
  verificationClean: true
};

describe("embedding memory vector query preflight", () => {
  it("creates a review-only query implementation plan without exposing vectors", () => {
    const plan = createEmbeddingMemoryVectorQueryImplementationPlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      phase: "8.8",
      status: "review_only",
      vectorQueryApiImplemented: false,
      vectorQueryExecutionEnabled: false,
      sqliteRepositoryChanged: false,
      prerequisiteSchemaVersion: 3,
      prerequisiteFixtureWriteApi: true,
      safetyConstraints: {
        requiresSeparateQueryImplementationApproval: true,
        requiresFixtureOnlyQueryTestsBeforeImplementation: true,
        requiresNoPhase743VectorPersistence: true,
        requiresNoCoreRetrievalRouting: true,
        requiresNoProviderExecutionRouting: true,
        rawVectorsExposed: false,
        rawTextExposed: false,
        privatePathsExposed: false,
        rawDiagnosticsExposed: false,
        modelOutputShellExecutionEnabled: false
      }
    });
    expect(plan.plannedRepositoryMethods).toEqual(["querySimilar(query)"]);
    expect(plan.plannedFailureModes).toEqual(
      expect.arrayContaining([
        "VECTOR_QUERY_DISABLED",
        "VECTOR_QUERY_INVALID",
        "VECTOR_DIMENSION_MISMATCH"
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("accepts only the SQLite query implementation approval boundary", () => {
    const result = evaluateEmbeddingMemoryVectorQueryPreflight(approvedInput);

    expect(result).toMatchObject({
      phase: "8.8",
      capability: "embedding_memory_vector_query_api",
      status: "ready_for_sqlite_query_implementation_approval",
      accepted: true,
      readyForSqliteQueryImplementationApproval: true,
      vectorQueryApiImplemented: false,
      vectorQueryExecutionEnabled: false,
      sqliteRepositoryChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks query implementation, execution, routing, persistence, and unsafe exposure", () => {
    const result = evaluateEmbeddingMemoryVectorQueryPreflight({
      ...approvedInput,
      vectorQueryApiImplementationApproved: true,
      vectorQueryApiImplemented: true,
      vectorQueryExecutionEnabled: true,
      sqliteRepositoryChanged: true,
      phase743VectorsPersisted: true,
      realRuntimeVectorsPersisted: true,
      coreRetrievalChanged: true,
      providerExecutionChanged: true,
      uiBehaviorChanged: true,
      rawVectorsExposed: true,
      rawTextExposed: true,
      privatePathsExposed: true,
      rawDiagnosticsExposed: true,
      modelOutputShellExecutionEnabled: true,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForSqliteQueryImplementationApproval: false,
      vectorQueryApiImplemented: false,
      vectorQueryExecutionEnabled: false,
      sqliteRepositoryChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Vector query API implementation requires separate approval.",
        "Vector query API implementation is blocked in Phase 8.8.",
        "Vector query execution remains disabled.",
        "SQLite repository changes are blocked in Phase 8.8.",
        "Phase 7.43 runtime vectors must not be persisted.",
        "Real runtime vectors must not be persisted.",
        "Core retrieval behavior must remain unchanged.",
        "Provider execution behavior must remain unchanged.",
        "UI behavior must remain unchanged.",
        "Raw vector exposure is blocked.",
        "Raw memory text exposure is blocked.",
        "Private path exposure is blocked.",
        "Raw diagnostic exposure is blocked.",
        "Vector query output must not become shell execution.",
        "Verification gates must be clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b(api[_-]?key|signed[_-]?url|secret)\b/iu);
  });

  it("reports review-only query safety without raw vector, text, or path exposure", () => {
    const report = evaluateEmbeddingMemoryVectorQuerySafety([
      {
        id: "query-plan-reviewed",
        planStepObserved: true,
        validationStepObserved: false,
        scoringStepObserved: false,
        outcome: "ok"
      },
      {
        id: "scoring-reviewed",
        planStepObserved: false,
        validationStepObserved: true,
        scoringStepObserved: true,
        outcome: "ok"
      }
    ]);
    const serialized = JSON.stringify(report);

    expect(report).toEqual({
      phase: "8.8",
      status: "review_only",
      fixtureOnly: true,
      vectorQueryApiImplemented: false,
      vectorQueryExecutionEnabled: false,
      sqliteRepositoryChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      observationCount: 2,
      planStepCount: 1,
      validationStepCount: 1,
      scoringStepCount: 1,
      degradedObservationCount: 0,
      reasonCodes: []
    });
    expect(serialized).not.toContain("0.123");
    expect(serialized).not.toContain("private memory text");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("reports degraded observations and blocks unsafe query evidence", () => {
    const degraded = evaluateEmbeddingMemoryVectorQuerySafety([
      {
        id: "scoring-plan-partial",
        planStepObserved: true,
        validationStepObserved: false,
        scoringStepObserved: false,
        outcome: "degraded"
      }
    ]);
    const blocked = evaluateEmbeddingMemoryVectorQuerySafety([
      {
        id: "unsafe-query",
        planStepObserved: true,
        validationStepObserved: true,
        scoringStepObserved: true,
        outcome: "blocked",
        queryApiImplemented: true,
        vectorQueryObserved: true,
        sqliteRepositoryChanged: true,
        phase743VectorObserved: true,
        realRuntimeVectorObserved: true,
        coreRetrievalObserved: true,
        providerExecutionObserved: true,
        uiBehaviorObserved: true,
        rawVectorObserved: true,
        rawTextObserved: true,
        privatePathObserved: true,
        rawDiagnosticsObserved: true,
        shellExecutionObserved: true
      }
    ]);

    expect(degraded).toMatchObject({
      status: "degraded",
      degradedObservationCount: 1,
      reasonCodes: []
    });
    expect(blocked).toMatchObject({
      status: "blocked",
      vectorQueryApiImplemented: false,
      vectorQueryExecutionEnabled: false,
      sqliteRepositoryChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: [
        "BLOCKED_OBSERVATION",
        "CORE_RETRIEVAL_OBSERVED",
        "PHASE_7_43_VECTOR_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_OBSERVED",
        "QUERY_API_IMPLEMENTED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_TEXT_OBSERVED",
        "RAW_VECTOR_OBSERVED",
        "REAL_RUNTIME_VECTOR_OBSERVED",
        "SHELL_EXECUTION_OBSERVED",
        "SQLITE_REPOSITORY_CHANGED",
        "UI_BEHAVIOR_OBSERVED",
        "VECTOR_QUERY_OBSERVED"
      ]
    });
  });

  it("fails closed when fixture observations are empty", () => {
    expect(evaluateEmbeddingMemoryVectorQuerySafety([])).toMatchObject({
      phase: "8.8",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});
