import { describe, expect, it } from "vitest";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "../src/core-memory-retrieval-env-wiring-approval-gate";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "../src/local-embedding-composition";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "../src/local-embedding-runtime-session-factory";
import {
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_ACCEPTANCE_ENV,
  runMemoryProviderVectorRetrievalAcceptanceDiagnostic
} from "../src/memory-provider-vector-retrieval-acceptance-diagnostic";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV } from "../src/memory-provider-vector-retrieval-preflight";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "../src/memory-provider-vector-write-approval-gate";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "../src/memory-retrieval-provider-query-vector-approval-gate";

describe("Memory provider vector-retrieval acceptance diagnostic", () => {
  it("runs the approved write-then-read product path and reports only sanitized recall metadata", async () => {
    const calls: string[] = [];
    const report =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        diagnosticWriteMessageText:
          "Jarvis-K provider vector retrieval acceptance private anchor.",
        diagnosticReadMessageText:
          "Jarvis-K provider vector retrieval acceptance private query.",
        verifyModelArtifacts: async () => {
          calls.push("verify");
        },
        executeProductPath: async ({
          writeMessageText,
          readMessageText,
          env
        }) => {
          calls.push("execute");
          expect(writeMessageText).toContain("private anchor");
          expect(readMessageText).toContain("private query");
          expect(env[MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]).toBe("1");
          expect(env[MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]).toBe(
            "1"
          );
          expect(env[MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]).toBe("1");
          expect(env[MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV]).toBe("1");
          expect(env[LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]).toBe("1");
          expect(env[LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]).toBe("1");
          expect(env.JARVIS_K_MEMORY_DB_PATH).toBe("temp-memory.sqlite");
          expect(env.JARVIS_K_MODEL_DIR).toBe("temp-models");
          return {
            ok: true,
            writeOk: true,
            readOk: true,
            recallStatus: "ok",
            recallMode: "provider_vector",
            recallMatchCount: 1,
            queryDimensionCount: 1024
          };
        }
      });
    const serialized = JSON.stringify(report);

    expect(calls).toEqual(["verify", "execute"]);
    expect(report).toMatchObject({
      phase: "8.25",
      mode: "provider_vector_retrieval_acceptance_diagnostic",
      provider: "embedding.local.qwen3",
      modelId: "Qwen/Qwen3-Embedding-0.6B",
      status: "passed",
      accepted: true,
      productPathWriteCommandCalled: true,
      productPathReadCommandCalled: true,
      artifactDigestVerification: "passed",
      productPathWrite: "passed",
      productPathRead: "passed",
      recallStatus: "ok",
      recallMode: "provider_vector",
      recallMatchCount: 1,
      queryDimensionCount: 1024,
      memoryVectorScope: "temporary_db",
      cleanupStatus: "passed",
      rawVectorsReturned: false,
      rawVectorsLoggedOrExposed: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathExposureEnabled: false,
      signedUrlOrCredentialPersistenceEnabled: false,
      downloadsEnabled: false,
      persistentCacheWritesEnabled: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      persistentMemoryVectorDataWritten: false,
      sqliteSchemaMigrationEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      providerDefaultOptInChanged: false,
      historicalBatchIndexingEnabled: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: []
    });
    expect(serialized).not.toContain("private anchor");
    expect(serialized).not.toContain("private query");
    expect(serialized).not.toContain("approved-model-dir");
    expect(serialized).not.toContain("0.25");
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades without artifact access or Core Host spawn when approval or opt-in gates are missing", async () => {
    const calls: string[] = [];
    const missingApproval =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        productApprovalGranted: false,
        verifyModelArtifacts: async () => {
          calls.push("verify");
        },
        executeProductPath: async () => {
          calls.push("execute");
          return { ok: true };
        }
      });
    const missingAcceptanceOptIn =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        env: {
          [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
          [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
          [MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]: "1",
          [MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
          [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
        },
        verifyModelArtifacts: async () => {
          calls.push("verify");
        },
        executeProductPath: async () => {
          calls.push("execute");
          return { ok: true };
        }
      });

    expect(missingApproval).toMatchObject({
      status: "degraded",
      productPathWriteCommandCalled: false,
      productPathReadCommandCalled: false,
      artifactDigestVerification: "not_run",
      productPathWrite: "not_run",
      productPathRead: "not_run",
      cleanupStatus: "not_started",
      reasonCodes: ["acceptance_not_approved"]
    });
    expect(missingAcceptanceOptIn).toMatchObject({
      status: "degraded",
      productPathWriteCommandCalled: false,
      artifactDigestVerification: "not_run",
      reasonCodes: ["acceptance_opt_in_missing"]
    });
    expect(calls).toEqual([]);
  });

  it("degrades with fixed reason codes for missing gates, artifact failure, and write/read failures", async () => {
    const missingReadOptIn =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        env: {
          [MEMORY_PROVIDER_VECTOR_RETRIEVAL_ACCEPTANCE_ENV]: "1",
          [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
          [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
          [MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
          [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
        }
      });
    const artifactFailure =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => {
          throw new Error("C:\\private\\model\\artifact.safetensors");
        }
      });
    const writeFailure =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: false,
          writeOk: false
        })
      });
    const readFailure =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: false,
          writeOk: true,
          readOk: false
        })
      });

    expect(missingReadOptIn).toMatchObject({
      status: "degraded",
      productPathWriteCommandCalled: false,
      reasonCodes: ["provider_vector_read_opt_in_missing"]
    });
    expect(artifactFailure).toMatchObject({
      status: "degraded",
      artifactDigestVerification: "failed",
      productPathWriteCommandCalled: false,
      reasonCodes: ["artifact_verification_failed"]
    });
    expect(JSON.stringify(artifactFailure)).not.toMatch(/[A-Za-z]:\\/u);
    expect(writeFailure).toMatchObject({
      status: "degraded",
      productPathWriteCommandCalled: true,
      productPathReadCommandCalled: false,
      artifactDigestVerification: "passed",
      productPathWrite: "failed",
      productPathRead: "not_run",
      reasonCodes: ["core_host_write_command_failed"]
    });
    expect(readFailure).toMatchObject({
      status: "degraded",
      productPathWriteCommandCalled: true,
      productPathReadCommandCalled: true,
      productPathWrite: "passed",
      productPathRead: "failed",
      reasonCodes: ["core_host_read_command_failed"]
    });
  });

  it("degrades when provider-vector recall metadata is missing, degraded, mismatched, or invalid", async () => {
    const missingRecall =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: true,
          writeOk: true,
          readOk: true
        })
      });
    const degradedRecall =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: true,
          writeOk: true,
          readOk: true,
          recallStatus: "degraded",
          recallMode: "provider_vector",
          recallMatchCount: 0,
          queryDimensionCount: 1024
        })
      });
    const missingMatch =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: true,
          writeOk: true,
          readOk: true,
          recallStatus: "ok",
          recallMode: "provider_vector",
          recallMatchCount: 0,
          queryDimensionCount: 1024
        })
      });
    const invalidDimensions =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: true,
          writeOk: true,
          readOk: true,
          recallStatus: "ok",
          recallMode: "provider_vector",
          recallMatchCount: 1,
          queryDimensionCount: 0
        })
      });

    expect(missingRecall).toMatchObject({
      status: "degraded",
      productPathRead: "passed",
      recallStatus: "unknown",
      reasonCodes: ["memory_recall_missing"]
    });
    expect(degradedRecall).toMatchObject({
      status: "degraded",
      recallStatus: "degraded",
      reasonCodes: ["memory_recall_degraded"]
    });
    expect(missingMatch).toMatchObject({
      status: "degraded",
      recallMatchCount: 0,
      reasonCodes: ["memory_recall_match_missing"]
    });
    expect(invalidDimensions).toMatchObject({
      status: "degraded",
      queryDimensionCount: 0,
      reasonCodes: ["query_dimensions_invalid"]
    });
  });

  it("blocks persistent writes, exposure, visibility, cache, diagnostics, batch indexing, and shell side effects", async () => {
    const report =
      await runMemoryProviderVectorRetrievalAcceptanceDiagnostic({
        ...approvedInput(),
        rawVectorsReturned: true,
        rawVectorsLoggedOrExposed: true,
        rawTextExposed: true,
        rawDiagnosticsExposed: true,
        privatePathExposureEnabled: true,
        signedUrlOrCredentialPersistenceEnabled: true,
        downloadsEnabled: true,
        persistentCacheWritesEnabled: true,
        phase743VectorsPersisted: true,
        realRuntimeVectorsPersisted: true,
        persistentMemoryVectorDataWritten: true,
        sqliteSchemaMigrationEnabled: true,
        desktopIpcChanged: true,
        uiBehaviorChanged: true,
        providerVisibilityChanged: true,
        providerDefaultOptInChanged: true,
        historicalBatchIndexingEnabled: true,
        modelOutputShellExecutionEnabled: true
      });

    expect(report).toMatchObject({
      status: "blocked",
      accepted: false,
      productPathWriteCommandCalled: false,
      productPathReadCommandCalled: false,
      rawVectorsReturned: false,
      rawVectorsLoggedOrExposed: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathExposureEnabled: false,
      signedUrlOrCredentialPersistenceEnabled: false,
      downloadsEnabled: false,
      persistentCacheWritesEnabled: false,
      phase743VectorsPersisted: false,
      realRuntimeVectorsPersisted: false,
      persistentMemoryVectorDataWritten: false,
      sqliteSchemaMigrationEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      providerDefaultOptInChanged: false,
      historicalBatchIndexingEnabled: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: ["unsafe_side_effect_requested"]
    });
  });
});

function approvedInput() {
  return {
    env: {
      [MEMORY_PROVIDER_VECTOR_RETRIEVAL_ACCEPTANCE_ENV]: "1",
      [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
      [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
      [MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]: "1",
      [MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
      [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
    },
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase823ProviderVectorRetrievalRoutingComplete: true,
    temporaryMemoryDatabasePath: "temp-memory.sqlite",
    temporaryModelDirectoryPath: "temp-models"
  };
}
