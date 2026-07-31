import { createId, type DeviceCapability } from "@jarvis-k/contracts";
import type {
  ResourceLease,
  ResourceRequest,
  ResourceScheduler
} from "./ports";

interface ActiveLease {
  leaseId: string;
  request: ResourceRequest;
  createdAt: string;
  released: boolean;
}

export interface InMemoryResourceSchedulerOptions {
  device: DeviceCapability;
  now?: () => Date;
}

export class InMemoryResourceScheduler implements ResourceScheduler {
  private readonly leases = new Map<string, ActiveLease>();
  private readonly now: () => Date;

  public constructor(
    private readonly options: InMemoryResourceSchedulerOptions
  ) {
    this.now = options.now ?? (() => new Date());
  }

  public async acquire(input: ResourceRequest): Promise<ResourceLease> {
    this.assertAvailable(input);

    const leaseId = createId("lease");
    const lease: ActiveLease = {
      leaseId,
      request: { ...input },
      createdAt: this.now().toISOString(),
      released: false
    };
    this.leases.set(leaseId, lease);

    return {
      leaseId,
      capability: input.capability,
      ...(input.modelId === undefined ? {} : { modelId: input.modelId }),
      createdAt: lease.createdAt,
      release: async () => {
        const active = this.leases.get(leaseId);
        if (!active || active.released) {
          return;
        }
        active.released = true;
        this.leases.delete(leaseId);
      }
    };
  }

  private assertAvailable(input: ResourceRequest): void {
    const activeLeases = Array.from(this.leases.values()).filter(
      (lease) => !lease.released
    );
    const minMemoryBytes = input.minMemoryBytes ?? 0;
    const minVramBytes = input.minVramBytes ?? 0;

    if (minMemoryBytes > this.availableMemoryBytes(activeLeases)) {
      throw new Error("RESOURCE_MEMORY_UNAVAILABLE");
    }
    if (minVramBytes > this.availableVramBytes(activeLeases)) {
      throw new Error("RESOURCE_VRAM_UNAVAILABLE");
    }
    if (input.exclusiveGpu && activeLeases.some((lease) => usesGpu(lease))) {
      throw new Error("RESOURCE_GPU_BUSY");
    }
    if (
      minVramBytes > 0 &&
      activeLeases.some((lease) => lease.request.exclusiveGpu)
    ) {
      throw new Error("RESOURCE_GPU_EXCLUSIVE_LOCKED");
    }
  }

  private availableMemoryBytes(activeLeases: ActiveLease[]): number {
    const usedBytes = activeLeases.reduce(
      (total, lease) => total + (lease.request.minMemoryBytes ?? 0),
      0
    );
    return Math.max(0, this.options.device.availableMemoryBytes - usedBytes);
  }

  private availableVramBytes(activeLeases: ActiveLease[]): number {
    const bestVramBytes = Math.max(
      0,
      ...this.options.device.gpus.map(
        (gpu) => gpu.dedicatedMemoryBytes ?? 0
      )
    );
    const usedBytes = activeLeases.reduce(
      (total, lease) => total + (lease.request.minVramBytes ?? 0),
      0
    );
    return Math.max(0, bestVramBytes - usedBytes);
  }
}

function usesGpu(lease: ActiveLease): boolean {
  return (
    lease.request.exclusiveGpu === true ||
    (lease.request.minVramBytes ?? 0) > 0
  );
}
