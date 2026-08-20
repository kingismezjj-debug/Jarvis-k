import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const packageJsonPath = path.join(rootDirectory, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const unpackedAppDirectory = path.join(
  rootDirectory,
  "artifacts",
  "packaged",
  "win-unpacked",
  "resources",
  "app",
);

const requiredPaths = [
  "package.json",
  "apps/desktop/dist/main.js",
  "apps/desktop/dist/preload.cjs",
  "apps/desktop/assets/tray-icon.png.base64",
  "apps/ui/dist/index.html",
  "apps/core-host/dist/index.js",
  "packages/contracts/dist/index.js",
  "packages/core/dist/index.js",
];

const deniedTopLevelPaths = [
  ".git",
  "datasets",
  "reports",
  "artifacts",
  "models",
  "docs",
  "tests",
  "scripts",
];

const deniedPathSegments = [
  ".git",
  "datasets",
  "reports",
  "artifacts",
  "models",
  "tests",
  "scripts",
];

const deniedFilePatterns = [
  /\.env(?:\..*)?$/i,
  /\.log$/i,
  /\.sqlite3?$/i,
  /\.db$/i,
  /\.map$/i,
  /\.d\.ts$/i,
  /\.gguf$/i,
  /\.onnx$/i,
  /\.safetensors$/i,
];

function fail(message) {
  console.error(JSON.stringify({ status: "FAIL", message }, null, 2));
  process.exit(1);
}

function walk(directory) {
  const entries = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    entries.push(fullPath);
    if (entry.isDirectory()) {
      entries.push(...walk(fullPath));
    }
  }
  return entries;
}

if (!existsSync(unpackedAppDirectory)) {
  fail(`Unpacked app directory is missing: ${unpackedAppDirectory}`);
}

if (packageJson.main !== "apps/desktop/dist/main.js") {
  fail("Root package main does not point to desktop packaged entry.");
}

if (packageJson.build?.appId !== "com.jarvisk.desktop") {
  fail("Electron builder appId is not stable.");
}
if (packageJson.build?.productName !== "Jarvis-K") {
  fail("Electron builder productName is not Jarvis-K.");
}
if (packageJson.build?.asar !== false) {
  fail("Alpha packaged runtime must keep asar disabled for child process paths.");
}
if (packageJson.build?.win?.forceCodeSigning !== false) {
  fail("Unsigned Alpha config must not require code signing.");
}
if (packageJson.build?.win?.signAndEditExecutable !== false) {
  fail("Unsigned Alpha config must not pretend to sign executables.");
}
if (packageJson.build?.nsis?.deleteAppDataOnUninstall !== false) {
  fail("Uninstall must not delete user data by default.");
}

for (const relativePath of requiredPaths) {
  const fullPath = path.join(unpackedAppDirectory, relativePath);
  if (!existsSync(fullPath)) {
    fail(`Required packaged resource is missing: ${relativePath}`);
  }
}

for (const relativePath of deniedTopLevelPaths) {
  if (existsSync(path.join(unpackedAppDirectory, relativePath))) {
    fail(`Denied top-level resource was packaged: ${relativePath}`);
  }
}

const allEntries = walk(unpackedAppDirectory);
const deniedEntries = [];
for (const fullPath of allEntries) {
  const relativePath = path.relative(unpackedAppDirectory, fullPath);
  const parts = relativePath.split(path.sep);
  if (parts.some((part) => deniedPathSegments.includes(part))) {
    deniedEntries.push(relativePath);
    continue;
  }
  if (deniedFilePatterns.some((pattern) => pattern.test(relativePath))) {
    deniedEntries.push(relativePath);
  }
}
if (deniedEntries.length > 0) {
  fail(`Denied resources were packaged: ${deniedEntries.slice(0, 20).join(", ")}`);
}

const absolutePathLeaks = [];
for (const fullPath of allEntries) {
  if (!statSync(fullPath).isFile()) continue;
  if (!/\.(?:js|json|html|css|cjs|txt)$/i.test(fullPath)) continue;
  const content = readFileSync(fullPath, "utf8");
  if (/C:\\Users\\Administrator/i.test(content)) {
    absolutePathLeaks.push(path.relative(unpackedAppDirectory, fullPath));
  }
}
if (absolutePathLeaks.length > 0) {
  fail(`Packaged text resources contain developer machine paths: ${absolutePathLeaks.join(", ")}`);
}

const appPackageJson = JSON.parse(
  readFileSync(path.join(unpackedAppDirectory, "package.json"), "utf8"),
);
const digest = createHash("sha256")
  .update(JSON.stringify(appPackageJson))
  .digest("hex");

console.log(
  JSON.stringify(
    {
      status: "PASS",
      appId: packageJson.build.appId,
      productName: packageJson.build.productName,
      version: packageJson.version,
      asar: packageJson.build.asar,
      unsignedAlpha: true,
      requiredResources: requiredPaths.length,
      scannedEntries: allEntries.length,
      appPackageDigest: digest,
    },
    null,
    2,
  ),
);
