import { describe, expect, it } from "vitest";
import {
  buildCapabilitySnapshot,
  buildProviderPlan,
  recommendRuntimeMode
} from "../src";
import type { DeviceCapability } from "@jarvis-k/contracts";

function device(
  totalMemoryBytes: number,
  dedicatedMemoryBytes = 0
): DeviceCapability {
  return {
    checkedAt: "2026-07-31T00:00:00.000Z",
    platform: "win32",
    arch: "x64",
    cpuLogicalCores: 8,
    totalMemoryBytes,
    availableMemoryBytes: totalMemoryBytes / 2,
    gpus:
      dedicatedMemoryBytes > 0
        ? [
            {
              name: "NVIDIA Test GPU",
              vendor: "nvidia",
              dedicatedMemoryBytes
            }
          ]
        : [],
    accelerationBackends: ["cpu"],
    recommendedMode: "lite",
    reasons: []
  };
}

describe("capability policy", () => {
  it("recommends a runtime mode from memory and VRAM", () => {
    expect(recommendRuntimeMode(device(gib(8)))).toBe("lite");
    expect(recommendRuntimeMode(device(gib(16)))).toBe("standard");
    expect(recommendRuntimeMode(device(gib(32), gib(8)))).toBe(
      "local_enhanced"
    );
    expect(recommendRuntimeMode(device(gib(32), gib(12)))).toBe(
      "private_offline"
    );
  });

  it("keeps large vision remote unless private offline is available", () => {
    expect(
      buildProviderPlan("standard").find(
        (item) => item.capability === "vision"
      )
    ).toMatchObject({
      execution: "cloud",
      loadPolicy: "remote"
    });
    expect(
      buildProviderPlan("private_offline").find(
        (item) => item.capability === "vision"
      )
    ).toMatchObject({
      execution: "local",
      loadPolicy: "on_demand"
    });
  });

  it("builds a validated capability snapshot", () => {
    const snapshot = buildCapabilitySnapshot({
      checkedAt: "2026-07-31T00:00:00.000Z",
      device: device(gib(16))
    });

    expect(snapshot.runtimeMode).toBe("standard");
    expect(snapshot.device.recommendedMode).toBe("standard");
    expect(snapshot.providerPlan.map((item) => item.capability)).toContain(
      "speech_to_text"
    );
  });
});

function gib(value: number): number {
  return value * 1024 * 1024 * 1024;
}
