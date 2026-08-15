import type { IpcMain } from "electron";
import {
  IPC_VOICE_AUDIO_CHANNEL,
  IPC_VOICE_SETTINGS_OPEN_CHANNEL,
  IPC_VOICE_SETTINGS_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import type { VoiceController } from "../voice/voice-controller";
import {
  VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL,
  VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL,
} from "../voice-settings-ipc";

export interface RegisterVoiceIpcOptions {
  ipcMain: Pick<IpcMain, "handle" | "on" | "removeHandler" | "removeListener">;
  voiceController: VoiceController;
}

export function registerVoiceIpc(options: RegisterVoiceIpcOptions): () => void {
  unregisterVoiceIpc(options.ipcMain);

  options.ipcMain.handle(IPC_VOICE_SETTINGS_STATUS_CHANNEL, () =>
    options.voiceController.getVoiceServiceStatus(),
  );
  options.ipcMain.handle(IPC_VOICE_SETTINGS_OPEN_CHANNEL, async () => {
    options.voiceController.openVoiceSettingsWindow();
    return options.voiceController.getVoiceServiceStatus();
  });
  options.ipcMain.handle(VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL, (event) => {
    if (!options.voiceController.isVoiceSettingsSender(event)) {
      return {
        configured: false,
        secureStorageAvailable: false,
      };
    }
    return options.voiceController.getVoiceServiceStatus();
  });
  options.ipcMain.handle(
    VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL,
    (event, rawInput) =>
      options.voiceController.saveVoiceProviderSettings(event, rawInput),
  );
  options.ipcMain.handle(VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL, (event) =>
    options.voiceController.clearVoiceProviderSettings(event),
  );

  const closeHandler = (event: Electron.IpcMainEvent) => {
    options.voiceController.closeVoiceSettingsWindow(event);
  };
  const audioHandler = (event: Electron.IpcMainEvent, rawFrame: unknown) => {
    options.voiceController.handleVoiceAudio(event, rawFrame);
  };
  options.ipcMain.on(VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL, closeHandler);
  options.ipcMain.on(IPC_VOICE_AUDIO_CHANNEL, audioHandler);

  return () => {
    unregisterVoiceIpc(options.ipcMain);
    options.ipcMain.removeListener(
      VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL,
      closeHandler,
    );
    options.ipcMain.removeListener(IPC_VOICE_AUDIO_CHANNEL, audioHandler);
  };
}

export function unregisterVoiceIpc(
  ipcMain: Pick<IpcMain, "removeHandler">,
): void {
  for (const channel of VOICE_HANDLE_CHANNELS) {
    ipcMain.removeHandler(channel);
  }
}

const VOICE_HANDLE_CHANNELS = [
  IPC_VOICE_SETTINGS_STATUS_CHANNEL,
  IPC_VOICE_SETTINGS_OPEN_CHANNEL,
  VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL,
  VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL,
] as const;
