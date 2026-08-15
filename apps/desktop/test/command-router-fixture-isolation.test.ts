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

describe("Command Router fixture smoke isolation", () => {
  it("fails closed for legacy fixture smoke names", () => {
    const scripts = packageScripts();
    const legacyScripts = [
      [
        "smoke:desktop:command-router-local-app-fixture",
        "tests/desktop-command-router-local-app-fixture-smoke.mjs",
      ],
      [
        "smoke:desktop:command-router-calculator-fixture",
        "tests/desktop-command-router-calculator-fixture-smoke.mjs",
      ],
      [
        "smoke:desktop:command-router-browser-fixture",
        "tests/desktop-command-router-browser-fixture-smoke.mjs",
      ],
      [
        "smoke:desktop:command-router-fixture-suite",
        "tests/desktop-command-router-fixture-suite.mjs",
      ],
    ] as const;
    for (const [scriptName, filePath] of legacyScripts) {
      expect(scripts[scriptName]).toContain(
        "tests/command-router-fixture-smoke-alias-blocked.mjs",
      );
      expect(scripts[scriptName]).not.toContain("npm run build &&");
      expect(scripts[scriptName]).not.toContain(
        "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
      );
      const directSource = readWorkspaceFile(filePath);
      expect(directSource).toContain(
        "COMMAND_ROUTER_FIXTURE_SMOKE_ALIAS_DISABLED",
      );
      expect(directSource).not.toContain("playwright");
      expect(directSource).not.toContain("electron");
    }
  });

  it("keeps production fallback smoke on deterministic rules without fixture harness", () => {
    const scripts = packageScripts();
    expect(scripts["smoke:desktop:command-router-production-fallback"]).toContain(
      "tests/desktop-command-router-production-fallback-smoke.mjs",
    );
    const source = readWorkspaceFile(
      "tests/desktop-command-router-production-fallback-smoke.mjs",
    );
    expect(source).toContain("intent-router.deterministic.rules");
    expect(source).toContain("JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS");
    expect(source).toContain("newNotepadProcessIds");
    expect(source).not.toContain("JARVIS_K_ENABLE_FIXTURE_INFERENCE");
    expect(source).not.toContain("JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION");
    expect(source).toContain(
      'brainDispatch.includes("intent-router.deterministic.fixture")',
    );
    expect(source).toContain('brainDispatch.includes("FIXTURE_DRY_RUN")');
  });

  it("keeps ordinary blocked smoke on production rules semantics", () => {
    const source = readWorkspaceFile(
      "tests/desktop-command-router-local-app-blocked-smoke.mjs",
    );
    expect(source).toContain("intent-router.deterministic.rules");
    expect(source).toContain("JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS");
    expect(source).toContain("newCodeProcessIds");
    expect(source).not.toContain(
      '"command-router-selected-provider",\n    "intent-router.deterministic.fixture"',
    );
    expect(source).toContain(
      'brainDispatch.includes("intent-router.deterministic.fixture")',
    );
    expect(source).toContain('brainDispatch.includes("FIXTURE_DRY_RUN")');
    expect(source).not.toContain("JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION");
  });

  it("exposes fixture coverage only through an explicit targeted test harness", () => {
    const scripts = packageScripts();
    expect(scripts["test:desktop:command-router-fixture"]).toContain(
      "packages/core/test/runtime.test.ts",
    );
    expect(scripts["test:desktop:command-router-fixture"]).toContain(
      "apps/desktop/test/command-router-fixture-isolation.test.ts",
    );
    expect(scripts["test"]).not.toContain("test:desktop:command-router-fixture");
    expect(scripts["verify"]).not.toContain("test:desktop:command-router-fixture");

    const runtimeTestSource = readWorkspaceFile(
      "packages/core/test/runtime.test.ts",
    );
    expect(runtimeTestSource).toContain(
      'providerId: "intent-router.deterministic.fixture"',
    );
    expect(runtimeTestSource).toContain('mode: "fixture_only"');
    expect(runtimeTestSource).toContain("fixtureExecutionEnabled: true");
    expect(runtimeTestSource).toContain("FIXTURE_DRY_RUN");
    expect(runtimeTestSource).toContain("expect(actionCalls).toBe(0)");
    expect(runtimeTestSource).toContain("expect(runtime.getSnapshot().tasks).toHaveLength(0)");
  });
});
