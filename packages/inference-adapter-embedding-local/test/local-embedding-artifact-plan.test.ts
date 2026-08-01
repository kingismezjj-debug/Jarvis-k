import { describe, expect, it } from "vitest";
import {
  createPinnedLocalEmbeddingArtifactPlan,
  createLocalEmbeddingArtifactPlan,
  isLocalEmbeddingArtifactPlanPinned,
  LOCAL_EMBEDDING_APPROVED_ARTIFACT_DIGESTS,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_SELECTED_REVISION,
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
      "sentence_transformers_config",
      "generation_config",
      "sentence_transformers_modules",
      "tokenizer_config",
      "tokenizer_vocabulary",
      "tokenizer_merges",
      "tokenizer_vocabulary",
      "pooling_config"
    ]);
    expect(plan.artifacts.map((artifact) => artifact.key)).toEqual([
      "model.safetensors",
      "config.json",
      "config_sentence_transformers.json",
      "generation_config.json",
      "modules.json",
      "tokenizer_config.json",
      "tokenizer.json",
      "merges.txt",
      "vocab.json",
      "1_Pooling/config.json"
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

  it("records approved SHA-256 digests for every required artifact", () => {
    const plan = createPinnedLocalEmbeddingArtifactPlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      status: "pinned",
      downloadEnabled: false
    });
    expect(plan.artifacts.map((artifact) => artifact.key)).toEqual(
      createLocalEmbeddingArtifactPlan().artifacts.map(
        (artifact) => artifact.key
      )
    );
    expect(LOCAL_EMBEDDING_APPROVED_ARTIFACT_DIGESTS).toHaveLength(
      createLocalEmbeddingArtifactPlan().artifacts.length
    );
    expect(
      plan.artifacts.every(
        (artifact) =>
          artifact.pinned &&
          artifact.revision === LOCAL_EMBEDDING_SELECTED_REVISION &&
          artifact.sha256 !== undefined &&
          /^[a-f0-9]{64}$/.test(artifact.sha256)
      )
    ).toBe(true);
    expect(isLocalEmbeddingArtifactPlanPinned(plan)).toBe(true);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toContain("downloadEnabled\":true");
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
