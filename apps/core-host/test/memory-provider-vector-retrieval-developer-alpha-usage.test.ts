import { describe, expect, it } from "vitest";
import {
  MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_USAGE_MAX_MESSAGES,
  runMemoryProviderVectorDeveloperAlphaUsage,
  type MemoryProviderVectorDeveloperAlphaUsageInput
} from "../src/memory-provider-vector-retrieval-developer-alpha-usage";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV } from "../src/memory-provider-vector-retrieval-developer-alpha-plan";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "../src/core-memory-retrieval-env-wiring-approval-gate";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "../src/memory-retrieval-provider-query-vector-approval-gate";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "../src/memory-provider-vector-write-approval-gate";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV } from "../src/memory-provider-vector-retrieval-preflight";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "../src/local-embedding-composition";
import {
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "../src/local-embedding-runtime-session-factory";

describe("Memory provider-vector retrieval developer-alpha usage", () => {
  it("reports a sanitized passed session and rollback evidence", async () => {
    const result = await runMemoryProviderVectorDeveloperAlphaUsage({
      ...approvedInput(),
      messageTexts: [
        "Synthetic alpha test topic one.",
        "Synthetic alpha test topic two."
      ],
      verifyModelArtifacts: async () => undefined,
      executeProductPath: async () => ({
        ok: true,
        acceptedMessageIds: ["private-message-id-1", "private-message-id-2"],
        recalls: [
          {
            status: "ok",
            mode: "provider_vector",
            matchCount: 1,
            queryDimensions: 3
          },
          {
            status: "ok",
            mode: "provider_vector",
            matchCount: 1,
            queryDimensions: 3
          }
        ],
        cleanupStatus: "passed"
      }),
      rollbackProviderVectors: async ({ sourceIds }) => {
        expect(sourceIds).toEqual([
          "private-message-id-1",
          "private-message-id-2"
        ]);
        return {
          vectorWriteCount: 2,
          dimensionCount: 3,
          deletedCount: 2,
          cleanupStatus: "passed"
        };
      }
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.29",
      mode: "provider_vector_retrieval_developer_alpha_usage_session",
      status: "passed",
      accepted: true,
      messageCount: 2,
      acceptedMessageCount: 2,
      providerVectorWriteCount: 2,
      providerVectorDimensionCount: 3,
      recallStatus: "ok",
      recallMode: "provider_vector",
      recallMatchCount: 1,
      queryDimensionCount: 3,
      rollbackStatus: "passed",
      rollbackDeletedCount: 2,
      cleanupStatus: "passed"
    });
    expect(serialized).not.toContain("Synthetic alpha test topic");
    expect(serialized).not.toContain("private-message-id");
    expect(serialized).not.toContain("0.25");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks the session when any approval is missing", async () => {
    const result = await runMemoryProviderVectorDeveloperAlphaUsage({
      ...approvedInput(),
      securityApprovalGranted: false
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      reasonCodes: ["usage_not_approved"],
      providerVectorWriteCount: 0,
      rollbackStatus: "not_started",
      cleanupStatus: "not_started"
    });
  });

  it("keeps recall failure classes fixed and drops raw failure text", async () => {
    const result = await runMemoryProviderVectorDeveloperAlphaUsage({
      ...approvedInput(),
      verifyModelArtifacts: async () => undefined,
      executeProductPath: async () => ({
        ok: true,
        acceptedMessageIds: ["private-message-id"],
        recalls: [
          {
            status: "degraded",
            mode: "provider_vector",
            queryDimensions: 1024,
            failureClass: "VECTOR_QUERY_EXECUTION_FAILED"
          },
          {
            status: "degraded",
            mode: "provider_vector",
            failureClass:
              "C:\\Users\\Administrator\\private-helper-diagnostic" as never
          }
        ],
        cleanupStatus: "passed"
      }),
      rollbackProviderVectors: async () => ({
        vectorWriteCount: 1,
        dimensionCount: 1024,
        deletedCount: 1,
        cleanupStatus: "passed"
      })
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "degraded",
      recallFailureClasses: ["VECTOR_QUERY_EXECUTION_FAILED"],
      reasonCodes: ["provider_vector_retrieval_degraded"]
    });
    expect(serialized).not.toContain("private-helper-diagnostic");
    expect(serialized).not.toContain("private-message-id");
  });

  it("degrades before artifact access when an environment gate is missing", async () => {
    const result = await runMemoryProviderVectorDeveloperAlphaUsage({
      ...approvedInput(),
      env: {
        ...approvedInput().env,
        [MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV]: "0"
      },
      verifyModelArtifacts: async () => {
        throw new Error("artifact access must not occur");
      }
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      reasonCodes: ["developer_alpha_opt_in_missing"],
      rollbackStatus: "not_started",
      cleanupStatus: "not_started"
    });
  });

  it("blocks unsafe exposure and keeps the report sanitized", async () => {
    const result = await runMemoryProviderVectorDeveloperAlphaUsage({
      ...approvedInput(),
      rawVectorsExposed: true,
      privatePathExposed: true,
      modelOutputShellExecutionEnabled: true
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      reasonCodes: ["unsafe_side_effect_requested"]
    });
    expect(serialized).not.toContain("0.123");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("rejects more than the approved bounded message count", async () => {
    const result = await runMemoryProviderVectorDeveloperAlphaUsage({
      ...approvedInput(),
      messageTexts: Array.from(
        { length: MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_USAGE_MAX_MESSAGES + 1 },
        (_, index) => `Synthetic message ${index}`
      ),
      verifyModelArtifacts: async () => {
        throw new Error("artifact access must not occur");
      }
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      messageCount: 0,
      reasonCodes: ["usage_messages_invalid"]
    });
  });
});

function approvedInput(): MemoryProviderVectorDeveloperAlphaUsageInput {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    releaseApprovalGranted: true,
    phase827ImplementationComplete: true,
    messageTexts: ["Synthetic alpha test topic."],
    env: {
      [MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV]: "1",
      [MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]: "1",
      [MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]: "1",
      [MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]: "1",
      [MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "approved-python",
      [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir",
      JARVIS_K_MEMORY_DB_PATH: "approved-memory-db"
    }
  };
}
