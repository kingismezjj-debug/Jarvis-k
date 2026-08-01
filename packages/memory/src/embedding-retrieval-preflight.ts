export type EmbeddingMemoryRetrievalPreflightStatus =
  | "blocked"
  | "ready_for_fixture_contract";

export interface EmbeddingMemoryRetrievalPreflightPolicy {
  portContractReviewed: true;
  providerNeutralPortOnly: true;
  schemaMigrationRequiredBeforeProduction: true;
  indexMigrationRequiredBeforeProduction: true;
  sqliteRepositoryChangeAllowed: false;
  coreCompositionChangeAllowed: false;
  embeddingProviderCompositionAllowed: false;
  retrievalExecutionEnabled: false;
  vectorWritesEnabled: false;
  rawTextExposed: false;
  vectorValuesExposed: false;
  sensitiveValuesExposed: false;
  fixtureExecutorAllowed: true;
}

export interface EmbeddingMemoryRetrievalPreflightInput {
  portContractReviewed?: boolean;
  providerNeutralPortOnly?: boolean;
  memorySchemaMigrationApproved?: boolean;
  memoryIndexMigrationApproved?: boolean;
  sqliteRepositoryChanged?: boolean;
  coreCompositionChanged?: boolean;
  embeddingProviderComposed?: boolean;
  retrievalExecutionEnabled?: boolean;
  vectorWritesEnabled?: boolean;
  rawTextExposed?: boolean;
  vectorValuesExposed?: boolean;
  sensitiveValuesExposed?: boolean;
  fixtureExecutorAvailable?: boolean;
  verificationClean?: boolean;
}

export interface EmbeddingMemoryRetrievalPreflightChecks {
  portContractReviewed: boolean;
  providerNeutralPortOnly: boolean;
  schemaMigrationDeferred: boolean;
  indexMigrationDeferred: boolean;
  sqliteRepositoryUnchanged: boolean;
  coreCompositionUnchanged: boolean;
  embeddingProviderCompositionDeferred: boolean;
  retrievalExecutionDisabled: boolean;
  vectorWritesDisabled: boolean;
  rawTextExposureDisabled: boolean;
  vectorValuesExposureDisabled: boolean;
  sensitiveValuesExposureDisabled: boolean;
  fixtureExecutorAvailable: boolean;
  verificationClean: boolean;
}

export interface EmbeddingMemoryRetrievalPreflightResult {
  capability: "embedding_memory_retrieval";
  status: EmbeddingMemoryRetrievalPreflightStatus;
  accepted: boolean;
  readyForFixtureContract: boolean;
  schemaMigrationApproved: false;
  indexMigrationApproved: false;
  sqliteRepositoryChanged: false;
  coreCompositionChanged: false;
  embeddingProviderComposed: false;
  retrievalExecutionEnabled: false;
  vectorWritesEnabled: false;
  rawTextExposed: false;
  vectorValuesExposed: false;
  sensitiveValuesExposed: false;
  checks: EmbeddingMemoryRetrievalPreflightChecks;
  reasons: string[];
}

export function createEmbeddingMemoryRetrievalPreflightPolicy(): EmbeddingMemoryRetrievalPreflightPolicy {
  return {
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
  };
}

export function evaluateEmbeddingMemoryRetrievalPreflight(
  input: EmbeddingMemoryRetrievalPreflightInput = {}
): EmbeddingMemoryRetrievalPreflightResult {
  const checks: EmbeddingMemoryRetrievalPreflightChecks = {
    portContractReviewed: input.portContractReviewed === true,
    providerNeutralPortOnly: input.providerNeutralPortOnly === true,
    schemaMigrationDeferred: input.memorySchemaMigrationApproved === false,
    indexMigrationDeferred: input.memoryIndexMigrationApproved === false,
    sqliteRepositoryUnchanged: input.sqliteRepositoryChanged === false,
    coreCompositionUnchanged: input.coreCompositionChanged === false,
    embeddingProviderCompositionDeferred:
      input.embeddingProviderComposed === false,
    retrievalExecutionDisabled: input.retrievalExecutionEnabled === false,
    vectorWritesDisabled: input.vectorWritesEnabled === false,
    rawTextExposureDisabled: input.rawTextExposed === false,
    vectorValuesExposureDisabled: input.vectorValuesExposed === false,
    sensitiveValuesExposureDisabled: input.sensitiveValuesExposed === false,
    fixtureExecutorAvailable: input.fixtureExecutorAvailable === true,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    capability: "embedding_memory_retrieval",
    status: accepted ? "ready_for_fixture_contract" : "blocked",
    accepted,
    readyForFixtureContract: accepted,
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
    checks,
    reasons: createReasons(checks)
  };
}

function createReasons(
  checks: EmbeddingMemoryRetrievalPreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.portContractReviewed) {
    reasons.push("Embedding memory retrieval port contract is not reviewed.");
  }
  if (!checks.providerNeutralPortOnly) {
    reasons.push("Embedding memory retrieval must remain provider-neutral.");
  }
  if (!checks.schemaMigrationDeferred) {
    reasons.push("Memory schema migration is deferred until explicit approval.");
  }
  if (!checks.indexMigrationDeferred) {
    reasons.push("Memory vector index migration is deferred until explicit approval.");
  }
  if (!checks.sqliteRepositoryUnchanged) {
    reasons.push("SQLite memory repository changes are deferred in this wave.");
  }
  if (!checks.coreCompositionUnchanged) {
    reasons.push("Core composition changes are deferred in this wave.");
  }
  if (!checks.embeddingProviderCompositionDeferred) {
    reasons.push("Real embedding provider composition remains deferred.");
  }
  if (!checks.retrievalExecutionDisabled) {
    reasons.push("Embedding memory retrieval execution remains disabled.");
  }
  if (!checks.vectorWritesDisabled) {
    reasons.push("Embedding vector writes remain disabled.");
  }
  if (!checks.rawTextExposureDisabled) {
    reasons.push("Raw memory text is not exposed by the retrieval contract.");
  }
  if (!checks.vectorValuesExposureDisabled) {
    reasons.push("Embedding vector values are not exposed by retrieval results.");
  }
  if (!checks.sensitiveValuesExposureDisabled) {
    reasons.push("Sensitive values must remain absent from retrieval observations.");
  }
  if (!checks.fixtureExecutorAvailable) {
    reasons.push("A deterministic fixture executor is required for contract tests.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
