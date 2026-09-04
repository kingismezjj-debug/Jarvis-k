import type {
  CapabilitySnapshot,
  DeviceCapability,
  BrainPlannerRequest,
  BrainPlannerResult,
  AssistantModelAdapterEvent,
  ChatAnswerRequest,
  ChatAnswerResult,
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult,
  InferenceProviderConfigurationReport,
  InferenceProviderDescriptor,
  InferencePreflightReport,
  IntentRoutingRequest,
  IntentRoutingResult,
  LocalModelCapability,
  ModelCandidate,
  ModelInstallabilityReport,
  ModelInventoryItem,
  ModelManifest,
  ModelOperationPhase,
  ModelOperationProgress,
  ModelOperationSnapshot,
  ModelRuntime,
  ModelRuntimeAdapterDescriptor,
  OcrRecognitionRequest,
  OcrRecognitionResult,
  LocalPluginManifestDeveloperStatusResult,
  PluginInvocationRequest,
  PluginInvocationResult,
  PluginManifest,
  RerankRequest,
  RerankResult,
  ResourceSchedulerDiagnostics,
  ScreenCaptureRequest,
  ScreenCaptureResult,
  StructuredError,
  VisionAnalysisRequest,
  VisionAnalysisResult,
  AdvancedBrainPreparedRequest,
  AdvancedBrainProviderCapabilityProfile,
  AdvancedBrainProviderResult,
  AdvancedBrainRequest,
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
    options?: ModelCandidateRegistryListOptions,
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
    options?: ModelDownloadOptions,
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
    input: ModelInstallationPreviewInput,
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

export interface ModelRuntimeRegistry {
  listDescriptors(): Promise<ModelRuntimeAdapterDescriptor[]>;
  getAdapter(manifest: ModelManifest): Promise<ModelRuntimeAdapter | undefined>;
}

export interface InferenceProviderRegistry {
  listProviders(
    options?: InferenceProviderRegistryListOptions,
  ): Promise<InferenceProviderDescriptor[]>;
  listConfigurationRequirements(
    options?: InferenceProviderRegistryListOptions,
  ): Promise<InferenceProviderConfigurationReport[]>;
}

export interface InferenceProviderRegistryListOptions {
  capability?: LocalModelCapability;
}

export interface InferenceExecutionPlanner {
  preview(
    input: InferenceExecutionPreviewInput,
  ): Promise<InferencePreflightReport>;
}

export interface InferenceExecutionPreviewInput {
  capability: LocalModelCapability;
  manifest: ModelManifest;
  exclusiveGpu?: boolean;
}

export interface ModelRuntimeAdapter {
  readonly descriptor: ModelRuntimeAdapterDescriptor;
  canLoad(manifest: ModelManifest): boolean;
  load(input: ModelRuntimeLoadInput): Promise<LoadedModelSession>;
}

export interface ModelRuntimeLoadInput {
  manifest: ModelManifest;
  inventoryItem: ModelInventoryItem;
  device: DeviceCapability;
  resourceLease?: ResourceLease;
}

export interface LoadedModelSession {
  modelId: string;
  capability: LocalModelCapability;
  runtime: ModelRuntime;
  loadedAt: string;
  release(): Promise<void>;
}

export interface EmbeddingInferenceProvider {
  embed(
    request: EmbeddingGenerationRequest,
  ): Promise<EmbeddingGenerationResult>;
}

export interface OcrRecognitionProvider {
  recognize(request: OcrRecognitionRequest): Promise<OcrRecognitionResult>;
}

export interface ScreenCaptureProvider {
  capture(request: ScreenCaptureRequest): Promise<ScreenCaptureResult>;
}

export interface VisionAnalysisProvider {
  analyze(request: VisionAnalysisRequest): Promise<VisionAnalysisResult>;
}

export interface IntentRoutingProvider {
  route(request: IntentRoutingRequest): Promise<IntentRoutingResult>;
}

export interface HeavyPlannerProvider {
  plan(request: BrainPlannerRequest): Promise<BrainPlannerResult>;
}

export interface ChatAnswerProvider {
  answer(request: ChatAnswerRequest): Promise<ChatAnswerResult>;
  startTextTurn?(
    request: ChatAnswerRequest,
    context: Record<string, never>,
    signal: AbortSignal,
  ): AsyncIterable<AssistantModelAdapterEvent>;
}

export interface AdvancedReasoningProvider {
  readonly profile: AdvancedBrainProviderCapabilityProfile;
  prepare(request: AdvancedBrainRequest): Promise<AdvancedBrainPreparedRequest>;
  execute(
    preparedRequest: AdvancedBrainPreparedRequest,
    options?: { signal?: AbortSignal },
  ): Promise<AdvancedBrainProviderResult>;
  cancel?(requestId: string, reason?: string): Promise<void>;
}

export interface RerankingProvider {
  rerank(request: RerankRequest): Promise<RerankResult>;
}

export interface PluginRegistry {
  listPlugins(): Promise<PluginManifest[]>;
  getPlugin(pluginId: string): Promise<PluginManifest | undefined>;
}

export interface PluginRuntime {
  listExecutablePluginIds?(): Promise<string[]>;
  listLocalReadOnlyPluginIds?(): Promise<string[]>;
  invoke(request: PluginInvocationRequest): Promise<PluginInvocationResult>;
}

export interface LocalPluginManifestDeveloperDiagnostics {
  getStatus(): Promise<LocalPluginManifestDeveloperStatusResult>;
}

export interface ModelInstallWorkflowOrchestrator {
  prepare(
    input: ModelInstallWorkflowPrepareInput,
  ): Promise<ModelOperationSnapshot>;
}

export interface ModelInstallWorkflowPrepareInput {
  manifest: ModelManifest;
  device: DeviceCapability;
  allowYellowRisk?: boolean;
  allowUnknownRisk?: boolean;
  exclusiveGpu?: boolean;
}

export interface ModelOperationSupervisor {
  start(input: ModelOperationStartInput): Promise<ModelOperationSnapshot>;
  update(input: ModelOperationUpdateInput): Promise<ModelOperationSnapshot>;
  cancel(operationId: string, reason?: string): Promise<ModelOperationSnapshot>;
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
  diagnostics(): Promise<ResourceSchedulerDiagnostics>;
}

export interface ResourceRequest {
  capability: LocalModelCapability;
  modelId?: string;
  minMemoryBytes?: number;
  minVramBytes?: number;
  exclusiveGpu?: boolean;
}
