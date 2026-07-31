import type { AsrTranscriptUpdate } from "@jarvis-k/voice";

export interface XunfeiSegmentScheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface XunfeiSegmentControllerOptions {
  scheduler: XunfeiSegmentScheduler;
  sendSilence(frame: Uint8Array): void;
  publishTranscript(update: AsrTranscriptUpdate): void;
  silenceFrameBytes?: number;
  silenceFrameCount?: number;
  silenceIntervalMs?: number;
  stableResultMs?: number;
  finalizationTimeoutMs?: number;
}

const DEFAULT_SILENCE_FRAME_BYTES = 1_280;
const DEFAULT_SILENCE_FRAME_COUNT = 20;
const DEFAULT_SILENCE_INTERVAL_MS = 40;
const DEFAULT_STABLE_RESULT_MS = 600;
const DEFAULT_FINALIZATION_TIMEOUT_MS = 2_500;

export class XunfeiSegmentController {
  private readonly finalResultKeys = new Set<string>();
  private readonly finalResultOrder: string[] = [];
  private active = false;
  private finalizing = false;
  private currentFinalText: string | undefined;
  private latestTranscript: AsrTranscriptUpdate | undefined;
  private silenceTimer: unknown;
  private stableTimer: unknown;
  private finalizationTimer: unknown;
  private finalizePromise: Promise<void> | undefined;
  private resolveFinalize: (() => void) | undefined;

  public constructor(
    private readonly options: XunfeiSegmentControllerOptions
  ) {}

  public beginSegment(): boolean {
    if (this.active || this.finalizing) {
      return false;
    }
    this.active = true;
    this.currentFinalText = undefined;
    this.latestTranscript = undefined;
    return true;
  }

  public handleTranscript(update: AsrTranscriptUpdate): boolean {
    if (!this.active && !this.finalizing) {
      return false;
    }
    if (update.isFinal && this.isDuplicateFinal(update)) {
      return false;
    }

    if (update.isFinal) {
      this.rememberFinal(update);
      this.currentFinalText = update.text;
    }
    this.latestTranscript = update;
    this.options.publishTranscript(update);

    if (this.finalizing) {
      if (update.isFinal) {
        this.completeFinalization();
      } else {
        this.scheduleStableResult();
      }
    }
    return true;
  }

  public finalizeSegment(): Promise<void> {
    if (this.finalizePromise) {
      return this.finalizePromise;
    }
    if (!this.active) {
      return Promise.resolve();
    }

    this.active = false;
    if (this.latestTranscript?.isFinal) {
      return Promise.resolve();
    }
    this.finalizing = true;
    this.finalizePromise = new Promise((resolve) => {
      this.resolveFinalize = resolve;
    });
    this.sendSilenceFrame(0);
    if (this.latestTranscript && !this.latestTranscript.isFinal) {
      this.scheduleStableResult();
    }
    this.finalizationTimer = this.options.scheduler.setTimeout(
      () => this.publishSyntheticFinal(),
      this.options.finalizationTimeoutMs ??
        DEFAULT_FINALIZATION_TIMEOUT_MS
    );
    return this.finalizePromise;
  }

  public cancelSegment(): boolean {
    if (!this.active && !this.finalizing) {
      return false;
    }
    this.active = false;
    this.completeFinalization();
    this.latestTranscript = undefined;
    this.currentFinalText = undefined;
    return true;
  }

  public getState(): {
    active: boolean;
    finalizing: boolean;
  } {
    return {
      active: this.active,
      finalizing: this.finalizing
    };
  }

  private sendSilenceFrame(sentCount: number): void {
    if (!this.finalizing) {
      return;
    }
    const frameCount =
      this.options.silenceFrameCount ?? DEFAULT_SILENCE_FRAME_COUNT;
    if (sentCount >= frameCount) {
      return;
    }

    this.options.sendSilence(
      new Uint8Array(
        this.options.silenceFrameBytes ?? DEFAULT_SILENCE_FRAME_BYTES
      )
    );
    if (sentCount + 1 < frameCount) {
      this.silenceTimer = this.options.scheduler.setTimeout(
        () => this.sendSilenceFrame(sentCount + 1),
        this.options.silenceIntervalMs ?? DEFAULT_SILENCE_INTERVAL_MS
      );
    }
  }

  private scheduleStableResult(): void {
    if (this.stableTimer !== undefined) {
      this.options.scheduler.clearTimeout(this.stableTimer);
    }
    this.stableTimer = this.options.scheduler.setTimeout(
      () => {
        this.stableTimer = undefined;
        this.publishSyntheticFinal();
      },
      this.options.stableResultMs ?? DEFAULT_STABLE_RESULT_MS
    );
  }

  private publishSyntheticFinal(): void {
    if (!this.finalizing) {
      return;
    }
    const latest = this.latestTranscript;
    const syntheticFinal: AsrTranscriptUpdate = {
      text: latest?.text ?? "",
      isFinal: true,
      ...(latest?.segmentId ? { segmentId: latest.segmentId } : {})
    };
    if (!this.isDuplicateFinal(syntheticFinal)) {
      this.rememberFinal(syntheticFinal);
      this.currentFinalText = syntheticFinal.text;
      this.options.publishTranscript(syntheticFinal);
    }
    this.completeFinalization();
  }

  private completeFinalization(): void {
    this.clearTimers();
    this.finalizing = false;
    const resolve = this.resolveFinalize;
    this.resolveFinalize = undefined;
    this.finalizePromise = undefined;
    resolve?.();
  }

  private clearTimers(): void {
    for (const handle of [
      this.silenceTimer,
      this.stableTimer,
      this.finalizationTimer
    ]) {
      if (handle !== undefined) {
        this.options.scheduler.clearTimeout(handle);
      }
    }
    this.silenceTimer = undefined;
    this.stableTimer = undefined;
    this.finalizationTimer = undefined;
  }

  private isDuplicateFinal(update: AsrTranscriptUpdate): boolean {
    if (!update.isFinal) {
      return false;
    }
    if (update.segmentId) {
      return this.finalResultKeys.has(finalKey(update));
    }
    return this.currentFinalText === update.text;
  }

  private rememberFinal(update: AsrTranscriptUpdate): void {
    if (!update.segmentId) {
      return;
    }
    const key = finalKey(update);
    if (this.finalResultKeys.has(key)) {
      return;
    }
    this.finalResultKeys.add(key);
    this.finalResultOrder.push(key);
    if (this.finalResultOrder.length > 64) {
      const oldest = this.finalResultOrder.shift();
      if (oldest) {
        this.finalResultKeys.delete(oldest);
      }
    }
  }
}

function finalKey(update: AsrTranscriptUpdate): string {
  return `${update.segmentId ?? ""}\u0000${update.text}`;
}
