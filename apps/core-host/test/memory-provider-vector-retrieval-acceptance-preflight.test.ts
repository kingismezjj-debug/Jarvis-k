import { describe, expect, it } from "vitest";
import {
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_ACCEPTANCE_ENV,
  evaluateMemoryProviderVectorRetrievalAcceptancePreflight,
  evaluateMemoryProviderVectorRetrievalAcceptanceSafety
} from "../src/memory-provider-vector-retrieval-acceptance-preflight";

describe("Memory provider vector retrieval acceptance preflight", () => {
  it("accepts complete diagnostic approval evidence without running provider retrieval", () => {
    const result =
      evaluateMemoryProviderVectorRetrievalAcceptancePreflight(
        approvedInput()
      );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.24",
      capability: "memory_provider_vector_retrieval_acceptance",
      envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_ACCEPTANCE_ENV,
      status: "ready_for_acceptance_diagnostic_approval",
      accepted: true,
      readyForAcceptanceDiagnosticApproval: true,
      preflightOnly: true,
      productApprovalGranted: true,
      securityApprovalGranted: true,
      acceptanceEnvRead: false,
      runtimePythonRead: false,
      modelArtifactPathRead: false,
      artifactVerificationRun: false,
      providerExecutionCalled: false,
      helperEmbedCalled: false,
      providerVectorWriteExecuted: false,
      providerVectorRetrievalExecuted: false,
      temporaryMemoryVectorDataWritten: false,
      persistentMemoryVectorDataWritten: false,
      rawVectorsReturned: false,
      rawVectorsLoggedOrExposed: false,
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
        "product_path_acceptance_diagnostic_plan",
        "explicit_acceptance_env",
        "temporary_memory_database_plan",
        "provider_vector_write_then_read_plan",
        "same_model_id_read_write_alignment",
        "artifact_digest_verification_plan",
        "sanitized_recall_report_shape",
        "cleanup_plan",
        "rollback_plan"
      ],
      reasons: [
        "Memory provider vector retrieval acceptance preflight is ready for separate diagnostic approval."
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
      evaluateMemoryProviderVectorRetrievalAcceptancePreflight({
        ...approvedInput(),
        productPathDiagnosticPlanReviewed: false,
        temporaryMemoryDatabasePlanReviewed: false,
        providerVectorWriteThenReadPlanReviewed: false,
        verificationClean: false
      });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForAcceptanceDiagnosticApproval: false,
      providerExecutionCalled: false,
      helperEmbedCalled: false,
      providerVectorWriteExecuted: false,
      providerVectorRetrievalExecuted: false,
      temporaryMemoryVectorDataWritten: false,
      reviewedAreas: [],
      checks: {
        productPathDiagnosticPlanReviewed: false,
        temporaryMemoryDatabasePlanReviewed: false,
        providerVectorWriteThenReadPlanReviewed: false,
        verificationClean: false,
        providerExecutionNotCalled: true,
        helperEmbedNotCalled: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Product-path diagnostic plan review is required.",
        "Temporary Memory database plan review is required.",
        "Provider vector write-then-read plan review is required.",
        "Clean verification evidence is required."
      ])
    );
  });

  it("blocks env reads, artifact access, provider execution, vector writes, and retrieval execution", () => {
    const result =
      evaluateMemoryProviderVectorRetrievalAcceptancePreflight({
        ...approvedInput(),
        acceptanceEnvRead: true,
        runtimePythonRead: true,
        modelArtifactPathRead: true,
        artifactVerificationRun: true,
        providerExecutionCalled: true,
        helperEmbedCalled: true,
        providerVectorWriteExecuted: true,
        providerVectorRetrievalExecuted: true,
        temporaryMemoryVectorDataWritten: true,
        persistentMemoryVectorDataWritten: true,
        sqliteSchemaMigrationEnabled: true
      });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      acceptanceEnvRead: false,
      runtimePythonRead: false,
      modelArtifactPathRead: false,
      artifactVerificationRun: false,
      providerExecutionCalled: false,
      helperEmbedCalled: false,
      providerVectorWriteExecuted: false,
      providerVectorRetrievalExecuted: false,
      temporaryMemoryVectorDataWritten: false,
      persistentMemoryVectorDataWritten: false,
      sqliteSchemaMigrationEnabled: false,
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Acceptance env reads are blocked in this preflight.",
        "Runtime Python reads are blocked in this preflight.",
        "Model artifact path reads are blocked in this preflight.",
        "Artifact verification is blocked in this preflight.",
        "Provider execution calls are blocked in this preflight.",
        "Helper embed calls are blocked in this preflight.",
        "Provider vector writes are blocked in this preflight.",
        "Provider vector retrieval is blocked in this preflight.",
        "Temporary Memory vector writes are blocked in this preflight.",
        "Persistent Memory vector writes are blocked.",
        "SQLite schema/index migration is blocked."
      ])
    );
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks raw output, private paths, credentials, downloads, UI, visibility, default opt-in, and shell regressions", () => {
    const result =
      evaluateMemoryProviderVectorRetrievalAcceptancePreflight({
        ...approvedInput(),
        rawVectorsReturned: true,
        rawVectorsLoggedOrExposed: true,
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
      rawVectorsReturned: false,
      rawVectorsLoggedOrExposed: false,
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
        "Returning raw vectors is blocked.",
        "Logging or exposing raw vectors is blocked.",
        "Raw text exposure is blocked.",
        "Raw diagnostic exposure is blocked.",
        "Private path exposure is blocked.",
        "Signed URL or credential persistence is blocked.",
        "Downloads are blocked in this preflight.",
        "Persistent cache writes are blocked.",
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
      evaluateMemoryProviderVectorRetrievalAcceptanceSafety([
        {
          id: "diagnostic-plan",
          diagnosticPlanObserved: true,
          temporaryDatabasePlanObserved: false,
          writeThenReadPlanObserved: false,
          sanitizedRecallReportObserved: false,
          cleanupPlanObserved: false,
          resultStatus: "ok"
        },
        {
          id: "temporary-db-plan",
          diagnosticPlanObserved: false,
          temporaryDatabasePlanObserved: true,
          writeThenReadPlanObserved: true,
          sanitizedRecallReportObserved: false,
          cleanupPlanObserved: false,
          resultStatus: "ok"
        },
        {
          id: "sanitized-cleanup-plan",
          diagnosticPlanObserved: false,
          temporaryDatabasePlanObserved: false,
          writeThenReadPlanObserved: false,
          sanitizedRecallReportObserved: true,
          cleanupPlanObserved: true,
          resultStatus: "ok"
        }
      ])
    ).toMatchObject({
      phase: "8.24",
      status: "preflight_only",
      preflightOnly: true,
      providerExecutionCalled: false,
      helperEmbedCalled: false,
      providerVectorWriteExecuted: false,
      providerVectorRetrievalExecuted: false,
      temporaryMemoryVectorDataWritten: false,
      persistentMemoryVectorDataWritten: false,
      observationCount: 3,
      diagnosticPlanCount: 1,
      temporaryDatabasePlanCount: 1,
      writeThenReadPlanCount: 1,
      sanitizedRecallReportCount: 1,
      cleanupPlanCount: 1,
      degradedObservationCount: 0,
      blockedObservationCount: 0,
      reasonCodes: []
    });

    expect(
      evaluateMemoryProviderVectorRetrievalAcceptanceSafety([
        {
          id: "partial-plan",
          diagnosticPlanObserved: true,
          temporaryDatabasePlanObserved: true,
          writeThenReadPlanObserved: true,
          sanitizedRecallReportObserved: true,
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
      evaluateMemoryProviderVectorRetrievalAcceptanceSafety([
        {
          id: "unsafe",
          diagnosticPlanObserved: true,
          temporaryDatabasePlanObserved: true,
          writeThenReadPlanObserved: true,
          sanitizedRecallReportObserved: true,
          cleanupPlanObserved: true,
          resultStatus: "blocked",
          acceptanceEnvRead: true,
          runtimePythonRead: true,
          modelArtifactPathRead: true,
          artifactVerificationObserved: true,
          providerExecutionObserved: true,
          helperEmbedObserved: true,
          providerVectorWriteObserved: true,
          providerVectorRetrievalObserved: true,
          temporaryVectorWriteObserved: true,
          persistentVectorWriteObserved: true,
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
        "ACCEPTANCE_ENV_READ",
        "ARTIFACT_VERIFICATION_OBSERVED",
        "BLOCKED_OBSERVATION",
        "CREDENTIAL_OBSERVED",
        "DEFAULT_OPT_IN_OBSERVED",
        "DESKTOP_IPC_OBSERVED",
        "DOWNLOAD_OBSERVED",
        "HELPER_EMBED_OBSERVED",
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
        "TEMPORARY_VECTOR_WRITE_OBSERVED",
        "UI_BEHAVIOR_OBSERVED"
      ]
    });

    expect(
      evaluateMemoryProviderVectorRetrievalAcceptanceSafety([])
    ).toMatchObject({
      phase: "8.24",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});

function approvedInput(): MemoryProviderVectorRetrievalAcceptanceInputFixture {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase743ProviderExecutionAcceptanceComplete: true,
    phase818ProviderQueryVectorAcceptanceComplete: true,
    phase821ProviderVectorWriteAcceptanceComplete: true,
    phase823ProviderVectorRetrievalRoutingComplete: true,
    productPathDiagnosticPlanReviewed: true,
    explicitAcceptanceEnvReviewed: true,
    temporaryMemoryDatabasePlanReviewed: true,
    providerVectorWriteThenReadPlanReviewed: true,
    sameModelIdReadWriteAlignmentReviewed: true,
    artifactDigestVerificationPlanReviewed: true,
    sanitizedRecallReportPlanReviewed: true,
    cleanupPlanReviewed: true,
    rollbackPlanReviewed: true,
    verificationClean: true,
    acceptanceEnvRead: false,
    runtimePythonRead: false,
    modelArtifactPathRead: false,
    artifactVerificationRun: false,
    providerExecutionCalled: false,
    helperEmbedCalled: false,
    providerVectorWriteExecuted: false,
    providerVectorRetrievalExecuted: false,
    temporaryMemoryVectorDataWritten: false,
    persistentMemoryVectorDataWritten: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
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

type MemoryProviderVectorRetrievalAcceptanceInputFixture = Parameters<
  typeof evaluateMemoryProviderVectorRetrievalAcceptancePreflight
>[0];
