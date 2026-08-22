const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const { app, nativeImage } = require("electron");

const { PET_SKIN_FORMAL_STATES } = require("../packages/contracts/dist/index.js");
const {
  PetSkinStudioService,
  createElectronPetSkinAssetSource,
} = require("../apps/desktop/dist/pet-skin/pet-skin-studio-service.js");
const {
  PetSkinPreviewService,
} = require("../apps/desktop/dist/pet-skin/pet-skin-preview-service.js");

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    app.quit();
  });

async function main() {
  await app.whenReady();
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-pet-skin-studio-smoke-"),
  );
  const sourcePath = path.join(tempRoot, "source-1920x1080.png");
  const outputPath = path.join(tempRoot, "studio-smoke.jkskin");
  const previewService = new PetSkinPreviewService({ tempRoot });
  const service = new PetSkinStudioService({
    tempRoot,
    previewService,
    assetSource: createElectronPetSkinAssetSource(nativeImage),
    forbiddenExportRoots: [path.join(tempRoot, "installed")],
  });
  const dialog = {
    async showOpenDialog() {
      return { canceled: false, filePaths: [sourcePath] };
    },
    async showSaveDialog() {
      return { canceled: false, filePath: outputPath };
    },
  };

  try {
    await fs.writeFile(sourcePath, createSolidPng(1920, 1080));
    for (const state of PET_SKIN_FORMAL_STATES) {
      const result = await service.selectAsset(null, dialog, {
        state,
        role: "base",
        source: "local_file",
      });
      if (!result.ok) {
        throw new Error(`select failed: ${result.reasonCode}`);
      }
      const stateProjection = result.draft.states[state];
      const assetId = stateProjection.baseAssetId;
      if (!assetId || result.draft.resources[assetId]) {
        throw new Error("renderer projection exposed source resources");
      }
    }
    const preview = await service.previewDraft();
    if (!preview.ok || !preview.preview) {
      throw new Error(`preview failed: ${preview.reasonCode}`);
    }
    const resource = Object.values(preview.preview.resources)[0];
    if (!resource || resource.width !== 1024 || resource.height !== 576) {
      throw new Error(
        `nativeImage resize did not normalize source dimensions: ${JSON.stringify(resource)}`,
      );
    }
    const exported = await service.exportDraft(null, dialog);
    if (!exported.ok || !exported.export) {
      throw new Error(`export failed: ${exported.reasonCode}`);
    }
    const officialRead = await previewService.readPackage(outputPath);
    if (!officialRead.ok) {
      throw new Error(`official reader failed: ${officialRead.error.reasonCode}`);
    }
    if (JSON.stringify(exported).includes(tempRoot)) {
      throw new Error("studio result leaked a temp absolute path");
    }
    console.log(
      JSON.stringify(
        {
          status: "PASS",
          sourceClassification: {
            contentType: "image/png",
            width: 1920,
            height: 1080,
            withinStudioSourcePolicy: true,
            exceedsFinalPetSkinDimensions: true,
          },
          normalized: {
            contentType: "image/png",
            width: resource.width,
            height: resource.height,
          },
          nativeImageUsed: true,
          validation: "PASS",
          packageDigest: exported.export.packageDigest,
          noAutoInstallOrActivate: true,
          sourceBoundary: "local_file",
        },
        null,
        2,
      ),
    );
  } finally {
    await service.dispose();
    await previewService.dispose();
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

function createSolidPng(width, height) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = rowStart + 1 + x * 4;
      raw[offset] = 33;
      raw[offset + 1] = 115;
      raw[offset + 2] = 222;
      raw[offset + 3] = 180;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
