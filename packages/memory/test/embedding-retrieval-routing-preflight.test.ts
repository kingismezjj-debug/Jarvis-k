import { describe, expect, it } from "vitest";
import {
  createEmbeddingMemoryRetrievalRoutingImplementationPlan,
  evaluateEmbeddingMemoryRetrievalRoutingPreflight,
  evaluateEmbeddingMemoryRetrievalRoutingSafety
} from "../src";

const approvedInput = {
  productApprovalGranted: true,
  securityApprovalGranted: true,
  phase87FixtureWriteApiComplete: true,
  phase89FixtureQueryApiComplete: true,
  providerNeutralRoutingPortReviewed: true,
  coreRoutingPlanReviewed: true,
  fallbackPlanReviewed: true,
  sanitizedRecallInjectionPlanReviewed: true,
  boundedResultPlanReviewed: true,
  fixtureOnlyRoutingTestsPresent: true,
  productPathCommandReviewCompleted: true,
  vectorQueryApiAvailable: true,
  vectorWriteApiAvailable: true,
  coreRetrievalChanged: false,
  providerExecutionChanged: false,
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

describe("embedding memory retrieval routing preflight", () => {
  it("creates a review-only routing implementation plan without exposing vectors", () => {
    const plan = createEmbeddingMemoryRetrievalRoutingImplementationPlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      phase: "8.10",
      status: "review_only",
      routingImplemented: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      fixtureFallbackPreserved: true,
      vectorQueryApiAvailable: true,
      vectorWriteApiAvailable: true,
      memoryRepositoryChanged: false,
      plannedSafetyConstraints: {
        requiresSeparateCoreRoutingApproval: true,
        requiresNoPhase743VectorPersistence: true,
        requiresNoRealRuntimeVectorPersistence: true,
        requiresNoProviderExecutionRouting: true,
        requiresNoUIBehaviorChange: true,
        requiresNoProviderVisibilityChange: true,
        rawVectorsExposed: false,
        rawTextExposed: false,
        privatePathsExposed: false,
        rawDiagnosticsExposed: false,
        modelOutputShellExecutionEnabled: false
      }
    });
    expect(plan.plannedRoutingSurfaces).toEqual(
      expect.arrayContaining([
        "Core runtime memory recall injection",
        "fixture fallback routing"
      ])
    );
    expect(plan.plannedFallbackModes).toEqual(
      expect.arrayContaining([
        "fixture_only",
        "degraded_without_routing",
        "blocked_without_approval"
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("accepts only the Core routing approval boundary", () => {
    const result = evaluateEmbeddingMemoryRetrievalRoutingPreflight(
      approvedInput
    );

    expect(result).toMatchObject({
      phase: "8.10",
      capability: "embedding_memory_retrieval_routing",
      status: "ready_for_core_routing_approval",
      accepted: true,
      readyForCoreRoutingApproval: true,
      routingImplemented: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
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

  it("blocks retrieval routing, execution, visibility, persistence, and unsafe exposure", () => {
    const result = evaluateEmbeddingMemoryRetrievalRoutingPreflight({
      ...approvedInput,
      vectorQueryApiAvailable: false,
      vectorWriteApiAvailable: false,
      coreRetrievalChanged: true,
      providerExecutionChanged: true,
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
      readyForCoreRoutingApproval: false,
      routingImplemented: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
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
        "Vector query API must be available for routing review.",
        "Vector write API must be available for routing review.",
        "Core retrieval behavior must remain unchanged.",
        "Provider execution behavior must remain unchanged.",
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

  it("reports review-only routing safety without raw exposure", () => {
    const report = evaluateEmbeddingMemoryRetrievalRoutingSafety([
      {
        id: "routing-plan-reviewed",
        routingPlanObserved: true,
        fallbackObserved: false,
        resultStatus: "ok"
      },
      {
        id: "fallback-reviewed",
        routingPlanObserved: false,
        fallbackObserved: true,
        resultStatus: "ok"
      }
    ]);

    expect(report).toEqual({
      phase: "8.10",
      status: "review_only",
      fixtureOnly: true,
      routingImplemented: false,
      coreRetrievalChanged: false,
      providerExecutionChanged: false,
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
      observationCount: 2,
      routingPlanCount: 1,
      fallbackCount: 1,
      blockedObservationCount: 0,
      reasonCodes: []
    });
  });

  it("blocks unsafe routing observations and empty observation sets", () => {
    const blocked = evaluateEmbeddingMemoryRetrievalRoutingSafety([
      {
        id: "unsafe-routing",
        routingPlanObserved: true,
        fallbackObserved: true,
        resultStatus: "blocked",
        routingImplemented: true,
        coreRetrievalObserved: true,
        providerExecutionObserved: true,
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
      status: "blocked",
      blockedObservationCount: 1,
      reasonCodes: [
        "BLOCKED_OBSERVATION",
        "CORE_RETRIEVAL_OBSERVED",
        "DEFAULT_OPT_IN_OBSERVED",
        "PHASE_7_43_VECTOR_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_OBSERVED",
        "PROVIDER_VISIBILITY_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_TEXT_OBSERVED",
        "RAW_VECTOR_OBSERVED",
        "REAL_RUNTIME_VECTOR_OBSERVED",
        "ROUTING_IMPLEMENTED",
        "SHELL_EXECUTION_OBSERVED",
        "UI_BEHAVIOR_OBSERVED"
      ]
    });

    expect(
      evaluateEmbeddingMemoryRetrievalRoutingSafety([])
    ).toMatchObject({
      phase: "8.10",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});
