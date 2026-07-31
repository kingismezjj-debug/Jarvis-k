import { describe, expect, it } from "vitest";
import {
  BoundedVoiceAudioQueue,
  type BoundedVoiceAudioQueueOptions
} from "../src/audio-transport";

function createFrame(
  captureId: string,
  sequenceId: number,
  byteLength = 4
) {
  return {
    metadata: {
      captureId,
      sequenceId,
      capturedAt: "2026-07-29T00:00:00.000Z",
      sampleRate: 16_000 as const,
      channels: 1 as const,
      encoding: "pcm_s16le" as const,
      byteLength
    },
    pcm: new Uint8Array(byteLength)
  };
}

function createHarness(
  limits: Pick<BoundedVoiceAudioQueueOptions, "maxFrames" | "maxBytes">
) {
  const sent: ReturnType<typeof createFrame>[] = [];
  const completions: Array<(error?: Error | null) => void> = [];
  const queue = new BoundedVoiceAudioQueue({
    ...limits,
    send: (message, onComplete) => {
      sent.push(message.frame);
      completions.push(onComplete);
    }
  });
  return { completions, queue, sent };
}

describe("BoundedVoiceAudioQueue", () => {
  it("keeps one child IPC send in flight and preserves frame order", () => {
    const harness = createHarness({ maxFrames: 4, maxBytes: 64 });

    expect(harness.queue.enqueue(createFrame("capture-1", 0))).toEqual({
      accepted: true
    });
    expect(harness.queue.enqueue(createFrame("capture-1", 1))).toEqual({
      accepted: true
    });
    expect(harness.sent.map((frame) => frame.metadata.sequenceId)).toEqual([
      0
    ]);

    harness.completions[0]?.();

    expect(harness.sent.map((frame) => frame.metadata.sequenceId)).toEqual([
      0,
      1
    ]);
  });

  it("enforces frame and byte backpressure limits", () => {
    const harness = createHarness({ maxFrames: 2, maxBytes: 8 });

    expect(harness.queue.enqueue(createFrame("capture-1", 0))).toEqual({
      accepted: true
    });
    expect(harness.queue.enqueue(createFrame("capture-1", 1))).toEqual({
      accepted: true
    });
    expect(harness.queue.enqueue(createFrame("capture-1", 2))).toEqual({
      accepted: false,
      reason: "backpressure"
    });
    expect(harness.queue.getStats()).toMatchObject({
      outstandingFrames: 2,
      outstandingBytes: 8
    });
  });

  it("rejects stale sequences and frames from retired captures", () => {
    const harness = createHarness({ maxFrames: 4, maxBytes: 64 });

    harness.queue.enqueue(createFrame("capture-1", 0));
    harness.queue.enqueue(createFrame("capture-1", 1));
    expect(harness.queue.enqueue(createFrame("capture-1", 1))).toEqual({
      accepted: false,
      reason: "stale-sequence"
    });

    expect(harness.queue.enqueue(createFrame("capture-2", 0))).toEqual({
      accepted: true
    });
    expect(harness.queue.enqueue(createFrame("capture-1", 2))).toEqual({
      accepted: false,
      reason: "stale-capture"
    });
    expect(harness.queue.getStats().queuedFrames).toBe(1);

    harness.completions[0]?.();
    expect(harness.sent.at(-1)?.metadata.captureId).toBe("capture-2");
  });

  it("drops restart-era frames and ignores their late send callbacks", () => {
    const harness = createHarness({ maxFrames: 2, maxBytes: 8 });

    harness.queue.enqueue(createFrame("capture-1", 0));
    harness.queue.enqueue(createFrame("capture-1", 1));
    harness.queue.reset();

    expect(harness.queue.getStats()).toEqual({
      outstandingFrames: 0,
      outstandingBytes: 0,
      queuedFrames: 0,
      inFlight: false
    });
    expect(harness.queue.enqueue(createFrame("capture-2", 0))).toEqual({
      accepted: true
    });

    harness.completions[0]?.();
    expect(harness.queue.getStats()).toMatchObject({
      outstandingFrames: 1,
      inFlight: true
    });
  });
});
