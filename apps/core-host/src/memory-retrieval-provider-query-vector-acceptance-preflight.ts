export const MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV =
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE";

export type MemoryRetrievalProviderQueryVectorAcceptancePreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_acceptance_diagnostic_approval";

export interface MemoryRetrievalProviderQueryVectorAcceptancePreflightInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase743ProviderExecutionAcceptanceComplete?: boolean;
  phase816ProviderBackedQueryVectorComplete?: boolean;
  productPathDiagnosticPlanReviewed?: boolean;
  explicitAcceptanceEnvReviewed?: boolean;
  localRuntimeEnvironmentPlanReviewed?: boolean;
  localArtifactDigestVerificationPlanReviewed?: boolean;
  sanitizedReportPlanReviewed?: boolean;
  noVectorPersistencePlanReviewed?: boolean;
  noMemoryWritePlanReviewed?: boolean;
  cleanupPlanReviewed?: boolean;
  rollbackPlanReviewed?: boolean;
  verificationClean?: boolean;
  acceptanceEnvRead?: boolean;
  runtimePythonRead?: boolean;
  modelArtifactPathRead?: boolean;
  providerExecutionCalled?: boolean;
  helperEmbedCalled?: boolean;
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
  modelOutputShellExecutionEnabled?: boolean;
}

export interface MemoryRetrievalProviderQueryVectorAcceptancePreflightChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase743ProviderExecutionAcceptanceComplete: boolean;
  phase816ProviderBackedQueryVectorComplete: boolean;
  productPathDiagnosticPlanReviewed: boolean;
  explicitAcceptanceEnvReviewed: boolean;
  localRuntimeEnvironmentPlanReviewed: boolean;
  localArtifactDigestVerificationPlanReviewed: boolean;
  sanitizedReportPlanReviewed: boolean;
  noVectorPersistencePlanReviewed: boolean;
  noMemoryWritePlanReviewed: boolean;
  cleanupPlanReviewed: boolean;
  rollbackPlanReviewed: boolean;
  acceptanceEnvNotRead: boolean;
  runtimePythonNotRead: boolean;
  modelArtifactPathNotRead: boolean;
  providerExecutionNotCalled: boolean;
  helperEmbedNotCalled: boolean;
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
  modelOutputShellExecutionDisabled: boolean;
  verificationClean: boolean;
}

export interface MemoryRetrievalProviderQueryVectorAcceptancePreflightResult {
  phase: "8.17";
  capability: "memory_retrieval_provider_query_vector_acceptance";
  envKey: typeof MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV;
  status: MemoryRetrievalProviderQueryVectorAcceptancePreflightStatus;
  accepted: boolean;
  readyForAcceptanceDiagnosticApproval: boolean;
  preflightOnly: true;
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  acceptanceEnvRead: false;
  runtimePythonRead: false;
  modelArtifactPathRead: false;
  providerExecutionCalled: false;
  helperEmbedCalled: false;
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
  modelOutputShellExecutionEnabled: false;
  reviewedAreas: string[];
  checks: MemoryRetrievalProviderQueryVectorAcceptancePreflightChecks;
  reasons: string[];
}

export interface MemoryRetrievalProviderQueryVectorAcceptanceSafetyObservation {
  id: string;
  diagnosticPlanObserved: boolean;
  sanitizedReportObserved: boolean;
  cleanupPlanObserved: boolean;
  resultStatus: "ok" | "degraded" | "blocked";
  acceptanceEnvRead?: boolean;
  runtimePythonRead?: boolean;
  modelArtifactPathRead?: boolean;
  providerExecutionObserved?: boolean;
  helperEmbedObserved?: boolean;
  rawVectorObserved?: boolean;
  rawTextObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  privatePathObserved?: boolean;
  credentialObserved?: boolean;
  vectorPersistenceObserved?: boolean;
  memoryWriteObserved?: boolean;
  sqliteMigrationObserved?: boolean;
  desktopIpcObserved?: boolean;
  uiBehaviorObserved?: boolean;
  providerVisibilityObserved?: boolean;
  defaultOptInObserved?: boolean;
  shellExecutionObserved?: boolean;
}

export interface MemoryRetrievalProviderQueryVectorAcceptanceSafetyReport {
  phase: "8.17";
  status: "preflight_only" | "degraded" | "blocked";
  preflightOnly: true;
  providerExecutionCalled: false;
  helperEmbedCalled: false;
  rawVectorsReturned: false;
  rawVectorsLoggedOrExposed: false;
  memoryVectorDataWritten: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  modelOutputShellExecutionEnabled: false;
  observationCount: number;
  diagnosticPlanCount: number;
  sanitizedReportCount: number;
  cleanupPlanCount: number;
  degradedObservationCount: number;
  blockedObservationCount: number;
  reasonCodes: string[];
}

export function evaluateMemoryRetrievalProviderQueryVectorAcceptancePreflight(
  input: MemoryRetrievalProviderQueryVectorAcceptancePreflightInput = {}
): MemoryRetrievalProviderQueryVectorAcceptancePreflightResult {
  const checks: MemoryRetrievalProviderQueryVectorAcceptancePreflightChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase743ProviderExecutionAcceptanceComplete:
      input.phase743ProviderExecutionAcceptanceComplete === true,
    phase816ProviderBackedQueryVectorComplete:
      input.phase816ProviderBackedQueryVectorComplete === true,
    productPathDiagnosticPlanReviewed:
      input.productPathDiagnosticPlanReviewed === true,
    explicitAcceptanceEnvReviewed:
      input.explicitAcceptanceEnvReviewed === true,
    localRuntimeEnvironmentPlanReviewed:
      input.localRuntimeEnvironmentPlanReviewed === true,
    localArtifactDigestVerificationPlanReviewed:
      input.localArtifactDigestVerificationPlanReviewed === true,
    sanitizedReportPlanReviewed: input.sanitizedReportPlanReviewed === true,
    noVectorPersistencePlanReviewed:
      input.noVectorPersistencePlanReviewed === true,
    noMemoryWritePlanReviewed: input.noMemoryWritePlanReviewed === true,
    cleanupPlanReviewed: input.cleanupPlanReviewed === true,
    rollbackPlanReviewed: input.rollbackPlanReviewed === true,
    acceptanceEnvNotRead: input.acceptanceEnvRead === false,
    runtimePythonNotRead: input.runtimePythonRead === false,
    modelArtifactPathNotRead: input.modelArtifactPathRead === false,
    providerExecutionNotCalled: input.providerExecutionCalled === false,
    helperEmbedNotCalled: input.helperEmbedCalled === false,
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
    modelOutputShellExecutionDisabled:
      input.modelOutputShellExecutionEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const evidenceReasons = createAcceptanceEvidenceReasons(checks);
  const blockingReasons = createAcceptanceBlockingReasons(checks);
  const accepted = evidenceReasons.length === 0 && blockingReasons.length === 0;

  return {
    phase: "8.17",
    capability: "memory_retrieval_provider_query_vector_acceptance",
    envKey: MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV,
    status: accepted
      ? "ready_for_acceptance_diagnostic_approval"
      : blockingReasons.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForAcceptanceDiagnosticApproval: accepted,
    preflightOnly: true,
    productApprovalGranted: checks.productApprovalGranted,
    securityApprovalGranted: checks.securityApprovalGranted,
    acceptanceEnvRead: false,
    runtimePythonRead: false,
    modelArtifactPathRead: false,
    providerExecutionCalled: false,
    helperEmbedCalled: false,
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
    modelOutputShellExecutionEnabled: false,
    reviewedAreas: accepted
      ? [
          "product_path_acceptance_diagnostic_plan",
          "explicit_acceptance_env",
          "local_runtime_environment_plan",
          "artifact_digest_verification_plan",
          "sanitized_report_shape",
          "no_vector_persistence",
          "no_memory_write",
          "cleanup_plan",
          "rollback_plan"
        ]
      : [],
    checks,
    reasons: accepted
      ? [
          "Memory retrieval provider query-vector acceptance preflight is ready for separate diagnostic approval."
        ]
      : [...evidenceReasons, ...blockingReasons]
  };
}

export function evaluateMemoryRetrievalProviderQueryVectorAcceptanceSafety(
  observations: readonly MemoryRetrievalProviderQueryVectorAcceptanceSafetyObservation[]
): MemoryRetrievalProviderQueryVectorAcceptanceSafetyReport {
  if (observations.length < 1 || observations.length > 100) {
    return createAcceptanceSafetyReport([], ["OBSERVATION_COUNT_INVALID"]);
  }

  const reasonCodes = createAcceptanceSafetyReasonCodes(observations);
  const degradedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "degraded"
  ).length;
  const blockedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "blocked"
  ).length;

  return createAcceptanceSafetyReport(
    observations,
    reasonCodes,
    degradedObservationCount,
    blockedObservationCount
  );
}

function createAcceptanceEvidenceReasons(
  checks: MemoryRetrievalProviderQueryVectorAcceptancePreflightChecks
): string[] {
  const reasons: string[] = [];
  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.17.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.17.");
  }
  if (!checks.phase743ProviderExecutionAcceptanceComplete) {
    reasons.push("Phase 7.43 provider execution acceptance must be complete.");
  }
  if (!checks.phase816ProviderBackedQueryVectorComplete) {
    reasons.push("Phase 8.16 provider-backed query vector must be complete.");
  }
  if (!checks.productPathDiagnosticPlanReviewed) {
    reasons.push("Product-path diagnostic plan review is required.");
  }
  if (!checks.explicitAcceptanceEnvReviewed) {
    reasons.push("Explicit acceptance env review is required.");
  }
  if (!checks.localRuntimeEnvironmentPlanReviewed) {
    reasons.push("Local runtime environment plan review is required.");
  }
  if (!checks.localArtifactDigestVerificationPlanReviewed) {
    reasons.push("Artifact digest verification plan review is required.");
  }
  if (!checks.sanitizedReportPlanReviewed) {
    reasons.push("Sanitized report plan review is required.");
  }
  if (!checks.noVectorPersistencePlanReviewed) {
    reasons.push("No-vector-persistence plan review is required.");
  }
  if (!checks.noMemoryWritePlanReviewed) {
    reasons.push("No-Memory-write plan review is required.");
  }
  if (!checks.cleanupPlanReviewed) {
    reasons.push("Cleanup plan review is required.");
  }
  if (!checks.rollbackPlanReviewed) {
    reasons.push("Rollback plan review is required.");
  }
  if (!checks.verificationClean) {
    reasons.push("Clean verification evidence is required.");
  }
  return reasons;
}

function createAcceptanceBlockingReasons(
  checks: MemoryRetrievalProviderQueryVectorAcceptancePreflightChecks
): string[] {
  const reasons: string[] = [];
  if (!checks.acceptanceEnvNotRead) {
    reasons.push("Acceptance env reads are blocked in this preflight.");
  }
  if (!checks.runtimePythonNotRead) {
    reasons.push("Runtime Python reads are blocked in this preflight.");
  }
  if (!checks.modelArtifactPathNotRead) {
    reasons.push("Model artifact path reads are blocked in this preflight.");
  }
  if (!checks.providerExecutionNotCalled) {
    reasons.push("Provider execution calls are blocked in this preflight.");
  }
  if (!checks.helperEmbedNotCalled) {
    reasons.push("Helper embed calls are blocked in this preflight.");
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
  if (!checks.modelOutputShellExecutionDisabled) {
    reasons.push("Retrieval output must not become shell execution.");
  }
  return reasons;
}

function createAcceptanceSafetyReport(
  observations: readonly MemoryRetrievalProviderQueryVectorAcceptanceSafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0,
  blockedObservationCount = 0
): MemoryRetrievalProviderQueryVectorAcceptanceSafetyReport {
  return {
    phase: "8.17",
    status:
      reasonCodes.length > 0
        ? "blocked"
        : degradedObservationCount > 0
          ? "degraded"
          : "preflight_only",
    preflightOnly: true,
    providerExecutionCalled: false,
    helperEmbedCalled: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    memoryVectorDataWritten: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    modelOutputShellExecutionEnabled: false,
    observationCount: observations.length,
    diagnosticPlanCount: observations.filter(
      (observation) => observation.diagnosticPlanObserved
    ).length,
    sanitizedReportCount: observations.filter(
      (observation) => observation.sanitizedReportObserved
    ).length,
    cleanupPlanCount: observations.filter(
      (observation) => observation.cleanupPlanObserved
    ).length,
    degradedObservationCount,
    blockedObservationCount,
    reasonCodes
  };
}

function createAcceptanceSafetyReasonCodes(
  observations: readonly MemoryRetrievalProviderQueryVectorAcceptanceSafetyObservation[]
): string[] {
  const reasonCodes = new Set<string>();
  for (const observation of observations) {
    if (observation.resultStatus === "blocked") {
      reasonCodes.add("BLOCKED_OBSERVATION");
    }
    if (observation.acceptanceEnvRead) {
      reasonCodes.add("ACCEPTANCE_ENV_READ");
    }
    if (observation.runtimePythonRead) {
      reasonCodes.add("RUNTIME_PYTHON_READ");
    }
    if (observation.modelArtifactPathRead) {
      reasonCodes.add("MODEL_ARTIFACT_PATH_READ");
    }
    if (observation.providerExecutionObserved) {
      reasonCodes.add("PROVIDER_EXECUTION_OBSERVED");
    }
    if (observation.helperEmbedObserved) {
      reasonCodes.add("HELPER_EMBED_OBSERVED");
    }
    if (observation.rawVectorObserved) {
      reasonCodes.add("RAW_VECTOR_OBSERVED");
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
    if (observation.vectorPersistenceObserved) {
      reasonCodes.add("VECTOR_PERSISTENCE_OBSERVED");
    }
    if (observation.memoryWriteObserved) {
      reasonCodes.add("MEMORY_WRITE_OBSERVED");
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
    if (observation.shellExecutionObserved) {
      reasonCodes.add("SHELL_EXECUTION_OBSERVED");
    }
  }
  return [...reasonCodes].sort();
}
