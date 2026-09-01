import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const packagedAppDirectory = path.join(
  rootDirectory,
  "artifacts",
  "packaged",
  "win-unpacked",
  "resources",
  "app",
);

const deniedRuntimeStrings = [
  "--jarvis-internal-settings-v2-fault",
  "settings_v2_render_failure",
  "settings_v2_mount_timeout",
  "settingsV2InternalFaultMode",
  "Controlled Settings V2 internal render failure",
  "SettingsV2InternalFaultTrigger",
  "settings-v2-internal-fault-mode",
];

const requiredRuntimeStrings = [
  "settings_v2_session_fallback",
  "settings_v2_renderer_failure",
  "settings_v2_mounting",
  "settings_v2_ready",
  "settings_v2_unmounted",
  "settings-v2-session-fallback-pending",
  "New settings could not be displayed. Opening classic settings...",
  "settings-v2-session-rollback",
  "Use classic settings",
  "use_classic_settings",
  "settingsV2MountTimeoutMs",
];

function fail(message, details = {}) {
  console.error(JSON.stringify({ status: "FAIL", message, ...details }, null, 2));
  process.exit(1);
}

function walk(directory) {
  const entries = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walk(fullPath));
    } else {
      entries.push(fullPath);
    }
  }
  return entries;
}

function relativeToPackage(fullPath) {
  return path.relative(packagedAppDirectory, fullPath).split(path.sep).join("/");
}

if (!existsSync(packagedAppDirectory)) {
  fail("Packaged app directory is missing. Run npm run package:windows:dir first.");
}

const textFiles = walk(packagedAppDirectory).filter((fullPath) => {
  if (!statSync(fullPath).isFile()) return false;
  return /\.(?:cjs|css|html|js|json|mjs|txt)$/i.test(fullPath);
});

const deniedMatches = [];
const requiredMatches = new Map(
  requiredRuntimeStrings.map((value) => [value, []]),
);

for (const fullPath of textFiles) {
  const content = readFileSync(fullPath, "utf8");
  const relativePath = relativeToPackage(fullPath);
  for (const denied of deniedRuntimeStrings) {
    if (content.includes(denied)) {
      deniedMatches.push({ string: denied, file: relativePath });
    }
  }
  for (const required of requiredRuntimeStrings) {
    if (content.includes(required)) {
      requiredMatches.get(required).push(relativePath);
    }
  }
}

if (deniedMatches.length > 0) {
  fail("Internal Settings V2 fault hook strings are present in packaged runtime.", {
    deniedMatches,
  });
}

const missingRequired = [...requiredMatches.entries()]
  .filter(([, files]) => files.length === 0)
  .map(([required]) => required);
if (missingRequired.length > 0) {
  fail("Production Settings V2 fallback strings are missing from packaged runtime.", {
    missingRequired,
  });
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      scannedFiles: textFiles.length,
      deniedRuntimeStrings,
      requiredRuntimeStrings: Object.fromEntries(
        [...requiredMatches.entries()].map(([required, files]) => [
          required,
          [...new Set(files)].slice(0, 5),
        ]),
      ),
      packagedRuntime: "artifacts/packaged/win-unpacked/resources/app",
    },
    null,
    2,
  ),
);
