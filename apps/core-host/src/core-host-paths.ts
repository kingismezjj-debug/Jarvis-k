import path from "node:path";

export function resolveMemoryDatabasePath(): string | undefined {
  const explicitPath = process.env.JARVIS_K_MEMORY_DB_PATH?.trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData) {
    return undefined;
  }
  return path.join(localAppData, "Jarvis-K", "memory.sqlite");
}

export function resolveTaskDatabasePath(): string {
  const explicitPath = process.env.JARVIS_K_TASK_DB_PATH?.trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData) {
    return path.resolve("task-runtime.sqlite");
  }
  return path.join(localAppData, "Jarvis-K", "task-runtime.sqlite");
}

export function resolveLocalPluginStatePath(): string {
  const explicitPath = process.env.JARVIS_K_LOCAL_PLUGIN_STATE_PATH?.trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData) {
    return path.resolve("local-plugin-state.json");
  }
  return path.join(localAppData, "Jarvis-K", "local-plugin-state.json");
}

export function resolveVoiceCommandAliasPath(): string {
  const explicitPath = process.env.JARVIS_K_VOICE_COMMAND_ALIAS_PATH?.trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData) {
    return path.resolve("voice-command-aliases.json");
  }
  return path.join(localAppData, "Jarvis-K", "voice-command-aliases.json");
}

export function resolveUserRouteAliasPath(): string {
  const explicitPath = process.env.JARVIS_K_USER_ROUTE_ALIAS_PATH?.trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData) {
    return path.resolve("user-route-aliases.json");
  }
  return path.join(localAppData, "Jarvis-K", "user-route-aliases.json");
}

export function resolveUserPreferenceMemoryPath(): string {
  const explicitPath = process.env.JARVIS_K_USER_PREFERENCE_MEMORY_PATH?.trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData) {
    return path.resolve("user-preference-memories.json");
  }
  return path.join(localAppData, "Jarvis-K", "user-preference-memories.json");
}

export function resolveVoiceRegressionPath(): string {
  const explicitPath = process.env.JARVIS_K_VOICE_REGRESSION_PATH?.trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData) {
    return path.resolve("voice-regression-records.json");
  }
  return path.join(localAppData, "Jarvis-K", "voice-regression-records.json");
}

export function resolveModelDirectoryPath(): string {
  const explicitPath = process.env.JARVIS_K_MODEL_DIR?.trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData) {
    return path.resolve("models");
  }
  return path.join(localAppData, "Jarvis-K", "models");
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
