import {
  InferencePreflightReportSchema,
  type InferenceProviderDescriptor,
  type InferencePreflightReport
} from "@jarvis-k/contracts";
import type {
  InferenceExecutionPlanner,
  InferenceExecutionPreviewInput,
  InferenceProviderRegistry,
  ResourceScheduler
} from "./ports";

export interface PolicyInferenceExecutionPlannerOptions {
  inferenceProviderRegistry: InferenceProviderRegistry;
  resourceScheduler?: ResourceScheduler;
}

export class PolicyInferenceExecutionPlanner
  implements InferenceExecutionPlanner
{
  public constructor(
    private readonly options: PolicyInferenceExecutionPlannerOptions
  ) {}

  public async preview(
    input: InferenceExecutionPreviewInput
  ): Promise<InferencePreflightReport> {
    const providers = await this.options.inferenceProviderRegistry.listProviders({
      capability: input.capability
    });
    const reasons: string[] = [];

    if (input.manifest.capability !== input.capability) {
      reasons.push(
        "Model manifest capability does not match requested inference capability."
      );
    }

    const availableProviders = providers.filter((provider) =>
      canServeModel(provider, input.manifest.id)
    );
    if (availableProviders.length === 0) {
      reasons.push(
        providers.length === 0
          ? "No inference provider is registered for the requested capability."
          : "No available inference provider is configured for the requested capability."
      );
    }

    if (reasons.length === 0 && this.options.resourceScheduler) {
      try {
        const lease = await this.options.resourceScheduler.acquire({
          capability: input.capability,
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
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Inference resource preflight failed.";
        reasons.push(message);
      }
    }

    return InferencePreflightReportSchema.parse({
      capability: input.capability,
      modelId: input.manifest.id,
      allowed: reasons.length === 0,
      providers,
      reasons
    });
  }
}

function canServeModel(
  provider: InferenceProviderDescriptor,
  modelId: string
): boolean {
  return (
    provider.status === "available" &&
    (provider.modelIds.length === 0 || provider.modelIds.includes(modelId))
  );
}
