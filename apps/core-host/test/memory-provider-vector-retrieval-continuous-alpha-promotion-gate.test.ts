import { describe, expect, it } from "vitest";
import {
  createMemoryProviderVectorContinuousAlphaPromotionPolicy,
  evaluateMemoryProviderVectorContinuousAlphaPromotionGate,
  type MemoryProviderVectorContinuousAlphaPromotionGateInput
} from "../src/memory-provider-vector-retrieval-continuous-alpha-promotion-gate";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV } from "../src/memory-provider-vector-retrieval-developer-alpha-plan";

describe("Memory provider-vector retrieval continuous alpha promotion gate", () => {
  it("accepts complete runbook and promotion evidence without expanding scope", () => {
    const result = evaluateMemoryProviderVectorContinuousAlphaPromotionGate(
      approvedInput()
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.33",
      capability:
        "memory_provider_vector_retrieval_continuous_alpha_promotion_gate",
      status: "ready_for_tester_expansion_approval",
      accepted: true,
      readyForTesterExpansionApproval: true,
      preflightOnly: true,
      promotionPolicy: {
        mode: "continuous_alpha_operator_runbook_and_promotion_gate",
        currentTesterScope: "single_local_developer_alpha",
        nextTesterScopeRequiresSeparateApproval: true,
        observationScope: "sanitized_counts_statuses_reason_codes_only",
        rollbackScope: "exact_source_provider_vectors_for_test_window_only",
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
      },
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
      checkedAreas: [
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
      ],
      reasonCodes: []
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
    expect(serialized).not.toContain("Synthetic");
    expect(serialized).not.toContain("0.123");
  });

  it("degrades when runbook, rollback, stop, policy, or verification evidence is incomplete", () => {
    const result = evaluateMemoryProviderVectorContinuousAlphaPromotionGate({
      ...approvedInput(),
      operatorRunbookReviewed: false,
      testerExpansionCriteriaReviewed: false,
      rollbackChecklistReviewed: false,
      incidentStopPolicyReviewed: false,
      cleanupVerificationPolicyReviewed: false,
      releaseGateReviewed: false,
      cleanVerificationEvidence: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForTesterExpansionApproval: false,
      checkedAreas: [],
      checks: {
        operatorRunbookReviewed: false,
        testerExpansionCriteriaReviewed: false,
        rollbackChecklistReviewed: false,
        incidentStopPolicyReviewed: false,
        cleanupVerificationPolicyReviewed: false,
        releaseGateReviewed: false,
        cleanVerificationEvidence: false,
        providerExecutionNotCalled: true,
        providerVectorWriteNotExecuted: true
      }
    });
    expect(result.reasonCodes).toEqual([
      "operator_runbook_missing",
      "tester_expansion_criteria_missing",
      "rollback_checklist_missing",
      "incident_stop_policy_missing",
      "cleanup_verification_policy_missing",
      "release_gate_missing",
      "verification_clean_missing"
    ]);
  });

  it("blocks tester expansion, default/UI/provider changes, runtime access, execution, and migrations", () => {
    const result = evaluateMemoryProviderVectorContinuousAlphaPromotionGate({
      ...approvedInput(),
      testerScopeExpanded: true,
      defaultBehaviorChanged: true,
      uiBehaviorChanged: true,
      desktopIpcChanged: true,
      providerVisibilityChanged: true,
      fixtureFallbackChanged: true,
      runtimePythonRead: true,
      modelArtifactPathRead: true,
      artifactAccessed: true,
      helperStarted: true,
      helperLoadCalled: true,
      helperEmbedCalled: true,
      providerExecutionCalled: true,
      providerVectorWriteExecuted: true,
      providerVectorReadExecuted: true,
      persistentModelCacheEnabled: true,
      sqliteSchemaMigrationEnabled: true,
      historicalBatchIndexingEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
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
      historicalBatchIndexingEnabled: false
    });
    expect(result.reasonCodes).toEqual([
      "tester_scope_expansion_requested",
      "default_or_ui_behavior_change_requested",
      "runtime_or_artifact_access_requested",
      "helper_or_provider_execution_requested",
      "persistent_or_migration_side_effect_requested"
    ]);
  });

  it("blocks raw exposure, private paths, credentials, shell execution, and release policy changes", () => {
    const result = evaluateMemoryProviderVectorContinuousAlphaPromotionGate({
      ...approvedInput(),
      rawVectorsExposed: true,
      rawTextExposed: true,
      rawDiagnosticsExposed: true,
      privatePathExposed: true,
      signedUrlOrCredentialPersisted: true,
      modelOutputShellExecutionEnabled: true,
      releaseChannelChanged: true,
      installerPolicyChanged: true,
      modelLifecyclePolicyChanged: true,
      cachePolicyChanged: true,
      upgradeRollbackPolicyChanged: true
    });

    expect(result).toMatchObject({
      status: "blocked",
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
      upgradeRollbackPolicyChanged: false
    });
    expect(result.reasonCodes).toEqual([
      "unsafe_output_or_secret_exposure_requested",
      "shell_execution_requested",
      "release_policy_change_requested"
    ]);
  });

  it("returns a deterministic sanitized promotion policy", () => {
    const policy = createMemoryProviderVectorContinuousAlphaPromotionPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      mode: "continuous_alpha_operator_runbook_and_promotion_gate",
      currentTesterScope: "single_local_developer_alpha",
      nextTesterScopeRequiresSeparateApproval: true,
      observationScope: "sanitized_counts_statuses_reason_codes_only",
      memoryDatabasePolicy:
        "explicit_test_window_database_or_reviewed_alpha_database",
      sourceScope: "new_minimized_explicitly_accepted_test_window_messages",
      releaseScope: "developer_alpha_evidence_only",
      envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
      defaultEnabled: false,
      uiControlsAllowed: false,
      providerVisibilityChangeAllowed: false,
      rawOutputAllowed: false,
      shellExecutionAllowed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});

function approvedInput(): MemoryProviderVectorContinuousAlphaPromotionGateInput {
  return {
    phase830PreflightComplete: true,
    phase831ImplementationComplete: true,
    phase832AcceptanceComplete: true,
    operatorRunbookReviewed: true,
    testerExpansionCriteriaReviewed: true,
    sanitizedObservationChecklistReviewed: true,
    stopConditionsReviewed: true,
    rollbackChecklistReviewed: true,
    promotionGateReviewed: true,
    fullGateChainPolicyReviewed: true,
    approvedRuntimeModelPolicyReviewed: true,
    artifactDigestPolicyReviewed: true,
    memoryDatabasePolicyReviewed: true,
    sourceMinimizationPolicyReviewed: true,
    sanitizedTelemetryPolicyReviewed: true,
    disableRollbackPolicyReviewed: true,
    incidentStopPolicyReviewed: true,
    rawOutputRedactionPolicyReviewed: true,
    credentialPrivatePathPolicyReviewed: true,
    cleanupVerificationPolicyReviewed: true,
    failClosedPolicyReviewed: true,
    releaseGateReviewed: true,
    cleanVerificationEvidence: true,
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
    upgradeRollbackPolicyChanged: false
  };
}
