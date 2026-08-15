import type { BrowserWindow, App } from "electron";

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
  app: Pick<App, "on" | "quit">;
  getMainWindow: () => BrowserWindow | null;
  createMainWindow: () => BrowserWindow;
  setMainWindow: (window: BrowserWindow | null) => void;
  cleanup: () => void;
}

export function registerDesktopAppLifecycle(
  options: RegisterDesktopAppLifecycleOptions,
): void {
  options.app.on("second-instance", () => {
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
    if (!options.getMainWindow()) {
      options.setMainWindow(options.createMainWindow());
    }
  });

  options.app.on("before-quit", options.cleanup);

  options.app.on("window-all-closed", () => {
    options.app.quit();
  });
}
