import { describe, expect, it } from "vitest";
import {
  createPinnedQwenFastRouterArtifactPlan,
  createQwenFastRouterArtifactPlan,
  isQwenFastRouterArtifactPlanPinned,
  QWEN_FAST_ROUTER_APPROVED_ARTIFACT_DIGESTS,
  QWEN_FAST_ROUTER_MODEL_ID,
  QWEN_FAST_ROUTER_SELECTED_REVISION
} from "../src";

describe("Qwen fast-router artifact plan", () => {
  it("lists the required Qwen3-0.6B artifacts without enabling downloads", () => {
    const plan = createQwenFastRouterArtifactPlan();

    expect(plan).toMatchObject({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      status: "unpinned",
      downloadEnabled: false
    });
    expect(plan.artifacts.map((artifact) => artifact.key)).toEqual([
      "config.json",
      "generation_config.json",
      "tokenizer_config.json",
      "tokenizer.json",
      "merges.txt",
      "vocab.json",
      "model.safetensors"
    ]);
    expect(plan.artifacts.every((artifact) => artifact.required)).toBe(true);
    expect(plan.artifacts.every((artifact) => !artifact.pinned)).toBe(true);
    expect(isQwenFastRouterArtifactPlanPinned(plan)).toBe(false);
    expect(JSON.stringify(plan)).not.toMatch(/https?:\/\/|[A-Za-z]:\\/u);
  });

  it("creates approved SHA-256 pins without enabling downloads", () => {
    const pinned = createPinnedQwenFastRouterArtifactPlan();

    expect(QWEN_FAST_ROUTER_APPROVED_ARTIFACT_DIGESTS).toHaveLength(7);
    expect(QWEN_FAST_ROUTER_SELECTED_REVISION).toBe(
      "c1899de289a04d12100db370d81485cdf75e47ca"
    );
    expect(pinned.status).toBe("pinned");
    expect(pinned.downloadEnabled).toBe(false);
    expect(pinned.artifacts.every((artifact) => artifact.pinned)).toBe(true);
    expect(
      pinned.artifacts.every(
        (artifact) =>
          artifact.revision === QWEN_FAST_ROUTER_SELECTED_REVISION &&
          artifact.upstreamPath === artifact.key &&
          /^[a-f0-9]{64}$/u.test(artifact.sha256 ?? "")
      )
    ).toBe(true);
    expect(isQwenFastRouterArtifactPlanPinned(pinned)).toBe(true);
    expect(JSON.stringify(pinned)).not.toMatch(/https?:\/\/|[A-Za-z]:\\/u);
  });
});
