import {
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV
} from "./memory-provider-vector-retrieval-developer-alpha-plan";
import {
  createMemoryProviderVectorReleaseReadinessChecklist,
  createMemoryProviderVectorTesterExpansionApprovalPacket
} from "./memory-provider-vector-retrieval-tester-expansion-approval-packet";

export type MemoryProviderVectorTesterExpansionDryRunPreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_bounded_tester_expansion_dry_run_review";

export type MemoryProviderVectorTesterExpansionDryRunPreflightReasonCode =
  | "phase834_approval_packet_missing"
  | "operator_checklist_missing"
  | "env_gate_checklist_missing"
  | "rollback_dry_run_checklist_missing"
  | "sanitized_report_schema_missing"
  | "stop_condition_checklist_missing"
  | "release_gate_checklist_missing"
  | "candidate_tester_roster_policy_missing"
  | "consent_message_policy_missing"
  | "verification_clean_missing"
  | "ci_verification_missing"
  | "tester_expansion_executed"
  | "tester_invitation_sent"
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

export interface MemoryProviderVectorTesterExpansionDryRunPreflightInput {
  phase834ApprovalPacketComplete?: boolean;
  operatorChecklistReviewed?: boolean;
  envGateChecklistReviewed?: boolean;
  rollbackDryRunChecklistReviewed?: boolean;
  sanitizedReportSchemaReviewed?: boolean;
  stopConditionChecklistReviewed?: boolean;
  releaseGateChecklistReviewed?: boolean;
  candidateTesterRosterPolicyReviewed?: boolean;
  consentMessagePolicyReviewed?: boolean;
  verificationClean?: boolean;
  ciVerificationClean?: boolean;
  testerExpansionExecuted?: boolean;
  testerInvitationSent?: boolean;
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

export interface MemoryProviderVectorTesterExpansionDryRunPreflightChecks {
  phase834ApprovalPacketComplete: boolean;
  operatorChecklistReviewed: boolean;
  envGateChecklistReviewed: boolean;
  rollbackDryRunChecklistReviewed: boolean;
  sanitizedReportSchemaReviewed: boolean;
  stopConditionChecklistReviewed: boolean;
  releaseGateChecklistReviewed: boolean;
  candidateTesterRosterPolicyReviewed: boolean;
  consentMessagePolicyReviewed: boolean;
  verificationClean: boolean;
  ciVerificationClean: boolean;
  testerExpansionNotExecuted: boolean;
  testerInvitationNotSent: boolean;
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

export interface MemoryProviderVectorTesterExpansionOperatorChecklist {
  mode: "bounded_tester_expansion_operator_checklist";
  scope: "dry_run_preflight_only";
  envKey: typeof MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV;
  maximumTesterLimit: 3;
  maximumMessagesPerTester: 5;
  maximumWindowHours: 2;
  checklistItems: readonly string[];
  envGateChecklistItems: readonly string[];
  rollbackDryRunSteps: readonly string[];
  sanitizedReportFields: readonly string[];
  stopConditions: readonly string[];
  defaultEnabled: false;
  testerInvitationsAllowed: false;
  realUsageSessionAllowed: false;
  envReadsAllowed: false;
  artifactAccessAllowed: false;
  helperExecutionAllowed: false;
  providerVectorExecutionAllowed: false;
  uiControlsAllowed: false;
  sqliteMigrationAllowed: false;
  rawOutputAllowed: false;
  shellExecutionAllowed: false;
}

export interface MemoryProviderVectorTesterExpansionDryRunPreflightResult {
  phase: "8.35";
  capability: "memory_provider_vector_retrieval_tester_expansion_dry_run_preflight";
  status: MemoryProviderVectorTesterExpansionDryRunPreflightStatus;
  accepted: boolean;
  readyForBoundedTesterExpansionDryRunReview: boolean;
  dryRunOnly: true;
  operatorChecklist: MemoryProviderVectorTesterExpansionOperatorChecklist;
  prerequisiteEnvKeys: readonly string[];
  releaseReadinessChecklist: ReturnType<
    typeof createMemoryProviderVectorReleaseReadinessChecklist
  >;
  testerExpansionExecuted: false;
  testerInvitationSent: false;
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
  checks: MemoryProviderVectorTesterExpansionDryRunPreflightChecks;
  reasonCodes: MemoryProviderVectorTesterExpansionDryRunPreflightReasonCode[];
}

export function createMemoryProviderVectorTesterExpansionOperatorChecklist(): MemoryProviderVectorTesterExpansionOperatorChecklist {
  return {
    mode: "bounded_tester_expansion_operator_checklist",
    scope: "dry_run_preflight_only",
    envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
    maximumTesterLimit: 3,
    maximumMessagesPerTester: 5,
    maximumWindowHours: 2,
    checklistItems: [
      "confirm_phase_832_acceptance_and_phase_833_834_gates",
      "confirm_candidate_roster_policy_without_sending_invitations",
      "confirm_synthetic_or_explicit_consent_message_policy",
      "confirm_temporary_or_reviewed_alpha_memory_database_policy",
      "confirm_operator_stop_and_exact_source_rollback_ownership",
      "confirm_no_default_ui_provider_or_release_behavior_change"
    ],
    envGateChecklistItems: [
      "developer_alpha_gate_name_present_but_not_read",
      "memory_retrieval_gate_names_present_but_not_read",
      "local_embedding_provider_gate_names_present_but_not_read",
      "runtime_python_and_model_dir_names_present_but_not_read",
      "all_gate_values_must_be_configured_only_during_later_approved_session"
    ],
    rollbackDryRunSteps: [
      "record_test_window_source_ids_without_raw_text",
      "close_supervised_child_before_delete_in_later_session",
      "delete_only_exact_model_source_type_source_id_rows",
      "report_only_deleted_count_and_fixed_reason_codes",
      "verify_no_follow_up_launch_has_developer_alpha_env_chain"
    ],
    sanitizedReportFields: [
      "status",
      "reasonCodes",
      "testerLimit",
      "messageLimitPerTester",
      "windowHours",
      "observationCount",
      "recallStatus",
      "rollbackDeletedCount",
      "cleanupStatus",
      "unsafeFlags"
    ],
    stopConditions: [
      "raw_vectors_or_raw_text_exposed",
      "private_paths_credentials_or_signed_urls_exposed",
      "artifact_digest_verification_failed",
      "helper_or_retrieval_degraded_without_no_recall_fallback",
      "rollback_cleanup_failed",
      "desktop_ui_provider_visibility_or_default_behavior_changed",
      "sqlite_migration_or_historical_batch_indexing_requested",
      "retrieval_output_connected_to_shell_or_windows_execution"
    ],
    defaultEnabled: false,
    testerInvitationsAllowed: false,
    realUsageSessionAllowed: false,
    envReadsAllowed: false,
    artifactAccessAllowed: false,
    helperExecutionAllowed: false,
    providerVectorExecutionAllowed: false,
    uiControlsAllowed: false,
    sqliteMigrationAllowed: false,
    rawOutputAllowed: false,
    shellExecutionAllowed: false
  };
}

export function evaluateMemoryProviderVectorTesterExpansionDryRunPreflight(
  input: MemoryProviderVectorTesterExpansionDryRunPreflightInput = {}
): MemoryProviderVectorTesterExpansionDryRunPreflightResult {
  const checks = createChecks(input);
  const evidenceReasonCodes = createEvidenceReasonCodes(checks);
  const blockingReasonCodes = createBlockingReasonCodes(checks);
  const accepted =
    evidenceReasonCodes.length === 0 && blockingReasonCodes.length === 0;
  const approvalPacket = createMemoryProviderVectorTesterExpansionApprovalPacket();

  return {
    phase: "8.35",
    capability:
      "memory_provider_vector_retrieval_tester_expansion_dry_run_preflight",
    status: accepted
      ? "ready_for_bounded_tester_expansion_dry_run_review"
      : blockingReasonCodes.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForBoundedTesterExpansionDryRunReview: accepted,
    dryRunOnly: true,
    operatorChecklist:
      createMemoryProviderVectorTesterExpansionOperatorChecklist(),
    prerequisiteEnvKeys: approvalPacket.prerequisiteEnvKeys,
    releaseReadinessChecklist:
      createMemoryProviderVectorReleaseReadinessChecklist(),
    testerExpansionExecuted: false,
    testerInvitationSent: false,
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
          "phase_834_approval_packet",
          "operator_checklist",
          "env_gate_checklist",
          "rollback_dry_run_checklist",
          "sanitized_report_schema",
          "stop_condition_checklist",
          "release_gate_checklist",
          "candidate_tester_roster_policy",
          "consent_message_policy"
        ]
      : [],
    checks,
    reasonCodes: [...evidenceReasonCodes, ...blockingReasonCodes]
  };
}

function createChecks(
  input: MemoryProviderVectorTesterExpansionDryRunPreflightInput
): MemoryProviderVectorTesterExpansionDryRunPreflightChecks {
  return {
    phase834ApprovalPacketComplete:
      input.phase834ApprovalPacketComplete === true,
    operatorChecklistReviewed: input.operatorChecklistReviewed === true,
    envGateChecklistReviewed: input.envGateChecklistReviewed === true,
    rollbackDryRunChecklistReviewed:
      input.rollbackDryRunChecklistReviewed === true,
    sanitizedReportSchemaReviewed:
      input.sanitizedReportSchemaReviewed === true,
    stopConditionChecklistReviewed:
      input.stopConditionChecklistReviewed === true,
    releaseGateChecklistReviewed:
      input.releaseGateChecklistReviewed === true,
    candidateTesterRosterPolicyReviewed:
      input.candidateTesterRosterPolicyReviewed === true,
    consentMessagePolicyReviewed:
      input.consentMessagePolicyReviewed === true,
    verificationClean: input.verificationClean === true,
    ciVerificationClean: input.ciVerificationClean === true,
    testerExpansionNotExecuted: input.testerExpansionExecuted === false,
    testerInvitationNotSent: input.testerInvitationSent === false,
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
  checks: MemoryProviderVectorTesterExpansionDryRunPreflightChecks
): MemoryProviderVectorTesterExpansionDryRunPreflightReasonCode[] {
  const reasonCodes: MemoryProviderVectorTesterExpansionDryRunPreflightReasonCode[] = [];
  if (!checks.phase834ApprovalPacketComplete) {
    reasonCodes.push("phase834_approval_packet_missing");
  }
  if (!checks.operatorChecklistReviewed) {
    reasonCodes.push("operator_checklist_missing");
  }
  if (!checks.envGateChecklistReviewed) {
    reasonCodes.push("env_gate_checklist_missing");
  }
  if (!checks.rollbackDryRunChecklistReviewed) {
    reasonCodes.push("rollback_dry_run_checklist_missing");
  }
  if (!checks.sanitizedReportSchemaReviewed) {
    reasonCodes.push("sanitized_report_schema_missing");
  }
  if (!checks.stopConditionChecklistReviewed) {
    reasonCodes.push("stop_condition_checklist_missing");
  }
  if (!checks.releaseGateChecklistReviewed) {
    reasonCodes.push("release_gate_checklist_missing");
  }
  if (!checks.candidateTesterRosterPolicyReviewed) {
    reasonCodes.push("candidate_tester_roster_policy_missing");
  }
  if (!checks.consentMessagePolicyReviewed) {
    reasonCodes.push("consent_message_policy_missing");
  }
  if (!checks.verificationClean) {
    reasonCodes.push("verification_clean_missing");
  }
  if (!checks.ciVerificationClean) {
    reasonCodes.push("ci_verification_missing");
  }
  return reasonCodes;
}

function createBlockingReasonCodes(
  checks: MemoryProviderVectorTesterExpansionDryRunPreflightChecks
): MemoryProviderVectorTesterExpansionDryRunPreflightReasonCode[] {
  const reasonCodes: MemoryProviderVectorTesterExpansionDryRunPreflightReasonCode[] = [];
  if (!checks.testerExpansionNotExecuted) {
    reasonCodes.push("tester_expansion_executed");
  }
  if (!checks.testerInvitationNotSent) {
    reasonCodes.push("tester_invitation_sent");
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
