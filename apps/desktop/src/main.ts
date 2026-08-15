import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  BrowserWindow,
  app,
  ipcMain,
  safeStorage
} from "electron";
import {
  CommandEnvelopeSchema,
  CommandResult,
  IPC_COMMAND_CHANNEL,
  IPC_EVENT_CHANNEL,
  IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL,
  IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL,
  PROTOCOL_VERSION,
  createCommandRouterQwenProductRoutingActivationStatus,
  QwenRuntimeControlActionSchema,
  QwenRuntimeControlSetResult,
  QwenRuntimeControlStatus,
  createId
} from "@jarvis-k/contracts";
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
import { createMainWindow } from "./windows/main-window";
import { registerSettingsIpc } from "./ipc/register-settings-ipc";
import { SettingsService } from "./settings/settings-service";
import { registerSecureStoreIpc } from "./ipc/register-secure-store-ipc";
import { SecureStoreService } from "./secure-store/secure-store-service";
import { VoiceController } from "./voice/voice-controller";
import { registerVoiceIpc } from "./ipc/register-voice-ipc";

let mainWindow: BrowserWindow | null = null;
let supervisor: CoreSupervisor | null = null;
let voiceController: VoiceController | null = null;
let voiceIpcDisposer: (() => void) | null = null;
let openAiHeavyPlannerProviderStore: SecureHeavyPlannerProviderStore | null =
  null;
let glmHeavyPlannerProviderStore: SecureHeavyPlannerProviderStore | null =
  null;
let deepseekChatAnswerProviderStore: SecureChatAnswerProviderStore | null =
  null;
let settingsService: SettingsService | null = null;
let secureStoreService: SecureStoreService | null = null;
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

function getSecureStoreService(): SecureStoreService {
  if (!secureStoreService) {
    secureStoreService = new SecureStoreService(safeStorage);
  }
  return secureStoreService;
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
    getSecureStoreService().encryption(),
    provider
  );
  if (provider === "glm") {
    glmHeavyPlannerProviderStore = store;
  } else {
    openAiHeavyPlannerProviderStore = store;
  }
  return store;
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
    getSecureStoreService().encryption(),
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
    voiceController = new VoiceController({
      userDataPath: app.getPath("userData"),
      secureStoreService: getSecureStoreService(),
      getMainWindow: () => mainWindow,
      restartCore: (reason) => {
        supervisor?.restart(reason);
      },
      enqueueVoiceAudio: (frame) => {
        if (!supervisor) {
          return { accepted: false, reason: "backpressure" };
        }
        return supervisor.enqueueVoiceAudio(frame);
      }
    });
    supervisor = new CoreSupervisor({
      coreEntry,
      loadVoiceProviderConfiguration: () =>
        voiceController!.loadVoiceProviderConfiguration(),
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
    settingsService = new SettingsService({
      loadChatAnswerProviderConfiguration: async () => {
        try {
          return await getChatAnswerProviderStore(
            "chat-answer.openai-compatible.deepseek"
          ).load();
        } catch {
          return null;
        }
      },
      getChatAnswerCredentialStatus: async () => {
        try {
          const status = await getChatAnswerProviderStore(
            "chat-answer.openai-compatible.deepseek"
          ).status();
          return {
            secureStorageAvailable: status.status !== "unavailable",
            credentialConfigured: status.credentialConfigured
          };
        } catch {
          return {
            secureStorageAvailable: false,
            credentialConfigured: false
          };
        }
      },
      configureCommandRouterProductMode: (input) => {
        supervisor?.configureCommandRouterProductMode(input);
      },
      configureChatAnswerProductMode: (input) => {
        supervisor?.configureChatAnswerProductMode({
          enabled: input.enabled,
          ...(input.configuration ? { configuration: input.configuration } : {})
        });
      }
    });

    ipcMain.handle(IPC_COMMAND_CHANNEL, async (_event, rawEnvelope: unknown) => {
      const parsed = CommandEnvelopeSchema.safeParse(rawEnvelope);
      if (!parsed.success || !supervisor) {
        return invalidCommandResult(rawEnvelope);
      }
      return supervisor.request(parsed.data);
    });
    voiceIpcDisposer = registerVoiceIpc({
      ipcMain,
      voiceController
    });
    registerSecureStoreIpc({
      ipcMain,
      getMainWindow: () => mainWindow,
      openTtsSettingsWindow: () =>
        voiceController?.openVoiceSettingsWindow(),
      getTtsServiceStatus: () =>
        voiceController?.getTtsServiceStatus() ??
        Promise.resolve({
          configured: false,
          secureStorageAvailable: false
        }),
      saveTtsProviderSettings: (event, rawInput) =>
        voiceController?.saveTtsProviderSettings(event, rawInput) ??
        Promise.resolve({
          ok: false,
          message: "TTS settings are unavailable.",
          status: {
            configured: false,
            secureStorageAvailable: false
          }
        }),
      clearTtsProviderSettings: (event) =>
        voiceController?.clearTtsProviderSettings(event) ??
        Promise.resolve({
          ok: false,
          message: "TTS settings are unavailable.",
          status: {
            configured: false,
            secureStorageAvailable: false
          }
        }),
      synthesizeTts: (event, rawInput) =>
        voiceController?.synthesizeTtsFromIpc(event, rawInput) ??
        Promise.resolve({
          ok: false,
          code: "TTS_NOT_CONFIGURED",
          message: "TTS provider is not configured."
        })
    });
    registerSettingsIpc({
      ipcMain,
      getMainWindow: () => mainWindow,
      settingsService
    });
    ipcMain.handle(IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL, () =>
      getQwenRuntimeControlStatus()
    );
    ipcMain.handle(
      IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL,
      setQwenRuntimeControlAction
    );
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
  voiceIpcDisposer?.();
  voiceIpcDisposer = null;
  voiceController?.dispose();
  voiceController = null;
  supervisor?.stop();
});

app.on("window-all-closed", () => {
  app.quit();
});
