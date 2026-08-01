export const LOCAL_VISUAL_PROVIDER_ID = "visual.local.pending" as const;
export const LOCAL_VISUAL_RUNTIME_PACKAGE_NAME =
  "@jarvis-k/visual-runtime-local" as const;
export const LOCAL_VISUAL_RUNTIME_PACKAGE_LOCATION =
  "packages/visual-runtime-local" as const;
export const LOCAL_VISUAL_COMPOSITION_ROOT = "apps/core-host" as const;

export type LocalVisualRuntimeIsolationStatus =
  | "blocked"
  | "ready_for_runtime_dependency_approval";

export interface LocalVisualRuntimeAdapterDescriptor {
  runtime: "provider_local_pending";
  provider: typeof LOCAL_VISUAL_PROVIDER_ID;
  capabilities: readonly ["ocr", "vision"];
  packageName: typeof LOCAL_VISUAL_RUNTIME_PACKAGE_NAME;
  packageLocation: typeof LOCAL_VISUAL_RUNTIME_PACKAGE_LOCATION;
  compositionRoot: typeof LOCAL_VISUAL_COMPOSITION_ROOT;
  adapterOnlySurfaceRequired: true;
  supervisedChildProcessRequired: true;
  privateIpcRequired: true;
  resourceLeaseRequired: true;
  sanitizedErrorsRequired: true;
  fixtureFallbackRequired: true;
  screenCapturePermissionBoundaryRequired: true;
  executionEnabled: false;
}

export interface LocalVisualRuntimeIsolationPolicy {
  runtime: "provider_local_pending";
  provider: typeof LOCAL_VISUAL_PROVIDER_ID;
  packageName: typeof LOCAL_VISUAL_RUNTIME_PACKAGE_NAME;
  packageLocation: typeof LOCAL_VISUAL_RUNTIME_PACKAGE_LOCATION;
  compositionRoot: typeof LOCAL_VISUAL_COMPOSITION_ROOT;
  adapterOnlySurfaceRequired: true;
  supervisedChildProcessRequired: true;
  privateIpcRequired: true;
  resourceLeaseRequired: true;
  sanitizedErrorsRequired: true;
  fixtureFallbackRequired: true;
  screenCapturePermissionBoundaryRequired: true;
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
  implementationValuesExposed: false;
}

export interface LocalVisualRuntimeIsolationInput {
  descriptor?: unknown;
  packageBoundaryApproved?: boolean;
  helperProtocolApproved?: boolean;
  resourceLeaseApproved?: boolean;
  sanitizedErrorsApproved?: boolean;
  screenCapturePermissionBoundaryApproved?: boolean;
  fixtureFallbackAvailable?: boolean;
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
  verificationClean?: boolean;
}

export interface LocalVisualRuntimeIsolationChecks {
  descriptorValid: boolean;
  descriptorMatchesPolicy: boolean;
  packageBoundaryApproved: boolean;
  helperProtocolApproved: boolean;
  resourceLeaseApproved: boolean;
  sanitizedErrorsApproved: boolean;
  screenCapturePermissionBoundaryApproved: boolean;
  fixtureFallbackAvailable: boolean;
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
  verificationClean: boolean;
}

export interface LocalVisualRuntimeIsolationResult {
  capability: "ocr_screen_vision";
  provider: typeof LOCAL_VISUAL_PROVIDER_ID;
  runtime: "provider_local_pending";
  packageName: typeof LOCAL_VISUAL_RUNTIME_PACKAGE_NAME;
  packageLocation: typeof LOCAL_VISUAL_RUNTIME_PACKAGE_LOCATION;
  compositionRoot: typeof LOCAL_VISUAL_COMPOSITION_ROOT;
  status: LocalVisualRuntimeIsolationStatus;
  accepted: boolean;
  readyForRuntimeDependencyApproval: boolean;
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
  implementationValuesExposed: false;
  checks: LocalVisualRuntimeIsolationChecks;
  reasons: string[];
}

export function createLocalVisualRuntimeAdapterDescriptor(): LocalVisualRuntimeAdapterDescriptor {
  return {
    runtime: "provider_local_pending",
    provider: LOCAL_VISUAL_PROVIDER_ID,
    capabilities: ["ocr", "vision"],
    packageName: LOCAL_VISUAL_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_VISUAL_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_VISUAL_COMPOSITION_ROOT,
    adapterOnlySurfaceRequired: true,
    supervisedChildProcessRequired: true,
    privateIpcRequired: true,
    resourceLeaseRequired: true,
    sanitizedErrorsRequired: true,
    fixtureFallbackRequired: true,
    screenCapturePermissionBoundaryRequired: true,
    executionEnabled: false
  };
}

export function createLocalVisualRuntimeIsolationPolicy(): LocalVisualRuntimeIsolationPolicy {
  return {
    runtime: "provider_local_pending",
    provider: LOCAL_VISUAL_PROVIDER_ID,
    packageName: LOCAL_VISUAL_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_VISUAL_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_VISUAL_COMPOSITION_ROOT,
    adapterOnlySurfaceRequired: true,
    supervisedChildProcessRequired: true,
    privateIpcRequired: true,
    resourceLeaseRequired: true,
    sanitizedErrorsRequired: true,
    fixtureFallbackRequired: true,
    screenCapturePermissionBoundaryRequired: true,
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
    implementationValuesExposed: false
  };
}

export function evaluateLocalVisualRuntimeIsolation(
  input: LocalVisualRuntimeIsolationInput = {}
): LocalVisualRuntimeIsolationResult {
  const descriptor = isDescriptor(input.descriptor)
    ? input.descriptor
    : undefined;
  const descriptorValid = descriptor !== undefined;
  const descriptorMatchesPolicy =
    descriptor !== undefined &&
    descriptor.runtime === "provider_local_pending" &&
    descriptor.provider === LOCAL_VISUAL_PROVIDER_ID &&
    descriptor.capabilities.length === 2 &&
    descriptor.capabilities.includes("ocr") &&
    descriptor.capabilities.includes("vision") &&
    descriptor.packageName === LOCAL_VISUAL_RUNTIME_PACKAGE_NAME &&
    descriptor.packageLocation === LOCAL_VISUAL_RUNTIME_PACKAGE_LOCATION &&
    descriptor.compositionRoot === LOCAL_VISUAL_COMPOSITION_ROOT &&
    descriptor.adapterOnlySurfaceRequired &&
    descriptor.supervisedChildProcessRequired &&
    descriptor.privateIpcRequired &&
    descriptor.resourceLeaseRequired &&
    descriptor.sanitizedErrorsRequired &&
    descriptor.fixtureFallbackRequired &&
    descriptor.screenCapturePermissionBoundaryRequired &&
    descriptor.executionEnabled === false;
  const checks: LocalVisualRuntimeIsolationChecks = {
    descriptorValid,
    descriptorMatchesPolicy,
    packageBoundaryApproved: input.packageBoundaryApproved === true,
    helperProtocolApproved: input.helperProtocolApproved === true,
    resourceLeaseApproved: input.resourceLeaseApproved === true,
    sanitizedErrorsApproved: input.sanitizedErrorsApproved === true,
    screenCapturePermissionBoundaryApproved:
      input.screenCapturePermissionBoundaryApproved === true,
    fixtureFallbackAvailable: input.fixtureFallbackAvailable === true,
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
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    capability: "ocr_screen_vision",
    provider: LOCAL_VISUAL_PROVIDER_ID,
    runtime: "provider_local_pending",
    packageName: LOCAL_VISUAL_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_VISUAL_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_VISUAL_COMPOSITION_ROOT,
    status: accepted ? "ready_for_runtime_dependency_approval" : "blocked",
    accepted,
    readyForRuntimeDependencyApproval: accepted,
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
    implementationValuesExposed: false,
    checks,
    reasons: createReasons(checks)
  };
}

function isDescriptor(
  value: unknown
): value is LocalVisualRuntimeAdapterDescriptor {
  if (!value || typeof value !== "object") {
    return false;
  }

  const descriptor = value as Partial<LocalVisualRuntimeAdapterDescriptor>;
  if (
    descriptor.runtime !== "provider_local_pending" ||
    descriptor.provider !== LOCAL_VISUAL_PROVIDER_ID ||
    !Array.isArray(descriptor.capabilities) ||
    descriptor.capabilities.some(
      (capability) => capability !== "ocr" && capability !== "vision"
    ) ||
    descriptor.capabilities.length !== 2 ||
    descriptor.packageName !== LOCAL_VISUAL_RUNTIME_PACKAGE_NAME ||
    descriptor.packageLocation !== LOCAL_VISUAL_RUNTIME_PACKAGE_LOCATION ||
    descriptor.compositionRoot !== LOCAL_VISUAL_COMPOSITION_ROOT
  ) {
    return false;
  }

  return (
    descriptor.adapterOnlySurfaceRequired === true &&
    descriptor.supervisedChildProcessRequired === true &&
    descriptor.privateIpcRequired === true &&
    descriptor.resourceLeaseRequired === true &&
    descriptor.sanitizedErrorsRequired === true &&
    descriptor.fixtureFallbackRequired === true &&
    descriptor.screenCapturePermissionBoundaryRequired === true &&
    descriptor.executionEnabled === false
  );
}

function createReasons(
  checks: LocalVisualRuntimeIsolationChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.descriptorValid) {
    reasons.push("Local visual runtime adapter descriptor is invalid.");
  }
  if (!checks.descriptorMatchesPolicy) {
    reasons.push("Local visual runtime adapter descriptor regressed from the pending boundary.");
  }
  if (!checks.packageBoundaryApproved) {
    reasons.push("Dedicated local visual runtime package boundary is not approved.");
  }
  if (!checks.helperProtocolApproved) {
    reasons.push("Supervised private child-process protocol is not approved.");
  }
  if (!checks.resourceLeaseApproved) {
    reasons.push("Local visual runtime resource lease integration is not approved.");
  }
  if (!checks.sanitizedErrorsApproved) {
    reasons.push("Local visual runtime sanitized error mapping is not approved.");
  }
  if (!checks.screenCapturePermissionBoundaryApproved) {
    reasons.push("Screen capture permission boundary is not approved.");
  }
  if (!checks.fixtureFallbackAvailable) {
    reasons.push("Fixture OCR and vision providers must remain available as fallback.");
  }
  if (!checks.networkAccessDisabled) {
    reasons.push("Network access must remain disabled for local visual runtime preparation.");
  }
  if (!checks.credentialsNotRequired) {
    reasons.push("Local visual runtime preparation must not require credentials.");
  }
  if (!checks.runtimeDependenciesAbsent) {
    reasons.push("Local visual runtime dependencies remain deferred.");
  }
  if (!checks.modelDownloadsDisabled) {
    reasons.push("Local visual model downloads remain disabled.");
  }
  if (!checks.modelLoadingDisabled) {
    reasons.push("Local visual model loading remains disabled.");
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
    reasons.push("Local visual provider registration remains deferred.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Local visual default opt-in remains disabled.");
  }
  if (!checks.rawPixelsPersistenceDisabled) {
    reasons.push("Raw screen pixels must not be persisted in this preparation wave.");
  }
  if (!checks.rawPixelsExposureDisabled) {
    reasons.push("Raw screen pixels must not be exposed by runtime observations.");
  }
  if (!checks.modelOutputCommandsDisabled) {
    reasons.push("Vision output must not become an operating-system command.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
