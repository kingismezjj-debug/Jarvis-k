import { describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
  IPC_DESKTOP_LAUNCH_AT_LOGIN_SET_CHANNEL,
  IPC_DESKTOP_SETTINGS_SET_CHANNEL,
  IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import { registerSettingsIpc } from "../src/ipc/register-settings-ipc";
import { SettingsService } from "../src/settings/settings-service";
import type { ChatAnswerProviderConfiguration } from "../src/secure-chat-answer-provider-store";
import { LoginItemController } from "../src/login-item/login-item-controller";

function createSettingsService(input: {
  credentialConfigured?: boolean;
  secureStorageAvailable?: boolean;
  configuration?: ChatAnswerProviderConfiguration | null;
  evaluationCapabilityAvailable?: boolean;
  cloudProviderAcceptanceCapabilityAvailable?: boolean;
  desktopSettingsPath?: string;
  packagedAlphaLoginItem?: boolean;
} = {}) {
  const configureCommandRouterProductMode = vi.fn();
  const configureChatAnswerProductMode = vi.fn();
  const service = new SettingsService({
    loadChatAnswerProviderConfiguration: async () =>
      input.configuration === undefined ? null : input.configuration,
    getChatAnswerCredentialStatus: async () => ({
      secureStorageAvailable: input.secureStorageAvailable ?? true,
      credentialConfigured: input.credentialConfigured ?? false,
    }),
    configureCommandRouterProductMode,
    configureChatAnswerProductMode,
    loginItemController: input.packagedAlphaLoginItem
      ? createLoginItemController()
      : undefined,
    evaluationCapabilityAvailable: input.evaluationCapabilityAvailable,
    cloudProviderAcceptanceCapabilityAvailable:
      input.cloudProviderAcceptanceCapabilityAvailable,
    desktopSettingsPath: input.desktopSettingsPath,
  });
  return {
    service,
    configureCommandRouterProductMode,
    configureChatAnswerProductMode,
  };
}

describe("SettingsService", () => {
  it("reads default disabled settings", async () => {
    const { service } = createSettingsService();
    expect(service.getCommandRouterProductModeStatus()).toMatchObject({
      enabled: false,
      status: "disabled",
      fixtureOnly: false,
    });
    await expect(service.getChatAnswerProductModeStatus()).resolves.toMatchObject({
      enabled: false,
      status: "credential_missing",
      credentialExposed: false,
    });
    expect(service.getUiSurfaceCapabilityStatus()).toEqual({
      cloudProviderAcceptanceCapabilityAvailable: false,
      evaluationCapabilityAvailable: false,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
    expect(service.getDesktopSettings()).toEqual({
      closeButtonBehavior: "minimize_to_tray",
      closeToTrayNoticeShown: false,
      launchAtLoginEnabled: false,
      desktopPetEnabled: false,
      desktopPetAlwaysOnTop: true,
      desktopPetReducedMotion: "system",
      firstRunOnboardingVersion: 1,
      firstRunOnboardingState: "pending",
      persistedLocally: true,
      syncedToCloud: false,
    });
  });

  it("persists close button behavior locally without cloud sync", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-settings-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      const { service } = createSettingsService({ desktopSettingsPath });
      expect(
        service.setDesktopCloseButtonBehavior({
          closeButtonBehavior: "quit",
        }),
      ).toMatchObject({
        ok: true,
        settings: {
          closeButtonBehavior: "quit",
          persistedLocally: true,
          syncedToCloud: false,
        },
      });

      const stored = JSON.parse(await readFile(desktopSettingsPath, "utf8"));
      expect(stored).toMatchObject({
        closeButtonBehavior: "quit",
        launchAtLoginEnabled: false,
        desktopPetEnabled: false,
        desktopPetAlwaysOnTop: true,
        desktopPetReducedMotion: "system",
        firstRunOnboardingState: "pending",
        syncedToCloud: false,
      });
      const reloaded = createSettingsService({ desktopSettingsPath }).service;
      expect(reloaded.getDesktopSettings().closeButtonBehavior).toBe("quit");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("records the close-to-tray notice only once", () => {
    const { service } = createSettingsService();
    expect(service.markCloseToTrayNoticeShown()).toBe(true);
    expect(service.markCloseToTrayNoticeShown()).toBe(false);
    expect(service.getDesktopSettings().closeToTrayNoticeShown).toBe(true);
  });

  it("persists first-run onboarding completion locally", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-onboarding-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      const { service } = createSettingsService({ desktopSettingsPath });
      const result = service.setDesktopFirstRunOnboardingState({
        firstRunOnboardingState: "completed",
      });
      expect(result).toMatchObject({
        ok: true,
        settings: {
          firstRunOnboardingVersion: 1,
          firstRunOnboardingState: "completed",
          persistedLocally: true,
          syncedToCloud: false,
        },
      });
      expect(result.settings.firstRunOnboardingStateChangedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T/,
      );

      const reloaded = createSettingsService({ desktopSettingsPath }).service;
      expect(reloaded.getDesktopSettings()).toMatchObject({
        firstRunOnboardingState: "completed",
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("migrates legacy desktop settings without losing close behavior", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-legacy-settings-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      await writeFile(
        desktopSettingsPath,
        JSON.stringify({
          closeButtonBehavior: "quit",
          closeToTrayNoticeShown: true,
          persistedLocally: true,
          syncedToCloud: false,
        }),
        "utf8",
      );

      const { service } = createSettingsService({ desktopSettingsPath });
      expect(service.getDesktopSettings()).toMatchObject({
        closeButtonBehavior: "quit",
        closeToTrayNoticeShown: true,
        launchAtLoginEnabled: false,
        desktopPetEnabled: false,
        desktopPetAlwaysOnTop: true,
        desktopPetReducedMotion: "system",
        firstRunOnboardingVersion: 1,
        firstRunOnboardingState: "pending",
        persistedLocally: true,
        syncedToCloud: false,
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("exposes evaluation capability as a read-only safe projection", () => {
    const { service } = createSettingsService({
      evaluationCapabilityAvailable: true,
    });
    expect(service.getUiSurfaceCapabilityStatus()).toEqual({
      cloudProviderAcceptanceCapabilityAvailable: false,
      evaluationCapabilityAvailable: true,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
  });

  it("exposes cloud provider acceptance capability separately from evaluation", () => {
    const { service } = createSettingsService({
      cloudProviderAcceptanceCapabilityAvailable: true,
      evaluationCapabilityAvailable: true,
    });
    expect(service.getUiSurfaceCapabilityStatus()).toEqual({
      cloudProviderAcceptanceCapabilityAvailable: true,
      evaluationCapabilityAvailable: true,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
  });

  it("persists launch at login as a local user-controlled setting", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-login-settings-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      const { service } = createSettingsService({
        desktopSettingsPath,
        packagedAlphaLoginItem: true,
      });
      const result = service.setDesktopLaunchAtLoginEnabled({
        launchAtLoginEnabled: true,
      });
      expect(result).toMatchObject({
        ok: true,
        settings: {
          launchAtLoginEnabled: true,
          persistedLocally: true,
          syncedToCloud: false,
        },
      });
      expect(service.getDesktopLaunchAtLoginStatus()).toMatchObject({
        requested: true,
        openAtLogin: true,
        supported: true,
        releaseChannel: "alpha",
        startupArgument: "--jarvis-startup=login",
      });
      const stored = JSON.parse(await readFile(desktopSettingsPath, "utf8"));
      expect(stored).toMatchObject({
        launchAtLoginEnabled: true,
        syncedToCloud: false,
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("fails closed when launch at login is requested outside packaged alpha", () => {
    const { service } = createSettingsService();
    const result = service.setDesktopLaunchAtLoginEnabled({
      launchAtLoginEnabled: true,
    });
    expect(result).toMatchObject({
      ok: false,
      settings: { launchAtLoginEnabled: false },
    });
    expect(service.getDesktopLaunchAtLoginStatus()).toMatchObject({
      supported: false,
      openAtLogin: false,
    });
  });

  it("persists Desktop Pet settings locally", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-pet-settings-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      const { service } = createSettingsService({ desktopSettingsPath });
      expect(service.setDesktopPetEnabled({ enabled: true })).toMatchObject({
        ok: true,
        settings: { desktopPetEnabled: true },
      });
      expect(
        service.setDesktopPetAlwaysOnTop({ alwaysOnTop: false }),
      ).toMatchObject({
        ok: true,
        settings: { desktopPetAlwaysOnTop: false },
      });
      expect(
        service.setDesktopPetReducedMotion({ reducedMotion: "on" }),
      ).toMatchObject({
        ok: true,
        settings: { desktopPetReducedMotion: "on" },
      });
      expect(
        service.saveDesktopPetPosition({
          x: 12,
          y: 34,
          displayId: "1",
        }),
      ).toMatchObject({
        ok: true,
        settings: { desktopPetPosition: { x: 12, y: 34, displayId: "1" } },
      });
      expect(service.getDesktopPetSettings()).toEqual({
        enabled: true,
        alwaysOnTop: false,
        reducedMotion: "on",
        position: { x: 12, y: 34, displayId: "1" },
        persistedLocally: true,
        syncedToCloud: false,
      });

      expect(service.resetDesktopPetPosition()).toMatchObject({ ok: true });
      expect(service.getDesktopPetSettings().position).toBeUndefined();
      const stored = JSON.parse(await readFile(desktopSettingsPath, "utf8"));
      expect(JSON.stringify(stored)).not.toContain("credential");
      expect(stored.desktopPetEnabled).toBe(true);
      expect(stored.desktopPetPosition).toBeUndefined();
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("updates command router product mode without enabling fixture execution", () => {
    const { service, configureCommandRouterProductMode } = createSettingsService();
    const result = service.setCommandRouterProductModeEnabled({ enabled: true });
    expect(result.ok).toBe(true);
    expect(result.status.status).toBe("control_enabled_rules_only");
    expect(result.status.fixtureOnly).toBe(false);
    expect(configureCommandRouterProductMode).toHaveBeenCalledWith({
      enabled: true,
    });
  });

  it("updates chat answer product mode only when credentials are configured", async () => {
    const configuration: ChatAnswerProviderConfiguration = {
      provider: "chat-answer.openai-compatible.deepseek",
      credentials: { apiKey: "test-key" },
    };
    const { service, configureChatAnswerProductMode } = createSettingsService({
      credentialConfigured: true,
      configuration,
    });
    const result = await service.setChatAnswerProductModeEnabled({
      enabled: true,
    });
    expect(result.status.status).toBe("control_enabled_runtime_armed");
    expect(JSON.stringify(result)).not.toContain("test-key");
    expect(configureChatAnswerProductMode).toHaveBeenCalledWith({
      enabled: true,
      configuration,
    });
  });
});

describe("registerSettingsIpc", () => {
  it("registers and unregisters settings handlers", () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      removeHandler: vi.fn((channel: string) => {
        handlers.delete(channel);
      }),
    };
    const { service } = createSettingsService();
    const unregister = registerSettingsIpc({
      ipcMain,
      getMainWindow: () => null,
      settingsService: service,
    });

    expect(ipcMain.handle).toHaveBeenCalledTimes(9);
    expect(handlers.has(IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL)).toBe(true);
    unregister();
    expect(handlers.size).toBe(0);
  });

  it("re-registers without stacking handlers", () => {
    const ipcMain = {
      handle: vi.fn(),
      removeHandler: vi.fn(),
    };
    const { service } = createSettingsService();
    registerSettingsIpc({
      ipcMain,
      getMainWindow: () => null,
      settingsService: service,
    });
    registerSettingsIpc({
      ipcMain,
      getMainWindow: () => null,
      settingsService: service,
    });
    expect(ipcMain.handle).toHaveBeenCalledTimes(18);
    expect(ipcMain.removeHandler).toHaveBeenCalledTimes(18);
  });

  it("rejects settings updates from non-main-window senders", async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      removeHandler: vi.fn(),
    };
    const { service } = createSettingsService();
    registerSettingsIpc({
      ipcMain,
      getMainWindow: () => ({ webContents: { id: 7 } }) as never,
      settingsService: service,
    });

    const commandRouterHandler = handlers.get(
      IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
    );
    const chatAnswerHandler = handlers.get(
      IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
    );
    const desktopSettingsHandler = handlers.get(IPC_DESKTOP_SETTINGS_SET_CHANNEL);
    const launchAtLoginHandler = handlers.get(
      IPC_DESKTOP_LAUNCH_AT_LOGIN_SET_CHANNEL,
    );
    await expect(
      Promise.resolve(
        commandRouterHandler?.({ sender: { id: 8 } }, { enabled: true }),
      ),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      Promise.resolve(
        chatAnswerHandler?.({ sender: { id: 8 } }, { enabled: true }),
      ),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      Promise.resolve(
        desktopSettingsHandler?.(
          { sender: { id: 8 } },
          { closeButtonBehavior: "quit" },
        ),
      ),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      Promise.resolve(
        launchAtLoginHandler?.(
          { sender: { id: 8 } },
          { launchAtLoginEnabled: true },
        ),
      ),
    ).resolves.toMatchObject({ ok: false });
  });
});

function createLoginItemController(): LoginItemController {
  let openAtLogin = false;
  return new LoginItemController({
    app: {
      isPackaged: true,
      getPath: () => "C:\\Users\\Test\\Jarvis-K Alpha.exe",
      getLoginItemSettings: () => ({ openAtLogin }),
      setLoginItemSettings: (settings) => {
        openAtLogin = settings.openAtLogin === true;
      },
    },
    releaseChannel: "alpha",
    appId: "com.jarvis-k.desktop.alpha",
    productName: "Jarvis-K Alpha",
  });
}
