import { beforeEach, describe, expect, it, vi } from "vitest";

const trayInstances: Array<{
  listeners: Map<string, () => void>;
  destroy: ReturnType<typeof vi.fn>;
  setContextMenu: ReturnType<typeof vi.fn>;
  setToolTip: ReturnType<typeof vi.fn>;
}> = [];
const menuTemplates: unknown[] = [];

vi.mock("electron", () => {
  class FakeTray {
    public listeners = new Map<string, () => void>();
    public destroy = vi.fn();
    public setContextMenu = vi.fn();
    public setToolTip = vi.fn();
    public constructor(_icon: unknown) {
      trayInstances.push(this);
    }
    public on(eventName: string, listener: () => void) {
      this.listeners.set(eventName, listener);
    }
  }
  return {
    BrowserWindow: vi.fn(),
    Menu: {
      buildFromTemplate: vi.fn((template: unknown[]) => {
        menuTemplates.push(template);
        return { template };
      }),
    },
    Tray: FakeTray,
    nativeImage: {
      createFromBuffer: vi.fn(() => ({
        isEmpty: () => false,
        resize: () => ({ isEmpty: () => false }),
      })),
    },
  };
});

const { DesktopTrayController } = await import(
  "../src/tray/desktop-tray-controller"
);

function createWindow(visible = true) {
  return {
    isDestroyed: vi.fn(() => false),
    isMinimized: vi.fn(() => false),
    isVisible: vi.fn(() => visible),
    restore: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    hide: vi.fn(),
  };
}

describe("DesktopTrayController", () => {
  beforeEach(() => {
    trayInstances.length = 0;
    menuTemplates.length = 0;
  });

  it("creates one tray and exposes only safe product menu actions", () => {
    const window = createWindow(true);
    const controller = new DesktopTrayController({
      getMainWindow: () => window as never,
      createMainWindow: vi.fn(() => window as never),
      setMainWindow: vi.fn(),
      onOpenSettings: vi.fn(),
      onQuit: vi.fn(),
      iconPath: "apps/desktop/assets/tray-icon.png.base64",
    });

    expect(controller.create()).toBe(true);
    expect(controller.create()).toBe(true);
    expect(trayInstances).toHaveLength(1);

    const serializedMenu = JSON.stringify(menuTemplates.at(-1));
    expect(serializedMenu).toContain("Open Jarvis-K");
    expect(serializedMenu).toContain("Hide");
    expect(serializedMenu).toContain("Settings");
    expect(serializedMenu).toContain("Quit Jarvis-K");
    expect(serializedMenu).not.toContain("fixture");
    expect(serializedMenu).not.toContain("Evaluation");
    expect(serializedMenu).not.toContain("Pilot");
    expect(serializedMenu).not.toContain("API key");
  });

  it("toggles visible windows and restores hidden windows", () => {
    const window = createWindow(true);
    const controller = new DesktopTrayController({
      getMainWindow: () => window as never,
      createMainWindow: vi.fn(() => window as never),
      setMainWindow: vi.fn(),
      onOpenSettings: vi.fn(),
      onQuit: vi.fn(),
      iconPath: "apps/desktop/assets/tray-icon.png.base64",
    });
    controller.create();

    trayInstances[0]?.listeners.get("click")?.();
    expect(window.hide).toHaveBeenCalledTimes(1);

    window.isVisible.mockReturnValue(false);
    trayInstances[0]?.listeners.get("click")?.();
    expect(window.show).toHaveBeenCalledTimes(1);
    expect(window.focus).toHaveBeenCalledTimes(1);
  });

  it("opens settings through the supplied callback", () => {
    const openSettings = vi.fn();
    const window = createWindow(true);
    const controller = new DesktopTrayController({
      getMainWindow: () => window as never,
      createMainWindow: vi.fn(() => window as never),
      setMainWindow: vi.fn(),
      onOpenSettings: openSettings,
      onQuit: vi.fn(),
      iconPath: "apps/desktop/assets/tray-icon.png.base64",
    });
    controller.create();

    controller.openSettings();

    expect(window.show).toHaveBeenCalledTimes(1);
    expect(window.focus).toHaveBeenCalledTimes(1);
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it("disposes tray exactly once", () => {
    const controller = new DesktopTrayController({
      getMainWindow: () => createWindow(true) as never,
      createMainWindow: vi.fn(() => createWindow(true) as never),
      setMainWindow: vi.fn(),
      onOpenSettings: vi.fn(),
      onQuit: vi.fn(),
      iconPath: "apps/desktop/assets/tray-icon.png.base64",
    });
    controller.create();
    const tray = trayInstances[0];

    controller.dispose();
    controller.dispose();

    expect(tray?.destroy).toHaveBeenCalledTimes(1);
    expect(controller.isAvailable()).toBe(false);
  });

  it("fails closed when the local icon is unavailable", () => {
    const controller = new DesktopTrayController({
      getMainWindow: () => createWindow(true) as never,
      createMainWindow: vi.fn(() => createWindow(true) as never),
      setMainWindow: vi.fn(),
      onOpenSettings: vi.fn(),
      onQuit: vi.fn(),
      iconPath: "missing-icon.png.base64",
    });

    expect(controller.create()).toBe(false);
    expect(controller.isAvailable()).toBe(false);
  });
});
