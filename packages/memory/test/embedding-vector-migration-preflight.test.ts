import { describe, expect, it } from "vitest";
import {
  createEmbeddingMemoryVectorMigrationReviewPlan,
  evaluateEmbeddingMemoryVectorMigrationPreflight,
  evaluateEmbeddingMemoryVectorMigrationSafety
} from "../src";

const approvedInput = {
  productApprovalGranted: true,
  securityApprovalGranted: true,
  phase83Accepted: true,
  schemaProposalReviewed: true,
  migrationImplementationDiffReviewed: true,
  rollbackPlanReviewed: true,
  backupRestorePlanReviewed: true,
  healthCheckPlanReviewed: true,
  exportImportRegressionPlanReviewed: true,
  fixtureOnlySafetyTestsPresent: true,
  sqliteMigrationImplementationApproved: false,
  migrationExecuted: false,
  indexCreated: false,
  sqliteRepositoryChanged: false,
  vectorWritesEnabled: false,
  realVectorsPersisted: false,
  phase743VectorsPersisted: false,
  coreRetrievalChanged: false,
  uiBehaviorChanged: false,
  rawVectorsExposed: false,
  privatePathsExposed: false,
  rawDiagnosticsExposed: false,
  modelOutputShellExecutionEnabled: false,
  verificationClean: true
};

describe("embedding memory vector migration preflight", () => {
  it("creates a review-only migration plan without implementing or executing a migration", () => {
    const plan = createEmbeddingMemoryVectorMigrationReviewPlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      phase: "8.4",
      status: "review_only",
      migrationImplemented: false,
      migrationExecuted: false,
      sqliteRepositoryChanged: false,
      vectorWritesEnabled: false,
      coreRetrievalChanged: false,
      uiBehaviorChanged: false,
      proposedTable: "memory_embeddings",
      safetyConstraints: {
        requiresSeparateSqliteImplementationApproval: true,
        requiresDatabaseBackupBeforeFutureMigration: true,
        requiresHealthCheckAfterFutureMigration: true,
        requiresExportImportRegressionAfterFutureMigration: true,
        phase743VectorsPersisted: false,
        rawVectorsExposed: false,
        privatePathsExposed: false,
        rawDiagnosticsExposed: false,
        modelOutputShellExecutionEnabled: false
      }
    });
    expect(plan.proposedIndexes).toEqual([
      "idx_memory_embeddings_model_conversation",
      "idx_memory_embeddings_source"
    ]);
    expect(plan.rollbackReviewItems).toEqual(
      expect.arrayContaining([
        "Require backup before the future migration is executed.",
        "Run Memory health and export/import regression after future rollback."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("accepts only the implementation-approval handoff boundary", () => {
    const result = evaluateEmbeddingMemoryVectorMigrationPreflight(approvedInput);

    expect(result).toMatchObject({
      phase: "8.4",
      capability: "embedding_memory_vector_sqlite_migration",
      status: "ready_for_sqlite_migration_implementation_approval",
      accepted: true,
      readyForSqliteMigrationImplementationApproval: true,
      migrationImplemented: false,
      migrationExecuted: false,
      indexCreated: false,
      sqliteRepositoryChanged: false,
      vectorWritesEnabled: false,
      realVectorsPersisted: false,
      phase743VectorsPersisted: false,
      coreRetrievalChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks migration implementation, execution, index creation, vector writes, and behavior changes", () => {
    const result = evaluateEmbeddingMemoryVectorMigrationPreflight({
      ...approvedInput,
      sqliteMigrationImplementationApproved: true,
      migrationExecuted: true,
      indexCreated: true,
      sqliteRepositoryChanged: true,
      vectorWritesEnabled: true,
      realVectorsPersisted: true,
      phase743VectorsPersisted: true,
      coreRetrievalChanged: true,
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
      readyForSqliteMigrationImplementationApproval: false,
      migrationImplemented: false,
      migrationExecuted: false,
      indexCreated: false,
      sqliteRepositoryChanged: false,
      vectorWritesEnabled: false,
      realVectorsPersisted: false,
      phase743VectorsPersisted: false,
      coreRetrievalChanged: false,
      uiBehaviorChanged: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "SQLite migration implementation requires separate approval.",
        "SQLite migration execution is blocked in Phase 8.4.",
        "SQLite vector index creation is blocked in Phase 8.4.",
        "SQLite repository changes are blocked in Phase 8.4.",
        "Vector writes remain disabled.",
        "Real vectors must not be persisted.",
        "Phase 7.43 runtime vectors must not be persisted.",
        "Core retrieval behavior must remain unchanged.",
        "UI behavior must remain unchanged.",
        "Raw vector exposure is blocked.",
        "Private path exposure is blocked.",
        "Raw diagnostic exposure is blocked.",
        "Retrieval output must not become shell execution.",
        "Verification gates must be clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b(api[_-]?key|signed[_-]?url|secret)\b/iu);
  });

  it("reports review-only migration safety without exposing raw vectors or paths", () => {
    const report = evaluateEmbeddingMemoryVectorMigrationSafety([
      {
        id: "plan-reviewed",
        planStepObserved: true,
        rollbackStepObserved: false,
        outcome: "ok"
      },
      {
        id: "rollback-reviewed",
        planStepObserved: false,
        rollbackStepObserved: true,
        outcome: "ok"
      }
    ]);
    const serialized = JSON.stringify(report);

    expect(report).toEqual({
      phase: "8.4",
      status: "review_only",
      fixtureOnly: true,
      migrationImplemented: false,
      migrationExecuted: false,
      indexCreated: false,
      sqliteRepositoryChanged: false,
      vectorWritesEnabled: false,
      realVectorsPersisted: false,
      phase743VectorsPersisted: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      observationCount: 2,
      planStepCount: 1,
      rollbackStepCount: 1,
      degradedObservationCount: 0,
      reasonCodes: []
    });
    expect(serialized).not.toContain("0.123");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("reports degraded observations and blocks unsafe migration evidence", () => {
    const degraded = evaluateEmbeddingMemoryVectorMigrationSafety([
      {
        id: "health-plan-partial",
        planStepObserved: true,
        rollbackStepObserved: false,
        outcome: "degraded"
      }
    ]);
    const blocked = evaluateEmbeddingMemoryVectorMigrationSafety([
      {
        id: "unsafe-migration",
        planStepObserved: true,
        rollbackStepObserved: true,
        outcome: "blocked",
        migrationExecuted: true,
        indexCreated: true,
        sqliteRepositoryChanged: true,
        vectorWriteObserved: true,
        realVectorObserved: true,
        phase743VectorObserved: true,
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
      migrationImplemented: false,
      migrationExecuted: false,
      indexCreated: false,
      sqliteRepositoryChanged: false,
      vectorWritesEnabled: false,
      realVectorsPersisted: false,
      phase743VectorsPersisted: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: [
        "BLOCKED_OBSERVATION",
        "INDEX_CREATED",
        "MIGRATION_EXECUTED",
        "PHASE_7_43_VECTOR_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "REAL_VECTOR_OBSERVED",
        "SHELL_EXECUTION_OBSERVED",
        "SQLITE_REPOSITORY_CHANGED",
        "VECTOR_WRITE_OBSERVED"
      ]
    });
  });

  it("fails closed when fixture observations are empty", () => {
    expect(evaluateEmbeddingMemoryVectorMigrationSafety([])).toMatchObject({
      phase: "8.4",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});
