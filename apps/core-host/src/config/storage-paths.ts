import {
  resolveLocalPluginManifestDirectories,
  resolveLocalPluginStatePath,
  resolveMemoryDatabasePath,
  resolveModelDirectoryPath,
  resolveTaskDatabasePath,
  resolveUserPreferenceMemoryPath,
  resolveUserRouteAliasPath,
  resolveVoiceRegressionPath,
  resolveVoiceCommandAliasPath,
} from "../core-host-paths";

export interface CoreHostStoragePathsOptions {
  readonly memoryDisabled: boolean;
}

export interface CoreHostStoragePaths {
  readonly memoryDatabasePath: string | undefined;
  readonly taskDatabasePath: string;
  readonly modelDirectoryPath: string;
  readonly localPluginStatePath: string;
  readonly localPluginManifestDirectories: readonly string[];
  readonly voiceCommandAliasPath: string;
  readonly userRouteAliasPath: string;
  readonly userPreferenceMemoryPath: string;
  readonly voiceRegressionPath: string;
}

export function loadCoreHostStoragePaths(
  options: CoreHostStoragePathsOptions,
): CoreHostStoragePaths {
  return {
    memoryDatabasePath: options.memoryDisabled
      ? undefined
      : resolveMemoryDatabasePath(),
    taskDatabasePath: resolveTaskDatabasePath(),
    modelDirectoryPath: resolveModelDirectoryPath(),
    localPluginStatePath: resolveLocalPluginStatePath(),
    localPluginManifestDirectories: resolveLocalPluginManifestDirectories(),
    voiceCommandAliasPath: resolveVoiceCommandAliasPath(),
    userRouteAliasPath: resolveUserRouteAliasPath(),
    userPreferenceMemoryPath: resolveUserPreferenceMemoryPath(),
    voiceRegressionPath: resolveVoiceRegressionPath(),
  };
}
