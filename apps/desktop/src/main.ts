import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  BrowserWindow,
  app,
  ipcMain,
  safeStorage
} from "electron";
import {
  ChatAnswerProductModeStatus,
  CommandRouterProductModeStatus,
  CommandEnvelopeSchema,
  CommandResult,
  IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
  IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_COMMAND_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_EVENT_CHANNEL,
  IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL,
  IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL,
  IPC_TTS_SETTINGS_CLEAR_CHANNEL,
  IPC_TTS_SETTINGS_OPEN_CHANNEL,
  IPC_TTS_SETTINGS_SAVE_CHANNEL,
  IPC_TTS_SETTINGS_STATUS_CHANNEL,
  IPC_TTS_SYNTHESIZE_CHANNEL,
  IPC_VOICE_SETTINGS_OPEN_CHANNEL,
  IPC_VOICE_SETTINGS_STATUS_CHANNEL,
  IPC_VOICE_AUDIO_CHANNEL,
  PROTOCOL_VERSION,
  createCommandRouterQwenProductRoutingActivationStatus,
  QwenRuntimeControlActionSchema,
  QwenRuntimeControlSetResult,
  QwenRuntimeControlStatus,
  type TtsServiceStatus,
  type TtsSynthesisResult,
  type VoiceServiceStatus,
  createId
} from "@jarvis-k/contracts";
import {
  SecureVoiceProviderStore,
  type VoiceProviderConfiguration
} from "./secure-voice-provider-store";
import {
  SecureTtsProviderStore,
  type TtsProviderConfiguration
} from "./secure-tts-provider-store";
import {
  SecureHeavyPlannerProviderStore,
  type HeavyPlannerProviderConfiguration,
  type HeavyPlannerProviderName
} from "./secure-heavy-planner-provider-store";
import {
  SecureChatAnswerProviderStore,
  type ChatAnswerProviderConfiguration
} from "./secure-chat-answer-provider-store";
import {
  isStage5LocalAcceptanceNoSecureStore,
  selectedChatAnswerProvider,
  selectedHeavyPlannerProvider
} from "./desktop-runtime-policy";
import { CoreSupervisor } from "./supervisor";
import { handleVoiceAudioIpc } from "./voice-audio-ipc";
import {
  VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL,
  VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL,
  type VoiceProviderSettingsInput,
  type VoiceProviderSettingsResult
} from "./voice-settings-ipc";
import { createVoiceSettingsWindow } from "./voice-settings-window";
import { createMainWindow } from "./windows/main-window";

let mainWindow: BrowserWindow | null = null;
let voiceSettingsWindow: BrowserWindow | null = null;
let supervisor: CoreSupervisor | null = null;
let voiceProviderStore: SecureVoiceProviderStore | null = null;
let ttsProviderStore: SecureTtsProviderStore | null = null;
let openAiHeavyPlannerProviderStore: SecureHeavyPlannerProviderStore | null =
  null;
let glmHeavyPlannerProviderStore: SecureHeavyPlannerProviderStore | null =
  null;
let deepseekChatAnswerProviderStore: SecureChatAnswerProviderStore | null =
  null;
let commandRouterProductModeEnabled = false;
let chatAnswerProductModeEnabled = false;
let chatAnswerProductModeRuntimeArmed = false;
let qwenRuntimeControlState:
  | "disabled"
  | "prepared"
  | "active"
  | "fallback"
  | "blocked" = "disabled";
let qwenRuntimeControlExplicitOptIn = false;
let qwenRuntimeControlHelperStartCount = 0;
let qwenRuntimeControlGenerationPortReadinessProbeCount = 0;
let qwenRuntimeControlRouteRequestCount = 0;
let qwenRuntimeControlHelperShutdownVerified = true;

const QWEN_RETAINED_SESSION_ID =
  "qwen-retained-product-session-2026-08-10" as const;

if (process.env.JARVIS_K_ENABLE_ELECTRON_GPU !== "1") {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-gpu-compositing");
}

function invalidCommandResult(rawValue: unknown): CommandResult {
  const raw =
    typeof rawValue === "object" && rawValue !== null
      ? (rawValue as Record<string, unknown>)
      : {};
  const commandId =
    typeof raw.commandId === "string" ? raw.commandId : createId("cmd");
  const correlationId =
    typeof raw.correlationId === "string"
      ? raw.correlationId
      : createId("corr");

  return {
    protocolVersion: PROTOCOL_VERSION,
    commandId,
    correlationId,
    completedAt: new Date().toISOString(),
    ok: false,
    error: {
      code: "IPC_SCHEMA_INVALID",
      message: "The renderer sent an invalid command envelope.",
      retryable: false
    }
  };
}

function getVoiceProviderStore(): SecureVoiceProviderStore {
  if (!voiceProviderStore) {
    voiceProviderStore = new SecureVoiceProviderStore(
      path.join(app.getPath("userData"), "jarvis-k-voice-provider.json"),
      {
        isAvailable: () => safeStorage.isEncryptionAvailable(),
        encrypt: (value) => safeStorage.encryptString(value),
        decrypt: (value) => safeStorage.decryptString(value)
      }
    );
  }
  return voiceProviderStore;
}

function getTtsProviderStore(): SecureTtsProviderStore {
  if (!ttsProviderStore) {
    ttsProviderStore = new SecureTtsProviderStore(
      path.join(app.getPath("userData"), "jarvis-k-tts-provider.json"),
      {
        isAvailable: () => safeStorage.isEncryptionAvailable(),
        encrypt: (value) => safeStorage.encryptString(value),
        decrypt: (value) => safeStorage.decryptString(value)
      }
    );
  }
  return ttsProviderStore;
}

function getHeavyPlannerProviderStore(
  provider: HeavyPlannerProviderName
): SecureHeavyPlannerProviderStore {
  const existingStore =
    provider === "glm"
      ? glmHeavyPlannerProviderStore
      : openAiHeavyPlannerProviderStore;
  if (existingStore) {
    return existingStore;
  }
  const store = new SecureHeavyPlannerProviderStore(
    path.join(
      app.getPath("userData"),
      provider === "glm"
        ? "jarvis-k-heavy-planner-glm-provider.json"
        : "jarvis-k-heavy-planner-provider.json"
    ),
    {
      isAvailable: () => safeStorage.isEncryptionAvailable(),
      encrypt: (value) => safeStorage.encryptString(value),
      decrypt: (value) => safeStorage.decryptString(value)
    },
    provider
  );
  if (provider === "glm") {
    glmHeavyPlannerProviderStore = store;
  } else {
    openAiHeavyPlannerProviderStore = store;
  }
  return store;
}

async function getVoiceProviderConfiguration(): Promise<VoiceProviderConfiguration | null> {
  if (isStage5LocalAcceptanceNoSecureStore()) {
    return null;
  }
  try {
    return await getVoiceProviderStore().load();
  } catch (error) {
    process.stderr.write(
      `[desktop] Voice provider configuration unavailable: ${
        error instanceof Error ? error.message : "unknown error"
      }\n`
    );
    return null;
  }
}

async function getTtsProviderConfiguration(): Promise<TtsProviderConfiguration | null> {
  try {
    return await getTtsProviderStore().load();
  } catch (error) {
    process.stderr.write(
      `[desktop] TTS provider configuration unavailable: ${
        error instanceof Error ? error.message : "unknown error"
      }\n`
    );
    return null;
  }
}

async function getHeavyPlannerProviderConfiguration(): Promise<HeavyPlannerProviderConfiguration | null> {
  const provider = selectedHeavyPlannerProvider();
  if (!provider) {
    return null;
  }
  try {
    return await getHeavyPlannerProviderStore(provider).load();
  } catch (error) {
    process.stderr.write(
      `[desktop] Heavy Planner configuration unavailable: ${
        error instanceof Error ? error.message : "unknown error"
      }\n`
    );
    return null;
  }
}

function getChatAnswerProviderStore(
  provider: ChatAnswerProviderConfiguration["provider"]
): SecureChatAnswerProviderStore {
  if (
    provider === "chat-answer.openai-compatible.deepseek" &&
    deepseekChatAnswerProviderStore
  ) {
    return deepseekChatAnswerProviderStore;
  }
  const store = new SecureChatAnswerProviderStore(
    path.join(
      app.getPath("userData"),
      provider === "chat-answer.openai-compatible.deepseek"
        ? "jarvis-k-chat-answer-deepseek-provider.json"
        : "jarvis-k-chat-answer-glm-provider.json"
    ),
    {
      isAvailable: () => safeStorage.isEncryptionAvailable(),
      encrypt: (value) => safeStorage.encryptString(value),
      decrypt: (value) => safeStorage.decryptString(value)
    },
    provider
  );
  if (provider === "chat-answer.openai-compatible.deepseek") {
    deepseekChatAnswerProviderStore = store;
  }
  return store;
}

async function getChatAnswerProviderConfiguration(): Promise<ChatAnswerProviderConfiguration | null> {
  const provider = selectedChatAnswerProvider();
  if (!provider) {
    return null;
  }
  try {
    return await getChatAnswerProviderStore(provider).load();
  } catch (error) {
    process.stderr.write(
      `[desktop] Chat Answer provider configuration unavailable: ${
        error instanceof Error ? error.message : "unknown error"
      }\n`
    );
    return null;
  }
}

async function getChatAnswerProductModeStatus(): Promise<ChatAnswerProductModeStatus> {
  const providerId = "chat-answer.openai-compatible.deepseek" as const;
  let secureStorageAvailable = safeStorage.isEncryptionAvailable();
  let credentialConfigured = false;
  try {
    const status = await getChatAnswerProviderStore(providerId).status();
    secureStorageAvailable = status.status !== "unavailable";
    credentialConfigured = status.credentialConfigured;
  } catch {
    secureStorageAvailable = false;
    credentialConfigured = false;
  }

  const status = !secureStorageAvailable
    ? "secure_store_unavailable"
    : !credentialConfigured
      ? "credential_missing"
      : chatAnswerProductModeEnabled
        ? chatAnswerProductModeRuntimeArmed
          ? "control_enabled_runtime_armed"
          : "control_enabled_runtime_locked"
        : "disabled";
  const reasonCodes =
    status === "secure_store_unavailable"
      ? ["CHAT_ANSWER_PRODUCT_MODE_SECURE_STORE_UNAVAILABLE"]
      : status === "credential_missing"
        ? ["CHAT_ANSWER_PRODUCT_MODE_CREDENTIAL_MISSING"]
        : status === "control_enabled_runtime_armed"
          ? [
              "CHAT_ANSWER_PRODUCT_MODE_CONTROL_ENABLED",
              "CHAT_ANSWER_PRODUCT_MODE_REAL_RUNTIME_ARMED"
            ]
          : status === "control_enabled_runtime_locked"
          ? [
              "CHAT_ANSWER_PRODUCT_MODE_CONTROL_ENABLED",
              "CHAT_ANSWER_PRODUCT_MODE_REAL_RUNTIME_LOCKED"
            ]
          : ["CHAT_ANSWER_PRODUCT_MODE_DISABLED"];

  return {
    enabled: chatAnswerProductModeEnabled,
    providerId,
    profileId: "deepseek.v4-flash.compact_json_object_256",
    status,
    secureStorageAvailable,
    credentialConfigured,
    credentialExposed: false,
    realProviderRuntimeEnabled: status === "control_enabled_runtime_armed",
    networkAccessApproved: status === "control_enabled_runtime_armed",
    defaultBehaviorChanged: false,
    fallbackPreserved: true,
    reasonCodes
  };
}

function getCommandRouterProductModeStatus(): CommandRouterProductModeStatus {
  const qwenBindingStatus = commandRouterProductModeEnabled
    ? "unconfigured"
    : "disabled";
  return {
    enabled: commandRouterProductModeEnabled,
    providerId: "intent-router.deterministic.rules",
    mode: "production_rules",
    status: commandRouterProductModeEnabled
      ? "control_enabled_rules_only"
      : "disabled",
    fixtureOnly: false,
    directActionEnabled: false,
    realQwenRuntimeEnabled: false,
    networkAccessApproved: false,
    defaultBehaviorChanged: false,
    chatAnswerFallbackPreserved: true,
    qwenFastRouterBinding: {
      providerId: "intent-router.qwen3-0.6b",
      modelId: "Qwen/Qwen3-0.6B",
      status: qwenBindingStatus,
      mode: "no_runtime_status_only",
      productRoutingEnabled: false,
      realRuntimeEnabled: false,
      runtimeAccessed: false,
      artifactAccessed: false,
      persistentCacheChanged: false,
      directActionAttempted: false,
      activation: createCommandRouterQwenProductRoutingActivationStatus({
        commandRouterProductModeEnabled,
        preparedPolicyReviewed: true,
        readinessEvidencePassed: true,
        noRuntimeProductBindingPresent: true,
        coreSelectionFallbackPreserved: true,
        commandRouterSafetyGatesPreserved: true,
        deterministicRulesActive: true
      }),
      conversationSurfaceProductRoute: {
        policyId: "qwen-conversation-surface.product-route.default-off.v1",
        status: commandRouterProductModeEnabled ? "ready" : "disabled",
        explicitOptInRequired: true,
        explicitOptInEnabled: false,
        activeRouteSource: "intent-router.deterministic.rules",
        fallbackRouteSource: "intent-router.deterministic.rules",
        qwenRouteSelectable: false,
        productRouteExecutionEnabled: false,
        directActionEnabled: false,
        browserUrlOpeningEnabled: false,
        vsCodeBlocked: true,
        allowlistTargets: ["notepad", "calculator"] as const,
        persistentOptIn: {
          policyId:
            "qwen-conversation-surface.persistent-opt-in.default-off.v1",
          status: commandRouterProductModeEnabled ? "prepared" : "disabled",
          localDeveloperOptInRequired: true,
          localDeveloperOptInEnabled: false,
          qwenRouteSelectableByDefault: false,
          productRouteExecutionEnabledByDefault: false,
          limitedProductSessionOnly: true,
          routeRequestLimit: 3,
          retainedSessionRequired: true,
          helperStartupAllowedByPolicyState: false,
          generationPortInvocationAllowedByPolicyState: false,
          activeRouteSource: "intent-router.deterministic.rules",
          fallbackRouteSource: "intent-router.deterministic.rules",
          rollbackRouteSource: "intent-router.deterministic.rules",
          defaultBehaviorChanged: false,
          releaseBehaviorChanged: false,
          reasonCodes: commandRouterProductModeEnabled
            ? [
              "QWEN_CONVERSATION_PERSISTENT_OPT_IN_PREPARED_DEFAULT_OFF",
              "QWEN_CONVERSATION_PERSISTENT_OPT_IN_LIMITED_SESSION_ONLY"
              ]
            : ["QWEN_CONVERSATION_PERSISTENT_OPT_IN_DISABLED"]
        },
        rollbackState: commandRouterProductModeEnabled ? "ready" : "not_needed",
        implementationPrepared: true,
        defaultBehaviorChanged: false,
        releaseBehaviorChanged: false,
        reasonCodes: commandRouterProductModeEnabled
          ? [
              "QWEN_CONVERSATION_PRODUCT_ROUTE_READY_DEFAULT_OFF",
              "QWEN_CONVERSATION_PRODUCT_ROUTE_RULES_ACTIVE"
            ]
          : ["QWEN_CONVERSATION_PRODUCT_ROUTE_DISABLED"]
      },
      gates: {
        explicitEnablementRequired: true,
        artifactDigestApprovalRequired: true,
        modelLifecycleReadinessRequired: true,
        runtimeGenerationPortReadinessRequired: true,
        selectionPolicyReadinessRequired: true,
        defaultOffPreserved: true,
        deterministicFallbackPreserved: true,
        singleEnvVarSufficient: false,
        normalCoreHostStartupInstantiatesQwen: false
      },
      reasonCodes: [
        "QWEN_FAST_ROUTER_PRODUCT_BINDING_DISABLED",
        "QWEN_FAST_ROUTER_NO_RUNTIME_STATUS_ONLY",
        "QWEN_FAST_ROUTER_PRODUCT_ROUTING_UNAVAILABLE"
      ]
    },
    reasonCodes: commandRouterProductModeEnabled
      ? [
          "COMMAND_ROUTER_PRODUCT_MODE_CONTROL_ENABLED",
          "COMMAND_ROUTER_PRODUCT_MODE_FIXTURE_ONLY",
          "COMMAND_ROUTER_PRODUCT_MODE_DIRECT_ACTION_DISABLED"
        ]
      : ["COMMAND_ROUTER_PRODUCT_MODE_DISABLED"]
  };
}

function retainedQwenSessionMarkerPath(): string {
  return path.join(
    __dirname,
    "..",
    "..",
    "..",
    "models",
    QWEN_RETAINED_SESSION_ID,
    "session-marker.sanitized.json"
  );
}

function retainedQwenSessionAvailable(): boolean {
  try {
    const raw = JSON.parse(
      readFileSync(retainedQwenSessionMarkerPath(), "utf8")
    ) as Record<string, unknown>;
    return (
      existsSync(retainedQwenSessionMarkerPath()) &&
      raw.sessionId === QWEN_RETAINED_SESSION_ID &&
      raw.status === "retained_bounded_developer_alpha_session" &&
      raw.dependencyEnv === "retained" &&
      raw.artifactCache === "retained" &&
      raw.helperLifecycle === "shutdown_after_verification" &&
      raw.approvedArtifactCount === 7 &&
      raw.digestBeforeLoad === "passed" &&
      raw.defaultOn === false &&
      raw.releaseExposure === false
    );
  } catch {
    return false;
  }
}

function repositoryRootPath(): string {
  return path.resolve(__dirname, "..", "..", "..");
}

function qwenConversationSurfaceRouteLimit(): 3 | 5 | 10 {
  if (process.env.JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE === "1") {
    return 10;
  }
  return process.env.JARVIS_K_QWEN_CONVERSATION_SURFACE_USAGE === "1" ? 5 : 3;
}

async function stopQwenRuntimeControlHelper(): Promise<boolean> {
  qwenRuntimeControlHelperShutdownVerified = true;
  return true;
}

function resetQwenRuntimeControlCounters(): void {
  qwenRuntimeControlHelperStartCount = 0;
  qwenRuntimeControlGenerationPortReadinessProbeCount = 0;
  qwenRuntimeControlRouteRequestCount = 0;
  qwenRuntimeControlHelperShutdownVerified = true;
}

function getQwenRuntimeControlStatus(): QwenRuntimeControlStatus {
  const retainedSessionAvailable = retainedQwenSessionAvailable();
  const prepared =
    retainedSessionAvailable &&
    qwenRuntimeControlExplicitOptIn &&
    qwenRuntimeControlState === "prepared";
  const active =
    retainedSessionAvailable &&
    qwenRuntimeControlExplicitOptIn &&
    qwenRuntimeControlState === "active";
  const fallback = qwenRuntimeControlState === "fallback";
  const blocked =
    !retainedSessionAvailable || qwenRuntimeControlState === "blocked";
  const activation = createCommandRouterQwenProductRoutingActivationStatus({
    commandRouterProductModeEnabled: true,
    preparedPolicyReviewed: true,
    readinessEvidencePassed: retainedSessionAvailable,
    noRuntimeProductBindingPresent: true,
    coreSelectionFallbackPreserved: true,
    commandRouterSafetyGatesPreserved: true,
    deterministicRulesActive: true,
    armingWindowApproved: active,
    runtimeRetentionApproved: active,
    manualAcceptanceApproved: active,
    helperStartupAllowed: active,
    artifactMaterializationAllowed: active,
    generationPortInvocationAllowed: active,
    productRoutingArmed: active,
    persistentEnablementApproved: true,
    explicitOptInEnabled: active,
    productRoutingEnabled: active,
    realQwenRuntimeEnabled: active,
    runtimeAccessed: active,
    artifactAccessed: active,
    helperStarted: active,
    generationPortInvoked: active,
      deterministicRulesRollbackReady: true,
      rollbackRequested: fallback,
      blocked
  });
  const status = blocked
    ? "blocked"
    : fallback
      ? "fallback"
      : active
        ? "active"
      : prepared
        ? "prepared"
        : "disabled";
  const reasonCodes =
    status === "blocked"
      ? ["QWEN_RUNTIME_CONTROL_RETAINED_SESSION_MISSING"]
      : status === "fallback"
        ? ["QWEN_RUNTIME_CONTROL_ROLLBACK_READY"]
        : status === "active"
          ? ["QWEN_RUNTIME_CONTROL_ACCEPTANCE_ACTIVE"]
        : status === "prepared"
          ? ["QWEN_RUNTIME_CONTROL_START_PREPARED"]
          : ["QWEN_RUNTIME_CONTROL_DEFAULT_OFF"];
  const helperLifecycle = active
    ? "running"
    : qwenRuntimeControlHelperShutdownVerified &&
        qwenRuntimeControlHelperStartCount === 1
      ? "shutdown_after_verification"
      : prepared
        ? "start_prepared"
        : "stopped";

  return {
    mode: "developer_alpha_local",
    status,
    retainedSessionId: QWEN_RETAINED_SESSION_ID,
    retainedSessionAvailable,
    explicitOptInRequired: true,
    explicitOptInEnabled: prepared || active,
    activeRouteSource: active
      ? "intent-router.qwen3-0.6b"
      : "intent-router.deterministic.rules",
    fallbackRouteSource: "intent-router.deterministic.rules",
    helperLifecycle,
    helperStartCount: qwenRuntimeControlHelperStartCount,
    generationPortReadinessProbeCount:
      qwenRuntimeControlGenerationPortReadinessProbeCount,
    routeRequestCount: qwenRuntimeControlRouteRequestCount,
    helperShutdownVerified: qwenRuntimeControlHelperShutdownVerified,
    routeRequestLimit: qwenConversationSurfaceRouteLimit(),
    controls: {
      start: "blocked",
      stop: prepared || active || fallback ? "available" : "blocked",
      rollback: retainedSessionAvailable ? "available" : "blocked"
    },
    directActionEnabled: false,
    browserUrlOpeningEnabled: false,
    vsCodeBlocked: true,
    allowlistTargets: ["notepad", "calculator"] as const,
    defaultBehaviorChanged: false,
    releaseBehaviorChanged: false,
    telemetryChanged: false,
    activation,
    reasonCodes
  };
}

async function setQwenRuntimeControlAction(
  event: Electron.IpcMainInvokeEvent,
  rawInput: unknown
): Promise<QwenRuntimeControlSetResult> {
  const parsedAction = QwenRuntimeControlActionSchema.safeParse(
    typeof rawInput === "object" && rawInput !== null
      ? (rawInput as Record<string, unknown>).action
      : undefined
  );
  if (!mainWindow || event.sender.id !== mainWindow.webContents.id) {
    return {
      ok: false,
      action: parsedAction.success ? parsedAction.data : "stop",
      status: getQwenRuntimeControlStatus(),
      message: "Qwen runtime control is unavailable."
    };
  }
  if (!parsedAction.success) {
    return {
      ok: false,
      action: "stop",
      status: getQwenRuntimeControlStatus(),
      message: "Qwen runtime control action is invalid."
    };
  }
  if (!retainedQwenSessionAvailable()) {
    qwenRuntimeControlState = "disabled";
    qwenRuntimeControlExplicitOptIn = false;
    resetQwenRuntimeControlCounters();
    return {
      ok: false,
      action: parsedAction.data,
      status: getQwenRuntimeControlStatus(),
      message: "Retained Qwen product session is unavailable."
    };
  }
  if (parsedAction.data === "start") {
    qwenRuntimeControlState = "blocked";
    qwenRuntimeControlExplicitOptIn = false;
    resetQwenRuntimeControlCounters();
    return {
      ok: false,
      action: parsedAction.data,
      status: getQwenRuntimeControlStatus(),
      message:
        "Qwen runtime control is disabled in the Desktop product boundary."
    };
  }
  if (parsedAction.data === "stop") {
    const stopped = await stopQwenRuntimeControlHelper();
    qwenRuntimeControlState = "disabled";
    qwenRuntimeControlExplicitOptIn = false;
    if (!stopped) {
      return {
        ok: false,
        action: parsedAction.data,
        status: getQwenRuntimeControlStatus(),
        message: "Qwen runtime control helper shutdown was not verified."
      };
    }
  }
  if (parsedAction.data === "rollback") {
    const stopped = await stopQwenRuntimeControlHelper();
    qwenRuntimeControlState = "fallback";
    qwenRuntimeControlExplicitOptIn = false;
    if (!stopped) {
      return {
        ok: false,
        action: parsedAction.data,
        status: getQwenRuntimeControlStatus(),
        message: "Qwen runtime control rollback shutdown was not verified."
      };
    }
  }
  return {
    ok: true,
    action: parsedAction.data,
    status: getQwenRuntimeControlStatus()
  };
}

function setCommandRouterProductModeEnabled(
  event: Electron.IpcMainInvokeEvent,
  rawInput: unknown
): {
  ok: boolean;
  status: CommandRouterProductModeStatus;
  message?: string;
} {
  if (!mainWindow || event.sender.id !== mainWindow.webContents.id) {
    return {
      ok: false,
      status: getCommandRouterProductModeStatus(),
      message: "Command Router product mode settings are unavailable."
    };
  }
  const raw =
    typeof rawInput === "object" && rawInput !== null
      ? (rawInput as Record<string, unknown>)
      : {};
  commandRouterProductModeEnabled = raw.enabled === true;
  supervisor?.configureCommandRouterProductMode({
    enabled: commandRouterProductModeEnabled
  });
  return {
    ok: true,
    status: getCommandRouterProductModeStatus()
  };
}

async function setChatAnswerProductModeEnabled(
  event: Electron.IpcMainInvokeEvent,
  rawInput: unknown
): Promise<{ ok: boolean; status: ChatAnswerProductModeStatus; message?: string }> {
  if (!mainWindow || event.sender.id !== mainWindow.webContents.id) {
    return {
      ok: false,
      status: await getChatAnswerProductModeStatus(),
      message: "Chat Answer product mode settings are unavailable."
    };
  }
  const raw =
    typeof rawInput === "object" && rawInput !== null
      ? (rawInput as Record<string, unknown>)
      : {};
  chatAnswerProductModeEnabled = raw.enabled === true;
  let configuration: ChatAnswerProviderConfiguration | null = null;
  if (chatAnswerProductModeEnabled) {
    try {
      configuration = await getChatAnswerProviderStore(
        "chat-answer.openai-compatible.deepseek"
      ).load();
    } catch {
      configuration = null;
    }
  }
  chatAnswerProductModeRuntimeArmed =
    chatAnswerProductModeEnabled && configuration !== null;
  supervisor?.configureChatAnswerProductMode({
    enabled: chatAnswerProductModeEnabled,
    ...(configuration ? { configuration } : {})
  });
  return {
    ok: true,
    status: await getChatAnswerProductModeStatus()
  };
}

async function getTtsServiceStatus(): Promise<TtsServiceStatus> {
  try {
    return await getTtsProviderStore().status();
  } catch {
    return {
      configured: false,
      secureStorageAvailable: safeStorage.isEncryptionAvailable()
    };
  }
}

function parseTtsProviderSettingsInput(
  value: unknown
): TtsProviderConfiguration {
  const raw =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const provider = raw.provider === "doubao" ? "doubao" : "doubao";
  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";
  const voiceId =
    typeof raw.voiceId === "string" && raw.voiceId.trim().length > 0
      ? raw.voiceId.trim()
      : "zh_female_xiaohe_uranus_bigtts";
  const resourceId =
    typeof raw.resourceId === "string" && raw.resourceId.trim().length > 0
      ? raw.resourceId.trim()
      : undefined;
  if (apiKey.length === 0) {
    throw new Error("API key is required.");
  }
  if (apiKey.length > 512 || voiceId.length > 128) {
    throw new Error("Credential values are too long.");
  }
  if (resourceId && resourceId.length > 128) {
    throw new Error("Resource ID is too long.");
  }
  return {
    provider,
    voiceId,
    ...(resourceId ? { resourceId } : {}),
    credentials: {
      apiKey
    }
  };
}

async function saveTtsProviderSettings(
  event: Electron.IpcMainInvokeEvent,
  rawInput: unknown
): Promise<{ ok: boolean; message?: string; status: TtsServiceStatus }> {
  if (!isVoiceSettingsSender(event)) {
    return {
      ok: false,
      message: "TTS settings are unavailable.",
      status: await getTtsServiceStatus()
    };
  }
  try {
    const input = parseTtsProviderSettingsInput(rawInput);
    await getTtsProviderStore().save(input);
    return {
      ok: true,
      status: await getTtsServiceStatus()
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "TTS settings could not be saved.",
      status: await getTtsServiceStatus()
    };
  }
}

async function clearTtsProviderSettings(
  event: Electron.IpcMainInvokeEvent
): Promise<{ ok: boolean; message?: string; status: TtsServiceStatus }> {
  if (!isVoiceSettingsSender(event)) {
    return {
      ok: false,
      message: "TTS settings are unavailable.",
      status: await getTtsServiceStatus()
    };
  }
  try {
    await getTtsProviderStore().clear();
    return {
      ok: true,
      status: await getTtsServiceStatus()
    };
  } catch {
    return {
      ok: false,
      message: "TTS settings could not be cleared.",
      status: await getTtsServiceStatus()
    };
  }
}

function resolveDoubaoResourceId(voiceId: string, resourceId?: string): string {
  if (resourceId) {
    return resourceId;
  }
  if (/_moon_bigtts$/u.test(voiceId) || /^BV\d+(_24k)?_streaming$/u.test(voiceId)) {
    return "seed-tts-1.0";
  }
  return "seed-tts-2.0";
}

function decodeDoubaoTtsResponse(rawText: string): Buffer {
  const chunks: Buffer[] = [];
  let sawAudio = false;
  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^data:\s*/, "");
    if (!line || line === "[DONE]") {
      continue;
    }
    if (!line.startsWith("{")) {
      continue;
    }
    const data = JSON.parse(line) as {
      code?: unknown;
      status_code?: unknown;
      StatusCode?: unknown;
      message?: unknown;
      status_text?: unknown;
      data?: unknown;
    };
    const providerStatusCode = Number(
      data.code ?? data.status_code ?? data.StatusCode ?? 0
    );
    if (providerStatusCode > 0 && providerStatusCode !== 20000000) {
      const message =
        typeof data.message === "string"
          ? data.message
          : typeof data.status_text === "string"
            ? data.status_text
            : "TTS provider rejected the request.";
      throw new Error(
        `Doubao TTS failed (${providerStatusCode}): ${message}`
      );
    }
    if (typeof data.data === "string" && data.data.length > 0) {
      chunks.push(Buffer.from(data.data, "base64"));
      sawAudio = true;
    }
  }
  if (!sawAudio) {
    throw new Error("Doubao TTS response did not contain audio.");
  }
  return Buffer.concat(chunks);
}

async function synthesizeDoubaoTts(
  text: string,
  voiceId?: string
): Promise<TtsSynthesisResult> {
  const configuration = await getTtsProviderConfiguration();
  if (!configuration) {
    return {
      ok: false,
      code: "TTS_NOT_CONFIGURED",
      message: "TTS provider is not configured."
    };
  }

  const speaker = voiceId?.trim() || configuration.voiceId;
  const resourceId = resolveDoubaoResourceId(
    speaker,
    configuration.resourceId
  );
  const requestId = `jarvis_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(
      "https://openspeech.bytedance.com/api/v3/tts/unidirectional",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": configuration.credentials.apiKey,
          "X-Api-Resource-Id": resourceId,
          "X-Api-Request-Id": requestId
        },
        body: JSON.stringify({
          user: { uid: "jarvis-k" },
          req_params: {
            text: text.slice(0, 800),
            speaker,
            audio_params: {
              format: "mp3",
              sample_rate: 24_000
            }
          }
        }),
        signal: controller.signal
      }
    );

    if (!response.ok) {
      await response.text().catch(() => "");
      return {
        ok: false,
        code: "TTS_PROVIDER_REJECTED",
        message: `Doubao TTS provider rejected the request (HTTP ${response.status}).`
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("audio/")) {
      return {
        ok: true,
        audio: new Uint8Array(await response.arrayBuffer()),
        contentType: "audio/mpeg",
        provider: "doubao"
      };
    }

    const rawText = await response.text();
    try {
      const audio = decodeDoubaoTtsResponse(rawText);
      return {
        ok: true,
        audio: new Uint8Array(audio),
        contentType: "audio/mpeg",
        provider: "doubao"
      };
    } catch (error) {
      return {
        ok: false,
        code: "TTS_RESPONSE_INVALID",
        message: "Doubao TTS returned no playable audio."
      };
    }
  } catch (error) {
    return {
      ok: false,
      code: "TTS_NETWORK_FAILED",
      message:
        error instanceof Error && error.name === "AbortError"
          ? "Doubao TTS request timed out."
          : "Doubao TTS network request failed."
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function getVoiceServiceStatus(): Promise<VoiceServiceStatus> {
  if (isStage5LocalAcceptanceNoSecureStore()) {
    return {
      configured: false,
      secureStorageAvailable: false
    };
  }
  try {
    return await getVoiceProviderStore().status();
  } catch {
    return {
      configured: false,
      secureStorageAvailable: safeStorage.isEncryptionAvailable()
    };
  }
}

function openVoiceSettingsWindow(): void {
  if (voiceSettingsWindow && !voiceSettingsWindow.isDestroyed()) {
    voiceSettingsWindow.focus();
    return;
  }
  voiceSettingsWindow = createVoiceSettingsWindow(mainWindow);
  voiceSettingsWindow.on("closed", () => {
    voiceSettingsWindow = null;
  });
}

function isVoiceSettingsSender(event: Electron.IpcMainInvokeEvent): boolean {
  return voiceSettingsWindow?.webContents.id === event.sender.id;
}

function parseVoiceProviderSettingsInput(
  value: unknown
): VoiceProviderSettingsInput {
  const raw =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const provider = raw.provider === "volcengine" ? "volcengine" : "xunfei";
  const appId = typeof raw.appId === "string" ? raw.appId.trim() : "";
  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";
  const resourceId =
    typeof raw.resourceId === "string" && raw.resourceId.trim().length > 0
      ? raw.resourceId.trim()
      : "volc.seedasr.sauc.duration";
  const language = raw.language === "en" ? "en" : "zh";
  if (provider === "xunfei" && appId.length === 0) {
    throw new Error("AppID is required for Xunfei.");
  }
  if (apiKey.length === 0) {
    throw new Error("APIKey is required.");
  }
  if (appId.length > 512 || apiKey.length > 512) {
    throw new Error("Credential values are too long.");
  }
  if (
    provider === "volcengine" &&
    (resourceId.length > 128 || !/^volc\.[a-z0-9_.-]+$/i.test(resourceId))
  ) {
    throw new Error("Volcengine resource ID is invalid.");
  }
  return {
    provider,
    appId,
    apiKey,
    ...(provider === "volcengine" ? { resourceId } : {}),
    language
  };
}

async function saveVoiceProviderSettings(
  event: Electron.IpcMainInvokeEvent,
  rawInput: unknown
): Promise<VoiceProviderSettingsResult> {
  if (!isVoiceSettingsSender(event)) {
    return {
      ok: false,
      message: "Voice settings are unavailable."
    };
  }
  try {
    const input = parseVoiceProviderSettingsInput(rawInput);
    await getVoiceProviderStore().save(
      input.provider === "volcengine"
        ? {
            provider: "volcengine",
            language: input.language,
            credentials: {
              apiKey: input.apiKey,
              resourceId:
                input.resourceId ?? "volc.seedasr.sauc.duration"
            }
          }
        : {
            provider: "xunfei",
            language: input.language,
            credentials: {
              appId: input.appId,
              apiKey: input.apiKey
            }
          }
    );
    supervisor?.restart("voice-provider-configuration-changed");
    return {
      ok: true,
      status: await getVoiceServiceStatus()
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Voice settings could not be saved.",
      status: await getVoiceServiceStatus()
    };
  }
}

async function clearVoiceProviderSettings(
  event: Electron.IpcMainInvokeEvent
): Promise<VoiceProviderSettingsResult> {
  if (!isVoiceSettingsSender(event)) {
    return {
      ok: false,
      message: "Voice settings are unavailable."
    };
  }
  try {
    await getVoiceProviderStore().clear();
    supervisor?.restart("voice-provider-configuration-cleared");
    return {
      ok: true,
      status: await getVoiceServiceStatus()
    };
  } catch {
    return {
      ok: false,
      message: "Voice settings could not be cleared.",
      status: await getVoiceServiceStatus()
    };
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });

  void app.whenReady().then(() => {
    const coreEntry = path.join(
      __dirname,
      "..",
      "..",
      "core-host",
      "dist",
      "index.js"
    );
    supervisor = new CoreSupervisor({
      coreEntry,
      loadVoiceProviderConfiguration: getVoiceProviderConfiguration,
      loadHeavyPlannerProviderConfiguration:
        getHeavyPlannerProviderConfiguration,
      loadChatAnswerProviderConfiguration:
        getChatAnswerProviderConfiguration
    });
    supervisor.onEvent((event) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_EVENT_CHANNEL, event);
      }
    });
    supervisor.start();

    ipcMain.handle(IPC_COMMAND_CHANNEL, async (_event, rawEnvelope: unknown) => {
      const parsed = CommandEnvelopeSchema.safeParse(rawEnvelope);
      if (!parsed.success || !supervisor) {
        return invalidCommandResult(rawEnvelope);
      }
      return supervisor.request(parsed.data);
    });
    ipcMain.handle(IPC_VOICE_SETTINGS_STATUS_CHANNEL, () =>
      getVoiceServiceStatus()
    );
    ipcMain.handle(IPC_VOICE_SETTINGS_OPEN_CHANNEL, async () => {
      openVoiceSettingsWindow();
      return getVoiceServiceStatus();
    });
    ipcMain.handle(IPC_TTS_SETTINGS_STATUS_CHANNEL, () =>
      getTtsServiceStatus()
    );
    ipcMain.handle(IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL, () =>
      getChatAnswerProductModeStatus()
    );
    ipcMain.handle(
      IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
      setChatAnswerProductModeEnabled
    );
    ipcMain.handle(IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL, () =>
      getCommandRouterProductModeStatus()
    );
    ipcMain.handle(
      IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
      setCommandRouterProductModeEnabled
    );
    ipcMain.handle(IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL, () =>
      getQwenRuntimeControlStatus()
    );
    ipcMain.handle(
      IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL,
      setQwenRuntimeControlAction
    );
    ipcMain.handle(IPC_TTS_SETTINGS_OPEN_CHANNEL, async () => {
      openVoiceSettingsWindow();
      return getTtsServiceStatus();
    });
    ipcMain.handle(VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL, (event) => {
      if (!isVoiceSettingsSender(event)) {
        return {
          configured: false,
          secureStorageAvailable: false
        };
      }
      return getVoiceServiceStatus();
    });
    ipcMain.handle(
      VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL,
      saveVoiceProviderSettings
    );
    ipcMain.handle(
      VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL,
      clearVoiceProviderSettings
    );
    ipcMain.handle(IPC_TTS_SETTINGS_SAVE_CHANNEL, saveTtsProviderSettings);
    ipcMain.handle(IPC_TTS_SETTINGS_CLEAR_CHANNEL, clearTtsProviderSettings);
    ipcMain.handle(IPC_TTS_SYNTHESIZE_CHANNEL, async (event, rawInput) => {
      if (!mainWindow || event.sender.id !== mainWindow.webContents.id) {
        return {
          ok: false,
          code: "TTS_REQUEST_REJECTED",
          message: "TTS request rejected."
        };
      }
      const raw =
        typeof rawInput === "object" && rawInput !== null
          ? (rawInput as Record<string, unknown>)
          : {};
      const text = typeof raw.text === "string" ? raw.text.trim() : "";
      const voiceId =
        typeof raw.voiceId === "string" ? raw.voiceId.trim() : undefined;
      if (!text) {
        return {
          ok: false,
          code: "TTS_REQUEST_REJECTED",
          message: "TTS text is required."
        };
      }
      return synthesizeDoubaoTts(text, voiceId);
    });
    ipcMain.on(VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL, (event) => {
      if (voiceSettingsWindow?.webContents.id === event.sender.id) {
        voiceSettingsWindow.close();
      }
    });
    ipcMain.on(IPC_VOICE_AUDIO_CHANNEL, (event, rawFrame: unknown) => {
      const currentWindow = mainWindow;
      const currentSupervisor = supervisor;
      if (
        !currentWindow ||
        currentWindow.isDestroyed() ||
        !currentSupervisor
      ) {
        return;
      }
      handleVoiceAudioIpc({
        senderId: event.sender.id,
        expectedSenderId: currentWindow.webContents.id,
        rawFrame,
        enqueue: (frame) => currentSupervisor.enqueueVoiceAudio(frame)
      });
    });

    mainWindow = createMainWindow();
    mainWindow.on("closed", () => {
      mainWindow = null;
    });

    app.on("activate", () => {
      if (!mainWindow) {
        mainWindow = createMainWindow();
      }
    });
  });
}

app.on("before-quit", () => {
  supervisor?.stop();
});

app.on("window-all-closed", () => {
  app.quit();
});
