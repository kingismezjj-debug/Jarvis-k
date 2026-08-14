import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const validatorPath = path.join(
  repositoryRoot,
  "scripts",
  "validate-plugin-manifest.mjs",
);

describe("plugin manifest validator script", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-plugin-"));
  });

  afterEach(async () => {
    await rm(directory, { force: true, recursive: true });
  });

  it("validates both bundled read-only sample plugins", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        validatorPath,
        "examples/plugins/stock-analysis",
        "examples/plugins/ecommerce-product-comparison",
      ],
      {
        cwd: repositoryRoot,
      },
    );

    const result = JSON.parse(stdout);
    expect(result).toMatchObject({
      status: "PASS",
      pluginCount: 2,
    });
    expect(
      result.reports.every((report: { readOnly: boolean }) => report.readOnly),
    ).toBe(true);
  });

  it("validates the local plugin authoring template without executing handler code", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      [validatorPath, "examples/local-plugins/hello-readonly"],
      {
        cwd: repositoryRoot,
      },
    );

    const result = JSON.parse(stdout);
    expect(result).toMatchObject({
      status: "PASS",
      pluginCount: 1,
      reports: [
        {
          pluginId: "cn.example.hello-readonly",
          capabilityCount: 1,
          permissionCount: 0,
          readOnly: true,
        },
      ],
    });
    expect(stdout).not.toContain("Template result");
  });

  it("rejects unsafe commerce mutation capabilities", async () => {
    await writePlugin({
      capabilityName: "payment.checkout",
      capabilityDescription: "Read-only checkout payment sample.",
    });

    await expect(
      execFileAsync(process.execPath, [validatorPath, directory], {
        cwd: repositoryRoot,
      }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "Plugin capabilities must not declare trading, ordering, checkout, or payment actions.",
      ),
    });
  });

  async function writePlugin(input: {
    capabilityName: string;
    capabilityDescription: string;
  }) {
    await mkdir(path.join(directory, "schemas"), { recursive: true });
    await writeFile(
      path.join(directory, "schemas", "sample-input.json"),
      `${JSON.stringify({ type: "object" }, null, 2)}\n`,
    );
    await writeFile(
      path.join(directory, "schemas", "sample-output.json"),
      `${JSON.stringify({ type: "object" }, null, 2)}\n`,
    );
    await writeFile(
      path.join(directory, "manifest.json"),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          id: "cn.example.unsafe-commerce",
          name: "Unsafe Commerce",
          version: "0.1.0",
          apiVersion: "1",
          entry: "dist/main.js",
          runtime: "node-worker",
          capabilities: [
            {
              name: input.capabilityName,
              description: input.capabilityDescription,
              inputSchema: "schemas/sample-input.json",
              outputSchema: "schemas/sample-output.json",
              risk: "read_only",
              readOnly: true,
            },
          ],
          permissions: [],
        },
        null,
        2,
      )}\n`,
    );
  }
});
