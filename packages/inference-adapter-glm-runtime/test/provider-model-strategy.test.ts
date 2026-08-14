import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  analyzeGlmProviderModelStrategy
} from "../src";

describe("GLM provider/model fixture-only strategy", () => {
  it("selects a low-latency flash model after glm-4.7 empty-content and timeout evidence", () => {
    const strategy = analyzeGlmProviderModelStrategy({
      evidence: currentEvidence()
    });

    expect(strategy).toMatchObject({
      status: "fixture_only",
      networkAccessed: false,
      credentialAccessed: false,
      realApiCalled: false,
      rawResponsePersisted: false,
      rawContentPersisted: false,
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      fixedOriginProfileId: "standard_paas_v4",
      avoidedOriginProfileIds: ["coding_paas_v4"],
      currentModelId: "glm-4.7",
      selectedNextCandidateModelId: "glm-4.7-flash"
    });
    expect(strategy.recommendations).toEqual(
      expect.arrayContaining([
        "do_not_rerun_glm_4_7_standard_health",
        "prefer_low_latency_flash_candidate_if_glm_continues",
        "defer_glm_5_quality_candidates",
        "do_not_proceed_to_heavy_planner_acceptance",
        "require_new_exact_scope_approval_for_any_real_probe"
      ])
    );
  });

  it("keeps every candidate default-off and exact-approval gated", () => {
    const strategy = analyzeGlmProviderModelStrategy({
      evidence: currentEvidence()
    });

    expect(strategy.candidates.map((candidate) => candidate.modelId)).toEqual([
      "glm-4.7",
      "glm-4.7-flash",
      "glm-4.7-flashx",
      "glm-5-turbo",
      "glm-5.2"
    ]);
    expect(
      strategy.candidates.every(
        (candidate) =>
          candidate.profileId === "standard_paas_v4" &&
          candidate.realRuntimeApproved === false &&
          candidate.runtimeDefaultEnabled === false &&
          candidate.heavyPlannerAcceptanceApproved === false &&
          candidate.exactApprovalRequired === true
      )
    ).toBe(true);
  });

  it("deprioritizes glm-4.7 and defers quality models", () => {
    const strategy = analyzeGlmProviderModelStrategy({
      evidence: currentEvidence()
    });
    const roles = new Map(
      strategy.candidates.map((candidate) => [
        candidate.modelId,
        candidate.role
      ])
    );

    expect(roles.get("glm-4.7")).toBe("current_baseline_deprioritized");
    expect(roles.get("glm-4.7-flash")).toBe(
      "next_low_latency_health_candidate"
    );
    expect(roles.get("glm-4.7-flashx")).toBe(
      "secondary_low_latency_health_candidate"
    );
    expect(roles.get("glm-5-turbo")).toBe("deferred_quality_candidate");
    expect(roles.get("glm-5.2")).toBe("deferred_quality_candidate");
  });

  it("does not persist raw prompt, credential, response, or provider content", () => {
    const strategy = analyzeGlmProviderModelStrategy({
      evidence: currentEvidence()
    });
    const serialized = JSON.stringify(strategy);

    expect(serialized).not.toContain("api_key");
    expect(serialized).not.toContain("Bearer");
    expect(serialized).not.toContain("Output only JSON");
    expect(serialized).not.toContain("assistant content");
    expect(serialized).not.toContain('{"status":"ok"}');
  });

  it("keeps the strategy module fixture-only by source inspection", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "packages",
        "inference-adapter-glm-runtime",
        "src",
        "provider-model-strategy.ts"
      ),
      "utf8"
    );

    for (const forbidden of [
      "fetch(",
      "safeStorage",
      "SecureHeavyPlannerProviderStore",
      "CoreRuntime",
      "runGlmProviderHealthDiagnostic",
      "process.env",
      "BrowserWindow",
      "ipcMain",
      "ipcRenderer"
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});

function currentEvidence() {
  return {
    codingOriginHeavyPlannerTimedOut: true,
    standardGlm47HealthReachedProvider: true,
    standardGlm47HealthEmptyLengthFinish: true,
    standardGlm47Compact128TimedOut: true
  };
}
