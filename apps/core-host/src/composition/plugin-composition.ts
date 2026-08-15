import type {
  LocalPluginManifestDeveloperDiagnostics,
  PluginRegistry,
  PluginRuntime,
} from "@jarvis-k/capabilities";
import {
  CompositePluginRegistry,
  InMemoryPluginRegistry,
  LocalReadOnlyPluginRuntime,
  ManifestDirectoryDeveloperDiagnostics,
  ManifestDirectoryPluginRegistry,
  localTemplatePluginDefinitions,
  samplePluginDefinitions,
} from "@jarvis-k/plugin-sdk";
import type { LocalPluginStateRepository } from "@jarvis-k/core";
import { JsonLocalPluginStateRepository } from "../local-plugin-state-repository";

export interface CoreHostPluginCompositionInput {
  readonly manifestDiscoveryEnabled: boolean;
  readonly manifestDirectories: readonly string[];
  readonly statePath: string;
  readonly rootDirectory: string;
}

export interface CoreHostPluginComposition {
  readonly pluginRegistry: PluginRegistry;
  readonly pluginRuntime: PluginRuntime;
  readonly localPluginManifestDiagnostics: LocalPluginManifestDeveloperDiagnostics;
  readonly localPluginStateRepository: LocalPluginStateRepository;
  readonly localPluginTemplateRuntimeEnabled: boolean;
  readonly localPluginTemplatePluginIds: readonly string[];
}

export function createCoreHostPluginComposition(
  input: CoreHostPluginCompositionInput,
): CoreHostPluginComposition {
  const localPluginTemplateRuntimeEnabled =
    input.manifestDiscoveryEnabled && input.manifestDirectories.length > 0;
  const localPluginTemplatePluginIds = localPluginTemplateRuntimeEnabled
    ? localTemplatePluginDefinitions.map((definition) => definition.manifest.id)
    : [];
  const pluginRuntimeDefinitions = localPluginTemplateRuntimeEnabled
    ? [...samplePluginDefinitions, ...localTemplatePluginDefinitions]
    : [...samplePluginDefinitions];
  const bundledPluginRegistry = new InMemoryPluginRegistry(
    samplePluginDefinitions.map((definition) => definition.manifest),
  );
  const pluginRegistry =
    input.manifestDirectories.length > 0
      ? new CompositePluginRegistry([
          bundledPluginRegistry,
          new ManifestDirectoryPluginRegistry({
            directories: input.manifestDirectories,
            rootDirectory: input.rootDirectory,
          }),
        ])
      : bundledPluginRegistry;

  return {
    pluginRegistry,
    pluginRuntime: new LocalReadOnlyPluginRuntime({
      definitions: pluginRuntimeDefinitions,
      localReadOnlyPluginIds: localPluginTemplatePluginIds,
    }),
    localPluginManifestDiagnostics:
      new ManifestDirectoryDeveloperDiagnostics({
        directories: input.manifestDirectories,
        enabled: input.manifestDiscoveryEnabled,
        rootDirectory: input.rootDirectory,
      }),
    localPluginStateRepository: new JsonLocalPluginStateRepository(
      input.statePath,
    ),
    localPluginTemplateRuntimeEnabled,
    localPluginTemplatePluginIds,
  };
}
