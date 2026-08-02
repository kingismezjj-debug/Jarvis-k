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
  evaluateLocalEmbeddingRuntimeAdapterIsolation
} from "../src";
import type { LocalEmbeddingRuntimeAcceptancePreflightResult } from "../src/local-embedding-runtime-acceptance-preflight";

describe("local embedding composition approval gate", () => {
  it("is fail-closed without a review boundary", () => {
    const result = evaluateLocalEmbeddingCompositionApprovalGate();
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      reviewBoundaryAccepted: false,
      readyForManualCompositionApproval: false,
      manualApprovalRequired: true,
      compositionApprovalGranted: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false,
      pendingReadinessKeys: ["readiness.evidence"]
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Composition preflight is missing or not ready for explicit review.",
        "Local embedding readiness evidence is missing.",
        "Runtime registration must remain disabled during composition approval review."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("enters review while the local resource benchmark gate remains deferred", () => {
    const result = evaluateLocalEmbeddingCompositionApprovalGate({
      preflight: approvedCompositionPreflight(),
      readiness: assessLocalEmbeddingReadiness({
        ...completeReadinessInput(),
        benchmarkProfileReady: false
      }),
      runtimeRegistered: false,
      executionProviderComposed: false,
      explicitEnablementApproved: false
    });

    expect(result).toMatchObject({
      status: "deferred_pending_readiness",
      accepted: false,
      reviewBoundaryAccepted: true,
      readyForManualCompositionApproval: false,
      compositionApprovalGranted: false,
      compositionAllowed: false,
      pendingReadinessKeys: ["benchmarks.local_resource_profile"],
      checks: {
        preflightReviewReady: true,
        preflightSideEffectsDisabled: true,
        fallbackProviderPreserved: true,
        verificationClean: true,
        readinessEvidencePresent: true,
        readinessComplete: false,
        runtimeUnregistered: true,
        executionProviderUncomposed: true,
        explicitEnablementPending: true
      }
    });
    expect(result.reasons).toContain(
      "Readiness gate remains pending: benchmarks.local_resource_profile."
    );
  });

  it("never grants composition even when every readiness gate is complete", () => {
    const result = evaluateLocalEmbeddingCompositionApprovalGate({
      preflight: approvedCompositionPreflight(),
      readiness: assessLocalEmbeddingReadiness(completeReadinessInput()),
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

  it("blocks attempted registration, execution composition, or enablement", () => {
    const result = evaluateLocalEmbeddingCompositionApprovalGate({
      preflight: approvedCompositionPreflight(),
      readiness: assessLocalEmbeddingReadiness(completeReadinessInput()),
      runtimeRegistered: true,
      executionProviderComposed: true,
      explicitEnablementApproved: true
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      reviewBoundaryAccepted: false,
      readyForManualCompositionApproval: false,
      compositionApprovalGranted: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Runtime registration must remain disabled during composition approval review.",
        "Execution provider composition must remain disabled during approval review.",
        "Execution enablement approval is not granted by this review-only gate."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});

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

function completeReadinessInput() {
  const artifactPlan = createPinnedLocalEmbeddingArtifactPlan();
  return {
    manifest: createApprovedLocalEmbeddingManifest(),
    artifactPlan,
    artifactPinApproval: createApprovedLocalEmbeddingArtifactPinApprovalRecord(),
    benchmarkApproval: createLocalEmbeddingBenchmarkApprovalRecord({
      status: "approved",
      profiles: createLocalEmbeddingBenchmarkApprovalRecord().profiles.map(
        (profile) => ({
          ...profile,
          status: "approved" as const,
          latencyProfileCaptured: true,
          memoryProfileCaptured: true,
          qualityProfileCaptured: true,
          reasons: []
        })
      ),
      reasons: []
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
    benchmarkProfileReady: true
  };
}
