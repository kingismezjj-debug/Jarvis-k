import { describe, expect, it, vi } from "vitest";
import {
  configureElectronGpuPolicy,
  registerDesktopAppLifecycle,
} from "../src/app-lifecycle";

describe("configureElectronGpuPolicy", () => {
  it("disables GPU by default", () => {
    const app = {
      disableHardwareAcceleration: vi.fn(),
      commandLine: {
        appendSwitch: vi.fn(),
      },
    };

    configureElectronGpuPolicy({ app, env: {} });

    expect(app.disableHardwareAcceleration).toHaveBeenCalledTimes(1);
    expect(app.commandLine.appendSwitch).toHaveBeenCalledWith("disable-gpu");
    expect(app.commandLine.appendSwitch).toHaveBeenCalledWith(
      "disable-gpu-compositing",
    );
  });

  it("honors explicit Electron GPU enablement", () => {
    const app = {
      disableHardwareAcceleration: vi.fn(),
      commandLine: {
        appendSwitch: vi.fn(),
      },
    };

    configureElectronGpuPolicy({
      app,
      env: { JARVIS_K_ENABLE_ELECTRON_GPU: "1" },
    });

    expect(app.disableHardwareAcceleration).not.toHaveBeenCalled();
    expect(app.commandLine.appendSwitch).not.toHaveBeenCalled();
  });
});

describe("registerDesktopAppLifecycle", () => {
  it("registers focus, activate, cleanup and quit handlers", () => {
    const listeners = new Map<string, (...args: unknown[]) => void>();
    const existingWindow = {
      isMinimized: vi.fn(() => true),
      restore: vi.fn(),
      focus: vi.fn(),
    };
    const createdWindow = {
      isMinimized: vi.fn(() => false),
      restore: vi.fn(),
      focus: vi.fn(),
    };
    let currentWindow: unknown = existingWindow;
    const cleanup = vi.fn();
    const app = {
      on: vi.fn((eventName: string, listener: (...args: unknown[]) => void) => {
        listeners.set(eventName, listener);
      }),
      quit: vi.fn(),
    };

    registerDesktopAppLifecycle({
      app,
      getMainWindow: () => currentWindow as never,
      createMainWindow: vi.fn(() => createdWindow as never),
      setMainWindow: (window) => {
        currentWindow = window;
      },
      cleanup,
    });

    listeners.get("second-instance")?.();
    expect(existingWindow.restore).toHaveBeenCalledTimes(1);
    expect(existingWindow.focus).toHaveBeenCalledTimes(1);

    currentWindow = null;
    listeners.get("activate")?.();
    expect(currentWindow).toBe(createdWindow);

    listeners.get("before-quit")?.();
    expect(cleanup).toHaveBeenCalledTimes(1);

    listeners.get("window-all-closed")?.();
    expect(app.quit).toHaveBeenCalledTimes(1);
  });
});
