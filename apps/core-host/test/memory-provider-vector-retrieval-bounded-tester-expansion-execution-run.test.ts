import { describe, expect, it } from "vitest";
import {
  runMemoryProviderVectorBoundedTesterExpansionExecution,
  type MemoryProviderVectorBoundedTesterExpansionExecutionInput
} from "../src/memory-provider-vector-retrieval-bounded-tester-expansion-execution-run";
import type { MemoryProviderVectorDeveloperAlphaContinuousReport } from "../src/memory-provider-vector-retrieval-developer-alpha-continuous-usage";

describe("Memory provider-vector retrieval bounded tester expansion execution run", () => {
  it("runs a bounded tester expansion through sanitized continuous sessions", async () => {
    const sessionInputs: readonly string[][] = [];
    const result = await runMemoryProviderVectorBoundedTesterExpansionExecution({
      ...approvedInput(),
      testers: [
        {
          testerId: "private-person-a",
          messageTexts: [
            "Synthetic tester A topic one.",
            "Synthetic tester A topic two."
          ]
        },
        {
          testerId: "private-person-b",
          messageTexts: ["Synthetic tester B topic one."]
        }
      ],
      runTesterSession: async (input) => {
        sessionInputs.push([...(input.messageTexts ?? [])]);
        return createSessionReport({
          messageCount: input.messageTexts?.length ?? 0,
          acceptedMessageCount: input.messageTexts?.length ?? 0,
          observationCount: input.messageTexts?.length ?? 0,
          providerVectorWriteCount: input.messageTexts?.length ?? 0,
          rollbackDeletedCount: input.messageTexts?.length ?? 0
        });
      }
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.37",
      mode: "provider_vector_retrieval_bounded_tester_expansion_execution_run",
      status: "passed",
      accepted: true,
      testerLimit: 3,
      messageLimitPerTester: 5,
      windowHours: 2,
      testerCount: 2,
      acceptedTesterCount: 2,
      messageCount: 3,
      acceptedMessageCount: 3,
      observationCount: 3,
      providerVectorWriteCount: 3,
      providerVectorDimensionCount: 1024,
      recallStatus: "ok",
      recallMode: "provider_vector",
      recallMatchCount: 1,
      queryDimensionCount: 1024,
      rollbackStatus: "passed",
      rollbackDeletedCount: 3,
      cleanupStatus: "passed",
      reasonCodes: []
    });
    expect(sessionInputs).toEqual([
      ["Synthetic tester A topic one.", "Synthetic tester A topic two."],
      ["Synthetic tester B topic one."]
    ]);
    expect(serialized).not.toContain("private-person");
    expect(serialized).not.toContain("Synthetic tester");
    expect(serialized).not.toContain("private-source");
    expect(serialized).not.toContain("0.123");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks missing execution approval and missing Phase 8.36 evidence", async () => {
    const missingApproval =
      await runMemoryProviderVectorBoundedTesterExpansionExecution({
        ...approvedInput(),
        productApprovalGranted: false
      });
    const missingPreflight =
      await runMemoryProviderVectorBoundedTesterExpansionExecution({
        ...approvedInput(),
        phase836PreflightComplete: false
      });

    expect(missingApproval).toMatchObject({
      status: "blocked",
      accepted: false,
      reasonCodes: ["execution_not_approved"],
      testerCount: 0,
      cleanupStatus: "not_started"
    });
    expect(missingPreflight).toMatchObject({
      status: "blocked",
      accepted: false,
      reasonCodes: ["phase836_preflight_missing"],
      testerCount: 0,
      cleanupStatus: "not_started"
    });
  });

  it("degrades before sessions when tester scope or messages exceed bounds", async () => {
    let called = false;
    const tooManyTesters =
      await runMemoryProviderVectorBoundedTesterExpansionExecution({
        ...approvedInput(),
        testers: [
          { testerId: "a", messageTexts: ["one"] },
          { testerId: "b", messageTexts: ["two"] },
          { testerId: "c", messageTexts: ["three"] },
          { testerId: "d", messageTexts: ["four"] }
        ],
        runTesterSession: async () => {
          called = true;
          return createSessionReport();
        }
      });
    const tooManyMessages =
      await runMemoryProviderVectorBoundedTesterExpansionExecution({
        ...approvedInput(),
        testers: [
          {
            testerId: "a",
            messageTexts: ["one", "two", "three", "four", "five", "six"]
          }
        ],
        runTesterSession: async () => {
          called = true;
          return createSessionReport();
        }
      });

    expect(tooManyTesters).toMatchObject({
      status: "degraded",
      reasonCodes: ["tester_scope_invalid"],
      testerCount: 0
    });
    expect(tooManyMessages).toMatchObject({
      status: "degraded",
      reasonCodes: ["tester_scope_invalid"],
      testerCount: 0
    });
    expect(called).toBe(false);
  });

  it("degrades when a tester session fails closed and keeps rollback evidence sanitized", async () => {
    let calledAfterDegradedSession = false;
    const result = await runMemoryProviderVectorBoundedTesterExpansionExecution({
      ...approvedInput(),
      testers: [
        { testerId: "private-person-a", messageTexts: ["one"] },
        { testerId: "private-person-b", messageTexts: ["two"] },
        { testerId: "private-person-c", messageTexts: ["three"] }
      ],
      runTesterSession: async (input) => {
        if (input.messageTexts?.[0] === "three") {
          calledAfterDegradedSession = true;
        }
        return input.messageTexts?.[0] === "one"
          ? createSessionReport({
              messageCount: 1,
              acceptedMessageCount: 1,
              observationCount: 1,
              providerVectorWriteCount: 1,
              rollbackDeletedCount: 1
            })
          : createSessionReport({
              status: "degraded",
              accepted: false,
              messageCount: 1,
              acceptedMessageCount: 1,
              observationCount: 1,
              recallStatus: "degraded",
              recallMode: "unknown",
              providerVectorWriteCount: 1,
              rollbackDeletedCount: 1,
              reasonCodes: ["provider_vector_retrieval_degraded"]
            });
      }
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      testerCount: 2,
      acceptedTesterCount: 1,
      messageCount: 2,
      acceptedMessageCount: 2,
      rollbackDeletedCount: 2,
      cleanupStatus: "passed",
      reasonCodes: ["tester_session_degraded"]
    });
    expect(calledAfterDegradedSession).toBe(false);
    expect(result.testerReports[1]).toMatchObject({
      status: "degraded",
      reasonCodes: ["tester_session_degraded"]
    });
    expect(serialized).not.toContain("private-person");
    expect(serialized).not.toContain("provider_vector_retrieval_degraded");
  });

  it("blocks unsafe output, persistence, migration, UI/default, shell, release, and SLO side effects", async () => {
    const result = await runMemoryProviderVectorBoundedTesterExpansionExecution({
      ...approvedInput(),
      rawVectorsExposed: true,
      rawTextExposed: true,
      rawDiagnosticsExposed: true,
      privatePathExposed: true,
      signedUrlOrCredentialPersisted: true,
      persistentCacheWritesEnabled: true,
      historicalBatchIndexingEnabled: true,
      sqliteSchemaMigrationEnabled: true,
      desktopIpcChanged: true,
      uiBehaviorChanged: true,
      providerVisibilityChanged: true,
      defaultOptInChanged: true,
      modelOutputShellExecutionEnabled: true,
      releaseChannelChanged: true,
      installerPolicyChanged: true,
      updateRollbackPolicyChanged: true,
      modelLifecyclePolicyChanged: true,
      cachePolicyChanged: true,
      productSloDeclared: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      reasonCodes: ["unsafe_side_effect_requested"],
      rawVectorsExposed: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathExposed: false,
      signedUrlOrCredentialPersisted: false,
      persistentCacheWritesEnabled: false,
      historicalBatchIndexingEnabled: false,
      sqliteSchemaMigrationEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      modelOutputShellExecutionEnabled: false,
      releaseChannelChanged: false,
      installerPolicyChanged: false,
      updateRollbackPolicyChanged: false,
      modelLifecyclePolicyChanged: false,
      cachePolicyChanged: false,
      productSloDeclared: false
    });
  });
});

function approvedInput(): MemoryProviderVectorBoundedTesterExpansionExecutionInput {
  return {
    productApprovalGranted: true,
    securityApprovalGranted: true,
    releaseApprovalGranted: true,
    phase836PreflightComplete: true,
    testers: [
      {
        testerId: "tester-a",
        messageTexts: ["Synthetic bounded expansion topic."]
      }
    ],
    env: {
      JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA: "1",
      JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING: "1",
      JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR: "1",
      JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES: "1",
      JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS: "1",
      JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER: "1",
      JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION: "1",
      JARVIS_K_RUNTIME_PYTHON: "approved-python",
      JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR: "approved-model-dir",
      JARVIS_K_MEMORY_DB_PATH: "approved-memory-db"
    }
  };
}

function createSessionReport(
  overrides: Partial<MemoryProviderVectorDeveloperAlphaContinuousReport> = {}
): MemoryProviderVectorDeveloperAlphaContinuousReport {
  return {
    phase: "8.31",
    mode: "provider_vector_retrieval_developer_alpha_continuous_usage_session",
    status: "passed",
    accepted: true,
    sessionState: "stopped",
    messageCount: 1,
    acceptedMessageCount: 1,
    observationCount: 1,
    providerVectorWriteCount: 1,
    providerVectorDimensionCount: 1024,
    recallStatus: "ok",
    recallMode: "provider_vector",
    recallMatchCount: 1,
    queryDimensionCount: 1024,
    stopReason: "completed",
    rollbackStatus: "passed",
    rollbackDeletedCount: 1,
    cleanupStatus: "passed",
    rawVectorsExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathExposed: false,
    signedUrlOrCredentialPersisted: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    historicalBatchIndexingEnabled: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    modelOutputShellExecutionEnabled: false,
    reasonCodes: [],
    ...overrides
  };
}
