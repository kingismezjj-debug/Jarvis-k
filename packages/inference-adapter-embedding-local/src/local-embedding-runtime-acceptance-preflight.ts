import type { ModelManifest } from "@jarvis-k/contracts";
import {
  type LocalEmbeddingBenchmarkApprovalRecord
} from "./local-embedding-benchmark-approval";
import {
  isLocalEmbeddingBenchmarkCaptureApprovalRecordApproved,
  type LocalEmbeddingBenchmarkCaptureApprovalRecord,
  type LocalEmbeddingBenchmarkCaptureProcedure
} from "./local-embedding-benchmark-capture-procedure";
import {
  isLocalEmbeddingLicenseApprovalRecordApproved,
  type LocalEmbeddingLicenseApprovalRecord
} from "./local-embedding-license-approval";
import type { LocalEmbeddingLicenseReviewProcedure } from "./local-embedding-license-review-procedure";
import {
  isLocalEmbeddingWindowsPackagingApprovalRecordApproved,
  type LocalEmbeddingWindowsPackagingApprovalRecord
} from "./local-embedding-windows-packaging-approval";
import {
  isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved,
  type LocalEmbeddingRuntimeDependencySelectionApprovalRecord
} from "./local-embedding-runtime-dependency-selection";
import type { LocalEmbeddingRuntimeAdapterIsolationResult } from "./local-embedding-runtime-adapter-isolation";
import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";

export type LocalEmbeddingRuntimeAcceptancePreflightStatus =
  | "blocked"
  | "ready_for_runtime_backed_capture";

export interface LocalEmbeddingRuntimeAcceptancePreflightPolicy {
  provider: string;
  modelId: string;
  runtime: "transformers";
  benchmarkValuesRequiredBeforeEnablement: true;
  metricValuesExposed: false;
  nativeDependencyReviewRequired: true;
  windowsPackagingReviewRequired: true;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  installerCreated: false;
  modelArtifactsBundled: false;
  cacheWritesEnabled: false;
}

export interface LocalEmbeddingRuntimeAcceptancePreflightInput {
  manifest?: ModelManifest;
  benchmarkCaptureProcedure?: LocalEmbeddingBenchmarkCaptureProcedure;
  benchmarkCaptureApproval?: LocalEmbeddingBenchmarkCaptureApprovalRecord;
  benchmarkResultApproval?: LocalEmbeddingBenchmarkApprovalRecord;
  licenseReviewProcedure?: LocalEmbeddingLicenseReviewProcedure;
  licenseApproval?: LocalEmbeddingLicenseApprovalRecord;
  packagingApproval?: LocalEmbeddingWindowsPackagingApprovalRecord;
  runtimeDependencySelection?: LocalEmbeddingRuntimeDependencySelectionApprovalRecord;
  runtimeAdapterIsolation?: LocalEmbeddingRuntimeAdapterIsolationResult;
  runtimeDependenciesIntroduced?: boolean;
  downloadEnabled?: boolean;
  executionEnabled?: boolean;
  providerRegistrationEnabled?: boolean;
  defaultOptInEnabled?: boolean;
  metricValuesCaptured?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingRuntimeAcceptancePreflightChecks {
  benchmarkCaptureProcedureApproved: boolean;
  benchmarkCaptureApprovalApproved: boolean;
  benchmarkResultCaptureDeferred: boolean;
  licenseReviewApproved: boolean;
  licenseApprovalApproved: boolean;
  windowsPackagingApproved: boolean;
  runtimeDependencySelectionApproved: boolean;
  runtimeAdapterIsolationApproved: boolean;
  runtimeDependenciesAbsent: boolean;
  downloadsDisabled: boolean;
  executionDisabled: boolean;
  providerRegistrationDisabled: boolean;
  defaultOptInDisabled: boolean;
  verificationClean: boolean;
}

export interface LocalEmbeddingRuntimeAcceptancePreflightResult {
  provider: string;
  modelId: string;
  runtime: "transformers";
  status: LocalEmbeddingRuntimeAcceptancePreflightStatus;
  accepted: boolean;
  readyForRuntimeBackedCapture: boolean;
  metricValuesCaptured: false;
  metricValuesExposed: false;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  installerCreated: false;
  modelArtifactsBundled: false;
  cacheWritesEnabled: false;
  checks: LocalEmbeddingRuntimeAcceptancePreflightChecks;
  reasons: string[];
}

export function createLocalEmbeddingRuntimeAcceptancePreflightPolicy(): LocalEmbeddingRuntimeAcceptancePreflightPolicy {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
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
  };
}

export function evaluateLocalEmbeddingRuntimeAcceptancePreflight(
  input: LocalEmbeddingRuntimeAcceptancePreflightInput = {}
): LocalEmbeddingRuntimeAcceptancePreflightResult {
  const checks: LocalEmbeddingRuntimeAcceptancePreflightChecks = {
    benchmarkCaptureProcedureApproved:
      input.benchmarkCaptureProcedure?.status === "ready_for_approval" &&
      input.benchmarkCaptureProcedure.downloadEnabled === false &&
      input.benchmarkCaptureProcedure.executionEnabled === false &&
      input.benchmarkCaptureProcedure.metricValuesExposed === false &&
      input.benchmarkCaptureProcedure.steps.every(
        (step) => step.satisfied === true
      ),
    benchmarkCaptureApprovalApproved:
      input.benchmarkCaptureApproval !== undefined &&
      input.benchmarkCaptureProcedure !== undefined &&
      isLocalEmbeddingBenchmarkCaptureApprovalRecordApproved(
        input.benchmarkCaptureApproval,
        input.benchmarkCaptureProcedure
      ),
    benchmarkResultCaptureDeferred: isBenchmarkResultCaptureDeferred(
      input.benchmarkResultApproval,
      input.metricValuesCaptured
    ),
    licenseReviewApproved:
      input.licenseReviewProcedure?.status === "ready_for_approval" &&
      input.licenseReviewProcedure.downloadEnabled === false &&
      input.licenseReviewProcedure.executionEnabled === false &&
      input.licenseReviewProcedure.licenseValuesExposed === false &&
      input.licenseReviewProcedure.steps.every(
        (step) => step.satisfied === true
      ),
    licenseApprovalApproved:
      input.manifest !== undefined &&
      input.licenseApproval !== undefined &&
      isLocalEmbeddingLicenseApprovalRecordApproved(
        input.licenseApproval,
        input.manifest
      ),
    windowsPackagingApproved:
      input.packagingApproval !== undefined &&
      isLocalEmbeddingWindowsPackagingApprovalRecordApproved(
        input.packagingApproval
      ),
    runtimeDependencySelectionApproved:
      input.runtimeDependencySelection !== undefined &&
      isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved(
        input.runtimeDependencySelection
      ),
    runtimeAdapterIsolationApproved:
      input.runtimeAdapterIsolation?.accepted === true &&
      input.runtimeAdapterIsolation.readyForDependencyApproval === true &&
      input.runtimeAdapterIsolation.compositionAllowed === false &&
      input.runtimeAdapterIsolation.executionEnabled === false &&
      input.runtimeAdapterIsolation.providerRegistrationEnabled === false &&
      input.runtimeAdapterIsolation.defaultOptInEnabled === false,
    runtimeDependenciesAbsent: input.runtimeDependenciesIntroduced === false,
    downloadsDisabled: input.downloadEnabled === false,
    executionDisabled: input.executionEnabled === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    status: accepted ? "ready_for_runtime_backed_capture" : "blocked",
    accepted,
    readyForRuntimeBackedCapture: accepted,
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
    checks,
    reasons: createReasons(checks)
  };
}

function isBenchmarkResultCaptureDeferred(
  approval: LocalEmbeddingBenchmarkApprovalRecord | undefined,
  metricValuesCaptured: boolean | undefined
): boolean {
  return (
    approval?.status === "pending" &&
    approval.downloadEnabled === false &&
    approval.executionEnabled === false &&
    approval.profiles.every(
      (profile) =>
        profile.latencyProfileCaptured === false &&
        profile.memoryProfileCaptured === false &&
        profile.qualityProfileCaptured === false
    ) &&
    metricValuesCaptured === false
  );
}

function createReasons(
  checks: LocalEmbeddingRuntimeAcceptancePreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.benchmarkCaptureProcedureApproved) {
    reasons.push("Benchmark capture procedure is not approved and sanitized.");
  }
  if (!checks.benchmarkCaptureApprovalApproved) {
    reasons.push("Benchmark capture approval record is missing or regressed.");
  }
  if (!checks.benchmarkResultCaptureDeferred) {
    reasons.push(
      "Benchmark result values must remain pending and uncaptured in this preflight."
    );
  }
  if (!checks.licenseReviewApproved) {
    reasons.push("License and native-dependency review procedure is incomplete.");
  }
  if (!checks.licenseApprovalApproved) {
    reasons.push("License and redistribution approval is missing or regressed.");
  }
  if (!checks.windowsPackagingApproved) {
    reasons.push("Windows packaging and cache policy approval is missing or regressed.");
  }
  if (!checks.runtimeDependencySelectionApproved) {
    reasons.push("Runtime dependency selection approval is missing or regressed.");
  }
  if (!checks.runtimeAdapterIsolationApproved) {
    reasons.push("Runtime adapter isolation is not ready for the next approval stage.");
  }
  if (!checks.runtimeDependenciesAbsent) {
    reasons.push("Runtime dependencies must remain absent in this preflight.");
  }
  if (!checks.downloadsDisabled) {
    reasons.push("Downloads must remain disabled in this preflight.");
  }
  if (!checks.executionDisabled) {
    reasons.push("Execution must remain disabled in this preflight.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Provider registration is deferred until a later explicit wave.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Default opt-in is deferred until a later explicit wave.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
