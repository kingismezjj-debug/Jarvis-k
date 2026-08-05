import type {
  ModelDownloadManager,
  ModelDownloadOptions,
  ModelLifecycleManager
} from "@jarvis-k/capabilities";
import { validateInstallableManifest } from "@jarvis-k/capabilities";
import {
  ModelInventoryItemSchema,
  ModelManifestSchema,
  type ModelInventoryItem,
  type ModelManifest
} from "@jarvis-k/contracts";
import { createHash, randomUUID } from "node:crypto";
import type { Dirent } from "node:fs";
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

export type ModelLifecycleOperation =
  | "install_and_activate"
  | "activate"
  | "rollback";

export type ModelLifecycleOperationStatus =
  | "blocked"
  | "degraded"
  | "passed";

export type ModelLifecycleCleanupStatus =
  | "not_started"
  | "not_required"
  | "passed"
  | "degraded";

export type ModelLifecycleRollbackStatus =
  | "not_started"
  | "passed"
  | "degraded";

export type ModelLifecycleReasonCode =
  | "MODEL_ACTIVATION_COMMITTED"
  | "MODEL_ALREADY_ACTIVE"
  | "MODEL_ACTIVE_VERSION_NOT_VERIFIED"
  | "MODEL_ARTIFACT_FETCH_FAILED"
  | "MODEL_ARTIFACT_INVENTORY_WRITE_FAILED"
  | "MODEL_ARTIFACT_SHA256_MISMATCH"
  | "MODEL_ACTIVATION_COMMIT_FAILED"
  | "MODEL_CLEANUP_FAILED"
  | "MODEL_DEVICE_CAPABILITY_REQUIRED"
  | "MODEL_FAILED_UPDATE_CLEANED"
  | "MODEL_HEALTH_CHECK_FAILED"
  | "MODEL_INSTALLATION_BLOCKED"
  | "MODEL_NO_PREVIOUS_VERSION"
  | "MODEL_ROLLBACK_COMMITTED"
  | "MODEL_ROLLBACK_VERSION_NOT_VERIFIED"
  | "MODEL_SHA256_REQUIRED"
  | "MODEL_VERSION_NOT_FOUND"
  | "MODEL_VERSION_NOT_VERIFIED";

export interface ModelLifecycleOperationReport {
  operation: ModelLifecycleOperation;
  status: ModelLifecycleOperationStatus;
  cleanupStatus: ModelLifecycleCleanupStatus;
  rollbackStatus: ModelLifecycleRollbackStatus;
  previousVersionPreserved: boolean;
  reasonCodes: readonly ModelLifecycleReasonCode[];
}

export type ModelLifecycleHealthCheck = (
  inventory: ModelInventoryItem
) => Promise<boolean> | boolean;

export interface FileSystemModelLifecycleOptions {
  rootDirectory: string;
  fetchArtifact: ArtifactFetcher;
  now?: () => Date;
}

const ARTIFACT_FILE_NAME = "model.bin";
const INVENTORY_FILE_NAME = "inventory.json";
const MANIFEST_FILE_NAME = "manifest.json";
const ACTIVATION_DIRECTORY_NAME = ".activation";

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
    let entries: Dirent[];
    try {
      entries = await readdir(this.options.rootDirectory, {
        withFileTypes: true
      });
    } catch (error) {
      if (isFileNotFoundError(error)) {
        return [];
      }
      throw error;
    }
    const items: ModelInventoryItem[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === ACTIVATION_DIRECTORY_NAME) {
        continue;
      }
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

  public async getActiveInventory(
    modelId: string
  ): Promise<ModelInventoryItem | undefined> {
    const activation = await this.latestActivationRecord(modelId);
    if (!activation) {
      return undefined;
    }
    return this.findInventoryByRevision(modelId, activation.revision);
  }

  public async download(
    manifest: ModelManifest,
    options: ModelDownloadOptions = {}
  ): Promise<ModelInventoryItem> {
    const parsedManifest = ModelManifestSchema.parse(manifest);
    if (!options.device) {
      throw new Error("MODEL_DEVICE_CAPABILITY_REQUIRED");
    }
    const installDecision = validateInstallableManifest(
      parsedManifest,
      options.device,
      installationPolicyOptions(options)
    );
    if (!installDecision.allowed) {
      throw new Error(
        `MODEL_INSTALLATION_BLOCKED: ${installDecision.reasons.join(" ")}`
      );
    }
    if (!parsedManifest.sha256) {
      throw new Error("MODEL_SHA256_REQUIRED");
    }

    const existing = await this.findInventoryByRevision(
      parsedManifest.id,
      parsedManifest.revision
    );
    const directory = this.modelDirectory(parsedManifest);
    const artifactPath = path.join(directory, ARTIFACT_FILE_NAME);
    const partialPath = `${artifactPath}.part`;
    const active = await this.latestActivationRecord(parsedManifest.id);
    const isActiveVersion = active?.revision === parsedManifest.revision;

    if (existing && (await this.verifyInventory(existing))) {
      return existing.status === "loaded"
        ? existing
        : this.writeInventory(existing.manifest, "available");
    }

    if (isActiveVersion && existing) {
      throw new Error("MODEL_ACTIVE_VERSION_NOT_VERIFIED");
    }

    await mkdir(directory, { recursive: true });
    await writeJson(
      path.join(directory, MANIFEST_FILE_NAME),
      parsedManifest
    );

    if (await fileExists(artifactPath)) {
      const verified = await this.verifyArtifact(parsedManifest, artifactPath);
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

    try {
      await this.options.fetchArtifact({
        manifest: parsedManifest,
        targetPath: partialPath,
        resumeFromBytes,
        totalBytes: parsedManifest.sizeBytes
      });
    } catch {
      throw new Error("MODEL_ARTIFACT_FETCH_FAILED");
    }

    options.onProgress?.({
      modelId: parsedManifest.id,
      phase: "verifying",
      downloadedBytes: await sizeIfExists(partialPath),
      totalBytes: parsedManifest.sizeBytes
    });

    const actualSha256 = await sha256File(partialPath);
    if (actualSha256 !== parsedManifest.sha256) {
      await this.cleanupFailedDownload(
        directory,
        partialPath,
        existing !== undefined || isActiveVersion
      );
      throw new Error("MODEL_ARTIFACT_SHA256_MISMATCH");
    }

    await rename(partialPath, artifactPath);
    let inventory: ModelInventoryItem;
    try {
      inventory = await this.writeInventory(parsedManifest, "available");
    } catch {
      await this.cleanupFailedDownload(
        directory,
        partialPath,
        existing !== undefined || isActiveVersion
      );
      throw new Error("MODEL_ARTIFACT_INVENTORY_WRITE_FAILED");
    }
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
    return inventory === undefined ? false : this.verifyInventory(inventory);
  }

  public async load(modelId: string): Promise<ModelInventoryItem> {
    const inventory = await this.ensureAvailable(modelId);
    if (!(await this.verifyInventory(inventory))) {
      throw new Error("MODEL_VERIFY_FAILED");
    }
    return this.writeInventory(inventory.manifest, "loaded");
  }

  public async release(modelId: string): Promise<void> {
    const inventory = await this.ensureAvailable(modelId);
    await this.writeInventory(inventory.manifest, "available");
  }

  public async remove(modelId: string): Promise<void> {
    const inventories = (await this.listInventory()).filter(
      (item) => item.manifest.id === modelId
    );
    for (const inventory of inventories) {
      await rm(this.modelDirectory(inventory.manifest), {
        force: true,
        recursive: true
      });
    }
    await rm(this.activationBucket(modelId), {
      force: true,
      recursive: true
    });
  }

  public async installAndActivate(
    manifest: ModelManifest,
    options: ModelDownloadOptions = {},
    healthCheck: ModelLifecycleHealthCheck = defaultHealthCheck
  ): Promise<ModelLifecycleOperationReport> {
    const existing = await this.findInventoryByRevision(
      manifest.id,
      manifest.revision
    );

    try {
      await this.download(manifest, options);
    } catch (error) {
      const reasonCode = modelLifecycleDownloadReasonCode(error);
      let cleanupStatus: ModelLifecycleCleanupStatus = "not_required";
      if (existing === undefined) {
        try {
          cleanupStatus = await this.cleanupVersion(
            manifest,
            await this.getActiveInventory(manifest.id)
          );
        } catch {
          cleanupStatus = "degraded";
        }
      }
      const reasonCodes: ModelLifecycleReasonCode[] = [reasonCode];
      if (cleanupStatus === "passed") {
        reasonCodes.push("MODEL_FAILED_UPDATE_CLEANED");
      } else if (cleanupStatus === "degraded") {
        reasonCodes.push("MODEL_CLEANUP_FAILED");
      }
      return createOperationReport({
        operation: "install_and_activate",
        status: "degraded",
        cleanupStatus,
        reasonCodes
      });
    }

    const activation = await this.activate(
      manifest.id,
      manifest.revision,
      healthCheck
    );
    if (activation.status === "passed" || existing !== undefined) {
      return {
        ...activation,
        operation: "install_and_activate"
      };
    }

    let cleanupStatus: ModelLifecycleCleanupStatus;
    try {
      cleanupStatus = await this.cleanupVersion(
        manifest,
        await this.getActiveInventory(manifest.id)
      );
    } catch {
      cleanupStatus = "degraded";
    }
    const reasonCodes: ModelLifecycleReasonCode[] =
      cleanupStatus === "passed"
        ? [...activation.reasonCodes, "MODEL_FAILED_UPDATE_CLEANED"]
        : [...activation.reasonCodes, "MODEL_CLEANUP_FAILED"];

    return {
      ...activation,
      operation: "install_and_activate",
      status: cleanupStatus === "passed" ? activation.status : "degraded",
      cleanupStatus,
      reasonCodes
    };
  }

  public async activate(
    modelId: string,
    revision: string,
    healthCheck: ModelLifecycleHealthCheck = defaultHealthCheck
  ): Promise<ModelLifecycleOperationReport> {
    const candidate = await this.findInventoryByRevision(modelId, revision);
    if (!candidate) {
      return createOperationReport({
        operation: "activate",
        status: "blocked",
        reasonCodes: ["MODEL_VERSION_NOT_FOUND"]
      });
    }
    if (!(await this.verifyInventory(candidate))) {
      return createOperationReport({
        operation: "activate",
        status: "degraded",
        reasonCodes: ["MODEL_VERSION_NOT_VERIFIED"]
      });
    }

    const current = await this.latestActivationRecord(modelId);
    if (current?.revision === revision) {
      return createOperationReport({
        operation: "activate",
        status: "passed",
        previousVersionPreserved: true,
        reasonCodes: ["MODEL_ALREADY_ACTIVE"]
      });
    }

    const previous = current
      ? await this.findInventoryByRevision(modelId, current.revision)
      : undefined;
    if (
      current &&
      (previous === undefined || !(await this.verifyInventory(previous)))
    ) {
      return createOperationReport({
        operation: "activate",
        status: "degraded",
        reasonCodes: ["MODEL_ACTIVE_VERSION_NOT_VERIFIED"]
      });
    }

    if (!(await runHealthCheck(healthCheck, candidate))) {
      const previousVersionPreserved =
        previous === undefined || (await this.verifyInventory(previous));
      return createOperationReport({
        operation: "activate",
        status: "degraded",
        previousVersionPreserved,
        reasonCodes: ["MODEL_HEALTH_CHECK_FAILED"]
      });
    }

    try {
      await this.writeActivationRecord({
        modelId,
        revision,
        committedAt: this.now().toISOString()
      });
    } catch {
      return createOperationReport({
        operation: "activate",
        status: "degraded",
        reasonCodes: ["MODEL_ACTIVATION_COMMIT_FAILED"]
      });
    }

    const previousVersionPreserved =
      previous === undefined || (await this.verifyInventory(previous));
    return createOperationReport({
      operation: "activate",
      status: previousVersionPreserved ? "passed" : "degraded",
      previousVersionPreserved,
      reasonCodes: previousVersionPreserved
        ? ["MODEL_ACTIVATION_COMMITTED"]
        : ["MODEL_ACTIVE_VERSION_NOT_VERIFIED"]
    });
  }

  public async rollback(
    modelId: string,
    healthCheck: ModelLifecycleHealthCheck = defaultHealthCheck
  ): Promise<ModelLifecycleOperationReport> {
    const history = await this.activationHistory(modelId);
    const current = history.at(-1);
    if (!current) {
      return createOperationReport({
        operation: "rollback",
        status: "blocked",
        rollbackStatus: "degraded",
        reasonCodes: ["MODEL_NO_PREVIOUS_VERSION"]
      });
    }

    const previous = [...history]
      .reverse()
      .find((entry) => entry.revision !== current.revision);
    if (!previous) {
      return createOperationReport({
        operation: "rollback",
        status: "blocked",
        rollbackStatus: "degraded",
        reasonCodes: ["MODEL_NO_PREVIOUS_VERSION"]
      });
    }

    const previousInventory = await this.findInventoryByRevision(
      modelId,
      previous.revision
    );
    if (
      previousInventory === undefined ||
      !(await this.verifyInventory(previousInventory))
    ) {
      return createOperationReport({
        operation: "rollback",
        status: "degraded",
        rollbackStatus: "degraded",
        reasonCodes: ["MODEL_ROLLBACK_VERSION_NOT_VERIFIED"]
      });
    }

    if (!(await runHealthCheck(healthCheck, previousInventory))) {
      const currentInventory = await this.findInventoryByRevision(
        modelId,
        current.revision
      );
      return createOperationReport({
        operation: "rollback",
        status: "degraded",
        rollbackStatus: "degraded",
        previousVersionPreserved:
          currentInventory === undefined ||
          (await this.verifyInventory(currentInventory)),
        reasonCodes: ["MODEL_HEALTH_CHECK_FAILED"]
      });
    }

    try {
      await this.writeActivationRecord({
        modelId,
        revision: previous.revision,
        committedAt: this.now().toISOString()
      });
    } catch {
      return createOperationReport({
        operation: "rollback",
        status: "degraded",
        rollbackStatus: "degraded",
        reasonCodes: ["MODEL_ACTIVATION_COMMIT_FAILED"]
      });
    }

    const currentInventory = await this.findInventoryByRevision(
      modelId,
      current.revision
    );
    const previousVersionPreserved =
      currentInventory === undefined || (await this.verifyInventory(currentInventory));
    return createOperationReport({
      operation: "rollback",
      status: previousVersionPreserved ? "passed" : "degraded",
      rollbackStatus: previousVersionPreserved ? "passed" : "degraded",
      previousVersionPreserved,
      reasonCodes: previousVersionPreserved
        ? ["MODEL_ROLLBACK_COMMITTED"]
        : ["MODEL_ACTIVE_VERSION_NOT_VERIFIED"]
    });
  }

  private async findInventory(
    modelId: string
  ): Promise<ModelInventoryItem | undefined> {
    const inventory = await this.listInventory();
    const active = await this.latestActivationRecord(modelId);
    if (active) {
      const activeInventory = inventory.find(
        (item) =>
          item.manifest.id === modelId &&
          item.manifest.revision === active.revision
      );
      if (activeInventory) {
        return activeInventory;
      }
    }
    return inventory.find((item) => item.manifest.id === modelId);
  }

  private async findInventoryByRevision(
    modelId: string,
    revision: string
  ): Promise<ModelInventoryItem | undefined> {
    const inventory = await this.listInventory();
    return inventory.find(
      (item) =>
        item.manifest.id === modelId && item.manifest.revision === revision
    );
  }

  private async writeInventory(
    manifest: ModelManifest,
    status: ModelInventoryItem["status"]
  ): Promise<ModelInventoryItem> {
    const directory = this.modelDirectory(manifest);
    const inventory = ModelInventoryItemSchema.parse({
      manifest,
      status,
      lastVerifiedAt: this.now().toISOString()
    });
    await writeJson(path.join(directory, INVENTORY_FILE_NAME), inventory);
    return inventory;
  }

  private async readInventoryByDirectory(
    directory: string
  ): Promise<ModelInventoryItem | undefined> {
    try {
      const value = JSON.parse(
        await readFile(path.join(directory, INVENTORY_FILE_NAME), "utf8")
      ) as Record<string, unknown>;
      const { installPath: _legacyInstallPath, ...publicInventory } = value;
      return ModelInventoryItemSchema.parse(publicInventory);
    } catch {
      return undefined;
    }
  }

  private async verifyInventory(
    inventory: ModelInventoryItem
  ): Promise<boolean> {
    return this.verifyArtifact(
      inventory.manifest,
      path.join(this.modelDirectory(inventory.manifest), ARTIFACT_FILE_NAME)
    );
  }

  private async verifyArtifact(
    manifest: ModelManifest,
    artifactPath: string
  ): Promise<boolean> {
    if (!manifest.sha256 || !(await fileExists(artifactPath))) {
      return false;
    }
    return (await sha256File(artifactPath)) === manifest.sha256;
  }

  private async cleanupFailedDownload(
    directory: string,
    partialPath: string,
    preserveDirectory: boolean
  ): Promise<void> {
    await rm(partialPath, { force: true });
    if (!preserveDirectory) {
      await rm(directory, { force: true, recursive: true });
    }
  }

  private async cleanupVersion(
    manifest: ModelManifest,
    active: ModelInventoryItem | undefined
  ): Promise<"passed" | "degraded" | "not_required"> {
    if (active?.manifest.revision === manifest.revision) {
      return "not_required";
    }
    try {
      await rm(this.modelDirectory(manifest), {
        force: true,
        recursive: true
      });
      return "passed";
    } catch {
      return "degraded";
    }
  }

  private async latestActivationRecord(
    modelId: string
  ): Promise<ActivationRecord | undefined> {
    const history = await this.activationHistory(modelId);
    return history.at(-1);
  }

  private async activationHistory(
    modelId: string
  ): Promise<ActivationRecord[]> {
    let entries: Dirent[];
    try {
      entries = await readdir(this.activationBucket(modelId), {
        withFileTypes: true
      });
    } catch (error) {
      if (isFileNotFoundError(error)) {
        return [];
      }
      throw error;
    }

    const records: Array<{ fileName: string; record: ActivationRecord }> = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        continue;
      }
      try {
        const parsed = JSON.parse(
          await readFile(
            path.join(this.activationBucket(modelId), entry.name),
            "utf8"
          )
        ) as Record<string, unknown>;
        if (
          parsed.modelId === modelId &&
          typeof parsed.revision === "string" &&
          typeof parsed.committedAt === "string"
        ) {
          records.push({
            fileName: entry.name,
            record: {
              modelId,
              revision: parsed.revision,
              committedAt: parsed.committedAt,
              sequence:
                typeof parsed.sequence === "number" &&
                Number.isInteger(parsed.sequence) &&
                parsed.sequence > 0
                  ? parsed.sequence
                  : 0
            }
          });
        }
      } catch {
        continue;
      }
    }

    return records
      .sort(
        (left, right) =>
          (left.record.sequence ?? 0) - (right.record.sequence ?? 0) ||
          left.record.committedAt.localeCompare(right.record.committedAt) ||
          left.fileName.localeCompare(right.fileName)
      )
      .map(({ record }) => record);
  }

  private async writeActivationRecord(
    record: ActivationRecord
  ): Promise<void> {
    const directory = this.activationBucket(record.modelId);
    await mkdir(directory, { recursive: true });
    const history = await this.activationHistory(record.modelId);
    const sequence = (history.at(-1)?.sequence ?? 0) + 1;
    const persistedRecord = {
      ...record,
      sequence
    };
    const token = randomUUID();
    const partialPath = path.join(
      directory,
      `activation-${String(sequence).padStart(12, "0")}-${token}.part`
    );
    const committedPath = path.join(
      directory,
      `activation-${String(sequence).padStart(12, "0")}-${token}.json`
    );
    try {
      await writeJson(partialPath, persistedRecord);
      await rename(partialPath, committedPath);
    } catch (error) {
      await rm(partialPath, { force: true });
      throw error;
    }
  }

  private activationBucket(modelId: string): string {
    const modelKey = createHash("sha256")
      .update(modelId)
      .digest("hex")
      .slice(0, 32);
    return path.join(
      this.options.rootDirectory,
      ACTIVATION_DIRECTORY_NAME,
      modelKey
    );
  }

  private modelDirectory(manifest: ModelManifest): string {
    return path.join(
      this.options.rootDirectory,
      safePathSegment(`${manifest.id}@${manifest.revision}`)
    );
  }
}

interface ActivationRecord {
  modelId: string;
  revision: string;
  committedAt: string;
  sequence?: number;
}

function createOperationReport(input: {
  operation: ModelLifecycleOperation;
  status: ModelLifecycleOperationStatus;
  cleanupStatus?: ModelLifecycleCleanupStatus;
  rollbackStatus?: ModelLifecycleRollbackStatus;
  previousVersionPreserved?: boolean;
  reasonCodes: readonly ModelLifecycleReasonCode[];
}): ModelLifecycleOperationReport {
  return {
    operation: input.operation,
    status: input.status,
    cleanupStatus: input.cleanupStatus ?? "not_started",
    rollbackStatus: input.rollbackStatus ?? "not_started",
    previousVersionPreserved: input.previousVersionPreserved ?? false,
    reasonCodes: [...new Set(input.reasonCodes)]
  };
}

function modelLifecycleDownloadReasonCode(
  error: unknown
): ModelLifecycleReasonCode {
  if (error instanceof Error) {
    const message = error.message;
    const fixedCodes: ModelLifecycleReasonCode[] = [
      "MODEL_ACTIVE_VERSION_NOT_VERIFIED",
      "MODEL_ARTIFACT_FETCH_FAILED",
      "MODEL_ARTIFACT_INVENTORY_WRITE_FAILED",
      "MODEL_ARTIFACT_SHA256_MISMATCH",
      "MODEL_DEVICE_CAPABILITY_REQUIRED",
      "MODEL_INSTALLATION_BLOCKED",
      "MODEL_SHA256_REQUIRED"
    ];
    const matchingCode = fixedCodes.find(
      (code) =>
        message === code ||
        (code === "MODEL_INSTALLATION_BLOCKED" &&
          message.startsWith("MODEL_INSTALLATION_BLOCKED:"))
    );
    if (matchingCode) {
      return matchingCode;
    }
  }
  return "MODEL_ARTIFACT_FETCH_FAILED";
}

async function runHealthCheck(
  healthCheck: ModelLifecycleHealthCheck,
  inventory: ModelInventoryItem
): Promise<boolean> {
  try {
    return (await healthCheck(inventory)) === true;
  } catch {
    return false;
  }
}

async function defaultHealthCheck(): Promise<boolean> {
  return true;
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

function isFileNotFoundError(
  error: unknown
): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

function installationPolicyOptions(
  options: ModelDownloadOptions
): {
  allowYellowRisk?: boolean;
  allowUnknownRisk?: boolean;
} {
  return {
    ...(options.allowYellowRisk === undefined
      ? {}
      : { allowYellowRisk: options.allowYellowRisk }),
    ...(options.allowUnknownRisk === undefined
      ? {}
      : { allowUnknownRisk: options.allowUnknownRisk })
  };
}
