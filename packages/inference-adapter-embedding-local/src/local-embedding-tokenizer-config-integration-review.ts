import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";

export type LocalEmbeddingTokenizerConfigReviewStepKey =
  | "model_config.reviewed"
  | "sentence_transformers_config.reviewed"
  | "sentence_transformers_modules.reviewed"
  | "tokenizer_config.reviewed"
  | "tokenizer_assets.reviewed"
  | "pooling_config.reviewed"
  | "input_contract.defined"
  | "output_contract.defined"
  | "pooling_parity.defined"
  | "normalization_parity.defined"
  | "runtime_boundary.defined"
  | "execution.disabled"
  | "verification.clean";

export interface LocalEmbeddingTokenizerConfigIntegrationReviewInput {
  modelConfigReviewed?: boolean;
  sentenceTransformersConfigReviewed?: boolean;
  sentenceTransformersModulesReviewed?: boolean;
  tokenizerConfigReviewed?: boolean;
  tokenizerAssetsReviewed?: boolean;
  poolingConfigReviewed?: boolean;
  inputContractDefined?: boolean;
  outputContractDefined?: boolean;
  poolingParityPlanDefined?: boolean;
  normalizationParityPlanDefined?: boolean;
  runtimeBoundaryDefined?: boolean;
  runtimeDependenciesIntroduced?: boolean;
  downloadEnabled?: boolean;
  executionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingTokenizerConfigReviewStep {
  key: LocalEmbeddingTokenizerConfigReviewStepKey;
  satisfied: boolean;
  reason: string;
}

export interface LocalEmbeddingTokenizerConfigIntegrationReview {
  provider: string;
  modelId: string;
  runtime: "transformers";
  status: "pending" | "approved" | "rejected";
  steps: LocalEmbeddingTokenizerConfigReviewStep[];
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  compatibilityValuesExposed: false;
  reasons: string[];
}

export function createLocalEmbeddingTokenizerConfigIntegrationReview(
  input: LocalEmbeddingTokenizerConfigIntegrationReviewInput = {}
): LocalEmbeddingTokenizerConfigIntegrationReview {
  const steps: LocalEmbeddingTokenizerConfigReviewStep[] = [
    step(
      "model_config.reviewed",
      input.modelConfigReviewed === true,
      "Review model configuration fields required by the future runtime."
    ),
    step(
      "sentence_transformers_config.reviewed",
      input.sentenceTransformersConfigReviewed === true,
      "Review sentence-transformers configuration before runtime integration."
    ),
    step(
      "sentence_transformers_modules.reviewed",
      input.sentenceTransformersModulesReviewed === true,
      "Review sentence-transformers module ordering and supported module scope."
    ),
    step(
      "tokenizer_config.reviewed",
      input.tokenizerConfigReviewed === true,
      "Review tokenizer configuration, special-token behavior, and truncation inputs."
    ),
    step(
      "tokenizer_assets.reviewed",
      input.tokenizerAssetsReviewed === true,
      "Review tokenizer asset roles and fallback behavior as one pinned input set."
    ),
    step(
      "pooling_config.reviewed",
      input.poolingConfigReviewed === true,
      "Review pooling configuration as the source of embedding aggregation behavior."
    ),
    step(
      "input_contract.defined",
      input.inputContractDefined === true,
      "Define the runtime text-batch input contract without adding provider policy to Core."
    ),
    step(
      "output_contract.defined",
      input.outputContractDefined === true,
      "Define the sanitized embedding-vector output contract and failure mapping."
    ),
    step(
      "pooling_parity.defined",
      input.poolingParityPlanDefined === true,
      "Define how runtime pooling stays equivalent to the reviewed pooling configuration."
    ),
    step(
      "normalization_parity.defined",
      input.normalizationParityPlanDefined === true,
      "Define how runtime normalization stays equivalent to the reviewed model behavior."
    ),
    step(
      "runtime_boundary.defined",
      input.runtimeBoundaryDefined === true,
      "Keep tokenizer/config interpretation inside the dedicated runtime boundary."
    ),
    step(
      "execution.disabled",
      input.executionEnabled === false,
      "Keep local embedding execution disabled during integration review."
    ),
    step(
      "verification.clean",
      input.runtimeDependenciesIntroduced === false &&
        input.downloadEnabled === false &&
        input.verificationClean === true,
      "Pass dependency, sensitive-artifact, typecheck, and verify gates without side effects."
    )
  ];

  const reasons = steps.flatMap((reviewStep) =>
    reviewStep.satisfied ? [] : [reviewStep.reason]
  );

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    status: reasons.length === 0 ? "approved" : "pending",
    steps,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    compatibilityValuesExposed: false,
    reasons
  };
}

export function createApprovedLocalEmbeddingTokenizerConfigIntegrationReview(
  overrides: Partial<LocalEmbeddingTokenizerConfigIntegrationReview> = {}
): LocalEmbeddingTokenizerConfigIntegrationReview {
  return {
    ...createLocalEmbeddingTokenizerConfigIntegrationReview({
      modelConfigReviewed: true,
      sentenceTransformersConfigReviewed: true,
      sentenceTransformersModulesReviewed: true,
      tokenizerConfigReviewed: true,
      tokenizerAssetsReviewed: true,
      poolingConfigReviewed: true,
      inputContractDefined: true,
      outputContractDefined: true,
      poolingParityPlanDefined: true,
      normalizationParityPlanDefined: true,
      runtimeBoundaryDefined: true,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      verificationClean: true
    }),
    ...overrides
  };
}

export function isLocalEmbeddingTokenizerConfigIntegrationReviewApproved(
  review: LocalEmbeddingTokenizerConfigIntegrationReview
): boolean {
  return (
    review.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
    review.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    review.runtime === "transformers" &&
    review.status === "approved" &&
    review.runtimeDependenciesIntroduced === false &&
    review.downloadEnabled === false &&
    review.executionEnabled === false &&
    review.compatibilityValuesExposed === false &&
    review.steps.length === 13 &&
    review.steps.every((reviewStep) => reviewStep.satisfied && reviewStep.reason === "") &&
    review.reasons.length === 0
  );
}

function step(
  key: LocalEmbeddingTokenizerConfigReviewStepKey,
  satisfied: boolean,
  reason: string
): LocalEmbeddingTokenizerConfigReviewStep {
  return {
    key,
    satisfied,
    reason: satisfied ? "" : reason
  };
}
