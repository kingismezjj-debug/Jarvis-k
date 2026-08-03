export const MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV =
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES";

export type MemoryProviderVectorWriteApprovalStatus =
  | "blocked"
  | "degraded"
  | "ready_for_provider_vector_write_implementation_approval";

export interface MemoryProviderVectorWriteApprovalInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase742ProviderExecutionWiringComplete?: boolean;
  phase743ProviderExecutionAcceptanceComplete?: boolean;
  phase85SqliteVectorSchemaComplete?: boolean;
  phase87FixtureVectorWriteComplete?: boolean;
  phase89FixtureVectorQueryComplete?: boolean;
  phase812CoreReadRouteComplete?: boolean;
  phase816ProviderQueryVectorComplete?: boolean;
  phase818ProviderQueryVectorAcceptanceComplete?: boolean;
  providerVectorWritePlanReviewed?: boolean;
  explicitOptInEnvKeyReviewed?: boolean;
  sourceRecordSelectionPlanReviewed?: boolean;
  sourceTextMinimizationPlanReviewed?: boolean;
  vectorShapeValidationPlanReviewed?: boolean;
  modelIdAndProviderAllowlistReviewed?: boolean;
  duplicateAndUpdatePolicyReviewed?: boolean;
  rollbackDeletePlanReviewed?: boolean;
  sanitizedFailureMappingReviewed?: boolean;
  noUiDefaultChangePlanReviewed?: boolean;
  futureImplementationApprovalRequired?: boolean;
  verificationClean?: boolean;
  envValueRead?: boolean;
  providerVectorWriteImplemented?: boolean;
  providerExecutionRoutedForWrites?: boolean;
  helperEmbedCalledForWrites?: boolean;
  rawVectorsReturned?: boolean;
  rawVectorsLoggedOrExposed?: boolean;
  rawTextExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathsExposed?: boolean;
  signedUrlOrCredentialPersisted?: boolean;
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

export interface MemoryProviderVectorWriteApprovalChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase742ProviderExecutionWiringComplete: boolean;
  phase743ProviderExecutionAcceptanceComplete: boolean;
  phase85SqliteVectorSchemaComplete: boolean;
  phase87FixtureVectorWriteComplete: boolean;
  phase89FixtureVectorQueryComplete: boolean;
  phase812CoreReadRouteComplete: boolean;
  phase816ProviderQueryVectorComplete: boolean;
  phase818ProviderQueryVectorAcceptanceComplete: boolean;
  providerVectorWritePlanReviewed: boolean;
  explicitOptInEnvKeyReviewed: boolean;
  sourceRecordSelectionPlanReviewed: boolean;
  sourceTextMinimizationPlanReviewed: boolean;
  vectorShapeValidationPlanReviewed: boolean;
  modelIdAndProviderAllowlistReviewed: boolean;
  duplicateAndUpdatePolicyReviewed: boolean;
  rollbackDeletePlanReviewed: boolean;
  sanitizedFailureMappingReviewed: boolean;
  noUiDefaultChangePlanReviewed: boolean;
  futureImplementationApprovalRequired: boolean;
  envValueNotRead: boolean;
  providerVectorWriteNotImplemented: boolean;
  providerExecutionNotRoutedForWrites: boolean;
  helperEmbedNotCalledForWrites: boolean;
  rawVectorsNotReturned: boolean;
  rawVectorsNotLoggedOrExposed: boolean;
  rawTextExposureDisabled: boolean;
  rawDiagnosticsExposureDisabled: boolean;
  privatePathExposureDisabled: boolean;
  signedUrlOrCredentialPersistenceDisabled: boolean;
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

export interface MemoryProviderVectorWriteApprovalResult {
  phase: "8.19";
  capability: "memory_provider_vector_write";
  envKey: typeof MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV;
  status: MemoryProviderVectorWriteApprovalStatus;
  accepted: boolean;
  readyForProviderVectorWriteImplementationApproval: boolean;
  approvalGateOnly: true;
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  futureImplementationApprovalRequired: true;
  envValueRead: false;
  providerVectorWriteImplemented: false;
  providerExecutionRoutedForWrites: false;
  helperEmbedCalledForWrites: false;
  rawVectorsReturned: false;
  rawVectorsLoggedOrExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathsExposed: false;
  signedUrlOrCredentialPersisted: false;
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
  checks: MemoryProviderVectorWriteApprovalChecks;
  reasons: string[];
}

export interface MemoryProviderVectorWriteSafetyObservation {
  id: string;
  providerVectorWritePlanObserved: boolean;
  rollbackDeletePlanObserved: boolean;
  resultStatus: "ok" | "degraded" | "blocked";
  envValueRead?: boolean;
  providerVectorWriteObserved?: boolean;
  providerExecutionForWriteObserved?: boolean;
  helperEmbedForWriteObserved?: boolean;
  rawVectorReturnedObserved?: boolean;
  rawVectorLoggedObserved?: boolean;
  rawTextObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  privatePathObserved?: boolean;
  credentialObserved?: boolean;
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

export interface MemoryProviderVectorWriteSafetyReport {
  phase: "8.19";
  status: "approval_gate" | "degraded" | "blocked";
  approvalGateOnly: true;
  envValueRead: false;
  providerVectorWriteImplemented: false;
  providerExecutionRoutedForWrites: false;
  helperEmbedCalledForWrites: false;
  rawVectorsReturned: false;
  rawVectorsLoggedOrExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathsExposed: false;
  signedUrlOrCredentialPersisted: false;
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
  providerVectorWritePlanCount: number;
  rollbackDeletePlanCount: number;
  degradedObservationCount: number;
  blockedObservationCount: number;
  reasonCodes: string[];
}

export function evaluateMemoryProviderVectorWriteApprovalGate(
  input: MemoryProviderVectorWriteApprovalInput = {}
): MemoryProviderVectorWriteApprovalResult {
  const checks: MemoryProviderVectorWriteApprovalChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase742ProviderExecutionWiringComplete:
      input.phase742ProviderExecutionWiringComplete === true,
    phase743ProviderExecutionAcceptanceComplete:
      input.phase743ProviderExecutionAcceptanceComplete === true,
    phase85SqliteVectorSchemaComplete:
      input.phase85SqliteVectorSchemaComplete === true,
    phase87FixtureVectorWriteComplete:
      input.phase87FixtureVectorWriteComplete === true,
    phase89FixtureVectorQueryComplete:
      input.phase89FixtureVectorQueryComplete === true,
    phase812CoreReadRouteComplete: input.phase812CoreReadRouteComplete === true,
    phase816ProviderQueryVectorComplete:
      input.phase816ProviderQueryVectorComplete === true,
    phase818ProviderQueryVectorAcceptanceComplete:
      input.phase818ProviderQueryVectorAcceptanceComplete === true,
    providerVectorWritePlanReviewed:
      input.providerVectorWritePlanReviewed === true,
    explicitOptInEnvKeyReviewed: input.explicitOptInEnvKeyReviewed === true,
    sourceRecordSelectionPlanReviewed:
      input.sourceRecordSelectionPlanReviewed === true,
    sourceTextMinimizationPlanReviewed:
      input.sourceTextMinimizationPlanReviewed === true,
    vectorShapeValidationPlanReviewed:
      input.vectorShapeValidationPlanReviewed === true,
    modelIdAndProviderAllowlistReviewed:
      input.modelIdAndProviderAllowlistReviewed === true,
    duplicateAndUpdatePolicyReviewed:
      input.duplicateAndUpdatePolicyReviewed === true,
    rollbackDeletePlanReviewed: input.rollbackDeletePlanReviewed === true,
    sanitizedFailureMappingReviewed:
      input.sanitizedFailureMappingReviewed === true,
    noUiDefaultChangePlanReviewed:
      input.noUiDefaultChangePlanReviewed === true,
    futureImplementationApprovalRequired:
      input.futureImplementationApprovalRequired === true,
    envValueNotRead: input.envValueRead === false,
    providerVectorWriteNotImplemented:
      input.providerVectorWriteImplemented === false,
    providerExecutionNotRoutedForWrites:
      input.providerExecutionRoutedForWrites === false,
    helperEmbedNotCalledForWrites:
      input.helperEmbedCalledForWrites === false,
    rawVectorsNotReturned: input.rawVectorsReturned === false,
    rawVectorsNotLoggedOrExposed:
      input.rawVectorsLoggedOrExposed === false,
    rawTextExposureDisabled: input.rawTextExposed === false,
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    signedUrlOrCredentialPersistenceDisabled:
      input.signedUrlOrCredentialPersisted === false,
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
  const evidenceReasons = createEvidenceReasons(checks);
  const blockingReasons = createBlockingReasons(checks);
  const accepted = evidenceReasons.length === 0 && blockingReasons.length === 0;

  return {
    phase: "8.19",
    capability: "memory_provider_vector_write",
    envKey: MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV,
    status: accepted
      ? "ready_for_provider_vector_write_implementation_approval"
      : blockingReasons.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForProviderVectorWriteImplementationApproval: accepted,
    approvalGateOnly: true,
    productApprovalGranted: checks.productApprovalGranted,
    securityApprovalGranted: checks.securityApprovalGranted,
    futureImplementationApprovalRequired: true,
    envValueRead: false,
    providerVectorWriteImplemented: false,
    providerExecutionRoutedForWrites: false,
    helperEmbedCalledForWrites: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathsExposed: false,
    signedUrlOrCredentialPersisted: false,
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
          "provider_vector_write_plan",
          "explicit_opt_in_env_key",
          "source_record_selection",
          "source_text_minimization",
          "vector_shape_validation",
          "model_id_and_provider_allowlist",
          "duplicate_and_update_policy",
          "rollback_delete_plan",
          "sanitized_failure_mapping",
          "ui_default_behavior_unchanged"
        ]
      : [],
    checks,
    reasons: accepted
      ? [
          "Memory provider vector write gate is ready for separate implementation approval."
        ]
      : [...evidenceReasons, ...blockingReasons]
  };
}

export function evaluateMemoryProviderVectorWriteSafety(
  observations: readonly MemoryProviderVectorWriteSafetyObservation[]
): MemoryProviderVectorWriteSafetyReport {
  if (observations.length < 1 || observations.length > 100) {
    return createSafetyReport([], ["OBSERVATION_COUNT_INVALID"]);
  }

  const reasonCodes = createSafetyReasonCodes(observations);
  const degradedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "degraded"
  ).length;
  const blockedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "blocked"
  ).length;

  return createSafetyReport(
    observations,
    reasonCodes,
    degradedObservationCount,
    blockedObservationCount
  );
}

function createEvidenceReasons(
  checks: MemoryProviderVectorWriteApprovalChecks
): string[] {
  const reasons: string[] = [];
  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.19.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.19.");
  }
  if (!checks.phase742ProviderExecutionWiringComplete) {
    reasons.push("Phase 7.42 provider execution wiring must be complete.");
  }
  if (!checks.phase743ProviderExecutionAcceptanceComplete) {
    reasons.push("Phase 7.43 provider execution acceptance must be complete.");
  }
  if (!checks.phase85SqliteVectorSchemaComplete) {
    reasons.push("Phase 8.5 SQLite vector schema must be complete.");
  }
  if (!checks.phase87FixtureVectorWriteComplete) {
    reasons.push("Phase 8.7 fixture vector write must be complete.");
  }
  if (!checks.phase89FixtureVectorQueryComplete) {
    reasons.push("Phase 8.9 fixture vector query must be complete.");
  }
  if (!checks.phase812CoreReadRouteComplete) {
    reasons.push("Phase 8.12 Core read route must be complete.");
  }
  if (!checks.phase816ProviderQueryVectorComplete) {
    reasons.push("Phase 8.16 provider query-vector route must be complete.");
  }
  if (!checks.phase818ProviderQueryVectorAcceptanceComplete) {
    reasons.push("Phase 8.18 provider query-vector acceptance must be complete.");
  }
  if (!checks.providerVectorWritePlanReviewed) {
    reasons.push("Provider vector write plan review is required.");
  }
  if (!checks.explicitOptInEnvKeyReviewed) {
    reasons.push("Explicit opt-in env key review is required.");
  }
  if (!checks.sourceRecordSelectionPlanReviewed) {
    reasons.push("Source record selection plan review is required.");
  }
  if (!checks.sourceTextMinimizationPlanReviewed) {
    reasons.push("Source text minimization plan review is required.");
  }
  if (!checks.vectorShapeValidationPlanReviewed) {
    reasons.push("Vector shape validation plan review is required.");
  }
  if (!checks.modelIdAndProviderAllowlistReviewed) {
    reasons.push("Model ID and provider allowlist review is required.");
  }
  if (!checks.duplicateAndUpdatePolicyReviewed) {
    reasons.push("Duplicate and update policy review is required.");
  }
  if (!checks.rollbackDeletePlanReviewed) {
    reasons.push("Rollback delete plan review is required.");
  }
  if (!checks.sanitizedFailureMappingReviewed) {
    reasons.push("Sanitized failure mapping review is required.");
  }
  if (!checks.noUiDefaultChangePlanReviewed) {
    reasons.push("UI/default behavior unchanged plan review is required.");
  }
  if (!checks.futureImplementationApprovalRequired) {
    reasons.push("Future implementation approval requirement is required.");
  }
  if (!checks.verificationClean) {
    reasons.push("Clean verification evidence is required.");
  }
  return reasons;
}

function createBlockingReasons(
  checks: MemoryProviderVectorWriteApprovalChecks
): string[] {
  const reasons: string[] = [];
  if (!checks.envValueNotRead) {
    reasons.push("Environment value reads are blocked in this approval gate.");
  }
  if (!checks.providerVectorWriteNotImplemented) {
    reasons.push("Provider vector write implementation is blocked.");
  }
  if (!checks.providerExecutionNotRoutedForWrites) {
    reasons.push("Provider execution routing for writes is blocked.");
  }
  if (!checks.helperEmbedNotCalledForWrites) {
    reasons.push("Helper embed calls for writes are blocked.");
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
  if (!checks.signedUrlOrCredentialPersistenceDisabled) {
    reasons.push("Signed URL or credential persistence is blocked.");
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

function createSafetyReport(
  observations: readonly MemoryProviderVectorWriteSafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0,
  blockedObservationCount = 0
): MemoryProviderVectorWriteSafetyReport {
  return {
    phase: "8.19",
    status:
      reasonCodes.length > 0
        ? "blocked"
        : degradedObservationCount > 0
          ? "degraded"
          : "approval_gate",
    approvalGateOnly: true,
    envValueRead: false,
    providerVectorWriteImplemented: false,
    providerExecutionRoutedForWrites: false,
    helperEmbedCalledForWrites: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathsExposed: false,
    signedUrlOrCredentialPersisted: false,
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
    providerVectorWritePlanCount: observations.filter(
      (observation) => observation.providerVectorWritePlanObserved
    ).length,
    rollbackDeletePlanCount: observations.filter(
      (observation) => observation.rollbackDeletePlanObserved
    ).length,
    degradedObservationCount,
    blockedObservationCount,
    reasonCodes
  };
}

function createSafetyReasonCodes(
  observations: readonly MemoryProviderVectorWriteSafetyObservation[]
): string[] {
  const reasonCodes = new Set<string>();
  for (const observation of observations) {
    if (observation.resultStatus === "blocked") {
      reasonCodes.add("BLOCKED_OBSERVATION");
    }
    if (observation.envValueRead) {
      reasonCodes.add("ENV_VALUE_READ");
    }
    if (observation.providerVectorWriteObserved) {
      reasonCodes.add("PROVIDER_VECTOR_WRITE_OBSERVED");
    }
    if (observation.providerExecutionForWriteObserved) {
      reasonCodes.add("PROVIDER_EXECUTION_FOR_WRITE_OBSERVED");
    }
    if (observation.helperEmbedForWriteObserved) {
      reasonCodes.add("HELPER_EMBED_FOR_WRITE_OBSERVED");
    }
    if (observation.rawVectorReturnedObserved) {
      reasonCodes.add("RAW_VECTOR_RETURNED_OBSERVED");
    }
    if (observation.rawVectorLoggedObserved) {
      reasonCodes.add("RAW_VECTOR_LOGGED_OBSERVED");
    }
    if (observation.rawTextObserved) {
      reasonCodes.add("RAW_TEXT_OBSERVED");
    }
    if (observation.rawDiagnosticsObserved) {
      reasonCodes.add("RAW_DIAGNOSTICS_OBSERVED");
    }
    if (observation.privatePathObserved) {
      reasonCodes.add("PRIVATE_PATH_OBSERVED");
    }
    if (observation.credentialObserved) {
      reasonCodes.add("CREDENTIAL_OBSERVED");
    }
    if (observation.phase743VectorObserved) {
      reasonCodes.add("PHASE_7_43_VECTOR_OBSERVED");
    }
    if (observation.realRuntimeVectorObserved) {
      reasonCodes.add("REAL_RUNTIME_VECTOR_OBSERVED");
    }
    if (observation.memoryVectorWriteObserved) {
      reasonCodes.add("MEMORY_VECTOR_WRITE_OBSERVED");
    }
    if (observation.sqliteMigrationObserved) {
      reasonCodes.add("SQLITE_MIGRATION_OBSERVED");
    }
    if (observation.desktopIpcObserved) {
      reasonCodes.add("DESKTOP_IPC_OBSERVED");
    }
    if (observation.uiBehaviorObserved) {
      reasonCodes.add("UI_BEHAVIOR_OBSERVED");
    }
    if (observation.providerVisibilityObserved) {
      reasonCodes.add("PROVIDER_VISIBILITY_OBSERVED");
    }
    if (observation.defaultOptInObserved) {
      reasonCodes.add("DEFAULT_OPT_IN_OBSERVED");
    }
    if (observation.fixtureFallbackObserved) {
      reasonCodes.add("FIXTURE_FALLBACK_OBSERVED");
    }
    if (observation.shellExecutionObserved) {
      reasonCodes.add("SHELL_EXECUTION_OBSERVED");
    }
  }
  return [...reasonCodes].sort();
}
