import { describe, expect, it } from "vitest";
import type { AdvancedReasoningProvider } from "@jarvis-k/capabilities";
import {
  FixtureAdvancedReasoningProvider,
  createFixtureAdvancedBrainProfile,
} from "@jarvis-k/capabilities";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  type AdvancedBrainPreparedRequest,
  type AdvancedBrainProviderResult,
  type AdvancedBrainRequest,
} from "@jarvis-k/contracts";
import { AdvancedBrainOrchestrationService } from "../src/advanced-brain";

describe("AdvancedBrainOrchestrationService", () => {
  it("keeps fixture providers disabled for production selection by default", async () => {
    const provider = new CountingProvider();
    const outcome = await new AdvancedBrainOrchestrationService({
      providers: [provider],
      strategy: "local_first",
    }).run(requestFixture());

    expect(outcome.selection.status).toBe("unavailable");
    expect(provider.executeCalls).toBe(0);
  });

  it("runs deterministic fixture providers only when explicitly allowed", async () => {
    const provider = new CountingProvider();
    const outcome = await new AdvancedBrainOrchestrationService({
      providers: [provider],
      strategy: "local_first",
      allowFixtureProviders: true,
      now: fixedNow,
    }).run(requestFixture());

    expect(provider.executeCalls).toBe(1);
    expect(outcome.result?.resultClass).toBe("answer");
    expect(outcome.diagnostics.promptExposed).toBe(false);
    expect(JSON.stringify(outcome.diagnostics)).not.toContain("Explain");
  });

  it("marks structured plans as approval-required proposals only", async () => {
    const provider = new FixtureAdvancedReasoningProvider({
      behavior: "plan",
      now: fixedNow,
    });
    const outcome = await new AdvancedBrainOrchestrationService({
      providers: [provider],
      strategy: "local_first",
      allowFixtureProviders: true,
      now: fixedNow,
    }).run(
      requestFixture({
        category: "multi_step_plan",
        requestedOutput: "structured_plan",
        allowedCapabilities: ["text_reasoning", "structured_output"],
      }),
    );

    expect(outcome.plannerApprovalRequired).toBe(true);
    expect(outcome.result?.directActionAttempted).toBe(false);
    expect(outcome.result?.structuredPlan?.requiresConfirmation).toBe(true);
  });

  it("normalizes invalid provider output without trying fallback providers", async () => {
    const invalid = new CountingProvider("invalid_schema");
    const fallback = new CountingProvider();
    const outcome = await new AdvancedBrainOrchestrationService({
      providers: [invalid, fallback],
      strategy: "custom",
      allowFixtureProviders: true,
      now: fixedNow,
    }).run(requestFixture());

    expect(invalid.executeCalls).toBe(1);
    expect(fallback.executeCalls).toBe(0);
    expect(outcome.result?.resultClass).toBe("failed");
    expect(outcome.result?.reasonCode).toBe("INVALID_OUTPUT");
    expect(outcome.result?.networkRequestIssued).toBe(false);
  });

  it("cancels timed out providers and returns safe diagnostics", async () => {
    const provider = new CountingProvider("timeout");
    const outcome = await new AdvancedBrainOrchestrationService({
      providers: [provider],
      strategy: "local_first",
      allowFixtureProviders: true,
      now: fixedNow,
    }).run(
      requestFixture({
        timeoutMs: 100,
      }),
    );

    expect(provider.cancelCalls).toBe(1);
    expect(outcome.result?.reasonCode).toBe("PROVIDER_TIMEOUT");
    expect(outcome.result?.executionSemantics).toBe("not_executed");
    expect(outcome.diagnostics.credentialExposed).toBe(false);
    expect(outcome.diagnostics.localPathExposed).toBe(false);
  });

  it("blocks cloud requests when confirmation evidence is missing", async () => {
    const outcome = await new AdvancedBrainOrchestrationService({
      providers: [
        new CountingProvider("answer", {
          privacyClass: "cloud",
          regionAvailability: ["global"],
        }),
      ],
      strategy: "quality_first",
      now: fixedNow,
    }).run(
      requestFixture({
        privacyRequirement: "cloud_requires_confirmation",
        cloudEgressPolicy: "require_confirmation",
      }),
    );

    expect(outcome.selection.status).toBe("confirmation_required");
    expect(outcome.selection.cloudEgressDecision).toBe("confirmation_required");
    expect(outcome.result).toBeUndefined();
  });
});

class CountingProvider implements AdvancedReasoningProvider {
  public readonly profile = createFixtureAdvancedBrainProfile({
    providerId: "advanced-brain.fixture",
    modelId: "advanced-brain-fixture-v1",
  });
  public executeCalls = 0;
  public cancelCalls = 0;

  public constructor(
    private readonly behavior: "answer" | "invalid_schema" | "timeout" = "answer",
    profileOverrides: Partial<ReturnType<typeof createFixtureAdvancedBrainProfile>> = {},
  ) {
    this.profile = {
      ...this.profile,
      ...profileOverrides,
    };
  }

  public async prepare(
    request: AdvancedBrainRequest,
  ): Promise<AdvancedBrainPreparedRequest> {
    return new FixtureAdvancedReasoningProvider({ now: fixedNow }).prepare(
      request,
    );
  }

  public async execute(
    preparedRequest: AdvancedBrainPreparedRequest,
    options?: { signal?: AbortSignal },
  ): Promise<AdvancedBrainProviderResult> {
    this.executeCalls += 1;
    if (this.behavior === "invalid_schema") {
      return {
        providerId: this.profile.providerId,
        privatePath: "C:\\secret",
      } as unknown as AdvancedBrainProviderResult;
    }
    if (this.behavior === "timeout") {
      return new Promise((resolve) => {
        options?.signal?.addEventListener(
          "abort",
          () =>
            resolve({
              schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
              providerId: this.profile.providerId,
              modelId: this.profile.modelId,
              requestId: preparedRequest.request.requestId,
              resultClass: "failed",
              reasonCode: "PROVIDER_CANCELLED",
              executionSemantics: "not_executed",
              directActionAttempted: false,
              rawProviderResponsePersisted: false,
              credentialExposed: false,
              localPathExposed: false,
              networkRequestIssued: false,
              completedAt: fixedNow().toISOString(),
            }),
          { once: true },
        );
      });
    }
    return new FixtureAdvancedReasoningProvider({ now: fixedNow }).execute(
      preparedRequest,
    );
  }

  public async cancel(_requestId: string, _reason?: string): Promise<void> {
    this.cancelCalls += 1;
  }
}

function requestFixture(
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

function fixedNow(): Date {
  return new Date("2026-08-25T00:00:00.000Z");
}
