import { describe, expect, it } from "vitest";
import type { OpenAiCompatibleChatAnswerRuntimeTransport } from "@jarvis-k/inference-adapter-glm-chat-answer-runtime";
import {
  createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition
} from "../src/openai-compatible-chat-answer-runtime-composition";

function allGates(
  profileId: "glm.4.7.compact_json_object_128" | "deepseek.v4-flash.compact_json_object_128",
  providerId: "chat-answer.openai-compatible.glm" | "chat-answer.openai-compatible.deepseek",
  modelId: "glm-4.7" | "deepseek-v4-flash",
  endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions" | "https://api.deepseek.com/chat/completions",
  transport: OpenAiCompatibleChatAnswerRuntimeTransport = fixedTransport()
) {
  return {
    enabled: true,
    profileId,
    providerId,
    modelId,
    endpoint,
    fixedProfileApproved: true,
    secureCredentialStoreAvailable: true,
    credential: { apiKey: "test-key" },
    credentialExposed: false,
    networkWindowApproved: true,
    contractReady: true,
    parserReady: true,
    timeoutAndOutputBoundsReady: true,
    defaultOffPreserved: true,
    fixtureFallbackPreserved: true,
    executorOnlySideEffectsPreserved: true,
    transport
  } as const;
}

describe("Core Host OpenAI-compatible Chat Answer runtime composition", () => {
  it("constructs the approved GLM and DeepSeek profiles through one generic path", () => {
    const glm = createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition(
      allGates(
        "glm.4.7.compact_json_object_128",
        "chat-answer.openai-compatible.glm",
        "glm-4.7",
        "https://open.bigmodel.cn/api/paas/v4/chat/completions"
      )
    );
    const deepseek =
      createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition(
        allGates(
          "deepseek.v4-flash.compact_json_object_128",
          "chat-answer.openai-compatible.deepseek",
          "deepseek-v4-flash",
          "https://api.deepseek.com/chat/completions"
        )
      );

    expect(glm.provider).toBeDefined();
    expect(glm.compositionReport).toMatchObject({
      provider: "chat-answer.openai-compatible.glm",
      family: "glm",
      status: "available"
    });
    expect(deepseek.provider).toBeDefined();
    expect(deepseek.compositionReport).toMatchObject({
      provider: "chat-answer.openai-compatible.deepseek",
      family: "deepseek",
      status: "available"
    });
  });

  it("fails closed when the selected provider does not match the approved profile", () => {
    const composition =
      createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition({
        ...allGates(
          "deepseek.v4-flash.compact_json_object_128",
          "chat-answer.openai-compatible.glm",
          "deepseek-v4-flash",
          "https://api.deepseek.com/chat/completions"
        )
      });

    expect(composition.provider).toBeUndefined();
    expect(composition.compositionReport.reasonCodes).toContain(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PROVIDER_NOT_APPROVED"
    );
  });
});

function fixedTransport(): OpenAiCompatibleChatAnswerRuntimeTransport {
  return {
    async send() {
      return { status: 200, body: {} };
    }
  };
}
