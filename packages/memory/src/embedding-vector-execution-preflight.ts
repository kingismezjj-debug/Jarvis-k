import { z } from "zod";
import {
  EmbeddingMemoryQuerySchema,
  EmbeddingMemoryRecordSchema,
  EmbeddingMemoryRetrievalResultSchema,
  type EmbeddingMemoryQuery,
  type EmbeddingMemoryRecord,
  type EmbeddingMemoryRetrievalResult
} from "./embedding-retrieval";

export interface EmbeddingMemoryVectorWriteResult {
  status: "accepted" | "degraded";
  recordId?: string;
  reasonCode?: string;
}

export interface EmbeddingMemoryVectorStorePort {
  writeEmbeddingRecord(
    record: EmbeddingMemoryRecord
  ): Promise<EmbeddingMemoryVectorWriteResult>;
  querySimilar(
    query: EmbeddingMemoryQuery
  ): Promise<EmbeddingMemoryRetrievalResult>;
}

export interface EmbeddingMemoryVectorSchemaProposal {
  phase: "8.3";
  status: "proposal_only";
  migrationExecuted: false;
  sqliteRepositoryChanged: false;
  vectorWritesEnabled: false;
  rawVectorPersistenceApproved: false;
  tables: readonly {
    name: "memory_embeddings";
    purpose: string;
    columns: readonly string[];
  }[];
  indexes: readonly {
    name: string;
    purpose: string;
    columns: readonly string[];
  }[];
  rollbackPlan: readonly string[];
  safetyConstraints: {
    providerNeutralPortOnly: true;
    coreDefaultRetrievalUnchanged: true;
    uiDefaultBehaviorUnchanged: true;
    phase743VectorsPersisted: false;
    rawVectorsExposed: false;
    privatePathsExposed: false;
    rawDiagnosticsExposed: false;
  };
}

export type EmbeddingMemoryVectorExecutionPreflightStatus =
  | "blocked"
  | "ready_for_migration_approval";

export interface EmbeddingMemoryVectorExecutionPreflightInput {
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  schemaProposalReviewed?: boolean;
  rollbackPlanReviewed?: boolean;
  providerNeutralPortsReviewed?: boolean;
  fixtureSafetyTestsPresent?: boolean;
  memorySchemaMigrationApproved?: boolean;
  memoryIndexMigrationApproved?: boolean;
  sqliteRepositoryChanged?: boolean;
  coreDefaultRetrievalChanged?: boolean;
  uiDefaultBehaviorChanged?: boolean;
  realVectorWritesEnabled?: boolean;
  phase743VectorsPersisted?: boolean;
  rawVectorsExposed?: boolean;
  privatePathsExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface EmbeddingMemoryVectorExecutionPreflightResult {
  phase: "8.3";
  capability: "embedding_memory_vector_execution";
  status: EmbeddingMemoryVectorExecutionPreflightStatus;
  accepted: boolean;
  readyForMigrationApproval: boolean;
  migrationExecuted: false;
  indexMigrationExecuted: false;
  sqliteRepositoryChanged: false;
  coreDefaultRetrievalChanged: false;
  uiDefaultBehaviorChanged: false;
  realVectorWritesEnabled: false;
  phase743VectorsPersisted: false;
  rawVectorsExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  checks: {
    productApprovalGranted: boolean;
    securityApprovalGranted: boolean;
    schemaProposalReviewed: boolean;
    rollbackPlanReviewed: boolean;
    providerNeutralPortsReviewed: boolean;
    fixtureSafetyTestsPresent: boolean;
    schemaMigrationDeferred: boolean;
    indexMigrationDeferred: boolean;
    sqliteRepositoryUnchanged: boolean;
    coreDefaultRetrievalUnchanged: boolean;
    uiDefaultBehaviorUnchanged: boolean;
    realVectorWritesDisabled: boolean;
    phase743VectorsNotPersisted: boolean;
    rawVectorExposureDisabled: boolean;
    privatePathExposureDisabled: boolean;
    rawDiagnosticsExposureDisabled: boolean;
    modelOutputShellExecutionDisabled: boolean;
    verificationClean: boolean;
  };
  reasons: string[];
}

export interface EmbeddingMemoryVectorFixtureSafetyObservation {
  id: string;
  writeAttempted: boolean;
  queryAttempted: boolean;
  result: EmbeddingMemoryRetrievalResult;
  rawVectorObserved?: boolean;
  rawTextObserved?: boolean;
  privatePathObserved?: boolean;
  rawDiagnosticsObserved?: boolean;
  phase743VectorObserved?: boolean;
  shellExecutionObserved?: boolean;
}

export interface EmbeddingMemoryVectorFixtureSafetyReport {
  phase: "8.3";
  status: "fixture_only" | "blocked" | "degraded";
  fixtureOnly: true;
  migrationExecuted: false;
  realVectorWritesEnabled: false;
  phase743VectorsPersisted: false;
  rawVectorsExposed: false;
  rawTextExposed: false;
  privatePathsExposed: false;
  rawDiagnosticsExposed: false;
  modelOutputShellExecutionEnabled: false;
  observationCount: number;
  writeAttemptCount: number;
  queryAttemptCount: number;
  degradedResultCount: number;
  reasonCodes: string[];
}

const FixtureSafetyObservationSchema = z
  .object({
    id: z.string().min(1).max(128),
    writeAttempted: z.boolean(),
    queryAttempted: z.boolean(),
    result: EmbeddingMemoryRetrievalResultSchema,
    rawVectorObserved: z.boolean().optional(),
    rawTextObserved: z.boolean().optional(),
    privatePathObserved: z.boolean().optional(),
    rawDiagnosticsObserved: z.boolean().optional(),
    phase743VectorObserved: z.boolean().optional(),
    shellExecutionObserved: z.boolean().optional()
  })
  .strict();

const FixtureSafetyObservationArraySchema = z
  .array(FixtureSafetyObservationSchema)
  .min(1)
  .max(100);

type ParsedFixtureSafetyObservation = z.infer<
  typeof FixtureSafetyObservationSchema
>;

export function createEmbeddingMemoryVectorSchemaProposal(): EmbeddingMemoryVectorSchemaProposal {
  return {
    phase: "8.3",
    status: "proposal_only",
    migrationExecuted: false,
    sqliteRepositoryChanged: false,
    vectorWritesEnabled: false,
    rawVectorPersistenceApproved: false,
    tables: [
      {
        name: "memory_embeddings",
        purpose:
          "Stores one embedding reference per message or summary after a later approved migration.",
        columns: [
          "id",
          "conversation_id",
          "source_type",
          "source_id",
          "model_id",
          "dimensions",
          "vector_payload",
          "created_at"
        ]
      }
    ],
    indexes: [
      {
        name: "idx_memory_embeddings_model_conversation",
        purpose:
          "Bounds retrieval candidate scans by model and optional conversation.",
        columns: ["model_id", "conversation_id", "created_at"]
      },
      {
        name: "idx_memory_embeddings_source",
        purpose:
          "Prevents duplicate embeddings for a source under the same model.",
        columns: ["model_id", "source_type", "source_id"]
      }
    ],
    rollbackPlan: [
      "Stop vector writes before rollback.",
      "Drop vector indexes before dropping the proposed vector table.",
      "Leave messages, conversations, summaries, and active conversation state unchanged.",
      "Run memory health and export/import regression checks after rollback."
    ],
    safetyConstraints: {
      providerNeutralPortOnly: true,
      coreDefaultRetrievalUnchanged: true,
      uiDefaultBehaviorUnchanged: true,
      phase743VectorsPersisted: false,
      rawVectorsExposed: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false
    }
  };
}

export function evaluateEmbeddingMemoryVectorExecutionPreflight(
  input: EmbeddingMemoryVectorExecutionPreflightInput = {}
): EmbeddingMemoryVectorExecutionPreflightResult {
  const checks = {
    productApprovalGranted: input.productApprovalGranted === true,
    securityApprovalGranted: input.securityApprovalGranted === true,
    schemaProposalReviewed: input.schemaProposalReviewed === true,
    rollbackPlanReviewed: input.rollbackPlanReviewed === true,
    providerNeutralPortsReviewed: input.providerNeutralPortsReviewed === true,
    fixtureSafetyTestsPresent: input.fixtureSafetyTestsPresent === true,
    schemaMigrationDeferred: input.memorySchemaMigrationApproved === false,
    indexMigrationDeferred: input.memoryIndexMigrationApproved === false,
    sqliteRepositoryUnchanged: input.sqliteRepositoryChanged === false,
    coreDefaultRetrievalUnchanged:
      input.coreDefaultRetrievalChanged === false,
    uiDefaultBehaviorUnchanged:
      input.uiDefaultBehaviorChanged === false,
    realVectorWritesDisabled: input.realVectorWritesEnabled === false,
    phase743VectorsNotPersisted: input.phase743VectorsPersisted === false,
    rawVectorExposureDisabled: input.rawVectorsExposed === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    modelOutputShellExecutionDisabled:
      input.modelOutputShellExecutionEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    phase: "8.3",
    capability: "embedding_memory_vector_execution",
    status: accepted ? "ready_for_migration_approval" : "blocked",
    accepted,
    readyForMigrationApproval: accepted,
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
    modelOutputShellExecutionEnabled: false,
    checks,
    reasons: createPreflightReasons(checks)
  };
}

export function validateEmbeddingMemoryVectorWriteInput(
  record: unknown
): EmbeddingMemoryRecord {
  return EmbeddingMemoryRecordSchema.parse(record);
}

export function validateEmbeddingMemoryVectorQueryInput(
  query: unknown
): EmbeddingMemoryQuery {
  return EmbeddingMemoryQuerySchema.parse(query);
}

export function evaluateEmbeddingMemoryVectorFixtureSafety(
  observations: unknown[]
): EmbeddingMemoryVectorFixtureSafetyReport {
  const parsed = FixtureSafetyObservationArraySchema.parse(observations);
  const unsafeReasons = createFixtureUnsafeReasons(parsed);
  const degradedResultCount = parsed.filter(
    (observation) => observation.result.status === "degraded"
  ).length;
  const writeAttemptCount = parsed.filter(
    (observation) => observation.writeAttempted
  ).length;
  const queryAttemptCount = parsed.filter(
    (observation) => observation.queryAttempted
  ).length;

  return {
    phase: "8.3",
    status:
      unsafeReasons.length > 0
        ? "blocked"
        : degradedResultCount > 0
          ? "degraded"
          : "fixture_only",
    fixtureOnly: true,
    migrationExecuted: false,
    realVectorWritesEnabled: false,
    phase743VectorsPersisted: false,
    rawVectorsExposed: false,
    rawTextExposed: false,
    privatePathsExposed: false,
    rawDiagnosticsExposed: false,
    modelOutputShellExecutionEnabled: false,
    observationCount: parsed.length,
    writeAttemptCount,
    queryAttemptCount,
    degradedResultCount,
    reasonCodes: unsafeReasons
  };
}

function createPreflightReasons(
  checks: EmbeddingMemoryVectorExecutionPreflightResult["checks"]
): string[] {
  const reasons: string[] = [];

  if (!checks.productApprovalGranted) {
    reasons.push("Product approval is required for Phase 8.3 preflight.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval is required for Phase 8.3 preflight.");
  }
  if (!checks.schemaProposalReviewed) {
    reasons.push("Memory vector schema proposal is not reviewed.");
  }
  if (!checks.rollbackPlanReviewed) {
    reasons.push("Memory vector rollback plan is not reviewed.");
  }
  if (!checks.providerNeutralPortsReviewed) {
    reasons.push("Provider-neutral vector ports are not reviewed.");
  }
  if (!checks.fixtureSafetyTestsPresent) {
    reasons.push("Fixture-only vector execution safety tests are required.");
  }
  if (!checks.schemaMigrationDeferred) {
    reasons.push("SQLite schema migration is deferred until separate approval.");
  }
  if (!checks.indexMigrationDeferred) {
    reasons.push("SQLite vector index migration is deferred until separate approval.");
  }
  if (!checks.sqliteRepositoryUnchanged) {
    reasons.push("SQLite repository changes are blocked in Phase 8.3.");
  }
  if (!checks.coreDefaultRetrievalUnchanged) {
    reasons.push("Core default retrieval behavior must remain unchanged.");
  }
  if (!checks.uiDefaultBehaviorUnchanged) {
    reasons.push("UI default behavior must remain unchanged.");
  }
  if (!checks.realVectorWritesDisabled) {
    reasons.push("Real vector writes remain disabled.");
  }
  if (!checks.phase743VectorsNotPersisted) {
    reasons.push("Phase 7.43 runtime vectors must not be persisted.");
  }
  if (!checks.rawVectorExposureDisabled) {
    reasons.push("Raw vector exposure is blocked.");
  }
  if (!checks.privatePathExposureDisabled) {
    reasons.push("Private path exposure is blocked.");
  }
  if (!checks.rawDiagnosticsExposureDisabled) {
    reasons.push("Raw diagnostic exposure is blocked.");
  }
  if (!checks.modelOutputShellExecutionDisabled) {
    reasons.push("Retrieval output must not become shell execution.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates must be clean.");
  }

  return reasons;
}

function createFixtureUnsafeReasons(
  observations: ParsedFixtureSafetyObservation[]
): string[] {
  const reasons = new Set<string>();

  for (const observation of observations) {
    if (observation.writeAttempted) {
      reasons.add("VECTOR_WRITE_ATTEMPTED");
    }
    if (observation.rawVectorObserved) {
      reasons.add("RAW_VECTOR_OBSERVED");
    }
    if (observation.rawTextObserved) {
      reasons.add("RAW_TEXT_OBSERVED");
    }
    if (observation.privatePathObserved) {
      reasons.add("PRIVATE_PATH_OBSERVED");
    }
    if (observation.rawDiagnosticsObserved) {
      reasons.add("RAW_DIAGNOSTICS_OBSERVED");
    }
    if (observation.phase743VectorObserved) {
      reasons.add("PHASE_7_43_VECTOR_OBSERVED");
    }
    if (observation.shellExecutionObserved) {
      reasons.add("SHELL_EXECUTION_OBSERVED");
    }
  }

  return [...reasons].sort();
}
