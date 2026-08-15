import path from "node:path";
import { describe, expect, it } from "vitest";
import { createCoreHostPluginComposition } from "../src/composition/plugin-composition";

const repositoryRoot = path.resolve(import.meta.dirname, "..", "..", "..");

describe("Core Host plugin composition", () => {
  it("uses bundled read-only sample plugins by default", async () => {
    const composition = createCoreHostPluginComposition({
      manifestDiscoveryEnabled: false,
      manifestDirectories: [],
      statePath: path.join(repositoryRoot, ".tmp", "plugin-state.json"),
      rootDirectory: repositoryRoot,
    });

    await expect(composition.pluginRegistry.listPlugins()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "cn.jarvis-k.stock-analysis" }),
        expect.objectContaining({ id: "cn.jarvis-k.ecommerce-comparison" }),
      ]),
    );
    await expect(
      composition.pluginRuntime.listLocalReadOnlyPluginIds?.(),
    ).resolves.toEqual([]);
    expect(composition.localPluginTemplateRuntimeEnabled).toBe(false);
    expect(composition.localPluginTemplatePluginIds).toEqual([]);
  });

  it("keeps local manifest templates gated by explicit discovery", async () => {
    const composition = createCoreHostPluginComposition({
      manifestDiscoveryEnabled: true,
      manifestDirectories: ["examples/local-plugins/hello-readonly"],
      statePath: path.join(repositoryRoot, ".tmp", "plugin-state.json"),
      rootDirectory: repositoryRoot,
    });

    await expect(composition.pluginRegistry.listPlugins()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "cn.example.hello-readonly" }),
      ]),
    );
    await expect(
      composition.pluginRuntime.listLocalReadOnlyPluginIds?.(),
    ).resolves.toEqual(["cn.example.hello-readonly"]);
    expect(composition.localPluginTemplateRuntimeEnabled).toBe(true);
    expect(composition.localPluginTemplatePluginIds).toEqual([
      "cn.example.hello-readonly",
    ]);
  });

  it("exposes disabled diagnostics without scanning when discovery is off", async () => {
    const composition = createCoreHostPluginComposition({
      manifestDiscoveryEnabled: false,
      manifestDirectories: ["examples/local-plugins/hello-readonly"],
      statePath: path.join(repositoryRoot, ".tmp", "plugin-state.json"),
      rootDirectory: repositoryRoot,
    });

    await expect(
      composition.localPluginManifestDiagnostics.getStatus(),
    ).resolves.toMatchObject({
      discoveryStatus: "disabled",
      enabled: false,
      scannedDirectoryCount: 0,
      validManifestCount: 0,
      reasonCodes: ["LOCAL_MANIFEST_DISCOVERY_DISABLED"],
    });
    await expect(
      composition.pluginRuntime.listLocalReadOnlyPluginIds?.(),
    ).resolves.toEqual([]);
  });
});
