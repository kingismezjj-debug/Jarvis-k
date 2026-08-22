import { contextBridge, ipcRenderer } from "electron";
import {
  DesktopPetCommandResultSchema,
  DesktopPetPositionSchema,
  DesktopPetSettingsSchema,
  DesktopPetStateSchema,
  IPC_DESKTOP_PET_CONTEXT_MENU_CHANNEL,
  IPC_DESKTOP_PET_EVENT_CHANNEL,
  IPC_DESKTOP_PET_HIDE_CHANNEL,
  IPC_DESKTOP_PET_OPEN_MAIN_WINDOW_CHANNEL,
  IPC_DESKTOP_PET_SAVE_POSITION_CHANNEL,
  IPC_DESKTOP_PET_SETTINGS_CHANNEL,
  IPC_DESKTOP_PET_STATE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_RENDER_FAILURE_CHANNEL,
  PetSkinRenderFailureReportSchema,
  type DesktopPetPosition,
  type JarvisPetBridge,
} from "@jarvis-k/contracts";

const bridge: JarvisPetBridge = {
  getPetState: async () =>
    DesktopPetStateSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_STATE_CHANNEL),
    ),
  getPetSettings: async () =>
    DesktopPetSettingsSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SETTINGS_CHANNEL),
    ),
  onPetState: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, rawState: unknown) => {
      const parsed = DesktopPetStateSchema.safeParse(rawState);
      if (parsed.success) {
        listener(parsed.data);
      }
    };
    ipcRenderer.on(IPC_DESKTOP_PET_EVENT_CHANNEL, handler);
    return () => {
      ipcRenderer.removeListener(IPC_DESKTOP_PET_EVENT_CHANNEL, handler);
    };
  },
  openMainWindow: async () =>
    DesktopPetCommandResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_OPEN_MAIN_WINDOW_CHANNEL),
    ),
  hidePet: async () =>
    DesktopPetCommandResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_HIDE_CHANNEL),
    ),
  requestContextMenu: async () =>
    DesktopPetCommandResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_CONTEXT_MENU_CHANNEL),
    ),
  savePosition: async (position: DesktopPetPosition) =>
    DesktopPetCommandResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_DESKTOP_PET_SAVE_POSITION_CHANNEL,
        DesktopPetPositionSchema.parse(position),
      ),
    ),
  reportSkinRenderFailure: async (report) =>
    DesktopPetCommandResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_DESKTOP_PET_SKIN_RENDER_FAILURE_CHANNEL,
        PetSkinRenderFailureReportSchema.parse(report),
      ),
    ),
};

contextBridge.exposeInMainWorld("jarvisPet", bridge);
