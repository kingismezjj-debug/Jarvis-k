import path from "node:path";
import {
  BrowserWindow,
  Notification,
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
import { DesktopTrayController } from "./tray/desktop-tray-controller";
import { DesktopLifecycleController } from "./lifecycle/desktop-lifecycle-controller";
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
import {
  configureElectronGpuPolicy,
  registerDesktopAppLifecycle
} from "./app-lifecycle";
import {
  applyDesktopStorageProfile,
  createCoreHostStorageEnvironment,
  createDesktopStorageProfile
} from "./storage/storage-profile";
import { LoginItemController } from "./login-item/login-item-controller";
import {
  resolveDesktopStartupSource,
  type DesktopStartupSource
} from "./startup/startup-source";

let mainWindow: BrowserWindow | null = null;
let supervisorController: DesktopSupervisorController | null = null;
let supervisorIpcDisposer: (() => void) | null = null;
let voiceController: VoiceController | null = null;
let voiceIpcDisposer: (() => void) | null = null;
let qwenRuntimeController: QwenRuntimeController | null = null;
let qwenRuntimeIpcDisposer: (() => void) | null = null;
let secureStoreIpcDisposer: (() => void) | null = null;
let settingsIpcDisposer: (() => void) | null = null;
let trayController: DesktopTrayController | null = null;
let lifecycleController: DesktopLifecycleController | null = null;
let openAiHeavyPlannerProviderStore: SecureHeavyPlannerProviderStore | null =
  null;
let glmHeavyPlannerProviderStore: SecureHeavyPlannerProviderStore | null =
  null;
let deepseekChatAnswerProviderStore: SecureChatAnswerProviderStore | null =
  null;
let settingsService: SettingsService | null = null;
let secureStoreService: SecureStoreService | null = null;
let desktopRuntimeDisposeStarted = false;
let startupSource: DesktopStartupSource = resolveDesktopStartupSource();
let loginItemController: LoginItemController | null = null;

configureElectronGpuPolicy({ app });
const storageProfile = createDesktopStorageProfile({
  app,
  env: process.env,
  cwd: process.cwd(),
  installDirectory: path.dirname(process.execPath)
});
applyDesktopStorageProfile(app, storageProfile);
const coreHostStorageEnvironment =
  createCoreHostStorageEnvironment(storageProfile);

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
      userDataPath: storageProfile.userDataPath,
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
      config: createQwenRuntimeConfig({
        baseDirectory: __dirname,
        env: {
          ...process.env,
          ...coreHostStorageEnvironment
        }
      })
    });
    supervisorController = new DesktopSupervisorController({
      coreEntry,
      env: coreHostStorageEnvironment,
      getMainWindow: () => mainWindow,
      loadVoiceProviderConfiguration: () =>
        voiceController!.loadVoiceProviderConfiguration(),
      loadHeavyPlannerProviderConfiguration:
        getHeavyPlannerProviderConfiguration,
      loadChatAnswerProviderConfiguration:
        getChatAnswerProviderConfiguration
    });
    supervisorController.start();
    loginItemController = new LoginItemController({
      app,
      releaseChannel: storageProfile.releaseChannel,
      appId: storageProfile.appId,
      productName: storageProfile.productName
    });
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
      },
      loginItemController,
      evaluationCapabilityAvailable:
        process.env.JARVIS_K_ENABLE_EVALUATION_UI === "1",
      desktopSettingsPath: storageProfile.desktopSettingsPath
    });
    trayController = new DesktopTrayController({
      getMainWindow: () => mainWindow,
      createMainWindow: createTrackedMainWindow,
      setMainWindow: (window) => {
        mainWindow = window;
      },
      onOpenSettings: () => {
        lifecycleController?.openSettings();
      },
      onQuit: () => {
        lifecycleController?.requestExplicitQuit();
      },
      getStatus: () =>
        lifecycleController?.getState() === "quitting"
          ? "quitting"
          : "running"
    });
    lifecycleController = new DesktopLifecycleController({
      app,
      getMainWindow: () => mainWindow,
      createMainWindow: createTrackedMainWindow,
      setMainWindow: (window) => {
        mainWindow = window;
      },
      getCloseButtonBehavior: () =>
        settingsService?.getDesktopSettings().closeButtonBehavior ??
        "minimize_to_tray",
      getTrayController: () => trayController,
      cleanup: disposeDesktopRuntime,
      notifyCloseToTray: notifyCloseToTrayOnce
    });
    registerDesktopAppLifecycle({
      app,
      getMainWindow: () => mainWindow,
      createMainWindow: createTrackedMainWindow,
      setMainWindow: (window) => {
        mainWindow = window;
      },
      cleanup: disposeDesktopRuntime,
      lifecycleController,
      shouldQuitOnWindowAllClosed: () =>
        lifecycleController?.getDiagnostics().explicitQuitRequested === true ||
        lifecycleController?.getDiagnostics().systemShutdownRequested === true ||
        trayController?.isAvailable() !== true ||
        settingsService?.getDesktopSettings().closeButtonBehavior === "quit"
    });
    trayController.create();

    supervisorIpcDisposer = registerSupervisorIpc({
      ipcMain,
      supervisorController
    });
    voiceIpcDisposer = registerVoiceIpc({
      ipcMain,
      voiceController
    });
    secureStoreIpcDisposer = registerSecureStoreIpc({
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
    settingsIpcDisposer = registerSettingsIpc({
      ipcMain,
      getMainWindow: () => mainWindow,
      settingsService
    });
    qwenRuntimeIpcDisposer = registerQwenRuntimeIpc({
      ipcMain,
      qwenRuntimeController,
      getMainWindow: () => mainWindow
    });
    mainWindow = createTrackedMainWindow();

  });
}

function createTrackedMainWindow(): BrowserWindow {
  const showOnReady =
    startupSource !== "login" || trayController?.isAvailable() !== true;
  const window = createMainWindow({ showOnReady });
  lifecycleController?.attachWindow(window);
  return window;
}

function notifyCloseToTrayOnce(): void {
  if (!settingsService?.markCloseToTrayNoticeShown()) {
    return;
  }
  if (!Notification.isSupported()) {
    return;
  }
  new Notification({
    title: "Jarvis-K",
    body: "Jarvis-K is still running in the system tray."
  }).show();
}

function disposeDesktopRuntime(): void {
  if (desktopRuntimeDisposeStarted) {
    return;
  }
  desktopRuntimeDisposeStarted = true;
  voiceIpcDisposer?.();
  voiceIpcDisposer = null;
  voiceController?.dispose();
  voiceController = null;
  qwenRuntimeIpcDisposer?.();
  qwenRuntimeIpcDisposer = null;
  qwenRuntimeController = null;
  settingsIpcDisposer?.();
  settingsIpcDisposer = null;
  secureStoreIpcDisposer?.();
  secureStoreIpcDisposer = null;
  supervisorIpcDisposer?.();
  supervisorIpcDisposer = null;
  supervisorController?.stop();
  supervisorController = null;
  loginItemController = null;
  trayController?.dispose();
  trayController = null;
}
