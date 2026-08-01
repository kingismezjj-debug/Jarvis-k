import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingCompositionPreflightPolicy,
  createLocalEmbeddingRuntimeAdapterDescriptor,
  evaluateLocalEmbeddingCompositionPreflight,
  evaluateLocalEmbeddingRuntimeAdapterIsolation
} from "../src";
import type { LocalEmbeddingRuntimeAcceptancePreflightResult } from "../src/local-embedding-runtime-acceptance-preflight";

const approvedInput = {
  runtimeAcceptancePreflight: createApprovedRuntimeAcceptancePreflight(),
  runtimeAdapterIsolation: evaluateLocalEmbeddingRuntimeAdapterIsolation({
    descriptor: createLocalEmbeddingRuntimeAdapterDescriptor(),
    packageBoundaryApproved: true,
    helperProtocolApproved: true,
    resourceLeaseRequired: true,
    sanitizedErrorsApproved: true,
    fallbackProviderAvailable: true,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false
  }),
  compositionRoot: "apps/core-host",
  coreHostCompositionChanged: false,
  providerVisibilityChanged: false,
  providerRegistrationEnabled: false,
  executionEnabled: false,
  defaultOptInEnabled: false,
  runtimeDependenciesIntroduced: false,
  downloadEnabled: false,
  modelArtifactAccessed: false,
  cacheWritesEnabled: false,
  installerCreated: false,
  modelArtifactsBundled: false,
  runtimeLoaded: false,
  inferenceExecuted: false,
  fixtureFallbackAvailable: true,
  verificationClean: true
};

describe("local embedding composition preflight", () => {
  it("defines a review-only fail-closed policy", () => {
    const policy = createLocalEmbeddingCompositionPreflightPolicy();

    expect(policy).toMatchObject({
      runtime: "transformers",
      compositionRoot: "apps/core-host",
      explicitCompositionReviewRequired: true,
      providerRegistrationAllowed: false,
      executionEnablementAllowed: false,
      defaultOptInAllowed: false,
      coreHostCompositionChangeAllowed: false,
      providerVisibilityChangeAllowed: false,
      fallbackProviderRequired: true,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      modelArtifactAccessed: false,
      cacheWritesEnabled: false,
      installerCreated: false,
      modelArtifactsBundled: false,
      runtimeLoaded: false,
      inferenceExecuted: false
    });
    expect(JSON.stringify(policy)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(policy)).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("blocks composition review by default", () => {
    const result = evaluateLocalEmbeddingCompositionPreflight();

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForExplicitCompositionReview: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Runtime acceptance preflight is missing or regressed.",
        "Runtime adapter isolation approval is missing or regressed.",
        "Concrete composition must remain rooted in the approved host.",
        "Fixture or other fallback provider is required before review can pass."
      ])
    );
  });

  it("accepts only a fully verified review boundary while keeping composition disabled", () => {
    const result = evaluateLocalEmbeddingCompositionPreflight(approvedInput);

    expect(result).toMatchObject({
      status: "ready_for_explicit_composition_review",
      accepted: true,
      readyForExplicitCompositionReview: true,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      modelArtifactAccessed: false,
      cacheWritesEnabled: false,
      runtimeLoaded: false,
      inferenceExecuted: false,
      checks: {
        runtimeAcceptanceApproved: true,
        runtimeAdapterIsolationApproved: true,
        compositionRootRestricted: true,
        coreHostCompositionUnchanged: true,
        providerVisibilityUnchanged: true,
        providerRegistrationDisabled: true,
        executionDisabled: true,
        defaultOptInDisabled: true,
        runtimeDependenciesAbsent: true,
        downloadsDisabled: true,
        modelArtifactAccessDisabled: true,
        cacheWritesDisabled: true,
        installerCreationDisabled: true,
        modelBundlingDisabled: true,
        runtimeLoadingDisabled: true,
        inferenceExecutionDisabled: true,
        fallbackProviderAvailable: true,
        verificationClean: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks enablement, artifact, and host-composition regressions", () => {
    const result = evaluateLocalEmbeddingCompositionPreflight({
      ...approvedInput,
      coreHostCompositionChanged: true,
      providerVisibilityChanged: true,
      providerRegistrationEnabled: true,
      executionEnabled: true,
      defaultOptInEnabled: true,
      runtimeDependenciesIntroduced: true,
      downloadEnabled: true,
      modelArtifactAccessed: true,
      cacheWritesEnabled: true,
      installerCreated: true,
      modelArtifactsBundled: true,
      runtimeLoaded: true,
      inferenceExecuted: true,
      fixtureFallbackAvailable: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForExplicitCompositionReview: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      modelArtifactAccessed: false,
      cacheWritesEnabled: false,
      installerCreated: false,
      modelArtifactsBundled: false,
      runtimeLoaded: false,
      inferenceExecuted: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Core Host composition changes are deferred until explicit approval.",
        "Provider visibility changes are deferred until explicit approval.",
        "Provider registration remains disabled in this preflight.",
        "Execution enablement remains disabled in this preflight.",
        "Default opt-in remains disabled in this preflight.",
        "Runtime dependencies must remain absent in this preflight.",
        "Artifact downloads must remain disabled in this preflight.",
        "Model artifact access remains disabled in this preflight.",
        "Cache writes must remain disabled in this preflight.",
        "Installer creation remains disabled in this preflight.",
        "Model bundling remains disabled in this preflight.",
        "Runtime loading remains disabled in this preflight.",
        "Inference execution remains disabled in this preflight.",
        "Fixture or other fallback provider is required before review can pass."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks a degraded runtime acceptance or isolation result", () => {
    const result = evaluateLocalEmbeddingCompositionPreflight({
      ...approvedInput,
      runtimeAcceptancePreflight: {
        ...approvedInput.runtimeAcceptancePreflight,
        readyForRuntimeBackedCapture: false
      },
      runtimeAdapterIsolation: undefined
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForExplicitCompositionReview: false,
      compositionAllowed: false,
      checks: {
        runtimeAcceptanceApproved: false,
        runtimeAdapterIsolationApproved: false
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Runtime acceptance preflight is missing or regressed.",
        "Runtime adapter isolation approval is missing or regressed."
      ])
    );
  });
});

function createApprovedRuntimeAcceptancePreflight(): LocalEmbeddingRuntimeAcceptancePreflightResult {
  return {
    provider: "local-embedding",
    modelId: "Qwen/Qwen3-Embedding-0.6B",
    runtime: "transformers",
    status: "ready_for_runtime_backed_capture",
    accepted: true,
    readyForRuntimeBackedCapture: true,
    metricValuesCaptured: false,
    metricValuesExposed: false,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    installerCreated: false,
    modelArtifactsBundled: false,
    cacheWritesEnabled: false,
    checks: {
      benchmarkCaptureProcedureApproved: true,
      benchmarkCaptureApprovalApproved: true,
      benchmarkResultCaptureDeferred: true,
      licenseReviewApproved: true,
      licenseApprovalApproved: true,
      windowsPackagingApproved: true,
      runtimeDependencySelectionApproved: true,
      runtimeAdapterIsolationApproved: true,
      runtimeDependenciesAbsent: true,
      downloadsDisabled: true,
      executionDisabled: true,
      providerRegistrationDisabled: true,
      defaultOptInDisabled: true,
      verificationClean: true
    },
    reasons: []
  };
}
