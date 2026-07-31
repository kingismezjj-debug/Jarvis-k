import {
  type CoreVoiceAudioMessage,
  type VoiceAudioFrame,
  VoiceAudioFrameSchema
} from "@jarvis-k/contracts";

export type VoiceAudioEnqueueResult =
  | { accepted: true }
  | {
      accepted: false;
      reason:
        | "invalid-frame"
        | "backpressure"
        | "stale-capture"
        | "stale-sequence";
    };

export interface BoundedVoiceAudioQueueOptions {
  maxFrames: number;
  maxBytes: number;
  send(
    message: CoreVoiceAudioMessage,
    onComplete: (error?: Error | null) => void
  ): void;
  onSendError?: (error: Error) => void;
}

export class BoundedVoiceAudioQueue {
  private readonly pending: VoiceAudioFrame[] = [];
  private readonly retiredCaptureIds = new Set<string>();
  private readonly retiredCaptureOrder: string[] = [];
  private activeCaptureId: string | undefined;
  private lastSequenceId = -1;
  private inFlight:
    | { frame: VoiceAudioFrame; generation: number }
    | undefined;
  private outstandingFrames = 0;
  private outstandingBytes = 0;
  private generation = 0;

  public constructor(private readonly options: BoundedVoiceAudioQueueOptions) {
    if (options.maxFrames <= 0 || options.maxBytes <= 0) {
      throw new RangeError("Audio queue limits must be positive.");
    }
  }

  public enqueue(rawFrame: unknown): VoiceAudioEnqueueResult {
    const parsed = VoiceAudioFrameSchema.safeParse(rawFrame);
    if (!parsed.success) {
      return { accepted: false, reason: "invalid-frame" };
    }
    const frame = parsed.data;
    const captureResult = this.acceptCapture(frame);
    if (captureResult) {
      return captureResult;
    }
    if (frame.metadata.sequenceId <= this.lastSequenceId) {
      return { accepted: false, reason: "stale-sequence" };
    }
    if (
      this.outstandingFrames >= this.options.maxFrames ||
      this.outstandingBytes + frame.pcm.byteLength > this.options.maxBytes
    ) {
      return { accepted: false, reason: "backpressure" };
    }

    this.lastSequenceId = frame.metadata.sequenceId;
    this.pending.push(frame);
    this.outstandingFrames += 1;
    this.outstandingBytes += frame.pcm.byteLength;
    this.pump();
    return { accepted: true };
  }

  public reset(): void {
    this.generation += 1;
    this.pending.length = 0;
    this.inFlight = undefined;
    this.outstandingFrames = 0;
    this.outstandingBytes = 0;
    this.activeCaptureId = undefined;
    this.lastSequenceId = -1;
    this.retiredCaptureIds.clear();
    this.retiredCaptureOrder.length = 0;
  }

  public getStats(): {
    outstandingFrames: number;
    outstandingBytes: number;
    queuedFrames: number;
    inFlight: boolean;
  } {
    return {
      outstandingFrames: this.outstandingFrames,
      outstandingBytes: this.outstandingBytes,
      queuedFrames: this.pending.length,
      inFlight: Boolean(this.inFlight)
    };
  }

  private acceptCapture(
    frame: VoiceAudioFrame
  ): VoiceAudioEnqueueResult | undefined {
    const { captureId, sequenceId } = frame.metadata;
    if (captureId === this.activeCaptureId) {
      return undefined;
    }
    if (
      this.retiredCaptureIds.has(captureId) ||
      sequenceId !== 0
    ) {
      return { accepted: false, reason: "stale-capture" };
    }

    if (this.activeCaptureId) {
      this.retireCapture(this.activeCaptureId);
      for (const queuedFrame of this.pending) {
        this.outstandingFrames -= 1;
        this.outstandingBytes -= queuedFrame.pcm.byteLength;
      }
      this.pending.length = 0;
    }
    this.activeCaptureId = captureId;
    this.lastSequenceId = -1;
    return undefined;
  }

  private retireCapture(captureId: string): void {
    this.retiredCaptureIds.add(captureId);
    this.retiredCaptureOrder.push(captureId);
    if (this.retiredCaptureOrder.length > 32) {
      const oldest = this.retiredCaptureOrder.shift();
      if (oldest) {
        this.retiredCaptureIds.delete(oldest);
      }
    }
  }

  private pump(): void {
    if (this.inFlight) {
      return;
    }
    const frame = this.pending.shift();
    if (!frame) {
      return;
    }

    const generation = this.generation;
    this.inFlight = { frame, generation };
    let completed = false;
    const onComplete = (error?: Error | null) => {
      if (completed) {
        return;
      }
      completed = true;
      if (generation !== this.generation) {
        return;
      }
      this.inFlight = undefined;
      this.outstandingFrames -= 1;
      this.outstandingBytes -= frame.pcm.byteLength;
      if (error) {
        this.options.onSendError?.(error);
      }
      this.pump();
    };

    try {
      this.options.send(
        {
          kind: "voice-audio",
          frame
        },
        onComplete
      );
    } catch (error) {
      onComplete(
        error instanceof Error ? error : new Error("Audio IPC send failed.")
      );
    }
  }
}
