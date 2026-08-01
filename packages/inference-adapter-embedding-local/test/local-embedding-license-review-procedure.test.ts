import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingLicenseReviewProcedure,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "../src";

describe("local embedding license review procedure", () => {
  it("defaults to pending without enabling downloads or execution", () => {
    const procedure = createLocalEmbeddingLicenseReviewProcedure();

    expect(procedure).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      status: "pending",
      downloadEnabled: false,
      executionEnabled: false,
      licenseValuesExposed: false
    });
    expect(procedure.steps.map((step) => step.key)).toEqual([
      "license.model_weights_reviewed",
      "license.runtime_dependencies_reviewed",
      "license.tokenizer_components_reviewed",
      "license.native_dependencies_reviewed",
      "license.redistribution_terms_reviewed",
      "license.notice_bundle_defined",
      "license.approval_record_local",
      "downloads.disabled",
      "execution.disabled",
      "verification.clean"
    ]);
  });

  it("rejects enabled downloads or execution during review", () => {
    const procedure = createLocalEmbeddingLicenseReviewProcedure({
      modelWeightsReviewed: true,
      runtimeDependenciesReviewed: true,
      tokenizerComponentsReviewed: true,
      nativeDependenciesReviewed: true,
      redistributionTermsReviewed: true,
      noticeBundleDefined: true,
      approvalRecordLocal: true,
      downloadEnabled: true,
      executionEnabled: true,
      verificationClean: true
    });

    expect(procedure.status).toBe("pending");
    expect(procedure.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "downloads.disabled",
          satisfied: false
        }),
        expect.objectContaining({
          key: "execution.disabled",
          satisfied: false
        })
      ])
    );
  });

  it("can become ready for approval with sanitized procedure output", () => {
    const procedure = createLocalEmbeddingLicenseReviewProcedure({
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
    });
    const serialized = JSON.stringify(procedure);

    expect(procedure.status).toBe("ready_for_approval");
    expect(procedure.reasons).toEqual([]);
    expect(procedure.steps.every((step) => step.satisfied)).toBe(true);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("Apache-2.0");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });
});
