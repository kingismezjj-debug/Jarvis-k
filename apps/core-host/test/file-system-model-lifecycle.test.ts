import { createHash } from "node:crypto";
import { appendFile, mkdtemp, rm } from "node:fs/promises";
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
      "Network interrupted"
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
    expect(inventory.installPath).toContain("model.bin");
    expect(await manager.verify(manifest.id)).toBe(true);
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
});

function manifestFor(bytes: Buffer): ModelManifest {
  return {
    id: "vendor/local-stt-small",
    capability: "speech_to_text",
    source: "huggingface",
    revision: "commit-a",
    license: "MIT",
    runtime: "ctranslate2",
    quantization: "int8",
    sizeBytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    licenseRisk: "green"
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
