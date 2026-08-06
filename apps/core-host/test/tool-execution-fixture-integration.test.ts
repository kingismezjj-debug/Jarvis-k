import { describe, expect, it } from "vitest";
import type {
  ToolDescriptor,
  ToolInvocationRequest,
  ToolPolicy
} from "@jarvis-k/contracts";
import {
  createCoreHostToolExecutionFixtureSession,
  type CoreHostToolExecutionFixtureSessionOptions
} from "../src/tool-execution-fixture-integration";

const evaluatedAt = "2026-08-01T00:00:00.000Z";

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

const readOnlyRequest: ToolInvocationRequest = {
  requestId: "request-1",
  toolId: readOnlyDescriptor.id,
  input: {
    conversationId: "primary",
    limit: 3
  },
  dryRun: true
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

function createSession(
  options: Partial<CoreHostToolExecutionFixtureSessionOptions> = {}
) {
  return createCoreHostToolExecutionFixtureSession({
    descriptors: [readOnlyDescriptor],
    policy: readOnlyPolicy,
    evaluatedAt,
    ...options
  });
}

function expectSanitized(report: unknown) {
  expect(JSON.stringify(report)).not.toMatch(
    /(?:https?:\/\/|[A-Za-z]:\\|\\\\|command|script|stdout|stderr|stack|env|processId|credential|secret|token|rawToolInput|rawToolOutput|helperDiagnostics|sourceText|digest|vector)/iu
  );
}

describe("Core Host Tool Execution fixture integration", () => {
  it("evaluates and executes an allowlisted read-only fixture request", async () => {
    const session = createSession();

    const decision = session.evaluate({
      request: readOnlyRequest,
      evaluatedAt
    });
    const result = await session.execute({
      request: readOnlyRequest,
      evaluatedAt
    });

    expect(decision).toMatchObject({
      accepted: true,
      status: "evaluated",
      reasonCode: "ALLOWED",
      toolCount: 1,
      sessionReleased: false,
      decision: {
        status: "allowed",
        allowed: true,
        reasonCode: "ALLOWED"
      }
    });
    expect(result).toMatchObject({
      accepted: true,
      status: "executed",
      reasonCode: "FIXTURE_DRY_RUN",
      result: {
        status: "completed",
        resultCode: "FIXTURE_DRY_RUN",
        failureClasses: [],
        rollbackState: "not_required",
        cleanupState: "passed",
        counters: {
          completedCount: 1,
          rollbackCount: 1,
          cleanupCount: 1
        }
      }
    });
    expect(session.summarize()).toEqual({
      toolCount: 1,
      decisionCount: 1,
      executionCount: 1,
      sessionReleased: false,
      persisted: false,
      rawDiagnosticsExposed: false
    });
    expect(decision.decision).not.toHaveProperty("input");
    expect(result.result).not.toHaveProperty("input");
    expect(result.result).not.toHaveProperty("output");
    expectSanitized(decision);
    expectSanitized(result);
  });

  it("requires explicit confirmation for mutating fixture execution", async () => {
    const descriptor: ToolDescriptor = {
      ...readOnlyDescriptor,
      id: "fixture.memory.update",
      description: "Update a fixture memory record.",
      risk: "mutating",
      requiredPermissions: ["memory.write"],
      requiresConfirmation: true,
      inputSchemaId: "tool.fixture.memory.update.input"
    };
    const request: ToolInvocationRequest = {
      ...readOnlyRequest,
      toolId: descriptor.id,
      input: {
        memoryId: "memory-1",
        value: "fixture update"
      }
    };
    const session = createSession({
      descriptors: [descriptor],
      policy: {
        ...readOnlyPolicy,
        allowedToolIds: [descriptor.id],
        allowedPermissionScopes: ["memory.write"]
      }
    });

    const pending = await session.execute({ request, evaluatedAt });
    const approved = await session.execute({
      request,
      confirmationGranted: true,
      evaluatedAt
    });

    expect(pending).toMatchObject({
      accepted: false,
      reasonCode: "CONFIRMATION_REQUIRED",
      result: {
        status: "needs_confirmation",
        failureClasses: ["CONFIRMATION_MISSING"]
      }
    });
    expect(approved).toMatchObject({
      accepted: true,
      reasonCode: "FIXTURE_DRY_RUN",
      result: {
        status: "completed",
        audit: {
          confirmationGranted: true
        }
      }
    });
    expectSanitized(pending);
    expectSanitized(approved);
  });

  it("fails closed for blocked, unallowlisted, unpermissioned, and disabled fixture execution", async () => {
    const blocked = await createSession({
      policy: {
        ...readOnlyPolicy,
        blockedToolIds: [readOnlyDescriptor.id]
      }
    }).execute({ request: readOnlyRequest, evaluatedAt });
    const unallowlisted = await createSession({
      policy: {
        ...readOnlyPolicy,
        allowedToolIds: []
      }
    }).execute({ request: readOnlyRequest, evaluatedAt });
    const unpermissioned = await createSession({
      policy: {
        ...readOnlyPolicy,
        allowedPermissionScopes: []
      }
    }).execute({ request: readOnlyRequest, evaluatedAt });
    const disabled = await createSession({
      policy: {
        ...readOnlyPolicy,
        fixtureExecutionEnabled: false
      }
    }).execute({ request: readOnlyRequest, evaluatedAt });

    expect(blocked).toMatchObject({
      accepted: false,
      reasonCode: "TOOL_BLOCKED",
      result: { failureClasses: ["POLICY_DENIED"] }
    });
    expect(unallowlisted).toMatchObject({
      accepted: false,
      reasonCode: "TOOL_NOT_ALLOWLISTED",
      result: { failureClasses: ["POLICY_DENIED"] }
    });
    expect(unpermissioned).toMatchObject({
      accepted: false,
      reasonCode: "PERMISSION_DENIED",
      result: { failureClasses: ["POLICY_DENIED"] }
    });
    expect(disabled).toMatchObject({
      accepted: false,
      reasonCode: "EXECUTION_DISABLED",
      result: { failureClasses: ["EXECUTION_DISABLED"] }
    });
  });

  it("fails closed for Windows, shell/process, filesystem, screen, clipboard, and network-like tools", async () => {
    const cases: Array<{
      descriptor: ToolDescriptor;
      policy: ToolPolicy;
      expectedReason: string;
    }> = [
      {
        descriptor: {
          ...readOnlyDescriptor,
          id: "fixture.windows.inspect",
          execution: "windows",
          inputSchemaId: "tool.fixture.windows.inspect.input"
        },
        policy: {
          ...readOnlyPolicy,
          allowedToolIds: ["fixture.windows.inspect"]
        },
        expectedReason: "WINDOWS_EXECUTION_DISABLED"
      },
      {
        descriptor: {
          ...readOnlyDescriptor,
          id: "fixture.shell.inspect",
          requiredPermissions: ["process.execute"],
          inputSchemaId: "tool.fixture.shell.inspect.input"
        },
        policy: {
          ...readOnlyPolicy,
          allowedToolIds: ["fixture.shell.inspect"],
          allowedPermissionScopes: ["process.execute"]
        },
        expectedReason: "SHELL_EXECUTION_DISABLED"
      },
      {
        descriptor: {
          ...readOnlyDescriptor,
          id: "fixture.files.inspect",
          requiredPermissions: ["filesystem.read"],
          inputSchemaId: "tool.fixture.files.inspect.input"
        },
        policy: {
          ...readOnlyPolicy,
          allowedToolIds: ["fixture.files.inspect"],
          allowedPermissionScopes: ["filesystem.read"]
        },
        expectedReason: "EXECUTION_DISABLED"
      },
      {
        descriptor: {
          ...readOnlyDescriptor,
          id: "fixture.screen.inspect",
          requiredPermissions: ["screen.capture"],
          inputSchemaId: "tool.fixture.screen.inspect.input"
        },
        policy: {
          ...readOnlyPolicy,
          allowedToolIds: ["fixture.screen.inspect"],
          allowedPermissionScopes: ["screen.capture"]
        },
        expectedReason: "EXECUTION_DISABLED"
      },
      {
        descriptor: {
          ...readOnlyDescriptor,
          id: "fixture.clipboard.inspect",
          requiredPermissions: ["clipboard.read"],
          inputSchemaId: "tool.fixture.clipboard.inspect.input"
        },
        policy: {
          ...readOnlyPolicy,
          allowedToolIds: ["fixture.clipboard.inspect"],
          allowedPermissionScopes: ["clipboard.read"]
        },
        expectedReason: "EXECUTION_DISABLED"
      },
      {
        descriptor: {
          ...readOnlyDescriptor,
          id: "fixture.network.inspect",
          inputSchemaId: "tool.fixture.network.inspect.input"
        },
        policy: {
          ...readOnlyPolicy,
          allowedToolIds: ["fixture.network.inspect"]
        },
        expectedReason: "NETWORK_EXECUTION_DISABLED"
      }
    ];

    for (const item of cases) {
      const request: ToolInvocationRequest = {
        ...readOnlyRequest,
        toolId: item.descriptor.id
      };
      const report = await createSession({
        descriptors: [item.descriptor],
        policy: item.policy
      }).execute({ request, evaluatedAt });

      expect(report).toMatchObject({
        accepted: false,
        reasonCode: item.expectedReason,
        result: {
          status: "denied"
        }
      });
      expectSanitized(report);
    }
  });

  it("classifies deterministic fixture failure simulations", async () => {
    const cases = [
      {
        executorOptions: { simulateTimeout: true },
        expected: {
          status: "timed_out",
          resultCode: "TOOL_EXECUTION_TIMED_OUT",
          failureClasses: ["TIMEOUT_OR_CANCELLATION"],
          timeoutOccurred: true
        }
      },
      {
        executorOptions: { simulateCancellation: true },
        expected: {
          status: "cancelled",
          resultCode: "TOOL_EXECUTION_CANCELLED",
          failureClasses: ["TIMEOUT_OR_CANCELLATION"],
          cancelled: true
        }
      },
      {
        executorOptions: { simulateSandboxScopeViolation: true },
        expected: {
          status: "blocked",
          resultCode: "TOOL_SANDBOX_SCOPE_VIOLATION",
          failureClasses: ["SANDBOX_SCOPE_VIOLATION"]
        }
      },
      {
        executorOptions: { simulateRollbackFailure: true },
        expected: {
          status: "degraded",
          resultCode: "TOOL_ROLLBACK_FAILED",
          failureClasses: ["ROLLBACK_FAILED"],
          rollbackState: "failed"
        }
      },
      {
        executorOptions: { simulateCleanupFailure: true },
        expected: {
          status: "degraded",
          resultCode: "TOOL_CLEANUP_FAILED",
          failureClasses: ["CLEANUP_FAILED"],
          cleanupState: "failed"
        }
      },
      {
        executorOptions: { simulateSensitiveOutput: true },
        expected: {
          status: "blocked",
          resultCode: "SENSITIVE_OUTPUT_DETECTED",
          failureClasses: ["SENSITIVE_OUTPUT_DETECTED"]
        }
      }
    ] satisfies Array<{
      executorOptions: CoreHostToolExecutionFixtureSessionOptions["executorOptions"];
      expected: Partial<NonNullable<Awaited<ReturnType<ReturnType<typeof createSession>["execute"]>>["result"]>>;
    }>;

    for (const item of cases) {
      const report = await createSession({
        executorOptions: item.executorOptions
      }).execute({ request: readOnlyRequest, evaluatedAt });

      expect(report).toMatchObject({
        accepted: false,
        status: "executed",
        result: item.expected
      });
      expectSanitized(report);
    }

    const unavailable = await createSession({
      fixtureImplementationAvailable: false
    }).execute({ request: readOnlyRequest, evaluatedAt });
    expect(unavailable).toMatchObject({
      accepted: false,
      reasonCode: "FIXTURE_EXECUTOR_UNAVAILABLE",
      result: {
        status: "degraded",
        failureClasses: ["FIXTURE_UNAVAILABLE"]
      }
    });
  });

  it("fails closed for malformed policy, descriptors, requests, and sensitive input", async () => {
    const rejectedPolicySession = createCoreHostToolExecutionFixtureSession({
      descriptors: [readOnlyDescriptor],
      policy: {
        ...readOnlyPolicy,
        windowsExecutionEnabled: true
      },
      evaluatedAt
    });
    expect(
      await rejectedPolicySession.execute({
        request: readOnlyRequest,
        evaluatedAt
      })
    ).toEqual({
      accepted: false,
      status: "blocked",
      reasonCode: "INVALID_TOOL_REQUEST",
      toolCount: 0,
      sessionReleased: false
    });

    const malformedDescriptor = await createSession({
      descriptors: [{ ...readOnlyDescriptor, version: "latest" }]
    }).execute({ request: readOnlyRequest, evaluatedAt });
    expect(malformedDescriptor).toMatchObject({
      accepted: false,
      reasonCode: "TOOL_NOT_ALLOWLISTED"
    });

    const malformedRequest = await createSession().execute({
      request: {
        ...readOnlyRequest,
        input: {
          command: "redacted"
        }
      },
      evaluatedAt
    });
    expect(malformedRequest).toEqual({
      accepted: false,
      status: "blocked",
      reasonCode: "INVALID_TOOL_REQUEST",
      toolCount: 1,
      sessionReleased: false
    });
    expectSanitized(rejectedPolicySession.summarize());
    expectSanitized(malformedDescriptor);
    expectSanitized(malformedRequest);
  });

  it("releases and resets in-memory session state without persistence", async () => {
    const session = createSession();

    await session.execute({ request: readOnlyRequest, evaluatedAt });
    session.release();

    expect(session.summarize()).toEqual({
      toolCount: 0,
      decisionCount: 0,
      executionCount: 0,
      sessionReleased: true,
      persisted: false,
      rawDiagnosticsExposed: false
    });
    expect(session.evaluate({ request: readOnlyRequest, evaluatedAt })).toEqual({
      accepted: false,
      status: "released",
      reasonCode: "EXECUTION_DISABLED",
      toolCount: 0,
      sessionReleased: true
    });
    expect(
      await session.execute({ request: readOnlyRequest, evaluatedAt })
    ).toEqual({
      accepted: false,
      status: "released",
      reasonCode: "EXECUTION_DISABLED",
      toolCount: 0,
      sessionReleased: true
    });
  });
});
