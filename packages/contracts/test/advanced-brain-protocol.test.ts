import { describe, expect, it } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  AdvancedBrainDiagnosticsSchema,
  AdvancedBrainProviderCapabilityProfileSchema,
  AdvancedBrainProviderResultSchema,
  AdvancedBrainRequestSchema,
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
});

function profileFixture() {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.local",
    modelId: "local-advanced-v1",
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
