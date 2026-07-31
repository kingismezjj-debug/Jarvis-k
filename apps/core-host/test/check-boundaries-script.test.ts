import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const boundaryScriptPath = path.join(
  repositoryRoot,
  "scripts",
  "check-boundaries.mjs"
);
const workspaceRoots = [
  path.join("packages", "contracts"),
  path.join("packages", "voice"),
  path.join("packages", "capabilities"),
  path.join("packages", "memory"),
  path.join("packages", "memory-sqlite"),
  path.join("packages", "voice-capture-browser"),
  path.join("packages", "voice-adapter-xunfei"),
  path.join("packages", "core"),
  path.join("apps", "core-host"),
  path.join("apps", "ui"),
  path.join("apps", "desktop")
];

describe("check-boundaries script", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-boundaries-")
    );
    await createMinimalWorkspace(directory);
  });

  afterEach(async () => {
    await rm(directory, { force: true, recursive: true });
  });

  it("passes a minimal workspace with no runtime dependencies", async () => {
    await expect(runBoundaryCheck(directory)).resolves.toContain(
      "PASS dependency boundaries"
    );
  });

  it("fails when a workspace declares a forbidden model runtime dependency", async () => {
    await writePackageManifest(
      path.join(directory, "packages", "capabilities"),
      {
        dependencies: {
          "@jarvis-k/contracts": "*",
          "onnxruntime-node": "^1.0.0"
        }
      }
    );

    await expect(runBoundaryCheck(directory)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "forbidden Phase 4.5 model runtime dependency onnxruntime-node"
      )
    });
  });

  it("fails when protected source imports a forbidden model runtime SDK", async () => {
    await writeSourceFile(
      path.join(directory, "packages", "capabilities"),
      "import { pipeline } from \"@huggingface/transformers\";\nvoid pipeline;\n"
    );

    await expect(runBoundaryCheck(directory)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "imports forbidden runtime dependency @huggingface/transformers"
      )
    });
  });

  it("fails when Core imports a concrete persistence adapter", async () => {
    await writeSourceFile(
      path.join(directory, "packages", "core"),
      "import { SqliteMemoryRepository } from \"@jarvis-k/memory-sqlite\";\nvoid SqliteMemoryRepository;\n"
    );

    await expect(runBoundaryCheck(directory)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "imports forbidden workspace package @jarvis-k/memory-sqlite"
      )
    });
  });

  it("fails when UI imports capability policy directly", async () => {
    await writeSourceFile(
      path.join(directory, "apps", "ui"),
      "import { StaticModelRegistry } from \"@jarvis-k/capabilities\";\nvoid StaticModelRegistry;\n"
    );

    await expect(runBoundaryCheck(directory)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "imports forbidden workspace package @jarvis-k/capabilities"
      )
    });
  });

  it("fails when Desktop imports a concrete voice provider adapter", async () => {
    await writeSourceFile(
      path.join(directory, "apps", "desktop"),
      "import { XunfeiRtasrProvider } from \"@jarvis-k/voice-adapter-xunfei\";\nvoid XunfeiRtasrProvider;\n"
    );

    await expect(runBoundaryCheck(directory)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "imports forbidden workspace package @jarvis-k/voice-adapter-xunfei"
      )
    });
  });
});

async function createMinimalWorkspace(root: string): Promise<void> {
  for (const workspaceRoot of workspaceRoots) {
    const absoluteRoot = path.join(root, workspaceRoot);
    await mkdir(path.join(absoluteRoot, "src"), { recursive: true });
    await writePackageManifest(absoluteRoot, {});
  }
}

async function writePackageManifest(
  root: string,
  fields: Record<string, unknown>
): Promise<void> {
  await writeFile(
    path.join(root, "package.json"),
    `${JSON.stringify({ private: true, ...fields }, null, 2)}\n`
  );
}

async function writeSourceFile(
  root: string,
  contents: string
): Promise<void> {
  await writeFile(path.join(root, "src", "index.ts"), contents);
}

async function runBoundaryCheck(cwd: string): Promise<string> {
  const { stdout } = await execFileAsync(
    process.execPath,
    [boundaryScriptPath],
    {
      cwd,
      windowsHide: true
    }
  );
  return stdout;
}
