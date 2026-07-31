import { describe, expect, it } from "vitest";
import {
  embeddingProviderUnavailableReason,
  UnavailableEmbeddingProvider
} from "../src";

describe("UnavailableEmbeddingProvider", () => {
  it("fails closed until an embedding provider is composed", async () => {
    const provider = new UnavailableEmbeddingProvider();

    await expect(
      provider.embed({
        modelId: "jarvis-fixture/local-embedding-smoke",
        inputs: [{ id: "input-1", text: "phase 4.5 boundary" }]
      })
    ).rejects.toThrow("Embedding provider is not configured.");
  });

  it("formats unavailable reasons without runtime details", () => {
    expect(embeddingProviderUnavailableReason()).toBe(
      "Embedding provider is not configured."
    );
  });
});
