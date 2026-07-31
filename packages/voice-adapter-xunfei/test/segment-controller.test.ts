import { describe, expect, it } from "vitest";
import {
  XunfeiSegmentController,
  type XunfeiSegmentScheduler
} from "../src";

class FakeScheduler implements XunfeiSegmentScheduler {
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
    const target = this.nowMs + delayMs;
    while (true) {
      const next = [...this.timers.entries()]
        .filter(([, timer]) => timer.dueAt <= target)
        .sort((left, right) => left[1].dueAt - right[1].dueAt)[0];
      if (!next) {
        break;
      }
      const [id, timer] = next;
      this.nowMs = timer.dueAt;
      this.timers.delete(id);
      timer.callback();
    }
    this.nowMs = target;
  }
}

function createHarness() {
  const scheduler = new FakeScheduler();
  const silenceFrames: Uint8Array[] = [];
  const transcripts: Array<{
    text: string;
    isFinal: boolean;
    segmentId?: string;
  }> = [];
  const controller = new XunfeiSegmentController({
    scheduler,
    sendSilence: (frame) => silenceFrames.push(frame),
    publishTranscript: (update) => transcripts.push(update)
  });
  return { controller, scheduler, silenceFrames, transcripts };
}

describe("XunfeiSegmentController", () => {
  it("sends a bounded 20-frame silence tail for segment finalization", async () => {
    const harness = createHarness();
    harness.controller.beginSegment();

    const finalizing = harness.controller.finalizeSegment();
    harness.scheduler.advanceBy(760);

    expect(harness.silenceFrames).toHaveLength(20);
    expect(
      harness.silenceFrames.every((frame) => frame.byteLength === 1_280)
    ).toBe(true);
    harness.scheduler.advanceBy(1_740);
    await finalizing;
  });

  it("completes early when a final provider result arrives", async () => {
    const harness = createHarness();
    harness.controller.beginSegment();
    const finalizing = harness.controller.finalizeSegment();

    harness.controller.handleTranscript({
      text: "complete",
      isFinal: true,
      segmentId: "segment-1"
    });

    await finalizing;
    expect(harness.controller.getState().finalizing).toBe(false);
    expect(harness.transcripts).toEqual([
      {
        text: "complete",
        isFinal: true,
        segmentId: "segment-1"
      }
    ]);
  });

  it("promotes stable partial text to a final result", async () => {
    const harness = createHarness();
    harness.controller.beginSegment();
    harness.controller.handleTranscript({
      text: "stable text",
      isFinal: false,
      segmentId: "segment-2"
    });
    const finalizing = harness.controller.finalizeSegment();

    harness.scheduler.advanceBy(600);
    await finalizing;

    expect(harness.transcripts.at(-1)).toEqual({
      text: "stable text",
      isFinal: true,
      segmentId: "segment-2"
    });
  });

  it("suppresses duplicate final results across repeated PTT cycles", async () => {
    const harness = createHarness();
    harness.controller.beginSegment();
    harness.controller.handleTranscript({
      text: "same result",
      isFinal: true,
      segmentId: "segment-3"
    });
    await harness.controller.finalizeSegment();

    harness.controller.beginSegment();
    expect(
      harness.controller.handleTranscript({
        text: "same result",
        isFinal: true,
        segmentId: "segment-3"
      })
    ).toBe(false);

    expect(harness.transcripts).toHaveLength(1);
  });
});
