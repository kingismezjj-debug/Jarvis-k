import { describe, expect, it } from "vitest";
import { OBSERVABILITY_MAX_OBSERVATIONS } from "@jarvis-k/contracts";
import {
  classifyObservabilityFailure,
  createObservabilityCollector,
  sanitizeObservabilityObservation
} from "../src";

describe("observability aggregator", () => {
  it("aggregates bounded lifecycle and helper state without raw input", () => {
    const collector = createObservabilityCollector("obs-aggregate-1");

    expect(
      collector.observe(
        observation({
          domain: "model_lifecycle",
          phase: "preflight",
          status: "started",
          reasonCodes: ["OBSERVATION_STARTED"]
        })
      )
    ).toEqual({ accepted: true, observationCount: 1 });
    expect(
      collector.observe(
        observation({
          domain: "helper_session",
          phase: "health_check",
          status: "passed",
          healthState: "passed",
          reasonCodes: ["HELPER_HEALTH_PASSED"]
        })
      )
    ).toMatchObject({ accepted: true });
    expect(
      collector.observe(
        observation({
          domain: "helper_session",
          phase: "load",
          status: "passed",
          loadState: "passed",
          reasonCodes: ["HELPER_LOAD_PASSED"]
        })
      )
    ).toMatchObject({ accepted: true });
    expect(
      collector.observe(
        observation({
          domain: "model_lifecycle",
          phase: "activation",
          status: "passed",
          activationState: "committed",
          preservationState: "preserved",
          reasonCodes: [
            "MODEL_ACTIVATION_COMMITTED",
            "MODEL_VERSION_PRESERVED"
          ]
        })
      )
    ).toMatchObject({ accepted: true });
    expect(
      collector.observe(
        observation({
          domain: "helper_session",
          phase: "release",
          status: "passed",
          releaseState: "passed",
          reasonCodes: ["HELPER_RELEASE_PASSED"]
        })
      )
    ).toMatchObject({ accepted: true });
    expect(
      collector.observe(
        observation({
          domain: "model_lifecycle",
          phase: "rollback",
          status: "passed",
          rollbackState: "not_required",
          reasonCodes: ["MODEL_ROLLBACK_NOT_REQUIRED"]
        })
      )
    ).toMatchObject({ accepted: true });
    expect(
      collector.observe(
        observation({
          domain: "model_lifecycle",
          phase: "cleanup",
          status: "passed",
          cleanupState: "passed",
          reasonCodes: ["MODEL_CLEANUP_PASSED"]
        })
      )
    ).toMatchObject({ accepted: true });

    const summary = collector.summarize();
    expect(summary).toMatchObject({
      correlationId: "obs-aggregate-1",
      domains: ["model_lifecycle", "helper_session"],
      currentPhase: "cleanup",
      status: "passed",
      healthState: "passed",
      loadState: "passed",
      releaseState: "passed",
      activationState: "committed",
      preservationState: "preserved",
      rollbackState: "not_required",
      cleanupState: "passed",
      timeoutOccurred: false,
      released: false,
      persisted: false,
      rawDiagnosticsExposed: false
    });
    expect(summary.counters).toMatchObject({
      observationCount: 7,
      passedCount: 6,
      startedCount: 1,
      rejectedObservationCount: 0
    });
    expect(summary.reasonCodes).toContain("MODEL_ACTIVATION_COMMITTED");
    expect(JSON.stringify(summary)).not.toMatch(
      /privatePath|helperDiagnostics|modelId|sha256/iu
    );
  });

  it("classifies degraded, timeout, cancellation, and stop states", () => {
    const collector = createObservabilityCollector("obs-degraded-1");

    expect(
      collector.observe(
        observation({
          correlationId: "obs-degraded-1",
          domain: "helper_session",
          phase: "health_check",
          status: "degraded",
          healthState: "degraded",
          reasonCodes: ["OBSERVATION_DEGRADED"],
          failureClasses: ["HELPER_HEALTH_FAILED"],
          stopReason: "health_failed"
        })
      )
    ).toMatchObject({ accepted: true });
    expect(
      collector.observe(
        observation({
          correlationId: "obs-degraded-1",
          domain: "helper_session",
          phase: "load",
          status: "stopped",
          timeoutOccurred: true,
          reasonCodes: ["HELPER_TIMEOUT", "OBSERVATION_STOPPED"],
          failureClasses: ["TIMEOUT_OR_CANCELLATION"],
          stopReason: "timeout"
        })
      )
    ).toMatchObject({ accepted: true });

    const summary = collector.summarize();
    expect(summary.status).toBe("stopped");
    expect(summary.timeoutOccurred).toBe(true);
    expect(summary.stopReason).toBe("timeout");
    expect(summary.healthState).toBe("degraded");
    expect(summary.counters).toMatchObject({
      degradedCount: 1,
      stoppedCount: 1,
      timeoutCount: 1
    });
    expect(summary.failureClasses).toEqual([
      "HELPER_HEALTH_FAILED",
      "TIMEOUT_OR_CANCELLATION"
    ]);
  });

  it("rejects sensitive input and correlation mismatches without retaining it", () => {
    const sensitive = sanitizeObservabilityObservation({
      ...observation({}),
      modelId: "fixture-model"
    });
    expect(sensitive).toEqual({
      accepted: false,
      reasonCode: "OBSERVATION_INPUT_INVALID",
      failureClass: "SENSITIVE_OUTPUT_DETECTED"
    });

    const collector = createObservabilityCollector("obs-reject-1");
    expect(
      collector.observe(
        observation({
          correlationId: "obs-other-1"
        })
      )
    ).toEqual({
      accepted: false,
      reasonCode: "OBSERVATION_CORRELATION_MISMATCH",
      failureClass: "APPROVAL_OR_SCOPE_BLOCKED"
    });
    expect(
      collector.observe({
        ...observation({ correlationId: "obs-reject-1" }),
        modelId: "fixture-model"
      })
    ).toEqual({
      accepted: false,
      reasonCode: "OBSERVATION_INPUT_INVALID",
      failureClass: "SENSITIVE_OUTPUT_DETECTED"
    });

    const summary = collector.summarize();
    expect(summary.status).toBe("blocked");
    expect(summary.counters).toMatchObject({
      observationCount: 0,
      rejectedObservationCount: 2
    });
    expect(summary.failureClasses).toEqual([
      "APPROVAL_OR_SCOPE_BLOCKED",
      "SENSITIVE_OUTPUT_DETECTED"
    ]);
  });

  it("maps fixed stop signals and unknown errors without retaining raw details", () => {
    expect(
      classifyObservabilityFailure({
        domain: "helper_session",
        stopReason: "health_failed"
      })
    ).toBe("HELPER_HEALTH_FAILED");
    expect(
      classifyObservabilityFailure({
        stopReason: "cancellation"
      })
    ).toBe("TIMEOUT_OR_CANCELLATION");
    expect(
      classifyObservabilityFailure({
        stopReason: "cleanup_failed"
      })
    ).toBe("CLEANUP_FAILED");
    expect(classifyObservabilityFailure(new Error("untrusted message"))).toBe(
      "UNKNOWN_SANITIZED_FAILURE"
    );
    expect(
      classifyObservabilityFailure({
        error: "untrusted message"
      })
    ).toBe("SENSITIVE_OUTPUT_DETECTED");
  });

  it("aggregates cancellation and cleanup stop reasons", () => {
    const collector = createObservabilityCollector("obs-stop-1");

    expect(
      collector.observe(
        observation({
          correlationId: "obs-stop-1",
          domain: "helper_session",
          phase: "load",
          status: "stopped",
          timeoutOccurred: false,
          reasonCodes: ["HELPER_CANCELLED", "OBSERVATION_STOPPED"],
          failureClasses: ["TIMEOUT_OR_CANCELLATION"],
          stopReason: "cancellation"
        })
      )
    ).toMatchObject({ accepted: true });
    expect(
      collector.observe(
        observation({
          correlationId: "obs-stop-1",
          domain: "model_lifecycle",
          phase: "cleanup",
          status: "stopped",
          cleanupState: "degraded",
          reasonCodes: ["MODEL_CLEANUP_FAILED"],
          failureClasses: ["CLEANUP_FAILED"],
          stopReason: "cleanup_failed"
        })
      )
    ).toMatchObject({ accepted: true });

    const summary = collector.summarize();
    expect(summary.status).toBe("stopped");
    expect(summary.stopReason).toBe("cleanup_failed");
    expect(summary.cleanupState).toBe("degraded");
    expect(summary.failureClasses).toEqual([
      "TIMEOUT_OR_CANCELLATION",
      "CLEANUP_FAILED"
    ]);
  });

  it("caps observations and clears all state on release", () => {
    const collector = createObservabilityCollector("obs-bounds-1");
    for (let index = 0; index < OBSERVABILITY_MAX_OBSERVATIONS; index += 1) {
      expect(
        collector.observe(observation({ correlationId: "obs-bounds-1" }))
      ).toMatchObject({
        accepted: true
      });
    }

    expect(
      collector.observe(observation({ correlationId: "obs-bounds-1" }))
    ).toEqual({
      accepted: false,
      reasonCode: "OBSERVATION_BOUNDS_EXCEEDED",
      failureClass: "APPROVAL_OR_SCOPE_BLOCKED"
    });
    expect(collector.summarize().counters).toMatchObject({
      observationCount: OBSERVABILITY_MAX_OBSERVATIONS,
      rejectedObservationCount: 1
    });

    collector.release();
    expect(collector.summarize()).toMatchObject({
      currentPhase: "preflight",
      status: "blocked",
      domains: [],
      released: true,
      persisted: false
    });
    expect(collector.summarize().counters).toMatchObject({
      observationCount: 0,
      rejectedObservationCount: 0
    });
    expect(collector.observe(observation({}))).toEqual({
      accepted: false,
      reasonCode: "OBSERVATION_COLLECTOR_RELEASED",
      failureClass: "APPROVAL_OR_SCOPE_BLOCKED"
    });
  });
});

function observation(
  overrides: Partial<ReturnType<typeof baseObservation>> = {}
) {
  return {
    ...baseObservation(),
    ...overrides
  };
}

function baseObservation() {
  return {
    correlationId: "obs-aggregate-1",
    domain: "model_lifecycle" as const,
    phase: "preflight" as const,
    status: "started" as const,
    timeoutOccurred: false,
    reasonCodes: ["OBSERVATION_STARTED" as const],
    failureClasses: [] as const
  };
}
