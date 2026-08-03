import { describe, expect, it } from "vitest";
import {
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV,
  evaluateMemoryProviderVectorRetrievalPreflight,
  evaluateMemoryProviderVectorRetrievalSafety
} from "../src/memory-provider-vector-retrieval-preflight";

describe("Memory provider vector retrieval preflight", () => {
  it("accepts complete review evidence without changing routing", () => {
    const result = evaluateMemoryProviderVectorRetrievalPreflight(
      approvedInput()
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.22",
      capability: "memory_provider_vector_retrieval",
      envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV,
      status:
        "ready_for_provider_vector_retrieval_implementation_approval",
      accepted: true,
      readyForProviderVectorRetrievalImplementationApproval: true,
      preflightOnly: true,
      productApprovalGranted: true,
      securityApprovalGranted: true,
      futureImplementationApprovalRequired: true,
      envValueRead: false,
      coreHostRoutingChanged: false,
      coreRuntimeChanged: false,
      providerVectorRetrievalImplemented: false,
      providerExecutionRoutedForReads: false,
      helperEmbedCalledForReads: false,
      memoryVectorWritesChanged: false,
      rawVectorsReturned: false,
      rawVectorsLoggedOrExposed: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathsExposed: false,
      signedUrlOrCredentialPersisted: false,
      sqliteSchemaMigrationEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      fixtureFallbackChanged: false,
      modelOutputShellExecutionEnabled: false,
      reviewedAreas: [
        "provider_vector_retrieval_plan",
        "explicit_opt_in_env_key",
        "same_model_id_read_write_alignment",
        "bounded_recall_limit",
        "sanitized_recall_payload",
        "provider_vector_fallback",
        "default_behavior_unchanged",
        "no_historical_batch_indexing",
        "rollback_smoke"
      ],
      reasons: [
        "Memory provider vector retrieval preflight is ready for separate implementation approval."
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
    const result = evaluateMemoryProviderVectorRetrievalPreflight({
      ...approvedInput(),
      phase821ProviderVectorWriteAcceptanceComplete: false,
      sameModelIdReadWriteAlignmentReviewed: false,
      boundedRecallLimitReviewed: false,
      verificationClean: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForProviderVectorRetrievalImplementationApproval: false,
      envValueRead: false,
      coreHostRoutingChanged: false,
      providerVectorRetrievalImplemented: false,
      reviewedAreas: [],
      checks: {
        phase821ProviderVectorWriteAcceptanceComplete: false,
        sameModelIdReadWriteAlignmentReviewed: false,
        boundedRecallLimitReviewed: false,
        verificationClean: false,
        envValueNotRead: true,
        coreHostRoutingUnchanged: true,
        providerVectorRetrievalNotImplemented: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Phase 8.21 provider vector write acceptance must be complete.",
        "Same-model read/write alignment review is required.",
        "Bounded recall limit review is required.",
        "Clean verification evidence is required."
      ])
    );
  });

  it("blocks env reads, routing changes, provider reads, helper embed, write changes, and migrations", () => {
    const result = evaluateMemoryProviderVectorRetrievalPreflight({
      ...approvedInput(),
      envValueRead: true,
      coreHostRoutingChanged: true,
      coreRuntimeChanged: true,
      providerVectorRetrievalImplemented: true,
      providerExecutionRoutedForReads: true,
      helperEmbedCalledForReads: true,
      memoryVectorWritesChanged: true,
      rawVectorsReturned: true,
      rawVectorsLoggedOrExposed: true,
      sqliteSchemaMigrationEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      envValueRead: false,
      coreHostRoutingChanged: false,
      coreRuntimeChanged: false,
      providerVectorRetrievalImplemented: false,
      providerExecutionRoutedForReads: false,
      helperEmbedCalledForReads: false,
      memoryVectorWritesChanged: false,
      rawVectorsReturned: false,
      rawVectorsLoggedOrExposed: false,
      sqliteSchemaMigrationEnabled: false,
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Environment value reads are blocked in this preflight.",
        "Core Host routing changes are blocked in this preflight.",
        "Core runtime changes are blocked in this preflight.",
        "Provider vector retrieval implementation is blocked.",
        "Provider execution routing for reads is blocked.",
        "Helper embed calls for reads are blocked.",
        "Memory vector write behavior must remain unchanged.",
        "Returning raw vectors is blocked.",
        "Logging or exposing raw vectors is blocked.",
        "SQLite schema/index migration is blocked."
      ])
    );
  });

  it("blocks raw text, diagnostics, credentials, Desktop/UI, visibility, fallback, and shell regressions", () => {
    const result = evaluateMemoryProviderVectorRetrievalPreflight({
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

  it("reports preflight, degraded, and blocked safety observations", () => {
    expect(
      evaluateMemoryProviderVectorRetrievalSafety([
        {
          id: "retrieval-plan",
          providerVectorRetrievalPlanObserved: true,
          modelIdAlignmentObserved: false,
          rollbackPlanObserved: false,
          resultStatus: "ok"
        },
        {
          id: "model-alignment",
          providerVectorRetrievalPlanObserved: false,
          modelIdAlignmentObserved: true,
          rollbackPlanObserved: false,
          resultStatus: "ok"
        },
        {
          id: "rollback-plan",
          providerVectorRetrievalPlanObserved: false,
          modelIdAlignmentObserved: false,
          rollbackPlanObserved: true,
          resultStatus: "ok"
        }
      ])
    ).toMatchObject({
      phase: "8.22",
      status: "preflight_only",
      preflightOnly: true,
      providerVectorRetrievalImplemented: false,
      providerExecutionRoutedForReads: false,
      helperEmbedCalledForReads: false,
      rawVectorsReturned: false,
      sqliteSchemaMigrationEnabled: false,
      observationCount: 3,
      providerVectorRetrievalPlanCount: 1,
      modelIdAlignmentCount: 1,
      rollbackPlanCount: 1,
      degradedObservationCount: 0,
      blockedObservationCount: 0,
      reasonCodes: []
    });

    expect(
      evaluateMemoryProviderVectorRetrievalSafety([
        {
          id: "degraded-plan",
          providerVectorRetrievalPlanObserved: true,
          modelIdAlignmentObserved: true,
          rollbackPlanObserved: true,
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
      evaluateMemoryProviderVectorRetrievalSafety([
        {
          id: "unsafe",
          providerVectorRetrievalPlanObserved: true,
          modelIdAlignmentObserved: true,
          rollbackPlanObserved: true,
          resultStatus: "blocked",
          envValueRead: true,
          coreHostRoutingObserved: true,
          coreRuntimeObserved: true,
          providerVectorRetrievalObserved: true,
          providerExecutionForReadObserved: true,
          helperEmbedForReadObserved: true,
          memoryVectorWriteChangeObserved: true,
          rawVectorReturnedObserved: true,
          rawVectorLoggedObserved: true,
          rawTextObserved: true,
          rawDiagnosticsObserved: true,
          privatePathObserved: true,
          credentialObserved: true,
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
        "CORE_HOST_ROUTING_OBSERVED",
        "CORE_RUNTIME_OBSERVED",
        "CREDENTIAL_OBSERVED",
        "DEFAULT_OPT_IN_OBSERVED",
        "DESKTOP_IPC_OBSERVED",
        "ENV_VALUE_READ",
        "FIXTURE_FALLBACK_OBSERVED",
        "HELPER_EMBED_FOR_READ_OBSERVED",
        "MEMORY_VECTOR_WRITE_CHANGE_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_FOR_READ_OBSERVED",
        "PROVIDER_VECTOR_RETRIEVAL_OBSERVED",
        "PROVIDER_VISIBILITY_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_TEXT_OBSERVED",
        "RAW_VECTOR_LOGGED_OBSERVED",
        "RAW_VECTOR_RETURNED_OBSERVED",
        "SHELL_EXECUTION_OBSERVED",
        "SQLITE_MIGRATION_OBSERVED",
        "UI_BEHAVIOR_OBSERVED"
      ]
    });

    expect(evaluateMemoryProviderVectorRetrievalSafety([])).toMatchObject({
      phase: "8.22",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});

function approvedInput(): MemoryProviderVectorRetrievalPreflightInputFixture {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase743ProviderExecutionAcceptanceComplete: true,
    phase816ProviderQueryVectorComplete: true,
    phase818ProviderQueryVectorAcceptanceComplete: true,
    phase820ProviderVectorWriteComplete: true,
    phase821ProviderVectorWriteAcceptanceComplete: true,
    providerVectorRetrievalPlanReviewed: true,
    explicitOptInEnvKeyReviewed: true,
    sameModelIdReadWriteAlignmentReviewed: true,
    boundedRecallLimitReviewed: true,
    sanitizedRecallPayloadReviewed: true,
    providerVectorFallbackPlanReviewed: true,
    noDefaultBehaviorChangeReviewed: true,
    noHistoricalBatchIndexingReviewed: true,
    rollbackSmokePlanReviewed: true,
    futureImplementationApprovalRequired: true,
    verificationClean: true,
    envValueRead: false,
    coreHostRoutingChanged: false,
    coreRuntimeChanged: false,
    providerVectorRetrievalImplemented: false,
    providerExecutionRoutedForReads: false,
    helperEmbedCalledForReads: false,
    memoryVectorWritesChanged: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathsExposed: false,
    signedUrlOrCredentialPersisted: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    fixtureFallbackChanged: false,
    modelOutputShellExecutionEnabled: false
  };
}

type MemoryProviderVectorRetrievalPreflightInputFixture = Parameters<
  typeof evaluateMemoryProviderVectorRetrievalPreflight
>[0];
