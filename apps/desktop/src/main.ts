import path from "node:path";
import {
  BrowserWindow,
  app,
  ipcMain,
  safeStorage,
  shell
} from "electron";
import {
  CommandEnvelopeSchema,
  CommandResult,
  IPC_COMMAND_CHANNEL,
  IPC_EVENT_CHANNEL,
  IPC_VOICE_SETTINGS_OPEN_CHANNEL,
  IPC_VOICE_SETTINGS_STATUS_CHANNEL,
  IPC_VOICE_AUDIO_CHANNEL,
  PROTOCOL_VERSION,
  type VoiceServiceStatus,
  createId
} from "@jarvis-k/contracts";
import {
  SecureVoiceProviderStore,
  type VoiceProviderConfiguration
} from "./secure-voice-provider-store";
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

let mainWindow: BrowserWindow | null = null;
let voiceSettingsWindow: BrowserWindow | null = null;
let supervisor: CoreSupervisor | null = null;
let voiceProviderStore: SecureVoiceProviderStore | null = null;

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

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: "#11110f",
    title: "Jarvis-K",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (url !== window.webContents.getURL()) {
      event.preventDefault();
    }
  });
  window.once("ready-to-show", () => window.show());
  void window.loadFile(
    path.join(__dirname, "..", "..", "ui", "dist", "index.html")
  );
  return window;
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

async function getVoiceProviderConfiguration(): Promise<VoiceProviderConfiguration | null> {
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

async function getVoiceServiceStatus(): Promise<VoiceServiceStatus> {
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
  const appId = typeof raw.appId === "string" ? raw.appId.trim() : "";
  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";
  const language = raw.language === "en" ? "en" : "zh";
  if (appId.length === 0 || apiKey.length === 0) {
    throw new Error("AppID and APIKey are required.");
  }
  if (appId.length > 512 || apiKey.length > 512) {
    throw new Error("Credential values are too long.");
  }
  return {
    appId,
    apiKey,
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
    await getVoiceProviderStore().save({
      provider: "xunfei",
      language: input.language,
      credentials: {
        appId: input.appId,
        apiKey: input.apiKey
      }
    });
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
      loadVoiceProviderConfiguration: getVoiceProviderConfiguration
    });
    supervisor.onEvent((event) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_EVENT_CHANNEL, event);
      }
    });
    supervisor.start();

    ipcMain.handle(IPC_COMMAND_CHANNEL, (_event, rawEnvelope: unknown) => {
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
