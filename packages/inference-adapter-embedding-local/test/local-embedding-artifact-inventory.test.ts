import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingArtifactInventory,
  isLocalEmbeddingArtifactInventoryReadyForPinning,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  LOCAL_EMBEDDING_SELECTED_REVISION,
  type LocalEmbeddingArtifactInventory
} from "../src";

describe("local embedding artifact inventory", () => {
  it("records upstream artifact roles for the selected revision", () => {
    const inventory = createLocalEmbeddingArtifactInventory();

    expect(inventory).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      revision: LOCAL_EMBEDDING_SELECTED_REVISION,
      status: "inventory_confirmed",
      downloadEnabled: false,
      pinningEnabled: false,
      digestValuesExposed: false
    });
    expect(inventory.artifacts.map((artifact) => artifact.path)).toEqual([
      ".gitattributes",
      "1_Pooling/config.json",
      "config.json",
      "config_sentence_transformers.json",
      "generation_config.json",
      "merges.txt",
      "model.safetensors",
      "modules.json",
      "README.md",
      "tokenizer.json",
      "tokenizer_config.json",
      "vocab.json"
    ]);
  });

  it("keeps required artifact paths ready for later digest pinning", () => {
    const inventory = createLocalEmbeddingArtifactInventory();

    expect(
      inventory.artifacts
        .filter((artifact) => artifact.decision === "required_for_pinning")
        .map((artifact) => [artifact.path, artifact.role])
    ).toEqual([
      ["1_Pooling/config.json", "pooling_config"],
      ["config.json", "model_config"],
      ["model.safetensors", "model_weights"],
      ["tokenizer.json", "tokenizer_vocabulary"],
      ["tokenizer_config.json", "tokenizer_config"]
    ]);
    expect(
      isLocalEmbeddingArtifactInventoryReadyForPinning(inventory)
    ).toBe(true);
  });

  it("does not expose URLs, digests, LFS metadata, or download enablement", () => {
    const inventory = createLocalEmbeddingArtifactInventory();
    const serialized = JSON.stringify(inventory);

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("sha256");
    expect(serialized).not.toContain("blobId");
    expect(serialized).not.toContain("lfs");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(
      inventory.artifacts.every(
        (artifact) =>
          !("sha256" in artifact) &&
          artifact.digestRecorded === false &&
          artifact.downloadEnabled === false
      )
    ).toBe(true);
  });

  it("rejects inventories with missing required paths or enabled downloads", () => {
    const inventory = createLocalEmbeddingArtifactInventory();
    const missingRequiredPath: LocalEmbeddingArtifactInventory = {
      ...inventory,
      artifacts: inventory.artifacts.filter(
        (artifact) => artifact.path !== "model.safetensors"
      )
    };
    const enabledDownload: LocalEmbeddingArtifactInventory = {
      ...inventory,
      downloadEnabled: true as false
    };

    expect(
      isLocalEmbeddingArtifactInventoryReadyForPinning(missingRequiredPath)
    ).toBe(false);
    expect(
      isLocalEmbeddingArtifactInventoryReadyForPinning(enabledDownload)
    ).toBe(false);
  });
});
