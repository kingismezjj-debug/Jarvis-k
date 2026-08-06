import { describe, expect, it } from "vitest";
import {
  decideToolInvocation,
  FixtureToolExecutor
} from "../src";
import type {
  ToolDescriptor,
  ToolPolicy,
  ToolInvocationRequest
} from "@jarvis-k/contracts";

const readOnlyDescriptor: ToolDescriptor = {
  id: "fixture.memory.inspect",
  version: "1.0.0",
  description: "Inspect a fixture memory record.",
  risk: "read_only",
  execution: "fixture",
  requiredPermissions: ["memory.read"],
  requiresConfirmation: false,
  inputSchemaId: "tool.fixture.memory.inspect.input"
};

const readOnlyPolicy: ToolPolicy = {
  policyVersion: "1.0.0",
  allowedToolIds: [readOnlyDescriptor.id],
  blockedToolIds: [],
  allowedPermissionScopes: ["memory.read"],
  confirmationRequiredFor: ["mutating", "destructive"],
  fixtureExecutionEnabled: true,
  windowsExecutionEnabled: false,
  networkAccessAllowed: false,
  shellExecutionAllowed: false
};

const readOnlyRequest: ToolInvocationRequest = {
  requestId: "request-1",
  toolId: readOnlyDescriptor.id,
  input: {
    conversationId: "primary",
    limit: 3
  },
  dryRun: true
};

async function executeFixture(options?: {
  fixtureImplementationAvailable?: boolean;
  executorOptions?: ConstructorParameters<typeof FixtureToolExecutor>[3];
  request?: ToolInvocationRequest;
  policy?: ToolPolicy;
  descriptors?: ToolDescriptor[];
}) {
  return new FixtureToolExecutor(
    options?.descriptors ?? [readOnlyDescriptor],
    options?.policy ?? readOnlyPolicy,
    options?.fixtureImplementationAvailable ?? true,
    options?.executorOptions ?? {}
  ).execute({
    request: options?.request ?? readOnlyRequest,
    evaluatedAt: "2026-08-01T00:00:00.000Z"
  });
}

function expectSanitizedResult(result: unknown) {
  expect(result).not.toHaveProperty("input");
  expect(result).not.toHaveProperty("output");
  expect(JSON.stringify(result)).not.toMatch(
    /(?:https?:\/\/|[A-Za-z]:\\|\\\\|command|script|stdout|stderr|stack|env|process|token|credential|secret)/iu
  );
}

describe("tool governance", () => {
  it("allows an allowlisted read-only fixture tool", () => {
    const decision = decideToolInvocation({
      policy: readOnlyPolicy,
      descriptor: readOnlyDescriptor,
      request: readOnlyRequest,
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });

    expect(decision).toMatchObject({
      status: "allowed",
      allowed: true,
      confirmationRequired: false,
      reasonCode: "ALLOWED",
      audit: {
        decision: "allowed",
        confirmationGranted: false
      }
    });
    expect(decision).not.toHaveProperty("input");
  });

  it("requires confirmation for mutating tools before fixture execution", () => {
    const descriptor: ToolDescriptor = {
      ...readOnlyDescriptor,
      id: "fixture.memory.update",
      description: "Update a fixture memory record.",
      risk: "mutating",
      requiredPermissions: ["memory.write"],
      requiresConfirmation: true,
      inputSchemaId: "tool.fixture.memory.update.input"
    };
    const policy: ToolPolicy = {
      ...readOnlyPolicy,
      allowedToolIds: [descriptor.id],
      allowedPermissionScopes: ["memory.write"]
    };
    const request: ToolInvocationRequest = {
      ...readOnlyRequest,
      toolId: descriptor.id,
      input: {
        memoryId: "memory-1",
        value: "fixture update"
      }
    };

    const pending = decideToolInvocation({
      policy,
      descriptor,
      request,
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });
    const approved = decideToolInvocation({
      policy,
      descriptor,
      request,
      confirmationGranted: true,
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });

    expect(pending).toMatchObject({
      status: "needs_confirmation",
      allowed: false,
      reasonCode: "CONFIRMATION_REQUIRED"
    });
    expect(approved).toMatchObject({
      status: "allowed",
      allowed: true,
      reasonCode: "ALLOWED"
    });
  });

  it("denies blocked, unpermissioned, Windows, and shell tools", () => {
    const blocked = decideToolInvocation({
      policy: {
        ...readOnlyPolicy,
        blockedToolIds: [readOnlyDescriptor.id]
      },
      descriptor: readOnlyDescriptor,
      request: readOnlyRequest,
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });
    const unpermissioned = decideToolInvocation({
      policy: {
        ...readOnlyPolicy,
        allowedPermissionScopes: []
      },
      descriptor: readOnlyDescriptor,
      request: readOnlyRequest,
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });
    const windows = decideToolInvocation({
      policy: {
        ...readOnlyPolicy,
        allowedToolIds: [readOnlyDescriptor.id, "fixture.windows.inspect"]
      },
      descriptor: {
        ...readOnlyDescriptor,
        id: "fixture.windows.inspect",
        execution: "windows"
      },
      request: {
        ...readOnlyRequest,
        toolId: "fixture.windows.inspect"
      },
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });
    const shell = decideToolInvocation({
      policy: {
        ...readOnlyPolicy,
        allowedToolIds: ["fixture.process.inspect"],
        allowedPermissionScopes: ["process.execute"]
      },
      descriptor: {
        ...readOnlyDescriptor,
        id: "fixture.process.inspect",
        requiredPermissions: ["process.execute"]
      },
      request: {
        ...readOnlyRequest,
        toolId: "fixture.process.inspect"
      },
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });

    expect(blocked.reasonCode).toBe("TOOL_BLOCKED");
    expect(unpermissioned.reasonCode).toBe("PERMISSION_DENIED");
    expect(windows.reasonCode).toBe("WINDOWS_EXECUTION_DISABLED");
    expect(shell.reasonCode).toBe("SHELL_EXECUTION_DISABLED");
    expect([blocked, unpermissioned, windows, shell]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ allowed: false, status: "denied" })
      ])
    );
  });

  it("keeps filesystem, screen, clipboard, and network-like tools disabled", () => {
    const filesystem = decideToolInvocation({
      policy: {
        ...readOnlyPolicy,
        allowedToolIds: ["fixture.files.inspect"],
        allowedPermissionScopes: ["filesystem.read"]
      },
      descriptor: {
        ...readOnlyDescriptor,
        id: "fixture.files.inspect",
        requiredPermissions: ["filesystem.read"],
        inputSchemaId: "tool.fixture.files.inspect.input"
      },
      request: {
        ...readOnlyRequest,
        toolId: "fixture.files.inspect"
      },
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });
    const screen = decideToolInvocation({
      policy: {
        ...readOnlyPolicy,
        allowedToolIds: ["fixture.screen.inspect"],
        allowedPermissionScopes: ["screen.capture"]
      },
      descriptor: {
        ...readOnlyDescriptor,
        id: "fixture.screen.inspect",
        requiredPermissions: ["screen.capture"],
        inputSchemaId: "tool.fixture.screen.inspect.input"
      },
      request: {
        ...readOnlyRequest,
        toolId: "fixture.screen.inspect"
      },
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });
    const clipboard = decideToolInvocation({
      policy: {
        ...readOnlyPolicy,
        allowedToolIds: ["fixture.clipboard.inspect"],
        allowedPermissionScopes: ["clipboard.read"]
      },
      descriptor: {
        ...readOnlyDescriptor,
        id: "fixture.clipboard.inspect",
        requiredPermissions: ["clipboard.read"],
        inputSchemaId: "tool.fixture.clipboard.inspect.input"
      },
      request: {
        ...readOnlyRequest,
        toolId: "fixture.clipboard.inspect"
      },
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });
    const network = decideToolInvocation({
      policy: {
        ...readOnlyPolicy,
        allowedToolIds: ["fixture.network.inspect"]
      },
      descriptor: {
        ...readOnlyDescriptor,
        id: "fixture.network.inspect",
        inputSchemaId: "tool.fixture.network.inspect.input"
      },
      request: {
        ...readOnlyRequest,
        toolId: "fixture.network.inspect"
      },
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });

    expect(filesystem.reasonCode).toBe("EXECUTION_DISABLED");
    expect(screen.reasonCode).toBe("EXECUTION_DISABLED");
    expect(clipboard.reasonCode).toBe("EXECUTION_DISABLED");
    expect(network.reasonCode).toBe("NETWORK_EXECUTION_DISABLED");
  });

  it("executes only the sanitized fixture result and reports degradation", async () => {
    const completed = await executeFixture();
    const degraded = await executeFixture({
      fixtureImplementationAvailable: false
    });

    expect(completed).toMatchObject({
      status: "completed",
      resultCode: "FIXTURE_DRY_RUN",
      reasonCodes: [
        "FIXTURE_DRY_RUN",
        "TOOL_ROLLBACK_NOT_REQUIRED",
        "TOOL_CLEANUP_PASSED"
      ],
      failureClasses: [],
      rollbackState: "not_required",
      cleanupState: "passed",
      counters: {
        invocationCount: 1,
        completedCount: 1,
        rollbackCount: 1,
        cleanupCount: 1,
        reasonCodeCount: 3,
        failureClassCount: 0
      }
    });
    expect(degraded).toMatchObject({
      status: "degraded",
      resultCode: "FIXTURE_EXECUTOR_UNAVAILABLE",
      failureClasses: ["FIXTURE_UNAVAILABLE"],
      rollbackState: "not_required",
      cleanupState: "not_required",
      counters: {
        degradedCount: 1,
        failureClassCount: 1
      }
    });
    expectSanitizedResult(completed);
    expectSanitizedResult(degraded);
  });

  it("keeps execution disabled when the fixture policy is off", async () => {
    const result = await new FixtureToolExecutor(
      [readOnlyDescriptor],
      {
        ...readOnlyPolicy,
        fixtureExecutionEnabled: false
      }
    ).execute({
      request: readOnlyRequest,
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });

    expect(result).toMatchObject({
      status: "denied",
      resultCode: "EXECUTION_DISABLED",
      failureClasses: ["EXECUTION_DISABLED"],
      counters: {
        deniedCount: 1,
        failureClassCount: 1
      }
    });
    expectSanitizedResult(result);
  });

  it("reports confirmation-missing policy denials without execution details", async () => {
    const descriptor: ToolDescriptor = {
      ...readOnlyDescriptor,
      id: "fixture.memory.update",
      description: "Update a fixture memory record.",
      risk: "mutating",
      requiredPermissions: ["memory.write"],
      requiresConfirmation: true,
      inputSchemaId: "tool.fixture.memory.update.input"
    };
    const result = await executeFixture({
      descriptors: [descriptor],
      policy: {
        ...readOnlyPolicy,
        allowedToolIds: [descriptor.id],
        allowedPermissionScopes: ["memory.write"]
      },
      request: {
        ...readOnlyRequest,
        toolId: descriptor.id,
        input: {
          memoryId: "memory-1",
          value: "fixture update"
        }
      }
    });

    expect(result).toMatchObject({
      status: "needs_confirmation",
      resultCode: "CONFIRMATION_REQUIRED",
      failureClasses: ["CONFIRMATION_MISSING"],
      counters: {
        deniedCount: 1,
        failureClassCount: 1
      }
    });
    expectSanitizedResult(result);
  });

  it("classifies deterministic timeout, cancellation, and sandbox failures", async () => {
    const timedOut = await executeFixture({
      executorOptions: { simulateTimeout: true }
    });
    const cancelled = await executeFixture({
      executorOptions: { simulateCancellation: true }
    });
    const sandbox = await executeFixture({
      executorOptions: { simulateSandboxScopeViolation: true }
    });

    expect(timedOut).toMatchObject({
      status: "timed_out",
      resultCode: "TOOL_EXECUTION_TIMED_OUT",
      failureClasses: ["TIMEOUT_OR_CANCELLATION"],
      timeoutOccurred: true,
      counters: {
        timedOutCount: 1,
        failureClassCount: 1
      }
    });
    expect(cancelled).toMatchObject({
      status: "cancelled",
      resultCode: "TOOL_EXECUTION_CANCELLED",
      failureClasses: ["TIMEOUT_OR_CANCELLATION"],
      cancelled: true,
      counters: {
        cancelledCount: 1,
        failureClassCount: 1
      }
    });
    expect(sandbox).toMatchObject({
      status: "blocked",
      resultCode: "TOOL_SANDBOX_SCOPE_VIOLATION",
      failureClasses: ["SANDBOX_SCOPE_VIOLATION"],
      counters: {
        blockedCount: 1,
        failureClassCount: 1
      }
    });
    expectSanitizedResult(timedOut);
    expectSanitizedResult(cancelled);
    expectSanitizedResult(sandbox);
  });

  it("classifies rollback, cleanup, and sensitive-output fixture failures", async () => {
    const rollback = await executeFixture({
      executorOptions: { simulateRollbackFailure: true }
    });
    const cleanup = await executeFixture({
      executorOptions: { simulateCleanupFailure: true }
    });
    const sensitiveOutput = await executeFixture({
      executorOptions: { simulateSensitiveOutput: true }
    });

    expect(rollback).toMatchObject({
      status: "degraded",
      resultCode: "TOOL_ROLLBACK_FAILED",
      reasonCodes: ["TOOL_ROLLBACK_FAILED", "TOOL_CLEANUP_PASSED"],
      failureClasses: ["ROLLBACK_FAILED"],
      rollbackState: "failed",
      cleanupState: "passed",
      counters: {
        degradedCount: 1,
        rollbackCount: 1,
        cleanupCount: 1,
        failureClassCount: 1
      }
    });
    expect(cleanup).toMatchObject({
      status: "degraded",
      resultCode: "TOOL_CLEANUP_FAILED",
      reasonCodes: ["TOOL_CLEANUP_FAILED", "TOOL_ROLLBACK_NOT_REQUIRED"],
      failureClasses: ["CLEANUP_FAILED"],
      rollbackState: "not_required",
      cleanupState: "failed",
      counters: {
        degradedCount: 1,
        rollbackCount: 1,
        cleanupCount: 1,
        failureClassCount: 1
      }
    });
    expect(sensitiveOutput).toMatchObject({
      status: "blocked",
      resultCode: "SENSITIVE_OUTPUT_DETECTED",
      failureClasses: ["SENSITIVE_OUTPUT_DETECTED"],
      counters: {
        blockedCount: 1,
        failureClassCount: 1
      }
    });
    expectSanitizedResult(rollback);
    expectSanitizedResult(cleanup);
    expectSanitizedResult(sensitiveOutput);
  });
});
