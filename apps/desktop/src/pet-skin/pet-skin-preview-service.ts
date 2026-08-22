import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { BrowserWindow, dialog as electronDialog, protocol as electronProtocol } from "electron";
import yauzl, { type Entry, type ZipFile } from "yauzl";
import {
  PET_SKIN_FORMAL_STATES,
  PET_SKIN_PREVIEW_PROTOCOL,
  PET_SKIN_V1_MANIFEST_PATH,
  PET_SKIN_V1_POLICY,
  PetSkinManifestV1Schema,
  type PetSkinManifestV1,
  type PetSkinPackageResource,
  type PetSkinPreviewCancelResult,
  type PetSkinPreviewMetadata,
  type PetSkinPreviewResourceResult,
  type PetSkinPreviewSelectResult,
  type PetSkinValidationReasonCode,
  createPetSkinPackageDigestPayload,
  validatePetSkinManifestV1,
} from "@jarvis-k/contracts";

const PREVIEW_DIR_PREFIX = "jarvis-k-pet-skin-preview-";
const PREVIEW_ID_BYTES = 12;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

type Dialog = Pick<typeof electronDialog, "showOpenDialog">;
type Protocol = Pick<typeof electronProtocol, "handle" | "unhandle">;

type SafeEntry = {
  fileName: string;
  compressedSize: number;
  uncompressedSize: number;
  isDirectory: boolean;
  generalPurposeBitFlag: number;
  externalFileAttributes: number;
};

type ResourceRecord = {
  assetId: string;
  absolutePath: string;
  contentType: "image/png" | "image/webp";
  byteLength: number;
  width: number;
  height: number;
  sha256: string;
  packagePath: string;
};

type ActivePreview = {
  previewId: string;
  directory: string;
  manifest: PetSkinManifestV1;
  metadata: PetSkinPreviewMetadata;
  resources: Map<string, ResourceRecord>;
};

export type PetSkinValidatedPreviewInstallSource = {
  previewId: string;
  manifest: PetSkinManifestV1;
  directory: string;
  resources: Map<string, ResourceRecord>;
};

export class PetSkinPreviewService {
  private activePreview: ActivePreview | null = null;
  private protocolRegistered = false;
  private readonly tempRoot: string;
  private readonly currentJarvisVersion: string;

  public constructor(options: { tempRoot?: string; currentJarvisVersion?: string } = {}) {
    this.tempRoot = options.tempRoot ?? os.tmpdir();
    this.currentJarvisVersion = options.currentJarvisVersion ?? "0.1.0";
  }

  public static createPreviewResourceUrl(previewId: string, assetId: string): string {
    return `${PET_SKIN_PREVIEW_PROTOCOL}://${previewId}/${encodeURIComponent(assetId)}`;
  }

  public async cleanupStalePreviewDirectories(): Promise<void> {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(this.tempRoot);
    } catch {
      return;
    }
    await Promise.all(
      entries
        .filter((entry) => entry.startsWith(PREVIEW_DIR_PREFIX))
        .map((entry) =>
          fs.rm(path.join(this.tempRoot, entry), { force: true, recursive: true }),
        ),
    );
  }

  public registerProtocol(protocol: Protocol): void {
    if (this.protocolRegistered) {
      return;
    }
    protocol.handle(PET_SKIN_PREVIEW_PROTOCOL, async (request) => {
      const parsed = new URL(request.url);
      const previewId = parsed.hostname;
      const assetId = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
      const resource = await this.readPreviewResource(previewId, assetId);
      if (!resource.ok) {
        return new Response("Not found", { status: 404 });
      }
      return new Response(new Uint8Array(resource.bytes), {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": resource.contentType,
          "X-Content-Type-Options": "nosniff",
        },
      });
    });
    this.protocolRegistered = true;
  }

  public unregisterProtocol(protocol: Protocol): void {
    if (!this.protocolRegistered) {
      return;
    }
    protocol.unhandle(PET_SKIN_PREVIEW_PROTOCOL);
    this.protocolRegistered = false;
  }

  public async selectPreview(ownerWindow: BrowserWindow | null, dialog: Dialog): Promise<PetSkinPreviewSelectResult> {
    const dialogOptions = {
      title: "Select Jarvis-K Pet Skin Preview",
      properties: ["openFile" as const],
      filters: [{ name: "Jarvis-K Pet Skin", extensions: ["jkskin"] }],
    };
    const selected = ownerWindow
      ? await dialog.showOpenDialog(ownerWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);
    if (selected.canceled || selected.filePaths.length !== 1) {
      return {
        ok: false,
        reasonCode: "preview_cancelled",
        safeMessage: "Skin preview selection was cancelled.",
      };
    }
    return this.createPreviewFromPackage(selected.filePaths[0] ?? "");
  }

  public async createPreviewFromPackage(packagePath: string): Promise<PetSkinPreviewSelectResult> {
    const previous = this.activePreview;
    this.activePreview = null;
    await this.cleanupPreview(previous);
    let previewDirectory: string | null = null;
    try {
      const packageResult = await this.readPackage(packagePath);
      if (!packageResult.ok) {
        return packageResult.error;
      }
      const previewId = crypto.randomBytes(PREVIEW_ID_BYTES).toString("base64url");
      previewDirectory = await fs.mkdtemp(path.join(this.tempRoot, PREVIEW_DIR_PREFIX));
      const resources = new Map<string, ResourceRecord>();
      for (const [assetId, asset] of Object.entries(packageResult.manifest.assets)) {
        const source = packageResult.assets.get(asset.path);
        if (!source) {
          return this.error("invalid_manifest", "Declared skin asset was not found.");
        }
        const destination = path.join(previewDirectory, `${assetId}.${asset.contentType === "image/png" ? "png" : "webp"}`);
        await fs.writeFile(destination, source.bytes);
        resources.set(assetId, {
          assetId,
          absolutePath: destination,
          contentType: asset.contentType,
          byteLength: source.bytes.length,
          width: source.resource.width,
          height: source.resource.height,
          sha256: source.resource.sha256 ?? "",
          packagePath: asset.path,
        });
      }
      const metadata = this.createMetadata({
        previewId,
        manifest: packageResult.manifest,
        resources,
      });
      this.activePreview = {
        previewId,
        directory: previewDirectory,
        manifest: packageResult.manifest,
        metadata,
        resources,
      };
      previewDirectory = null;
      return { ok: true, preview: metadata };
    } catch {
      return this.error("invalid_manifest", "Skin package could not be read.");
    } finally {
      if (previewDirectory) {
        await fs.rm(previewDirectory, { force: true, recursive: true });
      }
    }
  }

  public async getPreviewResourceUrl(previewId: string, assetId: string): Promise<PetSkinPreviewResourceResult> {
    const resource = this.activePreview?.resources.get(assetId);
    if (!this.activePreview || this.activePreview.previewId !== previewId || !resource) {
      return {
        ok: false,
        reasonCode: "preview_unavailable",
        safeMessage: "Skin preview resource is unavailable.",
      };
    }
    return {
      ok: true,
      previewId,
      assetId,
      contentType: resource.contentType,
      byteLength: resource.byteLength,
      resourceUrl: PetSkinPreviewService.createPreviewResourceUrl(previewId, assetId),
    };
  }

  public async cancelPreview(): Promise<PetSkinPreviewCancelResult> {
    const previous = this.activePreview;
    this.activePreview = null;
    await this.cleanupPreview(previous);
    return { ok: true, safeMessage: "Skin preview cleared." };
  }

  public getInstallSource(
    previewId: string,
  ): PetSkinValidatedPreviewInstallSource | null {
    if (!this.activePreview || this.activePreview.previewId !== previewId) {
      return null;
    }
    return {
      previewId: this.activePreview.previewId,
      manifest: this.activePreview.manifest,
      directory: this.activePreview.directory,
      resources: new Map(this.activePreview.resources),
    };
  }

  public async dispose(): Promise<void> {
    await this.cancelPreview();
  }

  public async readPackage(packagePath: string): Promise<
    | {
        ok: true;
        manifest: PetSkinManifestV1;
        assets: Map<string, { bytes: Buffer; resource: PetSkinPackageResource }>;
      }
    | { ok: false; error: PetSkinPreviewSelectResult }
  > {
    if (!path.isAbsolute(packagePath)) {
      return { ok: false, error: this.error("unsafe_path", "Skin package path is not allowed.") };
    }
    const archiveBytes = await this.readZipMagic(packagePath);
    if (!archiveBytes.ok) {
      return { ok: false, error: archiveBytes.error };
    }
    const entries = await this.collectEntries(packagePath);
    const audit = this.auditEntries(entries, archiveBytes.archiveByteLength);
    if (!audit.ok) {
      return { ok: false, error: audit.error };
    }
    const contents = await this.readEntryContents(packagePath, audit.fileEntries);
    if (!contents.ok) {
      return { ok: false, error: contents.error };
    }
    const manifestBuffer = contents.files.get(PET_SKIN_V1_MANIFEST_PATH);
    if (!manifestBuffer) {
      return { ok: false, error: this.error("invalid_manifest", "Skin manifest is missing.") };
    }
    const rawManifest = JSON.parse(manifestBuffer.toString("utf8")) as unknown;
    const parsedManifest = PetSkinManifestV1Schema.safeParse(rawManifest);
    if (!parsedManifest.success) {
      return { ok: false, error: this.error("invalid_manifest", "Skin manifest is invalid.") };
    }
    const manifest = parsedManifest.data;
    const declaredPaths = new Map(
      Object.entries(manifest.assets).map(([assetId, asset]) => [asset.path, assetId]),
    );
    for (const entryPath of contents.files.keys()) {
      if (entryPath === PET_SKIN_V1_MANIFEST_PATH) {
        continue;
      }
      if (!declaredPaths.has(entryPath)) {
        return {
          ok: false,
          error: this.error("invalid_manifest", "Skin package contains undeclared files.", {
            entryCount: audit.fileEntries.length,
          }),
        };
      }
    }
    const assets = new Map<string, { bytes: Buffer; resource: PetSkinPackageResource }>();
    for (const [assetPath, assetId] of declaredPaths) {
      const bytes = contents.files.get(assetPath);
      if (!bytes) {
        return { ok: false, error: this.error("invalid_manifest", "Declared skin asset is missing.") };
      }
      const declared = manifest.assets[assetId];
      if (!declared) {
        return { ok: false, error: this.error("invalid_manifest", "Declared skin asset is invalid.") };
      }
      const image = inspectImage(bytes, declared.contentType);
      if (!image.ok) {
        return { ok: false, error: this.error("invalid_image_metadata", "Skin image metadata is invalid.") };
      }
      const resource = {
        path: assetPath,
        contentType: declared.contentType,
        byteLength: bytes.length,
        width: image.width,
        height: image.height,
        sha256: sha256(bytes),
      };
      assets.set(assetPath, { bytes, resource });
    }
    const resources = Array.from(assets.values()).map((entry) => entry.resource);
    const computedPackageDigest = sha256(
      Buffer.from(createPetSkinPackageDigestPayload({ manifest, resources }), "utf8"),
    );
    const validation = validatePetSkinManifestV1({
      manifest,
      archiveByteLength: archiveBytes.archiveByteLength,
      unpackedByteLength: contents.unpackedByteLength,
      fileCount: audit.fileEntries.length,
      computedPackageDigest,
      currentJarvisVersion: this.currentJarvisVersion,
      resources,
    });
    if (!validation.ok) {
      return {
        ok: false,
        error: this.error(
          validation.issues[0]?.code ?? "invalid_manifest",
          "Skin package failed validation.",
          {
            entryCount: audit.fileEntries.length,
            assetCount: Object.keys(manifest.assets).length,
            archiveByteLength: archiveBytes.archiveByteLength,
          },
        ),
      };
    }
    return { ok: true, manifest: validation.manifest, assets };
  }

  private async readPreviewResource(
    previewId: string,
    assetId: string,
  ): Promise<
    | { ok: true; bytes: Buffer; contentType: "image/png" | "image/webp" }
    | { ok: false }
  > {
    if (!this.activePreview || this.activePreview.previewId !== previewId) {
      return { ok: false };
    }
    const resource = this.activePreview.resources.get(assetId);
    if (!resource) {
      return { ok: false };
    }
    try {
      const bytes = await fs.readFile(resource.absolutePath);
      return { ok: true, bytes, contentType: resource.contentType };
    } catch {
      return { ok: false };
    }
  }

  private createMetadata(input: {
    previewId: string;
    manifest: PetSkinManifestV1;
    resources: Map<string, ResourceRecord>;
  }): PetSkinPreviewMetadata {
    const resourceDescriptor = (assetId: string, state?: (typeof PET_SKIN_FORMAL_STATES)[number], role?: "base" | "stateGlyph" | "staticVariant" | "frame") => {
      const resource = input.resources.get(assetId);
      if (!resource) {
        throw new Error("validated asset missing");
      }
      return {
        assetId,
        ...(state ? { state } : {}),
        ...(role ? { role } : {}),
        contentType: resource.contentType,
        byteLength: resource.byteLength,
        width: resource.width,
        height: resource.height,
        resourceUrl: PetSkinPreviewService.createPreviewResourceUrl(input.previewId, assetId),
      };
    };
    const describeStates = (states: PetSkinManifestV1["states"]) =>
      Object.fromEntries(
        PET_SKIN_FORMAL_STATES.map((state) => {
          const visual = states[state];
          return [
            state,
            {
              baseAssetId: visual.baseAsset,
              ...(visual.stateGlyph ? { stateGlyphAssetId: visual.stateGlyph } : {}),
              ...(visual.staticVariant ? { staticVariantAssetId: visual.staticVariant } : {}),
              ...(visual.frameSequence
                ? {
                    frameAssetIds: visual.frameSequence.frames,
                    frameRate: visual.frameSequence.frameRate,
                  }
                : {}),
            },
          ];
        }),
      ) as PetSkinPreviewMetadata["states"];
    return {
      previewId: input.previewId,
      skinId: input.manifest.skinId,
      skinVersion: input.manifest.skinVersion,
      displayName: input.manifest.displayName,
      ...(input.manifest.description ? { description: input.manifest.description } : {}),
      author: input.manifest.author,
      license: input.manifest.license,
      minimumJarvisVersion: input.manifest.minimumJarvisVersion,
      packageDigest: input.manifest.packageDigest,
      trustState: "validated_preview_package",
      assetCount: input.resources.size,
      states: describeStates(input.manifest.states),
      reducedMotionStates: describeStates(input.manifest.reducedMotion.states),
      resources: Object.fromEntries(
        Object.keys(input.manifest.assets).map((assetId) => [
          assetId,
          resourceDescriptor(assetId),
        ]),
      ),
    };
  }

  private async readZipMagic(packagePath: string): Promise<
    | { ok: true; archiveByteLength: number }
    | { ok: false; error: PetSkinPreviewSelectResult }
  > {
    const stat = await fs.stat(packagePath);
    if (!stat.isFile() || stat.size > PET_SKIN_V1_POLICY.maxArchiveBytes) {
      return {
        ok: false,
        error: this.error("resource_limit_exceeded", "Skin package is too large.", {
          archiveByteLength: Math.max(0, stat.size),
        }),
      };
    }
    const handle = await fs.open(packagePath, "r");
    try {
      const buffer = Buffer.alloc(4);
      await handle.read(buffer, 0, 4, 0);
      if (buffer.toString("binary") !== "PK\u0003\u0004") {
        return {
          ok: false,
          error: this.error("invalid_manifest", "Skin package is not a valid ZIP container."),
        };
      }
      return { ok: true, archiveByteLength: stat.size };
    } finally {
      await handle.close();
    }
  }

  private collectEntries(packagePath: string): Promise<SafeEntry[]> {
    return new Promise((resolve, reject) => {
      yauzl.open(
        packagePath,
        { lazyEntries: true, strictFileNames: false, validateEntrySizes: true },
        (error, zipFile) => {
          if (error || !zipFile) {
            reject(error ?? new Error("zip open failed"));
            return;
          }
          const entries: SafeEntry[] = [];
          zipFile.readEntry();
          zipFile.on("entry", (entry: Entry) => {
            entries.push({
              fileName: entry.fileName,
              compressedSize: entry.compressedSize,
              uncompressedSize: entry.uncompressedSize,
              isDirectory: /\/$/u.test(entry.fileName),
              generalPurposeBitFlag: entry.generalPurposeBitFlag,
              externalFileAttributes: entry.externalFileAttributes,
            });
            zipFile.readEntry();
          });
          zipFile.on("end", () => {
            zipFile.close();
            resolve(entries);
          });
          zipFile.on("error", reject);
        },
      );
    });
  }

  private auditEntries(
    entries: SafeEntry[],
    archiveByteLength: number,
  ):
    | { ok: true; fileEntries: SafeEntry[] }
    | { ok: false; error: PetSkinPreviewSelectResult } {
    const fileEntries = entries.filter((entry) => !entry.isDirectory);
    if (fileEntries.length > PET_SKIN_V1_POLICY.maxFiles) {
      return {
        ok: false,
        error: this.error("resource_limit_exceeded", "Skin package has too many files.", {
          entryCount: fileEntries.length,
          archiveByteLength,
        }),
      };
    }
    const normalized = new Set<string>();
    let unpackedByteLength = 0;
    let manifestCount = 0;
    for (const entry of entries) {
      if (entry.fileName === PET_SKIN_V1_MANIFEST_PATH) {
        manifestCount += 1;
      }
      const pathIssue = validateArchivePath(entry.fileName, entry.isDirectory);
      if (pathIssue) {
        return { ok: false, error: this.error(pathIssue, "Skin package contains an unsafe path.") };
      }
      if (entry.compressedSize < 0 || entry.uncompressedSize < 0) {
        return { ok: false, error: this.error("resource_limit_exceeded", "Skin package size metadata is invalid.") };
      }
      if ((entry.generalPurposeBitFlag & 0x1) === 0x1) {
        return { ok: false, error: this.error("invalid_manifest", "Encrypted skin package entries are not supported.") };
      }
      const unixMode = (entry.externalFileAttributes >>> 16) & 0o170000;
      if (unixMode === 0o120000 || (unixMode !== 0 && unixMode !== 0o100000 && unixMode !== 0o040000)) {
        return { ok: false, error: this.error("executable_content_detected", "Skin package contains unsupported entry types.") };
      }
      if (!entry.isDirectory) {
        if (entry.uncompressedSize > PET_SKIN_V1_POLICY.maxFileBytes) {
          return { ok: false, error: this.error("resource_limit_exceeded", "Skin package file is too large.") };
        }
        unpackedByteLength += entry.uncompressedSize;
        if (unpackedByteLength > PET_SKIN_V1_POLICY.maxUnpackedBytes) {
          return { ok: false, error: this.error("resource_limit_exceeded", "Skin package unpacked size is too large.") };
        }
        const normalizedPath = entry.fileName.normalize("NFC").toLowerCase();
        if (normalized.has(normalizedPath)) {
          return { ok: false, error: this.error("duplicate_path", "Skin package contains duplicate paths.") };
        }
        normalized.add(normalizedPath);
      }
    }
    if (manifestCount !== 1) {
      return { ok: false, error: this.error("invalid_manifest", "Skin package must contain exactly one manifest.") };
    }
    return { ok: true, fileEntries };
  }

  private readEntryContents(
    packagePath: string,
    fileEntries: SafeEntry[],
  ): Promise<
    | { ok: true; files: Map<string, Buffer>; unpackedByteLength: number }
    | { ok: false; error: PetSkinPreviewSelectResult }
  > {
    const expected = new Set(fileEntries.map((entry) => entry.fileName));
    return new Promise((resolve, reject) => {
      yauzl.open(
        packagePath,
        { lazyEntries: true, strictFileNames: false, validateEntrySizes: true },
        (error, zipFile) => {
          if (error || !zipFile) {
            reject(error ?? new Error("zip open failed"));
            return;
          }
          const files = new Map<string, Buffer>();
          let unpackedByteLength = 0;
          const fail = (result: PetSkinPreviewSelectResult) => {
            zipFile.close();
            resolve({ ok: false, error: result });
          };
          zipFile.readEntry();
          zipFile.on("entry", (entry: Entry) => {
            if (/\/$/u.test(entry.fileName)) {
              zipFile.readEntry();
              return;
            }
            if (!expected.has(entry.fileName)) {
              fail(this.error("invalid_manifest", "Skin package contains unexpected files."));
              return;
            }
            zipFile.openReadStream(entry, (streamError, stream) => {
              if (streamError || !stream) {
                fail(this.error("invalid_manifest", "Skin package entry could not be read."));
                return;
              }
              const chunks: Buffer[] = [];
              let entryBytes = 0;
              stream.on("data", (chunk: Buffer) => {
                entryBytes += chunk.length;
                if (entryBytes > entry.uncompressedSize || entryBytes > PET_SKIN_V1_POLICY.maxFileBytes) {
                  stream.destroy(new Error("resource_limit_exceeded"));
                  return;
                }
                chunks.push(chunk);
              });
              stream.on("error", (readError) => {
                fail(
                  this.error(
                    readError.message === "resource_limit_exceeded"
                      ? "resource_limit_exceeded"
                      : "invalid_manifest",
                    "Skin package entry exceeded resource limits.",
                  ),
                );
              });
              stream.on("end", () => {
                const bytes = Buffer.concat(chunks);
                unpackedByteLength += bytes.length;
                if (unpackedByteLength > PET_SKIN_V1_POLICY.maxUnpackedBytes) {
                  fail(this.error("resource_limit_exceeded", "Skin package unpacked size is too large."));
                  return;
                }
                files.set(entry.fileName, bytes);
                zipFile.readEntry();
              });
            });
          });
          zipFile.on("end", () => {
            zipFile.close();
            resolve({ ok: true, files, unpackedByteLength });
          });
          zipFile.on("error", reject);
        },
      );
    });
  }

  private async cleanupPreview(preview: ActivePreview | null): Promise<void> {
    if (!preview) {
      return;
    }
    await fs.rm(preview.directory, { force: true, recursive: true });
  }

  private error(
    reasonCode: PetSkinValidationReasonCode | "preview_cancelled" | "preview_unavailable",
    safeMessage: string,
    metadata?: { entryCount?: number; assetCount?: number; archiveByteLength?: number },
  ): PetSkinPreviewSelectResult {
    return {
      ok: false,
      reasonCode,
      safeMessage,
      ...(metadata ? { metadata } : {}),
    };
  }
}

function validateArchivePath(
  pathValue: string,
  isDirectory: boolean,
): PetSkinValidationReasonCode | null {
  if (
    pathValue.includes("\\") ||
    pathValue.startsWith("/") ||
    /^[A-Za-z]:/u.test(pathValue) ||
    /^\/\//u.test(pathValue) ||
    pathValue.includes("//")
  ) {
    return "unsafe_path";
  }
  const trimmed = isDirectory ? pathValue.replace(/\/$/u, "") : pathValue;
  const segments = trimmed.split("/");
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        !/^[A-Za-z0-9._-]+$/u.test(segment),
    )
  ) {
    return "unsafe_path";
  }
  for (const segment of segments) {
    const stem = segment.split(".")[0]?.toLowerCase() ?? "";
    if (
      new Set([
        "con",
        "prn",
        "aux",
        "nul",
        "com1",
        "com2",
        "com3",
        "com4",
        "com5",
        "com6",
        "com7",
        "com8",
        "com9",
        "lpt1",
        "lpt2",
        "lpt3",
        "lpt4",
        "lpt5",
        "lpt6",
        "lpt7",
        "lpt8",
        "lpt9",
      ]).has(stem)
    ) {
      return "unsafe_path";
    }
  }
  const extension = path.extname(trimmed).toLowerCase();
  if (PET_SKIN_V1_POLICY.forbiddenExtensions.includes(extension as never)) {
    return "executable_content_detected";
  }
  return null;
}

function inspectImage(
  bytes: Buffer,
  contentType: "image/png" | "image/webp",
):
  | { ok: true; width: number; height: number }
  | { ok: false } {
  if (contentType === "image/png") {
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
      return { ok: false };
    }
    return {
      ok: true,
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }
  if (
    bytes.length < 30 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return { ok: false };
  }
  const chunkType = bytes.toString("ascii", 12, 16);
  if (chunkType === "VP8X" && bytes.length >= 30) {
    return {
      ok: true,
      width: bytes.readUIntLE(24, 3) + 1,
      height: bytes.readUIntLE(27, 3) + 1,
    };
  }
  if (chunkType === "VP8L" && bytes.length >= 25) {
    const bits = bytes.readUInt32LE(21);
    return {
      ok: true,
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (chunkType === "VP8 " && bytes.length >= 30) {
    return {
      ok: true,
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }
  return { ok: false };
}

function sha256(input: Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
