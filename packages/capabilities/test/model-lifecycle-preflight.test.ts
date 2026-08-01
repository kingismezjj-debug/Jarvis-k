import { describe, expect, it } from "vitest";
import {
  createModelLifecyclePreflightPolicy,
  evaluateModelLifecyclePreflight
} from "../src";

const approvedInput = {
  manifestPolicyReviewed: true,
  artifactDigestPolicyReviewed: true,
  licensePolicyReviewed: true,
  operationStateSanitizationReviewed: true,
  fixtureExecutorAvailable: true,
  windowsPackagePolicyDeferred: true,
  updatePolicyDeferred: true,
  rollbackPolicyDeferred: true,
  committedArtifactsDetected: false,
  signedUrlPersistenceEnabled: false,
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
  verificationClean: true
};

describe("model lifecycle preflight", () => {
  it("defines a deferred, fixture-only lifecycle policy", () => {
    const policy = createModelLifecyclePreflightPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      capability: "model_lifecycle",
      compositionRoot: "apps/core-host",
      manifestPinningRequired: true,
      digestVerificationRequired: true,
      licenseReviewRequired: true,
      sanitizedOperationStateRequired: true,
      fixtureExecutorAllowed: true,
      windowsPackagePolicyDeferred: true,
      updatePolicyDeferred: true,
      rollbackPolicyDeferred: true,
      committedArtifactsAllowed: false,
      signedUrlPersistenceAllowed: false,
      installerBundlingEnabled: false,
      autoUpdateEnabled: false,
      rollbackExecutionEnabled: false,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      modelLoadingEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      privatePathsExposed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks by default", () => {
    const result = evaluateModelLifecyclePreflight();

    expect(result).toMatchObject({
      capability: "model_lifecycle",
      compositionRoot: "apps/core-host",
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      committedArtifactsDetected: false,
      installerBundlingEnabled: false,
      autoUpdateEnabled: false,
      rollbackExecutionEnabled: false,
      filesystemWritesAllowed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Model manifest installation policy is not reviewed.",
        "Model artifact digest verification policy is not reviewed.",
        "A deterministic model lifecycle fixture executor is required."
      ])
    );
  });

  it("accepts only a review-complete, dry-run fixture boundary", () => {
    const result = evaluateModelLifecyclePreflight(approvedInput);

    expect(result).toMatchObject({
      capability: "model_lifecycle",
      status: "ready_for_fixture_contract",
      accepted: true,
      readyForFixtureContract: true,
      committedArtifactsDetected: false,
      signedUrlPersistenceEnabled: false,
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
      checks: {
        manifestPolicyReviewed: true,
        artifactDigestPolicyReviewed: true,
        licensePolicyReviewed: true,
        operationStateSanitizationReviewed: true,
        fixtureExecutorAvailable: true,
        windowsPackagePolicyDeferred: true,
        updatePolicyDeferred: true,
        rollbackPolicyDeferred: true,
        committedArtifactsAbsent: true,
        signedUrlPersistenceDisabled: true,
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
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks packaging, update, rollback, artifact, and privacy regressions", () => {
    const result = evaluateModelLifecyclePreflight({
      ...approvedInput,
      windowsPackagePolicyDeferred: false,
      updatePolicyDeferred: false,
      rollbackPolicyDeferred: false,
      committedArtifactsDetected: true,
      signedUrlPersistenceEnabled: true,
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
      fixtureExecutorAvailable: false,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      committedArtifactsDetected: false,
      signedUrlPersistenceEnabled: false,
      installerBundlingEnabled: false,
      autoUpdateEnabled: false,
      rollbackExecutionEnabled: false,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      modelLoadingEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      privatePathsExposed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Windows packaging policy remains a deferred gate.",
        "Automatic update policy remains a deferred gate.",
        "Upgrade and rollback policy remains a deferred gate.",
        "Committed model artifacts remain forbidden.",
        "Signed URL persistence remains disabled.",
        "Installer model/runtime bundling remains disabled.",
        "Automatic updates remain disabled.",
        "Rollback execution remains disabled.",
        "Filesystem lifecycle writes remain disabled in this wave.",
        "Network access remains disabled in this wave.",
        "Model lifecycle preparation must not require credentials.",
        "Model loading remains disabled in this wave.",
        "Provider registration remains deferred.",
        "Default provider opt-in remains disabled.",
        "Private filesystem paths must remain sanitized.",
        "A deterministic model lifecycle fixture executor is required.",
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

  it("keeps a degraded review blocked without echoing private input details", () => {
    const result = evaluateModelLifecyclePreflight({
      ...approvedInput,
      manifestPolicyReviewed: false,
      fixtureExecutorAvailable: false,
      verificationClean: false
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Model manifest installation policy is not reviewed.",
        "A deterministic model lifecycle fixture executor is required.",
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
