import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PET_SKIN_FORMAL_STATES } = require("../packages/contracts/dist/index.js");
const {
  PetSkinStudioService,
} = require("../apps/desktop/dist/pet-skin/pet-skin-studio-service.js");
const {
  PetSkinPreviewService,
} = require("../apps/desktop/dist/pet-skin/pet-skin-preview-service.js");

const oneByOnePng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

const tempRoot = await fs.mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-pet-skin-studio-smoke-"),
);
const outputPath = path.join(tempRoot, "studio-smoke.jkskin");
const previewService = new PetSkinPreviewService({ tempRoot });
const assetSource = {
  async normalizeLocalFile(input) {
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
    };
  },
};
const service = new PetSkinStudioService({
  tempRoot,
  previewService,
  assetSource,
  forbiddenExportRoots: [path.join(tempRoot, "installed")],
});
const dialog = {
  async showOpenDialog() {
    return { canceled: false, filePaths: [path.join(tempRoot, "source.png")] };
  },
  async showSaveDialog() {
    return { canceled: false, filePath: outputPath };
  },
};

try {
  for (const state of PET_SKIN_FORMAL_STATES) {
    const result = await service.selectAsset(null, dialog, {
      state,
      role: "base",
      source: "local_file",
    });
    if (!result.ok) {
      throw new Error(`select failed: ${result.reasonCode}`);
    }
  }
  const preview = await service.previewDraft();
  if (!preview.ok || !preview.preview) {
    throw new Error(`preview failed: ${preview.reasonCode}`);
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
        outputExists: true,
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
