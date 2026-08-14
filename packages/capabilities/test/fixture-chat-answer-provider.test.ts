import { describe, expect, it } from "vitest";
import {
  FixtureChatAnswerProvider
} from "../src/fixture-chat-answer-provider";

function request(text: string, intent: "chat.answer" | "clarify" | "blocked") {
  return {
    providerId: "chat-answer.fixture",
    utterance: text,
    source: "text" as const,
    routedAt: "2026-08-08T00:00:00.000Z",
    routerDecision: {
      intent,
      confidence: 0.8,
      requiresApproval: false,
      slots: {},
      reason: "fixture"
    }
  };
}

describe("FixtureChatAnswerProvider", () => {
  it("returns a bounded answered result", async () => {
    const result = await new FixtureChatAnswerProvider().answer(
      request("什么是 Memory Alpha？", "chat.answer")
    );

    expect(result.status).toBe("answered");
    expect(result.answer).toContain("Fixture answer");
    expect(result.directActionAttempted).toBe(false);
    expect(result.rawProviderResponsePersisted).toBe(false);
    expect(result.credentialExposed).toBe(false);
  });

  it("returns clarify without answer content", async () => {
    const result = await new FixtureChatAnswerProvider().answer(
      request("怎么", "clarify")
    );

    expect(result.status).toBe("clarify");
    expect(result.clarifyQuestion).toBeTruthy();
    expect(result.answer).toBeUndefined();
  });

  it("fails closed for blocked intent", async () => {
    const result = await new FixtureChatAnswerProvider().answer(
      request("打开一个危险目标", "blocked")
    );

    expect(result.status).toBe("blocked");
    expect(result.reasonCode).toBe("UNSAFE_OR_BLOCKED");
    expect(result.answer).toBeUndefined();
    expect(result.clarifyQuestion).toBeUndefined();
  });
});
