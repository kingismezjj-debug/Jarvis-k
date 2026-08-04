import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV } from "./memory-provider-vector-retrieval-developer-alpha-plan";

export type MemoryProviderVectorContinuousAlphaPromotionGateStatus =
  | "blocked"
  | "degraded"
  | "ready_for_tester_expansion_approval";

export type MemoryProviderVectorContinuousAlphaPromotionGateReasonCode =
  | "phase830_preflight_missing"
  | "phase831_implementation_missing"
  | "phase832_acceptance_missing"
  | "operator_runbook_missing"
  | "tester_expansion_criteria_missing"
  | "sanitized_observation_checklist_missing"
  | "stop_conditions_missing"
  | "rollback_checklist_missing"
  | "promotion_gate_missing"
  | "full_gate_chain_policy_missing"
  | "approved_runtime_model_policy_missing"
  | "artifact_digest_policy_missing"
  | "memory_db_policy_missing"
  | "source_minimization_policy_missing"
  | "sanitized_telemetry_policy_missing"
  | "disable_rollback_policy_missing"
  | "incident_stop_policy_missing"
  | "raw_output_redaction_policy_missing"
  | "credential_private_path_policy_missing"
  | "cleanup_verification_policy_missing"
  | "fail_closed_policy_missing"
  | "release_gate_missing"
  | "verification_clean_missing"
  | "tester_scope_expansion_requested"
  | "default_or_ui_behavior_change_requested"
  | "runtime_or_artifact_access_requested"
  | "helper_or_provider_execution_requested"
  | "persistent_or_migration_side_effect_requested"
  | "unsafe_output_or_secret_exposure_requested"
  | "shell_execution_requested"
  | "release_policy_change_requested";

export interface MemoryProviderVectorContinuousAlphaPromotionGateInput {
  phase830PreflightComplete?: boolean;
  phase831ImplementationComplete?: boolean;
  phase832AcceptanceComplete?: boolean;
  operatorRunbookReviewed?: boolean;
  testerExpansionCriteriaReviewed?: boolean;
  sanitizedObservationChecklistReviewed?: boolean;
  stopConditionsReviewed?: boolean;
  rollbackChecklistReviewed?: boolean;
  promotionGateReviewed?: boolean;
  fullGateChainPolicyReviewed?: boolean;
  approvedRuntimeModelPolicyReviewed?: boolean;
  artifactDigestPolicyReviewed?: boolean;
  memoryDatabasePolicyReviewed?: boolean;
  sourceMinimizationPolicyReviewed?: boolean;
  sanitizedTelemetryPolicyReviewed?: boolean;
  disableRollbackPolicyReviewed?: boolean;
  incidentStopPolicyReviewed?: boolean;
  rawOutputRedactionPolicyReviewed?: boolean;
  credentialPrivatePathPolicyReviewed?: boolean;
  cleanupVerificationPolicyReviewed?: boolean;
  failClosedPolicyReviewed?: boolean;
  releaseGateReviewed?: boolean;
  cleanVerificationEvidence?: boolean;
  testerScopeExpanded?: boolean;
  defaultBehaviorChanged?: boolean;
  uiBehaviorChanged?: boolean;
  desktopIpcChanged?: boolean;
  providerVisibilityChanged?: boolean;
  fixtureFallbackChanged?: boolean;
  runtimePythonRead?: boolean;
  modelArtifactPathRead?: boolean;
  artifactAccessed?: boolean;
  helperStarted?: boolean;
  helperLoadCalled?: boolean;
  helperEmbedCalled?: boolean;
  providerExecutionCalled?: boolean;
  providerVectorWriteExecuted?: boolean;
  providerVectorReadExecuted?: boolean;
  persistentModelCacheEnabled?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  historicalBatchIndexingEnabled?: boolean;
  rawVectorsExposed?: boolean;
  rawTextExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposed?: boolean;
  signedUrlOrCredentialPersisted?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
  releaseChannelChanged?: boolean;
  installerPolicyChanged?: boolean;
  modelLifecyclePolicyChanged?: boolean;
  cachePolicyChanged?: boolean;
  upgradeRollbackPolicyChanged?: boolean;
}

export interface MemoryProviderVectorContinuousAlphaPromotionGateChecks {
  phase830PreflightComplete: boolean;
  phase831ImplementationComplete: boolean;
  phase832AcceptanceComplete: boolean;
  operatorRunbookReviewed: boolean;
  testerExpansionCriteriaReviewed: boolean;
  sanitizedObservationChecklistReviewed: boolean;
  stopConditionsReviewed: boolean;
  rollbackChecklistReviewed: boolean;
  promotionGateReviewed: boolean;
  fullGateChainPolicyReviewed: boolean;
  approvedRuntimeModelPolicyReviewed: boolean;
  artifactDigestPolicyReviewed: boolean;
  memoryDatabasePolicyReviewed: boolean;
  sourceMinimizationPolicyReviewed: boolean;
  sanitizedTelemetryPolicyReviewed: boolean;
  disableRollbackPolicyReviewed: boolean;
  incidentStopPolicyReviewed: boolean;
  rawOutputRedactionPolicyReviewed: boolean;
  credentialPrivatePathPolicyReviewed: boolean;
  cleanupVerificationPolicyReviewed: boolean;
  failClosedPolicyReviewed: boolean;
  releaseGateReviewed: boolean;
  cleanVerificationEvidence: boolean;
  testerScopeNotExpanded: boolean;
  defaultBehaviorUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  desktopIpcUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  fixtureFallbackUnchanged: boolean;
  runtimePythonNotRead: boolean;
  modelArtifactPathNotRead: boolean;
  artifactNotAccessed: boolean;
  helperNotStarted: boolean;
  helperLoadNotCalled: boolean;
  helperEmbedNotCalled: boolean;
  providerExecutionNotCalled: boolean;
  providerVectorWriteNotExecuted: boolean;
  providerVectorReadNotExecuted: boolean;
  persistentModelCacheDisabled: boolean;
  sqliteSchemaMigrationDisabled: boolean;
  historicalBatchIndexingDisabled: boolean;
  rawVectorsNotExposed: boolean;
  rawTextNotExposed: boolean;
  rawDiagnosticsNotExposed: boolean;
  privatePathNotExposed: boolean;
  signedUrlOrCredentialPersistenceDisabled: boolean;
  modelOutputShellExecutionDisabled: boolean;
  releaseChannelUnchanged: boolean;
  installerPolicyUnchanged: boolean;
  modelLifecyclePolicyUnchanged: boolean;
  cachePolicyUnchanged: boolean;
  upgradeRollbackPolicyUnchanged: boolean;
}

export interface MemoryProviderVectorContinuousAlphaPromotionPolicy {
  mode: "continuous_alpha_operator_runbook_and_promotion_gate";
  currentTesterScope: "single_local_developer_alpha";
  nextTesterScopeRequiresSeparateApproval: true;
  observationScope: "sanitized_counts_statuses_reason_codes_only";
  stopConditionScope:
    "artifact_runtime_retrieval_cleanup_rollback_or_safety_regression";
  rollbackScope: "exact_source_provider_vectors_for_test_window_only";
  memoryDatabasePolicy: "explicit_test_window_database_or_reviewed_alpha_database";
  sourceScope: "new_minimized_explicitly_accepted_test_window_messages";
  releaseScope: "developer_alpha_evidence_only";
  envKey: typeof MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV;
  maximumRecallMatches: 5;
  defaultEnabled: false;
  uiControlsAllowed: false;
  providerVisibilityChangeAllowed: false;
  historicalBatchIndexingAllowed: false;
  persistentModelCacheAllowed: false;
  sqliteMigrationAllowed: false;
  rawOutputAllowed: false;
  shellExecutionAllowed: false;
}

export interface MemoryProviderVectorContinuousAlphaPromotionGateResult {
  phase: "8.33";
  capability: "memory_provider_vector_retrieval_continuous_alpha_promotion_gate";
  status: MemoryProviderVectorContinuousAlphaPromotionGateStatus;
  accepted: boolean;
  readyForTesterExpansionApproval: boolean;
  preflightOnly: true;
  promotionPolicy: MemoryProviderVectorContinuousAlphaPromotionPolicy;
  testerScopeExpanded: false;
  defaultBehaviorChanged: false;
  uiBehaviorChanged: false;
  desktopIpcChanged: false;
  providerVisibilityChanged: false;
  fixtureFallbackChanged: false;
  runtimePythonRead: false;
  modelArtifactPathRead: false;
  artifactAccessed: false;
  helperStarted: false;
  helperLoadCalled: false;
  helperEmbedCalled: false;
  providerExecutionCalled: false;
  providerVectorWriteExecuted: false;
  providerVectorReadExecuted: false;
  persistentModelCacheEnabled: false;
  sqliteSchemaMigrationEnabled: false;
  historicalBatchIndexingEnabled: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathExposed: false;
  signedUrlOrCredentialPersisted: false;
  modelOutputShellExecutionEnabled: false;
  releaseChannelChanged: false;
  installerPolicyChanged: false;
  modelLifecyclePolicyChanged: false;
  cachePolicyChanged: false;
  upgradeRollbackPolicyChanged: false;
  checkedAreas: string[];
  checks: MemoryProviderVectorContinuousAlphaPromotionGateChecks;
  reasonCodes: MemoryProviderVectorContinuousAlphaPromotionGateReasonCode[];
}

export function createMemoryProviderVectorContinuousAlphaPromotionPolicy(): MemoryProviderVectorContinuousAlphaPromotionPolicy {
  return {
    mode: "continuous_alpha_operator_runbook_and_promotion_gate",
    currentTesterScope: "single_local_developer_alpha",
    nextTesterScopeRequiresSeparateApproval: true,
    observationScope: "sanitized_counts_statuses_reason_codes_only",
    stopConditionScope:
      "artifact_runtime_retrieval_cleanup_rollback_or_safety_regression",
    rollbackScope: "exact_source_provider_vectors_for_test_window_only",
    memoryDatabasePolicy: "explicit_test_window_database_or_reviewed_alpha_database",
    sourceScope: "new_minimized_explicitly_accepted_test_window_messages",
    releaseScope: "developer_alpha_evidence_only",
    envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
    maximumRecallMatches: 5,
    defaultEnabled: false,
    uiControlsAllowed: false,
    providerVisibilityChangeAllowed: false,
    historicalBatchIndexingAllowed: false,
    persistentModelCacheAllowed: false,
    sqliteMigrationAllowed: false,
    rawOutputAllowed: false,
    shellExecutionAllowed: false
  };
}

export function evaluateMemoryProviderVectorContinuousAlphaPromotionGate(
  input: MemoryProviderVectorContinuousAlphaPromotionGateInput = {}
): MemoryProviderVectorContinuousAlphaPromotionGateResult {
  const checks = createChecks(input);
  const evidenceReasonCodes = createEvidenceReasonCodes(checks);
  const blockingReasonCodes = createBlockingReasonCodes(checks);
  const accepted =
    evidenceReasonCodes.length === 0 && blockingReasonCodes.length === 0;

  return {
    phase: "8.33",
    capability:
      "memory_provider_vector_retrieval_continuous_alpha_promotion_gate",
    status: accepted
      ? "ready_for_tester_expansion_approval"
      : blockingReasonCodes.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForTesterExpansionApproval: accepted,
    preflightOnly: true,
    promotionPolicy:
      createMemoryProviderVectorContinuousAlphaPromotionPolicy(),
    testerScopeExpanded: false,
    defaultBehaviorChanged: false,
    uiBehaviorChanged: false,
    desktopIpcChanged: false,
    providerVisibilityChanged: false,
    fixtureFallbackChanged: false,
    runtimePythonRead: false,
    modelArtifactPathRead: false,
    artifactAccessed: false,
    helperStarted: false,
    helperLoadCalled: false,
    helperEmbedCalled: false,
    providerExecutionCalled: false,
    providerVectorWriteExecuted: false,
    providerVectorReadExecuted: false,
    persistentModelCacheEnabled: false,
    sqliteSchemaMigrationEnabled: false,
    historicalBatchIndexingEnabled: false,
    rawVectorsExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathExposed: false,
    signedUrlOrCredentialPersisted: false,
    modelOutputShellExecutionEnabled: false,
    releaseChannelChanged: false,
    installerPolicyChanged: false,
    modelLifecyclePolicyChanged: false,
    cachePolicyChanged: false,
    upgradeRollbackPolicyChanged: false,
    checkedAreas: accepted
      ? [
          "operator_runbook",
          "tester_expansion_criteria",
          "sanitized_observation_checklist",
          "stop_conditions",
          "rollback_checklist",
          "full_gate_chain_policy",
          "approved_runtime_model_policy",
          "artifact_digest_policy",
          "memory_database_policy",
          "source_minimization",
          "sanitized_telemetry",
          "incident_stop_policy",
          "redaction_policy",
          "cleanup_verification",
          "release_gate"
        ]
      : [],
    checks,
    reasonCodes: [...evidenceReasonCodes, ...blockingReasonCodes]
  };
}

function createChecks(
  input: MemoryProviderVectorContinuousAlphaPromotionGateInput
): MemoryProviderVectorContinuousAlphaPromotionGateChecks {
  return {
    phase830PreflightComplete: input.phase830PreflightComplete === true,
    phase831ImplementationComplete:
      input.phase831ImplementationComplete === true,
    phase832AcceptanceComplete: input.phase832AcceptanceComplete === true,
    operatorRunbookReviewed: input.operatorRunbookReviewed === true,
    testerExpansionCriteriaReviewed:
      input.testerExpansionCriteriaReviewed === true,
    sanitizedObservationChecklistReviewed:
      input.sanitizedObservationChecklistReviewed === true,
    stopConditionsReviewed: input.stopConditionsReviewed === true,
    rollbackChecklistReviewed: input.rollbackChecklistReviewed === true,
    promotionGateReviewed: input.promotionGateReviewed === true,
    fullGateChainPolicyReviewed:
      input.fullGateChainPolicyReviewed === true,
    approvedRuntimeModelPolicyReviewed:
      input.approvedRuntimeModelPolicyReviewed === true,
    artifactDigestPolicyReviewed:
      input.artifactDigestPolicyReviewed === true,
    memoryDatabasePolicyReviewed:
      input.memoryDatabasePolicyReviewed === true,
    sourceMinimizationPolicyReviewed:
      input.sourceMinimizationPolicyReviewed === true,
    sanitizedTelemetryPolicyReviewed:
      input.sanitizedTelemetryPolicyReviewed === true,
    disableRollbackPolicyReviewed:
      input.disableRollbackPolicyReviewed === true,
    incidentStopPolicyReviewed: input.incidentStopPolicyReviewed === true,
    rawOutputRedactionPolicyReviewed:
      input.rawOutputRedactionPolicyReviewed === true,
    credentialPrivatePathPolicyReviewed:
      input.credentialPrivatePathPolicyReviewed === true,
    cleanupVerificationPolicyReviewed:
      input.cleanupVerificationPolicyReviewed === true,
    failClosedPolicyReviewed: input.failClosedPolicyReviewed === true,
    releaseGateReviewed: input.releaseGateReviewed === true,
    cleanVerificationEvidence: input.cleanVerificationEvidence === true,
    testerScopeNotExpanded: input.testerScopeExpanded === false,
    defaultBehaviorUnchanged: input.defaultBehaviorChanged === false,
    uiBehaviorUnchanged: input.uiBehaviorChanged === false,
    desktopIpcUnchanged: input.desktopIpcChanged === false,
    providerVisibilityUnchanged: input.providerVisibilityChanged === false,
    fixtureFallbackUnchanged: input.fixtureFallbackChanged === false,
    runtimePythonNotRead: input.runtimePythonRead === false,
    modelArtifactPathNotRead: input.modelArtifactPathRead === false,
    artifactNotAccessed: input.artifactAccessed === false,
    helperNotStarted: input.helperStarted === false,
    helperLoadNotCalled: input.helperLoadCalled === false,
    helperEmbedNotCalled: input.helperEmbedCalled === false,
    providerExecutionNotCalled: input.providerExecutionCalled === false,
    providerVectorWriteNotExecuted:
      input.providerVectorWriteExecuted === false,
    providerVectorReadNotExecuted:
      input.providerVectorReadExecuted === false,
    persistentModelCacheDisabled:
      input.persistentModelCacheEnabled === false,
    sqliteSchemaMigrationDisabled:
      input.sqliteSchemaMigrationEnabled === false,
    historicalBatchIndexingDisabled:
      input.historicalBatchIndexingEnabled === false,
    rawVectorsNotExposed: input.rawVectorsExposed === false,
    rawTextNotExposed: input.rawTextExposed === false,
    rawDiagnosticsNotExposed: input.rawDiagnosticsExposed === false,
    privatePathNotExposed: input.privatePathExposed === false,
    signedUrlOrCredentialPersistenceDisabled:
      input.signedUrlOrCredentialPersisted === false,
    modelOutputShellExecutionDisabled:
      input.modelOutputShellExecutionEnabled === false,
    releaseChannelUnchanged: input.releaseChannelChanged === false,
    installerPolicyUnchanged: input.installerPolicyChanged === false,
    modelLifecyclePolicyUnchanged:
      input.modelLifecyclePolicyChanged === false,
    cachePolicyUnchanged: input.cachePolicyChanged === false,
    upgradeRollbackPolicyUnchanged:
      input.upgradeRollbackPolicyChanged === false
  };
}

function createEvidenceReasonCodes(
  checks: MemoryProviderVectorContinuousAlphaPromotionGateChecks
): MemoryProviderVectorContinuousAlphaPromotionGateReasonCode[] {
  const reasonCodes: MemoryProviderVectorContinuousAlphaPromotionGateReasonCode[] = [];
  if (!checks.phase830PreflightComplete) {
    reasonCodes.push("phase830_preflight_missing");
  }
  if (!checks.phase831ImplementationComplete) {
    reasonCodes.push("phase831_implementation_missing");
  }
  if (!checks.phase832AcceptanceComplete) {
    reasonCodes.push("phase832_acceptance_missing");
  }
  if (!checks.operatorRunbookReviewed) {
    reasonCodes.push("operator_runbook_missing");
  }
  if (!checks.testerExpansionCriteriaReviewed) {
    reasonCodes.push("tester_expansion_criteria_missing");
  }
  if (!checks.sanitizedObservationChecklistReviewed) {
    reasonCodes.push("sanitized_observation_checklist_missing");
  }
  if (!checks.stopConditionsReviewed) {
    reasonCodes.push("stop_conditions_missing");
  }
  if (!checks.rollbackChecklistReviewed) {
    reasonCodes.push("rollback_checklist_missing");
  }
  if (!checks.promotionGateReviewed) {
    reasonCodes.push("promotion_gate_missing");
  }
  if (!checks.fullGateChainPolicyReviewed) {
    reasonCodes.push("full_gate_chain_policy_missing");
  }
  if (!checks.approvedRuntimeModelPolicyReviewed) {
    reasonCodes.push("approved_runtime_model_policy_missing");
  }
  if (!checks.artifactDigestPolicyReviewed) {
    reasonCodes.push("artifact_digest_policy_missing");
  }
  if (!checks.memoryDatabasePolicyReviewed) {
    reasonCodes.push("memory_db_policy_missing");
  }
  if (!checks.sourceMinimizationPolicyReviewed) {
    reasonCodes.push("source_minimization_policy_missing");
  }
  if (!checks.sanitizedTelemetryPolicyReviewed) {
    reasonCodes.push("sanitized_telemetry_policy_missing");
  }
  if (!checks.disableRollbackPolicyReviewed) {
    reasonCodes.push("disable_rollback_policy_missing");
  }
  if (!checks.incidentStopPolicyReviewed) {
    reasonCodes.push("incident_stop_policy_missing");
  }
  if (!checks.rawOutputRedactionPolicyReviewed) {
    reasonCodes.push("raw_output_redaction_policy_missing");
  }
  if (!checks.credentialPrivatePathPolicyReviewed) {
    reasonCodes.push("credential_private_path_policy_missing");
  }
  if (!checks.cleanupVerificationPolicyReviewed) {
    reasonCodes.push("cleanup_verification_policy_missing");
  }
  if (!checks.failClosedPolicyReviewed) {
    reasonCodes.push("fail_closed_policy_missing");
  }
  if (!checks.releaseGateReviewed) {
    reasonCodes.push("release_gate_missing");
  }
  if (!checks.cleanVerificationEvidence) {
    reasonCodes.push("verification_clean_missing");
  }
  return reasonCodes;
}

function createBlockingReasonCodes(
  checks: MemoryProviderVectorContinuousAlphaPromotionGateChecks
): MemoryProviderVectorContinuousAlphaPromotionGateReasonCode[] {
  const reasonCodes: MemoryProviderVectorContinuousAlphaPromotionGateReasonCode[] = [];
  if (!checks.testerScopeNotExpanded) {
    reasonCodes.push("tester_scope_expansion_requested");
  }
  if (
    !checks.defaultBehaviorUnchanged ||
    !checks.uiBehaviorUnchanged ||
    !checks.desktopIpcUnchanged ||
    !checks.providerVisibilityUnchanged ||
    !checks.fixtureFallbackUnchanged
  ) {
    reasonCodes.push("default_or_ui_behavior_change_requested");
  }
  if (
    !checks.runtimePythonNotRead ||
    !checks.modelArtifactPathNotRead ||
    !checks.artifactNotAccessed
  ) {
    reasonCodes.push("runtime_or_artifact_access_requested");
  }
  if (
    !checks.helperNotStarted ||
    !checks.helperLoadNotCalled ||
    !checks.helperEmbedNotCalled ||
    !checks.providerExecutionNotCalled ||
    !checks.providerVectorWriteNotExecuted ||
    !checks.providerVectorReadNotExecuted
  ) {
    reasonCodes.push("helper_or_provider_execution_requested");
  }
  if (
    !checks.persistentModelCacheDisabled ||
    !checks.sqliteSchemaMigrationDisabled ||
    !checks.historicalBatchIndexingDisabled
  ) {
    reasonCodes.push("persistent_or_migration_side_effect_requested");
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
  if (
    !checks.releaseChannelUnchanged ||
    !checks.installerPolicyUnchanged ||
    !checks.modelLifecyclePolicyUnchanged ||
    !checks.cachePolicyUnchanged ||
    !checks.upgradeRollbackPolicyUnchanged
  ) {
    reasonCodes.push("release_policy_change_requested");
  }
  return reasonCodes;
}
