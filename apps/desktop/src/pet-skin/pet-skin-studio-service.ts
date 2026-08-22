import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  BrowserWindow,
  dialog as electronDialog,
  shell as electronShell,
} from "electron";
import yazl from "yazl";
import {
  PET_SKIN_FORMAL_STATES,
  PET_SKIN_SCHEMA_VERSION,
  PET_SKIN_V1_MANIFEST_PATH,
  PET_SKIN_V1_POLICY,
  PetSkinManifestV1Schema,
  type PetSkinAsset,
  type PetSkinFormalState,
  type PetSkinManifestV1,
  type PetSkinPackageResource,
  type PetSkinPreviewMetadata,
  type PetSkinStudioAssetRole,
  type PetSkinStudioAssetSource,
  type PetSkinStudioDraftProjection,
  type PetSkinStudioExportResult,
  type PetSkinStudioMetadataUpdateRequest,
  type PetSkinStudioOpenExportFolderRequest,
  type PetSkinStudioResult,
  type PetSkinStudioSelectAssetRequest,
  createPetSkinPackageDigestPayload,
  validatePetSkinManifestV1,
} from "@jarvis-k/contracts";
import { PetSkinPreviewService } from "./pet-skin-preview-service";

const STUDIO_DIR_PREFIX = "jarvis-k-pet-skin-studio-";
const EXPORT_ID_BYTES = 12;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

type Dialog = Pick<typeof electronDialog, "showOpenDialog" | "showSaveDialog">;
type Shell = Pick<typeof electronShell, "showItemInFolder">;

export type PetSkinNormalizedAssetInput = {
  assetId: string;
  contentType: "image/png";
  bytes: Buffer;
  byteLength: number;
  width: number;
  height: number;
  sha256: string;
  source: PetSkinStudioAssetSource;
  packagePath: string;
  absolutePath: string;
};

export type PetSkinAssetSource = {
  normalizeLocalFile(input: {
    sourcePath: string;
    assetId: string;
    packagePath: string;
    destinationPath: string;
  }): Promise<
    | { ok: true; asset: PetSkinNormalizedAssetInput }
    | {
        ok: false;
        reasonCode: Extract<
          PetSkinStudioResult,
          { ok: false }
        >["reasonCode"];
        safeMessage: string;
      }
  >;
};

type NativeImageLike = {
  createFromBuffer(bytes: Buffer): {
    isEmpty(): boolean;
    getSize(): { width: number; height: number };
    toPNG(): Buffer | Uint8Array;
  };
};

type StateDraft = {
  baseAssetId?: string;
  stateGlyphAssetId?: string;
  staticVariantAssetId?: string;
};

type Draft = {
  directory: string;
  generatedSkinId: string;
  metadata: PetSkinStudioMetadataUpdateRequest;
  states: Record<PetSkinFormalState, StateDraft>;
  assets: Map<string, PetSkinNormalizedAssetInput>;
  lastPreview?: PetSkinPreviewMetadata;
};

export class PetSkinStudioService {
  private draft: Draft | null = null;
  private readonly tempRoot: string;
  private readonly currentJarvisVersion: string;
  private readonly previewService: PetSkinPreviewService;
  private readonly assetSource: PetSkinAssetSource;
  private readonly forbiddenExportRoots: string[];
  private readonly exports = new Map<string, string>();

  public constructor(options: {
    previewService: PetSkinPreviewService;
    assetSource: PetSkinAssetSource;
    tempRoot?: string;
    currentJarvisVersion?: string;
    forbiddenExportRoots?: string[];
  }) {
    this.previewService = options.previewService;
    this.assetSource = options.assetSource;
    this.tempRoot = options.tempRoot ?? os.tmpdir();
    this.currentJarvisVersion = options.currentJarvisVersion ?? "0.1.0";
    this.forbiddenExportRoots = options.forbiddenExportRoots ?? [];
  }

  public static async cleanupStaleStudioDirectories(
    tempRoot = os.tmpdir(),
  ): Promise<void> {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(tempRoot);
    } catch {
      return;
    }
    await Promise.all(
      entries
        .filter((entry) => entry.startsWith(STUDIO_DIR_PREFIX))
        .map((entry) =>
          fs.rm(path.join(tempRoot, entry), { force: true, recursive: true }),
        ),
    );
  }

  public async getDraft(): Promise<PetSkinStudioResult> {
    const draft = await this.ensureDraft();
    return { ok: true, draft: this.project(draft) };
  }

  public async updateMetadata(
    input: PetSkinStudioMetadataUpdateRequest,
  ): Promise<PetSkinStudioResult> {
    const draft = await this.ensureDraft();
    draft.metadata = {
      ...input,
      ...(input.description ? { description: input.description } : {}),
    };
    return { ok: true, draft: this.project(draft) };
  }

  public async selectAsset(
    ownerWindow: BrowserWindow | null,
    dialog: Dialog,
    request: PetSkinStudioSelectAssetRequest,
  ): Promise<PetSkinStudioResult> {
    if (request.source !== "local_file") {
      return this.fail(
        "unsupported_asset_source",
        "Only local file assets are supported in this version.",
      );
    }
    const selected = ownerWindow
      ? await dialog.showOpenDialog(ownerWindow, openImageDialogOptions())
      : await dialog.showOpenDialog(openImageDialogOptions());
    if (selected.canceled || selected.filePaths.length !== 1) {
      return this.fail("image_cancelled", "Image selection was cancelled.");
    }
    const draft = await this.ensureDraft();
    const assetId = `${request.state}.${roleSlug(request.role)}.${crypto
      .randomBytes(5)
      .toString("hex")}`;
    const packagePath = `assets/${assetId}.png`;
    const destinationPath = path.join(draft.directory, packagePath);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    const normalized = await this.assetSource.normalizeLocalFile({
      sourcePath: selected.filePaths[0] ?? "",
      assetId,
      packagePath,
      destinationPath,
    });
    if (!normalized.ok) {
      return this.fail(normalized.reasonCode, normalized.safeMessage, draft);
    }
    draft.assets.set(assetId, normalized.asset);
    this.assignRole(draft.states[request.state], request.role, assetId);
    if (request.role === "base") {
      const state = draft.states[request.state];
      state.stateGlyphAssetId ??= assetId;
      state.staticVariantAssetId ??= assetId;
    }
    delete draft.lastPreview;
    return { ok: true, draft: this.project(draft) };
  }

  public async previewDraft(): Promise<PetSkinStudioResult> {
    const draft = await this.ensureDraft();
    const packageResult = await this.writeDraftPackage(
      path.join(draft.directory, "preview.jkskin"),
      draft,
    );
    if (!packageResult.ok) {
      return this.fail(packageResult.reasonCode, packageResult.safeMessage, draft);
    }
    const preview = await this.previewService.createPreviewFromPackage(
      packageResult.packagePath,
    );
    if (!preview.ok) {
      return this.fail(preview.reasonCode, preview.safeMessage, draft);
    }
    draft.lastPreview = preview.preview;
    return { ok: true, draft: this.project(draft), preview: preview.preview };
  }

  public async exportDraft(
    ownerWindow: BrowserWindow | null,
    dialog: Dialog,
  ): Promise<PetSkinStudioResult> {
    const draft = await this.ensureDraft();
    const packageName = `${safeFileStem(draft.metadata.displayName)}.jkskin`;
    const selected = ownerWindow
      ? await dialog.showSaveDialog(ownerWindow, saveDialogOptions(packageName))
      : await dialog.showSaveDialog(saveDialogOptions(packageName));
    if (selected.canceled || !selected.filePath) {
      return this.fail("export_cancelled", "Skin export was cancelled.", draft);
    }
    const outputPath = ensureJkskinExtension(path.resolve(selected.filePath));
    if (!path.isAbsolute(outputPath) || this.isForbiddenExportPath(outputPath)) {
      return this.fail("unsafe_path", "Skin export path is not allowed.", draft);
    }
    const tempPath = path.join(
      path.dirname(outputPath),
      `.${path.basename(outputPath)}.${crypto.randomBytes(6).toString("hex")}.tmp`,
    );
    const packageResult = await this.writeDraftPackage(tempPath, draft);
    if (!packageResult.ok) {
      await fs.rm(tempPath, { force: true });
      return this.fail(packageResult.reasonCode, packageResult.safeMessage, draft);
    }
    const validation = await this.previewService.readPackage(tempPath);
    if (validation.ok === false) {
      const failure = validation as {
        error: {
          reasonCode: Extract<
            PetSkinStudioResult,
            { ok: false }
          >["reasonCode"];
          safeMessage: string;
        };
      };
      await fs.rm(tempPath, { force: true });
      return this.fail(failure.error.reasonCode, failure.error.safeMessage, draft);
    }
    await fs.rename(tempPath, outputPath);
    const bytes = await fs.readFile(outputPath);
    const exportId = crypto.randomBytes(EXPORT_ID_BYTES).toString("hex");
    this.exports.set(exportId, outputPath);
    const exportResult: PetSkinStudioExportResult = {
      exportId,
      fileName: path.basename(outputPath),
      byteLength: bytes.length,
      sha256: sha256(bytes),
      packageDigest: packageResult.packageDigest,
      validationStatus: "PASS",
    };
    return {
      ok: true,
      draft: this.project(draft),
      export: exportResult,
    };
  }

  public async openExportFolder(
    shell: Shell,
    request: PetSkinStudioOpenExportFolderRequest,
  ): Promise<PetSkinStudioResult> {
    const filePath = this.exports.get(request.exportId);
    if (!filePath) {
      return this.fail("preview_unavailable", "Exported skin file is unavailable.");
    }
    shell.showItemInFolder(filePath);
    const draft = await this.ensureDraft();
    return { ok: true, draft: this.project(draft) };
  }

  public async reset(): Promise<PetSkinStudioResult> {
    const previous = this.draft;
    this.draft = null;
    await this.cleanupDraft(previous);
    const draft = await this.ensureDraft();
    return { ok: true, draft: this.project(draft) };
  }

  public async dispose(): Promise<void> {
    const previous = this.draft;
    this.draft = null;
    await this.cleanupDraft(previous);
  }

  private async ensureDraft(): Promise<Draft> {
    if (this.draft) {
      return this.draft;
    }
    const directory = await fs.mkdtemp(path.join(this.tempRoot, STUDIO_DIR_PREFIX));
    const generatedSkinId = `local.studio.${crypto.randomBytes(6).toString("hex")}`;
    this.draft = {
      directory,
      generatedSkinId,
      metadata: {
        displayName: "My Jarvis-K Pet Skin",
        description: "Local asset-only pet skin.",
        author: "Local User",
        license: "Personal Use",
        skinVersion: "1.0.0",
      },
      states: Object.fromEntries(
        PET_SKIN_FORMAL_STATES.map((state) => [state, {}]),
      ) as Record<PetSkinFormalState, StateDraft>,
      assets: new Map(),
    };
    return this.draft;
  }

  private project(draft: Draft): PetSkinStudioDraftProjection {
    const validationIssues = this.validationIssues(draft);
    const states = Object.fromEntries(
      PET_SKIN_FORMAL_STATES.map((state) => {
        const draftState = draft.states[state];
        const complete = Boolean(
          draftState.baseAssetId &&
            (draftState.stateGlyphAssetId || draftState.staticVariantAssetId),
        );
        const reducedMotionComplete = Boolean(
          draftState.baseAssetId &&
            (draftState.staticVariantAssetId || draftState.stateGlyphAssetId),
        );
        return [
          state,
          {
            ...(draftState.baseAssetId
              ? { baseAssetId: draftState.baseAssetId }
              : {}),
            ...(draftState.stateGlyphAssetId
              ? { stateGlyphAssetId: draftState.stateGlyphAssetId }
              : {}),
            ...(draftState.staticVariantAssetId
              ? { staticVariantAssetId: draftState.staticVariantAssetId }
              : {}),
            complete,
            reducedMotionComplete,
          },
        ];
      }),
    ) as PetSkinStudioDraftProjection["states"];
    return {
      schemaVersion: 1,
      generatedSkinId: draft.generatedSkinId,
      metadata: draft.metadata,
      states,
      resources: {},
      validationIssues,
      readyForPreview: validationIssues.length === 0,
      readyForExport: validationIssues.length === 0,
      sourceKinds: ["local_file"],
    };
  }

  private validationIssues(draft: Draft): string[] {
    const issues: string[] = [];
    for (const state of PET_SKIN_FORMAL_STATES) {
      const visual = draft.states[state];
      if (!visual.baseAssetId) {
        issues.push(`${state}: missing base asset`);
      }
      if (!visual.stateGlyphAssetId && !visual.staticVariantAssetId) {
        issues.push(`${state}: missing state glyph or static variant`);
      }
      if (!visual.staticVariantAssetId && !visual.stateGlyphAssetId) {
        issues.push(`${state}: missing reduced motion static identity`);
      }
    }
    return issues;
  }

  private async writeDraftPackage(
    packagePath: string,
    draft: Draft,
  ): Promise<
    | { ok: true; packagePath: string; packageDigest: string }
    | {
        ok: false;
        reasonCode: Extract<PetSkinStudioResult, { ok: false }>["reasonCode"];
        safeMessage: string;
      }
  > {
    const manifestResult = this.createManifest(draft);
    if (!manifestResult.ok) {
      return manifestResult;
    }
    await writeZipPackage(packagePath, {
      manifest: manifestResult.manifest,
      assets: Array.from(draft.assets.values()),
    });
    return {
      ok: true,
      packagePath,
      packageDigest: manifestResult.manifest.packageDigest,
    };
  }

  private createManifest(
    draft: Draft,
  ):
    | { ok: true; manifest: PetSkinManifestV1 }
    | {
        ok: false;
        reasonCode: Extract<PetSkinStudioResult, { ok: false }>["reasonCode"];
        safeMessage: string;
      } {
    const issues = this.validationIssues(draft);
    if (issues.length > 0) {
      return {
        ok: false,
        reasonCode: issues.some((issue) => issue.includes("reduced"))
          ? "missing_reduced_motion_variant"
          : "missing_state",
        safeMessage: "Skin Studio draft is incomplete.",
      };
    }
    const assets = Object.fromEntries(
      Array.from(draft.assets.values()).map((asset) => [
        asset.assetId,
        {
          path: asset.packagePath,
          contentType: asset.contentType,
          byteLength: asset.byteLength,
          width: asset.width,
          height: asset.height,
          sha256: asset.sha256,
        } satisfies PetSkinAsset,
      ]),
    );
    const states = Object.fromEntries(
      PET_SKIN_FORMAL_STATES.map((state) => {
        const visual = draft.states[state];
        return [
          state,
          {
            baseAsset: visual.baseAssetId!,
            ...(visual.stateGlyphAssetId
              ? { stateGlyph: visual.stateGlyphAssetId }
              : {}),
            ...(visual.staticVariantAssetId
              ? {
                  frameSequence: {
                    frames: [visual.baseAssetId!, visual.staticVariantAssetId],
                    frameRate: 4,
                  },
                }
              : {}),
          },
        ];
      }),
    );
    const reducedMotion = {
      states: Object.fromEntries(
        PET_SKIN_FORMAL_STATES.map((state) => {
          const visual = draft.states[state];
          return [
            state,
            {
              baseAsset: visual.baseAssetId!,
              ...(visual.stateGlyphAssetId
                ? { stateGlyph: visual.stateGlyphAssetId }
                : {}),
              ...(visual.staticVariantAssetId
                ? { staticVariant: visual.staticVariantAssetId }
                : {}),
            },
          ];
        }),
      ),
    };
    const manifestWithoutDigest = {
      schemaVersion: PET_SKIN_SCHEMA_VERSION,
      skinId: draft.generatedSkinId,
      skinVersion: draft.metadata.skinVersion,
      displayName: draft.metadata.displayName,
      ...(draft.metadata.description
        ? { description: draft.metadata.description }
        : {}),
      author: draft.metadata.author,
      license: draft.metadata.license,
      minimumJarvisVersion: this.currentJarvisVersion,
      assets,
      states,
      reducedMotion,
      packageDigest: "0".repeat(64),
    };
    const parsedWithoutDigest =
      PetSkinManifestV1Schema.safeParse(manifestWithoutDigest);
    if (!parsedWithoutDigest.success) {
      return {
        ok: false,
        reasonCode: "invalid_manifest",
        safeMessage: "Skin Studio manifest metadata is invalid.",
      };
    }
    const resources: PetSkinPackageResource[] = Array.from(draft.assets.values()).map(
      (asset) => ({
        path: asset.packagePath,
        contentType: asset.contentType,
        byteLength: asset.byteLength,
        width: asset.width,
        height: asset.height,
        sha256: asset.sha256,
      }),
    );
    const packageDigest = sha256(
      Buffer.from(
        createPetSkinPackageDigestPayload({
          manifest: parsedWithoutDigest.data,
          resources,
        }),
        "utf8",
      ),
    );
    const manifest = {
      ...parsedWithoutDigest.data,
      packageDigest,
    };
    const validation = validatePetSkinManifestV1({
      manifest,
      resources,
      currentJarvisVersion: this.currentJarvisVersion,
      fileCount: resources.length + 1,
      unpackedByteLength:
        resources.reduce((sum, resource) => sum + resource.byteLength, 0) +
        JSON.stringify(manifest).length,
      computedPackageDigest: packageDigest,
    });
    if (!validation.ok) {
      return {
        ok: false,
        reasonCode: "invalid_manifest",
        safeMessage: "Skin Studio draft failed contract validation.",
      };
    }
    return { ok: true, manifest: validation.manifest };
  }

  private assignRole(
    draftState: StateDraft,
    role: PetSkinStudioAssetRole,
    assetId: string,
  ): void {
    if (role === "base") {
      draftState.baseAssetId = assetId;
    } else if (role === "stateGlyph") {
      draftState.stateGlyphAssetId = assetId;
    } else {
      draftState.staticVariantAssetId = assetId;
    }
  }

  private fail(
    reasonCode: Extract<PetSkinStudioResult, { ok: false }>["reasonCode"],
    safeMessage: string,
    draft?: Draft,
  ): PetSkinStudioResult {
    return {
      ok: false,
      reasonCode,
      safeMessage,
      ...(draft ? { draft: this.project(draft) } : {}),
    };
  }

  private isForbiddenExportPath(outputPath: string): boolean {
    const normalized = path.resolve(outputPath).toLowerCase();
    return this.forbiddenExportRoots.some((root) => {
      const resolvedRoot = path.resolve(root).toLowerCase();
      return (
        normalized === resolvedRoot ||
        normalized.startsWith(`${resolvedRoot}${path.sep}`)
      );
    });
  }

  private async cleanupDraft(draft: Draft | null): Promise<void> {
    if (!draft) {
      return;
    }
    await fs.rm(draft.directory, { force: true, recursive: true });
  }
}

export function createElectronPetSkinAssetSource(
  nativeImage: NativeImageLike,
): PetSkinAssetSource {
  return {
    async normalizeLocalFile(input) {
      if (!path.isAbsolute(input.sourcePath)) {
        return {
          ok: false,
          reasonCode: "unsafe_path",
          safeMessage: "Image path is not allowed.",
        };
      }
      let stat;
      try {
        stat = await fs.stat(input.sourcePath);
      } catch {
        return {
          ok: false,
          reasonCode: "invalid_image_metadata",
          safeMessage: "Image file could not be read.",
        };
      }
      if (!stat.isFile() || stat.size > PET_SKIN_V1_POLICY.maxFileBytes) {
        return {
          ok: false,
          reasonCode: "resource_limit_exceeded",
          safeMessage: "Image file exceeds Pet Skin limits.",
        };
      }
      const bytes = await fs.readFile(input.sourcePath);
      if (!hasAllowedImageMagic(bytes)) {
        return {
          ok: false,
          reasonCode: "invalid_image_metadata",
          safeMessage: "Image file type is not supported.",
        };
      }
      const image = nativeImage.createFromBuffer(bytes);
      if (image.isEmpty()) {
        return {
          ok: false,
          reasonCode: "invalid_image_metadata",
          safeMessage: "Image file could not be decoded.",
        };
      }
      const size = image.getSize();
      if (
        size.width <= 0 ||
        size.height <= 0 ||
        size.width > PET_SKIN_V1_POLICY.maxImageWidth ||
        size.height > PET_SKIN_V1_POLICY.maxImageHeight ||
        size.width * size.height > PET_SKIN_V1_POLICY.maxImagePixels
      ) {
        return {
          ok: false,
          reasonCode: "resource_limit_exceeded",
          safeMessage: "Image dimensions exceed Pet Skin limits.",
        };
      }
      const png = Buffer.from(image.toPNG());
      if (png.length > PET_SKIN_V1_POLICY.maxFileBytes || !isPng(png)) {
        return {
          ok: false,
          reasonCode: "invalid_image_metadata",
          safeMessage: "Image normalization failed.",
        };
      }
      await fs.writeFile(input.destinationPath, png);
      return {
        ok: true,
        asset: {
          assetId: input.assetId,
          contentType: "image/png",
          bytes: png,
          byteLength: png.length,
          width: size.width,
          height: size.height,
          sha256: sha256(png),
          source: "local_file",
          packagePath: input.packagePath,
          absolutePath: input.destinationPath,
        },
      };
    },
  };
}

async function writeZipPackage(
  outputPath: string,
  input: { manifest: PetSkinManifestV1; assets: PetSkinNormalizedAssetInput[] },
): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const zip = new yazl.ZipFile();
  zip.addBuffer(
    Buffer.from(JSON.stringify(input.manifest, null, 2), "utf8"),
    PET_SKIN_V1_MANIFEST_PATH,
  );
  for (const asset of [...input.assets].sort((left, right) =>
    left.packagePath.localeCompare(right.packagePath, "en"),
  )) {
    zip.addBuffer(asset.bytes, asset.packagePath);
  }
  zip.end();
  await new Promise<void>((resolve, reject) => {
    zip.outputStream
      .pipe(createWriteStream(outputPath))
      .on("close", resolve)
      .on("error", reject);
  });
}

function openImageDialogOptions() {
  return {
    title: "Select Pet Skin Image",
    properties: ["openFile" as const],
    filters: [{ name: "Pet Skin Images", extensions: ["png", "webp"] }],
  };
}

function saveDialogOptions(defaultPath: string) {
  return {
    title: "Export Jarvis-K Pet Skin",
    defaultPath,
    filters: [{ name: "Jarvis-K Pet Skin", extensions: ["jkskin"] }],
  };
}

function roleSlug(role: PetSkinStudioAssetRole): string {
  return role === "stateGlyph" ? "glyph" : role === "staticVariant" ? "static" : "base";
}

function safeFileStem(value: string): string {
  const stem = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80);
  return stem || "jarvis-k-pet-skin";
}

function ensureJkskinExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase() === ".jkskin"
    ? filePath
    : `${filePath}.jkskin`;
}

function hasAllowedImageMagic(bytes: Buffer): boolean {
  return isPng(bytes) || isWebp(bytes);
}

function isPng(bytes: Buffer): boolean {
  return bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE);
}

function isWebp(bytes: Buffer): boolean {
  return (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
}

function sha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
