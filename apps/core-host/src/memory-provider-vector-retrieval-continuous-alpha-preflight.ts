import {
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
  createMemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan
} from "./memory-provider-vector-retrieval-developer-alpha-plan";

export type MemoryProviderVectorContinuousAlphaPreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_continuous_alpha_usage_approval";

export type MemoryProviderVectorContinuousAlphaPreflightReasonCode =
  | "phase_826_plan_missing"
  | "phase_827_implementation_missing"
  | "phase_828_runbook_missing"
  | "phase_829_one_shot_evidence_missing"
  | "continuous_observation_plan_missing"
  | "sanitized_telemetry_policy_missing"
  | "disable_plan_missing"
  | "exact_source_rollback_plan_missing"
  | "rollback_readiness_missing"
  | "bounded_usage_window_missing"
  | "source_minimization_plan_missing"
  | "fallback_no_recall_plan_missing"
  | "stop_conditions_missing"
  | "fixture_fallback_missing"
  | "release_scope_not_constrained"
  | "clean_verification_missing"
  | "continuous_execution_requested"
  | "environment_read_requested"
  | "runtime_or_artifact_access_requested"
  | "helper_or_provider_execution_requested"
  | "provider_vector_operation_requested"
  | "persistent_or_migration_side_effect_requested"
  | "desktop_ui_or_visibility_change_requested"
  | "unsafe_output_or_secret_exposure_requested"
  | "shell_execution_requested";

export interface MemoryProviderVectorContinuousAlphaPreflightInput {
  phase826PlanComplete?: boolean;
  phase827ImplementationComplete?: boolean;
  phase828RunbookComplete?: boolean;
  phase829OneShotUsageSessionPassed?: boolean;
  continuousObservationPlanReviewed?: boolean;
  sanitizedTelemetryPolicyReviewed?: boolean;
  disablePlanReviewed?: boolean;
  exactSourceRollbackPlanReviewed?: boolean;
  rollbackReadinessReviewed?: boolean;
  boundedUsageWindowReviewed?: boolean;
  sourceMinimizationPlanReviewed?: boolean;
  fallbackNoRecallPlanReviewed?: boolean;
  stopConditionsReviewed?: boolean;
  fixtureFallbackAvailable?: boolean;
  releaseScopeConstrained?: boolean;
  cleanVerificationEvidence?: boolean;
  continuousExecutionEnabled?: boolean;
  envRead?: boolean;
  runtimePythonRead?: boolean;
  modelArtifactPathRead?: boolean;
  artifactAccessed?: boolean;
  artifactDownloadEnabled?: boolean;
  helperStarted?: boolean;
  helperLoadCalled?: boolean;
  helperEmbedCalled?: boolean;
  providerExecutionCalled?: boolean;
  providerVectorWriteExecuted?: boolean;
  providerVectorReadExecuted?: boolean;
  realMemoryVectorDataWritten?: boolean;
  persistentModelCacheEnabled?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  historicalBatchIndexingEnabled?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  defaultOptInChanged?: boolean;
  rawVectorsExposed?: boolean;
  rawTextExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposed?: boolean;
  signedUrlOrCredentialPersisted?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface MemoryProviderVectorContinuousAlphaPreflightChecks {
  phase826PlanComplete: boolean;
  phase827ImplementationComplete: boolean;
  phase828RunbookComplete: boolean;
  phase829OneShotUsageSessionPassed: boolean;
  continuousObservationPlanReviewed: boolean;
  sanitizedTelemetryPolicyReviewed: boolean;
  disablePlanReviewed: boolean;
  exactSourceRollbackPlanReviewed: boolean;
  rollbackReadinessReviewed: boolean;
  boundedUsageWindowReviewed: boolean;
  sourceMinimizationPlanReviewed: boolean;
  fallbackNoRecallPlanReviewed: boolean;
  stopConditionsReviewed: boolean;
  fixtureFallbackAvailable: boolean;
  releaseScopeConstrained: boolean;
  cleanVerificationEvidence: boolean;
  continuousExecutionDisabled: boolean;
  envNotRead: boolean;
  runtimePythonNotRead: boolean;
  modelArtifactPathNotRead: boolean;
  artifactNotAccessed: boolean;
  artifactDownloadDisabled: boolean;
  helperNotStarted: boolean;
  helperLoadNotCalled: boolean;
  helperEmbedNotCalled: boolean;
  providerExecutionNotCalled: boolean;
  providerVectorWriteNotExecuted: boolean;
  providerVectorReadNotExecuted: boolean;
  realMemoryVectorDataNotWritten: boolean;
  persistentModelCacheDisabled: boolean;
  sqliteSchemaMigrationDisabled: boolean;
  historicalBatchIndexingDisabled: boolean;
  desktopIpcUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  defaultOptInUnchanged: boolean;
  rawVectorsNotExposed: boolean;
  rawTextNotExposed: boolean;
  rawDiagnosticsNotExposed: boolean;
  privatePathNotExposed: boolean;
  signedUrlOrCredentialPersistenceDisabled: boolean;
  modelOutputShellExecutionDisabled: boolean;
}

export interface MemoryProviderVectorContinuousAlphaObservationPolicy {
  mode: "continuous_alpha_observation_preflight";
  telemetryScope: "sanitized_counts_statuses_and_reason_codes_only";
  disableAction: "unset_developer_alpha_env_chain";
  rollbackAction: "delete_exact_test_window_provider_vectors_only";
  fallbackMode: "fail_closed_to_no_recall";
  allowedTesterScope: "single_local_developer_alpha";
  allowedMessageScope: "new_accepted_minimized_test_window_messages";
  maximumRecallMatches: 5;
  continuousExecutionEnabled: false;
  rawVectorTelemetryAllowed: false;
  rawTextTelemetryAllowed: false;
  privatePathTelemetryAllowed: false;
  sqliteMigrationAllowed: false;
  historicalBatchIndexingAllowed: false;
  uiControlsAllowed: false;
  providerVisibilityChangeAllowed: false;
  shellExecutionAllowed: false;
}

export interface MemoryProviderVectorContinuousAlphaPreflightResult {
  phase: "8.30";
  capability: "memory_provider_vector_retrieval_continuous_alpha_preflight";
  status: MemoryProviderVectorContinuousAlphaPreflightStatus;
  accepted: boolean;
  readyForContinuousAlphaUsageApproval: boolean;
  preflightOnly: true;
  envKey: typeof MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV;
  prerequisiteEnvKeys: readonly string[];
  observationPolicy: MemoryProviderVectorContinuousAlphaObservationPolicy;
  continuousExecutionEnabled: false;
  envRead: false;
  runtimePythonRead: false;
  modelArtifactPathRead: false;
  artifactAccessed: false;
  artifactDownloadEnabled: false;
  helperStarted: false;
  helperLoadCalled: false;
  helperEmbedCalled: false;
  providerExecutionCalled: false;
  providerVectorWriteExecuted: false;
  providerVectorReadExecuted: false;
  realMemoryVectorDataWritten: false;
  persistentModelCacheEnabled: false;
  sqliteSchemaMigrationEnabled: false;
  historicalBatchIndexingEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathExposed: false;
  signedUrlOrCredentialPersisted: false;
  modelOutputShellExecutionEnabled: false;
  checkedAreas: string[];
  checks: MemoryProviderVectorContinuousAlphaPreflightChecks;
  reasonCodes: MemoryProviderVectorContinuousAlphaPreflightReasonCode[];
}

export function createMemoryProviderVectorContinuousAlphaObservationPolicy(): MemoryProviderVectorContinuousAlphaObservationPolicy {
  return {
    mode: "continuous_alpha_observation_preflight",
    telemetryScope: "sanitized_counts_statuses_and_reason_codes_only",
    disableAction: "unset_developer_alpha_env_chain",
    rollbackAction: "delete_exact_test_window_provider_vectors_only",
    fallbackMode: "fail_closed_to_no_recall",
    allowedTesterScope: "single_local_developer_alpha",
    allowedMessageScope: "new_accepted_minimized_test_window_messages",
    maximumRecallMatches: 5,
    continuousExecutionEnabled: false,
    rawVectorTelemetryAllowed: false,
    rawTextTelemetryAllowed: false,
    privatePathTelemetryAllowed: false,
    sqliteMigrationAllowed: false,
    historicalBatchIndexingAllowed: false,
    uiControlsAllowed: false,
    providerVisibilityChangeAllowed: false,
    shellExecutionAllowed: false
  };
}

export function evaluateMemoryProviderVectorContinuousAlphaPreflight(
  input: MemoryProviderVectorContinuousAlphaPreflightInput = {}
): MemoryProviderVectorContinuousAlphaPreflightResult {
  const checks = createChecks(input);
  const evidenceReasonCodes = createEvidenceReasonCodes(checks);
  const blockingReasonCodes = createBlockingReasonCodes(checks);
  const accepted =
    evidenceReasonCodes.length === 0 && blockingReasonCodes.length === 0;
  const developerAlphaPlan =
    createMemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan();

  return {
    phase: "8.30",
    capability:
      "memory_provider_vector_retrieval_continuous_alpha_preflight",
    status: accepted
      ? "ready_for_continuous_alpha_usage_approval"
      : blockingReasonCodes.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForContinuousAlphaUsageApproval: accepted,
    preflightOnly: true,
    envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
    prerequisiteEnvKeys: developerAlphaPlan.prerequisiteEnvKeys,
    observationPolicy:
      createMemoryProviderVectorContinuousAlphaObservationPolicy(),
    continuousExecutionEnabled: false,
    envRead: false,
    runtimePythonRead: false,
    modelArtifactPathRead: false,
    artifactAccessed: false,
    artifactDownloadEnabled: false,
    helperStarted: false,
    helperLoadCalled: false,
    helperEmbedCalled: false,
    providerExecutionCalled: false,
    providerVectorWriteExecuted: false,
    providerVectorReadExecuted: false,
    realMemoryVectorDataWritten: false,
    persistentModelCacheEnabled: false,
    sqliteSchemaMigrationEnabled: false,
    historicalBatchIndexingEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    rawVectorsExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathExposed: false,
    signedUrlOrCredentialPersisted: false,
    modelOutputShellExecutionEnabled: false,
    checkedAreas: accepted
      ? [
          "phase_826_to_829_evidence",
          "continuous_observation_policy",
          "sanitized_telemetry_policy",
          "disable_plan",
          "exact_source_rollback_plan",
          "bounded_usage_window",
          "source_minimization",
          "fallback_no_recall",
          "stop_conditions",
          "release_scope"
        ]
      : [],
    checks,
    reasonCodes: [...evidenceReasonCodes, ...blockingReasonCodes]
  };
}

function createChecks(
  input: MemoryProviderVectorContinuousAlphaPreflightInput
): MemoryProviderVectorContinuousAlphaPreflightChecks {
  return {
    phase826PlanComplete: input.phase826PlanComplete === true,
    phase827ImplementationComplete:
      input.phase827ImplementationComplete === true,
    phase828RunbookComplete: input.phase828RunbookComplete === true,
    phase829OneShotUsageSessionPassed:
      input.phase829OneShotUsageSessionPassed === true,
    continuousObservationPlanReviewed:
      input.continuousObservationPlanReviewed === true,
    sanitizedTelemetryPolicyReviewed:
      input.sanitizedTelemetryPolicyReviewed === true,
    disablePlanReviewed: input.disablePlanReviewed === true,
    exactSourceRollbackPlanReviewed:
      input.exactSourceRollbackPlanReviewed === true,
    rollbackReadinessReviewed: input.rollbackReadinessReviewed === true,
    boundedUsageWindowReviewed: input.boundedUsageWindowReviewed === true,
    sourceMinimizationPlanReviewed:
      input.sourceMinimizationPlanReviewed === true,
    fallbackNoRecallPlanReviewed:
      input.fallbackNoRecallPlanReviewed === true,
    stopConditionsReviewed: input.stopConditionsReviewed === true,
    fixtureFallbackAvailable: input.fixtureFallbackAvailable === true,
    releaseScopeConstrained: input.releaseScopeConstrained === true,
    cleanVerificationEvidence: input.cleanVerificationEvidence === true,
    continuousExecutionDisabled: input.continuousExecutionEnabled === false,
    envNotRead: input.envRead === false,
    runtimePythonNotRead: input.runtimePythonRead === false,
    modelArtifactPathNotRead: input.modelArtifactPathRead === false,
    artifactNotAccessed: input.artifactAccessed === false,
    artifactDownloadDisabled: input.artifactDownloadEnabled === false,
    helperNotStarted: input.helperStarted === false,
    helperLoadNotCalled: input.helperLoadCalled === false,
    helperEmbedNotCalled: input.helperEmbedCalled === false,
    providerExecutionNotCalled: input.providerExecutionCalled === false,
    providerVectorWriteNotExecuted:
      input.providerVectorWriteExecuted === false,
    providerVectorReadNotExecuted:
      input.providerVectorReadExecuted === false,
    realMemoryVectorDataNotWritten:
      input.realMemoryVectorDataWritten === false,
    persistentModelCacheDisabled:
      input.persistentModelCacheEnabled === false,
    sqliteSchemaMigrationDisabled:
      input.sqliteSchemaMigrationEnabled === false,
    historicalBatchIndexingDisabled:
      input.historicalBatchIndexingEnabled === false,
    desktopIpcUnchanged: input.desktopIpcChanged === false,
    uiBehaviorUnchanged: input.uiBehaviorChanged === false,
    providerVisibilityUnchanged: input.providerVisibilityChanged === false,
    defaultOptInUnchanged: input.defaultOptInChanged === false,
    rawVectorsNotExposed: input.rawVectorsExposed === false,
    rawTextNotExposed: input.rawTextExposed === false,
    rawDiagnosticsNotExposed: input.rawDiagnosticsExposed === false,
    privatePathNotExposed: input.privatePathExposed === false,
    signedUrlOrCredentialPersistenceDisabled:
      input.signedUrlOrCredentialPersisted === false,
    modelOutputShellExecutionDisabled:
      input.modelOutputShellExecutionEnabled === false
  };
}

function createEvidenceReasonCodes(
  checks: MemoryProviderVectorContinuousAlphaPreflightChecks
): MemoryProviderVectorContinuousAlphaPreflightReasonCode[] {
  const reasonCodes: MemoryProviderVectorContinuousAlphaPreflightReasonCode[] = [];
  if (!checks.phase826PlanComplete) {
    reasonCodes.push("phase_826_plan_missing");
  }
  if (!checks.phase827ImplementationComplete) {
    reasonCodes.push("phase_827_implementation_missing");
  }
  if (!checks.phase828RunbookComplete) {
    reasonCodes.push("phase_828_runbook_missing");
  }
  if (!checks.phase829OneShotUsageSessionPassed) {
    reasonCodes.push("phase_829_one_shot_evidence_missing");
  }
  if (!checks.continuousObservationPlanReviewed) {
    reasonCodes.push("continuous_observation_plan_missing");
  }
  if (!checks.sanitizedTelemetryPolicyReviewed) {
    reasonCodes.push("sanitized_telemetry_policy_missing");
  }
  if (!checks.disablePlanReviewed) {
    reasonCodes.push("disable_plan_missing");
  }
  if (!checks.exactSourceRollbackPlanReviewed) {
    reasonCodes.push("exact_source_rollback_plan_missing");
  }
  if (!checks.rollbackReadinessReviewed) {
    reasonCodes.push("rollback_readiness_missing");
  }
  if (!checks.boundedUsageWindowReviewed) {
    reasonCodes.push("bounded_usage_window_missing");
  }
  if (!checks.sourceMinimizationPlanReviewed) {
    reasonCodes.push("source_minimization_plan_missing");
  }
  if (!checks.fallbackNoRecallPlanReviewed) {
    reasonCodes.push("fallback_no_recall_plan_missing");
  }
  if (!checks.stopConditionsReviewed) {
    reasonCodes.push("stop_conditions_missing");
  }
  if (!checks.fixtureFallbackAvailable) {
    reasonCodes.push("fixture_fallback_missing");
  }
  if (!checks.releaseScopeConstrained) {
    reasonCodes.push("release_scope_not_constrained");
  }
  if (!checks.cleanVerificationEvidence) {
    reasonCodes.push("clean_verification_missing");
  }
  return reasonCodes;
}

function createBlockingReasonCodes(
  checks: MemoryProviderVectorContinuousAlphaPreflightChecks
): MemoryProviderVectorContinuousAlphaPreflightReasonCode[] {
  const reasonCodes: MemoryProviderVectorContinuousAlphaPreflightReasonCode[] = [];
  if (!checks.continuousExecutionDisabled) {
    reasonCodes.push("continuous_execution_requested");
  }
  if (!checks.envNotRead) {
    reasonCodes.push("environment_read_requested");
  }
  if (
    !checks.runtimePythonNotRead ||
    !checks.modelArtifactPathNotRead ||
    !checks.artifactNotAccessed ||
    !checks.artifactDownloadDisabled
  ) {
    reasonCodes.push("runtime_or_artifact_access_requested");
  }
  if (
    !checks.helperNotStarted ||
    !checks.helperLoadNotCalled ||
    !checks.helperEmbedNotCalled ||
    !checks.providerExecutionNotCalled
  ) {
    reasonCodes.push("helper_or_provider_execution_requested");
  }
  if (
    !checks.providerVectorWriteNotExecuted ||
    !checks.providerVectorReadNotExecuted ||
    !checks.realMemoryVectorDataNotWritten
  ) {
    reasonCodes.push("provider_vector_operation_requested");
  }
  if (
    !checks.persistentModelCacheDisabled ||
    !checks.sqliteSchemaMigrationDisabled ||
    !checks.historicalBatchIndexingDisabled
  ) {
    reasonCodes.push("persistent_or_migration_side_effect_requested");
  }
  if (
    !checks.desktopIpcUnchanged ||
    !checks.uiBehaviorUnchanged ||
    !checks.providerVisibilityUnchanged ||
    !checks.defaultOptInUnchanged
  ) {
    reasonCodes.push("desktop_ui_or_visibility_change_requested");
  }
  if (
    !checks.rawVectorsNotExposed ||
    !checks.rawTextNotExposed ||
    !checks.rawDiagnosticsNotExposed ||
    !checks.privatePathNotExposed ||
    !checks.signedUrlOrCredentialPersistenceDisabled
  ) {
    reasonCodes.push("unsafe_output_or_secret_exposure_requested");
  }
  if (!checks.modelOutputShellExecutionDisabled) {
    reasonCodes.push("shell_execution_requested");
  }
  return reasonCodes;
}
