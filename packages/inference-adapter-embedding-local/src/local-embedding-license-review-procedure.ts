import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";

export type LocalEmbeddingLicenseReviewStepKey =
  | "license.model_weights_reviewed"
  | "license.runtime_dependencies_reviewed"
  | "license.tokenizer_components_reviewed"
  | "license.native_dependencies_reviewed"
  | "license.redistribution_terms_reviewed"
  | "license.notice_bundle_defined"
  | "license.approval_record_local"
  | "downloads.disabled"
  | "execution.disabled"
  | "verification.clean";

export interface LocalEmbeddingLicenseReviewInput {
  modelWeightsReviewed?: boolean;
  runtimeDependenciesReviewed?: boolean;
  tokenizerComponentsReviewed?: boolean;
  nativeDependenciesReviewed?: boolean;
  redistributionTermsReviewed?: boolean;
  noticeBundleDefined?: boolean;
  approvalRecordLocal?: boolean;
  downloadEnabled?: boolean;
  executionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingLicenseReviewStep {
  key: LocalEmbeddingLicenseReviewStepKey;
  satisfied: boolean;
  reason: string;
}

export interface LocalEmbeddingLicenseReviewProcedure {
  provider: string;
  modelId: string;
  status: "pending" | "ready_for_approval";
  downloadEnabled: false;
  executionEnabled: false;
  licenseValuesExposed: false;
  steps: LocalEmbeddingLicenseReviewStep[];
  reasons: string[];
}

export function createLocalEmbeddingLicenseReviewProcedure(
  input: LocalEmbeddingLicenseReviewInput = {}
): LocalEmbeddingLicenseReviewProcedure {
  const steps: LocalEmbeddingLicenseReviewStep[] = [
    step(
      "license.model_weights_reviewed",
      input.modelWeightsReviewed === true,
      "Review model-weight license terms before approval."
    ),
    step(
      "license.runtime_dependencies_reviewed",
      input.runtimeDependenciesReviewed === true,
      "Review runtime dependency licenses before approval."
    ),
    step(
      "license.tokenizer_components_reviewed",
      input.tokenizerComponentsReviewed === true,
      "Review tokenizer and config component licenses before approval."
    ),
    step(
      "license.native_dependencies_reviewed",
      input.nativeDependenciesReviewed === true,
      "Review native dependency redistribution obligations before approval."
    ),
    step(
      "license.redistribution_terms_reviewed",
      input.redistributionTermsReviewed === true,
      "Review redistribution terms for packaged and cached artifacts."
    ),
    step(
      "license.notice_bundle_defined",
      input.noticeBundleDefined === true,
      "Define the NOTICE and LICENSE bundle before approval."
    ),
    step(
      "license.approval_record_local",
      input.approvalRecordLocal === true,
      "Keep license review approval records provider-local."
    ),
    step(
      "downloads.disabled",
      input.downloadEnabled === false,
      "Keep downloads disabled during license review approval."
    ),
    step(
      "execution.disabled",
      input.executionEnabled === false,
      "Keep local embedding execution disabled during license review."
    ),
    step(
      "verification.clean",
      input.verificationClean === true,
      "Pass boundary, sensitive-artifact, typecheck, and verify gates."
    )
  ];

  const reasons = steps.flatMap((item) =>
    item.satisfied ? [] : [item.reason]
  );

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    status: reasons.length === 0 ? "ready_for_approval" : "pending",
    downloadEnabled: false,
    executionEnabled: false,
    licenseValuesExposed: false,
    steps,
    reasons
  };
}

function step(
  key: LocalEmbeddingLicenseReviewStepKey,
  satisfied: boolean,
  reason: string
): LocalEmbeddingLicenseReviewStep {
  return { key, satisfied, reason: satisfied ? "" : reason };
}
