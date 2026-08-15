import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Core Host provider-backed Chat Answer manual acceptance wiring", () => {
  const indexSource = () =>
    readFileSync(
      path.join(process.cwd(), "apps", "core-host", "src", "index.ts"),
      "utf8"
    );
  const chatCompositionSource = () =>
    readFileSync(
      path.join(
        process.cwd(),
        "apps",
        "core-host",
        "src",
        "composition",
        "chat-composition.ts"
      ),
      "utf8"
    );
  const hostMessageSchemaSource = () =>
    readFileSync(
      path.join(
        process.cwd(),
        "apps",
        "core-host",
        "src",
        "host",
        "host-message-schema.ts"
      ),
      "utf8"
    );
  const chatAnswerRuntimeBindingSource = () =>
    readFileSync(
      path.join(
        process.cwd(),
        "apps",
        "core-host",
        "src",
        "runtime-binding",
        "chat-answer-runtime-binding.ts"
      ),
      "utf8"
    );
  const runtimeConfigurationControllerSource = () =>
    readFileSync(
      path.join(
        process.cwd(),
        "apps",
        "core-host",
        "src",
        "host",
        "runtime-configuration-controller.ts"
      ),
      "utf8"
    );
  const runtimeConfigSource = () =>
    readFileSync(
      path.join(
        process.cwd(),
        "apps",
        "core-host",
        "src",
        "config",
        "runtime-config.ts"
      ),
      "utf8"
    );

  it("keeps the DeepSeek product manual acceptance path explicitly gated", () => {
    const source = indexSource();
    const configSource = runtimeConfigSource();
    const schemaSource = hostMessageSchemaSource();
    const bindingSource = chatAnswerRuntimeBindingSource();

    expect(configSource).toContain(
      'JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_PRODUCT_MANUAL_ACCEPTANCE'
    );
    expect(configSource).toContain(
      'JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_EXPANDED_PRODUCT_LOOP'
    );
    expect(configSource).toContain('JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK');
    expect(source).toContain(
      "runtimeConfig.providerBackedChatAnswerProductManualAcceptanceRequested"
    );
    expect(source).toContain(
      "runtimeConfig.providerBackedChatAnswerExpandedProductLoopRequested"
    );
    expect(source).toContain("runtimeConfig.deepseekChatAnswerEnabled");
    expect(schemaSource).toContain("chat-answer-provider.configure");
    expect(source).toContain("DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID");
    expect(source).toContain("expandedProductLoopChatAnswerUtterances");
    expect(bindingSource).toContain(
      "createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition"
    );
    expect(source).toContain("configurableChatAnswerProvider");
  });

  it("accepts Settings product-mode binding while keeping real runtime locked", () => {
    const source = indexSource();
    const compositionSource = chatCompositionSource();
    const schemaSource = hostMessageSchemaSource();
    const bindingSource = chatAnswerRuntimeBindingSource();
    const controllerSource = runtimeConfigurationControllerSource();

    expect(schemaSource).toContain("chat-answer-product-mode.configure");
    expect(schemaSource).toContain("parseChatAnswerProductModeConfigurationMessage");
    expect(bindingSource).toContain("controlledRuntimeBindingChatAnswerProvider");
    expect(bindingSource).toContain("OneShotFixedUtteranceChatAnswerProvider");
    expect(compositionSource).toContain(
      "class OneShotFixedUtteranceChatAnswerProvider"
    );
    expect(compositionSource).toContain(
      "request.utterance.trim() !== this.allowedUtterance"
    );
    expect(source).toContain("CONTROLLED_CHAT_ANSWER_REAL_RUNTIME_UTTERANCE");
    expect(bindingSource).toContain("DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID");
    expect(schemaSource).toContain("credentialIncluded === true");
    expect(schemaSource).toContain("runtimeLocked === false");
    expect(bindingSource).toContain("networkWindowApproved:");
    expect(schemaSource).toContain("runtimeLocked !== true");
    expect(schemaSource).toContain("credentialIncluded !== false");
    expect(controllerSource).toContain("configureChatAnswerProductMode");
  });
});
