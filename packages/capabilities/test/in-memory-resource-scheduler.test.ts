import { describe, expect, it } from "vitest";
import { InMemoryResourceScheduler } from "../src";
import type { DeviceCapability } from "@jarvis-k/contracts";

describe("InMemoryResourceScheduler", () => {
  it("leases and releases memory-backed resources", async () => {
    const scheduler = new InMemoryResourceScheduler({
      device: device({
        availableMemoryBytes: gib(8)
      }),
      now: () => new Date("2026-07-31T00:00:00.000Z")
    });

    const lease = await scheduler.acquire({
      capability: "embedding",
      modelId: "vendor/local-embedding-small",
      minMemoryBytes: gib(6)
    });

    await expect(
      scheduler.acquire({
        capability: "speech_to_text",
        minMemoryBytes: gib(3)
      })
    ).rejects.toThrow("RESOURCE_MEMORY_UNAVAILABLE");

    await lease.release();
    await expect(
      scheduler.acquire({
        capability: "speech_to_text",
        minMemoryBytes: gib(3)
      })
    ).resolves.toMatchObject({
      capability: "speech_to_text"
    });
  });

  it("reports resource diagnostics from active leases", async () => {
    const scheduler = new InMemoryResourceScheduler({
      device: device({
        availableMemoryBytes: gib(8),
        dedicatedMemoryBytes: gib(4)
      }),
      now: () => new Date("2026-07-31T00:00:00.000Z")
    });

    await scheduler.acquire({
      capability: "speech_to_text",
      minMemoryBytes: gib(2),
      minVramBytes: gib(1)
    });

    expect(await scheduler.diagnostics()).toMatchObject({
      checkedAt: "2026-07-31T00:00:00.000Z",
      availableMemoryBytes: gib(6),
      leasedMemoryBytes: gib(2),
      totalVramBytes: gib(4),
      availableVramBytes: gib(3),
      leasedVramBytes: gib(1),
      activeLeaseCount: 1,
      exclusiveGpuLeaseActive: false
    });
  });

  it("blocks VRAM overcommit and exclusive GPU conflicts", async () => {
    const scheduler = new InMemoryResourceScheduler({
      device: device({
        availableMemoryBytes: gib(16),
        dedicatedMemoryBytes: gib(8)
      })
    });

    const sharedGpuLease = await scheduler.acquire({
      capability: "speech_to_text",
      minVramBytes: gib(6)
    });

    await expect(
      scheduler.acquire({
        capability: "vision",
        minVramBytes: gib(3)
      })
    ).rejects.toThrow("RESOURCE_VRAM_UNAVAILABLE");
    await expect(
      scheduler.acquire({
        capability: "ocr",
        exclusiveGpu: true
      })
    ).rejects.toThrow("RESOURCE_GPU_BUSY");

    await sharedGpuLease.release();
    const exclusiveLease = await scheduler.acquire({
      capability: "vision",
      exclusiveGpu: true
    });
    await expect(
      scheduler.acquire({
        capability: "ocr",
        minVramBytes: gib(1)
      })
    ).rejects.toThrow("RESOURCE_GPU_EXCLUSIVE_LOCKED");

    await exclusiveLease.release();
  });

  it("is safe to release a lease more than once", async () => {
    const scheduler = new InMemoryResourceScheduler({
      device: device({
        availableMemoryBytes: gib(4)
      })
    });
    const lease = await scheduler.acquire({
      capability: "intent_router",
      minMemoryBytes: gib(1)
    });

    await lease.release();
    await lease.release();

    await expect(
      scheduler.acquire({
        capability: "intent_router",
        minMemoryBytes: gib(4)
      })
    ).resolves.toMatchObject({
      capability: "intent_router"
    });
  });
});

function device(
  overrides: {
    availableMemoryBytes?: number;
    dedicatedMemoryBytes?: number;
  } = {}
): DeviceCapability {
  const totalMemoryBytes = gib(16);
  return {
    checkedAt: "2026-07-31T00:00:00.000Z",
    platform: "win32",
    arch: "x64",
    cpuLogicalCores: 16,
    totalMemoryBytes,
    availableMemoryBytes: overrides.availableMemoryBytes ?? gib(8),
    gpus:
      overrides.dedicatedMemoryBytes === undefined
        ? []
        : [
            {
              name: "NVIDIA Test GPU",
              vendor: "nvidia",
              dedicatedMemoryBytes: overrides.dedicatedMemoryBytes
            }
          ],
    accelerationBackends: ["cpu", "cuda"],
    recommendedMode: "standard",
    reasons: []
  };
}

function gib(value: number): number {
  return value * 1024 * 1024 * 1024;
}
