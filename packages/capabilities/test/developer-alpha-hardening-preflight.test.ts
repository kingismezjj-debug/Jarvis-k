import { describe, expect, it } from "vitest";
import {
  createDeveloperAlphaHardeningPreflightPolicy,
  evaluateDeveloperAlphaHardeningPreflight
} from "../src";

const approvedInput = {
  hardeningPlanReviewed: true,
  modelLifecyclePreflightAccepted: true,
  fixtureHarnessAvailable: true,
  sanitizedDiagnosticsReviewed: true,
  boundedOperationStateReviewed: true,
  restartRecoveryObservationReviewed: true,
  fixtureFallbackAvailable: true,
  windowsPackagePolicyDeferred: true,
  updatePolicyDeferred: true,
  rollbackPolicyDeferred: true,
  installerBundlingEnabled: false,
  autoUpdateEnabled: false,
  rollbackExecutionEnabled: false,
  filesystemWritesAllowed: false,
  networkAccessAllowed: false,
  credentialsRequired: false,
  modelLoadingEnabled: false,
  providerRegistrationEnabled: false,
  defaultOptInEnabled: false,
  privatePathsExposed: false,
  rawDiagnosticsExposed: false,
  modelOutputCommandsEnabled: false,
  coreHostCompositionChanged: false,
  desktopIpcChanged: false,
  uiBehaviorChanged: false,
  providerVisibilityChanged: false,
  verificationClean: true
};

describe("developer-alpha hardening preflight", () => {
  it("defines a deferred, fixture-only hardening policy", () => {
    const policy = createDeveloperAlphaHardeningPreflightPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      capability: "developer_alpha_hardening",
      compositionRoot: "apps/core-host",
      modelLifecyclePreflightRequired: true,
      fixtureHarnessRequired: true,
      sanitizedDiagnosticsRequired: true,
      boundedOperationStateRequired: true,
      restartRecoveryObservationRequired: true,
      fixtureFallbackRequired: true,
      windowsPackagePolicyDeferred: true,
      updatePolicyDeferred: true,
      rollbackPolicyDeferred: true,
      installerBundlingEnabled: false,
      autoUpdateEnabled: false,
      rollbackExecutionEnabled: false,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      modelLoadingEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputCommandsEnabled: false,
      coreHostCompositionChanged: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks by default", () => {
    const result = evaluateDeveloperAlphaHardeningPreflight();

    expect(result).toMatchObject({
      capability: "developer_alpha_hardening",
      compositionRoot: "apps/core-host",
      status: "blocked",
      accepted: false,
      readyForFixtureHardening: false,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Developer-alpha hardening plan is not reviewed.",
        "Model lifecycle preflight has not reached its fixture boundary.",
        "A deterministic developer-alpha fixture harness is required."
      ])
    );
  });

  it("accepts only a review-complete, side-effect-free fixture boundary", () => {
    const result = evaluateDeveloperAlphaHardeningPreflight(approvedInput);

    expect(result).toMatchObject({
      status: "ready_for_fixture_hardening",
      accepted: true,
      readyForFixtureHardening: true,
      installerBundlingEnabled: false,
      autoUpdateEnabled: false,
      rollbackExecutionEnabled: false,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      modelLoadingEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputCommandsEnabled: false,
      coreHostCompositionChanged: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      checks: {
        hardeningPlanReviewed: true,
        modelLifecyclePreflightAccepted: true,
        fixtureHarnessAvailable: true,
        sanitizedDiagnosticsReviewed: true,
        boundedOperationStateReviewed: true,
        restartRecoveryObservationReviewed: true,
        fixtureFallbackAvailable: true,
        windowsPackagePolicyDeferred: true,
        updatePolicyDeferred: true,
        rollbackPolicyDeferred: true,
        installerBundlingDisabled: true,
        autoUpdateDisabled: true,
        rollbackExecutionDisabled: true,
        filesystemWritesDisabled: true,
        networkAccessDisabled: true,
        credentialsNotRequired: true,
        modelLoadingDisabled: true,
        providerRegistrationDisabled: true,
        defaultOptInDisabled: true,
        privatePathExposureDisabled: true,
        rawDiagnosticsExposureDisabled: true,
        modelOutputCommandsDisabled: true,
        coreHostCompositionUnchanged: true,
        desktopIpcUnchanged: true,
        uiBehaviorUnchanged: true,
        providerVisibilityUnchanged: true,
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks lifecycle, privacy, composition, and execution regressions", () => {
    const result = evaluateDeveloperAlphaHardeningPreflight({
      ...approvedInput,
      modelLifecyclePreflightAccepted: false,
      fixtureHarnessAvailable: false,
      sanitizedDiagnosticsReviewed: false,
      boundedOperationStateReviewed: false,
      restartRecoveryObservationReviewed: false,
      fixtureFallbackAvailable: false,
      windowsPackagePolicyDeferred: false,
      updatePolicyDeferred: false,
      rollbackPolicyDeferred: false,
      installerBundlingEnabled: true,
      autoUpdateEnabled: true,
      rollbackExecutionEnabled: true,
      filesystemWritesAllowed: true,
      networkAccessAllowed: true,
      credentialsRequired: true,
      modelLoadingEnabled: true,
      providerRegistrationEnabled: true,
      defaultOptInEnabled: true,
      privatePathsExposed: true,
      rawDiagnosticsExposed: true,
      modelOutputCommandsEnabled: true,
      coreHostCompositionChanged: true,
      desktopIpcChanged: true,
      uiBehaviorChanged: true,
      providerVisibilityChanged: true,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureHardening: false,
      installerBundlingEnabled: false,
      autoUpdateEnabled: false,
      rollbackExecutionEnabled: false,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      modelLoadingEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      privatePathsExposed: false,
      rawDiagnosticsExposed: false,
      modelOutputCommandsEnabled: false,
      coreHostCompositionChanged: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Model lifecycle preflight has not reached its fixture boundary.",
        "A deterministic developer-alpha fixture harness is required.",
        "Sanitized diagnostics behavior is not reviewed.",
        "Bounded operation-state behavior is not reviewed.",
        "Restart recovery observation is not reviewed.",
        "Fixture providers must remain available as the fallback path.",
        "Automatic update policy remains a deferred gate.",
        "Filesystem lifecycle writes remain disabled in this wave.",
        "Raw diagnostics must remain unexposed.",
        "Core Host composition must remain unchanged in this wave.",
        "Desktop IPC must remain unchanged in this wave.",
        "UI behavior must remain unchanged in this wave.",
        "Provider visibility must remain unchanged in this wave.",
        "Verification gates are not clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /apiKey|credentialValue|privatePathValue|modelFileBytes|cachePathValue/iu
    );
  });

  it("keeps incomplete review blocked without echoing private input details", () => {
    const result = evaluateDeveloperAlphaHardeningPreflight({
      ...approvedInput,
      hardeningPlanReviewed: false,
      verificationClean: false
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureHardening: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Developer-alpha hardening plan is not reviewed.",
        "Verification gates are not clean."
      ])
    );
    expect(JSON.stringify(result)).not.toMatch(
      /apiKey|credentialValue|privatePathValue|modelFileBytes|cachePathValue/iu
    );
    expect(JSON.stringify(result)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(result)).not.toMatch(/[A-Za-z]:\\/u);
  });
});
