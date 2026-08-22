import { describe, expect, it, vi } from "vitest";
import {
  IPC_DESKTOP_PET_SKIN_STUDIO_DRAFT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_EXPORT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_METADATA_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_OPEN_EXPORT_FOLDER_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_PREVIEW_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_RESET_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_SELECT_ASSET_CHANNEL,
} from "@jarvis-k/contracts";
import { registerPetSkinStudioIpc } from "../src/ipc/register-pet-skin-studio-ipc";

class FakeIpcMain {
  public readonly handlers = new Map<string, (...args: unknown[]) => unknown>();
  public readonly senders = new Map<number, { id: number }>();

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
    const sender = this.senders.get(senderId) ?? { id: senderId };
    return handler({ sender }, input);
  }
}

describe("registerPetSkinStudioIpc", () => {
  it("registers Studio commands only for the main window", async () => {
    const ipcMain = new FakeIpcMain();
    const mainWebContents = { id: 1 };
    ipcMain.senders.set(1, mainWebContents);
    const draftResult = { ok: true, draft: minimalDraft() };
    const studioService = {
      exportDraft: vi.fn(async () => draftResult),
      getDraft: vi.fn(async () => draftResult),
      openExportFolder: vi.fn(async () => draftResult),
      previewDraft: vi.fn(async () => draftResult),
      reset: vi.fn(async () => draftResult),
      selectAsset: vi.fn(async () => draftResult),
      updateMetadata: vi.fn(async () => draftResult),
    };

    const unregister = registerPetSkinStudioIpc({
      ipcMain: ipcMain as never,
      dialog: {
        showOpenDialog: vi.fn(),
        showSaveDialog: vi.fn(),
      } as never,
      shell: { showItemInFolder: vi.fn() } as never,
      getMainWindow: () => ({ webContents: mainWebContents }) as never,
      studioService: studioService as never,
    });

    expect(ipcMain.handlers.size).toBe(7);
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_DRAFT_CHANNEL, 1),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_METADATA_CHANNEL, 1, {
        displayName: "Studio",
        author: "Tester",
        license: "Test",
        skinVersion: "1.0.0",
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_SELECT_ASSET_CHANNEL, 1, {
        state: "idle",
        role: "base",
        source: "local_file",
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_PREVIEW_CHANNEL, 1),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_EXPORT_CHANNEL, 1),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_RESET_CHANNEL, 1),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_OPEN_EXPORT_FOLDER_CHANNEL, 1, {
        exportId: "a".repeat(24),
      }),
    ).resolves.toMatchObject({ ok: true });

    expect(ipcMain.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_DRAFT_CHANNEL, 2)).toMatchObject({
      ok: false,
      reasonCode: "studio_unavailable",
    });
    expect(studioService.getDraft).toHaveBeenCalledTimes(1);

    unregister();
    expect(ipcMain.handlers.size).toBe(0);
  });

  it("returns Studio image errors through IPC without throwing handler exceptions", async () => {
    const ipcMain = new FakeIpcMain();
    const mainWebContents = { id: 1 };
    ipcMain.senders.set(1, mainWebContents);
    const studioService = {
      exportDraft: vi.fn(),
      getDraft: vi.fn(),
      openExportFolder: vi.fn(),
      previewDraft: vi.fn(),
      reset: vi.fn(),
      selectAsset: vi.fn(async () => ({
        ok: false,
        reasonCode: "image_normalization_failed",
        safeMessage: "Image normalization failed.",
      })),
      updateMetadata: vi.fn(),
    };

    const unregister = registerPetSkinStudioIpc({
      ipcMain: ipcMain as never,
      dialog: {
        showOpenDialog: vi.fn(),
        showSaveDialog: vi.fn(),
      } as never,
      shell: { showItemInFolder: vi.fn() } as never,
      getMainWindow: () => ({ webContents: mainWebContents }) as never,
      studioService: studioService as never,
    });

    await expect(
      ipcMain.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_SELECT_ASSET_CHANNEL, 1, {
        state: "idle",
        role: "base",
        source: "local_file",
      }),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "image_normalization_failed",
    });
    unregister();
  });
});

function minimalDraft() {
  const state = {
    baseAssetId: "idle.base",
    stateGlyphAssetId: "idle.base",
    staticVariantAssetId: "idle.base",
    complete: true,
    reducedMotionComplete: true,
  };
  return {
    schemaVersion: 1,
    generatedSkinId: "local.studio.test",
    metadata: {
      displayName: "Studio",
      author: "Tester",
      license: "Test",
      skinVersion: "1.0.0",
    },
    states: {
      idle: state,
      listening: state,
      thinking: state,
      success: state,
      error: state,
      offline: state,
    },
    resources: {},
    validationIssues: [],
    readyForPreview: true,
    readyForExport: true,
    sourceKinds: ["local_file"],
  };
}
