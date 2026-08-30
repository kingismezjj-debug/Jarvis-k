import type { UiSurfaceCapabilityStatus } from "@jarvis-k/contracts";
import type { ReleaseChannel } from "../storage/storage-profile";

export interface SettingsV2GateDecision {
  settingsV2CapabilityAvailable: boolean;
  settingsV2EnvRequested: boolean;
  settingsV2ReleaseAllowed: boolean;
  reasonCode: UiSurfaceCapabilityStatus["reasonCode"];
}

export function resolveSettingsV2Gate(input: {
  envValue: string | undefined;
  releaseChannel: ReleaseChannel;
}): SettingsV2GateDecision {
  const settingsV2ReleaseAllowed = input.releaseChannel === "development";
  const envValue = input.envValue;

  if (envValue === "1") {
    return {
      settingsV2CapabilityAvailable: settingsV2ReleaseAllowed,
      settingsV2EnvRequested: true,
      settingsV2ReleaseAllowed,
      reasonCode: settingsV2ReleaseAllowed
        ? "enabled"
        : "release_channel_not_allowed",
    };
  }

  if (envValue === "0") {
    return {
      settingsV2CapabilityAvailable: false,
      settingsV2EnvRequested: false,
      settingsV2ReleaseAllowed,
      reasonCode: "flag_disabled",
    };
  }

  if (envValue !== undefined && envValue.trim().length > 0) {
    return {
      settingsV2CapabilityAvailable: false,
      settingsV2EnvRequested: false,
      settingsV2ReleaseAllowed,
      reasonCode: "invalid_flag",
    };
  }

  return {
    settingsV2CapabilityAvailable: settingsV2ReleaseAllowed,
    settingsV2EnvRequested: false,
    settingsV2ReleaseAllowed,
    reasonCode: settingsV2ReleaseAllowed
      ? "development_default_enabled"
      : "flag_disabled",
  };
}
