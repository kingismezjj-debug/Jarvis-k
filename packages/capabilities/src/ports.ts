import type {
  CapabilitySnapshot,
  LocalModelCapability,
  ModelInventoryItem,
  ModelManifest
} from "@jarvis-k/contracts";

export interface CapabilityProvider {
  inspect(): Promise<CapabilitySnapshot>;
}

export interface ModelRegistry {
  listManifests(options?: ModelRegistryListOptions): Promise<ModelManifest[]>;
  getManifest(modelId: string): Promise<ModelManifest | undefined>;
}

export interface ModelRegistryListOptions {
  capability?: LocalModelCapability;
  includeRedRisk?: boolean;
}

export interface ModelDownloadManager {
  download(
    manifest: ModelManifest,
    options?: ModelDownloadOptions
  ): Promise<ModelInventoryItem>;
  remove(modelId: string): Promise<void>;
  verify(modelId: string): Promise<boolean>;
}

export interface ModelDownloadOptions {
  onProgress?: (progress: ModelDownloadProgress) => void;
}

export interface ModelDownloadProgress {
  modelId: string;
  phase: "resuming" | "downloading" | "verifying" | "complete";
  downloadedBytes: number;
  totalBytes?: number;
}

export interface ModelLifecycleManager {
  listInventory(): Promise<ModelInventoryItem[]>;
  ensureAvailable(modelId: string): Promise<ModelInventoryItem>;
  load(modelId: string): Promise<ModelInventoryItem>;
  release(modelId: string): Promise<void>;
}

export interface ResourceLease {
  leaseId: string;
  capability: LocalModelCapability;
  modelId?: string;
  createdAt: string;
  release(): Promise<void>;
}

export interface ResourceScheduler {
  acquire(input: ResourceRequest): Promise<ResourceLease>;
}

export interface ResourceRequest {
  capability: LocalModelCapability;
  modelId?: string;
  minMemoryBytes?: number;
  minVramBytes?: number;
  exclusiveGpu?: boolean;
}
