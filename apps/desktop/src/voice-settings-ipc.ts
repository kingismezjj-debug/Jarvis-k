import type { VoiceServiceStatus } from "@jarvis-k/contracts";

export const VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL =
  "jarvis-k:voice-provider-settings:status";
export const VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL =
  "jarvis-k:voice-provider-settings:save";
export const VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL =
  "jarvis-k:voice-provider-settings:clear";
export const VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL =
  "jarvis-k:voice-provider-settings:close";
export const TTS_PROVIDER_SETTINGS_STATUS_CHANNEL =
  "jarvis-k:tts-settings-status";
export const TTS_PROVIDER_SETTINGS_SAVE_CHANNEL =
  "jarvis-k:tts-settings-save";
export const TTS_PROVIDER_SETTINGS_CLEAR_CHANNEL =
  "jarvis-k:tts-settings-clear";

export interface VoiceProviderSettingsInput {
  provider: "xunfei" | "volcengine";
  appId: string;
  apiKey: string;
  resourceId?: string;
  language: "zh" | "en";
}

export interface TtsProviderSettingsInput {
  provider: "doubao";
  apiKey: string;
  resourceId?: string;
  voiceId?: string;
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

export type TtsProviderSettingsResult =
  | {
      ok: true;
      status: import("@jarvis-k/contracts").TtsServiceStatus;
    }
  | {
      ok: false;
      message: string;
      status?: import("@jarvis-k/contracts").TtsServiceStatus;
    };
