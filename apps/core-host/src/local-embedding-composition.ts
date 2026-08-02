import type {
  EmbeddingInferenceProvider,
  LoadedModelSession,
  ModelRuntimeAdapter,
  ModelRuntimeLoadInput,
  ModelRuntimeRegistry,
  ResourceLease,
  ResourceScheduler
} from "@jarvis-k/capabilities";
import {
  EmbeddingGenerationRequestSchema,
  EmbeddingGenerationResultSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  ModelRuntimeAdapterDescriptorSchema,
  type EmbeddingGenerationRequest,
  type EmbeddingGenerationResult,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type ModelManifest,
  type ModelRuntimeAdapterDescriptor
} from "@jarvis-k/contracts";
import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  createApprovedLocalEmbeddingManifest,
  createLocalEmbeddingProviderConfigurationReport,
  createLocalEmbeddingProviderDescriptor
} from "@jarvis-k/inference-adapter-embedding-local";
import {
  createTransformersLocalRuntimeDescriptor,
  createRuntimeHelperSanitizedError,
  mapTransformersLocalRuntimeError,
  RuntimeHelperClientError,
  type RuntimeHelperErrorCode
} from "@jarvis-k/inference-runtime-transformers-local";
import {
  createCoreHostLocalEmbeddingRuntimeSessionFactory,
  isLocalEmbeddingProviderExecutionOptInEnabled,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_EXECUTION_DISABLED_REASON,
  type CoreHostLocalEmbeddingRuntimeSessionFactoryOptions
} from "./local-embedding-runtime-session-factory";

export const LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV =
  "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER";

const LOCAL_EMBEDDING_COMPOSED_REASON =
  "Runtime-backed local embedding provider is composed by explicit Core Host opt-in.";
const LOCAL_EMBEDDING_RUNTIME_DISABLED_REASON =
  "Local embedding runtime session remains disabled until the next artifact and model-load approval.";
const LOCAL_EMBEDDING_PROVIDER_EXECUTION_ENABLED_REASON =
  "Local embedding provider execution is enabled by separate explicit Core Host opt-in.";
const LOCAL_EMBEDDING_PROVIDER_EXECUTION_DISABLED_REASON =
  "Local embedding provider execution remains disabled until the execution opt-in is set.";

export interface CoreHostLocalEmbeddingCompositionOptions {
  env?: Readonly<Record<string, string | undefined>>;
  resourceScheduler: ResourceScheduler;
  sessionFactory?: LocalEmbeddingRuntimeSessionFactory;
  runtimeSessionFactoryOptions?: Omit<
    CoreHostLocalEmbeddingRuntimeSessionFactoryOptions,
    "env"
  >;
}

export interface CoreHostLocalEmbeddingComposition {
  enabled: boolean;
  providerDescriptor: InferenceProviderDescriptor;
  providerConfigurationReport: InferenceProviderConfigurationReport;
  manifests: ModelManifest[];
  modelRuntimeRegistry: ModelRuntimeRegistry;
  embeddingProvider?: EmbeddingInferenceProvider;
}

export interface LocalEmbeddingRuntimeSession {
  embed(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult>;
  release(): Promise<void>;
}

export interface LocalEmbeddingRuntimeSessionFactoryInput {
  request: EmbeddingGenerationRequest;
  resourceLease: ResourceLease;
}

export type LocalEmbeddingRuntimeSessionFactory = (
  input: LocalEmbeddingRuntimeSessionFactoryInput
) => Promise<LocalEmbeddingRuntimeSession>;

export class CoreHostLocalEmbeddingProvider
  implements EmbeddingInferenceProvider
{
  public constructor(
    private readonly options: {
      resourceScheduler: ResourceScheduler;
      sessionFactory: LocalEmbeddingRuntimeSessionFactory;
    }
  ) {}

  public async embed(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    let parsed: EmbeddingGenerationRequest;
    try {
      parsed = EmbeddingGenerationRequestSchema.parse(request);
    } catch {
      throw new Error("Local embedding request failed validation.");
    }

    if (parsed.modelId !== LOCAL_EMBEDDING_MODEL_ID) {
      throw new Error("Local embedding provider is not bound to this model.");
    }

    let resourceLease: ResourceLease | undefined;
    let session: LocalEmbeddingRuntimeSession | undefined;
    try {
      resourceLease = await this.options.resourceScheduler.acquire({
        capability: "embedding",
        modelId: parsed.modelId
      });
      session = await this.options.sessionFactory({
        request: parsed,
        resourceLease
      });
      return EmbeddingGenerationResultSchema.parse(
        await session.embed(parsed)
      );
    } catch (error) {
      const mapped = mapCoreHostLocalEmbeddingRuntimeError(error);
      throw new Error(mapped.message);
    } finally {
      await session?.release().catch(() => undefined);
      await resourceLease?.release().catch(() => undefined);
    }
  }
}

export function createCoreHostLocalEmbeddingComposition(
  options: CoreHostLocalEmbeddingCompositionOptions
): CoreHostLocalEmbeddingComposition {
  const enabled = isLocalEmbeddingProviderOptInEnabled(options.env);
  if (!enabled) {
    return {
      enabled: false,
      providerDescriptor: createLocalEmbeddingProviderDescriptor(),
      providerConfigurationReport:
        createLocalEmbeddingProviderConfigurationReport(),
      manifests: [],
      modelRuntimeRegistry: new CoreHostLocalEmbeddingRuntimeRegistry([])
    };
  }

  const sessionFactory =
    options.sessionFactory ??
    createCoreHostLocalEmbeddingRuntimeSessionFactory(
      createRuntimeSessionFactoryOptions(options)
    );

  return {
    enabled: true,
    providerDescriptor: createRuntimeBackedLocalEmbeddingProviderDescriptor(
      options.env
    ),
    providerConfigurationReport:
      createRuntimeBackedLocalEmbeddingProviderConfigurationReport(
        options.env
      ),
    manifests: [createApprovedLocalEmbeddingManifest()],
    modelRuntimeRegistry: new CoreHostLocalEmbeddingRuntimeRegistry([
      new DisabledTransformersLocalEmbeddingRuntimeAdapter()
    ]),
    embeddingProvider: new CoreHostLocalEmbeddingProvider({
      resourceScheduler: options.resourceScheduler,
      sessionFactory
    })
  };
}

export function isLocalEmbeddingProviderOptInEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return env[LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]?.trim() === "1";
}

export function createRuntimeBackedLocalEmbeddingProviderDescriptor(
  env: Readonly<Record<string, string | undefined>> = process.env
): InferenceProviderDescriptor {
  const executionEnabled =
    isLocalEmbeddingProviderExecutionOptInEnabled(env);
  return InferenceProviderDescriptorSchema.parse({
    capability: "embedding",
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    status: "available",
    execution: "local",
    modelIds: [LOCAL_EMBEDDING_MODEL_ID],
    reasons: [
      LOCAL_EMBEDDING_COMPOSED_REASON,
      LOCAL_EMBEDDING_RUNTIME_DISABLED_REASON,
      executionEnabled
        ? LOCAL_EMBEDDING_PROVIDER_EXECUTION_ENABLED_REASON
        : LOCAL_EMBEDDING_PROVIDER_EXECUTION_DISABLED_REASON
    ]
  });
}

export function createRuntimeBackedLocalEmbeddingProviderConfigurationReport(
  env: Readonly<Record<string, string | undefined>> = process.env
): InferenceProviderConfigurationReport {
  const executionEnabled =
    isLocalEmbeddingProviderExecutionOptInEnabled(env);
  return InferenceProviderConfigurationReportSchema.parse({
    capability: "embedding",
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    status: "available",
    requirements: [
      {
        key: LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV,
        source: "environment",
        required: true,
        configured: true,
        description:
          "Explicitly opts Core Host into runtime-backed local embedding composition.",
        reasons: []
      },
      {
        key: LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
        source: "environment",
        required: true,
        configured: executionEnabled,
        description:
          "Separately opts Core Host into runtime-backed local embedding provider execution.",
        reasons: executionEnabled
          ? [LOCAL_EMBEDDING_PROVIDER_EXECUTION_ENABLED_REASON]
          : [LOCAL_EMBEDDING_PROVIDER_EXECUTION_DISABLED_REASON]
      },
      {
        key: "apps_core_host.composition_root",
        source: "manual",
        required: true,
        configured: true,
        description:
          "Keeps concrete provider composition rooted in apps/core-host.",
        reasons: []
      },
      {
        key: "runtime.resource_lease",
        source: "runtime",
        required: true,
        configured: true,
        description:
          "Requires a resource scheduler lease before runtime session creation.",
        reasons: []
      },
      {
        key: "runtime.sanitized_errors",
        source: "runtime",
        required: true,
        configured: true,
        description:
          "Maps runtime failures to bounded sanitized error messages.",
        reasons: []
      }
    ],
    reasons: [
      LOCAL_EMBEDDING_COMPOSED_REASON,
      LOCAL_EMBEDDING_RUNTIME_DISABLED_REASON,
      executionEnabled
        ? LOCAL_EMBEDDING_PROVIDER_EXECUTION_ENABLED_REASON
        : LOCAL_EMBEDDING_PROVIDER_EXECUTION_DISABLED_REASON
    ]
  });
}

class CoreHostLocalEmbeddingRuntimeRegistry
  implements ModelRuntimeRegistry
{
  public constructor(private readonly adapters: ModelRuntimeAdapter[]) {}

  public async listDescriptors(): Promise<ModelRuntimeAdapterDescriptor[]> {
    return this.adapters.map((adapter) =>
      ModelRuntimeAdapterDescriptorSchema.parse(adapter.descriptor)
    );
  }

  public async getAdapter(
    manifest: ModelManifest
  ): Promise<ModelRuntimeAdapter | undefined> {
    return this.adapters.find((adapter) => adapter.canLoad(manifest));
  }
}

class DisabledTransformersLocalEmbeddingRuntimeAdapter
  implements ModelRuntimeAdapter
{
  public readonly descriptor = createTransformersLocalRuntimeDescriptor();

  public canLoad(manifest: ModelManifest): boolean {
    return (
      manifest.id === LOCAL_EMBEDDING_MODEL_ID &&
      manifest.capability === "embedding" &&
      manifest.runtime === "transformers"
    );
  }

  public async load(
    _input: ModelRuntimeLoadInput
  ): Promise<LoadedModelSession> {
    throw new Error(LOCAL_EMBEDDING_RUNTIME_DISABLED_REASON);
  }
}

function createRuntimeSessionFactoryOptions(
  options: CoreHostLocalEmbeddingCompositionOptions
): CoreHostLocalEmbeddingRuntimeSessionFactoryOptions {
  const runtimeOptions: CoreHostLocalEmbeddingRuntimeSessionFactoryOptions = {
    ...(options.runtimeSessionFactoryOptions ?? {})
  };
  if (options.env !== undefined) {
    runtimeOptions.env = options.env;
  }
  return runtimeOptions;
}

function mapCoreHostLocalEmbeddingRuntimeError(error: unknown): {
  message: string;
} {
  if (error instanceof RuntimeHelperClientError) {
    return createRuntimeHelperSanitizedError(error.code);
  }
  if (error instanceof Error) {
    const code = runtimeHelperErrorCodeFromMessage(error.message);
    if (code !== undefined) {
      return createRuntimeHelperSanitizedError(code);
    }
    if (error.message === LOCAL_EMBEDDING_RUNTIME_DISABLED_REASON) {
      return createRuntimeHelperSanitizedError(
        "EMBEDDING_EXECUTION_DISABLED"
      );
    }
    if (error.message === LOCAL_EMBEDDING_RUNTIME_EXECUTION_DISABLED_REASON) {
      return createRuntimeHelperSanitizedError(
        "EMBEDDING_EXECUTION_DISABLED"
      );
    }
  }
  return mapTransformersLocalRuntimeError(error);
}

function runtimeHelperErrorCodeFromMessage(
  message: string
): RuntimeHelperErrorCode | undefined {
  const codes: RuntimeHelperErrorCode[] = [
    "HELPER_UNAVAILABLE",
    "HELPER_STARTUP_TIMEOUT",
    "HELPER_SHUTDOWN_TIMEOUT",
    "HELPER_REQUEST_TIMEOUT",
    "HELPER_PROTOCOL_INVALID",
    "RESOURCE_LEASE_REQUIRED",
    "MODEL_LOAD_UNAVAILABLE",
    "RUNTIME_DEPENDENCY_UNAVAILABLE",
    "MODEL_ARTIFACT_UNAVAILABLE",
    "MODEL_RUNTIME_INCOMPATIBLE",
    "EMBEDDING_DIMENSIONS_UNSUPPORTED",
    "EMBEDDING_EXECUTION_DISABLED",
    "HELPER_PROCESS_EXITED",
    "HELPER_INTERNAL"
  ];
  return codes.find((code) => code === message);
}
