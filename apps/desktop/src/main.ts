import path from "node:path";
import {
  BrowserWindow,
  Notification,
  app,
  dialog,
  ipcMain,
  nativeImage,
  protocol,
  safeStorage,
  shell
} from "electron";
import {
  PET_SKIN_INSTALLED_PROTOCOL,
  PET_SKIN_PREVIEW_PROTOCOL
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
import { DesktopPetController } from "./pet/desktop-pet-controller";
import { registerPetIpc } from "./ipc/register-pet-ipc";
import { PetSkinPreviewService } from "./pet-skin/pet-skin-preview-service";
import { registerPetSkinPreviewIpc } from "./ipc/register-pet-skin-preview-ipc";
import { PetSkinLocalRegistryService } from "./pet-skin/pet-skin-local-registry-service";
import { registerPetSkinIpc } from "./ipc/register-pet-skin-ipc";
import {
  PetSkinStudioService,
  createElectronPetSkinAssetSource
} from "./pet-skin/pet-skin-studio-service";
import { registerPetSkinStudioIpc } from "./ipc/register-pet-skin-studio-ipc";
import {
  GlmAdvancedBrainAcceptanceService,
  RealGlmAcceptanceTransport
} from "./glm-advanced-brain-acceptance/glm-advanced-brain-acceptance-service";
import { SecureGlmAdvancedBrainAcceptanceCredentialStore } from "./glm-advanced-brain-acceptance/secure-glm-advanced-brain-credential-store";
import { registerGlmAdvancedBrainAcceptanceIpc } from "./ipc/register-glm-advanced-brain-acceptance-ipc";

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
let petController: DesktopPetController | null = null;
let petIpcDisposer: (() => void) | null = null;
let petSkinPreviewService: PetSkinPreviewService | null = null;
let petSkinPreviewIpcDisposer: (() => void) | null = null;
let petSkinRegistryService: PetSkinLocalRegistryService | null = null;
let petSkinIpcDisposer: (() => void) | null = null;
let petSkinStudioService: PetSkinStudioService | null = null;
let petSkinStudioIpcDisposer: (() => void) | null = null;
let glmAdvancedBrainAcceptanceService: GlmAdvancedBrainAcceptanceService | null =
  null;
let glmAdvancedBrainAcceptanceIpcDisposer: (() => void) | null = null;
let desktopRuntimeDisposeStarted = false;
let startupSource: DesktopStartupSource = resolveDesktopStartupSource();
let loginItemController: LoginItemController | null = null;

configureElectronGpuPolicy({ app });
protocol.registerSchemesAsPrivileged([
  {
    scheme: PET_SKIN_PREVIEW_PROTOCOL,
    privileges: {
      bypassCSP: false,
      corsEnabled: false,
      secure: true,
      standard: true,
      supportFetchAPI: false
    }
  },
  {
    scheme: PET_SKIN_INSTALLED_PROTOCOL,
    privileges: {
      bypassCSP: false,
      corsEnabled: false,
      secure: true,
      standard: true,
      supportFetchAPI: false
    }
  }
]);
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
        getChatAnswerProviderConfiguration,
      onSafeEvent: (event) => {
        petController?.handleCoreEvent(event);
      }
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
    petController = new DesktopPetController({
      settingsService,
      getMainWindow: () => mainWindow,
      createMainWindow: createTrackedMainWindow,
      setMainWindow: (window) => {
        mainWindow = window;
      },
      openSettings: () => {
        lifecycleController?.openSettings();
      },
      quit: () => {
        lifecycleController?.requestExplicitQuit();
      },
      isQuitting: () => lifecycleController?.getState() === "quitting",
      getActiveSkinDescriptor: () =>
        petSkinRegistryService?.getActiveSkinDescriptor()
    });
    petSkinPreviewService = new PetSkinPreviewService();
    petSkinPreviewService.registerProtocol(protocol);
    void petSkinPreviewService.cleanupStalePreviewDirectories();
    void PetSkinStudioService.cleanupStaleStudioDirectories();
    petSkinRegistryService = new PetSkinLocalRegistryService({
      rootDirectory: storageProfile.petSkinRootPath,
      registryPath: storageProfile.petSkinRegistryPath,
      rendererPreflight: async () => true
    });
    petSkinRegistryService.registerProtocol(protocol);
    petSkinStudioService = new PetSkinStudioService({
      previewService: petSkinPreviewService,
      assetSource: createElectronPetSkinAssetSource(nativeImage),
      currentJarvisVersion: app.getVersion(),
      forbiddenExportRoots: [storageProfile.petSkinRootPath]
    });
    const glmAdvancedBrainAcceptanceEnabled =
      process.env.JARVIS_K_ENABLE_GLM_ADVANCED_BRAIN_ACCEPTANCE === "1";
    glmAdvancedBrainAcceptanceService = new GlmAdvancedBrainAcceptanceService({
      settingsPath: path.join(
        app.getPath("userData"),
        "jarvis-k-glm-advanced-brain-acceptance.json"
      ),
      credentialStore: new SecureGlmAdvancedBrainAcceptanceCredentialStore(
        path.join(
          app.getPath("userData"),
          "jarvis-k-glm-advanced-brain-acceptance-credential.json"
        ),
        getSecureStoreService().encryption()
      ),
      acceptanceFlagEnabled: glmAdvancedBrainAcceptanceEnabled,
      ...(glmAdvancedBrainAcceptanceEnabled
        ? { transport: new RealGlmAcceptanceTransport() }
        : {})
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
      onShowPet: () => {
        const result = settingsService?.setDesktopPetEnabled({
          enabled: true
        });
        petController?.syncFromSettings();
        return result?.ok === true;
      },
      onHidePet: () => {
        const result = settingsService?.setDesktopPetEnabled({
          enabled: false
        });
        petController?.syncFromSettings();
        return result?.ok === true;
      },
      isPetVisible: () => {
        const petWindow = petController?.getWindow();
        return (
          petWindow !== null &&
          petWindow !== undefined &&
          !petWindow.isDestroyed()
        );
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
    petIpcDisposer = registerPetIpc({
      ipcMain,
      getMainWindow: () => mainWindow,
      getPetWindow: () => petController?.getWindow() ?? null,
      settingsService,
      petController
    });
    petSkinPreviewIpcDisposer = registerPetSkinPreviewIpc({
      ipcMain,
      dialog,
      getMainWindow: () => mainWindow,
      previewService: petSkinPreviewService
    });
    petSkinIpcDisposer = registerPetSkinIpc({
      ipcMain,
      getMainWindow: () => mainWindow,
      getPetWindow: () => petController?.getWindow() ?? null,
      previewService: petSkinPreviewService,
      registryService: petSkinRegistryService,
      onRegistryChanged: () => {
        petController?.publishState();
      }
    });
    petSkinStudioIpcDisposer = registerPetSkinStudioIpc({
      ipcMain,
      dialog,
      shell,
      getMainWindow: () => mainWindow,
      studioService: petSkinStudioService
    });
    glmAdvancedBrainAcceptanceIpcDisposer =
      registerGlmAdvancedBrainAcceptanceIpc({
        ipcMain,
        getMainWindow: () => mainWindow,
        service: glmAdvancedBrainAcceptanceService
      });
    qwenRuntimeIpcDisposer = registerQwenRuntimeIpc({
      ipcMain,
      qwenRuntimeController,
      getMainWindow: () => mainWindow
    });
    mainWindow = createTrackedMainWindow();
    petController.syncFromSettings();

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
  petIpcDisposer?.();
  petIpcDisposer = null;
  petSkinPreviewIpcDisposer?.();
  petSkinPreviewIpcDisposer = null;
  petSkinIpcDisposer?.();
  petSkinIpcDisposer = null;
  petSkinStudioIpcDisposer?.();
  petSkinStudioIpcDisposer = null;
  glmAdvancedBrainAcceptanceIpcDisposer?.();
  glmAdvancedBrainAcceptanceIpcDisposer = null;
  glmAdvancedBrainAcceptanceService = null;
  if (petSkinStudioService) {
    void petSkinStudioService.dispose();
    petSkinStudioService = null;
  }
  if (petSkinPreviewService) {
    void petSkinPreviewService.dispose();
    petSkinPreviewService.unregisterProtocol(protocol);
    petSkinPreviewService = null;
  }
  if (petSkinRegistryService) {
    petSkinRegistryService.unregisterProtocol(protocol);
    petSkinRegistryService = null;
  }
  petController?.dispose();
  petController = null;
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
