import { describe, expect, it, vi } from "vitest";
import { DesktopLifecycleController } from "../src/lifecycle/desktop-lifecycle-controller";

function createWindow() {
  const listeners = new Map<string, (event?: { preventDefault(): void }) => void>();
  return {
    listeners,
    isDestroyed: vi.fn(() => false),
    isMinimized: vi.fn(() => false),
    isVisible: vi.fn(() => true),
    restore: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    hide: vi.fn(),
    on: vi.fn((eventName: string, listener: never) => {
      listeners.set(eventName, listener);
    }),
    webContents: {
      send: vi.fn(),
    },
  };
}

describe("DesktopLifecycleController", () => {
  it("hides to tray on close without running cleanup or quitting", () => {
    const app = { quit: vi.fn() };
    const window = createWindow();
    const tray = {
      isAvailable: vi.fn(() => true),
      hideWindow: vi.fn(() => true),
      updateMenu: vi.fn(),
    };
    const notifyCloseToTray = vi.fn();
    const controller = new DesktopLifecycleController({
      app,
      getMainWindow: () => window as never,
      createMainWindow: vi.fn(() => window as never),
      setMainWindow: vi.fn(),
      getCloseButtonBehavior: () => "minimize_to_tray",
      getTrayController: () => tray as never,
      cleanup: vi.fn(),
      notifyCloseToTray,
    });
    controller.attachWindow(window as never);

    const event = { preventDefault: vi.fn() };
    window.listeners.get("close")?.(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(tray.hideWindow).toHaveBeenCalledTimes(1);
    expect(notifyCloseToTray).toHaveBeenCalledTimes(1);
    expect(app.quit).not.toHaveBeenCalled();
    expect(controller.getState()).toBe("hidden_to_tray");
  });

  it("does not hide to a missing tray", () => {
    const window = createWindow();
    const controller = new DesktopLifecycleController({
      app: { quit: vi.fn() },
      getMainWindow: () => window as never,
      createMainWindow: vi.fn(() => window as never),
      setMainWindow: vi.fn(),
      getCloseButtonBehavior: () => "minimize_to_tray",
      getTrayController: () => null,
      cleanup: vi.fn(),
      notifyCloseToTray: vi.fn(),
    });
    controller.attachWindow(window as never);

    const event = { preventDefault: vi.fn() };
    window.listeners.get("close")?.(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("lets close proceed when close behavior is quit", () => {
    const window = createWindow();
    const controller = new DesktopLifecycleController({
      app: { quit: vi.fn() },
      getMainWindow: () => window as never,
      createMainWindow: vi.fn(() => window as never),
      setMainWindow: vi.fn(),
      getCloseButtonBehavior: () => "quit",
      getTrayController: () => null,
      cleanup: vi.fn(),
      notifyCloseToTray: vi.fn(),
    });
    controller.attachWindow(window as never);

    const event = { preventDefault: vi.fn() };
    window.listeners.get("close")?.(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(controller.getDiagnostics().explicitQuitRequested).toBe(true);
    expect(controller.getState()).toBe("quitting");
  });

  it("runs cleanup once even when requested repeatedly", async () => {
    const cleanup = vi.fn();
    const controller = new DesktopLifecycleController({
      app: { quit: vi.fn() },
      getMainWindow: () => null,
      createMainWindow: vi.fn(() => createWindow() as never),
      setMainWindow: vi.fn(),
      getCloseButtonBehavior: () => "minimize_to_tray",
      getTrayController: () => null,
      cleanup,
      notifyCloseToTray: vi.fn(),
    });

    await controller.cleanupOnce();
    await controller.cleanupOnce();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(controller.getDiagnostics()).toMatchObject({
      cleanupCompleted: true,
      cleanupStarted: true,
      state: "stopped",
    });
  });

  it("sends a safe settings action without exposing diagnostics", () => {
    const window = createWindow();
    const controller = new DesktopLifecycleController({
      app: { quit: vi.fn() },
      getMainWindow: () => window as never,
      createMainWindow: vi.fn(() => window as never),
      setMainWindow: vi.fn(),
      getCloseButtonBehavior: () => "minimize_to_tray",
      getTrayController: () => null,
      cleanup: vi.fn(),
      notifyCloseToTray: vi.fn(),
    });

    controller.openSettings();

    expect(window.webContents.send).toHaveBeenCalledWith(
      "jarvis-k:desktop-ui-action",
      { type: "desktop.openSettings" },
    );
  });
});
