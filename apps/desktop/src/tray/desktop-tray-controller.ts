import { readFileSync } from "node:fs";
import path from "node:path";
import {
  BrowserWindow,
  Menu,
  Tray,
  app,
  nativeImage,
  type MenuItemConstructorOptions,
  type NativeImage,
} from "electron";

export type DesktopTrayStatus = "running" | "unavailable" | "quitting";

export interface DesktopTrayControllerOptions {
  getMainWindow: () => BrowserWindow | null;
  createMainWindow: () => BrowserWindow;
  setMainWindow: (window: BrowserWindow | null) => void;
  onOpenSettings: () => void;
  onShowPet?: () => boolean;
  onHidePet?: () => boolean;
  isPetVisible?: () => boolean;
  onQuit: () => void;
  getStatus?: () => DesktopTrayStatus;
  iconPath?: string;
}

export class DesktopTrayController {
  private tray: Tray | null = null;
  private available = false;

  public constructor(private readonly options: DesktopTrayControllerOptions) {}

  public create(): boolean {
    if (this.tray) {
      return this.available;
    }
    try {
      const icon = loadTrayIcon(this.options.iconPath);
      if (icon.isEmpty()) {
        this.available = false;
        return false;
      }
      this.tray = new Tray(icon);
      this.tray.setToolTip("Jarvis-K");
      this.tray.on("click", () => {
        this.toggleWindow();
      });
      this.tray.on("double-click", () => {
        this.showWindow();
      });
      this.updateMenu();
      this.available = true;
      return true;
    } catch (error) {
      process.stderr.write(
        `[desktop] Tray unavailable: ${
          error instanceof Error ? error.message : "unknown error"
        }\n`,
      );
      this.tray = null;
      this.available = false;
      return false;
    }
  }

  public isAvailable(): boolean {
    return this.available && this.tray !== null;
  }

  public showWindow(): void {
    const window = this.getOrCreateWindow();
    if (window.isMinimized()) {
      window.restore();
    }
    window.show();
    window.focus();
    this.updateMenu();
  }

  public hideWindow(): boolean {
    const window = this.options.getMainWindow();
    if (!this.isAvailable() || !window || window.isDestroyed()) {
      return false;
    }
    window.hide();
    this.updateMenu();
    return true;
  }

  public toggleWindow(): void {
    const window = this.options.getMainWindow();
    if (window && !window.isDestroyed() && window.isVisible()) {
      this.hideWindow();
      return;
    }
    this.showWindow();
  }

  public openSettings(): void {
    this.showWindow();
    this.options.onOpenSettings();
  }

  public updateMenu(): void {
    if (!this.tray) {
      return;
    }
    const window = this.options.getMainWindow();
    const windowVisible =
      window !== null && !window.isDestroyed() && window.isVisible();
    const status = this.options.getStatus?.() ?? "running";
    const petVisible = this.options.isPetVisible?.() === true;
    const template: MenuItemConstructorOptions[] = [
      {
        label: "Open Jarvis-K",
        click: () => this.showWindow(),
      },
      {
        label: "Hide",
        enabled: windowVisible,
        click: () => {
          this.hideWindow();
        },
      },
      {
        label: "Settings",
        click: () => this.openSettings(),
      },
      {
        label: petVisible ? "Hide Desktop Pet" : "Show Desktop Pet",
        click: () => {
          if (petVisible) {
            this.options.onHidePet?.();
          } else {
            this.options.onShowPet?.();
          }
          this.updateMenu();
        },
      },
      { type: "separator" },
      {
        label: `Status: ${status === "quitting" ? "Quitting" : "Running"}`,
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Quit Jarvis-K",
        click: () => this.options.onQuit(),
      },
    ];
    this.tray.setContextMenu(Menu.buildFromTemplate(template));
  }

  public dispose(): void {
    const tray = this.tray;
    this.tray = null;
    this.available = false;
    tray?.destroy();
  }

  private getOrCreateWindow(): BrowserWindow {
    const existing = this.options.getMainWindow();
    if (existing && !existing.isDestroyed()) {
      return existing;
    }
    const nextWindow = this.options.createMainWindow();
    this.options.setMainWindow(nextWindow);
    return nextWindow;
  }
}

export function defaultTrayIconPath(): string {
  return path.join(
    __dirname,
    "..",
    "..",
    "assets",
    "tray-icon.png.base64",
  );
}

export function loadTrayIcon(iconPath = defaultTrayIconPath()): NativeImage {
  const encoded = readFileSync(iconPath, "utf8").trim();
  return nativeImage.createFromBuffer(Buffer.from(encoded, "base64")).resize({
    height: 16,
    width: 16,
  });
}
