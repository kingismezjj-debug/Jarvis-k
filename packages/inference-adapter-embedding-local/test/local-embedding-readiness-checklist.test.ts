import type { ModelManifest } from "@jarvis-k/contracts";
import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingArtifactPinApprovalRecord,
  createLocalEmbeddingArtifactPlan,
  createLocalEmbeddingBenchmarkApprovalRecord,
  createLocalEmbeddingLicenseApprovalRecord,
  createLocalEmbeddingReadinessChecklist,
  createLocalEmbeddingRevisionApprovalRecord,
  createLocalEmbeddingRuntimeStrategy,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  type LocalEmbeddingArtifactPlan
} from "../src";

describe("local embedding readiness checklist", () => {
  it("summarizes default approval records as blocked and non-executable", () => {
    const checklist = createLocalEmbeddingReadinessChecklist();

    expect(checklist).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      downloadEnabled: false,
      executionEnabled: false,
      readyForCompositionReview: false
    });
    expect(checklist.items.map((item) => item.key)).toEqual([
      "model.revision",
      "artifact.pins",
      "runtime.strategy",
      "license.redistribution_review",
      "benchmarks.local_resource_profile"
    ]);
    expect(checklist.items.every((item) => !item.satisfied)).toBe(true);
    expect(checklist.reasons.length).toBeGreaterThan(0);
  });

  it("does not expose URLs, revisions, digests, model files, or metric values", () => {
    const serialized = JSON.stringify(
      createLocalEmbeddingReadinessChecklist(approvedChecklistInput())
    );

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("immutable-embedding-revision");
    expect(serialized).not.toContain("immutable-artifact-revision");
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("latencyMs");
    expect(serialized).not.toContain("memoryBytes");
    expect(serialized).not.toContain("score");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });

  it("reports readiness only when every approval record passes", () => {
    const checklist = createLocalEmbeddingReadinessChecklist(
      approvedChecklistInput()
    );

    expect(checklist.readyForCompositionReview).toBe(true);
    expect(checklist.reasons).toEqual([]);
    expect(checklist.items.every((item) => item.satisfied)).toBe(true);
  });

  it("keeps a single pending approval visible without hiding the checklist", () => {
    const checklist = createLocalEmbeddingReadinessChecklist({
      ...approvedChecklistInput(),
      benchmarkApproval: createLocalEmbeddingBenchmarkApprovalRecord()
    });

    expect(checklist.readyForCompositionReview).toBe(false);
    expect(checklist.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "benchmarks.local_resource_profile",
          status: "pending",
          satisfied: false
        })
      ])
    );
  });
});

function approvedChecklistInput() {
  const artifactPlan = pinnedArtifactPlan();
  return {
    manifest: localEmbeddingManifest(),
    artifactPlan,
    revisionApproval: createLocalEmbeddingRevisionApprovalRecord({
      status: "approved",
      revision: "immutable-embedding-revision",
      reasons: []
    }),
    artifactPinApproval: createLocalEmbeddingArtifactPinApprovalRecord({
      status: "approved",
      artifacts: artifactPlan.artifacts.map((artifact) => ({
        key: artifact.key,
        role: artifact.role,
        status: "approved" as const,
        revision: artifact.revision,
        sha256: artifact.sha256,
        digestCapturePrepared: true,
        reasons: []
      })),
      reasons: []
    }),
    runtimeStrategy: {
      ...createLocalEmbeddingRuntimeStrategy(),
      status: "approved" as const,
      requiredGates: createLocalEmbeddingRuntimeStrategy().requiredGates.map(
        (gate) => ({
          ...gate,
          satisfied: true
        })
      ),
      reasons: []
    },
    licenseApproval: createLocalEmbeddingLicenseApprovalRecord({
      status: "approved",
      redistributionReviewed: true,
      reasons: []
    }),
    benchmarkApproval: createLocalEmbeddingBenchmarkApprovalRecord({
      status: "approved",
      profiles: createLocalEmbeddingBenchmarkApprovalRecord().profiles.map(
        (profile) => ({
          ...profile,
          status: "approved" as const,
          latencyProfileCaptured: true,
          memoryProfileCaptured: true,
          qualityProfileCaptured: true,
          reasons: []
        })
      ),
      reasons: []
    })
  };
}

function localEmbeddingManifest(): ModelManifest {
  return {
    id: LOCAL_EMBEDDING_MODEL_ID,
    capability: "embedding",
    source: "huggingface",
    revision: "immutable-embedding-revision",
    license: "Apache-2.0",
    runtime: "transformers",
    sizeBytes: 1024,
    sha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    licenseRisk: "yellow"
  };
}

function pinnedArtifactPlan(): LocalEmbeddingArtifactPlan {
  return {
    ...createLocalEmbeddingArtifactPlan(),
    status: "pinned",
    artifacts: createLocalEmbeddingArtifactPlan().artifacts.map(
      (artifact) => ({
        ...artifact,
        pinned: true,
        revision: "immutable-artifact-revision",
        sha256:
          "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        reasons: []
      })
    ),
    reasons: []
  };
}
