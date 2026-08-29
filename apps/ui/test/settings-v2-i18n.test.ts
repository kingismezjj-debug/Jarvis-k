import { describe, expect, it } from "vitest";

import {
  formatSettingsV2Error,
  settingsV2Copy,
  validateSettingsV2CopyParity,
  type SettingsV2CopyKey,
} from "../src/features/settings-v2/settings-v2-copy";
import { uiCopy } from "../src/app/copy";

describe("Settings V2 i18n foundation", () => {
  it("keeps English and zh-CN keys in parity", () => {
    const parity = validateSettingsV2CopyParity();
    expect(parity).toMatchObject({
      ok: true,
      missing: [],
      empty: [],
    });
    expect(parity.keyCount).toBe(Object.keys(settingsV2Copy.zh).length);
  });

  it("maps all allowed error codes to localized product copy", () => {
    for (const code of [
      "save_failed",
      "validation_failed",
      "unavailable",
      "permission_required",
      "operation_in_progress",
      "confirmation_required",
      "reset_not_supported",
    ] as const) {
      expect(formatSettingsV2Error("en", code)).toBeTruthy();
      expect(formatSettingsV2Error("zh", code)).toBeTruthy();
    }
  });

  it("keeps ordinary Chinese Settings V2 copy free of internal English tags", () => {
    const zhCopy = Object.values(settingsV2Copy.zh).join("\n");
    expect(zhCopy).not.toMatch(/[锟闁垾]/);

    for (const forbidden of [
      "EVERYONE",
      "READY",
      "PRODUCT",
      "PLANNED",
      "NEEDS_SETUP",
      "DANGER ZONE",
      "PROTOTYPE DATA",
      "Developer tools",
      "control type",
      "fixture",
    ]) {
      expect(zhCopy).not.toContain(forbidden);
    }
  });

  it("keeps every copy key namespaced under Settings V2", () => {
    for (const key of Object.keys(settingsV2Copy.en) as SettingsV2CopyKey[]) {
      expect(key.startsWith("settings.")).toBe(true);
      expect(settingsV2Copy.zh[key]).toBeTruthy();
    }
  });

  it("keeps the zh-CN Product shell free of raw internal service labels", () => {
    expect(uiCopy.zh.connection.online).toBe("在线");
    expect(uiCopy.zh.nav.developer).toBe("开发者");
    expect(uiCopy.zh.view.developer).toBe("开发者");
    expect(uiCopy.zh.label.commandPlaceholder).toBe(
      "向 Jarvis 发送文本命令",
    );
    expect(uiCopy.zh.label.agentCore).toBe("Jarvis");

    const productShellText = [
      uiCopy.zh.connection.online,
      uiCopy.zh.nav.developer,
      uiCopy.zh.view.developer,
      uiCopy.zh.label.commandPlaceholder,
      uiCopy.zh.label.agentCore,
      uiCopy.zh.action.memoryAlphaDisabled,
      uiCopy.zh.action.memoryAlphaIs,
      uiCopy.zh.action.memoryAlphaRefreshed,
    ].join("\n");

    for (const forbidden of [
      "runtime unknown",
      "Memory alpha disabled",
      "Memory Alpha",
      "SETTINGS",
      "Agent Core",
    ]) {
      expect(productShellText).not.toContain(forbidden);
    }
  });
});
