import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "./core-memory-retrieval-env-wiring-approval-gate";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "./local-embedding-composition";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "./local-embedding-runtime-session-factory";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV } from "./memory-provider-vector-retrieval-preflight";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "./memory-provider-vector-write-approval-gate";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "./memory-retrieval-provider-query-vector-approval-gate";

export const MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV =
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA";

export type MemoryProviderVectorRetrievalDeveloperAlphaPlanStatus =
  | "blocked"
  | "degraded"
  | "ready_for_developer_alpha_usage_test_approval";

export interface MemoryProviderVectorRetrievalDeveloperAlphaPlanInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase825ArtifactBackedAcceptanceComplete?: boolean;
  explicitDeveloperAlphaEnvReviewed?: boolean;
  prerequisiteGateChainReviewed?: boolean;
  approvedRuntimeAndArtifactProvisioningPlanReviewed?: boolean;
  sourceSelectionAndMinimizationReviewed?: boolean;
  boundedTesterCohortReviewed?: boolean;
  retentionAndRollbackPlanReviewed?: boolean;
  sanitizedTelemetryPlanReviewed?: boolean;
  degradedFallbackPlanReviewed?: boolean;
  noDefaultBehaviorChangeReviewed?: boolean;
  noUiOrProviderVisibilityChangeReviewed?: boolean;
  noHistoricalBatchIndexingReviewed?: boolean;
  verificationClean?: boolean;
  developerAlphaEnvRead?: boolean;
  runtimePythonRead?: boolean;
  modelArtifactPathRead?: boolean;
  artifactAccessed?: boolean;
  providerExecutionCalled?: boolean;
  helperEmbedCalled?: boolean;
  providerVectorWritesExecuted?: boolean;
  providerVectorRetrievalExecuted?: boolean;
  persistentMemoryVectorDataWritten?: boolean;
  historicalBatchIndexingEnabled?: boolean;
  rawVectorsExposed?: boolean;
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

export interface MemoryProviderVectorRetrievalDeveloperAlphaPlanChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase825ArtifactBackedAcceptanceComplete: boolean;
  explicitDeveloperAlphaEnvReviewed: boolean;
  prerequisiteGateChainReviewed: boolean;
  approvedRuntimeAndArtifactProvisioningPlanReviewed: boolean;
  sourceSelectionAndMinimizationReviewed: boolean;
  boundedTesterCohortReviewed: boolean;
  retentionAndRollbackPlanReviewed: boolean;
  sanitizedTelemetryPlanReviewed: boolean;
  degradedFallbackPlanReviewed: boolean;
  noDefaultBehaviorChangeReviewed: boolean;
  noUiOrProviderVisibilityChangeReviewed: boolean;
  noHistoricalBatchIndexingReviewed: boolean;
  developerAlphaEnvNotRead: boolean;
  runtimePythonNotRead: boolean;
  modelArtifactPathNotRead: boolean;
  artifactNotAccessed: boolean;
  providerExecutionNotCalled: boolean;
  helperEmbedNotCalled: boolean;
  providerVectorWritesNotExecuted: boolean;
  providerVectorRetrievalNotExecuted: boolean;
  persistentMemoryVectorDataNotWritten: boolean;
  historicalBatchIndexingDisabled: boolean;
  rawVectorsNotExposed: boolean;
  rawTextNotExposed: boolean;
  rawDiagnosticsNotExposed: boolean;
  privatePathsNotExposed: boolean;
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

export interface MemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan {
  mode: "developer_alpha_usage_test_plan";
  scope: "local_single_developer_alpha";
  envKey: typeof MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV;
  prerequisiteEnvKeys: readonly string[];
  allowedStorageScope: "existing_memory_database_new_accepted_messages_only";
  rollbackAction: "unset_env_and_delete_provider_vectors_for_test_window";
  telemetryScope: "sanitized_counts_and_reason_codes_only";
  userVisibleDefault: "disabled";
  maximumRecallMatches: 5;
  historicalBatchIndexingAllowed: false;
  uiControlsAllowed: false;
  providerVisibilityChangeAllowed: false;
  sqliteSchemaMigrationAllowed: false;
  rawVectorExposureAllowed: false;
  rawTextTelemetryAllowed: false;
  shellExecutionAllowed: false;
}

export interface MemoryProviderVectorRetrievalDeveloperAlphaPlanResult {
  phase: "8.26";
  capability: "memory_provider_vector_retrieval_developer_alpha_usage_test";
  status: MemoryProviderVectorRetrievalDeveloperAlphaPlanStatus;
  accepted: boolean;
  readyForDeveloperAlphaUsageTestApproval: boolean;
  planOnly: true;
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  envKey: typeof MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV;
  prerequisiteEnvKeys: readonly string[];
  usageTestPlan: MemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan;
  developerAlphaEnvRead: false;
  runtimePythonRead: false;
  modelArtifactPathRead: false;
  artifactAccessed: false;
  providerExecutionCalled: false;
  helperEmbedCalled: false;
  providerVectorWritesExecuted: false;
  providerVectorRetrievalExecuted: false;
  persistentMemoryVectorDataWritten: false;
  historicalBatchIndexingEnabled: false;
  rawVectorsExposed: false;
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
  checks: MemoryProviderVectorRetrievalDeveloperAlphaPlanChecks;
  reasons: string[];
}

export interface MemoryProviderVectorRetrievalDeveloperAlphaSafetyObservation {
  id: string;
  usageRunbookObserved: boolean;
  rollbackPlanObserved: boolean;
  sanitizedTelemetryObserved: boolean;
  sourceMinimizationObserved: boolean;
  degradedFallbackObserved: boolean;
  resultStatus: "ok" | "degraded" | "blocked";
  developerAlphaEnvRead?: boolean;
  runtimePythonRead?: boolean;
  modelArtifactPathRead?: boolean;
  artifactAccessObserved?: boolean;
  providerExecutionObserved?: boolean;
  helperEmbedObserved?: boolean;
  providerVectorWriteObserved?: boolean;
  providerVectorRetrievalObserved?: boolean;
  persistentVectorWriteObserved?: boolean;
  historicalBatchIndexingObserved?: boolean;
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

export interface MemoryProviderVectorRetrievalDeveloperAlphaSafetyReport {
  phase: "8.26";
  status: "plan_only" | "degraded" | "blocked";
  planOnly: true;
  providerExecutionCalled: false;
  helperEmbedCalled: false;
  providerVectorWritesExecuted: false;
  providerVectorRetrievalExecuted: false;
  persistentMemoryVectorDataWritten: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  modelOutputShellExecutionEnabled: false;
  observationCount: number;
  usageRunbookCount: number;
  rollbackPlanCount: number;
  sanitizedTelemetryCount: number;
  sourceMinimizationCount: number;
  degradedFallbackCount: number;
  degradedObservationCount: number;
  blockedObservationCount: number;
  reasonCodes: string[];
}

export function createMemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan(): MemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan {
  return {
    mode: "developer_alpha_usage_test_plan",
    scope: "local_single_developer_alpha",
    envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
    prerequisiteEnvKeys: createDeveloperAlphaPrerequisiteEnvKeys(),
    allowedStorageScope: "existing_memory_database_new_accepted_messages_only",
    rollbackAction: "unset_env_and_delete_provider_vectors_for_test_window",
    telemetryScope: "sanitized_counts_and_reason_codes_only",
    userVisibleDefault: "disabled",
    maximumRecallMatches: 5,
    historicalBatchIndexingAllowed: false,
    uiControlsAllowed: false,
    providerVisibilityChangeAllowed: false,
    sqliteSchemaMigrationAllowed: false,
    rawVectorExposureAllowed: false,
    rawTextTelemetryAllowed: false,
    shellExecutionAllowed: false
  };
}

export function isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return env[MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV]?.trim() === "1";
}

export function evaluateMemoryProviderVectorRetrievalDeveloperAlphaPlan(
  input: MemoryProviderVectorRetrievalDeveloperAlphaPlanInput = {}
): MemoryProviderVectorRetrievalDeveloperAlphaPlanResult {
  const checks: MemoryProviderVectorRetrievalDeveloperAlphaPlanChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase825ArtifactBackedAcceptanceComplete:
      input.phase825ArtifactBackedAcceptanceComplete === true,
    explicitDeveloperAlphaEnvReviewed:
      input.explicitDeveloperAlphaEnvReviewed === true,
    prerequisiteGateChainReviewed:
      input.prerequisiteGateChainReviewed === true,
    approvedRuntimeAndArtifactProvisioningPlanReviewed:
      input.approvedRuntimeAndArtifactProvisioningPlanReviewed === true,
    sourceSelectionAndMinimizationReviewed:
      input.sourceSelectionAndMinimizationReviewed === true,
    boundedTesterCohortReviewed: input.boundedTesterCohortReviewed === true,
    retentionAndRollbackPlanReviewed:
      input.retentionAndRollbackPlanReviewed === true,
    sanitizedTelemetryPlanReviewed:
      input.sanitizedTelemetryPlanReviewed === true,
    degradedFallbackPlanReviewed:
      input.degradedFallbackPlanReviewed === true,
    noDefaultBehaviorChangeReviewed:
      input.noDefaultBehaviorChangeReviewed === true,
    noUiOrProviderVisibilityChangeReviewed:
      input.noUiOrProviderVisibilityChangeReviewed === true,
    noHistoricalBatchIndexingReviewed:
      input.noHistoricalBatchIndexingReviewed === true,
    developerAlphaEnvNotRead: input.developerAlphaEnvRead === false,
    runtimePythonNotRead: input.runtimePythonRead === false,
    modelArtifactPathNotRead: input.modelArtifactPathRead === false,
    artifactNotAccessed: input.artifactAccessed === false,
    providerExecutionNotCalled: input.providerExecutionCalled === false,
    helperEmbedNotCalled: input.helperEmbedCalled === false,
    providerVectorWritesNotExecuted:
      input.providerVectorWritesExecuted === false,
    providerVectorRetrievalNotExecuted:
      input.providerVectorRetrievalExecuted === false,
    persistentMemoryVectorDataNotWritten:
      input.persistentMemoryVectorDataWritten === false,
    historicalBatchIndexingDisabled:
      input.historicalBatchIndexingEnabled === false,
    rawVectorsNotExposed: input.rawVectorsExposed === false,
    rawTextNotExposed: input.rawTextExposed === false,
    rawDiagnosticsNotExposed: input.rawDiagnosticsExposed === false,
    privatePathsNotExposed: input.privatePathsExposed === false,
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
  const evidenceReasons = createDeveloperAlphaEvidenceReasons(checks);
  const blockingReasons = createDeveloperAlphaBlockingReasons(checks);
  const accepted = evidenceReasons.length === 0 && blockingReasons.length === 0;
  const usageTestPlan =
    createMemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan();

  return {
    phase: "8.26",
    capability: "memory_provider_vector_retrieval_developer_alpha_usage_test",
    status: accepted
      ? "ready_for_developer_alpha_usage_test_approval"
      : blockingReasons.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForDeveloperAlphaUsageTestApproval: accepted,
    planOnly: true,
    productApprovalGranted: checks.productApprovalGranted,
    securityApprovalGranted: checks.securityApprovalGranted,
    envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
    prerequisiteEnvKeys: usageTestPlan.prerequisiteEnvKeys,
    usageTestPlan,
    developerAlphaEnvRead: false,
    runtimePythonRead: false,
    modelArtifactPathRead: false,
    artifactAccessed: false,
    providerExecutionCalled: false,
    helperEmbedCalled: false,
    providerVectorWritesExecuted: false,
    providerVectorRetrievalExecuted: false,
    persistentMemoryVectorDataWritten: false,
    historicalBatchIndexingEnabled: false,
    rawVectorsExposed: false,
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
          "explicit_developer_alpha_env",
          "prerequisite_gate_chain",
          "approved_runtime_and_artifact_provisioning",
          "source_selection_and_minimization",
          "bounded_tester_cohort",
          "retention_and_rollback",
          "sanitized_telemetry",
          "degraded_fallback",
          "default_behavior_unchanged",
          "ui_and_provider_visibility_unchanged",
          "no_historical_batch_indexing"
        ]
      : [],
    checks,
    reasons: accepted
      ? [
          "Memory provider-vector retrieval developer-alpha usage test plan is ready for separate implementation approval."
        ]
      : [...evidenceReasons, ...blockingReasons]
  };
}

export function evaluateMemoryProviderVectorRetrievalDeveloperAlphaSafety(
  observations: readonly MemoryProviderVectorRetrievalDeveloperAlphaSafetyObservation[]
): MemoryProviderVectorRetrievalDeveloperAlphaSafetyReport {
  if (observations.length < 1 || observations.length > 100) {
    return createDeveloperAlphaSafetyReport([], ["OBSERVATION_COUNT_INVALID"]);
  }

  const reasonCodes = createDeveloperAlphaSafetyReasonCodes(observations);
  const degradedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "degraded"
  ).length;
  const blockedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "blocked"
  ).length;

  return createDeveloperAlphaSafetyReport(
    observations,
    reasonCodes,
    degradedObservationCount,
    blockedObservationCount
  );
}

function createDeveloperAlphaPrerequisiteEnvKeys(): readonly string[] {
  return [
    MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
    MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV,
    MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV,
    MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV,
    MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV,
    LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV,
    LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
    LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
    LOCAL_EMBEDDING_MODEL_DIR_ENV
  ];
}

function createDeveloperAlphaEvidenceReasons(
  checks: MemoryProviderVectorRetrievalDeveloperAlphaPlanChecks
): string[] {
  const reasons: string[] = [];
  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.26.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.26.");
  }
  if (!checks.phase825ArtifactBackedAcceptanceComplete) {
    reasons.push("Phase 8.25 artifact-backed acceptance must be complete.");
  }
  if (!checks.explicitDeveloperAlphaEnvReviewed) {
    reasons.push("Explicit developer-alpha env review is required.");
  }
  if (!checks.prerequisiteGateChainReviewed) {
    reasons.push("Prerequisite gate chain review is required.");
  }
  if (!checks.approvedRuntimeAndArtifactProvisioningPlanReviewed) {
    reasons.push(
      "Approved runtime and artifact provisioning plan review is required."
    );
  }
  if (!checks.sourceSelectionAndMinimizationReviewed) {
    reasons.push("Source selection and minimization review is required.");
  }
  if (!checks.boundedTesterCohortReviewed) {
    reasons.push("Bounded tester cohort review is required.");
  }
  if (!checks.retentionAndRollbackPlanReviewed) {
    reasons.push("Retention and rollback plan review is required.");
  }
  if (!checks.sanitizedTelemetryPlanReviewed) {
    reasons.push("Sanitized telemetry plan review is required.");
  }
  if (!checks.degradedFallbackPlanReviewed) {
    reasons.push("Degraded fallback plan review is required.");
  }
  if (!checks.noDefaultBehaviorChangeReviewed) {
    reasons.push("Default behavior unchanged review is required.");
  }
  if (!checks.noUiOrProviderVisibilityChangeReviewed) {
    reasons.push("UI and provider visibility unchanged review is required.");
  }
  if (!checks.noHistoricalBatchIndexingReviewed) {
    reasons.push("No historical batch indexing review is required.");
  }
  if (!checks.verificationClean) {
    reasons.push("Clean verification evidence is required.");
  }
  return reasons;
}

function createDeveloperAlphaBlockingReasons(
  checks: MemoryProviderVectorRetrievalDeveloperAlphaPlanChecks
): string[] {
  const reasons: string[] = [];
  if (!checks.developerAlphaEnvNotRead) {
    reasons.push("Developer-alpha env reads are blocked in this plan.");
  }
  if (!checks.runtimePythonNotRead) {
    reasons.push("Runtime Python reads are blocked in this plan.");
  }
  if (!checks.modelArtifactPathNotRead) {
    reasons.push("Model artifact path reads are blocked in this plan.");
  }
  if (!checks.artifactNotAccessed) {
    reasons.push("Artifact access is blocked in this plan.");
  }
  if (!checks.providerExecutionNotCalled) {
    reasons.push("Provider execution is blocked in this plan.");
  }
  if (!checks.helperEmbedNotCalled) {
    reasons.push("Helper embed calls are blocked in this plan.");
  }
  if (!checks.providerVectorWritesNotExecuted) {
    reasons.push("Provider vector writes are blocked in this plan.");
  }
  if (!checks.providerVectorRetrievalNotExecuted) {
    reasons.push("Provider vector retrieval is blocked in this plan.");
  }
  if (!checks.persistentMemoryVectorDataNotWritten) {
    reasons.push("Persistent Memory vector writes are blocked in this plan.");
  }
  if (!checks.historicalBatchIndexingDisabled) {
    reasons.push("Historical batch indexing is blocked.");
  }
  if (!checks.rawVectorsNotExposed) {
    reasons.push("Raw vector exposure is blocked.");
  }
  if (!checks.rawTextNotExposed) {
    reasons.push("Raw text exposure is blocked.");
  }
  if (!checks.rawDiagnosticsNotExposed) {
    reasons.push("Raw diagnostic exposure is blocked.");
  }
  if (!checks.privatePathsNotExposed) {
    reasons.push("Private path exposure is blocked.");
  }
  if (!checks.signedUrlOrCredentialPersistenceDisabled) {
    reasons.push("Signed URL or credential persistence is blocked.");
  }
  if (!checks.downloadsDisabled) {
    reasons.push("Downloads are blocked in this plan.");
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

function createDeveloperAlphaSafetyReport(
  observations: readonly MemoryProviderVectorRetrievalDeveloperAlphaSafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0,
  blockedObservationCount = 0
): MemoryProviderVectorRetrievalDeveloperAlphaSafetyReport {
  return {
    phase: "8.26",
    status:
      reasonCodes.length > 0
        ? "blocked"
        : degradedObservationCount > 0
          ? "degraded"
          : "plan_only",
    planOnly: true,
    providerExecutionCalled: false,
    helperEmbedCalled: false,
    providerVectorWritesExecuted: false,
    providerVectorRetrievalExecuted: false,
    persistentMemoryVectorDataWritten: false,
    rawVectorsExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    modelOutputShellExecutionEnabled: false,
    observationCount: observations.length,
    usageRunbookCount: observations.filter(
      (observation) => observation.usageRunbookObserved
    ).length,
    rollbackPlanCount: observations.filter(
      (observation) => observation.rollbackPlanObserved
    ).length,
    sanitizedTelemetryCount: observations.filter(
      (observation) => observation.sanitizedTelemetryObserved
    ).length,
    sourceMinimizationCount: observations.filter(
      (observation) => observation.sourceMinimizationObserved
    ).length,
    degradedFallbackCount: observations.filter(
      (observation) => observation.degradedFallbackObserved
    ).length,
    degradedObservationCount,
    blockedObservationCount,
    reasonCodes
  };
}

function createDeveloperAlphaSafetyReasonCodes(
  observations: readonly MemoryProviderVectorRetrievalDeveloperAlphaSafetyObservation[]
): string[] {
  const reasonCodes = new Set<string>();
  for (const observation of observations) {
    if (observation.resultStatus === "blocked") {
      reasonCodes.add("BLOCKED_OBSERVATION");
    }
    if (observation.developerAlphaEnvRead) {
      reasonCodes.add("DEVELOPER_ALPHA_ENV_READ");
    }
    if (observation.runtimePythonRead) {
      reasonCodes.add("RUNTIME_PYTHON_READ");
    }
    if (observation.modelArtifactPathRead) {
      reasonCodes.add("MODEL_ARTIFACT_PATH_READ");
    }
    if (observation.artifactAccessObserved) {
      reasonCodes.add("ARTIFACT_ACCESS_OBSERVED");
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
    if (observation.persistentVectorWriteObserved) {
      reasonCodes.add("PERSISTENT_VECTOR_WRITE_OBSERVED");
    }
    if (observation.historicalBatchIndexingObserved) {
      reasonCodes.add("HISTORICAL_BATCH_INDEXING_OBSERVED");
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
