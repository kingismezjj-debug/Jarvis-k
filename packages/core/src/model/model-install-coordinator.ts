import {
  CapabilitySnapshotSchema,
  ModelManifestSchema,
  ModelOperationSnapshotSchema,
  type CapabilitySnapshot,
  type ModelOperationSnapshot,
} from "@jarvis-k/contracts";
import type {
  CapabilityProvider,
  ModelInstallWorkflowOrchestrator,
  ModelRegistry,
} from "@jarvis-k/capabilities";
import {
  modelServiceFailure,
  modelServiceSuccess,
  type ModelServiceResult,
} from "./model-service-result";

export interface ModelInstallCoordinatorOptions {
  capabilityProvider?: CapabilityProvider | undefined;
  modelRegistry?: ModelRegistry | undefined;
  modelInstallWorkflowOrchestrator?: ModelInstallWorkflowOrchestrator | undefined;
  onOperationUpdated?: (
    operation: ModelOperationSnapshot,
    correlationId?: string,
  ) => void;
}

export class ModelInstallCoordinator {
  public constructor(private readonly options: ModelInstallCoordinatorOptions) {}

  public async prepare(input: {
    modelId: string;
    allowYellowRisk?: boolean;
    allowUnknownRisk?: boolean;
    exclusiveGpu?: boolean;
    correlationId?: string;
  }): Promise<
    ModelServiceResult<{
      capabilities: CapabilitySnapshot;
      operation: ModelOperationSnapshot;
    }>
  > {
    if (
      !this.options.modelRegistry ||
      !this.options.modelInstallWorkflowOrchestrator
    ) {
      return modelsUnavailable();
    }
    if (!this.options.capabilityProvider) {
      return modelServiceFailure({
        code: "CAPABILITY_PROVIDER_UNAVAILABLE",
        message: "Device capability inspection is unavailable.",
        retryable: true,
      });
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
      const capabilities = CapabilitySnapshotSchema.parse(
        await this.options.capabilityProvider.inspect(),
      );
      const operation = ModelOperationSnapshotSchema.parse(
        await this.options.modelInstallWorkflowOrchestrator.prepare({
          manifest: ModelManifestSchema.parse(manifest),
          device: capabilities.device,
          ...(input.allowYellowRisk === undefined
            ? {}
            : { allowYellowRisk: input.allowYellowRisk }),
          ...(input.allowUnknownRisk === undefined
            ? {}
            : { allowUnknownRisk: input.allowUnknownRisk }),
          ...(input.exclusiveGpu === undefined
            ? {}
            : { exclusiveGpu: input.exclusiveGpu }),
        }),
      );
      this.options.onOperationUpdated?.(operation, input.correlationId);
      return modelServiceSuccess({ capabilities, operation });
    } catch {
      return modelServiceFailure({
        code: "MODEL_INSTALL_PREPARE_FAILED",
        message: "Unable to prepare model install workflow.",
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
