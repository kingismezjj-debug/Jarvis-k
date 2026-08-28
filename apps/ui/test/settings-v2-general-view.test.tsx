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
      onRefreshDesktopSettings={vi.fn()}
      onSelectLanguage={vi.fn()}
      onSetDesktopCloseButtonBehavior={vi.fn()}
      onSetDesktopLaunchAtLoginEnabled={vi.fn()}
      sending={false}
      {...props}
    />,
  );
}

describe("Settings V2 General view", () => {
  it("renders the real General settings values in English", () => {
    const html = renderView();
    expect(html).toContain("Jarvis Settings");
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
    expect(html).toContain("Jarvis 设置");
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
      "PROTOTYPE DATA",
      "DANGER ZONE",
    ]) {
      expect(html).not.toContain(forbidden);
    }
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
