export const DEVELOPER_ALPHA_HARDENING_COMPOSITION_ROOT =
  "apps/core-host" as const;

export type DeveloperAlphaHardeningPreflightStatus =
  | "blocked"
  | "ready_for_fixture_hardening";

export interface DeveloperAlphaHardeningPreflightPolicy {
  capability: "developer_alpha_hardening";
  compositionRoot: typeof DEVELOPER_ALPHA_HARDENING_COMPOSITION_ROOT;
  modelLifecyclePreflightRequired: true;
  fixtureHarnessRequired: true;
  sanitizedDiagnosticsRequired: true;
  boundedOperationStateRequired: true;
  restartRecoveryObservationRequired: true;
  fixtureFallbackRequired: true;
  windowsPackagePolicyDeferred: true;
  updatePolicyDeferred: true;
  rollbackPolicyDeferred: true;
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
  rawDiagnosticsExposed: false;
  modelOutputCommandsEnabled: false;
  coreHostCompositionChanged: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
}

export interface DeveloperAlphaHardeningPreflightInput {
  hardeningPlanReviewed?: boolean;
  modelLifecyclePreflightAccepted?: boolean;
  fixtureHarnessAvailable?: boolean;
  sanitizedDiagnosticsReviewed?: boolean;
  boundedOperationStateReviewed?: boolean;
  restartRecoveryObservationReviewed?: boolean;
  fixtureFallbackAvailable?: boolean;
  windowsPackagePolicyDeferred?: boolean;
  updatePolicyDeferred?: boolean;
  rollbackPolicyDeferred?: boolean;
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
  rawDiagnosticsExposed?: boolean;
  modelOutputCommandsEnabled?: boolean;
  coreHostCompositionChanged?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  verificationClean?: boolean;
}

export interface DeveloperAlphaHardeningPreflightChecks {
  hardeningPlanReviewed: boolean;
  modelLifecyclePreflightAccepted: boolean;
  fixtureHarnessAvailable: boolean;
  sanitizedDiagnosticsReviewed: boolean;
  boundedOperationStateReviewed: boolean;
  restartRecoveryObservationReviewed: boolean;
  fixtureFallbackAvailable: boolean;
  windowsPackagePolicyDeferred: boolean;
  updatePolicyDeferred: boolean;
  rollbackPolicyDeferred: boolean;
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
  rawDiagnosticsExposureDisabled: boolean;
  modelOutputCommandsDisabled: boolean;
  coreHostCompositionUnchanged: boolean;
  desktopIpcUnchanged: boolean;
  uiBehaviorUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  verificationClean: boolean;
}

export interface DeveloperAlphaHardeningPreflightResult {
  capability: "developer_alpha_hardening";
  compositionRoot: typeof DEVELOPER_ALPHA_HARDENING_COMPOSITION_ROOT;
  status: DeveloperAlphaHardeningPreflightStatus;
  accepted: boolean;
  readyForFixtureHardening: boolean;
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
  rawDiagnosticsExposed: false;
  modelOutputCommandsEnabled: false;
  coreHostCompositionChanged: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  checks: DeveloperAlphaHardeningPreflightChecks;
  reasons: string[];
}

export function createDeveloperAlphaHardeningPreflightPolicy(): DeveloperAlphaHardeningPreflightPolicy {
  return {
    capability: "developer_alpha_hardening",
    compositionRoot: DEVELOPER_ALPHA_HARDENING_COMPOSITION_ROOT,
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
  };
}

export function evaluateDeveloperAlphaHardeningPreflight(
  input: DeveloperAlphaHardeningPreflightInput = {}
): DeveloperAlphaHardeningPreflightResult {
  const checks: DeveloperAlphaHardeningPreflightChecks = {
    hardeningPlanReviewed: input.hardeningPlanReviewed === true,
    modelLifecyclePreflightAccepted:
      input.modelLifecyclePreflightAccepted === true,
    fixtureHarnessAvailable: input.fixtureHarnessAvailable === true,
    sanitizedDiagnosticsReviewed:
      input.sanitizedDiagnosticsReviewed === true,
    boundedOperationStateReviewed:
      input.boundedOperationStateReviewed === true,
    restartRecoveryObservationReviewed:
      input.restartRecoveryObservationReviewed === true,
    fixtureFallbackAvailable: input.fixtureFallbackAvailable === true,
    windowsPackagePolicyDeferred:
      input.windowsPackagePolicyDeferred === true,
    updatePolicyDeferred: input.updatePolicyDeferred === true,
    rollbackPolicyDeferred: input.rollbackPolicyDeferred === true,
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
    rawDiagnosticsExposureDisabled: input.rawDiagnosticsExposed === false,
    modelOutputCommandsDisabled:
      input.modelOutputCommandsEnabled === false,
    coreHostCompositionUnchanged:
      input.coreHostCompositionChanged === false,
    desktopIpcUnchanged: input.desktopIpcChanged === false,
    uiBehaviorUnchanged: input.uiBehaviorChanged === false,
    providerVisibilityUnchanged:
      input.providerVisibilityChanged === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    capability: "developer_alpha_hardening",
    compositionRoot: DEVELOPER_ALPHA_HARDENING_COMPOSITION_ROOT,
    status: accepted ? "ready_for_fixture_hardening" : "blocked",
    accepted,
    readyForFixtureHardening: accepted,
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
    checks,
    reasons: createReasons(checks)
  };
}

function createReasons(
  checks: DeveloperAlphaHardeningPreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.hardeningPlanReviewed) {
    reasons.push("Developer-alpha hardening plan is not reviewed.");
  }
  if (!checks.modelLifecyclePreflightAccepted) {
    reasons.push("Model lifecycle preflight has not reached its fixture boundary.");
  }
  if (!checks.fixtureHarnessAvailable) {
    reasons.push("A deterministic developer-alpha fixture harness is required.");
  }
  if (!checks.sanitizedDiagnosticsReviewed) {
    reasons.push("Sanitized diagnostics behavior is not reviewed.");
  }
  if (!checks.boundedOperationStateReviewed) {
    reasons.push("Bounded operation-state behavior is not reviewed.");
  }
  if (!checks.restartRecoveryObservationReviewed) {
    reasons.push("Restart recovery observation is not reviewed.");
  }
  if (!checks.fixtureFallbackAvailable) {
    reasons.push("Fixture providers must remain available as the fallback path.");
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
  if (!checks.installerBundlingDisabled) {
    reasons.push("Installer bundling remains disabled in this wave.");
  }
  if (!checks.autoUpdateDisabled) {
    reasons.push("Automatic updates remain disabled in this wave.");
  }
  if (!checks.rollbackExecutionDisabled) {
    reasons.push("Rollback execution remains disabled in this wave.");
  }
  if (!checks.filesystemWritesDisabled) {
    reasons.push("Filesystem lifecycle writes remain disabled in this wave.");
  }
  if (!checks.networkAccessDisabled) {
    reasons.push("Network access remains disabled in this wave.");
  }
  if (!checks.credentialsNotRequired) {
    reasons.push("Developer-alpha hardening must not require credentials.");
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
  if (!checks.rawDiagnosticsExposureDisabled) {
    reasons.push("Raw diagnostics must remain unexposed.");
  }
  if (!checks.modelOutputCommandsDisabled) {
    reasons.push("Model output must not become an operating-system command.");
  }
  if (!checks.coreHostCompositionUnchanged) {
    reasons.push("Core Host composition must remain unchanged in this wave.");
  }
  if (!checks.desktopIpcUnchanged) {
    reasons.push("Desktop IPC must remain unchanged in this wave.");
  }
  if (!checks.uiBehaviorUnchanged) {
    reasons.push("UI behavior must remain unchanged in this wave.");
  }
  if (!checks.providerVisibilityUnchanged) {
    reasons.push("Provider visibility must remain unchanged in this wave.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
