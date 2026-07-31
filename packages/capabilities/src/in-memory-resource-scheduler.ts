import {
  ResourceSchedulerDiagnosticsSchema,
  createId,
  type DeviceCapability,
  type ResourceSchedulerDiagnostics
} from "@jarvis-k/contracts";
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
  device?: DeviceCapability;
  inspectDevice?: () => Promise<DeviceCapability>;
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
    const device = await this.device();
    this.assertAvailable(input, device);

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

  public async diagnostics(): Promise<ResourceSchedulerDiagnostics> {
    const device = await this.device();
    const activeLeases = this.activeLeases();
    const leasedMemoryBytes = sumLeasedMemoryBytes(activeLeases);
    const leasedVramBytes = sumLeasedVramBytes(activeLeases);
    const totalVramBytes = bestVramBytes(device);

    return ResourceSchedulerDiagnosticsSchema.parse({
      checkedAt: this.now().toISOString(),
      totalMemoryBytes: device.totalMemoryBytes,
      availableMemoryBytes: Math.max(
        0,
        device.availableMemoryBytes - leasedMemoryBytes
      ),
      leasedMemoryBytes,
      totalVramBytes,
      availableVramBytes: Math.max(0, totalVramBytes - leasedVramBytes),
      leasedVramBytes,
      activeLeaseCount: activeLeases.length,
      exclusiveGpuLeaseActive: activeLeases.some(
        (lease) => lease.request.exclusiveGpu === true
      )
    });
  }

  private assertAvailable(
    input: ResourceRequest,
    device: DeviceCapability
  ): void {
    const activeLeases = Array.from(this.leases.values()).filter(
      (lease) => !lease.released
    );
    const minMemoryBytes = input.minMemoryBytes ?? 0;
    const minVramBytes = input.minVramBytes ?? 0;

    if (minMemoryBytes > this.availableMemoryBytes(activeLeases, device)) {
      throw new Error("RESOURCE_MEMORY_UNAVAILABLE");
    }
    if (minVramBytes > this.availableVramBytes(activeLeases, device)) {
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

  private availableMemoryBytes(
    activeLeases: ActiveLease[],
    device: DeviceCapability
  ): number {
    return Math.max(
      0,
      device.availableMemoryBytes - sumLeasedMemoryBytes(activeLeases)
    );
  }

  private availableVramBytes(
    activeLeases: ActiveLease[],
    device: DeviceCapability
  ): number {
    return Math.max(
      0,
      bestVramBytes(device) - sumLeasedVramBytes(activeLeases)
    );
  }

  private activeLeases(): ActiveLease[] {
    return Array.from(this.leases.values()).filter(
      (lease) => !lease.released
    );
  }

  private async device(): Promise<DeviceCapability> {
    if (this.options.inspectDevice) {
      return this.options.inspectDevice();
    }
    if (this.options.device) {
      return this.options.device;
    }
    throw new Error("RESOURCE_DEVICE_UNAVAILABLE");
  }
}

function bestVramBytes(device: DeviceCapability): number {
  return Math.max(
    0,
    ...device.gpus.map((gpu) => gpu.dedicatedMemoryBytes ?? 0)
  );
}

function sumLeasedMemoryBytes(activeLeases: ActiveLease[]): number {
  return activeLeases.reduce(
    (total, lease) => total + (lease.request.minMemoryBytes ?? 0),
    0
  );
}

function sumLeasedVramBytes(activeLeases: ActiveLease[]): number {
  return activeLeases.reduce(
    (total, lease) => total + (lease.request.minVramBytes ?? 0),
    0
  );
}

function usesGpu(lease: ActiveLease): boolean {
  return (
    lease.request.exclusiveGpu === true ||
    (lease.request.minVramBytes ?? 0) > 0
  );
}
