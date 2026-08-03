import { describe, expect, it } from "vitest";
import {
  MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV,
  evaluateMemoryRetrievalProviderQueryVectorApprovalGate,
  evaluateMemoryRetrievalProviderQueryVectorSafety
} from "../src/memory-retrieval-provider-query-vector-approval-gate";

describe("Memory retrieval provider query-vector approval gate", () => {
  it("accepts complete approval evidence without reading env or routing provider execution", () => {
    const result = evaluateMemoryRetrievalProviderQueryVectorApprovalGate(
      approvedInput()
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.15",
      capability: "memory_retrieval_provider_query_vector",
      envKey: MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV,
      status: "ready_for_provider_query_vector_implementation_approval",
      accepted: true,
      readyForProviderQueryVectorImplementationApproval: true,
      approvalGateOnly: true,
      productApprovalGranted: true,
      securityApprovalGranted: true,
      futureImplementationApprovalRequired: true,
      envValueRead: false,
      providerQueryVectorImplemented: false,
      providerExecutionRouted: false,
      helperEmbedCalled: false,
      rawVectorsReturned: false,
      rawVectorsLoggedOrExposed: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathsExposed: false,
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
        "provider_query_vector_plan",
        "explicit_opt_in_env_key",
        "query_input_sanitization",
        "provider_execution_preflight",
        "bounded_timeout_and_cancellation",
        "vector_shape_validation",
        "fail_closed_no_recall",
        "no_vector_persistence",
        "ui_default_behavior_unchanged",
        "rollback_smoke"
      ],
      reasons: [
        "Memory retrieval provider query-vector gate is ready for separate implementation approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when review evidence is incomplete while side effects remain blocked", () => {
    const result = evaluateMemoryRetrievalProviderQueryVectorApprovalGate({
      ...approvedInput(),
      phase743ProviderExecutionAcceptanceComplete: false,
      providerQueryVectorPlanReviewed: false,
      boundedTimeoutPlanReviewed: false,
      verificationClean: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForProviderQueryVectorImplementationApproval: false,
      envValueRead: false,
      providerExecutionRouted: false,
      helperEmbedCalled: false,
      reviewedAreas: [],
      checks: {
        phase743ProviderExecutionAcceptanceComplete: false,
        providerQueryVectorPlanReviewed: false,
        boundedTimeoutPlanReviewed: false,
        verificationClean: false,
        envValueNotRead: true,
        providerExecutionNotRouted: true,
        helperEmbedNotCalled: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Phase 7.43 provider execution acceptance must be complete.",
        "Provider query-vector plan review is required.",
        "Bounded timeout and cancellation plan review is required.",
        "Clean verification evidence is required."
      ])
    );
  });

  it("blocks env reads, provider execution, helper embed, vector exposure, writes, and migrations", () => {
    const result = evaluateMemoryRetrievalProviderQueryVectorApprovalGate({
      ...approvedInput(),
      envValueRead: true,
      providerQueryVectorImplemented: true,
      providerExecutionRouted: true,
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
      envValueRead: false,
      providerQueryVectorImplemented: false,
      providerExecutionRouted: false,
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
        "Environment value reads are blocked in this approval gate.",
        "Provider query-vector implementation is blocked.",
        "Provider execution routing is blocked.",
        "Helper embed calls are blocked.",
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

  it("blocks raw text, diagnostics, private paths, Desktop/UI, visibility, fallback, and shell regressions", () => {
    const result = evaluateMemoryRetrievalProviderQueryVectorApprovalGate({
      ...approvedInput(),
      rawTextExposed: true,
      rawDiagnosticsExposed: true,
      privatePathsExposed: true,
      desktopIpcChanged: true,
      uiBehaviorChanged: true,
      providerVisibilityChanged: true,
      defaultOptInChanged: true,
      fixtureFallbackChanged: true,
      modelOutputShellExecutionEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathsExposed: false,
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
      evaluateMemoryRetrievalProviderQueryVectorSafety([
        {
          id: "provider-query-plan",
          providerQueryVectorPlanObserved: true,
          rollbackPlanObserved: false,
          resultStatus: "ok"
        },
        {
          id: "rollback-plan",
          providerQueryVectorPlanObserved: false,
          rollbackPlanObserved: true,
          resultStatus: "ok"
        }
      ])
    ).toMatchObject({
      phase: "8.15",
      status: "approval_gate",
      approvalGateOnly: true,
      envValueRead: false,
      providerQueryVectorImplemented: false,
      providerExecutionRouted: false,
      helperEmbedCalled: false,
      observationCount: 2,
      providerQueryVectorPlanCount: 1,
      rollbackPlanCount: 1,
      degradedObservationCount: 0,
      blockedObservationCount: 0,
      reasonCodes: []
    });

    expect(
      evaluateMemoryRetrievalProviderQueryVectorSafety([
        {
          id: "smoke-plan-missing",
          providerQueryVectorPlanObserved: true,
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
      evaluateMemoryRetrievalProviderQueryVectorSafety([
        {
          id: "unsafe",
          providerQueryVectorPlanObserved: true,
          rollbackPlanObserved: true,
          resultStatus: "blocked",
          envValueRead: true,
          providerQueryVectorObserved: true,
          providerExecutionObserved: true,
          helperEmbedObserved: true,
          rawVectorReturnedObserved: true,
          rawVectorLoggedObserved: true,
          rawTextObserved: true,
          rawDiagnosticsObserved: true,
          privatePathObserved: true,
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
        "DEFAULT_OPT_IN_OBSERVED",
        "DESKTOP_IPC_OBSERVED",
        "ENV_VALUE_READ",
        "FIXTURE_FALLBACK_OBSERVED",
        "HELPER_EMBED_OBSERVED",
        "MEMORY_VECTOR_WRITE_OBSERVED",
        "PHASE_7_43_VECTOR_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_OBSERVED",
        "PROVIDER_QUERY_VECTOR_OBSERVED",
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

    expect(
      evaluateMemoryRetrievalProviderQueryVectorSafety([])
    ).toMatchObject({
      phase: "8.15",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});

function approvedInput(): MemoryRetrievalProviderQueryVectorApprovalInputFixture {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase742ProviderExecutionWiringComplete: true,
    phase743ProviderExecutionAcceptanceComplete: true,
    phase812CoreReadRouteComplete: true,
    phase814CoreHostFixtureEnvWiringComplete: true,
    providerQueryVectorPlanReviewed: true,
    explicitOptInEnvKeyReviewed: true,
    queryInputSanitizationPlanReviewed: true,
    providerExecutionPreflightPlanReviewed: true,
    boundedTimeoutPlanReviewed: true,
    vectorShapeValidationPlanReviewed: true,
    failClosedNoRecallPlanReviewed: true,
    noVectorPersistencePlanReviewed: true,
    noUiDefaultChangePlanReviewed: true,
    rollbackSmokePlanReviewed: true,
    futureImplementationApprovalRequired: true,
    verificationClean: true,
    envValueRead: false,
    providerQueryVectorImplemented: false,
    providerExecutionRouted: false,
    helperEmbedCalled: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathsExposed: false,
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

type MemoryRetrievalProviderQueryVectorApprovalInputFixture = Parameters<
  typeof evaluateMemoryRetrievalProviderQueryVectorApprovalGate
>[0];
