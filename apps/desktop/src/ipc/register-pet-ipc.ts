import type { BrowserWindow, IpcMain } from "electron";
import {
  DesktopPetPositionSchema,
  DesktopPetReducedMotionSchema,
  DesktopPetSettingsUpdateSchema,
  type DesktopPetSettings,
  type DesktopPetState,
  IPC_DESKTOP_PET_CONTEXT_MENU_CHANNEL,
  IPC_DESKTOP_PET_HIDE_CHANNEL,
  IPC_DESKTOP_PET_OPEN_MAIN_WINDOW_CHANNEL,
  IPC_DESKTOP_PET_RESET_POSITION_CHANNEL,
  IPC_DESKTOP_PET_SAVE_POSITION_CHANNEL,
  IPC_DESKTOP_PET_SETTINGS_CHANNEL,
  IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL,
  IPC_DESKTOP_PET_STATE_CHANNEL,
} from "@jarvis-k/contracts";
import type { SettingsService } from "../settings/settings-service";
import type { DesktopPetController } from "../pet/desktop-pet-controller";

export interface RegisterPetIpcOptions {
  readonly ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  readonly getMainWindow: () => BrowserWindow | null;
  readonly getPetWindow: () => BrowserWindow | null;
  readonly settingsService: SettingsService;
  readonly petController: DesktopPetController;
}

const PET_CHANNELS = [
  IPC_DESKTOP_PET_STATE_CHANNEL,
  IPC_DESKTOP_PET_SETTINGS_CHANNEL,
  IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL,
  IPC_DESKTOP_PET_OPEN_MAIN_WINDOW_CHANNEL,
  IPC_DESKTOP_PET_HIDE_CHANNEL,
  IPC_DESKTOP_PET_CONTEXT_MENU_CHANNEL,
  IPC_DESKTOP_PET_SAVE_POSITION_CHANNEL,
  IPC_DESKTOP_PET_RESET_POSITION_CHANNEL,
] as const;

export function registerPetIpc(options: RegisterPetIpcOptions): () => void {
  unregisterPetIpc(options.ipcMain);
  options.ipcMain.handle(IPC_DESKTOP_PET_STATE_CHANNEL, (event) => {
    if (!isKnownSender(options, event.sender.id)) {
      return unavailablePetState();
    }
    return options.petController.getState();
  });
  options.ipcMain.handle(IPC_DESKTOP_PET_SETTINGS_CHANNEL, (event) => {
    if (!isKnownSender(options, event.sender.id)) {
      return disabledPetSettings();
    }
    return options.settingsService.getDesktopPetSettings();
  });
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL,
    (event, rawInput: unknown) => {
      if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
        return {
          ok: false,
          settings: options.settingsService.getDesktopSettings(),
          message: "Desktop Pet settings are unavailable.",
        };
      }
      const parsed = DesktopPetSettingsUpdateSchema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          ok: false,
          settings: options.settingsService.getDesktopSettings(),
          message: "Desktop Pet settings are invalid.",
        };
      }
      const raw = parsed.data;
      const result =
        typeof raw.enabled === "boolean"
          ? options.settingsService.setDesktopPetEnabled(raw)
          : typeof raw.alwaysOnTop === "boolean"
            ? options.settingsService.setDesktopPetAlwaysOnTop(raw)
            : DesktopPetReducedMotionSchema.safeParse(raw.reducedMotion).success
              ? options.settingsService.setDesktopPetReducedMotion(raw)
              : {
                  ok: false,
                  settings: options.settingsService.getDesktopSettings(),
                  message: "Desktop Pet settings are invalid.",
                };
      options.petController.syncFromSettings();
      return result;
    },
  );
  options.ipcMain.handle(IPC_DESKTOP_PET_OPEN_MAIN_WINDOW_CHANNEL, (event) => {
    if (!isPetWindowSender(options.getPetWindow(), event.sender.id)) {
      return { ok: false, message: "Desktop Pet is unavailable." };
    }
    return options.petController.openMainWindow();
  });
  options.ipcMain.handle(IPC_DESKTOP_PET_HIDE_CHANNEL, (event) => {
    if (!isPetWindowSender(options.getPetWindow(), event.sender.id)) {
      return { ok: false, message: "Desktop Pet is unavailable." };
    }
    return options.petController.hidePet();
  });
  options.ipcMain.handle(IPC_DESKTOP_PET_CONTEXT_MENU_CHANNEL, (event) => {
    if (!isPetWindowSender(options.getPetWindow(), event.sender.id)) {
      return { ok: false, message: "Desktop Pet is unavailable." };
    }
    return options.petController.requestContextMenu();
  });
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SAVE_POSITION_CHANNEL,
    (event, rawInput: unknown) => {
      if (!isPetWindowSender(options.getPetWindow(), event.sender.id)) {
        return { ok: false, message: "Desktop Pet is unavailable." };
      }
      const parsed = DesktopPetPositionSchema.safeParse(rawInput);
      if (!parsed.success) {
        return { ok: false, message: "Desktop Pet position is invalid." };
      }
      return options.petController.savePosition(parsed.data);
    },
  );
  options.ipcMain.handle(IPC_DESKTOP_PET_RESET_POSITION_CHANNEL, (event) => {
    if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
      return {
        ok: false,
        settings: options.settingsService.getDesktopSettings(),
        message: "Desktop Pet settings are unavailable.",
      };
    }
    const result = options.settingsService.resetDesktopPetPosition();
    options.petController.resetPosition();
    return result;
  });
  return () => unregisterPetIpc(options.ipcMain);
}

export function unregisterPetIpc(ipcMain: Pick<IpcMain, "removeHandler">): void {
  for (const channel of PET_CHANNELS) {
    ipcMain.removeHandler(channel);
  }
}

function isKnownSender(
  options: RegisterPetIpcOptions,
  senderId: number,
): boolean {
  return (
    isMainWindowSender(options.getMainWindow(), senderId) ||
    isPetWindowSender(options.getPetWindow(), senderId)
  );
}

function isMainWindowSender(
  mainWindow: BrowserWindow | null,
  senderId: number,
): boolean {
  return mainWindow !== null && mainWindow.webContents.id === senderId;
}

function isPetWindowSender(
  petWindow: BrowserWindow | null,
  senderId: number,
): boolean {
  return petWindow !== null && petWindow.webContents.id === senderId;
}

function unavailablePetState(): DesktopPetState {
  return {
    state: "offline",
    updatedAt: "1970-01-01T00:00:00.000Z",
    reasonCategory: "core",
    sensitiveContentExposed: false,
  };
}

function disabledPetSettings(): DesktopPetSettings {
  return {
    enabled: false,
    alwaysOnTop: true,
    reducedMotion: "system",
    persistedLocally: true,
    syncedToCloud: false,
  };
}
