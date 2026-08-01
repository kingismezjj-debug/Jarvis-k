import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingLicenseApprovalRecord,
  createApprovedLocalEmbeddingRuntimeStrategy,
  createApprovedLocalEmbeddingWindowsPackagingApprovalRecord,
  assessLocalEmbeddingReadiness,
  createLocalEmbeddingArtifactPinApprovalRecord,
  createLocalEmbeddingArtifactPlan,
  createLocalEmbeddingBenchmarkApprovalRecord,
  createLocalEmbeddingProviderConfigurationReport,
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

  it("surfaces sanitized checklist blockers in configuration report reasons", () => {
    const report = createLocalEmbeddingProviderConfigurationReport();
    const serialized = JSON.stringify(report);

    expect(report.reasons).toEqual(
      expect.arrayContaining([
        "Local embedding readiness checklist blocked: model.revision.",
        "Local embedding readiness checklist blocked: artifact.pins.",
        "Local embedding readiness checklist blocked: runtime.strategy.",
        "Local embedding readiness checklist blocked: license.redistribution_review.",
        "Local embedding readiness checklist blocked: benchmarks.local_resource_profile."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("immutable-embedding-revision");
    expect(serialized).not.toContain("immutable-artifact-revision");
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("latencyMs");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });

  it("requires an approved Windows packaging record for the packaging gate", () => {
    const pendingReport = assessLocalEmbeddingReadiness({
      packagingReviewed: true
    });
    const approvedReport = assessLocalEmbeddingReadiness({
      packagingReviewed: true,
      packagingApproval: approvedPackagingApproval()
    });

    expect(
      pendingReport.checks.find((check) => check.key === "runtime.packaging")
    ).toMatchObject({
      satisfied: false
    });
    expect(
      approvedReport.checks.find((check) => check.key === "runtime.packaging")
    ).toMatchObject({
      satisfied: true,
      reasons: []
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
      benchmarkApproval: approvedBenchmarkApproval(),
      licenseApproval: approvedLicenseApproval(),
      runtimeStrategy: approvedRuntimeStrategy(),
      packagingApproval: approvedPackagingApproval()
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
          benchmarkApproval: approvedBenchmarkApproval(),
          licenseApproval: approvedLicenseApproval(),
          runtimeStrategy: approvedRuntimeStrategy(),
          packagingApproval: approvedPackagingApproval()
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
      licenseApproval: approvedLicenseApproval(),
      runtimeStrategy: approvedRuntimeStrategy(),
      packagingApproval: approvedPackagingApproval()
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
      licenseApproval: approvedLicenseApproval(),
      runtimeStrategy: approvedRuntimeStrategy(),
      packagingApproval: approvedPackagingApproval()
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
      licenseApproval: approvedLicenseApproval(),
      runtimeStrategy: approvedRuntimeStrategy(),
      packagingApproval: approvedPackagingApproval()
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

  it("rejects an otherwise complete review when license approval is pending", () => {
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
      runtimeStrategy: approvedRuntimeStrategy(),
      packagingApproval: approvedPackagingApproval()
    });

    expect(report.readyForComposition).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "license.redistribution_review",
          satisfied: false
        })
      ])
    );
  });

  it("rejects license approval when the manifest risk is red", () => {
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
        licenseRisk: "red"
      },
      runtimeAdapterReady: true,
      packagingReviewed: true,
      redistributionReviewed: true,
      benchmarkProfileReady: true,
      revisionApproval: approvedRevisionApproval(),
      artifactPlan: pinnedArtifactPlan(),
      artifactPinApproval: approvedArtifactPinApproval(pinnedArtifactPlan()),
      licenseApproval: approvedLicenseApproval(),
      runtimeStrategy: approvedRuntimeStrategy(),
      packagingApproval: approvedPackagingApproval()
    });

    expect(report.readyForComposition).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "license.redistribution_review",
          satisfied: false
        })
      ])
    );
  });

  it("rejects an otherwise complete review when benchmark approval is pending", () => {
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
      licenseApproval: approvedLicenseApproval(),
      runtimeStrategy: approvedRuntimeStrategy(),
      packagingApproval: approvedPackagingApproval()
    });

    expect(report.readyForComposition).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "benchmarks.local_resource_profile",
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
      artifactPinApproval: approvedArtifactPinApproval(pinnedArtifactPlan()),
      licenseApproval: approvedLicenseApproval(),
      packagingApproval: approvedPackagingApproval()
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
      digestCapturePrepared: true,
      reasons: []
    })),
    reasons: []
  });
}

function approvedLicenseApproval() {
  return createApprovedLocalEmbeddingLicenseApprovalRecord({
    metadataRevision: "immutable-embedding-revision"
  });
}

function approvedBenchmarkApproval() {
  return createLocalEmbeddingBenchmarkApprovalRecord({
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
  });
}

function approvedRuntimeStrategy() {
  return createApprovedLocalEmbeddingRuntimeStrategy();
}

function approvedPackagingApproval() {
  return createApprovedLocalEmbeddingWindowsPackagingApprovalRecord();
}
