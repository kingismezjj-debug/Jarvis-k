import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import { LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT } from "./local-embedding-runtime-strategy";
import type { LocalEmbeddingCompositionApprovalGateResult } from "./local-embedding-composition-approval-gate";

export type LocalEmbeddingProviderCompositionImplementationReviewStatus =
  | "blocked"
  | "ready_for_product_security_composition_approval";

export interface LocalEmbeddingProviderCompositionImplementationReviewInput {
  approvalGate?: LocalEmbeddingCompositionApprovalGateResult;
  phase731AlternativeEvidenceConfirmed?: boolean;
  compositionRoot?: string;
  exactCoreHostDiffReviewed?: boolean;
  explicitOptInBehaviorReviewed?: boolean;
  fixtureFallbackReviewed?: boolean;
  sanitizedErrorMappingReviewed?: boolean;
  resourceLeaseEnforcementReviewed?: boolean;
  startupRestartBehaviorReviewed?: boolean;
  providerVisibilityReviewed?: boolean;
  rollbackPlanReviewed?: boolean;
  desktopSmokePlanReviewed?: boolean;
  coreHostCompositionChanged?: boolean;
  providerVisibilityChanged?: boolean;
  providerRegistrationEnabled?: boolean;
  executionEnabled?: boolean;
  defaultOptInEnabled?: boolean;
  runtimeLoaded?: boolean;
  inferenceExecuted?: boolean;
  modelArtifactAccessed?: boolean;
  cacheWritesEnabled?: boolean;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
}

export interface LocalEmbeddingProviderCompositionImplementationReviewChecks {
  approvalGateReady: boolean;
  approvalGateStillReviewOnly: boolean;
  phase731AlternativeEvidenceConfirmed: boolean;
  compositionRootRestricted: boolean;
  exactCoreHostDiffReviewed: boolean;
  explicitOptInBehaviorReviewed: boolean;
  fixtureFallbackReviewed: boolean;
  sanitizedErrorMappingReviewed: boolean;
  resourceLeaseEnforcementReviewed: boolean;
  startupRestartBehaviorReviewed: boolean;
  providerVisibilityReviewed: boolean;
  rollbackPlanReviewed: boolean;
  desktopSmokePlanReviewed: boolean;
  coreHostCompositionUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  providerRegistrationDisabled: boolean;
  executionDisabled: boolean;
  defaultOptInDisabled: boolean;
  runtimeLoadingDisabled: boolean;
  inferenceExecutionDisabled: boolean;
  modelArtifactAccessDisabled: boolean;
  cacheWritesDisabled: boolean;
  productApprovalStillPending: boolean;
  securityApprovalStillPending: boolean;
}

export interface LocalEmbeddingProviderCompositionImplementationReviewResult {
  provider: string;
  modelId: string;
  runtime: "transformers";
  compositionRoot: string;
  status: LocalEmbeddingProviderCompositionImplementationReviewStatus;
  accepted: boolean;
  readyForProductSecurityCompositionApproval: boolean;
  implementationReviewOnly: true;
  compositionApprovalGranted: false;
  compositionAllowed: false;
  coreHostCompositionChanged: false;
  providerVisibilityChanged: false;
  providerRegistrationEnabled: false;
  executionEnabled: false;
  defaultOptInEnabled: false;
  runtimeLoaded: false;
  inferenceExecuted: false;
  modelArtifactAccessed: false;
  cacheWritesEnabled: false;
  reviewedImplementationAreas: string[];
  checks: LocalEmbeddingProviderCompositionImplementationReviewChecks;
  reasons: string[];
}

export function evaluateLocalEmbeddingProviderCompositionImplementationReview(
  input: LocalEmbeddingProviderCompositionImplementationReviewInput = {}
): LocalEmbeddingProviderCompositionImplementationReviewResult {
  const approvalGate = input.approvalGate;
  const checks: LocalEmbeddingProviderCompositionImplementationReviewChecks = {
    approvalGateReady:
      approvalGate?.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
      approvalGate.modelId === LOCAL_EMBEDDING_MODEL_ID &&
      approvalGate.runtime === "transformers" &&
      approvalGate.accepted === true &&
      approvalGate.readyForManualCompositionApproval === true &&
      approvalGate.status === "ready_for_manual_composition_approval",
    approvalGateStillReviewOnly:
      approvalGate?.compositionApprovalGranted === false &&
      approvalGate.compositionAllowed === false &&
      approvalGate.providerRegistrationEnabled === false &&
      approvalGate.executionEnabled === false &&
      approvalGate.defaultOptInEnabled === false,
    phase731AlternativeEvidenceConfirmed:
      input.phase731AlternativeEvidenceConfirmed === true,
    compositionRootRestricted:
      input.compositionRoot === LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    exactCoreHostDiffReviewed:
      input.exactCoreHostDiffReviewed === true,
    explicitOptInBehaviorReviewed:
      input.explicitOptInBehaviorReviewed === true,
    fixtureFallbackReviewed: input.fixtureFallbackReviewed === true,
    sanitizedErrorMappingReviewed:
      input.sanitizedErrorMappingReviewed === true,
    resourceLeaseEnforcementReviewed:
      input.resourceLeaseEnforcementReviewed === true,
    startupRestartBehaviorReviewed:
      input.startupRestartBehaviorReviewed === true,
    providerVisibilityReviewed:
      input.providerVisibilityReviewed === true,
    rollbackPlanReviewed: input.rollbackPlanReviewed === true,
    desktopSmokePlanReviewed: input.desktopSmokePlanReviewed === true,
    coreHostCompositionUnchanged:
      input.coreHostCompositionChanged === false,
    providerVisibilityUnchanged:
      input.providerVisibilityChanged === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    executionDisabled: input.executionEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    runtimeLoadingDisabled: input.runtimeLoaded === false,
    inferenceExecutionDisabled: input.inferenceExecuted === false,
    modelArtifactAccessDisabled: input.modelArtifactAccessed === false,
    cacheWritesDisabled: input.cacheWritesEnabled === false,
    productApprovalStillPending:
      input.productApprovalGranted === false,
    securityApprovalStillPending:
      input.securityApprovalGranted === false
  };
  const accepted = Object.values(checks).every(Boolean);

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    status: accepted
      ? "ready_for_product_security_composition_approval"
      : "blocked",
    accepted,
    readyForProductSecurityCompositionApproval: accepted,
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
    reviewedImplementationAreas: accepted
      ? [
          "core_host_composition_diff",
          "explicit_opt_in",
          "fixture_fallback",
          "sanitized_error_mapping",
          "resource_lease_enforcement",
          "startup_restart_behavior",
          "provider_visibility",
          "rollback_plan",
          "desktop_smoke_plan"
        ]
      : [],
    checks,
    reasons: createReasons(checks, accepted)
  };
}

function createReasons(
  checks: LocalEmbeddingProviderCompositionImplementationReviewChecks,
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.approvalGateReady) {
    reasons.push("Accepted Phase 7.31 composition approval gate evidence is required.");
  }
  if (!checks.approvalGateStillReviewOnly) {
    reasons.push("Composition approval gate evidence must remain review-only.");
  }
  if (!checks.phase731AlternativeEvidenceConfirmed) {
    reasons.push("Accepted Phase 7.31 alternative resource evidence must be confirmed.");
  }
  if (!checks.compositionRootRestricted) {
    reasons.push("Provider composition implementation must remain rooted in apps/core-host.");
  }
  if (!checks.exactCoreHostDiffReviewed) {
    reasons.push("Exact apps/core-host composition diff review is required.");
  }
  if (!checks.explicitOptInBehaviorReviewed) {
    reasons.push("Explicit opt-in behavior review is required.");
  }
  if (!checks.fixtureFallbackReviewed) {
    reasons.push("Fixture fallback preservation review is required.");
  }
  if (!checks.sanitizedErrorMappingReviewed) {
    reasons.push("Sanitized runtime error mapping review is required.");
  }
  if (!checks.resourceLeaseEnforcementReviewed) {
    reasons.push("Resource lease enforcement review is required.");
  }
  if (!checks.startupRestartBehaviorReviewed) {
    reasons.push("Startup and restart behavior review is required.");
  }
  if (!checks.providerVisibilityReviewed) {
    reasons.push("Provider visibility review is required.");
  }
  if (!checks.rollbackPlanReviewed) {
    reasons.push("Rollback plan review is required.");
  }
  if (!checks.desktopSmokePlanReviewed) {
    reasons.push("Desktop smoke plan review is required.");
  }
  if (!checks.coreHostCompositionUnchanged) {
    reasons.push("Core Host composition must not change during implementation review.");
  }
  if (!checks.providerVisibilityUnchanged) {
    reasons.push("Provider visibility must not change during implementation review.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Provider registration must remain disabled until separate approval.");
  }
  if (!checks.executionDisabled) {
    reasons.push("Execution must remain disabled until separate approval.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Default opt-in must remain disabled.");
  }
  if (!checks.runtimeLoadingDisabled) {
    reasons.push("Runtime loading must remain disabled during implementation review.");
  }
  if (!checks.inferenceExecutionDisabled) {
    reasons.push("Inference execution must remain disabled during implementation review.");
  }
  if (!checks.modelArtifactAccessDisabled) {
    reasons.push("Model artifact access must remain disabled during implementation review.");
  }
  if (!checks.cacheWritesDisabled) {
    reasons.push("Cache writes must remain disabled during implementation review.");
  }
  if (!checks.productApprovalStillPending) {
    reasons.push("Product approval must be granted only in the separate composition approval wave.");
  }
  if (!checks.securityApprovalStillPending) {
    reasons.push("Security approval must be granted only in the separate composition approval wave.");
  }
  if (accepted) {
    reasons.push(
      "Implementation review materials are ready for separate product and security composition approval."
    );
  }

  return reasons;
}
