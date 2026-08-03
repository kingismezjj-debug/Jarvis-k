export const MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV =
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS";

export type MemoryProviderVectorRetrievalPreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_provider_vector_retrieval_implementation_approval";

export interface MemoryProviderVectorRetrievalPreflightInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase743ProviderExecutionAcceptanceComplete?: boolean;
  phase816ProviderQueryVectorComplete?: boolean;
  phase818ProviderQueryVectorAcceptanceComplete?: boolean;
  phase820ProviderVectorWriteComplete?: boolean;
  phase821ProviderVectorWriteAcceptanceComplete?: boolean;
  providerVectorRetrievalPlanReviewed?: boolean;
  explicitOptInEnvKeyReviewed?: boolean;
  sameModelIdReadWriteAlignmentReviewed?: boolean;
  boundedRecallLimitReviewed?: boolean;
  sanitizedRecallPayloadReviewed?: boolean;
  providerVectorFallbackPlanReviewed?: boolean;
  noDefaultBehaviorChangeReviewed?: boolean;
  noHistoricalBatchIndexingReviewed?: boolean;
  rollbackSmokePlanReviewed?: boolean;
  futureImplementationApprovalRequired?: boolean;
  verificationClean?: boolean;
  envValueRead?: boolean;
  coreHostRoutingChanged?: boolean;
  coreRuntimeChanged?: boolean;
  providerVectorRetrievalImplemented?: boolean;
  providerExecutionRoutedForReads?: boolean;
  helperEmbedCalledForReads?: boolean;
  memoryVectorWritesChanged?: boolean;
  rawVectorsReturned?: boolean;
  rawVectorsLoggedOrExposed?: boolean;
  rawTextExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathsExposed?: boolean;
  signedUrlOrCredentialPersisted?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  defaultOptInChanged?: boolean;
  fixtureFallbackChanged?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface MemoryProviderVectorRetrievalPreflightChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase743ProviderExecutionAcceptanceComplete: boolean;
  phase816ProviderQueryVectorComplete: boolean;
  phase818ProviderQueryVectorAcceptanceComplete: boolean;
  phase820ProviderVectorWriteComplete: boolean;
  phase821ProviderVectorWriteAcceptanceComplete: boolean;
  providerVectorRetrievalPlanReviewed: boolean;
  explicitOptInEnvKeyReviewed: boolean;
  sameModelIdReadWriteAlignmentReviewed: boolean;
  boundedRecallLimitReviewed: boolean;
  sanitizedRecallPayloadReviewed: boolean;
  providerVectorFallbackPlanReviewed: boolean;
  noDefaultBehaviorChangeReviewed: boolean;
  noHistoricalBatchIndexingReviewed: boolean;
  rollbackSmokePlanReviewed: boolean;
  futureImplementationApprovalRequired: boolean;
  envValueNotRead: boolean;
  coreHostRoutingUnchanged: boolean;
  coreRuntimeUnchanged: boolean;
  providerVectorRetrievalNotImplemented: boolean;
  providerExecutionNotRoutedForReads: boolean;
  helperEmbedNotCalledForReads: boolean;
  memoryVectorWritesUnchanged: boolean;
  rawVectorsNotReturned: boolean;
  rawVectorsNotLoggedOrExposed: boolean;
  rawTextExposureDisabled: boolean;
  rawDiagnosticsExposureDisabled: boolean;
  privatePathExposureDisabled: boolean;
  signedUrlOrCredentialPersistenceDisabled: boolean;
  sqliteSchemaMigrationDisabled: boolean;
  desktopIpcUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  defaultOptInUnchanged: boolean;
  fixtureFallbackUnchanged: boolean;
  modelOutputShellExecutionDisabled: boolean;
  verificationClean: boolean;
}

export interface MemoryProviderVectorRetrievalPreflightResult {
  phase: "8.22";
  capability: "memory_provider_vector_retrieval";
  envKey: typeof MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV;
  status: MemoryProviderVectorRetrievalPreflightStatus;
  accepted: boolean;
  readyForProviderVectorRetrievalImplementationApproval: boolean;
  preflightOnly: true;
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  futureImplementationApprovalRequired: true;
  envValueRead: false;
  coreHostRoutingChanged: false;
  coreRuntimeChanged: false;
  providerVectorRetrievalImplemented: false;
  providerExecutionRoutedForReads: false;
  helperEmbedCalledForReads: false;
  memoryVectorWritesChanged: false;
  rawVectorsReturned: false;
  rawVectorsLoggedOrExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathsExposed: false;
  signedUrlOrCredentialPersisted: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  fixtureFallbackChanged: false;
  modelOutputShellExecutionEnabled: false;
  reviewedAreas: string[];
  checks: MemoryProviderVectorRetrievalPreflightChecks;
  reasons: string[];
}

export interface MemoryProviderVectorRetrievalSafetyObservation {
  id: string;
  providerVectorRetrievalPlanObserved: boolean;
  modelIdAlignmentObserved: boolean;
  rollbackPlanObserved: boolean;
  resultStatus: "ok" | "degraded" | "blocked";
  envValueRead?: boolean;
  coreHostRoutingObserved?: boolean;
  coreRuntimeObserved?: boolean;
  providerVectorRetrievalObserved?: boolean;
  providerExecutionForReadObserved?: boolean;
  helperEmbedForReadObserved?: boolean;
  memoryVectorWriteChangeObserved?: boolean;
  rawVectorReturnedObserved?: boolean;
  rawVectorLoggedObserved?: boolean;
  rawTextObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  privatePathObserved?: boolean;
  credentialObserved?: boolean;
  sqliteMigrationObserved?: boolean;
  desktopIpcObserved?: boolean;
  uiBehaviorObserved?: boolean;
  providerVisibilityObserved?: boolean;
  defaultOptInObserved?: boolean;
  fixtureFallbackObserved?: boolean;
  shellExecutionObserved?: boolean;
}

export interface MemoryProviderVectorRetrievalSafetyReport {
  phase: "8.22";
  status: "preflight_only" | "degraded" | "blocked";
  preflightOnly: true;
  providerVectorRetrievalImplemented: false;
  providerExecutionRoutedForReads: false;
  helperEmbedCalledForReads: false;
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
  providerVectorRetrievalPlanCount: number;
  modelIdAlignmentCount: number;
  rollbackPlanCount: number;
  degradedObservationCount: number;
  blockedObservationCount: number;
  reasonCodes: string[];
}

export function evaluateMemoryProviderVectorRetrievalPreflight(
  input: MemoryProviderVectorRetrievalPreflightInput = {}
): MemoryProviderVectorRetrievalPreflightResult {
  const checks: MemoryProviderVectorRetrievalPreflightChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase743ProviderExecutionAcceptanceComplete:
      input.phase743ProviderExecutionAcceptanceComplete === true,
    phase816ProviderQueryVectorComplete:
      input.phase816ProviderQueryVectorComplete === true,
    phase818ProviderQueryVectorAcceptanceComplete:
      input.phase818ProviderQueryVectorAcceptanceComplete === true,
    phase820ProviderVectorWriteComplete:
      input.phase820ProviderVectorWriteComplete === true,
    phase821ProviderVectorWriteAcceptanceComplete:
      input.phase821ProviderVectorWriteAcceptanceComplete === true,
    providerVectorRetrievalPlanReviewed:
      input.providerVectorRetrievalPlanReviewed === true,
    explicitOptInEnvKeyReviewed: input.explicitOptInEnvKeyReviewed === true,
    sameModelIdReadWriteAlignmentReviewed:
      input.sameModelIdReadWriteAlignmentReviewed === true,
    boundedRecallLimitReviewed: input.boundedRecallLimitReviewed === true,
    sanitizedRecallPayloadReviewed:
      input.sanitizedRecallPayloadReviewed === true,
    providerVectorFallbackPlanReviewed:
      input.providerVectorFallbackPlanReviewed === true,
    noDefaultBehaviorChangeReviewed:
      input.noDefaultBehaviorChangeReviewed === true,
    noHistoricalBatchIndexingReviewed:
      input.noHistoricalBatchIndexingReviewed === true,
    rollbackSmokePlanReviewed: input.rollbackSmokePlanReviewed === true,
    futureImplementationApprovalRequired:
      input.futureImplementationApprovalRequired === true,
    envValueNotRead: input.envValueRead === false,
    coreHostRoutingUnchanged: input.coreHostRoutingChanged === false,
    coreRuntimeUnchanged: input.coreRuntimeChanged === false,
    providerVectorRetrievalNotImplemented:
      input.providerVectorRetrievalImplemented === false,
    providerExecutionNotRoutedForReads:
      input.providerExecutionRoutedForReads === false,
    helperEmbedNotCalledForReads:
      input.helperEmbedCalledForReads === false,
    memoryVectorWritesUnchanged: input.memoryVectorWritesChanged === false,
    rawVectorsNotReturned: input.rawVectorsReturned === false,
    rawVectorsNotLoggedOrExposed: input.rawVectorsLoggedOrExposed === false,
    rawTextExposureDisabled: input.rawTextExposed === false,
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    signedUrlOrCredentialPersistenceDisabled:
      input.signedUrlOrCredentialPersisted === false,
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
    phase: "8.22",
    capability: "memory_provider_vector_retrieval",
    envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV,
    status: accepted
      ? "ready_for_provider_vector_retrieval_implementation_approval"
      : blockingReasons.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForProviderVectorRetrievalImplementationApproval: accepted,
    preflightOnly: true,
    productApprovalGranted: checks.productApprovalGranted,
    securityApprovalGranted: checks.securityApprovalGranted,
    futureImplementationApprovalRequired: true,
    envValueRead: false,
    coreHostRoutingChanged: false,
    coreRuntimeChanged: false,
    providerVectorRetrievalImplemented: false,
    providerExecutionRoutedForReads: false,
    helperEmbedCalledForReads: false,
    memoryVectorWritesChanged: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathsExposed: false,
    signedUrlOrCredentialPersisted: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    fixtureFallbackChanged: false,
    modelOutputShellExecutionEnabled: false,
    reviewedAreas: accepted
      ? [
          "provider_vector_retrieval_plan",
          "explicit_opt_in_env_key",
          "same_model_id_read_write_alignment",
          "bounded_recall_limit",
          "sanitized_recall_payload",
          "provider_vector_fallback",
          "default_behavior_unchanged",
          "no_historical_batch_indexing",
          "rollback_smoke"
        ]
      : [],
    checks,
    reasons: accepted
      ? [
          "Memory provider vector retrieval preflight is ready for separate implementation approval."
        ]
      : [...evidenceReasons, ...blockingReasons]
  };
}

export function evaluateMemoryProviderVectorRetrievalSafety(
  observations: readonly MemoryProviderVectorRetrievalSafetyObservation[]
): MemoryProviderVectorRetrievalSafetyReport {
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
  checks: MemoryProviderVectorRetrievalPreflightChecks
): string[] {
  const reasons: string[] = [];
  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.22.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.22.");
  }
  if (!checks.phase743ProviderExecutionAcceptanceComplete) {
    reasons.push("Phase 7.43 provider execution acceptance must be complete.");
  }
  if (!checks.phase816ProviderQueryVectorComplete) {
    reasons.push("Phase 8.16 provider query-vector route must be complete.");
  }
  if (!checks.phase818ProviderQueryVectorAcceptanceComplete) {
    reasons.push("Phase 8.18 provider query-vector acceptance must be complete.");
  }
  if (!checks.phase820ProviderVectorWriteComplete) {
    reasons.push("Phase 8.20 provider vector write must be complete.");
  }
  if (!checks.phase821ProviderVectorWriteAcceptanceComplete) {
    reasons.push("Phase 8.21 provider vector write acceptance must be complete.");
  }
  if (!checks.providerVectorRetrievalPlanReviewed) {
    reasons.push("Provider vector retrieval plan review is required.");
  }
  if (!checks.explicitOptInEnvKeyReviewed) {
    reasons.push("Explicit opt-in env key review is required.");
  }
  if (!checks.sameModelIdReadWriteAlignmentReviewed) {
    reasons.push("Same-model read/write alignment review is required.");
  }
  if (!checks.boundedRecallLimitReviewed) {
    reasons.push("Bounded recall limit review is required.");
  }
  if (!checks.sanitizedRecallPayloadReviewed) {
    reasons.push("Sanitized recall payload review is required.");
  }
  if (!checks.providerVectorFallbackPlanReviewed) {
    reasons.push("Provider vector fallback plan review is required.");
  }
  if (!checks.noDefaultBehaviorChangeReviewed) {
    reasons.push("Default behavior unchanged review is required.");
  }
  if (!checks.noHistoricalBatchIndexingReviewed) {
    reasons.push("No historical batch indexing review is required.");
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

function createBlockingReasons(
  checks: MemoryProviderVectorRetrievalPreflightChecks
): string[] {
  const reasons: string[] = [];
  if (!checks.envValueNotRead) {
    reasons.push("Environment value reads are blocked in this preflight.");
  }
  if (!checks.coreHostRoutingUnchanged) {
    reasons.push("Core Host routing changes are blocked in this preflight.");
  }
  if (!checks.coreRuntimeUnchanged) {
    reasons.push("Core runtime changes are blocked in this preflight.");
  }
  if (!checks.providerVectorRetrievalNotImplemented) {
    reasons.push("Provider vector retrieval implementation is blocked.");
  }
  if (!checks.providerExecutionNotRoutedForReads) {
    reasons.push("Provider execution routing for reads is blocked.");
  }
  if (!checks.helperEmbedNotCalledForReads) {
    reasons.push("Helper embed calls for reads are blocked.");
  }
  if (!checks.memoryVectorWritesUnchanged) {
    reasons.push("Memory vector write behavior must remain unchanged.");
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
  observations: readonly MemoryProviderVectorRetrievalSafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0,
  blockedObservationCount = 0
): MemoryProviderVectorRetrievalSafetyReport {
  return {
    phase: "8.22",
    status:
      reasonCodes.length > 0
        ? "blocked"
        : degradedObservationCount > 0
          ? "degraded"
          : "preflight_only",
    preflightOnly: true,
    providerVectorRetrievalImplemented: false,
    providerExecutionRoutedForReads: false,
    helperEmbedCalledForReads: false,
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
    providerVectorRetrievalPlanCount: observations.filter(
      (observation) => observation.providerVectorRetrievalPlanObserved
    ).length,
    modelIdAlignmentCount: observations.filter(
      (observation) => observation.modelIdAlignmentObserved
    ).length,
    rollbackPlanCount: observations.filter(
      (observation) => observation.rollbackPlanObserved
    ).length,
    degradedObservationCount,
    blockedObservationCount,
    reasonCodes
  };
}

function createSafetyReasonCodes(
  observations: readonly MemoryProviderVectorRetrievalSafetyObservation[]
): string[] {
  const reasonCodes = new Set<string>();
  for (const observation of observations) {
    if (observation.resultStatus === "blocked") {
      reasonCodes.add("BLOCKED_OBSERVATION");
    }
    if (observation.envValueRead) {
      reasonCodes.add("ENV_VALUE_READ");
    }
    if (observation.coreHostRoutingObserved) {
      reasonCodes.add("CORE_HOST_ROUTING_OBSERVED");
    }
    if (observation.coreRuntimeObserved) {
      reasonCodes.add("CORE_RUNTIME_OBSERVED");
    }
    if (observation.providerVectorRetrievalObserved) {
      reasonCodes.add("PROVIDER_VECTOR_RETRIEVAL_OBSERVED");
    }
    if (observation.providerExecutionForReadObserved) {
      reasonCodes.add("PROVIDER_EXECUTION_FOR_READ_OBSERVED");
    }
    if (observation.helperEmbedForReadObserved) {
      reasonCodes.add("HELPER_EMBED_FOR_READ_OBSERVED");
    }
    if (observation.memoryVectorWriteChangeObserved) {
      reasonCodes.add("MEMORY_VECTOR_WRITE_CHANGE_OBSERVED");
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
