import { describe, expect, it } from "vitest";
import {
  OBSERVABILITY_FIXTURE_CASES,
  createObservabilityFixturePlan,
  evaluateObservabilityFixture
} from "../src";

describe("observability fixture harness", () => {
  it("defines bounded in-memory lifecycle/helper fixture coverage", () => {
    const plan = createObservabilityFixturePlan();

    expect(plan).toMatchObject({
      benchmarkId: "observability.fixture",
      execution: "fixture_only",
      cases: OBSERVABILITY_FIXTURE_CASES,
      domains: ["model_lifecycle", "helper_session"],
      inMemoryOnly: true,
      persistentStorageEnabled: false,
      runtimeExecutionEnabled: false,
      helperExecutionEnabled: false,
      rawDiagnosticsPersisted: false,
      privatePathsExposed: false
    });
    expect(JSON.stringify(plan)).not.toMatch(
      /https?:\/\/|modelId|sha256/iu
    );
  });

  it("evaluates normal, degraded, blocked, timeout, cancellation, and cleanup cases", () => {
    const report = evaluateObservabilityFixture([
      fixture("normal_lifecycle"),
      fixture("degraded_helper", {
        outcome: "degraded",
        summaryStatus: "degraded"
      }),
      fixture("blocked_scope", {
        outcome: "degraded",
        summaryStatus: "blocked",
        observationAccepted: false,
        rejectedInputCount: 1
      }),
      fixture("timeout_stop", {
        outcome: "degraded",
        summaryStatus: "stopped",
        timeoutObserved: true,
        stopReasonObserved: true
      }),
      fixture("cancellation_stop", {
        outcome: "degraded",
        summaryStatus: "stopped",
        stopReasonObserved: true
      }),
      fixture("cleanup_failure", {
        outcome: "degraded",
        summaryStatus: "failed",
        stopReasonObserved: true
      })
    ]);

    expect(report).toMatchObject({
      outcome: "degraded",
      reasonCode: "OBSERVABILITY_FIXTURE_DEGRADED",
      caseCount: 6,
      passedCaseCount: 1,
      degradedCaseCount: 5,
      failedCaseCount: 0,
      acceptedObservationCount: 5,
      rejectedInputCount: 1,
      timeoutObservationCount: 1,
      stopReasonObservationCount: 3,
      safetyViolationDetected: false,
      inMemoryOnly: true,
      persistentStorageEnabled: false,
      runtimeExecutionEnabled: false,
      helperExecutionEnabled: false,
      rawDiagnosticsPersisted: false,
      privatePathsExposed: false
    });
  });

  it("fails closed on empty and unsafe fixture observations", () => {
    expect(evaluateObservabilityFixture([])).toMatchObject({
      outcome: "failed",
      reasonCode: "OBSERVABILITY_FIXTURE_NO_CASES",
      caseCount: 0,
      safetyViolationDetected: false
    });

    const report = evaluateObservabilityFixture([
      fixture("normal_lifecycle", {
        runtimeAccessAttempted: true,
        helperExecutionAttempted: true,
        persistentStorageAttempted: true,
        rawDiagnosticsExposed: true,
        privatePathExposed: true
      })
    ]);
    expect(report).toMatchObject({
      outcome: "failed",
      reasonCode: "OBSERVABILITY_FIXTURE_UNSAFE_OBSERVATION",
      safetyViolationDetected: true,
      persistentStorageEnabled: false,
      runtimeExecutionEnabled: false,
      helperExecutionEnabled: false,
      rawDiagnosticsPersisted: false,
      privatePathsExposed: false
    });
    expect(JSON.stringify(report)).not.toMatch(
      /https?:\/\/|modelId|sha256/iu
    );
  });
});

function fixture(
  caseId:
    | "normal_lifecycle"
    | "degraded_helper"
    | "blocked_scope"
    | "timeout_stop"
    | "cancellation_stop"
    | "cleanup_failure",
  overrides: Partial<ReturnType<typeof baseFixture>> = {}
) {
  return {
    ...baseFixture(),
    caseId,
    ...overrides
  };
}

function baseFixture() {
  return {
    caseId: "normal_lifecycle" as const,
    outcome: "pass" as const,
    domain: "model_lifecycle" as const,
    summaryStatus: "passed" as const,
    observationAccepted: true,
    rejectedInputCount: 0,
    timeoutObserved: false,
    stopReasonObserved: false,
    sensitiveInputRejected: false,
    runtimeAccessAttempted: false,
    helperExecutionAttempted: false,
    persistentStorageAttempted: false,
    rawDiagnosticsExposed: false,
    privatePathExposed: false
  };
}
