import path from "node:path";

export type ReleaseChannel = "development" | "alpha" | "stable" | "test";

export interface ElectronAppStoragePort {
  isPackaged: boolean;
  getPath(name: "appData" | "userData"): string;
  setPath(name: "userData", value: string): void;
  setName?(name: string): void;
  setAppUserModelId?(id: string): void;
}

export interface StorageProfile {
  readonly releaseChannel: ReleaseChannel;
  readonly productName: string;
  readonly appId: string;
  readonly appUserModelId: string;
  readonly userDataPath: string;
  readonly localDataPath: string;
  readonly desktopSettingsPath: string;
  readonly localPluginStatePath: string;
  readonly memoryDatabasePath: string;
  readonly taskDatabasePath: string;
  readonly modelDirectoryPath: string;
  readonly voiceCommandAliasPath: string;
  readonly userRouteAliasPath: string;
  readonly userPreferenceMemoryPath: string;
  readonly voiceRegressionPath: string;
  readonly qwenRetainedSessionMarkerPath: string;
}

export interface CreateStorageProfileOptions {
  readonly app: ElectronAppStoragePort;
  readonly env?: Readonly<NodeJS.ProcessEnv>;
  readonly cwd?: string;
  readonly installDirectory?: string;
}

const APP_ID_BY_CHANNEL: Record<ReleaseChannel, string> = {
  development: "com.jarvis-k.desktop.development",
  alpha: "com.jarvis-k.desktop.alpha",
  stable: "com.jarvis-k.desktop",
  test: "com.jarvis-k.desktop.test",
};

const PRODUCT_NAME_BY_CHANNEL: Record<ReleaseChannel, string> = {
  development: "Jarvis-K",
  alpha: "Jarvis-K Alpha",
  stable: "Jarvis-K",
  test: "Jarvis-K Test",
};

const DATA_DIRECTORY_BY_CHANNEL: Record<ReleaseChannel, string> = {
  development: "Jarvis-K",
  alpha: "Jarvis-K-Alpha",
  stable: "Jarvis-K",
  test: "Jarvis-K-Test",
};

export function createDesktopStorageProfile(
  options: CreateStorageProfileOptions,
): StorageProfile {
  const env = options.env ?? process.env;
  const releaseChannel = resolveReleaseChannel({
    env,
    isPackaged: options.app.isPackaged,
  });
  const productName = PRODUCT_NAME_BY_CHANNEL[releaseChannel];
  const appId = APP_ID_BY_CHANNEL[releaseChannel];
  const dataDirectoryName = DATA_DIRECTORY_BY_CHANNEL[releaseChannel];
  const userDataPath = resolveProfilePath({
    channel: releaseChannel,
    envKey: "JARVIS_K_USER_DATA_PATH",
    env,
    fallbackRoot: options.app.getPath("appData"),
    dataDirectoryName,
    cwd: options.cwd ?? process.cwd(),
    installDirectory: options.installDirectory,
  });
  const localDataPath = resolveProfilePath({
    channel: releaseChannel,
    envKey: "JARVIS_K_LOCAL_DATA_PATH",
    env,
    fallbackRoot: resolveLocalAppData(env),
    dataDirectoryName,
    cwd: options.cwd ?? process.cwd(),
    installDirectory: options.installDirectory,
  });

  return {
    releaseChannel,
    productName,
    appId,
    appUserModelId: appId,
    userDataPath,
    localDataPath,
    desktopSettingsPath: path.join(userDataPath, "jarvis-k-desktop-settings.json"),
    localPluginStatePath: path.join(localDataPath, "local-plugin-state.json"),
    memoryDatabasePath: path.join(localDataPath, "memory.sqlite"),
    taskDatabasePath: path.join(localDataPath, "task-runtime.sqlite"),
    modelDirectoryPath: path.join(localDataPath, "models"),
    voiceCommandAliasPath: path.join(localDataPath, "voice-command-aliases.json"),
    userRouteAliasPath: path.join(localDataPath, "user-route-aliases.json"),
    userPreferenceMemoryPath: path.join(
      localDataPath,
      "user-preference-memories.json",
    ),
    voiceRegressionPath: path.join(localDataPath, "voice-regression-records.json"),
    qwenRetainedSessionMarkerPath: path.join(
      localDataPath,
      "models",
      "qwen-retained-product-session-2026-08-10",
      "session-marker.sanitized.json",
    ),
  };
}

export function applyDesktopStorageProfile(
  app: ElectronAppStoragePort,
  profile: StorageProfile,
): void {
  app.setName?.(profile.productName);
  app.setPath("userData", profile.userDataPath);
  app.setAppUserModelId?.(profile.appUserModelId);
}

export function createCoreHostStorageEnvironment(
  profile: StorageProfile,
): NodeJS.ProcessEnv {
  return {
    JARVIS_K_RELEASE_CHANNEL: profile.releaseChannel,
    JARVIS_K_USER_DATA_PATH: profile.userDataPath,
    JARVIS_K_LOCAL_DATA_PATH: profile.localDataPath,
    JARVIS_K_MEMORY_DB_PATH: profile.memoryDatabasePath,
    JARVIS_K_TASK_DB_PATH: profile.taskDatabasePath,
    JARVIS_K_LOCAL_PLUGIN_STATE_PATH: profile.localPluginStatePath,
    JARVIS_K_VOICE_COMMAND_ALIAS_PATH: profile.voiceCommandAliasPath,
    JARVIS_K_USER_ROUTE_ALIAS_PATH: profile.userRouteAliasPath,
    JARVIS_K_USER_PREFERENCE_MEMORY_PATH: profile.userPreferenceMemoryPath,
    JARVIS_K_VOICE_REGRESSION_PATH: profile.voiceRegressionPath,
    JARVIS_K_MODEL_DIR: profile.modelDirectoryPath,
    JARVIS_K_QWEN_RETAINED_SESSION_MARKER_PATH:
      profile.qwenRetainedSessionMarkerPath,
  };
}

function resolveReleaseChannel(input: {
  readonly env: Readonly<NodeJS.ProcessEnv>;
  readonly isPackaged: boolean;
}): ReleaseChannel {
  if (input.env.NODE_ENV === "test" || input.env.VITEST === "true") {
    return "test";
  }
  return input.isPackaged ? "alpha" : "development";
}

function resolveProfilePath(input: {
  readonly channel: ReleaseChannel;
  readonly envKey: "JARVIS_K_USER_DATA_PATH" | "JARVIS_K_LOCAL_DATA_PATH";
  readonly env: Readonly<NodeJS.ProcessEnv>;
  readonly fallbackRoot: string;
  readonly dataDirectoryName: string;
  readonly cwd: string;
  readonly installDirectory?: string | undefined;
}): string {
  const explicitPath = input.env[input.envKey]?.trim();
  if (explicitPath) {
    if (input.channel !== "development" && input.channel !== "test") {
      throw new Error(`${input.envKey} is only allowed in development or test.`);
    }
    assertSafeOverridePath(explicitPath, {
      cwd: input.cwd,
      installDirectory: input.installDirectory,
      envKey: input.envKey,
    });
    return path.resolve(explicitPath);
  }
  return path.join(input.fallbackRoot, input.dataDirectoryName);
}

function resolveLocalAppData(env: Readonly<NodeJS.ProcessEnv>): string {
  const explicit = env.LOCALAPPDATA?.trim();
  if (explicit) {
    return explicit;
  }
  return path.join(process.cwd(), ".jarvis-k-local-data");
}

function assertSafeOverridePath(
  rawPath: string,
  input: {
    readonly cwd: string;
    readonly installDirectory?: string | undefined;
    readonly envKey: string;
  },
): void {
  if (!path.isAbsolute(rawPath)) {
    throw new Error(`${input.envKey} must be an absolute path.`);
  }
  const resolved = path.resolve(rawPath);
  const lower = resolved.toLowerCase();
  const cwd = path.resolve(input.cwd).toLowerCase();
  if (isSameOrInside(lower, cwd)) {
    throw new Error(`${input.envKey} cannot point inside the project directory.`);
  }
  const installDirectory = input.installDirectory
    ? path.resolve(input.installDirectory).toLowerCase()
    : undefined;
  if (installDirectory && isSameOrInside(lower, installDirectory)) {
    throw new Error(`${input.envKey} cannot point inside the install directory.`);
  }
  const parts = resolved.split(/[\\/]+/u).map((part) => part.toLowerCase());
  if (parts.includes("documents") || parts.includes("desktop")) {
    throw new Error(`${input.envKey} cannot point to public user folders.`);
  }
}

function isSameOrInside(candidate: string, parent: string): boolean {
  return candidate === parent || candidate.startsWith(`${parent.toLowerCase()}${path.sep}`);
}
