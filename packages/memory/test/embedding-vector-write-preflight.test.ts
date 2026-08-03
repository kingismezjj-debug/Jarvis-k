import { describe, expect, it } from "vitest";
import {
  createEmbeddingMemoryVectorWriteImplementationPlan,
  evaluateEmbeddingMemoryVectorWritePreflight,
  evaluateEmbeddingMemoryVectorWriteSafety
} from "../src";

const approvedInput = {
  productApprovalGranted: true,
  securityApprovalGranted: true,
  phase85SchemaMigrationComplete: true,
  providerNeutralWritePortReviewed: true,
  sqliteWriteImplementationPlanReviewed: true,
  writeValidationPlanReviewed: true,
  duplicateHandlingPlanReviewed: true,
  rollbackPlanReviewed: true,
  fixtureOnlyWriteTestsPresent: true,
  sanitizedFailureMappingReviewed: true,
  vectorWriteApiImplementationApproved: false,
  vectorWriteApiImplemented: false,
  vectorWritesEnabled: false,
  sqliteRepositoryChanged: false,
  phase743VectorsPersisted: false,
  realRuntimeVectorsPersisted: false,
  coreRetrievalChanged: false,
  providerExecutionChanged: false,
  uiBehaviorChanged: false,
  rawVectorsExposed: false,
  privatePathsExposed: false,
  rawDiagnosticsExposed: false,
  modelOutputShellExecutionEnabled: false,
  verificationClean: true
};

describe("embedding memory vector write preflight", () => {
  it("creates a review-only write implementation plan without exposing vectors", () => {
    const plan = createEmbeddingMemoryVectorWriteImplementationPlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      phase: "8.6",
      status: "review_only",
      vectorWriteApiImplemented: false,
      vectorWritesEnabled: false,
      sqliteRepositoryChanged: false,
      prerequisiteSchemaVersion: 3,
      safetyConstraints: {
        requiresSeparateWriteImplementationApproval: true,
        requiresFixtureOnlyWriteTestsBeforeImplementation: true,
        requiresNoPhase743VectorPersistence: true,
        requiresNoCoreRetrievalRouting: true,
        requiresNoProviderExecutionRouting: true,
        rawVectorsExposed: false,
        privatePathsExposed: false,
        rawDiagnosticsExposed: false,
        modelOutputShellExecutionEnabled: false
      }
    });
    expect(plan.plannedRepositoryMethods).toEqual([
      "writeEmbeddingRecord(record)",
      "deleteEmbeddingRecordsForSource(sourceType, sourceId, modelId)"
    ]);
    expect(plan.plannedFailureModes).toEqual(
      expect.arrayContaining([
        "VECTOR_WRITES_DISABLED",
        "VECTOR_RECORD_INVALID",
        "VECTOR_DUPLICATE_SOURCE"
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("accepts only the vector write implementation approval boundary", () => {
    const result = evaluateEmbeddingMemoryVectorWritePreflight(approvedInput);

    expect(result).toMatchObject({
      phase: "8.6",
      capability: "embedding_memory_vector_write_api",
      status: "ready_for_vector_write_implementation_approval",
      accepted: true,
      readyForVectorWriteImplementationApproval: true,
      vectorWriteApiImplemented: false,
      vectorWritesEnabled: false,
      sqliteRepositoryChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks write implementation, vector persistence, routing, and unsafe exposure", () => {
    const result = evaluateEmbeddingMemoryVectorWritePreflight({
      ...approvedInput,
      vectorWriteApiImplementationApproved: true,
      vectorWriteApiImplemented: true,
      vectorWritesEnabled: true,
      sqliteRepositoryChanged: true,
      phase743VectorsPersisted: true,
      realRuntimeVectorsPersisted: true,
      coreRetrievalChanged: true,
      providerExecutionChanged: true,
      uiBehaviorChanged: true,
      rawVectorsExposed: true,
      privatePathsExposed: true,
      rawDiagnosticsExposed: true,
      modelOutputShellExecutionEnabled: true,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForVectorWriteImplementationApproval: false,
      vectorWriteApiImplemented: false,
      vectorWritesEnabled: false,
      sqliteRepositoryChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Vector write API implementation requires separate approval.",
        "Vector write API implementation is blocked in Phase 8.6.",
        "Vector writes remain disabled.",
        "SQLite repository changes are blocked in Phase 8.6.",
        "Phase 7.43 runtime vectors must not be persisted.",
        "Real runtime vectors must not be persisted.",
        "Core retrieval behavior must remain unchanged.",
        "Provider execution behavior must remain unchanged.",
        "UI behavior must remain unchanged.",
        "Raw vector exposure is blocked.",
        "Private path exposure is blocked.",
        "Raw diagnostic exposure is blocked.",
        "Vector write output must not become shell execution.",
        "Verification gates must be clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b(api[_-]?key|signed[_-]?url|secret)\b/iu);
  });

  it("reports review-only write safety without raw vector or path exposure", () => {
    const report = evaluateEmbeddingMemoryVectorWriteSafety([
      {
        id: "write-plan-reviewed",
        planStepObserved: true,
        validationStepObserved: false,
        outcome: "ok"
      },
      {
        id: "validation-reviewed",
        planStepObserved: false,
        validationStepObserved: true,
        outcome: "ok"
      }
    ]);
    const serialized = JSON.stringify(report);

    expect(report).toEqual({
      phase: "8.6",
      status: "review_only",
      fixtureOnly: true,
      vectorWriteApiImplemented: false,
      vectorWritesEnabled: false,
      sqliteRepositoryChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      observationCount: 2,
      planStepCount: 1,
      validationStepCount: 1,
      degradedObservationCount: 0,
      reasonCodes: []
    });
    expect(serialized).not.toContain("0.123");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("reports degraded observations and blocks unsafe write evidence", () => {
    const degraded = evaluateEmbeddingMemoryVectorWriteSafety([
      {
        id: "duplicate-plan-partial",
        planStepObserved: true,
        validationStepObserved: false,
        outcome: "degraded"
      }
    ]);
    const blocked = evaluateEmbeddingMemoryVectorWriteSafety([
      {
        id: "unsafe-write",
        planStepObserved: true,
        validationStepObserved: true,
        outcome: "blocked",
        writeApiImplemented: true,
        vectorWriteObserved: true,
        sqliteRepositoryChanged: true,
        phase743VectorObserved: true,
        realRuntimeVectorObserved: true,
        coreRetrievalObserved: true,
        providerExecutionObserved: true,
        uiBehaviorObserved: true,
        rawVectorObserved: true,
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
      vectorWriteApiImplemented: false,
      vectorWritesEnabled: false,
      sqliteRepositoryChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: [
        "BLOCKED_OBSERVATION",
        "CORE_RETRIEVAL_OBSERVED",
        "PHASE_7_43_VECTOR_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_VECTOR_OBSERVED",
        "REAL_RUNTIME_VECTOR_OBSERVED",
        "SHELL_EXECUTION_OBSERVED",
        "SQLITE_REPOSITORY_CHANGED",
        "UI_BEHAVIOR_OBSERVED",
        "VECTOR_WRITE_OBSERVED",
        "WRITE_API_IMPLEMENTED"
      ]
    });
  });

  it("fails closed when fixture observations are empty", () => {
    expect(evaluateEmbeddingMemoryVectorWriteSafety([])).toMatchObject({
      phase: "8.6",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});
