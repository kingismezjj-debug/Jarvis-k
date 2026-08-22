import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  PET_SKIN_FORMAL_STATES,
} from "@jarvis-k/contracts";
import { PetSkinPreviewService } from "../src/pet-skin/pet-skin-preview-service";
import {
  PetSkinStudioService,
  createElectronPetSkinAssetSource,
  type PetSkinAssetSource,
} from "../src/pet-skin/pet-skin-studio-service";

const oneByOnePng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

describe("PetSkinStudioService", () => {
  it("creates a six-state draft, previews through the official reader, and exports a valid package", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const previewService = new PetSkinPreviewService({ tempRoot });
    const service = new PetSkinStudioService({
      tempRoot,
      previewService,
      assetSource: fakeAssetSource(),
      forbiddenExportRoots: [path.join(tempRoot, "installed-skins")],
    });
    const openDialog = {
      showOpenDialog: vi.fn(async () => ({
        canceled: false,
        filePaths: [path.join(tempRoot, "source.png")],
      })),
      showSaveDialog: vi.fn(async () => ({
        canceled: false,
        filePath: path.join(tempRoot, "exported.jkskin"),
      })),
    };

    for (const state of PET_SKIN_FORMAL_STATES) {
      const result = await service.selectAsset(null, openDialog, {
        state,
        role: "base",
        source: "local_file",
      });
      expect(result.ok).toBe(true);
      expect(JSON.stringify(result)).not.toContain("source.png");
    }

    const preview = await service.previewDraft();
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.preview?.trustState).toBe("validated_preview_package");
      expect(preview.draft.readyForExport).toBe(true);
    }

    const exported = await service.exportDraft(null, openDialog);
    expect(exported.ok).toBe(true);
    if (!exported.ok || !exported.export) {
      throw new Error("export failed");
    }
    expect(exported.export.validationStatus).toBe("PASS");
    expect(exported.export.fileName).toBe("exported.jkskin");
    expect(JSON.stringify(exported)).not.toContain(tempRoot);

    const officialRead = await previewService.readPackage(
      path.join(tempRoot, "exported.jkskin"),
    );
    expect(officialRead.ok).toBe(true);
    await service.dispose();
  });

  it("fails closed when reduced motion identities are missing", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const service = new PetSkinStudioService({
      tempRoot,
      previewService: new PetSkinPreviewService({ tempRoot }),
      assetSource: fakeAssetSource(),
    });
    const draft = await service.getDraft();

    expect(draft.ok).toBe(true);
    if (draft.ok) {
      expect(draft.draft.readyForExport).toBe(false);
      expect(draft.draft.validationIssues).toContain("idle: missing base asset");
    }
    await expect(service.previewDraft()).resolves.toMatchObject({
      ok: false,
      reasonCode: "missing_reduced_motion_variant",
    });
    await service.dispose();
  });

  it("rejects generated assets until a future source implementation is explicitly added", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const source = fakeAssetSource();
    const service = new PetSkinStudioService({
      tempRoot,
      previewService: new PetSkinPreviewService({ tempRoot }),
      assetSource: source,
    });
    const dialog = {
      showOpenDialog: vi.fn(),
      showSaveDialog: vi.fn(),
    };

    await expect(
      service.selectAsset(null, dialog, {
        state: "idle",
        role: "base",
        source: "generated_asset",
      }),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "unsupported_asset_source",
    });
    expect(source.normalizeLocalFile).not.toHaveBeenCalled();
    await service.dispose();
  });

  it("cleans temporary draft files on reset and dispose", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const service = new PetSkinStudioService({
      tempRoot,
      previewService: new PetSkinPreviewService({ tempRoot }),
      assetSource: fakeAssetSource(),
    });
    const dialog = {
      showOpenDialog: vi.fn(async () => ({
        canceled: false,
        filePaths: [path.join(tempRoot, "source.png")],
      })),
      showSaveDialog: vi.fn(),
    };
    await service.selectAsset(null, dialog, {
      state: "idle",
      role: "base",
      source: "local_file",
    });
    expect((await fs.readdir(tempRoot)).some((entry) => entry.includes("studio"))).toBe(
      true,
    );
    await service.reset();
    await service.dispose();
    expect((await fs.readdir(tempRoot)).some((entry) => entry.includes("studio"))).toBe(
      false,
    );
  });

  it("normalizer rejects bad magic before Electron image decoding", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const sourcePath = path.join(tempRoot, "bad.png");
    await fs.writeFile(sourcePath, "not an image");
    const source = createElectronPetSkinAssetSource({
      createFromBuffer: vi.fn(() => {
        throw new Error("should not decode");
      }),
    });

    await expect(
      source.normalizeLocalFile({
        sourcePath,
        assetId: "idle.base.test",
        packagePath: "assets/idle.base.test.png",
        destinationPath: path.join(tempRoot, "out.png"),
      }),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "invalid_image_metadata",
    });
  });
});

function fakeAssetSource(): PetSkinAssetSource & {
  normalizeLocalFile: ReturnType<typeof vi.fn>;
} {
  return {
    normalizeLocalFile: vi.fn(
      async (input: Parameters<PetSkinAssetSource["normalizeLocalFile"]>[0]) => {
        await fs.writeFile(input.destinationPath, oneByOnePng);
        return {
          ok: true,
          asset: {
            assetId: input.assetId,
            contentType: "image/png",
            bytes: oneByOnePng,
            byteLength: oneByOnePng.length,
            width: 1,
            height: 1,
            sha256: crypto.createHash("sha256").update(oneByOnePng).digest("hex"),
            source: "local_file",
            packagePath: input.packagePath,
            absolutePath: input.destinationPath,
          },
        } as const;
      },
    ),
  };
}
