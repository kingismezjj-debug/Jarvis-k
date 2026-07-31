import { describe, expect, it } from "vitest";
import {
  PolicyModelInstallationPlanner,
  validateInstallableManifest,
  type ManifestInstallationDecision
} from "../src";
import type { DeviceCapability, ModelManifest } from "@jarvis-k/contracts";

describe("manifest installation policy", () => {
  it("blocks floating revisions and missing digests", () => {
    const decision = decide({
      revision: "main",
      sha256: undefined
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons.join(" ")).toContain("revision");
    expect(decision.reasons.join(" ")).toContain("SHA-256");
  });

  it("requires explicit approval for yellow license risk", () => {
    expect(decide({ licenseRisk: "yellow" }).allowed).toBe(false);
    expect(
      decide({ licenseRisk: "yellow" }, { allowYellowRisk: true }).allowed
    ).toBe(true);
  });

  it("blocks red and unknown license risk by default", () => {
    expect(decide({ licenseRisk: "red" }).allowed).toBe(false);
    expect(decide({ licenseRisk: "unknown" }).allowed).toBe(false);
    expect(
      decide({ licenseRisk: "unknown" }, { allowUnknownRisk: true }).allowed
    ).toBe(true);
  });

  it("blocks devices below memory and VRAM requirements", () => {
    const decision = validateInstallableManifest(
      manifest({
        minMemoryBytes: gib(32),
        minVramBytes: gib(8)
      }),
      device({
        totalMemoryBytes: gib(16),
        dedicatedMemoryBytes: gib(4)
      }),
      { allowYellowRisk: true }
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reasons.join(" ")).toContain("memory");
    expect(decision.reasons.join(" ")).toContain("VRAM");
  });

  it("previews installability through the default planner", async () => {
    const planner = new PolicyModelInstallationPlanner();
    const report = await planner.preview({
      manifest: manifest({ licenseRisk: "yellow" }),
      device: device()
    });

    expect(report).toMatchObject({
      modelId: "vendor/local-stt-small",
      allowed: false,
      runtimeMode: "local_enhanced"
    });
    expect(report.reasons.join(" ")).toContain("Yellow");
  });
});

function decide(
  overrides: Partial<ModelManifest>,
  options: { allowYellowRisk?: boolean; allowUnknownRisk?: boolean } = {}
): ManifestInstallationDecision {
  return validateInstallableManifest(
    manifest(overrides),
    device(),
    options
  );
}

function manifest(overrides: Partial<ModelManifest> = {}): ModelManifest {
  const value: ModelManifest = {
    id: "vendor/local-stt-small",
    capability: "speech_to_text",
    source: "huggingface",
    revision: "commit-a",
    license: "MIT",
    runtime: "ctranslate2",
    quantization: "int8",
    sizeBytes: 512,
    sha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    licenseRisk: "green",
    ...overrides
  };
  if (overrides.sha256 === undefined && "sha256" in overrides) {
    delete (value as Partial<ModelManifest>).sha256;
  }
  return value;
}

function device(
  overrides: {
    totalMemoryBytes?: number;
    dedicatedMemoryBytes?: number;
  } = {}
): DeviceCapability {
  const totalMemoryBytes = overrides.totalMemoryBytes ?? gib(32);
  const dedicatedMemoryBytes = overrides.dedicatedMemoryBytes ?? gib(8);
  return {
    checkedAt: "2026-07-31T00:00:00.000Z",
    platform: "win32",
    arch: "x64",
    cpuLogicalCores: 16,
    totalMemoryBytes,
    availableMemoryBytes: totalMemoryBytes / 2,
    gpus: [
      {
        name: "NVIDIA Test GPU",
        vendor: "nvidia",
        dedicatedMemoryBytes
      }
    ],
    accelerationBackends: ["cpu", "cuda"],
    recommendedMode: "local_enhanced",
    reasons: []
  };
}

function gib(value: number): number {
  return value * 1024 * 1024 * 1024;
}
