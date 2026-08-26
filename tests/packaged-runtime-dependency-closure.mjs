import { builtinModules, createRequire } from "node:module";
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
const allowedExternalModules = new Set([
  "electron",
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
]);

const expectedWorkspaceModules = [
  "@jarvis-k/capabilities",
  "@jarvis-k/contracts",
  "@jarvis-k/core",
  "@jarvis-k/inference-adapter-embedding-local",
  "@jarvis-k/inference-adapter-fixture",
  "@jarvis-k/inference-adapter-glm-chat-answer-runtime",
  "@jarvis-k/inference-adapter-deepseek-runtime",
  "@jarvis-k/inference-adapter-glm-planner",
  "@jarvis-k/inference-adapter-glm-runtime",
  "@jarvis-k/inference-adapter-openai-chat-answer",
  "@jarvis-k/inference-adapter-openai-planner",
  "@jarvis-k/inference-adapter-qwen-router",
  "@jarvis-k/inference-runtime-transformers-local",
  "@jarvis-k/memory",
  "@jarvis-k/memory-sqlite",
  "@jarvis-k/plugin-sdk",
  "@jarvis-k/voice",
  "@jarvis-k/voice-adapter-volcengine",
  "@jarvis-k/voice-adapter-xunfei",
];

const packagedWorkspaceModules = [
  ...expectedWorkspaceModules,
  "@jarvis-k/voice-capture-browser",
];

const requiredEntryFiles = [
  "apps/desktop/dist/main.js",
  "apps/desktop/dist/lifecycle/desktop-lifecycle-controller.js",
  "apps/desktop/dist/preload.cjs",
  "apps/core-host/dist/index.js",
];

function fail(message, detail = {}) {
  console.error(JSON.stringify({ status: "FAIL", message, ...detail }, null, 2));
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

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isBareSpecifier(specifier) {
  return (
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !specifier.startsWith("file:") &&
    !specifier.match(/^[a-zA-Z]:[\\/]/u)
  );
}

function packageRootFor(specifier) {
  if (specifier.startsWith("@")) {
    const [scope, name] = specifier.split("/");
    return `${scope}/${name}`;
  }
  return specifier.split("/")[0];
}

function extractBareSpecifiers(filePath) {
  const content = readFileSync(filePath, "utf8");
  const specifiers = new Set();
  const staticRequirePattern =
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)|\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu;
  let match;
  while ((match = staticRequirePattern.exec(content)) !== null) {
    const specifier = match[1] ?? match[2];
    if (isBareSpecifier(specifier)) {
      specifiers.add(specifier);
    }
  }
  if (/\brequire\s*\(\s*(?!["'])/u.test(content)) {
    fail("Packaged JS contains dynamic require that cannot be audited.", {
      file: path.relative(packagedAppDirectory, filePath),
    });
  }
  return specifiers;
}

if (!existsSync(packagedAppDirectory)) {
  fail("Packaged app directory is missing.", { packagedAppDirectory });
}

for (const relativePath of requiredEntryFiles) {
  const fullPath = path.join(packagedAppDirectory, relativePath);
  if (!existsSync(fullPath)) {
    fail("Required runtime entry is missing.", { relativePath });
  }
}

for (const moduleName of packagedWorkspaceModules) {
  const packageJsonPath = path.join(
    packagedAppDirectory,
    "node_modules",
    ...moduleName.split("/"),
    "package.json",
  );
  const distEntryPath = path.join(
    packagedAppDirectory,
    "node_modules",
    ...moduleName.split("/"),
    "dist",
    "index.js",
  );
  if (!existsSync(packageJsonPath) || !existsSync(distEntryPath)) {
    fail("Packaged workspace runtime module is incomplete.", {
      moduleName,
      packageJsonPath,
      distEntryPath,
    });
  }
}

const jsFiles = walk(packagedAppDirectory).filter(
  (entry) =>
    statSync(entry).isFile() &&
    /\.(?:js|cjs)$/i.test(entry) &&
    !entry.includes(`${path.sep}node_modules${path.sep}zod${path.sep}`) &&
    !entry.includes(`${path.sep}node_modules${path.sep}sql.js${path.sep}`) &&
    !entry.includes(`${path.sep}node_modules${path.sep}ws${path.sep}`),
);
const resolvedModules = new Map();
const requiredPackageRoots = new Set();

for (const filePath of jsFiles) {
  const fileRequire = createRequire(filePath);
  for (const specifier of extractBareSpecifiers(filePath)) {
    const rootSpecifier = packageRootFor(specifier);
    if (allowedExternalModules.has(specifier) || allowedExternalModules.has(rootSpecifier)) {
      continue;
    }
    requiredPackageRoots.add(rootSpecifier);
    let resolved;
    try {
      resolved = fileRequire.resolve(specifier);
    } catch (error) {
      fail("Packaged runtime dependency cannot be resolved.", {
        file: path.relative(packagedAppDirectory, filePath),
        specifier,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    if (!isInside(resolved, packagedAppDirectory)) {
      fail("Packaged runtime dependency resolved outside resources/app.", {
        file: path.relative(packagedAppDirectory, filePath),
        specifier,
        resolved,
      });
    }
    resolvedModules.set(specifier, resolved);
  }
}

for (const moduleName of expectedWorkspaceModules) {
  if (!resolvedModules.has(moduleName)) {
    fail("Expected workspace runtime module was not exercised by closure scan.", {
      moduleName,
    });
  }
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      packagedAppDirectory,
      moduleResolutionIsolation: true,
      scannedJsFiles: jsFiles.length,
      requiredPackageRoots: [...requiredPackageRoots].sort(),
      resolvedModules: resolvedModules.size,
      expectedWorkspaceModules: expectedWorkspaceModules.length,
    },
    null,
    2,
  ),
);
