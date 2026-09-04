import { describe, expect, it } from "vitest";
import {
  AssistantModelAdapterEventSchema,
  ChatAnswerResultSchema,
  type AssistantModelAdapterEvent,
  type ChatAnswerRequest,
} from "@jarvis-k/contracts";
import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import {
  DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
} from "@jarvis-k/inference-adapter-glm-chat-answer-runtime";
import { GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID } from "@jarvis-k/inference-adapter-glm-runtime";
import { ConfigurableChatAnswerProvider } from "../src/composition/chat-composition";
import {
  createCoreHostPlannerComposition,
} from "../src/composition/planner-composition";
import { loadRuntimeConfig } from "../src/config/runtime-config";
import { ChatAnswerRuntimeBinding } from "../src/runtime-binding/chat-answer-runtime-binding";
import { PlannerRuntimeBinding } from "../src/runtime-binding/planner-runtime-binding";

const placeholderCredential = { apiKey: "not-a-real-key" };

describe("Core Host runtime provider bindings", () => {
  it("restores initial chat answer binding on disable", async () => {
    const initialProvider: ChatAnswerProvider = {
      answer: async () =>
        ChatAnswerResultSchema.parse({
          providerId: "chat-answer.initial",
          status: "answered",
          reasonCode: "ANSWERED",
          failureClass: "none",
          answer: "initial",
          fallbackUsed: false,
          directActionAttempted: false,
          rawProviderResponsePersisted: false,
          credentialExposed: false,
          answeredAt: "2026-08-15T00:00:00.000Z",
        }),
    };
    const binding = new ChatAnswerRuntimeBinding({
      activeChatAnswer: undefined,
      configurableChatAnswerProvider: undefined,
      initialChatAnswerProvider: initialProvider,
      initialChatAnswerOptions: {
        enabled: true,
        providerId: "chat-answer.initial",
      },
      controlledRuntimeUtterance: "controlled utterance",
    });

    const restored = binding.applyProductModeConfiguration({ enabled: false });

    expect(restored).toMatchObject({
      provider: initialProvider,
      options: {
        enabled: true,
        providerId: "chat-answer.initial",
      },
    });
  });

  it("does not expose chat answer credentials in binding results", () => {
    const configurable = new ConfigurableChatAnswerProvider(
      DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    );
    const binding = new ChatAnswerRuntimeBinding({
      activeChatAnswer: {
        providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
        profileId: DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID,
        modelId: DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
        endpoint: DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
        networkWindowApproved: true,
      },
      configurableChatAnswerProvider: configurable,
      initialChatAnswerProvider: undefined,
      initialChatAnswerOptions: undefined,
      controlledRuntimeUtterance: "controlled utterance",
    });

    const result = binding.applyProductModeConfiguration({
      enabled: true,
      credential: placeholderCredential,
    });
    binding.applyProviderConfiguration({
      provider: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
      credentials: placeholderCredential,
    });

    expect(result.options).toEqual({
      enabled: true,
      providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
      forcedChatAnswerUtterances: ["controlled utterance"],
    });
    expect(JSON.stringify(result)).not.toContain(
      placeholderCredential.apiKey,
    );
  });

  it("forwards configured chat answer streaming capability and abort signals", async () => {
    let receivedSignal: AbortSignal | undefined;
    const inner: ChatAnswerProvider = {
      answer: async (request) =>
        ChatAnswerResultSchema.parse({
          providerId: request.providerId,
          status: "answered",
          reasonCode: "ANSWERED",
          failureClass: "none",
          answer: "one-shot",
          fallbackUsed: false,
          directActionAttempted: false,
          rawProviderResponsePersisted: false,
          credentialExposed: false,
          answeredAt: "2026-09-04T00:00:00.000Z",
        }),
      async *startTextTurn(
        _request: ChatAnswerRequest,
        _context: Record<string, never>,
        signal: AbortSignal,
      ) {
        receivedSignal = signal;
        yield AssistantModelAdapterEventSchema.parse({
          type: "delta",
          delta: { kind: "text", text: "stream" },
        });
        yield AssistantModelAdapterEventSchema.parse({
          type: "final",
          text: "stream",
        });
      },
    };
    const provider = new ConfigurableChatAnswerProvider(
      DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    );
    provider.configure(inner);
    const controller = new AbortController();
    const events = await collectEvents(
      provider.startTextTurn!(
        {
          providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
          utterance: "ordinary question",
          source: "text",
          routedAt: "2026-09-04T00:00:00.000Z",
          routerDecision: {
            intent: "chat.answer",
            confidence: 0.72,
            requiresApproval: false,
            slots: {},
            reason: "Defaulted to a conversational answer route.",
          },
        },
        {},
        controller.signal,
      ),
    );

    expect(events.map((event) => event.type)).toEqual(["delta", "final"]);
    expect(receivedSignal).toBe(controller.signal);
    expect(JSON.stringify(events)).not.toContain(placeholderCredential.apiKey);
  });

  it("classifies configured providers without streaming support explicitly", async () => {
    const provider = new ConfigurableChatAnswerProvider(
      DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    );
    provider.configure({
      answer: async (request) =>
        ChatAnswerResultSchema.parse({
          providerId: request.providerId,
          status: "answered",
          reasonCode: "ANSWERED",
          failureClass: "none",
          answer: "one-shot",
          fallbackUsed: false,
          directActionAttempted: false,
          rawProviderResponsePersisted: false,
          credentialExposed: false,
          answeredAt: "2026-09-04T00:00:00.000Z",
        }),
    });

    const events = await collectEvents(
      provider.startTextTurn!(
        {
          providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
          utterance: "ordinary question",
          source: "text",
          routedAt: "2026-09-04T00:00:00.000Z",
          routerDecision: {
            intent: "chat.answer",
            confidence: 0.72,
            requiresApproval: false,
            slots: {},
            reason: "Defaulted to a conversational answer route.",
          },
        },
        {},
        new AbortController().signal,
      ),
    );

    expect(events).toEqual([
      expect.objectContaining({
        type: "failure",
        reason: "streaming_not_supported",
        retryable: true,
      }),
    ]);
  });

  it("clears planner provider when configuration targets a different provider", async () => {
    const plannerComposition = createCoreHostPlannerComposition(
      loadRuntimeConfig({ JARVIS_K_ENABLE_HEAVY_PLANNER_OPENAI: "1" }),
    );
    const binding = new PlannerRuntimeBinding({
      activeHeavyPlanner: plannerComposition.activeHeavyPlanner,
      configurableHeavyPlannerProvider:
        plannerComposition.configurableHeavyPlannerProvider,
    });

    binding.applyProviderConfiguration({
      provider: "glm",
      credentials: placeholderCredential,
    });

    await expect(
      plannerComposition.configurableHeavyPlannerProvider?.plan({
        utterance: "Plan a task.",
        locale: "en",
        now: "2026-08-15T00:00:00.000Z",
        context: {},
      }),
    ).resolves.toMatchObject({
      providerId: "heavy-planner.openai",
      status: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
    });
  });

  it("does not expose planner credentials in status-like results", () => {
    const plannerComposition = createCoreHostPlannerComposition(
      loadRuntimeConfig({ JARVIS_K_ENABLE_HEAVY_PLANNER_GLM: "1" }),
    );
    const binding = new PlannerRuntimeBinding({
      activeHeavyPlanner: plannerComposition.activeHeavyPlanner,
      configurableHeavyPlannerProvider:
        plannerComposition.configurableHeavyPlannerProvider,
    });

    binding.applyProviderConfiguration({
      provider: "glm",
      credentials: placeholderCredential,
    });

    expect(plannerComposition.activeHeavyPlanner).toMatchObject({
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    });
    expect(JSON.stringify(plannerComposition)).not.toContain(
      placeholderCredential.apiKey,
    );
  });
});

async function collectEvents(
  events: AsyncIterable<AssistantModelAdapterEvent>,
): Promise<AssistantModelAdapterEvent[]> {
  const collected: AssistantModelAdapterEvent[] = [];
  for await (const event of events) {
    collected.push(event);
  }
  return collected;
}
