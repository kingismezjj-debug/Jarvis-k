import {
  ModelInstallabilityReportSchema,
  type ModelInstallabilityReport
} from "@jarvis-k/contracts";
import { validateInstallableManifest } from "./manifest-installation-policy";
import type {
  ModelInstallationPlanner,
  ModelInstallationPreviewInput
} from "./ports";

export class PolicyModelInstallationPlanner
  implements ModelInstallationPlanner
{
  public async preview(
    input: ModelInstallationPreviewInput
  ): Promise<ModelInstallabilityReport> {
    const decision = validateInstallableManifest(input.manifest, input.device, {
      ...(input.allowYellowRisk === undefined
        ? {}
        : { allowYellowRisk: input.allowYellowRisk }),
      ...(input.allowUnknownRisk === undefined
        ? {}
        : { allowUnknownRisk: input.allowUnknownRisk })
    });

    return ModelInstallabilityReportSchema.parse({
      modelId: input.manifest.id,
      allowed: decision.allowed,
      reasons: decision.reasons,
      runtimeMode: decision.runtimeMode
    });
  }
}
