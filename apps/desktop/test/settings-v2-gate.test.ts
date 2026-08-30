import { describe, expect, it } from "vitest";
import { resolveSettingsV2Gate } from "../src/settings/settings-v2-gate";

describe("Settings V2 gate", () => {
  it("enables Settings V2 by default only in development", () => {
    expect(
      resolveSettingsV2Gate({
        envValue: undefined,
        releaseChannel: "development",
      }),
    ).toEqual({
      settingsV2CapabilityAvailable: true,
      settingsV2EnvRequested: false,
      settingsV2ReleaseAllowed: true,
      reasonCode: "development_default_enabled",
    });
  });

  it("keeps packaged Alpha and reserved Stable on Legacy by default", () => {
    for (const releaseChannel of ["alpha", "stable", "test"] as const) {
      expect(
        resolveSettingsV2Gate({
          envValue: undefined,
          releaseChannel,
        }),
      ).toMatchObject({
        settingsV2CapabilityAvailable: false,
        settingsV2EnvRequested: false,
        settingsV2ReleaseAllowed: false,
        reasonCode: "flag_disabled",
      });
    }
  });

  it("keeps the explicit zero flag as a development rollback", () => {
    expect(
      resolveSettingsV2Gate({
        envValue: "0",
        releaseChannel: "development",
      }),
    ).toEqual({
      settingsV2CapabilityAvailable: false,
      settingsV2EnvRequested: false,
      settingsV2ReleaseAllowed: true,
      reasonCode: "flag_disabled",
    });
  });

  it("allows an explicit one flag only when the release channel is development", () => {
    expect(
      resolveSettingsV2Gate({
        envValue: "1",
        releaseChannel: "development",
      }),
    ).toMatchObject({
      settingsV2CapabilityAvailable: true,
      settingsV2EnvRequested: true,
      settingsV2ReleaseAllowed: true,
      reasonCode: "enabled",
    });
    expect(
      resolveSettingsV2Gate({
        envValue: "1",
        releaseChannel: "alpha",
      }),
    ).toMatchObject({
      settingsV2CapabilityAvailable: false,
      settingsV2EnvRequested: true,
      settingsV2ReleaseAllowed: false,
      reasonCode: "release_channel_not_allowed",
    });
  });

  it("fails closed for invalid environment flag values", () => {
    for (const envValue of ["true", "yes", "2", " 1 "]) {
      expect(
        resolveSettingsV2Gate({
          envValue,
          releaseChannel: "development",
        }),
      ).toEqual({
        settingsV2CapabilityAvailable: false,
        settingsV2EnvRequested: false,
        settingsV2ReleaseAllowed: true,
        reasonCode: "invalid_flag",
      });
    }
  });
});
