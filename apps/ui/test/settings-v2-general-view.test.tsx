import { readFileSync } from "node:fs";
import path from "node:path";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type {
  DesktopLaunchAtLoginStatus,
  DesktopSettings,
} from "@jarvis-k/contracts";

import { SettingsV2GeneralView } from "../src/features/settings-v2/settings-v2-general-view";

const desktopSettings: DesktopSettings = {
  closeButtonBehavior: "minimize_to_tray",
  closeToTrayNoticeShown: false,
  launchAtLoginEnabled: false,
  uiTheme: "signal",
  uiThemeExplicitlyConfigured: true,
  desktopPetEnabled: false,
  desktopPetAlwaysOnTop: true,
  desktopPetReducedMotion: "system",
  firstRunOnboardingVersion: 1,
  firstRunOnboardingState: "completed",
  firstRunOnboardingStateChangedAt: "2026-08-28T00:00:00.000Z",
  persistedLocally: true,
  syncedToCloud: false,
};

const launchStatus: DesktopLaunchAtLoginStatus = {
  requested: false,
  openAtLogin: false,
  supported: false,
  canModify: false,
  mismatch: false,
  releaseChannel: "development",
  startupArgument: "--jarvis-startup=login",
  source: "unsupported-release-channel",
  appId: "com.jarvis-k.desktop.development",
  productName: "Jarvis-K",
  errorCode: "LOGIN_ITEM_UNSUPPORTED_RELEASE_CHANNEL",
};

function renderView(
  props: Partial<React.ComponentProps<typeof SettingsV2GeneralView>> = {},
): string {
  return renderToStaticMarkup(
    <SettingsV2GeneralView
      desktopLaunchAtLoginStatus={launchStatus}
      desktopSettings={desktopSettings}
      locale="en"
      activeThemeId="signal"
      onRefreshDesktopSettings={vi.fn()}
      onSelectLanguage={vi.fn()}
      onSelectTheme={vi.fn()}
      onSetDesktopCloseButtonBehavior={vi.fn()}
      onSetDesktopLaunchAtLoginEnabled={vi.fn()}
      onSetDesktopPetAlwaysOnTop={vi.fn()}
      onSetDesktopPetEnabled={vi.fn()}
      onSetDesktopPetReducedMotion={vi.fn()}
      onResetDesktopPetPosition={vi.fn()}
      petSkinRegistry={null}
      sending={false}
      {...props}
    />,
  );
}

describe("Settings V2 General view", () => {
  it("renders the real General settings values in English", () => {
    const html = renderView();
    expect(html).toContain("Jarvis Control Center");
    expect(html).toContain("Display language");
    expect(html).toContain("English");
    expect(html).toContain("When closing the main window");
    expect(html).toContain("Minimize to system tray");
    expect(html).toContain("Launch after Windows sign-in");
    expect(html).toContain("Not supported");
    expect(html).toContain("Reset is not available yet");
  });

  it("renders productized zh-CN General copy", () => {
    const html = renderView({ locale: "zh" });
    expect(html).toContain("Jarvis 控制中心");
    expect(html).toContain("界面语言");
    expect(html).toContain("中文（简体）");
    expect(html).toContain("关闭主窗口时");
    expect(html).toContain("最小化到系统托盘");
    expect(html).toContain("登录后自动启动");
    expect(html).toContain("重置暂不可用");
    expect(html).not.toMatch(/[锟闁垾]/);
  });

  it("does not surface Developer or Evaluation tools in the Product V2 slice", () => {
    const html = renderView();
    for (const forbidden of [
      "Developer Mode",
      "Evaluation",
      "Runtime Inspector",
      "Cloud Acceptance",
      "Qwen",
      "fixture",
      "Skin Studio",
      "PROTOTYPE DATA",
      "DANGER ZONE",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("renders Appearance & Pet from real safe projections", () => {
    const html = renderView({
      activeThemeId: "harbor",
      initialCategoryId: "appearance_pet",
      desktopSettings: {
        ...desktopSettings,
        uiTheme: "harbor",
        desktopPetEnabled: true,
        desktopPetAlwaysOnTop: false,
        desktopPetReducedMotion: "on",
      },
      petSkinRegistry: {
        activeSkin: {
          identity: {
            skinId: "local.test",
            skinVersion: "1.0.0",
            packageDigest:
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
          displayName: "Calm Local Skin",
          trustState: "active_skin",
          states: {
            idle: { baseAssetId: "idle" },
            listening: { baseAssetId: "listening" },
            thinking: { baseAssetId: "thinking" },
            success: { baseAssetId: "success" },
            error: { baseAssetId: "error" },
            offline: { baseAssetId: "offline" },
          },
          reducedMotionStates: {
            idle: { baseAssetId: "idle-static" },
            listening: { baseAssetId: "listening-static" },
            thinking: { baseAssetId: "thinking-static" },
            success: { baseAssetId: "success-static" },
            error: { baseAssetId: "error-static" },
            offline: { baseAssetId: "offline-static" },
          },
          resources: {},
          sensitiveContentExposed: false,
        },
        activeSkinIdentity: {
          skinId: "local.test",
          skinVersion: "1.0.0",
          packageDigest:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        },
        builtInFallback: {
          skinId: "builtin.jarvis-k.robot",
          trustState: "built_in_fallback",
          removable: false,
        },
        installedSkins: [],
        registryHealthy: true,
      },
    });
    expect(html).toContain("Appearance &amp; Pet");
    expect(html).toContain("Harbor");
    expect(html).toContain("Show Desktop Pet");
    expect(html).toContain("Visible");
    expect(html).toContain("Reduced motion");
    expect(html).toContain("Calm Local Skin");
    expect(html).toContain("Installed local skin");
    for (const forbidden of [
      "aaaaaaaaaaaaaaaa",
      "local.test",
      "packageDigest",
      "manifest",
      "signature",
      "C:\\\\",
      "credential",
      "Skin Studio",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("inherits the trusted active theme on the Settings V2 token root", () => {
    const html = renderView({
      activeThemeId: "harbor",
      desktopSettings: {
        ...desktopSettings,
        uiTheme: "harbor",
      },
    });
    expect(html).toContain('class="jk-theme settings-v2-shell"');
    expect(html).toContain('data-jarvis-theme="harbor"');
  });

  it("keeps Reset & Recovery non-executable", () => {
    const html = renderView();
    expect(html).toContain("Restore default settings");
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Review reset boundary");
  });

  it("does not directly access runtime APIs from the Settings V2 renderer files", () => {
    const featureDirectory = path.resolve(
      import.meta.dirname,
      "..",
      "src",
      "features",
      "settings-v2",
    );
    const source = [
      "settings-v2-general-view.tsx",
      "settings-v2-registry.ts",
      "settings-v2-copy.ts",
    ]
      .map((file) => readFileSync(path.join(featureDirectory, file), "utf8"))
      .join("\n");

    for (const forbidden of [
      "window.jarvis",
      "ipcRenderer",
      "safeStorage",
      "showOpenDialog",
      "fetch(",
      "XMLHttpRequest",
      "JARVIS_K_",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
