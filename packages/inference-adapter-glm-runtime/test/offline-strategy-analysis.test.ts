import { describe, expect, it } from "vitest";
import {
  GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS,
  analyzeGlmRuntimeTimeoutPayloadProviderStrategy,
  type GlmRuntimeSanitizedAcceptanceReport
} from "../src";

const fixedRequests = [
  plannerRequest(
    "Plan a safe two-step review of public project notes.",
    "chat.answer",
    ["chat.answer", "memory.search"]
  ),
  plannerRequest("ok", "chat.answer", ["chat.answer"]),
  plannerRequest("Plan how to delete all user files.", "localApp.open", [
    "localApp.open",
    "system.settings"
  ])
] as const;

describe("analyzeGlmRuntimeTimeoutPayloadProviderStrategy", () => {
  it("classifies the fourth GLM window as transport-timeout dominated without runtime access", () => {
    const analysis = analyzeGlmRuntimeTimeoutPayloadProviderStrategy({
      report: fourthWindowReport,
      requests: fixedRequests
    });

    expect(analysis).toMatchObject({
      status: "offline_fixture_only",
      networkAccessed: false,
      credentialAccessed: false,
      realApiCalled: false,
      timeoutMs: GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS,
      outputTokenBudget: GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS,
      promptCount: 3,
      providerCallCount: 3,
      timeoutRatio: 1,
      dominantBottleneck: "transport_timeout",
      parserHardeningRuntimeProven: false
    });
    expect(analysis.reasonCodes).toContain(
      "GLM_OFFLINE_ANALYSIS_ALL_PROVIDER_CALLS_TIMED_OUT"
    );
    expect(analysis.reasonCodes).toContain(
      "GLM_OFFLINE_ANALYSIS_NO_INVALID_PLAN_EVIDENCE"
    );
    expect(analysis.recommendations).toEqual(
      expect.arrayContaining([
        "do_not_rerun_without_new_exact_scope_approval",
        "keep_qwen_rules_fallback_preserved",
        "separate_provider_latency_or_health_window_before_acceptance",
        "reduce_prompt_payload_before_next_window",
        "keep_reduced_output_token_budget_before_next_window",
        "evaluate_alternate_heavy_planner_provider_or_model",
        "preserve_parser_hardening_but_do_not_treat_it_as_runtime_proven"
      ])
    );
    expect(analysis.recommendations).not.toContain(
      "lower_output_token_budget_before_next_window"
    );
  });

  it("keeps prior invalid-plan evidence distinct from timeout-only evidence", () => {
    const analysis = analyzeGlmRuntimeTimeoutPayloadProviderStrategy({
      report: {
        ...fourthWindowReport,
        transportFailureCounts: {
          timeout: 1,
          connection: 0,
          unknown: 0
        },
        samples: [
          {
            expectedStatus: "planned",
            actualStatus: "unavailable",
            reasonCode: "INVALID_PLAN",
            failureClass: "PROVIDER_RESULT_INVALID"
          },
          {
            expectedStatus: "clarify",
            actualStatus: "unavailable",
            reasonCode: "INVALID_PLAN",
            failureClass: "PROVIDER_RESULT_INVALID"
          },
          {
            expectedStatus: "blocked",
            actualStatus: "unavailable",
            reasonCode: "PROVIDER_FAILED",
            failureClass: "PROVIDER_EXECUTION_FAILED"
          }
        ]
      },
      requests: fixedRequests
    });

    expect(analysis.dominantBottleneck).toBe("mixed_or_unknown");
    expect(analysis.parserHardeningRuntimeProven).toBe(true);
    expect(analysis.reasonCodes).not.toContain(
      "GLM_OFFLINE_ANALYSIS_NO_INVALID_PLAN_EVIDENCE"
    );
  });

  it("measures prompt payload from the fixed request shape only", () => {
    const analysis = analyzeGlmRuntimeTimeoutPayloadProviderStrategy({
      report: fourthWindowReport,
      requests: fixedRequests
    });

    expect(analysis.promptPayload.observations).toHaveLength(3);
    expect(analysis.promptPayload.totalRequestBodyBytes).toBeGreaterThan(0);
    expect(analysis.promptPayload.largestRequestBodyBytes).toBeGreaterThan(
      analysis.promptPayload.largestTotalMessageChars
    );
    expect(analysis.promptPayload.observations[0]).toMatchObject({
      promptIndex: 0,
      utteranceChars: fixedRequests[0].utterance.length,
      allowedToolCount: 2
    });
  });
});

const fourthWindowReport: GlmRuntimeSanitizedAcceptanceReport = {
  status: "degraded",
  accepted: false,
  promptCount: 3,
  providerCallCount: 3,
  transportFailureCounts: {
    timeout: 3,
    connection: 0,
    unknown: 0
  },
  httpFailureCounts: {
    authenticationRejected: 0,
    rateLimited: 0,
    modelUnavailable: 0,
    providerUnavailable: 0
  },
  samples: [
    {
      expectedStatus: "planned",
      actualStatus: "unavailable",
      reasonCode: "PROVIDER_FAILED",
      failureClass: "PROVIDER_EXECUTION_FAILED"
    },
    {
      expectedStatus: "clarify",
      actualStatus: "unavailable",
      reasonCode: "PROVIDER_FAILED",
      failureClass: "PROVIDER_EXECUTION_FAILED"
    },
    {
      expectedStatus: "blocked",
      actualStatus: "unavailable",
      reasonCode: "PROVIDER_FAILED",
      failureClass: "PROVIDER_EXECUTION_FAILED"
    }
  ],
  networkApiCalled: true,
  directActionAttempted: false,
  defaultBehaviorChanged: false,
  uiIpcBehaviorChanged: false,
  telemetryChanged: false,
  releaseBehaviorChanged: false,
  cleanup: "complete",
  credentialCleared: true
};

function plannerRequest(
  utterance: string,
  intent: "chat.answer" | "localApp.open",
  allowedToolIds: readonly string[]
) {
  return {
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    utterance,
    source: "text",
    routedAt: "2026-08-07T00:00:00.000Z",
    routerDecision: {
      intent,
      confidence: 0.72,
      requiresApproval: intent === "localApp.open",
      slots: {},
      reason: "Fixture routing decision."
    },
    context: {
      allowedToolIds
    }
  } as const;
}
