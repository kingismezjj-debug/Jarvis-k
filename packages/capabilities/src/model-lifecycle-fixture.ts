export type ModelLifecycleFixtureCaseId =
  | "install_preflight"
  | "artifact_verification"
  | "upgrade_plan"
  | "rollback_plan";

export const MODEL_LIFECYCLE_FIXTURE_CASES: readonly ModelLifecycleFixtureCaseId[] = [
  "install_preflight",
  "artifact_verification",
  "upgrade_plan",
  "rollback_plan"
];

export type ModelLifecycleFixtureOutcome =
  | "pass"
  | "degraded"
  | "failed";

export type ModelLifecycleFixtureReasonCode =
  | "MODEL_LIFECYCLE_FIXTURE_COMPLETE"
  | "MODEL_LIFECYCLE_FIXTURE_DEGRADED"
  | "MODEL_LIFECYCLE_FIXTURE_FAILED"
  | "MODEL_LIFECYCLE_FIXTURE_NO_CASES"
  | "MODEL_LIFECYCLE_FIXTURE_UNSAFE_OBSERVATION";

export interface ModelLifecycleFixturePlan {
  benchmarkId: "model.lifecycle.fixture";
  execution: "fixture_only";
  cases: readonly ModelLifecycleFixtureCaseId[];
  operations: readonly [
    "prepare_install",
    "verify_manifest",
    "plan_upgrade",
    "plan_rollback"
  ];
  operationStateSanitized: true;
  filesystemWritesAllowed: false;
  networkAccessAllowed: false;
  modelLoadingEnabled: false;
  installerBundlingEnabled: false;
  autoUpdateEnabled: false;
  rollbackExecutionEnabled: false;
  rawModelValuesPersisted: false;
  privatePathsExposed: false;
}

export interface ModelLifecycleFixtureObservation {
  caseId: ModelLifecycleFixtureCaseId;
  outcome: ModelLifecycleFixtureOutcome;
  operationStateObserved: boolean;
  manifestPinVerified: boolean;
  digestVerified: boolean;
  filesystemWriteAttempted: boolean;
  networkAccessAttempted: boolean;
  signedUrlPersisted: boolean;
  privatePathExposed: boolean;
  modelLoadingAttempted: boolean;
  installerBundlingAttempted: boolean;
  autoUpdateAttempted: boolean;
  rollbackExecuted: boolean;
}

export interface ModelLifecycleFixtureReport {
  benchmarkId: "model.lifecycle.fixture";
  execution: "fixture_only";
  outcome: ModelLifecycleFixtureOutcome;
  reasonCode: ModelLifecycleFixtureReasonCode;
  caseCount: number;
  passedCaseCount: number;
  degradedCaseCount: number;
  failedCaseCount: number;
  operationStateSuccessCount: number;
  manifestPinSuccessCount: number;
  digestVerificationSuccessCount: number;
  safetyViolationDetected: boolean;
  operationStateSanitized: true;
  filesystemWritesAllowed: false;
  networkAccessAllowed: false;
  modelLoadingEnabled: false;
  installerBundlingEnabled: false;
  autoUpdateEnabled: false;
  rollbackExecutionEnabled: false;
  rawModelValuesPersisted: false;
  privatePathsExposed: false;
}

export function createModelLifecycleFixturePlan(): ModelLifecycleFixturePlan {
  return {
    benchmarkId: "model.lifecycle.fixture",
    execution: "fixture_only",
    cases: MODEL_LIFECYCLE_FIXTURE_CASES,
    operations: [
      "prepare_install",
      "verify_manifest",
      "plan_upgrade",
      "plan_rollback"
    ],
    operationStateSanitized: true,
    filesystemWritesAllowed: false,
    networkAccessAllowed: false,
    modelLoadingEnabled: false,
    installerBundlingEnabled: false,
    autoUpdateEnabled: false,
    rollbackExecutionEnabled: false,
    rawModelValuesPersisted: false,
    privatePathsExposed: false
  };
}

export function evaluateModelLifecycleFixture(
  observations: readonly ModelLifecycleFixtureObservation[]
): ModelLifecycleFixtureReport {
  const boundedObservations = observations.slice(0, 32);
  const passedCaseCount = boundedObservations.filter(
    (observation) => observation.outcome === "pass"
  ).length;
  const degradedCaseCount = boundedObservations.filter(
    (observation) => observation.outcome === "degraded"
  ).length;
  const failedCaseCount = boundedObservations.filter(
    (observation) => observation.outcome === "failed"
  ).length;
  const safetyViolationDetected = boundedObservations.some(
    (observation) =>
      observation.filesystemWriteAttempted ||
      observation.networkAccessAttempted ||
      observation.signedUrlPersisted ||
      observation.privatePathExposed ||
      observation.modelLoadingAttempted ||
      observation.installerBundlingAttempted ||
      observation.autoUpdateAttempted ||
      observation.rollbackExecuted
  );
  const outcome =
    boundedObservations.length === 0 ||
    failedCaseCount > 0 ||
    safetyViolationDetected
      ? "failed"
      : degradedCaseCount > 0
        ? "degraded"
        : "pass";

  return {
    benchmarkId: "model.lifecycle.fixture",
    execution: "fixture_only",
    outcome,
    reasonCode:
      boundedObservations.length === 0
        ? "MODEL_LIFECYCLE_FIXTURE_NO_CASES"
        : safetyViolationDetected
          ? "MODEL_LIFECYCLE_FIXTURE_UNSAFE_OBSERVATION"
          : outcome === "pass"
            ? "MODEL_LIFECYCLE_FIXTURE_COMPLETE"
            : outcome === "degraded"
              ? "MODEL_LIFECYCLE_FIXTURE_DEGRADED"
              : "MODEL_LIFECYCLE_FIXTURE_FAILED",
    caseCount: boundedObservations.length,
    passedCaseCount,
    degradedCaseCount,
    failedCaseCount,
    operationStateSuccessCount: boundedObservations.filter(
      (observation) => observation.operationStateObserved
    ).length,
    manifestPinSuccessCount: boundedObservations.filter(
      (observation) => observation.manifestPinVerified
    ).length,
    digestVerificationSuccessCount: boundedObservations.filter(
      (observation) => observation.digestVerified
    ).length,
    safetyViolationDetected,
    operationStateSanitized: true,
    filesystemWritesAllowed: false,
    networkAccessAllowed: false,
    modelLoadingEnabled: false,
    installerBundlingEnabled: false,
    autoUpdateEnabled: false,
    rollbackExecutionEnabled: false,
    rawModelValuesPersisted: false,
    privatePathsExposed: false
  };
}
