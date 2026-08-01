import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingArtifactInventory,
  createLocalEmbeddingArtifactPlan,
  createLocalEmbeddingArtifactRequiredSetDecision,
  isLocalEmbeddingArtifactRequiredSetReadyForDigestPinning,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  LOCAL_EMBEDDING_SELECTED_REVISION,
  type LocalEmbeddingArtifactRequiredSetDecisionRecord
} from "../src";

describe("local embedding artifact required set decision", () => {
  it("decides the required pin set for the selected revision", () => {
    const decision = createLocalEmbeddingArtifactRequiredSetDecision();

    expect(decision).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      revision: LOCAL_EMBEDDING_SELECTED_REVISION,
      status: "required_set_confirmed",
      downloadEnabled: false,
      pinningEnabled: false,
      digestValuesExposed: false
    });
    expect(
      decision.items
        .filter((item) => item.decision === "required_for_pinning")
        .map((item) => [item.path, item.role])
    ).toEqual([
      ["1_Pooling/config.json", "pooling_config"],
      ["config.json", "model_config"],
      ["config_sentence_transformers.json", "sentence_transformers_config"],
      ["generation_config.json", "generation_config"],
      ["merges.txt", "tokenizer_merges"],
      ["model.safetensors", "model_weights"],
      ["modules.json", "sentence_transformers_modules"],
      ["tokenizer.json", "tokenizer_vocabulary"],
      ["tokenizer_config.json", "tokenizer_config"],
      ["vocab.json", "tokenizer_vocabulary"]
    ]);
    expect(
      isLocalEmbeddingArtifactRequiredSetReadyForDigestPinning(decision)
    ).toBe(true);
  });

  it("excludes only repository metadata and documentation from runtime pins", () => {
    const decision = createLocalEmbeddingArtifactRequiredSetDecision();

    expect(
      decision.items
        .filter((item) => item.decision === "excluded_from_runtime_pin")
        .map((item) => [item.path, item.role])
    ).toEqual([
      [".gitattributes", "repository_metadata"],
      ["README.md", "documentation"]
    ]);
  });

  it("matches every required artifact plan path", () => {
    const decision = createLocalEmbeddingArtifactRequiredSetDecision();
    const requiredDecisionPaths = decision.items
      .filter((item) => item.decision === "required_for_pinning")
      .map((item) => item.path);

    expect([...requiredDecisionPaths].sort()).toEqual(
      createLocalEmbeddingArtifactPlan().artifacts.map(
        (artifact) => artifact.key
      ).sort()
    );
  });

  it("does not expose URLs, digests, LFS metadata, or download enablement", () => {
    const decision = createLocalEmbeddingArtifactRequiredSetDecision();
    const serialized = JSON.stringify(decision);

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("sha256");
    expect(serialized).not.toContain("blobId");
    expect(serialized).not.toContain("lfs");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(
      decision.items.every(
        (item) =>
          !("sha256" in item) &&
          item.digestRecorded === false &&
          item.downloadEnabled === false
      )
    ).toBe(true);
  });

  it("rejects missing required paths or enabled downloads", () => {
    const decision = createLocalEmbeddingArtifactRequiredSetDecision();
    const missingRequiredPath: LocalEmbeddingArtifactRequiredSetDecisionRecord =
      {
        ...decision,
        items: decision.items.filter(
          (item) => item.path !== "model.safetensors"
        )
      };
    const enabledDownload: LocalEmbeddingArtifactRequiredSetDecisionRecord = {
      ...decision,
      downloadEnabled: true as false
    };

    expect(
      isLocalEmbeddingArtifactRequiredSetReadyForDigestPinning(
        missingRequiredPath
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingArtifactRequiredSetReadyForDigestPinning(enabledDownload)
    ).toBe(false);
  });

  it("uses the provided inventory without enabling pinning", () => {
    const inventory = createLocalEmbeddingArtifactInventory();
    const decision = createLocalEmbeddingArtifactRequiredSetDecision(inventory);

    expect(decision.items).toHaveLength(inventory.artifacts.length);
    expect(decision.pinningEnabled).toBe(false);
  });
});
