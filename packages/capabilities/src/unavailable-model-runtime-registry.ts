import type {
  ModelManifest,
  ModelRuntime
} from "@jarvis-k/contracts";
import type {
  ModelRuntimeAdapter,
  ModelRuntimeAdapterDescriptor,
  ModelRuntimeRegistry
} from "./ports";

export class UnavailableModelRuntimeRegistry implements ModelRuntimeRegistry {
  public async listDescriptors(): Promise<ModelRuntimeAdapterDescriptor[]> {
    return [];
  }

  public async getAdapter(
    _manifest: ModelManifest
  ): Promise<ModelRuntimeAdapter | undefined> {
    return undefined;
  }
}

export function runtimeUnsupportedReason(runtime: ModelRuntime): string {
  return `Model runtime '${runtime}' is not configured.`;
}
