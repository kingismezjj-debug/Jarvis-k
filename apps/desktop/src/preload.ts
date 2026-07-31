import { contextBridge, ipcRenderer } from "electron";
import {
  AppCommand,
  AppCommandSchema,
  EventEnvelopeSchema,
  IPC_COMMAND_CHANNEL,
  IPC_EVENT_CHANNEL,
  IPC_VOICE_SETTINGS_OPEN_CHANNEL,
  IPC_VOICE_SETTINGS_STATUS_CHANNEL,
  IPC_VOICE_AUDIO_CHANNEL,
  JarvisBridge,
  VoiceServiceStatusSchema,
  VoiceAudioFrame,
  VoiceAudioFrameSchema,
  createCommandEnvelope
} from "@jarvis-k/contracts";

async function sendCommand(command: AppCommand) {
  const validatedCommand = AppCommandSchema.parse(command);
  return ipcRenderer.invoke(
    IPC_COMMAND_CHANNEL,
    createCommandEnvelope(validatedCommand)
  );
}

function sendVoiceAudio(frame: VoiceAudioFrame): void {
  ipcRenderer.send(
    IPC_VOICE_AUDIO_CHANNEL,
    VoiceAudioFrameSchema.parse(frame)
  );
}

const bridge: JarvisBridge = {
  sendCommand,
  sendVoiceAudio,
  getSnapshot: () =>
    sendCommand({
      type: "agent.getSnapshot",
      payload: {}
    }),
  getVoiceServiceStatus: async () =>
    VoiceServiceStatusSchema.parse(
      await ipcRenderer.invoke(IPC_VOICE_SETTINGS_STATUS_CHANNEL)
    ),
  openVoiceSettings: async () =>
    VoiceServiceStatusSchema.parse(
      await ipcRenderer.invoke(IPC_VOICE_SETTINGS_OPEN_CHANNEL)
    ),
  onEvent: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, rawEvent: unknown) => {
      const parsed = EventEnvelopeSchema.safeParse(rawEvent);
      if (parsed.success) {
        listener(parsed.data);
      }
    };
    ipcRenderer.on(IPC_EVENT_CHANNEL, handler);
    return () => ipcRenderer.removeListener(IPC_EVENT_CHANNEL, handler);
  }
};

contextBridge.exposeInMainWorld("jarvis", bridge);
