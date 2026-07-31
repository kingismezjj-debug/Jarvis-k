import { describe, expect, it, vi } from "vitest";
import {
  ContinuousListeningStrategy,
  type Scheduler
} from "../src";

class FakeScheduler implements Scheduler {
  private nextId = 1;
  private readonly timers = new Map<number, () => void>();

  public setTimeout(callback: () => void): unknown {
    const id = this.nextId++;
    this.timers.set(id, callback);
    return id;
  }

  public clearTimeout(handle: unknown): void {
    this.timers.delete(Number(handle));
  }

  public runAll(): void {
    for (const [id, callback] of [...this.timers]) {
      this.timers.delete(id);
      callback();
    }
  }

  public getTimerCount(): number {
    return this.timers.size;
  }
}

function createHarness() {
  const scheduler = new FakeScheduler();
  const onInactivity = vi.fn();
  const strategy = new ContinuousListeningStrategy({
    scheduler,
    onInactivity,
    inactivityMs: 1_000
  });
  return { onInactivity, scheduler, strategy };
}

describe("ContinuousListeningStrategy", () => {
  it("owns one deterministic continuous capture policy", () => {
    const { scheduler, strategy } = createHarness();

    expect(strategy.activate("capture-continuous")).toBe(true);
    expect(strategy.activate("capture-duplicate")).toBe(false);
    expect(scheduler.getTimerCount()).toBe(1);
    expect(strategy.decideAudio("capture-stale")).toBe(
      "drop-capture-mismatch"
    );
    expect(strategy.decideAudio("capture-continuous")).toBe("upload");
    expect(scheduler.getTimerCount()).toBe(1);
    expect(strategy.getSnapshot()).toEqual({
      state: "listening",
      captureId: "capture-continuous"
    });
  });

  it("suspends upload for TTS and resumes the same capture", () => {
    const { scheduler, strategy } = createHarness();

    strategy.activate("capture-continuous");
    expect(strategy.suspendForTts()).toBe(true);
    expect(scheduler.getTimerCount()).toBe(0);
    expect(strategy.decideAudio("capture-continuous")).toBe(
      "drop-suspended"
    );

    expect(strategy.resumeAfterTts()).toBe(true);
    expect(strategy.decideAudio("capture-continuous")).toBe("upload");
    expect(strategy.getSnapshot()).toEqual({
      state: "listening",
      captureId: "capture-continuous"
    });
  });

  it("signals inactivity once and waits for explicit recovery", () => {
    const { onInactivity, scheduler, strategy } = createHarness();

    strategy.activate("capture-continuous");
    scheduler.runAll();
    scheduler.runAll();

    expect(onInactivity).toHaveBeenCalledTimes(1);
    expect(strategy.getSnapshot().state).toBe("recovering");
    expect(strategy.decideAudio("capture-continuous")).toBe("upload");

    expect(strategy.markRecovered()).toBe(true);
    expect(strategy.getSnapshot().state).toBe("listening");
    expect(scheduler.getTimerCount()).toBe(1);
  });

  it("pauses inactivity policy for a PTT overlay and restores listening", () => {
    const { scheduler, strategy } = createHarness();

    strategy.activate("capture-continuous");
    expect(strategy.beginPttOverlay()).toBe(true);
    expect(strategy.getSnapshot().state).toBe("ptt-overlay");
    expect(scheduler.getTimerCount()).toBe(0);
    expect(strategy.decideAudio("capture-continuous")).toBe("upload");

    expect(strategy.resumeAfterPttOverlay()).toBe(true);
    expect(strategy.getSnapshot().state).toBe("listening");
    expect(scheduler.getTimerCount()).toBe(1);
  });

  it("deactivates without retaining timers or capture identity", () => {
    const { onInactivity, scheduler, strategy } = createHarness();

    strategy.activate("capture-continuous");
    expect(strategy.deactivate()).toBe(true);
    scheduler.runAll();

    expect(onInactivity).not.toHaveBeenCalled();
    expect(strategy.decideAudio("capture-continuous")).toBe(
      "drop-inactive"
    );
    expect(strategy.getSnapshot()).toEqual({ state: "inactive" });
  });
});
