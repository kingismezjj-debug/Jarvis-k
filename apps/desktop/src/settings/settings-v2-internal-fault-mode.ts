import type { ReleaseChannel } from "../storage/storage-profile";

export type SettingsV2InternalFaultMode =
  | "none"
  | "settings_v2_render_failure"
  | "settings_v2_mount_timeout";

export const SETTINGS_V2_INTERNAL_FAULT_FLAG =
  "--jarvis-internal-settings-v2-fault=";

const SETTINGS_V2_INTERNAL_FAULT_MODES = new Set<SettingsV2InternalFaultMode>([
  "settings_v2_render_failure",
  "settings_v2_mount_timeout",
]);

export function resolveSettingsV2InternalFaultMode(input: {
  readonly argv: readonly string[];
  readonly isPackaged: boolean;
  readonly releaseChannel: ReleaseChannel;
}): SettingsV2InternalFaultMode {
  if (!input.isPackaged || input.releaseChannel !== "alpha") {
    return "none";
  }

  const faultFlags = input.argv.filter((arg) =>
    arg.startsWith(SETTINGS_V2_INTERNAL_FAULT_FLAG),
  );
  if (faultFlags.length !== 1) {
    return "none";
  }

  const value = faultFlags[0]!.slice(SETTINGS_V2_INTERNAL_FAULT_FLAG.length);
  return SETTINGS_V2_INTERNAL_FAULT_MODES.has(
    value as SettingsV2InternalFaultMode,
  )
    ? (value as SettingsV2InternalFaultMode)
    : "none";
}
