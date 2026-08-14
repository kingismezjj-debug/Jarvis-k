import type { BrainPlannerRequest } from "@jarvis-k/contracts";
import {
  GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS,
  GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS,
  createGlmRuntimeChatCompletionRequest
} from "./provider";

export type GlmRuntimeOfflineBottleneck =
  | "transport_timeout"
  | "provider_http"
  | "provider_result_validation"
  | "mixed_or_unknown";

export type GlmRuntimeOfflineRecommendation =
  | "do_not_rerun_without_new_exact_scope_approval"
  | "keep_qwen_rules_fallback_preserved"
  | "reduce_prompt_payload_before_next_window"
  | "lower_output_token_budget_before_next_window"
  | "keep_reduced_output_token_budget_before_next_window"
  | "separate_provider_latency_or_health_window_before_acceptance"
  | "evaluate_alternate_heavy_planner_provider_or_model"
  | "preserve_parser_hardening_but_do_not_treat_it_as_runtime_proven";

export interface GlmRuntimeSanitizedAcceptanceSample {
  readonly expectedStatus: string;
  readonly actualStatus: string;
  readonly reasonCode?: string;
  readonly failureClass?: string;
}

export interface GlmRuntimeSanitizedAcceptanceReport {
  readonly status: "passed" | "blocked" | "degraded";
  readonly accepted: boolean;
  readonly promptCount: number;
  readonly providerCallCount: number;
  readonly transportFailureCounts: {
    readonly timeout: number;
    readonly connection: number;
    readonly unknown: number;
  };
  readonly httpFailureCounts: {
    readonly authenticationRejected: number;
    readonly rateLimited: number;
    readonly modelUnavailable: number;
    readonly providerUnavailable: number;
  };
  readonly samples: readonly GlmRuntimeSanitizedAcceptanceSample[];
  readonly networkApiCalled: boolean;
  readonly directActionAttempted: boolean;
  readonly defaultBehaviorChanged: boolean;
  readonly uiIpcBehaviorChanged: boolean;
  readonly telemetryChanged: boolean;
  readonly releaseBehaviorChanged: boolean;
  readonly cleanup: "not_needed" | "in_progress" | "complete" | "failed";
  readonly credentialCleared: boolean;
}

export interface GlmRuntimePromptPayloadObservation {
  readonly promptIndex: number;
  readonly utteranceChars: number;
  readonly systemChars: number;
  readonly userChars: number;
  readonly totalMessageChars: number;
  readonly requestBodyBytes: number;
  readonly allowedToolCount: number;
}

export interface GlmRuntimeOfflineStrategyAnalysis {
  readonly status: "offline_fixture_only";
  readonly networkAccessed: false;
  readonly credentialAccessed: false;
  readonly realApiCalled: false;
  readonly timeoutMs: typeof GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS;
  readonly outputTokenBudget: typeof GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS;
  readonly promptCount: number;
  readonly providerCallCount: number;
  readonly timeoutRatio: number;
  readonly dominantBottleneck: GlmRuntimeOfflineBottleneck;
  readonly parserHardeningRuntimeProven: boolean;
  readonly promptPayload: {
    readonly totalRequestBodyBytes: number;
    readonly largestRequestBodyBytes: number;
    readonly largestTotalMessageChars: number;
    readonly observations: readonly GlmRuntimePromptPayloadObservation[];
  };
  readonly recommendations: readonly GlmRuntimeOfflineRecommendation[];
  readonly reasonCodes: readonly string[];
}

export function analyzeGlmRuntimeTimeoutPayloadProviderStrategy(input: {
  readonly report: GlmRuntimeSanitizedAcceptanceReport;
  readonly requests: readonly BrainPlannerRequest[];
}): GlmRuntimeOfflineStrategyAnalysis {
  const observations = input.requests.map((request, index) =>
    observePromptPayload(request, index)
  );
  const timeoutCount = input.report.transportFailureCounts.timeout;
  const httpFailureCount =
    input.report.httpFailureCounts.authenticationRejected +
    input.report.httpFailureCounts.rateLimited +
    input.report.httpFailureCounts.modelUnavailable +
    input.report.httpFailureCounts.providerUnavailable;
  const invalidResultCount = input.report.samples.filter(
    (sample) =>
      sample.reasonCode === "INVALID_PLAN" ||
      sample.failureClass === "PROVIDER_RESULT_INVALID"
  ).length;
  const timeoutRatio =
    input.report.providerCallCount === 0
      ? 0
      : timeoutCount / input.report.providerCallCount;
  const dominantBottleneck = classifyOfflineBottleneck({
    timeoutCount,
    providerCallCount: input.report.providerCallCount,
    httpFailureCount,
    invalidResultCount
  });
  const largestRequestBodyBytes = maxNumber(
    observations.map((observation) => observation.requestBodyBytes)
  );
  const recommendations = recommendationsFor({
    dominantBottleneck,
    largestRequestBodyBytes,
    outputTokenBudget: GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS,
    accepted: input.report.accepted
  });

  return {
    status: "offline_fixture_only",
    networkAccessed: false,
    credentialAccessed: false,
    realApiCalled: false,
    timeoutMs: GLM_RUNTIME_HEAVY_PLANNER_TIMEOUT_MS,
    outputTokenBudget: GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS,
    promptCount: input.report.promptCount,
    providerCallCount: input.report.providerCallCount,
    timeoutRatio,
    dominantBottleneck,
    parserHardeningRuntimeProven:
      input.report.networkApiCalled &&
      input.report.samples.some(
        (sample) =>
          sample.actualStatus === "planned" ||
          sample.actualStatus === "clarify" ||
          sample.actualStatus === "blocked" ||
          sample.reasonCode === "INVALID_PLAN"
      ),
    promptPayload: {
      totalRequestBodyBytes: observations.reduce(
        (total, observation) => total + observation.requestBodyBytes,
        0
      ),
      largestRequestBodyBytes,
      largestTotalMessageChars: maxNumber(
        observations.map((observation) => observation.totalMessageChars)
      ),
      observations
    },
    recommendations,
    reasonCodes: reasonCodesFor({
      dominantBottleneck,
      timeoutRatio,
      invalidResultCount,
      accepted: input.report.accepted
    })
  };
}

function observePromptPayload(
  request: BrainPlannerRequest,
  index: number
): GlmRuntimePromptPayloadObservation {
  const chatRequest = createGlmRuntimeChatCompletionRequest(request);
  const [systemMessage, userMessage] = chatRequest.messages;
  return {
    promptIndex: index,
    utteranceChars: request.utterance.length,
    systemChars: systemMessage.content.length,
    userChars: userMessage.content.length,
    totalMessageChars:
      systemMessage.content.length + userMessage.content.length,
    requestBodyBytes: Buffer.byteLength(JSON.stringify(chatRequest), "utf8"),
    allowedToolCount: request.context?.allowedToolIds?.length ?? 0
  };
}

function classifyOfflineBottleneck(input: {
  readonly timeoutCount: number;
  readonly providerCallCount: number;
  readonly httpFailureCount: number;
  readonly invalidResultCount: number;
}): GlmRuntimeOfflineBottleneck {
  if (
    input.providerCallCount > 0 &&
    input.timeoutCount === input.providerCallCount
  ) {
    return "transport_timeout";
  }
  if (input.httpFailureCount > 0 && input.invalidResultCount === 0) {
    return "provider_http";
  }
  if (input.invalidResultCount > 0 && input.timeoutCount === 0) {
    return "provider_result_validation";
  }
  return "mixed_or_unknown";
}

function recommendationsFor(input: {
  readonly dominantBottleneck: GlmRuntimeOfflineBottleneck;
  readonly largestRequestBodyBytes: number;
  readonly outputTokenBudget: number;
  readonly accepted: boolean;
}): GlmRuntimeOfflineRecommendation[] {
  const recommendations: GlmRuntimeOfflineRecommendation[] = [
    "do_not_rerun_without_new_exact_scope_approval",
    "keep_qwen_rules_fallback_preserved"
  ];
  if (input.dominantBottleneck === "transport_timeout") {
    recommendations.push(
      "separate_provider_latency_or_health_window_before_acceptance",
      "evaluate_alternate_heavy_planner_provider_or_model",
      "preserve_parser_hardening_but_do_not_treat_it_as_runtime_proven"
    );
  }
  if (
    input.largestRequestBodyBytes > 1_500 ||
    input.dominantBottleneck === "transport_timeout"
  ) {
    recommendations.push("reduce_prompt_payload_before_next_window");
  }
  if (
    input.outputTokenBudget >= 1024 &&
    input.dominantBottleneck === "transport_timeout"
  ) {
    recommendations.push("lower_output_token_budget_before_next_window");
  }
  if (
    input.outputTokenBudget <= 512 &&
    input.dominantBottleneck === "transport_timeout"
  ) {
    recommendations.push(
      "keep_reduced_output_token_budget_before_next_window"
    );
  }
  if (!input.accepted && input.dominantBottleneck === "mixed_or_unknown") {
    recommendations.push("evaluate_alternate_heavy_planner_provider_or_model");
  }
  return [...new Set(recommendations)];
}

function reasonCodesFor(input: {
  readonly dominantBottleneck: GlmRuntimeOfflineBottleneck;
  readonly timeoutRatio: number;
  readonly invalidResultCount: number;
  readonly accepted: boolean;
}): string[] {
  const reasonCodes = [
    "GLM_OFFLINE_ANALYSIS_FIXTURE_ONLY",
    input.accepted
      ? "GLM_OFFLINE_ANALYSIS_LAST_WINDOW_ACCEPTED"
      : "GLM_OFFLINE_ANALYSIS_LAST_WINDOW_NOT_ACCEPTED"
  ];
  if (input.dominantBottleneck === "transport_timeout") {
    reasonCodes.push("GLM_OFFLINE_ANALYSIS_TIMEOUT_DOMINANT");
  }
  if (input.timeoutRatio === 1) {
    reasonCodes.push("GLM_OFFLINE_ANALYSIS_ALL_PROVIDER_CALLS_TIMED_OUT");
  }
  if (input.invalidResultCount === 0) {
    reasonCodes.push("GLM_OFFLINE_ANALYSIS_NO_INVALID_PLAN_EVIDENCE");
  }
  return reasonCodes;
}

function maxNumber(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}
