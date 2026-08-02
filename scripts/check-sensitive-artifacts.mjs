import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
    continue;
  }

  const contentViolation = inspectTrackedContent(root, normalized);
  if (contentViolation) {
    violations.push(`${normalized} contains ${contentViolation}`);
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

function inspectTrackedContent(cwd, relativePath) {
  let contents;
  try {
    contents = readFileSync(path.join(cwd, relativePath), "utf8");
  } catch {
    return undefined;
  }

  if (contents.includes("\0")) {
    return undefined;
  }

  const assignmentPattern =
    /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret)\b\s*[:=]\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|`([^`\r\n]*)`)/giu;
  for (const match of contents.matchAll(assignmentPattern)) {
    const value = match[1] ?? match[2] ?? match[3] ?? "";
    if (!isPlaceholderValue(value)) {
      return "a credential-like assignment";
    }
  }

  const envAssignmentPattern =
    /^\s*(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret)\s*=\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|`([^`\r\n]*)`|([^\s#]+))/gimu;
  for (const match of contents.matchAll(envAssignmentPattern)) {
    const value = match[1] ?? match[2] ?? match[3] ?? match[4] ?? "";
    if (!isPlaceholderValue(value)) {
      return "a credential-like assignment";
    }
  }

  const bearerPattern = /\bBearer\s+([A-Za-z0-9._~+/=-]{8,})/gu;
  for (const match of contents.matchAll(bearerPattern)) {
    if (!isPlaceholderValue(match[1] ?? "")) {
      return "a bearer token";
    }
  }

  const signedUrlPattern =
    /https?:\/\/[^\s"'`<>]+[?&](?:token|access_token|api[_-]?key|signature|sig|x-amz-signature|x-amz-credential)=([^&\s"'`<>]+)/giu;
  for (const match of contents.matchAll(signedUrlPattern)) {
    if (!isPlaceholderValue(match[1] ?? "")) {
      return "a credential-bearing URL";
    }
  }

  return undefined;
}

function isPlaceholderValue(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }
  if (
    normalized.includes("redacted") ||
    normalized.includes("placeholder") ||
    normalized.includes("not-a-credential")
  ) {
    return true;
  }
  return new Set([
    "example",
    "example-key",
    "example-token",
    "fixture-key",
    "local-api-key",
    "not-a-real-key",
    "remove-key",
    "test-key",
    "test-token",
    "unused-key"
  ]).has(normalized);
}
