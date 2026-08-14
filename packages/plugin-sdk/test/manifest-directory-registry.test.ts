import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ManifestDirectoryDeveloperDiagnostics,
  ManifestDirectoryPluginRegistry,
} from "../src/manifest-directory-registry";

let tempRoot: string | undefined;

async function makeTempRoot(): Promise<string> {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-plugin-sdk-"));
  return tempRoot;
}

afterEach(async () => {
  if (tempRoot) {
    await rm(tempRoot, { force: true, recursive: true });
    tempRoot = undefined;
  }
});

async function writeValidPlugin(directory: string): Promise<void> {
  await mkdir(path.join(directory, "schemas"), { recursive: true });
  await writeFile(
    path.join(directory, "manifest.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        id: "cn.example.local-readonly-smoke",
        name: "Local Read-only Smoke Plugin",
        version: "0.1.0",
        apiVersion: "1",
        entry: "dist/main.js",
        runtime: "node-worker",
        capabilities: [
          {
            name: "local.lookup",
            description: "Read-only local manifest discovery smoke capability.",
            inputSchema: "schemas/input.json",
            outputSchema: "schemas/output.json",
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
  await writeFile(
    path.join(directory, "schemas", "input.json"),
    `${JSON.stringify({ type: "object", additionalProperties: false })}\n`,
  );
  await writeFile(
    path.join(directory, "schemas", "output.json"),
    `${JSON.stringify({ type: "object", additionalProperties: false })}\n`,
  );
}

describe("ManifestDirectoryPluginRegistry", () => {
  it("lists only valid local manifests while diagnostics reports sanitized failures", async () => {
    const root = await makeTempRoot();
    const validDirectory = path.join(root, "valid-plugin");
    const invalidDirectory = path.join(root, "invalid-plugin");
    await writeValidPlugin(validDirectory);
    await mkdir(invalidDirectory, { recursive: true });
    await writeFile(path.join(invalidDirectory, "manifest.json"), "{ nope");

    const registry = new ManifestDirectoryPluginRegistry({
      directories: [validDirectory, invalidDirectory],
      rootDirectory: root,
    });
    await expect(registry.listPlugins()).resolves.toMatchObject([
      {
        id: "cn.example.local-readonly-smoke",
        name: "Local Read-only Smoke Plugin",
      },
    ]);

    const diagnostics = new ManifestDirectoryDeveloperDiagnostics({
      directories: [validDirectory, invalidDirectory],
      now: () => new Date("2026-08-11T00:00:00.000Z"),
      rootDirectory: root,
    });

    await expect(diagnostics.getStatus()).resolves.toMatchObject({
      discoveryStatus: "degraded",
      enabled: true,
      configuredDirectoryCount: 2,
      scannedDirectoryCount: 2,
      validManifestCount: 1,
      invalidManifestCount: 1,
      rawPathsExposed: false,
      thirdPartyCodeExecuted: false,
      marketplaceAccessed: false,
      installOrEnableActionExposed: false,
      directories: [
        {
          directoryRef: "local-plugin-dir-01",
          state: "discovered",
          pluginId: "cn.example.local-readonly-smoke",
          issueCodes: [],
        },
        {
          directoryRef: "local-plugin-dir-02",
          state: "invalid",
          issueCodes: ["MANIFEST_JSON_INVALID"],
        },
      ],
    });
  });

  it("reports disabled discovery without scanning configured directories", async () => {
    const root = await makeTempRoot();
    const diagnostics = new ManifestDirectoryDeveloperDiagnostics({
      directories: [path.join(root, "would-not-scan")],
      enabled: false,
      now: () => new Date("2026-08-11T00:00:00.000Z"),
      rootDirectory: root,
    });

    await expect(diagnostics.getStatus()).resolves.toMatchObject({
      discoveryStatus: "disabled",
      enabled: false,
      configuredDirectoryCount: 0,
      scannedDirectoryCount: 0,
      directories: [],
      reasonCodes: ["LOCAL_MANIFEST_DISCOVERY_DISABLED"],
    });
  });
});
