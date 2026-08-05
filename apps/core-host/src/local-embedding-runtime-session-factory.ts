import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import {
  EmbeddingGenerationRequestSchema,
  EmbeddingGenerationResultSchema,
  type EmbeddingGenerationRequest,
  type EmbeddingGenerationResult
} from "@jarvis-k/contracts";
import {
  LOCAL_EMBEDDING_MODEL_ID,
  createPinnedLocalEmbeddingArtifactPlan,
  type LocalEmbeddingArtifactPlan
} from "@jarvis-k/inference-adapter-embedding-local";
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
export const LOCAL_EMBEDDING_MODEL_DIR_ENV =
  "JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR";
export const LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV =
  "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION";

export const LOCAL_EMBEDDING_RUNTIME_EXECUTION_DISABLED_REASON =
  "Embedding execution remains disabled by the runtime gate.";

export interface CoreHostLocalEmbeddingRuntimeSessionFactoryOptions {
  env?: Readonly<Record<string, string | undefined>>;
  helperScriptPath?: string;
  timeoutPolicy?: RuntimeHelperTimeoutPolicy;
  createTransport?: (
    options: TransformersLocalRuntimeProcessOptions
  ) => RuntimeHelperTransport;
  verifyModelArtifacts?: (modelDirectory: string) => Promise<void>;
}

export function createCoreHostLocalEmbeddingRuntimeSessionFactory(
  options: CoreHostLocalEmbeddingRuntimeSessionFactoryOptions = {}
): LocalEmbeddingRuntimeSessionFactory {
  return async ({ resourceLease }) => {
    const pythonExecutable = readRuntimePythonExecutable(options.env);
    if (!pythonExecutable) {
      throw new Error("HELPER_UNAVAILABLE");
    }
    const modelDirectory = readLocalEmbeddingModelDirectory(options.env);
    if (!modelDirectory) {
      throw new Error("MODEL_ARTIFACT_UNAVAILABLE");
    }

    await (options.verifyModelArtifacts ??
      verifyLocalEmbeddingModelArtifacts)(modelDirectory);

    let client: RuntimeHelperClient | undefined;
    try {
      const transportFactory =
        options.createTransport ??
        createTransformersLocalRuntimeProcessTransport;
      const transport = transportFactory({
        pythonExecutable,
        helperScript: options.helperScriptPath ?? resolveHelperScriptPath(),
        modelDirectory
      });
      client = new RuntimeHelperClient({
        transport,
        timeoutPolicy:
          options.timeoutPolicy ?? createRuntimeHelperTimeoutPolicy()
      });
      const health = await client.health();
      assertLifecycleOnlyHealth(health);
      const loaded = await client.load({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        capability: "embedding",
        resourceLeaseId: resourceLease.leaseId,
        modelDirectory
      });
      return new CoreHostLocalEmbeddingRuntimeSession({
        client,
        sessionId: loaded.sessionId,
        resourceLeaseId: resourceLease.leaseId,
        executionEnabled: isLocalEmbeddingProviderExecutionOptInEnabled(
          options.env
        )
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

export function readLocalEmbeddingModelDirectory(
  env: Readonly<Record<string, string | undefined>> = process.env
): string | undefined {
  const value = env[LOCAL_EMBEDDING_MODEL_DIR_ENV]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function isLocalEmbeddingProviderExecutionOptInEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return (
    env[LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]?.trim() === "1"
  );
}

export async function verifyLocalEmbeddingModelArtifacts(
  modelDirectory: string,
  artifactPlan: LocalEmbeddingArtifactPlan = createPinnedLocalEmbeddingArtifactPlan()
): Promise<void> {
  const root = path.resolve(modelDirectory);
  for (const artifact of artifactPlan.artifacts) {
    if (!artifact.required) {
      continue;
    }
    if (
      !artifact.pinned ||
      artifact.sha256 === undefined ||
      !/^[a-f0-9]{64}$/u.test(artifact.sha256)
    ) {
      throw new Error("MODEL_ARTIFACT_UNAVAILABLE");
    }

    const artifactPath = resolveLocalEmbeddingArtifactPath(
      root,
      artifact.key
    );
    const artifactStat = await stat(artifactPath).catch(() => undefined);
    if (artifactStat === undefined || !artifactStat.isFile()) {
      throw new Error("MODEL_ARTIFACT_UNAVAILABLE");
    }
    const observedSha256 = await sha256File(artifactPath);
    if (observedSha256 !== artifact.sha256) {
      throw new Error("MODEL_ARTIFACT_UNAVAILABLE");
    }
  }
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
  private releasePromise: Promise<void> | undefined;

  public constructor(
    private readonly options: {
      client: RuntimeHelperClient;
      sessionId: string;
      resourceLeaseId: string;
      executionEnabled: boolean;
    }
  ) {}

  public async embed(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    if (!this.options.executionEnabled) {
      throw new Error(LOCAL_EMBEDDING_RUNTIME_EXECUTION_DISABLED_REASON);
    }

    let parsed: EmbeddingGenerationRequest;
    try {
      parsed = EmbeddingGenerationRequestSchema.parse(request);
    } catch {
      throw new Error("HELPER_PROTOCOL_INVALID");
    }

    const helperResult = await this.options.client.embed({
      sessionId: this.options.sessionId,
      resourceLeaseId: this.options.resourceLeaseId,
      request: parsed
    });
    try {
      const result = EmbeddingGenerationResultSchema.parse(helperResult);
      assertEmbeddingResultMatchesRequest(result, parsed);
      return result;
    } catch {
      throw new Error("HELPER_PROTOCOL_INVALID");
    }
  }

  public async release(): Promise<void> {
    if (!this.releasePromise) {
      this.releasePromise = (async () => {
        void this.options.resourceLeaseId;
        await this.options.client
          .shutdown({ reason: "request_cancelled" })
          .catch(() => undefined);
      })();
    }
    return this.releasePromise;
  }
}

function assertEmbeddingResultMatchesRequest(
  result: EmbeddingGenerationResult,
  request: EmbeddingGenerationRequest
): void {
  if (
    result.modelId !== request.modelId ||
    result.vectors.length !== request.inputs.length ||
    (request.dimensions !== undefined &&
      result.dimensions !== request.dimensions)
  ) {
    throw new Error("HELPER_PROTOCOL_INVALID");
  }

  for (const [index, input] of request.inputs.entries()) {
    const vector = result.vectors[index];
    if (vector === undefined) {
      throw new Error("HELPER_PROTOCOL_INVALID");
    }
    if (input.id !== undefined && vector.inputId !== input.id) {
      throw new Error("HELPER_PROTOCOL_INVALID");
    }
    if (
      vector.values.length !== result.dimensions ||
      !vector.values.every((value) => Number.isFinite(value))
    ) {
      throw new Error("HELPER_PROTOCOL_INVALID");
    }
  }
}

function resolveLocalEmbeddingArtifactPath(
  root: string,
  artifactKey: string
): string {
  if (
    artifactKey.length === 0 ||
    artifactKey.includes("\\") ||
    artifactKey.includes(":") ||
    artifactKey
      .split("/")
      .some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error("MODEL_ARTIFACT_UNAVAILABLE");
  }

  const artifactPath = path.resolve(root, artifactKey);
  if (
    artifactPath !== root &&
    !artifactPath.startsWith(`${root}${path.sep}`)
  ) {
    throw new Error("MODEL_ARTIFACT_UNAVAILABLE");
  }
  return artifactPath;
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}
