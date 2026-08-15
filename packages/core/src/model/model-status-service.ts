import {
  CapabilitySnapshotSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  InferencePreflightReportSchema,
  ModelCandidateSchema,
  ModelInstallabilityReportSchema,
  ModelInventoryItemSchema,
  ModelManifestSchema,
  ModelOperationSnapshotSchema,
  ModelRuntimeAdapterDescriptorSchema,
  ResourceSchedulerDiagnosticsSchema,
  type CapabilitySnapshot,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type InferencePreflightReport,
  type LocalModelCapability,
  type ModelCandidate,
  type ModelInstallabilityReport,
  type ModelInventoryItem,
  type ModelManifest,
  type ModelOperationSnapshot,
  type ModelRuntimeAdapterDescriptor,
  type ResourceSchedulerDiagnostics,
} from "@jarvis-k/contracts";
import type {
  CapabilityProvider,
  InferenceExecutionPlanner,
  InferenceProviderRegistry,
  ModelCandidateRegistry,
  ModelInstallationPlanner,
  ModelLifecycleManager,
  ModelOperationListOptions,
  ModelOperationSupervisor,
  ModelRegistry,
  ModelRuntimeRegistry,
  ResourceScheduler,
} from "@jarvis-k/capabilities";
import {
  modelServiceFailure,
  modelServiceSuccess,
  type ModelServiceResult,
} from "./model-service-result";

export interface ModelStatusServiceOptions {
  capabilityProvider?: CapabilityProvider | undefined;
  modelRegistry?: ModelRegistry | undefined;
  modelCandidateRegistry?: ModelCandidateRegistry | undefined;
  modelLifecycleManager?: ModelLifecycleManager | undefined;
  modelRuntimeRegistry?: ModelRuntimeRegistry | undefined;
  inferenceProviderRegistry?: InferenceProviderRegistry | undefined;
  inferenceExecutionPlanner?: InferenceExecutionPlanner | undefined;
  modelInstallationPlanner?: ModelInstallationPlanner | undefined;
  modelOperationSupervisor?: ModelOperationSupervisor | undefined;
  resourceScheduler?: ResourceScheduler | undefined;
}

export class ModelStatusService {
  public constructor(private readonly options: ModelStatusServiceOptions) {}

  public async inspectCapabilities(): Promise<
    ModelServiceResult<CapabilitySnapshot>
  > {
    if (!this.options.capabilityProvider) {
      return modelServiceFailure({
        code: "CAPABILITY_PROVIDER_UNAVAILABLE",
        message: "Device capability inspection is unavailable.",
        retryable: true,
      });
    }
    try {
      return modelServiceSuccess(
        CapabilitySnapshotSchema.parse(
          await this.options.capabilityProvider.inspect(),
        ),
      );
    } catch {
      return modelServiceFailure({
        code: "CAPABILITY_INSPECTION_FAILED",
        message: "Unable to inspect local device capabilities.",
        retryable: true,
      });
    }
  }

  public async listModelManifests(input: {
    capability?: LocalModelCapability;
    includeRedRisk?: boolean;
  }): Promise<ModelServiceResult<{ manifests: ModelManifest[] }>> {
    if (!this.options.modelRegistry) {
      return modelsUnavailable();
    }
    try {
      const manifests = await this.options.modelRegistry.listManifests({
        ...(input.capability ? { capability: input.capability } : {}),
        ...(input.includeRedRisk === undefined
          ? {}
          : { includeRedRisk: input.includeRedRisk }),
      });
      return modelServiceSuccess({
        manifests: manifests.map((manifest) =>
          ModelManifestSchema.parse(manifest),
        ),
      });
    } catch {
      return modelServiceFailure({
        code: "MODEL_REGISTRY_FAILED",
        message: "Unable to list model manifests.",
        retryable: true,
      });
    }
  }

  public async listModelCandidates(input: {
    capability?: LocalModelCapability;
    includeRedRisk?: boolean;
  }): Promise<ModelServiceResult<{ candidates: ModelCandidate[] }>> {
    if (!this.options.modelCandidateRegistry) {
      return modelsUnavailable();
    }
    try {
      const candidates = await this.options.modelCandidateRegistry.listCandidates(
        {
          ...(input.capability ? { capability: input.capability } : {}),
          ...(input.includeRedRisk === undefined
            ? {}
            : { includeRedRisk: input.includeRedRisk }),
        },
      );
      return modelServiceSuccess({
        candidates: candidates.map((candidate) =>
          ModelCandidateSchema.parse(candidate),
        ),
      });
    } catch {
      return modelServiceFailure({
        code: "MODEL_CANDIDATES_FAILED",
        message: "Unable to list model candidates.",
        retryable: true,
      });
    }
  }

  public async listModelInventory(): Promise<
    ModelServiceResult<{ inventory: ModelInventoryItem[] }>
  > {
    if (!this.options.modelLifecycleManager) {
      return modelsUnavailable();
    }
    try {
      const inventory = await this.options.modelLifecycleManager.listInventory();
      return modelServiceSuccess({
        inventory: inventory.map((item) => ModelInventoryItemSchema.parse(item)),
      });
    } catch {
      return modelServiceFailure({
        code: "MODEL_INVENTORY_FAILED",
        message: "Unable to list local model inventory.",
        retryable: true,
      });
    }
  }

  public async listModelRuntimeAdapters(): Promise<
    ModelServiceResult<{ runtimeAdapters: ModelRuntimeAdapterDescriptor[] }>
  > {
    if (!this.options.modelRuntimeRegistry) {
      return modelsUnavailable();
    }
    try {
      const descriptors = await this.options.modelRuntimeRegistry.listDescriptors();
      return modelServiceSuccess({
        runtimeAdapters: descriptors.map((descriptor) =>
          ModelRuntimeAdapterDescriptorSchema.parse(descriptor),
        ),
      });
    } catch {
      return modelServiceFailure({
        code: "MODEL_RUNTIME_REGISTRY_FAILED",
        message: "Unable to list model runtime adapters.",
        retryable: true,
      });
    }
  }

  public async listInferenceProviders(input: {
    capability?: LocalModelCapability;
  }): Promise<ModelServiceResult<{ providers: InferenceProviderDescriptor[] }>> {
    if (!this.options.inferenceProviderRegistry) {
      return modelsUnavailable();
    }
    try {
      const providers = await this.options.inferenceProviderRegistry.listProviders(
        input.capability ? { capability: input.capability } : {},
      );
      return modelServiceSuccess({
        providers: providers.map((provider) =>
          InferenceProviderDescriptorSchema.parse(provider),
        ),
      });
    } catch {
      return modelServiceFailure({
        code: "INFERENCE_PROVIDER_REGISTRY_FAILED",
        message: "Unable to list inference providers.",
        retryable: true,
      });
    }
  }

  public async listInferenceProviderRequirements(input: {
    capability?: LocalModelCapability;
  }): Promise<
    ModelServiceResult<{ reports: InferenceProviderConfigurationReport[] }>
  > {
    if (!this.options.inferenceProviderRegistry) {
      return modelsUnavailable();
    }
    try {
      const reports =
        await this.options.inferenceProviderRegistry.listConfigurationRequirements(
          input.capability ? { capability: input.capability } : {},
        );
      return modelServiceSuccess({
        reports: reports.map((report) =>
          InferenceProviderConfigurationReportSchema.parse(report),
        ),
      });
    } catch {
      return modelServiceFailure({
        code: "INFERENCE_PROVIDER_REQUIREMENTS_FAILED",
        message: "Unable to list inference provider requirements.",
        retryable: true,
      });
    }
  }

  public async previewInferenceExecution(input: {
    capability: LocalModelCapability;
    modelId: string;
    exclusiveGpu?: boolean;
  }): Promise<ModelServiceResult<{ report: InferencePreflightReport }>> {
    if (!this.options.modelRegistry || !this.options.inferenceExecutionPlanner) {
      return modelsUnavailable();
    }
    try {
      const manifest = await this.options.modelRegistry.getManifest(
        input.modelId,
      );
      if (!manifest) {
        return modelServiceFailure({
          code: "MODEL_MANIFEST_NOT_FOUND",
          message: "Model manifest was not found.",
          retryable: false,
        });
      }
      const report = await this.options.inferenceExecutionPlanner.preview({
        capability: input.capability,
        manifest: ModelManifestSchema.parse(manifest),
        ...(input.exclusiveGpu === undefined
          ? {}
          : { exclusiveGpu: input.exclusiveGpu }),
      });
      return modelServiceSuccess({
        report: InferencePreflightReportSchema.parse(report),
      });
    } catch {
      return modelServiceFailure({
        code: "INFERENCE_PREFLIGHT_FAILED",
        message: "Unable to preview inference execution.",
        retryable: true,
      });
    }
  }

  public async listModelOperations(
    input: ModelOperationListOptions,
  ): Promise<ModelServiceResult<{ operations: ModelOperationSnapshot[] }>> {
    if (!this.options.modelOperationSupervisor) {
      return modelsUnavailable();
    }
    try {
      const operations = await this.options.modelOperationSupervisor.list(input);
      return modelServiceSuccess({
        operations: operations.map((operation) =>
          ModelOperationSnapshotSchema.parse(operation),
        ),
      });
    } catch {
      return modelServiceFailure({
        code: "MODEL_OPERATIONS_FAILED",
        message: "Unable to list model operations.",
        retryable: true,
      });
    }
  }

  public async getResourceDiagnostics(): Promise<
    ModelServiceResult<{ resourceDiagnostics: ResourceSchedulerDiagnostics }>
  > {
    if (!this.options.resourceScheduler) {
      return modelsUnavailable();
    }
    try {
      return modelServiceSuccess({
        resourceDiagnostics: ResourceSchedulerDiagnosticsSchema.parse(
          await this.options.resourceScheduler.diagnostics(),
        ),
      });
    } catch {
      return modelServiceFailure({
        code: "RESOURCE_DIAGNOSTICS_FAILED",
        message: "Unable to inspect model resource diagnostics.",
        retryable: true,
      });
    }
  }

  public async previewModelInstallability(input: {
    modelId: string;
    allowYellowRisk?: boolean;
    allowUnknownRisk?: boolean;
  }): Promise<
    ModelServiceResult<{
      capabilities: CapabilitySnapshot;
      report: ModelInstallabilityReport;
    }>
  > {
    if (!this.options.modelRegistry || !this.options.modelInstallationPlanner) {
      return modelsUnavailable();
    }
    const capabilities = await this.inspectCapabilities();
    if (!capabilities.ok) {
      return capabilities;
    }
    try {
      const manifest = await this.options.modelRegistry.getManifest(
        input.modelId,
      );
      if (!manifest) {
        return modelServiceFailure({
          code: "MODEL_MANIFEST_NOT_FOUND",
          message: "Model manifest was not found.",
          retryable: false,
        });
      }
      const report = await this.options.modelInstallationPlanner.preview({
        manifest: ModelManifestSchema.parse(manifest),
        device: capabilities.value.device,
        ...(input.allowYellowRisk === undefined
          ? {}
          : { allowYellowRisk: input.allowYellowRisk }),
        ...(input.allowUnknownRisk === undefined
          ? {}
          : { allowUnknownRisk: input.allowUnknownRisk }),
      });
      return modelServiceSuccess({
        capabilities: capabilities.value,
        report: ModelInstallabilityReportSchema.parse(report),
      });
    } catch {
      return modelServiceFailure({
        code: "MODEL_INSTALLABILITY_FAILED",
        message: "Unable to preview model installability.",
        retryable: true,
      });
    }
  }
}

function modelsUnavailable(): ModelServiceResult<never> {
  return modelServiceFailure({
    code: "MODEL_GOVERNANCE_UNAVAILABLE",
    message: "Model governance is unavailable.",
    retryable: true,
  });
}
