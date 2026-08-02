import path from "node:path";
import {
  RuntimeHelperClient,
  createRuntimeHelperSanitizedError,
  createRuntimeHelperTimeoutPolicy,
  createTransformersLocalRuntimeProcessTransport,
  type RuntimeHelperHealth,
  type RuntimeHelperTimeoutPolicy,
  type RuntimeHelperTransport,
  type TransformersLocalRuntimeProcessOptions
} from "@jarvis-k/inference-runtime-transformers-local";
import type {
  LocalEmbeddingRuntimeSession,
  LocalEmbeddingRuntimeSessionFactory
} from "./local-embedding-composition";

export const LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV =
  "JARVIS_K_RUNTIME_PYTHON";

const LOCAL_EMBEDDING_RUNTIME_EXECUTION_DISABLED_REASON =
  "Embedding execution remains disabled by the runtime gate.";

export interface CoreHostLocalEmbeddingRuntimeSessionFactoryOptions {
  env?: Readonly<Record<string, string | undefined>>;
  helperScriptPath?: string;
  timeoutPolicy?: RuntimeHelperTimeoutPolicy;
  createTransport?: (
    options: TransformersLocalRuntimeProcessOptions
  ) => RuntimeHelperTransport;
}

export function createCoreHostLocalEmbeddingRuntimeSessionFactory(
  options: CoreHostLocalEmbeddingRuntimeSessionFactoryOptions = {}
): LocalEmbeddingRuntimeSessionFactory {
  return async ({ resourceLease }) => {
    const pythonExecutable = readRuntimePythonExecutable(options.env);
    if (!pythonExecutable) {
      throw new Error("HELPER_UNAVAILABLE");
    }

    let client: RuntimeHelperClient | undefined;
    try {
      const transportFactory =
        options.createTransport ??
        createTransformersLocalRuntimeProcessTransport;
      const transport = transportFactory({
        pythonExecutable,
        helperScript: options.helperScriptPath ?? resolveHelperScriptPath()
      });
      client = new RuntimeHelperClient({
        transport,
        timeoutPolicy:
          options.timeoutPolicy ?? createRuntimeHelperTimeoutPolicy()
      });
      const health = await client.health();
      assertLifecycleOnlyHealth(health);
      return new CoreHostLocalEmbeddingRuntimeSession({
        client,
        resourceLeaseId: resourceLease.leaseId
      });
    } catch (error) {
      client?.dispose();
      throw error;
    }
  };
}

export function readRuntimePythonExecutable(
  env: Readonly<Record<string, string | undefined>> = process.env
): string | undefined {
  const value = env[LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function resolveHelperScriptPath(): string {
  return path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "packages",
    "inference-runtime-transformers-local",
    "runtime",
    "transformers_helper.py"
  );
}

function assertLifecycleOnlyHealth(health: RuntimeHelperHealth): void {
  if (
    health.status !== "ready" ||
    health.processState !== "ready" ||
    health.modelArtifactsAccessed !== false ||
    health.downloadEnabled !== false ||
    health.directShellExecutionAllowed !== false ||
    health.resourceLeaseRequired !== true
  ) {
    throw new Error(
      createRuntimeHelperSanitizedError(
        health.modelArtifactsAccessed
          ? "MODEL_ARTIFACT_UNAVAILABLE"
          : "RUNTIME_DEPENDENCY_UNAVAILABLE"
      ).code
    );
  }
}

class CoreHostLocalEmbeddingRuntimeSession
  implements LocalEmbeddingRuntimeSession
{
  public constructor(
    private readonly options: {
      client: RuntimeHelperClient;
      resourceLeaseId: string;
    }
  ) {}

  public async embed(): Promise<never> {
    throw new Error(LOCAL_EMBEDDING_RUNTIME_EXECUTION_DISABLED_REASON);
  }

  public async release(): Promise<void> {
    void this.options.resourceLeaseId;
    await this.options.client
      .shutdown({ reason: "request_cancelled" })
      .catch(() => undefined);
  }
}
