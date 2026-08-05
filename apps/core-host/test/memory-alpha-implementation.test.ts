import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { EmbeddingInferenceProvider } from "@jarvis-k/capabilities";
import type {
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult,
  Message
} from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import { afterEach, describe, expect, it } from "vitest";
import { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import {
  createCoreHostMemoryAlphaImplementation,
  MEMORY_ALPHA_DEFAULT_MAX_MESSAGES
} from "../src/memory-alpha-implementation";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "../src/core-memory-retrieval-env-wiring-approval-gate";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "../src/local-embedding-composition";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "../src/local-embedding-runtime-session-factory";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV } from "../src/memory-provider-vector-retrieval-developer-alpha-plan";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV } from "../src/memory-provider-vector-retrieval-preflight";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "../src/memory-provider-vector-write-approval-gate";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "../src/memory-retrieval-provider-query-vector-approval-gate";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("Core Host Memory alpha implementation", () => {
  it("keeps alpha disabled by default and preserves fixture fallback", async () => {
    const repository = createRepository();
    const provider = new FakeEmbeddingProvider();
    const alpha = createCoreHostMemoryAlphaImplementation({
      env: {
        [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1"
      },
      memoryRepository: repository,
      embeddingProvider: provider
    });

    await alpha.memoryRepository.initialize();
    await alpha.memoryRepository.appendMessage(message("msg-default"));

    expect(alpha.enabled).toBe(false);
    expect(alpha.routingOptions).toMatchObject({
      enabled: true,
      mode: "fixture_only"
    });
    expect(provider.calls).toBe(0);
    expect(
      await repository.inspectEmbeddingRecordMetadata({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        sourceType: "message",
        sourceId: "msg-default"
      })
    ).toMatchObject({
      status: "ok",
      recordCount: 0
    });
    expect(alpha.session.getStatus()).toMatchObject({
      state: "disabled",
      enabled: false,
      retentionScope: "new_accepted_user_messages",
      reasonCodes: ["memory_alpha_opt_in_missing"]
    });

    await repository.close();
  });

  it("completes file-backed write, provider-vector retrieval, and rollback at 1024 dimensions", async () => {
    const repository = createRepository();
    const provider = new FakeEmbeddingProvider(deterministicVector(1024));
    const alpha = createCoreHostMemoryAlphaImplementation({
      env: approvedEnv(),
      memoryRepository: repository,
      embeddingProvider: provider
    });

    await alpha.memoryRepository.initialize();
    const accepted = await alpha.memoryRepository.appendMessage(
      message("msg-alpha", "Remember this alpha topic.")
    );
    const queryVector = await alpha.routingOptions?.resolveQueryVector({
      messageId: accepted.id,
      conversationId: accepted.conversationId,
      createdAt: accepted.createdAt,
      queryText: accepted.text
    });
    const recall = await alpha.retrievalPort?.retrieve({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      vector: queryVector ?? [],
      limit: 5,
      conversationId: accepted.conversationId
    });

    expect(alpha.enabled).toBe(true);
    expect(alpha.routingOptions).toMatchObject({
      enabled: true,
      mode: "provider_vector",
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      allowedModelId: LOCAL_EMBEDDING_MODEL_ID
    });
    expect(queryVector).toHaveLength(1024);
    expect(recall).toMatchObject({
      status: "ok",
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      queryDimensions: 1024
    });
    expect(recall?.matches).toHaveLength(1);
    expect(recall?.matches[0]).toMatchObject({
      sourceId: "msg-alpha",
      modelId: LOCAL_EMBEDDING_MODEL_ID
    });
    expect(JSON.stringify(recall)).not.toContain("Remember this alpha topic.");
    expect(JSON.stringify(recall)).not.toMatch(/[A-Za-z]:\\/u);

    const disabled = await alpha.session.disable();
    const afterRollback = await repository.querySimilar({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      vector: deterministicVector(1024),
      limit: 5,
      conversationId: "primary"
    });

    expect(disabled).toMatchObject({
      state: "disabled",
      enabled: false,
      trackedMessageCount: 1,
      rollbackStatus: "passed",
      rollbackDeletedCount: 1,
      reasonCodes: ["memory_alpha_disabled"]
    });
    expect(afterRollback).toMatchObject({
      status: "ok",
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      queryDimensions: 1024,
      matches: []
    });
    expect(await repository.listMessages()).toHaveLength(1);

    await repository.close();
  });

  it("stops new provider-vector retention at the bounded alpha limit", async () => {
    const repository = createRepository();
    const provider = new FakeEmbeddingProvider([1, 0, 0]);
    const alpha = createCoreHostMemoryAlphaImplementation({
      env: approvedEnv(),
      memoryRepository: repository,
      embeddingProvider: provider,
      maxMessages: 1
    });

    await alpha.memoryRepository.initialize();
    await alpha.memoryRepository.appendMessage(message("msg-retained"));
    await alpha.memoryRepository.appendMessage(message("msg-not-retained"));

    expect(alpha.session.getStatus()).toMatchObject({
      state: "active",
      enabled: true,
      maxMessageCount: 1,
      trackedMessageCount: 1
    });
    expect(
      await repository.inspectEmbeddingRecordMetadata({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        sourceType: "message",
        sourceId: "msg-retained"
      })
    ).toMatchObject({
      status: "ok",
      recordCount: 1
    });
    expect(
      await repository.inspectEmbeddingRecordMetadata({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        sourceType: "message",
        sourceId: "msg-not-retained"
      })
    ).toMatchObject({
      status: "ok",
      recordCount: 0
    });

    const disabled = await alpha.session.disable();
    expect(disabled.rollbackDeletedCount).toBe(1);
    expect(disabled.trackedMessageCount).toBe(1);
    expect(disabled.rollbackStatus).toBe("passed");

    await repository.close();
  });

  it("disables reads and writes after operator disable", async () => {
    const repository = createRepository();
    const provider = new FakeEmbeddingProvider([1, 0, 0]);
    const alpha = createCoreHostMemoryAlphaImplementation({
      env: approvedEnv(),
      memoryRepository: repository,
      embeddingProvider: provider
    });

    await alpha.memoryRepository.initialize();
    await alpha.memoryRepository.appendMessage(message("msg-before-disable"));
    const disabled = await alpha.session.disable();
    await alpha.memoryRepository.appendMessage(message("msg-after-disable"));

    expect(alpha.routingOptions?.enabled).toBe(false);
    expect(disabled).toMatchObject({
      state: "disabled",
      rollbackStatus: "passed",
      rollbackDeletedCount: 1
    });
    expect(
      await repository.inspectEmbeddingRecordMetadata({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        sourceType: "message",
        sourceId: "msg-after-disable"
      })
    ).toMatchObject({
      status: "ok",
      recordCount: 0
    });
    expect(await repository.listMessages()).toHaveLength(2);

    await repository.close();
  });

  it("fails closed and reports only sanitized rollback classification", async () => {
    const repository = createRepository();
    const provider = new FakeEmbeddingProvider([1, 0, 0]);
    const alpha = createCoreHostMemoryAlphaImplementation({
      env: approvedEnv(),
      memoryRepository: repository,
      embeddingProvider: provider
    });

    await alpha.memoryRepository.initialize();
    await alpha.memoryRepository.appendMessage(message("msg-rollback"));
    const originalDelete = repository.deleteEmbeddingRecordsForSource.bind(
      repository
    );
    repository.deleteEmbeddingRecordsForSource = async () => ({
      status: "degraded",
      deletedCount: 0,
      reasonCode: "C:\\private\\rollback-diagnostic"
    });

    const disabled = await alpha.session.disable();
    const serialized = JSON.stringify(disabled);

    expect(disabled).toMatchObject({
      state: "degraded",
      enabled: false,
      rollbackStatus: "degraded",
      rollbackDeletedCount: 0,
      reasonCodes: ["provider_vector_rollback_failed"]
    });
    expect(serialized).not.toContain("private");
    expect(serialized).not.toContain("rollback-diagnostic");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);

    repository.deleteEmbeddingRecordsForSource = originalDelete;
    await repository.close();
  });

  it("normalizes an invalid retention limit to the approved bounded default", async () => {
    const repository = createRepository();
    const alpha = createCoreHostMemoryAlphaImplementation({
      env: approvedEnv(),
      memoryRepository: repository,
      embeddingProvider: new FakeEmbeddingProvider(),
      maxMessages: MEMORY_ALPHA_DEFAULT_MAX_MESSAGES + 1
    });

    expect(alpha.session.getStatus().maxMessageCount).toBe(
      MEMORY_ALPHA_DEFAULT_MAX_MESSAGES
    );
    await repository.close();
  });
});

class FakeEmbeddingProvider implements EmbeddingInferenceProvider {
  public calls = 0;

  public constructor(private readonly vector: number[] = [1, 0, 0]) {}

  public async embed(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    this.calls += 1;
    return {
      modelId: request.modelId,
      dimensions: this.vector.length,
      vectors: [
        {
          inputId: request.inputs[0]?.id,
          values: [...this.vector]
        }
      ],
      generatedAt: "2026-08-05T00:00:00.000Z"
    };
  }
}

function approvedEnv(): Record<string, string> {
  return {
    [MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV]: "1",
    [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
    [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
    [MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]: "1",
    [MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV]: "1",
    [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
    [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
    [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "approved-python",
    [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
  };
}

function message(id: string, text = "Remember this."): Message {
  return {
    id,
    conversationId: "primary",
    role: "user",
    text,
    createdAt: "2026-08-05T00:00:00.000Z"
  };
}

function createRepository(): SqliteMemoryRepository {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "jarvis-k-memory-alpha-")
  );
  temporaryDirectories.push(directory);
  return new SqliteMemoryRepository({
    filePath: path.join(directory, "memory.sqlite"),
    allowedEmbeddingModelIds: [LOCAL_EMBEDDING_MODEL_ID]
  });
}

function deterministicVector(dimensions: number): number[] {
  return Array.from({ length: dimensions }, (_, index) =>
    index === 0 ? 1 : (index % 17) / 17
  );
}
