import { describe, expect, it } from "vitest";
import {
  createLocalVoiceRuntimeAcceptancePreflightPolicy,
  evaluateLocalVoiceRuntimeAcceptancePreflight
} from "../src";

const approvedInput = {
  fixtureBenchmarkPlanReviewed: true,
  runtimeIsolationAccepted: true,
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
  executionEnablementApproved: false,
  verificationClean: true
};

describe("local voice runtime acceptance preflight", () => {
  it("defines a deferred, fixture-backed acceptance policy", () => {
    const policy = createLocalVoiceRuntimeAcceptancePreflightPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      provider: "voice.local.pending",
      compositionRoot: "apps/core-host",
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
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks by default", () => {
    const result = evaluateLocalVoiceRuntimeAcceptancePreflight();

    expect(result).toMatchObject({
      capability: "voice",
      provider: "voice.local.pending",
      runtime: "provider_local_pending",
      compositionRoot: "apps/core-host",
      status: "blocked",
      accepted: false,
      readyForRuntimeBackedCapture: false,
      benchmarkValuesCaptured: false,
      metricValuesExposed: false,
      runtimeDependenciesIntroduced: false,
      audioExecutionEnabled: false,
      providerRegistrationEnabled: false,
      executionEnablementApproved: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Fixture voice benchmark plan is not reviewed.",
        "Local voice runtime isolation has not reached its approval boundary.",
        "Real voice benchmark values must remain pending."
      ])
    );
  });

  it("accepts only a review-complete, runtime-deferred boundary", () => {
    const result =
      evaluateLocalVoiceRuntimeAcceptancePreflight(approvedInput);

    expect(result).toMatchObject({
      status: "ready_for_runtime_backed_capture",
      accepted: true,
      readyForRuntimeBackedCapture: true,
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
      checks: {
        fixtureBenchmarkPlanReviewed: true,
        runtimeIsolationAccepted: true,
        licenseReviewDeferred: true,
        packagingReviewDeferred: true,
        nativeDependencyReviewDeferred: true,
        benchmarkValuesPending: true,
        metricValuesExposureDisabled: true,
        networkAccessDisabled: true,
        credentialsNotRequired: true,
        runtimeDependenciesAbsent: true,
        modelDownloadsDisabled: true,
        modelLoadingDisabled: true,
        audioExecutionDisabled: true,
        providerRegistrationDisabled: true,
        defaultOptInDisabled: true,
        executionEnablementDeferred: true,
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks captured metrics, dependency, packaging, and execution regressions", () => {
    const result = evaluateLocalVoiceRuntimeAcceptancePreflight({
      ...approvedInput,
      licenseReviewDeferred: false,
      packagingReviewDeferred: false,
      nativeDependencyReviewDeferred: false,
      benchmarkValuesCaptured: true,
      metricValuesExposed: true,
      runtimeDependenciesIntroduced: true,
      modelDownloadsEnabled: true,
      modelLoadingEnabled: true,
      audioExecutionEnabled: true,
      providerRegistrationEnabled: true,
      defaultOptInEnabled: true,
      executionEnablementApproved: true,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForRuntimeBackedCapture: false,
      benchmarkValuesCaptured: false,
      metricValuesExposed: false,
      runtimeDependenciesIntroduced: false,
      modelDownloadsEnabled: false,
      modelLoadingEnabled: false,
      audioExecutionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      executionEnablementApproved: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Voice runtime license review remains a deferred gate.",
        "Voice runtime Windows packaging review remains a deferred gate.",
        "Voice runtime native dependency review remains a deferred gate.",
        "Real voice benchmark values must remain pending.",
        "Voice benchmark metric values must remain unexposed.",
        "Voice runtime dependencies remain deferred.",
        "Voice model downloads remain disabled.",
        "Voice model loading remains disabled.",
        "Voice audio execution remains disabled.",
        "Voice provider registration remains deferred.",
        "Voice default opt-in remains disabled.",
        "Voice execution enablement remains deferred.",
        "Verification gates are not clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("keeps a degraded isolation review blocked without leaking input details", () => {
    const result = evaluateLocalVoiceRuntimeAcceptancePreflight({
      ...approvedInput,
      runtimeIsolationAccepted: false,
      fixtureBenchmarkPlanReviewed: false
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForRuntimeBackedCapture: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Fixture voice benchmark plan is not reviewed.",
        "Local voice runtime isolation has not reached its approval boundary."
      ])
    );
    expect(JSON.stringify(result)).not.toMatch(
      /apiKey|signedUrl|privatePath|rawTranscript|audioBytes/iu
    );
    expect(JSON.stringify(result)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(result)).not.toMatch(/[A-Za-z]:\\/u);
  });
});
