import { describe, expect, it, vi } from "vitest";
import {
  IPC_DESKTOP_PET_SKIN_PREVIEW_CANCEL_CHANNEL,
  IPC_DESKTOP_PET_SKIN_PREVIEW_RESOURCE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_PREVIEW_SELECT_CHANNEL,
} from "@jarvis-k/contracts";
import { registerPetSkinPreviewIpc } from "../src/ipc/register-pet-skin-preview-ipc";

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

describe("registerPetSkinPreviewIpc", () => {
  it("allows only the main window to select, read handles, and cancel previews", async () => {
    const ipcMain = new FakeIpcMain();
    const previewService = {
      selectPreview: vi.fn(async () => ({
        ok: false,
        reasonCode: "preview_cancelled",
        safeMessage: "cancelled",
      })),
      getPreviewResourceUrl: vi.fn(async () => ({
        ok: true,
        previewId: "preview123",
        assetId: "base",
        contentType: "image/png",
        byteLength: 24,
        resourceUrl: "jarvis-pet-skin-preview://preview123/base",
      })),
      cancelPreview: vi.fn(async () => ({ ok: true })),
    };

    const unregister = registerPetSkinPreviewIpc({
      ipcMain: ipcMain as never,
      dialog: { showOpenDialog: vi.fn() } as never,
      getMainWindow: () => ({ webContents: { id: 1 } }) as never,
      previewService: previewService as never,
    });

    expect(ipcMain.handlers.size).toBe(3);
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_PREVIEW_SELECT_CHANNEL, 1),
    ).resolves.toMatchObject({ ok: false, reasonCode: "preview_cancelled" });
    expect(previewService.selectPreview).toHaveBeenCalledTimes(1);

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_PREVIEW_RESOURCE_CHANNEL, 1, {
        previewId: "preview123",
        assetId: "base",
      }),
    ).resolves.toMatchObject({
      ok: true,
      resourceUrl: "jarvis-pet-skin-preview://preview123/base",
    });

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_PREVIEW_CANCEL_CHANNEL, 1),
    ).resolves.toMatchObject({ ok: true });

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_PREVIEW_SELECT_CHANNEL, 2),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "preview_unavailable",
    });
    expect(previewService.selectPreview).toHaveBeenCalledTimes(1);

    unregister();
    expect(ipcMain.handlers.size).toBe(0);
  });

  it("rejects invalid resource requests without calling the preview service", async () => {
    const ipcMain = new FakeIpcMain();
    const previewService = {
      selectPreview: vi.fn(),
      getPreviewResourceUrl: vi.fn(),
      cancelPreview: vi.fn(),
    };
    registerPetSkinPreviewIpc({
      ipcMain: ipcMain as never,
      dialog: { showOpenDialog: vi.fn() } as never,
      getMainWindow: () => ({ webContents: { id: 1 } }) as never,
      previewService: previewService as never,
    });

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_PREVIEW_RESOURCE_CHANNEL, 1, {
        previewId: "../bad",
        assetId: "base",
      }),
    ).resolves.toMatchObject({ ok: false, reasonCode: "unsafe_path" });
    expect(previewService.getPreviewResourceUrl).not.toHaveBeenCalled();
  });
});
