import { describe, expect, it } from "vitest";
import { createCoreHostFixtureChatAnswerComposition } from "../src/fixture-chat-answer-composition";

describe("Core Host Chat Answer fixture composition", () => {
  it("keeps the provider and options disabled by default", () => {
    const composition = createCoreHostFixtureChatAnswerComposition({
      enabled: false
    });

    expect(composition.provider).toBeUndefined();
    expect(composition.options).toBeUndefined();
    expect(composition.report).toMatchObject({
      status: "disabled",
      explicitEnablement: false,
      networkAccessed: false,
      credentialAccessed: false,
      modelRuntimeAccessed: false,
      memoryAccessed: false,
      directActionAttempted: false,
      defaultBehaviorChanged: false
    });
  });

  it("composes only the bounded fixture provider after explicit opt-in", async () => {
    const composition = createCoreHostFixtureChatAnswerComposition({
      enabled: true
    });

    expect(composition.provider).toBeDefined();
    expect(composition.options).toEqual({
      enabled: true,
      providerId: "chat-answer.fixture"
    });
    expect(composition.report).toMatchObject({
      status: "available",
      explicitEnablement: true,
      networkAccessed: false,
      credentialAccessed: false,
      modelRuntimeAccessed: false,
      memoryAccessed: false,
      directActionAttempted: false,
      defaultBehaviorChanged: false
    });

    const result = await composition.provider?.answer({
      providerId: "chat-answer.fixture",
      utterance: "Explain the purpose of this project.",
      source: "text",
      routedAt: "2026-08-08T00:00:00.000Z",
      routerDecision: {
        intent: "chat.answer",
        confidence: 0.72,
        requiresApproval: false,
        slots: {},
        reason: "Fixture routing decision."
      }
    });

    expect(result).toMatchObject({
      providerId: "chat-answer.fixture",
      status: "answered",
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false
    });
  });
});
