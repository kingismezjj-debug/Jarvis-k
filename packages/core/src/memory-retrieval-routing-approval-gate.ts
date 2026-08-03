export type CoreMemoryRetrievalRoutingApprovalStatus =
  | "blocked"
  | "ready_for_core_retrieval_routing_implementation_approval";

export interface CoreMemoryRetrievalRoutingApprovalPlan {
  phase: "8.11";
  status: "approval_gate";
  coreRuntimeChanged: false;
  retrievalRoutingImplemented: false;
  providerExecutionRouted: false;
  memoryRepositoryContractChanged: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  phase743VectorsPersisted: false;
  realRuntimeVectorsPersisted: false;
  plannedOptInGate: "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING";
  plannedCoreSurfaces: readonly string[];
  plannedInjectedPorts: readonly string[];
  plannedRecallPayload: {
    includesMatchIds: true;
    includesScores: true;
    includesSourceMetadata: true;
    includesRawVectors: false;
    includesRawText: false;
    includesPrivatePaths: false;
    includesRawDiagnostics: false;
  };
  plannedFallbackModes: readonly string[];
  plannedSafetyConstraints: {
    requiresSeparateImplementationApproval: true;
    requiresExplicitOptIn: true;
    requiresFixtureOnlyExecution: true;
    requiresProviderNeutralPort: true;
    requiresFailClosedDegradedMode: true;
    providerExecutionRoutingAllowed: false;
    phase743VectorPersistenceAllowed: false;
    realRuntimeVectorPersistenceAllowed: false;
    desktopIpcChangeAllowed: false;
    uiBehaviorChangeAllowed: false;
    modelOutputShellExecutionEnabled: false;
  };
}

export interface CoreMemoryRetrievalRoutingApprovalInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase810ReadyForCoreRoutingApproval?: boolean;
  providerNeutralRetrievalPortReviewed?: boolean;
  coreTurnAssemblyPlanReviewed?: boolean;
  explicitOptInGateReviewed?: boolean;
  sanitizedRecallPayloadReviewed?: boolean;
  boundedRecallResultReviewed?: boolean;
  fixtureOnlyRoutingTestPlanReviewed?: boolean;
  degradedFailClosedPlanReviewed?: boolean;
  fixtureFallbackPlanReviewed?: boolean;
  rollbackPlanReviewed?: boolean;
  productPathNoBehaviorChangeReviewed?: boolean;
  coreRuntimeChanged?: boolean;
  retrievalRoutingImplemented?: boolean;
  providerExecutionRouted?: boolean;
  memoryRepositoryContractChanged?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  defaultOptInChanged?: boolean;
  phase743VectorsPersisted?: boolean;
  realRuntimeVectorsPersisted?: boolean;
  rawVectorsExposed?: boolean;
  rawTextExposed?: boolean;
  privatePathsExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface CoreMemoryRetrievalRoutingApprovalChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase810ReadyForCoreRoutingApproval: boolean;
  providerNeutralRetrievalPortReviewed: boolean;
  coreTurnAssemblyPlanReviewed: boolean;
  explicitOptInGateReviewed: boolean;
  sanitizedRecallPayloadReviewed: boolean;
  boundedRecallResultReviewed: boolean;
  fixtureOnlyRoutingTestPlanReviewed: boolean;
  degradedFailClosedPlanReviewed: boolean;
  fixtureFallbackPlanReviewed: boolean;
  rollbackPlanReviewed: boolean;
  productPathNoBehaviorChangeReviewed: boolean;
  coreRuntimeUnchanged: boolean;
  retrievalRoutingNotImplemented: boolean;
  providerExecutionNotRouted: boolean;
  memoryRepositoryContractUnchanged: boolean;
  desktopIpcUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  defaultOptInUnchanged: boolean;
  phase743VectorsNotPersisted: boolean;
  realRuntimeVectorsNotPersisted: boolean;
  rawVectorExposureDisabled: boolean;
  rawTextExposureDisabled: boolean;
  privatePathExposureDisabled: boolean;
  rawDiagnosticsExposureDisabled: boolean;
  modelOutputShellExecutionDisabled: boolean;
  verificationClean: boolean;
}

export interface CoreMemoryRetrievalRoutingApprovalResult {
  phase: "8.11";
  capability: "core_memory_retrieval_read_routing";
  status: CoreMemoryRetrievalRoutingApprovalStatus;
  accepted: boolean;
  readyForImplementationApproval: boolean;
  coreRuntimeChanged: false;
  retrievalRoutingImplemented: false;
  providerExecutionRouted: false;
  memoryRepositoryContractChanged: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  phase743VectorsPersisted: false;
  realRuntimeVectorsPersisted: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  checks: CoreMemoryRetrievalRoutingApprovalChecks;
  reasons: string[];
}

export interface CoreMemoryRetrievalRoutingSafetyObservation {
  id: string;
  gateReviewed: boolean;
  fallbackReviewed: boolean;
  resultStatus: "ok" | "degraded" | "blocked";
  coreRuntimeChanged?: boolean;
  retrievalRoutingObserved?: boolean;
  providerExecutionObserved?: boolean;
  memoryRepositoryContractObserved?: boolean;
  desktopIpcObserved?: boolean;
  uiBehaviorObserved?: boolean;
  providerVisibilityObserved?: boolean;
  defaultOptInObserved?: boolean;
  phase743VectorObserved?: boolean;
  realRuntimeVectorObserved?: boolean;
  rawVectorObserved?: boolean;
  rawTextObserved?: boolean;
  privatePathObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  shellExecutionObserved?: boolean;
}

export interface CoreMemoryRetrievalRoutingSafetyReport {
  phase: "8.11";
  status: "approval_gate" | "degraded" | "blocked";
  fixtureOnly: true;
  coreRuntimeChanged: false;
  retrievalRoutingImplemented: false;
  providerExecutionRouted: false;
  memoryRepositoryContractChanged: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  phase743VectorsPersisted: false;
  realRuntimeVectorsPersisted: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  observationCount: number;
  gateReviewCount: number;
  fallbackReviewCount: number;
  degradedObservationCount: number;
  blockedObservationCount: number;
  reasonCodes: string[];
}

export function createCoreMemoryRetrievalRoutingApprovalPlan(): CoreMemoryRetrievalRoutingApprovalPlan {
  return {
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
    plannedCoreSurfaces: [
      "Core turn assembly before assistant response generation",
      "bounded recall metadata injection",
      "sanitized recall observation",
      "degraded response path when retrieval is unavailable"
    ],
    plannedInjectedPorts: [
      "EmbeddingMemoryRetrievalPort",
      "EmbeddingInferenceProvider lookup remains out of scope",
      "MemoryRepository remains unchanged"
    ],
    plannedRecallPayload: {
      includesMatchIds: true,
      includesScores: true,
      includesSourceMetadata: true,
      includesRawVectors: false,
      includesRawText: false,
      includesPrivatePaths: false,
      includesRawDiagnostics: false
    },
    plannedFallbackModes: [
      "disabled_without_opt_in",
      "fixture_only_retrieval",
      "degraded_without_recall",
      "blocked_without_implementation_approval"
    ],
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
  };
}

export function evaluateCoreMemoryRetrievalRoutingApproval(
  input: CoreMemoryRetrievalRoutingApprovalInput = {}
): CoreMemoryRetrievalRoutingApprovalResult {
  const checks: CoreMemoryRetrievalRoutingApprovalChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase810ReadyForCoreRoutingApproval:
      input.phase810ReadyForCoreRoutingApproval === true,
    providerNeutralRetrievalPortReviewed:
      input.providerNeutralRetrievalPortReviewed === true,
    coreTurnAssemblyPlanReviewed:
      input.coreTurnAssemblyPlanReviewed === true,
    explicitOptInGateReviewed: input.explicitOptInGateReviewed === true,
    sanitizedRecallPayloadReviewed:
      input.sanitizedRecallPayloadReviewed === true,
    boundedRecallResultReviewed: input.boundedRecallResultReviewed === true,
    fixtureOnlyRoutingTestPlanReviewed:
      input.fixtureOnlyRoutingTestPlanReviewed === true,
    degradedFailClosedPlanReviewed:
      input.degradedFailClosedPlanReviewed === true,
    fixtureFallbackPlanReviewed: input.fixtureFallbackPlanReviewed === true,
    rollbackPlanReviewed: input.rollbackPlanReviewed === true,
    productPathNoBehaviorChangeReviewed:
      input.productPathNoBehaviorChangeReviewed === true,
    coreRuntimeUnchanged: input.coreRuntimeChanged === false,
    retrievalRoutingNotImplemented:
      input.retrievalRoutingImplemented === false,
    providerExecutionNotRouted: input.providerExecutionRouted === false,
    memoryRepositoryContractUnchanged:
      input.memoryRepositoryContractChanged === false,
    desktopIpcUnchanged: input.desktopIpcChanged === false,
    uiBehaviorUnchanged: input.uiBehaviorChanged === false,
    providerVisibilityUnchanged: input.providerVisibilityChanged === false,
    defaultOptInUnchanged: input.defaultOptInChanged === false,
    phase743VectorsNotPersisted: input.phase743VectorsPersisted === false,
    realRuntimeVectorsNotPersisted:
      input.realRuntimeVectorsPersisted === false,
    rawVectorExposureDisabled: input.rawVectorsExposed === false,
    rawTextExposureDisabled: input.rawTextExposed === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    modelOutputShellExecutionDisabled:
      input.modelOutputShellExecutionEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    phase: "8.11",
    capability: "core_memory_retrieval_read_routing",
    status: accepted
      ? "ready_for_core_retrieval_routing_implementation_approval"
      : "blocked",
    accepted,
    readyForImplementationApproval: accepted,
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
    checks,
    reasons: createCoreMemoryRetrievalRoutingApprovalReasons(checks)
  };
}

export function evaluateCoreMemoryRetrievalRoutingSafety(
  observations: readonly CoreMemoryRetrievalRoutingSafetyObservation[]
): CoreMemoryRetrievalRoutingSafetyReport {
  if (observations.length < 1 || observations.length > 100) {
    return createCoreMemoryRetrievalRoutingSafetyReport(
      [],
      ["OBSERVATION_COUNT_INVALID"]
    );
  }

  const reasonCodes =
    createCoreMemoryRetrievalRoutingSafetyReasons(observations);
  const degradedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "degraded"
  ).length;
  const blockedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "blocked"
  ).length;

  return createCoreMemoryRetrievalRoutingSafetyReport(
    observations,
    reasonCodes,
    degradedObservationCount,
    blockedObservationCount
  );
}

function createCoreMemoryRetrievalRoutingApprovalReasons(
  checks: CoreMemoryRetrievalRoutingApprovalChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.11.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.11.");
  }
  if (!checks.phase810ReadyForCoreRoutingApproval) {
    reasons.push("Phase 8.10 must be ready for Core routing approval.");
  }
  if (!checks.providerNeutralRetrievalPortReviewed) {
    reasons.push("Provider-neutral retrieval port review is required.");
  }
  if (!checks.coreTurnAssemblyPlanReviewed) {
    reasons.push("Core turn assembly plan review is required.");
  }
  if (!checks.explicitOptInGateReviewed) {
    reasons.push("Explicit opt-in gate review is required.");
  }
  if (!checks.sanitizedRecallPayloadReviewed) {
    reasons.push("Sanitized recall payload review is required.");
  }
  if (!checks.boundedRecallResultReviewed) {
    reasons.push("Bounded recall result review is required.");
  }
  if (!checks.fixtureOnlyRoutingTestPlanReviewed) {
    reasons.push("Fixture-only Core routing test plan is required.");
  }
  if (!checks.degradedFailClosedPlanReviewed) {
    reasons.push("Degraded fail-closed plan review is required.");
  }
  if (!checks.fixtureFallbackPlanReviewed) {
    reasons.push("Fixture fallback plan review is required.");
  }
  if (!checks.rollbackPlanReviewed) {
    reasons.push("Rollback plan review is required.");
  }
  if (!checks.productPathNoBehaviorChangeReviewed) {
    reasons.push("Product path no-behavior-change review is required.");
  }
  if (!checks.coreRuntimeUnchanged) {
    reasons.push("Core runtime behavior must remain unchanged.");
  }
  if (!checks.retrievalRoutingNotImplemented) {
    reasons.push("Retrieval routing implementation is blocked.");
  }
  if (!checks.providerExecutionNotRouted) {
    reasons.push("Provider execution routing is blocked.");
  }
  if (!checks.memoryRepositoryContractUnchanged) {
    reasons.push("Memory repository contract must remain unchanged.");
  }
  if (!checks.desktopIpcUnchanged) {
    reasons.push("Desktop IPC must remain unchanged.");
  }
  if (!checks.uiBehaviorUnchanged) {
    reasons.push("UI behavior must remain unchanged.");
  }
  if (!checks.providerVisibilityUnchanged) {
    reasons.push("Provider visibility must remain unchanged.");
  }
  if (!checks.defaultOptInUnchanged) {
    reasons.push("Default opt-in must remain unchanged.");
  }
  if (!checks.phase743VectorsNotPersisted) {
    reasons.push("Phase 7.43 runtime vectors must not be persisted.");
  }
  if (!checks.realRuntimeVectorsNotPersisted) {
    reasons.push("Real runtime vectors must not be persisted.");
  }
  if (!checks.rawVectorExposureDisabled) {
    reasons.push("Raw vector exposure is blocked.");
  }
  if (!checks.rawTextExposureDisabled) {
    reasons.push("Raw text exposure is blocked.");
  }
  if (!checks.privatePathExposureDisabled) {
    reasons.push("Private path exposure is blocked.");
  }
  if (!checks.rawDiagnosticsExposureDisabled) {
    reasons.push("Raw diagnostic exposure is blocked.");
  }
  if (!checks.modelOutputShellExecutionDisabled) {
    reasons.push("Retrieval output must not become shell execution.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates must be clean.");
  }

  return reasons;
}

function createCoreMemoryRetrievalRoutingSafetyReport(
  observations: readonly CoreMemoryRetrievalRoutingSafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0,
  blockedObservationCount = 0
): CoreMemoryRetrievalRoutingSafetyReport {
  const blocked = reasonCodes.length > 0;

  return {
    phase: "8.11",
    status: blocked
      ? "blocked"
      : degradedObservationCount > 0
        ? "degraded"
        : "approval_gate",
    fixtureOnly: true,
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
    observationCount: observations.length,
    gateReviewCount: observations.filter(
      (observation) => observation.gateReviewed
    ).length,
    fallbackReviewCount: observations.filter(
      (observation) => observation.fallbackReviewed
    ).length,
    degradedObservationCount,
    blockedObservationCount,
    reasonCodes
  };
}

function createCoreMemoryRetrievalRoutingSafetyReasons(
  observations: readonly CoreMemoryRetrievalRoutingSafetyObservation[]
): string[] {
  const reasons = new Set<string>();

  for (const observation of observations) {
    if (observation.resultStatus === "blocked") {
      reasons.add("BLOCKED_OBSERVATION");
    }
    if (observation.coreRuntimeChanged) {
      reasons.add("CORE_RUNTIME_CHANGED");
    }
    if (observation.retrievalRoutingObserved) {
      reasons.add("RETRIEVAL_ROUTING_OBSERVED");
    }
    if (observation.providerExecutionObserved) {
      reasons.add("PROVIDER_EXECUTION_OBSERVED");
    }
    if (observation.memoryRepositoryContractObserved) {
      reasons.add("MEMORY_REPOSITORY_CONTRACT_OBSERVED");
    }
    if (observation.desktopIpcObserved) {
      reasons.add("DESKTOP_IPC_OBSERVED");
    }
    if (observation.uiBehaviorObserved) {
      reasons.add("UI_BEHAVIOR_OBSERVED");
    }
    if (observation.providerVisibilityObserved) {
      reasons.add("PROVIDER_VISIBILITY_OBSERVED");
    }
    if (observation.defaultOptInObserved) {
      reasons.add("DEFAULT_OPT_IN_OBSERVED");
    }
    if (observation.phase743VectorObserved) {
      reasons.add("PHASE_7_43_VECTOR_OBSERVED");
    }
    if (observation.realRuntimeVectorObserved) {
      reasons.add("REAL_RUNTIME_VECTOR_OBSERVED");
    }
    if (observation.rawVectorObserved) {
      reasons.add("RAW_VECTOR_OBSERVED");
    }
    if (observation.rawTextObserved) {
      reasons.add("RAW_TEXT_OBSERVED");
    }
    if (observation.privatePathObserved) {
      reasons.add("PRIVATE_PATH_OBSERVED");
    }
    if (observation.rawDiagnosticsObserved) {
      reasons.add("RAW_DIAGNOSTICS_OBSERVED");
    }
    if (observation.shellExecutionObserved) {
      reasons.add("SHELL_EXECUTION_OBSERVED");
    }
  }

  return [...reasons].sort();
}
