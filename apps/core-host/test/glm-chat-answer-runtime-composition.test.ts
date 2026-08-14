import { describe, expect, it } from "vitest";
import type { GlmChatAnswerRuntimeTransport } from "@jarvis-k/inference-adapter-glm-chat-answer-runtime";
import {
  createCoreHostGlmChatAnswerRuntimeComposition
} from "../src/glm-chat-answer-runtime-composition";

function allGates(
  transport: GlmChatAnswerRuntimeTransport = fixedTransport()
) {
  return {
    enabled: true,
    providerId: "chat-answer.openai-compatible.glm",
    modelId: "glm-4.7",
    endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    fixedProfileApproved: true,
    secureCredentialStoreAvailable: true,
    credential: { apiKey: "test-glm-key" },
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

describe("Core Host GLM Chat Answer runtime composition", () => {
  it("constructs the approved provider only when every gate passes", () => {
    const composition = createCoreHostGlmChatAnswerRuntimeComposition(
      allGates()
    );

    expect(composition.provider).toBeDefined();
    expect(composition.compositionReport).toMatchObject({
      provider: "chat-answer.openai-compatible.glm",
      model: "glm-4.7",
      endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      status: "available",
      reasonCodes: ["GLM_CHAT_ANSWER_RUNTIME_AVAILABLE"],
      directActionAttempted: false,
      credentialExposed: false,
      networkAccessed: false,
      realApiCalled: false,
      defaultBehaviorChanged: false,
      uiIpcBehaviorChanged: false,
      telemetryChanged: false,
      releaseBehaviorChanged: false
    });
  });

  it("fails closed when network approval or credentials are missing", () => {
    const networkBlocked = createCoreHostGlmChatAnswerRuntimeComposition({
      ...allGates(),
      networkWindowApproved: false
    });
    const credentialMissing = createCoreHostGlmChatAnswerRuntimeComposition({
      ...allGates(),
      credential: undefined
    });

    expect(networkBlocked.provider).toBeUndefined();
    expect(networkBlocked.compositionReport.reasonCodes).toContain(
      "GLM_CHAT_ANSWER_RUNTIME_NETWORK_WINDOW_NOT_APPROVED"
    );
    expect(credentialMissing.provider).toBeUndefined();
    expect(credentialMissing.compositionReport.reasonCodes).toContain(
      "GLM_CHAT_ANSWER_RUNTIME_CREDENTIAL_MISSING"
    );
  });
});

function fixedTransport(): GlmChatAnswerRuntimeTransport {
  return {
    async send() {
      return { status: 200, body: {} };
    }
  };
}
