import { describe, expect, it } from "vitest";
import {
  createCoreHostChatAnswerTextOnlyAcceptanceComposition,
  shouldDisableCoreHostMemoryForChatAnswerTextOnlyAcceptance
} from "../src/chat-answer-text-only-acceptance-composition";

describe("Core Host Chat Answer text-only acceptance composition", () => {
  it("remains disabled by default", () => {
    const composition =
      createCoreHostChatAnswerTextOnlyAcceptanceComposition({
        enabled: false,
        fixtureChatAnswerEnabled: false
      });

    expect(composition.options).toBeUndefined();
    expect(composition.report).toMatchObject({
      status: "disabled",
      explicitEnablement: false,
      fixtureChatAnswerRequired: true,
      voiceInputEnabled: false,
      credentialAccessed: false,
      networkAccessed: false,
      modelRuntimeAccessed: false,
      memoryVectorAccessed: false,
      directActionAttempted: false,
      defaultBehaviorChanged: false
    });
  });

  it("fails closed when Chat Answer fixture enablement is missing", () => {
    const composition =
      createCoreHostChatAnswerTextOnlyAcceptanceComposition({
        enabled: true,
        fixtureChatAnswerEnabled: false
      });

    expect(composition.options).toBeUndefined();
    expect(composition.report.status).toBe("disabled");
  });

  it("enables only the text-only acceptance option after both explicit gates", () => {
    const composition =
      createCoreHostChatAnswerTextOnlyAcceptanceComposition({
        enabled: true,
        fixtureChatAnswerEnabled: true
      });

    expect(composition.options).toEqual({ enabled: true });
    expect(composition.report).toMatchObject({
      status: "available",
      explicitEnablement: true,
      fixtureChatAnswerRequired: true,
      voiceInputEnabled: false,
      credentialAccessed: false,
      networkAccessed: false,
      modelRuntimeAccessed: false,
      memoryVectorAccessed: false,
      directActionAttempted: false,
      defaultBehaviorChanged: false
    });
  });

  it("disables Core Host Memory startup only after both explicit gates", () => {
    expect(
      shouldDisableCoreHostMemoryForChatAnswerTextOnlyAcceptance({
        enabled: false,
        fixtureChatAnswerEnabled: false
      })
    ).toBe(false);
    expect(
      shouldDisableCoreHostMemoryForChatAnswerTextOnlyAcceptance({
        enabled: true,
        fixtureChatAnswerEnabled: false
      })
    ).toBe(false);
    expect(
      shouldDisableCoreHostMemoryForChatAnswerTextOnlyAcceptance({
        enabled: false,
        fixtureChatAnswerEnabled: true
      })
    ).toBe(false);
    expect(
      shouldDisableCoreHostMemoryForChatAnswerTextOnlyAcceptance({
        enabled: true,
        fixtureChatAnswerEnabled: true
      })
    ).toBe(true);
  });
});
