import { contextBridge, ipcRenderer } from "electron";
import {
  VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL,
  VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL,
  type VoiceProviderSettingsInput,
  type VoiceProviderSettingsResult
} from "./voice-settings-ipc";
import { VoiceServiceStatusSchema } from "@jarvis-k/contracts";

export interface VoiceSettingsBridge {
  getStatus(): Promise<unknown>;
  save(input: VoiceProviderSettingsInput): Promise<VoiceProviderSettingsResult>;
  clear(): Promise<VoiceProviderSettingsResult>;
  close(): void;
}

const bridge: VoiceSettingsBridge = {
  getStatus: async () =>
    VoiceServiceStatusSchema.parse(
      await ipcRenderer.invoke(VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL)
    ),
  save: (input) =>
    ipcRenderer.invoke(VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL, {
      appId: input.appId,
      apiKey: input.apiKey,
      language: input.language
    }),
  clear: () => ipcRenderer.invoke(VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL),
  close: () => ipcRenderer.send(VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL)
};

contextBridge.exposeInMainWorld("jarvisVoiceSettings", bridge);

