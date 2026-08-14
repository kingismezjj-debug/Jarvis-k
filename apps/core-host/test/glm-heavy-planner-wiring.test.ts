import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "index.ts"),
  "utf8"
);

describe("Core Host GLM runtime wiring", () => {
  it("keeps GLM default-off behind both explicit runtime gates", () => {
    expect(source).not.toContain("@jarvis-k/inference-adapter-glm-planner\"");
    expect(source).toContain("JARVIS_K_ENABLE_HEAVY_PLANNER_GLM");
    expect(source).toContain(
      "JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED"
    );
    expect(source).toContain("openAiHeavyPlannerEnabled === glmRuntimeHeavyPlannerEnabled");
    expect(source).not.toContain("new GlmRuntimeHeavyPlannerProvider");
  });
});
