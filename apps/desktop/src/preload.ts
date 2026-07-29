import { contextBridge, ipcRenderer } from "electron";
import {
  AppCommand,
  AppCommandSchema,
  EventEnvelopeSchema,
  IPC_COMMAND_CHANNEL,
  IPC_EVENT_CHANNEL,
  JarvisBridge,
  createCommandEnvelope
} from "@jarvis-k/contracts";

async function sendCommand(command: AppCommand) {
  const validatedCommand = AppCommandSchema.parse(command);
  return ipcRenderer.invoke(
    IPC_COMMAND_CHANNEL,
    createCommandEnvelope(validatedCommand)
  );
}

const bridge: JarvisBridge = {
  sendCommand,
  getSnapshot: () =>
    sendCommand({
      type: "agent.getSnapshot",
      payload: {}
    }),
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
