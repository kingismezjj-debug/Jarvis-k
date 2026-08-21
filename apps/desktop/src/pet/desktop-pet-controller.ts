import type { BrowserWindow, MenuItemConstructorOptions } from "electron";
import { Menu, screen as electronScreen } from "electron";
import type {
  DesktopPetCommandResult,
  DesktopPetPosition,
  DesktopPetState,
  EventEnvelope,
} from "@jarvis-k/contracts";
import { IPC_DESKTOP_PET_EVENT_CHANNEL } from "@jarvis-k/contracts";
import type { SettingsService } from "../settings/settings-service";
import { createPetWindow } from "./pet-window";
import {
  clampPetPosition,
  defaultPetPosition,
  type PetScreen,
} from "./pet-position";
import {
  createDesktopPetState,
  recentPetStateFromEvent,
} from "./pet-state-projector";

export interface DesktopPetControllerOptions {
  readonly settingsService: SettingsService;
  readonly getMainWindow: () => BrowserWindow | null;
  readonly createMainWindow: () => BrowserWindow;
  readonly setMainWindow: (window: BrowserWindow | null) => void;
  readonly openSettings: () => void;
  readonly quit: () => void;
  readonly isQuitting: () => boolean;
  readonly screen?: PetScreen;
  readonly createWindow?: typeof createPetWindow;
  readonly now?: () => Date;
}

export class DesktopPetController {
  private petWindow: BrowserWindow | null = null;
  private coreOnline = false;
  private lastSnapshot: Parameters<typeof createDesktopPetState>[0]["snapshot"] =
    null;
  private latestState: DesktopPetState;
  private recentState: Parameters<
    typeof createDesktopPetState
  >[0]["recentState"] = null;
  private moveTimer: NodeJS.Timeout | null = null;
  private recentTimer: NodeJS.Timeout | null = null;
  private crashRecoveryAttempted = false;

  public constructor(private readonly options: DesktopPetControllerOptions) {
    this.latestState = createDesktopPetState({
      nowIso: this.now().toISOString(),
      coreOnline: false,
    });
  }

  public getState(): DesktopPetState {
    return this.latestState;
  }

  public getWindow(): BrowserWindow | null {
    return this.petWindow;
  }

  public syncFromSettings(): void {
    const settings = this.options.settingsService.getDesktopPetSettings();
    if (!settings.enabled || this.options.isQuitting()) {
      this.destroyPetWindow();
      return;
    }
    this.showPetWindow();
    this.petWindow?.setAlwaysOnTop(settings.alwaysOnTop);
  }

  public showPetWindow(): void {
    if (this.options.isQuitting()) {
      return;
    }
    const existing = this.petWindow;
    if (existing && !existing.isDestroyed()) {
      existing.show();
      existing.setAlwaysOnTop(
        this.options.settingsService.getDesktopPetSettings().alwaysOnTop,
      );
      return;
    }

    const settings = this.options.settingsService.getDesktopPetSettings();
    const position = clampPetPosition(this.screen(), settings.position);
    this.options.settingsService.saveDesktopPetPosition(position);
    const window = (this.options.createWindow ?? createPetWindow)({
      position,
      alwaysOnTop: settings.alwaysOnTop,
    });
    this.petWindow = window;
    this.attachWindowHandlers(window);
    this.publishState();
  }

  public hidePet(): DesktopPetCommandResult {
    const result = this.options.settingsService.setDesktopPetEnabled({
      enabled: false,
    });
    this.destroyPetWindow();
    return {
      ok: result.ok,
      settings: this.options.settingsService.getDesktopPetSettings(),
      state: this.latestState,
      ...(result.message ? { message: result.message } : {}),
    };
  }

  public openMainWindow(): DesktopPetCommandResult {
    this.restoreMainWindow();
    return {
      ok: true,
      settings: this.options.settingsService.getDesktopPetSettings(),
      state: this.latestState,
    };
  }

  public requestContextMenu(): DesktopPetCommandResult {
    const window = this.petWindow;
    if (!window || window.isDestroyed()) {
      return {
        ok: false,
        settings: this.options.settingsService.getDesktopPetSettings(),
        state: this.latestState,
        message: "Desktop Pet is unavailable.",
      };
    }
    Menu.buildFromTemplate(this.contextMenuTemplate()).popup({ window });
    return {
      ok: true,
      settings: this.options.settingsService.getDesktopPetSettings(),
      state: this.latestState,
    };
  }

  public savePosition(position: DesktopPetPosition): DesktopPetCommandResult {
    const clamped = clampPetPosition(this.screen(), position);
    this.options.settingsService.saveDesktopPetPosition(clamped);
    const window = this.petWindow;
    if (window && !window.isDestroyed()) {
      window.setBounds({
        x: clamped.x,
        y: clamped.y,
      });
    }
    return {
      ok: true,
      settings: this.options.settingsService.getDesktopPetSettings(),
      state: this.latestState,
    };
  }

  public resetPosition(): void {
    const position = defaultPetPosition(this.screen());
    this.options.settingsService.saveDesktopPetPosition(position);
    const window = this.petWindow;
    if (window && !window.isDestroyed()) {
      window.setBounds({ x: position.x, y: position.y });
    }
  }

  public handleCoreEvent(envelope: EventEnvelope): void {
    if (envelope.event.type === "system.core.lifecycle") {
      this.coreOnline = ["online", "starting", "restarting"].includes(
        envelope.event.payload.status,
      );
    }
    if (envelope.event.type === "state.snapshot") {
      this.coreOnline = true;
      this.lastSnapshot = envelope.event.payload;
    }
    const recent = recentPetStateFromEvent(envelope, this.now().getTime());
    if (recent) {
      this.recentState = recent;
      this.scheduleRecentStateExpiry(recent.untilMs);
    }
    this.publishState();
  }

  public publishState(): void {
    this.latestState = createDesktopPetState({
      nowIso: this.now().toISOString(),
      nowMs: this.now().getTime(),
      coreOnline: this.coreOnline,
      ...(this.lastSnapshot ? { snapshot: this.lastSnapshot } : {}),
      ...(this.recentState ? { recentState: this.recentState } : {}),
    });
    const window = this.petWindow;
    if (window && !window.isDestroyed()) {
      window.webContents.send(IPC_DESKTOP_PET_EVENT_CHANNEL, this.latestState);
    }
  }

  public dispose(): void {
    this.clearTimers();
    this.destroyPetWindow();
  }

  private attachWindowHandlers(window: BrowserWindow): void {
    window.webContents.on("before-input-event", (event) => {
      event.preventDefault();
    });
    window.webContents.on("render-process-gone", () => {
      if (
        this.crashRecoveryAttempted ||
        this.options.isQuitting() ||
        !this.options.settingsService.getDesktopPetSettings().enabled
      ) {
        return;
      }
      this.crashRecoveryAttempted = true;
      this.destroyPetWindow();
      this.showPetWindow();
    });
    window.webContents.on("did-fail-load", () => {
      this.destroyPetWindow();
    });
    window.on("move", () => this.queuePositionSave());
    window.on("closed", () => {
      if (this.petWindow === window) {
        this.petWindow = null;
      }
      this.clearMoveTimer();
    });
  }

  private contextMenuTemplate(): MenuItemConstructorOptions[] {
    return [
      { label: "Open Jarvis-K", click: () => this.restoreMainWindow() },
      { label: "Hide Desktop Pet", click: () => this.hidePet() },
      { label: "Settings", click: () => this.options.openSettings() },
      { type: "separator" },
      { label: "Quit Jarvis-K", click: () => this.options.quit() },
    ];
  }

  private restoreMainWindow(): void {
    const existing = this.options.getMainWindow();
    const window =
      existing && !existing.isDestroyed()
        ? existing
        : this.options.createMainWindow();
    this.options.setMainWindow(window);
    if (window.isMinimized()) {
      window.restore();
    }
    window.show();
    window.focus();
  }

  private queuePositionSave(): void {
    this.clearMoveTimer();
    this.moveTimer = setTimeout(() => {
      const window = this.petWindow;
      if (!window || window.isDestroyed()) {
        return;
      }
      const bounds = window.getBounds();
      const position = clampPetPosition(this.screen(), {
        x: bounds.x,
        y: bounds.y,
      });
      this.options.settingsService.saveDesktopPetPosition(position);
    }, 300);
  }

  private scheduleRecentStateExpiry(untilMs: number): void {
    this.clearRecentTimer();
    const delayMs = Math.max(0, untilMs - this.now().getTime());
    this.recentTimer = setTimeout(() => {
      this.recentState = null;
      this.publishState();
    }, delayMs);
  }

  private destroyPetWindow(): void {
    const window = this.petWindow;
    this.petWindow = null;
    if (window && !window.isDestroyed()) {
      window.destroy();
    }
    this.clearMoveTimer();
  }

  private clearTimers(): void {
    this.clearMoveTimer();
    this.clearRecentTimer();
  }

  private clearMoveTimer(): void {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
      this.moveTimer = null;
    }
  }

  private clearRecentTimer(): void {
    if (this.recentTimer) {
      clearTimeout(this.recentTimer);
      this.recentTimer = null;
    }
  }

  private now(): Date {
    return this.options.now?.() ?? new Date();
  }

  private screen(): PetScreen {
    return this.options.screen ?? electronScreen;
  }
}
