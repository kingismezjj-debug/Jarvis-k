import { describe, expect, it } from "vitest";
import {
  assessLocalEmbeddingReadiness,
  createApprovedLocalEmbeddingArtifactPinApprovalRecord,
  createApprovedLocalEmbeddingLicenseApprovalRecord,
  createApprovedLocalEmbeddingManifest,
  createApprovedLocalEmbeddingRuntimeStrategy,
  createApprovedLocalEmbeddingWindowsPackagingApprovalRecord,
  createPinnedLocalEmbeddingArtifactPlan,
  createLocalEmbeddingBenchmarkApprovalRecord,
  createLocalEmbeddingProviderConfigurationReport,
  createLocalEmbeddingRevisionApprovalRecord,
  evaluateLocalEmbeddingCompositionApprovalGate,
  evaluateLocalEmbeddingCompositionPreflight,
  evaluateLocalEmbeddingResourceProfileAlternativeEvidence,
  evaluateLocalEmbeddingResourceProfileDisposition,
  evaluateLocalEmbeddingRuntimeAdapterIsolation,
  createLocalEmbeddingRuntimeAdapterDescriptor
} from "../src";
import type { LocalEmbeddingRuntimeAcceptancePreflightResult } from "../src/local-embedding-runtime-acceptance-preflight";

describe("local embedding resource profile alternative evidence", () => {
  it("accepts the approved disposition as composition-review-only resource evidence", () => {
    const result = approvedAlternativeEvidence();
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "accepted_for_composition_review_only",
      accepted: true,
      satisfiesResourceProfileRequirementForCompositionReview: true,
      compositionReviewOnly: true,
      productSloCreated: false,
      uiOrCoreExposureEnabled: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual([
      "Alternative resource evidence satisfies only the composition-review resource requirement."
    ]);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("satisfies only the local resource readiness key without changing provider status", () => {
    const readiness = assessLocalEmbeddingReadiness({
      ...completeReadinessInputWithoutResourceProfile(),
      resourceProfileAlternativeEvidence: approvedAlternativeEvidence()
    });
    const resourceCheck = readiness.checks.find(
      (check) => check.key === "benchmarks.local_resource_profile"
    );
    const report = createLocalEmbeddingProviderConfigurationReport({
      readiness: {
        ...completeReadinessInputWithoutResourceProfile(),
        resourceProfileAlternativeEvidence: approvedAlternativeEvidence()
      }
    });
    const serialized = JSON.stringify(report);

    expect(resourceCheck).toMatchObject({
      satisfied: true,
      reasons: []
    });
    expect(readiness).toMatchObject({
      readyForComposition: true,
      reasons: []
    });
    expect(report).toMatchObject({
      status: "unconfigured",
      requirements: expect.arrayContaining([
        expect.objectContaining({
          key: "benchmarks.local_resource_profile",
          configured: true
        })
      ]),
      reasons: [
        "Local embedding execution remains disabled until a real runtime provider is composed."
      ]
    });
    expect(serialized).not.toContain("latencyMs");
    expect(serialized).not.toContain("memoryPeak");
    expect(serialized).not.toContain("executionEnabled\":true");
    expect(serialized).not.toContain("downloadEnabled\":true");
  });

  it("allows the review handoff while still withholding composition approval", () => {
    const result = evaluateLocalEmbeddingCompositionApprovalGate({
      preflight: approvedCompositionPreflight(),
      readiness: assessLocalEmbeddingReadiness({
        ...completeReadinessInputWithoutResourceProfile(),
        resourceProfileAlternativeEvidence: approvedAlternativeEvidence()
      }),
      runtimeRegistered: false,
      executionProviderComposed: false,
      explicitEnablementApproved: false
    });

    expect(result).toMatchObject({
      status: "ready_for_manual_composition_approval",
      accepted: true,
      reviewBoundaryAccepted: true,
      readyForManualCompositionApproval: true,
      manualApprovalRequired: true,
      compositionApprovalGranted: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false,
      pendingReadinessKeys: [],
      reasons: [
        "Manual product and security approval is still required before provider registration or execution enablement."
      ]
    });
  });

  it("blocks missing approvals, product exposure, or runtime mutation", () => {
    const result = evaluateLocalEmbeddingResourceProfileAlternativeEvidence({
      disposition: approvedDisposition(),
      productApprovalForAlternativeEvidence: false,
      securityApprovalForAlternativeEvidence: false,
      boundedSamplingAttemptsAccepted: true,
      successfulRuntimeBenchmarkAccepted: true,
      cleanupAccepted: true,
      sanitizedFailureReasonAccepted: true,
      productSloCreated: true,
      uiOrCoreExposureEnabled: true,
      providerRegistrationEnabled: true,
      executionEnabled: true,
      defaultOptInEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      satisfiesResourceProfileRequirementForCompositionReview: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Product approval for alternative evidence is required.",
        "Security approval for alternative evidence is required.",
        "Alternative evidence must not create a product SLO.",
        "Alternative evidence must not enter UI or Core.",
        "Provider registration must remain disabled.",
        "Execution must remain disabled.",
        "Default opt-in must remain disabled."
      ])
    );
  });
});

function approvedAlternativeEvidence() {
  return evaluateLocalEmbeddingResourceProfileAlternativeEvidence({
    disposition: approvedDisposition(),
    productApprovalForAlternativeEvidence: true,
    securityApprovalForAlternativeEvidence: true,
    boundedSamplingAttemptsAccepted: true,
    successfulRuntimeBenchmarkAccepted: true,
    cleanupAccepted: true,
    sanitizedFailureReasonAccepted: true,
    productSloCreated: false,
    uiOrCoreExposureEnabled: false,
    providerRegistrationEnabled: false,
    executionEnabled: false,
    defaultOptInEnabled: false
  });
}

function approvedDisposition() {
  return evaluateLocalEmbeddingResourceProfileDisposition({
    benchmarkRunCompleted: true,
    artifactVerificationPassed: true,
    runtimeBenchmarkPassed: true,
    temporaryWorkspaceCleaned: true,
    memorySampleCaptured: false,
    memorySampleCount: 0,
    sanitizedReasonCode: "memory_probe_failed",
    productApproval: "approved",
    securityApproval: "approved",
    metricValuesExposed: false,
    metricValuesPersisted: false,
    coreHostCompositionChanged: false,
    providerRegistrationEnabled: false,
    executionEnabled: false,
    defaultOptInEnabled: false
  });
}

function approvedCompositionPreflight() {
  return evaluateLocalEmbeddingCompositionPreflight({
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
  });
}

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

function completeReadinessInputWithoutResourceProfile() {
  const artifactPlan = createPinnedLocalEmbeddingArtifactPlan();
  return {
    manifest: createApprovedLocalEmbeddingManifest(),
    artifactPlan,
    artifactPinApproval: createApprovedLocalEmbeddingArtifactPinApprovalRecord(),
    benchmarkApproval: createLocalEmbeddingBenchmarkApprovalRecord({
      status: "pending",
      reasons: [
        "Memory profile remains replaced by approved alternative evidence."
      ]
    }),
    licenseApproval: createApprovedLocalEmbeddingLicenseApprovalRecord(),
    revisionApproval: createLocalEmbeddingRevisionApprovalRecord({
      status: "approved",
      revision: createApprovedLocalEmbeddingManifest().revision,
      reasons: []
    }),
    runtimeStrategy: createApprovedLocalEmbeddingRuntimeStrategy(),
    runtimeAdapterReady: true,
    packagingReviewed: true,
    packagingApproval: createApprovedLocalEmbeddingWindowsPackagingApprovalRecord(),
    redistributionReviewed: true,
    benchmarkProfileReady: false
  };
}
