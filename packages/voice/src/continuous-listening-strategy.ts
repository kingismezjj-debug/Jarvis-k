import type { Scheduler } from "./ports";

export type ContinuousListeningState =
  | "inactive"
  | "listening"
  | "suspended"
  | "recovering"
  | "ptt-overlay";

export type ContinuousAudioDecision =
  | "upload"
  | "drop-inactive"
  | "drop-suspended"
  | "drop-capture-mismatch";

export interface ContinuousListeningStrategyOptions {
  scheduler: Scheduler;
  onInactivity(): void;
  inactivityMs?: number;
}

const DEFAULT_INACTIVITY_MS = 15_000;

export class ContinuousListeningStrategy {
  private state: ContinuousListeningState = "inactive";
  private captureId: string | undefined;
  private inactivityTimer: unknown;

  public constructor(
    private readonly options: ContinuousListeningStrategyOptions
  ) {
    if ((options.inactivityMs ?? DEFAULT_INACTIVITY_MS) <= 0) {
      throw new RangeError(
        "Continuous listening inactivity delay must be positive."
      );
    }
  }

  public activate(captureId: string): boolean {
    if (!captureId.trim()) {
      throw new Error("Continuous listening requires a capture ID.");
    }
    if (this.state !== "inactive") {
      return false;
    }

    this.captureId = captureId;
    this.state = "listening";
    this.scheduleInactivity();
    return true;
  }

  public decideAudio(captureId: string): ContinuousAudioDecision {
    if (this.state === "inactive" || !this.captureId) {
      return "drop-inactive";
    }
    if (captureId !== this.captureId) {
      return "drop-capture-mismatch";
    }
    if (this.state === "suspended") {
      return "drop-suspended";
    }

    if (this.state === "listening") {
      this.scheduleInactivity();
    }
    return "upload";
  }

  public suspendForTts(): boolean {
    if (this.state !== "listening" && this.state !== "recovering") {
      return false;
    }
    this.clearInactivity();
    this.state = "suspended";
    return true;
  }

  public beginPttOverlay(): boolean {
    if (this.state !== "listening") {
      return false;
    }
    this.clearInactivity();
    this.state = "ptt-overlay";
    return true;
  }

  public resumeAfterPttOverlay(): boolean {
    if (this.state !== "ptt-overlay") {
      return false;
    }
    this.state = "listening";
    this.scheduleInactivity();
    return true;
  }

  public resumeAfterTts(): boolean {
    if (this.state !== "suspended") {
      return false;
    }
    this.state = "listening";
    this.scheduleInactivity();
    return true;
  }

  public markRecovered(): boolean {
    if (this.state !== "recovering") {
      return false;
    }
    this.state = "listening";
    this.scheduleInactivity();
    return true;
  }

  public deactivate(): boolean {
    if (this.state === "inactive") {
      return false;
    }
    this.clearInactivity();
    this.state = "inactive";
    this.captureId = undefined;
    return true;
  }

  public getSnapshot(): {
    state: ContinuousListeningState;
    captureId?: string;
  } {
    return {
      state: this.state,
      ...(this.captureId ? { captureId: this.captureId } : {})
    };
  }

  private scheduleInactivity(): void {
    this.clearInactivity();
    this.inactivityTimer = this.options.scheduler.setTimeout(() => {
      this.inactivityTimer = undefined;
      if (this.state !== "listening") {
        return;
      }
      this.state = "recovering";
      this.options.onInactivity();
    }, this.options.inactivityMs ?? DEFAULT_INACTIVITY_MS);
  }

  private clearInactivity(): void {
    if (this.inactivityTimer === undefined) {
      return;
    }
    this.options.scheduler.clearTimeout(this.inactivityTimer);
    this.inactivityTimer = undefined;
  }
}
