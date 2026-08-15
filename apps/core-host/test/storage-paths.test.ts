import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadCoreHostStoragePaths } from "../src/config/storage-paths";

describe("Core Host storage paths", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the existing safe local defaults", () => {
    vi.stubEnv("LOCALAPPDATA", path.join("C:", "Users", "tester", "AppData", "Local"));

    const paths = loadCoreHostStoragePaths({ memoryDisabled: false });

    expect(paths).toMatchObject({
      memoryDatabasePath: path.join(
        "C:",
        "Users",
        "tester",
        "AppData",
        "Local",
        "Jarvis-K",
        "memory.sqlite",
      ),
      taskDatabasePath: path.join(
        "C:",
        "Users",
        "tester",
        "AppData",
        "Local",
        "Jarvis-K",
        "task-runtime.sqlite",
      ),
      modelDirectoryPath: path.join(
        "C:",
        "Users",
        "tester",
        "AppData",
        "Local",
        "Jarvis-K",
        "models",
      ),
      localPluginStatePath: path.join(
        "C:",
        "Users",
        "tester",
        "AppData",
        "Local",
        "Jarvis-K",
        "local-plugin-state.json",
      ),
      localPluginManifestDirectories: [],
    });
  });

  it("keeps text-only acceptance memory disabled without changing other paths", () => {
    vi.stubEnv("LOCALAPPDATA", path.join("C:", "Users", "tester", "AppData", "Local"));

    const paths = loadCoreHostStoragePaths({ memoryDisabled: true });

    expect(paths.memoryDatabasePath).toBeUndefined();
    expect(paths.taskDatabasePath).toContain("task-runtime.sqlite");
    expect(paths.voiceCommandAliasPath).toContain("voice-command-aliases.json");
    expect(paths.userRouteAliasPath).toContain("user-route-aliases.json");
    expect(paths.userPreferenceMemoryPath).toContain(
      "user-preference-memories.json",
    );
  });

  it("keeps local plugin manifests opt-in through the existing environment gate", () => {
    vi.stubEnv("JARVIS_K_LOCAL_PLUGIN_DIRS", [
      path.resolve("examples/local-plugins/hello-readonly"),
      path.resolve("examples/local-plugins/second"),
    ].join(path.delimiter));

    expect(
      loadCoreHostStoragePaths({ memoryDisabled: false })
        .localPluginManifestDirectories,
    ).toEqual([]);

    vi.stubEnv("JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS", "1");

    expect(
      loadCoreHostStoragePaths({ memoryDisabled: false })
        .localPluginManifestDirectories,
    ).toEqual([
      path.resolve("examples/local-plugins/hello-readonly"),
      path.resolve("examples/local-plugins/second"),
    ]);
  });
});
