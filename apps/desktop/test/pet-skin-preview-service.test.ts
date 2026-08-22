import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import yazl from "yazl";
import {
  PET_SKIN_FORMAL_STATES,
  PET_SKIN_PREVIEW_PROTOCOL,
  type PetSkinManifestV1,
  createPetSkinPackageDigestPayload,
} from "@jarvis-k/contracts";
import { PetSkinPreviewService } from "../src/pet-skin/pet-skin-preview-service";

const basePng = makePng(112, 112);
const glyphPng = makePng(32, 32);
const staticPng = makePng(112, 112, 8);

describe("PetSkinPreviewService", () => {
  it("validates a minimal .jkskin package and exposes only preview protocol URLs", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-preview-test-"));
    const service = new PetSkinPreviewService({ tempRoot });
    const packagePath = await writeSkinPackage(tempRoot);

    const result = await service.createPreviewFromPackage(packagePath);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.preview.trustState).toBe("validated_preview_package");
      expect(result.preview.previewId).toMatch(/^[a-f0-9]+$/u);
      expect(result.preview.resources.base.resourceUrl).toMatch(
        new RegExp(`^${PET_SKIN_PREVIEW_PROTOCOL}://`),
      );
      expect(result.preview.resources.base.resourceUrl).not.toContain(tempRoot);
      expect(result.preview.states.idle.baseAssetId).toBe("base");
      expect(result.preview.reducedMotionStates.idle.staticVariantAssetId).toBe(
        "static",
      );
      await expect(
        service.getPreviewResourceUrl(result.preview.previewId, "base"),
      ).resolves.toMatchObject({ ok: true, assetId: "base" });
      await service.cancelPreview();
      await expect(
        service.getPreviewResourceUrl(result.preview.previewId, "base"),
      ).resolves.toMatchObject({ ok: false, reasonCode: "preview_unavailable" });
    }
  });

  it("rejects non-zip magic, zip slip, Windows paths, duplicates, and extra files", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-preview-test-"));
    const service = new PetSkinPreviewService({ tempRoot });
    const notZip = path.join(tempRoot, "bad.jkskin");
    await fs.writeFile(notZip, "not a zip");
    await expect(service.createPreviewFromPackage(notZip)).resolves.toMatchObject(
      { ok: false, reasonCode: "invalid_manifest" },
    );

    for (const [entryName, unsafeName] of [
      ["b/xx/evil.png", "a/../evil.png"],
      ["cc/asset.png", "C:/asset.png"],
      ["assets/evil.png", "assets\\evil.png"],
    ] as const) {
      const result = await service.createPreviewFromPackage(
        await writeSkinPackage(tempRoot, {
          extraEntries: [[entryName, basePng]],
          rewriteEntryNames: [[entryName, unsafeName]],
        }),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(["unsafe_path", "invalid_manifest"]).toContain(result.reasonCode);
      }
    }

    await expect(
      service.createPreviewFromPackage(
        await writeSkinPackage(tempRoot, {
          manifestAssetOverrides: {
            base: { path: "assets/../base.png" },
          },
        }),
      ),
    ).resolves.toMatchObject({ ok: false, reasonCode: "invalid_manifest" });

    await expect(
      service.createPreviewFromPackage(
        await writeSkinPackage(tempRoot, {
          extraEntries: [["ASSETS/base.png", basePng]],
        }),
      ),
    ).resolves.toMatchObject({ ok: false, reasonCode: "duplicate_path" });

    await expect(
      service.createPreviewFromPackage(
        await writeSkinPackage(tempRoot, {
          extraEntries: [["assets/extra.png", basePng]],
        }),
      ),
    ).resolves.toMatchObject({ ok: false, reasonCode: "invalid_manifest" });
  });

  it("rejects executable entries, symlinks, digest mismatch, image mismatch, and invalid metadata", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-preview-test-"));
    const service = new PetSkinPreviewService({ tempRoot });

    await expect(
      service.createPreviewFromPackage(
        await writeSkinPackage(tempRoot, {
          extraEntries: [["assets/evil.js", Buffer.from("alert(1)")]],
        }),
      ),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "executable_content_detected",
    });

    await expect(
      service.createPreviewFromPackage(
        await writeSkinPackage(tempRoot, {
          extraEntries: [
            ["assets/link.png", basePng, { mode: 0o120777 }],
          ],
        }),
      ),
    ).resolves.toMatchObject({
      ok: false,
      reasonCode: "executable_content_detected",
    });

    await expect(
      service.createPreviewFromPackage(
        await writeSkinPackage(tempRoot, {
          manifestOverrides: { packageDigest: "0".repeat(64) },
        }),
      ),
    ).resolves.toMatchObject({ ok: false, reasonCode: "digest_mismatch" });

    await expect(
      service.createPreviewFromPackage(
        await writeSkinPackage(tempRoot, {
          assetBytes: { "assets/base.png": Buffer.from("not a png") },
        }),
      ),
    ).resolves.toMatchObject({ ok: false, reasonCode: "invalid_image_metadata" });

    await expect(
      service.createPreviewFromPackage(
        await writeSkinPackage(tempRoot, {
          manifestAssetOverrides: {
            base: { width: 9999 },
          },
        }),
      ),
    ).resolves.toMatchObject({ ok: false, reasonCode: "invalid_image_metadata" });
  });

  it("cleans failed, cancelled, replaced, and stale preview workspaces", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-preview-test-"));
    const service = new PetSkinPreviewService({ tempRoot });
    const stale = await fs.mkdtemp(path.join(tempRoot, "jarvis-k-pet-skin-preview-"));
    await fs.writeFile(path.join(stale, "old.tmp"), "x");

    await service.cleanupStalePreviewDirectories();
    await expect(fs.stat(stale)).rejects.toThrow();

    const first = await service.createPreviewFromPackage(await writeSkinPackage(tempRoot));
    expect(first.ok).toBe(true);
    const previewDirsAfterFirst = await listPreviewDirs(tempRoot);
    expect(previewDirsAfterFirst).toHaveLength(1);

    const second = await service.createPreviewFromPackage(await writeSkinPackage(tempRoot));
    expect(second.ok).toBe(true);
    const previewDirsAfterSecond = await listPreviewDirs(tempRoot);
    expect(previewDirsAfterSecond).toHaveLength(1);

    await service.cancelPreview();
    expect(await listPreviewDirs(tempRoot)).toHaveLength(0);

    await service.createPreviewFromPackage(
      await writeSkinPackage(tempRoot, {
        manifestOverrides: { packageDigest: "1".repeat(64) },
      }),
    );
    expect(await listPreviewDirs(tempRoot)).toHaveLength(0);
  });

  it("serves only active validated preview resources through the scoped protocol", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-preview-test-"));
    const service = new PetSkinPreviewService({ tempRoot });
    let handler: ((request: Request) => Promise<Response>) | null = null;
    service.registerProtocol({
      handle: (_scheme, nextHandler) => {
        handler = nextHandler as (request: Request) => Promise<Response>;
      },
      unhandle: () => {
        handler = null;
      },
    });
    const result = await service.createPreviewFromPackage(await writeSkinPackage(tempRoot));
    expect(result.ok).toBe(true);
    expect(handler).not.toBeNull();
    if (result.ok && handler) {
      const okResponse = await handler(
        new Request(result.preview.resources.base.resourceUrl),
      );
      expect(okResponse.status).toBe(200);
      expect(okResponse.headers.get("Content-Type")).toBe("image/png");

      const pathTraversalResponse = await handler(
        new Request(
          `${PET_SKIN_PREVIEW_PROTOCOL}://${result.preview.previewId}/..%2Fsecret`,
        ),
      );
      expect(pathTraversalResponse.status).toBe(404);

      await service.cancelPreview();
      const expiredResponse = await handler(
        new Request(result.preview.resources.base.resourceUrl),
      );
      expect(expiredResponse.status).toBe(404);
    }
  });
});

async function listPreviewDirs(tempRoot: string): Promise<string[]> {
  const entries = await fs.readdir(tempRoot);
  return entries.filter((entry) => entry.startsWith("jarvis-k-pet-skin-preview-"));
}

function makeManifest(options: {
  manifestOverrides?: Partial<PetSkinManifestV1>;
  manifestAssetOverrides?: Record<string, Partial<PetSkinManifestV1["assets"][string]>>;
  assetBytes?: Record<string, Buffer>;
} = {}): PetSkinManifestV1 {
  const assets = {
    base: {
      path: "assets/base.png",
      contentType: "image/png" as const,
      byteLength: (options.assetBytes?.["assets/base.png"] ?? basePng).length,
      width: 112,
      height: 112,
      sha256: sha256(options.assetBytes?.["assets/base.png"] ?? basePng),
      ...options.manifestAssetOverrides?.base,
    },
    glyph: {
      path: "assets/glyph.png",
      contentType: "image/png" as const,
      byteLength: glyphPng.length,
      width: 32,
      height: 32,
      sha256: sha256(glyphPng),
      ...options.manifestAssetOverrides?.glyph,
    },
    static: {
      path: "assets/static.png",
      contentType: "image/png" as const,
      byteLength: staticPng.length,
      width: 112,
      height: 112,
      sha256: sha256(staticPng),
      ...options.manifestAssetOverrides?.static,
    },
  };
  const states = Object.fromEntries(
    PET_SKIN_FORMAL_STATES.map((state) => [
      state,
      {
        baseAsset: "base",
        stateGlyph: "glyph",
        frameSequence: { frames: ["base", "static"], frameRate: 8 },
      },
    ]),
  ) as PetSkinManifestV1["states"];
  const manifest = {
    schemaVersion: 1 as const,
    skinId: "local.preview.test",
    skinVersion: "1.0.0",
    displayName: "Preview Test",
    author: "Tests",
    license: "Test",
    minimumJarvisVersion: "0.1.0",
    assets,
    states,
    reducedMotion: {
      states: Object.fromEntries(
        PET_SKIN_FORMAL_STATES.map((state) => [
          state,
          { baseAsset: "base", staticVariant: "static" },
        ]),
      ) as PetSkinManifestV1["reducedMotion"]["states"],
    },
    packageDigest: "0".repeat(64),
  };
  const digest = sha256(
    Buffer.from(
      createPetSkinPackageDigestPayload({
        manifest,
        resources: Object.values(assets),
      }),
      "utf8",
    ),
  );
  return {
    ...manifest,
    packageDigest: digest,
    ...options.manifestOverrides,
  };
}

async function writeSkinPackage(
  tempRoot: string,
  options: {
    manifestOverrides?: Partial<PetSkinManifestV1>;
    manifestAssetOverrides?: Record<string, Partial<PetSkinManifestV1["assets"][string]>>;
    assetBytes?: Record<string, Buffer>;
    extraEntries?: Array<[string, Buffer, { mode?: number }?]>;
    rewriteEntryNames?: Array<[string, string]>;
  } = {},
): Promise<string> {
  const packagePath = path.join(
    tempRoot,
    `skin-${crypto.randomBytes(4).toString("hex")}.jkskin`,
  );
  const zip = new yazl.ZipFile();
  const manifest = makeManifest(options);
  zip.addBuffer(Buffer.from(JSON.stringify(manifest), "utf8"), "manifest.json");
  zip.addBuffer(options.assetBytes?.["assets/base.png"] ?? basePng, "assets/base.png");
  zip.addBuffer(glyphPng, "assets/glyph.png");
  zip.addBuffer(staticPng, "assets/static.png");
  for (const [entryName, bytes, entryOptions] of options.extraEntries ?? []) {
    zip.addBuffer(bytes, entryName, entryOptions);
  }
  zip.end();
  await new Promise<void>((resolve, reject) => {
    zip.outputStream
      .pipe(createWriteStream(packagePath))
      .on("close", resolve)
      .on("error", reject);
  });
  for (const [from, to] of options.rewriteEntryNames ?? []) {
    if (Buffer.byteLength(from) !== Buffer.byteLength(to)) {
      throw new Error("test zip entry rewrites must preserve byte length");
    }
    const bytes = await fs.readFile(packagePath);
    const next = Buffer.from(bytes);
    const fromBytes = Buffer.from(from, "utf8");
    const toBytes = Buffer.from(to, "utf8");
    let offset = next.indexOf(fromBytes);
    let replaced = false;
    while (offset >= 0) {
      toBytes.copy(next, offset);
      replaced = true;
      offset = next.indexOf(fromBytes, offset + toBytes.length);
    }
    if (!replaced) {
      throw new Error(`test zip entry ${from} was not found`);
    }
    await fs.writeFile(packagePath, next);
  }
  return packagePath;
}

function makePng(width: number, height: number, extraBytes = 0): Buffer {
  const bytes = Buffer.alloc(24 + extraBytes);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  Buffer.from("IHDR", "ascii").copy(bytes, 12);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function sha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
