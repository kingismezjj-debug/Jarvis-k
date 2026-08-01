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

  it("executes only the sanitized fixture result and reports degradation", async () => {
    const executor = new FixtureToolExecutor(
      [readOnlyDescriptor],
      readOnlyPolicy
    );
    const completed = await executor.execute({
      request: readOnlyRequest,
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });
    const degraded = await new FixtureToolExecutor(
      [readOnlyDescriptor],
      readOnlyPolicy,
      false
    ).execute({
      request: readOnlyRequest,
      evaluatedAt: "2026-08-01T00:00:00.000Z"
    });

    expect(completed).toMatchObject({
      status: "completed",
      resultCode: "FIXTURE_DRY_RUN"
    });
    expect(degraded).toMatchObject({
      status: "degraded",
      resultCode: "FIXTURE_EXECUTOR_UNAVAILABLE"
    });
    expect(completed).not.toHaveProperty("input");
    expect(completed).not.toHaveProperty("output");
    expect(JSON.stringify(completed)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(completed)).not.toMatch(/[A-Za-z]:\\/u);
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
      resultCode: "EXECUTION_DISABLED"
    });
  });
});
