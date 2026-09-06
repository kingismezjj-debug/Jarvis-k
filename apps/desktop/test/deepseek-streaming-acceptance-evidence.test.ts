import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const evidenceText = readFileSync(path.resolve(import.meta.dirname,
  "../../../artifacts/ui-3k/deepseek-streaming-acceptance/deepseek-streaming-acceptance.json"), "utf8");

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected an evidence object");
  }
  return value as Record<string, unknown>;
}

const evidence = record(JSON.parse(evidenceText) as unknown);
const inference = record(evidence.sourceAndTestInference);

describe("DeepSeek streaming L4 acceptance evidence", () => {
  it("requires human observations and keeps the next phase and release gates separate", () => {
    expect(Object.keys(evidence).sort()).toEqual([
      "schemaVersion", "phase", "recordedDate", "completionLevel", "baselineCommit",
      "implementationCommit", "userObserved", "userProvidedSafeStatus",
      "sourceAndTestInference", "decision",
    ].sort());
    expect(evidence.schemaVersion).toBe(1);
    expect(evidence.phase).toBe("UI-3K-2B-G");
    expect(evidence.completionLevel).toBe("L4");
    expect(evidence.baselineCommit).toBe("d2fd0a55fd1513db631c80c48376b7823b732466");
    expect(evidence.implementationCommit).toBe("8e263283bbb5065a721ff38b2ab2db69b4d23eb9");
    expect(evidence.userObserved).toEqual({
      incrementalDisplay: true, noFlicker: true, noEmptyBubble: true,
      cancelQuickStop: true, cancelInputRecovered: true,
      postCancelRetrySucceeded: true, finalExplicitExitConfirmed: true,
    });
    expect(evidence.decision).toEqual({
      ui3k2bFullyAccepted: true, ui3k2cAllowed: true,
      ui3k2cStarted: false, releaseReady: false,
    });
  });

  it("accounts for additional human turns without claiming a measured network count", () => {
    const requests = record(inference.realRequests);
    expect(requests.observedTurns).toEqual([
      "normal_completed", "history_cancelled", "additional_history_completed",
      "repeated_history_cancelled", "specified_retry_completed",
    ]);
    expect(requests.successfulConnectionTests).toBe(2);
    expect(requests.inferredUserInitiatedRequests).toBe(
      Number(requests.successfulConnectionTests) + (requests.observedTurns as unknown[]).length,
    );
    expect(requests.wireCountMeasured).toBe(false);
    expect(requests.automatedRealRequests).toBe(0);
    expect(record(inference.cancellation)).toMatchObject({
      observedCancelledTurns: 2, finalMessagesForCancelledTurns: 0,
      lateDeltaOrFinalObserved: false,
      turnScopedAbortSignal: "source_and_fake_formal_entry_smoke",
    });
  });

  it("requires successful handoff, retry, restart and zero side effects before closure", () => {
    expect(evidence.userProvidedSafeStatus).toEqual({
      connectionTestBeforeFix: "success", connectionTestAfterFix: "success",
      enabledAfterFix: true, specifiedRetryAnswerMatched: true,
    });
    expect(record(inference.provider)).toMatchObject({
      configured: true, enabled: true, available: true, armedWithoutRestart: true,
      singleConfiguredProvider: true, enableAddedMessages: 0,
    });
    const normal = record(inference.normalStreaming);
    expect(normal.distinctIncreasingProjections).toBeGreaterThan(1);
    expect(normal).toMatchObject({ canonicalFinalMessages: 1, transientRemoved: true,
      inputAndSendRecovered: true, chineseChunking: "pass" });
    expect(inference.retry).toMatchObject({ completed: true, newTurnAfterCancel: true,
      canonicalFinalMessages: 1, streamingProjectionPresent: true,
      cancelledStateLeaked: false, inputAndSendRecovered: true });
    expect(inference.restart).toMatchObject({ sameDevelopmentProfile: true,
      configured: true, enabled: true, available: true, armed: true, coreHealth: "ready",
      activeTurnPresent: false, newCredentialInput: false,
      newConnectionTestAttempt: false, newQuestion: false });
    expect(inference.safety).toMatchObject({ credentialExposureObserved: false,
      reasoningExposure: "absent_by_source_and_tests", rawProviderExposure: "absent_by_source_and_tests",
      taskDelta: 0, approvalDelta: 0, toolProposalCount: 0, executionCount: 0,
      windowsActionReachable: false });
    expect(Object.values(record(inference.finalExitSafeStatus))).toEqual([0, 0, 0, 0, 0]);
    expect(record(inference.implementationValidation)).toMatchObject({
      cleanEnvironmentVerify: "pass", fakeFormalEntryDesktopSmoke: "pass",
      boundaries: "pass", sensitiveArtifacts: "pass", automatedRealNetworkRequestSent: false,
    });
  });

  it("stores bounded classifications and counts without payloads or private paths", () => {
    const forbiddenKey = /^(apiKey|authorization|endpoint|baseUrl|modelResponse|rawRequest|rawResponse|rawPayload|reasoning_content|secureStore|encryptedCredentials|profilePath|content|text)$/i;
    function inspect(value: unknown): void {
      if (Array.isArray(value)) {
        expect(value.length).toBeLessThanOrEqual(10);
        value.forEach(inspect);
      } else if (typeof value === "object" && value !== null) {
        for (const [key, child] of Object.entries(record(value))) {
          expect(key).not.toMatch(forbiddenKey);
          inspect(child);
        }
      } else if (typeof value === "string") {
        expect(value.length).toBeLessThanOrEqual(128);
        expect(value).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(value).not.toMatch(/sk-[A-Za-z0-9]{16,}|Bearer/i);
      } else {
        expect(typeof value === "boolean" ||
          (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)).toBe(true);
      }
    }
    inspect(evidence);
    expect(evidenceText.length).toBeLessThan(8000);
  });
});
