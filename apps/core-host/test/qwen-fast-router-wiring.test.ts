import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "index.ts"),
  "utf8"
);
const runtimeConfigSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "config", "runtime-config.ts"),
  "utf8"
);

describe("Core Host Qwen fast-router wiring", () => {
  it("registers the Qwen fast-router diagnostic provider without runtime execution", () => {
    expect(source).toContain("@jarvis-k/inference-adapter-qwen-router");
    expect(source).toContain("createCoreHostQwenFastRouterComposition");
    expect(source).toContain("qwenFastRouterComposition");
    expect(source).toContain("qwenFastRouterDescriptor");
    expect(source).toContain("qwenFastRouterConfigurationReport");
    expect(runtimeConfigSource).toContain("JARVIS_K_ENABLE_QWEN_FAST_ROUTER");
    expect(source).toContain("runtimeConfig.qwenFastRouterEnabled");
    expect(source).toContain("artifactDigestApproved: false");
    expect(source).toContain("modelLifecycleReady: false");
    expect(source).toContain("selectionPolicyReady: true");
    expect(source).toContain("fallbackPreserved: true");
    expect(source).not.toContain("new QwenFastRouterProvider");
  });
});
