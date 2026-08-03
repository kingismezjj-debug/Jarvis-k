import { describe, expect, it } from "vitest";
import {
  MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV,
  evaluateCoreHostMemoryRetrievalEnvWiringApprovalGate,
  evaluateCoreHostMemoryRetrievalEnvWiringSafety
} from "../src/core-memory-retrieval-env-wiring-approval-gate";

describe("Core Host memory retrieval env wiring approval gate", () => {
  it("accepts complete approval evidence without reading env or wiring retrieval", () => {
    const result = evaluateCoreHostMemoryRetrievalEnvWiringApprovalGate(
      approvedInput()
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.13",
      capability: "core_host_memory_retrieval_env_wiring",
      envKey: MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV,
      status: "ready_for_env_wiring_implementation_approval",
      accepted: true,
      readyForEnvWiringImplementationApproval: true,
      approvalGateOnly: true,
      productApprovalGranted: true,
      securityApprovalGranted: true,
      futureImplementationApprovalRequired: true,
      envValueRead: false,
      envWiringImplemented: false,
      coreHostDefaultBehaviorChanged: false,
      coreRuntimeConstructorChanged: false,
      retrievalPortInjected: false,
      fixtureQueryVectorResolverInjected: false,
      providerExecutionRouted: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      memoryVectorDataWritten: false,
      sqliteSchemaMigrationEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      reviewedAreas: [
        "memory_retrieval_env_key",
        "exact_core_host_diff",
        "core_runtime_constructor_wiring_plan",
        "fixture_only_retrieval_port_plan",
        "fixture_query_vector_resolver_plan",
        "default_disabled_behavior",
        "desktop_smoke_plan",
        "rollback_plan",
        "sanitized_recall_observation"
      ],
      reasons: [
        "Core Host Memory retrieval env wiring gate is ready for separate implementation approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when implementation review evidence is incomplete while side effects remain blocked", () => {
    const result = evaluateCoreHostMemoryRetrievalEnvWiringApprovalGate({
      ...approvedInput(),
      exactCoreHostDiffReviewed: false,
      constructorWiringPlanReviewed: false,
      desktopSmokePlanReviewed: false,
      verificationClean: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForEnvWiringImplementationApproval: false,
      envValueRead: false,
      envWiringImplemented: false,
      retrievalPortInjected: false,
      reviewedAreas: [],
      checks: {
        exactCoreHostDiffReviewed: false,
        constructorWiringPlanReviewed: false,
        desktopSmokePlanReviewed: false,
        verificationClean: false,
        envValueNotRead: true,
        envWiringNotImplemented: true,
        retrievalPortNotInjected: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Exact Core Host env wiring diff review is required.",
        "CoreRuntime constructor wiring plan review is required.",
        "Desktop smoke plan review is required.",
        "Clean verification evidence is required."
      ])
    );
  });

  it("blocks env reads, env wiring, constructor changes, retrieval injection, vector writes, and migrations", () => {
    const result = evaluateCoreHostMemoryRetrievalEnvWiringApprovalGate({
      ...approvedInput(),
      envValueRead: true,
      envWiringImplemented: true,
      coreHostDefaultBehaviorChanged: true,
      coreRuntimeConstructorChanged: true,
      retrievalPortInjected: true,
      fixtureQueryVectorResolverInjected: true,
      providerExecutionRouted: true,
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
      envWiringImplemented: false,
      coreHostDefaultBehaviorChanged: false,
      coreRuntimeConstructorChanged: false,
      retrievalPortInjected: false,
      fixtureQueryVectorResolverInjected: false,
      providerExecutionRouted: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      memoryVectorDataWritten: false,
      sqliteSchemaMigrationEnabled: false,
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Environment value reads are blocked in this approval gate.",
        "Core Host env wiring implementation is blocked.",
        "Core Host default behavior must remain unchanged.",
        "CoreRuntime constructor wiring must remain unchanged.",
        "Memory retrieval port injection is blocked.",
        "Fixture query vector resolver injection is blocked.",
        "Provider execution routing is blocked.",
        "Phase 7.43 vectors must not be persisted.",
        "Real runtime vectors must not be persisted.",
        "Memory vector data writes are blocked.",
        "SQLite schema/index migration is blocked."
      ])
    );
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks Desktop, UI, visibility, default opt-in, raw exposure, and shell regressions", () => {
    const result = evaluateCoreHostMemoryRetrievalEnvWiringApprovalGate({
      ...approvedInput(),
      desktopIpcChanged: true,
      uiBehaviorChanged: true,
      providerVisibilityChanged: true,
      defaultOptInChanged: true,
      rawVectorsExposed: true,
      rawTextExposed: true,
      privatePathsExposed: true,
      rawDiagnosticsExposed: true,
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
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      checks: {
        desktopIpcUnchanged: false,
        uiBehaviorUnchanged: false,
        providerVisibilityUnchanged: false,
        defaultOptInUnchanged: false,
        rawVectorExposureDisabled: false,
        rawTextExposureDisabled: false,
        privatePathExposureDisabled: false,
        rawDiagnosticsExposureDisabled: false,
        modelOutputShellExecutionDisabled: false
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Desktop IPC must remain unchanged.",
        "UI behavior must remain unchanged.",
        "Provider visibility must remain unchanged.",
        "Default opt-in must remain unchanged.",
        "Raw vector exposure is blocked.",
        "Raw text exposure is blocked.",
        "Private path exposure is blocked.",
        "Raw diagnostic exposure is blocked.",
        "Retrieval output must not become shell execution."
      ])
    );
  });

  it("reports approval-gate, degraded, and blocked safety observations", () => {
    expect(
      evaluateCoreHostMemoryRetrievalEnvWiringSafety([
        {
          id: "env-plan",
          envWiringPlanObserved: true,
          rollbackPlanObserved: false,
          resultStatus: "ok"
        },
        {
          id: "rollback-plan",
          envWiringPlanObserved: false,
          rollbackPlanObserved: true,
          resultStatus: "ok"
        }
      ])
    ).toMatchObject({
      phase: "8.13",
      status: "approval_gate",
      approvalGateOnly: true,
      envValueRead: false,
      envWiringImplemented: false,
      retrievalPortInjected: false,
      observationCount: 2,
      envWiringPlanCount: 1,
      rollbackPlanCount: 1,
      degradedObservationCount: 0,
      blockedObservationCount: 0,
      reasonCodes: []
    });

    expect(
      evaluateCoreHostMemoryRetrievalEnvWiringSafety([
        {
          id: "smoke-plan-missing",
          envWiringPlanObserved: true,
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
      evaluateCoreHostMemoryRetrievalEnvWiringSafety([
        {
          id: "unsafe",
          envWiringPlanObserved: true,
          rollbackPlanObserved: true,
          resultStatus: "blocked",
          envValueRead: true,
          envWiringObserved: true,
          coreHostDefaultBehaviorObserved: true,
          coreRuntimeConstructorObserved: true,
          retrievalPortObserved: true,
          fixtureQueryVectorResolverObserved: true,
          providerExecutionObserved: true,
          phase743VectorObserved: true,
          realRuntimeVectorObserved: true,
          memoryVectorWriteObserved: true,
          sqliteMigrationObserved: true,
          desktopIpcObserved: true,
          uiBehaviorObserved: true,
          providerVisibilityObserved: true,
          defaultOptInObserved: true,
          rawVectorObserved: true,
          rawTextObserved: true,
          privatePathObserved: true,
          rawDiagnosticsObserved: true,
          shellExecutionObserved: true
        }
      ])
    ).toMatchObject({
      status: "blocked",
      blockedObservationCount: 1,
      reasonCodes: [
        "BLOCKED_OBSERVATION",
        "CORE_HOST_DEFAULT_BEHAVIOR_OBSERVED",
        "CORE_RUNTIME_CONSTRUCTOR_OBSERVED",
        "DEFAULT_OPT_IN_OBSERVED",
        "DESKTOP_IPC_OBSERVED",
        "ENV_VALUE_READ",
        "ENV_WIRING_OBSERVED",
        "FIXTURE_QUERY_VECTOR_RESOLVER_OBSERVED",
        "MEMORY_VECTOR_WRITE_OBSERVED",
        "PHASE_7_43_VECTOR_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "PROVIDER_EXECUTION_OBSERVED",
        "PROVIDER_VISIBILITY_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_TEXT_OBSERVED",
        "RAW_VECTOR_OBSERVED",
        "REAL_RUNTIME_VECTOR_OBSERVED",
        "RETRIEVAL_PORT_OBSERVED",
        "SHELL_EXECUTION_OBSERVED",
        "SQLITE_MIGRATION_OBSERVED",
        "UI_BEHAVIOR_OBSERVED"
      ]
    });

    expect(evaluateCoreHostMemoryRetrievalEnvWiringSafety([])).toMatchObject({
      phase: "8.13",
      status: "blocked",
      observationCount: 0,
      reasonCodes: ["OBSERVATION_COUNT_INVALID"]
    });
  });
});

function approvedInput(): CoreHostMemoryRetrievalEnvWiringApprovalInputFixture {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase811ApprovalGateComplete: true,
    phase812CoreReadRouteComplete: true,
    coreRuntimeOptInRouteAvailable: true,
    envKeyReviewed: true,
    exactCoreHostDiffReviewed: true,
    constructorWiringPlanReviewed: true,
    fixtureOnlyRetrievalPortPlanReviewed: true,
    fixtureQueryVectorResolverPlanReviewed: true,
    defaultDisabledPlanReviewed: true,
    desktopSmokePlanReviewed: true,
    rollbackPlanReviewed: true,
    sanitizedObservationPlanReviewed: true,
    futureImplementationApprovalRequired: true,
    verificationClean: true,
    envValueRead: false,
    envWiringImplemented: false,
    coreHostDefaultBehaviorChanged: false,
    coreRuntimeConstructorChanged: false,
    retrievalPortInjected: false,
    fixtureQueryVectorResolverInjected: false,
    providerExecutionRouted: false,
    phase743VectorsPersisted: false,
    realRuntimeVectorsPersisted: false,
    memoryVectorDataWritten: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    rawVectorsExposed: false,
    rawTextExposed: false,
    privatePathsExposed: false,
    rawDiagnosticsExposed: false,
    modelOutputShellExecutionEnabled: false
  };
}

type CoreHostMemoryRetrievalEnvWiringApprovalInputFixture = Parameters<
  typeof evaluateCoreHostMemoryRetrievalEnvWiringApprovalGate
>[0];
