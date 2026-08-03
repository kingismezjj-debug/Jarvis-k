import { describe, expect, it } from "vitest";
import {
  createCoreMemoryRetrievalRoutingApprovalPlan,
  evaluateCoreMemoryRetrievalRoutingApproval,
  evaluateCoreMemoryRetrievalRoutingSafety
} from "../src";

const approvedInput = {
  productApprovalGranted: true,
  securityApprovalGranted: true,
  phase810ReadyForCoreRoutingApproval: true,
  providerNeutralRetrievalPortReviewed: true,
  coreTurnAssemblyPlanReviewed: true,
  explicitOptInGateReviewed: true,
  sanitizedRecallPayloadReviewed: true,
  boundedRecallResultReviewed: true,
  fixtureOnlyRoutingTestPlanReviewed: true,
  degradedFailClosedPlanReviewed: true,
  fixtureFallbackPlanReviewed: true,
  rollbackPlanReviewed: true,
  productPathNoBehaviorChangeReviewed: true,
  coreRuntimeChanged: false,
  retrievalRoutingImplemented: false,
  providerExecutionRouted: false,
  memoryRepositoryContractChanged: false,
  desktopIpcChanged: false,
  uiBehaviorChanged: false,
  providerVisibilityChanged: false,
  defaultOptInChanged: false,
  phase743VectorsPersisted: false,
  realRuntimeVectorsPersisted: false,
  rawVectorsExposed: false,
  rawTextExposed: false,
  privatePathsExposed: false,
  rawDiagnosticsExposed: false,
  modelOutputShellExecutionEnabled: false,
  verificationClean: true
};

describe("Core memory retrieval routing approval gate", () => {
  it("creates an approval-only Core routing plan without behavior changes", () => {
    const plan = createCoreMemoryRetrievalRoutingApprovalPlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      phase: "8.11",
      status: "approval_gate",
      coreRuntimeChanged: false,
      retrievalRoutingImplemented: false,
      providerExecutionRouted: false,
      memoryRepositoryContractChanged: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      plannedOptInGate: "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING",
      plannedRecallPayload: {
        includesMatchIds: true,
        includesScores: true,
        includesSourceMetadata: true,
        includesRawVectors: false,
        includesRawText: false,
        includesPrivatePaths: false,
        includesRawDiagnostics: false
      },
      plannedSafetyConstraints: {
        requiresSeparateImplementationApproval: true,
        requiresExplicitOptIn: true,
        requiresFixtureOnlyExecution: true,
        requiresProviderNeutralPort: true,
        requiresFailClosedDegradedMode: true,
        providerExecutionRoutingAllowed: false,
        phase743VectorPersistenceAllowed: false,
        realRuntimeVectorPersistenceAllowed: false,
        desktopIpcChangeAllowed: false,
        uiBehaviorChangeAllowed: false,
        modelOutputShellExecutionEnabled: false
      }
    });
    expect(plan.plannedCoreSurfaces).toEqual(
      expect.arrayContaining([
        "Core turn assembly before assistant response generation",
        "sanitized recall observation"
      ])
    );
    expect(plan.plannedFallbackModes).toEqual(
      expect.arrayContaining([
        "disabled_without_opt_in",
        "fixture_only_retrieval",
        "degraded_without_recall",
        "blocked_without_implementation_approval"
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("accepts only readiness for a separate implementation approval", () => {
    const result = evaluateCoreMemoryRetrievalRoutingApproval(approvedInput);

    expect(result).toMatchObject({
      phase: "8.11",
      capability: "core_memory_retrieval_read_routing",
      status: "ready_for_core_retrieval_routing_implementation_approval",
      accepted: true,
      readyForImplementationApproval: true,
      coreRuntimeChanged: false,
      retrievalRoutingImplemented: false,
      providerExecutionRouted: false,
      memoryRepositoryContractChanged: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks behavior changes, routing implementation, persistence, and exposure", () => {
    const result = evaluateCoreMemoryRetrievalRoutingApproval({
      ...approvedInput,
      phase810ReadyForCoreRoutingApproval: false,
      coreRuntimeChanged: true,
      retrievalRoutingImplemented: true,
      providerExecutionRouted: true,
      memoryRepositoryContractChanged: true,
      desktopIpcChanged: true,
      uiBehaviorChanged: true,
      providerVisibilityChanged: true,
      defaultOptInChanged: true,
      phase743VectorsPersisted: true,
      realRuntimeVectorsPersisted: true,
      rawVectorsExposed: true,
      rawTextExposed: true,
      privatePathsExposed: true,
      rawDiagnosticsExposed: true,
      modelOutputShellExecutionEnabled: true,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForImplementationApproval: false,
      coreRuntimeChanged: false,
      retrievalRoutingImplemented: false,
      providerExecutionRouted: false,
      memoryRepositoryContractChanged: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Phase 8.10 must be ready for Core routing approval.",
        "Core runtime behavior must remain unchanged.",
        "Retrieval routing implementation is blocked.",
        "Provider execution routing is blocked.",
        "Memory repository contract must remain unchanged.",
        "Desktop IPC must remain unchanged.",
        "UI behavior must remain unchanged.",
        "Provider visibility must remain unchanged.",
        "Default opt-in must remain unchanged.",
        "Phase 7.43 runtime vectors must not be persisted.",
        "Real runtime vectors must not be persisted.",
        "Raw vector exposure is blocked.",
        "Raw text exposure is blocked.",
        "Private path exposure is blocked.",
        "Raw diagnostic exposure is blocked.",
        "Retrieval output must not become shell execution.",
        "Verification gates must be clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b(api[_-]?key|signed[_-]?url|secret)\b/iu);
  });

  it("reports approval-gate and degraded fixture-only safety observations", () => {
    const clean = evaluateCoreMemoryRetrievalRoutingSafety([
      {
        id: "gate-reviewed",
        gateReviewed: true,
        fallbackReviewed: false,
        resultStatus: "ok"
      },
      {
        id: "fallback-reviewed",
        gateReviewed: false,
        fallbackReviewed: true,
        resultStatus: "ok"
      }
    ]);

    expect(clean).toMatchObject({
      phase: "8.11",
      status: "approval_gate",
      fixtureOnly: true,
      observationCount: 2,
      gateReviewCount: 1,
      fallbackReviewCount: 1,
      degradedObservationCount: 0,
      blockedObservationCount: 0,
      reasonCodes: []
    });

    expect(
      evaluateCoreMemoryRetrievalRoutingSafety([
        {
          id: "retrieval-unavailable",
          gateReviewed: true,
          fallbackReviewed: true,
          resultStatus: "degraded"
        }
      ])
    ).toMatchObject({
      phase: "8.11",
      status: "degraded",
      degradedObservationCount: 1,
      blockedObservationCount: 0,
      reasonCodes: []
    });
  });

  it("blocks unsafe Core routing observations and empty observation sets", () => {
    const blocked = evaluateCoreMemoryRetrievalRoutingSafety([
      {
        id: "unsafe-core-routing",
        gateReviewed: true,
        fallbackReviewed: true,
        resultStatus: "blocked",
        coreRuntimeChanged: true,
        retrievalRoutingObserved: true,
        providerExecutionObserved: true,
        memoryRepositoryContractObserved: true,
        desktopIpcObserved: true,
        uiBehaviorObserved: true,
        providerVisibilityObserved: true,
        defaultOptInObserved: true,
        phase743VectorObserved: true,
        realRuntimeVectorObserved: true,
        rawVectorObserved: true,
        rawTextObserved: true,
        privatePathObserved: true,
        rawDiagnosticsObserved: true,
        shellExecutionObserved: true
      }
    ]);

    expect(blocked).toMatchObject({
      phase: "8.11",
      status: "blocked",
      blockedObservationCount: 1,
      reasonCodes: [
        "BLOCKED_OBSERVATION",
        "CORE_RUNTIME_CHANGED",
        "DEFAULT_OPT_IN_OBSERVED",
        "DESKTOP_IPC_OBSERVED",
        "MEMORY_REPOSITORY_CONTRACT_OBSERVED",
        "PHASE_7_43_VECTOR_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_OBSERVED",
        "PROVIDER_VISIBILITY_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_TEXT_OBSERVED",
        "RAW_VECTOR_OBSERVED",
        "REAL_RUNTIME_VECTOR_OBSERVED",
        "RETRIEVAL_ROUTING_OBSERVED",
        "SHELL_EXECUTION_OBSERVED",
        "UI_BEHAVIOR_OBSERVED"
      ]
    });

    expect(evaluateCoreMemoryRetrievalRoutingSafety([])).toMatchObject({
      phase: "8.11",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});
