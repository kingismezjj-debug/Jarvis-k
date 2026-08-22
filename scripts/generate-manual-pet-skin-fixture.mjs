import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import zlib from "node:zlib";
import yazl from "yazl";

const require = createRequire(import.meta.url);
const {
  PET_SKIN_FORMAL_STATES,
  createPetSkinPackageDigestPayload,
} = require("../packages/contracts/dist/index.js");

export const DEFAULT_MANUAL_FIXTURE_PATH = path.resolve(
  "artifacts",
  "manual",
  "pet-skins",
  "jarvis-k-manual-fixture-v1.jkskin",
);

const SKIN_ID = "test.manual-acceptance.fixture";
const SKIN_VERSION = "1.0.0";
const DISPLAY_NAME = "Jarvis-K Manual Acceptance Fixture";
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const STATE_STYLES = {
  idle: { color: [50, 106, 230, 255], glyph: "dot" },
  listening: { color: [16, 194, 210, 255], glyph: "wave" },
  thinking: { color: [142, 92, 246, 255], glyph: "orbit" },
  success: { color: [36, 178, 107, 255], glyph: "check" },
  error: { color: [238, 92, 76, 255], glyph: "x" },
  offline: { color: [126, 139, 156, 255], glyph: "dash" },
};

export async function generateManualPetSkinFixture(options = {}) {
  const outputPath = path.resolve(
    options.outputPath ?? DEFAULT_MANUAL_FIXTURE_PATH,
  );
  const overwrite = options.overwrite === true;
  const outputDirectory = path.dirname(outputPath);
  if (!isManualArtifactPath(outputPath)) {
    throw new Error("Output path must be under artifacts/manual.");
  }
  if (!overwrite && (await exists(outputPath))) {
    throw new Error("Fixture already exists. Re-run with --overwrite to replace it.");
  }

  const packageData = createManualFixturePackageData();
  await fs.mkdir(outputDirectory, { recursive: true });
  await writeZipPackage(outputPath, packageData);
  const fileBytes = await fs.readFile(outputPath);
  return {
    filePath: outputPath,
    sha256: sha256(fileBytes),
    packageDigest: packageData.manifest.packageDigest,
    fileSize: fileBytes.length,
    manifest: packageData.manifest,
    entries: Array.from(packageData.entries.keys()).sort(),
  };
}

export function createManualFixturePackageData() {
  const assets = {};
  const entries = new Map();
  for (const state of PET_SKIN_FORMAL_STATES) {
    const style = STATE_STYLES[state];
    const base = createStatePng(112, 112, style.color, style.glyph, false);
    const glyph = createStatePng(40, 40, style.color, style.glyph, true);
    const staticVariant = createStatePng(
      112,
      112,
      style.color,
      style.glyph,
      true,
    );
    const baseId = `${state}.base`;
    const glyphId = `${state}.glyph`;
    const staticId = `${state}.static`;
    const basePath = `assets/${state}-base.png`;
    const glyphPath = `assets/${state}-glyph.png`;
    const staticPath = `assets/${state}-static.png`;
    entries.set(basePath, base);
    entries.set(glyphPath, glyph);
    entries.set(staticPath, staticVariant);
    assets[baseId] = asset(basePath, base, 112, 112);
    assets[glyphId] = asset(glyphPath, glyph, 40, 40);
    assets[staticId] = asset(staticPath, staticVariant, 112, 112);
  }
  const states = Object.fromEntries(
    PET_SKIN_FORMAL_STATES.map((state) => [
      state,
      {
        baseAsset: `${state}.base`,
        stateGlyph: `${state}.glyph`,
        frameSequence: {
          frames: [`${state}.base`, `${state}.static`],
          frameRate: 4,
        },
      },
    ]),
  );
  const reducedMotion = {
    states: Object.fromEntries(
      PET_SKIN_FORMAL_STATES.map((state) => [
        state,
        {
          baseAsset: `${state}.base`,
          stateGlyph: `${state}.glyph`,
          staticVariant: `${state}.static`,
        },
      ]),
    ),
  };
  const manifestWithoutDigest = {
    schemaVersion: 1,
    skinId: SKIN_ID,
    skinVersion: SKIN_VERSION,
    displayName: DISPLAY_NAME,
    description:
      "Local asset-only fixture for Jarvis-K Desktop Pet manual acceptance.",
    author: "Jarvis-K Tests",
    license: "Test Fixture",
    minimumJarvisVersion: "0.1.0",
    assets,
    states,
    reducedMotion,
    packageDigest: "0".repeat(64),
  };
  const resources = Object.values(assets);
  const packageDigest = sha256(
    Buffer.from(
      createPetSkinPackageDigestPayload({
        manifest: manifestWithoutDigest,
        resources,
      }),
      "utf8",
    ),
  );
  const manifest = { ...manifestWithoutDigest, packageDigest };
  entries.set("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));
  return { manifest, entries };
}

export async function validateGeneratedFixtureWithOfficialReader(packagePath) {
  const { PetSkinPreviewService } = await import(
    pathToFileURL(
      path.resolve(
        "apps",
        "desktop",
        "dist",
        "pet-skin",
        "pet-skin-preview-service.js",
      ),
    ).href
  );
  const tempRoot = await fs.mkdtemp(
    path.join(path.dirname(path.resolve(packagePath)), ".preview-selfcheck-"),
  );
  try {
    const service = new PetSkinPreviewService({ tempRoot });
    const result = await service.createPreviewFromPackage(path.resolve(packagePath));
    await service.dispose();
    return result;
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

export function inspectPngForFixture(bytes) {
  const buffer = Buffer.from(bytes);
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("PNG signature mismatch.");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  let sawIend = false;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = buffer.readUInt32BE(offset + 8 + length);
    const actualCrc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
    if (actualCrc !== expectedCrc) {
      throw new Error(`PNG ${type} CRC mismatch.`);
    }
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      sawIend = true;
    }
    offset += 12 + length;
  }
  if (!width || !height || !sawIend || idat.length === 0) {
    throw new Error("PNG is incomplete.");
  }
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const expectedBytes = height * (1 + width * 4);
  if (inflated.length !== expectedBytes) {
    throw new Error("PNG pixel payload length mismatch.");
  }
  return { width, height, pixelPayloadBytes: inflated.length };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const overwrite = args.has("--overwrite");
  const outputArg = process.argv
    .slice(2)
    .find((arg) => arg.startsWith("--output="));
  const outputPath = outputArg
    ? outputArg.slice("--output=".length)
    : DEFAULT_MANUAL_FIXTURE_PATH;
  const result = await generateManualPetSkinFixture({ outputPath, overwrite });
  const validation = await validateGeneratedFixtureWithOfficialReader(
    result.filePath,
  );
  if (!validation.ok) {
    throw new Error(`Validator failed: ${validation.reasonCode}`);
  }
  console.log(
    JSON.stringify(
      {
        status: "PASS",
        filePath: result.filePath,
        sha256: result.sha256,
        packageDigest: result.packageDigest,
        fileSize: result.fileSize,
        validator: "PASS",
      },
      null,
      2,
    ),
  );
}

function isManualArtifactPath(filePath) {
  const relative = path.relative(path.resolve("artifacts", "manual"), filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function writeZipPackage(outputPath, packageData) {
  const zip = new yazl.ZipFile();
  zip.addBuffer(packageData.entries.get("manifest.json"), "manifest.json");
  for (const [entryPath, bytes] of Array.from(packageData.entries.entries()).sort(
    ([left], [right]) => left.localeCompare(right, "en"),
  )) {
    if (entryPath === "manifest.json") continue;
    zip.addBuffer(bytes, entryPath);
  }
  zip.end();
  await new Promise((resolve, reject) => {
    zip.outputStream
      .pipe(createWriteStream(outputPath))
      .on("close", resolve)
      .on("error", reject);
  });
}

function asset(pathValue, bytes, width, height) {
  return {
    path: pathValue,
    contentType: "image/png",
    byteLength: bytes.length,
    width,
    height,
    sha256: sha256(bytes),
  };
}

function createStatePng(width, height, color, glyph, staticVariant) {
  const pixels = Buffer.alloc(width * height * 4, 0);
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  const radius = Math.min(width, height) * (staticVariant ? 0.34 : 0.39);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        const light = 1 - distance / radius;
        setPixel(pixels, width, x, y, [
          Math.min(255, Math.round(color[0] * (0.72 + light * 0.32))),
          Math.min(255, Math.round(color[1] * (0.72 + light * 0.32))),
          Math.min(255, Math.round(color[2] * (0.72 + light * 0.32))),
          color[3],
        ]);
      }
      if (!staticVariant && distance > radius + 4 && distance < radius + 8) {
        setPixel(pixels, width, x, y, [color[0], color[1], color[2], 105]);
      }
    }
  }
  drawGlyph(pixels, width, height, glyph);
  return encodePngRgba(width, height, pixels);
}

function drawGlyph(pixels, width, height, glyph) {
  const white = [255, 255, 255, 238];
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  if (glyph === "dot") {
    fillCircle(pixels, width, height, cx, cy, Math.max(4, Math.floor(width / 10)), white);
  } else if (glyph === "wave") {
    strokeCircle(pixels, width, height, cx - width * 0.12, cy, width * 0.12, white);
    strokeCircle(pixels, width, height, cx - width * 0.12, cy, width * 0.24, white);
    fillCircle(pixels, width, height, cx + width * 0.18, cy, Math.max(3, Math.floor(width / 12)), white);
  } else if (glyph === "orbit") {
    strokeCircle(pixels, width, height, cx, cy, width * 0.23, white);
    fillCircle(pixels, width, height, cx + width * 0.22, cy - width * 0.09, Math.max(3, Math.floor(width / 14)), white);
  } else if (glyph === "check") {
    drawLine(pixels, width, height, cx - width * 0.25, cy, cx - width * 0.07, cy + width * 0.18, white);
    drawLine(pixels, width, height, cx - width * 0.07, cy + width * 0.18, cx + width * 0.28, cy - width * 0.22, white);
  } else if (glyph === "x") {
    drawLine(pixels, width, height, cx - width * 0.22, cy - width * 0.22, cx + width * 0.22, cy + width * 0.22, white);
    drawLine(pixels, width, height, cx + width * 0.22, cy - width * 0.22, cx - width * 0.22, cy + width * 0.22, white);
  } else if (glyph === "dash") {
    drawLine(pixels, width, height, cx - width * 0.25, cy, cx + width * 0.25, cy, white);
  }
}

function encodePngRgba(width, height, pixels) {
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0;
    pixels.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr(width, height)),
    pngChunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function ihdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function drawLine(pixels, width, height, x1, y1, x2, y2, color) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let step = 0; step <= steps; step += 1) {
    const t = steps === 0 ? 0 : step / steps;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);
    fillCircle(pixels, width, height, x, y, Math.max(1, Math.floor(width / 32)), color);
  }
}

function strokeCircle(pixels, width, height, cx, cy, radius, color) {
  const thickness = Math.max(1.4, width / 42);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      if (Math.abs(distance - radius) <= thickness) {
        setPixel(pixels, width, x, y, color);
      }
    }
  }
}

function fillCircle(pixels, width, height, cx, cy, radius, color) {
  for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(height - 1, Math.ceil(cy + radius)); y += 1) {
    for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(width - 1, Math.ceil(cx + radius)); x += 1) {
      if (Math.hypot(x - cx, y - cy) <= radius) {
        setPixel(pixels, width, x, y, color);
      }
    }
  }
}

function setPixel(pixels, width, x, y, color) {
  const offset = (Math.round(y) * width + Math.round(x)) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = Math.max(pixels[offset + 3], color[3]);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

async function exists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
