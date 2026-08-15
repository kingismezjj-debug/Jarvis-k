import type { Message } from "@jarvis-k/contracts";
import {
  EmbeddingMemoryRetrievalResultSchema,
  type EmbeddingMemoryMatch,
  type EmbeddingMemoryRetrievalPort,
} from "@jarvis-k/memory";

export const MEMORY_RETRIEVAL_ROUTING_LIMIT = 5;
export const MEMORY_RETRIEVAL_ROUTING_MODEL_PREFIX = "fixture/";
export const MEMORY_RETRIEVAL_ROUTING_PROVIDER_VECTOR_MODE = "provider_vector";

export type CoreMemoryRetrievalRoutingMode =
  "fixture_only" | typeof MEMORY_RETRIEVAL_ROUTING_PROVIDER_VECTOR_MODE;

export type CoreMemoryRecallFailureClass =
  | "QUERY_EMBEDDING_TIMEOUT"
  | "QUERY_EMBEDDING_FAILED"
  | "VECTOR_QUERY_EXECUTION_FAILED"
  | "VECTOR_QUERY_RESULT_INVALID"
  | "HELPER_LIFECYCLE_FAILED"
  | "MEMORY_RETRIEVAL_ROUTING_FAILED";

export type CoreMemoryRetrievalFailureStage =
  "query_embedding" | "vector_query" | "vector_query_result";

export interface CoreMemoryRetrievalFailureClassificationInput {
  stage: CoreMemoryRetrievalFailureStage;
  reasonCode?: string;
  error?: unknown;
}

export interface CoreMemoryRetrievalRoutingQueryContext {
  messageId: string;
  conversationId: string;
  createdAt: string;
  queryText?: string;
}

export interface CoreMemoryRetrievalRoutingOptions {
  enabled: boolean;
  modelId: string;
  mode?: CoreMemoryRetrievalRoutingMode;
  allowedModelId?: string;
  limit?: number;
  minScore?: number;
  classifyFailure?: (
    input: CoreMemoryRetrievalFailureClassificationInput,
  ) => CoreMemoryRecallFailureClass;
  resolveQueryVector(
    context: CoreMemoryRetrievalRoutingQueryContext,
  ): readonly number[] | Promise<readonly number[]>;
}

export interface CoreMemoryRecallMatch {
  id: string;
  conversationId: string;
  sourceType: "message" | "summary";
  sourceId: string;
  modelId: string;
  score: number;
  createdAt: string;
}

export interface CoreMemoryRecallObservation {
  status: "ok" | "degraded";
  mode: CoreMemoryRetrievalRoutingMode;
  injectedIntoTurnAssembly: boolean;
  modelId: string;
  queryDimensions: number;
  matchCount: number;
  matches: CoreMemoryRecallMatch[];
  generatedAt: string;
  reasonCode?: string;
  failureClass?: CoreMemoryRecallFailureClass;
}

export interface MemoryRecallServiceOptions {
  retrievalPort?: EmbeddingMemoryRetrievalPort | undefined;
  routing?: CoreMemoryRetrievalRoutingOptions | undefined;
  now: () => Date;
}

export class MemoryRecallService {
  private readonly retrievalPort: EmbeddingMemoryRetrievalPort | undefined;
  private readonly routing: CoreMemoryRetrievalRoutingOptions | undefined;
  private readonly now: () => Date;

  public constructor(options: MemoryRecallServiceOptions) {
    this.retrievalPort = options.retrievalPort;
    this.routing = options.routing;
    this.now = options.now;
  }

  public async retrieveForAcceptedMessage(
    message: Message,
  ): Promise<CoreMemoryRecallObservation | undefined> {
    if (this.routing?.enabled !== true) {
      return undefined;
    }

    const modelId = this.routing.modelId;
    if (!this.isAllowedModelId(modelId)) {
      return this.degraded("MEMORY_RETRIEVAL_MODEL_BLOCKED");
    }

    if (!this.retrievalPort) {
      return this.degraded("MEMORY_RETRIEVAL_PORT_UNAVAILABLE");
    }

    let vector: readonly number[];
    try {
      const queryText = this.sanitizeQueryText(message.text);
      vector = await this.routing.resolveQueryVector({
        messageId: message.id,
        conversationId: message.conversationId,
        createdAt: message.createdAt,
        ...(queryText === undefined ? {} : { queryText }),
      });
    } catch (error) {
      return this.degraded(
        "MEMORY_RETRIEVAL_ROUTING_FAILED",
        "blocked",
        0,
        this.now().toISOString(),
        this.classifyFailure({
          stage: "query_embedding",
          error,
        }),
      );
    }
    if (!this.isValidQueryVector(vector)) {
      return this.degraded(
        "MEMORY_RETRIEVAL_QUERY_INVALID",
        "blocked",
        0,
        this.now().toISOString(),
        "QUERY_EMBEDDING_FAILED",
      );
    }

    let rawResult: unknown;
    try {
      rawResult = await this.retrievalPort.retrieve({
        modelId,
        vector: [...vector],
        limit: this.retrievalLimit(),
        ...(this.routing.minScore === undefined
          ? {}
          : { minScore: this.routing.minScore }),
        conversationId: message.conversationId,
      });
    } catch (error) {
      return this.degraded(
        "MEMORY_RETRIEVAL_ROUTING_FAILED",
        "blocked",
        0,
        this.now().toISOString(),
        this.classifyFailure({
          stage: "vector_query",
          error,
        }),
      );
    }

    let result: Awaited<ReturnType<EmbeddingMemoryRetrievalPort["retrieve"]>>;
    try {
      result = EmbeddingMemoryRetrievalResultSchema.parse(rawResult);
    } catch (error) {
      return this.degraded(
        "MEMORY_RETRIEVAL_RESULT_INVALID",
        modelId,
        vector.length,
        this.now().toISOString(),
        this.classifyFailure({
          stage: "vector_query_result",
          error,
        }),
      );
    }

    try {
      if (!this.isAllowedModelId(result.modelId)) {
        return this.degraded(
          "MEMORY_RETRIEVAL_RESULT_MODEL_BLOCKED",
          "blocked",
          0,
          result.generatedAt,
          "VECTOR_QUERY_RESULT_INVALID",
        );
      }

      if (result.status === "degraded") {
        const reasonCode = this.sanitizeReasonCode(result.reasonCode);
        return this.degraded(
          reasonCode,
          this.sanitizeModelId(result.modelId),
          result.queryDimensions,
          result.generatedAt,
          this.classifyFailure({
            stage: "vector_query_result",
            ...(reasonCode === undefined ? {} : { reasonCode }),
          }),
        );
      }

      const matches = result.matches
        .slice(0, MEMORY_RETRIEVAL_ROUTING_LIMIT)
        .map((match) => this.sanitizeMatch(match));
      return {
        status: "ok",
        mode: this.mode(),
        injectedIntoTurnAssembly: matches.length > 0,
        modelId: result.modelId,
        queryDimensions: result.queryDimensions,
        matchCount: matches.length,
        matches,
        generatedAt: result.generatedAt,
      };
    } catch {
      return this.degraded(
        "MEMORY_RETRIEVAL_ROUTING_FAILED",
        modelId,
        vector.length,
        this.now().toISOString(),
        "MEMORY_RETRIEVAL_ROUTING_FAILED",
      );
    }
  }

  public mode(): CoreMemoryRetrievalRoutingMode {
    return this.routing?.mode === MEMORY_RETRIEVAL_ROUTING_PROVIDER_VECTOR_MODE
      ? MEMORY_RETRIEVAL_ROUTING_PROVIDER_VECTOR_MODE
      : "fixture_only";
  }

  public degraded(
    reasonCode: string | undefined,
    modelId = "blocked",
    queryDimensions = 0,
    generatedAt = this.now().toISOString(),
    failureClass: CoreMemoryRecallFailureClass = "MEMORY_RETRIEVAL_ROUTING_FAILED",
  ): CoreMemoryRecallObservation {
    return {
      status: "degraded",
      mode: this.mode(),
      injectedIntoTurnAssembly: false,
      modelId,
      queryDimensions,
      matchCount: 0,
      matches: [],
      generatedAt,
      reasonCode:
        this.sanitizeReasonCode(reasonCode) ??
        "MEMORY_RETRIEVAL_ROUTING_DEGRADED",
      failureClass,
    };
  }

  private retrievalLimit(): number {
    const limit = this.routing?.limit;
    if (typeof limit !== "number" || !Number.isInteger(limit)) {
      return MEMORY_RETRIEVAL_ROUTING_LIMIT;
    }
    return Math.max(1, Math.min(MEMORY_RETRIEVAL_ROUTING_LIMIT, limit));
  }

  private isValidQueryVector(vector: readonly number[]): boolean {
    return (
      Array.isArray(vector) &&
      vector.length > 0 &&
      vector.length <= 8192 &&
      vector.every((value) => Number.isFinite(value))
    );
  }

  private classifyFailure(
    input: CoreMemoryRetrievalFailureClassificationInput,
  ): CoreMemoryRecallFailureClass {
    const candidate = this.routing?.classifyFailure?.(input);
    if (candidate && isCoreMemoryRecallFailureClass(candidate)) {
      return candidate;
    }
    if (input.stage === "query_embedding") {
      return "QUERY_EMBEDDING_FAILED";
    }
    if (input.stage === "vector_query") {
      return "VECTOR_QUERY_EXECUTION_FAILED";
    }
    if (
      input.reasonCode === "VECTOR_QUERY_INVALID" ||
      input.reasonCode === "VECTOR_SCHEMA_UNAVAILABLE" ||
      input.reasonCode === "VECTOR_NON_FIXTURE_QUERY_BLOCKED"
    ) {
      return "VECTOR_QUERY_RESULT_INVALID";
    }
    if (input.reasonCode === "VECTOR_QUERY_EXECUTION_FAILED") {
      return "VECTOR_QUERY_EXECUTION_FAILED";
    }
    return "MEMORY_RETRIEVAL_ROUTING_FAILED";
  }

  private sanitizeReasonCode(reasonCode: string | undefined): string | undefined {
    if (!reasonCode) {
      return undefined;
    }
    return /^[A-Z0-9_]{1,128}$/u.test(reasonCode)
      ? reasonCode
      : "MEMORY_RETRIEVAL_ROUTING_DEGRADED";
  }

  private sanitizeModelId(modelId: string): string {
    return this.isAllowedModelId(modelId) ? modelId : "blocked";
  }

  private isAllowedModelId(modelId: string): boolean {
    if (this.mode() === MEMORY_RETRIEVAL_ROUTING_PROVIDER_VECTOR_MODE) {
      const allowedModelId = this.routing?.allowedModelId;
      return (
        typeof allowedModelId === "string" &&
        allowedModelId.length > 0 &&
        modelId === allowedModelId
      );
    }
    return modelId.startsWith(MEMORY_RETRIEVAL_ROUTING_MODEL_PREFIX);
  }

  private sanitizeMatch(match: EmbeddingMemoryMatch): CoreMemoryRecallMatch {
    return {
      id: match.id,
      conversationId: match.conversationId,
      sourceType: match.sourceType,
      sourceId: match.sourceId,
      modelId: match.modelId,
      score: match.score,
      createdAt: match.createdAt,
    };
  }

  private sanitizeQueryText(text: string): string | undefined {
    const sanitized = text
      .replace(/[\u0000-\u001f\u007f]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim()
      .slice(0, 2_000)
      .trim();
    return sanitized.length > 0 ? sanitized : undefined;
  }
}

function isCoreMemoryRecallFailureClass(
  value: string,
): value is CoreMemoryRecallFailureClass {
  return (
    value === "QUERY_EMBEDDING_TIMEOUT" ||
    value === "QUERY_EMBEDDING_FAILED" ||
    value === "VECTOR_QUERY_EXECUTION_FAILED" ||
    value === "VECTOR_QUERY_RESULT_INVALID" ||
    value === "HELPER_LIFECYCLE_FAILED" ||
    value === "MEMORY_RETRIEVAL_ROUTING_FAILED"
  );
}
