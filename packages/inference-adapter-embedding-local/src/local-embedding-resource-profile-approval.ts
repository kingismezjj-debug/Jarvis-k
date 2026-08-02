import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";

export type LocalEmbeddingResourceProfileApprovalDecision =
  | "pending"
  | "approved"
  | "rejected";

export type LocalEmbeddingResourceProfileStatus =
  | "blocked"
  | "deferred_pending_sample"
  | "ready_for_product_security_review"
  | "approved_for_composition_review";

export interface LocalEmbeddingResourceProfileApprovalPolicy {
  provider: string;
  modelId: string;
  runtime: "transformers";
  memoryProfileRequiredBeforeComposition: true;
  productApprovalRequired: true;
  securityApprovalRequired: true;
  metricValuesExposed: false;
  metricValuesPersisted: false;
  temporaryWorkspaceRequired: true;
  providerRegistrationEnabled: false;
  executionEnabled: false;
  defaultOptInEnabled: false;
  compositionAllowed: false;
}

export interface LocalEmbeddingResourceProfileApprovalInput {
  benchmarkRunCompleted?: boolean;
  memorySampleCaptured?: boolean;
  memorySampleCount?: number;
  metricValuesExposed?: boolean;
  metricValuesPersisted?: boolean;
  temporaryWorkspaceCleaned?: boolean;
  failureReportingSanitized?: boolean;
  productApproval?: LocalEmbeddingResourceProfileApprovalDecision;
  securityApproval?: LocalEmbeddingResourceProfileApprovalDecision;
  providerRegistrationEnabled?: boolean;
  executionEnabled?: boolean;
  defaultOptInEnabled?: boolean;
}

export interface LocalEmbeddingResourceProfileApprovalChecks {
  benchmarkRunCompleted: boolean;
  memorySampleCaptured: boolean;
  positiveMemorySampleCount: boolean;
  memorySampleCountBounded: boolean;
  metricValuesHidden: boolean;
  metricValuesNotPersisted: boolean;
  temporaryWorkspaceCleaned: boolean;
  failureReportingSanitized: boolean;
  productApprovalPendingOrApproved: boolean;
  securityApprovalPendingOrApproved: boolean;
  providerRegistrationDisabled: boolean;
  executionDisabled: boolean;
  defaultOptInDisabled: boolean;
}

export interface LocalEmbeddingResourceProfileApprovalResult {
  provider: string;
  modelId: string;
  runtime: "transformers";
  status: LocalEmbeddingResourceProfileStatus;
  accepted: boolean;
  resourceProfileComplete: boolean;
  readyForProductSecurityReview: boolean;
  productApproval: LocalEmbeddingResourceProfileApprovalDecision;
  securityApproval: LocalEmbeddingResourceProfileApprovalDecision;
  approvalGranted: boolean;
  compositionAllowed: false;
  providerRegistrationEnabled: false;
  executionEnabled: false;
  defaultOptInEnabled: false;
  checks: LocalEmbeddingResourceProfileApprovalChecks;
  reasons: string[];
}

export function createLocalEmbeddingResourceProfileApprovalPolicy(): LocalEmbeddingResourceProfileApprovalPolicy {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    memoryProfileRequiredBeforeComposition: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    metricValuesExposed: false,
    metricValuesPersisted: false,
    temporaryWorkspaceRequired: true,
    providerRegistrationEnabled: false,
    executionEnabled: false,
    defaultOptInEnabled: false,
    compositionAllowed: false
  };
}

export function evaluateLocalEmbeddingResourceProfileApproval(
  input: LocalEmbeddingResourceProfileApprovalInput = {}
): LocalEmbeddingResourceProfileApprovalResult {
  const productApproval = input.productApproval ?? "pending";
  const securityApproval = input.securityApproval ?? "pending";
  const checks: LocalEmbeddingResourceProfileApprovalChecks = {
    benchmarkRunCompleted: input.benchmarkRunCompleted === true,
    memorySampleCaptured: input.memorySampleCaptured === true,
    positiveMemorySampleCount:
      Number.isInteger(input.memorySampleCount) &&
      (input.memorySampleCount ?? 0) > 0,
    memorySampleCountBounded:
      Number.isInteger(input.memorySampleCount) &&
      (input.memorySampleCount ?? 0) <= 64,
    metricValuesHidden: input.metricValuesExposed === false,
    metricValuesNotPersisted: input.metricValuesPersisted === false,
    temporaryWorkspaceCleaned: input.temporaryWorkspaceCleaned === true,
    failureReportingSanitized: input.failureReportingSanitized === true,
    productApprovalPendingOrApproved:
      productApproval === "pending" || productApproval === "approved",
    securityApprovalPendingOrApproved:
      securityApproval === "pending" || securityApproval === "approved",
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    executionDisabled: input.executionEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false
  };
  const safetyBoundaryAccepted =
    checks.benchmarkRunCompleted &&
    checks.metricValuesHidden &&
    checks.metricValuesNotPersisted &&
    checks.temporaryWorkspaceCleaned &&
    checks.failureReportingSanitized &&
    checks.memorySampleCountBounded &&
    checks.productApprovalPendingOrApproved &&
    checks.securityApprovalPendingOrApproved &&
    checks.providerRegistrationDisabled &&
    checks.executionDisabled &&
    checks.defaultOptInDisabled;
  const resourceProfileComplete =
    safetyBoundaryAccepted &&
    checks.memorySampleCaptured &&
    checks.positiveMemorySampleCount;
  const approvalsGranted =
    productApproval === "approved" && securityApproval === "approved";
  const accepted = resourceProfileComplete && approvalsGranted;
  const status: LocalEmbeddingResourceProfileStatus =
    !safetyBoundaryAccepted
      ? "blocked"
      : !resourceProfileComplete
        ? "deferred_pending_sample"
        : !approvalsGranted
          ? "ready_for_product_security_review"
          : "approved_for_composition_review";

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    status,
    accepted,
    resourceProfileComplete,
    readyForProductSecurityReview:
      safetyBoundaryAccepted && resourceProfileComplete,
    productApproval,
    securityApproval,
    approvalGranted: approvalsGranted,
    compositionAllowed: false,
    providerRegistrationEnabled: false,
    executionEnabled: false,
    defaultOptInEnabled: false,
    checks,
    reasons: createReasons(
      checks,
      productApproval,
      securityApproval,
      resourceProfileComplete,
      approvalsGranted
    )
  };
}

function createReasons(
  checks: LocalEmbeddingResourceProfileApprovalChecks,
  productApproval: LocalEmbeddingResourceProfileApprovalDecision,
  securityApproval: LocalEmbeddingResourceProfileApprovalDecision,
  resourceProfileComplete: boolean,
  approvalsGranted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.benchmarkRunCompleted) {
    reasons.push("An approved temporary benchmark run is required.");
  }
  if (!checks.memorySampleCaptured) {
    reasons.push("A valid real-model memory sample has not been captured.");
  }
  if (!checks.positiveMemorySampleCount) {
    reasons.push("At least one positive sanitized memory sample is required.");
  }
  if (!checks.memorySampleCountBounded) {
    reasons.push("Memory sample count must remain bounded.");
  }
  if (!checks.metricValuesHidden) {
    reasons.push("Resource metric values must remain hidden from product surfaces.");
  }
  if (!checks.metricValuesNotPersisted) {
    reasons.push("Resource metric values must not be persisted.");
  }
  if (!checks.temporaryWorkspaceCleaned) {
    reasons.push("Temporary artifact, model, environment, and cache cleanup is required.");
  }
  if (!checks.failureReportingSanitized) {
    reasons.push("Resource sampling failures must be reported with sanitized reason codes.");
  }
  if (!checks.productApprovalPendingOrApproved) {
    reasons.push("Product approval cannot be rejected for this gate.");
  }
  if (!checks.securityApprovalPendingOrApproved) {
    reasons.push("Security approval cannot be rejected for this gate.");
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
  if (resourceProfileComplete && productApproval !== "approved") {
    reasons.push("Independent product approval is still pending.");
  }
  if (resourceProfileComplete && securityApproval !== "approved") {
    reasons.push("Independent security approval is still pending.");
  }
  if (approvalsGranted) {
    reasons.push(
      "Resource approval does not grant provider composition or execution enablement."
    );
  }

  return reasons;
}
