import { createEmbeddingMemoryVectorSchemaProposal } from "./embedding-vector-execution-preflight";

export type EmbeddingMemoryVectorMigrationPreflightStatus =
  | "blocked"
  | "ready_for_sqlite_migration_implementation_approval";

export interface EmbeddingMemoryVectorMigrationReviewPlan {
  phase: "8.4";
  status: "review_only";
  migrationImplemented: false;
  migrationExecuted: false;
  sqliteRepositoryChanged: false;
  vectorWritesEnabled: false;
  coreRetrievalChanged: false;
  uiBehaviorChanged: false;
  proposedTable: "memory_embeddings";
  proposedIndexes: readonly string[];
  implementationReviewItems: readonly string[];
  rollbackReviewItems: readonly string[];
  safetyConstraints: {
    requiresSeparateSqliteImplementationApproval: true;
    requiresDatabaseBackupBeforeFutureMigration: true;
    requiresHealthCheckAfterFutureMigration: true;
    requiresExportImportRegressionAfterFutureMigration: true;
    phase743VectorsPersisted: false;
    rawVectorsExposed: false;
    privatePathsExposed: false;
    rawDiagnosticsExposed: false;
    modelOutputShellExecutionEnabled: false;
  };
}

export interface EmbeddingMemoryVectorMigrationPreflightInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase83Accepted?: boolean;
  schemaProposalReviewed?: boolean;
  migrationImplementationDiffReviewed?: boolean;
  rollbackPlanReviewed?: boolean;
  backupRestorePlanReviewed?: boolean;
  healthCheckPlanReviewed?: boolean;
  exportImportRegressionPlanReviewed?: boolean;
  fixtureOnlySafetyTestsPresent?: boolean;
  sqliteMigrationImplementationApproved?: boolean;
  migrationExecuted?: boolean;
  indexCreated?: boolean;
  sqliteRepositoryChanged?: boolean;
  vectorWritesEnabled?: boolean;
  realVectorsPersisted?: boolean;
  phase743VectorsPersisted?: boolean;
  coreRetrievalChanged?: boolean;
  uiBehaviorChanged?: boolean;
  rawVectorsExposed?: boolean;
  privatePathsExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface EmbeddingMemoryVectorMigrationPreflightChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase83Accepted: boolean;
  schemaProposalReviewed: boolean;
  migrationImplementationDiffReviewed: boolean;
  rollbackPlanReviewed: boolean;
  backupRestorePlanReviewed: boolean;
  healthCheckPlanReviewed: boolean;
  exportImportRegressionPlanReviewed: boolean;
  fixtureOnlySafetyTestsPresent: boolean;
  sqliteMigrationImplementationDeferred: boolean;
  migrationNotExecuted: boolean;
  indexNotCreated: boolean;
  sqliteRepositoryUnchanged: boolean;
  vectorWritesDisabled: boolean;
  realVectorsNotPersisted: boolean;
  phase743VectorsNotPersisted: boolean;
  coreRetrievalUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  rawVectorExposureDisabled: boolean;
  privatePathExposureDisabled: boolean;
  rawDiagnosticsExposureDisabled: boolean;
  modelOutputShellExecutionDisabled: boolean;
  verificationClean: boolean;
}

export interface EmbeddingMemoryVectorMigrationPreflightResult {
  phase: "8.4";
  capability: "embedding_memory_vector_sqlite_migration";
  status: EmbeddingMemoryVectorMigrationPreflightStatus;
  accepted: boolean;
  readyForSqliteMigrationImplementationApproval: boolean;
  migrationImplemented: false;
  migrationExecuted: false;
  indexCreated: false;
  sqliteRepositoryChanged: false;
  vectorWritesEnabled: false;
  realVectorsPersisted: false;
  phase743VectorsPersisted: false;
  coreRetrievalChanged: false;
  uiBehaviorChanged: false;
  rawVectorsExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  checks: EmbeddingMemoryVectorMigrationPreflightChecks;
  reasons: string[];
}

export interface EmbeddingMemoryVectorMigrationSafetyObservation {
  id: string;
  planStepObserved: boolean;
  rollbackStepObserved: boolean;
  outcome: "ok" | "degraded" | "blocked";
  migrationExecuted?: boolean;
  indexCreated?: boolean;
  sqliteRepositoryChanged?: boolean;
  vectorWriteObserved?: boolean;
  realVectorObserved?: boolean;
  phase743VectorObserved?: boolean;
  privatePathObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  shellExecutionObserved?: boolean;
}

export interface EmbeddingMemoryVectorMigrationSafetyReport {
  phase: "8.4";
  status: "review_only" | "degraded" | "blocked";
  fixtureOnly: true;
  migrationImplemented: false;
  migrationExecuted: false;
  indexCreated: false;
  sqliteRepositoryChanged: false;
  vectorWritesEnabled: false;
  realVectorsPersisted: false;
  phase743VectorsPersisted: false;
  rawVectorsExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  observationCount: number;
  planStepCount: number;
  rollbackStepCount: number;
  degradedObservationCount: number;
  reasonCodes: string[];
}

export function createEmbeddingMemoryVectorMigrationReviewPlan(): EmbeddingMemoryVectorMigrationReviewPlan {
  const proposal = createEmbeddingMemoryVectorSchemaProposal();

  return {
    phase: "8.4",
    status: "review_only",
    migrationImplemented: false,
    migrationExecuted: false,
    sqliteRepositoryChanged: false,
    vectorWritesEnabled: false,
    coreRetrievalChanged: false,
    uiBehaviorChanged: false,
    proposedTable: "memory_embeddings",
    proposedIndexes: proposal.indexes.map((index) => index.name),
    implementationReviewItems: [
      "Prepare a future SQLite migration with idempotent table creation.",
      "Prepare future unique source identity protection for model/source pairs.",
      "Keep vector writes disabled until a later write-path approval.",
      "Keep Core retrieval defaults and UI behavior unchanged.",
      "Keep migration implementation out of this review-only wave."
    ],
    rollbackReviewItems: [
      "Require backup before the future migration is executed.",
      "Drop vector indexes before dropping the proposed vector table.",
      "Leave existing message, conversation, summary, and active conversation tables unchanged.",
      "Run Memory health and export/import regression after future rollback."
    ],
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
  };
}

export function evaluateEmbeddingMemoryVectorMigrationPreflight(
  input: EmbeddingMemoryVectorMigrationPreflightInput = {}
): EmbeddingMemoryVectorMigrationPreflightResult {
  const checks: EmbeddingMemoryVectorMigrationPreflightChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase83Accepted: input.phase83Accepted === true,
    schemaProposalReviewed: input.schemaProposalReviewed === true,
    migrationImplementationDiffReviewed:
      input.migrationImplementationDiffReviewed === true,
    rollbackPlanReviewed: input.rollbackPlanReviewed === true,
    backupRestorePlanReviewed: input.backupRestorePlanReviewed === true,
    healthCheckPlanReviewed: input.healthCheckPlanReviewed === true,
    exportImportRegressionPlanReviewed:
      input.exportImportRegressionPlanReviewed === true,
    fixtureOnlySafetyTestsPresent:
      input.fixtureOnlySafetyTestsPresent === true,
    sqliteMigrationImplementationDeferred:
      input.sqliteMigrationImplementationApproved === false,
    migrationNotExecuted: input.migrationExecuted === false,
    indexNotCreated: input.indexCreated === false,
    sqliteRepositoryUnchanged: input.sqliteRepositoryChanged === false,
    vectorWritesDisabled: input.vectorWritesEnabled === false,
    realVectorsNotPersisted: input.realVectorsPersisted === false,
    phase743VectorsNotPersisted: input.phase743VectorsPersisted === false,
    coreRetrievalUnchanged: input.coreRetrievalChanged === false,
    uiBehaviorUnchanged: input.uiBehaviorChanged === false,
    rawVectorExposureDisabled: input.rawVectorsExposed === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    modelOutputShellExecutionDisabled:
      input.modelOutputShellExecutionEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    phase: "8.4",
    capability: "embedding_memory_vector_sqlite_migration",
    status: accepted
      ? "ready_for_sqlite_migration_implementation_approval"
      : "blocked",
    accepted,
    readyForSqliteMigrationImplementationApproval: accepted,
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
    modelOutputShellExecutionEnabled: false,
    checks,
    reasons: createMigrationPreflightReasons(checks)
  };
}

export function evaluateEmbeddingMemoryVectorMigrationSafety(
  observations: readonly EmbeddingMemoryVectorMigrationSafetyObservation[]
): EmbeddingMemoryVectorMigrationSafetyReport {
  if (observations.length < 1 || observations.length > 100) {
    return createMigrationSafetyReport([], ["OBSERVATION_COUNT_INVALID"]);
  }

  const unsafeReasons = createMigrationSafetyReasons(observations);
  const degradedObservationCount = observations.filter(
    (observation) => observation.outcome === "degraded"
  ).length;

  return createMigrationSafetyReport(
    observations,
    unsafeReasons,
    degradedObservationCount
  );
}

function createMigrationPreflightReasons(
  checks: EmbeddingMemoryVectorMigrationPreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.4 preflight.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.4 preflight.");
  }
  if (!checks.phase83Accepted) {
    reasons.push("Phase 8.3 must be accepted before migration review.");
  }
  if (!checks.schemaProposalReviewed) {
    reasons.push("Memory vector schema proposal is not reviewed.");
  }
  if (!checks.migrationImplementationDiffReviewed) {
    reasons.push("Future SQLite migration implementation diff is not reviewed.");
  }
  if (!checks.rollbackPlanReviewed) {
    reasons.push("Rollback plan is not reviewed.");
  }
  if (!checks.backupRestorePlanReviewed) {
    reasons.push("Backup and restore plan is not reviewed.");
  }
  if (!checks.healthCheckPlanReviewed) {
    reasons.push("Memory health check plan is not reviewed.");
  }
  if (!checks.exportImportRegressionPlanReviewed) {
    reasons.push("Export/import regression plan is not reviewed.");
  }
  if (!checks.fixtureOnlySafetyTestsPresent) {
    reasons.push("Fixture-only migration safety tests are required.");
  }
  if (!checks.sqliteMigrationImplementationDeferred) {
    reasons.push("SQLite migration implementation requires separate approval.");
  }
  if (!checks.migrationNotExecuted) {
    reasons.push("SQLite migration execution is blocked in Phase 8.4.");
  }
  if (!checks.indexNotCreated) {
    reasons.push("SQLite vector index creation is blocked in Phase 8.4.");
  }
  if (!checks.sqliteRepositoryUnchanged) {
    reasons.push("SQLite repository changes are blocked in Phase 8.4.");
  }
  if (!checks.vectorWritesDisabled) {
    reasons.push("Vector writes remain disabled.");
  }
  if (!checks.realVectorsNotPersisted) {
    reasons.push("Real vectors must not be persisted.");
  }
  if (!checks.phase743VectorsNotPersisted) {
    reasons.push("Phase 7.43 runtime vectors must not be persisted.");
  }
  if (!checks.coreRetrievalUnchanged) {
    reasons.push("Core retrieval behavior must remain unchanged.");
  }
  if (!checks.uiBehaviorUnchanged) {
    reasons.push("UI behavior must remain unchanged.");
  }
  if (!checks.rawVectorExposureDisabled) {
    reasons.push("Raw vector exposure is blocked.");
  }
  if (!checks.privatePathExposureDisabled) {
    reasons.push("Private path exposure is blocked.");
  }
  if (!checks.rawDiagnosticsExposureDisabled) {
    reasons.push("Raw diagnostic exposure is blocked.");
  }
  if (!checks.modelOutputShellExecutionDisabled) {
    reasons.push("Retrieval output must not become shell execution.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates must be clean.");
  }

  return reasons;
}

function createMigrationSafetyReport(
  observations: readonly EmbeddingMemoryVectorMigrationSafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0
): EmbeddingMemoryVectorMigrationSafetyReport {
  const blocked = reasonCodes.length > 0;

  return {
    phase: "8.4",
    status: blocked
      ? "blocked"
      : degradedObservationCount > 0
        ? "degraded"
        : "review_only",
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
    observationCount: observations.length,
    planStepCount: observations.filter(
      (observation) => observation.planStepObserved
    ).length,
    rollbackStepCount: observations.filter(
      (observation) => observation.rollbackStepObserved
    ).length,
    degradedObservationCount,
    reasonCodes
  };
}

function createMigrationSafetyReasons(
  observations: readonly EmbeddingMemoryVectorMigrationSafetyObservation[]
): string[] {
  const reasons = new Set<string>();

  for (const observation of observations) {
    if (observation.outcome === "blocked") {
      reasons.add("BLOCKED_OBSERVATION");
    }
    if (observation.migrationExecuted) {
      reasons.add("MIGRATION_EXECUTED");
    }
    if (observation.indexCreated) {
      reasons.add("INDEX_CREATED");
    }
    if (observation.sqliteRepositoryChanged) {
      reasons.add("SQLITE_REPOSITORY_CHANGED");
    }
    if (observation.vectorWriteObserved) {
      reasons.add("VECTOR_WRITE_OBSERVED");
    }
    if (observation.realVectorObserved) {
      reasons.add("REAL_VECTOR_OBSERVED");
    }
    if (observation.phase743VectorObserved) {
      reasons.add("PHASE_7_43_VECTOR_OBSERVED");
    }
    if (observation.privatePathObserved) {
      reasons.add("PRIVATE_PATH_OBSERVED");
    }
    if (observation.rawDiagnosticsObserved) {
      reasons.add("RAW_DIAGNOSTICS_OBSERVED");
    }
    if (observation.shellExecutionObserved) {
      reasons.add("SHELL_EXECUTION_OBSERVED");
    }
  }

  return [...reasons].sort();
}
