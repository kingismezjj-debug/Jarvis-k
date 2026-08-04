import {
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
  createMemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan
} from "./memory-provider-vector-retrieval-developer-alpha-plan";

export type MemoryProviderVectorTesterExpansionApprovalPacketStatus =
  | "blocked"
  | "degraded"
  | "ready_for_tester_expansion_approval_review";

export type MemoryProviderVectorTesterExpansionApprovalPacketReasonCode =
  | "phase832_acceptance_missing"
  | "phase833_promotion_gate_missing"
  | "local_verification_missing"
  | "ci_verification_missing"
  | "approval_packet_missing"
  | "bounded_tester_cohort_missing"
  | "bounded_test_window_missing"
  | "consent_or_synthetic_message_policy_missing"
  | "runtime_model_handling_policy_missing"
  | "memory_database_policy_missing"
  | "source_minimization_policy_missing"
  | "sanitized_observation_checklist_missing"
  | "stop_conditions_missing"
  | "rollback_checklist_missing"
  | "operator_ownership_missing"
  | "release_readiness_checklist_missing"
  | "non_release_scope_missing"
  | "installer_update_exclusion_missing"
  | "model_lifecycle_cache_policy_missing"
  | "tester_expansion_executed"
  | "real_usage_session_started"
  | "environment_read_requested"
  | "runtime_or_artifact_access_requested"
  | "helper_or_provider_execution_requested"
  | "provider_vector_operation_requested"
  | "persistent_or_migration_side_effect_requested"
  | "desktop_ui_or_visibility_change_requested"
  | "unsafe_output_or_secret_exposure_requested"
  | "shell_execution_requested"
  | "release_policy_change_requested"
  | "product_slo_declared";

export interface MemoryProviderVectorTesterExpansionApprovalPacketInput {
  phase832AcceptanceComplete?: boolean;
  phase833PromotionGateComplete?: boolean;
  localVerificationClean?: boolean;
  ciVerificationClean?: boolean;
  approvalPacketDrafted?: boolean;
  boundedTesterCohortReviewed?: boolean;
  boundedTestWindowReviewed?: boolean;
  consentOrSyntheticMessagePolicyReviewed?: boolean;
  runtimeModelHandlingPolicyReviewed?: boolean;
  memoryDatabasePolicyReviewed?: boolean;
  sourceMinimizationPolicyReviewed?: boolean;
  sanitizedObservationChecklistReviewed?: boolean;
  stopConditionsReviewed?: boolean;
  rollbackChecklistReviewed?: boolean;
  operatorOwnershipReviewed?: boolean;
  releaseReadinessChecklistReviewed?: boolean;
  nonReleaseScopeReviewed?: boolean;
  installerUpdateExclusionReviewed?: boolean;
  modelLifecycleCachePolicyReviewed?: boolean;
  testerExpansionExecuted?: boolean;
  realUsageSessionStarted?: boolean;
  envRead?: boolean;
  runtimePythonRead?: boolean;
  modelArtifactPathRead?: boolean;
  artifactAccessed?: boolean;
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
  releaseChannelChanged?: boolean;
  installerPolicyChanged?: boolean;
  updateRollbackPolicyChanged?: boolean;
  modelLifecyclePolicyChanged?: boolean;
  cachePolicyChanged?: boolean;
  productSloDeclared?: boolean;
}

export interface MemoryProviderVectorTesterExpansionApprovalPacketChecks {
  phase832AcceptanceComplete: boolean;
  phase833PromotionGateComplete: boolean;
  localVerificationClean: boolean;
  ciVerificationClean: boolean;
  approvalPacketDrafted: boolean;
  boundedTesterCohortReviewed: boolean;
  boundedTestWindowReviewed: boolean;
  consentOrSyntheticMessagePolicyReviewed: boolean;
  runtimeModelHandlingPolicyReviewed: boolean;
  memoryDatabasePolicyReviewed: boolean;
  sourceMinimizationPolicyReviewed: boolean;
  sanitizedObservationChecklistReviewed: boolean;
  stopConditionsReviewed: boolean;
  rollbackChecklistReviewed: boolean;
  operatorOwnershipReviewed: boolean;
  releaseReadinessChecklistReviewed: boolean;
  nonReleaseScopeReviewed: boolean;
  installerUpdateExclusionReviewed: boolean;
  modelLifecycleCachePolicyReviewed: boolean;
  testerExpansionNotExecuted: boolean;
  realUsageSessionNotStarted: boolean;
  envNotRead: boolean;
  runtimePythonNotRead: boolean;
  modelArtifactPathNotRead: boolean;
  artifactNotAccessed: boolean;
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
  releaseChannelUnchanged: boolean;
  installerPolicyUnchanged: boolean;
  updateRollbackPolicyUnchanged: boolean;
  modelLifecyclePolicyUnchanged: boolean;
  cachePolicyUnchanged: boolean;
  productSloNotDeclared: boolean;
}

export interface MemoryProviderVectorTesterExpansionApprovalPacket {
  mode: "tester_expansion_approval_packet";
  scope: "proposal_only_no_expansion";
  currentScope: "single_local_developer_alpha";
  requestedNextScope: "bounded_small_cohort_developer_alpha";
  separateProductSecurityReleaseApprovalRequired: true;
  envKey: typeof MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV;
  prerequisiteEnvKeys: readonly string[];
  proposedTesterLimit: 3;
  proposedMessageLimitPerTester: 5;
  proposedWindowHours: 2;
  allowedMessagePolicy: "synthetic_or_explicitly_consented_minimized_messages";
  memoryDatabasePolicy: "temporary_or_reviewed_alpha_database_only";
  rollbackPolicy: "exact_source_provider_vectors_for_test_window_only";
  observationPolicy: "sanitized_counts_statuses_dimensions_reason_codes_only";
  stopPolicy: "stop_on_any_safety_runtime_retrieval_or_rollback_regression";
  defaultEnabled: false;
  uiControlsAllowed: false;
  providerVisibilityChangeAllowed: false;
  historicalBatchIndexingAllowed: false;
  persistentModelCacheAllowed: false;
  sqliteMigrationAllowed: false;
  rawOutputAllowed: false;
  shellExecutionAllowed: false;
}

export interface MemoryProviderVectorReleaseReadinessChecklist {
  mode: "release_readiness_checklist";
  releaseScope: "developer_alpha_evidence_only";
  requiresSeparateReleaseGateForBroaderUse: true;
  installerIncluded: false;
  automaticUpdatesIncluded: false;
  defaultConfigIncluded: false;
  publicUserDocsIncluded: false;
  productSloIncluded: false;
  modelLifecyclePolicyChanged: false;
  cachePolicyChanged: false;
  upgradeRollbackPolicyChanged: false;
  requiredEvidence: readonly string[];
  hardStopConditions: readonly string[];
}

export interface MemoryProviderVectorTesterExpansionApprovalPacketResult {
  phase: "8.34";
  capability: "memory_provider_vector_retrieval_tester_expansion_approval_packet";
  status: MemoryProviderVectorTesterExpansionApprovalPacketStatus;
  accepted: boolean;
  readyForTesterExpansionApprovalReview: boolean;
  packetOnly: true;
  approvalPacket: MemoryProviderVectorTesterExpansionApprovalPacket;
  releaseReadinessChecklist: MemoryProviderVectorReleaseReadinessChecklist;
  testerExpansionExecuted: false;
  realUsageSessionStarted: false;
  envRead: false;
  runtimePythonRead: false;
  modelArtifactPathRead: false;
  artifactAccessed: false;
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
  releaseChannelChanged: false;
  installerPolicyChanged: false;
  updateRollbackPolicyChanged: false;
  modelLifecyclePolicyChanged: false;
  cachePolicyChanged: false;
  productSloDeclared: false;
  checkedAreas: string[];
  checks: MemoryProviderVectorTesterExpansionApprovalPacketChecks;
  reasonCodes: MemoryProviderVectorTesterExpansionApprovalPacketReasonCode[];
}

export function createMemoryProviderVectorTesterExpansionApprovalPacket(): MemoryProviderVectorTesterExpansionApprovalPacket {
  const developerAlphaPlan =
    createMemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan();

  return {
    mode: "tester_expansion_approval_packet",
    scope: "proposal_only_no_expansion",
    currentScope: "single_local_developer_alpha",
    requestedNextScope: "bounded_small_cohort_developer_alpha",
    separateProductSecurityReleaseApprovalRequired: true,
    envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
    prerequisiteEnvKeys: developerAlphaPlan.prerequisiteEnvKeys,
    proposedTesterLimit: 3,
    proposedMessageLimitPerTester: 5,
    proposedWindowHours: 2,
    allowedMessagePolicy: "synthetic_or_explicitly_consented_minimized_messages",
    memoryDatabasePolicy: "temporary_or_reviewed_alpha_database_only",
    rollbackPolicy: "exact_source_provider_vectors_for_test_window_only",
    observationPolicy: "sanitized_counts_statuses_dimensions_reason_codes_only",
    stopPolicy: "stop_on_any_safety_runtime_retrieval_or_rollback_regression",
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

export function createMemoryProviderVectorReleaseReadinessChecklist(): MemoryProviderVectorReleaseReadinessChecklist {
  return {
    mode: "release_readiness_checklist",
    releaseScope: "developer_alpha_evidence_only",
    requiresSeparateReleaseGateForBroaderUse: true,
    installerIncluded: false,
    automaticUpdatesIncluded: false,
    defaultConfigIncluded: false,
    publicUserDocsIncluded: false,
    productSloIncluded: false,
    modelLifecyclePolicyChanged: false,
    cachePolicyChanged: false,
    upgradeRollbackPolicyChanged: false,
    requiredEvidence: [
      "phase_832_acceptance_passed",
      "phase_833_promotion_gate_passed",
      "local_verify_boundaries_sensitive_checks_passed",
      "github_actions_ci_passed",
      "bounded_tester_cohort_and_time_window_reviewed",
      "memory_database_and_source_minimization_policy_reviewed",
      "sanitized_observation_stop_and_rollback_plan_reviewed"
    ],
    hardStopConditions: [
      "raw_vectors_or_raw_text_exposed",
      "private_paths_credentials_or_signed_urls_exposed",
      "artifact_digest_verification_failed",
      "helper_or_retrieval_degraded_without_no_recall_fallback",
      "rollback_cleanup_failed",
      "desktop_ui_provider_visibility_or_default_behavior_changed",
      "sqlite_migration_or_historical_batch_indexing_requested",
      "retrieval_output_connected_to_shell_or_windows_execution"
    ]
  };
}

export function evaluateMemoryProviderVectorTesterExpansionApprovalPacket(
  input: MemoryProviderVectorTesterExpansionApprovalPacketInput = {}
): MemoryProviderVectorTesterExpansionApprovalPacketResult {
  const checks = createChecks(input);
  const evidenceReasonCodes = createEvidenceReasonCodes(checks);
  const blockingReasonCodes = createBlockingReasonCodes(checks);
  const accepted =
    evidenceReasonCodes.length === 0 && blockingReasonCodes.length === 0;

  return {
    phase: "8.34",
    capability:
      "memory_provider_vector_retrieval_tester_expansion_approval_packet",
    status: accepted
      ? "ready_for_tester_expansion_approval_review"
      : blockingReasonCodes.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForTesterExpansionApprovalReview: accepted,
    packetOnly: true,
    approvalPacket: createMemoryProviderVectorTesterExpansionApprovalPacket(),
    releaseReadinessChecklist:
      createMemoryProviderVectorReleaseReadinessChecklist(),
    testerExpansionExecuted: false,
    realUsageSessionStarted: false,
    envRead: false,
    runtimePythonRead: false,
    modelArtifactPathRead: false,
    artifactAccessed: false,
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
    releaseChannelChanged: false,
    installerPolicyChanged: false,
    updateRollbackPolicyChanged: false,
    modelLifecyclePolicyChanged: false,
    cachePolicyChanged: false,
    productSloDeclared: false,
    checkedAreas: accepted
      ? [
          "phase_832_acceptance_evidence",
          "phase_833_promotion_gate",
          "tester_expansion_approval_packet",
          "bounded_tester_cohort",
          "bounded_test_window",
          "consent_or_synthetic_message_policy",
          "runtime_model_handling_policy",
          "memory_database_policy",
          "source_minimization",
          "sanitized_observation",
          "stop_conditions",
          "rollback_checklist",
          "operator_ownership",
          "release_readiness_checklist"
        ]
      : [],
    checks,
    reasonCodes: [...evidenceReasonCodes, ...blockingReasonCodes]
  };
}

function createChecks(
  input: MemoryProviderVectorTesterExpansionApprovalPacketInput
): MemoryProviderVectorTesterExpansionApprovalPacketChecks {
  return {
    phase832AcceptanceComplete: input.phase832AcceptanceComplete === true,
    phase833PromotionGateComplete:
      input.phase833PromotionGateComplete === true,
    localVerificationClean: input.localVerificationClean === true,
    ciVerificationClean: input.ciVerificationClean === true,
    approvalPacketDrafted: input.approvalPacketDrafted === true,
    boundedTesterCohortReviewed:
      input.boundedTesterCohortReviewed === true,
    boundedTestWindowReviewed: input.boundedTestWindowReviewed === true,
    consentOrSyntheticMessagePolicyReviewed:
      input.consentOrSyntheticMessagePolicyReviewed === true,
    runtimeModelHandlingPolicyReviewed:
      input.runtimeModelHandlingPolicyReviewed === true,
    memoryDatabasePolicyReviewed:
      input.memoryDatabasePolicyReviewed === true,
    sourceMinimizationPolicyReviewed:
      input.sourceMinimizationPolicyReviewed === true,
    sanitizedObservationChecklistReviewed:
      input.sanitizedObservationChecklistReviewed === true,
    stopConditionsReviewed: input.stopConditionsReviewed === true,
    rollbackChecklistReviewed: input.rollbackChecklistReviewed === true,
    operatorOwnershipReviewed: input.operatorOwnershipReviewed === true,
    releaseReadinessChecklistReviewed:
      input.releaseReadinessChecklistReviewed === true,
    nonReleaseScopeReviewed: input.nonReleaseScopeReviewed === true,
    installerUpdateExclusionReviewed:
      input.installerUpdateExclusionReviewed === true,
    modelLifecycleCachePolicyReviewed:
      input.modelLifecycleCachePolicyReviewed === true,
    testerExpansionNotExecuted: input.testerExpansionExecuted === false,
    realUsageSessionNotStarted: input.realUsageSessionStarted === false,
    envNotRead: input.envRead === false,
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
      input.modelOutputShellExecutionEnabled === false,
    releaseChannelUnchanged: input.releaseChannelChanged === false,
    installerPolicyUnchanged: input.installerPolicyChanged === false,
    updateRollbackPolicyUnchanged:
      input.updateRollbackPolicyChanged === false,
    modelLifecyclePolicyUnchanged:
      input.modelLifecyclePolicyChanged === false,
    cachePolicyUnchanged: input.cachePolicyChanged === false,
    productSloNotDeclared: input.productSloDeclared === false
  };
}

function createEvidenceReasonCodes(
  checks: MemoryProviderVectorTesterExpansionApprovalPacketChecks
): MemoryProviderVectorTesterExpansionApprovalPacketReasonCode[] {
  const reasonCodes: MemoryProviderVectorTesterExpansionApprovalPacketReasonCode[] = [];
  if (!checks.phase832AcceptanceComplete) {
    reasonCodes.push("phase832_acceptance_missing");
  }
  if (!checks.phase833PromotionGateComplete) {
    reasonCodes.push("phase833_promotion_gate_missing");
  }
  if (!checks.localVerificationClean) {
    reasonCodes.push("local_verification_missing");
  }
  if (!checks.ciVerificationClean) {
    reasonCodes.push("ci_verification_missing");
  }
  if (!checks.approvalPacketDrafted) {
    reasonCodes.push("approval_packet_missing");
  }
  if (!checks.boundedTesterCohortReviewed) {
    reasonCodes.push("bounded_tester_cohort_missing");
  }
  if (!checks.boundedTestWindowReviewed) {
    reasonCodes.push("bounded_test_window_missing");
  }
  if (!checks.consentOrSyntheticMessagePolicyReviewed) {
    reasonCodes.push("consent_or_synthetic_message_policy_missing");
  }
  if (!checks.runtimeModelHandlingPolicyReviewed) {
    reasonCodes.push("runtime_model_handling_policy_missing");
  }
  if (!checks.memoryDatabasePolicyReviewed) {
    reasonCodes.push("memory_database_policy_missing");
  }
  if (!checks.sourceMinimizationPolicyReviewed) {
    reasonCodes.push("source_minimization_policy_missing");
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
  if (!checks.operatorOwnershipReviewed) {
    reasonCodes.push("operator_ownership_missing");
  }
  if (!checks.releaseReadinessChecklistReviewed) {
    reasonCodes.push("release_readiness_checklist_missing");
  }
  if (!checks.nonReleaseScopeReviewed) {
    reasonCodes.push("non_release_scope_missing");
  }
  if (!checks.installerUpdateExclusionReviewed) {
    reasonCodes.push("installer_update_exclusion_missing");
  }
  if (!checks.modelLifecycleCachePolicyReviewed) {
    reasonCodes.push("model_lifecycle_cache_policy_missing");
  }
  return reasonCodes;
}

function createBlockingReasonCodes(
  checks: MemoryProviderVectorTesterExpansionApprovalPacketChecks
): MemoryProviderVectorTesterExpansionApprovalPacketReasonCode[] {
  const reasonCodes: MemoryProviderVectorTesterExpansionApprovalPacketReasonCode[] = [];
  if (!checks.testerExpansionNotExecuted) {
    reasonCodes.push("tester_expansion_executed");
  }
  if (!checks.realUsageSessionNotStarted) {
    reasonCodes.push("real_usage_session_started");
  }
  if (!checks.envNotRead) {
    reasonCodes.push("environment_read_requested");
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
  if (
    !checks.releaseChannelUnchanged ||
    !checks.installerPolicyUnchanged ||
    !checks.updateRollbackPolicyUnchanged ||
    !checks.modelLifecyclePolicyUnchanged ||
    !checks.cachePolicyUnchanged
  ) {
    reasonCodes.push("release_policy_change_requested");
  }
  if (!checks.productSloNotDeclared) {
    reasonCodes.push("product_slo_declared");
  }
  return reasonCodes;
}
