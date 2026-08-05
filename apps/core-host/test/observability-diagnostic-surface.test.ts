import { describe, expect, it } from "vitest";
import {
  OBSERVABILITY_MAX_COUNTER,
  OBSERVABILITY_MAX_REASON_CODES,
  type ObservabilitySummary
} from "@jarvis-k/contracts";
import {
  attachCoreHostObservabilityDiagnosticSurface,
  createCoreHostObservabilityDiagnosticSurface
} from "../src/observability-diagnostic-surface";

describe("Core Host Observability diagnostic surface", () => {
  it("attaches a passed summary as a sanitized diagnostic subreport", () => {
    const summary = observabilitySummary({
      status: "passed",
      currentPhase: "complete",
      healthState: "passed",
      loadState: "passed",
      releaseState: "passed",
      activationState: "committed",
      preservationState: "preserved",
      rollbackState: "not_required",
      cleanupState: "passed",
      reasonCodes: [
        "MODEL_ACTIVATION_COMMITTED",
        "HELPER_HEALTH_PASSED"
      ],
      counters: {
        ...baseCounters(),
        observationCount: 2,
        passedCount: 2,
        reasonCodeCount: 2
      }
    });

    const surface = createCoreHostObservabilityDiagnosticSurface({
      requested: true,
      expectedCorrelationId: "obs-diagnostic-1",
      summary
    });

    expect(surface).toMatchObject({
      observabilityAttached: true,
      diagnosticReason: "observability_summary_attached",
      status: "passed",
      currentPhase: "complete",
      healthState: "passed",
      loadState: "passed",
      releaseState: "passed",
      activationState: "committed",
      preservationState: "preserved",
      rollbackState: "not_required",
      cleanupState: "passed",
      timeoutOccurred: false,
      reasonCodes: ["MODEL_ACTIVATION_COMMITTED", "HELPER_HEALTH_PASSED"],
      failureClasses: [],
      released: false,
      persisted: false,
      rawDiagnosticsExposed: false
    });
    expect(surface).not.toHaveProperty("correlationId");
    expect(JSON.stringify(surface)).not.toMatch(
      /modelId|sha256|helperDiagnostics|sourceText|privatePath/iu
    );
  });

  it("attaches degraded, blocked, timeout, cancellation, cleanup, and released summaries", () => {
    const cases: Array<Partial<ObservabilitySummary>> = [
      {
        status: "degraded",
        currentPhase: "health_check",
        healthState: "degraded",
        stopReason: "health_failed",
        reasonCodes: ["MODEL_HEALTH_CHECK_FAILED"],
        failureClasses: ["HELPER_HEALTH_FAILED"]
      },
      {
        status: "blocked",
        currentPhase: "preflight",
        stopReason: "scope_violation",
        reasonCodes: ["OBSERVATION_BLOCKED"],
        failureClasses: ["APPROVAL_OR_SCOPE_BLOCKED"]
      },
      {
        status: "stopped",
        currentPhase: "load",
        timeoutOccurred: true,
        stopReason: "timeout",
        reasonCodes: ["HELPER_TIMEOUT", "OBSERVATION_STOPPED"],
        failureClasses: ["TIMEOUT_OR_CANCELLATION"]
      },
      {
        status: "stopped",
        currentPhase: "release",
        stopReason: "cancellation",
        reasonCodes: ["HELPER_CANCELLED", "OBSERVATION_STOPPED"],
        failureClasses: ["TIMEOUT_OR_CANCELLATION"]
      },
      {
        status: "stopped",
        currentPhase: "cleanup",
        cleanupState: "degraded",
        stopReason: "cleanup_failed",
        reasonCodes: ["MODEL_CLEANUP_FAILED"],
        failureClasses: ["CLEANUP_FAILED"]
      },
      {
        status: "blocked",
        released: true,
        reasonCodes: ["OBSERVATION_COLLECTOR_RELEASED"]
      }
    ];

    for (const item of cases) {
      const summary = observabilitySummary(item);
      const before = JSON.stringify(summary);
      const surface = createCoreHostObservabilityDiagnosticSurface({
        requested: true,
        expectedCorrelationId: "obs-diagnostic-1",
        summary
      });

      expect(surface.observabilityAttached).toBe(true);
      expect(surface.diagnosticReason).toBe("observability_summary_attached");
      expect(surface.status).toBe(item.status);
      expect(JSON.stringify(summary)).toBe(before);
    }
  });

  it("returns fixed reasons for missing and not-requested summaries", () => {
    expect(
      createCoreHostObservabilityDiagnosticSurface({
        requested: false,
        summary: observabilitySummary({})
      })
    ).toEqual({
      observabilityAttached: false,
      diagnosticReason: "observability_summary_not_requested",
      reasonCodes: [],
      failureClasses: [],
      persisted: false,
      rawDiagnosticsExposed: false
    });

    expect(
      createCoreHostObservabilityDiagnosticSurface({
        requested: true
      })
    ).toEqual({
      observabilityAttached: false,
      diagnosticReason: "observability_summary_missing",
      reasonCodes: [],
      failureClasses: [],
      persisted: false,
      rawDiagnosticsExposed: false
    });
  });

  it("rejects unknown shapes, enum values, bounds, and correlation mismatch", () => {
    expect(
      createCoreHostObservabilityDiagnosticSurface({
        requested: true,
        expectedCorrelationId: "obs-diagnostic-other",
        summary: observabilitySummary({})
      })
    ).toMatchObject({
      observabilityAttached: false,
      diagnosticReason: "observability_summary_rejected",
      status: "blocked",
      stopReason: "scope_violation",
      reasonCodes: ["OBSERVATION_INPUT_INVALID"],
      failureClasses: ["APPROVAL_OR_SCOPE_BLOCKED"]
    });

    expect(
      createCoreHostObservabilityDiagnosticSurface({
        requested: true,
        summary: {
          ...observabilitySummary({}),
          status: "unknown"
        }
      })
    ).toMatchObject({
      diagnosticReason: "observability_summary_rejected",
      failureClasses: ["INPUT_VERIFICATION_FAILED"]
    });

    expect(
      createCoreHostObservabilityDiagnosticSurface({
        requested: true,
        summary: {
          ...observabilitySummary({}),
          reasonCodes: Array.from(
            { length: OBSERVABILITY_MAX_REASON_CODES + 1 },
            () => "OBSERVATION_STARTED"
          )
        }
      })
    ).toMatchObject({
      diagnosticReason: "observability_summary_rejected",
      failureClasses: ["INPUT_VERIFICATION_FAILED"]
    });

    expect(
      createCoreHostObservabilityDiagnosticSurface({
        requested: true,
        summary: {
          ...observabilitySummary({}),
          counters: {
            ...baseCounters(),
            failedCount: OBSERVABILITY_MAX_COUNTER + 1
          }
        }
      })
    ).toMatchObject({
      diagnosticReason: "observability_summary_rejected",
      failureClasses: ["INPUT_VERIFICATION_FAILED"]
    });
  });

  it("rejects sensitive summary fields and values without retaining raw data", () => {
    const sensitiveSummaries = [
      { modelId: "redacted-model" },
      { sha256: "redacted-digest" },
      { sourceText: "redacted source text" },
      { helperDiagnostics: "redacted helper output" },
      { errorMessage: "redacted error" },
      { stackTrace: "redacted stack" },
      { envValue: "redacted env" },
      { command: "redacted command" },
      { script: "redacted script" },
      { cachePath: "redacted cache" },
      { artifactPath: "redacted artifact" },
      { rawUrl: "https://example.invalid/private" },
      { privatePath: "C:\\Users\\Administrator\\private" },
      { processId: 123 },
      { hostName: "redacted-host" },
      { userName: "redacted-user" },
      { testerId: "redacted-tester" },
      { vectors: [1, 2, 3] }
    ];

    for (const sensitive of sensitiveSummaries) {
      const surface = createCoreHostObservabilityDiagnosticSurface({
        requested: true,
        summary: {
          ...observabilitySummary({}),
          ...sensitive
        }
      });

      expect(surface).toMatchObject({
        observabilityAttached: false,
        diagnosticReason: "observability_summary_rejected",
        stopReason: "sensitive_output_detected",
        failureClasses: ["SENSITIVE_OUTPUT_DETECTED"],
        persisted: false,
        rawDiagnosticsExposed: false
      });
      expect(JSON.stringify(surface)).not.toMatch(
        /redacted|example\.invalid|Administrator/iu
      );
    }
  });

  it("attaches only to sanitized report-shaped objects", () => {
    const summary = observabilitySummary({});
    const result = attachCoreHostObservabilityDiagnosticSurface({
      requested: true,
      expectedCorrelationId: "obs-diagnostic-1",
      summary,
      report: {
        mode: "fixture_diagnostic",
        status: "passed",
        accepted: true,
        count: 1
      }
    });

    expect(result).toMatchObject({
      attached: true,
      report: {
        mode: "fixture_diagnostic",
        status: "passed",
        accepted: true,
        count: 1,
        observability: {
          observabilityAttached: true,
          diagnosticReason: "observability_summary_attached"
        }
      }
    });
    if (result.attached) {
      expect(result.report.observability).not.toHaveProperty("correlationId");
    }

    const rejected = attachCoreHostObservabilityDiagnosticSurface({
      requested: true,
      expectedCorrelationId: "obs-diagnostic-1",
      summary,
      report: {
        mode: "fixture_diagnostic",
        sourceText: "private input"
      }
    });
    expect(rejected).toMatchObject({
      attached: false,
      reason: "observability_summary_rejected",
      observability: {
        observabilityAttached: false,
        failureClasses: ["SENSITIVE_OUTPUT_DETECTED"]
      }
    });
    expect(JSON.stringify(rejected)).not.toContain("private input");
  });
});

function observabilitySummary(
  overrides: Partial<ObservabilitySummary>
): ObservabilitySummary {
  return {
    correlationId: "obs-diagnostic-1",
    domains: ["model_lifecycle"],
    currentPhase: "activation",
    status: "passed",
    healthState: "not_started",
    loadState: "not_started",
    releaseState: "not_started",
    activationState: "committed",
    preservationState: "preserved",
    rollbackState: "not_started",
    cleanupState: "passed",
    timeoutOccurred: false,
    reasonCodes: ["MODEL_ACTIVATION_COMMITTED"],
    failureClasses: [],
    counters: baseCounters(),
    released: false,
    persisted: false,
    rawDiagnosticsExposed: false,
    ...overrides
  };
}

function baseCounters() {
  return {
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
  };
}
