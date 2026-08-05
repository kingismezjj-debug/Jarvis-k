import {
  createMemoryProviderVectorTesterExpansionOperatorChecklist,
  evaluateMemoryProviderVectorTesterExpansionDryRunPreflight
} from "./memory-provider-vector-retrieval-tester-expansion-dry-run-preflight";
import {
  createMemoryProviderVectorReleaseReadinessChecklist
} from "./memory-provider-vector-retrieval-tester-expansion-approval-packet";

export type MemoryProviderVectorBoundedTesterExpansionApprovalRequestStatus =
  | "blocked"
  | "degraded"
  | "ready_for_bounded_tester_expansion_approval_request";

export type MemoryProviderVectorBoundedTesterExpansionApprovalRequestReasonCode =
  | "phase835_dry_run_preflight_missing"
  | "approval_request_packet_missing"
  | "product_approval_request_missing"
  | "security_approval_request_missing"
  | "release_approval_request_missing"
  | "execution_bounds_missing"
  | "tester_consent_template_missing"
  | "sanitized_telemetry_review_missing"
  | "rollback_verification_review_missing"
  | "stop_condition_review_missing"
  | "operator_owner_missing"
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

export interface MemoryProviderVectorBoundedTesterExpansionApprovalRequestInput {
  phase835DryRunPreflightComplete?: boolean;
  approvalRequestPacketDrafted?: boolean;
  productApprovalRequestReviewed?: boolean;
  securityApprovalRequestReviewed?: boolean;
  releaseApprovalRequestReviewed?: boolean;
  executionBoundsReviewed?: boolean;
  testerConsentTemplateReviewed?: boolean;
  sanitizedTelemetryReviewed?: boolean;
  rollbackVerificationReviewed?: boolean;
  stopConditionReviewed?: boolean;
  operatorOwnerReviewed?: boolean;
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

export interface MemoryProviderVectorBoundedTesterExpansionApprovalRequestChecks {
  phase835DryRunPreflightComplete: boolean;
  approvalRequestPacketDrafted: boolean;
  productApprovalRequestReviewed: boolean;
  securityApprovalRequestReviewed: boolean;
  releaseApprovalRequestReviewed: boolean;
  executionBoundsReviewed: boolean;
  testerConsentTemplateReviewed: boolean;
  sanitizedTelemetryReviewed: boolean;
  rollbackVerificationReviewed: boolean;
  stopConditionReviewed: boolean;
  operatorOwnerReviewed: boolean;
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

export interface MemoryProviderVectorBoundedTesterExpansionApprovalRequestPacket {
  mode: "bounded_tester_expansion_approval_request";
  scope: "approval_request_only_no_execution";
  requestedNextPhase: "bounded_tester_expansion_execution_run";
  separateProductApprovalRequired: true;
  separateSecurityApprovalRequired: true;
  separateReleaseApprovalRequired: true;
  testerLimit: 3;
  messageLimitPerTester: 5;
  windowHours: 2;
  allowedMessages: "synthetic_or_explicitly_consented_minimized_messages_only";
  allowedDatabaseScope: "temporary_or_separately_reviewed_alpha_database_only";
  requiredRollback: "exact_source_provider_vector_delete_after_session";
  requiredTelemetry: "sanitized_counts_statuses_dimensions_reason_codes_only";
  productApprovalText: string;
  securityApprovalText: string;
  releaseApprovalText: string;
  defaultEnabled: false;
  testerInvitationsAllowedInThisPhase: false;
  realUsageSessionAllowedInThisPhase: false;
  envReadsAllowedInThisPhase: false;
  artifactAccessAllowedInThisPhase: false;
  helperExecutionAllowedInThisPhase: false;
  providerVectorExecutionAllowedInThisPhase: false;
  uiControlsAllowed: false;
  providerVisibilityChangeAllowed: false;
  sqliteMigrationAllowed: false;
  historicalBatchIndexingAllowed: false;
  persistentModelCacheAllowed: false;
  rawOutputAllowed: false;
  shellExecutionAllowed: false;
  productSloAllowed: false;
}

export interface MemoryProviderVectorBoundedTesterExpansionApprovalRequestResult {
  phase: "8.36";
  capability: "memory_provider_vector_retrieval_bounded_tester_expansion_approval_request_preflight";
  status: MemoryProviderVectorBoundedTesterExpansionApprovalRequestStatus;
  accepted: boolean;
  readyForBoundedTesterExpansionApprovalRequest: boolean;
  approvalRequestOnly: true;
  approvalRequestPacket: MemoryProviderVectorBoundedTesterExpansionApprovalRequestPacket;
  prerequisiteEnvKeys: readonly string[];
  operatorChecklist: ReturnType<
    typeof createMemoryProviderVectorTesterExpansionOperatorChecklist
  >;
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
  checks: MemoryProviderVectorBoundedTesterExpansionApprovalRequestChecks;
  reasonCodes: MemoryProviderVectorBoundedTesterExpansionApprovalRequestReasonCode[];
}

export function createMemoryProviderVectorBoundedTesterExpansionApprovalRequestPacket(): MemoryProviderVectorBoundedTesterExpansionApprovalRequestPacket {
  return {
    mode: "bounded_tester_expansion_approval_request",
    scope: "approval_request_only_no_execution",
    requestedNextPhase: "bounded_tester_expansion_execution_run",
    separateProductApprovalRequired: true,
    separateSecurityApprovalRequired: true,
    separateReleaseApprovalRequired: true,
    testerLimit: 3,
    messageLimitPerTester: 5,
    windowHours: 2,
    allowedMessages: "synthetic_or_explicitly_consented_minimized_messages_only",
    allowedDatabaseScope: "temporary_or_separately_reviewed_alpha_database_only",
    requiredRollback: "exact_source_provider_vector_delete_after_session",
    requiredTelemetry:
      "sanitized_counts_statuses_dimensions_reason_codes_only",
    productApprovalText:
      "Approve one bounded developer-alpha tester expansion execution run for at most 3 testers, 5 minimized synthetic or explicitly consented messages per tester, and a 2 hour window. Default behavior, UI, Desktop, provider visibility, fixture fallback, historical Memory indexing, and product SLOs remain unchanged.",
    securityApprovalText:
      "Approve only the later bounded execution run when all existing explicit gates and approved runtime/model prerequisites are configured during the approved window. Require SHA-256 verification, source minimization, sanitized telemetry, timeout/cancellation/release, exact-source rollback, and fail-closed no-recall degradation. Prohibit unapproved downloads, persistent model caches, secrets or private paths, raw vectors, raw text, raw diagnostics, SQLite migrations, historical indexing, and shell or Windows operations.",
    releaseApprovalText:
      "Approve the later bounded run only as developer-alpha evidence. It must not enter installer, automatic update, default configuration, public user documentation, release channel, model lifecycle policy, cache policy, upgrade or rollback policy, or product SLO.",
    defaultEnabled: false,
    testerInvitationsAllowedInThisPhase: false,
    realUsageSessionAllowedInThisPhase: false,
    envReadsAllowedInThisPhase: false,
    artifactAccessAllowedInThisPhase: false,
    helperExecutionAllowedInThisPhase: false,
    providerVectorExecutionAllowedInThisPhase: false,
    uiControlsAllowed: false,
    providerVisibilityChangeAllowed: false,
    sqliteMigrationAllowed: false,
    historicalBatchIndexingAllowed: false,
    persistentModelCacheAllowed: false,
    rawOutputAllowed: false,
    shellExecutionAllowed: false,
    productSloAllowed: false
  };
}

export function evaluateMemoryProviderVectorBoundedTesterExpansionApprovalRequestPreflight(
  input: MemoryProviderVectorBoundedTesterExpansionApprovalRequestInput = {}
): MemoryProviderVectorBoundedTesterExpansionApprovalRequestResult {
  const checks = createChecks(input);
  const evidenceReasonCodes = createEvidenceReasonCodes(checks);
  const blockingReasonCodes = createBlockingReasonCodes(checks);
  const accepted =
    evidenceReasonCodes.length === 0 && blockingReasonCodes.length === 0;
  const phase835 = evaluateMemoryProviderVectorTesterExpansionDryRunPreflight(
    phase835AcceptedInput
  );

  return {
    phase: "8.36",
    capability:
      "memory_provider_vector_retrieval_bounded_tester_expansion_approval_request_preflight",
    status: accepted
      ? "ready_for_bounded_tester_expansion_approval_request"
      : blockingReasonCodes.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForBoundedTesterExpansionApprovalRequest: accepted,
    approvalRequestOnly: true,
    approvalRequestPacket:
      createMemoryProviderVectorBoundedTesterExpansionApprovalRequestPacket(),
    prerequisiteEnvKeys: phase835.prerequisiteEnvKeys,
    operatorChecklist: createMemoryProviderVectorTesterExpansionOperatorChecklist(),
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
          "phase_835_dry_run_preflight",
          "approval_request_packet",
          "product_approval_request",
          "security_approval_request",
          "release_approval_request",
          "execution_bounds",
          "tester_consent_template",
          "sanitized_telemetry",
          "rollback_verification",
          "stop_conditions",
          "operator_owner"
        ]
      : [],
    checks,
    reasonCodes: [...evidenceReasonCodes, ...blockingReasonCodes]
  };
}

function createChecks(
  input: MemoryProviderVectorBoundedTesterExpansionApprovalRequestInput
): MemoryProviderVectorBoundedTesterExpansionApprovalRequestChecks {
  return {
    phase835DryRunPreflightComplete:
      input.phase835DryRunPreflightComplete === true,
    approvalRequestPacketDrafted:
      input.approvalRequestPacketDrafted === true,
    productApprovalRequestReviewed:
      input.productApprovalRequestReviewed === true,
    securityApprovalRequestReviewed:
      input.securityApprovalRequestReviewed === true,
    releaseApprovalRequestReviewed:
      input.releaseApprovalRequestReviewed === true,
    executionBoundsReviewed: input.executionBoundsReviewed === true,
    testerConsentTemplateReviewed:
      input.testerConsentTemplateReviewed === true,
    sanitizedTelemetryReviewed:
      input.sanitizedTelemetryReviewed === true,
    rollbackVerificationReviewed:
      input.rollbackVerificationReviewed === true,
    stopConditionReviewed: input.stopConditionReviewed === true,
    operatorOwnerReviewed: input.operatorOwnerReviewed === true,
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
  checks: MemoryProviderVectorBoundedTesterExpansionApprovalRequestChecks
): MemoryProviderVectorBoundedTesterExpansionApprovalRequestReasonCode[] {
  const reasonCodes: MemoryProviderVectorBoundedTesterExpansionApprovalRequestReasonCode[] = [];
  if (!checks.phase835DryRunPreflightComplete) {
    reasonCodes.push("phase835_dry_run_preflight_missing");
  }
  if (!checks.approvalRequestPacketDrafted) {
    reasonCodes.push("approval_request_packet_missing");
  }
  if (!checks.productApprovalRequestReviewed) {
    reasonCodes.push("product_approval_request_missing");
  }
  if (!checks.securityApprovalRequestReviewed) {
    reasonCodes.push("security_approval_request_missing");
  }
  if (!checks.releaseApprovalRequestReviewed) {
    reasonCodes.push("release_approval_request_missing");
  }
  if (!checks.executionBoundsReviewed) {
    reasonCodes.push("execution_bounds_missing");
  }
  if (!checks.testerConsentTemplateReviewed) {
    reasonCodes.push("tester_consent_template_missing");
  }
  if (!checks.sanitizedTelemetryReviewed) {
    reasonCodes.push("sanitized_telemetry_review_missing");
  }
  if (!checks.rollbackVerificationReviewed) {
    reasonCodes.push("rollback_verification_review_missing");
  }
  if (!checks.stopConditionReviewed) {
    reasonCodes.push("stop_condition_review_missing");
  }
  if (!checks.operatorOwnerReviewed) {
    reasonCodes.push("operator_owner_missing");
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
  checks: MemoryProviderVectorBoundedTesterExpansionApprovalRequestChecks
): MemoryProviderVectorBoundedTesterExpansionApprovalRequestReasonCode[] {
  const reasonCodes: MemoryProviderVectorBoundedTesterExpansionApprovalRequestReasonCode[] = [];
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

const phase835AcceptedInput = {
  phase834ApprovalPacketComplete: true,
  operatorChecklistReviewed: true,
  envGateChecklistReviewed: true,
  rollbackDryRunChecklistReviewed: true,
  sanitizedReportSchemaReviewed: true,
  stopConditionChecklistReviewed: true,
  releaseGateChecklistReviewed: true,
  candidateTesterRosterPolicyReviewed: true,
  consentMessagePolicyReviewed: true,
  verificationClean: true,
  ciVerificationClean: true,
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
  productSloDeclared: false
} as const;
