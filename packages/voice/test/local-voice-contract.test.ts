import { describe, expect, it } from "vitest";
import {
  createLocalVoiceFixtureCapabilityReport,
  createLocalVoiceProviderDescriptor
} from "../src";

describe("local voice capability contract", () => {
  it("defines a provider-neutral, fail-closed descriptor", () => {
    const descriptor = createLocalVoiceProviderDescriptor();
    const serialized = JSON.stringify(descriptor);

    expect(descriptor).toMatchObject({
      capability: "voice",
      provider: "voice.local.pending",
      supportedCapabilities: ["speech_to_text", "text_to_speech"],
      providerNeutralPortsRequired: true,
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
      fixtureFallbackRequired: true
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("reports a complete fixture capability without carrying audio or text payloads", () => {
    const report = createLocalVoiceFixtureCapabilityReport({
      asrAvailable: true,
      ttsPlaybackAvailable: true
    });

    expect(report).toEqual({
      capability: "voice",
      execution: "fixture",
      status: "ready",
      asrAvailable: true,
      ttsPlaybackAvailable: true,
      reasonCode: "FIXTURE_VOICE_READY"
    });
    expect(report).not.toHaveProperty("audio");
    expect(report).not.toHaveProperty("text");
  });

  it("degrades to a sanitized partial report when one fixture side is unavailable", () => {
    const report = createLocalVoiceFixtureCapabilityReport({
      asrAvailable: true,
      ttsPlaybackAvailable: false
    });
    const unavailable = createLocalVoiceFixtureCapabilityReport({
      asrAvailable: false,
      ttsPlaybackAvailable: false
    });

    expect(report).toMatchObject({
      status: "degraded",
      reasonCode: "FIXTURE_VOICE_PARTIAL"
    });
    expect(unavailable).toMatchObject({
      status: "degraded",
      reasonCode: "FIXTURE_VOICE_UNAVAILABLE"
    });
    expect(JSON.stringify(report)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(report)).not.toMatch(/[A-Za-z]:\\/u);
  });
});
