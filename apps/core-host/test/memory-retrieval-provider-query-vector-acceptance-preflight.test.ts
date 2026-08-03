import { describe, expect, it } from "vitest";
import {
  MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV,
  evaluateMemoryRetrievalProviderQueryVectorAcceptancePreflight,
  evaluateMemoryRetrievalProviderQueryVectorAcceptanceSafety
} from "../src/memory-retrieval-provider-query-vector-acceptance-preflight";

describe("Memory retrieval provider query-vector acceptance preflight", () => {
  it("accepts complete diagnostic approval evidence without running provider execution", () => {
    const result =
      evaluateMemoryRetrievalProviderQueryVectorAcceptancePreflight(
        approvedInput()
      );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.17",
      capability: "memory_retrieval_provider_query_vector_acceptance",
      envKey: MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV,
      status: "ready_for_acceptance_diagnostic_approval",
      accepted: true,
      readyForAcceptanceDiagnosticApproval: true,
      preflightOnly: true,
      productApprovalGranted: true,
      securityApprovalGranted: true,
      acceptanceEnvRead: false,
      runtimePythonRead: false,
      modelArtifactPathRead: false,
      providerExecutionCalled: false,
      helperEmbedCalled: false,
      rawVectorsReturned: false,
      rawVectorsLoggedOrExposed: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathsExposed: false,
      signedUrlOrCredentialPersisted: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      memoryVectorDataWritten: false,
      sqliteSchemaMigrationEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      modelOutputShellExecutionEnabled: false,
      reviewedAreas: [
        "product_path_acceptance_diagnostic_plan",
        "explicit_acceptance_env",
        "local_runtime_environment_plan",
        "artifact_digest_verification_plan",
        "sanitized_report_shape",
        "no_vector_persistence",
        "no_memory_write",
        "cleanup_plan",
        "rollback_plan"
      ],
      reasons: [
        "Memory retrieval provider query-vector acceptance preflight is ready for separate diagnostic approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when diagnostic review evidence is incomplete while execution remains blocked", () => {
    const result =
      evaluateMemoryRetrievalProviderQueryVectorAcceptancePreflight({
        ...approvedInput(),
        productPathDiagnosticPlanReviewed: false,
        localRuntimeEnvironmentPlanReviewed: false,
        sanitizedReportPlanReviewed: false,
        verificationClean: false
      });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForAcceptanceDiagnosticApproval: false,
      providerExecutionCalled: false,
      helperEmbedCalled: false,
      memoryVectorDataWritten: false,
      reviewedAreas: [],
      checks: {
        productPathDiagnosticPlanReviewed: false,
        localRuntimeEnvironmentPlanReviewed: false,
        sanitizedReportPlanReviewed: false,
        verificationClean: false,
        providerExecutionNotCalled: true,
        helperEmbedNotCalled: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Product-path diagnostic plan review is required.",
        "Local runtime environment plan review is required.",
        "Sanitized report plan review is required.",
        "Clean verification evidence is required."
      ])
    );
  });

  it("blocks env reads, runtime path reads, provider execution, helper embed, and vector persistence", () => {
    const result =
      evaluateMemoryRetrievalProviderQueryVectorAcceptancePreflight({
        ...approvedInput(),
        acceptanceEnvRead: true,
        runtimePythonRead: true,
        modelArtifactPathRead: true,
        providerExecutionCalled: true,
        helperEmbedCalled: true,
        rawVectorsReturned: true,
        rawVectorsLoggedOrExposed: true,
        phase743VectorsPersisted: true,
        realRuntimeVectorsPersisted: true,
        memoryVectorDataWritten: true,
        sqliteSchemaMigrationEnabled: true
      });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      acceptanceEnvRead: false,
      runtimePythonRead: false,
      modelArtifactPathRead: false,
      providerExecutionCalled: false,
      helperEmbedCalled: false,
      rawVectorsReturned: false,
      rawVectorsLoggedOrExposed: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      memoryVectorDataWritten: false,
      sqliteSchemaMigrationEnabled: false,
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Acceptance env reads are blocked in this preflight.",
        "Runtime Python reads are blocked in this preflight.",
        "Model artifact path reads are blocked in this preflight.",
        "Provider execution calls are blocked in this preflight.",
        "Helper embed calls are blocked in this preflight.",
        "Returning raw vectors is blocked.",
        "Logging or exposing raw vectors is blocked.",
        "Phase 7.43 vectors must not be persisted.",
        "Real runtime vectors must not be persisted.",
        "Memory vector writes are blocked.",
        "SQLite schema/index migration is blocked."
      ])
    );
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks raw text, diagnostics, private paths, credentials, UI, visibility, default opt-in, and shell regressions", () => {
    const result =
      evaluateMemoryRetrievalProviderQueryVectorAcceptancePreflight({
        ...approvedInput(),
        rawTextExposed: true,
        rawDiagnosticsExposed: true,
        privatePathsExposed: true,
        signedUrlOrCredentialPersisted: true,
        desktopIpcChanged: true,
        uiBehaviorChanged: true,
        providerVisibilityChanged: true,
        defaultOptInChanged: true,
        modelOutputShellExecutionEnabled: true
      });

    expect(result).toMatchObject({
      status: "blocked",
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathsExposed: false,
      signedUrlOrCredentialPersisted: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Raw text exposure is blocked.",
        "Raw diagnostic exposure is blocked.",
        "Private path exposure is blocked.",
        "Signed URL or credential persistence is blocked.",
        "Desktop IPC must remain unchanged.",
        "UI behavior must remain unchanged.",
        "Provider visibility must remain unchanged.",
        "Default opt-in must remain unchanged.",
        "Retrieval output must not become shell execution."
      ])
    );
  });

  it("reports preflight, degraded, and blocked safety observations", () => {
    expect(
      evaluateMemoryRetrievalProviderQueryVectorAcceptanceSafety([
        {
          id: "diagnostic-plan",
          diagnosticPlanObserved: true,
          sanitizedReportObserved: false,
          cleanupPlanObserved: false,
          resultStatus: "ok"
        },
        {
          id: "sanitized-report",
          diagnosticPlanObserved: false,
          sanitizedReportObserved: true,
          cleanupPlanObserved: false,
          resultStatus: "ok"
        },
        {
          id: "cleanup-plan",
          diagnosticPlanObserved: false,
          sanitizedReportObserved: false,
          cleanupPlanObserved: true,
          resultStatus: "ok"
        }
      ])
    ).toMatchObject({
      phase: "8.17",
      status: "preflight_only",
      preflightOnly: true,
      providerExecutionCalled: false,
      helperEmbedCalled: false,
      rawVectorsReturned: false,
      memoryVectorDataWritten: false,
      observationCount: 3,
      diagnosticPlanCount: 1,
      sanitizedReportCount: 1,
      cleanupPlanCount: 1,
      degradedObservationCount: 0,
      blockedObservationCount: 0,
      reasonCodes: []
    });

    expect(
      evaluateMemoryRetrievalProviderQueryVectorAcceptanceSafety([
        {
          id: "partial-plan",
          diagnosticPlanObserved: true,
          sanitizedReportObserved: true,
          cleanupPlanObserved: true,
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
      evaluateMemoryRetrievalProviderQueryVectorAcceptanceSafety([
        {
          id: "unsafe",
          diagnosticPlanObserved: true,
          sanitizedReportObserved: true,
          cleanupPlanObserved: true,
          resultStatus: "blocked",
          acceptanceEnvRead: true,
          runtimePythonRead: true,
          modelArtifactPathRead: true,
          providerExecutionObserved: true,
          helperEmbedObserved: true,
          rawVectorObserved: true,
          rawTextObserved: true,
          rawDiagnosticsObserved: true,
          privatePathObserved: true,
          credentialObserved: true,
          vectorPersistenceObserved: true,
          memoryWriteObserved: true,
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
        "ACCEPTANCE_ENV_READ",
        "BLOCKED_OBSERVATION",
        "CREDENTIAL_OBSERVED",
        "DEFAULT_OPT_IN_OBSERVED",
        "DESKTOP_IPC_OBSERVED",
        "HELPER_EMBED_OBSERVED",
        "MEMORY_WRITE_OBSERVED",
        "MODEL_ARTIFACT_PATH_READ",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_OBSERVED",
        "PROVIDER_VISIBILITY_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_TEXT_OBSERVED",
        "RAW_VECTOR_OBSERVED",
        "RUNTIME_PYTHON_READ",
        "SHELL_EXECUTION_OBSERVED",
        "SQLITE_MIGRATION_OBSERVED",
        "UI_BEHAVIOR_OBSERVED",
        "VECTOR_PERSISTENCE_OBSERVED"
      ]
    });

    expect(
      evaluateMemoryRetrievalProviderQueryVectorAcceptanceSafety([])
    ).toMatchObject({
      phase: "8.17",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});

function approvedInput(): MemoryRetrievalProviderQueryVectorAcceptanceInputFixture {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase743ProviderExecutionAcceptanceComplete: true,
    phase816ProviderBackedQueryVectorComplete: true,
    productPathDiagnosticPlanReviewed: true,
    explicitAcceptanceEnvReviewed: true,
    localRuntimeEnvironmentPlanReviewed: true,
    localArtifactDigestVerificationPlanReviewed: true,
    sanitizedReportPlanReviewed: true,
    noVectorPersistencePlanReviewed: true,
    noMemoryWritePlanReviewed: true,
    cleanupPlanReviewed: true,
    rollbackPlanReviewed: true,
    verificationClean: true,
    acceptanceEnvRead: false,
    runtimePythonRead: false,
    modelArtifactPathRead: false,
    providerExecutionCalled: false,
    helperEmbedCalled: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathsExposed: false,
    signedUrlOrCredentialPersisted: false,
    phase743VectorsPersisted: false,
    realRuntimeVectorsPersisted: false,
    memoryVectorDataWritten: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    modelOutputShellExecutionEnabled: false
  };
}

type MemoryRetrievalProviderQueryVectorAcceptanceInputFixture = Parameters<
  typeof evaluateMemoryRetrievalProviderQueryVectorAcceptancePreflight
>[0];
