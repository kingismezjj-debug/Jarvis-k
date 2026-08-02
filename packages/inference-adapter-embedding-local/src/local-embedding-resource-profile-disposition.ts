import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import type { LocalEmbeddingResourceProfileApprovalDecision } from "./local-embedding-resource-profile-approval";

export type LocalEmbeddingResourceProfileDispositionStatus =
  | "blocked"
  | "recorded_deferred_diagnostic_gap";

export type LocalEmbeddingResourceProfileDispositionReasonCode =
  | "memory_probe_failed"
  | "helper_pid_unavailable"
  | "memory_sample_invalid";

export interface LocalEmbeddingResourceProfileDispositionInput {
  benchmarkRunCompleted?: boolean;
  artifactVerificationPassed?: boolean;
  runtimeBenchmarkPassed?: boolean;
  temporaryWorkspaceCleaned?: boolean;
  memorySampleCaptured?: boolean;
  memorySampleCount?: number;
  sanitizedReasonCode?: LocalEmbeddingResourceProfileDispositionReasonCode;
  productApproval?: LocalEmbeddingResourceProfileApprovalDecision;
  securityApproval?: LocalEmbeddingResourceProfileApprovalDecision;
  metricValuesExposed?: boolean;
  metricValuesPersisted?: boolean;
  coreHostCompositionChanged?: boolean;
  providerRegistrationEnabled?: boolean;
  executionEnabled?: boolean;
  defaultOptInEnabled?: boolean;
}

export interface LocalEmbeddingResourceProfileDispositionChecks {
  benchmarkRunCompleted: boolean;
  artifactVerificationPassed: boolean;
  runtimeBenchmarkPassed: boolean;
  temporaryWorkspaceCleaned: boolean;
  missingMemorySampleConfirmed: boolean;
  sampleCountBoundedZero: boolean;
  sanitizedReasonCodeAllowed: boolean;
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  metricValuesHidden: boolean;
  metricValuesNotPersisted: boolean;
  coreHostCompositionUnchanged: boolean;
  providerRegistrationDisabled: boolean;
  executionDisabled: boolean;
  defaultOptInDisabled: boolean;
}

export interface LocalEmbeddingResourceProfileDispositionResult {
  provider: string;
  modelId: string;
  runtime: "transformers";
  status: LocalEmbeddingResourceProfileDispositionStatus;
  accepted: boolean;
  dispositionRecorded: boolean;
  resourceProfileComplete: false;
  readinessSatisfied: false;
  compositionAllowed: false;
  providerRegistrationEnabled: false;
  executionEnabled: false;
  defaultOptInEnabled: false;
  checks: LocalEmbeddingResourceProfileDispositionChecks;
  reasons: string[];
}

const allowedReasonCodes: readonly LocalEmbeddingResourceProfileDispositionReasonCode[] =
  ["memory_probe_failed", "helper_pid_unavailable", "memory_sample_invalid"];

export function evaluateLocalEmbeddingResourceProfileDisposition(
  input: LocalEmbeddingResourceProfileDispositionInput = {}
): LocalEmbeddingResourceProfileDispositionResult {
  const checks: LocalEmbeddingResourceProfileDispositionChecks = {
    benchmarkRunCompleted: input.benchmarkRunCompleted === true,
    artifactVerificationPassed: input.artifactVerificationPassed === true,
    runtimeBenchmarkPassed: input.runtimeBenchmarkPassed === true,
    temporaryWorkspaceCleaned: input.temporaryWorkspaceCleaned === true,
    missingMemorySampleConfirmed: input.memorySampleCaptured === false,
    sampleCountBoundedZero: input.memorySampleCount === 0,
    sanitizedReasonCodeAllowed:
      input.sanitizedReasonCode !== undefined &&
      allowedReasonCodes.includes(input.sanitizedReasonCode),
    productApprovalGranted: input.productApproval === "approved",
    securityApprovalGranted: input.securityApproval === "approved",
    metricValuesHidden: input.metricValuesExposed === false,
    metricValuesNotPersisted: input.metricValuesPersisted === false,
    coreHostCompositionUnchanged:
      input.coreHostCompositionChanged === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    executionDisabled: input.executionEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false
  };
  const accepted = Object.values(checks).every(Boolean);

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    status: accepted ? "recorded_deferred_diagnostic_gap" : "blocked",
    accepted,
    dispositionRecorded: accepted,
    resourceProfileComplete: false,
    readinessSatisfied: false,
    compositionAllowed: false,
    providerRegistrationEnabled: false,
    executionEnabled: false,
    defaultOptInEnabled: false,
    checks,
    reasons: createDispositionReasons(checks, accepted)
  };
}

function createDispositionReasons(
  checks: LocalEmbeddingResourceProfileDispositionChecks,
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.benchmarkRunCompleted) {
    reasons.push("Approved temporary benchmark completion is required.");
  }
  if (!checks.artifactVerificationPassed) {
    reasons.push("Artifact verification must pass before disposition.");
  }
  if (!checks.runtimeBenchmarkPassed) {
    reasons.push("Runtime benchmark must pass before disposition.");
  }
  if (!checks.temporaryWorkspaceCleaned) {
    reasons.push("Temporary workspace and cache cleanup must pass.");
  }
  if (!checks.missingMemorySampleConfirmed) {
    reasons.push("Disposition applies only to a confirmed missing memory sample.");
  }
  if (!checks.sampleCountBoundedZero) {
    reasons.push("Disposition must not carry a memory sample value.");
  }
  if (!checks.sanitizedReasonCodeAllowed) {
    reasons.push("Disposition requires an allowed sanitized reason code.");
  }
  if (!checks.productApprovalGranted) {
    reasons.push("Product approval for diagnostic-only use is required.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval for the temporary benchmark is required.");
  }
  if (!checks.metricValuesHidden) {
    reasons.push("Resource metric values must remain hidden.");
  }
  if (!checks.metricValuesNotPersisted) {
    reasons.push("Resource metric values must not be persisted.");
  }
  if (!checks.coreHostCompositionUnchanged) {
    reasons.push("Core Host composition must remain unchanged.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Provider registration must remain disabled.");
  }
  if (!checks.executionDisabled) {
    reasons.push("Execution must remain disabled.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Default opt-in must remain disabled.");
  }
  if (accepted) {
    reasons.push(
      "Memory sampling gap is formally dispositioned as deferred and does not satisfy readiness."
    );
  }

  return reasons;
}
