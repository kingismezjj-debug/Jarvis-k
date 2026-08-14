import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { PluginManifestSchema } from "@jarvis-k/contracts";

const root = process.cwd();
const inputs = process.argv.slice(2);

if (inputs.length === 0) {
  console.error(
    "Usage: node scripts/validate-plugin-manifest.mjs <plugin-dir-or-manifest> [...]"
  );
  process.exit(1);
}

const reports = [];

for (const input of inputs) {
  const target = path.resolve(root, input);
  const manifestPath = fs.statSync(target).isDirectory()
    ? path.join(target, "manifest.json")
    : target;
  const pluginRoot = path.dirname(manifestPath);
  const manifest = readJson(manifestPath);
  const parsed = PluginManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "manifest"}: ${issue.message}`)
      .join("; ");
    throw new Error(`${path.relative(root, manifestPath)} invalid: ${message}`);
  }

  for (const capability of parsed.data.capabilities) {
    assertSchemaPath(pluginRoot, capability.inputSchema, manifestPath);
    assertSchemaPath(pluginRoot, capability.outputSchema, manifestPath);
  }

  reports.push({
    manifest: path.relative(root, manifestPath),
    pluginId: parsed.data.id,
    capabilityCount: parsed.data.capabilities.length,
    permissionCount: parsed.data.permissions.length,
    readOnly: parsed.data.capabilities.every(
      (capability) => capability.readOnly && capability.risk === "read_only"
    )
  });
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      pluginCount: reports.length,
      reports
    },
    null,
    2
  )
);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${path.relative(root, filePath)} is not readable JSON.`);
  }
}

function assertSchemaPath(pluginRoot, schemaPath, manifestPath) {
  const resolved = path.resolve(pluginRoot, schemaPath);
  const relative = path.relative(pluginRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `${path.relative(root, manifestPath)} references schema outside the plugin directory.`
    );
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `${path.relative(root, manifestPath)} references missing schema ${schemaPath}.`
    );
  }
  readJson(resolved);
}
