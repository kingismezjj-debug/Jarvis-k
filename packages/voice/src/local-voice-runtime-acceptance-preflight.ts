import {
  LOCAL_VOICE_COMPOSITION_ROOT,
  LOCAL_VOICE_PROVIDER_ID
} from "./local-voice-contract";

export type LocalVoiceRuntimeAcceptancePreflightStatus =
  | "blocked"
  | "ready_for_runtime_backed_capture";

export interface LocalVoiceRuntimeAcceptancePreflightPolicy {
  provider: typeof LOCAL_VOICE_PROVIDER_ID;
  compositionRoot: typeof LOCAL_VOICE_COMPOSITION_ROOT;
  fixtureBenchmarkRequired: true;
  runtimeIsolationRequired: true;
  licenseReviewDeferred: true;
  packagingReviewDeferred: true;
  nativeDependencyReviewDeferred: true;
  benchmarkValuesCaptured: false;
  metricValuesExposed: false;
  networkAccessAllowed: false;
  credentialsRequired: false;
  runtimeDependenciesIntroduced: false;
  modelDownloadsEnabled: false;
  modelLoadingEnabled: false;
  audioExecutionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  executionEnablementApproved: false;
}

export interface LocalVoiceRuntimeAcceptancePreflightInput {
  fixtureBenchmarkPlanReviewed?: boolean;
  runtimeIsolationAccepted?: boolean;
  licenseReviewDeferred?: boolean;
  packagingReviewDeferred?: boolean;
  nativeDependencyReviewDeferred?: boolean;
  benchmarkValuesCaptured?: boolean;
  metricValuesExposed?: boolean;
  networkAccessAllowed?: boolean;
  credentialsRequired?: boolean;
  runtimeDependenciesIntroduced?: boolean;
  modelDownloadsEnabled?: boolean;
  modelLoadingEnabled?: boolean;
  audioExecutionEnabled?: boolean;
  providerRegistrationEnabled?: boolean;
  defaultOptInEnabled?: boolean;
  executionEnablementApproved?: boolean;
  verificationClean?: boolean;
}

export interface LocalVoiceRuntimeAcceptancePreflightChecks {
  fixtureBenchmarkPlanReviewed: boolean;
  runtimeIsolationAccepted: boolean;
  licenseReviewDeferred: boolean;
  packagingReviewDeferred: boolean;
  nativeDependencyReviewDeferred: boolean;
  benchmarkValuesPending: boolean;
  metricValuesExposureDisabled: boolean;
  networkAccessDisabled: boolean;
  credentialsNotRequired: boolean;
  runtimeDependenciesAbsent: boolean;
  modelDownloadsDisabled: boolean;
  modelLoadingDisabled: boolean;
  audioExecutionDisabled: boolean;
  providerRegistrationDisabled: boolean;
  defaultOptInDisabled: boolean;
  executionEnablementDeferred: boolean;
  verificationClean: boolean;
}

export interface LocalVoiceRuntimeAcceptancePreflightResult {
  capability: "voice";
  provider: typeof LOCAL_VOICE_PROVIDER_ID;
  runtime: "provider_local_pending";
  compositionRoot: typeof LOCAL_VOICE_COMPOSITION_ROOT;
  status: LocalVoiceRuntimeAcceptancePreflightStatus;
  accepted: boolean;
  readyForRuntimeBackedCapture: boolean;
  benchmarkValuesCaptured: false;
  metricValuesExposed: false;
  networkAccessAllowed: false;
  credentialsRequired: false;
  runtimeDependenciesIntroduced: false;
  modelDownloadsEnabled: false;
  modelLoadingEnabled: false;
  audioExecutionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  executionEnablementApproved: false;
  checks: LocalVoiceRuntimeAcceptancePreflightChecks;
  reasons: string[];
}

export function createLocalVoiceRuntimeAcceptancePreflightPolicy(): LocalVoiceRuntimeAcceptancePreflightPolicy {
  return {
    provider: LOCAL_VOICE_PROVIDER_ID,
    compositionRoot: LOCAL_VOICE_COMPOSITION_ROOT,
    fixtureBenchmarkRequired: true,
    runtimeIsolationRequired: true,
    licenseReviewDeferred: true,
    packagingReviewDeferred: true,
    nativeDependencyReviewDeferred: true,
    benchmarkValuesCaptured: false,
    metricValuesExposed: false,
    networkAccessAllowed: false,
    credentialsRequired: false,
    runtimeDependenciesIntroduced: false,
    modelDownloadsEnabled: false,
    modelLoadingEnabled: false,
    audioExecutionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    executionEnablementApproved: false
  };
}

export function evaluateLocalVoiceRuntimeAcceptancePreflight(
  input: LocalVoiceRuntimeAcceptancePreflightInput = {}
): LocalVoiceRuntimeAcceptancePreflightResult {
  const checks: LocalVoiceRuntimeAcceptancePreflightChecks = {
    fixtureBenchmarkPlanReviewed:
      input.fixtureBenchmarkPlanReviewed === true,
    runtimeIsolationAccepted: input.runtimeIsolationAccepted === true,
    licenseReviewDeferred: input.licenseReviewDeferred === true,
    packagingReviewDeferred: input.packagingReviewDeferred === true,
    nativeDependencyReviewDeferred:
      input.nativeDependencyReviewDeferred === true,
    benchmarkValuesPending: input.benchmarkValuesCaptured === false,
    metricValuesExposureDisabled: input.metricValuesExposed === false,
    networkAccessDisabled: input.networkAccessAllowed === false,
    credentialsNotRequired: input.credentialsRequired === false,
    runtimeDependenciesAbsent: input.runtimeDependenciesIntroduced === false,
    modelDownloadsDisabled: input.modelDownloadsEnabled === false,
    modelLoadingDisabled: input.modelLoadingEnabled === false,
    audioExecutionDisabled: input.audioExecutionEnabled === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    executionEnablementDeferred:
      input.executionEnablementApproved === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    capability: "voice",
    provider: LOCAL_VOICE_PROVIDER_ID,
    runtime: "provider_local_pending",
    compositionRoot: LOCAL_VOICE_COMPOSITION_ROOT,
    status: accepted
      ? "ready_for_runtime_backed_capture"
      : "blocked",
    accepted,
    readyForRuntimeBackedCapture: accepted,
    benchmarkValuesCaptured: false,
    metricValuesExposed: false,
    networkAccessAllowed: false,
    credentialsRequired: false,
    runtimeDependenciesIntroduced: false,
    modelDownloadsEnabled: false,
    modelLoadingEnabled: false,
    audioExecutionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    executionEnablementApproved: false,
    checks,
    reasons: createReasons(checks)
  };
}

function createReasons(
  checks: LocalVoiceRuntimeAcceptancePreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.fixtureBenchmarkPlanReviewed) {
    reasons.push("Fixture voice benchmark plan is not reviewed.");
  }
  if (!checks.runtimeIsolationAccepted) {
    reasons.push("Local voice runtime isolation has not reached its approval boundary.");
  }
  if (!checks.licenseReviewDeferred) {
    reasons.push("Voice runtime license review remains a deferred gate.");
  }
  if (!checks.packagingReviewDeferred) {
    reasons.push("Voice runtime Windows packaging review remains a deferred gate.");
  }
  if (!checks.nativeDependencyReviewDeferred) {
    reasons.push("Voice runtime native dependency review remains a deferred gate.");
  }
  if (!checks.benchmarkValuesPending) {
    reasons.push("Real voice benchmark values must remain pending.");
  }
  if (!checks.metricValuesExposureDisabled) {
    reasons.push("Voice benchmark metric values must remain unexposed.");
  }
  if (!checks.networkAccessDisabled) {
    reasons.push("Network access must remain disabled for voice acceptance preparation.");
  }
  if (!checks.credentialsNotRequired) {
    reasons.push("Voice acceptance preparation must not require credentials.");
  }
  if (!checks.runtimeDependenciesAbsent) {
    reasons.push("Voice runtime dependencies remain deferred.");
  }
  if (!checks.modelDownloadsDisabled) {
    reasons.push("Voice model downloads remain disabled.");
  }
  if (!checks.modelLoadingDisabled) {
    reasons.push("Voice model loading remains disabled.");
  }
  if (!checks.audioExecutionDisabled) {
    reasons.push("Voice audio execution remains disabled.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Voice provider registration remains deferred.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Voice default opt-in remains disabled.");
  }
  if (!checks.executionEnablementDeferred) {
    reasons.push("Voice execution enablement remains deferred.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
