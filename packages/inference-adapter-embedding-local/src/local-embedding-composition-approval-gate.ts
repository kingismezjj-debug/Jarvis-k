import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import type { LocalEmbeddingCompositionPreflightResult } from "./local-embedding-composition-preflight";
import type { LocalEmbeddingReadinessReport } from "./local-embedding-readiness-provider";

export type LocalEmbeddingCompositionApprovalGateStatus =
  | "blocked"
  | "deferred_pending_readiness"
  | "ready_for_manual_composition_approval";

export interface LocalEmbeddingCompositionApprovalGateInput {
  preflight?: LocalEmbeddingCompositionPreflightResult;
  readiness?: LocalEmbeddingReadinessReport;
  runtimeRegistered?: boolean;
  executionProviderComposed?: boolean;
  explicitEnablementApproved?: boolean;
}

export interface LocalEmbeddingCompositionApprovalGateChecks {
  preflightReviewReady: boolean;
  preflightSideEffectsDisabled: boolean;
  fallbackProviderPreserved: boolean;
  verificationClean: boolean;
  readinessEvidencePresent: boolean;
  readinessComplete: boolean;
  runtimeUnregistered: boolean;
  executionProviderUncomposed: boolean;
  explicitEnablementPending: boolean;
}

export interface LocalEmbeddingCompositionApprovalGateResult {
  provider: string;
  modelId: string;
  runtime: "transformers";
  status: LocalEmbeddingCompositionApprovalGateStatus;
  accepted: boolean;
  reviewBoundaryAccepted: boolean;
  readyForManualCompositionApproval: boolean;
  manualApprovalRequired: true;
  compositionApprovalGranted: false;
  compositionAllowed: false;
  providerRegistrationEnabled: false;
  executionEnabled: false;
  defaultOptInEnabled: false;
  pendingReadinessKeys: string[];
  checks: LocalEmbeddingCompositionApprovalGateChecks;
  reasons: string[];
}

export function evaluateLocalEmbeddingCompositionApprovalGate(
  input: LocalEmbeddingCompositionApprovalGateInput = {}
): LocalEmbeddingCompositionApprovalGateResult {
  const preflight = input.preflight;
  const readiness = input.readiness;
  const checks: LocalEmbeddingCompositionApprovalGateChecks = {
    preflightReviewReady:
      preflight?.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
      preflight.modelId === LOCAL_EMBEDDING_MODEL_ID &&
      preflight.runtime === "transformers" &&
      preflight.accepted === true &&
      preflight.readyForExplicitCompositionReview === true,
    preflightSideEffectsDisabled:
      preflight?.compositionAllowed === false &&
      preflight.providerRegistrationEnabled === false &&
      preflight.executionEnabled === false &&
      preflight.defaultOptInEnabled === false &&
      preflight.runtimeDependenciesIntroduced === false &&
      preflight.downloadEnabled === false &&
      preflight.modelArtifactAccessed === false &&
      preflight.cacheWritesEnabled === false &&
      preflight.installerCreated === false &&
      preflight.modelArtifactsBundled === false &&
      preflight.runtimeLoaded === false &&
      preflight.inferenceExecuted === false,
    fallbackProviderPreserved:
      preflight?.checks.fallbackProviderAvailable === true,
    verificationClean: preflight?.checks.verificationClean === true,
    readinessEvidencePresent: readiness !== undefined,
    readinessComplete: readiness?.readyForComposition === true,
    runtimeUnregistered: input.runtimeRegistered === false,
    executionProviderUncomposed: input.executionProviderComposed === false,
    explicitEnablementPending: input.explicitEnablementApproved === false
  };
  const reviewBoundaryAccepted =
    checks.preflightReviewReady &&
    checks.preflightSideEffectsDisabled &&
    checks.fallbackProviderPreserved &&
    checks.verificationClean &&
    checks.readinessEvidencePresent &&
    checks.runtimeUnregistered &&
    checks.executionProviderUncomposed &&
    checks.explicitEnablementPending;
  const accepted = reviewBoundaryAccepted && checks.readinessComplete;
  const pendingReadinessKeys =
    readiness?.checks
      .filter((check) => !check.satisfied)
      .map((check) => check.key) ?? ["readiness.evidence"];
  const status: LocalEmbeddingCompositionApprovalGateStatus =
    !reviewBoundaryAccepted
      ? "blocked"
      : !checks.readinessComplete
        ? "deferred_pending_readiness"
        : "ready_for_manual_composition_approval";

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    status,
    accepted,
    reviewBoundaryAccepted,
    readyForManualCompositionApproval: accepted,
    manualApprovalRequired: true,
    compositionApprovalGranted: false,
    compositionAllowed: false,
    providerRegistrationEnabled: false,
    executionEnabled: false,
    defaultOptInEnabled: false,
    pendingReadinessKeys,
    checks,
    reasons: createReasons(checks, pendingReadinessKeys, accepted)
  };
}

function createReasons(
  checks: LocalEmbeddingCompositionApprovalGateChecks,
  pendingReadinessKeys: string[],
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.preflightReviewReady) {
    reasons.push("Composition preflight is missing or not ready for explicit review.");
  }
  if (!checks.preflightSideEffectsDisabled) {
    reasons.push("Composition review requires every runtime and product side effect to remain disabled.");
  }
  if (!checks.fallbackProviderPreserved) {
    reasons.push("Fixture or other fallback provider must remain available.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }
  if (!checks.readinessEvidencePresent) {
    reasons.push("Local embedding readiness evidence is missing.");
  }
  if (!checks.readinessComplete) {
    for (const key of pendingReadinessKeys) {
      reasons.push(`Readiness gate remains pending: ${key}.`);
    }
  }
  if (!checks.runtimeUnregistered) {
    reasons.push("Runtime registration must remain disabled during composition approval review.");
  }
  if (!checks.executionProviderUncomposed) {
    reasons.push("Execution provider composition must remain disabled during approval review.");
  }
  if (!checks.explicitEnablementPending) {
    reasons.push("Execution enablement approval is not granted by this review-only gate.");
  }
  if (accepted) {
    reasons.push(
      "Manual product and security approval is still required before provider registration or execution enablement."
    );
  }

  return reasons;
}
