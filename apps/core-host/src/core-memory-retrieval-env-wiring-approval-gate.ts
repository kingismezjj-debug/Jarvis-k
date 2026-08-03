export const MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV =
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING";

export type CoreHostMemoryRetrievalEnvWiringApprovalStatus =
  | "blocked"
  | "degraded"
  | "ready_for_env_wiring_implementation_approval";

export interface CoreHostMemoryRetrievalEnvWiringApprovalInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase811ApprovalGateComplete?: boolean;
  phase812CoreReadRouteComplete?: boolean;
  coreRuntimeOptInRouteAvailable?: boolean;
  envKeyReviewed?: boolean;
  exactCoreHostDiffReviewed?: boolean;
  constructorWiringPlanReviewed?: boolean;
  fixtureOnlyRetrievalPortPlanReviewed?: boolean;
  fixtureQueryVectorResolverPlanReviewed?: boolean;
  defaultDisabledPlanReviewed?: boolean;
  desktopSmokePlanReviewed?: boolean;
  rollbackPlanReviewed?: boolean;
  sanitizedObservationPlanReviewed?: boolean;
  futureImplementationApprovalRequired?: boolean;
  verificationClean?: boolean;
  envValueRead?: boolean;
  envWiringImplemented?: boolean;
  coreHostDefaultBehaviorChanged?: boolean;
  coreRuntimeConstructorChanged?: boolean;
  retrievalPortInjected?: boolean;
  fixtureQueryVectorResolverInjected?: boolean;
  providerExecutionRouted?: boolean;
  phase743VectorsPersisted?: boolean;
  realRuntimeVectorsPersisted?: boolean;
  memoryVectorDataWritten?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  defaultOptInChanged?: boolean;
  rawVectorsExposed?: boolean;
  rawTextExposed?: boolean;
  privatePathsExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface CoreHostMemoryRetrievalEnvWiringApprovalChecks {
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  phase811ApprovalGateComplete: boolean;
  phase812CoreReadRouteComplete: boolean;
  coreRuntimeOptInRouteAvailable: boolean;
  envKeyReviewed: boolean;
  exactCoreHostDiffReviewed: boolean;
  constructorWiringPlanReviewed: boolean;
  fixtureOnlyRetrievalPortPlanReviewed: boolean;
  fixtureQueryVectorResolverPlanReviewed: boolean;
  defaultDisabledPlanReviewed: boolean;
  desktopSmokePlanReviewed: boolean;
  rollbackPlanReviewed: boolean;
  sanitizedObservationPlanReviewed: boolean;
  futureImplementationApprovalRequired: boolean;
  envValueNotRead: boolean;
  envWiringNotImplemented: boolean;
  coreHostDefaultBehaviorUnchanged: boolean;
  coreRuntimeConstructorUnchanged: boolean;
  retrievalPortNotInjected: boolean;
  fixtureQueryVectorResolverNotInjected: boolean;
  providerExecutionNotRouted: boolean;
  phase743VectorsNotPersisted: boolean;
  realRuntimeVectorsNotPersisted: boolean;
  memoryVectorDataNotWritten: boolean;
  sqliteSchemaMigrationDisabled: boolean;
  desktopIpcUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  defaultOptInUnchanged: boolean;
  rawVectorExposureDisabled: boolean;
  rawTextExposureDisabled: boolean;
  privatePathExposureDisabled: boolean;
  rawDiagnosticsExposureDisabled: boolean;
  modelOutputShellExecutionDisabled: boolean;
  verificationClean: boolean;
}

export interface CoreHostMemoryRetrievalEnvWiringApprovalResult {
  phase: "8.13";
  capability: "core_host_memory_retrieval_env_wiring";
  envKey: typeof MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV;
  status: CoreHostMemoryRetrievalEnvWiringApprovalStatus;
  accepted: boolean;
  readyForEnvWiringImplementationApproval: boolean;
  approvalGateOnly: true;
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  futureImplementationApprovalRequired: true;
  envValueRead: false;
  envWiringImplemented: false;
  coreHostDefaultBehaviorChanged: false;
  coreRuntimeConstructorChanged: false;
  retrievalPortInjected: false;
  fixtureQueryVectorResolverInjected: false;
  providerExecutionRouted: false;
  phase743VectorsPersisted: false;
  realRuntimeVectorsPersisted: false;
  memoryVectorDataWritten: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  reviewedAreas: string[];
  checks: CoreHostMemoryRetrievalEnvWiringApprovalChecks;
  reasons: string[];
}

export interface CoreHostMemoryRetrievalEnvWiringSafetyObservation {
  id: string;
  envWiringPlanObserved: boolean;
  rollbackPlanObserved: boolean;
  resultStatus: "ok" | "degraded" | "blocked";
  envValueRead?: boolean;
  envWiringObserved?: boolean;
  coreHostDefaultBehaviorObserved?: boolean;
  coreRuntimeConstructorObserved?: boolean;
  retrievalPortObserved?: boolean;
  fixtureQueryVectorResolverObserved?: boolean;
  providerExecutionObserved?: boolean;
  phase743VectorObserved?: boolean;
  realRuntimeVectorObserved?: boolean;
  memoryVectorWriteObserved?: boolean;
  sqliteMigrationObserved?: boolean;
  desktopIpcObserved?: boolean;
  uiBehaviorObserved?: boolean;
  providerVisibilityObserved?: boolean;
  defaultOptInObserved?: boolean;
  rawVectorObserved?: boolean;
  rawTextObserved?: boolean;
  privatePathObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  shellExecutionObserved?: boolean;
}

export interface CoreHostMemoryRetrievalEnvWiringSafetyReport {
  phase: "8.13";
  status: "approval_gate" | "degraded" | "blocked";
  approvalGateOnly: true;
  envValueRead: false;
  envWiringImplemented: false;
  retrievalPortInjected: false;
  providerExecutionRouted: false;
  memoryVectorDataWritten: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  observationCount: number;
  envWiringPlanCount: number;
  rollbackPlanCount: number;
  degradedObservationCount: number;
  blockedObservationCount: number;
  reasonCodes: string[];
}

export function evaluateCoreHostMemoryRetrievalEnvWiringApprovalGate(
  input: CoreHostMemoryRetrievalEnvWiringApprovalInput = {}
): CoreHostMemoryRetrievalEnvWiringApprovalResult {
  const checks: CoreHostMemoryRetrievalEnvWiringApprovalChecks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    phase811ApprovalGateComplete:
      input.phase811ApprovalGateComplete === true,
    phase812CoreReadRouteComplete:
      input.phase812CoreReadRouteComplete === true,
    coreRuntimeOptInRouteAvailable:
      input.coreRuntimeOptInRouteAvailable === true,
    envKeyReviewed: input.envKeyReviewed === true,
    exactCoreHostDiffReviewed: input.exactCoreHostDiffReviewed === true,
    constructorWiringPlanReviewed:
      input.constructorWiringPlanReviewed === true,
    fixtureOnlyRetrievalPortPlanReviewed:
      input.fixtureOnlyRetrievalPortPlanReviewed === true,
    fixtureQueryVectorResolverPlanReviewed:
      input.fixtureQueryVectorResolverPlanReviewed === true,
    defaultDisabledPlanReviewed: input.defaultDisabledPlanReviewed === true,
    desktopSmokePlanReviewed: input.desktopSmokePlanReviewed === true,
    rollbackPlanReviewed: input.rollbackPlanReviewed === true,
    sanitizedObservationPlanReviewed:
      input.sanitizedObservationPlanReviewed === true,
    futureImplementationApprovalRequired:
      input.futureImplementationApprovalRequired === true,
    envValueNotRead: input.envValueRead === false,
    envWiringNotImplemented: input.envWiringImplemented === false,
    coreHostDefaultBehaviorUnchanged:
      input.coreHostDefaultBehaviorChanged === false,
    coreRuntimeConstructorUnchanged:
      input.coreRuntimeConstructorChanged === false,
    retrievalPortNotInjected: input.retrievalPortInjected === false,
    fixtureQueryVectorResolverNotInjected:
      input.fixtureQueryVectorResolverInjected === false,
    providerExecutionNotRouted: input.providerExecutionRouted === false,
    phase743VectorsNotPersisted: input.phase743VectorsPersisted === false,
    realRuntimeVectorsNotPersisted:
      input.realRuntimeVectorsPersisted === false,
    memoryVectorDataNotWritten: input.memoryVectorDataWritten === false,
    sqliteSchemaMigrationDisabled:
      input.sqliteSchemaMigrationEnabled === false,
    desktopIpcUnchanged: input.desktopIpcChanged === false,
    uiBehaviorUnchanged: input.uiBehaviorChanged === false,
    providerVisibilityUnchanged: input.providerVisibilityChanged === false,
    defaultOptInUnchanged: input.defaultOptInChanged === false,
    rawVectorExposureDisabled: input.rawVectorsExposed === false,
    rawTextExposureDisabled: input.rawTextExposed === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    modelOutputShellExecutionDisabled:
      input.modelOutputShellExecutionEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const blockingReasons =
    createCoreHostMemoryRetrievalEnvWiringBlockingReasons(checks);
  const evidenceReasons =
    createCoreHostMemoryRetrievalEnvWiringEvidenceReasons(checks);
  const accepted = blockingReasons.length === 0 && evidenceReasons.length === 0;

  return {
    phase: "8.13",
    capability: "core_host_memory_retrieval_env_wiring",
    envKey: MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV,
    status: accepted
      ? "ready_for_env_wiring_implementation_approval"
      : blockingReasons.length > 0
        ? "blocked"
        : "degraded",
    accepted,
    readyForEnvWiringImplementationApproval: accepted,
    approvalGateOnly: true,
    productApprovalGranted: checks.productApprovalGranted,
    securityApprovalGranted: checks.securityApprovalGranted,
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
    reviewedAreas: accepted
      ? [
          "memory_retrieval_env_key",
          "exact_core_host_diff",
          "core_runtime_constructor_wiring_plan",
          "fixture_only_retrieval_port_plan",
          "fixture_query_vector_resolver_plan",
          "default_disabled_behavior",
          "desktop_smoke_plan",
          "rollback_plan",
          "sanitized_recall_observation"
        ]
      : [],
    checks,
    reasons: accepted
      ? [
          "Core Host Memory retrieval env wiring gate is ready for separate implementation approval."
        ]
      : [...evidenceReasons, ...blockingReasons]
  };
}

export function evaluateCoreHostMemoryRetrievalEnvWiringSafety(
  observations: readonly CoreHostMemoryRetrievalEnvWiringSafetyObservation[]
): CoreHostMemoryRetrievalEnvWiringSafetyReport {
  if (observations.length < 1 || observations.length > 100) {
    return createCoreHostMemoryRetrievalEnvWiringSafetyReport(
      [],
      ["OBSERVATION_COUNT_INVALID"]
    );
  }

  const reasonCodes =
    createCoreHostMemoryRetrievalEnvWiringSafetyReasons(observations);
  const degradedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "degraded"
  ).length;
  const blockedObservationCount = observations.filter(
    (observation) => observation.resultStatus === "blocked"
  ).length;

  return createCoreHostMemoryRetrievalEnvWiringSafetyReport(
    observations,
    reasonCodes,
    degradedObservationCount,
    blockedObservationCount
  );
}

function createCoreHostMemoryRetrievalEnvWiringEvidenceReasons(
  checks: CoreHostMemoryRetrievalEnvWiringApprovalChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.13.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.13.");
  }
  if (!checks.phase811ApprovalGateComplete) {
    reasons.push("Phase 8.11 approval gate must be complete.");
  }
  if (!checks.phase812CoreReadRouteComplete) {
    reasons.push("Phase 8.12 Core read route must be complete.");
  }
  if (!checks.coreRuntimeOptInRouteAvailable) {
    reasons.push("CoreRuntime opt-in read route must be available.");
  }
  if (!checks.envKeyReviewed) {
    reasons.push("Memory retrieval env key review is required.");
  }
  if (!checks.exactCoreHostDiffReviewed) {
    reasons.push("Exact Core Host env wiring diff review is required.");
  }
  if (!checks.constructorWiringPlanReviewed) {
    reasons.push("CoreRuntime constructor wiring plan review is required.");
  }
  if (!checks.fixtureOnlyRetrievalPortPlanReviewed) {
    reasons.push("Fixture-only retrieval port plan review is required.");
  }
  if (!checks.fixtureQueryVectorResolverPlanReviewed) {
    reasons.push("Fixture query vector resolver plan review is required.");
  }
  if (!checks.defaultDisabledPlanReviewed) {
    reasons.push("Default-disabled behavior plan review is required.");
  }
  if (!checks.desktopSmokePlanReviewed) {
    reasons.push("Desktop smoke plan review is required.");
  }
  if (!checks.rollbackPlanReviewed) {
    reasons.push("Rollback plan review is required.");
  }
  if (!checks.sanitizedObservationPlanReviewed) {
    reasons.push("Sanitized recall observation plan review is required.");
  }
  if (!checks.futureImplementationApprovalRequired) {
    reasons.push("Future implementation approval requirement is required.");
  }
  if (!checks.verificationClean) {
    reasons.push("Clean verification evidence is required.");
  }

  return reasons;
}

function createCoreHostMemoryRetrievalEnvWiringBlockingReasons(
  checks: CoreHostMemoryRetrievalEnvWiringApprovalChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.envValueNotRead) {
    reasons.push("Environment value reads are blocked in this approval gate.");
  }
  if (!checks.envWiringNotImplemented) {
    reasons.push("Core Host env wiring implementation is blocked.");
  }
  if (!checks.coreHostDefaultBehaviorUnchanged) {
    reasons.push("Core Host default behavior must remain unchanged.");
  }
  if (!checks.coreRuntimeConstructorUnchanged) {
    reasons.push("CoreRuntime constructor wiring must remain unchanged.");
  }
  if (!checks.retrievalPortNotInjected) {
    reasons.push("Memory retrieval port injection is blocked.");
  }
  if (!checks.fixtureQueryVectorResolverNotInjected) {
    reasons.push("Fixture query vector resolver injection is blocked.");
  }
  if (!checks.providerExecutionNotRouted) {
    reasons.push("Provider execution routing is blocked.");
  }
  if (!checks.phase743VectorsNotPersisted) {
    reasons.push("Phase 7.43 vectors must not be persisted.");
  }
  if (!checks.realRuntimeVectorsNotPersisted) {
    reasons.push("Real runtime vectors must not be persisted.");
  }
  if (!checks.memoryVectorDataNotWritten) {
    reasons.push("Memory vector data writes are blocked.");
  }
  if (!checks.sqliteSchemaMigrationDisabled) {
    reasons.push("SQLite schema/index migration is blocked.");
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

  return reasons;
}

function createCoreHostMemoryRetrievalEnvWiringSafetyReport(
  observations: readonly CoreHostMemoryRetrievalEnvWiringSafetyObservation[],
  reasonCodes: string[],
  degradedObservationCount = 0,
  blockedObservationCount = 0
): CoreHostMemoryRetrievalEnvWiringSafetyReport {
  return {
    phase: "8.13",
    status:
      reasonCodes.length > 0
        ? "blocked"
        : degradedObservationCount > 0
          ? "degraded"
          : "approval_gate",
    approvalGateOnly: true,
    envValueRead: false,
    envWiringImplemented: false,
    retrievalPortInjected: false,
    providerExecutionRouted: false,
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
    observationCount: observations.length,
    envWiringPlanCount: observations.filter(
      (observation) => observation.envWiringPlanObserved
    ).length,
    rollbackPlanCount: observations.filter(
      (observation) => observation.rollbackPlanObserved
    ).length,
    degradedObservationCount,
    blockedObservationCount,
    reasonCodes
  };
}

function createCoreHostMemoryRetrievalEnvWiringSafetyReasons(
  observations: readonly CoreHostMemoryRetrievalEnvWiringSafetyObservation[]
): string[] {
  const reasons = new Set<string>();

  for (const observation of observations) {
    if (observation.resultStatus === "blocked") {
      reasons.add("BLOCKED_OBSERVATION");
    }
    if (observation.envValueRead) {
      reasons.add("ENV_VALUE_READ");
    }
    if (observation.envWiringObserved) {
      reasons.add("ENV_WIRING_OBSERVED");
    }
    if (observation.coreHostDefaultBehaviorObserved) {
      reasons.add("CORE_HOST_DEFAULT_BEHAVIOR_OBSERVED");
    }
    if (observation.coreRuntimeConstructorObserved) {
      reasons.add("CORE_RUNTIME_CONSTRUCTOR_OBSERVED");
    }
    if (observation.retrievalPortObserved) {
      reasons.add("RETRIEVAL_PORT_OBSERVED");
    }
    if (observation.fixtureQueryVectorResolverObserved) {
      reasons.add("FIXTURE_QUERY_VECTOR_RESOLVER_OBSERVED");
    }
    if (observation.providerExecutionObserved) {
      reasons.add("PROVIDER_EXECUTION_OBSERVED");
    }
    if (observation.phase743VectorObserved) {
      reasons.add("PHASE_7_43_VECTOR_OBSERVED");
    }
    if (observation.realRuntimeVectorObserved) {
      reasons.add("REAL_RUNTIME_VECTOR_OBSERVED");
    }
    if (observation.memoryVectorWriteObserved) {
      reasons.add("MEMORY_VECTOR_WRITE_OBSERVED");
    }
    if (observation.sqliteMigrationObserved) {
      reasons.add("SQLITE_MIGRATION_OBSERVED");
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
