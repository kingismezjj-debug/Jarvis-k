import type { BrowserWindow, IpcMain, dialog as electronDialog } from "electron";
import {
  IPC_DESKTOP_PET_SKIN_PREVIEW_CANCEL_CHANNEL,
  IPC_DESKTOP_PET_SKIN_PREVIEW_RESOURCE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_PREVIEW_SELECT_CHANNEL,
  PetSkinPreviewResourceRequestSchema,
} from "@jarvis-k/contracts";
import type { PetSkinPreviewService } from "../pet-skin/pet-skin-preview-service";

type RegisterPetSkinPreviewIpcOptions = {
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  dialog: Pick<typeof electronDialog, "showOpenDialog">;
  getMainWindow: () => BrowserWindow | null;
  previewService: PetSkinPreviewService;
};

const channels = [
  IPC_DESKTOP_PET_SKIN_PREVIEW_SELECT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_PREVIEW_RESOURCE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_PREVIEW_CANCEL_CHANNEL,
] as const;

export function registerPetSkinPreviewIpc(
  options: RegisterPetSkinPreviewIpcOptions,
): () => void {
  unregisterPetSkinPreviewIpc(options.ipcMain);
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_PREVIEW_SELECT_CHANNEL,
    async (event) => {
      const mainWindow = options.getMainWindow();
      if (!isMainWindowSender(event.sender.id, mainWindow)) {
        return {
          ok: false,
          reasonCode: "preview_unavailable",
          safeMessage: "Skin preview is only available from the main window.",
        };
      }
      return options.previewService.selectPreview(mainWindow, options.dialog);
    },
  );
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_PREVIEW_RESOURCE_CHANNEL,
    async (event, rawInput) => {
      const mainWindow = options.getMainWindow();
      if (!isMainWindowSender(event.sender.id, mainWindow)) {
        return {
          ok: false,
          reasonCode: "preview_unavailable",
          safeMessage: "Skin preview resource is unavailable.",
        };
      }
      const parsed = PetSkinPreviewResourceRequestSchema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          ok: false,
          reasonCode: "unsafe_path",
          safeMessage: "Skin preview resource request is invalid.",
        };
      }
      return options.previewService.getPreviewResourceUrl(
        parsed.data.previewId,
        parsed.data.assetId,
      );
    },
  );
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_PREVIEW_CANCEL_CHANNEL,
    async (event) => {
      const mainWindow = options.getMainWindow();
      if (!isMainWindowSender(event.sender.id, mainWindow)) {
        return {
          ok: false,
          safeMessage: "Skin preview is only available from the main window.",
        };
      }
      return options.previewService.cancelPreview();
    },
  );
  return () => unregisterPetSkinPreviewIpc(options.ipcMain);
}

export function unregisterPetSkinPreviewIpc(
  ipcMain: Pick<IpcMain, "removeHandler">,
): void {
  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }
}

function isMainWindowSender(
  senderId: number,
  mainWindow: BrowserWindow | null,
): boolean {
  return mainWindow?.webContents.id === senderId;
}
