import { describe, expect, it } from "vitest";
import type { TaskStep } from "@jarvis-k/contracts";
import {
  PlannerExecutionCoordinator,
  type PlannerActionExecutor,
} from "../src/planner/planner-execution-coordinator";

function createStep(toolInput: Record<string, unknown> = {}): TaskStep {
  return {
    id: "step-1",
    taskId: "task-1",
    title: "Planner step",
    state: "pending",
    verificationStatus: "not_applicable",
    toolId: "memory.status",
    toolInput,
  };
}

function createCoordinator(input: {
  executor?: PlannerActionExecutor;
  resolveKnownLocalApp?: (target: string) => "notepad" | "calculator" | "vscode" | undefined;
} = {}): PlannerExecutionCoordinator {
  return new PlannerExecutionCoordinator({
    actionExecutor: input.executor,
    getRuntimeStatus: () => ({
      health: "ready",
      sequenceId: 42,
      voiceState: "idle",
      memoryHealthStatus: "ok",
    }),
    voiceCommandAliasRepository: undefined,
    userRouteAliasRepository: undefined,
    userPreferenceMemoryRepository: undefined,
    resolveKnownLocalApp: input.resolveKnownLocalApp ?? (() => undefined),
    displayKnownLocalApp: (label) =>
      label === "vscode" ? "VS Code" : label[0].toUpperCase() + label.slice(1),
  });
}

describe("PlannerExecutionCoordinator", () => {
  it("summarizes observability status without action execution", async () => {
    const coordinator = createCoordinator();

    await expect(
      coordinator.executeStep(createStep(), "observability.status"),
    ).resolves.toMatchObject({
      ok: true,
      verificationStatus: "verified",
      summary: "Core status verified: ready; sequence 42; voice idle; Memory ok.",
    });
  });

  it("fails closed for unknown and unsupported tools", async () => {
    const coordinator = createCoordinator();

    await expect(
      coordinator.executeStep(createStep(), "shell.run"),
    ).resolves.toMatchObject({
      ok: false,
      verificationStatus: "verification_failed",
      failureReason: "PLANNER_STEP_TOOL_UNKNOWN",
    });
    await expect(
      coordinator.executeStep(createStep(), "plugin.invoke"),
    ).resolves.toMatchObject({
      ok: false,
      verificationStatus: "verification_failed",
      failureReason: "PLANNER_STEP_NOT_EXECUTABLE_IN_L3",
    });
  });

  it("does not invoke action executors for plugin steps", async () => {
    let calls = 0;
    const coordinator = createCoordinator({
      executor: {
        async openBrowser() {
          calls += 1;
          throw new Error("must not open browser");
        },
        async openLocalApp() {
          calls += 1;
          throw new Error("must not open app");
        },
        async searchFilesystem() {
          calls += 1;
          throw new Error("must not search filesystem");
        },
      },
    });

    const result = await coordinator.executeStep(
      createStep({ pluginId: "readonly.example" }),
      "plugin.invoke",
    );

    expect(result).toMatchObject({
      ok: false,
      verificationStatus: "verification_failed",
      failureReason: "PLANNER_STEP_NOT_EXECUTABLE_IN_L3",
    });
    expect(calls).toBe(0);
  });

  it("fails browser.open before executor calls when target is missing", async () => {
    let browserCalls = 0;
    const coordinator = createCoordinator({
      executor: {
        async openBrowser() {
          browserCalls += 1;
          throw new Error("must not open");
        },
        async openLocalApp() {
          throw new Error("must not open");
        },
      },
    });

    const result = await coordinator.executeStep(createStep(), "browser.open");

    expect(result).toMatchObject({
      ok: false,
      verificationStatus: "verification_failed",
      failureReason: "BROWSER_OPEN_TARGET_MISSING",
    });
    expect(browserCalls).toBe(0);
  });

  it("executes filesystem.search through the observe-only executor", async () => {
    const calls: string[] = [];
    const coordinator = createCoordinator({
      executor: {
        async openBrowser() {
          throw new Error("must not open browser");
        },
        async openLocalApp() {
          throw new Error("must not open app");
        },
        async searchFilesystem(request) {
          calls.push(request.target);
          return {
            status: "completed",
            reasonCode: "FILESYSTEM_SEARCH_COMPLETED",
            label: "filesystem",
            verificationStatus: "verified",
            matchCount: 2,
          };
        },
      },
    });

    const result = await coordinator.executeStep(
      createStep({ query: "project" }),
      "filesystem.search",
    );

    expect(calls).toEqual(["project"]);
    expect(result).toMatchObject({
      ok: true,
      verificationStatus: "verified",
      summary: "Planner draft filesystem.search verified 2 sanitized candidate(s).",
    });
  });

  it("fails localApp.open before executor calls when target is not allowlisted", async () => {
    let appCalls = 0;
    const coordinator = createCoordinator({
      executor: {
        async openBrowser() {
          throw new Error("must not open browser");
        },
        async openLocalApp() {
          appCalls += 1;
          throw new Error("must not open app");
        },
      },
      resolveKnownLocalApp: () => undefined,
    });

    const result = await coordinator.executeStep(
      createStep({ target: "powershell" }),
      "localApp.open",
    );

    expect(result).toMatchObject({
      ok: false,
      verificationStatus: "verification_failed",
      failureReason: "LOCAL_APP_TARGET_NOT_ALLOWLISTED",
    });
    expect(appCalls).toBe(0);
  });

  it("does not treat local app execution as verified without executor verification", async () => {
    const coordinator = createCoordinator({
      executor: {
        async openBrowser() {
          throw new Error("must not open browser");
        },
        async openLocalApp(request) {
          return {
            status: "completed",
            reasonCode: "ALLOWLISTED_TARGET_OPENED",
            label: request.target,
          };
        },
      },
      resolveKnownLocalApp: (target) =>
        target.toLowerCase() === "notepad" ? "notepad" : undefined,
    });

    const result = await coordinator.executeStep(
      createStep({ target: "notepad" }),
      "localApp.open",
    );

    expect(result).toMatchObject({
      ok: false,
      verificationStatus: "unverified",
      failureReason: "ALLOWLISTED_TARGET_OPENED",
    });
  });
});
