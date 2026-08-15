import { describe, expect, it, vi } from "vitest";
import {
  disposeCoreHostResources,
  hydrateCoreHostAndAnnounceReady,
} from "../src/host/core-host-bootstrap";

describe("core-host bootstrap", () => {
  it("announces ready only after hydrate steps settle", async () => {
    const order: string[] = [];
    const runtime = {
      hydrateMemory: vi.fn(async () => {
        order.push("memory");
      }),
      hydrateTasks: vi.fn(async () => {
        order.push("tasks");
      }),
      hydrateCapabilities: vi.fn(async () => {
        order.push("capabilities");
      }),
      announceReady: vi.fn(() => {
        order.push("ready");
      }),
    };

    await hydrateCoreHostAndAnnounceReady({
      runtime,
      hydrateMemory: true,
    });

    expect(order.at(-1)).toBe("ready");
    expect(order.slice(0, -1).sort()).toEqual([
      "capabilities",
      "memory",
      "tasks",
    ]);
  });

  it("skips memory hydration when memory is disabled", async () => {
    const runtime = {
      hydrateMemory: vi.fn(async () => undefined),
      hydrateTasks: vi.fn(async () => undefined),
      hydrateCapabilities: vi.fn(async () => undefined),
      announceReady: vi.fn(),
    };

    await hydrateCoreHostAndAnnounceReady({
      runtime,
      hydrateMemory: false,
    });

    expect(runtime.hydrateMemory).not.toHaveBeenCalled();
    expect(runtime.hydrateTasks).toHaveBeenCalledTimes(1);
    expect(runtime.hydrateCapabilities).toHaveBeenCalledTimes(1);
    expect(runtime.announceReady).toHaveBeenCalledTimes(1);
  });

  it("announces ready even when hydration fails", async () => {
    const runtime = {
      hydrateMemory: vi.fn(async () => undefined),
      hydrateTasks: vi.fn(async () => {
        throw new Error("hydrate task failure");
      }),
      hydrateCapabilities: vi.fn(async () => undefined),
      announceReady: vi.fn(),
    };

    await expect(
      hydrateCoreHostAndAnnounceReady({
        runtime,
        hydrateMemory: true,
      }),
    ).rejects.toThrow("hydrate task failure");
    expect(runtime.announceReady).toHaveBeenCalledTimes(1);
  });

  it("disposes resources in order using dispose before close", async () => {
    const order: string[] = [];
    await disposeCoreHostResources([
      {
        dispose: vi.fn(async () => {
          order.push("dispose-first");
        }),
        close: vi.fn(async () => {
          order.push("close-first");
        }),
      },
      {
        close: vi.fn(async () => {
          order.push("close-second");
        }),
      },
    ]);

    expect(order).toEqual(["dispose-first", "close-second"]);
  });
});
