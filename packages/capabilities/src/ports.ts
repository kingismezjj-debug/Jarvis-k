import type {
  CapabilitySnapshot,
  DeviceCapability,
  LocalModelCapability,
  ModelCandidate,
  ModelInstallabilityReport,
  ModelInventoryItem,
  ModelManifest,
  ModelOperationPhase,
  ModelOperationProgress,
  ModelOperationSnapshot,
  StructuredError
} from "@jarvis-k/contracts";

export interface CapabilityProvider {
  inspect(): Promise<CapabilitySnapshot>;
}

export interface ModelRegistry {
  listManifests(options?: ModelRegistryListOptions): Promise<ModelManifest[]>;
  getManifest(modelId: string): Promise<ModelManifest | undefined>;
}

export interface ModelCandidateRegistry {
  listCandidates(
    options?: ModelCandidateRegistryListOptions
  ): Promise<ModelCandidate[]>;
  getCandidate(modelId: string): Promise<ModelCandidate | undefined>;
}

export interface ModelRegistryListOptions {
  capability?: LocalModelCapability;
  includeRedRisk?: boolean;
}

export interface ModelCandidateRegistryListOptions {
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
  device?: DeviceCapability;
  allowYellowRisk?: boolean;
  allowUnknownRisk?: boolean;
  onProgress?: (progress: ModelDownloadProgress) => void;
}

export interface ModelDownloadProgress {
  modelId: string;
  phase: "resuming" | "downloading" | "verifying" | "complete";
  downloadedBytes: number;
  totalBytes?: number;
}

export interface ModelInstallationPlanner {
  preview(
    input: ModelInstallationPreviewInput
  ): Promise<ModelInstallabilityReport>;
}

export interface ModelInstallationPreviewInput {
  manifest: ModelManifest;
  device: DeviceCapability;
  allowYellowRisk?: boolean;
  allowUnknownRisk?: boolean;
}

export interface ModelLifecycleManager {
  listInventory(): Promise<ModelInventoryItem[]>;
  ensureAvailable(modelId: string): Promise<ModelInventoryItem>;
  load(modelId: string): Promise<ModelInventoryItem>;
  release(modelId: string): Promise<void>;
}

export interface ModelOperationSupervisor {
  start(input: ModelOperationStartInput): Promise<ModelOperationSnapshot>;
  update(input: ModelOperationUpdateInput): Promise<ModelOperationSnapshot>;
  cancel(
    operationId: string,
    reason?: string
  ): Promise<ModelOperationSnapshot>;
  get(operationId: string): Promise<ModelOperationSnapshot | undefined>;
  list(options?: ModelOperationListOptions): Promise<ModelOperationSnapshot[]>;
}

export interface ModelOperationStartInput {
  modelId: string;
  capability: LocalModelCapability;
  operationId?: string;
  phase?: ModelOperationPhase;
}

export interface ModelOperationUpdateInput {
  operationId: string;
  phase: ModelOperationPhase;
  progress?: ModelOperationProgress;
  reasons?: string[];
  error?: StructuredError;
}

export interface ModelOperationListOptions {
  modelId?: string;
  activeOnly?: boolean;
  limit?: number;
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
