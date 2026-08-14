import { describe, expect, it } from "vitest";
import { createCommandEnvelope } from "@jarvis-k/contracts";
import { CoreRuntime } from "@jarvis-k/core";
import type { IntentRoutingProvider } from "@jarvis-k/capabilities";
import {
  QWEN_FAST_ROUTER_MODEL_ID,
  type QwenFastRouterGenerationPort
} from "@jarvis-k/inference-adapter-qwen-router";
import { createCoreHostQwenFastRouterComposition } from "../src/qwen-fast-router-composition";

function allGateOptions(
  runtimeGenerationPort: QwenFastRouterGenerationPort = fixedRouterGenerator()
) {
  return {
    enabled: true,
    modelId: QWEN_FAST_ROUTER_MODEL_ID,
    artifactDigestApproved: true,
    modelLifecycleReady: true,
    runtimeGenerationPort,
    selectionPolicyReady: true,
    defaultOffPreserved: true,
    fallbackPreserved: true
  };
}

function fixedRouterGenerator(
  output = {
    intent: "browser.open",
    confidence: 0.91,
    slots: { target: "GitHub" },
    reason: "Fixed simulated router output."
  }
): QwenFastRouterGenerationPort {
  return {
    async generate() {
      return JSON.stringify(output);
    }
  };
}

function createRuntimeWithIntentProvider(
  intentRoutingProvider: IntentRoutingProvider | undefined
): CoreRuntime {
  return new CoreRuntime(
    () => undefined,
    {
      getSnapshot: () => ({
        state: "idle",
        mode: "disabled",
        permission: "unknown"
      }),
      setMode: async () => ({ accepted: true, state: "idle" }),
      startPtt: async () => ({ accepted: true, state: "idle" }),
      stopPtt: async () => ({ accepted: true, state: "idle" }),
      cancel: async () => ({ accepted: true, state: "idle" }),
      suspendForTts: async () => ({ accepted: true, state: "idle" }),
      resumeAfterTts: async () => ({ accepted: true, state: "idle" }),
      reportPermission: async () => ({ accepted: true, state: "idle" })
    },
    () => new Date("2026-08-07T00:00:00.000Z"),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    intentRoutingProvider,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      enabled: true,
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      providerId: "intent-router.qwen3-0.6b",
      minConfidence: 0.7
    }
  );
}

describe("Core Host Qwen fast-router composition", () => {
  it("fails closed and does not construct a provider when any required gate is missing", () => {
    const gateCases = [
      {
        name: "disabled",
        options: { ...allGateOptions(), enabled: false },
        reasonCode: "QWEN_COMPOSITION_DISABLED"
      },
      {
        name: "artifact digest approval missing",
        options: { ...allGateOptions(), artifactDigestApproved: false },
        reasonCode: "QWEN_ARTIFACT_DIGEST_APPROVAL_MISSING"
      },
      {
        name: "model lifecycle not ready",
        options: { ...allGateOptions(), modelLifecycleReady: false },
        reasonCode: "QWEN_MODEL_LIFECYCLE_NOT_READY"
      },
      {
        name: "runtime generation port missing",
        options: omitRuntimeGenerationPort(allGateOptions()),
        reasonCode: "QWEN_RUNTIME_GENERATION_PORT_MISSING"
      },
      {
        name: "selection policy not ready",
        options: { ...allGateOptions(), selectionPolicyReady: false },
        reasonCode: "QWEN_SELECTION_POLICY_NOT_READY"
      },
      {
        name: "default-off not preserved",
        options: { ...allGateOptions(), defaultOffPreserved: false },
        reasonCode: "QWEN_DEFAULT_OFF_NOT_PRESERVED"
      },
      {
        name: "fallback not preserved",
        options: { ...allGateOptions(), fallbackPreserved: false },
        reasonCode: "QWEN_FALLBACK_NOT_PRESERVED"
      }
    ] as const;

    for (const item of gateCases) {
      const composition = createCoreHostQwenFastRouterComposition(item.options);

      expect(composition.provider, item.name).toBeUndefined();
      expect(composition.compositionReport.reasonCodes).toContain(
        item.reasonCode
      );
      expect(composition.compositionReport).toMatchObject({
        directActionAttempted: false,
        runtimeAccessed: false,
        artifactAccessed: false,
        persistentCacheChanged: false
      });
      expect(composition.descriptor.status).toBe("unconfigured");
      expect(composition.configurationReport.status).toBe("unconfigured");
    }
  });

  it("constructs an injected provider only when all no-runtime gates are satisfied", async () => {
    let generationCalls = 0;
    const composition = createCoreHostQwenFastRouterComposition(
      allGateOptions({
        async generate() {
          generationCalls += 1;
          return JSON.stringify({
            intent: "browser.open",
            confidence: 0.91,
            slots: { target: "GitHub" },
            reason: "Fixed simulated router output."
          });
        }
      })
    );

    expect(composition.provider).toBeDefined();
    expect(generationCalls).toBe(0);
    expect(composition.descriptor.status).toBe("available");
    expect(composition.configurationReport.status).toBe("available");
    expect(composition.compositionReport).toMatchObject({
      status: "available",
      reasonCodes: ["QWEN_COMPOSITION_AVAILABLE"],
      runtimeAccessed: false,
      artifactAccessed: false,
      persistentCacheChanged: false
    });

    const routed = await composition.provider?.route({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      utterance: "打开 GitHub",
      context: {
        locale: "zh"
      }
    });

    expect(generationCalls).toBe(1);
    expect(routed?.candidates[0]).toMatchObject({
      intent: "browser.open",
      confidence: 0.91
    });
  });

  it("keeps provider model mismatch fail-closed in the simulated composition path", async () => {
    const composition = createCoreHostQwenFastRouterComposition(
      allGateOptions()
    );

    await expect(
      composition.provider?.route({
        modelId: "unexpected/model",
        utterance: "打开 GitHub"
      })
    ).rejects.toThrow("QWEN_FAST_ROUTER_MODEL_MISMATCH");
  });

  it("preserves Core selection fallback when a composed provider returns low confidence", async () => {
    const composition = createCoreHostQwenFastRouterComposition(
      allGateOptions(
        fixedRouterGenerator({
          intent: "memory.search",
          confidence: 0.2,
          slots: {},
          reason: "Low confidence simulated router output."
        })
      )
    );
    const runtime = createRuntimeWithIntentProvider(composition.provider);

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.runBrainCommand",
        payload: {
          source: "text",
          text: "tell me a small joke"
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).toContain('"reasonCode":"CONFIDENCE_LOW"');
    expect(JSON.stringify(result)).toContain('"usedRulesFallback":true');
    expect(JSON.stringify(result)).toContain('"directActionAttempted":false');
    expect(JSON.stringify(result)).toContain('"rawDiagnosticsExposed":false');
    expect(JSON.stringify(result)).not.toMatch(/(?:C:\\|token|secret)/iu);
  });
});

function omitRuntimeGenerationPort(
  options: ReturnType<typeof allGateOptions>
): Omit<ReturnType<typeof allGateOptions>, "runtimeGenerationPort"> {
  const { runtimeGenerationPort: _runtimeGenerationPort, ...rest } = options;
  return rest;
}
