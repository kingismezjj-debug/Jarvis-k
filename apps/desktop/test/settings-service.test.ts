import { describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
  IPC_DESKTOP_LAUNCH_AT_LOGIN_SET_CHANNEL,
  IPC_DESKTOP_SETTINGS_SET_CHANNEL,
  IPC_PRODUCT_ABOUT_INFO_CHANNEL,
  IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL,
  IPC_UI_SURFACE_HEALTH_REPORT_CHANNEL,
  IPC_UI_SURFACE_SESSION_FALLBACK_REQUEST_CHANNEL,
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
  loginItemController?: LoginItemController;
  releaseChannel?: "development" | "alpha" | "stable" | "test";
  settingsV2EnvRequested?: boolean;
  settingsV2CapabilityAvailable?: boolean;
  settingsV2ReleaseAllowed?: boolean;
  settingsV2ReasonCode?: ReturnType<
    SettingsService["getUiSurfaceCapabilityStatus"]
  >["reasonCode"];
  settingsV2MountTimeoutMs?: number;
  productName?: string;
  productVersion?: string;
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
    loginItemController:
      input.loginItemController ??
      (input.packagedAlphaLoginItem ? createLoginItemController() : undefined),
    evaluationCapabilityAvailable: input.evaluationCapabilityAvailable,
    cloudProviderAcceptanceCapabilityAvailable:
      input.cloudProviderAcceptanceCapabilityAvailable,
    releaseChannel: input.releaseChannel,
    settingsV2EnvRequested: input.settingsV2EnvRequested,
    settingsV2CapabilityAvailable: input.settingsV2CapabilityAvailable,
    settingsV2ReleaseAllowed: input.settingsV2ReleaseAllowed,
    settingsV2ReasonCode: input.settingsV2ReasonCode,
    settingsV2MountTimeoutMs: input.settingsV2MountTimeoutMs,
    productName: input.productName,
    productVersion: input.productVersion,
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
      reasonCode: "flag_disabled",
      settingsSurfaceMounted: "legacy",
      settingsSurfaceHealth: "not_started",
      settingsSurfaceRequested: "general_settings",
      settingsV2Capability: false,
      settingsV2CapabilityAvailable: false,
      settingsV2EnvRequested: false,
      settingsV2SessionFallbackActive: false,
      settingsV2MountGeneration: null,
      settingsV2ReleaseAllowed: false,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
    expect(service.getDesktopSettings()).toEqual({
      closeButtonBehavior: "minimize_to_tray",
      closeToTrayNoticeShown: false,
      launchAtLoginEnabled: false,
      uiTheme: "signal",
      uiThemeExplicitlyConfigured: false,
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
        uiTheme: "signal",
        uiThemeExplicitlyConfigured: false,
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

  it("persists the interface theme through Desktop Settings", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-theme-settings-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      const { service } = createSettingsService({ desktopSettingsPath });
      expect(service.setDesktopUiTheme({ uiTheme: "harbor" })).toMatchObject({
        ok: true,
        settings: {
          uiTheme: "harbor",
          uiThemeExplicitlyConfigured: true,
          persistedLocally: true,
          syncedToCloud: false,
        },
      });

      const stored = JSON.parse(await readFile(desktopSettingsPath, "utf8"));
      expect(stored.uiTheme).toBe("harbor");
      expect(stored.uiThemeExplicitlyConfigured).toBe(true);
      const reloaded = createSettingsService({ desktopSettingsPath }).service;
      expect(reloaded.getDesktopSettings().uiTheme).toBe("harbor");
      expect(reloaded.getDesktopSettings().uiThemeExplicitlyConfigured).toBe(
        true,
      );
      expect(service.setDesktopUiTheme({ uiTheme: "unknown" })).toMatchObject({
        ok: false,
        settings: { uiTheme: "harbor" },
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("migrates one allowlisted legacy theme only when no trusted theme exists", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-legacy-theme-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      const { service } = createSettingsService({ desktopSettingsPath });

      expect(
        service.migrateLegacyDesktopUiTheme({ legacyUiTheme: "harbor" }),
      ).toMatchObject({
        ok: true,
        settings: {
          uiTheme: "harbor",
          uiThemeExplicitlyConfigured: true,
          persistedLocally: true,
          syncedToCloud: false,
        },
      });
      expect(
        service.migrateLegacyDesktopUiTheme({ legacyUiTheme: "ember" }),
      ).toMatchObject({
        ok: false,
        settings: {
          uiTheme: "harbor",
          uiThemeExplicitlyConfigured: true,
        },
      });

      const stored = JSON.parse(await readFile(desktopSettingsPath, "utf8"));
      expect(stored).toMatchObject({
        uiTheme: "harbor",
        uiThemeExplicitlyConfigured: true,
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it.each(["signal", "harbor", "ember"] as const)(
    "accepts the legacy %s theme id through the controlled migration bridge",
    (legacyTheme) => {
      const { service } = createSettingsService();
      expect(
        service.migrateLegacyDesktopUiTheme({ legacyUiTheme: legacyTheme }),
      ).toMatchObject({
        ok: true,
        settings: {
          uiTheme: legacyTheme,
          uiThemeExplicitlyConfigured: true,
        },
      });
    },
  );

  it("rejects unknown legacy theme values without changing trusted settings", () => {
    const { service } = createSettingsService();
    expect(
      service.migrateLegacyDesktopUiTheme({ legacyUiTheme: "external-css" }),
    ).toMatchObject({
      ok: false,
      settings: {
        uiTheme: "signal",
        uiThemeExplicitlyConfigured: false,
      },
    });
  });

  it("does not let legacy theme migration overwrite an explicit theme", () => {
    const { service } = createSettingsService();
    expect(service.setDesktopUiTheme({ uiTheme: "ember" })).toMatchObject({
      ok: true,
      settings: {
        uiTheme: "ember",
        uiThemeExplicitlyConfigured: true,
      },
    });
    expect(
      service.migrateLegacyDesktopUiTheme({ legacyUiTheme: "harbor" }),
    ).toMatchObject({
      ok: false,
      settings: {
        uiTheme: "ember",
        uiThemeExplicitlyConfigured: true,
      },
    });
  });

  it("does not let legacy theme migration overwrite a loaded non-default service theme", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-nondefault-theme-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      await writeFile(
        desktopSettingsPath,
        JSON.stringify({
          closeButtonBehavior: "minimize_to_tray",
          closeToTrayNoticeShown: true,
          launchAtLoginEnabled: false,
          uiTheme: "harbor",
          desktopPetEnabled: false,
          desktopPetAlwaysOnTop: true,
          desktopPetReducedMotion: "system",
          firstRunOnboardingVersion: 1,
          firstRunOnboardingState: "completed",
          persistedLocally: true,
          syncedToCloud: false,
        }),
        "utf8",
      );

      const { service } = createSettingsService({ desktopSettingsPath });
      expect(
        service.migrateLegacyDesktopUiTheme({ legacyUiTheme: "ember" }),
      ).toMatchObject({
        ok: false,
        settings: {
          uiTheme: "harbor",
          uiThemeExplicitlyConfigured: false,
        },
      });
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
        uiTheme: "signal",
        uiThemeExplicitlyConfigured: false,
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
      reasonCode: "flag_disabled",
      settingsSurfaceMounted: "legacy",
      settingsSurfaceHealth: "not_started",
      settingsSurfaceRequested: "general_settings",
      settingsV2Capability: false,
      settingsV2CapabilityAvailable: false,
      settingsV2EnvRequested: false,
      settingsV2SessionFallbackActive: false,
      settingsV2MountGeneration: null,
      settingsV2ReleaseAllowed: false,
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
      reasonCode: "flag_disabled",
      settingsSurfaceMounted: "legacy",
      settingsSurfaceHealth: "not_started",
      settingsSurfaceRequested: "general_settings",
      settingsV2Capability: false,
      settingsV2CapabilityAvailable: false,
      settingsV2EnvRequested: false,
      settingsV2SessionFallbackActive: false,
      settingsV2MountGeneration: null,
      settingsV2ReleaseAllowed: false,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
  });

  it("exposes Settings V2 only as a read-only safe projection", () => {
    const { service } = createSettingsService({
      settingsV2CapabilityAvailable: true,
      settingsV2EnvRequested: true,
      settingsV2ReleaseAllowed: true,
    });
    expect(service.getUiSurfaceCapabilityStatus()).toEqual({
      cloudProviderAcceptanceCapabilityAvailable: false,
      evaluationCapabilityAvailable: false,
      reasonCode: "enabled",
      settingsSurfaceMounted: "v2",
      settingsSurfaceHealth: "not_started",
      settingsSurfaceRequested: "general_settings",
      settingsV2Capability: true,
      settingsV2CapabilityAvailable: true,
      settingsV2EnvRequested: true,
      settingsV2SessionFallbackActive: false,
      settingsV2MountGeneration: null,
      settingsV2ReleaseAllowed: true,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
  });

  it("exposes product About info as a Main-owned safe projection", () => {
    const { service } = createSettingsService({
      productName: "Jarvis-K Alpha",
      productVersion: "0.1.0-alpha.5",
      releaseChannel: "alpha",
    });

    const aboutInfo = service.getProductAboutInfo();
    expect(aboutInfo).toEqual({
      productName: "Jarvis-K Alpha",
      version: "0.1.0-alpha.5",
      inAppUpdatesSupported: false,
      updateCheckAvailable: false,
      externalLinksAvailable: false,
      diagnosticsExportAvailable: false,
      networkRequestRequired: false,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
    expect("releaseChannel" in aboutInfo).toBe(false);
    expect(aboutInfo.version).not.toBe("39.8.5");
    expect(JSON.stringify(aboutInfo)).not.toMatch(
      /appId|AppUserModelID|releaseChannel|C:\\|credential|Authorization|Bearer|commit|gitSha/i,
    );
  });

  it("fails closed when Product About version is unavailable", () => {
    const { service } = createSettingsService({
      productName: "Jarvis-K Alpha",
      productVersion: "",
      releaseChannel: "alpha",
    });

    const aboutInfo = service.getProductAboutInfo();
    expect(aboutInfo.version).toBe("unknown");
    expect(JSON.stringify(aboutInfo)).not.toContain("39.8.5");
    expect("releaseChannel" in aboutInfo).toBe(false);
  });

  it("reports Settings V2 flag requests blocked outside approved channels", () => {
    const { service } = createSettingsService({
      releaseChannel: "stable",
      settingsV2CapabilityAvailable: false,
      settingsV2EnvRequested: true,
      settingsV2ReleaseAllowed: false,
    });
    expect(service.getUiSurfaceCapabilityStatus()).toMatchObject({
      reasonCode: "release_channel_not_allowed",
      settingsSurfaceMounted: "legacy",
      settingsV2Capability: false,
      settingsV2CapabilityAvailable: false,
      settingsV2EnvRequested: true,
      settingsV2ReleaseAllowed: false,
    });
    expect("releaseChannel" in service.getUiSurfaceCapabilityStatus()).toBe(false);
  });

  it("reports Settings V2 development default-on separately from env requests", () => {
    const { service } = createSettingsService({
      releaseChannel: "development",
      settingsV2CapabilityAvailable: true,
      settingsV2EnvRequested: false,
      settingsV2ReleaseAllowed: true,
      settingsV2ReasonCode: "development_default_enabled",
    });
    expect(service.getUiSurfaceCapabilityStatus()).toMatchObject({
      reasonCode: "development_default_enabled",
      settingsSurfaceMounted: "v2",
      settingsV2Capability: true,
      settingsV2CapabilityAvailable: true,
      settingsV2EnvRequested: false,
      settingsV2ReleaseAllowed: true,
    });
  });

  it("reports Settings V2 Alpha default-on separately from env requests", () => {
    const { service } = createSettingsService({
      releaseChannel: "alpha",
      settingsV2CapabilityAvailable: true,
      settingsV2EnvRequested: false,
      settingsV2ReleaseAllowed: true,
      settingsV2ReasonCode: "alpha_default_enabled",
    });
    expect(service.getUiSurfaceCapabilityStatus()).toMatchObject({
      reasonCode: "alpha_default_enabled",
      settingsSurfaceMounted: "v2",
      settingsV2Capability: true,
      settingsV2CapabilityAvailable: true,
      settingsV2EnvRequested: false,
      settingsV2ReleaseAllowed: true,
    });
  });

  it("falls back to Legacy for the current session after a Settings V2 renderer failure", () => {
    const { service } = createSettingsService({
      releaseChannel: "development",
      settingsV2CapabilityAvailable: true,
      settingsV2ReleaseAllowed: true,
      settingsV2ReasonCode: "development_default_enabled",
    });

    const mountingStatus = service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: null,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      });
    expect(mountingStatus).toMatchObject({
      settingsSurfaceMounted: "v2",
      settingsSurfaceHealth: "mounting",
      settingsV2MountGeneration: 1,
      settingsV2CapabilityAvailable: true,
      settingsV2SessionFallbackActive: false,
    });
    const generation = mountingStatus.settingsV2MountGeneration;

    expect(
      service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "failed",
        reasonCode: "settings_v2_renderer_failure",
        generation,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      }),
    ).toMatchObject({
      reasonCode: "settings_v2_session_fallback",
      settingsSurfaceMounted: "legacy",
      settingsSurfaceHealth: "failed",
      settingsV2Capability: false,
      settingsV2CapabilityAvailable: false,
      settingsV2SessionFallbackActive: true,
    });

    expect(
      service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "ready",
        reasonCode: "settings_v2_ready",
        generation,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      }),
    ).toMatchObject({
      reasonCode: "settings_v2_session_fallback",
      settingsSurfaceMounted: "legacy",
      settingsSurfaceHealth: "failed",
      settingsV2SessionFallbackActive: true,
    });
  });

  it("falls back to Legacy when Settings V2 does not report ready before timeout", () => {
    vi.useFakeTimers();
    try {
      const { service } = createSettingsService({
        releaseChannel: "development",
        settingsV2CapabilityAvailable: true,
        settingsV2ReleaseAllowed: true,
        settingsV2MountTimeoutMs: 100,
      });
      service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: null,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      });
      expect(service.getUiSurfaceCapabilityStatus()).toMatchObject({
        settingsSurfaceMounted: "v2",
        settingsSurfaceHealth: "mounting",
      });
      vi.advanceTimersByTime(100);
      expect(service.getUiSurfaceCapabilityStatus()).toMatchObject({
        reasonCode: "settings_v2_session_fallback",
        settingsSurfaceMounted: "legacy",
        settingsSurfaceHealth: "failed",
        settingsV2SessionFallbackActive: true,
      });
      service.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("accepts only the current Settings V2 generation for ready and cleanup", () => {
    vi.useFakeTimers();
    try {
      const { service } = createSettingsService({
        releaseChannel: "development",
        settingsV2CapabilityAvailable: true,
        settingsV2ReleaseAllowed: true,
        settingsV2MountTimeoutMs: 100,
      });
      const mountOne = service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: null,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      });
      expect(mountOne.settingsV2MountGeneration).toBe(1);
      expect(
        service.reportUiSurfaceHealth({
          surface: "settings_v2",
          state: "unmounted",
          reasonCode: "settings_v2_unmounted",
          generation: 1,
          source: "renderer",
          sensitiveValuesExposed: false,
          rendererWritable: false,
        }),
      ).toMatchObject({
        settingsSurfaceHealth: "not_started",
        settingsV2MountGeneration: null,
      });
      const mountTwo = service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: null,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      });
      expect(mountTwo.settingsV2MountGeneration).toBe(2);
      for (const staleReport of [
        {
          state: "ready",
          reasonCode: "settings_v2_ready",
        },
        {
          state: "failed",
          reasonCode: "settings_v2_renderer_failure",
        },
        {
          state: "unmounted",
          reasonCode: "settings_v2_unmounted",
        },
      ] as const) {
        expect(
          service.reportUiSurfaceHealth({
            surface: "settings_v2",
            state: staleReport.state,
            reasonCode: staleReport.reasonCode,
            generation: 1,
            source: "renderer",
            sensitiveValuesExposed: false,
            rendererWritable: false,
          }),
        ).toMatchObject({
          settingsSurfaceMounted: "v2",
          settingsSurfaceHealth: "mounting",
          settingsV2MountGeneration: 2,
          settingsV2SessionFallbackActive: false,
        });
      }
      expect(
        service.reportUiSurfaceHealth({
          surface: "settings_v2",
          state: "ready",
          reasonCode: "settings_v2_ready",
          generation: 2,
          source: "renderer",
          sensitiveValuesExposed: false,
          rendererWritable: false,
        }),
      ).toMatchObject({
        settingsSurfaceMounted: "v2",
        settingsSurfaceHealth: "ready",
        settingsV2MountGeneration: 2,
      });
      vi.advanceTimersByTime(100);
      expect(service.getUiSurfaceCapabilityStatus()).toMatchObject({
        settingsSurfaceMounted: "v2",
        settingsSurfaceHealth: "ready",
        settingsV2SessionFallbackActive: false,
      });
      service.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not let duplicate mounting extend the active timeout", () => {
    vi.useFakeTimers();
    try {
      const { service } = createSettingsService({
        releaseChannel: "development",
        settingsV2CapabilityAvailable: true,
        settingsV2ReleaseAllowed: true,
        settingsV2MountTimeoutMs: 100,
      });
      const first = service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: null,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      });
      vi.advanceTimersByTime(50);
      const duplicate = service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: null,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      });
      expect(duplicate.settingsV2MountGeneration).toBe(
        first.settingsV2MountGeneration,
      );
      vi.advanceTimersByTime(50);
      expect(service.getUiSurfaceCapabilityStatus()).toMatchObject({
        reasonCode: "settings_v2_session_fallback",
        settingsSurfaceMounted: "legacy",
        settingsSurfaceHealth: "failed",
        settingsV2SessionFallbackActive: true,
      });
      service.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps fallback after renderer failure and ignores stale ready", () => {
    const { service } = createSettingsService({
      releaseChannel: "development",
      settingsV2CapabilityAvailable: true,
      settingsV2ReleaseAllowed: true,
    });
    const mount = service.reportUiSurfaceHealth({
      surface: "settings_v2",
      state: "mounting",
      reasonCode: "settings_v2_mounting",
      generation: null,
      source: "renderer",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
    const generation = mount.settingsV2MountGeneration;
    expect(
      service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "failed",
        reasonCode: "settings_v2_renderer_failure",
        generation,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      }),
    ).toMatchObject({
      settingsSurfaceMounted: "legacy",
      settingsV2SessionFallbackActive: true,
    });
    expect(
      service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "ready",
        reasonCode: "settings_v2_ready",
        generation,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      }),
    ).toMatchObject({
      settingsSurfaceMounted: "legacy",
      settingsV2SessionFallbackActive: true,
    });
  });

  it("rejects malformed health reason pairs and renderer-specified mounting generations", () => {
    const { service } = createSettingsService({
      releaseChannel: "development",
      settingsV2CapabilityAvailable: true,
      settingsV2ReleaseAllowed: true,
    });
    expect(
      service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_ready",
        generation: null,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      }),
    ).toMatchObject({
      settingsSurfaceHealth: "not_started",
      settingsV2MountGeneration: null,
    });
    expect(
      service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: 99,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      }),
    ).toMatchObject({
      settingsSurfaceHealth: "not_started",
      settingsV2MountGeneration: null,
    });
  });

  it("switches to Legacy for this session without mutating settings", () => {
    const { service } = createSettingsService({
      releaseChannel: "development",
      settingsV2CapabilityAvailable: true,
      settingsV2ReleaseAllowed: true,
    });
    const beforeSettings = service.getDesktopSettings();
    expect(
      service.requestUiSurfaceSessionFallback({
        surface: "settings_v2",
        action: "use_classic_settings",
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      }),
    ).toMatchObject({
      reasonCode: "settings_v2_session_fallback",
      settingsSurfaceMounted: "legacy",
      settingsV2SessionFallbackActive: true,
    });
    expect(service.getDesktopSettings()).toEqual(beforeSettings);
  });

  it("clears Settings V2 timers and status subscriptions on dispose", () => {
    vi.useFakeTimers();
    try {
      const { service } = createSettingsService({
        releaseChannel: "development",
        settingsV2CapabilityAvailable: true,
        settingsV2ReleaseAllowed: true,
        settingsV2MountTimeoutMs: 100,
      });
      const listener = vi.fn();
      service.onUiSurfaceCapabilityStatus(listener);
      service.reportUiSurfaceHealth({
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: null,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      });
      expect(listener).toHaveBeenCalledTimes(1);
      service.dispose();
      vi.advanceTimersByTime(100);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(service.getUiSurfaceCapabilityStatus()).toMatchObject({
        settingsSurfaceMounted: "v2",
        settingsSurfaceHealth: "not_started",
        settingsV2MountGeneration: null,
        settingsV2SessionFallbackActive: false,
      });
    } finally {
      vi.useRealTimers();
    }
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
      const result = await service.setDesktopLaunchAtLoginEnabled({
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
        startupArgument: "jarvis-startup=login",
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

  it("persists launch at login when Electron confirms with an exact enabled launch item", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-login-launch-items-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      const { service } = createSettingsService({
        desktopSettingsPath,
        loginItemController: new LoginItemController({
          app: {
            isPackaged: true,
            getPath: () => "C:\\Users\\Test\\Jarvis-K Alpha.exe",
            setLoginItemSettings: vi.fn(),
            getLoginItemSettings: vi.fn(() => ({
              openAtLogin: false,
              executableWillLaunchAtLogin: true,
              launchItems: [
                {
                  name: "com.jarvis-k.desktop.alpha",
                  path: "C:\\Users\\Test\\Jarvis-K Alpha.exe",
                  args: ["jarvis-startup=login"],
                  enabled: true,
                },
              ],
            })),
          },
          releaseChannel: "alpha",
          appId: "com.jarvis-k.desktop.alpha",
          productName: "Jarvis-K Alpha",
          verificationDelayMs: 0,
        }),
      });

      const result = await service.setDesktopLaunchAtLoginEnabled({
        launchAtLoginEnabled: true,
      });

      expect(result).toMatchObject({
        ok: true,
        settings: { launchAtLoginEnabled: true },
      });
      expect(service.getDesktopLaunchAtLoginStatus()).toMatchObject({
        requested: true,
        openAtLogin: true,
        mismatch: false,
        hasExactLaunchItem: true,
        exactLaunchItemEnabled: true,
      });
      const stored = JSON.parse(await readFile(desktopSettingsPath, "utf8"));
      expect(stored.launchAtLoginEnabled).toBe(true);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("ignores renderer-provided login item identity fields and uses the fixed Main identity", async () => {
    const setLoginItemSettings = vi.fn();
    const { service } = createSettingsService({
      loginItemController: new LoginItemController({
        app: {
          isPackaged: true,
          getPath: () => "C:\\Users\\Test\\Jarvis-K Alpha.exe",
          setLoginItemSettings,
          getLoginItemSettings: vi.fn(() => ({
            openAtLogin: false,
            launchItems: [
              {
                name: "com.jarvis-k.desktop.alpha",
                path: "C:\\Users\\Test\\Jarvis-K Alpha.exe",
                args: ["jarvis-startup=login"],
                enabled: true,
              },
            ],
          })),
        },
        releaseChannel: "alpha",
        appId: "com.jarvis-k.desktop.alpha",
        productName: "Jarvis-K Alpha",
        verificationDelayMs: 0,
      }),
    });

    await expect(
      service.setDesktopLaunchAtLoginEnabled({
        launchAtLoginEnabled: true,
        path: "C:\\Unsafe\\Other.exe",
        name: "Other",
        args: ["--other"],
        enabled: false,
      }),
    ).resolves.toMatchObject({
      ok: true,
      settings: { launchAtLoginEnabled: true },
    });
    expect(setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: true,
      enabled: true,
      path: "C:\\Users\\Test\\Jarvis-K Alpha.exe",
      args: ["jarvis-startup=login"],
    });
  });

  it("reports persisted preference and OS login item mismatch without mutating settings on startup", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-desktop-login-reconcile-"),
    );
    try {
      const desktopSettingsPath = path.join(directory, "settings.json");
      await writeFile(
        desktopSettingsPath,
        JSON.stringify({
          closeButtonBehavior: "minimize_to_tray",
          closeToTrayNoticeShown: true,
          launchAtLoginEnabled: false,
          uiTheme: "signal",
          uiThemeExplicitlyConfigured: true,
          desktopPetEnabled: false,
          desktopPetAlwaysOnTop: true,
          desktopPetReducedMotion: "system",
          firstRunOnboardingVersion: 1,
          firstRunOnboardingState: "skipped",
          persistedLocally: true,
          syncedToCloud: false,
        }),
      );
      const before = await readFile(desktopSettingsPath, "utf8");
      const { service } = createSettingsService({
        desktopSettingsPath,
        loginItemController: new LoginItemController({
          app: {
            isPackaged: true,
            getPath: () => "C:\\Users\\Test\\Jarvis-K Alpha.exe",
            setLoginItemSettings: vi.fn(),
            getLoginItemSettings: vi.fn(() => ({
              openAtLogin: false,
              executableWillLaunchAtLogin: true,
              launchItems: [
                {
                  name: "com.jarvis-k.desktop.alpha",
                  path: "C:\\Users\\Test\\Jarvis-K Alpha.exe",
                  args: ["jarvis-startup=login"],
                  enabled: true,
                },
              ],
            })),
          },
          releaseChannel: "alpha",
          appId: "com.jarvis-k.desktop.alpha",
          productName: "Jarvis-K Alpha",
          verificationDelayMs: 0,
        }),
      });

      expect(service.getDesktopSettings().launchAtLoginEnabled).toBe(false);
      expect(service.getDesktopLaunchAtLoginStatus()).toMatchObject({
        requested: false,
        openAtLogin: true,
        mismatch: true,
        verificationState: "enabled",
      });
      await expect(readFile(desktopSettingsPath, "utf8")).resolves.toBe(before);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("fails closed when launch at login is requested outside packaged alpha", async () => {
    const { service } = createSettingsService();
    const result = await service.setDesktopLaunchAtLoginEnabled({
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

    expect(ipcMain.handle).toHaveBeenCalledTimes(12);
    expect(handlers.has(IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL)).toBe(true);
    expect(handlers.has(IPC_UI_SURFACE_HEALTH_REPORT_CHANNEL)).toBe(true);
    expect(
      handlers.has(IPC_UI_SURFACE_SESSION_FALLBACK_REQUEST_CHANNEL),
    ).toBe(true);
    expect(handlers.has(IPC_PRODUCT_ABOUT_INFO_CHANNEL)).toBe(true);
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
    expect(ipcMain.handle).toHaveBeenCalledTimes(24);
    expect(ipcMain.removeHandler).toHaveBeenCalledTimes(24);
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
    const uiSurfaceHealthHandler = handlers.get(
      IPC_UI_SURFACE_HEALTH_REPORT_CHANNEL,
    );
    const uiSurfaceFallbackHandler = handlers.get(
      IPC_UI_SURFACE_SESSION_FALLBACK_REQUEST_CHANNEL,
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
    expect(
      uiSurfaceHealthHandler?.(
        { sender: { id: 8 } },
        {
          surface: "settings_v2",
          state: "failed",
          reasonCode: "settings_v2_renderer_failure",
          generation: 1,
          source: "renderer",
          sensitiveValuesExposed: false,
          rendererWritable: false,
        },
      ),
    ).toMatchObject({
      settingsSurfaceMounted: "legacy",
      settingsV2SessionFallbackActive: false,
    });
    expect(
      uiSurfaceFallbackHandler?.(
        { sender: { id: 8 } },
        {
          surface: "settings_v2",
          action: "use_classic_settings",
          source: "renderer",
          sensitiveValuesExposed: false,
          rendererWritable: false,
        },
      ),
    ).toMatchObject({
      settingsSurfaceMounted: "legacy",
      settingsV2SessionFallbackActive: false,
    });
  });

  it("accepts Settings V2 health reports and session fallback only from the main window", () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      removeHandler: vi.fn(),
    };
    const { service } = createSettingsService({
      releaseChannel: "development",
      settingsV2CapabilityAvailable: true,
      settingsV2ReleaseAllowed: true,
    });
    registerSettingsIpc({
      ipcMain,
      getMainWindow: () => ({ webContents: { id: 7 } }) as never,
      settingsService: service,
    });

    const uiSurfaceHealthHandler = handlers.get(
      IPC_UI_SURFACE_HEALTH_REPORT_CHANNEL,
    );
    const mountStatus = uiSurfaceHealthHandler?.(
      { sender: { id: 7 } },
      {
        surface: "settings_v2",
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: null,
        source: "renderer",
        sensitiveValuesExposed: false,
        rendererWritable: false,
      },
    ) as ReturnType<SettingsService["getUiSurfaceCapabilityStatus"]>;
    expect(mountStatus).toMatchObject({
      settingsSurfaceMounted: "v2",
      settingsV2MountGeneration: 1,
    });
    expect(
      uiSurfaceHealthHandler?.(
        { sender: { id: 7 } },
        {
          surface: "settings_v2",
          state: "failed",
          reasonCode: "settings_v2_renderer_failure",
          generation: mountStatus.settingsV2MountGeneration,
          source: "renderer",
          sensitiveValuesExposed: false,
          rendererWritable: false,
        },
      ),
    ).toMatchObject({
      reasonCode: "settings_v2_session_fallback",
      settingsSurfaceMounted: "legacy",
      settingsV2SessionFallbackActive: true,
    });

    const { service: rollbackService } = createSettingsService({
      releaseChannel: "development",
      settingsV2CapabilityAvailable: true,
      settingsV2ReleaseAllowed: true,
    });
    registerSettingsIpc({
      ipcMain,
      getMainWindow: () => ({ webContents: { id: 7 } }) as never,
      settingsService: rollbackService,
    });
    const uiSurfaceFallbackHandler = handlers.get(
      IPC_UI_SURFACE_SESSION_FALLBACK_REQUEST_CHANNEL,
    );
    expect(
      uiSurfaceFallbackHandler?.(
        { sender: { id: 7 } },
        {
          surface: "settings_v2",
          action: "use_classic_settings",
          source: "renderer",
          sensitiveValuesExposed: false,
          rendererWritable: false,
        },
      ),
    ).toMatchObject({
      settingsSurfaceMounted: "legacy",
      settingsV2SessionFallbackActive: true,
    });
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
    verificationDelayMs: 0,
  });
}
