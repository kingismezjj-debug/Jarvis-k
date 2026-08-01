import { describe, expect, it } from "vitest";
import {
  assessLocalEmbeddingReadiness,
  createLocalEmbeddingArtifactPinApprovalRecord,
  createLocalEmbeddingArtifactPlan,
  createLocalEmbeddingProviderConfigurationReport,
  createLocalEmbeddingRuntimeStrategy,
  createLocalEmbeddingProviderDescriptor,
  createLocalEmbeddingRevisionApprovalRecord,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  UnavailableLocalEmbeddingProvider
} from "../src";

describe("local embedding readiness provider", () => {
  it("reports the planned provider as unconfigured and disabled", () => {
    expect(createLocalEmbeddingProviderDescriptor()).toMatchObject({
      capability: "embedding",
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      status: "unconfigured",
      execution: "disabled",
      modelIds: [LOCAL_EMBEDDING_MODEL_ID]
    });
  });

  it("lists all blocking gates before real execution can be enabled", () => {
    expect(
      createLocalEmbeddingProviderConfigurationReport()
    ).toMatchObject({
      capability: "embedding",
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      status: "unconfigured",
      requirements: [
        { key: "model.manifest", configured: false },
        { key: "model.revision", configured: false },
        { key: "model.artifact_sha256", configured: false },
        { key: "artifact.pins", configured: false },
        { key: "runtime.strategy", configured: false },
        { key: "runtime.adapter", configured: false },
        { key: "runtime.packaging", configured: false },
        { key: "license.redistribution_review", configured: false },
        { key: "benchmarks.local_resource_profile", configured: false }
      ]
    });
  });

  it("recognizes a complete manifest review without enabling execution", () => {
    const report = assessLocalEmbeddingReadiness({
      manifest: {
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
      },
      runtimeAdapterReady: true,
      packagingReviewed: true,
      redistributionReviewed: true,
      benchmarkProfileReady: true,
      revisionApproval: approvedRevisionApproval(),
      artifactPlan: pinnedArtifactPlan(),
      artifactPinApproval: approvedArtifactPinApproval(pinnedArtifactPlan()),
      runtimeStrategy: approvedRuntimeStrategy()
    });

    expect(report).toEqual({
      readyForComposition: true,
      checks: expect.arrayContaining([
        expect.objectContaining({
          key: "model.manifest",
          satisfied: true,
          reasons: []
        }),
        expect.objectContaining({
          key: "runtime.adapter",
          satisfied: true,
          reasons: []
        })
      ]),
      reasons: []
    });
    expect(
      createLocalEmbeddingProviderConfigurationReport({
        readiness: {
          manifest: {
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
          },
          runtimeAdapterReady: true,
          packagingReviewed: true,
          redistributionReviewed: true,
          benchmarkProfileReady: true,
          revisionApproval: approvedRevisionApproval(),
          artifactPlan: pinnedArtifactPlan(),
          artifactPinApproval: approvedArtifactPinApproval(
            pinnedArtifactPlan()
          ),
          runtimeStrategy: approvedRuntimeStrategy()
        }
      })
    ).toMatchObject({
      status: "unconfigured",
      reasons: [
        "Local embedding execution remains disabled until a real runtime provider is composed."
      ]
    });
  });

  it("rejects floating revisions and missing artifact digests", () => {
    const report = assessLocalEmbeddingReadiness({
      manifest: {
        id: LOCAL_EMBEDDING_MODEL_ID,
        capability: "embedding",
        source: "huggingface",
        revision: "main",
        license: "Apache-2.0",
        runtime: "transformers",
        sizeBytes: 1024,
        licenseRisk: "yellow"
      },
      runtimeAdapterReady: true,
      packagingReviewed: true,
      redistributionReviewed: true,
      benchmarkProfileReady: true,
      revisionApproval: approvedRevisionApproval("main"),
      artifactPlan: pinnedArtifactPlan(),
      artifactPinApproval: approvedArtifactPinApproval(pinnedArtifactPlan()),
      runtimeStrategy: approvedRuntimeStrategy()
    });

    expect(report.readyForComposition).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "model.revision",
          satisfied: false
        }),
        expect.objectContaining({
          key: "model.artifact_sha256",
          satisfied: false
        })
      ])
    );
  });

  it("rejects an otherwise complete review when revision approval is pending", () => {
    const report = assessLocalEmbeddingReadiness({
      manifest: {
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
      },
      runtimeAdapterReady: true,
      packagingReviewed: true,
      redistributionReviewed: true,
      benchmarkProfileReady: true,
      artifactPlan: pinnedArtifactPlan(),
      artifactPinApproval: approvedArtifactPinApproval(pinnedArtifactPlan()),
      runtimeStrategy: approvedRuntimeStrategy()
    });

    expect(report.readyForComposition).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "model.revision",
          satisfied: false
        })
      ])
    );
  });

  it("rejects an otherwise complete review when artifact pins are missing", () => {
    const report = assessLocalEmbeddingReadiness({
      manifest: {
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
      },
      runtimeAdapterReady: true,
      packagingReviewed: true,
      redistributionReviewed: true,
      benchmarkProfileReady: true
    });

    expect(report.readyForComposition).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "artifact.pins",
          satisfied: false
        })
      ])
    );
  });

  it("rejects an otherwise complete review when artifact pin approval is pending", () => {
    const report = assessLocalEmbeddingReadiness({
      manifest: {
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
      },
      runtimeAdapterReady: true,
      packagingReviewed: true,
      redistributionReviewed: true,
      benchmarkProfileReady: true,
      revisionApproval: approvedRevisionApproval(),
      artifactPlan: pinnedArtifactPlan(),
      runtimeStrategy: approvedRuntimeStrategy()
    });

    expect(report.readyForComposition).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "artifact.pins",
          satisfied: false
        })
      ])
    );
  });

  it("rejects an otherwise complete review when runtime strategy is provisional", () => {
    const report = assessLocalEmbeddingReadiness({
      manifest: {
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
      },
      runtimeAdapterReady: true,
      packagingReviewed: true,
      redistributionReviewed: true,
      benchmarkProfileReady: true,
      revisionApproval: approvedRevisionApproval(),
      artifactPlan: pinnedArtifactPlan(),
      artifactPinApproval: approvedArtifactPinApproval(pinnedArtifactPlan())
    });

    expect(report.readyForComposition).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runtime.strategy",
          satisfied: false
        })
      ])
    );
  });

  it("fails closed instead of executing a local model", async () => {
    const provider = new UnavailableLocalEmbeddingProvider();

    await expect(
      provider.embed({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        inputs: [{ text: "phase six readiness" }]
      })
    ).rejects.toThrow("Local embedding provider is not configured.");
  });
});

function pinnedArtifactPlan() {
  return {
    ...createLocalEmbeddingArtifactPlan(),
    status: "pinned" as const,
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

function approvedRevisionApproval(revision = "immutable-embedding-revision") {
  return createLocalEmbeddingRevisionApprovalRecord({
    status: "approved",
    revision,
    reasons: []
  });
}

function approvedArtifactPinApproval(plan: ReturnType<typeof pinnedArtifactPlan>) {
  return createLocalEmbeddingArtifactPinApprovalRecord({
    status: "approved",
    artifacts: plan.artifacts.map((artifact) => ({
      key: artifact.key,
      role: artifact.role,
      status: "approved" as const,
      revision: artifact.revision,
      sha256: artifact.sha256,
      reasons: []
    })),
    reasons: []
  });
}

function approvedRuntimeStrategy() {
  return {
    ...createLocalEmbeddingRuntimeStrategy(),
    status: "approved" as const,
    requiredGates: createLocalEmbeddingRuntimeStrategy().requiredGates.map(
      (gate) => ({
        ...gate,
        satisfied: true
      })
    ),
    reasons: []
  };
}
