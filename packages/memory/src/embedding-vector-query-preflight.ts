export type EmbeddingMemoryVectorQueryPreflightStatus =
  | "blocked"
  | "ready_for_sqlite_query_implementation_approval";

export interface EmbeddingMemoryVectorQueryImplementationPlan {
  phase: "8.8";
  status: "review_only";
  vectorQueryApiImplemented: false;
  vectorQueryExecutionEnabled: false;
  sqliteRepositoryChanged: false;
  coreRetrievalChanged: false;
  providerExecutionChanged: false;
  uiBehaviorChanged: false;
  prerequisiteSchemaVersion: 3;
  prerequisiteFixtureWriteApi: true;
  plannedRepositoryMethods: readonly string[];
  plannedValidationRules: readonly string[];
  plannedScoringRules: readonly string[];
  plannedFailureModes: readonly string[];
  safetyConstraints: {
    requiresSeparateQueryImplementationApproval: true;
    requiresFixtureOnlyQueryTestsBeforeImplementation: true;
    requiresNoPhase743VectorPersistence: true;
    requiresNoCoreRetrievalRouting: true;
    requiresNoProviderExecutionRouting: true;
    rawVectorsExposed: false;
    rawTextExposed: false;
    privatePathsExposed: false;
    rawDiagnosticsExposed: false;
    modelOutputShellExecutionEnabled: false;
  };
}

export interface EmbeddingMemoryVectorQueryPreflightInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase85SchemaMigrationComplete?: boolean;
  phase87FixtureWriteApiComplete?: boolean;
  providerNeutralQueryPortReviewed?: boolean;
  sqliteQueryImplementationPlanReviewed?: boolean;
  vectorDeserializationPlanReviewed?: boolean;
  similarityScoringPlanReviewed?: boolean;
  boundedResultPlanReviewed?: boolean;
  fixtureOnlyQueryTestsPresent?: boolean;
  sanitizedFailureMappingReviewed?: boolean;
  vectorQueryApiImplementationApproved?: boolean;
  vectorQueryApiImplemented?: boolean;
  vectorQueryExecutionEnabled?: boolean;
  sqliteRepositoryChanged?: boolean;
  phase743VectorsPersisted?: boolean;
  realRuntimeVectorsPersisted?: boolean;
  coreRetrievalChanged?: boolean;
  providerExecutionChanged?: boolean;
  uiBehaviorChanged?: boolean;
  rawVectorsExposed?: boolean;
  rawTextExposed?: boolean;
  privatePathsExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface EmbeddingMemoryVectorQueryPreflightChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase85SchemaMigrationComplete: boolean;
  phase87FixtureWriteApiComplete: boolean;
  providerNeutralQueryPortReviewed: boolean;
  sqliteQueryImplementationPlanReviewed: boolean;
  vectorDeserializationPlanReviewed: boolean;
  similarityScoringPlanReviewed: boolean;
  boundedResultPlanReviewed: boolean;
  fixtureOnlyQueryTestsPresent: boolean;
  sanitizedFailureMappingReviewed: boolean;
  vectorQueryApiImplementationDeferred: boolean;
  vectorQueryApiNotImplemented: boolean;
  vectorQueryExecutionDisabled: boolean;
  sqliteRepositoryUnchanged: boolean;
  phase743VectorsNotPersisted: boolean;
  realRuntimeVectorsNotPersisted: boolean;
  coreRetrievalUnchanged: boolean;
  providerExecutionUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  rawVectorExposureDisabled: boolean;
  rawTextExposureDisabled: boolean;
  privatePathExposureDisabled: boolean;
  rawDiagnosticsExposureDisabled: boolean;
  modelOutputShellExecutionDisabled: boolean;
  verificationClean: boolean;
}

export interface EmbeddingMemoryVectorQueryPreflightResult {
  phase: "8.8";
  capability: "embedding_memory_vector_query_api";
  status: EmbeddingMemoryVectorQueryPreflightStatus;
  accepted: boolean;
  readyForSqliteQueryImplementationApproval: boolean;
  vectorQueryApiImplemented: false;
  vectorQueryExecutionEnabled: false;
  sqliteRepositoryChanged: false;
  phase743VectorsPersisted: false;
  realRuntimeVectorsPersisted: false;
  coreRetrievalChanged: false;
  providerExecutionChanged: false;
  uiBehaviorChanged: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  checks: EmbeddingMemoryVectorQueryPreflightChecks;
  reasons: string[];
}

export interface EmbeddingMemoryVectorQuerySafetyObservation {
  id: string;
  planStepObserved: boolean;
  validationStepObserved: boolean;
  scoringStepObserved: boolean;
  outcome: "ok" | "degraded" | "blocked";
  queryApiImplemented?: boolean;
  vectorQueryObserved?: boolean;
  sqliteRepositoryChanged?: boolean;
  phase743VectorObserved?: boolean;
  realRuntimeVectorObserved?: boolean;
  coreRetrievalObserved?: boolean;
  providerExecutionObserved?: boolean;
  uiBehaviorObserved?: boolean;
  rawVectorObserved?: boolean;
  rawTextObserved?: boolean;
  privatePathObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  shellExecutionObserved?: boolean;
}

export interface EmbeddingMemoryVectorQuerySafetyReport {
  phase: "8.8";
  status: "review_only" | "degraded" | "blocked";
  fixtureOnly: true;
  vectorQueryApiImplemented: false;
  vectorQueryExecutionEnabled: false;
  sqliteRepositoryChanged: false;
  phase743VectorsPersisted: false;
  realRuntimeVectorsPersisted: false;
  coreRetrievalChanged: false;
  providerExecutionChanged: false;
  uiBehaviorChanged: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  observationCount: number;
  planStepCount: number;
  validationStepCount: number;
  scoringStepCount: number;
  degradedObservationCount: number;
  reasonCodes: string[];
}

export function createEmbeddingMemoryVectorQueryImplementationPlan(): EmbeddingMemoryVectorQueryImplementationPlan {
  return {
    phase: "8.8",
    status: "review_only",
    vectorQueryApiImplemented: false,
    vectorQueryExecutionEnabled: false,
    sqliteRepositoryChanged: false,
    coreRetrievalChanged: false,
    providerExecutionChanged: false,
    uiBehaviorChanged: false,
    prerequisiteSchemaVersion: 3,
    prerequisiteFixtureWriteApi: true,
    plannedRepositoryMethods: ["querySimilar(query)"],
    plannedValidationRules: [
      "Validate provider-neutral embedding query shape before deserialization.",
      "Require finite query vector values before scoring.",
      "Require stored vector dimensions to match query vector dimensions.",
      "Limit candidate scan by model ID and optional conversation ID.",
      "Return bounded match metadata only; never return vector payloads."
    ],
    plannedScoringRules: [
      "Use deterministic cosine similarity for fixture-only retrieval.",
      "Sort by score descending, createdAt ascending, then id ascending.",
      "Apply minScore after finite-score validation.",
      "Limit results to the validated query limit."
    ],
    plannedFailureModes: [
      "VECTOR_QUERY_DISABLED",
      "VECTOR_QUERY_INVALID",
      "VECTOR_SCHEMA_UNAVAILABLE",
      "VECTOR_DIMENSION_MISMATCH",
      "VECTOR_MODEL_UNAVAILABLE",
      "VECTOR_QUERY_EXECUTION_FAILED"
    ],
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
  };
}

export function evaluateEmbeddingMemoryVectorQueryPreflight(
  input: EmbeddingMemoryVectorQueryPreflightInput = {}
): EmbeddingMemoryVectorQueryPreflightResult {
  const checks: EmbeddingMemoryVectorQueryPreflightChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase85SchemaMigrationComplete:
      input.phase85SchemaMigrationComplete === true,
    phase87FixtureWriteApiComplete:
      input.phase87FixtureWriteApiComplete === true,
    providerNeutralQueryPortReviewed:
      input.providerNeutralQueryPortReviewed === true,
    sqliteQueryImplementationPlanReviewed:
      input.sqliteQueryImplementationPlanReviewed === true,
    vectorDeserializationPlanReviewed:
      input.vectorDeserializationPlanReviewed === true,
    similarityScoringPlanReviewed:
      input.similarityScoringPlanReviewed === true,
    boundedResultPlanReviewed: input.boundedResultPlanReviewed === true,
    fixtureOnlyQueryTestsPresent:
      input.fixtureOnlyQueryTestsPresent === true,
    sanitizedFailureMappingReviewed:
      input.sanitizedFailureMappingReviewed === true,
    vectorQueryApiImplementationDeferred:
      input.vectorQueryApiImplementationApproved === false,
    vectorQueryApiNotImplemented: input.vectorQueryApiImplemented === false,
    vectorQueryExecutionDisabled:
      input.vectorQueryExecutionEnabled === false,
    sqliteRepositoryUnchanged: input.sqliteRepositoryChanged === false,
    phase743VectorsNotPersisted: input.phase743VectorsPersisted === false,
    realRuntimeVectorsNotPersisted:
      input.realRuntimeVectorsPersisted === false,
    coreRetrievalUnchanged: input.coreRetrievalChanged === false,
    providerExecutionUnchanged: input.providerExecutionChanged === false,
    uiBehaviorUnchanged: input.uiBehaviorChanged === false,
    rawVectorExposureDisabled: input.rawVectorsExposed === false,
    rawTextExposureDisabled: input.rawTextExposed === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    modelOutputShellExecutionDisabled:
      input.modelOutputShellExecutionEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    phase: "8.8",
    capability: "embedding_memory_vector_query_api",
    status: accepted
      ? "ready_for_sqlite_query_implementation_approval"
      : "blocked",
    accepted,
    readyForSqliteQueryImplementationApproval: accepted,
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
    checks,
    reasons: createVectorQueryPreflightReasons(checks)
  };
}

export function evaluateEmbeddingMemoryVectorQuerySafety(
  observations: readonly EmbeddingMemoryVectorQuerySafetyObservation[]
): EmbeddingMemoryVectorQuerySafetyReport {
  if (observations.length < 1 || observations.length > 100) {
    return createVectorQuerySafetyReport([], ["OBSERVATION_COUNT_INVALID"]);
  }

  const unsafeReasons = createVectorQuerySafetyReasons(observations);
  const degradedObservationCount = observations.filter(
    (observation) => observation.outcome === "degraded"
  ).length;

  return createVectorQuerySafetyReport(
    observations,
    unsafeReasons,
    degradedObservationCount
  );
}

function createVectorQueryPreflightReasons(
  checks: EmbeddingMemoryVectorQueryPreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.8 preflight.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.8 preflight.");
  }
  if (!checks.phase85SchemaMigrationComplete) {
    reasons.push("Phase 8.5 schema migration must be complete.");
  }
  if (!checks.phase87FixtureWriteApiComplete) {
    reasons.push("Phase 8.7 fixture write API must be complete.");
  }
  if (!checks.providerNeutralQueryPortReviewed) {
    reasons.push("Provider-neutral vector query port is not reviewed.");
  }
  if (!checks.sqliteQueryImplementationPlanReviewed) {
    reasons.push("SQLite vector query implementation plan is not reviewed.");
  }
  if (!checks.vectorDeserializationPlanReviewed) {
    reasons.push("Vector deserialization plan is not reviewed.");
  }
  if (!checks.similarityScoringPlanReviewed) {
    reasons.push("Similarity scoring plan is not reviewed.");
  }
  if (!checks.boundedResultPlanReviewed) {
    reasons.push("Bounded query result plan is not reviewed.");
  }
  if (!checks.fixtureOnlyQueryTestsPresent) {
    reasons.push("Fixture-only vector query tests are required.");
  }
  if (!checks.sanitizedFailureMappingReviewed) {
    reasons.push("Sanitized vector query failure mapping is not reviewed.");
  }
  if (!checks.vectorQueryApiImplementationDeferred) {
    reasons.push("Vector query API implementation requires separate approval.");
  }
  if (!checks.vectorQueryApiNotImplemented) {
    reasons.push("Vector query API implementation is blocked in Phase 8.8.");
  }
  if (!checks.vectorQueryExecutionDisabled) {
    reasons.push("Vector query execution remains disabled.");
  }
  if (!checks.sqliteRepositoryUnchanged) {
    reasons.push("SQLite repository changes are blocked in Phase 8.8.");
  }
  if (!checks.phase743VectorsNotPersisted) {
    reasons.push("Phase 7.43 runtime vectors must not be persisted.");
  }
  if (!checks.realRuntimeVectorsNotPersisted) {
    reasons.push("Real runtime vectors must not be persisted.");
  }
  if (!checks.coreRetrievalUnchanged) {
    reasons.push("Core retrieval behavior must remain unchanged.");
  }
  if (!checks.providerExecutionUnchanged) {
    reasons.push("Provider execution behavior must remain unchanged.");
  }
  if (!checks.uiBehaviorUnchanged) {
    reasons.push("UI behavior must remain unchanged.");
  }
  if (!checks.rawVectorExposureDisabled) {
    reasons.push("Raw vector exposure is blocked.");
  }
  if (!checks.rawTextExposureDisabled) {
    reasons.push("Raw memory text exposure is blocked.");
  }
  if (!checks.privatePathExposureDisabled) {
    reasons.push("Private path exposure is blocked.");
  }
  if (!checks.rawDiagnosticsExposureDisabled) {
    reasons.push("Raw diagnostic exposure is blocked.");
  }
  if (!checks.modelOutputShellExecutionDisabled) {
    reasons.push("Vector query output must not become shell execution.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates must be clean.");
  }

  return reasons;
}

function createVectorQuerySafetyReport(
  observations: readonly EmbeddingMemoryVectorQuerySafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0
): EmbeddingMemoryVectorQuerySafetyReport {
  const blocked = reasonCodes.length > 0;

  return {
    phase: "8.8",
    status: blocked
      ? "blocked"
      : degradedObservationCount > 0
        ? "degraded"
        : "review_only",
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
    observationCount: observations.length,
    planStepCount: observations.filter(
      (observation) => observation.planStepObserved
    ).length,
    validationStepCount: observations.filter(
      (observation) => observation.validationStepObserved
    ).length,
    scoringStepCount: observations.filter(
      (observation) => observation.scoringStepObserved
    ).length,
    degradedObservationCount,
    reasonCodes
  };
}

function createVectorQuerySafetyReasons(
  observations: readonly EmbeddingMemoryVectorQuerySafetyObservation[]
): string[] {
  const reasons = new Set<string>();

  for (const observation of observations) {
    if (observation.outcome === "blocked") {
      reasons.add("BLOCKED_OBSERVATION");
    }
    if (observation.queryApiImplemented) {
      reasons.add("QUERY_API_IMPLEMENTED");
    }
    if (observation.vectorQueryObserved) {
      reasons.add("VECTOR_QUERY_OBSERVED");
    }
    if (observation.sqliteRepositoryChanged) {
      reasons.add("SQLITE_REPOSITORY_CHANGED");
    }
    if (observation.phase743VectorObserved) {
      reasons.add("PHASE_7_43_VECTOR_OBSERVED");
    }
    if (observation.realRuntimeVectorObserved) {
      reasons.add("REAL_RUNTIME_VECTOR_OBSERVED");
    }
    if (observation.coreRetrievalObserved) {
      reasons.add("CORE_RETRIEVAL_OBSERVED");
    }
    if (observation.providerExecutionObserved) {
      reasons.add("PROVIDER_EXECUTION_OBSERVED");
    }
    if (observation.uiBehaviorObserved) {
      reasons.add("UI_BEHAVIOR_OBSERVED");
    }
    if (observation.rawVectorObserved) {
      reasons.add("RAW_VECTOR_OBSERVED");
    }
    if (observation.rawTextObserved) {
      reasons.add("RAW_TEXT_OBSERVED");
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
