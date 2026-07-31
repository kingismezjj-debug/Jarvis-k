import type { VoiceServiceStatus } from "@jarvis-k/contracts";

export const VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL =
  "jarvis-k:voice-provider-settings:status";
export const VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL =
  "jarvis-k:voice-provider-settings:save";
export const VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL =
  "jarvis-k:voice-provider-settings:clear";
export const VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL =
  "jarvis-k:voice-provider-settings:close";

export interface VoiceProviderSettingsInput {
  appId: string;
  apiKey: string;
  language: "zh" | "en";
}

export type VoiceProviderSettingsResult =
  | {
      ok: true;
      status: VoiceServiceStatus;
    }
  | {
      ok: false;
      message: string;
      status?: VoiceServiceStatus;
    };

