import type {
  ModelDownloadManager,
  ModelDownloadOptions,
  ModelLifecycleManager
} from "@jarvis-k/capabilities";
import {
  ModelInventoryItemSchema,
  ModelManifestSchema,
  type ModelInventoryItem,
  type ModelManifest
} from "@jarvis-k/contracts";
import { createHash } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";

export interface ArtifactFetchRequest {
  manifest: ModelManifest;
  targetPath: string;
  resumeFromBytes: number;
  totalBytes: number;
}

export type ArtifactFetcher = (
  request: ArtifactFetchRequest
) => Promise<void>;

export interface FileSystemModelLifecycleOptions {
  rootDirectory: string;
  fetchArtifact: ArtifactFetcher;
  now?: () => Date;
}

const ARTIFACT_FILE_NAME = "model.bin";
const INVENTORY_FILE_NAME = "inventory.json";
const MANIFEST_FILE_NAME = "manifest.json";

export class FileSystemModelLifecycleManager
  implements ModelDownloadManager, ModelLifecycleManager
{
  private readonly now: () => Date;

  public constructor(
    private readonly options: FileSystemModelLifecycleOptions
  ) {
    this.now = options.now ?? (() => new Date());
  }

  public async listInventory(): Promise<ModelInventoryItem[]> {
    await mkdir(this.options.rootDirectory, { recursive: true });
    const entries = await readdir(this.options.rootDirectory, {
      withFileTypes: true
    });
    const items: ModelInventoryItem[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const inventory = await this.readInventoryByDirectory(
        path.join(this.options.rootDirectory, entry.name)
      );
      if (inventory) {
        items.push(inventory);
      }
    }
    return items;
  }

  public async ensureAvailable(
    modelId: string
  ): Promise<ModelInventoryItem> {
    const existing = await this.findInventory(modelId);
    if (!existing) {
      throw new Error(`Model ${modelId} is not installed.`);
    }
    if (existing.status === "loaded" || existing.status === "available") {
      return existing;
    }
    throw new Error(`Model ${modelId} is not available.`);
  }

  public async download(
    manifest: ModelManifest,
    options: ModelDownloadOptions = {}
  ): Promise<ModelInventoryItem> {
    const parsedManifest = ModelManifestSchema.parse(manifest);
    if (!parsedManifest.sha256) {
      throw new Error("MODEL_SHA256_REQUIRED");
    }

    const directory = this.modelDirectory(parsedManifest);
    const artifactPath = path.join(directory, ARTIFACT_FILE_NAME);
    const partialPath = `${artifactPath}.part`;
    await mkdir(directory, { recursive: true });
    await writeJson(
      path.join(directory, MANIFEST_FILE_NAME),
      parsedManifest
    );

    if (await fileExists(artifactPath)) {
      const verified = await this.verify(parsedManifest.id);
      if (verified) {
        return this.writeInventory(parsedManifest, "available");
      }
      await rm(artifactPath, { force: true });
    }

    const resumeFromBytes = await sizeIfExists(partialPath);
    if (resumeFromBytes > 0) {
      options.onProgress?.({
        modelId: parsedManifest.id,
        phase: "resuming",
        downloadedBytes: resumeFromBytes,
        totalBytes: parsedManifest.sizeBytes
      });
    }
    options.onProgress?.({
      modelId: parsedManifest.id,
      phase: "downloading",
      downloadedBytes: resumeFromBytes,
      totalBytes: parsedManifest.sizeBytes
    });

    await this.options.fetchArtifact({
      manifest: parsedManifest,
      targetPath: partialPath,
      resumeFromBytes,
      totalBytes: parsedManifest.sizeBytes
    });

    options.onProgress?.({
      modelId: parsedManifest.id,
      phase: "verifying",
      downloadedBytes: await sizeIfExists(partialPath),
      totalBytes: parsedManifest.sizeBytes
    });

    const actualSha256 = await sha256File(partialPath);
    if (actualSha256 !== parsedManifest.sha256) {
      await rm(partialPath, { force: true });
      throw new Error("MODEL_SHA256_MISMATCH");
    }

    await rename(partialPath, artifactPath);
    const inventory = await this.writeInventory(
      parsedManifest,
      "available"
    );
    options.onProgress?.({
      modelId: parsedManifest.id,
      phase: "complete",
      downloadedBytes: parsedManifest.sizeBytes,
      totalBytes: parsedManifest.sizeBytes
    });
    return inventory;
  }

  public async verify(modelId: string): Promise<boolean> {
    const inventory = await this.findInventory(modelId);
    if (!inventory?.manifest.sha256 || !inventory.installPath) {
      return false;
    }
    if (!(await fileExists(inventory.installPath))) {
      return false;
    }
    return (await sha256File(inventory.installPath)) === inventory.manifest.sha256;
  }

  public async load(modelId: string): Promise<ModelInventoryItem> {
    const inventory = await this.ensureAvailable(modelId);
    if (!(await this.verify(modelId))) {
      throw new Error("MODEL_VERIFY_FAILED");
    }
    return this.writeInventory(inventory.manifest, "loaded");
  }

  public async release(modelId: string): Promise<void> {
    const inventory = await this.ensureAvailable(modelId);
    await this.writeInventory(inventory.manifest, "available");
  }

  public async remove(modelId: string): Promise<void> {
    const inventory = await this.findInventory(modelId);
    if (!inventory) {
      return;
    }
    await rm(this.modelDirectory(inventory.manifest), {
      force: true,
      recursive: true
    });
  }

  private async findInventory(
    modelId: string
  ): Promise<ModelInventoryItem | undefined> {
    const inventory = await this.listInventory();
    return inventory.find((item) => item.manifest.id === modelId);
  }

  private async writeInventory(
    manifest: ModelManifest,
    status: ModelInventoryItem["status"]
  ): Promise<ModelInventoryItem> {
    const directory = this.modelDirectory(manifest);
    const inventory = ModelInventoryItemSchema.parse({
      manifest,
      status,
      installPath: path.join(directory, ARTIFACT_FILE_NAME),
      lastVerifiedAt: this.now().toISOString()
    });
    await writeJson(path.join(directory, INVENTORY_FILE_NAME), inventory);
    return inventory;
  }

  private async readInventoryByDirectory(
    directory: string
  ): Promise<ModelInventoryItem | undefined> {
    try {
      return ModelInventoryItemSchema.parse(
        JSON.parse(
          await readFile(path.join(directory, INVENTORY_FILE_NAME), "utf8")
        )
      );
    } catch {
      return undefined;
    }
  }

  private modelDirectory(manifest: ModelManifest): string {
    return path.join(
      this.options.rootDirectory,
      safePathSegment(`${manifest.id}@${manifest.revision}`)
    );
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  const file = await open(filePath, "r");
  try {
    for await (const chunk of file.createReadStream()) {
      hash.update(chunk);
    }
  } finally {
    await file.close();
  }
  return hash.digest("hex");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sizeIfExists(filePath: string): Promise<number> {
  try {
    return (await stat(filePath)).size;
  } catch {
    return 0;
  }
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}
