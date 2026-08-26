import { describe, expect, it } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  AdvancedBrainDiagnosticsSchema,
  AdvancedBrainProviderCapabilityProfileSchema,
  AdvancedBrainProviderResultSchema,
  AdvancedBrainRequestSchema,
  CloudReasoningModelCapabilityProfileSchema,
  CloudReasoningProviderHealthProjectionSchema,
  CloudReasoningTimeoutPolicySchema,
} from "../src";

describe("Advanced Brain protocol", () => {
  it("accepts bounded provider capability profiles", () => {
    const profile = AdvancedBrainProviderCapabilityProfileSchema.parse(
      profileFixture(),
    );

    expect(profile.providerId).toBe("advanced-brain.local");
    expect(profile.supportsStructuredOutput).toBe(true);
  });

  it("rejects local absolute paths in minimized user input", () => {
    expect(() =>
      AdvancedBrainRequestSchema.parse({
        ...requestFixture(),
        minimizedInput: "please summarize C:\\Users\\Admin\\secret.txt",
        userText: undefined,
      }),
    ).toThrow("local absolute paths");
  });

  it("requires explicit evidence before confirmed cloud egress", () => {
    expect(() =>
      AdvancedBrainRequestSchema.parse({
        ...requestFixture(),
        privacyRequirement: "cloud_requires_confirmation",
        cloudEgressPolicy: "allow_cloud",
      }),
    ).toThrow("Cloud egress confirmation");
  });

  it("keeps structured plans as approval-bound proposals", () => {
    const result = AdvancedBrainProviderResultSchema.parse({
      ...resultFixture(),
      resultClass: "structured_plan",
      reasonCode: "FIXTURE_PLAN",
      answer: undefined,
      structuredPlan: {
        summary: "Plan a bounded answer.",
        risk: "medium",
        requiresConfirmation: true,
        steps: [
          {
            id: "step-1",
            toolId: "chat.answer",
            title: "Draft answer",
            args: {},
            risk: "medium",
            requiresConfirmation: true,
            directActionAttempted: false,
          },
        ],
        directActionAttempted: false,
      },
    });

    expect(result.directActionAttempted).toBe(false);
    expect(result.structuredPlan?.requiresConfirmation).toBe(true);
  });

  it("accepts real provider Advanced Brain results without fixture semantics", () => {
    const result = AdvancedBrainProviderResultSchema.parse({
      ...resultFixture(),
      providerId: "advanced-brain.glm",
      modelId: "glm-5.2",
      reasonCode: "PROVIDER_ANSWER",
      executionSemantics: "real_provider",
      networkRequestIssued: true,
    });

    expect(result.executionSemantics).toBe("real_provider");
    expect(result.reasonCode).toBe("PROVIDER_ANSWER");
    expect(result.directActionAttempted).toBe(false);
  });

  it("rejects diagnostics that expose prompt, credential, path, or raw output", () => {
    const safe = AdvancedBrainDiagnosticsSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      requestId: "advanced-request-1",
      category: "advanced_chat",
      tokenBudgetClass: "small",
      costBudgetClass: "low",
      cloudEgressDecision: "not_applicable",
      promptExposed: false,
      credentialExposed: false,
      localPathExposed: false,
      rawProviderResponsePersisted: false,
    });

    expect(safe.promptExposed).toBe(false);
    expect(() =>
      AdvancedBrainDiagnosticsSchema.parse({
        ...safe,
        promptExposed: true,
      }),
    ).toThrow();
    expect(() =>
      AdvancedBrainDiagnosticsSchema.parse({
        ...safe,
        prompt: "must not cross diagnostics",
      }),
    ).toThrow();
  });

  it("accepts provider-neutral cloud model capability profiles", () => {
    const profile = CloudReasoningModelCapabilityProfileSchema.parse(
      cloudModelProfileFixture(),
    );

    expect(profile.protocolFamily).toBe("openai_chat_completions");
    expect(profile.thinkingPolicy).toBe("optional");
    expect(profile.credentialBindingId).toBe("glm.advanced-brain.api-key");
  });

  it("keeps unimplemented protocol families fail-closed when enabled", () => {
    for (const protocolFamily of [
      "openai_responses",
      "anthropic_messages",
      "dashscope_native",
      "local_openai_compatible",
      "custom_adapter",
    ] as const) {
      expect(() =>
        CloudReasoningModelCapabilityProfileSchema.parse({
          ...cloudModelProfileFixture(),
          protocolFamily,
          enabled: true,
        }),
      ).toThrow("Only openai_chat_completions");
    }
  });

  it("validates four-layer timeout policies and safe health projections", () => {
    const timeoutPolicy = CloudReasoningTimeoutPolicySchema.parse({
      policyId: "reasoning-default-v1",
      connectOrHeadersTimeoutMs: 15_000,
      firstEventTimeoutMs: 60_000,
      streamIdleTimeoutMs: 30_000,
      overallTimeoutMs: 180_000,
    });
    const health = CloudReasoningProviderHealthProjectionSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: "advanced-brain.glm",
      deploymentId: "standard_paas_v4",
      modelId: "glm-5.2",
      state: "ready",
      lastAttemptAt: "2026-08-26T00:00:00.000Z",
      lastSuccessAt: "2026-08-26T00:00:00.000Z",
      consecutiveFailureCount: 0,
      source: "runtime_observation",
    });

    expect(timeoutPolicy.overallTimeoutMs).toBe(180_000);
    expect(health.source).toBe("runtime_observation");
    expect(() =>
      CloudReasoningProviderHealthProjectionSchema.parse({
        ...health,
        prompt: "must not be projected",
      }),
    ).toThrow();
  });
});

function profileFixture() {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.local",
    modelId: "local-advanced-v1",
    deploymentClass: "local",
    executionSemantics: "not_executed",
    automaticRetry: false,
    automaticFallback: false,
    inputModalities: ["text"],
    outputModalities: ["text"],
    supportsStructuredOutput: true,
    supportsFunctionCalling: false,
    supportsReasoning: true,
    supportsStreaming: false,
    supportsCancellation: true,
    maxContextClass: "long",
    latencyClass: "interactive",
    costClass: "free",
    regionAvailability: ["local"],
    privacyClass: "local",
    taskCategories: ["advanced_chat", "multi_step_plan"],
    enabled: true,
    healthStatus: "healthy",
  };
}

function requestFixture() {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "advanced-request-1",
    category: "advanced_chat",
    source: "text",
    userText: "explain Jarvis-K architecture",
    inputModalities: ["text"],
    requestedOutput: "answer",
    privacyRequirement: "local_only",
    cloudEgressPolicy: "local_only",
    timeoutMs: 1_000,
    tokenBudgetClass: "small",
    costBudgetClass: "low",
    allowedCapabilities: ["text_reasoning"],
    safetyContext: {
      risk: "low",
      allowedToolIds: [],
      approvalRequired: false,
      directExecutionAllowed: false,
    },
  };
}

function resultFixture() {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.fixture",
    modelId: "advanced-fixture-v1",
    requestId: "advanced-request-1",
    resultClass: "answer",
    reasonCode: "FIXTURE_ANSWER",
    answer: "Fixture answer.",
    executionSemantics: "fixture",
    directActionAttempted: false,
    rawProviderResponsePersisted: false,
    credentialExposed: false,
    localPathExposed: false,
    networkRequestIssued: false,
    completedAt: "2026-08-25T00:00:00.000Z",
  };
}

function cloudModelProfileFixture() {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.glm",
    modelId: "glm-5.2",
    protocolFamily: "openai_chat_completions",
    deploymentId: "standard_paas_v4",
    trustClass: "provider_managed",
    region: "mainland_china",
    supportsStreaming: true,
    supportsNonStreaming: true,
    supportsThinking: true,
    thinkingPolicy: "optional",
    supportsReasoningEffort: false,
    supportsTools: false,
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsImages: false,
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    recommendedOutputTokens: 256,
    requestTimeoutPolicyId: "reasoning-default-v1",
    credentialBindingId: "glm.advanced-brain.api-key",
    endpointProfileId: "standard_paas_v4",
    executionSemantics: "real_provider",
    dataEgressClass: "cloud_user_content",
    pricingTier: "medium",
    enabled: true,
  };
}
