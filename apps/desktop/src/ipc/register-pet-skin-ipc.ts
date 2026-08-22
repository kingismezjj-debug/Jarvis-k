import type { BrowserWindow, IpcMain } from "electron";
import {
  IPC_DESKTOP_PET_SKIN_ACTIVATE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_INSTALL_PREVIEW_CHANNEL,
  IPC_DESKTOP_PET_SKIN_REGISTRY_CHANNEL,
  IPC_DESKTOP_PET_SKIN_REMOVE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_RENDER_FAILURE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_RETURN_BUILT_IN_CHANNEL,
  PetSkinActivateRequestSchema,
  PetSkinInstallFromPreviewRequestSchema,
  PetSkinRemoveRequestSchema,
  PetSkinRenderFailureReportSchema,
  type PetSkinManagementResult,
} from "@jarvis-k/contracts";
import type { PetSkinPreviewService } from "../pet-skin/pet-skin-preview-service";
import type { PetSkinLocalRegistryService } from "../pet-skin/pet-skin-local-registry-service";

type RegisterPetSkinIpcOptions = {
  readonly ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  readonly getMainWindow: () => BrowserWindow | null;
  readonly getPetWindow: () => BrowserWindow | null;
  readonly previewService: PetSkinPreviewService;
  readonly registryService: PetSkinLocalRegistryService;
  readonly onRegistryChanged: () => void;
};

const PET_SKIN_CHANNELS = [
  IPC_DESKTOP_PET_SKIN_INSTALL_PREVIEW_CHANNEL,
  IPC_DESKTOP_PET_SKIN_REGISTRY_CHANNEL,
  IPC_DESKTOP_PET_SKIN_ACTIVATE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_RETURN_BUILT_IN_CHANNEL,
  IPC_DESKTOP_PET_SKIN_REMOVE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_RENDER_FAILURE_CHANNEL,
] as const;

export function registerPetSkinIpc(options: RegisterPetSkinIpcOptions): () => void {
  unregisterPetSkinIpc(options.ipcMain);
  options.ipcMain.handle(IPC_DESKTOP_PET_SKIN_REGISTRY_CHANNEL, (event) => {
    if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
      return options.registryService.getProjection();
    }
    return options.registryService.getProjection();
  });
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_INSTALL_PREVIEW_CHANNEL,
    async (event, rawInput: unknown) => {
      if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
        return unavailable("install_unavailable");
      }
      const parsed = PetSkinInstallFromPreviewRequestSchema.safeParse(rawInput);
      if (!parsed.success) {
        return unavailable("install_unavailable");
      }
      const result = await options.registryService.installFromPreview(
        options.previewService.getInstallSource(parsed.data.previewId),
      );
      options.onRegistryChanged();
      return result;
    },
  );
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_ACTIVATE_CHANNEL,
    async (event, rawInput: unknown) => {
      if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
        return unavailable("activation_unavailable");
      }
      const parsed = PetSkinActivateRequestSchema.safeParse(rawInput);
      if (!parsed.success) {
        return unavailable("activation_unavailable");
      }
      const result = await options.registryService.activateSkin(parsed.data);
      options.onRegistryChanged();
      return result;
    },
  );
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_RETURN_BUILT_IN_CHANNEL,
    async (event) => {
      if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
        return unavailable("activation_unavailable");
      }
      const result = await options.registryService.returnToBuiltIn();
      options.onRegistryChanged();
      return result;
    },
  );
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_REMOVE_CHANNEL,
    async (event, rawInput: unknown) => {
      if (!isMainWindowSender(options.getMainWindow(), event.sender.id)) {
        return unavailable("remove_unavailable");
      }
      const parsed = PetSkinRemoveRequestSchema.safeParse(rawInput);
      if (!parsed.success) {
        return unavailable("remove_unavailable");
      }
      const result = await options.registryService.removeSkin(parsed.data);
      options.onRegistryChanged();
      return result;
    },
  );
  options.ipcMain.handle(
    IPC_DESKTOP_PET_SKIN_RENDER_FAILURE_CHANNEL,
    async (event, rawInput: unknown) => {
      if (!isPetWindowSender(options.getPetWindow(), event.sender.id)) {
        return { ok: false, message: "Desktop Pet is unavailable." };
      }
      const parsed = PetSkinRenderFailureReportSchema.safeParse(rawInput);
      if (!parsed.success) {
        return { ok: false, message: "Desktop Pet skin failure report is invalid." };
      }
      await options.registryService.reportRenderFailure(parsed.data.packageDigest);
      options.onRegistryChanged();
      return { ok: true };
    },
  );
  return () => unregisterPetSkinIpc(options.ipcMain);
}

export function unregisterPetSkinIpc(
  ipcMain: Pick<IpcMain, "removeHandler">,
): void {
  for (const channel of PET_SKIN_CHANNELS) {
    ipcMain.removeHandler(channel);
  }
}

function isMainWindowSender(
  mainWindow: BrowserWindow | null,
  senderId: number,
): boolean {
  return mainWindow !== null && mainWindow.webContents.id === senderId;
}

function isPetWindowSender(
  petWindow: BrowserWindow | null,
  senderId: number,
): boolean {
  return petWindow !== null && petWindow.webContents.id === senderId;
}

function unavailable(
  reasonCode: Extract<PetSkinManagementResult, { ok: false }>["reasonCode"],
): PetSkinManagementResult {
  return {
    ok: false,
    reasonCode,
    safeMessage: "Desktop Pet skin management is unavailable.",
  };
}
