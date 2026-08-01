import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const root = process.cwd();
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies"
];
const forbiddenModelRuntimeDependencies = [
  "@huggingface/",
  "@tensorflow/",
  "@xenova/",
  "ctranslate2",
  "llama-cpp",
  "node-llama-cpp",
  "onnxruntime",
  "onnxruntime-node",
  "onnxruntime-web",
  "paddlejs",
  "python-shell",
  "transformers"
];
const packages = [
  {
    name: "contracts",
    root: path.join(root, "packages", "contracts"),
    allowedWorkspaceImports: new Set(),
    forbiddenImportPrefixes: [
      "electron",
      "node:",
      "react",
      "ws",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "voice",
    root: path.join(root, "packages", "voice"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: [
      "electron",
      "node:",
      "react",
      "ws",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "capabilities",
    root: path.join(root, "packages", "capabilities"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: [
      "electron",
      "node:",
      "react",
      "ws",
      "sql.js",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "inference-adapter-embedding-local",
    root: path.join(root, "packages", "inference-adapter-embedding-local"),
    allowedWorkspaceImports: new Set([
      "@jarvis-k/capabilities",
      "@jarvis-k/contracts"
    ]),
    forbiddenImportPrefixes: [
      "electron",
      "node:",
      "react",
      "ws",
      "sql.js",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "inference-adapter-fixture",
    root: path.join(root, "packages", "inference-adapter-fixture"),
    allowedWorkspaceImports: new Set([
      "@jarvis-k/capabilities",
      "@jarvis-k/contracts"
    ]),
    forbiddenImportPrefixes: [
      "electron",
      "node:",
      "react",
      "ws",
      "sql.js",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "memory",
    root: path.join(root, "packages", "memory"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: [
      "electron",
      "node:",
      "react",
      "ws",
      "sql.js",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "memory-sqlite",
    root: path.join(root, "packages", "memory-sqlite"),
    allowedWorkspaceImports: new Set([
      "@jarvis-k/contracts",
      "@jarvis-k/memory"
    ]),
    forbiddenImportPrefixes: [
      "electron",
      "react",
      "ws",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "voice-capture-browser",
    root: path.join(root, "packages", "voice-capture-browser"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: [
      "electron",
      "node:",
      "ws",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "voice-adapter-xunfei",
    root: path.join(root, "packages", "voice-adapter-xunfei"),
    allowedWorkspaceImports: new Set(["@jarvis-k/voice"]),
    forbiddenImportPrefixes: [
      "electron",
      "react",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "core",
    root: path.join(root, "packages", "core"),
    allowedWorkspaceImports: new Set([
      "@jarvis-k/capabilities",
      "@jarvis-k/contracts",
      "@jarvis-k/memory",
      "@jarvis-k/voice"
    ]),
    forbiddenImportPrefixes: [
      "electron",
      "react",
      "ws",
      "sql.js",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "core-host",
    root: path.join(root, "apps", "core-host"),
    allowedWorkspaceImports: new Set([
      "@jarvis-k/capabilities",
      "@jarvis-k/contracts",
      "@jarvis-k/core",
      "@jarvis-k/inference-adapter-embedding-local",
      "@jarvis-k/inference-adapter-fixture",
      "@jarvis-k/memory-sqlite",
      "@jarvis-k/voice",
      "@jarvis-k/voice-adapter-xunfei"
    ]),
    forbiddenImportPrefixes: [
      "electron",
      "react",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "ui",
    root: path.join(root, "apps", "ui"),
    allowedWorkspaceImports: new Set([
      "@jarvis-k/contracts",
      "@jarvis-k/voice-capture-browser"
    ]),
    forbiddenImportPrefixes: [
      "electron",
      "node:",
      "ws",
      ...forbiddenModelRuntimeDependencies
    ]
  },
  {
    name: "desktop",
    root: path.join(root, "apps", "desktop"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: [
      "react",
      "ws",
      ...forbiddenModelRuntimeDependencies
    ]
  }
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(absolutePath);
    }
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  });
}

function collectImports(filePath) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );
  const imports = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}

function readPackageManifest(packageRoot) {
  const manifestPath = path.join(packageRoot, "package.json");
  if (!fs.existsSync(manifestPath)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function collectDependencies(manifest) {
  const dependencies = [];
  for (const field of dependencyFields) {
    const values = manifest[field] ?? {};
    for (const dependencyName of Object.keys(values)) {
      dependencies.push({ field, dependencyName });
    }
  }
  return dependencies;
}

function matchesForbiddenPrefix(value, prefix) {
  if (prefix.endsWith("/")) {
    return value.startsWith(prefix);
  }
  return value === prefix || value.startsWith(`${prefix}/`);
}

function matchesForbiddenDependency(value, forbidden) {
  return value === forbidden || value.startsWith(forbidden);
}

const violations = [];

for (const workspacePackage of packages) {
  const manifest = readPackageManifest(workspacePackage.root);
  if (manifest) {
    for (const { field, dependencyName } of collectDependencies(manifest)) {
      const forbiddenDependency = forbiddenModelRuntimeDependencies.find(
        (item) => matchesForbiddenDependency(dependencyName, item)
      );
      if (forbiddenDependency) {
        violations.push(
          `${path.relative(root, workspacePackage.root)} package.json ${field} includes forbidden Phase 4.5 model runtime dependency ${dependencyName}`
        );
      }
    }
  }

  const sourceRoot = path.join(workspacePackage.root, "src");
  for (const filePath of walk(sourceRoot)) {
    for (const specifier of collectImports(filePath)) {
      if (
        specifier.startsWith("@jarvis-k/") &&
        !workspacePackage.allowedWorkspaceImports.has(specifier)
      ) {
        violations.push(
          `${path.relative(root, filePath)} imports forbidden workspace package ${specifier}`
        );
      }

      if (
        workspacePackage.forbiddenImportPrefixes.some((prefix) =>
          matchesForbiddenPrefix(specifier, prefix)
        )
      ) {
        violations.push(
          `${path.relative(root, filePath)} imports forbidden runtime dependency ${specifier}`
        );
      }

      if (specifier.startsWith(".")) {
        const resolved = path.resolve(path.dirname(filePath), specifier);
        const relative = path.relative(workspacePackage.root, resolved);
        if (relative.startsWith("..") || path.isAbsolute(relative)) {
          violations.push(
            `${path.relative(root, filePath)} crosses its workspace boundary via ${specifier}`
          );
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Dependency boundary violations:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("PASS dependency boundaries");
