import {
  InferenceProviderDescriptorSchema,
  type InferenceProviderDescriptor,
  type LocalModelCapability
} from "@jarvis-k/contracts";
import type {
  InferenceProviderRegistry,
  InferenceProviderRegistryListOptions
} from "./ports";

export class StaticInferenceProviderRegistry
  implements InferenceProviderRegistry
{
  private readonly descriptors: InferenceProviderDescriptor[];

  public constructor(descriptors: InferenceProviderDescriptor[]) {
    this.descriptors = descriptors.map((descriptor) =>
      InferenceProviderDescriptorSchema.parse(descriptor)
    );
  }

  public async listProviders(
    options: InferenceProviderRegistryListOptions = {}
  ): Promise<InferenceProviderDescriptor[]> {
    return this.descriptors
      .filter((descriptor) =>
        matchesCapability(descriptor, options.capability)
      )
      .map((descriptor) => ({
        ...descriptor,
        modelIds: [...descriptor.modelIds],
        reasons: [...descriptor.reasons]
      }));
  }
}

function matchesCapability(
  descriptor: InferenceProviderDescriptor,
  capability: LocalModelCapability | undefined
): boolean {
  return capability === undefined || descriptor.capability === capability;
}
