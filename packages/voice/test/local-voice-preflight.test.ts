import { describe, expect, it } from "vitest";
import {
  createLocalVoiceProviderDescriptor,
  createLocalVoiceProviderPreflightPolicy,
  evaluateLocalVoiceProviderPreflight
} from "../src";

const approvedInput = {
  descriptor: createLocalVoiceProviderDescriptor(),
  portContractReviewed: true,
  providerNeutralPortsOnly: true,
  asrPortAvailable: true,
  ttsPlaybackPortAvailable: true,
  dedicatedRuntimePackageApproved: true,
  compositionRootConfirmed: true,
  supervisedChildProcessApproved: true,
  privateIpcApproved: true,
  resourceLeaseApproved: true,
  sanitizedErrorsApproved: true,
  networkAccessAllowed: false,
  credentialsRequired: false,
  runtimeDependenciesIntroduced: false,
  modelDownloadsEnabled: false,
  modelLoadingEnabled: false,
  executionEnabled: false,
  providerRegistrationEnabled: false,
  defaultOptInEnabled: false,
  sensitiveValuesExposed: false,
  fixtureFallbackAvailable: true,
  verificationClean: true
};

describe("local voice provider preflight", () => {
  it("defines a fixture-only policy with real execution disabled", () => {
    const policy = createLocalVoiceProviderPreflightPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      providerNeutralPortsRequired: true,
      asrPortRequired: true,
      ttsPlaybackPortRequired: true,
      dedicatedRuntimePackageRequired: true,
      compositionRoot: "apps/core-host",
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
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks the local voice contract by default", () => {
    const result = evaluateLocalVoiceProviderPreflight();

    expect(result).toMatchObject({
      capability: "voice",
      provider: "voice.local.pending",
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      compositionRoot: "apps/core-host",
      networkAccessAllowed: false,
      credentialsRequired: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Local voice provider descriptor is invalid.",
        "A provider-neutral ASR port is required for the fixture contract.",
        "A provider-neutral TTS playback port is required for the fixture contract.",
        "A deterministic voice fixture fallback is required."
      ])
    );
  });

  it("accepts only the fixture contract boundary", () => {
    const result = evaluateLocalVoiceProviderPreflight(approvedInput);

    expect(result).toMatchObject({
      capability: "voice",
      provider: "voice.local.pending",
      status: "ready_for_fixture_contract",
      accepted: true,
      readyForFixtureContract: true,
      networkAccessAllowed: false,
      credentialsRequired: false,
      runtimeDependenciesIntroduced: false,
      modelDownloadsEnabled: false,
      modelLoadingEnabled: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      sensitiveValuesExposed: false,
      checks: {
        descriptorValid: true,
        descriptorMatchesPolicy: true,
        portContractReviewed: true,
        providerNeutralPortsOnly: true,
        asrPortAvailable: true,
        ttsPlaybackPortAvailable: true,
        dedicatedRuntimePackageApproved: true,
        compositionRootConfirmed: true,
        supervisedChildProcessApproved: true,
        privateIpcApproved: true,
        resourceLeaseApproved: true,
        sanitizedErrorsApproved: true,
        networkAccessDisabled: true,
        credentialsNotRequired: true,
        runtimeDependenciesAbsent: true,
        modelDownloadsDisabled: true,
        modelLoadingDisabled: true,
        executionDisabled: true,
        providerRegistrationDisabled: true,
        defaultOptInDisabled: true,
        sensitiveValuesExposureDisabled: true,
        fixtureFallbackAvailable: true,
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks runtime, network, registration, and sensitive-value regressions", () => {
    const result = evaluateLocalVoiceProviderPreflight({
      ...approvedInput,
      networkAccessAllowed: true,
      credentialsRequired: true,
      runtimeDependenciesIntroduced: true,
      modelDownloadsEnabled: true,
      modelLoadingEnabled: true,
      executionEnabled: true,
      providerRegistrationEnabled: true,
      defaultOptInEnabled: true,
      sensitiveValuesExposed: true,
      fixtureFallbackAvailable: false,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      runtimeDependenciesIntroduced: false,
      modelDownloadsEnabled: false,
      modelLoadingEnabled: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      sensitiveValuesExposed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Network access must remain disabled for local voice preparation.",
        "Local voice preparation must not require provider credentials.",
        "Local voice runtime dependencies remain deferred.",
        "Local voice model downloads remain disabled.",
        "Local voice model loading remains disabled.",
        "Local voice execution remains disabled in this preparation wave.",
        "Local voice provider registration remains deferred.",
        "Local voice default opt-in remains disabled.",
        "Local voice observations must not expose sensitive values.",
        "A deterministic voice fixture fallback is required.",
        "Verification gates are not clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("rejects malformed or policy-regressed descriptors", () => {
    const result = evaluateLocalVoiceProviderPreflight({
      ...approvedInput,
      descriptor: {
        ...createLocalVoiceProviderDescriptor(),
        provider: "voice.local.other",
        notes: ["https://private.example.invalid/voice"]
      }
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Local voice provider descriptor is invalid.",
        "Local voice provider descriptor regressed from the reviewed policy."
      ])
    );
    expect(JSON.stringify(result)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(result)).not.toMatch(/[A-Za-z]:\\/u);
  });
});
