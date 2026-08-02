import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import type { LocalEmbeddingResourceProfileDispositionResult } from "./local-embedding-resource-profile-disposition";

export type LocalEmbeddingResourceProfileAlternativeEvidenceStatus =
  | "blocked"
  | "accepted_for_composition_review_only";

export interface LocalEmbeddingResourceProfileAlternativeEvidenceInput {
  disposition?: LocalEmbeddingResourceProfileDispositionResult;
  productApprovalForAlternativeEvidence?: boolean;
  securityApprovalForAlternativeEvidence?: boolean;
  boundedSamplingAttemptsAccepted?: boolean;
  successfulRuntimeBenchmarkAccepted?: boolean;
  cleanupAccepted?: boolean;
  sanitizedFailureReasonAccepted?: boolean;
  productSloCreated?: boolean;
  uiOrCoreExposureEnabled?: boolean;
  providerRegistrationEnabled?: boolean;
  executionEnabled?: boolean;
  defaultOptInEnabled?: boolean;
}

export interface LocalEmbeddingResourceProfileAlternativeEvidenceChecks {
  dispositionAccepted: boolean;
  dispositionDeferred: boolean;
  resourceProfileIncomplete: boolean;
  originalReadinessUnsatisfied: boolean;
  productApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  boundedSamplingAttemptsAccepted: boolean;
  successfulRuntimeBenchmarkAccepted: boolean;
  cleanupAccepted: boolean;
  sanitizedFailureReasonAccepted: boolean;
  productSloAbsent: boolean;
  uiAndCoreExposureDisabled: boolean;
  providerRegistrationDisabled: boolean;
  executionDisabled: boolean;
  defaultOptInDisabled: boolean;
}

export interface LocalEmbeddingResourceProfileAlternativeEvidenceResult {
  provider: string;
  modelId: string;
  runtime: "transformers";
  status: LocalEmbeddingResourceProfileAlternativeEvidenceStatus;
  accepted: boolean;
  satisfiesResourceProfileRequirementForCompositionReview: boolean;
  compositionReviewOnly: true;
  productSloCreated: false;
  uiOrCoreExposureEnabled: false;
  compositionAllowed: false;
  providerRegistrationEnabled: false;
  executionEnabled: false;
  defaultOptInEnabled: false;
  checks: LocalEmbeddingResourceProfileAlternativeEvidenceChecks;
  reasons: string[];
}

export function evaluateLocalEmbeddingResourceProfileAlternativeEvidence(
  input: LocalEmbeddingResourceProfileAlternativeEvidenceInput = {}
): LocalEmbeddingResourceProfileAlternativeEvidenceResult {
  const disposition = input.disposition;
  const checks: LocalEmbeddingResourceProfileAlternativeEvidenceChecks = {
    dispositionAccepted:
      disposition?.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
      disposition.modelId === LOCAL_EMBEDDING_MODEL_ID &&
      disposition.runtime === "transformers" &&
      disposition.accepted === true &&
      disposition.dispositionRecorded === true,
    dispositionDeferred:
      disposition?.status === "recorded_deferred_diagnostic_gap",
    resourceProfileIncomplete:
      disposition?.resourceProfileComplete === false,
    originalReadinessUnsatisfied:
      disposition?.readinessSatisfied === false,
    productApprovalGranted:
      input.productApprovalForAlternativeEvidence === true,
    securityApprovalGranted:
      input.securityApprovalForAlternativeEvidence === true,
    boundedSamplingAttemptsAccepted:
      input.boundedSamplingAttemptsAccepted === true,
    successfulRuntimeBenchmarkAccepted:
      input.successfulRuntimeBenchmarkAccepted === true,
    cleanupAccepted: input.cleanupAccepted === true,
    sanitizedFailureReasonAccepted:
      input.sanitizedFailureReasonAccepted === true,
    productSloAbsent: input.productSloCreated === false,
    uiAndCoreExposureDisabled:
      input.uiOrCoreExposureEnabled === false,
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
    status: accepted
      ? "accepted_for_composition_review_only"
      : "blocked",
    accepted,
    satisfiesResourceProfileRequirementForCompositionReview: accepted,
    compositionReviewOnly: true,
    productSloCreated: false,
    uiOrCoreExposureEnabled: false,
    compositionAllowed: false,
    providerRegistrationEnabled: false,
    executionEnabled: false,
    defaultOptInEnabled: false,
    checks,
    reasons: createReasons(checks, accepted)
  };
}

export function isLocalEmbeddingResourceProfileAlternativeEvidenceAccepted(
  result:
    | LocalEmbeddingResourceProfileAlternativeEvidenceResult
    | undefined
): boolean {
  return (
    result?.accepted === true &&
    result.satisfiesResourceProfileRequirementForCompositionReview === true &&
    result.compositionReviewOnly === true &&
    result.productSloCreated === false &&
    result.uiOrCoreExposureEnabled === false &&
    result.compositionAllowed === false &&
    result.providerRegistrationEnabled === false &&
    result.executionEnabled === false &&
    result.defaultOptInEnabled === false
  );
}

function createReasons(
  checks: LocalEmbeddingResourceProfileAlternativeEvidenceChecks,
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.dispositionAccepted) {
    reasons.push("Accepted Phase 7.30 disposition evidence is required.");
  }
  if (!checks.dispositionDeferred) {
    reasons.push("Alternative evidence applies only to the deferred diagnostic gap.");
  }
  if (!checks.resourceProfileIncomplete) {
    reasons.push("Alternative evidence must not claim resource profile completion.");
  }
  if (!checks.originalReadinessUnsatisfied) {
    reasons.push("Alternative evidence must preserve the original readiness result.");
  }
  if (!checks.productApprovalGranted) {
    reasons.push("Product approval for alternative evidence is required.");
  }
  if (!checks.securityApprovalGranted) {
    reasons.push("Security approval for alternative evidence is required.");
  }
  if (!checks.boundedSamplingAttemptsAccepted) {
    reasons.push("Bounded sampling attempts must be accepted as evidence.");
  }
  if (!checks.successfulRuntimeBenchmarkAccepted) {
    reasons.push("Successful runtime benchmark evidence is required.");
  }
  if (!checks.cleanupAccepted) {
    reasons.push("Cleanup evidence is required.");
  }
  if (!checks.sanitizedFailureReasonAccepted) {
    reasons.push("Sanitized failure reason evidence is required.");
  }
  if (!checks.productSloAbsent) {
    reasons.push("Alternative evidence must not create a product SLO.");
  }
  if (!checks.uiAndCoreExposureDisabled) {
    reasons.push("Alternative evidence must not enter UI or Core.");
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
      "Alternative resource evidence satisfies only the composition-review resource requirement."
    );
  }

  return reasons;
}
