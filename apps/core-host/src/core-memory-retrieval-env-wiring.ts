import type { EmbeddingInferenceProvider } from "@jarvis-k/capabilities";
import type { CoreMemoryRetrievalRoutingOptions } from "@jarvis-k/core";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import type { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "./core-memory-retrieval-env-wiring-approval-gate";
import { isLocalEmbeddingProviderOptInEnabled } from "./local-embedding-composition";
import { isLocalEmbeddingProviderExecutionOptInEnabled } from "./local-embedding-runtime-session-factory";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "./memory-retrieval-provider-query-vector-approval-gate";

export const CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_MODEL_ID =
  "fixture/core-host-memory-retrieval";

const CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_QUERY_VECTOR = [1, 0, 0] as const;
const PROVIDER_QUERY_VECTOR_TIMEOUT_MS = 10_000;
const PROVIDER_QUERY_TEXT_MAX_LENGTH = 2_000;

export interface CoreHostMemoryRetrievalEnvWiringOptions {
  env?: Readonly<Record<string, string | undefined>>;
  memoryRepository: SqliteMemoryRepository;
  embeddingProvider?: EmbeddingInferenceProvider;
}

export interface CoreHostMemoryRetrievalEnvWiring {
  enabled: boolean;
  retrievalPort?: CoreHostFixtureMemoryRetrievalPort;
  routingOptions?: CoreMemoryRetrievalRoutingOptions;
}

export function createCoreHostMemoryRetrievalEnvWiring(
  options: CoreHostMemoryRetrievalEnvWiringOptions
): CoreHostMemoryRetrievalEnvWiring {
  const env = options.env ?? process.env;
  if (!isMemoryRetrievalRoutingOptInEnabled(env)) {
    return {
      enabled: false
    };
  }

  return {
    enabled: true,
    retrievalPort: new CoreHostFixtureMemoryRetrievalPort(
      options.memoryRepository
    ),
    routingOptions: {
      enabled: true,
      modelId: CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_MODEL_ID,
      limit: 5,
      resolveQueryVector: createQueryVectorResolver(options, env)
    }
  };
}

export function isMemoryRetrievalRoutingOptInEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return env[MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]?.trim() === "1";
}

export function isMemoryRetrievalProviderQueryVectorOptInEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return env[MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]?.trim() === "1";
}

function createQueryVectorResolver(
  options: CoreHostMemoryRetrievalEnvWiringOptions,
  env: Readonly<Record<string, string | undefined>>
): CoreMemoryRetrievalRoutingOptions["resolveQueryVector"] {
  if (!isMemoryRetrievalProviderQueryVectorOptInEnabled(env)) {
    return () => [...CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_QUERY_VECTOR];
  }

  return async (context) => {
    if (
      !isLocalEmbeddingProviderOptInEnabled(env) ||
      !isLocalEmbeddingProviderExecutionOptInEnabled(env) ||
      !options.embeddingProvider
    ) {
      throw new Error("MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_UNAVAILABLE");
    }

    const text = sanitizeProviderQueryText(context.queryText);
    if (!text) {
      throw new Error("MEMORY_RETRIEVAL_PROVIDER_QUERY_TEXT_INVALID");
    }

    const result = await withTimeout(
      options.embeddingProvider.embed({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        inputs: [
          {
            id: context.messageId,
            text
          }
        ]
      }),
      PROVIDER_QUERY_VECTOR_TIMEOUT_MS
    );
    const vector = result.vectors[0]?.values;
    if (
      result.modelId !== LOCAL_EMBEDDING_MODEL_ID ||
      result.vectors.length !== 1 ||
      result.dimensions !== vector?.length ||
      !isValidProviderQueryVector(vector)
    ) {
      throw new Error("MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_INVALID");
    }

    return [...vector];
  };
}

function sanitizeProviderQueryText(text: string | undefined): string | undefined {
  const sanitized = (text ?? "")
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, PROVIDER_QUERY_TEXT_MAX_LENGTH)
    .trim();
  return sanitized.length > 0 ? sanitized : undefined;
}

function isValidProviderQueryVector(
  vector: readonly number[] | undefined
): vector is readonly number[] {
  return (
    Array.isArray(vector) &&
    vector.length > 0 &&
    vector.length <= 8192 &&
    vector.every((value) => Number.isFinite(value))
  );
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error("MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_TIMEOUT"));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

class CoreHostFixtureMemoryRetrievalPort {
  public constructor(private readonly repository: SqliteMemoryRepository) {}

  public retrieve(
    query: Parameters<SqliteMemoryRepository["querySimilar"]>[0]
  ): ReturnType<SqliteMemoryRepository["querySimilar"]> {
    return this.repository.querySimilar(query);
  }
}
