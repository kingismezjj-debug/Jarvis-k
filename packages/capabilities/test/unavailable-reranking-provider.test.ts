import { describe, expect, it } from "vitest";
import {
  rerankingProviderUnavailableReason,
  UnavailableRerankingProvider
} from "../src";

describe("UnavailableRerankingProvider", () => {
  it("fails closed until a reranking provider is composed", async () => {
    const provider = new UnavailableRerankingProvider();

    await expect(
      provider.rerank({
        modelId: "jarvis-fixture/local-reranker-smoke",
        query: "memory governance",
        documents: [
          {
            id: "doc-1",
            text: "Phase 4 keeps model runtimes behind ports."
          }
        ]
      })
    ).rejects.toThrow("Reranking provider is not configured.");
  });

  it("formats unavailable reasons without runtime details", () => {
    expect(rerankingProviderUnavailableReason()).toBe(
      "Reranking provider is not configured."
    );
  });
});
