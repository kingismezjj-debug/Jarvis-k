import { describe, expect, it } from "vitest";
import {
  assessLocalEmbeddingReadiness,
  createLocalEmbeddingArtifactPinApprovalRecord,
  createLocalEmbeddingArtifactPlan,
  createLocalEmbeddingBenchmarkApprovalRecord,
  createLocalEmbeddingLicenseApprovalRecord,
  createLocalEmbeddingRevisionApprovalRecord,
  createLocalEmbeddingRuntimeStrategy,
  decideLocalEmbeddingComposition,
  LOCAL_EMBEDDING_MODEL_ID
} from "../src";

describe("local embedding composition decision", () => {
  it("blocks composition by default", () => {
    const decision = decideLocalEmbeddingComposition();

    expect(decision).toMatchObject({
      canComposeProvider: false,
      canExecute: false
    });
    expect(decision.reasons).toEqual(
      expect.arrayContaining([
        "Local embedding runtime is not registered.",
        "Local embedding execution provider is not composed.",
        "Local embedding execution enablement is not approved."
      ])
    );
  });

  it("allows composition but not execution before explicit enablement", () => {
    const decision = decideLocalEmbeddingComposition({
      readiness: assessLocalEmbeddingReadiness(completeReadiness()),
      runtimeRegistered: true,
      executionProviderComposed: true
    });

    expect(decision).toMatchObject({
      canComposeProvider: true,
      canExecute: false,
      reasons: ["Local embedding execution enablement is not approved."]
    });
  });

  it("allows execution only after readiness, runtime, provider, and enablement pass", () => {
    const decision = decideLocalEmbeddingComposition({
      readiness: assessLocalEmbeddingReadiness(completeReadiness()),
      runtimeRegistered: true,
      executionProviderComposed: true,
      explicitEnablementApproved: true
    });

    expect(decision).toMatchObject({
      canComposeProvider: true,
      canExecute: true,
      reasons: []
    });
  });
});

function completeReadiness() {
  return {
    manifest: {
      id: LOCAL_EMBEDDING_MODEL_ID,
      capability: "embedding" as const,
      source: "huggingface" as const,
      revision: "immutable-embedding-revision",
      license: "Apache-2.0",
      runtime: "transformers" as const,
      sizeBytes: 1024,
      sha256:
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      licenseRisk: "yellow" as const
    },
    artifactPlan: pinnedArtifactPlan(),
    artifactPinApproval: approvedArtifactPinApproval(pinnedArtifactPlan()),
    benchmarkApproval: createLocalEmbeddingBenchmarkApprovalRecord({
      status: "approved",
      profiles: createLocalEmbeddingBenchmarkApprovalRecord().profiles.map(
        (profile) => ({
          ...profile,
          status: "approved",
          latencyProfileCaptured: true,
          memoryProfileCaptured: true,
          qualityProfileCaptured: true,
          reasons: []
        })
      ),
      reasons: []
    }),
    licenseApproval: createLocalEmbeddingLicenseApprovalRecord({
      status: "approved",
      redistributionReviewed: true,
      reasons: []
    }),
    revisionApproval: createLocalEmbeddingRevisionApprovalRecord({
      status: "approved",
      revision: "immutable-embedding-revision",
      reasons: []
    }),
    runtimeStrategy: approvedRuntimeStrategy(),
    runtimeAdapterReady: true,
    packagingReviewed: true,
    redistributionReviewed: true,
    benchmarkProfileReady: true
  };
}

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
