import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingRevisionApprovalRecord,
  createLocalEmbeddingRevisionApprovalRecord,
  isLocalEmbeddingRevisionApproved,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_SELECTED_REVISION
} from "../src";

describe("local embedding revision approval", () => {
  it("defaults to pending and download-disabled", () => {
    expect(createLocalEmbeddingRevisionApprovalRecord()).toEqual({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      status: "pending",
      downloadEnabled: false,
      reasons: [
        "Immutable upstream revision has not been selected.",
        "Revision approval is pending manual review."
      ]
    });
  });

  it("rejects missing, floating, or unapproved revisions", () => {
    expect(
      isLocalEmbeddingRevisionApproved(
        createLocalEmbeddingRevisionApprovalRecord()
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingRevisionApproved(
        createLocalEmbeddingRevisionApprovalRecord({
          status: "approved",
          revision: "main",
          reasons: []
        })
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingRevisionApproved(
        createLocalEmbeddingRevisionApprovalRecord({
          status: "pending",
          revision: "immutable-embedding-revision",
          reasons: []
        })
      )
    ).toBe(false);
  });

  it("accepts only an approved immutable revision for the selected model", () => {
    const record = createLocalEmbeddingRevisionApprovalRecord({
      status: "approved",
      revision: "immutable-embedding-revision",
      reasons: []
    });

    expect(
      isLocalEmbeddingRevisionApproved(
        record,
        "immutable-embedding-revision"
      )
    ).toBe(true);
    expect(
      isLocalEmbeddingRevisionApproved(
        record,
        "different-embedding-revision"
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingRevisionApproved({
        ...record,
        modelId: "another/model"
      })
    ).toBe(false);
  });

  it("records the selected immutable upstream revision without enabling downloads", () => {
    const record = createApprovedLocalEmbeddingRevisionApprovalRecord();

    expect(record).toEqual({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      status: "approved",
      revision: LOCAL_EMBEDDING_SELECTED_REVISION,
      downloadEnabled: false,
      reasons: []
    });
    expect(LOCAL_EMBEDDING_SELECTED_REVISION).toMatch(/^[a-f0-9]{40}$/u);
    expect(
      isLocalEmbeddingRevisionApproved(
        record,
        LOCAL_EMBEDDING_SELECTED_REVISION
      )
    ).toBe(true);
    expect(isLocalEmbeddingRevisionApproved(record, "main")).toBe(false);
  });

  it("does not expose URLs, digests, or download enablement", () => {
    const serialized = JSON.stringify(
      createLocalEmbeddingRevisionApprovalRecord()
    );

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("downloadEnabled\":true");
  });
});
