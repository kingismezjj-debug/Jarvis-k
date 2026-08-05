import { createHash } from "node:crypto";
import {
  appendFile,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DeviceCapability, ModelManifest } from "@jarvis-k/contracts";
import {
  FileSystemModelLifecycleManager,
  type ArtifactFetcher
} from "../src/file-system-model-lifecycle";

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-models-"));
});

afterEach(async () => {
  await rm(directory, { force: true, recursive: true });
});

describe("FileSystemModelLifecycleManager", () => {
  it("downloads with resume support and verifies SHA-256", async () => {
    const bytes = Buffer.from("hello model artifact");
    const manifest = manifestFor(bytes);
    let attempt = 0;
    const fetchArtifact: ArtifactFetcher = async (request) => {
      attempt += 1;
      if (attempt === 1) {
        await appendFile(request.targetPath, bytes.subarray(0, 6));
        throw new Error("Network interrupted.");
      }
      expect(request.resumeFromBytes).toBe(6);
      await appendFile(
        request.targetPath,
        bytes.subarray(request.resumeFromBytes)
      );
    };
    const manager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact,
      now: () => new Date("2026-07-31T00:00:00.000Z")
    });

    await expect(manager.download(manifest, { device: device() })).rejects.toThrow(
      "MODEL_ARTIFACT_FETCH_FAILED"
    );
    const progress: string[] = [];
    const inventory = await manager.download(manifest, {
      device: device(),
      onProgress: (item) => progress.push(item.phase)
    });

    expect(progress).toEqual([
      "resuming",
      "downloading",
      "verifying",
      "complete"
    ]);
    expect(inventory.status).toBe("available");
    expect(inventory).not.toHaveProperty("installPath");
    const [modelDirectory] = await readdir(directory);
    const storedInventory = JSON.parse(
      await readFile(
        path.join(directory, modelDirectory, "inventory.json"),
        "utf8"
      )
    ) as Record<string, unknown>;
    expect(storedInventory).not.toHaveProperty("installPath");
    expect(await manager.verify(manifest.id)).toBe(true);
  });

  it("lists a missing inventory root without creating it", async () => {
    const missingRoot = path.join(directory, "not-created");
    const manager = new FileSystemModelLifecycleManager({
      rootDirectory: missingRoot,
      fetchArtifact: async () => undefined
    });

    await expect(manager.listInventory()).resolves.toEqual([]);
    await expect(stat(missingRoot)).rejects.toMatchObject({
      code: "ENOENT"
    });
  });

  it("moves models through available and loaded lifecycle states", async () => {
    const bytes = Buffer.from("loadable model artifact");
    const manifest = manifestFor(bytes);
    const manager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact: async (request) => {
        await appendFile(request.targetPath, bytes);
      }
    });

    await manager.download(manifest, { device: device() });
    expect((await manager.listInventory())[0]?.status).toBe("available");

    const loaded = await manager.load(manifest.id);
    expect(loaded.status).toBe("loaded");

    await manager.release(manifest.id);
    expect((await manager.listInventory())[0]?.status).toBe("available");

    await manager.remove(manifest.id);
    expect(await manager.listInventory()).toEqual([]);
  });

  it("rejects downloadable manifests without SHA-256", async () => {
    const manager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact: async () => undefined
    });
    const manifest = manifestFor(Buffer.from("missing sha"));
    delete (manifest as Partial<ModelManifest>).sha256;

    await expect(manager.download(manifest, { device: device() })).rejects.toThrow(
      "MODEL_INSTALLATION_BLOCKED"
    );
  });

  it("requires a device capability snapshot before fetching", async () => {
    let fetched = false;
    const manager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact: async () => {
        fetched = true;
      }
    });

    await expect(
      manager.download(manifestFor(Buffer.from("device gate")))
    ).rejects.toThrow("MODEL_DEVICE_CAPABILITY_REQUIRED");
    expect(fetched).toBe(false);
  });

  it("cleans a digest-mismatched candidate before it can appear in inventory", async () => {
    const bytes = Buffer.from("expected model artifact");
    const manifest = manifestFor(bytes);
    const manager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact: async (request) => {
        await appendFile(request.targetPath, Buffer.from("wrong artifact"));
      }
    });

    await expect(
      manager.download(manifest, { device: device() })
    ).rejects.toThrow("MODEL_ARTIFACT_SHA256_MISMATCH");

    await expect(manager.listInventory()).resolves.toEqual([]);
    await expect(readdir(directory)).resolves.toEqual([]);
  });

  it("reopens file-backed inventory and keeps activation state across manager instances", async () => {
    const firstBytes = Buffer.from("first verified model");
    const secondBytes = Buffer.from("second verified model");
    const firstManifest = manifestFor(firstBytes, "commit-a");
    const secondManifest = manifestFor(secondBytes, "commit-b");
    const fetchArtifact = appendBytes({
      [firstManifest.revision]: firstBytes,
      [secondManifest.revision]: secondBytes
    });
    const firstManager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact
    });

    await firstManager.download(firstManifest, { device: device() });
    await firstManager.download(secondManifest, { device: device() });
    await expect(
      firstManager.activate(firstManifest.id, firstManifest.revision)
    ).resolves.toMatchObject({
      status: "passed",
      reasonCodes: ["MODEL_ACTIVATION_COMMITTED"]
    });
    await expect(
      firstManager.activate(secondManifest.id, secondManifest.revision)
    ).resolves.toMatchObject({
      status: "passed",
      previousVersionPreserved: true
    });

    const reopenedManager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact
    });
    await expect(reopenedManager.verify(firstManifest.id)).resolves.toBe(true);
    await expect(reopenedManager.getActiveInventory(firstManifest.id)).resolves.toMatchObject(
      {
        manifest: { revision: secondManifest.revision },
        status: "available"
      }
    );
    await expect(reopenedManager.rollback(firstManifest.id)).resolves.toMatchObject({
      status: "passed",
      rollbackStatus: "passed",
      previousVersionPreserved: true,
      reasonCodes: ["MODEL_ROLLBACK_COMMITTED"]
    });
    await expect(reopenedManager.getActiveInventory(firstManifest.id)).resolves.toMatchObject(
      {
        manifest: { revision: firstManifest.revision }
      }
    );
  });

  it("keeps the active version when a candidate health check fails and cleans install candidates", async () => {
    const firstBytes = Buffer.from("stable model");
    const secondBytes = Buffer.from("unhealthy model");
    const firstManifest = manifestFor(firstBytes, "commit-a");
    const secondManifest = manifestFor(secondBytes, "commit-b");
    const fetchArtifact = appendBytes({
      [firstManifest.revision]: firstBytes,
      [secondManifest.revision]: secondBytes
    });
    const manager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact
    });

    await manager.download(firstManifest, { device: device() });
    await manager.activate(firstManifest.id, firstManifest.revision);
    const report = await manager.installAndActivate(
      secondManifest,
      { device: device() },
      async () => false
    );

    expect(report).toMatchObject({
      operation: "install_and_activate",
      status: "degraded",
      cleanupStatus: "passed",
      previousVersionPreserved: true,
      reasonCodes: ["MODEL_HEALTH_CHECK_FAILED", "MODEL_FAILED_UPDATE_CLEANED"]
    });
    await expect(manager.getActiveInventory(firstManifest.id)).resolves.toMatchObject(
      {
        manifest: { revision: firstManifest.revision }
      }
    );
    await expect(manager.listInventory()).resolves.toHaveLength(1);
    expect(JSON.stringify(report)).not.toContain(directory);
  });

  it("cleans interrupted install candidates while direct download keeps resume support", async () => {
    const bytes = Buffer.from("interrupted install artifact");
    const manifest = manifestFor(bytes);
    const manager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact: async (request) => {
        await appendFile(request.targetPath, bytes.subarray(0, 5));
        throw new Error("fixture interruption");
      }
    });

    await expect(
      manager.installAndActivate(manifest, { device: device() })
    ).resolves.toMatchObject({
      operation: "install_and_activate",
      status: "degraded",
      cleanupStatus: "passed",
      reasonCodes: [
        "MODEL_ARTIFACT_FETCH_FAILED",
        "MODEL_FAILED_UPDATE_CLEANED"
      ]
    });
    await expect(manager.listInventory()).resolves.toEqual([]);
    await expect(readdir(directory)).resolves.toEqual([]);
  });

  it("fails closed on rollback without a distinct previous version", async () => {
    const bytes = Buffer.from("single version model");
    const manifest = manifestFor(bytes);
    const manager = new FileSystemModelLifecycleManager({
      rootDirectory: directory,
      fetchArtifact: async (request) => {
        await appendFile(request.targetPath, bytes);
      }
    });

    await manager.download(manifest, { device: device() });
    await manager.activate(manifest.id, manifest.revision);

    await expect(manager.rollback(manifest.id)).resolves.toMatchObject({
      operation: "rollback",
      status: "blocked",
      rollbackStatus: "degraded",
      reasonCodes: ["MODEL_NO_PREVIOUS_VERSION"]
    });
  });
});

function manifestFor(
  bytes: Buffer,
  revision = "commit-a"
): ModelManifest {
  return {
    id: "vendor/local-stt-small",
    capability: "speech_to_text",
    source: "huggingface",
    revision,
    license: "MIT",
    runtime: "ctranslate2",
    quantization: "int8",
    sizeBytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    licenseRisk: "green"
  };
}

function appendBytes(
  bytesByRevision: Record<string, Buffer>
): ArtifactFetcher {
  return async (request) => {
    const bytes = bytesByRevision[request.manifest.revision];
    if (!bytes) {
      throw new Error("unknown fixture revision");
    }
    await appendFile(request.targetPath, bytes.subarray(request.resumeFromBytes));
  };
}

function device(): DeviceCapability {
  return {
    checkedAt: "2026-07-31T00:00:00.000Z",
    platform: "win32",
    arch: "x64",
    cpuLogicalCores: 16,
    totalMemoryBytes: 32 * 1024 * 1024 * 1024,
    availableMemoryBytes: 16 * 1024 * 1024 * 1024,
    gpus: [
      {
        name: "NVIDIA Test GPU",
        vendor: "nvidia",
        dedicatedMemoryBytes: 8 * 1024 * 1024 * 1024
      }
    ],
    accelerationBackends: ["cpu", "cuda"],
    recommendedMode: "local_enhanced",
    reasons: []
  };
}
