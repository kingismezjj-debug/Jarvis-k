import {
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  type InferenceProviderConfigurationReport,
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
  private readonly configurationReports: InferenceProviderConfigurationReport[];

  public constructor(
    descriptors: InferenceProviderDescriptor[],
    configurationReports: InferenceProviderConfigurationReport[] = []
  ) {
    this.descriptors = descriptors.map((descriptor) =>
      InferenceProviderDescriptorSchema.parse(descriptor)
    );
    this.configurationReports =
      configurationReports.length > 0
        ? configurationReports.map((report) =>
            InferenceProviderConfigurationReportSchema.parse(report)
          )
        : this.descriptors.map((descriptor) =>
            InferenceProviderConfigurationReportSchema.parse({
              capability: descriptor.capability,
              provider: descriptor.provider,
              status: descriptor.status,
              requirements: [],
              reasons: descriptor.reasons
            })
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

  public async listConfigurationRequirements(
    options: InferenceProviderRegistryListOptions = {}
  ): Promise<InferenceProviderConfigurationReport[]> {
    return this.configurationReports
      .filter((report) => matchesCapability(report, options.capability))
      .map((report) => ({
        ...report,
        requirements: report.requirements.map((requirement) => ({
          ...requirement,
          reasons: [...requirement.reasons]
        })),
        reasons: [...report.reasons]
      }));
  }
}

function matchesCapability(
  descriptor:
    | InferenceProviderDescriptor
    | InferenceProviderConfigurationReport,
  capability: LocalModelCapability | undefined
): boolean {
  return capability === undefined || descriptor.capability === capability;
}
