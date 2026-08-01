import { describe, expect, it } from "vitest";
import {
  createLocalVoiceRuntimeAdapterDescriptor,
  createLocalVoiceRuntimeIsolationPolicy,
  evaluateLocalVoiceRuntimeIsolation
} from "../src";

const approvedInput = {
  descriptor: createLocalVoiceRuntimeAdapterDescriptor(),
  packageBoundaryApproved: true,
  helperProtocolApproved: true,
  resourceLeaseApproved: true,
  sanitizedErrorsApproved: true,
  fixtureFallbackAvailable: true,
  networkAccessAllowed: false,
  credentialsRequired: false,
  runtimeDependenciesIntroduced: false,
  modelDownloadsEnabled: false,
  modelLoadingEnabled: false,
  audioExecutionEnabled: false,
  providerRegistrationEnabled: false,
  defaultOptInEnabled: false,
  verificationClean: true
};

describe("local voice runtime isolation guard", () => {
  it("defines a pending, dedicated runtime boundary", () => {
    const policy = createLocalVoiceRuntimeIsolationPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      runtime: "provider_local_pending",
      provider: "voice.local.pending",
      packageName: "@jarvis-k/voice-runtime-local",
      packageLocation: "packages/voice-runtime-local",
      compositionRoot: "apps/core-host",
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
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("accepts only the isolated boundary for later dependency approval", () => {
    const result = evaluateLocalVoiceRuntimeIsolation(approvedInput);

    expect(result).toMatchObject({
      capability: "voice",
      provider: "voice.local.pending",
      runtime: "provider_local_pending",
      packageName: "@jarvis-k/voice-runtime-local",
      status: "ready_for_runtime_dependency_approval",
      accepted: true,
      readyForRuntimeDependencyApproval: true,
      compositionRoot: "apps/core-host",
      networkAccessAllowed: false,
      credentialsRequired: false,
      runtimeDependenciesIntroduced: false,
      modelDownloadsEnabled: false,
      modelLoadingEnabled: false,
      audioExecutionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      implementationValuesExposed: false,
      checks: {
        descriptorValid: true,
        descriptorMatchesPolicy: true,
        packageBoundaryApproved: true,
        helperProtocolApproved: true,
        resourceLeaseApproved: true,
        sanitizedErrorsApproved: true,
        fixtureFallbackAvailable: true,
        networkAccessDisabled: true,
        credentialsNotRequired: true,
        runtimeDependenciesAbsent: true,
        modelDownloadsDisabled: true,
        modelLoadingDisabled: true,
        audioExecutionDisabled: true,
        providerRegistrationDisabled: true,
        defaultOptInDisabled: true,
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks runtime, network, audio, registration, and fallback regressions", () => {
    const result = evaluateLocalVoiceRuntimeIsolation({
      ...approvedInput,
      networkAccessAllowed: true,
      credentialsRequired: true,
      runtimeDependenciesIntroduced: true,
      modelDownloadsEnabled: true,
      modelLoadingEnabled: true,
      audioExecutionEnabled: true,
      providerRegistrationEnabled: true,
      defaultOptInEnabled: true,
      fixtureFallbackAvailable: false,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForRuntimeDependencyApproval: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      runtimeDependenciesIntroduced: false,
      modelDownloadsEnabled: false,
      modelLoadingEnabled: false,
      audioExecutionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      implementationValuesExposed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Network access must remain disabled for local voice runtime preparation.",
        "Local voice runtime preparation must not require credentials.",
        "Local voice runtime dependencies remain deferred.",
        "Local voice model downloads remain disabled.",
        "Local voice model loading remains disabled.",
        "Local voice audio execution remains disabled.",
        "Local voice provider registration remains deferred.",
        "Local voice default opt-in remains disabled.",
        "A fixture voice provider must remain available as fallback.",
        "Verification gates are not clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("rejects malformed descriptors without echoing descriptor details", () => {
    const result = evaluateLocalVoiceRuntimeIsolation({
      ...approvedInput,
      descriptor: {
        ...createLocalVoiceRuntimeAdapterDescriptor(),
        packageName: "voice-runtime-other",
        notes: ["credential-like value"]
      }
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForRuntimeDependencyApproval: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Local voice runtime adapter descriptor is invalid.",
        "Local voice runtime adapter descriptor regressed from the pending boundary."
      ])
    );
    expect(JSON.stringify(result)).not.toMatch(/credential-like value/u);
    expect(JSON.stringify(result)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(result)).not.toMatch(/[A-Za-z]:\\/u);
  });
});
