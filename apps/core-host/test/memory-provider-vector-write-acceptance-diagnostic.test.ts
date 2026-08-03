import { describe, expect, it } from "vitest";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "../src/core-memory-retrieval-env-wiring-approval-gate";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "../src/local-embedding-composition";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "../src/local-embedding-runtime-session-factory";
import {
  MEMORY_PROVIDER_VECTOR_WRITE_ACCEPTANCE_ENV,
  runMemoryProviderVectorWriteAcceptanceDiagnostic
} from "../src/memory-provider-vector-write-acceptance-diagnostic";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "../src/memory-provider-vector-write-approval-gate";

describe("Memory provider vector-write acceptance diagnostic", () => {
  it("runs the approved product path and reports only sanitized write metadata", async () => {
    const calls: string[] = [];
    const report = await runMemoryProviderVectorWriteAcceptanceDiagnostic({
      ...approvedInput(),
      diagnosticMessageText:
        "Jarvis-K provider vector write acceptance private text.",
      verifyModelArtifacts: async () => {
        calls.push("verify");
      },
      executeProductPath: async ({ messageText, env }) => {
        calls.push("execute");
        expect(messageText).toContain("private text");
        expect(env[MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]).toBe("1");
        expect(env[MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]).toBe("1");
        expect(env[LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]).toBe("1");
        expect(env[LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]).toBe("1");
        expect(env.JARVIS_K_MEMORY_DB_PATH).toBe("temp-memory.sqlite");
        expect(env.JARVIS_K_MODEL_DIR).toBe("temp-models");
        return { ok: true, messageId: "msg-accepted" };
      },
      inspectMemoryWrite: async ({ memoryDatabasePath, sourceId }) => {
        calls.push("inspect");
        expect(memoryDatabasePath).toBe("temp-memory.sqlite");
        expect(sourceId).toBe("msg-accepted");
        return {
          status: "ok",
          recordCount: 1,
          dimensionCount: 1024
        };
      }
    });
    const serialized = JSON.stringify(report);

    expect(calls).toEqual(["verify", "execute", "inspect"]);
    expect(report).toMatchObject({
      phase: "8.21",
      mode: "provider_vector_write_acceptance_diagnostic",
      provider: "embedding.local.qwen3",
      modelId: "Qwen/Qwen3-Embedding-0.6B",
      status: "passed",
      accepted: true,
      productPathCommandCalled: true,
      artifactDigestVerification: "passed",
      productPathMessage: "passed",
      writeStatus: "accepted",
      memoryVectorWriteScope: "temporary_db",
      cleanupStatus: "passed",
      recordCount: 1,
      dimensionCount: 1024,
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
    expect(serialized).not.toContain("private text");
    expect(serialized).not.toContain("approved-model-dir");
    expect(serialized).not.toContain("msg-accepted");
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
      await runMemoryProviderVectorWriteAcceptanceDiagnostic({
        ...approvedInput(),
        productApprovalGranted: false,
        verifyModelArtifacts: async () => {
          calls.push("verify");
        },
        executeProductPath: async () => {
          calls.push("execute");
          return { ok: true, messageId: "msg-accepted" };
        },
        inspectMemoryWrite: async () => {
          calls.push("inspect");
          return { status: "ok", recordCount: 1, dimensionCount: 2 };
        }
      });
    const missingAcceptanceOptIn =
      await runMemoryProviderVectorWriteAcceptanceDiagnostic({
        ...approvedInput(),
        env: {
          [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
          [MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]: "1",
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
          return { ok: true, messageId: "msg-accepted" };
        },
        inspectMemoryWrite: async () => {
          calls.push("inspect");
          return { status: "ok", recordCount: 1, dimensionCount: 2 };
        }
      });

    expect(missingApproval).toMatchObject({
      status: "degraded",
      productPathCommandCalled: false,
      artifactDigestVerification: "not_run",
      productPathMessage: "not_run",
      writeStatus: "not_run",
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

  it("degrades with fixed reason codes for missing gates and artifact or command failures", async () => {
    const missingWriteOptIn =
      await runMemoryProviderVectorWriteAcceptanceDiagnostic({
        ...approvedInput(),
        env: {
          [MEMORY_PROVIDER_VECTOR_WRITE_ACCEPTANCE_ENV]: "1",
          [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
          [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
        }
      });
    const artifactFailure =
      await runMemoryProviderVectorWriteAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => {
          throw new Error("C:\\private\\model\\artifact.safetensors");
        }
      });
    const commandFailure =
      await runMemoryProviderVectorWriteAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({ ok: false })
      });

    expect(missingWriteOptIn).toMatchObject({
      status: "degraded",
      productPathCommandCalled: false,
      reasonCodes: ["provider_vector_write_opt_in_missing"]
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
      productPathMessage: "failed",
      reasonCodes: ["core_host_command_failed"]
    });
  });

  it("degrades when the temporary Memory metadata is missing or invalid", async () => {
    const missingWrite =
      await runMemoryProviderVectorWriteAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({ ok: true, messageId: "msg-1" }),
        inspectMemoryWrite: async () => ({
          status: "ok",
          recordCount: 0,
          dimensionCount: 0
        })
      });
    const invalidDimensions =
      await runMemoryProviderVectorWriteAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({ ok: true, messageId: "msg-1" }),
        inspectMemoryWrite: async () => ({
          status: "ok",
          recordCount: 1,
          dimensionCount: 0
        })
      });
    const degradedInspection =
      await runMemoryProviderVectorWriteAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({ ok: true, messageId: "msg-1" }),
        inspectMemoryWrite: async () => ({
          status: "degraded",
          recordCount: 0,
          dimensionCount: 0,
          reasonCode: "VECTOR_METADATA_QUERY_FAILED"
        })
      });

    expect(missingWrite).toMatchObject({
      status: "degraded",
      productPathMessage: "passed",
      writeStatus: "missing",
      reasonCodes: ["vector_write_missing"]
    });
    expect(invalidDimensions).toMatchObject({
      status: "degraded",
      writeStatus: "degraded",
      reasonCodes: ["vector_dimensions_invalid"]
    });
    expect(degradedInspection).toMatchObject({
      status: "degraded",
      writeStatus: "degraded",
      reasonCodes: ["vector_write_degraded"]
    });
  });

  it("blocks persistent writes, exposure, visibility, cache, diagnostics, batch indexing, and shell side effects", async () => {
    const report = await runMemoryProviderVectorWriteAcceptanceDiagnostic({
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
      [MEMORY_PROVIDER_VECTOR_WRITE_ACCEPTANCE_ENV]: "1",
      [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
      [MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
      [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
    },
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase820ProviderVectorWriteComplete: true,
    temporaryMemoryDatabasePath: "temp-memory.sqlite",
    temporaryModelDirectoryPath: "temp-models"
  };
}
