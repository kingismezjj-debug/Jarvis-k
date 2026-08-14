import { contextBridge, ipcRenderer } from "electron";
import {
  VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL,
  VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL,
  TTS_PROVIDER_SETTINGS_CLEAR_CHANNEL,
  TTS_PROVIDER_SETTINGS_SAVE_CHANNEL,
  TTS_PROVIDER_SETTINGS_STATUS_CHANNEL,
  type VoiceProviderSettingsInput,
  type VoiceProviderSettingsResult,
  type TtsProviderSettingsInput,
  type TtsProviderSettingsResult
} from "./voice-settings-ipc";
import { VoiceServiceStatusSchema } from "@jarvis-k/contracts";
import { TtsServiceStatusSchema } from "@jarvis-k/contracts";

export interface VoiceSettingsBridge {
  getStatus(): Promise<unknown>;
  save(input: VoiceProviderSettingsInput): Promise<VoiceProviderSettingsResult>;
  clear(): Promise<VoiceProviderSettingsResult>;
  getTtsStatus(): Promise<unknown>;
  saveTts(
    input: TtsProviderSettingsInput
  ): Promise<TtsProviderSettingsResult>;
  clearTts(): Promise<TtsProviderSettingsResult>;
  close(): void;
}

const bridge: VoiceSettingsBridge = {
  getStatus: async () =>
    VoiceServiceStatusSchema.parse(
      await ipcRenderer.invoke(VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL)
    ),
  save: (input) =>
    ipcRenderer.invoke(VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL, {
      provider: input.provider,
      appId: input.appId,
      apiKey: input.apiKey,
      resourceId: input.resourceId,
      language: input.language
    }),
  clear: () => ipcRenderer.invoke(VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL),
  getTtsStatus: async () =>
    TtsServiceStatusSchema.parse(
      await ipcRenderer.invoke(TTS_PROVIDER_SETTINGS_STATUS_CHANNEL)
    ),
  saveTts: (input) =>
    ipcRenderer.invoke(TTS_PROVIDER_SETTINGS_SAVE_CHANNEL, {
      provider: input.provider,
      apiKey: input.apiKey,
      resourceId: input.resourceId,
      voiceId: input.voiceId
    }),
  clearTts: () => ipcRenderer.invoke(TTS_PROVIDER_SETTINGS_CLEAR_CHANNEL),
  close: () => ipcRenderer.send(VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL)
};

contextBridge.exposeInMainWorld("jarvisVoiceSettings", bridge);
