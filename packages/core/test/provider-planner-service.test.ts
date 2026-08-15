import { describe, expect, it } from "vitest";
import type {
  BrainPlannerRequest,
  BrainPlannerResult,
  BrainRouterSelectionReport,
} from "@jarvis-k/contracts";
import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import { ProviderPlannerService } from "../src/planner/provider-planner-service";

const routerSelection: BrainRouterSelectionReport = {
  selectedProviderId: "intent-router.deterministic.rules",
  fallbackProviderId: "brain.rules",
  status: "fallback",
  reasonCode: "CONFIDENCE_LOW",
  failureClass: "CONFIDENCE_LOW",
  confidenceBand: "low",
  usedRulesFallback: true,
  directActionAttempted: false,
};

const routing = {
  decision: {
    intent: "chat.answer",
    confidence: 0.4,
    requiresApproval: false,
    slots: {},
    reason: "Low confidence route escalated to planner.",
  },
  selection: routerSelection,
} as const;

class FakeHeavyPlannerProvider implements HeavyPlannerProvider {
  public calls = 0;
  public lastRequest: BrainPlannerRequest | undefined;

  public constructor(
    private readonly result:
      | BrainPlannerResult
      | Record<string, unknown>
      | Error,
  ) {}

  public async plan(request: BrainPlannerRequest): Promise<BrainPlannerResult> {
    this.calls += 1;
    this.lastRequest = request;
    if (this.result instanceof Error) {
      throw this.result;
    }
    return this.result as BrainPlannerResult;
  }
}

function createService(provider: HeavyPlannerProvider | undefined) {
  return new ProviderPlannerService({
    provider,
    now: () => new Date("2026-08-14T00:00:00.000Z"),
    allowedToolIds: ["chat.answer", "filesystem.search", "memory.status"],
    rulesFallbackProviderId: "brain.rules",
  });
}

function plannedResult(
  overrides: Partial<BrainPlannerResult> = {},
): BrainPlannerResult {
  return {
    providerId: "heavy-planner.fixture",
    status: "planned",
    reasonCode: "COMPLEX_REQUEST",
    failureClass: "none",
    plan: {
      summary: "Plan a safe read-only workflow.",
      risk: "medium",
      requiresConfirmation: true,
      directActionAttempted: false,
      steps: [
        {
          id: "memory-review",
          toolId: "memory.status",
          title: "Review memory status",
          args: {},
          risk: "medium",
          requiresConfirmation: true,
          directActionAttempted: false,
        },
      ],
    },
    directActionAttempted: false,
    plannedAt: "2026-08-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("ProviderPlannerService", () => {
  it("falls back safely when no provider is configured", async () => {
    const service = createService(undefined);

    const outcome = await service.plan({
      providerId: "heavy-planner.fixture",
      source: "text",
      text: "Plan a research workflow",
      routing,
      conversationId: undefined,
    });

    expect(outcome.result).toBeUndefined();
    expect(outcome.selection).toEqual({
      providerId: "heavy-planner.fixture",
      fallbackProviderId: "brain.rules",
      status: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      failureClass: "PROVIDER_UNAVAILABLE",
      usedPlanner: false,
      usedRulesFallback: true,
      directActionAttempted: false,
    });
  });

  it("passes a bounded planner request to the provider", async () => {
    const provider = new FakeHeavyPlannerProvider(plannedResult());
    const service = createService(provider);

    const outcome = await service.plan({
      providerId: "heavy-planner.fixture",
      source: "voice",
      text: "Plan a research workflow",
      routing,
      conversationId: "conversation-1",
    });

    expect(provider.calls).toBe(1);
    expect(provider.lastRequest).toMatchObject({
      providerId: "heavy-planner.fixture",
      utterance: "Plan a research workflow",
      source: "voice",
      routedAt: "2026-08-14T00:00:00.000Z",
      routerDecision: routing.decision,
      routerSelection: routing.selection,
      context: {
        activeConversationId: "conversation-1",
        allowedToolIds: ["chat.answer", "filesystem.search", "memory.status"],
      },
    });
    expect(outcome.selection).toMatchObject({
      status: "planned",
      reasonCode: "COMPLEX_REQUEST",
      failureClass: "none",
      usedPlanner: true,
      usedRulesFallback: false,
      directActionAttempted: false,
    });
  });

  it("rejects invalid provider results without leaking provider exception details", async () => {
    const provider = new FakeHeavyPlannerProvider({
      providerId: "heavy-planner.fixture",
      status: "planned",
      plannedAt: "not-a-date",
      privatePath: "C:\\secret",
    });
    const service = createService(provider);

    const outcome = await service.plan({
      providerId: "heavy-planner.fixture",
      source: "text",
      text: "Plan a research workflow",
      routing,
      conversationId: undefined,
    });

    expect(outcome.result).toBeUndefined();
    expect(outcome.selection).toMatchObject({
      status: "fallback",
      reasonCode: "INVALID_PLAN",
      failureClass: "PROVIDER_RESULT_INVALID",
      usedPlanner: false,
      usedRulesFallback: true,
    });
    expect(JSON.stringify(outcome.selection)).not.toMatch(/(?:C:\\|secret)/u);
  });

  it("rejects mismatched provider ids", async () => {
    const provider = new FakeHeavyPlannerProvider(
      plannedResult({
        providerId: "other-provider",
      }),
    );
    const service = createService(provider);

    const outcome = await service.plan({
      providerId: "heavy-planner.fixture",
      source: "text",
      text: "Plan a research workflow",
      routing,
      conversationId: undefined,
    });

    expect(outcome.selection).toMatchObject({
      status: "fallback",
      reasonCode: "INVALID_PLAN",
      failureClass: "PROVIDER_RESULT_INVALID",
      usedPlanner: false,
      usedRulesFallback: true,
    });
  });

  it("normalizes clarify and blocked provider outcomes without execution", async () => {
    const clarifyProvider = new FakeHeavyPlannerProvider(
      plannedResult({
        status: "clarify",
        reasonCode: "CLARIFY_REQUIRED",
        failureClass: "CLARIFY_REQUIRED",
        plan: undefined,
        clarifyQuestion: "Which project should Jarvis-K inspect?",
      }),
    );
    const blockedProvider = new FakeHeavyPlannerProvider(
      plannedResult({
        status: "blocked",
        reasonCode: "UNSAFE_PLAN",
        failureClass: "none",
        plan: undefined,
      }),
    );

    const clarify = await createService(clarifyProvider).plan({
      providerId: "heavy-planner.fixture",
      source: "text",
      text: "Plan it",
      routing,
      conversationId: undefined,
    });
    const blocked = await createService(blockedProvider).plan({
      providerId: "heavy-planner.fixture",
      source: "text",
      text: "Plan it",
      routing,
      conversationId: undefined,
    });

    expect(clarify.selection).toMatchObject({
      status: "clarify",
      reasonCode: "CLARIFY_REQUIRED",
      failureClass: "CLARIFY_REQUIRED",
      usedPlanner: true,
      directActionAttempted: false,
    });
    expect(blocked.selection).toMatchObject({
      status: "blocked",
      reasonCode: "UNSAFE_PLAN",
      failureClass: "UNSAFE_PLAN",
      usedPlanner: true,
      directActionAttempted: false,
    });
  });

  it("normalizes provider exceptions to safe fallback", async () => {
    const provider = new FakeHeavyPlannerProvider(
      new Error("Planner failed with C:\\secret"),
    );
    const service = createService(provider);

    const outcome = await service.plan({
      providerId: "heavy-planner.fixture",
      source: "text",
      text: "Plan a research workflow",
      routing,
      conversationId: undefined,
    });

    expect(outcome.result).toBeUndefined();
    expect(outcome.selection).toMatchObject({
      status: "fallback",
      reasonCode: "PROVIDER_FAILED",
      failureClass: "PROVIDER_EXECUTION_FAILED",
      usedPlanner: false,
      usedRulesFallback: true,
      directActionAttempted: false,
    });
    expect(JSON.stringify(outcome.selection)).not.toMatch(/(?:C:\\|secret)/u);
  });
});
