import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingArtifactPlan,
  isLocalEmbeddingArtifactPlanPinned,
  LOCAL_EMBEDDING_MODEL_ID,
  type LocalEmbeddingArtifactPlan
} from "../src";

describe("local embedding artifact plan", () => {
  it("keeps every real artifact unpinned and download-disabled", () => {
    const plan = createLocalEmbeddingArtifactPlan();

    expect(plan).toMatchObject({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      status: "unpinned",
      downloadEnabled: false
    });
    expect(plan.artifacts.map((artifact) => artifact.role)).toEqual([
      "model_weights",
      "model_config",
      "tokenizer_config",
      "tokenizer_vocabulary",
      "pooling_config"
    ]);
    expect(plan.artifacts.every((artifact) => artifact.required)).toBe(true);
    expect(plan.artifacts.every((artifact) => !artifact.pinned)).toBe(true);
  });

  it("does not expose upstream URLs or placeholder digests", () => {
    const plan = createLocalEmbeddingArtifactPlan();

    expect(
      plan.artifacts.every(
        (artifact) =>
          artifact.upstreamPath === undefined &&
          artifact.revision === undefined &&
          artifact.sha256 === undefined
      )
    ).toBe(true);
  });

  it("reports the default artifact plan as not pinned", () => {
    expect(
      isLocalEmbeddingArtifactPlanPinned(createLocalEmbeddingArtifactPlan())
    ).toBe(false);
  });

  it("accepts only required artifacts with revisions and valid SHA-256 digests", () => {
    const plan: LocalEmbeddingArtifactPlan = {
      ...createLocalEmbeddingArtifactPlan(),
      status: "pinned",
      artifacts: createLocalEmbeddingArtifactPlan().artifacts.map(
        (artifact) => ({
          ...artifact,
          pinned: true,
          revision: "immutable-revision",
          sha256:
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          reasons: []
        })
      )
    };

    expect(isLocalEmbeddingArtifactPlanPinned(plan)).toBe(true);
    expect(
      isLocalEmbeddingArtifactPlanPinned({
        ...plan,
        artifacts: [
          {
            ...plan.artifacts[0]!,
            sha256: "not-a-sha"
          },
          ...plan.artifacts.slice(1)
        ]
      })
    ).toBe(false);
  });
});
