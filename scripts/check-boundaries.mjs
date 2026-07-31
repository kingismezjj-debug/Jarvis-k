import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const root = process.cwd();
const packages = [
  {
    name: "contracts",
    root: path.join(root, "packages", "contracts"),
    allowedWorkspaceImports: new Set(),
    forbiddenImportPrefixes: ["electron", "node:", "react", "ws"]
  },
  {
    name: "voice",
    root: path.join(root, "packages", "voice"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: ["electron", "node:", "react", "ws"]
  },
  {
    name: "capabilities",
    root: path.join(root, "packages", "capabilities"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: ["electron", "node:", "react", "ws", "sql.js"]
  },
  {
    name: "memory",
    root: path.join(root, "packages", "memory"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: ["electron", "node:", "react", "ws", "sql.js"]
  },
  {
    name: "memory-sqlite",
    root: path.join(root, "packages", "memory-sqlite"),
    allowedWorkspaceImports: new Set([
      "@jarvis-k/contracts",
      "@jarvis-k/memory"
    ]),
    forbiddenImportPrefixes: ["electron", "react", "ws"]
  },
  {
    name: "voice-capture-browser",
    root: path.join(root, "packages", "voice-capture-browser"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: ["electron", "node:", "ws"]
  },
  {
    name: "voice-adapter-xunfei",
    root: path.join(root, "packages", "voice-adapter-xunfei"),
    allowedWorkspaceImports: new Set(["@jarvis-k/voice"]),
    forbiddenImportPrefixes: ["electron", "react"]
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
    forbiddenImportPrefixes: ["electron", "react", "ws", "sql.js"]
  },
  {
    name: "core-host",
    root: path.join(root, "apps", "core-host"),
    allowedWorkspaceImports: new Set([
      "@jarvis-k/capabilities",
      "@jarvis-k/contracts",
      "@jarvis-k/core",
      "@jarvis-k/memory-sqlite",
      "@jarvis-k/voice",
      "@jarvis-k/voice-adapter-xunfei"
    ]),
    forbiddenImportPrefixes: ["electron", "react"]
  },
  {
    name: "ui",
    root: path.join(root, "apps", "ui"),
    allowedWorkspaceImports: new Set([
      "@jarvis-k/contracts",
      "@jarvis-k/voice-capture-browser"
    ]),
    forbiddenImportPrefixes: ["electron", "node:", "ws"]
  },
  {
    name: "desktop",
    root: path.join(root, "apps", "desktop"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"]),
    forbiddenImportPrefixes: ["react", "ws"]
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

const violations = [];

for (const workspacePackage of packages) {
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
          specifier === prefix || specifier.startsWith(`${prefix}/`)
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
