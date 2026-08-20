import type { BrowserWindow, App } from "electron";
import type { DesktopLifecycleController } from "./lifecycle/desktop-lifecycle-controller";

export interface ConfigureElectronGpuPolicyOptions {
  app: Pick<App, "disableHardwareAcceleration" | "commandLine">;
  env?: NodeJS.ProcessEnv;
}

export function configureElectronGpuPolicy(
  options: ConfigureElectronGpuPolicyOptions,
): void {
  const env = options.env ?? process.env;
  if (env.JARVIS_K_ENABLE_ELECTRON_GPU === "1") {
    return;
  }
  options.app.disableHardwareAcceleration();
  options.app.commandLine.appendSwitch("disable-gpu");
  options.app.commandLine.appendSwitch("disable-gpu-compositing");
}

export interface RegisterDesktopAppLifecycleOptions {
  app: {
    on(eventName: string, listener: (...args: unknown[]) => void): unknown;
    quit(): void;
  };
  getMainWindow: () => BrowserWindow | null;
  createMainWindow: () => BrowserWindow;
  setMainWindow: (window: BrowserWindow | null) => void;
  cleanup: () => void | Promise<void>;
  lifecycleController?: DesktopLifecycleController | undefined;
  shouldQuitOnWindowAllClosed?: () => boolean;
}

export function registerDesktopAppLifecycle(
  options: RegisterDesktopAppLifecycleOptions,
): void {
  options.app.on("second-instance", () => {
    if (options.lifecycleController) {
      options.lifecycleController.restoreWindow();
      return;
    }
    const mainWindow = options.getMainWindow();
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });

  options.app.on("activate", () => {
    if (options.lifecycleController) {
      options.lifecycleController.restoreWindow();
      return;
    }
    if (!options.getMainWindow()) {
      options.setMainWindow(options.createMainWindow());
    }
  });

  options.app.on("before-quit", () => {
    options.lifecycleController?.markExplicitQuitRequested();
    void (options.lifecycleController?.cleanupOnce() ?? options.cleanup());
  });

  options.app.on("session-end", () => {
    options.lifecycleController?.markSystemShutdownRequested();
  });

  options.app.on("window-all-closed", () => {
    if (options.shouldQuitOnWindowAllClosed?.() === false) {
      return;
    }
    options.app.quit();
  });
}
