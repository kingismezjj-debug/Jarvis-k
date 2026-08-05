import type { EmbeddingInferenceProvider } from "@jarvis-k/capabilities";
import type { CoreMemoryRetrievalRoutingOptions } from "@jarvis-k/core";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import {
  type CoreHostMemoryRetrievalEnvWiring,
  createCoreHostMemoryRetrievalEnvWiring,
  isMemoryProviderVectorRetrievalOptInEnabled,
  isMemoryRetrievalProviderQueryVectorOptInEnabled,
  isMemoryRetrievalRoutingOptInEnabled
} from "./core-memory-retrieval-env-wiring";
import {
  type CoreHostProviderVectorWriteWiring,
  createCoreHostProviderVectorWriteWiring,
  isMemoryProviderVectorWriteOptInEnabled
} from "./memory-provider-vector-write-wiring";
import {
  isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled
} from "./memory-provider-vector-retrieval-developer-alpha-plan";
import {
  isLocalEmbeddingProviderExecutionOptInEnabled
} from "./local-embedding-runtime-session-factory";
import { isLocalEmbeddingProviderOptInEnabled } from "./local-embedding-composition";

export const MEMORY_ALPHA_DEFAULT_MAX_MESSAGES = 5;
export const MEMORY_ALPHA_RETENTION_SCOPE =
  "new_accepted_user_messages" as const;

export type MemoryAlphaState = "disabled" | "active" | "degraded";

export type MemoryAlphaReasonCode =
  | "memory_alpha_opt_in_missing"
  | "memory_alpha_disabled"
  | "memory_alpha_retention_limit_reached"
  | "provider_vector_rollback_failed";

export interface CoreHostMemoryAlphaImplementationOptions {
  env?: Readonly<Record<string, string | undefined>>;
  memoryRepository: SqliteMemoryRepository;
  embeddingProvider?: EmbeddingInferenceProvider;
  maxMessages?: number;
  timeoutMs?: number;
}

export interface CoreHostMemoryAlphaStatus {
  state: MemoryAlphaState;
  enabled: boolean;
  retentionScope: typeof MEMORY_ALPHA_RETENTION_SCOPE;
  maxMessageCount: number;
  trackedMessageCount: number;
  rollbackStatus: "not_started" | "passed" | "degraded";
  rollbackDeletedCount: number;
  reasonCodes: MemoryAlphaReasonCode[];
}

export interface CoreHostMemoryAlphaDisableResult
  extends CoreHostMemoryAlphaStatus {
  state: "disabled" | "degraded";
}

export interface CoreHostMemoryAlphaSession {
  getStatus(): CoreHostMemoryAlphaStatus;
  disable(): Promise<CoreHostMemoryAlphaDisableResult>;
}

export interface CoreHostMemoryAlphaImplementation {
  enabled: boolean;
  memoryRepository: CoreHostProviderVectorWriteWiring["memoryRepository"];
  retrievalPort?: NonNullable<
    CoreHostMemoryRetrievalEnvWiring["retrievalPort"]
  >;
  routingOptions?: CoreMemoryRetrievalRoutingOptions;
  session: CoreHostMemoryAlphaSession;
}

export function createCoreHostMemoryAlphaImplementation(
  options: CoreHostMemoryAlphaImplementationOptions
): CoreHostMemoryAlphaImplementation {
  const env = options.env ?? process.env;
  const maxMessages = normalizeMaxMessages(options.maxMessages);
  const retrievalWiring = createCoreHostMemoryRetrievalEnvWiring({
    env,
    memoryRepository: options.memoryRepository,
    ...(options.embeddingProvider === undefined
      ? {}
      : { embeddingProvider: options.embeddingProvider })
  });
  const providerVectorEnabled = areMemoryAlphaGatesEnabled(
    env,
    options.embeddingProvider
  );
  let operatorDisabled = false;
  let state: MemoryAlphaState = providerVectorEnabled
    ? "active"
    : "disabled";
  let rollbackStatus: "not_started" | "passed" | "degraded" =
    "not_started";
  let rollbackDeletedCount = 0;
  const reasonCodes: MemoryAlphaReasonCode[] = providerVectorEnabled
    ? []
    : ["memory_alpha_opt_in_missing"];
  const trackedSourceIds: string[] = [];
  let disableResult: CoreHostMemoryAlphaDisableResult | undefined;

  const currentReasonCodes = (): MemoryAlphaReasonCode[] =>
    trackedSourceIds.length >= maxMessages
      ? [
          ...reasonCodes,
          "memory_alpha_retention_limit_reached"
        ]
      : [...reasonCodes];

  const isProviderVectorRouteEnabled = (): boolean =>
    !operatorDisabled &&
    areMemoryAlphaGatesEnabled(env, options.embeddingProvider);

  const isProviderVectorWriteEnabled = (): boolean =>
    !operatorDisabled &&
    areMemoryAlphaGatesEnabled(env, options.embeddingProvider) &&
    trackedSourceIds.length < maxMessages;

  const providerVectorWriteWiring = createCoreHostProviderVectorWriteWiring({
    env,
    memoryRepository: options.memoryRepository,
    ...(options.embeddingProvider === undefined
      ? {}
      : { embeddingProvider: options.embeddingProvider }),
    ...(options.timeoutMs === undefined
      ? {}
      : { timeoutMs: options.timeoutMs }),
    isEnabled: isProviderVectorWriteEnabled,
    onProviderVectorWrite: (sourceId) => {
      if (!trackedSourceIds.includes(sourceId)) {
        trackedSourceIds.push(sourceId);
      }
    }
  });

  const routingOptions = createDynamicRoutingOptions(
    retrievalWiring.routingOptions,
    () => {
      const baseOptions = retrievalWiring.routingOptions;
      if (!baseOptions || operatorDisabled) {
        return false;
      }
      if (baseOptions.mode === "provider_vector") {
        return isProviderVectorRouteEnabled();
      }
      return baseOptions.enabled;
    }
  );

  const session: CoreHostMemoryAlphaSession = {
    getStatus: () =>
      createStatus({
        state,
        enabled:
          !operatorDisabled &&
          areMemoryAlphaGatesEnabled(env, options.embeddingProvider),
        maxMessages,
        trackedMessageCount: trackedSourceIds.length,
        rollbackStatus,
        rollbackDeletedCount,
        reasonCodes: currentReasonCodes()
      }),
    disable: async () => {
      if (disableResult) {
        return disableResult;
      }

      operatorDisabled = true;
      if (trackedSourceIds.length === 0) {
        rollbackStatus = "passed";
        state = "disabled";
        if (!reasonCodes.includes("memory_alpha_disabled")) {
          reasonCodes.push("memory_alpha_disabled");
        }
        disableResult = createDisableResult({
          state,
          enabled: false,
          maxMessages,
          trackedMessageCount: trackedSourceIds.length,
          rollbackStatus,
          rollbackDeletedCount,
          reasonCodes: currentReasonCodes()
        });
        return disableResult;
      }

      const rollback = await rollbackProviderVectors(
        options.memoryRepository,
        trackedSourceIds
      );
      rollbackStatus = rollback.status;
      rollbackDeletedCount = rollback.deletedCount;
      if (rollback.status !== "passed") {
        state = "degraded";
        reasonCodes.push("provider_vector_rollback_failed");
      } else {
        state = "disabled";
        reasonCodes.push("memory_alpha_disabled");
      }
      disableResult = createDisableResult({
        state,
        enabled: false,
        maxMessages,
        trackedMessageCount: trackedSourceIds.length,
        rollbackStatus,
        rollbackDeletedCount,
        reasonCodes: currentReasonCodes()
      });
      return disableResult;
    }
  };

  return {
    enabled: providerVectorEnabled,
    memoryRepository: providerVectorWriteWiring.memoryRepository,
    ...(retrievalWiring.retrievalPort === undefined
      ? {}
      : { retrievalPort: retrievalWiring.retrievalPort }),
    ...(routingOptions === undefined ? {} : { routingOptions }),
    session
  };
}

function areMemoryAlphaGatesEnabled(
  env: Readonly<Record<string, string | undefined>>,
  embeddingProvider: EmbeddingInferenceProvider | undefined
): boolean {
  return (
    embeddingProvider !== undefined &&
    isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled(env) &&
    isMemoryRetrievalRoutingOptInEnabled(env) &&
    isMemoryRetrievalProviderQueryVectorOptInEnabled(env) &&
    isMemoryProviderVectorWriteOptInEnabled(env) &&
    isMemoryProviderVectorRetrievalOptInEnabled(env) &&
    isLocalEmbeddingProviderOptInEnabled(env) &&
    isLocalEmbeddingProviderExecutionOptInEnabled(env)
  );
}

function createDynamicRoutingOptions(
  baseOptions: CoreMemoryRetrievalRoutingOptions | undefined,
  enabled: () => boolean
): CoreMemoryRetrievalRoutingOptions | undefined {
  if (!baseOptions) {
    return undefined;
  }
  const dynamicOptions = {
    ...baseOptions
  } as CoreMemoryRetrievalRoutingOptions;
  Object.defineProperty(dynamicOptions, "enabled", {
    configurable: false,
    enumerable: true,
    get: enabled
  });
  return dynamicOptions;
}

async function rollbackProviderVectors(
  repository: SqliteMemoryRepository,
  sourceIds: readonly string[]
): Promise<{
  status: "passed" | "degraded";
  deletedCount: number;
}> {
  let deletedCount = 0;
  for (const sourceId of sourceIds) {
    const metadata = await repository.inspectEmbeddingRecordMetadata({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      sourceType: "message",
      sourceId
    });
    if (metadata.status !== "ok") {
      return {
        status: "degraded",
        deletedCount
      };
    }

    const result = await repository.deleteEmbeddingRecordsForSource({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      sourceType: "message",
      sourceId
    });
    if (
      result.status !== "accepted" ||
      result.deletedCount !== metadata.recordCount
    ) {
      return {
        status: "degraded",
        deletedCount
      };
    }
    deletedCount += result.deletedCount;
  }

  return {
    status: "passed",
    deletedCount
  };
}

function normalizeMaxMessages(value: number | undefined): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MEMORY_ALPHA_DEFAULT_MAX_MESSAGES
    ? value
    : MEMORY_ALPHA_DEFAULT_MAX_MESSAGES;
}

function createStatus(input: {
  state: MemoryAlphaState;
  enabled: boolean;
  maxMessages: number;
  trackedMessageCount: number;
  rollbackStatus: "not_started" | "passed" | "degraded";
  rollbackDeletedCount: number;
  reasonCodes: readonly MemoryAlphaReasonCode[];
}): CoreHostMemoryAlphaStatus {
  return {
    state: input.state,
    enabled: input.enabled,
    retentionScope: MEMORY_ALPHA_RETENTION_SCOPE,
    maxMessageCount: input.maxMessages,
    trackedMessageCount: input.trackedMessageCount,
    rollbackStatus: input.rollbackStatus,
    rollbackDeletedCount: input.rollbackDeletedCount,
    reasonCodes: [...new Set(input.reasonCodes)]
  };
}

function createDisableResult(input: {
  state: "disabled" | "degraded";
  enabled: boolean;
  maxMessages: number;
  trackedMessageCount: number;
  rollbackStatus: "passed" | "degraded";
  rollbackDeletedCount: number;
  reasonCodes: readonly MemoryAlphaReasonCode[];
}): CoreHostMemoryAlphaDisableResult {
  return {
    state: input.state,
    enabled: input.enabled,
    retentionScope: MEMORY_ALPHA_RETENTION_SCOPE,
    maxMessageCount: input.maxMessages,
    trackedMessageCount: input.trackedMessageCount,
    rollbackStatus: input.rollbackStatus,
    rollbackDeletedCount: input.rollbackDeletedCount,
    reasonCodes: [...new Set(input.reasonCodes)]
  };
}
