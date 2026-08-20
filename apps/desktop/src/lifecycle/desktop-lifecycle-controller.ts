import type { App, BrowserWindow, Event } from "electron";
import {
  IPC_DESKTOP_UI_ACTION_CHANNEL,
  type DesktopCloseButtonBehavior,
} from "@jarvis-k/contracts";
import type { DesktopTrayController } from "../tray/desktop-tray-controller";

export type DesktopLifecycleState =
  | "starting"
  | "visible"
  | "minimized"
  | "hidden_to_tray"
  | "quitting"
  | "stopped";

export interface DesktopLifecycleControllerOptions {
  app: Pick<App, "quit">;
  getMainWindow: () => BrowserWindow | null;
  createMainWindow: () => BrowserWindow;
  setMainWindow: (window: BrowserWindow | null) => void;
  getCloseButtonBehavior: () => DesktopCloseButtonBehavior;
  getTrayController: () => DesktopTrayController | null;
  cleanup: () => void | Promise<void>;
  notifyCloseToTray: () => void;
}

export class DesktopLifecycleController {
  private state: DesktopLifecycleState = "starting";
  private explicitQuitRequested = false;
  private systemShutdownRequested = false;
  private cleanupStarted = false;
  private cleanupCompleted = false;

  public constructor(
    private readonly options: DesktopLifecycleControllerOptions,
  ) {}

  public getState(): DesktopLifecycleState {
    return this.state;
  }

  public getDiagnostics(): {
    state: DesktopLifecycleState;
    explicitQuitRequested: boolean;
    systemShutdownRequested: boolean;
    cleanupStarted: boolean;
    cleanupCompleted: boolean;
    trayAvailable: boolean;
  } {
    return {
      state: this.state,
      explicitQuitRequested: this.explicitQuitRequested,
      systemShutdownRequested: this.systemShutdownRequested,
      cleanupStarted: this.cleanupStarted,
      cleanupCompleted: this.cleanupCompleted,
      trayAvailable: this.options.getTrayController()?.isAvailable() === true,
    };
  }

  public attachWindow(window: BrowserWindow): void {
    this.state = window.isMinimized() ? "minimized" : "visible";
    window.on("minimize", () => {
      if (this.state !== "quitting") {
        this.state = "minimized";
      }
    });
    window.on("show", () => {
      if (this.state !== "quitting") {
        this.state = "visible";
      }
      this.options.getTrayController()?.updateMenu();
    });
    window.on("hide", () => {
      if (this.state !== "quitting") {
        this.state = "hidden_to_tray";
      }
      this.options.getTrayController()?.updateMenu();
    });
    window.on("closed", () => {
      this.options.setMainWindow(null);
      if (this.state !== "quitting") {
        this.state = "stopped";
      }
    });
    window.on("close", (event) => this.handleWindowClose(event));
  }

  public restoreWindow(): void {
    if (this.state === "quitting") {
      return;
    }
    const window = this.getOrCreateWindow();
    if (window.isMinimized()) {
      window.restore();
    }
    window.show();
    window.focus();
    this.state = "visible";
  }

  public openSettings(): void {
    this.restoreWindow();
    const window = this.options.getMainWindow();
    if (!window || window.isDestroyed()) {
      return;
    }
    window.webContents.send(IPC_DESKTOP_UI_ACTION_CHANNEL, {
      type: "desktop.openSettings",
    });
  }

  public requestExplicitQuit(): void {
    this.markExplicitQuitRequested();
    this.options.getTrayController()?.updateMenu();
    this.options.app.quit();
  }

  public markExplicitQuitRequested(): void {
    if (!this.explicitQuitRequested) {
      this.explicitQuitRequested = true;
      this.state = "quitting";
    }
  }

  public markSystemShutdownRequested(): void {
    this.systemShutdownRequested = true;
    this.state = "quitting";
  }

  public async cleanupOnce(): Promise<void> {
    if (this.cleanupStarted) {
      return;
    }
    this.cleanupStarted = true;
    this.state = "quitting";
    try {
      await this.options.cleanup();
    } catch (error) {
      process.stderr.write(
        `[desktop] Cleanup failed during quit: ${
          error instanceof Error ? error.message : "unknown error"
        }\n`,
      );
    } finally {
      this.cleanupCompleted = true;
      this.state = "stopped";
    }
  }

  private handleWindowClose(event: Event): void {
    if (this.explicitQuitRequested || this.systemShutdownRequested) {
      return;
    }
    if (this.options.getCloseButtonBehavior() === "quit") {
      this.explicitQuitRequested = true;
      this.state = "quitting";
      return;
    }

    const tray = this.options.getTrayController();
    if (!tray?.isAvailable()) {
      return;
    }
    event.preventDefault();
    const hidden = tray.hideWindow();
    if (hidden) {
      this.state = "hidden_to_tray";
      this.options.notifyCloseToTray();
    }
  }

  private getOrCreateWindow(): BrowserWindow {
    const existing = this.options.getMainWindow();
    if (existing && !existing.isDestroyed()) {
      return existing;
    }
    const nextWindow = this.options.createMainWindow();
    this.options.setMainWindow(nextWindow);
    this.attachWindow(nextWindow);
    return nextWindow;
  }
}
