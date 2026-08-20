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

  it("uses the Desktop-provided Alpha local data root for all Core Host stores", () => {
    const alphaRoot = path.join(
      "C:",
      "Users",
      "tester",
      "AppData",
      "Local",
      "Jarvis-K-Alpha",
    );
    vi.stubEnv("JARVIS_K_LOCAL_DATA_PATH", alphaRoot);

    const paths = loadCoreHostStoragePaths({ memoryDisabled: false });

    expect(paths.memoryDatabasePath).toBe(path.join(alphaRoot, "memory.sqlite"));
    expect(paths.taskDatabasePath).toBe(path.join(alphaRoot, "task-runtime.sqlite"));
    expect(paths.modelDirectoryPath).toBe(path.join(alphaRoot, "models"));
    expect(paths.localPluginStatePath).toBe(
      path.join(alphaRoot, "local-plugin-state.json"),
    );
    expect(paths.voiceCommandAliasPath).toBe(
      path.join(alphaRoot, "voice-command-aliases.json"),
    );
    expect(paths.userRouteAliasPath).toBe(
      path.join(alphaRoot, "user-route-aliases.json"),
    );
    expect(paths.userPreferenceMemoryPath).toBe(
      path.join(alphaRoot, "user-preference-memories.json"),
    );
    expect(paths.voiceRegressionPath).toBe(
      path.join(alphaRoot, "voice-regression-records.json"),
    );
    expect(JSON.stringify(paths)).not.toContain("Local\\Jarvis-K\\");
  });

  it("rejects relative Core Host storage path overrides", () => {
    vi.stubEnv("JARVIS_K_LOCAL_DATA_PATH", "relative-local-data");

    expect(() =>
      loadCoreHostStoragePaths({ memoryDisabled: false }),
    ).toThrow("JARVIS_K_LOCAL_DATA_PATH must be an absolute path");
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
