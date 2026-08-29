import { describe, expect, it, vi } from "vitest";
import {
  IPC_DESKTOP_PET_CONTEXT_MENU_CHANNEL,
  IPC_DESKTOP_PET_HIDE_CHANNEL,
  IPC_DESKTOP_PET_OPEN_MAIN_WINDOW_CHANNEL,
  IPC_DESKTOP_PET_RESET_POSITION_CHANNEL,
  IPC_DESKTOP_PET_SAVE_POSITION_CHANNEL,
  IPC_DESKTOP_PET_SETTINGS_CHANNEL,
  IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL,
  IPC_DESKTOP_PET_STATE_CHANNEL,
} from "@jarvis-k/contracts";
import { registerPetIpc } from "../src/ipc/register-pet-ipc";

class FakeIpcMain {
  public readonly handlers = new Map<string, (...args: unknown[]) => unknown>();

  public handle(channel: string, handler: (...args: unknown[]) => unknown): void {
    this.handlers.set(channel, handler);
  }

  public removeHandler(channel: string): void {
    this.handlers.delete(channel);
  }

  public invoke(channel: string, senderId: number, input?: unknown): unknown {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({ sender: { id: senderId } }, input);
  }
}

function desktopSettings(overrides: Record<string, unknown> = {}) {
  return {
    closeButtonBehavior: "minimize_to_tray",
    closeToTrayNoticeShown: false,
    launchAtLoginEnabled: false,
    uiTheme: "signal",
    uiThemeExplicitlyConfigured: false,
    desktopPetEnabled: false,
    desktopPetAlwaysOnTop: true,
    desktopPetReducedMotion: "system",
    firstRunOnboardingVersion: 1,
    firstRunOnboardingState: "pending",
    persistedLocally: true,
    syncedToCloud: false,
    ...overrides,
  };
}

function petSettings(overrides: Record<string, unknown> = {}) {
  return {
    enabled: false,
    alwaysOnTop: true,
    reducedMotion: "system",
    persistedLocally: true,
    syncedToCloud: false,
    ...overrides,
  };
}

function petState(overrides: Record<string, unknown> = {}) {
  return {
    state: "idle",
    updatedAt: "2026-08-20T00:00:00.000Z",
    reasonCategory: "user",
    sensitiveContentExposed: false,
    ...overrides,
  };
}

function setup() {
  const ipcMain = new FakeIpcMain();
  const settingsService = {
    getDesktopSettings: vi.fn(() => desktopSettings()),
    getDesktopPetSettings: vi.fn(() => petSettings({ enabled: true })),
    setDesktopPetEnabled: vi.fn(() => ({
      ok: true,
      settings: desktopSettings({ desktopPetEnabled: true }),
    })),
    setDesktopPetAlwaysOnTop: vi.fn(() => ({
      ok: true,
      settings: desktopSettings({ desktopPetAlwaysOnTop: false }),
    })),
    setDesktopPetReducedMotion: vi.fn(() => ({
      ok: true,
      settings: desktopSettings({ desktopPetReducedMotion: "on" }),
    })),
    resetDesktopPetPosition: vi.fn(() => ({
      ok: true,
      settings: desktopSettings(),
    })),
  };
  const petController = {
    getState: vi.fn(() => petState()),
    syncFromSettings: vi.fn(),
    openMainWindow: vi.fn(() => ({ ok: true, state: petState() })),
    hidePet: vi.fn(() => ({ ok: true, state: petState() })),
    requestContextMenu: vi.fn(() => ({ ok: true, state: petState() })),
    savePosition: vi.fn(() => ({ ok: true, state: petState() })),
    resetPosition: vi.fn(),
  };
  const mainWindow = { webContents: { id: 1 } };
  const petWindow = { webContents: { id: 2 } };

  registerPetIpc({
    ipcMain,
    getMainWindow: () => mainWindow as never,
    getPetWindow: () => petWindow as never,
    settingsService: settingsService as never,
    petController: petController as never,
  });

  return { ipcMain, settingsService, petController };
}

describe("registerPetIpc", () => {
  it("keeps unknown senders on disabled/offline read-only projections", () => {
    const { ipcMain, petController, settingsService } = setup();

    expect(ipcMain.invoke(IPC_DESKTOP_PET_STATE_CHANNEL, 99)).toMatchObject({
      state: "offline",
      sensitiveContentExposed: false,
    });
    expect(ipcMain.invoke(IPC_DESKTOP_PET_SETTINGS_CHANNEL, 99)).toMatchObject({
      enabled: false,
      persistedLocally: true,
      syncedToCloud: false,
    });
    expect(petController.getState).not.toHaveBeenCalled();
    expect(settingsService.getDesktopPetSettings).not.toHaveBeenCalled();
  });

  it("allows main window to change settings and rejects Pet window changes", () => {
    const { ipcMain, petController, settingsService } = setup();

    expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL, 1, {
        enabled: true,
      }),
    ).toMatchObject({ ok: true });
    expect(settingsService.setDesktopPetEnabled).toHaveBeenCalledWith({
      enabled: true,
    });
    expect(petController.syncFromSettings).toHaveBeenCalledTimes(1);

    expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL, 2, {
        enabled: false,
      }),
    ).toMatchObject({ ok: false });
  });

  it("rejects invalid or extra Pet settings fields", () => {
    const { ipcMain, petController, settingsService } = setup();

    expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL, 1, {
        enabled: true,
        runBrainCommand: true,
      }),
    ).toMatchObject({ ok: false });
    expect(settingsService.setDesktopPetEnabled).not.toHaveBeenCalled();
    expect(petController.syncFromSettings).not.toHaveBeenCalled();
  });

  it("limits Pet window commands to its fixed safe command surface", () => {
    const { ipcMain, petController } = setup();

    expect(
      ipcMain.invoke(IPC_DESKTOP_PET_OPEN_MAIN_WINDOW_CHANNEL, 2),
    ).toMatchObject({ ok: true });
    expect(ipcMain.invoke(IPC_DESKTOP_PET_HIDE_CHANNEL, 2)).toMatchObject({
      ok: true,
    });
    expect(
      ipcMain.invoke(IPC_DESKTOP_PET_CONTEXT_MENU_CHANNEL, 2),
    ).toMatchObject({ ok: true });
    expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SAVE_POSITION_CHANNEL, 2, {
        x: 10,
        y: 20,
      }),
    ).toMatchObject({ ok: true });

    expect(petController.openMainWindow).toHaveBeenCalledTimes(1);
    expect(petController.hidePet).toHaveBeenCalledTimes(1);
    expect(petController.requestContextMenu).toHaveBeenCalledTimes(1);
    expect(petController.savePosition).toHaveBeenCalledWith({ x: 10, y: 20 });
  });

  it("blocks main, unknown, and invalid Pet command senders", () => {
    const { ipcMain, petController } = setup();

    expect(
      ipcMain.invoke(IPC_DESKTOP_PET_OPEN_MAIN_WINDOW_CHANNEL, 1),
    ).toMatchObject({ ok: false });
    expect(ipcMain.invoke(IPC_DESKTOP_PET_HIDE_CHANNEL, 99)).toMatchObject({
      ok: false,
    });
    expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SAVE_POSITION_CHANNEL, 2, {
        x: 1.5,
        y: 20,
      }),
    ).toMatchObject({ ok: false });

    expect(petController.openMainWindow).not.toHaveBeenCalled();
    expect(petController.hidePet).not.toHaveBeenCalled();
    expect(petController.savePosition).not.toHaveBeenCalled();
  });

  it("allows main window to reset position and unregisters all handlers", () => {
    const ipcMain = new FakeIpcMain();
    const settingsService = {
      getDesktopSettings: vi.fn(() => desktopSettings()),
      getDesktopPetSettings: vi.fn(() => petSettings()),
      resetDesktopPetPosition: vi.fn(() => ({
        ok: true,
        settings: desktopSettings(),
      })),
    };
    const petController = {
      getState: vi.fn(() => petState()),
      resetPosition: vi.fn(),
      syncFromSettings: vi.fn(),
    };

    const unregister = registerPetIpc({
      ipcMain,
      getMainWindow: () => ({ webContents: { id: 1 } }) as never,
      getPetWindow: () => ({ webContents: { id: 2 } }) as never,
      settingsService: settingsService as never,
      petController: petController as never,
    });

    expect(ipcMain.handlers.size).toBe(8);
    expect(ipcMain.invoke(IPC_DESKTOP_PET_RESET_POSITION_CHANNEL, 1)).toMatchObject(
      { ok: true },
    );
    expect(settingsService.resetDesktopPetPosition).toHaveBeenCalledTimes(1);
    expect(petController.resetPosition).toHaveBeenCalledTimes(1);

    unregister();
    expect(ipcMain.handlers.size).toBe(0);
  });
});
