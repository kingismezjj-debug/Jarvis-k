import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingTokenizerConfigIntegrationReview,
  createLocalEmbeddingTokenizerConfigIntegrationReview,
  isLocalEmbeddingTokenizerConfigIntegrationReviewApproved,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "../src";

describe("local embedding tokenizer/config integration review", () => {
  it("defaults to a pending, non-executable review", () => {
    const review = createLocalEmbeddingTokenizerConfigIntegrationReview();

    expect(review).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      runtime: "transformers",
      status: "pending",
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      compatibilityValuesExposed: false
    });
    expect(review.steps.map((step) => step.key)).toEqual([
      "model_config.reviewed",
      "sentence_transformers_config.reviewed",
      "sentence_transformers_modules.reviewed",
      "tokenizer_config.reviewed",
      "tokenizer_assets.reviewed",
      "pooling_config.reviewed",
      "input_contract.defined",
      "output_contract.defined",
      "pooling_parity.defined",
      "normalization_parity.defined",
      "runtime_boundary.defined",
      "execution.disabled",
      "verification.clean"
    ]);
    expect(
      isLocalEmbeddingTokenizerConfigIntegrationReviewApproved(review)
    ).toBe(false);
  });

  it("approves the reviewed compatibility boundary without adding runtime behavior", () => {
    const review =
      createApprovedLocalEmbeddingTokenizerConfigIntegrationReview();

    expect(review.status).toBe("approved");
    expect(review.reasons).toEqual([]);
    expect(review.steps.every((step) => step.satisfied)).toBe(true);
    expect(
      isLocalEmbeddingTokenizerConfigIntegrationReviewApproved(review)
    ).toBe(true);
  });

  it("rejects dependency, download, execution, or verification regressions", () => {
    const approved =
      createApprovedLocalEmbeddingTokenizerConfigIntegrationReview();

    expect(
      isLocalEmbeddingTokenizerConfigIntegrationReviewApproved({
        ...approved,
        runtimeDependenciesIntroduced: true as false
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingTokenizerConfigIntegrationReviewApproved({
        ...approved,
        downloadEnabled: true as false
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingTokenizerConfigIntegrationReviewApproved({
        ...approved,
        executionEnabled: true as false
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingTokenizerConfigIntegrationReviewApproved({
        ...approved,
        compatibilityValuesExposed: true as false
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingTokenizerConfigIntegrationReviewApproved({
        ...approved,
        steps: approved.steps.map((step) =>
          step.key === "pooling_parity.defined"
            ? { ...step, satisfied: false, reason: "review required" }
            : step
        )
      })
    ).toBe(false);
  });

  it("keeps the review summary free of URLs, digests, artifacts, and private paths", () => {
    const serialized = JSON.stringify(
      createApprovedLocalEmbeddingTokenizerConfigIntegrationReview()
    );

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("C:\\");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });
});
