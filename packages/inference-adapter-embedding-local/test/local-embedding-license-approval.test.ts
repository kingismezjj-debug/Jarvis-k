import type { ModelManifest } from "@jarvis-k/contracts";
import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingLicenseApprovalRecord,
  createLocalEmbeddingLicenseApprovalRecord,
  isLocalEmbeddingLicenseApprovalRecordApproved,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_SELECTED_REVISION
} from "../src";

describe("local embedding license approval", () => {
  it("defaults to pending, redistribution-unreviewed, and download-disabled", () => {
    expect(createLocalEmbeddingLicenseApprovalRecord()).toEqual({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      license: "Apache-2.0",
      status: "pending",
      redistributionReviewed: false,
      downloadEnabled: false,
      reasons: [
        "License review is pending manual approval.",
        "Redistribution review is pending manual approval.",
        "Downloads remain disabled until license and redistribution review pass."
      ]
    });
  });

  it("does not expose URLs, digests, or download enablement", () => {
    const serialized = JSON.stringify(
      createLocalEmbeddingLicenseApprovalRecord()
    );

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("downloadEnabled\":true");
  });

  it("rejects pending, redistribution-unreviewed, or incomplete evidence approvals", () => {
    expect(
      isLocalEmbeddingLicenseApprovalRecordApproved(
        createLocalEmbeddingLicenseApprovalRecord(),
        localEmbeddingManifest()
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingLicenseApprovalRecordApproved(
        {
          ...createApprovedLocalEmbeddingLicenseApprovalRecord(),
          redistributionReviewed: false,
          reasons: []
        },
        localEmbeddingManifest()
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingLicenseApprovalRecordApproved(
        {
          ...createApprovedLocalEmbeddingLicenseApprovalRecord(),
          runtimeDependencyScope: "pending_review",
          reasons: []
        },
        localEmbeddingManifest()
      )
    ).toBe(false);
  });

  it("accepts only an approved Apache redistribution review for the selected model", () => {
    const record = createApprovedLocalEmbeddingLicenseApprovalRecord();

    expect(
      isLocalEmbeddingLicenseApprovalRecordApproved(
        record,
        localEmbeddingManifest()
      )
    ).toBe(true);
    expect(
      isLocalEmbeddingLicenseApprovalRecordApproved(
        {
          ...record,
          modelId: "another/model"
        },
        localEmbeddingManifest()
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingLicenseApprovalRecordApproved(record, {
        ...localEmbeddingManifest(),
        licenseRisk: "red"
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingLicenseApprovalRecordApproved(record, {
        ...localEmbeddingManifest(),
        licenseRisk: "unknown"
      })
    ).toBe(false);
  });

  it("records explicit metadata and NOTICE evidence while staying download-disabled", () => {
    expect(createApprovedLocalEmbeddingLicenseApprovalRecord()).toMatchObject({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      license: "Apache-2.0",
      status: "approved",
      metadataLicense: "apache-2.0",
      metadataRevision: LOCAL_EMBEDDING_SELECTED_REVISION,
      modelWeightsReviewed: true,
      tokenizerComponentsReviewed: true,
      runtimeDependencyScope: "none_added",
      nativeDependencyScope: "none_added",
      redistributionTermsReviewed: true,
      noticeBundleDefined: true,
      redistributionReviewed: true,
      downloadEnabled: false
    });
  });
});

function localEmbeddingManifest(): ModelManifest {
  return {
    id: LOCAL_EMBEDDING_MODEL_ID,
    capability: "embedding",
    source: "huggingface",
    revision: LOCAL_EMBEDDING_SELECTED_REVISION,
    license: "Apache-2.0",
    runtime: "transformers",
    sizeBytes: 1024,
    sha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    licenseRisk: "yellow"
  };
}
