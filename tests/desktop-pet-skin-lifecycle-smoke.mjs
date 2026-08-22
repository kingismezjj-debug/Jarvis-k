import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PET_SKIN_FORMAL_STATES,
  PET_SKIN_INSTALLED_PROTOCOL,
  createPetSkinPackageDigestPayload,
} = require("../packages/contracts/dist/index.js");
const {
  PetSkinLocalRegistryService,
} = require("../apps/desktop/dist/pet-skin/pet-skin-local-registry-service.js");

const basePng = makePng(112, 112);
const glyphPng = makePng(32, 32);
const staticPng = makePng(112, 112, 8);

const root = await fs.mkdtemp(path.join(os.tmpdir(), "jarvis-k-pet-skin-lifecycle-"));
const skinRoot = path.join(root, "local-data", "pet-skins", "v1");
const registryPath = path.join(skinRoot, "registry.json");

const service = new PetSkinLocalRegistryService({
  rootDirectory: skinRoot,
  registryPath,
  rendererPreflight: async () => true,
  now: () => new Date("2026-08-22T00:00:00.000Z"),
});

let handler = null;
service.registerProtocol({
  handle: (_scheme, nextHandler) => {
    handler = nextHandler;
  },
  unhandle: () => {
    handler = null;
  },
});

const first = await writePreviewSource(root, {
  skinId: "local.lifecycle.smoke.first",
});
const second = await writePreviewSource(root, {
  skinId: "local.lifecycle.smoke.second",
  baseBytes: makePng(112, 112, 4),
});

await expectOk(service.installFromPreview(first), "install first");
await expectOk(service.activateSkin(toIdentity(first.manifest)), "activate first");
await expectOk(service.installFromPreview(second), "install second");
await expectOk(service.activateSkin(toIdentity(second.manifest)), "activate second");

const descriptor = service.getActiveSkinDescriptor();
if (descriptor?.identity.packageDigest !== second.manifest.packageDigest) {
  throw new Error("Second skin did not become active.");
}
if (!handler) {
  throw new Error("Installed skin protocol was not registered.");
}
const response = await handler(new Request(descriptor.resources.base.resourceUrl));
if (response.status !== 200 || response.headers.get("Content-Type") !== "image/png") {
  throw new Error("Installed skin protocol did not serve the active resource.");
}
const traversal = await handler(
  new Request(
    `${PET_SKIN_INSTALLED_PROTOCOL}://${second.manifest.packageDigest}/..%2Fsecret`,
  ),
);
if (traversal.status !== 404) {
  throw new Error("Installed skin protocol allowed an unsafe asset path.");
}

await expectOk(
  service.reportRenderFailure(second.manifest.packageDigest),
  "render failure rollback",
);
if (
  service.getProjection().activeSkinIdentity?.packageDigest !==
  first.manifest.packageDigest
) {
  throw new Error("Render failure did not roll back to the previous skin.");
}
await expectOk(service.removeSkin(toIdentity(first.manifest)), "remove active fallback");
if (service.getProjection().activeSkinIdentity) {
  throw new Error("Removing the last active skin did not return to built-in fallback.");
}

service.unregisterProtocol({
  handle: () => undefined,
  unhandle: () => undefined,
});
await fs.rm(root, { recursive: true, force: true });

console.log(
  JSON.stringify(
    {
      status: "PASS",
      tempRootWasOutsideRepo: !root
        .toLowerCase()
        .startsWith(process.cwd().toLowerCase()),
      installedProtocol: PET_SKIN_INSTALLED_PROTOCOL,
      activeRollback: "last_known_good_then_built_in",
      windowsExecutorUsed: false,
      voiceUsed: false,
      qwenUsed: false,
    },
    null,
    2,
  ),
);

async function expectOk(resultPromise, label) {
  const result = await resultPromise;
  if (!result.ok) {
    throw new Error(`${label} failed: ${JSON.stringify(result)}`);
  }
  return result;
}

async function writePreviewSource(tempRoot, options = {}) {
  const previewId = crypto.randomBytes(8).toString("hex");
  const directory = path.join(tempRoot, "preview", previewId);
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
    skinId: options.skinId ?? "local.lifecycle.smoke",
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

function makeManifest(options) {
  const assets = {
    base: {
      path: "assets/base.png",
      contentType: "image/png",
      byteLength: options.baseBytes.length,
      width: 112,
      height: 112,
      sha256: sha256(options.baseBytes),
    },
    glyph: {
      path: "assets/glyph.png",
      contentType: "image/png",
      byteLength: glyphPng.length,
      width: 32,
      height: 32,
      sha256: sha256(glyphPng),
    },
    static: {
      path: "assets/static.png",
      contentType: "image/png",
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
  );
  const manifest = {
    schemaVersion: 1,
    skinId: options.skinId,
    skinVersion: "1.0.0",
    displayName: "Lifecycle Smoke",
    author: "Jarvis-K",
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
      ),
    },
    packageDigest: "0".repeat(64),
  };
  return {
    ...manifest,
    packageDigest: sha256(
      Buffer.from(
        createPetSkinPackageDigestPayload({
          manifest,
          resources: Object.values(assets),
        }),
        "utf8",
      ),
    ),
  };
}

function toIdentity(manifest) {
  return {
    skinId: manifest.skinId,
    skinVersion: manifest.skinVersion,
    packageDigest: manifest.packageDigest,
  };
}

function makePng(width, height, extraBytes = 0) {
  const bytes = Buffer.alloc(24 + extraBytes);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  Buffer.from("IHDR", "ascii").copy(bytes, 12);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
