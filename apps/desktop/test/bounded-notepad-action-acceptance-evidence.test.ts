import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const evidenceText = readFileSync(path.resolve(import.meta.dirname,
  "../../../artifacts/ui-3k/bounded-notepad-action-acceptance/acceptance.json"), "utf8");
const evidence = JSON.parse(evidenceText);
const acceptedCommit = "83b0910d9ef1aa48cd9555d5221db41ba5ec313b";

describe("bounded Notepad user acceptance evidence", () => {
  it("closes only the accepted implementation chain at L4", () => {
    expect(evidence.schemaVersion).toBe(1);
    expect(evidence.milestone).toBe("Milestone-1");
    expect(evidence.phase).toBe("UI-3K-2D");
    expect(evidence.closurePhase).toBe("UI-3K-2D-B");
    expect(evidence.completionLevel).toBe("L4");
    expect(evidence.implementationCommits).toEqual({
      initialBoundedDesktop: "51f7c5b5fb2dae5faf37d6ae923980c2dfa4c3a9",
      naturalSelectionAndDenialContinuation: "98fbbfe37c084ff54b8e464008f6b211f4ce527f",
      providerNativeApprovalResponsibility: acceptedCommit,
    });
    expect(evidence.decision).toEqual({ ui3k2dFullyAccepted: true, acceptedApp: "notepad",
      releaseReady: false, nextPhaseStarted: false, additionalToolAuthorized: false,
      notCompletedByThisAcceptance: ["arbitrary_app_launch", "file_writing", "shell", "browser", "filesystem.search", "wake_word"],
      windowsAutomationExpansionRequiresPerToolGovernance: true });
  });

  it("preserves user-observed denial before any execution and exactly one final", () => {
    expect(evidence.userObserved.attribution).toBe("userObserved");
    expect(evidence.userObserved.deny).toEqual({ verdict: "PASS", nativeApprovalShown: true,
      conversationalConfirmationObserved: false, notepadOpenedBeforeDecision: false,
      userDecision: "denied", notepadOpenedAfterDenial: false, executionCount: 0,
      denialPreventedLaunch: "PASS", approvalControlsDisabledAfterward: true,
      finalNonExecutionExplanationCount: 1, pendingStatusCleared: true,
      internalInformationExposureObserved: false, additionalWindowsSideEffectsObserved: false });
    expect(evidence.userProvidedSafeStatus.attribution).toBe("userProvidedSafeStatus");
    expect(evidence.userProvidedSafeStatus.deny).toEqual({ providerSelectedToolCall: "PASS",
      deniedToolResultReentry: "PASS", singleFinalMessage: "PASS" });
  });

  it("attributes exactly one allowed launch to the user rather than a machine trace", () => {
    expect(evidence.userObserved.allow).toEqual({ verdict: "PASS", nativeApprovalShown: true,
      notepadOpenedBeforeApproval: false, userDecision: "allowed", approvalControlsDisabledAfterward: true,
      boundedNotepadLaunchCount: 1, onlyNotepadOpened: true, finalMessageCount: 1,
      flickerEmptyOrDuplicateBubblesObserved: false, internalInformationExposureObserved: false,
      additionalWindowsSideEffectsObserved: false, notepadContentReadOrWritten: false, testInstanceClosedByUser: true });
    expect(evidence.userObserved.realWindowsAction).toEqual({ attribution: "userObserved",
      classification: "one_user_approved_bounded_notepad_launch", count: 1, machineObserved: false,
      otherWindowsSideEffectsObserved: false });
    expect(evidence.userProvidedSafeStatus.allow).toEqual({ providerSelectedToolCall: "PASS",
      launchVerification: "PASS", successToolResultReentry: "PASS", singleFinalMessage: "PASS" });
    expect(evidence.userProvidedSafeStatus.notAnIndependentNetworkOrProcessTrace).toBe(true);
    expect(evidence.userObserved.securityExposureObserved).toBe(false);
  });

  it("keeps governance and process identity verification classified as source/test support", () => {
    const supported = evidence.sourceAndTestSupported;
    expect(supported.attribution).toBe("sourceAndTestSupported");
    expect(supported.supportedImplementationCommit).toBe(acceptedCommit);
    expect(supported.tool).toMatchObject({ internalId: "localApp.open", providerName: "local_app_open",
      onlyAllowedApp: "notepad", argumentClassification: "strict_single_app_enum_no_additional_properties",
      providerToolChoice: "auto", maxToolsPerTurn: 1, maxToolIterations: 1, parallelCallsAllowed: false,
      providerCanControlRiskOrApproval: false, keywordConstructedProposal: false });
    expect(supported.governance).toEqual({ sharedToolRegistryAndSafety: true, existingTaskAndApprovalServices: true,
      approvalBeforeExecution: true, nativeApprovalRequired: true, chatTextCanApprove: false,
      approvalConsumedOnce: true, denialTerminatesEntireTurn: false, denialExecutionCount: 0 });
    expect(supported.executionAndVerification).toEqual({ owner: "desktop_main",
      launchTargetClassification: "fixed_system_application", emptyLaunchArguments: true, shellUsed: false,
      verificationClassification: "identity_check_of_this_launch_process", spawnSuccessAloneIsVerification: false,
      alreadyRunningInstanceIsNotLaunchProof: true, notepadContentAccess: false });
    expect(supported.resultAndFinalOwnership).toEqual({ sameTurnProposalTaskResultCorrelation: true,
      deniedResultIsBounded: true, successResultRequiresVerification: true, deniedAndSuccessResultReentry: "PASS",
      providerContinuationCountPerAcceptedTurn: 1, finalMessageOwner: "assistant_runtime",
      finalMessageCountPerAcceptedTurn: 1, secondToolProposalAllowed: false });
  });

  it("labels four requests as inference limited to accepted flows, never packet capture", () => {
    expect(evidence.inferred.attribution).toBe("inferred");
    expect(evidence.inferred.providerRequests).toEqual({ classification: "inferred_not_packet_captured",
      scope: "accepted_deny_and_allow_flows_only", userInitiatedTurns: 2, approximateCount: 4,
      basis: "one_proposal_request_and_one_result_continuation_per_flow", packetCaptured: false,
      machineObservedExactCount: false, includesEarlierFailedAttemptsOrConnectionTests: false });
    expect(evidence.sourceAndTestSupported.evidencePhaseAutomation).toEqual({ realNetworkRequestSent: false,
      realWindowsActionPerformed: false, productLogicChanged: false, jarvisStarted: false, realDenyAllowRepeated: false });
    expect(evidence.sourceAndTestSupported.implementationValidation.realAcceptanceRepeatedInEvidencePhase).toBe(false);
  });

  it("records safe closure status without mistaking the implementation hash for this evidence commit", () => {
    expect(evidence.userProvidedSafeStatus.jarvisFullyExited).toBe(true);
    expect(evidence.userProvidedSafeStatus.blankTestInstanceClosed).toBe(true);
    expect(evidence.finalMachineAndRepoState).toEqual({ attribution: "read_only_closure_checks",
      observationPoint: "after_user_exit_before_evidence_edits", jarvisCoreHostElectronNotepadProcessCount: 0,
      runIdentityCounts: { currentUserNativeView: 0, localMachineNativeView: 0,
        currentUserCompatibilityView: 0, localMachineCompatibilityView: 0 }, branch: "main",
      acceptedImplementationHead: acceptedCommit, acceptedImplementationOrigin: acceptedCommit,
      headMatchesOrigin: true, worktreeClean: true });
  });

  it("contains classifications only, with no credential, path or raw conversation payload", () => {
    expect(Object.keys(evidence).sort()).toEqual(["schemaVersion", "milestone", "phase", "closurePhase",
      "completionLevel", "completionClassification", "implementationCommits", "userObserved",
      "userProvidedSafeStatus", "sourceAndTestSupported", "inferred", "finalMachineAndRepoState", "decision"].sort());
    const forbiddenKey = /^(api[_-]?key|credentials?|password|secret|access[_-]?token|authorization|endpoint|serviceUrl|baseUrl|modelId|providerConfig(?:uration)?|prompt|answer|response|reasoning|reasoning_content|raw.*|arguments|toolArguments|pid|processId|executablePath|commandLine|username|processList|registryDump|text|content)$/i;
    function inspect(value: unknown): void {
      if (Array.isArray(value)) {
        expect(value.length).toBeLessThanOrEqual(10);
        value.forEach(inspect);
      } else if (value !== null && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) {
          expect(key).not.toMatch(forbiddenKey);
          if (key === "machineObserved" || key === "machineObservedExactCount") expect(child).toBe(false);
          inspect(child);
        }
      } else if (typeof value === "string") {
        expect(value.length).toBeLessThanOrEqual(128);
        expect(value).toMatch(/^[A-Za-z0-9_.-]+$/);
        expect(value).not.toMatch(/Bearer|sk-[A-Za-z0-9]{16,}/i);
      } else {
        expect(typeof value === "boolean" || (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)).toBe(true);
      }
    }
    inspect(evidence);
    expect(evidenceText.length).toBeLessThan(12000);
  });
});
