import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  PET_SKIN_FORMAL_STATES,
  PET_SKIN_V1_POLICY,
} from "@jarvis-k/contracts";
import { PetSkinPreviewService } from "../src/pet-skin/pet-skin-preview-service";
import {
  PET_SKIN_STUDIO_SOURCE_IMAGE_POLICY,
  PetSkinStudioService,
  createElectronPetSkinAssetSource,
  type PetSkinAssetSource,
} from "../src/pet-skin/pet-skin-studio-service";

const oneByOnePng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

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

  it("normalizer accepts a small PNG without resizing", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const sourcePath = await writePngFixture(tempRoot, "small.png", 512, 512);
    const nativeImage = fakeNativeImage({ decodedWidth: 512, decodedHeight: 512 });
    const source = createElectronPetSkinAssetSource(nativeImage);

    const result = await source.normalizeLocalFile({
      sourcePath,
      assetId: "idle.base.test",
      packagePath: "assets/idle.base.test.png",
      destinationPath: path.join(tempRoot, "out.png"),
    });

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.asset.width).toBe(512);
      expect(result.asset.height).toBe(512);
      expect(result.asset.byteLength).toBeLessThanOrEqual(
        PET_SKIN_V1_POLICY.maxFileBytes,
      );
    }
    expect(nativeImage.image.resize).not.toHaveBeenCalled();
  });

  it("normalizer proportionally shrinks a 1920x1080 PNG into final Pet Skin limits", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const sourcePath = await writePngFixture(tempRoot, "desktop.png", 1920, 1080);
    const nativeImage = fakeNativeImage({ decodedWidth: 1920, decodedHeight: 1080 });
    const source = createElectronPetSkinAssetSource(nativeImage);

    const result = await source.normalizeLocalFile({
      sourcePath,
      assetId: "listening.base.test",
      packagePath: "assets/listening.base.test.png",
      destinationPath: path.join(tempRoot, "out.png"),
    });

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.asset.width).toBe(1024);
      expect(result.asset.height).toBe(576);
      expect(result.asset.width * result.asset.height).toBeLessThanOrEqual(
        PET_SKIN_V1_POLICY.maxImagePixels,
      );
    }
    expect(nativeImage.image.resize).toHaveBeenCalledWith({
      width: 1024,
      height: 576,
      quality: "best",
    });
  });

  it("normalizer preserves aspect ratio for horizontal and vertical sources", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const horizontalPath = await writePngFixture(tempRoot, "wide.png", 2000, 1000);
    const verticalPath = await writePngFixture(tempRoot, "tall.png", 1000, 2000);

    const wide = createElectronPetSkinAssetSource(
      fakeNativeImage({ decodedWidth: 2000, decodedHeight: 1000 }),
    );
    const tall = createElectronPetSkinAssetSource(
      fakeNativeImage({ decodedWidth: 1000, decodedHeight: 2000 }),
    );

    await expect(
      wide.normalizeLocalFile({
        sourcePath: horizontalPath,
        assetId: "thinking.base.wide",
        packagePath: "assets/thinking.base.wide.png",
        destinationPath: path.join(tempRoot, "wide-out.png"),
      }),
    ).resolves.toMatchObject({
      ok: true,
      asset: { width: 1024, height: 512 },
    });
    await expect(
      tall.normalizeLocalFile({
        sourcePath: verticalPath,
        assetId: "thinking.base.tall",
        packagePath: "assets/thinking.base.tall.png",
        destinationPath: path.join(tempRoot, "tall-out.png"),
      }),
    ).resolves.toMatchObject({
      ok: true,
      asset: { width: 512, height: 1024 },
    });
  });

  it("normalizer keeps PNG alpha-capable output metadata", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const sourcePath = await writePngFixture(tempRoot, "alpha.png", 512, 512);
    const alphaPng = pngWithMetadata(512, 512, 6);
    const source = createElectronPetSkinAssetSource(
      fakeNativeImage({ decodedWidth: 512, decodedHeight: 512, outputBytes: alphaPng }),
    );

    const result = await source.normalizeLocalFile({
      sourcePath,
      assetId: "success.base.alpha",
      packagePath: "assets/success.base.alpha.png",
      destinationPath: path.join(tempRoot, "alpha-out.png"),
    });

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.asset.bytes[25]).toBe(6);
    }
  });

  it("normalizer rejects source files above the Studio source byte limit", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const sourcePath = path.join(tempRoot, "huge.png");
    const file = await fs.open(sourcePath, "w");
    await file.truncate(PET_SKIN_STUDIO_SOURCE_IMAGE_POLICY.maxSourceFileBytes + 1);
    await file.close();
    const nativeImage = { createFromBuffer: vi.fn() };
    const source = createElectronPetSkinAssetSource(nativeImage);

    await expect(
      source.normalizeLocalFile({
        sourcePath,
        assetId: "error.base.huge",
        packagePath: "assets/error.base.huge.png",
        destinationPath: path.join(tempRoot, "out.png"),
      }),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "source_image_too_large",
    });
    expect(nativeImage.createFromBuffer).not.toHaveBeenCalled();
  });

  it("normalizer rejects source pixel bombs before Electron decode", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const sourcePath = await writePngFixture(tempRoot, "pixel-bomb.png", 9000, 9000);
    const nativeImage = { createFromBuffer: vi.fn() };
    const source = createElectronPetSkinAssetSource(nativeImage);

    await expect(
      source.normalizeLocalFile({
        sourcePath,
        assetId: "error.base.pixel",
        packagePath: "assets/error.base.pixel.png",
        destinationPath: path.join(tempRoot, "out.png"),
      }),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "source_image_too_large",
    });
    expect(nativeImage.createFromBuffer).not.toHaveBeenCalled();
  });

  it("normalizer maps decode, resize, encode, and write failures to fixed safe errors", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const sourcePath = await writePngFixture(tempRoot, "source.png", 1920, 1080);

    await expect(
      createElectronPetSkinAssetSource({
        createFromBuffer: vi.fn(() => {
          throw new Error("boom");
        }),
      }).normalizeLocalFile({
        sourcePath,
        assetId: "idle.base.decode",
        packagePath: "assets/idle.base.decode.png",
        destinationPath: path.join(tempRoot, "decode.png"),
      }),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "image_decode_failed",
      safeMessage: "Image file could not be decoded.",
    });

    await expect(
      createElectronPetSkinAssetSource(
        fakeNativeImage({
          decodedWidth: 1920,
          decodedHeight: 1080,
          throwResize: true,
        }),
      ).normalizeLocalFile({
        sourcePath,
        assetId: "idle.base.resize",
        packagePath: "assets/idle.base.resize.png",
        destinationPath: path.join(tempRoot, "resize.png"),
      }),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "image_normalization_failed",
    });

    await expect(
      createElectronPetSkinAssetSource(
        fakeNativeImage({
          decodedWidth: 512,
          decodedHeight: 512,
          throwToPng: true,
        }),
      ).normalizeLocalFile({
        sourcePath,
        assetId: "idle.base.encode",
        packagePath: "assets/idle.base.encode.png",
        destinationPath: path.join(tempRoot, "encode.png"),
      }),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "image_normalization_failed",
    });

    const blockingFile = path.join(tempRoot, "blocking-file");
    await fs.writeFile(blockingFile, "not a directory");
    await expect(
      createElectronPetSkinAssetSource(
        fakeNativeImage({ decodedWidth: 512, decodedHeight: 512 }),
      ).normalizeLocalFile({
        sourcePath,
        assetId: "idle.base.write",
        packagePath: "assets/idle.base.write.png",
        destinationPath: path.join(blockingFile, "out.png"),
      }),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "studio_write_failed",
    });
  });

  it("Studio selection returns fixed errors without leaking the source path", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-studio-test-"));
    const selectedPath = path.join(tempRoot, "private-source.png");
    const service = new PetSkinStudioService({
      tempRoot,
      previewService: new PetSkinPreviewService({ tempRoot }),
      assetSource: {
        normalizeLocalFile: vi.fn(async () => ({
          ok: false,
          reasonCode: "image_normalization_failed",
          safeMessage: "Image normalization failed.",
        })),
      },
    });
    const result = await service.selectAsset(
      null,
      {
        showOpenDialog: vi.fn(async () => ({
          canceled: false,
          filePaths: [selectedPath],
        })),
        showSaveDialog: vi.fn(),
      },
      { state: "idle", role: "base", source: "local_file" },
    );

    expect(result).toMatchObject({
      ok: false,
      reasonCode: "image_normalization_failed",
    });
    expect(JSON.stringify(result)).not.toContain(selectedPath);
    await service.dispose();
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

function fakeNativeImage(options: {
  decodedWidth: number;
  decodedHeight: number;
  outputBytes?: Buffer;
  throwResize?: boolean;
  throwToPng?: boolean;
}) {
  const image = {
    isEmpty: vi.fn(() => false),
    getSize: vi.fn(() => ({
      width: options.decodedWidth,
      height: options.decodedHeight,
    })),
    resize: vi.fn(
      (resizeOptions: { width?: number; height?: number; quality?: string }) => {
        if (options.throwResize) {
          throw new Error("resize failed");
        }
        const width = resizeOptions.width ?? options.decodedWidth;
        const height = resizeOptions.height ?? options.decodedHeight;
        return {
          isEmpty: vi.fn(() => false),
          getSize: vi.fn(() => ({ width, height })),
          resize: vi.fn(),
          toPNG: vi.fn(() => options.outputBytes ?? pngWithMetadata(width, height)),
        };
      },
    ),
    toPNG: vi.fn(() => {
      if (options.throwToPng) {
        throw new Error("encode failed");
      }
      return (
        options.outputBytes ??
        pngWithMetadata(options.decodedWidth, options.decodedHeight)
      );
    }),
  };
  return { createFromBuffer: vi.fn(() => image), image };
}

async function writePngFixture(
  directory: string,
  fileName: string,
  width: number,
  height: number,
): Promise<string> {
  const filePath = path.join(directory, fileName);
  await fs.writeFile(filePath, pngWithMetadata(width, height));
  return filePath;
}

function pngWithMetadata(width: number, height: number, colorType = 6): Buffer {
  const bytes = Buffer.alloc(33);
  PNG_SIGNATURE.copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  bytes[24] = 8;
  bytes[25] = colorType;
  bytes[26] = 0;
  bytes[27] = 0;
  bytes[28] = 0;
  bytes.writeUInt32BE(0, 29);
  return bytes;
}
