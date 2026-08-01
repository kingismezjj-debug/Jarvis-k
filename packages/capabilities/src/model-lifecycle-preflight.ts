export const MODEL_LIFECYCLE_COMPOSITION_ROOT = "apps/core-host" as const;

export type ModelLifecyclePreflightStatus =
  | "blocked"
  | "ready_for_fixture_contract";

export interface ModelLifecyclePreflightPolicy {
  capability: "model_lifecycle";
  compositionRoot: typeof MODEL_LIFECYCLE_COMPOSITION_ROOT;
  manifestPinningRequired: true;
  digestVerificationRequired: true;
  licenseReviewRequired: true;
  sanitizedOperationStateRequired: true;
  fixtureExecutorAllowed: true;
  windowsPackagePolicyDeferred: true;
  updatePolicyDeferred: true;
  rollbackPolicyDeferred: true;
  committedArtifactsAllowed: false;
  signedUrlPersistenceAllowed: false;
  installerBundlingEnabled: false;
  autoUpdateEnabled: false;
  rollbackExecutionEnabled: false;
  filesystemWritesAllowed: false;
  networkAccessAllowed: false;
  credentialsRequired: false;
  modelLoadingEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  privatePathsExposed: false;
}

export interface ModelLifecyclePreflightInput {
  manifestPolicyReviewed?: boolean;
  artifactDigestPolicyReviewed?: boolean;
  licensePolicyReviewed?: boolean;
  operationStateSanitizationReviewed?: boolean;
  fixtureExecutorAvailable?: boolean;
  windowsPackagePolicyDeferred?: boolean;
  updatePolicyDeferred?: boolean;
  rollbackPolicyDeferred?: boolean;
  committedArtifactsDetected?: boolean;
  signedUrlPersistenceEnabled?: boolean;
  installerBundlingEnabled?: boolean;
  autoUpdateEnabled?: boolean;
  rollbackExecutionEnabled?: boolean;
  filesystemWritesAllowed?: boolean;
  networkAccessAllowed?: boolean;
  credentialsRequired?: boolean;
  modelLoadingEnabled?: boolean;
  providerRegistrationEnabled?: boolean;
  defaultOptInEnabled?: boolean;
  privatePathsExposed?: boolean;
  verificationClean?: boolean;
}

export interface ModelLifecyclePreflightChecks {
  manifestPolicyReviewed: boolean;
  artifactDigestPolicyReviewed: boolean;
  licensePolicyReviewed: boolean;
  operationStateSanitizationReviewed: boolean;
  fixtureExecutorAvailable: boolean;
  windowsPackagePolicyDeferred: boolean;
  updatePolicyDeferred: boolean;
  rollbackPolicyDeferred: boolean;
  committedArtifactsAbsent: boolean;
  signedUrlPersistenceDisabled: boolean;
  installerBundlingDisabled: boolean;
  autoUpdateDisabled: boolean;
  rollbackExecutionDisabled: boolean;
  filesystemWritesDisabled: boolean;
  networkAccessDisabled: boolean;
  credentialsNotRequired: boolean;
  modelLoadingDisabled: boolean;
  providerRegistrationDisabled: boolean;
  defaultOptInDisabled: boolean;
  privatePathExposureDisabled: boolean;
  verificationClean: boolean;
}

export interface ModelLifecyclePreflightResult {
  capability: "model_lifecycle";
  compositionRoot: typeof MODEL_LIFECYCLE_COMPOSITION_ROOT;
  status: ModelLifecyclePreflightStatus;
  accepted: boolean;
  readyForFixtureContract: boolean;
  committedArtifactsDetected: false;
  signedUrlPersistenceEnabled: false;
  installerBundlingEnabled: false;
  autoUpdateEnabled: false;
  rollbackExecutionEnabled: false;
  filesystemWritesAllowed: false;
  networkAccessAllowed: false;
  credentialsRequired: false;
  modelLoadingEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  privatePathsExposed: false;
  checks: ModelLifecyclePreflightChecks;
  reasons: string[];
}

export function createModelLifecyclePreflightPolicy(): ModelLifecyclePreflightPolicy {
  return {
    capability: "model_lifecycle",
    compositionRoot: MODEL_LIFECYCLE_COMPOSITION_ROOT,
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
  };
}

export function evaluateModelLifecyclePreflight(
  input: ModelLifecyclePreflightInput = {}
): ModelLifecyclePreflightResult {
  const checks: ModelLifecyclePreflightChecks = {
    manifestPolicyReviewed: input.manifestPolicyReviewed === true,
    artifactDigestPolicyReviewed:
      input.artifactDigestPolicyReviewed === true,
    licensePolicyReviewed: input.licensePolicyReviewed === true,
    operationStateSanitizationReviewed:
      input.operationStateSanitizationReviewed === true,
    fixtureExecutorAvailable: input.fixtureExecutorAvailable === true,
    windowsPackagePolicyDeferred:
      input.windowsPackagePolicyDeferred === true,
    updatePolicyDeferred: input.updatePolicyDeferred === true,
    rollbackPolicyDeferred: input.rollbackPolicyDeferred === true,
    committedArtifactsAbsent: input.committedArtifactsDetected === false,
    signedUrlPersistenceDisabled:
      input.signedUrlPersistenceEnabled === false,
    installerBundlingDisabled: input.installerBundlingEnabled === false,
    autoUpdateDisabled: input.autoUpdateEnabled === false,
    rollbackExecutionDisabled: input.rollbackExecutionEnabled === false,
    filesystemWritesDisabled: input.filesystemWritesAllowed === false,
    networkAccessDisabled: input.networkAccessAllowed === false,
    credentialsNotRequired: input.credentialsRequired === false,
    modelLoadingDisabled: input.modelLoadingEnabled === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    privatePathExposureDisabled: input.privatePathsExposed === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    capability: "model_lifecycle",
    compositionRoot: MODEL_LIFECYCLE_COMPOSITION_ROOT,
    status: accepted ? "ready_for_fixture_contract" : "blocked",
    accepted,
    readyForFixtureContract: accepted,
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
    checks,
    reasons: createReasons(checks)
  };
}

function createReasons(checks: ModelLifecyclePreflightChecks): string[] {
  const reasons: string[] = [];

  if (!checks.manifestPolicyReviewed) {
    reasons.push("Model manifest installation policy is not reviewed.");
  }
  if (!checks.artifactDigestPolicyReviewed) {
    reasons.push("Model artifact digest verification policy is not reviewed.");
  }
  if (!checks.licensePolicyReviewed) {
    reasons.push("Model license and redistribution policy is not reviewed.");
  }
  if (!checks.operationStateSanitizationReviewed) {
    reasons.push("Model operation state sanitization is not reviewed.");
  }
  if (!checks.fixtureExecutorAvailable) {
    reasons.push("A deterministic model lifecycle fixture executor is required.");
  }
  if (!checks.windowsPackagePolicyDeferred) {
    reasons.push("Windows packaging policy remains a deferred gate.");
  }
  if (!checks.updatePolicyDeferred) {
    reasons.push("Automatic update policy remains a deferred gate.");
  }
  if (!checks.rollbackPolicyDeferred) {
    reasons.push("Upgrade and rollback policy remains a deferred gate.");
  }
  if (!checks.committedArtifactsAbsent) {
    reasons.push("Committed model artifacts remain forbidden.");
  }
  if (!checks.signedUrlPersistenceDisabled) {
    reasons.push("Signed URL persistence remains disabled.");
  }
  if (!checks.installerBundlingDisabled) {
    reasons.push("Installer model/runtime bundling remains disabled.");
  }
  if (!checks.autoUpdateDisabled) {
    reasons.push("Automatic updates remain disabled.");
  }
  if (!checks.rollbackExecutionDisabled) {
    reasons.push("Rollback execution remains disabled.");
  }
  if (!checks.filesystemWritesDisabled) {
    reasons.push("Filesystem lifecycle writes remain disabled in this wave.");
  }
  if (!checks.networkAccessDisabled) {
    reasons.push("Network access remains disabled in this wave.");
  }
  if (!checks.credentialsNotRequired) {
    reasons.push("Model lifecycle preparation must not require credentials.");
  }
  if (!checks.modelLoadingDisabled) {
    reasons.push("Model loading remains disabled in this wave.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Provider registration remains deferred.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Default provider opt-in remains disabled.");
  }
  if (!checks.privatePathExposureDisabled) {
    reasons.push("Private filesystem paths must remain sanitized.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
