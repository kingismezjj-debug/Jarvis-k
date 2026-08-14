import { describe, expect, it } from "vitest";
import {
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  analyzeGlmProviderHealthPromptOutputBoundStrategy
} from "../src";

describe("GLM health prompt/output-bound strategy", () => {
  it("selects a compact 128-token JSON profile for length-finished empty content", () => {
    const strategy = analyzeGlmProviderHealthPromptOutputBoundStrategy({
      observedShape: {
        finishReasonShape: "length",
        contentShape: "empty_string",
        contentLengthBucket: "zero",
        healthSignalShape: "missing_health_signal"
      }
    });

    expect(strategy).toMatchObject({
      status: "fixture_only",
      networkAccessed: false,
      credentialAccessed: false,
      realApiCalled: false,
      rawResponsePersisted: false,
      rawContentPersisted: false,
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      modelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
      selectedNextProfileId: "compact_json_object_128"
    });
    expect(strategy.recommendations).toEqual(
      expect.arrayContaining([
        "do_not_rerun_without_new_exact_scope_approval",
        "increase_health_output_budget_before_next_window",
        "reduce_prompt_payload_before_next_window",
        "make_json_instruction_more_explicit_before_next_window",
        "keep_fail_closed_for_empty_content_length_finish",
        "do_not_proceed_to_heavy_planner_acceptance"
      ])
    );
    expect(strategy.reasonCodes).toEqual(
      expect.arrayContaining([
        "GLM_HEALTH_PROMPT_OUTPUT_OBSERVED_LENGTH_FINISH",
        "GLM_HEALTH_PROMPT_OUTPUT_OBSERVED_EMPTY_CONTENT",
        "GLM_HEALTH_PROMPT_OUTPUT_OBSERVED_MISSING_SIGNAL"
      ])
    );
  });

  it("keeps fixed provider/model and compares bounded local candidate profiles", () => {
    const strategy = analyzeGlmProviderHealthPromptOutputBoundStrategy({
      observedShape: {
        finishReasonShape: "length",
        contentShape: "empty_string",
        contentLengthBucket: "zero",
        healthSignalShape: "missing_health_signal"
      }
    });

    expect(strategy.candidateProfiles.map((profile) => profile.profileId)).toEqual(
      [
        "current_json_object_64",
        "compact_json_object_128",
        "explicit_json_only_256"
      ]
    );
    expect(
      strategy.candidateProfiles.map((profile) => profile.maxOutputTokens)
    ).toEqual([64, 128, 256]);
    expect(
      strategy.candidateProfiles.every(
        (profile) => profile.responseFormat === "json_object"
      )
    ).toBe(true);
    expect(
      strategy.candidateProfiles
        .filter((profile) => profile.profileId !== "current_json_object_64")
        .every(
          (profile) =>
            profile.promptPayloadReducedFromCurrent &&
            profile.outputBudgetIncreasedFromCurrent
        )
    ).toBe(true);
  });

  it("does not persist raw prompts, credentials, or provider content in results", () => {
    const strategy = analyzeGlmProviderHealthPromptOutputBoundStrategy({
      observedShape: {
        finishReasonShape: "length",
        contentShape: "empty_string",
        contentLengthBucket: "zero",
        healthSignalShape: "missing_health_signal"
      }
    });
    const serialized = JSON.stringify(strategy);

    expect(serialized).not.toContain("fixture-only-key");
    expect(serialized).not.toContain("Return exactly");
    expect(serialized).not.toContain("Output only JSON");
    expect(serialized).not.toContain("health\"");
    expect(serialized).not.toContain("api_key");
  });
});
