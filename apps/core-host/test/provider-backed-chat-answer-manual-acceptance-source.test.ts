import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Core Host provider-backed Chat Answer manual acceptance wiring", () => {
  it("keeps the DeepSeek product manual acceptance path explicitly gated", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "apps",
        "core-host",
        "src",
        "index.ts"
      ),
      "utf8"
    );

    expect(source).toContain(
      'JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_PRODUCT_MANUAL_ACCEPTANCE'
    );
    expect(source).toContain(
      'JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_EXPANDED_PRODUCT_LOOP'
    );
    expect(source).toContain('JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK');
    expect(source).toContain("chat-answer-provider.configure");
    expect(source).toContain("DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID");
    expect(source).toContain("expandedProductLoopChatAnswerUtterances");
    expect(source).toContain(
      "createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition"
    );
    expect(source).toContain("configurableChatAnswerProvider");
  });

  it("accepts Settings product-mode binding while keeping real runtime locked", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "apps",
        "core-host",
        "src",
        "index.ts"
      ),
      "utf8"
    );

    expect(source).toContain("chat-answer-product-mode.configure");
    expect(source).toContain("parseChatAnswerProductModeConfigurationMessage");
    expect(source).toContain("controlledRuntimeBindingChatAnswerProvider");
    expect(source).toContain("OneShotFixedUtteranceChatAnswerProvider");
    expect(source).toContain("CONTROLLED_CHAT_ANSWER_REAL_RUNTIME_UTTERANCE");
    expect(source).toContain("DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID");
    expect(source).toContain("credentialIncluded === true");
    expect(source).toContain("runtimeLocked === false");
    expect(source).toContain("networkWindowApproved:");
    expect(source).toContain("runtimeLocked !== true");
    expect(source).toContain("credentialIncluded !== false");
    expect(source).toContain("runtime.configureChatAnswerProductMode");
  });
});
