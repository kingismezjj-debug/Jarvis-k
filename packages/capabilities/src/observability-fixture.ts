import {
  OBSERVABILITY_MAX_FAILURE_CLASSES,
  OBSERVABILITY_MAX_OBSERVATIONS,
  OBSERVABILITY_MAX_REASON_CODES,
  type ObservabilityOperationDomain,
  type ObservabilityOperationStatus,
  type ObservabilityReasonCode
} from "@jarvis-k/contracts";

export type ObservabilityFixtureCaseId =
  | "normal_lifecycle"
  | "degraded_helper"
  | "blocked_scope"
  | "timeout_stop"
  | "cancellation_stop"
  | "cleanup_failure";

export const OBSERVABILITY_FIXTURE_CASES: readonly ObservabilityFixtureCaseId[] =
  [
    "normal_lifecycle",
    "degraded_helper",
    "blocked_scope",
    "timeout_stop",
    "cancellation_stop",
    "cleanup_failure"
  ];

export type ObservabilityFixtureOutcome = "pass" | "degraded" | "failed";

export type ObservabilityFixtureReasonCode =
  | "OBSERVABILITY_FIXTURE_COMPLETE"
  | "OBSERVABILITY_FIXTURE_DEGRADED"
  | "OBSERVABILITY_FIXTURE_FAILED"
  | "OBSERVABILITY_FIXTURE_NO_CASES"
  | "OBSERVABILITY_FIXTURE_UNSAFE_OBSERVATION";

export interface ObservabilityFixturePlan {
  benchmarkId: "observability.fixture";
  execution: "fixture_only";
  cases: readonly ObservabilityFixtureCaseId[];
  domains: readonly [
    "model_lifecycle",
    "helper_session"
  ];
  maxObservations: typeof OBSERVABILITY_MAX_OBSERVATIONS;
  maxReasonCodes: typeof OBSERVABILITY_MAX_REASON_CODES;
  maxFailureClasses: typeof OBSERVABILITY_MAX_FAILURE_CLASSES;
  inMemoryOnly: true;
  persistentStorageEnabled: false;
  runtimeExecutionEnabled: false;
  helperExecutionEnabled: false;
  rawDiagnosticsPersisted: false;
  privatePathsExposed: false;
}

export interface ObservabilityFixtureObservation {
  caseId: ObservabilityFixtureCaseId;
  outcome: ObservabilityFixtureOutcome;
  domain: ObservabilityOperationDomain;
  summaryStatus: ObservabilityOperationStatus;
  observationAccepted: boolean;
  rejectedInputCount: number;
  timeoutObserved: boolean;
  stopReasonObserved: boolean;
  sensitiveInputRejected: boolean;
  runtimeAccessAttempted: boolean;
  helperExecutionAttempted: boolean;
  persistentStorageAttempted: boolean;
  rawDiagnosticsExposed: boolean;
  privatePathExposed: boolean;
}

export interface ObservabilityFixtureReport {
  benchmarkId: "observability.fixture";
  execution: "fixture_only";
  outcome: ObservabilityFixtureOutcome;
  reasonCode: ObservabilityFixtureReasonCode;
  caseCount: number;
  passedCaseCount: number;
  degradedCaseCount: number;
  failedCaseCount: number;
  acceptedObservationCount: number;
  rejectedInputCount: number;
  timeoutObservationCount: number;
  stopReasonObservationCount: number;
  sensitiveInputRejectionCount: number;
  safetyViolationDetected: boolean;
  inMemoryOnly: true;
  persistentStorageEnabled: false;
  runtimeExecutionEnabled: false;
  helperExecutionEnabled: false;
  rawDiagnosticsPersisted: false;
  privatePathsExposed: false;
  reasonCodes: readonly ObservabilityReasonCode[];
}

export function createObservabilityFixturePlan(): ObservabilityFixturePlan {
  return {
    benchmarkId: "observability.fixture",
    execution: "fixture_only",
    cases: OBSERVABILITY_FIXTURE_CASES,
    domains: ["model_lifecycle", "helper_session"],
    maxObservations: OBSERVABILITY_MAX_OBSERVATIONS,
    maxReasonCodes: OBSERVABILITY_MAX_REASON_CODES,
    maxFailureClasses: OBSERVABILITY_MAX_FAILURE_CLASSES,
    inMemoryOnly: true,
    persistentStorageEnabled: false,
    runtimeExecutionEnabled: false,
    helperExecutionEnabled: false,
    rawDiagnosticsPersisted: false,
    privatePathsExposed: false
  };
}

export function evaluateObservabilityFixture(
  observations: readonly ObservabilityFixtureObservation[]
): ObservabilityFixtureReport {
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
      observation.runtimeAccessAttempted ||
      observation.helperExecutionAttempted ||
      observation.persistentStorageAttempted ||
      observation.rawDiagnosticsExposed ||
      observation.privatePathExposed
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
    benchmarkId: "observability.fixture",
    execution: "fixture_only",
    outcome,
    reasonCode:
      boundedObservations.length === 0
        ? "OBSERVABILITY_FIXTURE_NO_CASES"
        : safetyViolationDetected
          ? "OBSERVABILITY_FIXTURE_UNSAFE_OBSERVATION"
          : outcome === "pass"
            ? "OBSERVABILITY_FIXTURE_COMPLETE"
            : outcome === "degraded"
              ? "OBSERVABILITY_FIXTURE_DEGRADED"
              : "OBSERVABILITY_FIXTURE_FAILED",
    caseCount: boundedObservations.length,
    passedCaseCount,
    degradedCaseCount,
    failedCaseCount,
    acceptedObservationCount: boundedObservations.filter(
      (observation) => observation.observationAccepted
    ).length,
    rejectedInputCount: boundedObservations.reduce(
      (total, observation) => total + observation.rejectedInputCount,
      0
    ),
    timeoutObservationCount: boundedObservations.filter(
      (observation) => observation.timeoutObserved
    ).length,
    stopReasonObservationCount: boundedObservations.filter(
      (observation) => observation.stopReasonObserved
    ).length,
    sensitiveInputRejectionCount: boundedObservations.filter(
      (observation) => observation.sensitiveInputRejected
    ).length,
    safetyViolationDetected,
    inMemoryOnly: true,
    persistentStorageEnabled: false,
    runtimeExecutionEnabled: false,
    helperExecutionEnabled: false,
    rawDiagnosticsPersisted: false,
    privatePathsExposed: false,
    reasonCodes: [...new Set(
      boundedObservations.flatMap((observation) =>
        observation.sensitiveInputRejected
          ? ["OBSERVATION_INPUT_INVALID" as const]
          : []
      )
    )]
  };
}
