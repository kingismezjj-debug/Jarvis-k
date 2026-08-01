import { ModelManifestSchema } from "@jarvis-k/contracts";
import { describe, expect, it } from "vitest";
import {
  assessLocalEmbeddingReadiness,
  createApprovedLocalEmbeddingArtifactPinApprovalRecord,
  createApprovedLocalEmbeddingManifest,
  createApprovedLocalEmbeddingManifestApprovalRecord,
  createApprovedLocalEmbeddingRevisionApprovalRecord,
  createLocalEmbeddingManifestApprovalRecord,
  createLocalEmbeddingProviderConfigurationReport,
  createPinnedLocalEmbeddingArtifactPlan,
  isLocalEmbeddingManifestApprovalRecordApproved,
  LOCAL_EMBEDDING_MANIFEST_ARTIFACT_SET_SHA256,
  LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_SELECTED_REVISION
} from "../src";

describe("local embedding manifest approval", () => {
  it("defaults manifest approval to pending without exposing pins", () => {
    const record = createLocalEmbeddingManifestApprovalRecord();
    const serialized = JSON.stringify(record);

    expect(record).toMatchObject({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      status: "pending",
      downloadEnabled: false
    });
    expect(record.manifest).toBeUndefined();
    expect(record.artifactSetSha256).toBeUndefined();
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(
      isLocalEmbeddingManifestApprovalRecordApproved(record)
    ).toBe(false);
  });

  it("creates a contracts-valid approved manifest for the pinned artifacts", () => {
    const manifest = createApprovedLocalEmbeddingManifest();

    expect(ModelManifestSchema.parse(manifest)).toEqual(manifest);
    expect(manifest).toEqual({
      id: LOCAL_EMBEDDING_MODEL_ID,
      capability: "embedding",
      source: "huggingface",
      revision: LOCAL_EMBEDDING_SELECTED_REVISION,
      license: "Apache-2.0",
      runtime: "transformers",
      sizeBytes: LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES,
      sha256: LOCAL_EMBEDDING_MANIFEST_ARTIFACT_SET_SHA256,
      licenseRisk: "yellow"
    });
  });

  it("approves only a manifest that matches revision and artifact evidence", () => {
    const artifactPlan = createPinnedLocalEmbeddingArtifactPlan();
    const approval = createApprovedLocalEmbeddingManifestApprovalRecord();
    const artifactPinApproval =
      createApprovedLocalEmbeddingArtifactPinApprovalRecord();
    const revisionApproval =
      createApprovedLocalEmbeddingRevisionApprovalRecord();

    expect(
      isLocalEmbeddingManifestApprovalRecordApproved(approval, {
        revisionApproval,
        artifactPlan,
        artifactPinApproval
      })
    ).toBe(true);
    expect(
      isLocalEmbeddingManifestApprovalRecordApproved(
        {
          ...approval,
          manifest: {
            ...createApprovedLocalEmbeddingManifest(),
            revision: "main"
          }
        },
        {
          revisionApproval,
          artifactPlan,
          artifactPinApproval
        }
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingManifestApprovalRecordApproved(
        {
          ...approval,
          artifactSetSha256:
            "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
        },
        {
          revisionApproval,
          artifactPlan,
          artifactPinApproval
        }
      )
    ).toBe(false);
  });

  it("satisfies manifest, revision, and artifact gates without enabling runtime", () => {
    const artifactPlan = createPinnedLocalEmbeddingArtifactPlan();
    const report = assessLocalEmbeddingReadiness({
      manifest: createApprovedLocalEmbeddingManifest(),
      revisionApproval: createApprovedLocalEmbeddingRevisionApprovalRecord(),
      artifactPlan,
      artifactPinApproval: createApprovedLocalEmbeddingArtifactPinApprovalRecord()
    });

    expect(report.readyForComposition).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "model.manifest",
          satisfied: true,
          reasons: []
        }),
        expect.objectContaining({
          key: "model.revision",
          satisfied: true,
          reasons: []
        }),
        expect.objectContaining({
          key: "model.artifact_sha256",
          satisfied: true,
          reasons: []
        }),
        expect.objectContaining({
          key: "artifact.pins",
          satisfied: true,
          reasons: []
        }),
        expect.objectContaining({
          key: "runtime.strategy",
          satisfied: false
        })
      ])
    );
  });

  it("keeps provider configuration reports sanitized with approved pins", () => {
    const artifactPlan = createPinnedLocalEmbeddingArtifactPlan();
    const report = createLocalEmbeddingProviderConfigurationReport({
      readiness: {
        manifest: createApprovedLocalEmbeddingManifest(),
        revisionApproval: createApprovedLocalEmbeddingRevisionApprovalRecord(),
        artifactPlan,
        artifactPinApproval:
          createApprovedLocalEmbeddingArtifactPinApprovalRecord()
      }
    });
    const serialized = JSON.stringify(report);

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain(LOCAL_EMBEDDING_SELECTED_REVISION);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });
});
