export type EmbeddingMemoryRetrievalRoutingPreflightStatus =
  | "blocked"
  | "ready_for_core_routing_approval";

export interface EmbeddingMemoryRetrievalRoutingImplementationPlan {
  phase: "8.10";
  status: "review_only";
  routingImplemented: false;
  coreRetrievalChanged: false;
  providerExecutionChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  fixtureFallbackPreserved: true;
  vectorQueryApiAvailable: true;
  vectorWriteApiAvailable: true;
  memoryRepositoryChanged: false;
  plannedRoutingSurfaces: readonly string[];
  plannedRoutingGuards: readonly string[];
  plannedFallbackModes: readonly string[];
  plannedSafetyConstraints: {
    requiresSeparateCoreRoutingApproval: true;
    requiresNoPhase743VectorPersistence: true;
    requiresNoRealRuntimeVectorPersistence: true;
    requiresNoProviderExecutionRouting: true;
    requiresNoUIBehaviorChange: true;
    requiresNoProviderVisibilityChange: true;
    rawVectorsExposed: false;
    rawTextExposed: false;
    privatePathsExposed: false;
    rawDiagnosticsExposed: false;
    modelOutputShellExecutionEnabled: false;
  };
}

export interface EmbeddingMemoryRetrievalRoutingPreflightInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase87FixtureWriteApiComplete?: boolean;
  phase89FixtureQueryApiComplete?: boolean;
  providerNeutralRoutingPortReviewed?: boolean;
  coreRoutingPlanReviewed?: boolean;
  fallbackPlanReviewed?: boolean;
  sanitizedRecallInjectionPlanReviewed?: boolean;
  boundedResultPlanReviewed?: boolean;
  fixtureOnlyRoutingTestsPresent?: boolean;
  productPathCommandReviewCompleted?: boolean;
  vectorQueryApiAvailable?: boolean;
  vectorWriteApiAvailable?: boolean;
  coreRetrievalChanged?: boolean;
  providerExecutionChanged?: boolean;
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

export interface EmbeddingMemoryRetrievalRoutingPreflightChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase87FixtureWriteApiComplete: boolean;
  phase89FixtureQueryApiComplete: boolean;
  providerNeutralRoutingPortReviewed: boolean;
  coreRoutingPlanReviewed: boolean;
  fallbackPlanReviewed: boolean;
  sanitizedRecallInjectionPlanReviewed: boolean;
  boundedResultPlanReviewed: boolean;
  fixtureOnlyRoutingTestsPresent: boolean;
  productPathCommandReviewCompleted: boolean;
  vectorQueryApiAvailable: boolean;
  vectorWriteApiAvailable: boolean;
  coreRetrievalUnchanged: boolean;
  providerExecutionUnchanged: boolean;
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

export interface EmbeddingMemoryRetrievalRoutingPreflightResult {
  phase: "8.10";
  capability: "embedding_memory_retrieval_routing";
  status: EmbeddingMemoryRetrievalRoutingPreflightStatus;
  accepted: boolean;
  readyForCoreRoutingApproval: boolean;
  routingImplemented: false;
  coreRetrievalChanged: false;
  providerExecutionChanged: false;
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
  checks: EmbeddingMemoryRetrievalRoutingPreflightChecks;
  reasons: string[];
}

export interface EmbeddingMemoryRetrievalRoutingSafetyObservation {
  id: string;
  routingPlanObserved: boolean;
  fallbackObserved: boolean;
  resultStatus: "ok" | "degraded" | "blocked";
  routingImplemented?: boolean;
  coreRetrievalObserved?: boolean;
  providerExecutionObserved?: boolean;
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

export interface EmbeddingMemoryRetrievalRoutingSafetyReport {
  phase: "8.10";
  status: "review_only" | "degraded" | "blocked";
  fixtureOnly: true;
  routingImplemented: false;
  coreRetrievalChanged: false;
  providerExecutionChanged: false;
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
  routingPlanCount: number;
  fallbackCount: number;
  blockedObservationCount: number;
  reasonCodes: string[];
}

export function createEmbeddingMemoryRetrievalRoutingImplementationPlan(): EmbeddingMemoryRetrievalRoutingImplementationPlan {
  return {
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
    plannedRoutingSurfaces: [
      "Core runtime memory recall injection",
      "message turn assembly",
      "provider-neutral retrieval port",
      "fixture fallback routing",
      "sanitized recall observation"
    ],
    plannedRoutingGuards: [
      "Route only through an explicit Core opt-in.",
      "Keep fixture fallback as the default recovery path.",
      "Use bounded query metadata only.",
      "Never route raw vectors, raw text, or private paths.",
      "Reject provider execution or UI visibility changes."
    ],
    plannedFallbackModes: [
      "fixture_only",
      "degraded_without_routing",
      "blocked_without_approval"
    ],
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
  };
}

export function evaluateEmbeddingMemoryRetrievalRoutingPreflight(
  input: EmbeddingMemoryRetrievalRoutingPreflightInput = {}
): EmbeddingMemoryRetrievalRoutingPreflightResult {
  const checks: EmbeddingMemoryRetrievalRoutingPreflightChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase87FixtureWriteApiComplete:
      input.phase87FixtureWriteApiComplete === true,
    phase89FixtureQueryApiComplete:
      input.phase89FixtureQueryApiComplete === true,
    providerNeutralRoutingPortReviewed:
      input.providerNeutralRoutingPortReviewed === true,
    coreRoutingPlanReviewed: input.coreRoutingPlanReviewed === true,
    fallbackPlanReviewed: input.fallbackPlanReviewed === true,
    sanitizedRecallInjectionPlanReviewed:
      input.sanitizedRecallInjectionPlanReviewed === true,
    boundedResultPlanReviewed: input.boundedResultPlanReviewed === true,
    fixtureOnlyRoutingTestsPresent:
      input.fixtureOnlyRoutingTestsPresent === true,
    productPathCommandReviewCompleted:
      input.productPathCommandReviewCompleted === true,
    vectorQueryApiAvailable: input.vectorQueryApiAvailable === true,
    vectorWriteApiAvailable: input.vectorWriteApiAvailable === true,
    coreRetrievalUnchanged: input.coreRetrievalChanged === false,
    providerExecutionUnchanged: input.providerExecutionChanged === false,
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
    phase: "8.10",
    capability: "embedding_memory_retrieval_routing",
    status: accepted ? "ready_for_core_routing_approval" : "blocked",
    accepted,
    readyForCoreRoutingApproval: accepted,
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
    checks,
    reasons: createEmbeddingMemoryRetrievalRoutingReasons(checks)
  };
}

export function evaluateEmbeddingMemoryRetrievalRoutingSafety(
  observations: readonly EmbeddingMemoryRetrievalRoutingSafetyObservation[]
): EmbeddingMemoryRetrievalRoutingSafetyReport {
  if (observations.length < 1 || observations.length > 100) {
    return createEmbeddingMemoryRetrievalRoutingSafetyReport(
      [],
      ["OBSERVATION_COUNT_INVALID"]
    );
  }

  const reasonCodes = createEmbeddingMemoryRetrievalRoutingSafetyReasons(
    observations
  );
  const blockedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "blocked"
  ).length;

  return createEmbeddingMemoryRetrievalRoutingSafetyReport(
    observations,
    reasonCodes,
    blockedObservationCount
  );
}

function createEmbeddingMemoryRetrievalRoutingReasons(
  checks: EmbeddingMemoryRetrievalRoutingPreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.10 preflight.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.10 preflight.");
  }
  if (!checks.phase87FixtureWriteApiComplete) {
    reasons.push("Phase 8.7 fixture write API must be complete.");
  }
  if (!checks.phase89FixtureQueryApiComplete) {
    reasons.push("Phase 8.9 fixture query API must be complete.");
  }
  if (!checks.providerNeutralRoutingPortReviewed) {
    reasons.push("Provider-neutral routing port is not reviewed.");
  }
  if (!checks.coreRoutingPlanReviewed) {
    reasons.push("Core retrieval routing plan is not reviewed.");
  }
  if (!checks.fallbackPlanReviewed) {
    reasons.push("Fixture fallback plan is not reviewed.");
  }
  if (!checks.sanitizedRecallInjectionPlanReviewed) {
    reasons.push("Sanitized recall injection plan is not reviewed.");
  }
  if (!checks.boundedResultPlanReviewed) {
    reasons.push("Bounded recall result plan is not reviewed.");
  }
  if (!checks.fixtureOnlyRoutingTestsPresent) {
    reasons.push("Fixture-only routing tests are required.");
  }
  if (!checks.productPathCommandReviewCompleted) {
    reasons.push("Product path command review is not completed.");
  }
  if (!checks.vectorQueryApiAvailable) {
    reasons.push("Vector query API must be available for routing review.");
  }
  if (!checks.vectorWriteApiAvailable) {
    reasons.push("Vector write API must be available for routing review.");
  }
  if (!checks.coreRetrievalUnchanged) {
    reasons.push("Core retrieval behavior must remain unchanged.");
  }
  if (!checks.providerExecutionUnchanged) {
    reasons.push("Provider execution behavior must remain unchanged.");
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

function createEmbeddingMemoryRetrievalRoutingSafetyReport(
  observations: readonly EmbeddingMemoryRetrievalRoutingSafetyObservation[],
  reasonCodes: string[],
  blockedObservationCount = 0
): EmbeddingMemoryRetrievalRoutingSafetyReport {
  const blocked = reasonCodes.length > 0;

  return {
    phase: "8.10",
    status: blocked
      ? "blocked"
      : blockedObservationCount > 0
        ? "degraded"
        : "review_only",
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
    observationCount: observations.length,
    routingPlanCount: observations.filter(
      (observation) => observation.routingPlanObserved
    ).length,
    fallbackCount: observations.filter((observation) => observation.fallbackObserved)
      .length,
    blockedObservationCount,
    reasonCodes
  };
}

function createEmbeddingMemoryRetrievalRoutingSafetyReasons(
  observations: readonly EmbeddingMemoryRetrievalRoutingSafetyObservation[]
): string[] {
  const reasons = new Set<string>();

  for (const observation of observations) {
    if (observation.resultStatus === "blocked") {
      reasons.add("BLOCKED_OBSERVATION");
    }
    if (observation.routingImplemented) {
      reasons.add("ROUTING_IMPLEMENTED");
    }
    if (observation.coreRetrievalObserved) {
      reasons.add("CORE_RETRIEVAL_OBSERVED");
    }
    if (observation.providerExecutionObserved) {
      reasons.add("PROVIDER_EXECUTION_OBSERVED");
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
