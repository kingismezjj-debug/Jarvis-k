import { describe, expect, it } from "vitest";
import {
  OBSERVABILITY_MAX_COUNTER,
  OBSERVABILITY_MAX_REASON_CODES,
  ObservabilityCountersSchema,
  ObservabilityObservationSchema,
  ObservabilitySummarySchema
} from "../src";

describe("observability protocol", () => {
  it("validates bounded lifecycle and helper observations", () => {
    const observation = ObservabilityObservationSchema.parse({
      correlationId: "obs-test-1",
      domain: "model_lifecycle",
      phase: "activation",
      status: "passed",
      activationState: "committed",
      preservationState: "preserved",
      timeoutOccurred: false,
      reasonCodes: ["MODEL_ACTIVATION_COMMITTED", "MODEL_VERSION_PRESERVED"],
      failureClasses: []
    });

    expect(observation.phase).toBe("activation");
    expect(observation.reasonCodes).toHaveLength(2);
  });

  it("rejects duplicate, unknown, and sensitive fields", () => {
    expect(() =>
      ObservabilityObservationSchema.parse({
        ...validObservation(),
        reasonCodes: ["OBSERVATION_STARTED", "OBSERVATION_STARTED"]
      })
    ).toThrow();

    expect(() =>
      ObservabilityObservationSchema.parse({
        ...validObservation(),
        modelId: "fixture-model"
      })
    ).toThrow();

    expect(() =>
      ObservabilityObservationSchema.parse({
        ...validObservation(),
        helperDiagnostics: "redacted"
      })
    ).toThrow();
  });

  it("enforces reason-code and counter bounds", () => {
    const tooManyReasonCodes = Array.from(
      { length: OBSERVABILITY_MAX_REASON_CODES + 1 },
      () => "OBSERVATION_STARTED" as const
    );
    expect(() =>
      ObservabilityObservationSchema.parse({
        ...validObservation(),
        reasonCodes: tooManyReasonCodes
      })
    ).toThrow();

    expect(() =>
      ObservabilityCountersSchema.parse({
        observationCount: 0,
        rejectedObservationCount: 0,
        startedCount: 0,
        passedCount: 0,
        degradedCount: 0,
        blockedCount: 0,
        failedCount: 0,
        stoppedCount: 0,
        timeoutCount: 0,
        reasonCodeCount: OBSERVABILITY_MAX_COUNTER + 1,
        failureClassCount: 0
      })
    ).toThrow();
  });

  it("keeps summaries explicitly non-persistent and sanitized", () => {
    const summary = ObservabilitySummarySchema.parse({
      correlationId: "obs-test-1",
      domains: ["model_lifecycle", "helper_session"],
      currentPhase: "complete",
      status: "passed",
      healthState: "passed",
      loadState: "passed",
      releaseState: "passed",
      activationState: "committed",
      preservationState: "preserved",
      rollbackState: "not_required",
      cleanupState: "passed",
      timeoutOccurred: false,
      reasonCodes: ["OBSERVATION_COMPLETED"],
      failureClasses: [],
      counters: {
        observationCount: 1,
        rejectedObservationCount: 0,
        startedCount: 0,
        passedCount: 1,
        degradedCount: 0,
        blockedCount: 0,
        failedCount: 0,
        stoppedCount: 0,
        timeoutCount: 0,
        reasonCodeCount: 1,
        failureClassCount: 0
      },
      released: false,
      persisted: false,
      rawDiagnosticsExposed: false
    });

    expect(summary.persisted).toBe(false);
    expect(summary.rawDiagnosticsExposed).toBe(false);
    expect(JSON.stringify(summary)).not.toMatch(
      /modelId|helperDiagnostics|privatePath|sha256/iu
    );
  });
});

function validObservation() {
  return {
    correlationId: "obs-test-1",
    domain: "helper_session" as const,
    phase: "health_check" as const,
    status: "started" as const,
    timeoutOccurred: false,
    reasonCodes: ["OBSERVATION_STARTED" as const],
    failureClasses: []
  };
}
