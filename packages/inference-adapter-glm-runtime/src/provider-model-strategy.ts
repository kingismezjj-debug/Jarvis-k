import {
  getGlmProviderModelOriginProfile,
  type GlmProviderModelCandidateId,
  type GlmProviderOriginProfileId
} from "./model-origin-strategy";
import {
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID
} from "./provider";

export type GlmProviderModelStrategyCandidateRole =
  | "current_baseline_deprioritized"
  | "next_low_latency_health_candidate"
  | "secondary_low_latency_health_candidate"
  | "deferred_quality_candidate";

export type GlmProviderModelStrategyRecommendation =
  | "do_not_rerun_glm_4_7_standard_health"
  | "do_not_proceed_to_heavy_planner_acceptance"
  | "keep_standard_paas_v4_origin_fixed"
  | "keep_one_request_no_retry_boundary"
  | "keep_json_object_health_probe"
  | "preserve_qwen_rules_fallback"
  | "require_new_exact_scope_approval_for_any_real_probe"
  | "prefer_low_latency_flash_candidate_if_glm_continues"
  | "defer_glm_5_quality_candidates";

export interface GlmProviderModelRuntimeEvidence {
  readonly codingOriginHeavyPlannerTimedOut: boolean;
  readonly standardGlm47HealthReachedProvider: boolean;
  readonly standardGlm47HealthEmptyLengthFinish: boolean;
  readonly standardGlm47Compact128TimedOut: boolean;
}

export interface GlmProviderModelCandidateStrategy {
  readonly modelId: GlmProviderModelCandidateId;
  readonly profileId: "standard_paas_v4";
  readonly role: GlmProviderModelStrategyCandidateRole;
  readonly realRuntimeApproved: false;
  readonly runtimeDefaultEnabled: false;
  readonly heavyPlannerAcceptanceApproved: false;
  readonly exactApprovalRequired: true;
  readonly reasonCodes: readonly string[];
}

export interface GlmProviderModelStrategy {
  readonly status: "fixture_only";
  readonly networkAccessed: false;
  readonly credentialAccessed: false;
  readonly realApiCalled: false;
  readonly rawResponsePersisted: false;
  readonly rawContentPersisted: false;
  readonly providerId: typeof GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID;
  readonly fixedOriginProfileId: "standard_paas_v4";
  readonly avoidedOriginProfileIds: readonly GlmProviderOriginProfileId[];
  readonly currentModelId: typeof GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID;
  readonly evidence: GlmProviderModelRuntimeEvidence;
  readonly candidates: readonly GlmProviderModelCandidateStrategy[];
  readonly selectedNextCandidateModelId: GlmProviderModelCandidateId;
  readonly recommendations: readonly GlmProviderModelStrategyRecommendation[];
  readonly reasonCodes: readonly string[];
}

export function analyzeGlmProviderModelStrategy(input: {
  readonly evidence: GlmProviderModelRuntimeEvidence;
}): GlmProviderModelStrategy {
  const standardProfile = getGlmProviderModelOriginProfile("standard_paas_v4");
  const selectedNextCandidateModelId = selectNextCandidate(input.evidence);

  return {
    status: "fixture_only",
    networkAccessed: false,
    credentialAccessed: false,
    realApiCalled: false,
    rawResponsePersisted: false,
    rawContentPersisted: false,
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    fixedOriginProfileId: "standard_paas_v4",
    avoidedOriginProfileIds: ["coding_paas_v4"],
    currentModelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    evidence: input.evidence,
    candidates: standardProfile.candidateModelIds.map((modelId) =>
      candidateStrategyFor(modelId, selectedNextCandidateModelId)
    ),
    selectedNextCandidateModelId,
    recommendations: recommendationsFor(input.evidence),
    reasonCodes: reasonCodesFor(input.evidence, selectedNextCandidateModelId)
  };
}

function selectNextCandidate(
  evidence: GlmProviderModelRuntimeEvidence
): GlmProviderModelCandidateId {
  if (
    evidence.standardGlm47HealthReachedProvider &&
    evidence.standardGlm47HealthEmptyLengthFinish &&
    evidence.standardGlm47Compact128TimedOut
  ) {
    return "glm-4.7-flash";
  }
  return GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID;
}

function candidateStrategyFor(
  modelId: GlmProviderModelCandidateId,
  selectedNextCandidateModelId: GlmProviderModelCandidateId
): GlmProviderModelCandidateStrategy {
  return {
    modelId,
    profileId: "standard_paas_v4",
    role: candidateRoleFor(modelId, selectedNextCandidateModelId),
    realRuntimeApproved: false,
    runtimeDefaultEnabled: false,
    heavyPlannerAcceptanceApproved: false,
    exactApprovalRequired: true,
    reasonCodes: candidateReasonCodesFor(modelId, selectedNextCandidateModelId)
  };
}

function candidateRoleFor(
  modelId: GlmProviderModelCandidateId,
  selectedNextCandidateModelId: GlmProviderModelCandidateId
): GlmProviderModelStrategyCandidateRole {
  if (modelId === GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID) {
    return "current_baseline_deprioritized";
  }
  if (modelId === selectedNextCandidateModelId) {
    return "next_low_latency_health_candidate";
  }
  if (modelId === "glm-4.7-flashx") {
    return "secondary_low_latency_health_candidate";
  }
  return "deferred_quality_candidate";
}

function candidateReasonCodesFor(
  modelId: GlmProviderModelCandidateId,
  selectedNextCandidateModelId: GlmProviderModelCandidateId
): string[] {
  if (modelId === GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID) {
    return [
      "GLM_PROVIDER_MODEL_CURRENT_BASELINE_DEPRIORITIZED",
      "GLM_PROVIDER_MODEL_GLM_4_7_EMPTY_LENGTH_FINISH",
      "GLM_PROVIDER_MODEL_GLM_4_7_COMPACT_128_TIMEOUT"
    ];
  }
  if (modelId === selectedNextCandidateModelId) {
    return [
      "GLM_PROVIDER_MODEL_LOW_LATENCY_CANDIDATE",
      "GLM_PROVIDER_MODEL_NEXT_HEALTH_PROBE_CANDIDATE",
      "GLM_PROVIDER_MODEL_EXACT_APPROVAL_REQUIRED"
    ];
  }
  if (modelId === "glm-4.7-flashx") {
    return [
      "GLM_PROVIDER_MODEL_SECONDARY_LOW_LATENCY_CANDIDATE",
      "GLM_PROVIDER_MODEL_EXACT_APPROVAL_REQUIRED"
    ];
  }
  return [
    "GLM_PROVIDER_MODEL_QUALITY_CANDIDATE_DEFERRED",
    "GLM_PROVIDER_MODEL_EXACT_APPROVAL_REQUIRED"
  ];
}

function recommendationsFor(
  evidence: GlmProviderModelRuntimeEvidence
): GlmProviderModelStrategyRecommendation[] {
  const recommendations: GlmProviderModelStrategyRecommendation[] = [
    "require_new_exact_scope_approval_for_any_real_probe",
    "keep_standard_paas_v4_origin_fixed",
    "keep_one_request_no_retry_boundary",
    "keep_json_object_health_probe",
    "preserve_qwen_rules_fallback",
    "do_not_proceed_to_heavy_planner_acceptance"
  ];
  if (
    evidence.standardGlm47HealthEmptyLengthFinish ||
    evidence.standardGlm47Compact128TimedOut
  ) {
    recommendations.push(
      "do_not_rerun_glm_4_7_standard_health",
      "prefer_low_latency_flash_candidate_if_glm_continues",
      "defer_glm_5_quality_candidates"
    );
  }
  return [...new Set(recommendations)];
}

function reasonCodesFor(
  evidence: GlmProviderModelRuntimeEvidence,
  selectedNextCandidateModelId: GlmProviderModelCandidateId
): string[] {
  const reasonCodes = [
    "GLM_PROVIDER_MODEL_STRATEGY_FIXTURE_ONLY",
    `GLM_PROVIDER_MODEL_SELECTED_${selectedNextCandidateModelId
      .toUpperCase()
      .replace(/[.-]/gu, "_")}`
  ];
  if (evidence.codingOriginHeavyPlannerTimedOut) {
    reasonCodes.push("GLM_PROVIDER_MODEL_CODING_ORIGIN_TIMEOUT_EVIDENCE");
  }
  if (evidence.standardGlm47HealthReachedProvider) {
    reasonCodes.push("GLM_PROVIDER_MODEL_STANDARD_ORIGIN_REACHED_PROVIDER");
  }
  if (evidence.standardGlm47HealthEmptyLengthFinish) {
    reasonCodes.push("GLM_PROVIDER_MODEL_GLM_4_7_EMPTY_LENGTH_FINISH");
  }
  if (evidence.standardGlm47Compact128TimedOut) {
    reasonCodes.push("GLM_PROVIDER_MODEL_GLM_4_7_COMPACT_128_TIMEOUT");
  }
  return reasonCodes;
}
