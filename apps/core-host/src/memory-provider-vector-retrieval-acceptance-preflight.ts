export const MEMORY_PROVIDER_VECTOR_RETRIEVAL_ACCEPTANCE_ENV =
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE";

export type MemoryProviderVectorRetrievalAcceptancePreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_acceptance_diagnostic_approval";

export interface MemoryProviderVectorRetrievalAcceptancePreflightInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase743ProviderExecutionAcceptanceComplete?: boolean;
  phase818ProviderQueryVectorAcceptanceComplete?: boolean;
  phase821ProviderVectorWriteAcceptanceComplete?: boolean;
  phase823ProviderVectorRetrievalRoutingComplete?: boolean;
  productPathDiagnosticPlanReviewed?: boolean;
  explicitAcceptanceEnvReviewed?: boolean;
  temporaryMemoryDatabasePlanReviewed?: boolean;
  providerVectorWriteThenReadPlanReviewed?: boolean;
  sameModelIdReadWriteAlignmentReviewed?: boolean;
  artifactDigestVerificationPlanReviewed?: boolean;
  sanitizedRecallReportPlanReviewed?: boolean;
  cleanupPlanReviewed?: boolean;
  rollbackPlanReviewed?: boolean;
  verificationClean?: boolean;
  acceptanceEnvRead?: boolean;
  runtimePythonRead?: boolean;
  modelArtifactPathRead?: boolean;
  artifactVerificationRun?: boolean;
  providerExecutionCalled?: boolean;
  helperEmbedCalled?: boolean;
  providerVectorWriteExecuted?: boolean;
  providerVectorRetrievalExecuted?: boolean;
  temporaryMemoryVectorDataWritten?: boolean;
  persistentMemoryVectorDataWritten?: boolean;
  rawVectorsReturned?: boolean;
  rawVectorsLoggedOrExposed?: boolean;
  rawTextExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathsExposed?: boolean;
  signedUrlOrCredentialPersisted?: boolean;
  downloadsEnabled?: boolean;
  persistentCacheWritesEnabled?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  defaultOptInChanged?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface MemoryProviderVectorRetrievalAcceptancePreflightChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase743ProviderExecutionAcceptanceComplete: boolean;
  phase818ProviderQueryVectorAcceptanceComplete: boolean;
  phase821ProviderVectorWriteAcceptanceComplete: boolean;
  phase823ProviderVectorRetrievalRoutingComplete: boolean;
  productPathDiagnosticPlanReviewed: boolean;
  explicitAcceptanceEnvReviewed: boolean;
  temporaryMemoryDatabasePlanReviewed: boolean;
  providerVectorWriteThenReadPlanReviewed: boolean;
  sameModelIdReadWriteAlignmentReviewed: boolean;
  artifactDigestVerificationPlanReviewed: boolean;
  sanitizedRecallReportPlanReviewed: boolean;
  cleanupPlanReviewed: boolean;
  rollbackPlanReviewed: boolean;
  acceptanceEnvNotRead: boolean;
  runtimePythonNotRead: boolean;
  modelArtifactPathNotRead: boolean;
  artifactVerificationNotRun: boolean;
  providerExecutionNotCalled: boolean;
  helperEmbedNotCalled: boolean;
  providerVectorWriteNotExecuted: boolean;
  providerVectorRetrievalNotExecuted: boolean;
  temporaryMemoryVectorDataNotWritten: boolean;
  persistentMemoryVectorDataNotWritten: boolean;
  rawVectorsNotReturned: boolean;
  rawVectorsNotLoggedOrExposed: boolean;
  rawTextExposureDisabled: boolean;
  rawDiagnosticsExposureDisabled: boolean;
  privatePathExposureDisabled: boolean;
  signedUrlOrCredentialPersistenceDisabled: boolean;
  downloadsDisabled: boolean;
  persistentCacheWritesDisabled: boolean;
  sqliteSchemaMigrationDisabled: boolean;
  desktopIpcUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  defaultOptInUnchanged: boolean;
  modelOutputShellExecutionDisabled: boolean;
  verificationClean: boolean;
}

export interface MemoryProviderVectorRetrievalAcceptancePreflightResult {
  phase: "8.24";
  capability: "memory_provider_vector_retrieval_acceptance";
  envKey: typeof MEMORY_PROVIDER_VECTOR_RETRIEVAL_ACCEPTANCE_ENV;
  status: MemoryProviderVectorRetrievalAcceptancePreflightStatus;
  accepted: boolean;
  readyForAcceptanceDiagnosticApproval: boolean;
  preflightOnly: true;
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  acceptanceEnvRead: false;
  runtimePythonRead: false;
  modelArtifactPathRead: false;
  artifactVerificationRun: false;
  providerExecutionCalled: false;
  helperEmbedCalled: false;
  providerVectorWriteExecuted: false;
  providerVectorRetrievalExecuted: false;
  temporaryMemoryVectorDataWritten: false;
  persistentMemoryVectorDataWritten: false;
  rawVectorsReturned: false;
  rawVectorsLoggedOrExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathsExposed: false;
  signedUrlOrCredentialPersisted: false;
  downloadsEnabled: false;
  persistentCacheWritesEnabled: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  modelOutputShellExecutionEnabled: false;
  reviewedAreas: string[];
  checks: MemoryProviderVectorRetrievalAcceptancePreflightChecks;
  reasons: string[];
}

export interface MemoryProviderVectorRetrievalAcceptanceSafetyObservation {
  id: string;
  diagnosticPlanObserved: boolean;
  temporaryDatabasePlanObserved: boolean;
  writeThenReadPlanObserved: boolean;
  sanitizedRecallReportObserved: boolean;
  cleanupPlanObserved: boolean;
  resultStatus: "ok" | "degraded" | "blocked";
  acceptanceEnvRead?: boolean;
  runtimePythonRead?: boolean;
  modelArtifactPathRead?: boolean;
  artifactVerificationObserved?: boolean;
  providerExecutionObserved?: boolean;
  helperEmbedObserved?: boolean;
  providerVectorWriteObserved?: boolean;
  providerVectorRetrievalObserved?: boolean;
  temporaryVectorWriteObserved?: boolean;
  persistentVectorWriteObserved?: boolean;
  rawVectorObserved?: boolean;
  rawTextObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  privatePathObserved?: boolean;
  credentialObserved?: boolean;
  downloadObserved?: boolean;
  persistentCacheWriteObserved?: boolean;
  sqliteMigrationObserved?: boolean;
  desktopIpcObserved?: boolean;
  uiBehaviorObserved?: boolean;
  providerVisibilityObserved?: boolean;
  defaultOptInObserved?: boolean;
  shellExecutionObserved?: boolean;
}

export interface MemoryProviderVectorRetrievalAcceptanceSafetyReport {
  phase: "8.24";
  status: "preflight_only" | "degraded" | "blocked";
  preflightOnly: true;
  providerExecutionCalled: false;
  helperEmbedCalled: false;
  providerVectorWriteExecuted: false;
  providerVectorRetrievalExecuted: false;
  temporaryMemoryVectorDataWritten: false;
  persistentMemoryVectorDataWritten: false;
  rawVectorsReturned: false;
  rawVectorsLoggedOrExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  modelOutputShellExecutionEnabled: false;
  observationCount: number;
  diagnosticPlanCount: number;
  temporaryDatabasePlanCount: number;
  writeThenReadPlanCount: number;
  sanitizedRecallReportCount: number;
  cleanupPlanCount: number;
  degradedObservationCount: number;
  blockedObservationCount: number;
  reasonCodes: string[];
}

export function evaluateMemoryProviderVectorRetrievalAcceptancePreflight(
  input: MemoryProviderVectorRetrievalAcceptancePreflightInput = {}
): MemoryProviderVectorRetrievalAcceptancePreflightResult {
  const checks: MemoryProviderVectorRetrievalAcceptancePreflightChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase743ProviderExecutionAcceptanceComplete:
      input.phase743ProviderExecutionAcceptanceComplete === true,
    phase818ProviderQueryVectorAcceptanceComplete:
      input.phase818ProviderQueryVectorAcceptanceComplete === true,
    phase821ProviderVectorWriteAcceptanceComplete:
      input.phase821ProviderVectorWriteAcceptanceComplete === true,
    phase823ProviderVectorRetrievalRoutingComplete:
      input.phase823ProviderVectorRetrievalRoutingComplete === true,
    productPathDiagnosticPlanReviewed:
      input.productPathDiagnosticPlanReviewed === true,
    explicitAcceptanceEnvReviewed:
      input.explicitAcceptanceEnvReviewed === true,
    temporaryMemoryDatabasePlanReviewed:
      input.temporaryMemoryDatabasePlanReviewed === true,
    providerVectorWriteThenReadPlanReviewed:
      input.providerVectorWriteThenReadPlanReviewed === true,
    sameModelIdReadWriteAlignmentReviewed:
      input.sameModelIdReadWriteAlignmentReviewed === true,
    artifactDigestVerificationPlanReviewed:
      input.artifactDigestVerificationPlanReviewed === true,
    sanitizedRecallReportPlanReviewed:
      input.sanitizedRecallReportPlanReviewed === true,
    cleanupPlanReviewed: input.cleanupPlanReviewed === true,
    rollbackPlanReviewed: input.rollbackPlanReviewed === true,
    acceptanceEnvNotRead: input.acceptanceEnvRead === false,
    runtimePythonNotRead: input.runtimePythonRead === false,
    modelArtifactPathNotRead: input.modelArtifactPathRead === false,
    artifactVerificationNotRun: input.artifactVerificationRun === false,
    providerExecutionNotCalled: input.providerExecutionCalled === false,
    helperEmbedNotCalled: input.helperEmbedCalled === false,
    providerVectorWriteNotExecuted:
      input.providerVectorWriteExecuted === false,
    providerVectorRetrievalNotExecuted:
      input.providerVectorRetrievalExecuted === false,
    temporaryMemoryVectorDataNotWritten:
      input.temporaryMemoryVectorDataWritten === false,
    persistentMemoryVectorDataNotWritten:
      input.persistentMemoryVectorDataWritten === false,
    rawVectorsNotReturned: input.rawVectorsReturned === false,
    rawVectorsNotLoggedOrExposed:
      input.rawVectorsLoggedOrExposed === false,
    rawTextExposureDisabled: input.rawTextExposed === false,
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    signedUrlOrCredentialPersistenceDisabled:
      input.signedUrlOrCredentialPersisted === false,
    downloadsDisabled: input.downloadsEnabled === false,
    persistentCacheWritesDisabled:
      input.persistentCacheWritesEnabled === false,
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
    phase: "8.24",
    capability: "memory_provider_vector_retrieval_acceptance",
    envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_ACCEPTANCE_ENV,
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
    artifactVerificationRun: false,
    providerExecutionCalled: false,
    helperEmbedCalled: false,
    providerVectorWriteExecuted: false,
    providerVectorRetrievalExecuted: false,
    temporaryMemoryVectorDataWritten: false,
    persistentMemoryVectorDataWritten: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathsExposed: false,
    signedUrlOrCredentialPersisted: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
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
          "temporary_memory_database_plan",
          "provider_vector_write_then_read_plan",
          "same_model_id_read_write_alignment",
          "artifact_digest_verification_plan",
          "sanitized_recall_report_shape",
          "cleanup_plan",
          "rollback_plan"
        ]
      : [],
    checks,
    reasons: accepted
      ? [
          "Memory provider vector retrieval acceptance preflight is ready for separate diagnostic approval."
        ]
      : [...evidenceReasons, ...blockingReasons]
  };
}

export function evaluateMemoryProviderVectorRetrievalAcceptanceSafety(
  observations: readonly MemoryProviderVectorRetrievalAcceptanceSafetyObservation[]
): MemoryProviderVectorRetrievalAcceptanceSafetyReport {
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
  checks: MemoryProviderVectorRetrievalAcceptancePreflightChecks
): string[] {
  const reasons: string[] = [];
  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.24.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.24.");
  }
  if (!checks.phase743ProviderExecutionAcceptanceComplete) {
    reasons.push("Phase 7.43 provider execution acceptance must be complete.");
  }
  if (!checks.phase818ProviderQueryVectorAcceptanceComplete) {
    reasons.push("Phase 8.18 provider query-vector acceptance must be complete.");
  }
  if (!checks.phase821ProviderVectorWriteAcceptanceComplete) {
    reasons.push("Phase 8.21 provider vector write acceptance must be complete.");
  }
  if (!checks.phase823ProviderVectorRetrievalRoutingComplete) {
    reasons.push("Phase 8.23 provider vector retrieval routing must be complete.");
  }
  if (!checks.productPathDiagnosticPlanReviewed) {
    reasons.push("Product-path diagnostic plan review is required.");
  }
  if (!checks.explicitAcceptanceEnvReviewed) {
    reasons.push("Explicit acceptance env review is required.");
  }
  if (!checks.temporaryMemoryDatabasePlanReviewed) {
    reasons.push("Temporary Memory database plan review is required.");
  }
  if (!checks.providerVectorWriteThenReadPlanReviewed) {
    reasons.push("Provider vector write-then-read plan review is required.");
  }
  if (!checks.sameModelIdReadWriteAlignmentReviewed) {
    reasons.push("Same-model read/write alignment review is required.");
  }
  if (!checks.artifactDigestVerificationPlanReviewed) {
    reasons.push("Artifact digest verification plan review is required.");
  }
  if (!checks.sanitizedRecallReportPlanReviewed) {
    reasons.push("Sanitized recall report plan review is required.");
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
  checks: MemoryProviderVectorRetrievalAcceptancePreflightChecks
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
  if (!checks.artifactVerificationNotRun) {
    reasons.push("Artifact verification is blocked in this preflight.");
  }
  if (!checks.providerExecutionNotCalled) {
    reasons.push("Provider execution calls are blocked in this preflight.");
  }
  if (!checks.helperEmbedNotCalled) {
    reasons.push("Helper embed calls are blocked in this preflight.");
  }
  if (!checks.providerVectorWriteNotExecuted) {
    reasons.push("Provider vector writes are blocked in this preflight.");
  }
  if (!checks.providerVectorRetrievalNotExecuted) {
    reasons.push("Provider vector retrieval is blocked in this preflight.");
  }
  if (!checks.temporaryMemoryVectorDataNotWritten) {
    reasons.push("Temporary Memory vector writes are blocked in this preflight.");
  }
  if (!checks.persistentMemoryVectorDataNotWritten) {
    reasons.push("Persistent Memory vector writes are blocked.");
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
  if (!checks.downloadsDisabled) {
    reasons.push("Downloads are blocked in this preflight.");
  }
  if (!checks.persistentCacheWritesDisabled) {
    reasons.push("Persistent cache writes are blocked.");
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
  observations: readonly MemoryProviderVectorRetrievalAcceptanceSafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0,
  blockedObservationCount = 0
): MemoryProviderVectorRetrievalAcceptanceSafetyReport {
  return {
    phase: "8.24",
    status:
      reasonCodes.length > 0
        ? "blocked"
        : degradedObservationCount > 0
          ? "degraded"
          : "preflight_only",
    preflightOnly: true,
    providerExecutionCalled: false,
    helperEmbedCalled: false,
    providerVectorWriteExecuted: false,
    providerVectorRetrievalExecuted: false,
    temporaryMemoryVectorDataWritten: false,
    persistentMemoryVectorDataWritten: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
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
    temporaryDatabasePlanCount: observations.filter(
      (observation) => observation.temporaryDatabasePlanObserved
    ).length,
    writeThenReadPlanCount: observations.filter(
      (observation) => observation.writeThenReadPlanObserved
    ).length,
    sanitizedRecallReportCount: observations.filter(
      (observation) => observation.sanitizedRecallReportObserved
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
  observations: readonly MemoryProviderVectorRetrievalAcceptanceSafetyObservation[]
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
    if (observation.artifactVerificationObserved) {
      reasonCodes.add("ARTIFACT_VERIFICATION_OBSERVED");
    }
    if (observation.providerExecutionObserved) {
      reasonCodes.add("PROVIDER_EXECUTION_OBSERVED");
    }
    if (observation.helperEmbedObserved) {
      reasonCodes.add("HELPER_EMBED_OBSERVED");
    }
    if (observation.providerVectorWriteObserved) {
      reasonCodes.add("PROVIDER_VECTOR_WRITE_OBSERVED");
    }
    if (observation.providerVectorRetrievalObserved) {
      reasonCodes.add("PROVIDER_VECTOR_RETRIEVAL_OBSERVED");
    }
    if (observation.temporaryVectorWriteObserved) {
      reasonCodes.add("TEMPORARY_VECTOR_WRITE_OBSERVED");
    }
    if (observation.persistentVectorWriteObserved) {
      reasonCodes.add("PERSISTENT_VECTOR_WRITE_OBSERVED");
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
    if (observation.downloadObserved) {
      reasonCodes.add("DOWNLOAD_OBSERVED");
    }
    if (observation.persistentCacheWriteObserved) {
      reasonCodes.add("PERSISTENT_CACHE_WRITE_OBSERVED");
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
