import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const evidenceText = readFileSync(path.resolve(import.meta.dirname,
  "../../../artifacts/ui-3k/single-tool-result-reentry/acceptance.json"), "utf8");

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected an evidence object");
  }
  return value as Record<string, unknown>;
}

const evidence = record(JSON.parse(evidenceText) as unknown);

describe("Single read-only tool L4 acceptance evidence", () => {
  it("requires human acceptance without authorizing another tool or release", () => {
    expect(evidence.phase).toBe("UI-3K-2C");
    expect(evidence.completionLevel).toBe("L4");
    expect(evidence.baselineCommit).toBe("77e2d70f43b0b1ad8e9e26e570a199e07414731b");
    expect(evidence.implementationCommit).toBe("c4a0d2eb67c4bb75857308a2ae7e46ed6dbae8e8");
    expect(evidence.userObserved).toEqual({ naturalLanguageStatusAnswer: true,
      visibleProgress: true, singleFinalBubble: true, finalExplicitExitConfirmed: true });
    expect(evidence.decision).toEqual({ ui3k2cFullyAccepted: true,
      nextPhaseStarted: false, effectfulToolsAllowed: false, releaseReady: false });
    expect(record(evidence.tool)).toMatchObject({ internalId: "model.status",
      providerName: "model_status", maxToolIterations: 1, maxToolsPerIteration: 1,
      argumentsSchema: { type: "object", properties: {}, required: [], additionalProperties: false } });
  });

  it("keeps user-turn observations separate from network inference and cancellation tests", () => {
    const observed = record(evidence.safeRuntimeObservations);
    const requests = record(evidence.realRequests);
    expect(observed).toMatchObject({ observedTurns: 1, proposalCount: 1, executionCount: 1,
      tasksCreatedSinceTurn: 1, taskCorrelationCorrect: true, policyAllowed: true,
      otherTaskStatesChanged: false, canonicalFinalCount: 1, transientRemoved: true });
    expect(requests.userInitiatedTurns).toBe(observed.observedTurns);
    expect(requests.inferredUserInitiatedProviderRequests).toBe(2);
    expect(requests).toMatchObject({ newConnectionTests: 0, wireCountMeasured: false,
      automatedRealRequests: 0 });
    expect(record(record(evidence.sourceAndTestInference).cancellation)).toMatchObject({
      basis: "source_and_controlled_tests", realCancellationRetestedThisPhase: false,
      beforeFirstOutput: true, afterProposalBeforeExecution: true, duringExecution: true,
      duringContinuation: true, lateToolResultIgnored: true, lateProviderFinalIgnored: true,
      retryPassed: true });
  });

  it("requires completed governance, validation and zero final process or startup identities", () => {
    const inference = record(evidence.sourceAndTestInference);
    expect(inference.governance).toMatchObject({ registryLookup: true, strictArguments: true,
      sharedFixtureAndRealPolicy: true, existingTaskLifecycle: true, explicitPolicyDecision: true,
      approvalBypass: false, providerControlsRiskOrAuthority: false });
    expect(inference.result).toMatchObject({ turnProposalExecutionTaskCorrelated: true,
      safeFailureContinuation: true, rawOutputAllowed: false });
    expect(inference.validation).toMatchObject({ cleanEnvironmentVerify: "pass",
      fakeFormalEntryDesktopSmoke: "pass", formalAgentRunBrainCommandSuccessAndFailure: "pass",
      boundaries: "pass", sensitiveArtifacts: "pass", automatedRealNetworkRequestSent: false });
    expect(inference.safety).toMatchObject({ credentialExposureObserved: false,
      userFileContentRead: false, userDirectorySearch: false, windowsActionReachable: false,
      additionalToolAdded: false });
    expect(Object.values(record(evidence.finalExitSafeStatus))).toEqual([0, 0, 0, 0, 0]);
  });

  it("contains bounded safe classifications rather than private payloads", () => {
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
        expect(value).toMatch(/^[A-Za-z0-9_.-]+$/);
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
