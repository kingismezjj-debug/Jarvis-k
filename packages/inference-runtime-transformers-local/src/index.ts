import {
  ModelRuntimeAdapterDescriptorSchema,
  type ModelManifest,
  type ModelRuntimeAdapterDescriptor
} from "@jarvis-k/contracts";

export const TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME =
  "@jarvis-k/inference-runtime-transformers-local";
export const TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_LOCATION =
  "packages/inference-runtime-transformers-local";
export const TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT = "apps/core-host";
export const TRANSFORMERS_LOCAL_RUNTIME = "transformers" as const;
export const TRANSFORMERS_LOCAL_RUNTIME_STATUS = "unavailable" as const;
export const TRANSFORMERS_LOCAL_RUNTIME_UNAVAILABLE_REASON =
  "Transformers local runtime scaffold is not configured.";

export interface TransformersLocalRuntimeHealth {
  packageName: string;
  packageLocation: string;
  compositionRoot: string;
  runtime: typeof TRANSFORMERS_LOCAL_RUNTIME;
  status: typeof TRANSFORMERS_LOCAL_RUNTIME_STATUS;
  packageScaffolded: true;
  fakeRuntimeOnly: true;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  modelArtifactsAccessed: false;
  reasons: string[];
}

export interface TransformersLocalRuntimeLoadInput {
  manifest: ModelManifest;
  resourceLeaseId?: string;
}

export interface TransformersLocalRuntimeSanitizedError {
  code: "runtime_unavailable";
  message: string;
  recoverable: true;
}

export interface TransformersLocalRuntimeAdapterSurface {
  readonly descriptor: ModelRuntimeAdapterDescriptor;
  health(): TransformersLocalRuntimeHealth;
  canLoad(manifest: ModelManifest): false;
  load(input: TransformersLocalRuntimeLoadInput): Promise<never>;
}

export function createTransformersLocalRuntimeDescriptor(): ModelRuntimeAdapterDescriptor {
  return ModelRuntimeAdapterDescriptorSchema.parse({
    runtime: TRANSFORMERS_LOCAL_RUNTIME,
    capabilities: ["embedding"],
    accelerationBackends: [],
    notes: [
      "Fake runtime scaffold; no Transformers dependency is installed.",
      "Runtime execution remains unavailable until dependency, cache, benchmark, and enablement gates pass.",
      "Future execution must remain behind the dedicated runtime package and supervised child-process boundary."
    ]
  });
}

export function createTransformersLocalRuntimeHealth(): TransformersLocalRuntimeHealth {
  return {
    packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
    packageLocation: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
    runtime: TRANSFORMERS_LOCAL_RUNTIME,
    status: TRANSFORMERS_LOCAL_RUNTIME_STATUS,
    packageScaffolded: true,
    fakeRuntimeOnly: true,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    modelArtifactsAccessed: false,
    reasons: [
      TRANSFORMERS_LOCAL_RUNTIME_UNAVAILABLE_REASON,
      "No runtime dependencies, model downloads, model cache access, or execution are enabled."
    ]
  };
}

export function createUnavailableTransformersLocalRuntimeAdapter(): TransformersLocalRuntimeAdapterSurface {
  const descriptor = createTransformersLocalRuntimeDescriptor();

  return {
    descriptor,
    health: createTransformersLocalRuntimeHealth,
    canLoad(_manifest: ModelManifest): false {
      return false;
    },
    async load(_input: TransformersLocalRuntimeLoadInput): Promise<never> {
      throw new Error(TRANSFORMERS_LOCAL_RUNTIME_UNAVAILABLE_REASON);
    }
  };
}

export function mapTransformersLocalRuntimeError(
  _error: unknown
): TransformersLocalRuntimeSanitizedError {
  return {
    code: "runtime_unavailable",
    message: TRANSFORMERS_LOCAL_RUNTIME_UNAVAILABLE_REASON,
    recoverable: true
  };
}
