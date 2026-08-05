import { describe, expect, it } from "vitest";
import {
  createMemoryProviderVectorBoundedTesterExpansionApprovalRequestPacket,
  evaluateMemoryProviderVectorBoundedTesterExpansionApprovalRequestPreflight,
  type MemoryProviderVectorBoundedTesterExpansionApprovalRequestInput
} from "../src/memory-provider-vector-retrieval-bounded-tester-expansion-approval-request-preflight";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV } from "../src/memory-provider-vector-retrieval-developer-alpha-plan";

describe("Memory provider-vector retrieval bounded tester expansion approval request preflight", () => {
  it("accepts complete approval request evidence without executing expansion", () => {
    const result =
      evaluateMemoryProviderVectorBoundedTesterExpansionApprovalRequestPreflight(
        approvedInput()
      );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.36",
      capability:
        "memory_provider_vector_retrieval_bounded_tester_expansion_approval_request_preflight",
      status: "ready_for_bounded_tester_expansion_approval_request",
      accepted: true,
      readyForBoundedTesterExpansionApprovalRequest: true,
      approvalRequestOnly: true,
      approvalRequestPacket: {
        mode: "bounded_tester_expansion_approval_request",
        scope: "approval_request_only_no_execution",
        requestedNextPhase: "bounded_tester_expansion_execution_run",
        separateProductApprovalRequired: true,
        separateSecurityApprovalRequired: true,
        separateReleaseApprovalRequired: true,
        testerLimit: 3,
        messageLimitPerTester: 5,
        windowHours: 2,
        allowedMessages:
          "synthetic_or_explicitly_consented_minimized_messages_only",
        allowedDatabaseScope:
          "temporary_or_separately_reviewed_alpha_database_only",
        requiredRollback:
          "exact_source_provider_vector_delete_after_session",
        requiredTelemetry:
          "sanitized_counts_statuses_dimensions_reason_codes_only",
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
      },
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
      checkedAreas: [
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
      ],
      reasonCodes: []
    });
    expect(result.prerequisiteEnvKeys).toEqual([
      MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
      "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING",
      "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR",
      "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES",
      "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS",
      "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER",
      "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION",
      "JARVIS_K_RUNTIME_PYTHON",
      "JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR"
    ]);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when approval request or verification evidence is missing", () => {
    const result =
      evaluateMemoryProviderVectorBoundedTesterExpansionApprovalRequestPreflight(
        {
          ...approvedInput(),
          phase835DryRunPreflightComplete: false,
          approvalRequestPacketDrafted: false,
          productApprovalRequestReviewed: false,
          securityApprovalRequestReviewed: false,
          releaseApprovalRequestReviewed: false,
          executionBoundsReviewed: false,
          testerConsentTemplateReviewed: false,
          sanitizedTelemetryReviewed: false,
          rollbackVerificationReviewed: false,
          stopConditionReviewed: false,
          operatorOwnerReviewed: false,
          verificationClean: false,
          ciVerificationClean: false
        }
      );

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      approvalRequestOnly: true,
      checkedAreas: [],
      checks: {
        phase835DryRunPreflightComplete: false,
        approvalRequestPacketDrafted: false,
        productApprovalRequestReviewed: false,
        securityApprovalRequestReviewed: false,
        releaseApprovalRequestReviewed: false,
        executionBoundsReviewed: false,
        testerConsentTemplateReviewed: false,
        sanitizedTelemetryReviewed: false,
        rollbackVerificationReviewed: false,
        stopConditionReviewed: false,
        operatorOwnerReviewed: false,
        verificationClean: false,
        ciVerificationClean: false,
        testerExpansionNotExecuted: true,
        providerVectorReadNotExecuted: true
      }
    });
    expect(result.reasonCodes).toEqual([
      "phase835_dry_run_preflight_missing",
      "approval_request_packet_missing",
      "product_approval_request_missing",
      "security_approval_request_missing",
      "release_approval_request_missing",
      "execution_bounds_missing",
      "tester_consent_template_missing",
      "sanitized_telemetry_review_missing",
      "rollback_verification_review_missing",
      "stop_condition_review_missing",
      "operator_owner_missing",
      "verification_clean_missing",
      "ci_verification_missing"
    ]);
  });

  it("blocks tester expansion, invitations, real usage, env reads, artifact access, helper execution, vector operations, and migrations", () => {
    const result =
      evaluateMemoryProviderVectorBoundedTesterExpansionApprovalRequestPreflight(
        {
          ...approvedInput(),
          testerExpansionExecuted: true,
          testerInvitationSent: true,
          realUsageSessionStarted: true,
          envRead: true,
          runtimePythonRead: true,
          modelArtifactPathRead: true,
          artifactAccessed: true,
          helperStarted: true,
          helperLoadCalled: true,
          helperEmbedCalled: true,
          providerExecutionCalled: true,
          providerVectorWriteExecuted: true,
          providerVectorReadExecuted: true,
          realMemoryVectorDataWritten: true,
          persistentModelCacheEnabled: true,
          sqliteSchemaMigrationEnabled: true,
          historicalBatchIndexingEnabled: true
        }
      );

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
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
      historicalBatchIndexingEnabled: false
    });
    expect(result.reasonCodes).toEqual([
      "tester_expansion_executed",
      "tester_invitation_sent",
      "real_usage_session_started",
      "environment_read_requested",
      "runtime_or_artifact_access_requested",
      "helper_or_provider_execution_requested",
      "provider_vector_operation_requested",
      "persistent_or_migration_side_effect_requested"
    ]);
  });

  it("blocks unsafe output, UI/default changes, shell execution, release changes, and product SLO declarations", () => {
    const result =
      evaluateMemoryProviderVectorBoundedTesterExpansionApprovalRequestPreflight(
        {
          ...approvedInput(),
          desktopIpcChanged: true,
          uiBehaviorChanged: true,
          providerVisibilityChanged: true,
          defaultOptInChanged: true,
          rawVectorsExposed: true,
          rawTextExposed: true,
          rawDiagnosticsExposed: true,
          privatePathExposed: true,
          signedUrlOrCredentialPersisted: true,
          modelOutputShellExecutionEnabled: true,
          releaseChannelChanged: true,
          installerPolicyChanged: true,
          updateRollbackPolicyChanged: true,
          modelLifecyclePolicyChanged: true,
          cachePolicyChanged: true,
          productSloDeclared: true
        }
      );

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
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
    });
    expect(result.reasonCodes).toEqual([
      "desktop_ui_or_visibility_change_requested",
      "unsafe_output_or_secret_exposure_requested",
      "shell_execution_requested",
      "release_policy_change_requested",
      "product_slo_declared"
    ]);
  });

  it("returns deterministic sanitized product, security, and release approval request text", () => {
    const packet =
      createMemoryProviderVectorBoundedTesterExpansionApprovalRequestPacket();
    const serialized = JSON.stringify(packet);

    expect(packet).toMatchObject({
      mode: "bounded_tester_expansion_approval_request",
      scope: "approval_request_only_no_execution",
      separateProductApprovalRequired: true,
      separateSecurityApprovalRequired: true,
      separateReleaseApprovalRequired: true,
      testerLimit: 3,
      messageLimitPerTester: 5,
      windowHours: 2,
      defaultEnabled: false,
      testerInvitationsAllowedInThisPhase: false,
      realUsageSessionAllowedInThisPhase: false,
      envReadsAllowedInThisPhase: false,
      artifactAccessAllowedInThisPhase: false,
      helperExecutionAllowedInThisPhase: false,
      providerVectorExecutionAllowedInThisPhase: false,
      productSloAllowed: false
    });
    expect(packet.productApprovalText).toContain(
      "at most 3 testers, 5 minimized synthetic or explicitly consented messages per tester"
    );
    expect(packet.securityApprovalText).toContain(
      "Prohibit unapproved downloads"
    );
    expect(packet.releaseApprovalText).toContain(
      "must not enter installer"
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});

function approvedInput(): MemoryProviderVectorBoundedTesterExpansionApprovalRequestInput {
  return {
    phase835DryRunPreflightComplete: true,
    approvalRequestPacketDrafted: true,
    productApprovalRequestReviewed: true,
    securityApprovalRequestReviewed: true,
    releaseApprovalRequestReviewed: true,
    executionBoundsReviewed: true,
    testerConsentTemplateReviewed: true,
    sanitizedTelemetryReviewed: true,
    rollbackVerificationReviewed: true,
    stopConditionReviewed: true,
    operatorOwnerReviewed: true,
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
  };
}
