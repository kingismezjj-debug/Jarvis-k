import type { EmbeddingInferenceProvider } from "@jarvis-k/capabilities";
import type {
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult,
  Message
} from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import type { EmbeddingMemoryRecord } from "@jarvis-k/memory";
import type { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import { describe, expect, it } from "vitest";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "../src/core-memory-retrieval-env-wiring-approval-gate";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "../src/local-embedding-composition";
import { LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV } from "../src/local-embedding-runtime-session-factory";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV } from "../src/memory-provider-vector-retrieval-developer-alpha-plan";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "../src/memory-provider-vector-write-approval-gate";
import {
  createCoreHostProviderVectorWriteWiring,
  isMemoryProviderVectorWriteOptInEnabled
} from "../src/memory-provider-vector-write-wiring";

describe("Core Host provider vector write wiring", () => {
  it("keeps provider vector writes disabled by default", async () => {
    const repository = new FakeSqliteMemoryRepository();
    const embeddingProvider = new FakeEmbeddingProvider();
    const wiring = createCoreHostProviderVectorWriteWiring({
      env: {},
      memoryRepository: repository.asRepository(),
      embeddingProvider
    });

    expect(isMemoryProviderVectorWriteOptInEnabled({})).toBe(false);
    expect(wiring.enabled).toBe(false);
    expect(wiring.memoryRepository).toBe(repository.asRepository());
    await wiring.memoryRepository.appendMessage(message("msg-default"));
    expect(embeddingProvider.calls).toBe(0);
    expect(repository.embeddingRecords).toEqual([]);
  });

  it("writes one sanitized provider vector after accepted source messages when all gates are enabled", async () => {
    const repository = new FakeSqliteMemoryRepository();
    const embeddingProvider = new FakeEmbeddingProvider();
    const wiring = createCoreHostProviderVectorWriteWiring({
      env: approvedEnv(),
      memoryRepository: repository.asRepository(),
      embeddingProvider
    });
    const rawText = `  Remember\tthis topic.\n${"x".repeat(2_200)}  `;

    const accepted = await wiring.memoryRepository.appendMessage(
      message("msg-provider", rawText)
    );
    const serializedRecords = JSON.stringify(repository.embeddingRecords);

    expect(accepted.id).toBe("msg-provider");
    expect(wiring.enabled).toBe(true);
    expect(repository.messages.map((item) => item.id)).toEqual([
      "msg-provider"
    ]);
    expect(embeddingProvider.calls).toBe(1);
    expect(embeddingProvider.lastRequest).toEqual({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      inputs: [
        {
          id: "msg-provider",
          text: expect.stringMatching(/^Remember this topic\. x/u)
        }
      ]
    });
    expect(embeddingProvider.lastRequest?.inputs[0]?.text.length)
      .toBeLessThanOrEqual(2_000);
    expect(repository.embeddingRecords).toHaveLength(1);
    expect(repository.embeddingRecords[0]).toMatchObject({
      conversationId: "primary",
      sourceType: "message",
      sourceId: "msg-provider",
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      dimensions: 3,
      vector: [0.25, 0.5, 0.75],
      createdAt: "2026-08-03T00:00:00.000Z"
    });
    expect(repository.embeddingRecords[0]?.id).toMatch(
      /^embedding\/provider\/[a-f0-9]{32}$/u
    );
    expect(serializedRecords).not.toContain(rawText);
    expect(serializedRecords).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("fails closed without provider execution gates and keeps message writes successful", async () => {
    const repository = new FakeSqliteMemoryRepository();
    const embeddingProvider = new FakeEmbeddingProvider();
    const wiring = createCoreHostProviderVectorWriteWiring({
      env: {
        ...approvedEnv(),
        [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "0"
      },
      memoryRepository: repository.asRepository(),
      embeddingProvider
    });

    await expect(
      wiring.memoryRepository.appendMessage(message("msg-no-execution"))
    ).resolves.toMatchObject({
      id: "msg-no-execution"
    });
    expect(embeddingProvider.calls).toBe(0);
    expect(repository.embeddingRecords).toEqual([]);
  });

  it("fails closed without the developer-alpha usage gate", async () => {
    const repository = new FakeSqliteMemoryRepository();
    const embeddingProvider = new FakeEmbeddingProvider();
    const wiring = createCoreHostProviderVectorWriteWiring({
      env: {
        ...approvedEnv(),
        [MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV]: "0"
      },
      memoryRepository: repository.asRepository(),
      embeddingProvider
    });

    await expect(
      wiring.memoryRepository.appendMessage(message("msg-no-alpha"))
    ).resolves.toMatchObject({
      id: "msg-no-alpha"
    });
    expect(wiring.enabled).toBe(false);
    expect(embeddingProvider.calls).toBe(0);
    expect(repository.embeddingRecords).toEqual([]);
  });

  it("does not block message acceptance when embedding or SQLite vector write fails", async () => {
    const embeddingFailureRepository = new FakeSqliteMemoryRepository();
    const embeddingProvider = new FakeEmbeddingProvider();
    embeddingProvider.shouldThrow = true;
    const embeddingFailureWiring = createCoreHostProviderVectorWriteWiring({
      env: approvedEnv(),
      memoryRepository: embeddingFailureRepository.asRepository(),
      embeddingProvider
    });

    await expect(
      embeddingFailureWiring.memoryRepository.appendMessage(
        message("msg-embed-failure")
      )
    ).resolves.toMatchObject({
      id: "msg-embed-failure"
    });
    expect(embeddingFailureRepository.embeddingRecords).toEqual([]);

    const writeFailureRepository = new FakeSqliteMemoryRepository();
    writeFailureRepository.writeStatus = "degraded";
    const writeFailureWiring = createCoreHostProviderVectorWriteWiring({
      env: approvedEnv(),
      memoryRepository: writeFailureRepository.asRepository(),
      embeddingProvider: new FakeEmbeddingProvider()
    });

    await expect(
      writeFailureWiring.memoryRepository.appendMessage(
        message("msg-write-failure")
      )
    ).resolves.toMatchObject({
      id: "msg-write-failure"
    });
    expect(writeFailureRepository.embeddingRecords).toHaveLength(1);
  });

  it("skips empty minimized text, non-user messages, and invalid provider vectors", async () => {
    const repository = new FakeSqliteMemoryRepository();
    const embeddingProvider = new FakeEmbeddingProvider();
    const wiring = createCoreHostProviderVectorWriteWiring({
      env: approvedEnv(),
      memoryRepository: repository.asRepository(),
      embeddingProvider
    });

    await wiring.memoryRepository.appendMessage(message("msg-empty", " \n\t "));
    await wiring.memoryRepository.appendMessage({
      ...message("msg-assistant", "Assistant output should not be indexed."),
      role: "assistant"
    });
    embeddingProvider.vector = [Number.NaN];
    await wiring.memoryRepository.appendMessage(
      message("msg-invalid-vector", "Valid source text.")
    );

    expect(repository.messages.map((item) => item.id)).toEqual([
      "msg-empty",
      "msg-assistant",
      "msg-invalid-vector"
    ]);
    expect(embeddingProvider.calls).toBe(1);
    expect(repository.embeddingRecords).toEqual([]);
  });
});

function approvedEnv(): Record<string, string> {
  return {
    [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
    [MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV]: "1",
    [MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]: "1",
    [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
    [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1"
  };
}

function message(id: string, text = "Remember this."): Message {
  return {
    id,
    conversationId: "primary",
    role: "user",
    text,
    createdAt: "2026-08-03T00:00:00.000Z"
  };
}

class FakeEmbeddingProvider implements EmbeddingInferenceProvider {
  public calls = 0;
  public lastRequest: EmbeddingGenerationRequest | undefined;
  public vector: number[] = [0.25, 0.5, 0.75];
  public shouldThrow = false;

  public async embed(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    this.calls += 1;
    this.lastRequest = {
      ...request,
      inputs: request.inputs.map((input) => ({ ...input }))
    };
    if (this.shouldThrow) {
      throw new Error("private diagnostic should stay hidden");
    }
    return {
      modelId: request.modelId,
      dimensions: this.vector.length,
      vectors: [
        {
          inputId: request.inputs[0]?.id,
          values: [...this.vector]
        }
      ],
      generatedAt: "2026-08-03T00:00:00.000Z"
    };
  }
}

class FakeSqliteMemoryRepository {
  public messages: Message[] = [];
  public embeddingRecords: EmbeddingMemoryRecord[] = [];
  public writeStatus: "accepted" | "degraded" = "accepted";

  public asRepository(): SqliteMemoryRepository {
    return this as unknown as SqliteMemoryRepository;
  }

  public async initialize(): Promise<void> {}
  public async checkHealth() {
    return { status: "ok" as const, checkedAt: "2026-08-03T00:00:00.000Z" };
  }
  public async upsertConversation() {
    throw new Error("not used");
  }
  public async updateConversation() {
    throw new Error("not used");
  }
  public async listConversations() {
    return [];
  }
  public async getActiveConversationId() {
    return undefined;
  }
  public async setActiveConversationId() {}
  public async appendMessage(input: Message): Promise<Message> {
    this.messages.push({ ...input });
    return { ...input };
  }
  public async listMessages() {
    return this.messages.map((item) => ({ ...item }));
  }
  public async listRecentMessages() {
    return this.messages.map((item) => ({ ...item }));
  }
  public async upsertSummary() {
    throw new Error("not used");
  }
  public async listSummaries() {
    return [];
  }
  public async getSnapshot() {
    return { messages: this.messages, conversations: [] };
  }
  public async restoreSnapshot() {}
  public async exportSnapshot() {
    return { messages: this.messages, conversations: [] };
  }
  public async importSnapshot() {}
  public async close() {}

  public async writeEmbeddingRecord(record: EmbeddingMemoryRecord) {
    this.embeddingRecords.push({
      ...record,
      vector: [...record.vector]
    });
    return this.writeStatus === "accepted"
      ? { status: "accepted" as const, recordId: record.id }
      : { status: "degraded" as const, reasonCode: "VECTOR_DUPLICATE_SOURCE" };
  }
}
