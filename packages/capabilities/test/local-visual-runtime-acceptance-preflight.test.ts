import { describe, expect, it } from "vitest";
import {
  createLocalVisualRuntimeAcceptancePreflightPolicy,
  evaluateLocalVisualRuntimeAcceptancePreflight
} from "../src";

const approvedInput = {
  fixtureBenchmarkPlanReviewed: true,
  runtimeIsolationAccepted: true,
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
  executionEnablementApproved: false,
  verificationClean: true
};

describe("local visual runtime acceptance preflight", () => {
  it("defines a deferred, fixture-backed acceptance policy", () => {
    const policy = createLocalVisualRuntimeAcceptancePreflightPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      capability: "ocr_screen_vision",
      provider: "visual.local.pending",
      compositionRoot: "apps/core-host",
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
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks by default", () => {
    const result = evaluateLocalVisualRuntimeAcceptancePreflight();

    expect(result).toMatchObject({
      capability: "ocr_screen_vision",
      provider: "visual.local.pending",
      runtime: "provider_local_pending",
      compositionRoot: "apps/core-host",
      status: "blocked",
      accepted: false,
      readyForRuntimeBackedCapture: false,
      benchmarkValuesCaptured: false,
      metricValuesExposed: false,
      runtimeDependenciesIntroduced: false,
      ocrExecutionEnabled: false,
      screenCaptureExecutionEnabled: false,
      visionExecutionEnabled: false,
      providerRegistrationEnabled: false,
      executionEnablementApproved: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Fixture visual benchmark plan is not reviewed.",
        "Local visual runtime isolation has not reached its approval boundary.",
        "Real visual benchmark values must remain pending."
      ])
    );
  });

  it("accepts only a review-complete, runtime-deferred boundary", () => {
    const result =
      evaluateLocalVisualRuntimeAcceptancePreflight(approvedInput);

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
      ocrExecutionEnabled: false,
      screenCaptureExecutionEnabled: false,
      visionExecutionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      rawPixelsPersisted: false,
      rawPixelsExposed: false,
      modelOutputCommandsEnabled: false,
      executionEnablementApproved: false,
      checks: {
        fixtureBenchmarkPlanReviewed: true,
        runtimeIsolationAccepted: true,
        licenseReviewDeferred: true,
        packagingReviewDeferred: true,
        nativeDependencyReviewDeferred: true,
        privacyReviewDeferred: true,
        benchmarkValuesPending: true,
        metricValuesExposureDisabled: true,
        networkAccessDisabled: true,
        credentialsNotRequired: true,
        runtimeDependenciesAbsent: true,
        modelDownloadsDisabled: true,
        modelLoadingDisabled: true,
        ocrExecutionDisabled: true,
        screenCaptureExecutionDisabled: true,
        visionExecutionDisabled: true,
        providerRegistrationDisabled: true,
        defaultOptInDisabled: true,
        rawPixelsPersistenceDisabled: true,
        rawPixelsExposureDisabled: true,
        modelOutputCommandsDisabled: true,
        executionEnablementDeferred: true,
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks captured metrics, privacy, dependency, and execution regressions", () => {
    const result = evaluateLocalVisualRuntimeAcceptancePreflight({
      ...approvedInput,
      privacyReviewDeferred: false,
      benchmarkValuesCaptured: true,
      metricValuesExposed: true,
      networkAccessAllowed: true,
      credentialsRequired: true,
      runtimeDependenciesIntroduced: true,
      modelDownloadsEnabled: true,
      modelLoadingEnabled: true,
      ocrExecutionEnabled: true,
      screenCaptureExecutionEnabled: true,
      visionExecutionEnabled: true,
      providerRegistrationEnabled: true,
      defaultOptInEnabled: true,
      rawPixelsPersisted: true,
      rawPixelsExposed: true,
      modelOutputCommandsEnabled: true,
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
      ocrExecutionEnabled: false,
      screenCaptureExecutionEnabled: false,
      visionExecutionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      rawPixelsPersisted: false,
      rawPixelsExposed: false,
      modelOutputCommandsEnabled: false,
      executionEnablementApproved: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Screen capture privacy and permission review remains a deferred gate.",
        "Real visual benchmark values must remain pending.",
        "Visual benchmark metric values must remain unexposed.",
        "Network access must remain disabled for visual acceptance preparation.",
        "Visual acceptance preparation must not require credentials.",
        "Visual runtime dependencies remain deferred.",
        "Visual model downloads remain disabled.",
        "Visual model loading remains disabled.",
        "Real OCR execution remains disabled.",
        "Real screen capture execution remains disabled.",
        "Real vision execution remains disabled.",
        "Visual provider registration remains deferred.",
        "Visual default opt-in remains disabled.",
        "Raw screen pixels must not be persisted.",
        "Raw screen pixels must not be exposed.",
        "Vision output must not become an operating-system command.",
        "Visual execution enablement remains deferred.",
        "Verification gates are not clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /apiKey|signedUrl|privatePath|modelFile|imageBytes/iu
    );
  });

  it("keeps a degraded review blocked without leaking input details", () => {
    const result = evaluateLocalVisualRuntimeAcceptancePreflight({
      ...approvedInput,
      fixtureBenchmarkPlanReviewed: false,
      runtimeIsolationAccepted: false
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForRuntimeBackedCapture: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Fixture visual benchmark plan is not reviewed.",
        "Local visual runtime isolation has not reached its approval boundary."
      ])
    );
    expect(JSON.stringify(result)).not.toMatch(
      /apiKey|signedUrl|privatePath|rawText|imageBytes/iu
    );
    expect(JSON.stringify(result)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(result)).not.toMatch(/[A-Za-z]:\\/u);
  });
});
