import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import { CoreRuntime } from "@jarvis-k/core";
import { GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID } from "@jarvis-k/inference-adapter-glm-runtime";
import type { VoiceActionResult } from "@jarvis-k/voice";

const disabledIdleVoiceSnapshot = {
  state: "idle" as const,
  mode: "disabled" as const,
  permission: "unknown" as const
};

function idleVoiceAction(): VoiceActionResult {
  return {
    ok: true,
    snapshot: { ...disabledIdleVoiceSnapshot }
  };
}

export function createGlmHeavyPlannerAcceptanceRuntime(
  heavyPlannerProvider: HeavyPlannerProvider
): CoreRuntime {
  return new CoreRuntime(
    () => undefined,
    {
      getSnapshot: () => ({ ...disabledIdleVoiceSnapshot }),
      setMode: async () => idleVoiceAction(),
      startPtt: () => idleVoiceAction(),
      acceptAudioFrame: async () => ({ accepted: true as const }),
      stopPtt: async () => idleVoiceAction(),
      cancel: async () => idleVoiceAction(),
      suspendForTts: () => idleVoiceAction(),
      resumeAfterTts: async () => idleVoiceAction(),
      reportPermission: () => idleVoiceAction()
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
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined, // brainActionExecutor
    undefined, // brainRouter
    heavyPlannerProvider,
    {
      enabled: true,
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID
    }
  );
}
