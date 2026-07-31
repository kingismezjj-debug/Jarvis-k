import {
  ModelManifestSchema,
  type LocalModelCapability,
  type ModelManifest
} from "@jarvis-k/contracts";
import type { ModelRegistry, ModelRegistryListOptions } from "./ports";

export class StaticModelRegistry implements ModelRegistry {
  private readonly manifests: ModelManifest[];

  public constructor(manifests: ModelManifest[]) {
    this.manifests = manifests.map((manifest) =>
      ModelManifestSchema.parse(manifest)
    );
  }

  public async listManifests(
    options: ModelRegistryListOptions = {}
  ): Promise<ModelManifest[]> {
    return this.manifests
      .filter((manifest) => matchesCapability(manifest, options.capability))
      .filter((manifest) =>
        options.includeRedRisk ? true : manifest.licenseRisk !== "red"
      )
      .map((manifest) => ({ ...manifest }));
  }

  public async getManifest(
    modelId: string
  ): Promise<ModelManifest | undefined> {
    const manifest = this.manifests.find((item) => item.id === modelId);
    return manifest ? { ...manifest } : undefined;
  }
}

function matchesCapability(
  manifest: ModelManifest,
  capability: LocalModelCapability | undefined
): boolean {
  return capability === undefined || manifest.capability === capability;
}
