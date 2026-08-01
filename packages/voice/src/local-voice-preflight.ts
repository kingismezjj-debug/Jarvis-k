import {
  LOCAL_VOICE_COMPOSITION_ROOT,
  LOCAL_VOICE_PROVIDER_ID,
  type LocalVoiceProviderDescriptor
} from "./local-voice-contract";

export type LocalVoiceProviderPreflightStatus =
  | "blocked"
  | "ready_for_fixture_contract";

export interface LocalVoiceProviderPreflightPolicy {
  providerNeutralPortsRequired: true;
  asrPortRequired: true;
  ttsPlaybackPortRequired: true;
  dedicatedRuntimePackageRequired: true;
  compositionRoot: typeof LOCAL_VOICE_COMPOSITION_ROOT;
  supervisedChildProcessRequired: true;
  privateIpcRequired: true;
  resourceLeaseRequired: true;
  sanitizedErrorsRequired: true;
  networkAccessAllowed: false;
  credentialsRequired: false;
  runtimeDependenciesIntroduced: false;
  modelDownloadsEnabled: false;
  modelLoadingEnabled: false;
  executionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  sensitiveValuesExposed: false;
  fixtureFallbackRequired: true;
}

export interface LocalVoiceProviderPreflightInput {
  descriptor?: unknown;
  portContractReviewed?: boolean;
  providerNeutralPortsOnly?: boolean;
  asrPortAvailable?: boolean;
  ttsPlaybackPortAvailable?: boolean;
  dedicatedRuntimePackageApproved?: boolean;
  compositionRootConfirmed?: boolean;
  supervisedChildProcessApproved?: boolean;
  privateIpcApproved?: boolean;
  resourceLeaseApproved?: boolean;
  sanitizedErrorsApproved?: boolean;
  networkAccessAllowed?: boolean;
  credentialsRequired?: boolean;
  runtimeDependenciesIntroduced?: boolean;
  modelDownloadsEnabled?: boolean;
  modelLoadingEnabled?: boolean;
  executionEnabled?: boolean;
  providerRegistrationEnabled?: boolean;
  defaultOptInEnabled?: boolean;
  sensitiveValuesExposed?: boolean;
  fixtureFallbackAvailable?: boolean;
  verificationClean?: boolean;
}

export interface LocalVoiceProviderPreflightChecks {
  descriptorValid: boolean;
  descriptorMatchesPolicy: boolean;
  portContractReviewed: boolean;
  providerNeutralPortsOnly: boolean;
  asrPortAvailable: boolean;
  ttsPlaybackPortAvailable: boolean;
  dedicatedRuntimePackageApproved: boolean;
  compositionRootConfirmed: boolean;
  supervisedChildProcessApproved: boolean;
  privateIpcApproved: boolean;
  resourceLeaseApproved: boolean;
  sanitizedErrorsApproved: boolean;
  networkAccessDisabled: boolean;
  credentialsNotRequired: boolean;
  runtimeDependenciesAbsent: boolean;
  modelDownloadsDisabled: boolean;
  modelLoadingDisabled: boolean;
  executionDisabled: boolean;
  providerRegistrationDisabled: boolean;
  defaultOptInDisabled: boolean;
  sensitiveValuesExposureDisabled: boolean;
  fixtureFallbackAvailable: boolean;
  verificationClean: boolean;
}

export interface LocalVoiceProviderPreflightResult {
  capability: "voice";
  provider: typeof LOCAL_VOICE_PROVIDER_ID;
  status: LocalVoiceProviderPreflightStatus;
  accepted: boolean;
  readyForFixtureContract: boolean;
  compositionRoot: typeof LOCAL_VOICE_COMPOSITION_ROOT;
  networkAccessAllowed: false;
  credentialsRequired: false;
  runtimeDependenciesIntroduced: false;
  modelDownloadsEnabled: false;
  modelLoadingEnabled: false;
  executionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  sensitiveValuesExposed: false;
  checks: LocalVoiceProviderPreflightChecks;
  reasons: string[];
}

export function createLocalVoiceProviderPreflightPolicy(): LocalVoiceProviderPreflightPolicy {
  return {
    providerNeutralPortsRequired: true,
    asrPortRequired: true,
    ttsPlaybackPortRequired: true,
    dedicatedRuntimePackageRequired: true,
    compositionRoot: LOCAL_VOICE_COMPOSITION_ROOT,
    supervisedChildProcessRequired: true,
    privateIpcRequired: true,
    resourceLeaseRequired: true,
    sanitizedErrorsRequired: true,
    networkAccessAllowed: false,
    credentialsRequired: false,
    runtimeDependenciesIntroduced: false,
    modelDownloadsEnabled: false,
    modelLoadingEnabled: false,
    executionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    sensitiveValuesExposed: false,
    fixtureFallbackRequired: true
  };
}

export function evaluateLocalVoiceProviderPreflight(
  input: LocalVoiceProviderPreflightInput = {}
): LocalVoiceProviderPreflightResult {
  const descriptor = isDescriptor(input.descriptor)
    ? input.descriptor
    : undefined;
  const descriptorValid = descriptor !== undefined;
  const descriptorMatchesPolicy =
    descriptor !== undefined &&
    descriptor.provider === LOCAL_VOICE_PROVIDER_ID &&
    descriptor.compositionRoot === LOCAL_VOICE_COMPOSITION_ROOT &&
    descriptor.supportedCapabilities.length === 2 &&
    descriptor.supportedCapabilities.includes("speech_to_text") &&
    descriptor.supportedCapabilities.includes("text_to_speech") &&
    descriptor.providerNeutralPortsRequired &&
    descriptor.dedicatedRuntimePackageRequired &&
    descriptor.supervisedChildProcessRequired &&
    descriptor.privateIpcRequired &&
    descriptor.resourceLeaseRequired &&
    descriptor.sanitizedErrorsRequired &&
    descriptor.fixtureFallbackRequired &&
    descriptor.networkAccessAllowed === false &&
    descriptor.credentialsRequired === false &&
    descriptor.runtimeDependenciesIntroduced === false &&
    descriptor.modelDownloadsEnabled === false &&
    descriptor.modelLoadingEnabled === false &&
    descriptor.executionEnabled === false &&
    descriptor.providerRegistrationEnabled === false &&
    descriptor.defaultOptInEnabled === false;
  const checks: LocalVoiceProviderPreflightChecks = {
    descriptorValid,
    descriptorMatchesPolicy,
    portContractReviewed: input.portContractReviewed === true,
    providerNeutralPortsOnly: input.providerNeutralPortsOnly === true,
    asrPortAvailable: input.asrPortAvailable === true,
    ttsPlaybackPortAvailable: input.ttsPlaybackPortAvailable === true,
    dedicatedRuntimePackageApproved:
      input.dedicatedRuntimePackageApproved === true,
    compositionRootConfirmed: input.compositionRootConfirmed === true,
    supervisedChildProcessApproved:
      input.supervisedChildProcessApproved === true,
    privateIpcApproved: input.privateIpcApproved === true,
    resourceLeaseApproved: input.resourceLeaseApproved === true,
    sanitizedErrorsApproved: input.sanitizedErrorsApproved === true,
    networkAccessDisabled: input.networkAccessAllowed === false,
    credentialsNotRequired: input.credentialsRequired === false,
    runtimeDependenciesAbsent: input.runtimeDependenciesIntroduced === false,
    modelDownloadsDisabled: input.modelDownloadsEnabled === false,
    modelLoadingDisabled: input.modelLoadingEnabled === false,
    executionDisabled: input.executionEnabled === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    sensitiveValuesExposureDisabled: input.sensitiveValuesExposed === false,
    fixtureFallbackAvailable: input.fixtureFallbackAvailable === true,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    capability: "voice",
    provider: LOCAL_VOICE_PROVIDER_ID,
    status: accepted ? "ready_for_fixture_contract" : "blocked",
    accepted,
    readyForFixtureContract: accepted,
    compositionRoot: LOCAL_VOICE_COMPOSITION_ROOT,
    networkAccessAllowed: false,
    credentialsRequired: false,
    runtimeDependenciesIntroduced: false,
    modelDownloadsEnabled: false,
    modelLoadingEnabled: false,
    executionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    sensitiveValuesExposed: false,
    checks,
    reasons: createReasons(checks)
  };
}

function isDescriptor(
  value: unknown
): value is LocalVoiceProviderDescriptor {
  if (!value || typeof value !== "object") {
    return false;
  }

  const descriptor = value as Partial<LocalVoiceProviderDescriptor>;
  if (
    descriptor.provider !== LOCAL_VOICE_PROVIDER_ID ||
    descriptor.capability !== "voice" ||
    descriptor.compositionRoot !== LOCAL_VOICE_COMPOSITION_ROOT ||
    !Array.isArray(descriptor.supportedCapabilities) ||
    descriptor.supportedCapabilities.some(
      (capability) =>
        capability !== "speech_to_text" && capability !== "text_to_speech"
    )
  ) {
    return false;
  }

  if (descriptor.supportedCapabilities.length !== 2) {
    return false;
  }

  return (
    descriptor.providerNeutralPortsRequired === true &&
    descriptor.dedicatedRuntimePackageRequired === true &&
    descriptor.supervisedChildProcessRequired === true &&
    descriptor.privateIpcRequired === true &&
    descriptor.resourceLeaseRequired === true &&
    descriptor.sanitizedErrorsRequired === true &&
    descriptor.networkAccessAllowed === false &&
    descriptor.credentialsRequired === false &&
    descriptor.runtimeDependenciesIntroduced === false &&
    descriptor.modelDownloadsEnabled === false &&
    descriptor.modelLoadingEnabled === false &&
    descriptor.executionEnabled === false &&
    descriptor.providerRegistrationEnabled === false &&
    descriptor.defaultOptInEnabled === false &&
    descriptor.fixtureFallbackRequired === true
  );
}

function createReasons(
  checks: LocalVoiceProviderPreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.descriptorValid) {
    reasons.push("Local voice provider descriptor is invalid.");
  }
  if (!checks.descriptorMatchesPolicy) {
    reasons.push("Local voice provider descriptor regressed from the reviewed policy.");
  }
  if (!checks.portContractReviewed) {
    reasons.push("Local voice provider ports are not reviewed.");
  }
  if (!checks.providerNeutralPortsOnly) {
    reasons.push("Local voice provider behavior must stay behind provider-neutral ports.");
  }
  if (!checks.asrPortAvailable) {
    reasons.push("A provider-neutral ASR port is required for the fixture contract.");
  }
  if (!checks.ttsPlaybackPortAvailable) {
    reasons.push("A provider-neutral TTS playback port is required for the fixture contract.");
  }
  if (!checks.dedicatedRuntimePackageApproved) {
    reasons.push("A dedicated local voice runtime package boundary is not approved.");
  }
  if (!checks.compositionRootConfirmed) {
    reasons.push("Concrete local voice composition must remain rooted in apps/core-host.");
  }
  if (!checks.supervisedChildProcessApproved) {
    reasons.push("Local voice runtime supervision is not approved.");
  }
  if (!checks.privateIpcApproved) {
    reasons.push("Local voice runtime communication must use private IPC.");
  }
  if (!checks.resourceLeaseApproved) {
    reasons.push("Local voice runtime resource leasing is not approved.");
  }
  if (!checks.sanitizedErrorsApproved) {
    reasons.push("Local voice runtime failure sanitization is not approved.");
  }
  if (!checks.networkAccessDisabled) {
    reasons.push("Network access must remain disabled for local voice preparation.");
  }
  if (!checks.credentialsNotRequired) {
    reasons.push("Local voice preparation must not require provider credentials.");
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
  if (!checks.executionDisabled) {
    reasons.push("Local voice execution remains disabled in this preparation wave.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Local voice provider registration remains deferred.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Local voice default opt-in remains disabled.");
  }
  if (!checks.sensitiveValuesExposureDisabled) {
    reasons.push("Local voice observations must not expose sensitive values.");
  }
  if (!checks.fixtureFallbackAvailable) {
    reasons.push("A deterministic voice fixture fallback is required.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
