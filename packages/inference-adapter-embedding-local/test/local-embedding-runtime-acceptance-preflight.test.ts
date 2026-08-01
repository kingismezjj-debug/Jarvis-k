import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingLicenseApprovalRecord,
  createApprovedLocalEmbeddingManifest,
  createApprovedLocalEmbeddingRuntimeDependencySelectionApprovalRecord,
  createApprovedLocalEmbeddingWindowsPackagingApprovalRecord,
  createApprovedLocalEmbeddingBenchmarkCaptureApprovalRecord,
  createLocalEmbeddingBenchmarkApprovalRecord,
  createLocalEmbeddingBenchmarkCaptureProcedure,
  createLocalEmbeddingLicenseReviewProcedure,
  createLocalEmbeddingRuntimeAdapterDescriptor,
  createLocalEmbeddingRuntimeAcceptancePreflightPolicy,
  evaluateLocalEmbeddingRuntimeAcceptancePreflight,
  evaluateLocalEmbeddingRuntimeAdapterIsolation
} from "../src";

describe("local embedding runtime acceptance preflight", () => {
  it("defines a review-only policy without enabling runtime or packaging actions", () => {
    const policy = createLocalEmbeddingRuntimeAcceptancePreflightPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      runtime: "transformers",
      benchmarkValuesRequiredBeforeEnablement: true,
      metricValuesExposed: false,
      nativeDependencyReviewRequired: true,
      windowsPackagingReviewRequired: true,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      installerCreated: false,
      modelArtifactsBundled: false,
      cacheWritesEnabled: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("accepts approved review procedures while deferring real benchmark values", () => {
    const runtimeAdapterIsolation = evaluateLocalEmbeddingRuntimeAdapterIsolation(
      approvedRuntimeAdapterIsolationInput()
    );
    const result = evaluateLocalEmbeddingRuntimeAcceptancePreflight({
      manifest: createApprovedLocalEmbeddingManifest(),
      benchmarkCaptureProcedure: createLocalEmbeddingBenchmarkCaptureProcedure({
        profilesConfirmed: true,
        datasetDefined: true,
        latencyMethodDefined: true,
        memoryMethodDefined: true,
        qualityMethodDefined: true,
        resourceIsolationDefined: true,
        failureDegradationDefined: true,
        privacySanitized: true,
        metricValuesCaptured: false,
        approvalRecordLocal: true,
        downloadEnabled: false,
        executionEnabled: false,
        verificationClean: true
      }),
      benchmarkCaptureApproval:
        createApprovedLocalEmbeddingBenchmarkCaptureApprovalRecord(),
      benchmarkResultApproval: createLocalEmbeddingBenchmarkApprovalRecord(),
      licenseReviewProcedure: createLocalEmbeddingLicenseReviewProcedure({
        modelWeightsReviewed: true,
        runtimeDependenciesReviewed: true,
        tokenizerComponentsReviewed: true,
        nativeDependenciesReviewed: true,
        redistributionTermsReviewed: true,
        noticeBundleDefined: true,
        approvalRecordLocal: true,
        downloadEnabled: false,
        executionEnabled: false,
        verificationClean: true
      }),
      licenseApproval: createApprovedLocalEmbeddingLicenseApprovalRecord(),
      packagingApproval:
        createApprovedLocalEmbeddingWindowsPackagingApprovalRecord(),
      runtimeDependencySelection:
        createApprovedLocalEmbeddingRuntimeDependencySelectionApprovalRecord(),
      runtimeAdapterIsolation,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      metricValuesCaptured: false,
      verificationClean: true
    });

    expect(result).toMatchObject({
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
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks captured metrics, dependency addition, installer creation, and registration", () => {
    const runtimeAdapterIsolation = evaluateLocalEmbeddingRuntimeAdapterIsolation(
      approvedRuntimeAdapterIsolationInput()
    );
    const result = evaluateLocalEmbeddingRuntimeAcceptancePreflight({
      manifest: createApprovedLocalEmbeddingManifest(),
      benchmarkCaptureProcedure: createLocalEmbeddingBenchmarkCaptureProcedure({
        profilesConfirmed: true,
        datasetDefined: true,
        latencyMethodDefined: true,
        memoryMethodDefined: true,
        qualityMethodDefined: true,
        resourceIsolationDefined: true,
        failureDegradationDefined: true,
        privacySanitized: true,
        metricValuesCaptured: false,
        approvalRecordLocal: true,
        downloadEnabled: false,
        executionEnabled: false,
        verificationClean: true
      }),
      benchmarkCaptureApproval:
        createApprovedLocalEmbeddingBenchmarkCaptureApprovalRecord(),
      benchmarkResultApproval: {
        ...createLocalEmbeddingBenchmarkApprovalRecord(),
        status: "approved",
        profiles: createLocalEmbeddingBenchmarkApprovalRecord().profiles.map(
          (profile) => ({
            ...profile,
            status: "approved" as const,
            latencyProfileCaptured: true,
            memoryProfileCaptured: true,
            qualityProfileCaptured: true
          })
        )
      },
      licenseReviewProcedure: createLocalEmbeddingLicenseReviewProcedure({
        modelWeightsReviewed: true,
        runtimeDependenciesReviewed: true,
        tokenizerComponentsReviewed: true,
        nativeDependenciesReviewed: true,
        redistributionTermsReviewed: true,
        noticeBundleDefined: true,
        approvalRecordLocal: true,
        downloadEnabled: false,
        executionEnabled: false,
        verificationClean: true
      }),
      licenseApproval: createApprovedLocalEmbeddingLicenseApprovalRecord(),
      packagingApproval: {
        ...createApprovedLocalEmbeddingWindowsPackagingApprovalRecord(),
        installer: {
          ...createApprovedLocalEmbeddingWindowsPackagingApprovalRecord()
            .installer,
          installerCreated: true as false
        }
      },
      runtimeDependencySelection: {
        ...createApprovedLocalEmbeddingRuntimeDependencySelectionApprovalRecord(),
        runtimeDependenciesIntroduced: true as false
      },
      runtimeAdapterIsolation,
      runtimeDependenciesIntroduced: true,
      downloadEnabled: true,
      executionEnabled: true,
      providerRegistrationEnabled: true,
      defaultOptInEnabled: true,
      metricValuesCaptured: true,
      verificationClean: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForRuntimeBackedCapture: false,
      metricValuesCaptured: false,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      installerCreated: false,
      modelArtifactsBundled: false,
      cacheWritesEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Benchmark result values must remain pending and uncaptured in this preflight.",
        "Windows packaging and cache policy approval is missing or regressed.",
        "Runtime dependency selection approval is missing or regressed.",
        "Runtime dependencies must remain absent in this preflight.",
        "Downloads must remain disabled in this preflight.",
        "Execution must remain disabled in this preflight.",
        "Provider registration is deferred until a later explicit wave.",
        "Default opt-in is deferred until a later explicit wave."
      ])
    );
  });

  it("fails closed with missing review evidence and does not expose raw values", () => {
    const result = evaluateLocalEmbeddingRuntimeAcceptancePreflight({
      metricValuesCaptured: false,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      verificationClean: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForRuntimeBackedCapture: false,
      metricValuesCaptured: false,
      metricValuesExposed: false,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});

function approvedRuntimeAdapterIsolationInput() {
  return {
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
  };
}
