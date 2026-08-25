import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  type AdvancedBrainRequest,
} from "@jarvis-k/contracts";

export function requestFixture(
  overrides: Partial<AdvancedBrainRequest> = {},
): AdvancedBrainRequest {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "advanced-request-1",
    category: "advanced_chat",
    source: "test",
    userText: "Explain the provider-neutral Advanced Brain boundary.",
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
    ...overrides,
  };
}
