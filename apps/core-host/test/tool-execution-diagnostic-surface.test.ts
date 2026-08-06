import { describe, expect, it } from "vitest";
import type {
  ToolExecutionResult,
  ToolPolicyDecision
} from "@jarvis-k/contracts";
import {
  attachCoreHostToolExecutionDiagnosticSurface,
  createCoreHostToolExecutionDiagnosticSurface
} from "../src/tool-execution-diagnostic-surface";

const audit = {
  policyVersion: "1.0.0",
  requestId: "request-1",
  toolId: "fixture.memory.inspect",
  decision: "allowed" as const,
  reasonCode: "FIXTURE_DRY_RUN" as const,
  confirmationRequired: false,
  confirmationGranted: false,
  evaluatedAt: "2026-08-01T00:00:00.000Z"
};

describe("Core Host Tool Execution diagnostic surface", () => {
  it("attaches a completed execution result as a sanitized diagnostic subreport", () => {
    const result = executionResult({});
    const surface = createCoreHostToolExecutionDiagnosticSurface({
      requested: true,
      summary: result
    });

    expect(surface).toMatchObject({
      toolExecutionAttached: true,
      diagnosticReason: "tool_execution_summary_attached",
      toolId: "fixture.memory.inspect",
      status: "completed",
      resultCode: "FIXTURE_DRY_RUN",
      reasonCodes: [
        "FIXTURE_DRY_RUN",
        "TOOL_ROLLBACK_NOT_REQUIRED",
        "TOOL_CLEANUP_PASSED"
      ],
      failureClasses: [],
      timeoutOccurred: false,
      cancelled: false,
      rollbackState: "not_required",
      cleanupState: "passed",
      confirmationRequired: false,
      confirmationGranted: false,
      persisted: false,
      rawDiagnosticsExposed: false
    });
    expect(surface.counters).toMatchObject({
      completedCount: 1,
      reasonCodeCount: 3,
      failureClassCount: 0
    });
    expect(surface).not.toHaveProperty("requestId");
    expect(surface).not.toHaveProperty("audit");
    expectSanitized(surface);
  });

  it("attaches denied, confirmation, degraded, blocked, timeout, cancellation, rollback, cleanup, and sensitive-output results", () => {
    const cases: Array<Partial<ToolExecutionResult>> = [
      {
        status: "denied",
        resultCode: "TOOL_BLOCKED",
        reasonCodes: ["TOOL_BLOCKED", "TOOL_ROLLBACK_NOT_REQUIRED"],
        failureClasses: ["POLICY_DENIED"],
        cleanupState: "not_required"
      },
      {
        status: "needs_confirmation",
        resultCode: "CONFIRMATION_REQUIRED",
        reasonCodes: [
          "CONFIRMATION_REQUIRED",
          "TOOL_ROLLBACK_NOT_REQUIRED"
        ],
        failureClasses: ["CONFIRMATION_MISSING"],
        cleanupState: "not_required",
        audit: {
          ...audit,
          decision: "needs_confirmation",
          reasonCode: "CONFIRMATION_REQUIRED",
          confirmationRequired: true
        }
      },
      {
        status: "degraded",
        resultCode: "FIXTURE_EXECUTOR_UNAVAILABLE",
        reasonCodes: [
          "FIXTURE_EXECUTOR_UNAVAILABLE",
          "TOOL_ROLLBACK_NOT_REQUIRED"
        ],
        failureClasses: ["FIXTURE_UNAVAILABLE"],
        cleanupState: "not_required"
      },
      {
        status: "blocked",
        resultCode: "TOOL_SANDBOX_SCOPE_VIOLATION",
        reasonCodes: [
          "TOOL_SANDBOX_SCOPE_VIOLATION",
          "TOOL_ROLLBACK_NOT_REQUIRED",
          "TOOL_CLEANUP_PASSED"
        ],
        failureClasses: ["SANDBOX_SCOPE_VIOLATION"]
      },
      {
        status: "timed_out",
        resultCode: "TOOL_EXECUTION_TIMED_OUT",
        reasonCodes: [
          "TOOL_EXECUTION_TIMED_OUT",
          "TOOL_ROLLBACK_NOT_REQUIRED",
          "TOOL_CLEANUP_PASSED"
        ],
        failureClasses: ["TIMEOUT_OR_CANCELLATION"],
        timeoutOccurred: true
      },
      {
        status: "cancelled",
        resultCode: "TOOL_EXECUTION_CANCELLED",
        reasonCodes: [
          "TOOL_EXECUTION_CANCELLED",
          "TOOL_ROLLBACK_NOT_REQUIRED",
          "TOOL_CLEANUP_PASSED"
        ],
        failureClasses: ["TIMEOUT_OR_CANCELLATION"],
        cancelled: true
      },
      {
        status: "degraded",
        resultCode: "TOOL_ROLLBACK_FAILED",
        reasonCodes: ["TOOL_ROLLBACK_FAILED", "TOOL_CLEANUP_PASSED"],
        failureClasses: ["ROLLBACK_FAILED"],
        rollbackState: "failed"
      },
      {
        status: "degraded",
        resultCode: "TOOL_CLEANUP_FAILED",
        reasonCodes: [
          "TOOL_CLEANUP_FAILED",
          "TOOL_ROLLBACK_NOT_REQUIRED"
        ],
        failureClasses: ["CLEANUP_FAILED"],
        cleanupState: "failed"
      },
      {
        status: "blocked",
        resultCode: "SENSITIVE_OUTPUT_DETECTED",
        reasonCodes: [
          "SENSITIVE_OUTPUT_DETECTED",
          "TOOL_ROLLBACK_NOT_REQUIRED",
          "TOOL_CLEANUP_PASSED"
        ],
        failureClasses: ["SENSITIVE_OUTPUT_DETECTED"]
      }
    ];

    for (const item of cases) {
      const surface = createCoreHostToolExecutionDiagnosticSurface({
        requested: true,
        summary: executionResult(item)
      });

      expect(surface.toolExecutionAttached).toBe(true);
      expect(surface.diagnosticReason).toBe(
        "tool_execution_summary_attached"
      );
      expect(surface.status).toBe(item.status);
      expect(surface.resultCode).toBe(item.resultCode);
      expect(surface.failureClasses).toEqual(item.failureClasses);
      expectSanitized(surface);
    }
  });

  it("converts policy decisions, wrapper reports, and session summaries", () => {
    const decision = policyDecision({
      status: "needs_confirmation",
      allowed: false,
      confirmationRequired: true,
      reasonCode: "CONFIRMATION_REQUIRED",
      audit: {
        ...audit,
        decision: "needs_confirmation",
        reasonCode: "CONFIRMATION_REQUIRED",
        confirmationRequired: true
      }
    });
    const decisionSurface = createCoreHostToolExecutionDiagnosticSurface({
      requested: true,
      summary: decision
    });
    const wrapperSurface = createCoreHostToolExecutionDiagnosticSurface({
      requested: true,
      summary: {
        accepted: true,
        status: "executed",
        reasonCode: "FIXTURE_DRY_RUN",
        toolCount: 1,
        sessionReleased: false,
        result: executionResult({})
      }
    });
    const summarySurface = createCoreHostToolExecutionDiagnosticSurface({
      requested: true,
      summary: {
        toolCount: 1,
        decisionCount: 2,
        executionCount: 3,
        sessionReleased: true,
        persisted: false,
        rawDiagnosticsExposed: false
      }
    });

    expect(decisionSurface).toMatchObject({
      status: "needs_confirmation",
      resultCode: "CONFIRMATION_REQUIRED",
      reasonCodes: ["CONFIRMATION_REQUIRED"],
      failureClasses: ["CONFIRMATION_MISSING"],
      confirmationRequired: true,
      counters: {
        decisionCount: 1,
        reasonCodeCount: 1,
        failureClassCount: 1
      }
    });
    expect(wrapperSurface).toMatchObject({
      status: "completed",
      wrapperStatus: "executed",
      counters: {
        toolCount: 1,
        completedCount: 1
      },
      sessionReleased: false
    });
    expect(summarySurface).toMatchObject({
      status: "released",
      reasonCodes: [],
      failureClasses: [],
      counters: {
        toolCount: 1,
        decisionCount: 2,
        executionCount: 3
      },
      sessionReleased: true,
      persisted: false,
      rawDiagnosticsExposed: false
    });
    expectSanitized(decisionSurface);
    expectSanitized(wrapperSurface);
    expectSanitized(summarySurface);
  });

  it("returns fixed reasons for missing and not-requested summaries", () => {
    expect(
      createCoreHostToolExecutionDiagnosticSurface({
        requested: false,
        summary: executionResult({})
      })
    ).toEqual({
      toolExecutionAttached: false,
      diagnosticReason: "tool_execution_summary_not_requested",
      reasonCodes: [],
      failureClasses: [],
      persisted: false,
      rawDiagnosticsExposed: false
    });

    expect(
      createCoreHostToolExecutionDiagnosticSurface({
        requested: true
      })
    ).toEqual({
      toolExecutionAttached: false,
      diagnosticReason: "tool_execution_summary_missing",
      reasonCodes: [],
      failureClasses: [],
      persisted: false,
      rawDiagnosticsExposed: false
    });
  });

  it("rejects unknown shapes, enum values, duplicates, bounds, and unsafe persistence flags", () => {
    const rejectedCases = [
      { mode: "unknown" },
      {
        ...executionResult({}),
        status: "mystery"
      },
      {
        ...executionResult({}),
        reasonCodes: ["FIXTURE_DRY_RUN", "FIXTURE_DRY_RUN"]
      },
      {
        ...executionResult({}),
        counters: {
          ...executionResult({}).counters,
          completedCount: 1_025
        }
      },
      {
        toolCount: 1,
        decisionCount: 0,
        executionCount: 0,
        sessionReleased: false,
        persisted: true,
        rawDiagnosticsExposed: false
      },
      {
        toolCount: 1,
        decisionCount: 0,
        executionCount: 0,
        sessionReleased: false,
        persisted: false,
        rawDiagnosticsExposed: true
      },
      {
        accepted: true,
        status: "executed",
        reasonCode: "FIXTURE_DRY_RUN",
        toolCount: 1_025,
        sessionReleased: false
      }
    ];

    for (const summary of rejectedCases) {
      const surface = createCoreHostToolExecutionDiagnosticSurface({
        requested: true,
        summary
      });

      expect(surface).toMatchObject({
        toolExecutionAttached: false,
        diagnosticReason: "tool_execution_summary_rejected",
        status: "blocked",
        resultCode: "UNKNOWN_SANITIZED_FAILURE",
        failureClasses: ["UNKNOWN_SANITIZED_FAILURE"],
        persisted: false,
        rawDiagnosticsExposed: false
      });
      expectSanitized(surface);
    }
  });

  it("rejects sensitive summary fields and values without retaining raw data", () => {
    const sensitiveSummaries = [
      { rawToolInput: "private input" },
      { rawToolOutput: "private output" },
      { stdout: "private stdout" },
      { stderr: "private stderr" },
      { privatePath: "C:\\Users\\Administrator\\private" },
      { rawUrl: "https://example.invalid/private" },
      { credential: "redacted credential" },
      { token: "Bearer redacted" },
      { command: "redacted command" },
      { script: "redacted script" },
      { stackTrace: "redacted stack" },
      { envValue: "redacted env" },
      { processId: 123 },
      { hostName: "redacted-host" },
      { userName: "redacted-user" },
      { testerId: "redacted-tester" },
      { modelId: "redacted-model" },
      { digest: "redacted-digest" },
      { vector: [1, 2, 3] },
      { sourceText: "redacted source" },
      { memoryRecord: "redacted memory" },
      { helperDiagnostics: "redacted helper output" },
      { descriptor: { id: "fixture.memory.inspect" } },
      { policy: { allowedToolIds: ["fixture.memory.inspect"] } }
    ];

    for (const sensitive of sensitiveSummaries) {
      const surface = createCoreHostToolExecutionDiagnosticSurface({
        requested: true,
        summary: {
          ...executionResult({}),
          ...sensitive
        }
      });

      expect(surface).toMatchObject({
        toolExecutionAttached: false,
        diagnosticReason: "tool_execution_summary_rejected",
        resultCode: "SENSITIVE_OUTPUT_DETECTED",
        failureClasses: ["SENSITIVE_OUTPUT_DETECTED"],
        persisted: false,
        rawDiagnosticsExposed: false
      });
      expect(JSON.stringify(surface)).not.toMatch(
        /private|redacted|example\.invalid|Administrator/iu
      );
    }
  });

  it("attaches only to sanitized report-shaped objects", () => {
    const attached = attachCoreHostToolExecutionDiagnosticSurface({
      requested: true,
      summary: executionResult({}),
      report: {
        mode: "fixture_diagnostic",
        status: "passed",
        accepted: true,
        count: 1
      }
    });

    expect(attached).toMatchObject({
      attached: true,
      report: {
        mode: "fixture_diagnostic",
        status: "passed",
        accepted: true,
        count: 1,
        toolExecution: {
          toolExecutionAttached: true,
          diagnosticReason: "tool_execution_summary_attached"
        }
      }
    });
    if (attached.attached) {
      expect(attached.report.toolExecution).not.toHaveProperty("requestId");
    }

    const rejected = attachCoreHostToolExecutionDiagnosticSurface({
      requested: true,
      summary: executionResult({}),
      report: {
        mode: "fixture_diagnostic",
        sourceText: "private input"
      }
    });
    expect(rejected).toMatchObject({
      attached: false,
      reason: "tool_execution_summary_rejected",
      toolExecution: {
        toolExecutionAttached: false,
        failureClasses: ["SENSITIVE_OUTPUT_DETECTED"]
      }
    });
    expect(JSON.stringify(rejected)).not.toContain("private input");
  });
});

function executionResult(
  overrides: Partial<ToolExecutionResult>
): ToolExecutionResult {
  return {
    requestId: "request-1",
    toolId: "fixture.memory.inspect",
    status: "completed",
    resultCode: "FIXTURE_DRY_RUN",
    reasonCodes: [
      "FIXTURE_DRY_RUN",
      "TOOL_ROLLBACK_NOT_REQUIRED",
      "TOOL_CLEANUP_PASSED"
    ],
    failureClasses: [],
    timeoutOccurred: false,
    cancelled: false,
    rollbackState: "not_required",
    cleanupState: "passed",
    counters: {
      invocationCount: 1,
      startedCount: 0,
      completedCount: 1,
      deniedCount: 0,
      degradedCount: 0,
      blockedCount: 0,
      timedOutCount: 0,
      cancelledCount: 0,
      rollbackCount: 1,
      cleanupCount: 1,
      reasonCodeCount: 3,
      failureClassCount: 0
    },
    startedAt: "2026-08-01T00:00:00.000Z",
    completedAt: "2026-08-01T00:00:00.000Z",
    audit,
    ...overrides
  };
}

function policyDecision(
  overrides: Partial<ToolPolicyDecision>
): ToolPolicyDecision {
  return {
    requestId: "request-1",
    toolId: "fixture.memory.inspect",
    status: "allowed",
    allowed: true,
    confirmationRequired: false,
    reasonCode: "ALLOWED",
    audit: {
      ...audit,
      reasonCode: "ALLOWED"
    },
    ...overrides
  };
}

function expectSanitized(report: unknown) {
  expect(JSON.stringify(report)).not.toMatch(
    /(?:request-1|https?:\/\/|[A-Za-z]:\\|\\\\|command|script|stdout|stderr|stack|env|processId|credential|secret|token|rawToolInput|rawToolOutput|helperDiagnostics|sourceText|digest|vector|memoryRecord|descriptor|allowedToolIds)/iu
  );
}
