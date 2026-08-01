import type {
  LoadedModelSession,
  ModelRuntimeAdapter,
  ModelRuntimeLoadInput
} from "@jarvis-k/capabilities";
import {
  ModelRuntimeAdapterDescriptorSchema,
  type ModelRuntimeAdapterDescriptor
} from "@jarvis-k/contracts";

export const LOCAL_EMBEDDING_PLANNED_RUNTIME = "transformers" as const;

const RUNTIME_NOT_CONFIGURED_REASON =
  "Local embedding runtime adapter is not configured.";

export class UnavailableLocalEmbeddingRuntimeAdapter
  implements ModelRuntimeAdapter
{
  public readonly descriptor = createLocalEmbeddingRuntimeAdapterDescriptor();

  public canLoad(_manifest: ModelRuntimeLoadInput["manifest"]): boolean {
    return false;
  }

  public async load(
    _input: ModelRuntimeLoadInput
  ): Promise<LoadedModelSession> {
    throw new Error(RUNTIME_NOT_CONFIGURED_REASON);
  }
}

export function createLocalEmbeddingRuntimeAdapterDescriptor(): ModelRuntimeAdapterDescriptor {
  return ModelRuntimeAdapterDescriptorSchema.parse({
    runtime: LOCAL_EMBEDDING_PLANNED_RUNTIME,
    capabilities: ["embedding"],
    accelerationBackends: [],
    notes: [
      "Planning-only descriptor; no Transformers runtime dependency is installed.",
      "Do not compose until model, packaging, redistribution, and benchmark gates pass."
    ]
  });
}
