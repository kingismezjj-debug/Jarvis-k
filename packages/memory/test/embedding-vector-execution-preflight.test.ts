import { describe, expect, it } from "vitest";
import {
  createEmbeddingMemoryVectorSchemaProposal,
  evaluateEmbeddingMemoryVectorExecutionPreflight,
  evaluateEmbeddingMemoryVectorFixtureSafety,
  validateEmbeddingMemoryVectorQueryInput,
  validateEmbeddingMemoryVectorWriteInput,
  type EmbeddingMemoryVectorStorePort
} from "../src";

const approvedInput = {
  productApprovalGranted: true,
  securityApprovalGranted: true,
  schemaProposalReviewed: true,
  rollbackPlanReviewed: true,
  providerNeutralPortsReviewed: true,
  fixtureSafetyTestsPresent: true,
  memorySchemaMigrationApproved: false,
  memoryIndexMigrationApproved: false,
  sqliteRepositoryChanged: false,
  coreDefaultRetrievalChanged: false,
  uiDefaultBehaviorChanged: false,
  realVectorWritesEnabled: false,
  phase743VectorsPersisted: false,
  rawVectorsExposed: false,
  privatePathsExposed: false,
  rawDiagnosticsExposed: false,
  modelOutputShellExecutionEnabled: false,
  verificationClean: true
};

describe("embedding memory vector execution preflight", () => {
  it("creates a schema and rollback proposal without executing a migration", () => {
    const proposal = createEmbeddingMemoryVectorSchemaProposal();
    const serialized = JSON.stringify(proposal);

    expect(proposal).toMatchObject({
      phase: "8.3",
      status: "proposal_only",
      migrationExecuted: false,
      sqliteRepositoryChanged: false,
      vectorWritesEnabled: false,
      rawVectorPersistenceApproved: false,
      safetyConstraints: {
        providerNeutralPortOnly: true,
        coreDefaultRetrievalUnchanged: true,
        uiDefaultBehaviorUnchanged: true,
        phase743VectorsPersisted: false,
        rawVectorsExposed: false,
        privatePathsExposed: false,
        rawDiagnosticsExposed: false
      }
    });
    expect(proposal.tables).toEqual([
      expect.objectContaining({
        name: "memory_embeddings",
        columns: expect.arrayContaining([
          "id",
          "conversation_id",
          "source_type",
          "source_id",
          "model_id",
          "dimensions",
          "vector_payload",
          "created_at"
        ])
      })
    ]);
    expect(proposal.rollbackPlan).toEqual(
      expect.arrayContaining([
        "Stop vector writes before rollback.",
        "Leave messages, conversations, summaries, and active conversation state unchanged."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("accepts only the migration-approval handoff boundary", () => {
    const result = evaluateEmbeddingMemoryVectorExecutionPreflight(approvedInput);

    expect(result).toMatchObject({
      phase: "8.3",
      capability: "embedding_memory_vector_execution",
      status: "ready_for_migration_approval",
      accepted: true,
      readyForMigrationApproval: true,
      migrationExecuted: false,
      indexMigrationExecuted: false,
      sqliteRepositoryChanged: false,
      coreDefaultRetrievalChanged: false,
      uiDefaultBehaviorChanged: false,
      realVectorWritesEnabled: false,
      phase743VectorsPersisted: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks migrations, real vectors, default behavior changes, and unsafe exposure", () => {
    const result = evaluateEmbeddingMemoryVectorExecutionPreflight({
      ...approvedInput,
      memorySchemaMigrationApproved: true,
      memoryIndexMigrationApproved: true,
      sqliteRepositoryChanged: true,
      coreDefaultRetrievalChanged: true,
      uiDefaultBehaviorChanged: true,
      realVectorWritesEnabled: true,
      phase743VectorsPersisted: true,
      rawVectorsExposed: true,
      privatePathsExposed: true,
      rawDiagnosticsExposed: true,
      modelOutputShellExecutionEnabled: true,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForMigrationApproval: false,
      migrationExecuted: false,
      indexMigrationExecuted: false,
      sqliteRepositoryChanged: false,
      coreDefaultRetrievalChanged: false,
      uiDefaultBehaviorChanged: false,
      realVectorWritesEnabled: false,
      phase743VectorsPersisted: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "SQLite schema migration is deferred until separate approval.",
        "SQLite vector index migration is deferred until separate approval.",
        "SQLite repository changes are blocked in Phase 8.3.",
        "Core default retrieval behavior must remain unchanged.",
        "UI default behavior must remain unchanged.",
        "Real vector writes remain disabled.",
        "Phase 7.43 runtime vectors must not be persisted.",
        "Raw vector exposure is blocked.",
        "Private path exposure is blocked.",
        "Raw diagnostic exposure is blocked.",
        "Retrieval output must not become shell execution.",
        "Verification gates must be clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("defines provider-neutral vector write and query input validation without persistence", async () => {
    const port: EmbeddingMemoryVectorStorePort = {
      writeEmbeddingRecord: async (record) => ({
        status: "degraded",
        recordId: validateEmbeddingMemoryVectorWriteInput(record).id,
        reasonCode: "VECTOR_WRITES_DISABLED"
      }),
      querySimilar: async (query) => ({
        status: "degraded",
        modelId: validateEmbeddingMemoryVectorQueryInput(query).modelId,
        queryDimensions:
          validateEmbeddingMemoryVectorQueryInput(query).vector.length,
        matches: [],
        reasonCode: "MIGRATION_NOT_APPROVED",
        generatedAt: "2026-08-03T00:00:00.000Z"
      })
    };

    await expect(
      port.writeEmbeddingRecord({
        id: "memory-vector-1",
        conversationId: "primary",
        sourceType: "message",
        sourceId: "message-1",
        modelId: "fixture/embedding",
        dimensions: 2,
        vector: [1, 0],
        createdAt: "2026-08-03T00:00:00.000Z"
      })
    ).resolves.toEqual({
      status: "degraded",
      recordId: "memory-vector-1",
      reasonCode: "VECTOR_WRITES_DISABLED"
    });
    await expect(
      port.querySimilar({
        modelId: "fixture/embedding",
        vector: [1, 0],
        limit: 3
      })
    ).resolves.toMatchObject({
      status: "degraded",
      matches: [],
      reasonCode: "MIGRATION_NOT_APPROVED"
    });
    expect(() =>
      validateEmbeddingMemoryVectorWriteInput({
        id: "bad-vector",
        conversationId: "primary",
        sourceType: "message",
        sourceId: "message-1",
        modelId: "fixture/embedding",
        dimensions: 3,
        vector: [1, 0],
        createdAt: "2026-08-03T00:00:00.000Z"
      })
    ).toThrow();
  });

  it("evaluates fixture-only retrieval safety without exposing raw vectors or text", () => {
    const report = evaluateEmbeddingMemoryVectorFixtureSafety([
      {
        id: "fixture-query-ok",
        writeAttempted: false,
        queryAttempted: true,
        result: {
          status: "ok",
          modelId: "fixture/embedding",
          queryDimensions: 2,
          matches: [
            {
              id: "memory-1",
              conversationId: "primary",
              sourceType: "message",
              sourceId: "message-1",
              modelId: "fixture/embedding",
              score: 1,
              createdAt: "2026-08-03T00:00:00.000Z"
            }
          ],
          generatedAt: "2026-08-03T00:00:01.000Z"
        }
      }
    ]);
    const serialized = JSON.stringify(report);

    expect(report).toEqual({
      phase: "8.3",
      status: "fixture_only",
      fixtureOnly: true,
      migrationExecuted: false,
      realVectorWritesEnabled: false,
      phase743VectorsPersisted: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      observationCount: 1,
      writeAttemptCount: 0,
      queryAttemptCount: 1,
      degradedResultCount: 0,
      reasonCodes: []
    });
    expect(serialized).not.toContain("Jarvis-K");
    expect(serialized).not.toContain("0.123");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b(api[_-]?key|signed[_-]?url|secret)\b/iu);
  });

  it("reports degraded fixture results and blocks unsafe observations", () => {
    const degraded = evaluateEmbeddingMemoryVectorFixtureSafety([
      {
        id: "fixture-query-degraded",
        writeAttempted: false,
        queryAttempted: true,
        result: {
          status: "degraded",
          modelId: "fixture/embedding",
          queryDimensions: 2,
          matches: [],
          reasonCode: "NO_MATCHES",
          generatedAt: "2026-08-03T00:00:00.000Z"
        }
      }
    ]);
    const blocked = evaluateEmbeddingMemoryVectorFixtureSafety([
      {
        id: "fixture-unsafe",
        writeAttempted: true,
        queryAttempted: true,
        result: {
          status: "degraded",
          modelId: "fixture/embedding",
          queryDimensions: 2,
          matches: [],
          reasonCode: "NO_MATCHES",
          generatedAt: "2026-08-03T00:00:00.000Z"
        },
        rawVectorObserved: true,
        rawTextObserved: true,
        privatePathObserved: true,
        rawDiagnosticsObserved: true,
        phase743VectorObserved: true,
        shellExecutionObserved: true
      }
    ]);

    expect(degraded).toMatchObject({
      status: "degraded",
      degradedResultCount: 1,
      reasonCodes: []
    });
    expect(blocked).toMatchObject({
      status: "blocked",
      realVectorWritesEnabled: false,
      phase743VectorsPersisted: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: [
        "PHASE_7_43_VECTOR_OBSERVED",
        "PRIVATE_PATH_OBSERVED",
        "RAW_DIAGNOSTICS_OBSERVED",
        "RAW_TEXT_OBSERVED",
        "RAW_VECTOR_OBSERVED",
        "SHELL_EXECUTION_OBSERVED",
        "VECTOR_WRITE_ATTEMPTED"
      ]
    });
  });
});
