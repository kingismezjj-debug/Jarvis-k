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
  createLocalEmbeddingRuntimeAdapterDescriptor,
  createLocalEmbeddingRevisionApprovalRecord,
  evaluateLocalEmbeddingCompositionApprovalGate,
  evaluateLocalEmbeddingCompositionPreflight,
  evaluateLocalEmbeddingProviderCompositionImplementationReview,
  evaluateLocalEmbeddingResourceProfileAlternativeEvidence,
  evaluateLocalEmbeddingResourceProfileDisposition,
  evaluateLocalEmbeddingRuntimeAdapterIsolation
} from "../src";
import type { LocalEmbeddingRuntimeAcceptancePreflightResult } from "../src/local-embedding-runtime-acceptance-preflight";

describe("local embedding provider composition implementation review", () => {
  it("accepts complete review materials without granting composition", () => {
    const result =
      evaluateLocalEmbeddingProviderCompositionImplementationReview(
        approvedImplementationReviewInput()
      );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "ready_for_product_security_composition_approval",
      accepted: true,
      readyForProductSecurityCompositionApproval: true,
      implementationReviewOnly: true,
      compositionApprovalGranted: false,
      compositionAllowed: false,
      coreHostCompositionChanged: false,
      providerVisibilityChanged: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false,
      runtimeLoaded: false,
      inferenceExecuted: false,
      modelArtifactAccessed: false,
      cacheWritesEnabled: false,
      reviewedImplementationAreas: [
        "core_host_composition_diff",
        "explicit_opt_in",
        "fixture_fallback",
        "sanitized_error_mapping",
        "resource_lease_enforcement",
        "startup_restart_behavior",
        "provider_visibility",
        "rollback_plan",
        "desktop_smoke_plan"
      ],
      reasons: [
        "Implementation review materials are ready for separate product and security composition approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(/token|api[_-]?key|signed/i);
  });

  it("blocks without accepted Phase 7.31 composition gate readiness", () => {
    const result =
      evaluateLocalEmbeddingProviderCompositionImplementationReview({
        ...approvedImplementationReviewInput(),
        approvalGate: evaluateLocalEmbeddingCompositionApprovalGate()
      });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForProductSecurityCompositionApproval: false,
      compositionApprovalGranted: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false,
      reviewedImplementationAreas: [],
      checks: {
        approvalGateReady: false,
        approvalGateStillReviewOnly: true
      }
    });
    expect(result.reasons).toContain(
      "Accepted Phase 7.31 composition approval gate evidence is required."
    );
  });

  it("blocks when Phase 7.31 alternative evidence confirmation is missing", () => {
    const result =
      evaluateLocalEmbeddingProviderCompositionImplementationReview({
        ...approvedImplementationReviewInput(),
        phase731AlternativeEvidenceConfirmed: false
      });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForProductSecurityCompositionApproval: false,
      compositionAllowed: false,
      checks: {
        phase731AlternativeEvidenceConfirmed: false
      }
    });
    expect(result.reasons).toContain(
      "Accepted Phase 7.31 alternative resource evidence must be confirmed."
    );
  });

  it("blocks when the exact Core Host composition diff was not reviewed", () => {
    const result =
      evaluateLocalEmbeddingProviderCompositionImplementationReview({
        ...approvedImplementationReviewInput(),
        exactCoreHostDiffReviewed: false
      });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForProductSecurityCompositionApproval: false,
      compositionAllowed: false,
      checks: {
        exactCoreHostDiffReviewed: false
      }
    });
    expect(result.reasons).toContain(
      "Exact apps/core-host composition diff review is required."
    );
  });

  it("blocks missing fallback, resource, sanitized error, lifecycle, rollback, or smoke reviews", () => {
    const result =
      evaluateLocalEmbeddingProviderCompositionImplementationReview({
        ...approvedImplementationReviewInput(),
        fixtureFallbackReviewed: false,
        sanitizedErrorMappingReviewed: false,
        resourceLeaseEnforcementReviewed: false,
        startupRestartBehaviorReviewed: false,
        providerVisibilityReviewed: false,
        rollbackPlanReviewed: false,
        desktopSmokePlanReviewed: false
      });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForProductSecurityCompositionApproval: false,
      compositionAllowed: false,
      checks: {
        fixtureFallbackReviewed: false,
        sanitizedErrorMappingReviewed: false,
        resourceLeaseEnforcementReviewed: false,
        startupRestartBehaviorReviewed: false,
        providerVisibilityReviewed: false,
        rollbackPlanReviewed: false,
        desktopSmokePlanReviewed: false
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Fixture fallback preservation review is required.",
        "Sanitized runtime error mapping review is required.",
        "Resource lease enforcement review is required.",
        "Startup and restart behavior review is required.",
        "Provider visibility review is required.",
        "Rollback plan review is required.",
        "Desktop smoke plan review is required."
      ])
    );
  });

  it("blocks composition, execution, visibility, artifact, cache, or approval mutations", () => {
    const result =
      evaluateLocalEmbeddingProviderCompositionImplementationReview({
        ...approvedImplementationReviewInput(),
        coreHostCompositionChanged: true,
        providerVisibilityChanged: true,
        providerRegistrationEnabled: true,
        executionEnabled: true,
        defaultOptInEnabled: true,
        runtimeLoaded: true,
        inferenceExecuted: true,
        modelArtifactAccessed: true,
        cacheWritesEnabled: true,
        productApprovalGranted: true,
        securityApprovalGranted: true
      });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForProductSecurityCompositionApproval: false,
      compositionApprovalGranted: false,
      compositionAllowed: false,
      coreHostCompositionChanged: false,
      providerVisibilityChanged: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false,
      runtimeLoaded: false,
      inferenceExecuted: false,
      modelArtifactAccessed: false,
      cacheWritesEnabled: false,
      reviewedImplementationAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Core Host composition must not change during implementation review.",
        "Provider visibility must not change during implementation review.",
        "Provider registration must remain disabled until separate approval.",
        "Execution must remain disabled until separate approval.",
        "Default opt-in must remain disabled.",
        "Runtime loading must remain disabled during implementation review.",
        "Inference execution must remain disabled during implementation review.",
        "Model artifact access must remain disabled during implementation review.",
        "Cache writes must remain disabled during implementation review.",
        "Product approval must be granted only in the separate composition approval wave.",
        "Security approval must be granted only in the separate composition approval wave."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});

function approvedImplementationReviewInput() {
  return {
    approvalGate: approvedCompositionApprovalGate(),
    phase731AlternativeEvidenceConfirmed: true,
    compositionRoot: "apps/core-host",
    exactCoreHostDiffReviewed: true,
    explicitOptInBehaviorReviewed: true,
    fixtureFallbackReviewed: true,
    sanitizedErrorMappingReviewed: true,
    resourceLeaseEnforcementReviewed: true,
    startupRestartBehaviorReviewed: true,
    providerVisibilityReviewed: true,
    rollbackPlanReviewed: true,
    desktopSmokePlanReviewed: true,
    coreHostCompositionChanged: false,
    providerVisibilityChanged: false,
    providerRegistrationEnabled: false,
    executionEnabled: false,
    defaultOptInEnabled: false,
    runtimeLoaded: false,
    inferenceExecuted: false,
    modelArtifactAccessed: false,
    cacheWritesEnabled: false,
    productApprovalGranted: false,
    securityApprovalGranted: false
  };
}

function approvedCompositionApprovalGate() {
  return evaluateLocalEmbeddingCompositionApprovalGate({
    preflight: approvedCompositionPreflight(),
    readiness: assessLocalEmbeddingReadiness({
      ...completeReadinessInputWithoutResourceProfile(),
      resourceProfileAlternativeEvidence: approvedAlternativeEvidence()
    }),
    runtimeRegistered: false,
    executionProviderComposed: false,
    explicitEnablementApproved: false
  });
}

function approvedAlternativeEvidence() {
  return evaluateLocalEmbeddingResourceProfileAlternativeEvidence({
    disposition: evaluateLocalEmbeddingResourceProfileDisposition({
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
    }),
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
