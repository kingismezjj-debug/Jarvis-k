import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const artifactScriptPath = path.join(
  repositoryRoot,
  "scripts",
  "check-sensitive-artifacts.mjs"
);

describe("check-sensitive-artifacts script", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-artifacts-")
    );
    await execGit(directory, ["init"]);
  });

  afterEach(async () => {
    await rm(directory, { force: true, recursive: true });
  });

  it("passes tracked source files and the public env example", async () => {
    await writeTrackedFile("src/index.ts", "export const ok = true;\n");
    await writeTrackedFile(
      ".env.example",
      "API_KEY=placeholder\n"
    );

    await expect(runArtifactCheck(directory)).resolves.toContain(
      "PASS sensitive artifact guard"
    );
  });

  it("fails on credential-like content without echoing the value", async () => {
    const secretValue = ["live", "secret", "value"].join("-");
    const source = [
      "export const ",
      "apiKey",
      ' = "',
      secretValue,
      '";\n'
    ].join("");
    await writeTrackedFile(
      "src/index.ts",
      source
    );

    const result = runArtifactCheck(directory);
    await expect(result).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "src/index.ts contains a credential-like assignment"
      )
    });
    await expect(result).rejects.not.toMatchObject({
      stderr: expect.stringContaining("live-secret-value")
    });
  });

  it("fails on signed URL content without echoing the value", async () => {
    const signedUrl = [
      "https://example.invalid/model?",
      "token=",
      ["secret", "token", "value"].join("-")
    ].join("");
    await writeTrackedFile(
      "docs/model.md",
      `${signedUrl}\n`
    );

    await expect(runArtifactCheck(directory)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "docs/model.md contains a credential-bearing URL"
      )
    });
  });

  it("allows explicit fixture credential placeholders in tests", async () => {
    await writeTrackedFile(
      "src/provider.test.ts",
      [
        'export const one = { apiKey: "test-provider-key" };\n',
        'export const two = { apiKey: "fixture-only-key" };\n',
        'export const three = { apiKey: "vendor-test-api-key" };\n'
      ].join("")
    );

    await expect(runArtifactCheck(directory)).resolves.toContain(
      "PASS sensitive artifact guard"
    );
  });

  it("ignores indented runtime credential variable assignments without literals", async () => {
    await writeTrackedFile(
      "scripts/configure-credential.cjs",
      [
        "function submit(rawInput) {\n",
        "  let apiKey;\n",
        "  apiKey = parseCredentialInput(rawInput);\n",
        "  return { credentials: { apiKey } };\n",
        "}\n"
      ].join("")
    );

    await expect(runArtifactCheck(directory)).resolves.toContain(
      "PASS sensitive artifact guard"
    );
  });

  it("fails when a local env file is tracked", async () => {
    await writeTrackedFile(".env.local", "PLACEHOLDER=value\n");

    await expect(runArtifactCheck(directory)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        ".env.local looks like a local environment file"
      )
    });
  });

  it("fails when a model artifact is tracked", async () => {
    await writeTrackedFile("models/fixture/model.onnx", "placeholder\n");

    await expect(runArtifactCheck(directory)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "models/fixture/model.onnx is under a forbidden model artifact directory"
      )
    });
  });

  it("fails when a local database file is tracked", async () => {
    await writeTrackedFile("memory.sqlite", "placeholder\n");

    await expect(runArtifactCheck(directory)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "memory.sqlite has a forbidden sensitive artifact extension"
      )
    });
  });

  async function writeTrackedFile(
    relativePath: string,
    contents: string
  ): Promise<void> {
    const absolutePath = path.join(directory, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, contents);
    await execGit(directory, ["add", relativePath]);
  }
});

async function runArtifactCheck(cwd: string): Promise<string> {
  const { stdout } = await execFileAsync(
    process.execPath,
    [artifactScriptPath],
    {
      cwd,
      windowsHide: true
    }
  );
  return stdout;
}

async function execGit(
  cwd: string,
  args: string[]
): Promise<void> {
  await execFileAsync("git", args, {
    cwd,
    windowsHide: true
  });
}
