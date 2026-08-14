import {
  GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS,
  createGlmProviderHealthDiagnosticRequest
} from "./health-diagnostic";
import type { GlmProviderHealthResponseShapeClassification } from "./health-response-shape-strategy";
import {
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID
} from "./provider";

export type GlmProviderHealthPromptOutputProfileId =
  | "current_json_object_64"
  | "compact_json_object_128"
  | "explicit_json_only_256";

export type GlmProviderHealthPromptOutputStrategyRecommendation =
  | "do_not_rerun_without_new_exact_scope_approval"
  | "keep_standard_paas_v4_glm_4_7_fixed"
  | "keep_one_request_no_retry_boundary"
  | "increase_health_output_budget_before_next_window"
  | "reduce_prompt_payload_before_next_window"
  | "make_json_instruction_more_explicit_before_next_window"
  | "keep_fail_closed_for_empty_content_length_finish"
  | "prefer_shape_only_window_before_parser_acceptance"
  | "do_not_proceed_to_heavy_planner_acceptance";

export interface GlmProviderHealthPromptOutputCandidate {
  readonly profileId: GlmProviderHealthPromptOutputProfileId;
  readonly responseFormat: "json_object";
  readonly maxOutputTokens: 64 | 128 | 256;
  readonly systemChars: number;
  readonly userChars: number;
  readonly totalMessageChars: number;
  readonly requestBodyBytes: number;
  readonly promptPayloadReducedFromCurrent: boolean;
  readonly outputBudgetIncreasedFromCurrent: boolean;
  readonly expectedShapeGoal:
    | "baseline_reproduction"
    | "avoid_empty_length_finish"
    | "capture_valid_minimal_json";
}

interface GlmProviderHealthPromptOutputCandidateBody {
  readonly model: typeof GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID;
  readonly messages: readonly [
    {
      readonly role: "system";
      readonly content: string;
    },
    {
      readonly role: "user";
      readonly content: string;
    }
  ];
  readonly response_format: {
    readonly type: "json_object";
  };
  readonly stream: false;
  readonly temperature: 0;
  readonly max_tokens: 64 | 128 | 256;
}

export interface GlmProviderHealthPromptOutputBoundStrategy {
  readonly status: "fixture_only";
  readonly networkAccessed: false;
  readonly credentialAccessed: false;
  readonly realApiCalled: false;
  readonly rawResponsePersisted: false;
  readonly rawContentPersisted: false;
  readonly providerId: typeof GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID;
  readonly modelId: typeof GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID;
  readonly observedShape: {
    readonly finishReasonShape: GlmProviderHealthResponseShapeClassification["finishReasonShape"];
    readonly contentShape: GlmProviderHealthResponseShapeClassification["contentShape"];
    readonly contentLengthBucket: GlmProviderHealthResponseShapeClassification["contentLengthBucket"];
    readonly healthSignalShape: GlmProviderHealthResponseShapeClassification["healthSignalShape"];
  };
  readonly currentProfile: GlmProviderHealthPromptOutputCandidate;
  readonly candidateProfiles: readonly GlmProviderHealthPromptOutputCandidate[];
  readonly selectedNextProfileId: GlmProviderHealthPromptOutputProfileId;
  readonly recommendations: readonly GlmProviderHealthPromptOutputStrategyRecommendation[];
  readonly reasonCodes: readonly string[];
}

export function analyzeGlmProviderHealthPromptOutputBoundStrategy(input: {
  readonly observedShape: Pick<
    GlmProviderHealthResponseShapeClassification,
    | "finishReasonShape"
    | "contentShape"
    | "contentLengthBucket"
    | "healthSignalShape"
  >;
}): GlmProviderHealthPromptOutputBoundStrategy {
  const currentProfile = observeCandidate(
    "current_json_object_64",
    createCurrentHealthBody(),
    "baseline_reproduction"
  );
  const candidateProfiles = [
    currentProfile,
    observeCandidate(
      "compact_json_object_128",
      createCompactHealthBody(128),
      "avoid_empty_length_finish"
    ),
    observeCandidate(
      "explicit_json_only_256",
      createExplicitJsonOnlyHealthBody(256),
      "capture_valid_minimal_json"
    )
  ];
  const selectedNextProfileId = selectNextProfile(input.observedShape);

  return {
    status: "fixture_only",
    networkAccessed: false,
    credentialAccessed: false,
    realApiCalled: false,
    rawResponsePersisted: false,
    rawContentPersisted: false,
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    modelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    observedShape: input.observedShape,
    currentProfile,
    candidateProfiles,
    selectedNextProfileId,
    recommendations: recommendationsFor(input.observedShape),
    reasonCodes: reasonCodesFor(input.observedShape, selectedNextProfileId)
  };
}

function createCurrentHealthBody(): GlmProviderHealthPromptOutputCandidateBody {
  return createGlmProviderHealthDiagnosticRequest({
    apiKey: "fixture-only-key"
  }).body;
}

function createCompactHealthBody(
  maxOutputTokens: 128
): GlmProviderHealthPromptOutputCandidateBody {
  return {
    model: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    messages: [
      {
        role: "system",
        content: "Output only JSON: {\"status\":\"ok\"}."
      },
      {
        role: "user",
        content: "health"
      }
    ],
    response_format: {
      type: "json_object"
    },
    stream: false,
    temperature: 0,
    max_tokens: maxOutputTokens
  };
}

function createExplicitJsonOnlyHealthBody(
  maxOutputTokens: 256
): GlmProviderHealthPromptOutputCandidateBody {
  return {
    model: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    messages: [
      {
        role: "system",
        content:
          "Return exactly this JSON object and no other text: {\"status\":\"ok\"}"
      },
      {
        role: "user",
        content: JSON.stringify({
          diagnostic: "health"
        })
      }
    ],
    response_format: {
      type: "json_object"
    },
    stream: false,
    temperature: 0,
    max_tokens: maxOutputTokens
  };
}

function observeCandidate(
  profileId: GlmProviderHealthPromptOutputProfileId,
  body: GlmProviderHealthPromptOutputCandidateBody,
  expectedShapeGoal: GlmProviderHealthPromptOutputCandidate["expectedShapeGoal"]
): GlmProviderHealthPromptOutputCandidate {
  const [systemMessage, userMessage] = body.messages;
  const totalMessageChars =
    systemMessage.content.length + userMessage.content.length;
  return {
    profileId,
    responseFormat: body.response_format.type,
    maxOutputTokens: body.max_tokens,
    systemChars: systemMessage.content.length,
    userChars: userMessage.content.length,
    totalMessageChars,
    requestBodyBytes: Buffer.byteLength(JSON.stringify(body), "utf8"),
    promptPayloadReducedFromCurrent:
      profileId !== "current_json_object_64" &&
      totalMessageChars < currentTotalMessageChars(),
    outputBudgetIncreasedFromCurrent:
      body.max_tokens > GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS,
    expectedShapeGoal
  };
}

function selectNextProfile(
  shape: Pick<
    GlmProviderHealthResponseShapeClassification,
    "finishReasonShape" | "contentShape" | "healthSignalShape"
  >
): GlmProviderHealthPromptOutputProfileId {
  if (
    shape.finishReasonShape === "length" &&
    shape.contentShape === "empty_string"
  ) {
    return "compact_json_object_128";
  }
  if (shape.healthSignalShape === "missing_health_signal") {
    return "explicit_json_only_256";
  }
  return "current_json_object_64";
}

function recommendationsFor(
  shape: Pick<
    GlmProviderHealthResponseShapeClassification,
    "finishReasonShape" | "contentShape" | "healthSignalShape"
  >
): GlmProviderHealthPromptOutputStrategyRecommendation[] {
  const recommendations: GlmProviderHealthPromptOutputStrategyRecommendation[] =
    [
      "do_not_rerun_without_new_exact_scope_approval",
      "keep_standard_paas_v4_glm_4_7_fixed",
      "keep_one_request_no_retry_boundary",
      "prefer_shape_only_window_before_parser_acceptance",
      "do_not_proceed_to_heavy_planner_acceptance"
    ];
  if (
    shape.finishReasonShape === "length" &&
    shape.contentShape === "empty_string"
  ) {
    recommendations.push(
      "increase_health_output_budget_before_next_window",
      "reduce_prompt_payload_before_next_window",
      "make_json_instruction_more_explicit_before_next_window",
      "keep_fail_closed_for_empty_content_length_finish"
    );
  }
  if (shape.healthSignalShape === "missing_health_signal") {
    recommendations.push(
      "make_json_instruction_more_explicit_before_next_window"
    );
  }
  return [...new Set(recommendations)];
}

function reasonCodesFor(
  shape: Pick<
    GlmProviderHealthResponseShapeClassification,
    "finishReasonShape" | "contentShape" | "healthSignalShape"
  >,
  selectedNextProfileId: GlmProviderHealthPromptOutputProfileId
): string[] {
  const reasonCodes = [
    "GLM_HEALTH_PROMPT_OUTPUT_STRATEGY_FIXTURE_ONLY",
    `GLM_HEALTH_PROMPT_OUTPUT_SELECTED_${selectedNextProfileId.toUpperCase()}`
  ];
  if (shape.finishReasonShape === "length") {
    reasonCodes.push("GLM_HEALTH_PROMPT_OUTPUT_OBSERVED_LENGTH_FINISH");
  }
  if (shape.contentShape === "empty_string") {
    reasonCodes.push("GLM_HEALTH_PROMPT_OUTPUT_OBSERVED_EMPTY_CONTENT");
  }
  if (shape.healthSignalShape === "missing_health_signal") {
    reasonCodes.push("GLM_HEALTH_PROMPT_OUTPUT_OBSERVED_MISSING_SIGNAL");
  }
  return reasonCodes;
}

function currentTotalMessageChars(): number {
  const [systemMessage, userMessage] = createCurrentHealthBody().messages;
  return systemMessage.content.length + userMessage.content.length;
}
