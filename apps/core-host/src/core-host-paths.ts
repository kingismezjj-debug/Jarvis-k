import path from "node:path";

export function resolveMemoryDatabasePath(): string | undefined {
  return resolveOptionalFilePath("JARVIS_K_MEMORY_DB_PATH", "memory.sqlite");
}

export function resolveTaskDatabasePath(): string {
  return resolveFilePath("JARVIS_K_TASK_DB_PATH", "task-runtime.sqlite");
}

export function resolveLocalPluginStatePath(): string {
  return resolveFilePath(
    "JARVIS_K_LOCAL_PLUGIN_STATE_PATH",
    "local-plugin-state.json",
  );
}

export function resolveVoiceCommandAliasPath(): string {
  return resolveFilePath(
    "JARVIS_K_VOICE_COMMAND_ALIAS_PATH",
    "voice-command-aliases.json",
  );
}

export function resolveUserRouteAliasPath(): string {
  return resolveFilePath(
    "JARVIS_K_USER_ROUTE_ALIAS_PATH",
    "user-route-aliases.json",
  );
}

export function resolveUserPreferenceMemoryPath(): string {
  return resolveFilePath(
    "JARVIS_K_USER_PREFERENCE_MEMORY_PATH",
    "user-preference-memories.json",
  );
}

export function resolveVoiceRegressionPath(): string {
  return resolveFilePath(
    "JARVIS_K_VOICE_REGRESSION_PATH",
    "voice-regression-records.json",
  );
}

export function resolveModelDirectoryPath(): string {
  const explicitPath = readAbsolutePathEnv("JARVIS_K_MODEL_DIR");
  if (explicitPath) {
    return explicitPath;
  }
  return path.join(resolveLocalDataRoot(), "models");
}

export function resolveLocalPluginManifestDirectories(): string[] {
  if (process.env.JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS !== "1") {
    return [];
  }
  const rawDirectories = process.env.JARVIS_K_LOCAL_PLUGIN_DIRS?.trim();
  if (!rawDirectories) {
    return [];
  }
  return rawDirectories
    .split(path.delimiter)
    .map((directory) => directory.trim())
    .filter((directory) => directory.length > 0)
    .slice(0, 16);
}

function resolveOptionalFilePath(
  envKey: string,
  fileName: string,
): string | undefined {
  const explicitPath = readAbsolutePathEnv(envKey);
  if (explicitPath) {
    return explicitPath;
  }
  const localDataRoot = resolveOptionalLocalDataRoot();
  return localDataRoot ? path.join(localDataRoot, fileName) : undefined;
}

function resolveFilePath(envKey: string, fileName: string): string {
  const explicitPath = readAbsolutePathEnv(envKey);
  if (explicitPath) {
    return explicitPath;
  }
  return path.join(resolveLocalDataRoot(), fileName);
}

function readAbsolutePathEnv(envKey: string): string | undefined {
  const explicitPath = process.env[envKey]?.trim();
  if (!explicitPath) {
    return undefined;
  }
  if (!path.isAbsolute(explicitPath)) {
    throw new Error(`${envKey} must be an absolute path.`);
  }
  return path.resolve(explicitPath);
}

function resolveLocalDataRoot(): string {
  const localDataRoot = resolveOptionalLocalDataRoot();
  if (localDataRoot) {
    return localDataRoot;
  }
  return path.resolve(".jarvis-k-local-data");
}

function resolveOptionalLocalDataRoot(): string | undefined {
  const explicitRoot = readAbsolutePathEnv("JARVIS_K_LOCAL_DATA_PATH");
  if (explicitRoot) {
    return explicitRoot;
  }
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData) {
    return undefined;
  }
  return path.join(localAppData, "Jarvis-K");
}
