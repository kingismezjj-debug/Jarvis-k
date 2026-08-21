import { beforeEach, describe, expect, it, vi } from "vitest";

const menuTemplates: unknown[] = [];

vi.mock("electron", () => ({
  Menu: {
    buildFromTemplate: vi.fn((template: unknown[]) => {
      menuTemplates.push(template);
      return { popup: vi.fn() };
    }),
  },
  screen: {
    getPrimaryDisplay: () => ({
      id: 1,
      workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    }),
    getAllDisplays: () => [
      { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1040 } },
    ],
    getDisplayNearestPoint: () => ({
      id: 1,
      workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    }),
  },
}));

const { DesktopPetController } = await import(
  "../src/pet/desktop-pet-controller"
);

function createSettingsService() {
  let settings = {
    enabled: false,
    alwaysOnTop: true,
    reducedMotion: "system" as const,
    persistedLocally: true as const,
    syncedToCloud: false as const,
  };
  return {
    getDesktopPetSettings: vi.fn(() => settings),
    setDesktopPetEnabled: vi.fn((input: { enabled: boolean }) => {
      settings = { ...settings, enabled: input.enabled };
      return { ok: true, settings: desktopSettings(settings) };
    }),
    saveDesktopPetPosition: vi.fn((position) => {
      settings = { ...settings, position };
      return { ok: true, settings: desktopSettings(settings) };
    }),
  };
}

function desktopSettings(petSettings: ReturnType<typeof createSettingsService> extends {
  getDesktopPetSettings: () => infer T;
}
  ? T
  : never) {
  return {
    closeButtonBehavior: "minimize_to_tray",
    closeToTrayNoticeShown: false,
    launchAtLoginEnabled: false,
    desktopPetEnabled: petSettings.enabled,
    desktopPetAlwaysOnTop: petSettings.alwaysOnTop,
    desktopPetReducedMotion: petSettings.reducedMotion,
    ...(petSettings.position ? { desktopPetPosition: petSettings.position } : {}),
    firstRunOnboardingVersion: 1,
    firstRunOnboardingState: "pending",
    persistedLocally: true,
    syncedToCloud: false,
  };
}

function createWindow() {
  const listeners = new Map<string, (...args: never[]) => void>();
  const webContentsListeners = new Map<string, (...args: never[]) => void>();
  return {
    listeners,
    isDestroyed: vi.fn(() => false),
    isMinimized: vi.fn(() => false),
    show: vi.fn(),
    focus: vi.fn(),
    restore: vi.fn(),
    destroy: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    setBounds: vi.fn(),
    getBounds: vi.fn(() => ({ x: 100, y: 100, width: 112, height: 112 })),
    on: vi.fn((eventName: string, listener: never) => {
      listeners.set(eventName, listener);
    }),
    webContents: {
      id: 12,
      send: vi.fn(),
      on: vi.fn((eventName: string, listener: never) => {
        webContentsListeners.set(eventName, listener);
      }),
    },
  };
}

describe("DesktopPetController", () => {
  beforeEach(() => {
    menuTemplates.length = 0;
    vi.useRealTimers();
  });

  it("keeps Desktop Pet off by default", () => {
    const settingsService = createSettingsService();
    const createWindow = vi.fn(() => createWindowInstance as never);
    const createWindowInstance = createWindowFactory();
    const controller = new DesktopPetController({
      settingsService: settingsService as never,
      getMainWindow: () => null,
      createMainWindow: vi.fn(() => createWindowInstance as never),
      setMainWindow: vi.fn(),
      openSettings: vi.fn(),
      quit: vi.fn(),
      isQuitting: () => false,
      createWindow,
    });

    controller.syncFromSettings();

    expect(createWindow).not.toHaveBeenCalled();
  });

  it("creates one Pet window and destroys it when hidden", () => {
    const settingsService = createSettingsService();
    settingsService.setDesktopPetEnabled({ enabled: true });
    const petWindow = createWindowFactory();
    const createPetWindow = vi.fn(() => petWindow as never);
    const controller = new DesktopPetController({
      settingsService: settingsService as never,
      getMainWindow: () => null,
      createMainWindow: vi.fn(),
      setMainWindow: vi.fn(),
      openSettings: vi.fn(),
      quit: vi.fn(),
      isQuitting: () => false,
      createWindow: createPetWindow,
    });

    controller.syncFromSettings();
    controller.syncFromSettings();

    expect(createPetWindow).toHaveBeenCalledTimes(1);
    expect(petWindow.setAlwaysOnTop).toHaveBeenCalledWith(true);

    expect(controller.hidePet()).toMatchObject({ ok: true });
    expect(petWindow.destroy).toHaveBeenCalledTimes(1);
    expect(settingsService.getDesktopPetSettings().enabled).toBe(false);
  });

  it("opens the main window on Pet click without command capabilities", () => {
    const mainWindow = createWindowFactory();
    const controller = new DesktopPetController({
      settingsService: createSettingsService() as never,
      getMainWindow: () => mainWindow as never,
      createMainWindow: vi.fn(),
      setMainWindow: vi.fn(),
      openSettings: vi.fn(),
      quit: vi.fn(),
      isQuitting: () => false,
    });

    expect(controller.openMainWindow()).toMatchObject({ ok: true });
    expect(mainWindow.show).toHaveBeenCalledTimes(1);
    expect(mainWindow.focus).toHaveBeenCalledTimes(1);
  });

  it("uses a fixed safe context menu", () => {
    const settingsService = createSettingsService();
    settingsService.setDesktopPetEnabled({ enabled: true });
    const petWindow = createWindowFactory();
    const controller = new DesktopPetController({
      settingsService: settingsService as never,
      getMainWindow: () => null,
      createMainWindow: vi.fn(),
      setMainWindow: vi.fn(),
      openSettings: vi.fn(),
      quit: vi.fn(),
      isQuitting: () => false,
      createWindow: vi.fn(() => petWindow as never),
    });
    controller.syncFromSettings();

    expect(controller.requestContextMenu()).toMatchObject({ ok: true });
    const serialized = JSON.stringify(menuTemplates.at(-1));
    expect(serialized).toContain("Open Jarvis-K");
    expect(serialized).toContain("Hide Desktop Pet");
    expect(serialized).toContain("Settings");
    expect(serialized).toContain("Quit Jarvis-K");
    expect(serialized).not.toContain("Run command");
    expect(serialized).not.toContain("microphone");
    expect(serialized).not.toContain("Evaluation");
  });
});

function createWindowFactory() {
  return createWindow();
}
