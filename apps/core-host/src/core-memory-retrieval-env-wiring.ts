import type { CoreMemoryRetrievalRoutingOptions } from "@jarvis-k/core";
import type { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "./core-memory-retrieval-env-wiring-approval-gate";

export const CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_MODEL_ID =
  "fixture/core-host-memory-retrieval";

const CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_QUERY_VECTOR = [1, 0, 0] as const;

export interface CoreHostMemoryRetrievalEnvWiringOptions {
  env?: Readonly<Record<string, string | undefined>>;
  memoryRepository: SqliteMemoryRepository;
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
      resolveQueryVector: () => [
        ...CORE_HOST_MEMORY_RETRIEVAL_FIXTURE_QUERY_VECTOR
      ]
    }
  };
}

export function isMemoryRetrievalRoutingOptInEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return env[MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]?.trim() === "1";
}

class CoreHostFixtureMemoryRetrievalPort {
  public constructor(private readonly repository: SqliteMemoryRepository) {}

  public retrieve(
    query: Parameters<SqliteMemoryRepository["querySimilar"]>[0]
  ): ReturnType<SqliteMemoryRepository["querySimilar"]> {
    return this.repository.querySimilar(query);
  }
}
