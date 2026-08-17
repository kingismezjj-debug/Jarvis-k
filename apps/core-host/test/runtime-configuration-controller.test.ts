import { describe, expect, it, vi } from "vitest";
import type { CoreHostParsedMessage } from "../src/host/host-message-schema";
import { RuntimeConfigurationController } from "../src/host/runtime-configuration-controller";

describe("RuntimeConfigurationController", () => {
  it("applies command-router product mode through the runtime boundary", async () => {
    const harness = createHarness();
    await harness.controller.applyMessage({
      kind: "command-router-product-mode.configure",
      configuration: { enabled: true },
    });

    expect(harness.runtime.configureCommandRouterProductMode).toHaveBeenCalledWith(
      {
        enabled: true,
        providerId: "intent-router.deterministic.rules",
      },
    );
  });

  it("applies chat-answer product mode through the chat binding", async () => {
    const harness = createHarness();
    await harness.controller.applyMessage({
      kind: "chat-answer-product-mode.configure",
      configuration: { enabled: true },
    });

    expect(
      harness.chatAnswerRuntimeBinding.applyProductModeConfiguration,
    ).toHaveBeenCalledWith({ enabled: true });
    expect(harness.runtime.configureChatAnswerProductMode).toHaveBeenCalledWith(
      {
        options: {
          enabled: true,
          providerId: "chat-answer.test",
        },
      },
    );
  });

  it("applies provider credentials without returning credential material", async () => {
    const harness = createHarness();
    const result = await harness.controller.applyMessage({
      kind: "heavy-planner-provider.configure",
      configuration: {
        provider: "openai",
        credentials: {
          apiKey: "test-openai-runtime-key",
        },
      },
    });

    expect(result).toBe(true);
    expect(
      harness.plannerRuntimeBinding.applyProviderConfiguration,
    ).toHaveBeenCalledWith({
      provider: "openai",
      credentials: {
        apiKey: "test-openai-runtime-key",
      },
    });
    expect(JSON.stringify(result)).not.toContain("test-openai-runtime-key");
  });

  it("applies voice provider configuration through the voice composition", async () => {
    const harness = createHarness();
    await harness.controller.applyMessage({
      kind: "voice-provider.configure",
      configuration: {
        provider: "volcengine",
        language: "zh",
        credentials: {
          apiKey: "test-volcengine-key",
          resourceId: "volc.seedasr.sauc.duration",
        },
      },
    });

    expect(harness.voiceComposition.configureProvider).toHaveBeenCalledWith({
      provider: "volcengine",
      language: "zh",
      credentials: {
        apiKey: "test-volcengine-key",
        resourceId: "volc.seedasr.sauc.duration",
      },
    });
    expect(harness.runtime.configureVoicePilotActualProvider).toHaveBeenCalledWith(
      "volcengine",
    );
  });

  it("does not treat ordinary core inbound messages as runtime configuration", async () => {
    const harness = createHarness();
    const result = await harness.controller.applyMessage({
      kind: "core-inbound",
      message: {
        kind: "command",
        envelope: {
          protocolVersion: 1,
          commandId: "cmd-1",
          correlationId: "corr-1",
          createdAt: "2026-08-15T00:00:00.000Z",
          command: {
            type: "agent.runBrainCommand",
            payload: {
              source: "text",
              text: "open notepad",
            },
          },
        },
      },
    } satisfies CoreHostParsedMessage);

    expect(result).toBe(false);
    expect(harness.runtime.configureCommandRouterProductMode).not.toHaveBeenCalled();
    expect(harness.runtime.configureChatAnswerProductMode).not.toHaveBeenCalled();
  });

  it("disposes provider bindings without touching the runtime", () => {
    const harness = createHarness();
    harness.controller.dispose();

    expect(harness.chatAnswerRuntimeBinding.dispose).toHaveBeenCalledTimes(1);
    expect(harness.plannerRuntimeBinding.dispose).toHaveBeenCalledTimes(1);
    expect(harness.runtime.configureCommandRouterProductMode).not.toHaveBeenCalled();
    expect(harness.runtime.configureChatAnswerProductMode).not.toHaveBeenCalled();
  });
});

function createHarness() {
  const runtime = {
    configureCommandRouterProductMode: vi.fn(),
    configureChatAnswerProductMode: vi.fn(),
    configureVoicePilotActualProvider: vi.fn(),
  };
  const chatAnswerRuntimeBinding = {
    applyProductModeConfiguration: vi.fn(() => ({
      options: {
        enabled: true,
        providerId: "chat-answer.test",
      },
    })),
    applyProviderConfiguration: vi.fn(),
    dispose: vi.fn(),
  };
  const plannerRuntimeBinding = {
    applyProviderConfiguration: vi.fn(),
    dispose: vi.fn(),
  };
  const voiceComposition = {
    configureProvider: vi.fn(async () => undefined),
  };
  return {
    runtime,
    chatAnswerRuntimeBinding,
    plannerRuntimeBinding,
    voiceComposition,
    controller: new RuntimeConfigurationController({
      runtime,
      chatAnswerRuntimeBinding,
      plannerRuntimeBinding,
      voiceComposition,
    }),
  };
}
