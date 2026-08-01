import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingRevisionSelectionProcedure,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "../src";

describe("local embedding revision selection procedure", () => {
  it("defaults to a pending, download-disabled procedure", () => {
    const procedure = createLocalEmbeddingRevisionSelectionProcedure();

    expect(procedure).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      status: "pending",
      downloadEnabled: false,
      artifactPinningEnabled: false,
      selectedRevisionExposed: false
    });
    expect(procedure.steps.map((step) => step.key)).toEqual([
      "scope.confirmed",
      "source.verified",
      "revision.immutable",
      "download.disabled",
      "artifact.pin_deferred",
      "approval.record_local",
      "verification.clean"
    ]);
    expect(procedure.steps.every((step) => !step.satisfied)).toBe(true);
  });

  it("rejects floating revisions and enabled downloads", () => {
    const procedure = createLocalEmbeddingRevisionSelectionProcedure({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      candidateRevision: "main",
      downloadEnabled: true,
      artifactPinningDeferred: true,
      approvalRecordLocal: true,
      verificationClean: true
    });

    expect(procedure.status).toBe("pending");
    expect(procedure.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "revision.immutable",
          satisfied: false
        }),
        expect.objectContaining({
          key: "download.disabled",
          satisfied: false
        })
      ])
    );
  });

  it("can become ready for approval without exposing the selected revision", () => {
    const procedure = createLocalEmbeddingRevisionSelectionProcedure({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      candidateRevision: "immutable-candidate-revision",
      downloadEnabled: false,
      artifactPinningDeferred: true,
      approvalRecordLocal: true,
      verificationClean: true
    });
    const serialized = JSON.stringify(procedure);

    expect(procedure.status).toBe("ready_for_approval");
    expect(procedure.reasons).toEqual([]);
    expect(procedure.steps.every((step) => step.satisfied)).toBe(true);
    expect(serialized).not.toContain("immutable-candidate-revision");
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("artifactPinningEnabled\":true");
  });
});
