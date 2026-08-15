import type { BrowserWindow, IpcMain } from "electron";
import {
  IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
  IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import type { SettingsService } from "../settings/settings-service";

export interface RegisterSettingsIpcOptions {
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  getMainWindow: () => BrowserWindow | null;
  settingsService: SettingsService;
}

const SETTINGS_CHANNELS = [
  IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
] as const;

export function registerSettingsIpc(
  options: RegisterSettingsIpcOptions,
): () => void {
  unregisterSettingsIpc(options.ipcMain);
  options.ipcMain.handle(IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL, () =>
    options.settingsService.getChatAnswerProductModeStatus(),
  );
  options.ipcMain.handle(
    IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
    async (event, rawInput: unknown) => {
      if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
        return {
          ok: false,
          status: await options.settingsService.getChatAnswerProductModeStatus(),
          message: "Chat Answer product mode settings are unavailable.",
        };
      }
      return options.settingsService.setChatAnswerProductModeEnabled(rawInput);
    },
  );
  options.ipcMain.handle(IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL, () =>
    options.settingsService.getCommandRouterProductModeStatus(),
  );
  options.ipcMain.handle(
    IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
    (event, rawInput: unknown) => {
      if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
        return {
          ok: false,
          status: options.settingsService.getCommandRouterProductModeStatus(),
          message: "Command Router product mode settings are unavailable.",
        };
      }
      return options.settingsService.setCommandRouterProductModeEnabled(rawInput);
    },
  );
  return () => unregisterSettingsIpc(options.ipcMain);
}

export function unregisterSettingsIpc(
  ipcMain: Pick<IpcMain, "removeHandler">,
): void {
  for (const channel of SETTINGS_CHANNELS) {
    ipcMain.removeHandler(channel);
  }
}

function isMainWindowSender(
  mainWindow: BrowserWindow | null,
  senderId: number,
): boolean {
  return mainWindow !== null && mainWindow.webContents.id === senderId;
}
