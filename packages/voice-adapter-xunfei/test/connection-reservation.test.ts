import { describe, expect, it } from "vitest";
import {
  XunfeiConnectionReservation,
  type XunfeiReservationScheduler
} from "../src";

class FakeScheduler implements XunfeiReservationScheduler {
  private nowMs = 0;
  private nextId = 1;
  private readonly timers = new Map<
    number,
    { callback: () => void; dueAt: number }
  >();

  public setTimeout(callback: () => void, delayMs: number): unknown {
    const id = this.nextId++;
    this.timers.set(id, {
      callback,
      dueAt: this.nowMs + delayMs
    });
    return id;
  }

  public clearTimeout(handle: unknown): void {
    this.timers.delete(Number(handle));
  }

  public advanceBy(delayMs: number): void {
    this.nowMs += delayMs;
    const due = [...this.timers.entries()]
      .filter(([, timer]) => timer.dueAt <= this.nowMs)
      .sort((left, right) => left[1].dueAt - right[1].dueAt);
    for (const [id, timer] of due) {
      this.timers.delete(id);
      timer.callback();
    }
  }
}

function createHarness() {
  const scheduler = new FakeScheduler();
  const closed: number[] = [];
  let connectionCount = 0;
  const reservation = new XunfeiConnectionReservation({
    connect: async () => ({ id: ++connectionCount }),
    close: async (connection) => {
      closed.push(connection.id);
    },
    scheduler
  });
  return {
    closed,
    getConnectionCount: () => connectionCount,
    reservation,
    scheduler
  };
}

describe("XunfeiConnectionReservation", () => {
  it("shares one connection across concurrent and repeated acquisitions", async () => {
    const harness = createHarness();

    const [first, second] = await Promise.all([
      harness.reservation.acquire(),
      harness.reservation.acquire()
    ]);
    const third = await harness.reservation.acquire();

    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(harness.getConnectionCount()).toBe(1);
  });

  it("keeps the connection for 30 seconds and cancels release on reuse", async () => {
    const harness = createHarness();
    const first = await harness.reservation.acquire();

    expect(harness.reservation.releaseWhenIdle()).toBe(true);
    harness.scheduler.advanceBy(29_999);
    expect(harness.closed).toEqual([]);

    expect(await harness.reservation.acquire()).toBe(first);
    harness.scheduler.advanceBy(1);
    expect(harness.closed).toEqual([]);

    harness.reservation.releaseWhenIdle();
    harness.scheduler.advanceBy(30_000);
    await Promise.resolve();
    expect(harness.closed).toEqual([1]);
  });

  it("creates a fresh connection after the idle reservation closes", async () => {
    const harness = createHarness();
    await harness.reservation.acquire();
    harness.reservation.releaseWhenIdle();
    harness.scheduler.advanceBy(30_000);
    await Promise.resolve();

    const replacement = await harness.reservation.acquire();

    expect(replacement.id).toBe(2);
    expect(harness.getConnectionCount()).toBe(2);
  });

  it("disposes the reserved resource once and rejects later acquisition", async () => {
    const harness = createHarness();
    await harness.reservation.acquire();

    expect(await harness.reservation.dispose()).toBe(true);
    expect(await harness.reservation.dispose()).toBe(false);
    expect(harness.closed).toEqual([1]);
    await expect(harness.reservation.acquire()).rejects.toThrow("disposed");
  });
});
