import { describe, expect, it } from "vitest";
import {
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE_OPT_IN_ENV,
  runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic
} from "../src/local-embedding-provider-execution-acceptance-diagnostic";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "../src/local-embedding-composition";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "../src/local-embedding-runtime-session-factory";

describe("Core Host local embedding provider execution acceptance diagnostic", () => {
  it("runs the approved product path and reports only sanitized acceptance counts", async () => {
    const calls: string[] = [];
    const report =
      await runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => {
          calls.push("verify");
        },
        executeProductPath: async ({ request, env }) => {
          calls.push("execute");
          expect(request).toMatchObject({
            modelId: "Qwen/Qwen3-Embedding-0.6B",
            inputs: [
              {
                id: "phase-7-43-acceptance"
              }
            ]
          });
          expect(env[LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]).toBe("1");
          expect(env[LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]).toBe("1");
          expect(env.JARVIS_K_MEMORY_DB_PATH).toBe("temp-memory.sqlite");
          expect(env.JARVIS_K_MODEL_DIR).toBe("temp-models");
          return {
            ok: true,
            vectorCount: 1,
            dimensionCount: 1024,
            operationPhase: "completed"
          };
        }
      });
    const serialized = JSON.stringify(report);

    expect(calls).toEqual(["verify", "execute"]);
    expect(report).toMatchObject({
      phase: "7.43",
      mode: "provider_execution_acceptance_diagnostic",
      provider: "embedding.local.qwen3",
      modelId: "Qwen/Qwen3-Embedding-0.6B",
      status: "passed",
      accepted: true,
      productPathCommandCalled: true,
      artifactDigestVerification: "passed",
      productPathEmbedding: "passed",
      cleanupStatus: "passed",
      vectorCount: 1,
      dimensionCount: 1024,
      operationPhase: "completed",
      rawVectorsExposed: false,
      rawInputsExposed: false,
      vectorsRoutedToMemory: false,
      vectorsPersisted: false,
      vectorsLoggedOrExposed: false,
      memorySchemaMigrationEnabled: false,
      providerDefaultOptInChanged: false,
      providerVisibilityChanged: false,
      uiVisibilityChanged: false,
      downloadsEnabled: false,
      persistentCacheWritesEnabled: false,
      rawDiagnosticsExposed: false,
      privatePathExposureEnabled: false,
      signedUrlOrCredentialPersistenceEnabled: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: []
    });
    expect(serialized).not.toContain("0.11");
    expect(serialized).not.toContain("Jarvis-K local embedding provider execution acceptance");
    expect(serialized).not.toContain("approved-model-dir");
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
      await runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic({
        ...approvedInput(),
        productApprovalGranted: false,
        verifyModelArtifacts: async () => {
          calls.push("verify");
        },
        executeProductPath: async () => {
          calls.push("execute");
          return { ok: true, vectorCount: 1, dimensionCount: 2 };
        }
      });
    const missingAcceptanceOptIn =
      await runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic({
        ...approvedInput(),
        env: {
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
          return { ok: true, vectorCount: 1, dimensionCount: 2 };
        }
      });

    expect(missingApproval).toMatchObject({
      status: "degraded",
      productPathCommandCalled: false,
      artifactDigestVerification: "not_run",
      productPathEmbedding: "not_run",
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

  it("degrades with fixed reason codes for missing provider gates, artifact failure, and product command failure", async () => {
    const missingProviderOptIn =
      await runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic({
        ...approvedInput(),
        env: {
          [LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
          [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
        }
      });
    const artifactFailure =
      await runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => {
          throw new Error("C:\\private\\model\\artifact.safetensors");
        }
      });
    const commandFailure =
      await runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic({
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        executeProductPath: async () => ({
          ok: false,
          operationPhase: "failed"
        })
      });

    expect(missingProviderOptIn).toMatchObject({
      status: "degraded",
      reasonCodes: ["provider_opt_in_missing"],
      productPathCommandCalled: false
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
      productPathEmbedding: "failed",
      operationPhase: "failed",
      reasonCodes: ["core_host_command_failed"]
    });
  });

  it("blocks Memory, visibility, cache, diagnostics, and shell side effects", async () => {
    const report =
      await runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic({
        ...approvedInput(),
        vectorsRoutedToMemory: true,
        vectorsPersisted: true,
        vectorsLoggedOrExposed: true,
        memorySchemaMigrationEnabled: true,
        providerDefaultOptInChanged: true,
        providerVisibilityChanged: true,
        uiVisibilityChanged: true,
        downloadsEnabled: true,
        persistentCacheWritesEnabled: true,
        rawDiagnosticsExposed: true,
        privatePathExposureEnabled: true,
        signedUrlOrCredentialPersistenceEnabled: true,
        modelOutputShellExecutionEnabled: true
      });

    expect(report).toMatchObject({
      status: "blocked",
      accepted: false,
      productPathCommandCalled: false,
      vectorsRoutedToMemory: false,
      vectorsPersisted: false,
      vectorsLoggedOrExposed: false,
      memorySchemaMigrationEnabled: false,
      providerDefaultOptInChanged: false,
      providerVisibilityChanged: false,
      uiVisibilityChanged: false,
      downloadsEnabled: false,
      persistentCacheWritesEnabled: false,
      rawDiagnosticsExposed: false,
      privatePathExposureEnabled: false,
      signedUrlOrCredentialPersistenceEnabled: false,
      modelOutputShellExecutionEnabled: false,
      reasonCodes: ["unsafe_side_effect_requested"]
    });
  });
});

function approvedInput() {
  return {
    env: {
      [LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
      [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
    },
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase742ProviderExecutionWiringComplete: true,
    temporaryMemoryDatabasePath: "temp-memory.sqlite",
    temporaryModelDirectoryPath: "temp-models"
  };
}
