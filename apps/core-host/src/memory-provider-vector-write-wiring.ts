import { createHash } from "node:crypto";
import type { EmbeddingInferenceProvider } from "@jarvis-k/capabilities";
import type { Message } from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import type { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "./core-memory-retrieval-env-wiring-approval-gate";
import { isLocalEmbeddingProviderOptInEnabled } from "./local-embedding-composition";
import { isLocalEmbeddingProviderExecutionOptInEnabled } from "./local-embedding-runtime-session-factory";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "./memory-provider-vector-write-approval-gate";

const PROVIDER_VECTOR_WRITE_TIMEOUT_MS = 10_000;
const PROVIDER_VECTOR_WRITE_TEXT_MAX_LENGTH = 2_000;
const PROVIDER_VECTOR_WRITE_RECORD_ID_PREFIX = "embedding/provider/";

export interface CoreHostProviderVectorWriteOptions {
  env?: Readonly<Record<string, string | undefined>>;
  memoryRepository: SqliteMemoryRepository;
  embeddingProvider?: EmbeddingInferenceProvider;
  timeoutMs?: number;
}

export interface CoreHostProviderVectorWriteWiring {
  enabled: boolean;
  memoryRepository: CoreHostMemoryRepository;
}

interface CoreHostMemoryRepository {
  initialize(): ReturnType<SqliteMemoryRepository["initialize"]>;
  checkHealth(): ReturnType<SqliteMemoryRepository["checkHealth"]>;
  upsertConversation(
    input: Parameters<SqliteMemoryRepository["upsertConversation"]>[0]
  ): ReturnType<SqliteMemoryRepository["upsertConversation"]>;
  updateConversation(
    input: Parameters<SqliteMemoryRepository["updateConversation"]>[0]
  ): ReturnType<SqliteMemoryRepository["updateConversation"]>;
  listConversations(
    options?: Parameters<SqliteMemoryRepository["listConversations"]>[0]
  ): ReturnType<SqliteMemoryRepository["listConversations"]>;
  getActiveConversationId(): ReturnType<
    SqliteMemoryRepository["getActiveConversationId"]
  >;
  setActiveConversationId(
    conversationId: string
  ): ReturnType<SqliteMemoryRepository["setActiveConversationId"]>;
  appendMessage(message: Message): Promise<Message>;
  listMessages(
    options?: Parameters<SqliteMemoryRepository["listMessages"]>[0]
  ): ReturnType<SqliteMemoryRepository["listMessages"]>;
  listRecentMessages(
    options: Parameters<SqliteMemoryRepository["listRecentMessages"]>[0]
  ): ReturnType<SqliteMemoryRepository["listRecentMessages"]>;
  upsertSummary(
    input: Parameters<SqliteMemoryRepository["upsertSummary"]>[0]
  ): ReturnType<SqliteMemoryRepository["upsertSummary"]>;
  listSummaries(
    options?: Parameters<SqliteMemoryRepository["listSummaries"]>[0]
  ): ReturnType<SqliteMemoryRepository["listSummaries"]>;
  getSnapshot(): ReturnType<SqliteMemoryRepository["getSnapshot"]>;
  restoreSnapshot(
    snapshot: Parameters<SqliteMemoryRepository["restoreSnapshot"]>[0]
  ): ReturnType<SqliteMemoryRepository["restoreSnapshot"]>;
  exportSnapshot(): ReturnType<SqliteMemoryRepository["exportSnapshot"]>;
  importSnapshot(
    snapshot: Parameters<SqliteMemoryRepository["importSnapshot"]>[0]
  ): ReturnType<SqliteMemoryRepository["importSnapshot"]>;
  close(): ReturnType<SqliteMemoryRepository["close"]>;
}

export function createCoreHostProviderVectorWriteWiring(
  options: CoreHostProviderVectorWriteOptions
): CoreHostProviderVectorWriteWiring {
  const env = options.env ?? process.env;
  if (!isMemoryProviderVectorWriteOptInEnabled(env)) {
    return {
      enabled: false,
      memoryRepository: options.memoryRepository
    };
  }

  return {
    enabled: true,
    memoryRepository: new ProviderVectorWriteMemoryRepository(
      options.memoryRepository,
      options.embeddingProvider,
      env,
      options.timeoutMs ?? PROVIDER_VECTOR_WRITE_TIMEOUT_MS
    )
  };
}

export function isMemoryProviderVectorWriteOptInEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return env[MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]?.trim() === "1";
}

export function areMemoryProviderVectorWriteGatesEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
  embeddingProvider?: EmbeddingInferenceProvider
): boolean {
  return (
    embeddingProvider !== undefined &&
    env[MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]?.trim() === "1" &&
    isMemoryProviderVectorWriteOptInEnabled(env) &&
    isLocalEmbeddingProviderOptInEnabled(env) &&
    isLocalEmbeddingProviderExecutionOptInEnabled(env)
  );
}

class ProviderVectorWriteMemoryRepository implements CoreHostMemoryRepository {
  public constructor(
    private readonly inner: SqliteMemoryRepository,
    private readonly embeddingProvider: EmbeddingInferenceProvider | undefined,
    private readonly env: Readonly<Record<string, string | undefined>>,
    private readonly timeoutMs: number
  ) {}

  public initialize(): ReturnType<SqliteMemoryRepository["initialize"]> {
    return this.inner.initialize();
  }

  public checkHealth(): ReturnType<SqliteMemoryRepository["checkHealth"]> {
    return this.inner.checkHealth();
  }

  public upsertConversation(
    input: Parameters<SqliteMemoryRepository["upsertConversation"]>[0]
  ): ReturnType<SqliteMemoryRepository["upsertConversation"]> {
    return this.inner.upsertConversation(input);
  }

  public updateConversation(
    input: Parameters<SqliteMemoryRepository["updateConversation"]>[0]
  ): ReturnType<SqliteMemoryRepository["updateConversation"]> {
    return this.inner.updateConversation(input);
  }

  public listConversations(
    options?: Parameters<SqliteMemoryRepository["listConversations"]>[0]
  ): ReturnType<SqliteMemoryRepository["listConversations"]> {
    return this.inner.listConversations(options);
  }

  public getActiveConversationId(): ReturnType<
    SqliteMemoryRepository["getActiveConversationId"]
  > {
    return this.inner.getActiveConversationId();
  }

  public setActiveConversationId(
    conversationId: string
  ): ReturnType<SqliteMemoryRepository["setActiveConversationId"]> {
    return this.inner.setActiveConversationId(conversationId);
  }

  public async appendMessage(message: Message): Promise<Message> {
    const accepted = await this.inner.appendMessage(message);
    await this.writeProviderVectorForMessage(accepted).catch(() => undefined);
    return accepted;
  }

  public listMessages(
    options?: Parameters<SqliteMemoryRepository["listMessages"]>[0]
  ): ReturnType<SqliteMemoryRepository["listMessages"]> {
    return this.inner.listMessages(options);
  }

  public listRecentMessages(
    options: Parameters<SqliteMemoryRepository["listRecentMessages"]>[0]
  ): ReturnType<SqliteMemoryRepository["listRecentMessages"]> {
    return this.inner.listRecentMessages(options);
  }

  public upsertSummary(
    input: Parameters<SqliteMemoryRepository["upsertSummary"]>[0]
  ): ReturnType<SqliteMemoryRepository["upsertSummary"]> {
    return this.inner.upsertSummary(input);
  }

  public listSummaries(
    options?: Parameters<SqliteMemoryRepository["listSummaries"]>[0]
  ): ReturnType<SqliteMemoryRepository["listSummaries"]> {
    return this.inner.listSummaries(options);
  }

  public getSnapshot(): ReturnType<SqliteMemoryRepository["getSnapshot"]> {
    return this.inner.getSnapshot();
  }

  public restoreSnapshot(
    snapshot: Parameters<SqliteMemoryRepository["restoreSnapshot"]>[0]
  ): ReturnType<SqliteMemoryRepository["restoreSnapshot"]> {
    return this.inner.restoreSnapshot(snapshot);
  }

  public exportSnapshot(): ReturnType<SqliteMemoryRepository["exportSnapshot"]> {
    return this.inner.exportSnapshot();
  }

  public importSnapshot(
    snapshot: Parameters<SqliteMemoryRepository["importSnapshot"]>[0]
  ): ReturnType<SqliteMemoryRepository["importSnapshot"]> {
    return this.inner.importSnapshot(snapshot);
  }

  public close(): ReturnType<SqliteMemoryRepository["close"]> {
    return this.inner.close();
  }

  private async writeProviderVectorForMessage(message: Message): Promise<void> {
    if (!isProviderVectorWriteReady(this.env, this.embeddingProvider)) {
      return;
    }
    if (!isProviderVectorWriteSourceMessage(message)) {
      return;
    }

    const text = sanitizeProviderVectorWriteText(message.text);
    if (!text) {
      return;
    }

    const result = await withTimeout(
      this.embeddingProvider!.embed({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        inputs: [
          {
            id: message.id,
            text
          }
        ]
      }),
      this.timeoutMs
    );
    const vector = result.vectors[0]?.values;
    if (
      result.modelId !== LOCAL_EMBEDDING_MODEL_ID ||
      result.vectors.length !== 1 ||
      result.dimensions !== vector?.length ||
      !isValidProviderVector(vector)
    ) {
      return;
    }

    await this.inner.writeEmbeddingRecord({
      id: createProviderVectorRecordId(message.id),
      conversationId: message.conversationId,
      sourceType: "message",
      sourceId: message.id,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      dimensions: vector.length,
      vector: [...vector],
      createdAt: message.createdAt
    });
  }
}

function isProviderVectorWriteReady(
  env: Readonly<Record<string, string | undefined>>,
  embeddingProvider: EmbeddingInferenceProvider | undefined
): boolean {
  return areMemoryProviderVectorWriteGatesEnabled(env, embeddingProvider);
}

function isProviderVectorWriteSourceMessage(message: Message): boolean {
  return message.role === "user";
}

function sanitizeProviderVectorWriteText(text: string): string | undefined {
  const sanitized = text
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, PROVIDER_VECTOR_WRITE_TEXT_MAX_LENGTH)
    .trim();
  return sanitized.length > 0 ? sanitized : undefined;
}

function isValidProviderVector(
  vector: readonly number[] | undefined
): vector is readonly number[] {
  return (
    Array.isArray(vector) &&
    vector.length > 0 &&
    vector.length <= 8192 &&
    vector.every((value) => Number.isFinite(value))
  );
}

function createProviderVectorRecordId(sourceId: string): string {
  const digest = createHash("sha256").update(sourceId).digest("hex").slice(0, 32);
  return `${PROVIDER_VECTOR_WRITE_RECORD_ID_PREFIX}${digest}`;
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
          reject(new Error("MEMORY_PROVIDER_VECTOR_WRITE_TIMEOUT"));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
