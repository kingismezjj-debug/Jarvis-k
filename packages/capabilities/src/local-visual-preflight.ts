export type LocalVisualPreflightStatus =
  | "blocked"
  | "ready_for_fixture_contract";

export interface LocalVisualPreflightPolicy {
  ocrContractReviewed: true;
  screenCapturePortReviewed: true;
  visionPortReviewed: true;
  providerNeutralOnly: true;
  screenCapturePermissionPolicyDeferred: true;
  fixtureContractsAllowed: true;
  realOcrExecutionEnabled: false;
  screenCaptureExecutionEnabled: false;
  visionExecutionEnabled: false;
  realProviderRegistrationEnabled: false;
  modelLoadingEnabled: false;
  networkAccessAllowed: false;
  runtimeDependenciesIntroduced: false;
  rawPixelsPersisted: false;
  rawPixelsExposed: false;
  modelOutputCommandsEnabled: false;
  coreCompositionChanged: false;
  desktopIpcChanged: false;
  uiChanged: false;
}

export interface LocalVisualPreflightInput {
  ocrContractReviewed?: boolean;
  screenCapturePortReviewed?: boolean;
  visionPortReviewed?: boolean;
  providerNeutralOnly?: boolean;
  screenCapturePermissionPolicyDeferred?: boolean;
  fixtureOcrAvailable?: boolean;
  fixtureScreenCaptureAvailable?: boolean;
  fixtureVisionAvailable?: boolean;
  realOcrExecutionEnabled?: boolean;
  screenCaptureExecutionEnabled?: boolean;
  visionExecutionEnabled?: boolean;
  realProviderRegistrationEnabled?: boolean;
  modelLoadingEnabled?: boolean;
  networkAccessAllowed?: boolean;
  runtimeDependenciesIntroduced?: boolean;
  rawPixelsPersisted?: boolean;
  rawPixelsExposed?: boolean;
  modelOutputCommandsEnabled?: boolean;
  coreCompositionChanged?: boolean;
  desktopIpcChanged?: boolean;
  uiChanged?: boolean;
  verificationClean?: boolean;
}

export interface LocalVisualPreflightChecks {
  ocrContractReviewed: boolean;
  screenCapturePortReviewed: boolean;
  visionPortReviewed: boolean;
  providerNeutralOnly: boolean;
  screenCapturePermissionPolicyDeferred: boolean;
  fixtureOcrAvailable: boolean;
  fixtureScreenCaptureAvailable: boolean;
  fixtureVisionAvailable: boolean;
  realOcrExecutionDisabled: boolean;
  screenCaptureExecutionDisabled: boolean;
  visionExecutionDisabled: boolean;
  realProviderRegistrationDeferred: boolean;
  modelLoadingDisabled: boolean;
  networkAccessDisabled: boolean;
  runtimeDependenciesAbsent: boolean;
  rawPixelsPersistenceDisabled: boolean;
  rawPixelsExposureDisabled: boolean;
  modelOutputCommandsDisabled: boolean;
  coreCompositionUnchanged: boolean;
  desktopIpcUnchanged: boolean;
  uiUnchanged: boolean;
  verificationClean: boolean;
}

export interface LocalVisualPreflightResult {
  capability: "ocr_screen_vision";
  status: LocalVisualPreflightStatus;
  accepted: boolean;
  readyForFixtureContract: boolean;
  realOcrExecutionEnabled: false;
  screenCaptureExecutionEnabled: false;
  visionExecutionEnabled: false;
  realProviderRegistrationEnabled: false;
  modelLoadingEnabled: false;
  networkAccessAllowed: false;
  runtimeDependenciesIntroduced: false;
  rawPixelsPersisted: false;
  rawPixelsExposed: false;
  modelOutputCommandsEnabled: false;
  coreCompositionChanged: false;
  desktopIpcChanged: false;
  uiChanged: false;
  checks: LocalVisualPreflightChecks;
  reasons: string[];
}

export function createLocalVisualPreflightPolicy(): LocalVisualPreflightPolicy {
  return {
    ocrContractReviewed: true,
    screenCapturePortReviewed: true,
    visionPortReviewed: true,
    providerNeutralOnly: true,
    screenCapturePermissionPolicyDeferred: true,
    fixtureContractsAllowed: true,
    realOcrExecutionEnabled: false,
    screenCaptureExecutionEnabled: false,
    visionExecutionEnabled: false,
    realProviderRegistrationEnabled: false,
    modelLoadingEnabled: false,
    networkAccessAllowed: false,
    runtimeDependenciesIntroduced: false,
    rawPixelsPersisted: false,
    rawPixelsExposed: false,
    modelOutputCommandsEnabled: false,
    coreCompositionChanged: false,
    desktopIpcChanged: false,
    uiChanged: false
  };
}

export function evaluateLocalVisualPreflight(
  input: LocalVisualPreflightInput = {}
): LocalVisualPreflightResult {
  const checks: LocalVisualPreflightChecks = {
    ocrContractReviewed: input.ocrContractReviewed === true,
    screenCapturePortReviewed: input.screenCapturePortReviewed === true,
    visionPortReviewed: input.visionPortReviewed === true,
    providerNeutralOnly: input.providerNeutralOnly === true,
    screenCapturePermissionPolicyDeferred:
      input.screenCapturePermissionPolicyDeferred === true,
    fixtureOcrAvailable: input.fixtureOcrAvailable === true,
    fixtureScreenCaptureAvailable:
      input.fixtureScreenCaptureAvailable === true,
    fixtureVisionAvailable: input.fixtureVisionAvailable === true,
    realOcrExecutionDisabled: input.realOcrExecutionEnabled === false,
    screenCaptureExecutionDisabled:
      input.screenCaptureExecutionEnabled === false,
    visionExecutionDisabled: input.visionExecutionEnabled === false,
    realProviderRegistrationDeferred:
      input.realProviderRegistrationEnabled === false,
    modelLoadingDisabled: input.modelLoadingEnabled === false,
    networkAccessDisabled: input.networkAccessAllowed === false,
    runtimeDependenciesAbsent:
      input.runtimeDependenciesIntroduced === false,
    rawPixelsPersistenceDisabled: input.rawPixelsPersisted === false,
    rawPixelsExposureDisabled: input.rawPixelsExposed === false,
    modelOutputCommandsDisabled:
      input.modelOutputCommandsEnabled === false,
    coreCompositionUnchanged: input.coreCompositionChanged === false,
    desktopIpcUnchanged: input.desktopIpcChanged === false,
    uiUnchanged: input.uiChanged === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    capability: "ocr_screen_vision",
    status: accepted ? "ready_for_fixture_contract" : "blocked",
    accepted,
    readyForFixtureContract: accepted,
    realOcrExecutionEnabled: false,
    screenCaptureExecutionEnabled: false,
    visionExecutionEnabled: false,
    realProviderRegistrationEnabled: false,
    modelLoadingEnabled: false,
    networkAccessAllowed: false,
    runtimeDependenciesIntroduced: false,
    rawPixelsPersisted: false,
    rawPixelsExposed: false,
    modelOutputCommandsEnabled: false,
    coreCompositionChanged: false,
    desktopIpcChanged: false,
    uiChanged: false,
    checks,
    reasons: createReasons(checks)
  };
}

function createReasons(checks: LocalVisualPreflightChecks): string[] {
  const reasons: string[] = [];

  if (!checks.ocrContractReviewed) {
    reasons.push("OCR contract review is not complete.");
  }
  if (!checks.screenCapturePortReviewed) {
    reasons.push("Screen capture port review is not complete.");
  }
  if (!checks.visionPortReviewed) {
    reasons.push("Vision analysis port review is not complete.");
  }
  if (!checks.providerNeutralOnly) {
    reasons.push("OCR, screen capture, and vision preparation must remain provider-neutral.");
  }
  if (!checks.screenCapturePermissionPolicyDeferred) {
    reasons.push("Screen capture permission policy remains a deferred gate.");
  }
  if (!checks.fixtureOcrAvailable) {
    reasons.push("A deterministic OCR fixture contract is required.");
  }
  if (!checks.fixtureScreenCaptureAvailable) {
    reasons.push("A deterministic screen capture fixture contract is required.");
  }
  if (!checks.fixtureVisionAvailable) {
    reasons.push("A deterministic vision fixture contract is required.");
  }
  if (!checks.realOcrExecutionDisabled) {
    reasons.push("Real OCR execution remains disabled.");
  }
  if (!checks.screenCaptureExecutionDisabled) {
    reasons.push("Real screen capture execution remains disabled.");
  }
  if (!checks.visionExecutionDisabled) {
    reasons.push("Real vision execution remains disabled.");
  }
  if (!checks.realProviderRegistrationDeferred) {
    reasons.push("Real OCR and vision provider registration remains deferred.");
  }
  if (!checks.modelLoadingDisabled) {
    reasons.push("Visual model loading remains disabled.");
  }
  if (!checks.networkAccessDisabled) {
    reasons.push("Visual preparation must not access the network.");
  }
  if (!checks.runtimeDependenciesAbsent) {
    reasons.push("Visual runtime dependencies remain deferred.");
  }
  if (!checks.rawPixelsPersistenceDisabled) {
    reasons.push("Raw screen pixels must not be persisted in this wave.");
  }
  if (!checks.rawPixelsExposureDisabled) {
    reasons.push("Raw screen pixels must not be exposed by observations.");
  }
  if (!checks.modelOutputCommandsDisabled) {
    reasons.push("Vision output must not become an operating-system command.");
  }
  if (!checks.coreCompositionUnchanged) {
    reasons.push("Core composition changes are deferred in this wave.");
  }
  if (!checks.desktopIpcUnchanged) {
    reasons.push("Desktop IPC changes are deferred in this wave.");
  }
  if (!checks.uiUnchanged) {
    reasons.push("UI changes are deferred in this wave.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
