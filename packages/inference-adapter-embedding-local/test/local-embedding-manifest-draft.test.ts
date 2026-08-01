import { ModelManifestSchema } from "@jarvis-k/contracts";
import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingManifestDraft,
  LOCAL_EMBEDDING_MODEL_ID
} from "../src";

describe("local embedding manifest draft", () => {
  it("documents the selected model without becoming installable", () => {
    expect(createLocalEmbeddingManifestDraft()).toMatchObject({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      capability: "embedding",
      source: "huggingface",
      runtime: "transformers",
      license: "Apache-2.0",
      status: "draft",
      installable: false,
      downloadEnabled: false
    });
  });

  it("is not accepted as a model manifest", () => {
    const draft = createLocalEmbeddingManifestDraft();

    expect(ModelManifestSchema.safeParse(draft).success).toBe(false);
    expect("manifest" in draft).toBe(false);
    expect("id" in draft).toBe(false);
    expect("revision" in draft).toBe(false);
    expect("sha256" in draft).toBe(false);
    expect("sizeBytes" in draft).toBe(false);
  });

  it("does not expose artifact URLs, revision placeholders, or digests", () => {
    const draft = createLocalEmbeddingManifestDraft();
    const serialized = JSON.stringify(draft);

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(hasOwnPropertyDeep(draft, "url")).toBe(false);
    expect(hasOwnPropertyDeep(draft, "upstreamUrl")).toBe(false);
    expect(hasOwnPropertyDeep(draft, "upstreamPath")).toBe(false);
    expect(hasOwnPropertyDeep(draft, "revision")).toBe(false);
    expect(hasOwnPropertyDeep(draft, "sha256")).toBe(false);
  });

  it("keeps every blocked readiness gate visible for audit", () => {
    const draft = createLocalEmbeddingManifestDraft();

    expect(draft.blockedGates).toEqual([
      "model.revision",
      "model.artifact_sha256",
      "artifact.pins",
      "runtime.strategy",
      "license.redistribution_review",
      "benchmarks.local_resource_profile"
    ]);
    expect(draft.reasons.length).toBe(draft.blockedGates.length);
  });
});

function hasOwnPropertyDeep(value: unknown, propertyName: string): boolean {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(value, propertyName)) {
    return true;
  }
  return Object.values(value as Record<string, unknown>).some((child) =>
    Array.isArray(child)
      ? child.some((item) => hasOwnPropertyDeep(item, propertyName))
      : hasOwnPropertyDeep(child, propertyName)
  );
}
