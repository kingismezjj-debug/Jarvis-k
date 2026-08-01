import {
  LOCAL_VOICE_COMPOSITION_ROOT,
  LOCAL_VOICE_PROVIDER_ID
} from "./local-voice-contract";

export const LOCAL_VOICE_RUNTIME_PACKAGE_NAME =
  "@jarvis-k/voice-runtime-local" as const;
export const LOCAL_VOICE_RUNTIME_PACKAGE_LOCATION =
  "packages/voice-runtime-local" as const;

export type LocalVoiceRuntimeIsolationStatus =
  | "blocked"
  | "ready_for_runtime_dependency_approval";

export interface LocalVoiceRuntimeAdapterDescriptor {
  runtime: "provider_local_pending";
  provider: typeof LOCAL_VOICE_PROVIDER_ID;
  capabilities: readonly ["speech_to_text", "text_to_speech"];
  packageName: typeof LOCAL_VOICE_RUNTIME_PACKAGE_NAME;
  packageLocation: typeof LOCAL_VOICE_RUNTIME_PACKAGE_LOCATION;
  compositionRoot: typeof LOCAL_VOICE_COMPOSITION_ROOT;
  adapterOnlySurfaceRequired: true;
  supervisedChildProcessRequired: true;
  privateIpcRequired: true;
  resourceLeaseRequired: true;
  sanitizedErrorsRequired: true;
  fixtureFallbackRequired: true;
  executionEnabled: false;
}

export interface LocalVoiceRuntimeIsolationPolicy {
  runtime: "provider_local_pending";
  provider: typeof LOCAL_VOICE_PROVIDER_ID;
  packageName: typeof LOCAL_VOICE_RUNTIME_PACKAGE_NAME;
  packageLocation: typeof LOCAL_VOICE_RUNTIME_PACKAGE_LOCATION;
  compositionRoot: typeof LOCAL_VOICE_COMPOSITION_ROOT;
  adapterOnlySurfaceRequired: true;
  supervisedChildProcessRequired: true;
  privateIpcRequired: true;
  resourceLeaseRequired: true;
  sanitizedErrorsRequired: true;
  fixtureFallbackRequired: true;
  networkAccessAllowed: false;
  credentialsRequired: false;
  runtimeDependenciesIntroduced: false;
  modelDownloadsEnabled: false;
  modelLoadingEnabled: false;
  audioExecutionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  implementationValuesExposed: false;
}

export interface LocalVoiceRuntimeIsolationInput {
  descriptor?: unknown;
  packageBoundaryApproved?: boolean;
  helperProtocolApproved?: boolean;
  resourceLeaseApproved?: boolean;
  sanitizedErrorsApproved?: boolean;
  fixtureFallbackAvailable?: boolean;
  networkAccessAllowed?: boolean;
  credentialsRequired?: boolean;
  runtimeDependenciesIntroduced?: boolean;
  modelDownloadsEnabled?: boolean;
  modelLoadingEnabled?: boolean;
  audioExecutionEnabled?: boolean;
  providerRegistrationEnabled?: boolean;
  defaultOptInEnabled?: boolean;
  verificationClean?: boolean;
}

export interface LocalVoiceRuntimeIsolationChecks {
  descriptorValid: boolean;
  descriptorMatchesPolicy: boolean;
  packageBoundaryApproved: boolean;
  helperProtocolApproved: boolean;
  resourceLeaseApproved: boolean;
  sanitizedErrorsApproved: boolean;
  fixtureFallbackAvailable: boolean;
  networkAccessDisabled: boolean;
  credentialsNotRequired: boolean;
  runtimeDependenciesAbsent: boolean;
  modelDownloadsDisabled: boolean;
  modelLoadingDisabled: boolean;
  audioExecutionDisabled: boolean;
  providerRegistrationDisabled: boolean;
  defaultOptInDisabled: boolean;
  verificationClean: boolean;
}

export interface LocalVoiceRuntimeIsolationResult {
  capability: "voice";
  provider: typeof LOCAL_VOICE_PROVIDER_ID;
  runtime: "provider_local_pending";
  packageName: typeof LOCAL_VOICE_RUNTIME_PACKAGE_NAME;
  packageLocation: typeof LOCAL_VOICE_RUNTIME_PACKAGE_LOCATION;
  compositionRoot: typeof LOCAL_VOICE_COMPOSITION_ROOT;
  status: LocalVoiceRuntimeIsolationStatus;
  accepted: boolean;
  readyForRuntimeDependencyApproval: boolean;
  networkAccessAllowed: false;
  credentialsRequired: false;
  runtimeDependenciesIntroduced: false;
  modelDownloadsEnabled: false;
  modelLoadingEnabled: false;
  audioExecutionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  implementationValuesExposed: false;
  checks: LocalVoiceRuntimeIsolationChecks;
  reasons: string[];
}

export function createLocalVoiceRuntimeAdapterDescriptor(): LocalVoiceRuntimeAdapterDescriptor {
  return {
    runtime: "provider_local_pending",
    provider: LOCAL_VOICE_PROVIDER_ID,
    capabilities: ["speech_to_text", "text_to_speech"],
    packageName: LOCAL_VOICE_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_VOICE_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_VOICE_COMPOSITION_ROOT,
    adapterOnlySurfaceRequired: true,
    supervisedChildProcessRequired: true,
    privateIpcRequired: true,
    resourceLeaseRequired: true,
    sanitizedErrorsRequired: true,
    fixtureFallbackRequired: true,
    executionEnabled: false
  };
}

export function createLocalVoiceRuntimeIsolationPolicy(): LocalVoiceRuntimeIsolationPolicy {
  return {
    runtime: "provider_local_pending",
    provider: LOCAL_VOICE_PROVIDER_ID,
    packageName: LOCAL_VOICE_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_VOICE_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_VOICE_COMPOSITION_ROOT,
    adapterOnlySurfaceRequired: true,
    supervisedChildProcessRequired: true,
    privateIpcRequired: true,
    resourceLeaseRequired: true,
    sanitizedErrorsRequired: true,
    fixtureFallbackRequired: true,
    networkAccessAllowed: false,
    credentialsRequired: false,
    runtimeDependenciesIntroduced: false,
    modelDownloadsEnabled: false,
    modelLoadingEnabled: false,
    audioExecutionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    implementationValuesExposed: false
  };
}

export function evaluateLocalVoiceRuntimeIsolation(
  input: LocalVoiceRuntimeIsolationInput = {}
): LocalVoiceRuntimeIsolationResult {
  const descriptor = isDescriptor(input.descriptor)
    ? input.descriptor
    : undefined;
  const descriptorValid = descriptor !== undefined;
  const descriptorMatchesPolicy =
    descriptor !== undefined &&
    descriptor.runtime === "provider_local_pending" &&
    descriptor.provider === LOCAL_VOICE_PROVIDER_ID &&
    descriptor.capabilities.length === 2 &&
    descriptor.capabilities.includes("speech_to_text") &&
    descriptor.capabilities.includes("text_to_speech") &&
    descriptor.packageName === LOCAL_VOICE_RUNTIME_PACKAGE_NAME &&
    descriptor.packageLocation === LOCAL_VOICE_RUNTIME_PACKAGE_LOCATION &&
    descriptor.compositionRoot === LOCAL_VOICE_COMPOSITION_ROOT &&
    descriptor.adapterOnlySurfaceRequired &&
    descriptor.supervisedChildProcessRequired &&
    descriptor.privateIpcRequired &&
    descriptor.resourceLeaseRequired &&
    descriptor.sanitizedErrorsRequired &&
    descriptor.fixtureFallbackRequired &&
    descriptor.executionEnabled === false;
  const checks: LocalVoiceRuntimeIsolationChecks = {
    descriptorValid,
    descriptorMatchesPolicy,
    packageBoundaryApproved: input.packageBoundaryApproved === true,
    helperProtocolApproved: input.helperProtocolApproved === true,
    resourceLeaseApproved: input.resourceLeaseApproved === true,
    sanitizedErrorsApproved: input.sanitizedErrorsApproved === true,
    fixtureFallbackAvailable: input.fixtureFallbackAvailable === true,
    networkAccessDisabled: input.networkAccessAllowed === false,
    credentialsNotRequired: input.credentialsRequired === false,
    runtimeDependenciesAbsent: input.runtimeDependenciesIntroduced === false,
    modelDownloadsDisabled: input.modelDownloadsEnabled === false,
    modelLoadingDisabled: input.modelLoadingEnabled === false,
    audioExecutionDisabled: input.audioExecutionEnabled === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    capability: "voice",
    provider: LOCAL_VOICE_PROVIDER_ID,
    runtime: "provider_local_pending",
    packageName: LOCAL_VOICE_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_VOICE_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_VOICE_COMPOSITION_ROOT,
    status: accepted ? "ready_for_runtime_dependency_approval" : "blocked",
    accepted,
    readyForRuntimeDependencyApproval: accepted,
    networkAccessAllowed: false,
    credentialsRequired: false,
    runtimeDependenciesIntroduced: false,
    modelDownloadsEnabled: false,
    modelLoadingEnabled: false,
    audioExecutionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    implementationValuesExposed: false,
    checks,
    reasons: createReasons(checks)
  };
}

function isDescriptor(
  value: unknown
): value is LocalVoiceRuntimeAdapterDescriptor {
  if (!value || typeof value !== "object") {
    return false;
  }

  const descriptor = value as Partial<LocalVoiceRuntimeAdapterDescriptor>;
  if (
    descriptor.runtime !== "provider_local_pending" ||
    descriptor.provider !== LOCAL_VOICE_PROVIDER_ID ||
    !Array.isArray(descriptor.capabilities) ||
    descriptor.capabilities.some(
      (capability) =>
        capability !== "speech_to_text" && capability !== "text_to_speech"
    ) ||
    descriptor.capabilities.length !== 2 ||
    descriptor.packageName !== LOCAL_VOICE_RUNTIME_PACKAGE_NAME ||
    descriptor.packageLocation !== LOCAL_VOICE_RUNTIME_PACKAGE_LOCATION ||
    descriptor.compositionRoot !== LOCAL_VOICE_COMPOSITION_ROOT
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
    descriptor.executionEnabled === false
  );
}

function createReasons(
  checks: LocalVoiceRuntimeIsolationChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.descriptorValid) {
    reasons.push("Local voice runtime adapter descriptor is invalid.");
  }
  if (!checks.descriptorMatchesPolicy) {
    reasons.push("Local voice runtime adapter descriptor regressed from the pending boundary.");
  }
  if (!checks.packageBoundaryApproved) {
    reasons.push("Dedicated local voice runtime package boundary is not approved.");
  }
  if (!checks.helperProtocolApproved) {
    reasons.push("Supervised private child-process protocol is not approved.");
  }
  if (!checks.resourceLeaseApproved) {
    reasons.push("Local voice runtime resource lease integration is not approved.");
  }
  if (!checks.sanitizedErrorsApproved) {
    reasons.push("Local voice runtime sanitized error mapping is not approved.");
  }
  if (!checks.fixtureFallbackAvailable) {
    reasons.push("A fixture voice provider must remain available as fallback.");
  }
  if (!checks.networkAccessDisabled) {
    reasons.push("Network access must remain disabled for local voice runtime preparation.");
  }
  if (!checks.credentialsNotRequired) {
    reasons.push("Local voice runtime preparation must not require credentials.");
  }
  if (!checks.runtimeDependenciesAbsent) {
    reasons.push("Local voice runtime dependencies remain deferred.");
  }
  if (!checks.modelDownloadsDisabled) {
    reasons.push("Local voice model downloads remain disabled.");
  }
  if (!checks.modelLoadingDisabled) {
    reasons.push("Local voice model loading remains disabled.");
  }
  if (!checks.audioExecutionDisabled) {
    reasons.push("Local voice audio execution remains disabled.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Local voice provider registration remains deferred.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Local voice default opt-in remains disabled.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
