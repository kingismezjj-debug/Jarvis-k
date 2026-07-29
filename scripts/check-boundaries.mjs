import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const root = process.cwd();
const packages = [
  {
    name: "contracts",
    root: path.join(root, "packages", "contracts"),
    allowedWorkspaceImports: new Set()
  },
  {
    name: "core",
    root: path.join(root, "packages", "core"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"])
  },
  {
    name: "ui",
    root: path.join(root, "apps", "ui"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"])
  },
  {
    name: "desktop",
    root: path.join(root, "apps", "desktop"),
    allowedWorkspaceImports: new Set(["@jarvis-k/contracts"])
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
