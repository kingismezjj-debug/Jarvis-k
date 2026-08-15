import type { BrowserWindow, IpcMain, IpcMainInvokeEvent } from "electron";
import {
  IPC_TTS_SETTINGS_CLEAR_CHANNEL,
  IPC_TTS_SETTINGS_OPEN_CHANNEL,
  IPC_TTS_SETTINGS_SAVE_CHANNEL,
  IPC_TTS_SETTINGS_STATUS_CHANNEL,
  IPC_TTS_SYNTHESIZE_CHANNEL,
  type TtsSynthesisResult,
} from "@jarvis-k/contracts";

export interface RegisterSecureStoreIpcOptions {
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  getMainWindow: () => BrowserWindow | null;
  openTtsSettingsWindow: () => void;
  getTtsServiceStatus: () => Promise<unknown>;
  saveTtsProviderSettings: (
    event: IpcMainInvokeEvent,
    rawInput: unknown,
  ) => Promise<unknown>;
  clearTtsProviderSettings: (event: IpcMainInvokeEvent) => Promise<unknown>;
  synthesizeTts: (
    event: IpcMainInvokeEvent,
    rawInput: unknown,
  ) => Promise<TtsSynthesisResult>;
}

const SECURE_STORE_CHANNELS = [
  IPC_TTS_SETTINGS_STATUS_CHANNEL,
  IPC_TTS_SETTINGS_OPEN_CHANNEL,
  IPC_TTS_SETTINGS_SAVE_CHANNEL,
  IPC_TTS_SETTINGS_CLEAR_CHANNEL,
  IPC_TTS_SYNTHESIZE_CHANNEL,
] as const;

export function registerSecureStoreIpc(
  options: RegisterSecureStoreIpcOptions,
): () => void {
  unregisterSecureStoreIpc(options.ipcMain);
  options.ipcMain.handle(IPC_TTS_SETTINGS_STATUS_CHANNEL, () =>
    options.getTtsServiceStatus(),
  );
  options.ipcMain.handle(IPC_TTS_SETTINGS_OPEN_CHANNEL, async () => {
    options.openTtsSettingsWindow();
    return options.getTtsServiceStatus();
  });
  options.ipcMain.handle(
    IPC_TTS_SETTINGS_SAVE_CHANNEL,
    options.saveTtsProviderSettings,
  );
  options.ipcMain.handle(
    IPC_TTS_SETTINGS_CLEAR_CHANNEL,
    options.clearTtsProviderSettings,
  );
  options.ipcMain.handle(IPC_TTS_SYNTHESIZE_CHANNEL, (event, rawInput) => {
    const mainWindow = options.getMainWindow();
    if (!mainWindow || event.sender.id !== mainWindow.webContents.id) {
      return {
        ok: false,
        code: "TTS_REQUEST_REJECTED",
        message: "TTS request rejected.",
      };
    }
    return options.synthesizeTts(event, rawInput);
  });
  return () => unregisterSecureStoreIpc(options.ipcMain);
}

export function unregisterSecureStoreIpc(
  ipcMain: Pick<IpcMain, "removeHandler">,
): void {
  for (const channel of SECURE_STORE_CHANNELS) {
    ipcMain.removeHandler(channel);
  }
}
