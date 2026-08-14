import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_ORIGIN,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  GLM_STANDARD_PAAS_V4_ENDPOINT,
  GLM_STANDARD_PAAS_V4_ORIGIN,
  getGlmProviderModelOriginProfile,
  isGlmProviderModelCandidateId,
  listGlmProviderModelOriginProfiles
} from "../src";

describe("GLM provider/model/origin fixture-only strategy", () => {
  it("keeps the current coding origin as prior timeout evidence", () => {
    const profile = getGlmProviderModelOriginProfile("coding_paas_v4");

    expect(profile).toMatchObject({
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      profileId: "coding_paas_v4",
      status: "prior_timeout_evidence",
      origin: GLM_RUNTIME_HEAVY_PLANNER_ORIGIN,
      endpoint: GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
      defaultModelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
      candidateModelIds: [GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID],
      runtimeDefaultEnabled: false,
      networkAccessApproved: false,
      credentialAccessApproved: false,
      healthDiagnosticApproved: false,
      heavyPlannerAcceptanceApproved: false
    });
    expect(profile.endpoint).toBe(
      "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions"
    );
  });

  it("adds standard_paas_v4 as a default-off candidate origin", () => {
    const profile = getGlmProviderModelOriginProfile("standard_paas_v4");

    expect(profile).toMatchObject({
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      profileId: "standard_paas_v4",
      status: "candidate",
      origin: GLM_STANDARD_PAAS_V4_ORIGIN,
      endpoint: GLM_STANDARD_PAAS_V4_ENDPOINT,
      defaultModelId: "glm-4.7",
      runtimeDefaultEnabled: false,
      networkAccessApproved: false,
      credentialAccessApproved: false,
      healthDiagnosticApproved: false,
      heavyPlannerAcceptanceApproved: false
    });
    expect(profile.endpoint).toBe(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    );
    expect(profile.candidateModelIds).toEqual([
      "glm-4.7",
      "glm-4.7-flash",
      "glm-4.7-flashx",
      "glm-5-turbo",
      "glm-5.2"
    ]);
  });

  it("uses only fixed model candidates", () => {
    expect(isGlmProviderModelCandidateId("glm-4.7")).toBe(true);
    expect(isGlmProviderModelCandidateId("glm-4.7-flash")).toBe(true);
    expect(isGlmProviderModelCandidateId("glm-4.7-flashx")).toBe(true);
    expect(isGlmProviderModelCandidateId("glm-5-turbo")).toBe(true);
    expect(isGlmProviderModelCandidateId("glm-5.2")).toBe(true);
    expect(isGlmProviderModelCandidateId("user-supplied-model")).toBe(false);
    expect(isGlmProviderModelCandidateId("https://example.test/model")).toBe(
      false
    );
  });

  it("returns cloned metadata without enabling runtime behavior", () => {
    const first = listGlmProviderModelOriginProfiles();
    const second = listGlmProviderModelOriginProfiles();

    expect(first).toHaveLength(2);
    expect(first).not.toBe(second);
    expect(first[1]?.candidateModelIds).not.toBe(second[1]?.candidateModelIds);
    expect(
      first.every(
        (profile) =>
          profile.runtimeDefaultEnabled === false &&
          profile.networkAccessApproved === false &&
          profile.credentialAccessApproved === false &&
          profile.healthDiagnosticApproved === false &&
          profile.heavyPlannerAcceptanceApproved === false
      )
    ).toBe(true);
  });

  it("keeps the strategy module fixture-only by source inspection", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "packages",
        "inference-adapter-glm-runtime",
        "src",
        "model-origin-strategy.ts"
      ),
      "utf8"
    );

    for (const forbidden of [
      "fetch(",
      "safeStorage",
      "SecureHeavyPlannerProviderStore",
      "CoreRuntime",
      "runGlmProviderHealthDiagnostic",
      "GlmRuntimeHeavyPlannerProvider",
      "process.env",
      "BrowserWindow",
      "ipcMain",
      "ipcRenderer"
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
