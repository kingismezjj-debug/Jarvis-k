import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const allowedEnvFiles = new Set([".env.example"]);
const forbiddenExactNames = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".env.test"
]);
const forbiddenPathSegments = new Set(["models"]);
const forbiddenArtifactExtensions = new Set([
  ".bin",
  ".ckpt",
  ".db",
  ".ggml",
  ".gguf",
  ".onnx",
  ".pb",
  ".pt",
  ".pth",
  ".safetensors",
  ".sqlite",
  ".sqlite3",
  ".tflite"
]);

const root = process.cwd();
const trackedFiles = listTrackedFiles(root);
const violations = [];

for (const filePath of trackedFiles) {
  const normalized = filePath.split(/[\\/]+/).join("/");
  const basename = path.posix.basename(normalized);
  const extension = path.posix.extname(normalized).toLowerCase();
  const segments = normalized.split("/");

  if (
    basename.startsWith(".env") &&
    !allowedEnvFiles.has(basename)
  ) {
    violations.push(`${normalized} looks like a local environment file`);
    continue;
  }

  if (forbiddenExactNames.has(basename)) {
    violations.push(`${normalized} looks like a local environment file`);
    continue;
  }

  if (segments.some((segment) => forbiddenPathSegments.has(segment))) {
    violations.push(`${normalized} is under a forbidden model artifact directory`);
    continue;
  }

  if (forbiddenArtifactExtensions.has(extension)) {
    violations.push(`${normalized} has a forbidden sensitive artifact extension`);
  }
}

if (violations.length > 0) {
  console.error("Sensitive artifact violations:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("PASS sensitive artifact guard");

function listTrackedFiles(cwd) {
  const output = execFileSync("git", ["ls-files", "-z"], {
    cwd,
    encoding: "utf8",
    windowsHide: true
  });
  return output.split("\0").filter(Boolean);
}
