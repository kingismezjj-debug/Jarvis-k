import { describe, expect, it } from "vitest";
import {
  MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_CONTINUOUS_MAX_MESSAGES,
  runMemoryProviderVectorDeveloperAlphaContinuousUsage,
  startMemoryProviderVectorDeveloperAlphaContinuousSession,
  type MemoryProviderVectorDeveloperAlphaContinuousInput,
  type MemoryProviderVectorDeveloperAlphaContinuousTransport
} from "../src/memory-provider-vector-retrieval-developer-alpha-continuous-usage";
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

describe("Memory provider-vector retrieval developer-alpha continuous usage", () => {
  it("keeps one bounded session alive, observes sanitized recall, and rolls back exact sources", async () => {
    const sentTexts: string[] = [];
    const sourceIds = ["private-source-1", "private-source-2"];
    const result = await runMemoryProviderVectorDeveloperAlphaContinuousUsage({
      ...approvedInput(),
      messageTexts: [
        "Synthetic continuous alpha topic one.",
        "Synthetic continuous alpha topic two."
      ],
      verifyModelArtifacts: async () => undefined,
      createTransport: async () =>
        createFakeTransport({
          sendMessage: async (text) => {
            sentTexts.push(text);
            const sourceId = sourceIds[sentTexts.length - 1];
            return {
              accepted: true,
              messageId: sourceId,
              recall: {
                status: "ok",
                mode: "provider_vector",
                matchCount: 1,
                queryDimensions: 1024
              }
            };
          }
        }),
      rollbackProviderVectors: async ({ sourceIds: rollbackIds }) => {
        expect(rollbackIds).toEqual(sourceIds);
        return {
          vectorWriteCount: 2,
          dimensionCount: 1024,
          deletedCount: 2,
          cleanupStatus: "passed"
        };
      }
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.31",
      mode: "provider_vector_retrieval_developer_alpha_continuous_usage_session",
      status: "passed",
      accepted: true,
      sessionState: "stopped",
      messageCount: 2,
      acceptedMessageCount: 2,
      observationCount: 2,
      providerVectorWriteCount: 2,
      providerVectorDimensionCount: 1024,
      recallStatus: "ok",
      recallMode: "provider_vector",
      recallMatchCount: 1,
      queryDimensionCount: 1024,
      stopReason: "completed",
      rollbackStatus: "passed",
      rollbackDeletedCount: 2,
      cleanupStatus: "passed",
      reasonCodes: []
    });
    expect(sentTexts).toEqual([
      "Synthetic continuous alpha topic one.",
      "Synthetic continuous alpha topic two."
    ]);
    expect(serialized).not.toContain("Synthetic continuous alpha topic");
    expect(serialized).not.toContain("private-source");
    expect(serialized).not.toContain("0.123");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("supports operator disable and exact-source rollback before the next message", async () => {
    const transport = createFakeTransport({
      sendMessage: async () => ({
        accepted: true,
        messageId: "private-source-1",
        recall: {
          status: "ok",
          mode: "provider_vector",
          matchCount: 0,
          queryDimensions: 1024
        }
      })
    });
    let rollbackIds: readonly string[] = [];
    const start = await startMemoryProviderVectorDeveloperAlphaContinuousSession(
      {
        ...approvedInput(),
        verifyModelArtifacts: async () => undefined,
        createTransport: async () => transport,
        rollbackProviderVectors: async ({ sourceIds }) => {
          rollbackIds = sourceIds;
          return {
            vectorWriteCount: 1,
            dimensionCount: 1024,
            deletedCount: 1,
            cleanupStatus: "passed"
          };
        }
      }
    );

    expect(start.session).toBeDefined();
    await start.session!.sendMessage("Synthetic disable test.");
    const stopped = await start.session!.disable();
    const afterStop = await start.session!.sendMessage(
      "Synthetic message after disable."
    );

    expect(stopped).toMatchObject({
      status: "stopped",
      accepted: false,
      sessionState: "disabled",
      stopReason: "disabled_by_operator",
      acceptedMessageCount: 1,
      rollbackStatus: "passed",
      rollbackDeletedCount: 1,
      cleanupStatus: "passed",
      reasonCodes: []
    });
    expect(rollbackIds).toEqual(["private-source-1"]);
    expect(afterStop).toMatchObject({
      status: "blocked",
      reasonCodes: ["session_stopped"]
    });
  });

  it("stops when an existing provider gate is revoked before the next message", async () => {
    const env = {
      ...approvedInput().env
    };
    const start = await startMemoryProviderVectorDeveloperAlphaContinuousSession(
      {
        ...approvedInput(),
        env,
        verifyModelArtifacts: async () => undefined,
        createTransport: async () =>
          createFakeTransport({
            sendMessage: async () => ({
              accepted: true,
              messageId: "private-source-gate-revoked",
              recall: {
                status: "ok",
                mode: "provider_vector",
                matchCount: 0,
                queryDimensions: 1024
              }
            })
          }),
        rollbackProviderVectors: async () => ({
          vectorWriteCount: 1,
          dimensionCount: 1024,
          deletedCount: 1,
          cleanupStatus: "passed"
        })
      }
    );

    expect(start.session).toBeDefined();
    await start.session!.sendMessage("Synthetic gate revoke test.");
    delete env[MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV];
    const observation = await start.session!.sendMessage(
      "Synthetic message after gate revoke."
    );
    const report = start.session!.getReport();

    expect(observation).toMatchObject({
      status: "blocked",
      reasonCodes: ["provider_vector_write_opt_in_missing"]
    });
    expect(report).toMatchObject({
      status: "degraded",
      stopReason: "continuous_alpha_opt_in_missing",
      rollbackStatus: "passed",
      cleanupStatus: "passed",
      reasonCodes: ["provider_vector_write_opt_in_missing"]
    });
  });

  it("stops and rolls back when retrieval degrades to no-recall", async () => {
    const result = await runMemoryProviderVectorDeveloperAlphaContinuousUsage({
      ...approvedInput(),
      messageTexts: ["Synthetic degraded recall test."],
      verifyModelArtifacts: async () => undefined,
      createTransport: async () =>
        createFakeTransport({
          sendMessage: async () => ({
            accepted: true,
            messageId: "private-source-degraded",
            recall: {
              status: "degraded"
            }
          })
        }),
      rollbackProviderVectors: async () => ({
        vectorWriteCount: 1,
        dimensionCount: 1024,
        deletedCount: 1,
        cleanupStatus: "passed"
      })
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      stopReason: "degraded_recall",
      recallStatus: "degraded",
      rollbackStatus: "passed",
      cleanupStatus: "passed",
      reasonCodes: ["provider_vector_retrieval_degraded"]
    });
  });

  it("keeps aggregate recall degraded after a later observation degrades", async () => {
    let callCount = 0;
    const result = await runMemoryProviderVectorDeveloperAlphaContinuousUsage({
      ...approvedInput(),
      stopOnDegraded: false,
      messageTexts: [
        "Synthetic mixed recall topic one.",
        "Synthetic mixed recall topic two."
      ],
      verifyModelArtifacts: async () => undefined,
      createTransport: async () =>
        createFakeTransport({
          sendMessage: async () => {
            callCount += 1;
            return {
              accepted: true,
              messageId: `private-source-mixed-${callCount}`,
              recall:
                callCount === 1
                  ? {
                      status: "ok",
                      mode: "provider_vector",
                      matchCount: 1,
                      queryDimensions: 1024
                    }
                  : {
                      status: "degraded",
                      mode: "provider_vector",
                      queryDimensions: 1024,
                      failureClass: "QUERY_EMBEDDING_TIMEOUT"
                    }
            };
          }
        }),
      rollbackProviderVectors: async ({ sourceIds }) => ({
        vectorWriteCount: sourceIds.length,
        dimensionCount: 1024,
        deletedCount: sourceIds.length,
        cleanupStatus: "passed"
      })
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      messageCount: 2,
      acceptedMessageCount: 2,
      observationCount: 2,
      recallStatus: "degraded",
      recallMode: "provider_vector",
      recallFailureClasses: ["QUERY_EMBEDDING_TIMEOUT"],
      queryDimensionCount: 1024,
      rollbackStatus: "passed",
      cleanupStatus: "passed"
    });
  });

  it("fails closed before artifact access when a required gate is missing", async () => {
    let verificationCalled = false;
    let transportCalled = false;
    const env = {
      ...approvedInput().env,
      [MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV]: "0"
    };
    const result = await runMemoryProviderVectorDeveloperAlphaContinuousUsage({
      ...approvedInput(),
      env,
      messageTexts: ["Synthetic blocked gate test."],
      verifyModelArtifacts: async () => {
        verificationCalled = true;
      },
      createTransport: async () => {
        transportCalled = true;
        return createFakeTransport();
      }
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      sessionState: "not_started",
      reasonCodes: ["continuous_alpha_opt_in_missing"],
      rollbackStatus: "not_started",
      cleanupStatus: "not_started"
    });
    expect(verificationCalled).toBe(false);
    expect(transportCalled).toBe(false);
  });

  it("blocks missing Phase 8.30 evidence and rejects an unbounded usage window", async () => {
    const missingPreflight = await runMemoryProviderVectorDeveloperAlphaContinuousUsage(
      {
        ...approvedInput(),
        phase830PreflightComplete: false,
        messageTexts: ["Synthetic approval test."]
      }
    );
    const oversized = await runMemoryProviderVectorDeveloperAlphaContinuousUsage(
      {
        ...approvedInput(),
        maxMessages:
          MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_CONTINUOUS_MAX_MESSAGES + 1,
        messageTexts: ["Synthetic bounded window test."]
      }
    );

    expect(missingPreflight).toMatchObject({
      status: "blocked",
      reasonCodes: ["phase830_preflight_missing"]
    });
    expect(oversized).toMatchObject({
      status: "degraded",
      reasonCodes: ["usage_window_invalid"]
    });
  });

  it("blocks unsafe side effects and keeps sensitive values out of the report", async () => {
    const result = await runMemoryProviderVectorDeveloperAlphaContinuousUsage({
      ...approvedInput(),
      rawVectorsExposed: true,
      privatePathExposed: true,
      persistentCacheWritesEnabled: true,
      modelOutputShellExecutionEnabled: true
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      reasonCodes: ["unsafe_side_effect_requested"],
      rawVectorsExposed: false,
      privatePathExposed: false,
      persistentCacheWritesEnabled: false,
      modelOutputShellExecutionEnabled: false
    });
    expect(serialized).not.toContain("0.123");
    expect(serialized).not.toContain("private-source");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });
});

function approvedInput(): MemoryProviderVectorDeveloperAlphaContinuousInput {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    releaseApprovalGranted: true,
    phase830PreflightComplete: true,
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

function createFakeTransport(options: {
  sendMessage?: MemoryProviderVectorDeveloperAlphaContinuousTransport["sendMessage"];
} = {}): MemoryProviderVectorDeveloperAlphaContinuousTransport {
  return {
    waitUntilReady: async () => undefined,
    sendMessage:
      options.sendMessage ??
      (async () => ({
        accepted: true,
        messageId: "private-source-default",
        recall: {
          status: "ok" as const,
          mode: "provider_vector" as const,
          matchCount: 0,
          queryDimensions: 1024
        }
      })),
    close: async () => "passed"
  };
}
