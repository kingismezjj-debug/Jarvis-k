import type { BrowserWindow, IpcMain } from "electron";
import {
  IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
  IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_DESKTOP_LAUNCH_AT_LOGIN_SET_CHANNEL,
  IPC_DESKTOP_LAUNCH_AT_LOGIN_STATUS_CHANNEL,
  IPC_DESKTOP_SETTINGS_SET_CHANNEL,
  IPC_DESKTOP_SETTINGS_STATUS_CHANNEL,
  IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL,
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
  IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL,
  IPC_DESKTOP_SETTINGS_STATUS_CHANNEL,
  IPC_DESKTOP_SETTINGS_SET_CHANNEL,
  IPC_DESKTOP_LAUNCH_AT_LOGIN_STATUS_CHANNEL,
  IPC_DESKTOP_LAUNCH_AT_LOGIN_SET_CHANNEL,
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
  options.ipcMain.handle(IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL, () =>
    options.settingsService.getUiSurfaceCapabilityStatus(),
  );
  options.ipcMain.handle(IPC_DESKTOP_SETTINGS_STATUS_CHANNEL, () =>
    options.settingsService.getDesktopSettings(),
  );
  options.ipcMain.handle(IPC_DESKTOP_LAUNCH_AT_LOGIN_STATUS_CHANNEL, () =>
    options.settingsService.getDesktopLaunchAtLoginStatus(),
  );
  options.ipcMain.handle(
    IPC_DESKTOP_SETTINGS_SET_CHANNEL,
    (event, rawInput: unknown) => {
      if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
        return {
          ok: false,
          settings: options.settingsService.getDesktopSettings(),
          message: "Desktop settings are unavailable.",
        };
      }
      const input =
        typeof rawInput === "object" && rawInput !== null
          ? (rawInput as Record<string, unknown>)
          : {};
      if ("firstRunOnboardingState" in input) {
        return options.settingsService.setDesktopFirstRunOnboardingState(
          rawInput,
        );
      }
      if ("launchAtLoginEnabled" in input) {
        return options.settingsService.setDesktopLaunchAtLoginEnabled(rawInput);
      }
      if ("legacyUiTheme" in input) {
        return options.settingsService.migrateLegacyDesktopUiTheme(rawInput);
      }
      if ("uiTheme" in input) {
        return options.settingsService.setDesktopUiTheme(rawInput);
      }
      return options.settingsService.setDesktopCloseButtonBehavior(rawInput);
    },
  );
  options.ipcMain.handle(
    IPC_DESKTOP_LAUNCH_AT_LOGIN_SET_CHANNEL,
    (event, rawInput: unknown) => {
      if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
        return {
          ok: false,
          settings: options.settingsService.getDesktopSettings(),
          message: "Launch at login settings are unavailable.",
        };
      }
      return options.settingsService.setDesktopLaunchAtLoginEnabled(rawInput);
    },
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
