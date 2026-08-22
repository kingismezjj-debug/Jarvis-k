import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, it, vi } from "vitest";
import {
  BUILTIN_DESKTOP_PET_SKIN_ID,
  PET_SKIN_FORMAL_STATES,
  PET_SKIN_INSTALLED_PROTOCOL,
  type PetSkinIdentity,
  type PetSkinManifestV1,
  createPetSkinPackageDigestPayload,
} from "@jarvis-k/contracts";
import { PetSkinLocalRegistryService } from "../src/pet-skin/pet-skin-local-registry-service";
import type { PetSkinValidatedPreviewInstallSource } from "../src/pet-skin/pet-skin-preview-service";

const basePng = makePng(112, 112);
const glyphPng = makePng(32, 32);
const staticPng = makePng(112, 112, 8);

describe("PetSkinLocalRegistryService", () => {
  it("installs a validated preview atomically and activates only after renderer preflight", async () => {
    const harness = await createHarness();
    const source = await writePreviewSource(harness.previewRoot);
    const preflight = vi.fn(async () => true);
    const service = new PetSkinLocalRegistryService({
      rootDirectory: harness.skinRoot,
      registryPath: harness.registryPath,
      rendererPreflight: preflight,
      now: fixedNow,
    });

    const install = await service.installFromPreview(source);
    expect(install).toMatchObject({ ok: true });
    expect(install.ok && install.installedSkin.identity).toEqual(
      toIdentity(source.manifest),
    );
    expect(
      await exists(
        path.join(
          harness.skinRoot,
          source.manifest.skinId,
          source.manifest.skinVersion,
          source.manifest.packageDigest,
          "manifest.json",
        ),
      ),
    ).toBe(true);

    const activate = await service.activateSkin(toIdentity(source.manifest));
    expect(activate).toMatchObject({ ok: true });
    expect(preflight).toHaveBeenCalledTimes(1);
    expect(service.getActiveSkinDescriptor()).toMatchObject({
      identity: toIdentity(source.manifest),
      trustState: "active_skin",
      sensitiveContentExposed: false,
    });
  });

  it("keeps duplicate digest installs idempotent and rejects same id/version with a different digest", async () => {
    const harness = await createHarness();
    const service = new PetSkinLocalRegistryService({
      rootDirectory: harness.skinRoot,
      registryPath: harness.registryPath,
      now: fixedNow,
    });
    const first = await writePreviewSource(harness.previewRoot, {
      skinId: "local.lifecycle.same",
    });
    const secondDigest = await writePreviewSource(harness.previewRoot, {
      skinId: "local.lifecycle.same",
      baseBytes: makePng(112, 112, 3),
    });

    await expect(service.installFromPreview(first)).resolves.toMatchObject({
      ok: true,
    });
    await expect(service.installFromPreview(first)).resolves.toMatchObject({
      ok: true,
      safeMessage: "Skin is already installed.",
    });
    expect(service.getProjection().installedSkins).toHaveLength(1);

    await expect(service.installFromPreview(secondDigest)).resolves.toMatchObject({
      ok: false,
      reasonCode: "install_conflict",
    });
    expect(service.getProjection().installedSkins).toHaveLength(1);
  });

  it("fails closed when copied resources no longer match the validated preview and cleans staging", async () => {
    const harness = await createHarness();
    const service = new PetSkinLocalRegistryService({
      rootDirectory: harness.skinRoot,
      registryPath: harness.registryPath,
      now: fixedNow,
    });
    const source = await writePreviewSource(harness.previewRoot);
    const base = source.resources.get("base");
    expect(base).toBeDefined();
    await fs.writeFile(base!.absolutePath, makePng(112, 112, 2));

    await expect(service.installFromPreview(source)).resolves.toMatchObject({
      ok: false,
      reasonCode: "install_failed",
    });
    expect(service.getProjection().installedSkins).toHaveLength(0);
    expect(await listStaging(harness.skinRoot)).toHaveLength(0);
  });

  it("isolates corrupt registry files and falls back to the built-in skin", async () => {
    const harness = await createHarness();
    await fs.mkdir(path.dirname(harness.registryPath), { recursive: true });
    await fs.writeFile(harness.registryPath, '{"schemaVersion":1,"installedSkins":[{"bad":true}]}');

    const service = new PetSkinLocalRegistryService({
      rootDirectory: harness.skinRoot,
      registryPath: harness.registryPath,
    });

    expect(service.getProjection()).toMatchObject({
      registryHealthy: false,
      builtInFallback: {
        skinId: BUILTIN_DESKTOP_PET_SKIN_ID,
        trustState: "built_in_fallback",
      },
      installedSkins: [],
    });
    const files = await fs.readdir(path.dirname(harness.registryPath));
    expect(files.some((file) => file.startsWith("registry.json.corrupt-"))).toBe(true);
  });

  it("does not commit active settings when renderer preflight fails", async () => {
    const harness = await createHarness();
    const service = new PetSkinLocalRegistryService({
      rootDirectory: harness.skinRoot,
      registryPath: harness.registryPath,
      rendererPreflight: async () => false,
      now: fixedNow,
    });
    const source = await writePreviewSource(harness.previewRoot);
    await service.installFromPreview(source);

    await expect(service.activateSkin(toIdentity(source.manifest))).resolves.toMatchObject({
      ok: false,
      reasonCode: "renderer_preflight_failed",
    });
    expect(service.getProjection().activeSkinIdentity).toBeUndefined();
  });

  it("restores active skins across restarts and rolls back damaged active skins", async () => {
    const harness = await createHarness();
    const service = new PetSkinLocalRegistryService({
      rootDirectory: harness.skinRoot,
      registryPath: harness.registryPath,
      rendererPreflight: async () => true,
      now: fixedNow,
    });
    const first = await writePreviewSource(harness.previewRoot, {
      skinId: "local.lifecycle.first",
    });
    const second = await writePreviewSource(harness.previewRoot, {
      skinId: "local.lifecycle.second",
      baseBytes: makePng(112, 112, 4),
    });
    await service.installFromPreview(first);
    await service.activateSkin(toIdentity(first.manifest));
    await service.installFromPreview(second);
    await service.activateSkin(toIdentity(second.manifest));

    const restarted = new PetSkinLocalRegistryService({
      rootDirectory: harness.skinRoot,
      registryPath: harness.registryPath,
    });
    expect(restarted.getProjection().activeSkinIdentity).toEqual(
      toIdentity(second.manifest),
    );

    await fs.rm(
      path.join(
        harness.skinRoot,
        second.manifest.skinId,
        second.manifest.skinVersion,
        second.manifest.packageDigest,
        "assets",
        "base.png",
      ),
    );
    expect(restarted.getProjection().activeSkinIdentity).toEqual(
      toIdentity(first.manifest),
    );
  });

  it("removes active skins by falling back first and never removes built-in fallback", async () => {
    const harness = await createHarness();
    const service = new PetSkinLocalRegistryService({
      rootDirectory: harness.skinRoot,
      registryPath: harness.registryPath,
      rendererPreflight: async () => true,
      now: fixedNow,
    });
    const first = await writePreviewSource(harness.previewRoot, {
      skinId: "local.lifecycle.keep",
    });
    const second = await writePreviewSource(harness.previewRoot, {
      skinId: "local.lifecycle.remove",
      baseBytes: makePng(112, 112, 5),
    });
    await service.installFromPreview(first);
    await service.activateSkin(toIdentity(first.manifest));
    await service.installFromPreview(second);
    await service.activateSkin(toIdentity(second.manifest));

    await expect(service.removeSkin(toIdentity(second.manifest))).resolves.toMatchObject({
      ok: true,
    });
    expect(service.getProjection().activeSkinIdentity).toEqual(
      toIdentity(first.manifest),
    );
    await expect(
      service.removeSkin({
        skinId: BUILTIN_DESKTOP_PET_SKIN_ID,
        skinVersion: "1.0.0",
        packageDigest: "0".repeat(64),
      }),
    ).resolves.toMatchObject({ ok: false, reasonCode: "remove_unavailable" });
  });

  it("serves installed skin resources only through the active installed protocol scope", async () => {
    const harness = await createHarness();
    const service = new PetSkinLocalRegistryService({
      rootDirectory: harness.skinRoot,
      registryPath: harness.registryPath,
      rendererPreflight: async () => true,
      now: fixedNow,
    });
    let handler: ((request: Request) => Promise<Response>) | null = null;
    service.registerProtocol({
      handle: (_scheme, nextHandler) => {
        handler = nextHandler as (request: Request) => Promise<Response>;
      },
      unhandle: () => {
        handler = null;
      },
    });
    const source = await writePreviewSource(harness.previewRoot);
    await service.installFromPreview(source);
    await service.activateSkin(toIdentity(source.manifest));

    expect(handler).not.toBeNull();
    if (!handler) {
      throw new Error("installed protocol handler was not registered");
    }
    const descriptor = service.getActiveSkinDescriptor();
    expect(descriptor).toBeDefined();
    const okResponse = await handler(
      new Request(descriptor!.resources.base.resourceUrl),
    );
    expect(okResponse.status).toBe(200);
    expect(okResponse.headers.get("Content-Type")).toBe("image/png");

    const traversalResponse = await handler(
      new Request(
        `${PET_SKIN_INSTALLED_PROTOCOL}://${source.manifest.packageDigest}/..%2Fsecret`,
      ),
    );
    expect(traversalResponse.status).toBe(404);

    const inactiveResponse = await handler(
      new Request(
        `${PET_SKIN_INSTALLED_PROTOCOL}://${"f".repeat(64)}/base`,
      ),
    );
    expect(inactiveResponse.status).toBe(404);
  });
});

async function createHarness(): Promise<{
  root: string;
  previewRoot: string;
  skinRoot: string;
  registryPath: string;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pet-skin-local-test-"));
  return {
    root,
    previewRoot: path.join(root, "preview"),
    skinRoot: path.join(root, "local-data", "pet-skins", "v1"),
    registryPath: path.join(root, "local-data", "pet-skins", "v1", "registry.json"),
  };
}

async function writePreviewSource(
  previewRoot: string,
  options: {
    skinId?: string;
    baseBytes?: Buffer;
    minimumJarvisVersion?: string;
  } = {},
): Promise<PetSkinValidatedPreviewInstallSource> {
  const previewId = crypto.randomBytes(8).toString("hex");
  const directory = path.join(previewRoot, previewId);
  await fs.mkdir(path.join(directory, "assets"), { recursive: true });
  const baseBytes = options.baseBytes ?? basePng;
  const files = new Map([
    ["base", { packagePath: "assets/base.png", bytes: baseBytes, width: 112, height: 112 }],
    ["glyph", { packagePath: "assets/glyph.png", bytes: glyphPng, width: 32, height: 32 }],
    ["static", { packagePath: "assets/static.png", bytes: staticPng, width: 112, height: 112 }],
  ]);
  for (const file of files.values()) {
    await fs.writeFile(path.join(directory, file.packagePath), file.bytes);
  }
  const manifest = makeManifest({
    skinId: options.skinId ?? "local.lifecycle.test",
    minimumJarvisVersion: options.minimumJarvisVersion,
    baseBytes,
  });
  await fs.writeFile(
    path.join(directory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  return {
    previewId,
    manifest,
    directory,
    resources: new Map(
      Array.from(files.entries()).map(([assetId, file]) => [
        assetId,
        {
          assetId,
          absolutePath: path.join(directory, file.packagePath),
          contentType: "image/png",
          byteLength: file.bytes.length,
          width: file.width,
          height: file.height,
          sha256: sha256(file.bytes),
          packagePath: file.packagePath,
        },
      ]),
    ),
  };
}

function makeManifest(options: {
  skinId: string;
  baseBytes: Buffer;
  minimumJarvisVersion?: string;
}): PetSkinManifestV1 {
  const assets = {
    base: {
      path: "assets/base.png",
      contentType: "image/png" as const,
      byteLength: options.baseBytes.length,
      width: 112,
      height: 112,
      sha256: sha256(options.baseBytes),
    },
    glyph: {
      path: "assets/glyph.png",
      contentType: "image/png" as const,
      byteLength: glyphPng.length,
      width: 32,
      height: 32,
      sha256: sha256(glyphPng),
    },
    static: {
      path: "assets/static.png",
      contentType: "image/png" as const,
      byteLength: staticPng.length,
      width: 112,
      height: 112,
      sha256: sha256(staticPng),
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
    skinId: options.skinId,
    skinVersion: "1.0.0",
    displayName: "Lifecycle Test",
    author: "Tests",
    license: "Test",
    minimumJarvisVersion: options.minimumJarvisVersion ?? "0.1.0",
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
  return { ...manifest, packageDigest: digest };
}

function toIdentity(manifest: PetSkinManifestV1): PetSkinIdentity {
  return {
    skinId: manifest.skinId,
    skinVersion: manifest.skinVersion,
    packageDigest: manifest.packageDigest,
  };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listStaging(skinRoot: string): Promise<string[]> {
  try {
    return (await fs.readdir(skinRoot)).filter((entry) =>
      entry.startsWith(".staging-"),
    );
  } catch {
    return [];
  }
}

function fixedNow(): Date {
  return new Date("2026-08-22T00:00:00.000Z");
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
