import { describe, expect, it } from "vitest";
import {
  ChatAnswerProviderConfigurationSaveRequestSchema,
  ChatAnswerProviderConfigurationStatusSchema,
  ChatAnswerProviderCredentialReplaceRequestSchema,
  ChatAnswerPreferenceProjectionSchema,
  ChatAnswerRequestSchema,
  ChatAnswerResultSchema,
  UserPreferenceMemoryRecordSchema
} from "../src/protocol";

describe("Chat Answer contracts", () => {
  it("accepts a bounded answered result", () => {
    const result = ChatAnswerResultSchema.parse({
      providerId: "chat-answer.fixture",
      status: "answered",
      reasonCode: "FIXTURE_ANSWER",
      failureClass: "none",
      answer: "A bounded fixture answer.",
      fallbackUsed: false,
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      answeredAt: "2026-08-08T00:00:00.000Z"
    });

    expect(result.status).toBe("answered");
  });

  it("rejects answer content on blocked results", () => {
    expect(() =>
      ChatAnswerResultSchema.parse({
        providerId: "chat-answer.fixture",
        status: "blocked",
        reasonCode: "UNSAFE_OR_BLOCKED",
        failureClass: "UNSAFE_OR_BLOCKED",
        answer: "unsafe content",
        fallbackUsed: false,
        directActionAttempted: false,
        rawProviderResponsePersisted: false,
        credentialExposed: false,
        answeredAt: "2026-08-08T00:00:00.000Z"
      })
    ).toThrow();
  });

  it("requires the chat.answer router intent in the request boundary", () => {
    const parsed = ChatAnswerRequestSchema.parse({
      providerId: "chat-answer.fixture",
      utterance: "Explain Memory Alpha.",
      source: "text",
      routedAt: "2026-08-08T00:00:00.000Z",
      routerDecision: {
        intent: "chat.answer",
        confidence: 0.8,
        requiresApproval: false,
        slots: {},
        reason: "fixture"
      }
    });

    expect(parsed.routerDecision.intent).toBe("chat.answer");
  });

  it("accepts sanitized preference projection on request and result boundaries", () => {
    const preferenceProjection = ChatAnswerPreferenceProjectionSchema.parse({
      status: "applied",
      appliesTo: "chat.answer",
      preferredResponseLanguage: "zh",
      preferredResponseLength: "short",
      preferredResponseStyle: "friendly",
      source: "user_preference_memory",
      rawContentExposed: false,
      vectorRetrievalUsed: false,
      providerNeutral: true
    });

    const request = ChatAnswerRequestSchema.parse({
      providerId: "chat-answer.fixture",
      utterance: "Answer in one short sentence: what is Jarvis-K?",
      source: "text",
      routedAt: "2026-08-13T00:00:00.000Z",
      routerDecision: {
        intent: "chat.answer",
        confidence: 0.8,
        requiresApproval: false,
        slots: {},
        reason: "deterministic rules"
      },
      preferenceProjection
    });

    const result = ChatAnswerResultSchema.parse({
      providerId: "chat-answer.fixture",
      status: "answered",
      reasonCode: "FIXTURE_ANSWER",
      failureClass: "none",
      answer: "A bounded fixture answer.",
      fallbackUsed: false,
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      answeredAt: "2026-08-13T00:00:00.000Z",
      preferenceProjection
    });

    expect(request.preferenceProjection?.preferredResponseLanguage).toBe("zh");
    expect(request.preferenceProjection?.preferredResponseLength).toBe("short");
    expect(request.preferenceProjection?.preferredResponseStyle).toBe(
      "friendly",
    );
    expect(result.preferenceProjection?.rawContentExposed).toBe(false);
  });

  it("rejects inactive preference projection with a preferred language", () => {
    expect(() =>
      ChatAnswerPreferenceProjectionSchema.parse({
        status: "none",
        appliesTo: "chat.answer",
        preferredResponseLanguage: "zh",
        source: "none",
        rawContentExposed: false,
        vectorRetrievalUsed: false,
        providerNeutral: true
      })
    ).toThrow();
  });

  it("rejects mismatched preference memory key values", () => {
    expect(() =>
      UserPreferenceMemoryRecordSchema.parse({
        id: "preference_response_language",
        key: "response_language",
        label: "Response language",
        value: "short",
        summary: "Prefer short replies",
        source: "user_confirmed_preference",
        risk: "low",
        enabled: true,
        appliesTo: "ui_projection_only",
        createdAt: "2026-08-13T00:00:00.000Z",
        updatedAt: "2026-08-13T00:00:00.000Z"
      })
    ).toThrow();
  });

  it("accepts the safe Chat Answer provider configuration status without credentials", () => {
    const status = ChatAnswerProviderConfigurationStatusSchema.parse({
      providerId: "chat-answer.openai-compatible.deepseek",
      providerLabel: "DeepSeek",
      protocolLabel: "OpenAI-compatible",
      configured: true,
      enabled: false,
      runtimeArmed: false,
      secureStorageAvailable: true,
      credentialConfigured: true,
      credentialExposed: false,
      publicConfiguration: {
        providerId: "chat-answer.openai-compatible.deepseek",
        serviceUrl: "https://api.deepseek.com/chat/completions",
        modelId: "deepseek-v4-flash"
      },
      connectionTestStatus: "success",
      connectionTestedAt: "2026-09-04T00:00:00.000Z",
      networkRequestRequiredForTest: true,
      reasonCodes: ["CHAT_ANSWER_PROVIDER_CONNECTION_TESTED"]
    });

    expect(JSON.stringify(status)).not.toContain("apiKey");
    expect(JSON.stringify(status)).not.toContain("Bearer");
  });

  it("rejects unknown fields and unsupported Chat Answer provider inputs", () => {
    expect(() =>
      ChatAnswerProviderConfigurationSaveRequestSchema.parse({
        providerId: "chat-answer.openai-compatible.deepseek",
        serviceUrl: "https://api.deepseek.com/chat/completions",
        modelId: "deepseek-v4-flash",
        credential: "secret"
      })
    ).toThrow();
    expect(() =>
      ChatAnswerProviderConfigurationSaveRequestSchema.parse({
        providerId: "chat-answer.openai-compatible.glm",
        serviceUrl: "https://api.deepseek.com/chat/completions",
        modelId: "deepseek-v4-flash"
      })
    ).toThrow();
    expect(() =>
      ChatAnswerProviderConfigurationSaveRequestSchema.parse({
        providerId: "chat-answer.openai-compatible.deepseek",
        serviceUrl: "file:///tmp/key",
        modelId: "deepseek-v4-flash"
      })
    ).toThrow();
    expect(() =>
      ChatAnswerProviderConfigurationSaveRequestSchema.parse({
        providerId: "chat-answer.openai-compatible.deepseek",
        serviceUrl: "https://api.deepseek.com/chat/completions",
        modelId: "../deepseek"
      })
    ).toThrow();
    expect(() =>
      ChatAnswerProviderCredentialReplaceRequestSchema.parse({
        providerId: "chat-answer.openai-compatible.deepseek",
        apiKey: "not-a-credential\nvalue"
      })
    ).toThrow();
  });
});
