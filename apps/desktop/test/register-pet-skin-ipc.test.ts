import { describe, expect, it, vi } from "vitest";
import {
  IPC_DESKTOP_PET_SKIN_ACTIVATE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_INSTALL_PREVIEW_CHANNEL,
  IPC_DESKTOP_PET_SKIN_REGISTRY_CHANNEL,
  IPC_DESKTOP_PET_SKIN_REMOVE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_RENDER_FAILURE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_RETURN_BUILT_IN_CHANNEL,
} from "@jarvis-k/contracts";
import { registerPetSkinIpc } from "../src/ipc/register-pet-skin-ipc";

class FakeIpcMain {
  public readonly handlers = new Map<string, (...args: unknown[]) => unknown>();

  public handle(channel: string, handler: (...args: unknown[]) => unknown): void {
    this.handlers.set(channel, handler);
  }

  public removeHandler(channel: string): void {
    this.handlers.delete(channel);
  }

  public invoke(channel: string, senderId: number, input?: unknown): unknown {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({ sender: { id: senderId } }, input);
  }
}

const identity = {
  skinId: "local.lifecycle.ipc",
  skinVersion: "1.0.0",
  packageDigest: "a".repeat(64),
};

function projection() {
  return {
    builtInFallback: {
      skinId: "built-in.robot",
      trustState: "built_in_fallback",
      removable: false,
    },
    installedSkins: [],
    registryHealthy: true,
  };
}

function okResult() {
  return {
    ok: true,
    registry: projection(),
    safeMessage: "ok",
  };
}

function setup() {
  const ipcMain = new FakeIpcMain();
  const registryService = {
    activateSkin: vi.fn(async () => okResult()),
    getProjection: vi.fn(() => projection()),
    installFromPreview: vi.fn(async () => okResult()),
    removeSkin: vi.fn(async () => okResult()),
    reportRenderFailure: vi.fn(async () => okResult()),
    returnToBuiltIn: vi.fn(async () => okResult()),
  };
  const previewService = {
    getInstallSource: vi.fn(() => ({ previewId: "preview-1" })),
  };
  const onRegistryChanged = vi.fn();
  const mainWindow = { webContents: { id: 1 } };
  const petWindow = { webContents: { id: 2 } };

  const dispose = registerPetSkinIpc({
    ipcMain: ipcMain as never,
    getMainWindow: () => mainWindow as never,
    getPetWindow: () => petWindow as never,
    previewService: previewService as never,
    registryService: registryService as never,
    onRegistryChanged,
  });

  return { dispose, ipcMain, onRegistryChanged, previewService, registryService };
}

describe("registerPetSkinIpc", () => {
  it("allows the main window to install, activate, restore built-in, and remove skins", async () => {
    const { ipcMain, onRegistryChanged, previewService, registryService } = setup();

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_INSTALL_PREVIEW_CHANNEL, 1, {
        previewId: "preview-1",
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(previewService.getInstallSource).toHaveBeenCalledWith("preview-1");
    expect(registryService.installFromPreview).toHaveBeenCalledTimes(1);

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_ACTIVATE_CHANNEL, 1, identity),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_RETURN_BUILT_IN_CHANNEL, 1),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_REMOVE_CHANNEL, 1, identity),
    ).resolves.toMatchObject({ ok: true });
    expect(registryService.activateSkin).toHaveBeenCalledWith(identity);
    expect(registryService.returnToBuiltIn).toHaveBeenCalledTimes(1);
    expect(registryService.removeSkin).toHaveBeenCalledWith(identity);
    expect(onRegistryChanged).toHaveBeenCalledTimes(4);
  });

  it("keeps Pet and unknown senders away from skin management", async () => {
    const { ipcMain, onRegistryChanged, registryService } = setup();

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_INSTALL_PREVIEW_CHANNEL, 2, {
        previewId: "preview-1",
      }),
    ).resolves.toMatchObject({ ok: false, reasonCode: "install_unavailable" });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_ACTIVATE_CHANNEL, 99, identity),
    ).resolves.toMatchObject({ ok: false, reasonCode: "activation_unavailable" });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_REMOVE_CHANNEL, 2, identity),
    ).resolves.toMatchObject({ ok: false, reasonCode: "remove_unavailable" });
    expect(registryService.installFromPreview).not.toHaveBeenCalled();
    expect(registryService.activateSkin).not.toHaveBeenCalled();
    expect(registryService.removeSkin).not.toHaveBeenCalled();
    expect(onRegistryChanged).not.toHaveBeenCalled();
  });

  it("allows read-only registry projection and Pet-only render failure reports", async () => {
    const { ipcMain, onRegistryChanged, registryService } = setup();

    expect(ipcMain.invoke(IPC_DESKTOP_PET_SKIN_REGISTRY_CHANNEL, 99)).toMatchObject(
      { registryHealthy: true },
    );
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_RENDER_FAILURE_CHANNEL, 2, {
        packageDigest: "a".repeat(64),
        assetId: "base",
        reasonCode: "image_load_failed",
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(registryService.reportRenderFailure).toHaveBeenCalledWith("a".repeat(64));
    expect(onRegistryChanged).toHaveBeenCalledTimes(1);

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_RENDER_FAILURE_CHANNEL, 1, {
        packageDigest: "a".repeat(64),
        reasonCode: "image_load_failed",
      }),
    ).resolves.toMatchObject({ ok: false });
  });

  it("rejects invalid payloads and unregisters all handlers", async () => {
    const { dispose, ipcMain, registryService } = setup();

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_ACTIVATE_CHANNEL, 1, {
        skinId: "../bad",
        skinVersion: "1.0.0",
        packageDigest: "a".repeat(64),
      }),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_RENDER_FAILURE_CHANNEL, 2, {
        packageDigest: "not-a-digest",
        reasonCode: "image_load_failed",
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(registryService.activateSkin).not.toHaveBeenCalled();
    expect(registryService.reportRenderFailure).not.toHaveBeenCalled();

    dispose();
    expect(ipcMain.handlers.size).toBe(0);
  });
});
