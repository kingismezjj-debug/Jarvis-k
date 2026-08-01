import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingArtifactPinningProcedure,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "../src";

describe("local embedding artifact pinning procedure", () => {
  it("defaults to pending and keeps downloads disabled", () => {
    const procedure = createLocalEmbeddingArtifactPinningProcedure();

    expect(procedure).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      status: "pending",
      downloadEnabled: false,
      artifactValuesExposed: false
    });
    expect(procedure.steps.map((step) => step.key)).toEqual([
      "revision.approved",
      "required_artifacts.confirmed",
      "digests.verified",
      "signed_urls.absent",
      "downloads.disabled",
      "approval.record_local",
      "verification.clean"
    ]);
    expect(procedure.steps.every((step) => !step.satisfied)).toBe(true);
  });

  it("rejects enabled downloads even when other checks pass", () => {
    const procedure = createLocalEmbeddingArtifactPinningProcedure({
      revisionApproved: true,
      requiredArtifactsConfirmed: true,
      digestsVerified: true,
      signedUrlsAbsent: true,
      downloadEnabled: true,
      approvalRecordLocal: true,
      verificationClean: true
    });

    expect(procedure.status).toBe("pending");
    expect(procedure.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "downloads.disabled",
          satisfied: false
        })
      ])
    );
  });

  it("can become ready for approval without exposing artifact values", () => {
    const procedure = createLocalEmbeddingArtifactPinningProcedure({
      revisionApproved: true,
      requiredArtifactsConfirmed: true,
      digestsVerified: true,
      signedUrlsAbsent: true,
      downloadEnabled: false,
      approvalRecordLocal: true,
      verificationClean: true
    });
    const serialized = JSON.stringify(procedure);

    expect(procedure.status).toBe("ready_for_approval");
    expect(procedure.reasons).toEqual([]);
    expect(procedure.steps.every((step) => step.satisfied)).toBe(true);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("immutable-");
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("downloadEnabled\":true");
  });
});
