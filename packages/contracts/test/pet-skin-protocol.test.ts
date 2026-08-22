import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BUILTIN_DESKTOP_PET_SKIN_ID,
  PET_SKIN_FORMAL_STATES,
  PET_SKIN_V1_POLICY,
  type PetSkinManifestV1,
  canonicalizePetSkinManifestForDigest,
  createPetSkinPackageDigestPayload,
  validatePetSkinManifestV1,
} from "../src";

const shaA = "a".repeat(64);
const shaB = "b".repeat(64);

function makeManifest(
  overrides: Partial<PetSkinManifestV1> = {},
): PetSkinManifestV1 {
  const assets = Object.fromEntries(
    PET_SKIN_FORMAL_STATES.flatMap((state) => [
      [
        `${state}.base`,
        {
          path: `assets/${state}-base.png`,
          contentType: "image/png" as const,
          byteLength: 1024,
          width: 112,
          height: 112,
          sha256: shaA,
        },
      ],
      [
        `${state}.glyph`,
        {
          path: `assets/${state}-glyph.webp`,
          contentType: "image/webp" as const,
          byteLength: 512,
          width: 32,
          height: 32,
          sha256: shaB,
        },
      ],
      [
        `${state}.static`,
        {
          path: `assets/${state}-static.png`,
          contentType: "image/png" as const,
          byteLength: 1024,
          width: 112,
          height: 112,
          sha256: shaA,
        },
      ],
    ]),
  );
  const states = Object.fromEntries(
    PET_SKIN_FORMAL_STATES.map((state) => [
      state,
      {
        baseAsset: `${state}.base`,
        stateGlyph: `${state}.glyph`,
        frameSequence: {
          frames: [`${state}.base`, `${state}.static`],
          frameRate: 12,
        },
      },
    ]),
  ) as PetSkinManifestV1["states"];
  const reducedMotion = {
    states: Object.fromEntries(
      PET_SKIN_FORMAL_STATES.map((state) => [
        state,
        {
          baseAsset: `${state}.base`,
          staticVariant: `${state}.static`,
        },
      ]),
    ) as PetSkinManifestV1["reducedMotion"]["states"],
  };
  return {
    schemaVersion: 1,
    skinId: "local.test.robot",
    skinVersion: "1.0.0",
    displayName: "Local Test Robot",
    description: "Asset-only local test skin.",
    author: "Jarvis-K Tests",
    license: "Proprietary-Test",
    minimumJarvisVersion: "0.1.0",
    assets,
    states,
    reducedMotion,
    packageDigest: shaA,
    ...overrides,
  };
}

function expectIssue(manifest: unknown, code: string) {
  const result = validatePetSkinManifestV1({ manifest });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.issues.map((issue) => issue.code)).toContain(code);
  }
}

describe("Pet Skin v1 protocol", () => {
  it("accepts a minimal asset-only manifest with all six states", () => {
    const manifest = makeManifest();
    const result = validatePetSkinManifestV1({
      manifest,
      archiveByteLength: 2048,
      unpackedByteLength: 4096,
      fileCount: Object.keys(manifest.assets).length + 1,
      computedPackageDigest: shaA,
      currentJarvisVersion: "0.1.0",
      resources: Object.values(manifest.assets),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trustState).toBe("validated_preview_package");
      expect(Object.keys(result.manifest.states)).toEqual([
        "idle",
        "listening",
        "thinking",
        "success",
        "error",
        "offline",
      ]);
    }
  });

  it("defines one canonical package digest payload that excludes the digest field itself", () => {
    const manifest = makeManifest({ packageDigest: shaA });
    const sameContentDifferentDigest = makeManifest({ packageDigest: shaB });
    expect(canonicalizePetSkinManifestForDigest(manifest)).toEqual(
      canonicalizePetSkinManifestForDigest(sameContentDifferentDigest),
    );
    const payload = createPetSkinPackageDigestPayload({
      manifest,
      resources: [
        { ...manifest.assets["idle.base"], sha256: shaB },
        { ...manifest.assets["error.base"], sha256: shaA },
      ],
    });
    const reversedPayload = createPetSkinPackageDigestPayload({
      manifest,
      resources: [
        { ...manifest.assets["error.base"], sha256: shaA },
        { ...manifest.assets["idle.base"], sha256: shaB },
      ],
    });
    expect(payload).toEqual(reversedPayload);
    expect(payload).toContain("jarvis-k-pet-skin-v1");
    expect(payload).not.toContain(`"packageDigest":"${shaA}"`);
    expect(payload).not.toContain(`"packageDigest":"${shaB}"`);
  });

  it("requires reduced-motion static glyphs or variants for every state", () => {
    const manifest = makeManifest();
    manifest.reducedMotion.states.listening = {
      baseAsset: "listening.base",
    };

    expectIssue(manifest, "missing_reduced_motion_variant");
  });

  it("rejects missing states with a stable reason", () => {
    const manifest = makeManifest() as unknown as Record<string, unknown>;
    manifest.states = {
      ...(manifest.states as Record<string, unknown>),
      offline: undefined,
    };

    expectIssue(manifest, "missing_state");
  });

  it("rejects URLs, absolute paths, path traversal, and Unicode path confusion", () => {
    for (const path of [
      "https://example.test/pet.png",
      "data:image/png;base64,AAA",
      "C:/Users/Admin/pet.png",
      "/tmp/pet.png",
      "../pet.png",
      "assets/耳朵.png",
    ]) {
      const manifest = makeManifest({
        assets: {
          ...makeManifest().assets,
          "idle.base": {
            ...makeManifest().assets["idle.base"],
            path,
          },
        },
      });
      expectIssue(manifest, "unsafe_path");
    }
  });

  it("rejects executable or active content extensions", () => {
    for (const path of [
      "assets/pet.js",
      "assets/pet.html",
      "assets/pet.css",
      "assets/pet.svg",
      "assets/pet.wasm",
      "assets/pet.exe",
    ]) {
      const manifest = makeManifest({
        assets: {
          ...makeManifest().assets,
          "idle.base": {
            ...makeManifest().assets["idle.base"],
            path,
          },
        },
      });
      expectIssue(manifest, "executable_content_detected");
    }
  });

  it("rejects duplicate paths, including case-only collisions", () => {
    const manifest = makeManifest();
    manifest.assets["listening.base"] = {
      ...manifest.assets["listening.base"],
      path: "ASSETS/idle-base.png",
    };

    expectIssue(manifest, "duplicate_path");
  });

  it("rejects Windows reserved names", () => {
    const manifest = makeManifest();
    manifest.assets["idle.base"] = {
      ...manifest.assets["idle.base"],
      path: "assets/con.png",
    };

    expectIssue(manifest, "unsafe_path");
  });

  it("rejects resource limits for frames, dimensions, file count, and package size", () => {
    const tooManyFrames = makeManifest();
    tooManyFrames.states.thinking.frameSequence = {
      frames: Array.from(
        { length: PET_SKIN_V1_POLICY.maxFramesPerSequence + 1 },
        () => "thinking.base",
      ),
      frameRate: 12,
    };
    expectIssue(tooManyFrames, "resource_limit_exceeded");

    const tooLargeImage = makeManifest();
    tooLargeImage.assets["idle.base"] = {
      ...tooLargeImage.assets["idle.base"],
      width: PET_SKIN_V1_POLICY.maxImageWidth + 1,
    };
    expectIssue(tooLargeImage, "invalid_image_metadata");

    const tooManyFiles = validatePetSkinManifestV1({
      manifest: makeManifest(),
      fileCount: PET_SKIN_V1_POLICY.maxFiles + 1,
    });
    expect(tooManyFiles.ok).toBe(false);
    if (!tooManyFiles.ok) {
      expect(tooManyFiles.issues.map((issue) => issue.code)).toContain(
        "resource_limit_exceeded",
      );
    }

    const tooLargeArchive = validatePetSkinManifestV1({
      manifest: makeManifest(),
      archiveByteLength: PET_SKIN_V1_POLICY.maxArchiveBytes + 1,
    });
    expect(tooLargeArchive.ok).toBe(false);
    if (!tooLargeArchive.ok) {
      expect(tooLargeArchive.issues.map((issue) => issue.code)).toContain(
        "resource_limit_exceeded",
      );
    }
  });

  it("rejects invalid semver, unsupported schemas, and unknown fields fail-closed", () => {
    expectIssue(makeManifest({ skinVersion: "v1" }), "invalid_manifest");
    expectIssue(
      {
        ...makeManifest(),
        schemaVersion: 2,
      },
      "unsupported_schema",
    );
    expectIssue(
      {
        ...makeManifest(),
        html: "<script></script>",
      },
      "invalid_manifest",
    );
  });

  it("rejects MIME/extension mismatch, damaged metadata, and digest mismatches", () => {
    const mismatch = makeManifest();
    mismatch.assets["idle.base"] = {
      ...mismatch.assets["idle.base"],
      contentType: "image/webp",
    };
    expectIssue(mismatch, "unsupported_asset_type");

    const badPackageDigest = validatePetSkinManifestV1({
      manifest: makeManifest(),
      computedPackageDigest: shaB,
    });
    expect(badPackageDigest.ok).toBe(false);
    if (!badPackageDigest.ok) {
      expect(badPackageDigest.issues.map((issue) => issue.code)).toContain(
        "digest_mismatch",
      );
    }

    const badResourceDigest = validatePetSkinManifestV1({
      manifest: makeManifest(),
      resources: [
        {
          ...makeManifest().assets["idle.base"],
          sha256: "c".repeat(64),
        },
      ],
    });
    expect(badResourceDigest.ok).toBe(false);
    if (!badResourceDigest.ok) {
      expect(badResourceDigest.issues.map((issue) => issue.code)).toContain(
        "digest_mismatch",
      );
    }
  });

  it("rejects incompatible Jarvis versions", () => {
    const result = validatePetSkinManifestV1({
      manifest: makeManifest({ minimumJarvisVersion: "9.0.0" }),
      currentJarvisVersion: "0.1.0",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toContain(
        "incompatible_version",
      );
    }
  });

  it("does not allow third-party manifests to replace the built-in fallback", () => {
    expectIssue(
      makeManifest({ skinId: BUILTIN_DESKTOP_PET_SKIN_ID }),
      "fallback_skin_reserved",
    );
  });

  it("is a pure contract validator without filesystem, network, Electron, or window access", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../src/pet-skin-protocol.ts", import.meta.url)),
      "utf8",
    );
    for (const forbidden of [
      "node:fs",
      "node:http",
      "node:https",
      "node:net",
      "node:path",
      "readFile",
      "fetch(",
      "XMLHttpRequest",
      "electron",
      "window.",
      "document.",
      "require(",
      "import(",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
