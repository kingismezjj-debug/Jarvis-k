import { describe, expect, it } from "vitest";
import {
  BrowserCaptureController,
  type BrowserAudioSamples,
  type BrowserCaptureSessionPort,
  convertFloat32ToPcm16
} from "../src";

class FakeCaptureSession implements BrowserCaptureSessionPort {
  public suspendCount = 0;
  public resumeCount = 0;
  public stopCount = 0;

  public async suspend(): Promise<void> {
    this.suspendCount += 1;
  }

  public async resume(): Promise<void> {
    this.resumeCount += 1;
  }

  public async stop(): Promise<void> {
    this.stopCount += 1;
  }
}

function createHarness() {
  const session = new FakeCaptureSession();
  const frames: Array<{
    byteLength: number;
    diagnostics: { peak: number; rms: number };
    sequenceId: number;
    pcm: number[];
  }> = [];
  let onSamples: ((samples: BrowserAudioSamples) => void) | undefined;
  let startCount = 0;
  const controller = new BrowserCaptureController({
    backend: {
      start: async (listener) => {
        startCount += 1;
        onSamples = listener;
        return session;
      }
    },
    frameSink: (frame) => {
      frames.push({
        byteLength: frame.metadata.byteLength,
        diagnostics: frame.diagnostics,
        sequenceId: frame.metadata.sequenceId,
        pcm: Array.from(frame.pcm)
      });
    },
    clock: {
      now: () => new Date("2026-07-29T00:00:00.000Z")
    }
  });

  return {
    controller,
    emit: (samples: BrowserAudioSamples) => onSamples?.(samples),
    frames,
    getStartCount: () => startCount,
    session
  };
}

describe("browser voice capture", () => {
  it("converts and downsamples Float32 audio to 16 kHz PCM16", () => {
    const pcm = convertFloat32ToPcm16(
      new Float32Array([1, 1, 1, -1, -1, -1]),
      48_000
    );

    expect(Array.from(pcm)).toEqual([32_767, -32_768]);
  });

  it("owns one capture session and emits ordered metadata", async () => {
    const harness = createHarness();

    expect(
      await harness.controller.start({ captureId: "capture-1" })
    ).toBe(true);
    expect(
      await harness.controller.start({ captureId: "capture-1" })
    ).toBe(false);
    expect(harness.getStartCount()).toBe(1);

    harness.emit({
      samples: new Float32Array(1_920).fill(0.5),
      sampleRate: 48_000
    });
    harness.emit({
      samples: new Float32Array(1_920).fill(-0.5),
      sampleRate: 48_000
    });

    expect(harness.frames.map((frame) => frame.sequenceId)).toEqual([0, 1]);
    expect(harness.frames[0]?.byteLength).toBe(1_280);
    expect(harness.frames[0]?.pcm).toHaveLength(640);
    expect(harness.frames[0]?.pcm[0]).toBe(16_384);
    expect(harness.frames[0]?.diagnostics.peak).toBeCloseTo(0.5, 3);
    expect(harness.frames[1]?.pcm[0]).toBe(-16_384);
  });

  it("flushes a partial aggregated PCM frame when capture stops", async () => {
    const harness = createHarness();
    await harness.controller.start({ captureId: "capture-1" });

    harness.emit({
      samples: new Float32Array(960).fill(0.25),
      sampleRate: 48_000
    });
    expect(harness.frames).toHaveLength(0);

    await harness.controller.stop();

    expect(harness.frames).toHaveLength(1);
    expect(harness.frames[0]?.sequenceId).toBe(0);
    expect(harness.frames[0]?.byteLength).toBe(640);
    expect(harness.frames[0]?.pcm).toHaveLength(320);
    expect(harness.frames[0]?.diagnostics.rms).toBeCloseTo(0.25, 3);
  });

  it("suspends, resumes, and releases the capture resource", async () => {
    const { controller, session } = createHarness();
    await controller.start({ captureId: "capture-1" });

    expect(await controller.suspend()).toBe(true);
    expect(await controller.suspend()).toBe(false);
    expect(await controller.resume()).toBe(true);
    expect(await controller.stop()).toBe(true);
    expect(await controller.stop()).toBe(false);

    expect(session.suspendCount).toBe(1);
    expect(session.resumeCount).toBe(1);
    expect(session.stopCount).toBe(1);
    expect(controller.getState()).toBe("idle");
  });

  it("disposes once and rejects later capture starts", async () => {
    const { controller, session } = createHarness();
    await controller.start({ captureId: "capture-1" });

    expect(await controller.dispose()).toBe(true);
    expect(await controller.dispose()).toBe(false);
    expect(session.stopCount).toBe(1);
    await expect(
      controller.start({ captureId: "capture-2" })
    ).rejects.toThrow("disposed");
  });
});
