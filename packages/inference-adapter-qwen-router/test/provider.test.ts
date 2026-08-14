import { describe, expect, it } from "vitest";
import {
  createQwenFastRouterConfigurationReport,
  createQwenFastRouterDescriptor,
  parseQwenFastRouterOutput,
  QwenFastRouterProvider,
  QWEN_FAST_ROUTER_MODEL_ID
} from "../src";
import type { QwenFastRouterGenerationPort } from "../src";

describe("QwenFastRouterProvider", () => {
  it("parses fenced Qwen JSON into sanitized intent candidates", () => {
    const candidates = parseQwenFastRouterOutput(`
      \`\`\`json
      {
        "intent": "browser.open",
        "confidence": 0.93,
        "slots": {
          "target": " GitHub ",
          "command": "powershell remove-item",
          "query": "Jarvis-K Qwen router"
        },
        "reason": "Matched a browser-open command."
      }
      \`\`\`
    `);

    expect(candidates).toEqual([
      {
        intent: "browser.open",
        confidence: 0.93,
        slots: {
          target: "GitHub",
          query: "Jarvis-K Qwen router"
        },
        reasons: ["Matched a browser-open command."]
      }
    ]);
    expect(JSON.stringify(candidates)).not.toMatch(/powershell/iu);
    expect(candidates[0]?.slots).not.toHaveProperty("command");
  });

  it("extracts a valid router object after thinking text and ignores earlier JSON", () => {
    const candidates = parseQwenFastRouterOutput(`
      <think>{"intent":"shell.run","confidence":1}</think>
      The answer is:
      {"intent":"open_app","confidence":"0.91","slots":{"app":"微信"},"reason":"Open app request"}
    `);

    expect(candidates).toEqual([
      {
        intent: "localApp.open",
        confidence: 0.91,
        slots: {
          appName: "微信"
        },
        reasons: ["Open app request"]
      }
    ]);
  });

  it("accepts array output and intent aliases from small-model decoding", () => {
    const candidates = parseQwenFastRouterOutput(`
      [
        {"intent":"status","confidence":"0.82","slots":{},"reason":"status request"}
      ]
    `);

    expect(candidates).toEqual([
      {
        intent: "observability.status",
        confidence: 0.82,
        slots: {},
        reasons: ["status request"]
      }
    ]);
  });

  it("rejects malformed or unsupported Qwen output", () => {
    expect(() =>
      parseQwenFastRouterOutput('{"intent":"shell.run","confidence":0.99}')
    ).toThrow("QWEN_FAST_ROUTER_OUTPUT_INVALID");
    expect(() => parseQwenFastRouterOutput("not json")).toThrow(
      "QWEN_FAST_ROUTER_OUTPUT_INVALID"
    );
  });

  it("routes through the injected generation port without loading a real model", async () => {
    const calls: Parameters<QwenFastRouterGenerationPort["generate"]>[0][] = [];
    const generator: QwenFastRouterGenerationPort = {
      async generate(input) {
        calls.push(input);
        return JSON.stringify({
          intent: "memory.search",
          confidence: 0.88,
          slots: {
            query: "Qwen3 router plan"
          },
          reason: "Matched a Memory question."
        });
      }
    };
    const provider = new QwenFastRouterProvider({
      generator,
      now: () => new Date("2026-08-06T00:00:00.000Z")
    });

    const result = await provider.route({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      utterance: "我之前说过 Qwen3 吗",
      context: {
        locale: "zh",
        allowedIntents: ["memory.search", "chat.answer"]
      }
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      temperature: 0
    });
    expect(calls[0]?.prompt).toContain("Return exactly one compact JSON object");
    expect(calls[0]?.prompt).toContain("/no_think");
    expect(result).toMatchObject({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      utterance: "我之前说过 Qwen3 吗",
      candidates: [
        {
          intent: "memory.search",
          confidence: 0.88,
          slots: {
            query: "Qwen3 router plan"
          }
        }
      ],
      routedAt: "2026-08-06T00:00:00.000Z"
    });
  });

  it("keeps descriptor and configuration unavailable until explicit runtime gates pass", () => {
    const descriptor = createQwenFastRouterDescriptor({
      enabled: false
    });
    const report = createQwenFastRouterConfigurationReport({
      enabled: true,
      runtimeReady: false,
      artifactDigestApproved: false,
      modelLifecycleReady: false
    });

    expect(descriptor).toMatchObject({
      capability: "intent_router",
      provider: "intent-router.qwen3-0.6b",
      status: "unconfigured",
      execution: "disabled",
      modelIds: []
    });
    expect(report).toMatchObject({
      status: "unconfigured"
    });
    expect(report.requirements.map((requirement) => requirement.configured)).toEqual([
      true,
      true,
      false,
      false,
      false
    ]);
    expect(JSON.stringify(report)).not.toMatch(
      /(?:api[_-]?key|token|secret|password|[A-Za-z]:\\)/iu
    );
  });

  it("calibrates a strong local app request when Qwen misroutes it to browser", async () => {
    const provider = new QwenFastRouterProvider({
      generator: {
        async generate() {
          return JSON.stringify({
            intent: "browser.open",
            confidence: 0.34,
            slots: {
              target: "微信"
            },
            reason: "Low confidence browser target."
          });
        }
      },
      now: () => new Date("2026-08-06T00:00:00.000Z")
    });

    const result = await provider.route({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      utterance: "打开微信",
      context: {
        locale: "zh"
      }
    });

    expect(result.candidates[0]).toMatchObject({
      intent: "localApp.open",
      confidence: 0.84,
      slots: {
        appName: "微信"
      }
    });
  });

  it("calibrates a strong browser request that decodes with low confidence", async () => {
    const provider = new QwenFastRouterProvider({
      generator: {
        async generate() {
          return JSON.stringify({
            intent: "browser.open",
            confidence: 0.41,
            slots: {},
            reason: "Low confidence browser target."
          });
        }
      }
    });

    const result = await provider.route({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      utterance: "打开 GitHub",
      context: {
        locale: "zh"
      }
    });

    expect(result.candidates[0]).toMatchObject({
      intent: "browser.open",
      confidence: 0.82,
      slots: {
        target: "GitHub"
      }
    });
  });

  it("calibrates model status before generic status diagnostics", async () => {
    const provider = new QwenFastRouterProvider({
      generator: {
        async generate() {
          return JSON.stringify({
            intent: "observability.status",
            confidence: 0.51,
            slots: {},
            reason: "Generic status request."
          });
        }
      }
    });

    const result = await provider.route({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      utterance: "check model status",
      context: {
        locale: "en"
      }
    });

    expect(result.candidates[0]).toMatchObject({
      intent: "model.status",
      confidence: 0.8,
      slots: {}
    });
    expect(result.candidates[0]?.reasons).toEqual([
      "Deterministic calibration matched a model status request."
    ]);
  });

  it("fails closed for destructive requests when Qwen output is not JSON", async () => {
    const provider = new QwenFastRouterProvider({
      generator: {
        async generate() {
          return "I can delete the desktop files for you.";
        }
      },
      now: () => new Date("2026-08-06T00:00:00.000Z")
    });

    const result = await provider.route({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      utterance: "删除桌面所有文件",
      context: {
        locale: "zh"
      }
    });

    expect(result.candidates).toEqual([
      {
        intent: "blocked",
        confidence: 0.95,
        slots: {},
        reasons: [
          "Deterministic safety policy blocked a destructive or high-impact action."
        ]
      }
    ]);
  });

  it("overrides parsed unsafe destructive output with sanitized blocked JSON", async () => {
    const provider = new QwenFastRouterProvider({
      generator: {
        async generate() {
          return JSON.stringify({
            intent: "browser.open",
            confidence: 0.92,
            slots: {
              target: "C:\\Users\\Administrator\\Desktop"
            },
            reason: "Open a local file path."
          });
        }
      }
    });

    const result = await provider.route({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      utterance: "delete every desktop file",
      context: {
        locale: "en"
      }
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({
      intent: "blocked",
      confidence: 0.95,
      slots: {}
    });
    expect(JSON.stringify(result.candidates)).not.toMatch(
      /(?:C:\\|desktop file path)/iu
    );
  });

  it("uses clarify as the fail-closed fallback when blocked is not allowed", async () => {
    const provider = new QwenFastRouterProvider({
      allowedIntents: ["clarify", "browser.open"],
      generator: {
        async generate() {
          return "not json";
        }
      }
    });

    const result = await provider.route({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      utterance: "rm -rf /",
      context: {
        locale: "en"
      }
    });

    expect(result.candidates).toEqual([
      {
        intent: "clarify",
        confidence: 0.9,
        slots: {},
        reasons: [
          "Deterministic safety policy requires clarification for a destructive or high-impact action."
        ]
      }
    ]);
  });
});
