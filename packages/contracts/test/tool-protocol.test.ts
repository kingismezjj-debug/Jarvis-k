import { describe, expect, it } from "vitest";
import {
  ToolArgumentsSchema,
  ToolAuditRecordSchema,
  ToolDescriptorSchema,
  ToolExecutionCountersSchema,
  ToolExecutionLifecycleStatusSchema,
  ToolFailureClassSchema,
  ToolExecutionResultSchema,
  ToolInvocationRequestSchema,
  ToolPolicyDecisionSchema,
  ToolPolicySchema,
  ToolRollbackStateSchema,
  ToolCleanupStateSchema
} from "../src";

describe("tool governance protocol", () => {
  it("validates provider-neutral descriptors, policies, and invocation requests", () => {
    const descriptor = ToolDescriptorSchema.parse({
      id: "fixture.memory.inspect",
      version: "1.0.0",
      description: "Inspect a fixture memory record.",
      risk: "read_only",
      execution: "fixture",
      requiredPermissions: ["memory.read"],
      requiresConfirmation: false,
      inputSchemaId: "tool.fixture.memory.inspect.input"
    });
    const policy = ToolPolicySchema.parse({
      policyVersion: "1.0.0",
      allowedToolIds: [descriptor.id],
      blockedToolIds: [],
      allowedPermissionScopes: ["memory.read"],
      confirmationRequiredFor: ["mutating", "destructive"],
      fixtureExecutionEnabled: true,
      windowsExecutionEnabled: false,
      networkAccessAllowed: false,
      shellExecutionAllowed: false
    });
    const request = ToolInvocationRequestSchema.parse({
      requestId: "request-1",
      toolId: descriptor.id,
      input: {
        conversationId: "primary",
        limit: 3
      },
      dryRun: true
    });

    expect(descriptor.execution).toBe("fixture");
    expect(policy.fixtureExecutionEnabled).toBe(true);
    expect(request.input.limit).toBe(3);
  });

  it("rejects command, secret, network, and oversized argument fields", () => {
    expect(() =>
      ToolArgumentsSchema.parse({
        command: "not-executable"
      })
    ).toThrow();
    expect(() =>
      ToolArgumentsSchema.parse({
        apiKey: "not-a-credential"
      })
    ).toThrow();
    expect(() =>
      ToolArgumentsSchema.parse({
        network: "disabled"
      })
    ).toThrow();
    expect(() =>
      ToolArgumentsSchema.parse({
        privatePath: "C:\\Users\\Administrator\\private"
      })
    ).toThrow();
    expect(() =>
      ToolArgumentsSchema.parse({
        target: "https://example.invalid/private"
      })
    ).toThrow();
    expect(() =>
      ToolArgumentsSchema.parse({
        stdout: "redacted"
      })
    ).toThrow();
    expect(() =>
      ToolArgumentsSchema.parse(
        Object.fromEntries(
          Array.from({ length: 33 }, (_, index) => [`field${index}`, index])
        )
      )
    ).toThrow();
  });

  it("keeps audit and execution results sanitized", () => {
    const audit = ToolAuditRecordSchema.parse({
      policyVersion: "1.0.0",
      requestId: "request-1",
      toolId: "fixture.memory.inspect",
      decision: "allowed",
      reasonCode: "ALLOWED",
      confirmationRequired: false,
      confirmationGranted: false,
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });
    const decision = ToolPolicyDecisionSchema.parse({
      requestId: "request-1",
      toolId: "fixture.memory.inspect",
      status: "allowed",
      allowed: true,
      confirmationRequired: false,
      reasonCode: "ALLOWED",
      audit
    });
    const result = ToolExecutionResultSchema.parse({
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
      audit
    });

    expect(decision).not.toHaveProperty("input");
    expect(result).not.toHaveProperty("output");
    expect(result).not.toHaveProperty("command");
    expect(JSON.stringify(result)).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("validates lifecycle, failure, rollback, cleanup, and counter contracts", () => {
    expect(ToolExecutionLifecycleStatusSchema.parse("timed_out")).toBe(
      "timed_out"
    );
    expect(ToolFailureClassSchema.parse("TIMEOUT_OR_CANCELLATION")).toBe(
      "TIMEOUT_OR_CANCELLATION"
    );
    expect(ToolRollbackStateSchema.parse("not_required")).toBe("not_required");
    expect(ToolCleanupStateSchema.parse("failed")).toBe("failed");
    expect(
      ToolExecutionCountersSchema.parse({
        invocationCount: 1,
        startedCount: 0,
        completedCount: 0,
        deniedCount: 0,
        degradedCount: 0,
        blockedCount: 0,
        timedOutCount: 1,
        cancelledCount: 0,
        rollbackCount: 1,
        cleanupCount: 1,
        reasonCodeCount: 2,
        failureClassCount: 1
      })
    ).toMatchObject({
      timedOutCount: 1,
      failureClassCount: 1
    });
    expect(() =>
      ToolExecutionResultSchema.parse({
        requestId: "request-1",
        toolId: "fixture.memory.inspect",
        status: "completed",
        resultCode: "FIXTURE_DRY_RUN",
        reasonCodes: ["FIXTURE_DRY_RUN", "FIXTURE_DRY_RUN"],
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
          reasonCodeCount: 2,
          failureClassCount: 0
        },
        startedAt: "2026-08-01T00:00:00.000Z",
        completedAt: "2026-08-01T00:00:00.000Z",
        audit: {
          policyVersion: "1.0.0",
          requestId: "request-1",
          toolId: "fixture.memory.inspect",
          decision: "allowed",
          reasonCode: "ALLOWED",
          confirmationRequired: false,
          confirmationGranted: false,
          evaluatedAt: "2026-08-01T00:00:00.000Z"
        }
      })
    ).toThrow();
  });

  it("keeps real Windows, network, and shell execution disabled", () => {
    expect(() =>
      ToolPolicySchema.parse({
        policyVersion: "1.0.0",
        allowedToolIds: [],
        blockedToolIds: [],
        allowedPermissionScopes: [],
        confirmationRequiredFor: ["mutating"],
        fixtureExecutionEnabled: false,
        windowsExecutionEnabled: true,
        networkAccessAllowed: false,
        shellExecutionAllowed: false
      })
    ).toThrow();
    expect(() =>
      ToolPolicySchema.parse({
        policyVersion: "1.0.0",
        allowedToolIds: [],
        blockedToolIds: [],
        allowedPermissionScopes: [],
        confirmationRequiredFor: ["mutating"],
        fixtureExecutionEnabled: false,
        windowsExecutionEnabled: false,
        networkAccessAllowed: true,
        shellExecutionAllowed: false
      })
    ).toThrow();
  });
});
