import type {
  DeviceCapability,
  DeviceRuntimeMode,
  ModelManifest
} from "@jarvis-k/contracts";
import { recommendRuntimeMode } from "./policy";

export interface ManifestInstallationDecision {
  allowed: boolean;
  reasons: string[];
  runtimeMode: DeviceRuntimeMode;
}

export interface ManifestInstallationPolicyOptions {
  allowYellowRisk?: boolean;
  allowUnknownRisk?: boolean;
}

const FLOATING_REVISIONS = new Set(["main", "master", "latest", "HEAD"]);

export function validateInstallableManifest(
  manifest: ModelManifest,
  device: DeviceCapability,
  options: ManifestInstallationPolicyOptions = {}
): ManifestInstallationDecision {
  const reasons: string[] = [];
  const runtimeMode = recommendRuntimeMode(device);

  if (FLOATING_REVISIONS.has(manifest.revision)) {
    reasons.push("Model revision must be pinned, not a floating branch.");
  }
  if (!manifest.sha256) {
    reasons.push("Model artifact must have a SHA-256 digest.");
  }
  if (manifest.licenseRisk === "red") {
    reasons.push("Red license-risk models cannot be installed.");
  }
  if (manifest.licenseRisk === "unknown" && !options.allowUnknownRisk) {
    reasons.push("Unknown license-risk models require explicit override.");
  }
  if (manifest.licenseRisk === "yellow" && !options.allowYellowRisk) {
    reasons.push("Yellow license-risk models require explicit review approval.");
  }
  if (
    manifest.minMemoryBytes !== undefined &&
    device.totalMemoryBytes < manifest.minMemoryBytes
  ) {
    reasons.push("Device memory is below the model minimum.");
  }
  if (
    manifest.minVramBytes !== undefined &&
    bestVramBytes(device) < manifest.minVramBytes
  ) {
    reasons.push("Device VRAM is below the model minimum.");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    runtimeMode
  };
}

function bestVramBytes(device: DeviceCapability): number {
  return Math.max(
    0,
    ...device.gpus.map((gpu) => gpu.dedicatedMemoryBytes ?? 0)
  );
}
