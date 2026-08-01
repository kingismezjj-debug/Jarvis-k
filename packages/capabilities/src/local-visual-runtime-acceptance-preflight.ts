import {
  LOCAL_VISUAL_COMPOSITION_ROOT,
  LOCAL_VISUAL_PROVIDER_ID
} from "./local-visual-runtime-isolation";

export type LocalVisualRuntimeAcceptancePreflightStatus =
  | "blocked"
  | "ready_for_runtime_backed_capture";

export interface LocalVisualRuntimeAcceptancePreflightPolicy {
  capability: "ocr_screen_vision";
  provider: typeof LOCAL_VISUAL_PROVIDER_ID;
  compositionRoot: typeof LOCAL_VISUAL_COMPOSITION_ROOT;
  fixtureBenchmarkRequired: true;
  runtimeIsolationRequired: true;
  licenseReviewDeferred: true;
  packagingReviewDeferred: true;
  nativeDependencyReviewDeferred: true;
  privacyReviewDeferred: true;
  benchmarkValuesCaptured: false;
  metricValuesExposed: false;
  networkAccessAllowed: false;
  credentialsRequired: false;
  runtimeDependenciesIntroduced: false;
  modelDownloadsEnabled: false;
  modelLoadingEnabled: false;
  ocrExecutionEnabled: false;
  screenCaptureExecutionEnabled: false;
  visionExecutionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  rawPixelsPersisted: false;
  rawPixelsExposed: false;
  modelOutputCommandsEnabled: false;
  executionEnablementApproved: false;
}

export interface LocalVisualRuntimeAcceptancePreflightInput {
  fixtureBenchmarkPlanReviewed?: boolean;
  runtimeIsolationAccepted?: boolean;
  licenseReviewDeferred?: boolean;
  packagingReviewDeferred?: boolean;
  nativeDependencyReviewDeferred?: boolean;
  privacyReviewDeferred?: boolean;
  benchmarkValuesCaptured?: boolean;
  metricValuesExposed?: boolean;
  networkAccessAllowed?: boolean;
  credentialsRequired?: boolean;
  runtimeDependenciesIntroduced?: boolean;
  modelDownloadsEnabled?: boolean;
  modelLoadingEnabled?: boolean;
  ocrExecutionEnabled?: boolean;
  screenCaptureExecutionEnabled?: boolean;
  visionExecutionEnabled?: boolean;
  providerRegistrationEnabled?: boolean;
  defaultOptInEnabled?: boolean;
  rawPixelsPersisted?: boolean;
  rawPixelsExposed?: boolean;
  modelOutputCommandsEnabled?: boolean;
  executionEnablementApproved?: boolean;
  verificationClean?: boolean;
}

export interface LocalVisualRuntimeAcceptancePreflightChecks {
  fixtureBenchmarkPlanReviewed: boolean;
  runtimeIsolationAccepted: boolean;
  licenseReviewDeferred: boolean;
  packagingReviewDeferred: boolean;
  nativeDependencyReviewDeferred: boolean;
  privacyReviewDeferred: boolean;
  benchmarkValuesPending: boolean;
  metricValuesExposureDisabled: boolean;
  networkAccessDisabled: boolean;
  credentialsNotRequired: boolean;
  runtimeDependenciesAbsent: boolean;
  modelDownloadsDisabled: boolean;
  modelLoadingDisabled: boolean;
  ocrExecutionDisabled: boolean;
  screenCaptureExecutionDisabled: boolean;
  visionExecutionDisabled: boolean;
  providerRegistrationDisabled: boolean;
  defaultOptInDisabled: boolean;
  rawPixelsPersistenceDisabled: boolean;
  rawPixelsExposureDisabled: boolean;
  modelOutputCommandsDisabled: boolean;
  executionEnablementDeferred: boolean;
  verificationClean: boolean;
}

export interface LocalVisualRuntimeAcceptancePreflightResult {
  capability: "ocr_screen_vision";
  provider: typeof LOCAL_VISUAL_PROVIDER_ID;
  runtime: "provider_local_pending";
  compositionRoot: typeof LOCAL_VISUAL_COMPOSITION_ROOT;
  status: LocalVisualRuntimeAcceptancePreflightStatus;
  accepted: boolean;
  readyForRuntimeBackedCapture: boolean;
  benchmarkValuesCaptured: false;
  metricValuesExposed: false;
  networkAccessAllowed: false;
  credentialsRequired: false;
  runtimeDependenciesIntroduced: false;
  modelDownloadsEnabled: false;
  modelLoadingEnabled: false;
  ocrExecutionEnabled: false;
  screenCaptureExecutionEnabled: false;
  visionExecutionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  rawPixelsPersisted: false;
  rawPixelsExposed: false;
  modelOutputCommandsEnabled: false;
  executionEnablementApproved: false;
  checks: LocalVisualRuntimeAcceptancePreflightChecks;
  reasons: string[];
}

export function createLocalVisualRuntimeAcceptancePreflightPolicy(): LocalVisualRuntimeAcceptancePreflightPolicy {
  return {
    capability: "ocr_screen_vision",
    provider: LOCAL_VISUAL_PROVIDER_ID,
    compositionRoot: LOCAL_VISUAL_COMPOSITION_ROOT,
    fixtureBenchmarkRequired: true,
    runtimeIsolationRequired: true,
    licenseReviewDeferred: true,
    packagingReviewDeferred: true,
    nativeDependencyReviewDeferred: true,
    privacyReviewDeferred: true,
    benchmarkValuesCaptured: false,
    metricValuesExposed: false,
    networkAccessAllowed: false,
    credentialsRequired: false,
    runtimeDependenciesIntroduced: false,
    modelDownloadsEnabled: false,
    modelLoadingEnabled: false,
    ocrExecutionEnabled: false,
    screenCaptureExecutionEnabled: false,
    visionExecutionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    rawPixelsPersisted: false,
    rawPixelsExposed: false,
    modelOutputCommandsEnabled: false,
    executionEnablementApproved: false
  };
}

export function evaluateLocalVisualRuntimeAcceptancePreflight(
  input: LocalVisualRuntimeAcceptancePreflightInput = {}
): LocalVisualRuntimeAcceptancePreflightResult {
  const checks: LocalVisualRuntimeAcceptancePreflightChecks = {
    fixtureBenchmarkPlanReviewed:
      input.fixtureBenchmarkPlanReviewed === true,
    runtimeIsolationAccepted: input.runtimeIsolationAccepted === true,
    licenseReviewDeferred: input.licenseReviewDeferred === true,
    packagingReviewDeferred: input.packagingReviewDeferred === true,
    nativeDependencyReviewDeferred:
      input.nativeDependencyReviewDeferred === true,
    privacyReviewDeferred: input.privacyReviewDeferred === true,
    benchmarkValuesPending: input.benchmarkValuesCaptured === false,
    metricValuesExposureDisabled: input.metricValuesExposed === false,
    networkAccessDisabled: input.networkAccessAllowed === false,
    credentialsNotRequired: input.credentialsRequired === false,
    runtimeDependenciesAbsent:
      input.runtimeDependenciesIntroduced === false,
    modelDownloadsDisabled: input.modelDownloadsEnabled === false,
    modelLoadingDisabled: input.modelLoadingEnabled === false,
    ocrExecutionDisabled: input.ocrExecutionEnabled === false,
    screenCaptureExecutionDisabled:
      input.screenCaptureExecutionEnabled === false,
    visionExecutionDisabled: input.visionExecutionEnabled === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    rawPixelsPersistenceDisabled: input.rawPixelsPersisted === false,
    rawPixelsExposureDisabled: input.rawPixelsExposed === false,
    modelOutputCommandsDisabled:
      input.modelOutputCommandsEnabled === false,
    executionEnablementDeferred:
      input.executionEnablementApproved === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    capability: "ocr_screen_vision",
    provider: LOCAL_VISUAL_PROVIDER_ID,
    runtime: "provider_local_pending",
    compositionRoot: LOCAL_VISUAL_COMPOSITION_ROOT,
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
    ocrExecutionEnabled: false,
    screenCaptureExecutionEnabled: false,
    visionExecutionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    rawPixelsPersisted: false,
    rawPixelsExposed: false,
    modelOutputCommandsEnabled: false,
    executionEnablementApproved: false,
    checks,
    reasons: createReasons(checks)
  };
}

function createReasons(
  checks: LocalVisualRuntimeAcceptancePreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.fixtureBenchmarkPlanReviewed) {
    reasons.push("Fixture visual benchmark plan is not reviewed.");
  }
  if (!checks.runtimeIsolationAccepted) {
    reasons.push("Local visual runtime isolation has not reached its approval boundary.");
  }
  if (!checks.licenseReviewDeferred) {
    reasons.push("Visual runtime license review remains a deferred gate.");
  }
  if (!checks.packagingReviewDeferred) {
    reasons.push("Visual runtime Windows packaging review remains a deferred gate.");
  }
  if (!checks.nativeDependencyReviewDeferred) {
    reasons.push("Visual runtime native dependency review remains a deferred gate.");
  }
  if (!checks.privacyReviewDeferred) {
    reasons.push("Screen capture privacy and permission review remains a deferred gate.");
  }
  if (!checks.benchmarkValuesPending) {
    reasons.push("Real visual benchmark values must remain pending.");
  }
  if (!checks.metricValuesExposureDisabled) {
    reasons.push("Visual benchmark metric values must remain unexposed.");
  }
  if (!checks.networkAccessDisabled) {
    reasons.push("Network access must remain disabled for visual acceptance preparation.");
  }
  if (!checks.credentialsNotRequired) {
    reasons.push("Visual acceptance preparation must not require credentials.");
  }
  if (!checks.runtimeDependenciesAbsent) {
    reasons.push("Visual runtime dependencies remain deferred.");
  }
  if (!checks.modelDownloadsDisabled) {
    reasons.push("Visual model downloads remain disabled.");
  }
  if (!checks.modelLoadingDisabled) {
    reasons.push("Visual model loading remains disabled.");
  }
  if (!checks.ocrExecutionDisabled) {
    reasons.push("Real OCR execution remains disabled.");
  }
  if (!checks.screenCaptureExecutionDisabled) {
    reasons.push("Real screen capture execution remains disabled.");
  }
  if (!checks.visionExecutionDisabled) {
    reasons.push("Real vision execution remains disabled.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Visual provider registration remains deferred.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Visual default opt-in remains disabled.");
  }
  if (!checks.rawPixelsPersistenceDisabled) {
    reasons.push("Raw screen pixels must not be persisted.");
  }
  if (!checks.rawPixelsExposureDisabled) {
    reasons.push("Raw screen pixels must not be exposed.");
  }
  if (!checks.modelOutputCommandsDisabled) {
    reasons.push("Vision output must not become an operating-system command.");
  }
  if (!checks.executionEnablementDeferred) {
    reasons.push("Visual execution enablement remains deferred.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
