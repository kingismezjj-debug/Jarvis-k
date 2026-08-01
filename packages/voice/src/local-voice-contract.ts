import type { LocalModelCapability } from "@jarvis-k/contracts";
import type { AsrProviderPort, TtsPlaybackPort } from "./ports";

export const LOCAL_VOICE_PROVIDER_ID = "voice.local.pending" as const;
export const LOCAL_VOICE_COMPOSITION_ROOT = "apps/core-host" as const;

export type LocalVoiceCapability = Extract<
  LocalModelCapability,
  "speech_to_text" | "text_to_speech"
>;

export const LOCAL_VOICE_CAPABILITIES: readonly LocalVoiceCapability[] = [
  "speech_to_text",
  "text_to_speech"
];

export interface LocalVoiceProviderPorts {
  asr: AsrProviderPort;
  ttsPlayback: TtsPlaybackPort;
}

export interface LocalVoiceProviderDescriptor {
  capability: "voice";
  provider: typeof LOCAL_VOICE_PROVIDER_ID;
  supportedCapabilities: readonly LocalVoiceCapability[];
  providerNeutralPortsRequired: true;
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
  fixtureFallbackRequired: true;
}

export type LocalVoiceFixtureCapabilityStatus = "ready" | "degraded";

export type LocalVoiceFixtureReasonCode =
  | "FIXTURE_VOICE_READY"
  | "FIXTURE_VOICE_PARTIAL"
  | "FIXTURE_VOICE_UNAVAILABLE";

export interface LocalVoiceFixtureCapabilityReport {
  capability: "voice";
  execution: "fixture";
  status: LocalVoiceFixtureCapabilityStatus;
  asrAvailable: boolean;
  ttsPlaybackAvailable: boolean;
  reasonCode: LocalVoiceFixtureReasonCode;
}

export function createLocalVoiceProviderDescriptor(): LocalVoiceProviderDescriptor {
  return {
    capability: "voice",
    provider: LOCAL_VOICE_PROVIDER_ID,
    supportedCapabilities: LOCAL_VOICE_CAPABILITIES,
    providerNeutralPortsRequired: true,
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
    fixtureFallbackRequired: true
  };
}

export function createLocalVoiceFixtureCapabilityReport(input: {
  asrAvailable: boolean;
  ttsPlaybackAvailable: boolean;
}): LocalVoiceFixtureCapabilityReport {
  const asrAvailable = input.asrAvailable === true;
  const ttsPlaybackAvailable = input.ttsPlaybackAvailable === true;
  const availableCount = Number(asrAvailable) + Number(ttsPlaybackAvailable);

  return {
    capability: "voice",
    execution: "fixture",
    status: availableCount === 2 ? "ready" : "degraded",
    asrAvailable,
    ttsPlaybackAvailable,
    reasonCode:
      availableCount === 2
        ? "FIXTURE_VOICE_READY"
        : availableCount === 1
          ? "FIXTURE_VOICE_PARTIAL"
          : "FIXTURE_VOICE_UNAVAILABLE"
  };
}
