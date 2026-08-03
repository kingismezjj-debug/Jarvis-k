import { describe, expect, it } from "vitest";
import {
  MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV,
  evaluateMemoryProviderVectorWriteApprovalGate,
  evaluateMemoryProviderVectorWriteSafety
} from "../src/memory-provider-vector-write-approval-gate";

describe("Memory provider vector write approval gate", () => {
  it("accepts complete approval evidence without reading env or writing vectors", () => {
    const result = evaluateMemoryProviderVectorWriteApprovalGate(
      approvedInput()
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.19",
      capability: "memory_provider_vector_write",
      envKey: MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV,
      status: "ready_for_provider_vector_write_implementation_approval",
      accepted: true,
      readyForProviderVectorWriteImplementationApproval: true,
      approvalGateOnly: true,
      productApprovalGranted: true,
      securityApprovalGranted: true,
      futureImplementationApprovalRequired: true,
      envValueRead: false,
      providerVectorWriteImplemented: false,
      providerExecutionRoutedForWrites: false,
      helperEmbedCalledForWrites: false,
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
      fixtureFallbackChanged: false,
      modelOutputShellExecutionEnabled: false,
      reviewedAreas: [
        "provider_vector_write_plan",
        "explicit_opt_in_env_key",
        "source_record_selection",
        "source_text_minimization",
        "vector_shape_validation",
        "model_id_and_provider_allowlist",
        "duplicate_and_update_policy",
        "rollback_delete_plan",
        "sanitized_failure_mapping",
        "ui_default_behavior_unchanged"
      ],
      reasons: [
        "Memory provider vector write gate is ready for separate implementation approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when prerequisite or review evidence is incomplete", () => {
    const result = evaluateMemoryProviderVectorWriteApprovalGate({
      ...approvedInput(),
      phase818ProviderQueryVectorAcceptanceComplete: false,
      sourceRecordSelectionPlanReviewed: false,
      rollbackDeletePlanReviewed: false,
      verificationClean: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForProviderVectorWriteImplementationApproval: false,
      envValueRead: false,
      providerVectorWriteImplemented: false,
      memoryVectorDataWritten: false,
      reviewedAreas: [],
      checks: {
        phase818ProviderQueryVectorAcceptanceComplete: false,
        sourceRecordSelectionPlanReviewed: false,
        rollbackDeletePlanReviewed: false,
        verificationClean: false,
        envValueNotRead: true,
        providerVectorWriteNotImplemented: true,
        memoryVectorDataNotWritten: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Phase 8.18 provider query-vector acceptance must be complete.",
        "Source record selection plan review is required.",
        "Rollback delete plan review is required.",
        "Clean verification evidence is required."
      ])
    );
  });

  it("blocks env reads, provider execution for writes, helper embed, vector exposure, writes, and migrations", () => {
    const result = evaluateMemoryProviderVectorWriteApprovalGate({
      ...approvedInput(),
      envValueRead: true,
      providerVectorWriteImplemented: true,
      providerExecutionRoutedForWrites: true,
      helperEmbedCalledForWrites: true,
      rawVectorsReturned: true,
      rawVectorsLoggedOrExposed: true,
      phase743VectorsPersisted: true,
      realRuntimeVectorsPersisted: true,
      memoryVectorDataWritten: true,
      sqliteSchemaMigrationEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      envValueRead: false,
      providerVectorWriteImplemented: false,
      providerExecutionRoutedForWrites: false,
      helperEmbedCalledForWrites: false,
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
        "Environment value reads are blocked in this approval gate.",
        "Provider vector write implementation is blocked.",
        "Provider execution routing for writes is blocked.",
        "Helper embed calls for writes are blocked.",
        "Returning raw vectors is blocked.",
        "Logging or exposing raw vectors is blocked.",
        "Phase 7.43 vectors must not be persisted.",
        "Real runtime vectors must not be persisted.",
        "Memory vector writes are blocked.",
        "SQLite schema/index migration is blocked."
      ])
    );
  });

  it("blocks raw text, diagnostics, credentials, Desktop/UI, visibility, fallback, and shell regressions", () => {
    const result = evaluateMemoryProviderVectorWriteApprovalGate({
      ...approvedInput(),
      rawTextExposed: true,
      rawDiagnosticsExposed: true,
      privatePathsExposed: true,
      signedUrlOrCredentialPersisted: true,
      desktopIpcChanged: true,
      uiBehaviorChanged: true,
      providerVisibilityChanged: true,
      defaultOptInChanged: true,
      fixtureFallbackChanged: true,
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
      fixtureFallbackChanged: false,
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
        "Fixture fallback must remain unchanged.",
        "Retrieval output must not become shell execution."
      ])
    );
  });

  it("reports approval-gate, degraded, and blocked safety observations", () => {
    expect(
      evaluateMemoryProviderVectorWriteSafety([
        {
          id: "write-plan",
          providerVectorWritePlanObserved: true,
          rollbackDeletePlanObserved: false,
          resultStatus: "ok"
        },
        {
          id: "rollback-plan",
          providerVectorWritePlanObserved: false,
          rollbackDeletePlanObserved: true,
          resultStatus: "ok"
        }
      ])
    ).toMatchObject({
      phase: "8.19",
      status: "approval_gate",
      approvalGateOnly: true,
      envValueRead: false,
      providerVectorWriteImplemented: false,
      providerExecutionRoutedForWrites: false,
      helperEmbedCalledForWrites: false,
      memoryVectorDataWritten: false,
      observationCount: 2,
      providerVectorWritePlanCount: 1,
      rollbackDeletePlanCount: 1,
      degradedObservationCount: 0,
      blockedObservationCount: 0,
      reasonCodes: []
    });

    expect(
      evaluateMemoryProviderVectorWriteSafety([
        {
          id: "degraded-plan",
          providerVectorWritePlanObserved: true,
          rollbackDeletePlanObserved: true,
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
      evaluateMemoryProviderVectorWriteSafety([
        {
          id: "unsafe",
          providerVectorWritePlanObserved: true,
          rollbackDeletePlanObserved: true,
          resultStatus: "blocked",
          envValueRead: true,
          providerVectorWriteObserved: true,
          providerExecutionForWriteObserved: true,
          helperEmbedForWriteObserved: true,
          rawVectorReturnedObserved: true,
          rawVectorLoggedObserved: true,
          rawTextObserved: true,
          rawDiagnosticsObserved: true,
          privatePathObserved: true,
          credentialObserved: true,
          phase743VectorObserved: true,
          realRuntimeVectorObserved: true,
          memoryVectorWriteObserved: true,
          sqliteMigrationObserved: true,
          desktopIpcObserved: true,
          uiBehaviorObserved: true,
          providerVisibilityObserved: true,
          defaultOptInObserved: true,
          fixtureFallbackObserved: true,
          shellExecutionObserved: true
        }
      ])
    ).toMatchObject({
      status: "blocked",
      blockedObservationCount: 1,
      reasonCodes: [
        "BLOCKED_OBSERVATION",
        "CREDENTIAL_OBSERVED",
        "DEFAULT_OPT_IN_OBSERVED",
        "DESKTOP_IPC_OBSERVED",
        "ENV_VALUE_READ",
        "FIXTURE_FALLBACK_OBSERVED",
        "HELPER_EMBED_FOR_WRITE_OBSERVED",
        "MEMORY_VECTOR_WRITE_OBSERVED",
        "PHASE_7_43_VECTOR_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_FOR_WRITE_OBSERVED",
        "PROVIDER_VECTOR_WRITE_OBSERVED",
        "PROVIDER_VISIBILITY_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_TEXT_OBSERVED",
        "RAW_VECTOR_LOGGED_OBSERVED",
        "RAW_VECTOR_RETURNED_OBSERVED",
        "REAL_RUNTIME_VECTOR_OBSERVED",
        "SHELL_EXECUTION_OBSERVED",
        "SQLITE_MIGRATION_OBSERVED",
        "UI_BEHAVIOR_OBSERVED"
      ]
    });

    expect(evaluateMemoryProviderVectorWriteSafety([])).toMatchObject({
      phase: "8.19",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});

function approvedInput(): MemoryProviderVectorWriteApprovalInputFixture {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase742ProviderExecutionWiringComplete: true,
    phase743ProviderExecutionAcceptanceComplete: true,
    phase85SqliteVectorSchemaComplete: true,
    phase87FixtureVectorWriteComplete: true,
    phase89FixtureVectorQueryComplete: true,
    phase812CoreReadRouteComplete: true,
    phase816ProviderQueryVectorComplete: true,
    phase818ProviderQueryVectorAcceptanceComplete: true,
    providerVectorWritePlanReviewed: true,
    explicitOptInEnvKeyReviewed: true,
    sourceRecordSelectionPlanReviewed: true,
    sourceTextMinimizationPlanReviewed: true,
    vectorShapeValidationPlanReviewed: true,
    modelIdAndProviderAllowlistReviewed: true,
    duplicateAndUpdatePolicyReviewed: true,
    rollbackDeletePlanReviewed: true,
    sanitizedFailureMappingReviewed: true,
    noUiDefaultChangePlanReviewed: true,
    futureImplementationApprovalRequired: true,
    verificationClean: true,
    envValueRead: false,
    providerVectorWriteImplemented: false,
    providerExecutionRoutedForWrites: false,
    helperEmbedCalledForWrites: false,
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
    fixtureFallbackChanged: false,
    modelOutputShellExecutionEnabled: false
  };
}

type MemoryProviderVectorWriteApprovalInputFixture = Parameters<
  typeof evaluateMemoryProviderVectorWriteApprovalGate
>[0];
