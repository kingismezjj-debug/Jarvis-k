import { describe, expect, it } from "vitest";
import {
  createObservabilityCollector,
  type ObservabilityCollector
} from "@jarvis-k/capabilities";
import { OBSERVABILITY_MAX_OBSERVATIONS } from "@jarvis-k/contracts";
import {
  createCoreHostObservabilitySession,
  observeHelperReport,
  observeLifecycleReport,
  type CoreHostObservabilityLifecycleReport
} from "../src/observability-core-host-integration";

describe("Core Host Observability integration", () => {
  it("maps passed lifecycle and helper reports into sanitized summary state", () => {
    const session = createCoreHostObservabilitySession("obs-core-host-pass-1");

    expect(
      session.observeLifecycleReport(
        lifecycleReport({
          operation: "install_and_activate",
          status: "passed",
          cleanupStatus: "passed",
          rollbackStatus: "not_required",
          previousVersionPreserved: true,
          reasonCodes: ["MODEL_ACTIVATION_COMMITTED"]
        })
      )
    ).toEqual({ accepted: true, observationCount: 1 });
    expect(
      session.observeHelperReport({
        operation: "health",
        status: "passed"
      })
    ).toMatchObject({ accepted: true });
    expect(
      session.observeHelperReport({
        operation: "load",
        status: "passed"
      })
    ).toMatchObject({ accepted: true });
    expect(
      session.observeHelperReport({
        operation: "release",
        status: "passed"
      })
    ).toMatchObject({ accepted: true });

    const summary = session.summarize();
    expect(summary).toMatchObject({
      correlationId: "obs-core-host-pass-1",
      domains: ["model_lifecycle", "helper_session"],
      currentPhase: "release",
      status: "passed",
      healthState: "passed",
      loadState: "passed",
      releaseState: "passed",
      activationState: "committed",
      preservationState: "preserved",
      rollbackState: "not_required",
      cleanupState: "passed",
      persisted: false,
      rawDiagnosticsExposed: false
    });
    expect(summary.reasonCodes).toEqual([
      "MODEL_ACTIVATION_COMMITTED",
      "HELPER_HEALTH_PASSED",
      "HELPER_LOAD_PASSED",
      "HELPER_RELEASE_PASSED"
    ]);
    expect(JSON.stringify(summary)).not.toMatch(
      /modelId|sha256|helperDiagnostics|privatePath|sourceText/iu
    );
  });

  it("maps degraded lifecycle health, activation, preservation, rollback, and cleanup", () => {
    const session = createCoreHostObservabilitySession(
      "obs-core-host-lifecycle-degraded-1"
    );

    session.observeLifecycleReport(
      lifecycleReport({
        operation: "install_and_activate",
        status: "degraded",
        cleanupStatus: "passed",
        rollbackStatus: "not_started",
        previousVersionPreserved: true,
        reasonCodes: ["MODEL_HEALTH_CHECK_FAILED"]
      })
    );
    session.observeLifecycleReport(
      lifecycleReport({
        operation: "activate",
        status: "degraded",
        cleanupStatus: "not_required",
        rollbackStatus: "not_started",
        previousVersionPreserved: false,
        reasonCodes: ["MODEL_ACTIVATION_COMMIT_FAILED"]
      })
    );
    session.observeLifecycleReport(
      lifecycleReport({
        operation: "rollback",
        status: "blocked",
        cleanupStatus: "not_required",
        rollbackStatus: "degraded",
        previousVersionPreserved: true,
        reasonCodes: ["MODEL_NO_PREVIOUS_VERSION"]
      })
    );
    session.observeLifecycleReport(
      lifecycleReport({
        operation: "install_and_activate",
        status: "degraded",
        cleanupStatus: "degraded",
        rollbackStatus: "not_started",
        previousVersionPreserved: false,
        reasonCodes: ["MODEL_CLEANUP_FAILED"]
      })
    );

    const summary = session.summarize();
    expect(summary).toMatchObject({
      currentPhase: "cleanup",
      status: "blocked",
      stopReason: "cleanup_failed",
      healthState: "degraded",
      cleanupState: "degraded",
      persisted: false
    });
    expect(summary.failureClasses).toEqual([
      "HELPER_HEALTH_FAILED",
      "ACTIVATION_FAILED",
      "PRESERVATION_FAILED",
      "ROLLBACK_FAILED",
      "CLEANUP_FAILED"
    ]);
    expect(summary.reasonCodes).toEqual([
      "MODEL_HEALTH_CHECK_FAILED",
      "MODEL_ACTIVATION_FAILED",
      "MODEL_ROLLBACK_FAILED",
      "MODEL_CLEANUP_FAILED"
    ]);
  });

  it("maps helper health, load, release timeout, cancellation, and failure states", () => {
    const session = createCoreHostObservabilitySession(
      "obs-core-host-helper-stop-1"
    );

    session.observeHelperReport({
      operation: "health",
      status: "failed"
    });
    session.observeHelperReport({
      operation: "load",
      status: "timeout",
      timeoutOccurred: true
    });
    session.observeHelperReport({
      operation: "release",
      status: "cancelled",
      cancelled: true
    });

    const summary = session.summarize();
    expect(summary).toMatchObject({
      currentPhase: "release",
      status: "stopped",
      healthState: "failed",
      loadState: "failed",
      releaseState: "failed",
      timeoutOccurred: true,
      stopReason: "cancellation"
    });
    expect(summary.failureClasses).toEqual([
      "HELPER_HEALTH_FAILED",
      "TIMEOUT_OR_CANCELLATION"
    ]);
    expect(summary.reasonCodes).toEqual([
      "OBSERVATION_FAILED",
      "HELPER_TIMEOUT",
      "OBSERVATION_STOPPED",
      "HELPER_CANCELLED"
    ]);
  });

  it("fails closed on unknown lifecycle or helper status values", () => {
    const session = createCoreHostObservabilitySession(
      "obs-core-host-unknown-1"
    );

    expect(
      session.observeLifecycleReport({
        ...lifecycleReport({}),
        status: "mystery"
      })
    ).toMatchObject({ accepted: true });
    expect(
      session.observeHelperReport({
        operation: "health",
        status: "mystery"
      })
    ).toMatchObject({ accepted: true });
    expect(session.observeLifecycleReport(new Error("raw details"))).toMatchObject({
      accepted: true
    });

    const summary = session.summarize();
    expect(summary).toMatchObject({
      status: "blocked",
      currentPhase: "preflight",
      stopReason: "scope_violation"
    });
    expect(summary.reasonCodes).toEqual(["OBSERVATION_INPUT_INVALID"]);
    expect(summary.failureClasses).toEqual([
      "INPUT_VERIFICATION_FAILED",
      "UNKNOWN_SANITIZED_FAILURE"
    ]);
  });

  it("rejects sensitive fields without retaining raw data", () => {
    const sensitiveFields = [
      { key: "path", value: "redacted" },
      { key: "url", value: "redacted" },
      { key: "credential", value: "redacted" },
      { key: "digest", value: "redacted" },
      { key: "modelId", value: "redacted" },
      { key: "vector", value: [1, 2, 3] },
      { key: "sourceText", value: "redacted" },
      { key: "helperDiagnostics", value: "redacted" },
      { key: "errorMessage", value: "redacted" },
      { key: "stackTrace", value: "redacted" },
      { key: "envValue", value: "redacted" },
      { key: "command", value: "redacted" },
      { key: "script", value: "redacted" },
      { key: "cachePath", value: "redacted" },
      { key: "artifactPath", value: "redacted" }
    ];

    for (const field of sensitiveFields) {
      const session = createCoreHostObservabilitySession(
        `obs-sensitive-${field.key}`
      );
      session.observeLifecycleReport({
        ...lifecycleReport({}),
        [field.key]: field.value
      });
      const summary = session.summarize();
      expect(summary).toMatchObject({
        status: "blocked",
        stopReason: "sensitive_output_detected",
        failureClasses: ["SENSITIVE_OUTPUT_DETECTED"]
      });
      expect(JSON.stringify(summary)).not.toContain(String(field.value));
    }
  });

  it("enforces correlation, bounds, and release/reset without persistence", () => {
    const collector = createObservabilityCollector("obs-core-host-bounds-1");

    expect(
      observeLifecycleReport(
        collector,
        "obs-core-host-other-1",
        lifecycleReport({})
      )
    ).toEqual({
      accepted: false,
      reasonCode: "OBSERVATION_CORRELATION_MISMATCH",
      failureClass: "APPROVAL_OR_SCOPE_BLOCKED"
    });

    const boundedCollector = createObservabilityCollector(
      "obs-core-host-bounds-2"
    );
    for (let index = 0; index < OBSERVABILITY_MAX_OBSERVATIONS; index += 1) {
      expect(
        observeHelperReport(boundedCollector, "obs-core-host-bounds-2", {
          operation: "health",
          status: "passed"
        })
      ).toMatchObject({ accepted: true });
    }
    expect(
      observeHelperReport(boundedCollector, "obs-core-host-bounds-2", {
        operation: "health",
        status: "passed"
      })
    ).toEqual({
      accepted: false,
      reasonCode: "OBSERVATION_BOUNDS_EXCEEDED",
      failureClass: "APPROVAL_OR_SCOPE_BLOCKED"
    });

    const releasable = createCoreHostObservabilitySession(
      "obs-core-host-release-1"
    );
    releasable.observeHelperReport({
      operation: "release",
      status: "passed"
    });
    releasable.release();
    expect(releasable.summarize()).toMatchObject({
      status: "blocked",
      released: true,
      persisted: false,
      counters: {
        observationCount: 0,
        rejectedObservationCount: 0
      }
    });
  });
});

function lifecycleReport(
  overrides: Partial<CoreHostObservabilityLifecycleReport>
): CoreHostObservabilityLifecycleReport {
  return {
    operation: "activate",
    status: "passed",
    cleanupStatus: "not_required",
    rollbackStatus: "not_started",
    previousVersionPreserved: true,
    reasonCodes: ["MODEL_ACTIVATION_COMMITTED"],
    ...overrides
  };
}
