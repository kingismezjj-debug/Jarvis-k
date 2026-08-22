import type { BrowserWindow, IpcMain, IpcMainInvokeEvent, dialog as electronDialog, shell as electronShell } from "electron";
import {
  IPC_DESKTOP_PET_SKIN_STUDIO_DRAFT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_EXPORT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_METADATA_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_OPEN_EXPORT_FOLDER_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_PREVIEW_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_RESET_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_SELECT_ASSET_CHANNEL,
  PetSkinStudioMetadataUpdateRequestSchema,
  PetSkinStudioOpenExportFolderRequestSchema,
  PetSkinStudioSelectAssetRequestSchema,
} from "@jarvis-k/contracts";
import type { PetSkinStudioService } from "../pet-skin/pet-skin-studio-service";

type Dialog = Pick<typeof electronDialog, "showOpenDialog" | "showSaveDialog">;
type Shell = Pick<typeof electronShell, "showItemInFolder">;

const STUDIO_CHANNELS = [
  IPC_DESKTOP_PET_SKIN_STUDIO_DRAFT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_METADATA_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_SELECT_ASSET_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_PREVIEW_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_EXPORT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_RESET_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_OPEN_EXPORT_FOLDER_CHANNEL,
] as const;

export function registerPetSkinStudioIpc(options: {
  ipcMain: IpcMain;
  dialog: Dialog;
  shell: Shell;
  getMainWindow: () => BrowserWindow | null;
  studioService: PetSkinStudioService;
}): () => void {
  const isMainWindowSender = (event: IpcMainInvokeEvent) => {
    const mainWindow = options.getMainWindow();
    return Boolean(mainWindow && event.sender === mainWindow.webContents);
  };

  options.ipcMain.handle(IPC_DESKTOP_PET_SKIN_STUDIO_DRAFT_CHANNEL, (event) => {
    if (!isMainWindowSender(event)) {
      return { ok: false, reasonCode: "studio_unavailable", safeMessage: "Pet Skin Studio is unavailable." };
    }
    return options.studioService.getDraft();
  });

  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_STUDIO_METADATA_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        return { ok: false, reasonCode: "studio_unavailable", safeMessage: "Pet Skin Studio is unavailable." };
      }
      return options.studioService.updateMetadata(
        PetSkinStudioMetadataUpdateRequestSchema.parse(rawInput),
      );
    },
  );

  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_STUDIO_SELECT_ASSET_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        return { ok: false, reasonCode: "studio_unavailable", safeMessage: "Pet Skin Studio is unavailable." };
      }
      return options.studioService.selectAsset(
        options.getMainWindow(),
        options.dialog,
        PetSkinStudioSelectAssetRequestSchema.parse(rawInput),
      );
    },
  );

  options.ipcMain.handle(IPC_DESKTOP_PET_SKIN_STUDIO_PREVIEW_CHANNEL, (event) => {
    if (!isMainWindowSender(event)) {
      return { ok: false, reasonCode: "studio_unavailable", safeMessage: "Pet Skin Studio is unavailable." };
    }
    return options.studioService.previewDraft();
  });

  options.ipcMain.handle(IPC_DESKTOP_PET_SKIN_STUDIO_EXPORT_CHANNEL, (event) => {
    if (!isMainWindowSender(event)) {
      return { ok: false, reasonCode: "studio_unavailable", safeMessage: "Pet Skin Studio is unavailable." };
    }
    return options.studioService.exportDraft(options.getMainWindow(), options.dialog);
  });

  options.ipcMain.handle(IPC_DESKTOP_PET_SKIN_STUDIO_RESET_CHANNEL, (event) => {
    if (!isMainWindowSender(event)) {
      return { ok: false, reasonCode: "studio_unavailable", safeMessage: "Pet Skin Studio is unavailable." };
    }
    return options.studioService.reset();
  });

  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_STUDIO_OPEN_EXPORT_FOLDER_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        return { ok: false, reasonCode: "studio_unavailable", safeMessage: "Pet Skin Studio is unavailable." };
      }
      return options.studioService.openExportFolder(
        options.shell,
        PetSkinStudioOpenExportFolderRequestSchema.parse(rawInput),
      );
    },
  );

  return () => {
    for (const channel of STUDIO_CHANNELS) {
      options.ipcMain.removeHandler(channel);
    }
  };
}
