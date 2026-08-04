import { describe, expect, it } from "vitest";
import {
  createMemoryProviderVectorReleaseReadinessChecklist,
  createMemoryProviderVectorTesterExpansionApprovalPacket,
  evaluateMemoryProviderVectorTesterExpansionApprovalPacket,
  type MemoryProviderVectorTesterExpansionApprovalPacketInput
} from "../src/memory-provider-vector-retrieval-tester-expansion-approval-packet";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV } from "../src/memory-provider-vector-retrieval-developer-alpha-plan";

describe("Memory provider-vector retrieval tester expansion approval packet", () => {
  it("accepts complete approval packet evidence without expanding testers", () => {
    const result = evaluateMemoryProviderVectorTesterExpansionApprovalPacket(
      approvedInput()
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.34",
      capability:
        "memory_provider_vector_retrieval_tester_expansion_approval_packet",
      status: "ready_for_tester_expansion_approval_review",
      accepted: true,
      readyForTesterExpansionApprovalReview: true,
      packetOnly: true,
      approvalPacket: {
        mode: "tester_expansion_approval_packet",
        scope: "proposal_only_no_expansion",
        currentScope: "single_local_developer_alpha",
        requestedNextScope: "bounded_small_cohort_developer_alpha",
        separateProductSecurityReleaseApprovalRequired: true,
        envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
        proposedTesterLimit: 3,
        proposedMessageLimitPerTester: 5,
        proposedWindowHours: 2,
        allowedMessagePolicy:
          "synthetic_or_explicitly_consented_minimized_messages",
        memoryDatabasePolicy: "temporary_or_reviewed_alpha_database_only",
        rollbackPolicy: "exact_source_provider_vectors_for_test_window_only",
        observationPolicy:
          "sanitized_counts_statuses_dimensions_reason_codes_only",
        stopPolicy:
          "stop_on_any_safety_runtime_retrieval_or_rollback_regression",
        defaultEnabled: false,
        uiControlsAllowed: false,
        providerVisibilityChangeAllowed: false,
        historicalBatchIndexingAllowed: false,
        persistentModelCacheAllowed: false,
        sqliteMigrationAllowed: false,
        rawOutputAllowed: false,
        shellExecutionAllowed: false
      },
      releaseReadinessChecklist: {
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
        upgradeRollbackPolicyChanged: false
      },
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
      checkedAreas: [
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
      ],
      reasonCodes: []
    });
    expect(result.approvalPacket.prerequisiteEnvKeys).toEqual([
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

  it("degrades when approval packet or release readiness evidence is incomplete", () => {
    const result = evaluateMemoryProviderVectorTesterExpansionApprovalPacket({
      ...approvedInput(),
      approvalPacketDrafted: false,
      boundedTesterCohortReviewed: false,
      boundedTestWindowReviewed: false,
      memoryDatabasePolicyReviewed: false,
      sanitizedObservationChecklistReviewed: false,
      rollbackChecklistReviewed: false,
      operatorOwnershipReviewed: false,
      releaseReadinessChecklistReviewed: false,
      localVerificationClean: false,
      ciVerificationClean: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForTesterExpansionApprovalReview: false,
      packetOnly: true,
      testerExpansionExecuted: false,
      realUsageSessionStarted: false,
      checkedAreas: [],
      checks: {
        approvalPacketDrafted: false,
        boundedTesterCohortReviewed: false,
        boundedTestWindowReviewed: false,
        memoryDatabasePolicyReviewed: false,
        sanitizedObservationChecklistReviewed: false,
        rollbackChecklistReviewed: false,
        operatorOwnershipReviewed: false,
        releaseReadinessChecklistReviewed: false,
        localVerificationClean: false,
        ciVerificationClean: false,
        providerExecutionNotCalled: true,
        providerVectorWriteNotExecuted: true
      }
    });
    expect(result.reasonCodes).toEqual([
      "local_verification_missing",
      "ci_verification_missing",
      "approval_packet_missing",
      "bounded_tester_cohort_missing",
      "bounded_test_window_missing",
      "memory_database_policy_missing",
      "sanitized_observation_checklist_missing",
      "rollback_checklist_missing",
      "operator_ownership_missing",
      "release_readiness_checklist_missing"
    ]);
  });

  it("blocks tester expansion, real usage, env reads, artifact access, helper execution, vector operations, and migrations", () => {
    const result = evaluateMemoryProviderVectorTesterExpansionApprovalPacket({
      ...approvedInput(),
      testerExpansionExecuted: true,
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
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
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
      historicalBatchIndexingEnabled: false
    });
    expect(result.reasonCodes).toEqual([
      "tester_expansion_executed",
      "real_usage_session_started",
      "environment_read_requested",
      "runtime_or_artifact_access_requested",
      "helper_or_provider_execution_requested",
      "provider_vector_operation_requested",
      "persistent_or_migration_side_effect_requested"
    ]);
  });

  it("blocks unsafe output, shell execution, UI/default changes, release changes, and product SLO declarations", () => {
    const result = evaluateMemoryProviderVectorTesterExpansionApprovalPacket({
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
    });

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

  it("returns deterministic sanitized approval packet and release checklist schemas", () => {
    const packet = createMemoryProviderVectorTesterExpansionApprovalPacket();
    const checklist = createMemoryProviderVectorReleaseReadinessChecklist();
    const serialized = JSON.stringify({ packet, checklist });

    expect(packet).toMatchObject({
      scope: "proposal_only_no_expansion",
      proposedTesterLimit: 3,
      proposedMessageLimitPerTester: 5,
      proposedWindowHours: 2,
      defaultEnabled: false,
      uiControlsAllowed: false,
      providerVisibilityChangeAllowed: false,
      sqliteMigrationAllowed: false,
      rawOutputAllowed: false,
      shellExecutionAllowed: false
    });
    expect(checklist).toMatchObject({
      releaseScope: "developer_alpha_evidence_only",
      requiresSeparateReleaseGateForBroaderUse: true,
      installerIncluded: false,
      automaticUpdatesIncluded: false,
      defaultConfigIncluded: false,
      publicUserDocsIncluded: false,
      productSloIncluded: false,
      modelLifecyclePolicyChanged: false,
      cachePolicyChanged: false,
      upgradeRollbackPolicyChanged: false
    });
    expect(checklist.requiredEvidence).toEqual([
      "phase_832_acceptance_passed",
      "phase_833_promotion_gate_passed",
      "local_verify_boundaries_sensitive_checks_passed",
      "github_actions_ci_passed",
      "bounded_tester_cohort_and_time_window_reviewed",
      "memory_database_and_source_minimization_policy_reviewed",
      "sanitized_observation_stop_and_rollback_plan_reviewed"
    ]);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});

function approvedInput(): MemoryProviderVectorTesterExpansionApprovalPacketInput {
  return {
    phase832AcceptanceComplete: true,
    phase833PromotionGateComplete: true,
    localVerificationClean: true,
    ciVerificationClean: true,
    approvalPacketDrafted: true,
    boundedTesterCohortReviewed: true,
    boundedTestWindowReviewed: true,
    consentOrSyntheticMessagePolicyReviewed: true,
    runtimeModelHandlingPolicyReviewed: true,
    memoryDatabasePolicyReviewed: true,
    sourceMinimizationPolicyReviewed: true,
    sanitizedObservationChecklistReviewed: true,
    stopConditionsReviewed: true,
    rollbackChecklistReviewed: true,
    operatorOwnershipReviewed: true,
    releaseReadinessChecklistReviewed: true,
    nonReleaseScopeReviewed: true,
    installerUpdateExclusionReviewed: true,
    modelLifecycleCachePolicyReviewed: true,
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
    productSloDeclared: false
  };
}
