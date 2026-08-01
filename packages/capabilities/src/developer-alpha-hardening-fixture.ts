export type DeveloperAlphaHardeningFixtureCaseId =
  | "startup_defaults"
  | "fixture_fallback"
  | "operation_recovery"
  | "sanitized_diagnostics"
  | "release_guard";

export const DEVELOPER_ALPHA_HARDENING_FIXTURE_CASES: readonly DeveloperAlphaHardeningFixtureCaseId[] =
  [
    "startup_defaults",
    "fixture_fallback",
    "operation_recovery",
    "sanitized_diagnostics",
    "release_guard"
  ];

export type DeveloperAlphaHardeningFixtureOutcome =
  | "pass"
  | "degraded"
  | "failed";

export type DeveloperAlphaHardeningFixtureReasonCode =
  | "DEVELOPER_ALPHA_HARDENING_COMPLETE"
  | "DEVELOPER_ALPHA_HARDENING_DEGRADED"
  | "DEVELOPER_ALPHA_HARDENING_FAILED"
  | "DEVELOPER_ALPHA_HARDENING_NO_CASES"
  | "DEVELOPER_ALPHA_HARDENING_UNSAFE_OBSERVATION";

export interface DeveloperAlphaHardeningFixturePlan {
  benchmarkId: "developer-alpha.hardening.fixture";
  execution: "fixture_only";
  cases: readonly DeveloperAlphaHardeningFixtureCaseId[];
  observations: readonly [
    "fail_closed_defaults",
    "fixture_fallback",
    "operation_recovery",
    "sanitized_diagnostics",
    "release_guard"
  ];
  operationStateSanitized: true;
  diagnosticsSanitized: true;
  fixtureFallbackRequired: true;
  restartSideEffectsAllowed: false;
  filesystemWritesAllowed: false;
  networkAccessAllowed: false;
  credentialsRequired: false;
  modelLoadingEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  rawDiagnosticsPersisted: false;
  privatePathsExposed: false;
  modelOutputCommandsEnabled: false;
}

export interface DeveloperAlphaHardeningFixtureObservation {
  caseId: DeveloperAlphaHardeningFixtureCaseId;
  outcome: DeveloperAlphaHardeningFixtureOutcome;
  operationStateObserved: boolean;
  defaultsDisabled: boolean;
  fixtureFallbackAvailable: boolean;
  diagnosticsSanitized: boolean;
  restartRecovered: boolean;
  filesystemWriteAttempted: boolean;
  networkAccessAttempted: boolean;
  credentialExposed: boolean;
  privatePathExposed: boolean;
  rawDiagnosticsExposed: boolean;
  modelLoadingAttempted: boolean;
  providerRegistrationAttempted: boolean;
  executionEnabled: boolean;
  modelOutputCommandsEnabled: boolean;
}

export interface DeveloperAlphaHardeningFixtureReport {
  benchmarkId: "developer-alpha.hardening.fixture";
  execution: "fixture_only";
  outcome: DeveloperAlphaHardeningFixtureOutcome;
  reasonCode: DeveloperAlphaHardeningFixtureReasonCode;
  caseCount: number;
  passedCaseCount: number;
  degradedCaseCount: number;
  failedCaseCount: number;
  operationStateSuccessCount: number;
  defaultsDisabledCount: number;
  fixtureFallbackSuccessCount: number;
  sanitizedDiagnosticsSuccessCount: number;
  restartRecoverySuccessCount: number;
  safetyViolationDetected: boolean;
  operationStateSanitized: true;
  diagnosticsSanitized: true;
  fixtureFallbackRequired: true;
  restartSideEffectsAllowed: false;
  filesystemWritesAllowed: false;
  networkAccessAllowed: false;
  credentialsRequired: false;
  modelLoadingEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  rawDiagnosticsPersisted: false;
  privatePathsExposed: false;
  modelOutputCommandsEnabled: false;
}

export function createDeveloperAlphaHardeningFixturePlan(): DeveloperAlphaHardeningFixturePlan {
  return {
    benchmarkId: "developer-alpha.hardening.fixture",
    execution: "fixture_only",
    cases: DEVELOPER_ALPHA_HARDENING_FIXTURE_CASES,
    observations: [
      "fail_closed_defaults",
      "fixture_fallback",
      "operation_recovery",
      "sanitized_diagnostics",
      "release_guard"
    ],
    operationStateSanitized: true,
    diagnosticsSanitized: true,
    fixtureFallbackRequired: true,
    restartSideEffectsAllowed: false,
    filesystemWritesAllowed: false,
    networkAccessAllowed: false,
    credentialsRequired: false,
    modelLoadingEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    rawDiagnosticsPersisted: false,
    privatePathsExposed: false,
    modelOutputCommandsEnabled: false
  };
}

export function evaluateDeveloperAlphaHardeningFixture(
  observations: readonly DeveloperAlphaHardeningFixtureObservation[]
): DeveloperAlphaHardeningFixtureReport {
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
      observation.credentialExposed ||
      observation.privatePathExposed ||
      observation.rawDiagnosticsExposed ||
      observation.modelLoadingAttempted ||
      observation.providerRegistrationAttempted ||
      observation.executionEnabled ||
      observation.modelOutputCommandsEnabled
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
    benchmarkId: "developer-alpha.hardening.fixture",
    execution: "fixture_only",
    outcome,
    reasonCode:
      boundedObservations.length === 0
        ? "DEVELOPER_ALPHA_HARDENING_NO_CASES"
        : safetyViolationDetected
          ? "DEVELOPER_ALPHA_HARDENING_UNSAFE_OBSERVATION"
          : outcome === "pass"
            ? "DEVELOPER_ALPHA_HARDENING_COMPLETE"
            : outcome === "degraded"
              ? "DEVELOPER_ALPHA_HARDENING_DEGRADED"
              : "DEVELOPER_ALPHA_HARDENING_FAILED",
    caseCount: boundedObservations.length,
    passedCaseCount,
    degradedCaseCount,
    failedCaseCount,
    operationStateSuccessCount: boundedObservations.filter(
      (observation) => observation.operationStateObserved
    ).length,
    defaultsDisabledCount: boundedObservations.filter(
      (observation) => observation.defaultsDisabled
    ).length,
    fixtureFallbackSuccessCount: boundedObservations.filter(
      (observation) => observation.fixtureFallbackAvailable
    ).length,
    sanitizedDiagnosticsSuccessCount: boundedObservations.filter(
      (observation) => observation.diagnosticsSanitized
    ).length,
    restartRecoverySuccessCount: boundedObservations.filter(
      (observation) => observation.restartRecovered
    ).length,
    safetyViolationDetected,
    operationStateSanitized: true,
    diagnosticsSanitized: true,
    fixtureFallbackRequired: true,
    restartSideEffectsAllowed: false,
    filesystemWritesAllowed: false,
    networkAccessAllowed: false,
    credentialsRequired: false,
    modelLoadingEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    rawDiagnosticsPersisted: false,
    privatePathsExposed: false,
    modelOutputCommandsEnabled: false
  };
}
