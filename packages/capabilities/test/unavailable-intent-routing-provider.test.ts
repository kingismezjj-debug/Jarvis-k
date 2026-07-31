import { describe, expect, it } from "vitest";
import {
  intentRoutingProviderUnavailableReason,
  UnavailableIntentRoutingProvider
} from "../src";

describe("UnavailableIntentRoutingProvider", () => {
  it("fails closed until an intent routing provider is composed", async () => {
    const provider = new UnavailableIntentRoutingProvider();

    await expect(
      provider.route({
        modelId: "jarvis-fixture/local-intent-smoke",
        utterance: "open settings",
        context: {
          locale: "en",
          allowedIntents: ["settings.open"]
        }
      })
    ).rejects.toThrow("Intent routing provider is not configured.");
  });

  it("formats unavailable reasons without runtime details", () => {
    expect(intentRoutingProviderUnavailableReason()).toBe(
      "Intent routing provider is not configured."
    );
  });
});
