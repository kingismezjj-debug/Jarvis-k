import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingArtifactDigestCaptureProcedure,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  LOCAL_EMBEDDING_SELECTED_REVISION
} from "../src";

describe("local embedding artifact digest capture procedure", () => {
  it("defaults to pending without enabling downloads, pinning, execution, or digests", () => {
    const procedure = createLocalEmbeddingArtifactDigestCaptureProcedure();

    expect(procedure).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      revision: LOCAL_EMBEDDING_SELECTED_REVISION,
      status: "pending",
      downloadEnabled: false,
      pinningEnabled: false,
      executionEnabled: false,
      digestValuesExposed: false
    });
    expect(procedure.steps.map((step) => step.key)).toEqual([
      "revision.approved",
      "required_set.confirmed",
      "digest.method_defined",
      "temporary_workspace_isolated",
      "signed_urls.absent",
      "credentials.absent",
      "cache_paths.sanitized",
      "network_source_read_only",
      "double_verification_defined",
      "digest_values_deferred",
      "downloads.disabled",
      "pinning.disabled",
      "execution.disabled",
      "verification.clean"
    ]);
  });

  it("rejects early digest capture, downloads, pinning, or execution", () => {
    const procedure = createLocalEmbeddingArtifactDigestCaptureProcedure({
      revisionApproved: true,
      requiredSetConfirmed: true,
      digestMethodDefined: true,
      temporaryWorkspaceIsolated: true,
      signedUrlsAbsent: true,
      credentialsAbsent: true,
      cachePathsSanitized: true,
      networkSourceReadOnly: true,
      doubleVerificationDefined: true,
      digestValuesCaptured: true,
      downloadEnabled: true,
      pinningEnabled: true,
      executionEnabled: true,
      verificationClean: true
    });

    expect(procedure.status).toBe("pending");
    expect(procedure.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "digest_values_deferred",
          satisfied: false
        }),
        expect.objectContaining({
          key: "downloads.disabled",
          satisfied: false
        }),
        expect.objectContaining({
          key: "pinning.disabled",
          satisfied: false
        }),
        expect.objectContaining({
          key: "execution.disabled",
          satisfied: false
        })
      ])
    );
  });

  it("requires sanitization and double verification before approval", () => {
    const procedure = createLocalEmbeddingArtifactDigestCaptureProcedure({
      revisionApproved: true,
      requiredSetConfirmed: true,
      digestMethodDefined: true,
      temporaryWorkspaceIsolated: true,
      signedUrlsAbsent: true,
      credentialsAbsent: true,
      cachePathsSanitized: false,
      networkSourceReadOnly: true,
      doubleVerificationDefined: false,
      digestValuesCaptured: false,
      downloadEnabled: false,
      pinningEnabled: false,
      executionEnabled: false,
      verificationClean: true
    });

    expect(procedure.status).toBe("pending");
    expect(procedure.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "cache_paths.sanitized",
          satisfied: false
        }),
        expect.objectContaining({
          key: "double_verification_defined",
          satisfied: false
        })
      ])
    );
  });

  it("can become ready for approval with sanitized procedure output", () => {
    const procedure = createLocalEmbeddingArtifactDigestCaptureProcedure({
      revisionApproved: true,
      requiredSetConfirmed: true,
      digestMethodDefined: true,
      temporaryWorkspaceIsolated: true,
      signedUrlsAbsent: true,
      credentialsAbsent: true,
      cachePathsSanitized: true,
      networkSourceReadOnly: true,
      doubleVerificationDefined: true,
      digestValuesCaptured: false,
      downloadEnabled: false,
      pinningEnabled: false,
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
    expect(serialized).not.toContain("C:\\\\");
    expect(serialized).not.toContain("/home/");
    expect(serialized).not.toContain("hf_");
    expect(serialized).not.toContain("X-Amz-Signature");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("pinningEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });
});
