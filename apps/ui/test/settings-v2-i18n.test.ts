import { describe, expect, it } from "vitest";

import {
  formatSettingsV2Error,
  settingsV2Copy,
  validateSettingsV2CopyParity,
  type SettingsV2CopyKey,
} from "../src/features/settings-v2/settings-v2-copy";

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
});
