import { describe, expect, it } from "vitest";
import {
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
  createMemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan,
  evaluateMemoryProviderVectorRetrievalDeveloperAlphaPlan,
  evaluateMemoryProviderVectorRetrievalDeveloperAlphaSafety,
  isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled
} from "../src/memory-provider-vector-retrieval-developer-alpha-plan";

describe("Memory provider-vector retrieval developer-alpha plan", () => {
  it("accepts complete plan evidence without enabling developer-alpha execution", () => {
    const result = evaluateMemoryProviderVectorRetrievalDeveloperAlphaPlan(
      approvedInput()
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.26",
      capability: "memory_provider_vector_retrieval_developer_alpha_usage_test",
      status: "ready_for_developer_alpha_usage_test_approval",
      accepted: true,
      readyForDeveloperAlphaUsageTestApproval: true,
      planOnly: true,
      productApprovalGranted: true,
      securityApprovalGranted: true,
      envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
      usageTestPlan: {
        mode: "developer_alpha_usage_test_plan",
        scope: "local_single_developer_alpha",
        allowedStorageScope:
          "existing_memory_database_new_accepted_messages_only",
        rollbackAction:
          "unset_env_and_delete_provider_vectors_for_test_window",
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
      },
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
      reviewedAreas: [
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
      ],
      reasons: [
        "Memory provider-vector retrieval developer-alpha usage test plan is ready for separate implementation approval."
      ]
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

  it("degrades when plan evidence is incomplete while all execution remains blocked", () => {
    const result = evaluateMemoryProviderVectorRetrievalDeveloperAlphaPlan({
      ...approvedInput(),
      explicitDeveloperAlphaEnvReviewed: false,
      sourceSelectionAndMinimizationReviewed: false,
      sanitizedTelemetryPlanReviewed: false,
      verificationClean: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForDeveloperAlphaUsageTestApproval: false,
      providerExecutionCalled: false,
      helperEmbedCalled: false,
      providerVectorWritesExecuted: false,
      providerVectorRetrievalExecuted: false,
      persistentMemoryVectorDataWritten: false,
      reviewedAreas: [],
      checks: {
        explicitDeveloperAlphaEnvReviewed: false,
        sourceSelectionAndMinimizationReviewed: false,
        sanitizedTelemetryPlanReviewed: false,
        verificationClean: false,
        providerExecutionNotCalled: true,
        helperEmbedNotCalled: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Explicit developer-alpha env review is required.",
        "Source selection and minimization review is required.",
        "Sanitized telemetry plan review is required.",
        "Clean verification evidence is required."
      ])
    );
  });

  it("blocks env reads, artifact access, provider execution, writes, reads, and migrations", () => {
    const result = evaluateMemoryProviderVectorRetrievalDeveloperAlphaPlan({
      ...approvedInput(),
      developerAlphaEnvRead: true,
      runtimePythonRead: true,
      modelArtifactPathRead: true,
      artifactAccessed: true,
      providerExecutionCalled: true,
      helperEmbedCalled: true,
      providerVectorWritesExecuted: true,
      providerVectorRetrievalExecuted: true,
      persistentMemoryVectorDataWritten: true,
      historicalBatchIndexingEnabled: true,
      sqliteSchemaMigrationEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
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
      sqliteSchemaMigrationEnabled: false,
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Developer-alpha env reads are blocked in this plan.",
        "Runtime Python reads are blocked in this plan.",
        "Model artifact path reads are blocked in this plan.",
        "Artifact access is blocked in this plan.",
        "Provider execution is blocked in this plan.",
        "Helper embed calls are blocked in this plan.",
        "Provider vector writes are blocked in this plan.",
        "Provider vector retrieval is blocked in this plan.",
        "Persistent Memory vector writes are blocked in this plan.",
        "Historical batch indexing is blocked.",
        "SQLite schema/index migration is blocked."
      ])
    );
  });

  it("blocks raw output, private paths, credentials, downloads, UI, visibility, defaults, and shell regressions", () => {
    const result = evaluateMemoryProviderVectorRetrievalDeveloperAlphaPlan({
      ...approvedInput(),
      rawVectorsExposed: true,
      rawTextExposed: true,
      rawDiagnosticsExposed: true,
      privatePathsExposed: true,
      signedUrlOrCredentialPersisted: true,
      downloadsEnabled: true,
      persistentCacheWritesEnabled: true,
      desktopIpcChanged: true,
      uiBehaviorChanged: true,
      providerVisibilityChanged: true,
      defaultOptInChanged: true,
      modelOutputShellExecutionEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      rawVectorsExposed: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathsExposed: false,
      signedUrlOrCredentialPersisted: false,
      downloadsEnabled: false,
      persistentCacheWritesEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Raw vector exposure is blocked.",
        "Raw text exposure is blocked.",
        "Raw diagnostic exposure is blocked.",
        "Private path exposure is blocked.",
        "Signed URL or credential persistence is blocked.",
        "Downloads are blocked in this plan.",
        "Persistent cache writes are blocked.",
        "Desktop IPC must remain unchanged.",
        "UI behavior must remain unchanged.",
        "Provider visibility must remain unchanged.",
        "Default opt-in must remain unchanged.",
        "Retrieval output must not become shell execution."
      ])
    );
  });

  it("returns a sanitized deterministic usage test plan", () => {
    const plan =
      createMemoryProviderVectorRetrievalDeveloperAlphaUsageTestPlan();
    const serialized = JSON.stringify(plan);

    expect(plan.envKey).toBe(
      MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV
    );
    expect(plan.prerequisiteEnvKeys).toHaveLength(9);
    expect(plan.maximumRecallMatches).toBe(5);
    expect(plan.historicalBatchIndexingAllowed).toBe(false);
    expect(plan.uiControlsAllowed).toBe(false);
    expect(plan.rawVectorExposureAllowed).toBe(false);
    expect(plan.shellExecutionAllowed).toBe(false);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("enables developer-alpha usage only for the exact explicit env value", () => {
    expect(
      isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled({
        [MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV]: " 1 "
      })
    ).toBe(true);
    for (const value of ["", "0", "true", "yes", "2"]) {
      expect(
        isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled({
          [MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV]: value
        })
      ).toBe(false);
    }
  });

  it("reports plan-only, degraded, and blocked safety observations", () => {
    expect(
      evaluateMemoryProviderVectorRetrievalDeveloperAlphaSafety([
        {
          id: "runbook",
          usageRunbookObserved: true,
          rollbackPlanObserved: false,
          sanitizedTelemetryObserved: false,
          sourceMinimizationObserved: false,
          degradedFallbackObserved: false,
          resultStatus: "ok"
        },
        {
          id: "safety",
          usageRunbookObserved: false,
          rollbackPlanObserved: true,
          sanitizedTelemetryObserved: true,
          sourceMinimizationObserved: true,
          degradedFallbackObserved: true,
          resultStatus: "ok"
        }
      ])
    ).toMatchObject({
      phase: "8.26",
      status: "plan_only",
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
      observationCount: 2,
      usageRunbookCount: 1,
      rollbackPlanCount: 1,
      sanitizedTelemetryCount: 1,
      sourceMinimizationCount: 1,
      degradedFallbackCount: 1,
      degradedObservationCount: 0,
      blockedObservationCount: 0,
      reasonCodes: []
    });

    expect(
      evaluateMemoryProviderVectorRetrievalDeveloperAlphaSafety([
        {
          id: "partial",
          usageRunbookObserved: true,
          rollbackPlanObserved: true,
          sanitizedTelemetryObserved: true,
          sourceMinimizationObserved: true,
          degradedFallbackObserved: true,
          resultStatus: "degraded"
        }
      ])
    ).toMatchObject({
      status: "degraded",
      degradedObservationCount: 1,
      blockedObservationCount: 0,
      reasonCodes: []
    });

    expect(
      evaluateMemoryProviderVectorRetrievalDeveloperAlphaSafety([
        {
          id: "unsafe",
          usageRunbookObserved: true,
          rollbackPlanObserved: true,
          sanitizedTelemetryObserved: true,
          sourceMinimizationObserved: true,
          degradedFallbackObserved: true,
          resultStatus: "blocked",
          developerAlphaEnvRead: true,
          runtimePythonRead: true,
          modelArtifactPathRead: true,
          artifactAccessObserved: true,
          providerExecutionObserved: true,
          helperEmbedObserved: true,
          providerVectorWriteObserved: true,
          providerVectorRetrievalObserved: true,
          persistentVectorWriteObserved: true,
          historicalBatchIndexingObserved: true,
          rawVectorObserved: true,
          rawTextObserved: true,
          rawDiagnosticsObserved: true,
          privatePathObserved: true,
          credentialObserved: true,
          downloadObserved: true,
          persistentCacheWriteObserved: true,
          sqliteMigrationObserved: true,
          desktopIpcObserved: true,
          uiBehaviorObserved: true,
          providerVisibilityObserved: true,
          defaultOptInObserved: true,
          shellExecutionObserved: true
        }
      ])
    ).toMatchObject({
      status: "blocked",
      blockedObservationCount: 1,
      reasonCodes: [
        "ARTIFACT_ACCESS_OBSERVED",
        "BLOCKED_OBSERVATION",
        "CREDENTIAL_OBSERVED",
        "DEFAULT_OPT_IN_OBSERVED",
        "DESKTOP_IPC_OBSERVED",
        "DEVELOPER_ALPHA_ENV_READ",
        "DOWNLOAD_OBSERVED",
        "HELPER_EMBED_OBSERVED",
        "HISTORICAL_BATCH_INDEXING_OBSERVED",
        "MODEL_ARTIFACT_PATH_READ",
        "PERSISTENT_CACHE_WRITE_OBSERVED",
        "PERSISTENT_VECTOR_WRITE_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_OBSERVED",
        "PROVIDER_VECTOR_RETRIEVAL_OBSERVED",
        "PROVIDER_VECTOR_WRITE_OBSERVED",
        "PROVIDER_VISIBILITY_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_TEXT_OBSERVED",
        "RAW_VECTOR_OBSERVED",
        "RUNTIME_PYTHON_READ",
        "SHELL_EXECUTION_OBSERVED",
        "SQLITE_MIGRATION_OBSERVED",
        "UI_BEHAVIOR_OBSERVED"
      ]
    });

    expect(
      evaluateMemoryProviderVectorRetrievalDeveloperAlphaSafety([])
    ).toMatchObject({
      phase: "8.26",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});

function approvedInput(): MemoryProviderVectorRetrievalDeveloperAlphaInputFixture {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase825ArtifactBackedAcceptanceComplete: true,
    explicitDeveloperAlphaEnvReviewed: true,
    prerequisiteGateChainReviewed: true,
    approvedRuntimeAndArtifactProvisioningPlanReviewed: true,
    sourceSelectionAndMinimizationReviewed: true,
    boundedTesterCohortReviewed: true,
    retentionAndRollbackPlanReviewed: true,
    sanitizedTelemetryPlanReviewed: true,
    degradedFallbackPlanReviewed: true,
    noDefaultBehaviorChangeReviewed: true,
    noUiOrProviderVisibilityChangeReviewed: true,
    noHistoricalBatchIndexingReviewed: true,
    verificationClean: true,
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
    modelOutputShellExecutionEnabled: false
  };
}

type MemoryProviderVectorRetrievalDeveloperAlphaInputFixture = Parameters<
  typeof evaluateMemoryProviderVectorRetrievalDeveloperAlphaPlan
>[0];
