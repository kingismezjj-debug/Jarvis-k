import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import yauzl from "yauzl";
import {
  PET_SKIN_FORMAL_STATES,
  createPetSkinPackageDigestPayload,
  type PetSkinManifestV1,
} from "@jarvis-k/contracts";
import { PetSkinPreviewService } from "../src/pet-skin/pet-skin-preview-service";
import {
  createManualFixturePackageData,
  generateManualPetSkinFixture,
  inspectPngForFixture,
} from "../../../scripts/generate-manual-pet-skin-fixture.mjs";

const generatedFiles: string[] = [];

afterEach(async () => {
  await Promise.all(
    generatedFiles.splice(0).map((file) => fs.rm(file, { force: true })),
  );
});

describe("manual Pet Skin fixture generator", () => {
  it("generates a valid .jkskin that passes the formal preview reader", async () => {
    const outputPath = manualArtifactPath("valid");
    generatedFiles.push(outputPath);

    const result = await generateManualPetSkinFixture({
      outputPath,
      overwrite: true,
    });
    const previewService = new PetSkinPreviewService({
      tempRoot: path.dirname(outputPath),
    });
    const validation = await previewService.createPreviewFromPackage(result.filePath);
    await previewService.dispose();

    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.preview.displayName).toBe(
        "Jarvis-K Manual Acceptance Fixture",
      );
      expect(validation.preview.skinId).toBe("test.manual-acceptance.fixture");
      expect(validation.preview.trustState).toBe("validated_preview_package");
      expect(validation.preview.packageDigest).toBe(result.packageDigest);
    }
    expect(result.filePath).toBe(outputPath);
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.packageDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.fileSize).toBeGreaterThan(0);
  });

  it("uses the canonical digest and complete six-state reduced-motion contract", async () => {
    const { manifest, entries } = createManualFixturePackageData();
    const resources = Object.values(manifest.assets);
    const recomputedDigest = sha256(
      Buffer.from(
        createPetSkinPackageDigestPayload({
          manifest,
          resources,
        }),
        "utf8",
      ),
    );

    expect(manifest.packageDigest).toBe(recomputedDigest);
    expect(Object.keys(manifest.states).sort()).toEqual(
      [...PET_SKIN_FORMAL_STATES].sort(),
    );
    expect(Object.keys(manifest.reducedMotion.states).sort()).toEqual(
      [...PET_SKIN_FORMAL_STATES].sort(),
    );
    for (const state of PET_SKIN_FORMAL_STATES) {
      expect(manifest.states[state].stateGlyph).toBe(`${state}.glyph`);
      expect(manifest.reducedMotion.states[state].stateGlyph).toBe(
        `${state}.glyph`,
      );
      expect(manifest.reducedMotion.states[state].staticVariant).toBe(
        `${state}.static`,
      );
    }
    expect(entries.has("manifest.json")).toBe(true);
  });

  it("contains only declared PNG resources with decodable pixel data", async () => {
    const outputPath = manualArtifactPath("entries");
    generatedFiles.push(outputPath);
    await generateManualPetSkinFixture({ outputPath, overwrite: true });
    const entries = await readZipEntries(outputPath);
    const manifest = JSON.parse(
      entries.get("manifest.json")?.toString("utf8") ?? "{}",
    ) as PetSkinManifestV1;
    const declaredPaths = new Set(Object.values(manifest.assets).map((asset) => asset.path));

    expect(entries.size).toBe(declaredPaths.size + 1);
    for (const [entryPath, bytes] of entries) {
      expect(entryPath.includes("\\")).toBe(false);
      expect(entryPath.includes("..")).toBe(false);
      expect(entryPath.startsWith("/") || /^[A-Za-z]:/u.test(entryPath)).toBe(false);
      expect(
        [".js", ".ts", ".html", ".css", ".svg", ".gif", ".wasm"].some((suffix) =>
          entryPath.toLowerCase().endsWith(suffix),
        ),
      ).toBe(false);
      if (entryPath === "manifest.json") {
        continue;
      }
      expect(declaredPaths.has(entryPath)).toBe(true);
      expect(entryPath.endsWith(".png")).toBe(true);
      const png = inspectPngForFixture(bytes);
      expect(png.width).toBeGreaterThan(0);
      expect(png.height).toBeGreaterThan(0);
      expect(png.pixelPayloadBytes).toBe((1 + png.width * 4) * png.height);
    }
  });

  it("refuses to overwrite by default and keeps output outside formal skin storage", async () => {
    const outputPath = manualArtifactPath("overwrite");
    generatedFiles.push(outputPath);
    await generateManualPetSkinFixture({ outputPath, overwrite: true });

    await expect(generateManualPetSkinFixture({ outputPath })).rejects.toThrow(
      "--overwrite",
    );
    expect(path.resolve(outputPath)).toContain(
      path.join("artifacts", "manual", "pet-skins"),
    );
    expect(path.resolve(outputPath)).not.toContain(
      path.join("pet-skins", "v1"),
    );
  });
});

function manualArtifactPath(label: string): string {
  return path.resolve(
    "artifacts",
    "manual",
    "pet-skins",
    `jarvis-k-manual-fixture-${label}-${crypto.randomBytes(4).toString("hex")}.jkskin`,
  );
}

async function readZipEntries(zipPath: string): Promise<Map<string, Buffer>> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (openError, zipFile) => {
      if (openError || !zipFile) {
        reject(openError ?? new Error("zip open failed"));
        return;
      }
      const entries = new Map<string, Buffer>();
      zipFile.readEntry();
      zipFile.on("entry", (entry) => {
        zipFile.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) {
            reject(streamError ?? new Error("zip stream failed"));
            return;
          }
          const chunks: Buffer[] = [];
          stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on("error", reject);
          stream.on("end", () => {
            entries.set(entry.fileName, Buffer.concat(chunks));
            zipFile.readEntry();
          });
        });
      });
      zipFile.on("end", () => resolve(entries));
      zipFile.on("error", reject);
    });
  });
}

function sha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
