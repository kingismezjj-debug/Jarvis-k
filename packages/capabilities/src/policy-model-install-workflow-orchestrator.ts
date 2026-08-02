import type {
  ModelOperationSnapshot,
  StructuredError
} from "@jarvis-k/contracts";
import type {
  ModelInstallationPlanner,
  ModelInstallWorkflowOrchestrator,
  ModelInstallWorkflowPrepareInput,
  ModelOperationSupervisor,
  ResourceScheduler
} from "./ports";
import { sanitizeResourceSchedulerError } from "./sanitized-resource-error";

export interface PolicyModelInstallWorkflowOrchestratorOptions {
  installationPlanner: ModelInstallationPlanner;
  operationSupervisor: ModelOperationSupervisor;
  resourceScheduler: ResourceScheduler;
}

export class PolicyModelInstallWorkflowOrchestrator
  implements ModelInstallWorkflowOrchestrator
{
  public constructor(
    private readonly options: PolicyModelInstallWorkflowOrchestratorOptions
  ) {}

  public async prepare(
    input: ModelInstallWorkflowPrepareInput
  ): Promise<ModelOperationSnapshot> {
    const operation = await this.options.operationSupervisor.start({
      modelId: input.manifest.id,
      capability: input.manifest.capability,
      phase: "prechecking"
    });

    try {
      const decision = await this.options.installationPlanner.preview({
        manifest: input.manifest,
        device: input.device,
        ...(input.allowYellowRisk === undefined
          ? {}
          : { allowYellowRisk: input.allowYellowRisk }),
        ...(input.allowUnknownRisk === undefined
          ? {}
          : { allowUnknownRisk: input.allowUnknownRisk })
      });
      if (!decision.allowed) {
        return this.options.operationSupervisor.update({
          operationId: operation.operationId,
          phase: "blocked",
          reasons: decision.reasons
        });
      }

      const lease = await this.options.resourceScheduler.acquire({
        capability: input.manifest.capability,
        modelId: input.manifest.id,
        ...(input.manifest.minMemoryBytes === undefined
          ? {}
          : { minMemoryBytes: input.manifest.minMemoryBytes }),
        ...(input.manifest.minVramBytes === undefined
          ? {}
          : { minVramBytes: input.manifest.minVramBytes }),
        ...(input.exclusiveGpu === undefined
          ? {}
          : { exclusiveGpu: input.exclusiveGpu })
      });
      await lease.release();

      return this.options.operationSupervisor.update({
        operationId: operation.operationId,
        phase: "queued",
        reasons: ["Install workflow prepared; artifact fetch is not enabled."]
      });
    } catch (error) {
      const resourceCode = sanitizeResourceSchedulerError(error);
      if (resourceCode !== "RESOURCE_PRECHECK_FAILED") {
        return this.options.operationSupervisor.update({
          operationId: operation.operationId,
          phase: "blocked",
          reasons: [resourceCode]
        });
      }
      return this.options.operationSupervisor.update({
        operationId: operation.operationId,
        phase: "failed",
        error: structuredError()
      });
    }
  }
}

function structuredError(): StructuredError {
  return {
    code: "MODEL_INSTALL_WORKFLOW_FAILED",
    message: "Model install workflow failed.",
    retryable: true
  };
}
