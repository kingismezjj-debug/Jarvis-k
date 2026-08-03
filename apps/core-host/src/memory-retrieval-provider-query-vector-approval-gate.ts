export const MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV =
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR";

export type MemoryRetrievalProviderQueryVectorApprovalStatus =
  | "blocked"
  | "degraded"
  | "ready_for_provider_query_vector_implementation_approval";

export interface MemoryRetrievalProviderQueryVectorApprovalInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase742ProviderExecutionWiringComplete?: boolean;
  phase743ProviderExecutionAcceptanceComplete?: boolean;
  phase812CoreReadRouteComplete?: boolean;
  phase814CoreHostFixtureEnvWiringComplete?: boolean;
  providerQueryVectorPlanReviewed?: boolean;
  explicitOptInEnvKeyReviewed?: boolean;
  queryInputSanitizationPlanReviewed?: boolean;
  providerExecutionPreflightPlanReviewed?: boolean;
  boundedTimeoutPlanReviewed?: boolean;
  vectorShapeValidationPlanReviewed?: boolean;
  failClosedNoRecallPlanReviewed?: boolean;
  noVectorPersistencePlanReviewed?: boolean;
  noUiDefaultChangePlanReviewed?: boolean;
  rollbackSmokePlanReviewed?: boolean;
  futureImplementationApprovalRequired?: boolean;
  verificationClean?: boolean;
  envValueRead?: boolean;
  providerQueryVectorImplemented?: boolean;
  providerExecutionRouted?: boolean;
  helperEmbedCalled?: boolean;
  rawVectorsReturned?: boolean;
  rawVectorsLoggedOrExposed?: boolean;
  rawTextExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathsExposed?: boolean;
  phase743VectorsPersisted?: boolean;
  realRuntimeVectorsPersisted?: boolean;
  memoryVectorDataWritten?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  defaultOptInChanged?: boolean;
  fixtureFallbackChanged?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface MemoryRetrievalProviderQueryVectorApprovalChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase742ProviderExecutionWiringComplete: boolean;
  phase743ProviderExecutionAcceptanceComplete: boolean;
  phase812CoreReadRouteComplete: boolean;
  phase814CoreHostFixtureEnvWiringComplete: boolean;
  providerQueryVectorPlanReviewed: boolean;
  explicitOptInEnvKeyReviewed: boolean;
  queryInputSanitizationPlanReviewed: boolean;
  providerExecutionPreflightPlanReviewed: boolean;
  boundedTimeoutPlanReviewed: boolean;
  vectorShapeValidationPlanReviewed: boolean;
  failClosedNoRecallPlanReviewed: boolean;
  noVectorPersistencePlanReviewed: boolean;
  noUiDefaultChangePlanReviewed: boolean;
  rollbackSmokePlanReviewed: boolean;
  futureImplementationApprovalRequired: boolean;
  envValueNotRead: boolean;
  providerQueryVectorNotImplemented: boolean;
  providerExecutionNotRouted: boolean;
  helperEmbedNotCalled: boolean;
  rawVectorsNotReturned: boolean;
  rawVectorsNotLoggedOrExposed: boolean;
  rawTextExposureDisabled: boolean;
  rawDiagnosticsExposureDisabled: boolean;
  privatePathExposureDisabled: boolean;
  phase743VectorsNotPersisted: boolean;
  realRuntimeVectorsNotPersisted: boolean;
  memoryVectorDataNotWritten: boolean;
  sqliteSchemaMigrationDisabled: boolean;
  desktopIpcUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  defaultOptInUnchanged: boolean;
  fixtureFallbackUnchanged: boolean;
  modelOutputShellExecutionDisabled: boolean;
  verificationClean: boolean;
}

export interface MemoryRetrievalProviderQueryVectorApprovalResult {
  phase: "8.15";
  capability: "memory_retrieval_provider_query_vector";
  envKey: typeof MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV;
  status: MemoryRetrievalProviderQueryVectorApprovalStatus;
  accepted: boolean;
  readyForProviderQueryVectorImplementationApproval: boolean;
  approvalGateOnly: true;
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  futureImplementationApprovalRequired: true;
  envValueRead: false;
  providerQueryVectorImplemented: false;
  providerExecutionRouted: false;
  helperEmbedCalled: false;
  rawVectorsReturned: false;
  rawVectorsLoggedOrExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathsExposed: false;
  phase743VectorsPersisted: false;
  realRuntimeVectorsPersisted: false;
  memoryVectorDataWritten: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  fixtureFallbackChanged: false;
  modelOutputShellExecutionEnabled: false;
  reviewedAreas: string[];
  checks: MemoryRetrievalProviderQueryVectorApprovalChecks;
  reasons: string[];
}

export interface MemoryRetrievalProviderQueryVectorSafetyObservation {
  id: string;
  providerQueryVectorPlanObserved: boolean;
  rollbackPlanObserved: boolean;
  resultStatus: "ok" | "degraded" | "blocked";
  envValueRead?: boolean;
  providerQueryVectorObserved?: boolean;
  providerExecutionObserved?: boolean;
  helperEmbedObserved?: boolean;
  rawVectorReturnedObserved?: boolean;
  rawVectorLoggedObserved?: boolean;
  rawTextObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  privatePathObserved?: boolean;
  phase743VectorObserved?: boolean;
  realRuntimeVectorObserved?: boolean;
  memoryVectorWriteObserved?: boolean;
  sqliteMigrationObserved?: boolean;
  desktopIpcObserved?: boolean;
  uiBehaviorObserved?: boolean;
  providerVisibilityObserved?: boolean;
  defaultOptInObserved?: boolean;
  fixtureFallbackObserved?: boolean;
  shellExecutionObserved?: boolean;
}

export interface MemoryRetrievalProviderQueryVectorSafetyReport {
  phase: "8.15";
  status: "approval_gate" | "degraded" | "blocked";
  approvalGateOnly: true;
  envValueRead: false;
  providerQueryVectorImplemented: false;
  providerExecutionRouted: false;
  helperEmbedCalled: false;
  rawVectorsReturned: false;
  rawVectorsLoggedOrExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathsExposed: false;
  phase743VectorsPersisted: false;
  realRuntimeVectorsPersisted: false;
  memoryVectorDataWritten: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  fixtureFallbackChanged: false;
  modelOutputShellExecutionEnabled: false;
  observationCount: number;
  providerQueryVectorPlanCount: number;
  rollbackPlanCount: number;
  degradedObservationCount: number;
  blockedObservationCount: number;
  reasonCodes: string[];
}

export function evaluateMemoryRetrievalProviderQueryVectorApprovalGate(
  input: MemoryRetrievalProviderQueryVectorApprovalInput = {}
): MemoryRetrievalProviderQueryVectorApprovalResult {
  const checks: MemoryRetrievalProviderQueryVectorApprovalChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase742ProviderExecutionWiringComplete:
      input.phase742ProviderExecutionWiringComplete === true,
    phase743ProviderExecutionAcceptanceComplete:
      input.phase743ProviderExecutionAcceptanceComplete === true,
    phase812CoreReadRouteComplete: input.phase812CoreReadRouteComplete === true,
    phase814CoreHostFixtureEnvWiringComplete:
      input.phase814CoreHostFixtureEnvWiringComplete === true,
    providerQueryVectorPlanReviewed:
      input.providerQueryVectorPlanReviewed === true,
    explicitOptInEnvKeyReviewed: input.explicitOptInEnvKeyReviewed === true,
    queryInputSanitizationPlanReviewed:
      input.queryInputSanitizationPlanReviewed === true,
    providerExecutionPreflightPlanReviewed:
      input.providerExecutionPreflightPlanReviewed === true,
    boundedTimeoutPlanReviewed: input.boundedTimeoutPlanReviewed === true,
    vectorShapeValidationPlanReviewed:
      input.vectorShapeValidationPlanReviewed === true,
    failClosedNoRecallPlanReviewed:
      input.failClosedNoRecallPlanReviewed === true,
    noVectorPersistencePlanReviewed:
      input.noVectorPersistencePlanReviewed === true,
    noUiDefaultChangePlanReviewed:
      input.noUiDefaultChangePlanReviewed === true,
    rollbackSmokePlanReviewed: input.rollbackSmokePlanReviewed === true,
    futureImplementationApprovalRequired:
      input.futureImplementationApprovalRequired === true,
    envValueNotRead: input.envValueRead === false,
    providerQueryVectorNotImplemented:
      input.providerQueryVectorImplemented === false,
    providerExecutionNotRouted: input.providerExecutionRouted === false,
    helperEmbedNotCalled: input.helperEmbedCalled === false,
    rawVectorsNotReturned: input.rawVectorsReturned === false,
    rawVectorsNotLoggedOrExposed: input.rawVectorsLoggedOrExposed === false,
    rawTextExposureDisabled: input.rawTextExposed === false,
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    phase743VectorsNotPersisted: input.phase743VectorsPersisted === false,
    realRuntimeVectorsNotPersisted:
      input.realRuntimeVectorsPersisted === false,
    memoryVectorDataNotWritten: input.memoryVectorDataWritten === false,
    sqliteSchemaMigrationDisabled:
      input.sqliteSchemaMigrationEnabled === false,
    desktopIpcUnchanged: input.desktopIpcChanged === false,
    uiBehaviorUnchanged: input.uiBehaviorChanged === false,
    providerVisibilityUnchanged: input.providerVisibilityChanged === false,
    defaultOptInUnchanged: input.defaultOptInChanged === false,
    fixtureFallbackUnchanged: input.fixtureFallbackChanged === false,
    modelOutputShellExecutionDisabled:
      input.modelOutputShellExecutionEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const evidenceReasons =
    createMemoryRetrievalProviderQueryVectorEvidenceReasons(checks);
  const blockingReasons =
    createMemoryRetrievalProviderQueryVectorBlockingReasons(checks);
  const accepted = evidenceReasons.length === 0 && blockingReasons.length === 0;

  return {
    phase: "8.15",
    capability: "memory_retrieval_provider_query_vector",
    envKey: MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV,
    status: accepted
      ? "ready_for_provider_query_vector_implementation_approval"
      : blockingReasons.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForProviderQueryVectorImplementationApproval: accepted,
    approvalGateOnly: true,
    productApprovalGranted: checks.productApprovalGranted,
    securityApprovalGranted: checks.securityApprovalGranted,
    futureImplementationApprovalRequired: true,
    envValueRead: false,
    providerQueryVectorImplemented: false,
    providerExecutionRouted: false,
    helperEmbedCalled: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathsExposed: false,
    phase743VectorsPersisted: false,
    realRuntimeVectorsPersisted: false,
    memoryVectorDataWritten: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    fixtureFallbackChanged: false,
    modelOutputShellExecutionEnabled: false,
    reviewedAreas: accepted
      ? [
          "provider_query_vector_plan",
          "explicit_opt_in_env_key",
          "query_input_sanitization",
          "provider_execution_preflight",
          "bounded_timeout_and_cancellation",
          "vector_shape_validation",
          "fail_closed_no_recall",
          "no_vector_persistence",
          "ui_default_behavior_unchanged",
          "rollback_smoke"
        ]
      : [],
    checks,
    reasons: accepted
      ? [
          "Memory retrieval provider query-vector gate is ready for separate implementation approval."
        ]
      : [...evidenceReasons, ...blockingReasons]
  };
}

export function evaluateMemoryRetrievalProviderQueryVectorSafety(
  observations: readonly MemoryRetrievalProviderQueryVectorSafetyObservation[]
): MemoryRetrievalProviderQueryVectorSafetyReport {
  if (observations.length < 1 || observations.length > 100) {
    return createMemoryRetrievalProviderQueryVectorSafetyReport(
      [],
      ["OBSERVATION_COUNT_INVALID"]
    );
  }

  const reasonCodes =
    createMemoryRetrievalProviderQueryVectorSafetyReasons(observations);
  const degradedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "degraded"
  ).length;
  const blockedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "blocked"
  ).length;

  return createMemoryRetrievalProviderQueryVectorSafetyReport(
    observations,
    reasonCodes,
    degradedObservationCount,
    blockedObservationCount
  );
}

function createMemoryRetrievalProviderQueryVectorEvidenceReasons(
  checks: MemoryRetrievalProviderQueryVectorApprovalChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.15.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.15.");
  }
  if (!checks.phase742ProviderExecutionWiringComplete) {
    reasons.push("Phase 7.42 provider execution wiring must be complete.");
  }
  if (!checks.phase743ProviderExecutionAcceptanceComplete) {
    reasons.push("Phase 7.43 provider execution acceptance must be complete.");
  }
  if (!checks.phase812CoreReadRouteComplete) {
    reasons.push("Phase 8.12 Core read route must be complete.");
  }
  if (!checks.phase814CoreHostFixtureEnvWiringComplete) {
    reasons.push("Phase 8.14 Core Host fixture env wiring must be complete.");
  }
  if (!checks.providerQueryVectorPlanReviewed) {
    reasons.push("Provider query-vector plan review is required.");
  }
  if (!checks.explicitOptInEnvKeyReviewed) {
    reasons.push("Explicit opt-in env key review is required.");
  }
  if (!checks.queryInputSanitizationPlanReviewed) {
    reasons.push("Query input sanitization plan review is required.");
  }
  if (!checks.providerExecutionPreflightPlanReviewed) {
    reasons.push("Provider execution preflight plan review is required.");
  }
  if (!checks.boundedTimeoutPlanReviewed) {
    reasons.push("Bounded timeout and cancellation plan review is required.");
  }
  if (!checks.vectorShapeValidationPlanReviewed) {
    reasons.push("Vector shape validation plan review is required.");
  }
  if (!checks.failClosedNoRecallPlanReviewed) {
    reasons.push("Fail-closed no-recall plan review is required.");
  }
  if (!checks.noVectorPersistencePlanReviewed) {
    reasons.push("No-vector-persistence plan review is required.");
  }
  if (!checks.noUiDefaultChangePlanReviewed) {
    reasons.push("UI/default behavior unchanged plan review is required.");
  }
  if (!checks.rollbackSmokePlanReviewed) {
    reasons.push("Rollback smoke plan review is required.");
  }
  if (!checks.futureImplementationApprovalRequired) {
    reasons.push("Future implementation approval requirement is required.");
  }
  if (!checks.verificationClean) {
    reasons.push("Clean verification evidence is required.");
  }

  return reasons;
}

function createMemoryRetrievalProviderQueryVectorBlockingReasons(
  checks: MemoryRetrievalProviderQueryVectorApprovalChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.envValueNotRead) {
    reasons.push("Environment value reads are blocked in this approval gate.");
  }
  if (!checks.providerQueryVectorNotImplemented) {
    reasons.push("Provider query-vector implementation is blocked.");
  }
  if (!checks.providerExecutionNotRouted) {
    reasons.push("Provider execution routing is blocked.");
  }
  if (!checks.helperEmbedNotCalled) {
    reasons.push("Helper embed calls are blocked.");
  }
  if (!checks.rawVectorsNotReturned) {
    reasons.push("Returning raw vectors is blocked.");
  }
  if (!checks.rawVectorsNotLoggedOrExposed) {
    reasons.push("Logging or exposing raw vectors is blocked.");
  }
  if (!checks.rawTextExposureDisabled) {
    reasons.push("Raw text exposure is blocked.");
  }
  if (!checks.rawDiagnosticsExposureDisabled) {
    reasons.push("Raw diagnostic exposure is blocked.");
  }
  if (!checks.privatePathExposureDisabled) {
    reasons.push("Private path exposure is blocked.");
  }
  if (!checks.phase743VectorsNotPersisted) {
    reasons.push("Phase 7.43 vectors must not be persisted.");
  }
  if (!checks.realRuntimeVectorsNotPersisted) {
    reasons.push("Real runtime vectors must not be persisted.");
  }
  if (!checks.memoryVectorDataNotWritten) {
    reasons.push("Memory vector writes are blocked.");
  }
  if (!checks.sqliteSchemaMigrationDisabled) {
    reasons.push("SQLite schema/index migration is blocked.");
  }
  if (!checks.desktopIpcUnchanged) {
    reasons.push("Desktop IPC must remain unchanged.");
  }
  if (!checks.uiBehaviorUnchanged) {
    reasons.push("UI behavior must remain unchanged.");
  }
  if (!checks.providerVisibilityUnchanged) {
    reasons.push("Provider visibility must remain unchanged.");
  }
  if (!checks.defaultOptInUnchanged) {
    reasons.push("Default opt-in must remain unchanged.");
  }
  if (!checks.fixtureFallbackUnchanged) {
    reasons.push("Fixture fallback must remain unchanged.");
  }
  if (!checks.modelOutputShellExecutionDisabled) {
    reasons.push("Retrieval output must not become shell execution.");
  }

  return reasons;
}

function createMemoryRetrievalProviderQueryVectorSafetyReport(
  observations: readonly MemoryRetrievalProviderQueryVectorSafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0,
  blockedObservationCount = 0
): MemoryRetrievalProviderQueryVectorSafetyReport {
  return {
    phase: "8.15",
    status:
      reasonCodes.length > 0
        ? "blocked"
        : degradedObservationCount > 0
          ? "degraded"
          : "approval_gate",
    approvalGateOnly: true,
    envValueRead: false,
    providerQueryVectorImplemented: false,
    providerExecutionRouted: false,
    helperEmbedCalled: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathsExposed: false,
    phase743VectorsPersisted: false,
    realRuntimeVectorsPersisted: false,
    memoryVectorDataWritten: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    fixtureFallbackChanged: false,
    modelOutputShellExecutionEnabled: false,
    observationCount: observations.length,
    providerQueryVectorPlanCount: observations.filter(
      (observation) => observation.providerQueryVectorPlanObserved
    ).length,
    rollbackPlanCount: observations.filter(
      (observation) => observation.rollbackPlanObserved
    ).length,
    degradedObservationCount,
    blockedObservationCount,
    reasonCodes
  };
}

function createMemoryRetrievalProviderQueryVectorSafetyReasons(
  observations: readonly MemoryRetrievalProviderQueryVectorSafetyObservation[]
): string[] {
  const reasons = new Set<string>();

  for (const observation of observations) {
    if (observation.resultStatus === "blocked") {
      reasons.add("BLOCKED_OBSERVATION");
    }
    if (observation.envValueRead) {
      reasons.add("ENV_VALUE_READ");
    }
    if (observation.providerQueryVectorObserved) {
      reasons.add("PROVIDER_QUERY_VECTOR_OBSERVED");
    }
    if (observation.providerExecutionObserved) {
      reasons.add("PROVIDER_EXECUTION_OBSERVED");
    }
    if (observation.helperEmbedObserved) {
      reasons.add("HELPER_EMBED_OBSERVED");
    }
    if (observation.rawVectorReturnedObserved) {
      reasons.add("RAW_VECTOR_RETURNED_OBSERVED");
    }
    if (observation.rawVectorLoggedObserved) {
      reasons.add("RAW_VECTOR_LOGGED_OBSERVED");
    }
    if (observation.rawTextObserved) {
      reasons.add("RAW_TEXT_OBSERVED");
    }
    if (observation.rawDiagnosticsObserved) {
      reasons.add("RAW_DIAGNOSTICS_OBSERVED");
    }
    if (observation.privatePathObserved) {
      reasons.add("PRIVATE_PATH_OBSERVED");
    }
    if (observation.phase743VectorObserved) {
      reasons.add("PHASE_7_43_VECTOR_OBSERVED");
    }
    if (observation.realRuntimeVectorObserved) {
      reasons.add("REAL_RUNTIME_VECTOR_OBSERVED");
    }
    if (observation.memoryVectorWriteObserved) {
      reasons.add("MEMORY_VECTOR_WRITE_OBSERVED");
    }
    if (observation.sqliteMigrationObserved) {
      reasons.add("SQLITE_MIGRATION_OBSERVED");
    }
    if (observation.desktopIpcObserved) {
      reasons.add("DESKTOP_IPC_OBSERVED");
    }
    if (observation.uiBehaviorObserved) {
      reasons.add("UI_BEHAVIOR_OBSERVED");
    }
    if (observation.providerVisibilityObserved) {
      reasons.add("PROVIDER_VISIBILITY_OBSERVED");
    }
    if (observation.defaultOptInObserved) {
      reasons.add("DEFAULT_OPT_IN_OBSERVED");
    }
    if (observation.fixtureFallbackObserved) {
      reasons.add("FIXTURE_FALLBACK_OBSERVED");
    }
    if (observation.shellExecutionObserved) {
      reasons.add("SHELL_EXECUTION_OBSERVED");
    }
  }

  return [...reasons].sort();
}
