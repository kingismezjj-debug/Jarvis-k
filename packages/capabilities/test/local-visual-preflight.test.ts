import { describe, expect, it } from "vitest";
import {
  createLocalVisualPreflightPolicy,
  evaluateLocalVisualPreflight
} from "../src";

const approvedInput = {
  ocrContractReviewed: true,
  screenCapturePortReviewed: true,
  visionPortReviewed: true,
  providerNeutralOnly: true,
  screenCapturePermissionPolicyDeferred: true,
  fixtureOcrAvailable: true,
  fixtureScreenCaptureAvailable: true,
  fixtureVisionAvailable: true,
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
  verificationClean: true
};

describe("local visual preflight", () => {
  it("defines a deferred, fixture-backed policy", () => {
    const policy = createLocalVisualPreflightPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
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
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks by default", () => {
    const result = evaluateLocalVisualPreflight();

    expect(result).toMatchObject({
      capability: "ocr_screen_vision",
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      realOcrExecutionEnabled: false,
      screenCaptureExecutionEnabled: false,
      visionExecutionEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "OCR contract review is not complete.",
        "Screen capture port review is not complete.",
        "Vision analysis port review is not complete.",
        "A deterministic screen capture fixture contract is required."
      ])
    );
  });

  it("accepts only the fixture contract boundary", () => {
    const result = evaluateLocalVisualPreflight(approvedInput);

    expect(result).toMatchObject({
      capability: "ocr_screen_vision",
      status: "ready_for_fixture_contract",
      accepted: true,
      readyForFixtureContract: true,
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
      checks: {
        fixtureOcrAvailable: true,
        fixtureScreenCaptureAvailable: true,
        fixtureVisionAvailable: true,
        rawPixelsExposureDisabled: true,
        modelOutputCommandsDisabled: true,
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks execution, exposure, composition, and degraded-review regressions", () => {
    const result = evaluateLocalVisualPreflight({
      ...approvedInput,
      realOcrExecutionEnabled: true,
      screenCaptureExecutionEnabled: true,
      visionExecutionEnabled: true,
      realProviderRegistrationEnabled: true,
      modelLoadingEnabled: true,
      networkAccessAllowed: true,
      runtimeDependenciesIntroduced: true,
      rawPixelsPersisted: true,
      rawPixelsExposed: true,
      modelOutputCommandsEnabled: true,
      coreCompositionChanged: true,
      desktopIpcChanged: true,
      uiChanged: true,
      fixtureVisionAvailable: false,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      realOcrExecutionEnabled: false,
      screenCaptureExecutionEnabled: false,
      visionExecutionEnabled: false,
      rawPixelsPersisted: false,
      rawPixelsExposed: false,
      modelOutputCommandsEnabled: false,
      coreCompositionChanged: false,
      desktopIpcChanged: false,
      uiChanged: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Real OCR execution remains disabled.",
        "Real screen capture execution remains disabled.",
        "Real vision execution remains disabled.",
        "Raw screen pixels must not be persisted in this wave.",
        "Raw screen pixels must not be exposed by observations.",
        "Vision output must not become an operating-system command.",
        "Core composition changes are deferred in this wave.",
        "Desktop IPC changes are deferred in this wave.",
        "UI changes are deferred in this wave.",
        "A deterministic vision fixture contract is required.",
        "Verification gates are not clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(
      /apiKey|signedUrl|privatePath|modelFile|imageBytes/iu
    );
  });

  it("keeps a partial fixture review degraded and blocked", () => {
    const result = evaluateLocalVisualPreflight({
      ...approvedInput,
      fixtureOcrAvailable: false,
      fixtureScreenCaptureAvailable: false,
      verificationClean: false
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForFixtureContract: false,
      realOcrExecutionEnabled: false,
      screenCaptureExecutionEnabled: false,
      visionExecutionEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "A deterministic OCR fixture contract is required.",
        "A deterministic screen capture fixture contract is required.",
        "Verification gates are not clean."
      ])
    );
  });
});
