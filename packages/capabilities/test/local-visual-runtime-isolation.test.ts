import { describe, expect, it } from "vitest";
import {
  createLocalVisualRuntimeAdapterDescriptor,
  createLocalVisualRuntimeIsolationPolicy,
  evaluateLocalVisualRuntimeIsolation
} from "../src";

const approvedInput = {
  descriptor: createLocalVisualRuntimeAdapterDescriptor(),
  packageBoundaryApproved: true,
  helperProtocolApproved: true,
  resourceLeaseApproved: true,
  sanitizedErrorsApproved: true,
  screenCapturePermissionBoundaryApproved: true,
  fixtureFallbackAvailable: true,
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
  verificationClean: true
};

describe("local visual runtime isolation guard", () => {
  it("defines a pending dedicated runtime boundary", () => {
    const policy = createLocalVisualRuntimeIsolationPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      runtime: "provider_local_pending",
      provider: "visual.local.pending",
      packageName: "@jarvis-k/visual-runtime-local",
      packageLocation: "packages/visual-runtime-local",
      compositionRoot: "apps/core-host",
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
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("accepts only the isolated boundary for later dependency approval", () => {
    const result = evaluateLocalVisualRuntimeIsolation(approvedInput);

    expect(result).toMatchObject({
      capability: "ocr_screen_vision",
      provider: "visual.local.pending",
      runtime: "provider_local_pending",
      packageName: "@jarvis-k/visual-runtime-local",
      packageLocation: "packages/visual-runtime-local",
      compositionRoot: "apps/core-host",
      status: "ready_for_runtime_dependency_approval",
      accepted: true,
      readyForRuntimeDependencyApproval: true,
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
      checks: {
        descriptorValid: true,
        descriptorMatchesPolicy: true,
        packageBoundaryApproved: true,
        helperProtocolApproved: true,
        resourceLeaseApproved: true,
        sanitizedErrorsApproved: true,
        screenCapturePermissionBoundaryApproved: true,
        fixtureFallbackAvailable: true,
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
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks runtime, privacy, permission, and registration regressions", () => {
    const result = evaluateLocalVisualRuntimeIsolation({
      ...approvedInput,
      screenCapturePermissionBoundaryApproved: false,
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
      ocrExecutionEnabled: false,
      screenCaptureExecutionEnabled: false,
      visionExecutionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      rawPixelsPersisted: false,
      rawPixelsExposed: false,
      modelOutputCommandsEnabled: false,
      implementationValuesExposed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Screen capture permission boundary is not approved.",
        "Network access must remain disabled for local visual runtime preparation.",
        "Local visual runtime preparation must not require credentials.",
        "Local visual runtime dependencies remain deferred.",
        "Local visual model downloads remain disabled.",
        "Local visual model loading remains disabled.",
        "Real OCR execution remains disabled.",
        "Real screen capture execution remains disabled.",
        "Real vision execution remains disabled.",
        "Local visual provider registration remains deferred.",
        "Local visual default opt-in remains disabled.",
        "Raw screen pixels must not be persisted in this preparation wave.",
        "Raw screen pixels must not be exposed by runtime observations.",
        "Vision output must not become an operating-system command.",
        "Fixture OCR and vision providers must remain available as fallback.",
        "Verification gates are not clean."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("rejects malformed descriptors without echoing descriptor details", () => {
    const result = evaluateLocalVisualRuntimeIsolation({
      ...approvedInput,
      descriptor: {
        ...createLocalVisualRuntimeAdapterDescriptor(),
        packageName: "visual-runtime-other",
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
        "Local visual runtime adapter descriptor is invalid.",
        "Local visual runtime adapter descriptor regressed from the pending boundary."
      ])
    );
    expect(JSON.stringify(result)).not.toMatch(/credential-like value/u);
    expect(JSON.stringify(result)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(result)).not.toMatch(/[A-Za-z]:\\/u);
  });
});
