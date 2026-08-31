import { describe, expect, it } from "vitest";
import {
  SETTINGS_V2_INTERNAL_FAULT_FLAG,
  resolveSettingsV2InternalFaultMode,
} from "../src/settings/settings-v2-internal-fault-mode";

const validModes = [
  "settings_v2_render_failure",
  "settings_v2_mount_timeout",
] as const;

describe("Settings V2 internal fault mode parser", () => {
  it("accepts only the two exact packaged Alpha fault modes", () => {
    for (const mode of validModes) {
      expect(
        resolveSettingsV2InternalFaultMode({
          argv: [
            "Jarvis-K Alpha.exe",
            `${SETTINGS_V2_INTERNAL_FAULT_FLAG}${mode}`,
          ],
          isPackaged: true,
          releaseChannel: "alpha",
        }),
      ).toBe(mode);
    }
  });

  it("keeps ordinary packaged Alpha startup at none", () => {
    expect(
      resolveSettingsV2InternalFaultMode({
        argv: ["Jarvis-K Alpha.exe"],
        isPackaged: true,
        releaseChannel: "alpha",
      }),
    ).toBe("none");
  });

  it("fails closed for unknown, empty, duplicate, and conflicting flags", () => {
    for (const argv of [
      [`${SETTINGS_V2_INTERNAL_FAULT_FLAG}`],
      [`${SETTINGS_V2_INTERNAL_FAULT_FLAG}settings_v2_render_failure `],
      [`${SETTINGS_V2_INTERNAL_FAULT_FLAG}settings_v2_unknown`],
      [
        `${SETTINGS_V2_INTERNAL_FAULT_FLAG}settings_v2_render_failure`,
        `${SETTINGS_V2_INTERNAL_FAULT_FLAG}settings_v2_render_failure`,
      ],
      [
        `${SETTINGS_V2_INTERNAL_FAULT_FLAG}settings_v2_render_failure`,
        `${SETTINGS_V2_INTERNAL_FAULT_FLAG}settings_v2_mount_timeout`,
      ],
      ["--jarvis-internal-settings-v2-fault", "settings_v2_render_failure"],
    ]) {
      expect(
        resolveSettingsV2InternalFaultMode({
          argv,
          isPackaged: true,
          releaseChannel: "alpha",
        }),
      ).toBe("none");
    }
  });

  it("does not activate in development, stable, test, or unpackaged runs", () => {
    const argv = [
      `${SETTINGS_V2_INTERNAL_FAULT_FLAG}settings_v2_render_failure`,
    ];
    for (const releaseChannel of ["development", "stable", "test"] as const) {
      expect(
        resolveSettingsV2InternalFaultMode({
          argv,
          isPackaged: true,
          releaseChannel,
        }),
      ).toBe("none");
    }
    expect(
      resolveSettingsV2InternalFaultMode({
        argv,
        isPackaged: false,
        releaseChannel: "alpha",
      }),
    ).toBe("none");
  });
});
