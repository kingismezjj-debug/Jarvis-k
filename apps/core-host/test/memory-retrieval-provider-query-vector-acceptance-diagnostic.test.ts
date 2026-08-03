import { describe, expect, it } from "vitest";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "../src/local-embedding-composition";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "../src/local-embedding-runtime-session-factory";
import {
  runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic
} from "../src/memory-retrieval-provider-query-vector-acceptance-diagnostic";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV } from "../src/memory-retrieval-provider-query-vector-acceptance-preflight";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "../src/memory-retrieval-provider-query-vector-approval-gate";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "../src/core-memory-retrieval-env-wiring-approval-gate";

describe("Memory retrieval provider query-vector acceptance diagnostic", () => {
  it("runs the approved product path and reports only sanitized recall metadata", async () => {
    const calls: string[] = [];
    const report =
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
        ...approvedInput(),
        diagnosticMessageText:
          "Jarvis-K provider query vector acceptance should stay private.",
        verifyModelArtifacts: async () => {
          calls.push("verify");
        },
        executeProductPath: async ({ messageText, env }) => {
          calls.push("execute");
          expect(messageText).toContain("should stay private");
          expect(env[MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]).toBe("1");
          expect(env[MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]).toBe(
            "1"
          );
          expect(env[LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]).toBe("1");
          expect(env[LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]).toBe("1");
          expect(env.JARVIS_K_MEMORY_DB_PATH).toBe("temp-memory.sqlite");
          expect(env.JARVIS_K_MODEL_DIR).toBe("temp-models");
          return {
            ok: true,
            recallStatus: "ok",
            recallMode: "fixture_only",
            recallMatchCount: 0,
            queryDimensionCount: 1024
          };
        }
      });
    const serialized = JSON.stringify(report);

    expect(calls).toEqual(["verify", "execute"]);
    expect(report).toMatchObject({
      phase: "8.18",
      mode: "provider_query_vector_acceptance_diagnostic",
      status: "passed",
      accepted: true,
      productPathCommandCalled: true,
      artifactDigestVerification: "passed",
      productPathRecall: "passed",
      cleanupStatus: "passed",
      recallStatus: "ok",
      recallMode: "fixture_only",
      recallMatchCount: 0,
      queryDimensionCount: 1024,
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
      memoryVectorDataWritten: false,
      sqliteSchemaMigrationEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      providerDefaultOptInChanged: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: []
    });
    expect(serialized).not.toContain("should stay private");
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
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
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
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
        ...approvedInput(),
        env: {
          [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
          [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
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
      productPathCommandCalled: false,
      artifactDigestVerification: "not_run",
      productPathRecall: "not_run",
      cleanupStatus: "not_started",
      reasonCodes: ["acceptance_not_approved"]
    });
    expect(missingAcceptanceOptIn).toMatchObject({
      status: "degraded",
      productPathCommandCalled: false,
      artifactDigestVerification: "not_run",
      reasonCodes: ["acceptance_opt_in_missing"]
    });
    expect(calls).toEqual([]);
  });

  it("degrades with fixed reason codes for missing gates, artifact failure, and product command failure", async () => {
    const missingRouting =
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
        ...approvedInput(),
        env: {
          [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV]: "1",
          [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
          [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
        }
      });
    const artifactFailure =
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => {
          throw new Error("C:\\private\\model\\artifact.safetensors");
        }
      });
    const commandFailure =
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: false
        })
      });
    const degradedRecall =
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: true,
          recallStatus: "degraded",
          recallMode: "fixture_only",
          recallMatchCount: 0,
          queryDimensionCount: 0
        })
      });
    const invalidDimensions =
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: true,
          recallStatus: "ok",
          recallMode: "fixture_only",
          recallMatchCount: 0,
          queryDimensionCount: 0
        })
      });

    expect(missingRouting).toMatchObject({
      status: "degraded",
      productPathCommandCalled: false,
      reasonCodes: ["memory_retrieval_routing_opt_in_missing"]
    });
    expect(artifactFailure).toMatchObject({
      status: "degraded",
      artifactDigestVerification: "failed",
      productPathCommandCalled: false,
      reasonCodes: ["artifact_verification_failed"]
    });
    expect(JSON.stringify(artifactFailure)).not.toMatch(/[A-Za-z]:\\/u);
    expect(commandFailure).toMatchObject({
      status: "degraded",
      productPathCommandCalled: true,
      artifactDigestVerification: "passed",
      productPathRecall: "failed",
      reasonCodes: ["core_host_command_failed"]
    });
    expect(degradedRecall).toMatchObject({
      status: "degraded",
      productPathRecall: "failed",
      recallStatus: "degraded",
      reasonCodes: ["memory_recall_degraded"]
    });
    expect(invalidDimensions).toMatchObject({
      status: "degraded",
      productPathRecall: "failed",
      queryDimensionCount: 0,
      reasonCodes: ["query_dimensions_invalid"]
    });
  });

  it("marks cleanup failures as degraded without exposing raw diagnostics", async () => {
    const report =
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => {
          throw new Error("core_host_cleanup_failed");
        }
      });

    expect(report).toMatchObject({
      status: "degraded",
      productPathCommandCalled: true,
      productPathRecall: "failed",
      cleanupStatus: "not_started",
      reasonCodes: ["core_host_command_failed"]
    });
    expect(JSON.stringify(report)).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks Memory writes, vector exposure, visibility, cache, diagnostics, and shell side effects", async () => {
    const report =
      await runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic({
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
        memoryVectorDataWritten: true,
        sqliteSchemaMigrationEnabled: true,
        desktopIpcChanged: true,
        uiBehaviorChanged: true,
        providerVisibilityChanged: true,
        providerDefaultOptInChanged: true,
        modelOutputShellExecutionEnabled: true
      });

    expect(report).toMatchObject({
      status: "blocked",
      accepted: false,
      productPathCommandCalled: false,
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
      memoryVectorDataWritten: false,
      sqliteSchemaMigrationEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      providerDefaultOptInChanged: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: ["unsafe_side_effect_requested"]
    });
  });
});

function approvedInput() {
  return {
    env: {
      [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV]: "1",
      [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
      [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
      [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
    },
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase816ProviderBackedQueryVectorComplete: true,
    temporaryMemoryDatabasePath: "temp-memory.sqlite",
    temporaryModelDirectoryPath: "temp-models"
  };
}
