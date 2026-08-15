import path from "node:path";
import {
  BrowserWindow,
  app,
  ipcMain,
  safeStorage
} from "electron";
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
import { createMainWindow } from "./windows/main-window";
import { registerSettingsIpc } from "./ipc/register-settings-ipc";
import { SettingsService } from "./settings/settings-service";
import { registerSecureStoreIpc } from "./ipc/register-secure-store-ipc";
import { SecureStoreService } from "./secure-store/secure-store-service";
import { VoiceController } from "./voice/voice-controller";
import { registerVoiceIpc } from "./ipc/register-voice-ipc";
import { createQwenRuntimeConfig } from "./qwen-runtime/qwen-runtime-config";
import { QwenRuntimeController } from "./qwen-runtime/qwen-runtime-controller";
import { registerQwenRuntimeIpc } from "./ipc/register-qwen-runtime-ipc";
import { DesktopSupervisorController } from "./core-supervisor/desktop-supervisor-controller";
import { registerSupervisorIpc } from "./ipc/register-supervisor-ipc";

let mainWindow: BrowserWindow | null = null;
let supervisorController: DesktopSupervisorController | null = null;
let supervisorIpcDisposer: (() => void) | null = null;
let voiceController: VoiceController | null = null;
let voiceIpcDisposer: (() => void) | null = null;
let qwenRuntimeController: QwenRuntimeController | null = null;
let qwenRuntimeIpcDisposer: (() => void) | null = null;
let openAiHeavyPlannerProviderStore: SecureHeavyPlannerProviderStore | null =
  null;
let glmHeavyPlannerProviderStore: SecureHeavyPlannerProviderStore | null =
  null;
let deepseekChatAnswerProviderStore: SecureChatAnswerProviderStore | null =
  null;
let settingsService: SettingsService | null = null;
let secureStoreService: SecureStoreService | null = null;

if (process.env.JARVIS_K_ENABLE_ELECTRON_GPU !== "1") {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-gpu-compositing");
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
        supervisorController?.restart(reason);
      },
      enqueueVoiceAudio: (frame) => {
        if (!supervisorController) {
          return { accepted: false, reason: "backpressure" };
        }
        return supervisorController.enqueueVoiceAudio(frame);
      }
    });
    qwenRuntimeController = new QwenRuntimeController({
      config: createQwenRuntimeConfig({ baseDirectory: __dirname })
    });
    supervisorController = new DesktopSupervisorController({
      coreEntry,
      getMainWindow: () => mainWindow,
      loadVoiceProviderConfiguration: () =>
        voiceController!.loadVoiceProviderConfiguration(),
      loadHeavyPlannerProviderConfiguration:
        getHeavyPlannerProviderConfiguration,
      loadChatAnswerProviderConfiguration:
        getChatAnswerProviderConfiguration
    });
    supervisorController.start();
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
        supervisorController?.configureCommandRouterProductMode(input);
      },
      configureChatAnswerProductMode: (input) => {
        supervisorController?.configureChatAnswerProductMode({
          enabled: input.enabled,
          ...(input.configuration ? { configuration: input.configuration } : {})
        });
      }
    });

    supervisorIpcDisposer = registerSupervisorIpc({
      ipcMain,
      supervisorController
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
    qwenRuntimeIpcDisposer = registerQwenRuntimeIpc({
      ipcMain,
      qwenRuntimeController,
      getMainWindow: () => mainWindow
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
  voiceIpcDisposer?.();
  voiceIpcDisposer = null;
  voiceController?.dispose();
  voiceController = null;
  qwenRuntimeIpcDisposer?.();
  qwenRuntimeIpcDisposer = null;
  qwenRuntimeController = null;
  supervisorIpcDisposer?.();
  supervisorIpcDisposer = null;
  supervisorController?.stop();
  supervisorController = null;
});

app.on("window-all-closed", () => {
  app.quit();
});
