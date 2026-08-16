import { describe, expect, it } from "vitest";
import {
  loadRuntimeConfig,
  toLogSafeRuntimeConfig,
} from "../src/config/runtime-config";

describe("Core Host runtime config", () => {
  it("uses safe defaults when no environment is provided", () => {
    const config = loadRuntimeConfig({});

    expect(config).toMatchObject({
      mode: "development",
      fixtureChatAnswerEnabled: false,
      fixtureInferenceEnabled: false,
      qwenFastRouterEnabled: false,
      localPluginManifestDiscoveryEnabled: false,
      deterministicFallbackEnabled: true,
      brainRouterEnabled: true,
      language: "zh",
    });
  });

  it("keeps fixture runtime disabled by default", () => {
    const config = loadRuntimeConfig({ NODE_ENV: "test" });

    expect(config.fixtureChatAnswerEnabled).toBe(false);
    expect(config.fixtureInferenceEnabled).toBe(false);
  });

  it("allows fixture runtime only after explicit opt-in outside production", () => {
    const config = loadRuntimeConfig({
      JARVIS_K_RUNTIME_MODE: "fixture",
      JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER: "1",
      JARVIS_K_ENABLE_FIXTURE_INFERENCE: "true",
    });

    expect(config.mode).toBe("fixture");
    expect(config.fixtureChatAnswerEnabled).toBe(true);
    expect(config.fixtureInferenceEnabled).toBe(true);
  });

  it("parses Qwen fast router enablement without making it default", () => {
    expect(loadRuntimeConfig({}).qwenFastRouterEnabled).toBe(false);
    expect(
      loadRuntimeConfig({ JARVIS_K_ENABLE_QWEN_FAST_ROUTER: "1" })
        .qwenFastRouterEnabled,
    ).toBe(true);
  });

  it("parses Voice Pilot execution safety flags only after explicit truthy opt-in", () => {
    expect(loadRuntimeConfig({}).brainOpenActionsDisabled).toBe(false);
    expect(loadRuntimeConfig({}).realWindowsExecutionEnabled).toBe(false);
    expect(
      loadRuntimeConfig({ JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1" })
        .brainOpenActionsDisabled,
    ).toBe(true);
    expect(
      loadRuntimeConfig({ JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "true" })
        .brainOpenActionsDisabled,
    ).toBe(true);
    for (const value of ["", "0", "false"]) {
      const config = loadRuntimeConfig({
        JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: value,
        JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION: value,
      });
      expect(config.brainOpenActionsDisabled).toBe(false);
      expect(config.realWindowsExecutionEnabled).toBe(false);
    }
    expect(
      loadRuntimeConfig({ JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION: "1" })
        .realWindowsExecutionEnabled,
    ).toBe(true);
  });

  it("rejects invalid boolean values", () => {
    expect(() =>
      loadRuntimeConfig({ JARVIS_K_ENABLE_QWEN_FAST_ROUTER: "yes" }),
    ).toThrow("Invalid boolean environment value");
  });

  it("rejects invalid explicit path values", () => {
    expect(() =>
      loadRuntimeConfig({ JARVIS_K_MEMORY_DB_PATH: "bad\0path.sqlite" }),
    ).toThrow("Invalid path environment value");
  });

  it("rejects conflicting heavy planner modes", () => {
    expect(() =>
      loadRuntimeConfig({
        JARVIS_K_ENABLE_HEAVY_PLANNER_OPENAI: "1",
        JARVIS_K_ENABLE_HEAVY_PLANNER_GLM: "1",
      }),
    ).toThrow("Only one heavy planner provider");
  });

  it("rejects dangerous fixture providers in production", () => {
    expect(() =>
      loadRuntimeConfig({
        JARVIS_K_RUNTIME_MODE: "production",
        JARVIS_K_ENABLE_FIXTURE_INFERENCE: "1",
      }),
    ).toThrow("Production runtime cannot enable fixture providers");
  });

  it("keeps sensitive environment values out of log-safe projection", () => {
    const config = loadRuntimeConfig({
      JARVIS_K_RUNTIME_MODE: "development",
      DEEPSEEK_API_KEY: "secret-key",
      OPENAI_API_KEY: "also-secret",
    });

    expect(JSON.stringify(toLogSafeRuntimeConfig(config))).not.toContain(
      "secret",
    );
    expect(toLogSafeRuntimeConfig(config).sensitiveValuesExposed).toBe(false);
  });

  it("always preserves deterministic fallback", () => {
    expect(
      loadRuntimeConfig({ JARVIS_K_ENABLE_QWEN_FAST_ROUTER: "1" })
        .deterministicFallbackEnabled,
    ).toBe(true);
  });
});
