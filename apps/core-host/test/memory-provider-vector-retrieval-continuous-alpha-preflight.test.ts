import { describe, expect, it } from "vitest";
import {
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV
} from "../src/memory-provider-vector-retrieval-developer-alpha-plan";
import {
  createMemoryProviderVectorContinuousAlphaObservationPolicy,
  evaluateMemoryProviderVectorContinuousAlphaPreflight,
  type MemoryProviderVectorContinuousAlphaPreflightInput
} from "../src/memory-provider-vector-retrieval-continuous-alpha-preflight";

describe("Memory provider-vector retrieval continuous alpha preflight", () => {
  it("accepts complete preflight evidence without enabling continuous alpha execution", () => {
    const result = evaluateMemoryProviderVectorContinuousAlphaPreflight(
      approvedInput()
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.30",
      capability:
        "memory_provider_vector_retrieval_continuous_alpha_preflight",
      status: "ready_for_continuous_alpha_usage_approval",
      accepted: true,
      readyForContinuousAlphaUsageApproval: true,
      preflightOnly: true,
      envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
      observationPolicy: {
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
      },
      continuousExecutionEnabled: false,
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
      checkedAreas: [
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

  it("degrades when observation, disable, rollback, or release evidence is missing", () => {
    const result = evaluateMemoryProviderVectorContinuousAlphaPreflight({
      ...approvedInput(),
      continuousObservationPlanReviewed: false,
      disablePlanReviewed: false,
      exactSourceRollbackPlanReviewed: false,
      rollbackReadinessReviewed: false,
      fallbackNoRecallPlanReviewed: false,
      releaseScopeConstrained: false,
      cleanVerificationEvidence: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForContinuousAlphaUsageApproval: false,
      preflightOnly: true,
      continuousExecutionEnabled: false,
      checkedAreas: [],
      checks: {
        continuousObservationPlanReviewed: false,
        disablePlanReviewed: false,
        exactSourceRollbackPlanReviewed: false,
        rollbackReadinessReviewed: false,
        fallbackNoRecallPlanReviewed: false,
        releaseScopeConstrained: false,
        cleanVerificationEvidence: false,
        helperEmbedNotCalled: true,
        providerVectorWriteNotExecuted: true,
        providerVectorReadNotExecuted: true
      }
    });
    expect(result.reasonCodes).toEqual([
      "continuous_observation_plan_missing",
      "disable_plan_missing",
      "exact_source_rollback_plan_missing",
      "rollback_readiness_missing",
      "fallback_no_recall_plan_missing",
      "release_scope_not_constrained",
      "clean_verification_missing"
    ]);
  });

  it("blocks continuous execution, env reads, runtime access, helper execution, provider vector operations, and migrations", () => {
    const result = evaluateMemoryProviderVectorContinuousAlphaPreflight({
      ...approvedInput(),
      continuousExecutionEnabled: true,
      envRead: true,
      runtimePythonRead: true,
      modelArtifactPathRead: true,
      artifactAccessed: true,
      artifactDownloadEnabled: true,
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
      historicalBatchIndexingEnabled: false
    });
    expect(result.reasonCodes).toEqual([
      "continuous_execution_requested",
      "environment_read_requested",
      "runtime_or_artifact_access_requested",
      "helper_or_provider_execution_requested",
      "provider_vector_operation_requested",
      "persistent_or_migration_side_effect_requested"
    ]);
  });

  it("blocks raw exposure, private paths, credentials, UI/default changes, and shell execution", () => {
    const result = evaluateMemoryProviderVectorContinuousAlphaPreflight({
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
      modelOutputShellExecutionEnabled: true
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
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasonCodes).toEqual([
      "desktop_ui_or_visibility_change_requested",
      "unsafe_output_or_secret_exposure_requested",
      "shell_execution_requested"
    ]);
  });

  it("returns a deterministic sanitized observation policy", () => {
    const policy = createMemoryProviderVectorContinuousAlphaObservationPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      mode: "continuous_alpha_observation_preflight",
      disableAction: "unset_developer_alpha_env_chain",
      rollbackAction: "delete_exact_test_window_provider_vectors_only",
      fallbackMode: "fail_closed_to_no_recall",
      maximumRecallMatches: 5,
      continuousExecutionEnabled: false,
      sqliteMigrationAllowed: false,
      historicalBatchIndexingAllowed: false,
      uiControlsAllowed: false,
      shellExecutionAllowed: false
    });
    expect(serialized).not.toContain("Synthetic alpha test topic");
    expect(serialized).not.toContain("0.123");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});

function approvedInput(): MemoryProviderVectorContinuousAlphaPreflightInput {
  return {
    phase826PlanComplete: true,
    phase827ImplementationComplete: true,
    phase828RunbookComplete: true,
    phase829OneShotUsageSessionPassed: true,
    continuousObservationPlanReviewed: true,
    sanitizedTelemetryPolicyReviewed: true,
    disablePlanReviewed: true,
    exactSourceRollbackPlanReviewed: true,
    rollbackReadinessReviewed: true,
    boundedUsageWindowReviewed: true,
    sourceMinimizationPlanReviewed: true,
    fallbackNoRecallPlanReviewed: true,
    stopConditionsReviewed: true,
    fixtureFallbackAvailable: true,
    releaseScopeConstrained: true,
    cleanVerificationEvidence: true,
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
    modelOutputShellExecutionEnabled: false
  };
}
