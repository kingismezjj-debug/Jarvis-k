import {
  CapabilitySnapshotSchema,
  type CapabilitySnapshot,
  type DeviceCapability,
  type DeviceRuntimeMode,
  type ProviderSelection
} from "@jarvis-k/contracts";

export interface CapabilitySnapshotInput {
  checkedAt: string;
  device: DeviceCapability;
  modelInventory?: CapabilitySnapshot["modelInventory"];
}

export function recommendRuntimeMode(
  device: DeviceCapability
): DeviceRuntimeMode {
  const totalMemoryBytes = device.totalMemoryBytes;
  const bestVramBytes = Math.max(
    0,
    ...device.gpus.map((gpu) => gpu.dedicatedMemoryBytes ?? 0)
  );

  if (totalMemoryBytes >= gib(32) && bestVramBytes >= gib(12)) {
    return "private_offline";
  }
  if (totalMemoryBytes >= gib(32) && bestVramBytes >= gib(8)) {
    return "local_enhanced";
  }
  if (totalMemoryBytes >= gib(16)) {
    return "standard";
  }
  return "lite";
}

export function buildProviderPlan(
  mode: DeviceRuntimeMode
): ProviderSelection[] {
  const base: ProviderSelection[] = [
    {
      capability: "speech_to_text",
      provider: "local_whisper",
      execution: mode === "lite" ? "cloud" : "local",
      loadPolicy: mode === "lite" ? "remote" : "on_demand",
      reason:
        mode === "lite"
          ? "Low-memory devices should prefer cloud STT or tiny local models."
          : "Local STT is a high-value first local model candidate."
    },
    {
      capability: "text_to_speech",
      provider: mode === "lite" ? "system_tts" : "local_or_system_tts",
      execution: mode === "lite" ? "system" : "local",
      loadPolicy: "on_demand",
      reason: "TTS should avoid unreviewed GPL-linked dependencies."
    },
    {
      capability: "ocr",
      provider: "local_paddleocr_image",
      execution: mode === "lite" ? "cloud" : "local",
      loadPolicy: "on_demand",
      reason: "Image OCR is useful locally; PDF parsing remains separated."
    },
    {
      capability: "embedding",
      provider: mode === "lite" ? "cloud_embedding" : "local_embedding",
      execution: mode === "lite" ? "cloud" : "local",
      loadPolicy: "on_demand",
      reason: "Embedding should not be resident on low-memory devices."
    },
    {
      capability: "intent_router",
      provider: "rules_first_router",
      execution: "local",
      loadPolicy: "resident",
      reason: "Tool intent routing starts with rules and schema validation."
    },
    {
      capability: "vision",
      provider:
        mode === "private_offline" ? "local_vision_optional" : "cloud_vision",
      execution: mode === "private_offline" ? "local" : "cloud",
      loadPolicy: mode === "private_offline" ? "on_demand" : "remote",
      reason: "Large local vision models should not be resident by default."
    }
  ];

  return base;
}

export function buildCapabilitySnapshot(
  input: CapabilitySnapshotInput
): CapabilitySnapshot {
  const runtimeMode = recommendRuntimeMode(input.device);
  return CapabilitySnapshotSchema.parse({
    checkedAt: input.checkedAt,
    device: {
      ...input.device,
      recommendedMode: runtimeMode
    },
    runtimeMode,
    providerPlan: buildProviderPlan(runtimeMode),
    modelInventory: input.modelInventory ?? []
  });
}

function gib(value: number): number {
  return value * 1024 * 1024 * 1024;
}
