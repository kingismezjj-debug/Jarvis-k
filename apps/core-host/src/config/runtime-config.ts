import path from "node:path";

export type RuntimeMode = "production" | "development" | "test" | "fixture";

export interface RuntimeConfig {
  readonly mode: RuntimeMode;
  readonly env: Readonly<NodeJS.ProcessEnv>;
  readonly fixtureChatAnswerEnabled: boolean;
  readonly providerBackedChatAnswerProductManualAcceptanceRequested: boolean;
  readonly providerBackedChatAnswerExpandedProductLoopRequested: boolean;
  readonly deepseekChatAnswerEnabled: boolean;
  readonly chatAnswerTextOnlyAcceptanceRequested: boolean;
  readonly localSmokeChatAnswerEnabled: boolean;
  readonly fixtureInferenceEnabled: boolean;
  readonly brainRouterModelId?: string | undefined;
  readonly qwenFastRouterEnabled: boolean;
  readonly localPluginManifestDiscoveryEnabled: boolean;
  readonly openAiHeavyPlannerEnabled: boolean;
  readonly openAiHeavyPlannerOneWindowApproved: boolean;
  readonly glmRuntimeHeavyPlannerEnabled: boolean;
  readonly glmRuntimeHeavyPlannerOneWindowApproved: boolean;
  readonly smokeVoiceEnabled: boolean;
  readonly brainOpenActionsDisabled: boolean;
  readonly realWindowsExecutionEnabled: boolean;
  readonly brainRouterEnabled: boolean;
  readonly language: "zh" | "en";
  readonly smokeProviderFaultEnabled: boolean;
  readonly deterministicFallbackEnabled: true;
  readonly voicePilotExpectedProviderId?: "xunfei" | "volcengine" | undefined;
}

export interface RuntimeConfigLogProjection {
  readonly mode: RuntimeMode;
  readonly fixtureChatAnswerEnabled: boolean;
  readonly fixtureInferenceEnabled: boolean;
  readonly qwenFastRouterEnabled: boolean;
  readonly localPluginManifestDiscoveryEnabled: boolean;
  readonly deterministicFallbackEnabled: true;
  readonly sensitiveValuesExposed: false;
}

const BOOLEAN_ENV_KEYS = [
  "JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER",
  "JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_PRODUCT_MANUAL_ACCEPTANCE",
  "JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_EXPANDED_PRODUCT_LOOP",
  "JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK",
  "JARVIS_K_ENABLE_CHAT_ANSWER_TEXT_ONLY_ACCEPTANCE",
  "JARVIS_K_ENABLE_LOCAL_SMOKE_CHAT_ANSWER",
  "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
  "JARVIS_K_ENABLE_QWEN_FAST_ROUTER",
  "JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS",
  "JARVIS_K_ENABLE_HEAVY_PLANNER_OPENAI",
  "JARVIS_K_HEAVY_PLANNER_OPENAI_ONE_WINDOW_APPROVED",
  "JARVIS_K_ENABLE_HEAVY_PLANNER_GLM",
  "JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED",
  "JARVIS_K_SMOKE_VOICE",
  "JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS",
  "JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION",
  "JARVIS_K_ENABLE_BRAIN_ROUTER",
  "JARVIS_K_SMOKE_PROVIDER_FAULT",
] as const;

const PATH_ENV_KEYS = [
  "JARVIS_K_MEMORY_DB_PATH",
  "JARVIS_K_TASK_DB_PATH",
  "JARVIS_K_LOCAL_PLUGIN_STATE_PATH",
  "JARVIS_K_VOICE_COMMAND_ALIAS_PATH",
  "JARVIS_K_USER_ROUTE_ALIAS_PATH",
  "JARVIS_K_USER_PREFERENCE_MEMORY_PATH",
  "JARVIS_K_VOICE_REGRESSION_PATH",
  "JARVIS_K_MODEL_DIR",
  "JARVIS_K_USER_DATA_PATH",
  "JARVIS_K_LOCAL_DATA_PATH",
  "JARVIS_K_QWEN_RETAINED_SESSION_MARKER_PATH",
  "JARVIS_K_LOCAL_PLUGIN_DIRS",
] as const;

export function loadRuntimeConfig(
  env: Readonly<NodeJS.ProcessEnv> = process.env,
): RuntimeConfig {
  validateBooleanEnvironment(env);
  validatePathEnvironment(env);
  const mode = parseRuntimeMode(env);
  const fixtureChatAnswerEnabled = flag(env, "JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER");
  const fixtureInferenceEnabled = flag(env, "JARVIS_K_ENABLE_FIXTURE_INFERENCE");
  const openAiHeavyPlannerEnabled = flag(
    env,
    "JARVIS_K_ENABLE_HEAVY_PLANNER_OPENAI",
  );
  const glmRuntimeHeavyPlannerEnabled = flag(
    env,
    "JARVIS_K_ENABLE_HEAVY_PLANNER_GLM",
  );
  if (mode === "production" && (fixtureChatAnswerEnabled || fixtureInferenceEnabled)) {
    throw new Error("Production runtime cannot enable fixture providers.");
  }
  if (openAiHeavyPlannerEnabled && glmRuntimeHeavyPlannerEnabled) {
    throw new Error("Only one heavy planner provider may be enabled.");
  }
  const brainRouterModelId = env.JARVIS_K_BRAIN_ROUTER_MODEL_ID?.trim();
  if (brainRouterModelId !== undefined && brainRouterModelId.length > 300) {
    throw new Error("Brain router model id is invalid.");
  }
  const voicePilotExpectedProviderId = parseVoicePilotExpectedProviderId(env);
  return {
    mode,
    env,
    fixtureChatAnswerEnabled,
    providerBackedChatAnswerProductManualAcceptanceRequested: flag(
      env,
      "JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_PRODUCT_MANUAL_ACCEPTANCE",
    ),
    providerBackedChatAnswerExpandedProductLoopRequested: flag(
      env,
      "JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_EXPANDED_PRODUCT_LOOP",
    ),
    deepseekChatAnswerEnabled: flag(env, "JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK"),
    chatAnswerTextOnlyAcceptanceRequested: flag(
      env,
      "JARVIS_K_ENABLE_CHAT_ANSWER_TEXT_ONLY_ACCEPTANCE",
    ),
    localSmokeChatAnswerEnabled: flag(env, "JARVIS_K_ENABLE_LOCAL_SMOKE_CHAT_ANSWER"),
    fixtureInferenceEnabled,
    ...(brainRouterModelId ? { brainRouterModelId } : {}),
    qwenFastRouterEnabled: flag(env, "JARVIS_K_ENABLE_QWEN_FAST_ROUTER"),
    localPluginManifestDiscoveryEnabled: flag(
      env,
      "JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS",
    ),
    openAiHeavyPlannerEnabled,
    openAiHeavyPlannerOneWindowApproved: flag(
      env,
      "JARVIS_K_HEAVY_PLANNER_OPENAI_ONE_WINDOW_APPROVED",
    ),
    glmRuntimeHeavyPlannerEnabled,
    glmRuntimeHeavyPlannerOneWindowApproved: flag(
      env,
      "JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED",
    ),
    smokeVoiceEnabled: flag(env, "JARVIS_K_SMOKE_VOICE"),
    brainOpenActionsDisabled: flag(env, "JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS"),
    realWindowsExecutionEnabled: flag(env, "JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION"),
    brainRouterEnabled: env.JARVIS_K_ENABLE_BRAIN_ROUTER !== "0",
    language: env.JARVIS_K_LANGUAGE === "en" ? "en" : "zh",
    smokeProviderFaultEnabled: flag(env, "JARVIS_K_SMOKE_PROVIDER_FAULT"),
    deterministicFallbackEnabled: true,
    ...(voicePilotExpectedProviderId === undefined
      ? {}
      : { voicePilotExpectedProviderId }),
  };
}

export function toLogSafeRuntimeConfig(
  config: RuntimeConfig,
): RuntimeConfigLogProjection {
  return {
    mode: config.mode,
    fixtureChatAnswerEnabled: config.fixtureChatAnswerEnabled,
    fixtureInferenceEnabled: config.fixtureInferenceEnabled,
    qwenFastRouterEnabled: config.qwenFastRouterEnabled,
    localPluginManifestDiscoveryEnabled:
      config.localPluginManifestDiscoveryEnabled,
    deterministicFallbackEnabled: true,
    sensitiveValuesExposed: false,
  };
}

function parseRuntimeMode(env: Readonly<NodeJS.ProcessEnv>): RuntimeMode {
  const raw = (env.JARVIS_K_RUNTIME_MODE ?? env.NODE_ENV ?? "development").trim();
  if (raw === "production" || raw === "development" || raw === "test" || raw === "fixture") {
    return raw;
  }
  throw new Error("Runtime mode is invalid.");
}

function flag(env: Readonly<NodeJS.ProcessEnv>, key: string): boolean {
  const raw = env[key];
  return raw === "1" || raw === "true";
}

function parseVoicePilotExpectedProviderId(
  env: Readonly<NodeJS.ProcessEnv>,
): "xunfei" | "volcengine" | undefined {
  const raw = env.JARVIS_K_VOICE_PILOT_EXPECTED_PROVIDER_ID?.trim().toLowerCase();
  if (raw === undefined || raw.length === 0) {
    return undefined;
  }
  if (raw === "xunfei" || raw === "volcengine") {
    return raw;
  }
  throw new Error("Voice Pilot expected provider id is invalid.");
}

function validateBooleanEnvironment(env: Readonly<NodeJS.ProcessEnv>): void {
  for (const key of BOOLEAN_ENV_KEYS) {
    const raw = env[key];
    if (
      raw !== undefined &&
      raw !== "" &&
      raw !== "0" &&
      raw !== "1" &&
      raw !== "true" &&
      raw !== "false"
    ) {
      throw new Error(`Invalid boolean environment value for ${key}.`);
    }
  }
}

function validatePathEnvironment(env: Readonly<NodeJS.ProcessEnv>): void {
  for (const key of PATH_ENV_KEYS) {
    const raw = env[key];
    if (raw !== undefined && raw.includes("\0")) {
      throw new Error(`Invalid path environment value for ${key}.`);
    }
    if (raw !== undefined && raw.trim().length > 0) {
      validateAbsolutePathEnvironmentValue(key, raw);
    }
  }
}

function validateAbsolutePathEnvironmentValue(key: string, raw: string): void {
  if (key === "JARVIS_K_LOCAL_PLUGIN_DIRS") {
    for (const directory of raw.split(path.delimiter)) {
      if (directory.trim().length > 0 && !isAbsolutePath(directory.trim())) {
        throw new Error(`Invalid path environment value for ${key}.`);
      }
    }
    return;
  }
  if (!isAbsolutePath(raw.trim())) {
    throw new Error(`Invalid path environment value for ${key}.`);
  }
}

function isAbsolutePath(value: string): boolean {
  return path.isAbsolute(value);
}
