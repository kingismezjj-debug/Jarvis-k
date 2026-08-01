import { describe, expect, it } from "vitest";
import {
  createEmbeddingMemoryRetrievalPreflightPolicy,
  evaluateEmbeddingMemoryRetrievalPreflight
} from "../src";

const approvedInput = {
  portContractReviewed: true,
  providerNeutralPortOnly: true,
  memorySchemaMigrationApproved: false,
  memoryIndexMigrationApproved: false,
  sqliteRepositoryChanged: false,
  coreCompositionChanged: false,
  embeddingProviderComposed: false,
  retrievalExecutionEnabled: false,
  vectorWritesEnabled: false,
  rawTextExposed: false,
  vectorValuesExposed: false,
  sensitiveValuesExposed: false,
  fixtureExecutorAvailable: true,
  verificationClean: true
};

describe("embedding memory retrieval preflight", () => {
  it("defines a provider-neutral, migration-gated policy", () => {
    const policy = createEmbeddingMemoryRetrievalPreflightPolicy();

    expect(policy).toMatchObject({
      portContractReviewed: true,
      providerNeutralPortOnly: true,
      schemaMigrationRequiredBeforeProduction: true,
      indexMigrationRequiredBeforeProduction: true,
      sqliteRepositoryChangeAllowed: false,
      coreCompositionChangeAllowed: false,
      embeddingProviderCompositionAllowed: false,
      retrievalExecutionEnabled: false,
      vectorWritesEnabled: false,
      rawTextExposed: false,
      vectorValuesExposed: false,
      sensitiveValuesExposed: false,
      fixtureExecutorAllowed: true
    });
    expect(JSON.stringify(policy)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(policy)).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks the retrieval contract by default", () => {
    const result = evaluateEmbeddingMemoryRetrievalPreflight();

    expect(result).toMatchObject({
      capability: "embedding_memory_retrieval",
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      schemaMigrationApproved: false,
      indexMigrationApproved: false,
      retrievalExecutionEnabled: false,
      vectorWritesEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Embedding memory retrieval port contract is not reviewed.",
        "Memory schema migration is deferred until explicit approval.",
        "Memory vector index migration is deferred until explicit approval.",
        "A deterministic fixture executor is required for contract tests."
      ])
    );
  });

  it("accepts only the fixture contract boundary while keeping production disabled", () => {
    const result = evaluateEmbeddingMemoryRetrievalPreflight(approvedInput);

    expect(result).toMatchObject({
      capability: "embedding_memory_retrieval",
      status: "ready_for_fixture_contract",
      accepted: true,
      readyForFixtureContract: true,
      schemaMigrationApproved: false,
      indexMigrationApproved: false,
      sqliteRepositoryChanged: false,
      coreCompositionChanged: false,
      embeddingProviderComposed: false,
      retrievalExecutionEnabled: false,
      vectorWritesEnabled: false,
      rawTextExposed: false,
      vectorValuesExposed: false,
      sensitiveValuesExposed: false,
      checks: {
        portContractReviewed: true,
        providerNeutralPortOnly: true,
        schemaMigrationDeferred: true,
        indexMigrationDeferred: true,
        sqliteRepositoryUnchanged: true,
        coreCompositionUnchanged: true,
        embeddingProviderCompositionDeferred: true,
        retrievalExecutionDisabled: true,
        vectorWritesDisabled: true,
        rawTextExposureDisabled: true,
        vectorValuesExposureDisabled: true,
        sensitiveValuesExposureDisabled: true,
        fixtureExecutorAvailable: true,
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks schema, execution, exposure, and composition regressions", () => {
    const result = evaluateEmbeddingMemoryRetrievalPreflight({
      ...approvedInput,
      memorySchemaMigrationApproved: true,
      memoryIndexMigrationApproved: true,
      sqliteRepositoryChanged: true,
      coreCompositionChanged: true,
      embeddingProviderComposed: true,
      retrievalExecutionEnabled: true,
      vectorWritesEnabled: true,
      rawTextExposed: true,
      vectorValuesExposed: true,
      sensitiveValuesExposed: true,
      fixtureExecutorAvailable: false,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      schemaMigrationApproved: false,
      indexMigrationApproved: false,
      sqliteRepositoryChanged: false,
      coreCompositionChanged: false,
      embeddingProviderComposed: false,
      retrievalExecutionEnabled: false,
      vectorWritesEnabled: false,
      rawTextExposed: false,
      vectorValuesExposed: false,
      sensitiveValuesExposed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Memory schema migration is deferred until explicit approval.",
        "Memory vector index migration is deferred until explicit approval.",
        "SQLite memory repository changes are deferred in this wave.",
        "Core composition changes are deferred in this wave.",
        "Real embedding provider composition remains deferred.",
        "Embedding memory retrieval execution remains disabled.",
        "Embedding vector writes remain disabled.",
        "Raw memory text is not exposed by the retrieval contract.",
        "Embedding vector values are not exposed by retrieval results.",
        "Sensitive values must remain absent from retrieval observations.",
        "A deterministic fixture executor is required for contract tests.",
        "Verification gates are not clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks a degraded contract review without enabling retrieval", () => {
    const result = evaluateEmbeddingMemoryRetrievalPreflight({
      ...approvedInput,
      portContractReviewed: false,
      providerNeutralPortOnly: false,
      fixtureExecutorAvailable: false
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      retrievalExecutionEnabled: false,
      vectorWritesEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Embedding memory retrieval port contract is not reviewed.",
        "Embedding memory retrieval must remain provider-neutral.",
        "A deterministic fixture executor is required for contract tests."
      ])
    );
  });
});
