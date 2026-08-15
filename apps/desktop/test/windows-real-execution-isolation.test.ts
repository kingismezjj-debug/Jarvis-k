import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(path.join(rootDirectory, relativePath), "utf8");
}

function packageScripts(): Record<string, string> {
  return JSON.parse(readWorkspaceFile("package.json")).scripts;
}

describe("Windows real execution test isolation", () => {
  it("keeps verify, test, build, and CI away from real desktop acceptance", () => {
    const scripts = packageScripts();
    for (const scriptName of ["verify", "test", "build", "ci"]) {
      expect(scripts[scriptName]).not.toContain("acceptance:windows:real");
      expect(scripts[scriptName]).not.toContain(
        "desktop-core-task-runtime-eight-loop-stability.mjs",
      );
      expect(scripts[scriptName]).not.toContain(
        "desktop-task-runtime-notepad-smoke.mjs",
      );
      expect(scripts[scriptName]).not.toContain(
        "JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION",
      );
    }

    const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
    expect(ciWorkflow).not.toContain("acceptance:windows:real");
    expect(ciWorkflow).not.toContain("smoke:desktop:task-runtime-vscode");
  });

  it("fails closed for legacy smoke names that used to operate the desktop", () => {
    const scripts = packageScripts();
    const legacySmokeScripts = [
      "smoke:desktop:task-runtime-notepad",
      "smoke:desktop:voice-task-runtime-notepad",
      "smoke:desktop:voice-task-runtime-known-app-correction",
      "smoke:desktop:core-task-runtime-eight-loop-stability",
      "smoke:desktop:task-runtime-notepad-write",
      "smoke:desktop:windows-executor-five-task-suite",
      "smoke:desktop:task-runtime-calculator",
      "smoke:desktop:task-runtime-vscode",
      "smoke:desktop:task-runtime-browser-open",
      "smoke:desktop:task-runtime-browser-open-blocked",
    ];

    for (const scriptName of legacySmokeScripts) {
      expect(scripts[scriptName]).toContain(
        "tests/real-windows-smoke-alias-blocked.mjs",
      );
      expect(scripts[scriptName]).not.toContain(
        "JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION=1",
      );
    }
  });

  it("exposes explicit real Windows acceptance commands with a hard safety switch", () => {
    const scripts = packageScripts();
    expect(scripts["acceptance:windows:real"]).toContain(
      "tests/desktop-windows-real-acceptance.mjs",
    );
    expect(scripts["acceptance:windows:real:stability"]).toContain(
      "tests/desktop-core-task-runtime-eight-loop-stability.mjs",
    );

    const guard = readWorkspaceFile(
      "tests/helpers/windows-real-execution-guard.mjs",
    );
    const realAcceptance = readWorkspaceFile(
      "tests/desktop-windows-real-acceptance.mjs",
    );
    expect(guard).toContain("JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION");
    expect(guard).toContain("REAL_WINDOWS_EXECUTION_NOT_ENABLED");
    expect(guard).toContain("DEFAULT_REAL_WINDOWS_ITERATIONS = 1");
    expect(guard).toContain("REAL_WINDOWS_ITERATIONS_REQUIRED");
    expect(realAcceptance).toContain(
      "REAL_WINDOWS_SINGLE_ACCEPTANCE_ITERATIONS_MUST_BE_1",
    );
  });

  it("guards every real Windows script when called directly", () => {
    for (const relativePath of [
      "tests/desktop-task-runtime-notepad-smoke.mjs",
      "tests/desktop-voice-task-runtime-notepad-smoke.mjs",
      "tests/desktop-voice-task-runtime-known-app-correction-smoke.mjs",
      "tests/desktop-task-runtime-notepad-write-smoke.mjs",
      "tests/desktop-task-runtime-browser-open-smoke.mjs",
      "tests/desktop-windows-executor-five-task-suite-smoke.mjs",
      "tests/desktop-core-task-runtime-eight-loop-stability.mjs",
      "tests/desktop-windows-real-acceptance.mjs",
    ]) {
      const source = readWorkspaceFile(relativePath);
      expect(source).toContain("requireRealWindowsExecution");
    }
  });

  it("keeps ordinary UI smoke on disabled/fake desktop execution", () => {
    const source = readWorkspaceFile("tests/desktop-ui-interaction-smoke.mjs");
    expect(source).toContain("JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS");
    expect(source).toContain('"1"');
    expect(source).not.toContain("JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION");
    expect(source).not.toContain("desktop-task-runtime-notepad-smoke.mjs");
  });

  it("keeps VS Code stability coverage out of repeated real execution", () => {
    const source = readWorkspaceFile(
      "tests/desktop-core-task-runtime-eight-loop-stability.mjs",
    );
    expect(source).toContain("requireExplicitIterations: true");
    expect(source).toContain("voice-command-correction-resolver-smoke.mjs");
    expect(source).toContain("desktop-command-router-local-app-blocked-smoke.mjs");
    expect(source).not.toContain(
      "desktop-voice-task-runtime-known-app-correction-smoke.mjs",
    );
    expect(source).not.toContain('"tests/desktop-task-runtime-notepad-smoke.mjs", "vscode"');
  });

  it("keeps voice correction resolver coverage executor-free", () => {
    const resolverSmoke = readWorkspaceFile(
      "tests/voice-command-correction-resolver-smoke.mjs",
    );
    expect(resolverSmoke).not.toContain("playwright");
    expect(resolverSmoke).not.toContain("electron");
    expect(resolverSmoke).not.toContain("openLocalApp");
    expect(resolverSmoke).toContain("executorCalled: false");
  });

  it("does not let test mode masquerade as executed and verified", () => {
    const taskLifecycleTest = readWorkspaceFile(
      "packages/core/test/task-lifecycle-service.test.ts",
    );
    expect(taskLifecycleTest).toContain(
      "projects simulated results without executed or verified semantics",
    );
    expect(taskLifecycleTest).toContain('projection: "simulated"');
  });

  it("does not close user-owned VS Code processes from acceptance cleanup", () => {
    const source = readWorkspaceFile("tests/desktop-task-runtime-notepad-smoke.mjs");
    expect(source).toContain('knownApp.slug !== "vscode"');
    expect(source).not.toContain("taskkill");
  });
});
