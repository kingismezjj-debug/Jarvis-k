import type { AppCommand } from "@jarvis-k/contracts";

export type PttCaptureState =
  | "idle"
  | "starting"
  | "recording"
  | "stopping"
  | "disposed";

export type PttStopReason =
  | "release"
  | "window-blur"
  | "user-cancel"
  | "capture-error"
  | "shutdown";

export type PttStartFailureReason =
  | "interrupted"
  | "microphone-unavailable"
  | "voice-mode-unavailable"
  | "voice-session-unavailable";

export interface PttCommandError {
  code: string;
  message: string;
  retryable?: boolean;
  details?: unknown;
}

export type PttCommandResult =
  | { ok: true }
  | { ok: false; error?: PttCommandError };

export interface PttCapturePort {
  start(options: { captureId: string }): Promise<boolean>;
  stop(): Promise<boolean>;
  dispose(): Promise<boolean>;
}

export interface PttCaptureCoordinatorOptions {
  capture: PttCapturePort;
  sendCommand(command: AppCommand): Promise<PttCommandResult>;
  createCaptureId(): string;
  onStartFailure?(
    reason: PttStartFailureReason,
    error?: PttCommandError
  ): void;
  onCommandFailure?(error?: PttCommandError): void;
  onStateChange?(state: PttCaptureState): void;
}

export class PttCaptureCoordinator {
  private state: PttCaptureState = "idle";
  private captureId: string | undefined;
  private operationId = 0;

  public constructor(
    private readonly options: PttCaptureCoordinatorOptions
  ) {}

  public getState(): PttCaptureState {
    return this.state;
  }

  public async start(): Promise<boolean> {
    if (this.state !== "idle") {
      return false;
    }

    const operationId = ++this.operationId;
    const captureId = this.options.createCaptureId();
    this.captureId = captureId;
    this.setState("starting");

    try {
      const started = await this.options.capture.start({ captureId });
      if (!started || operationId !== this.operationId) {
        this.options.onStartFailure?.(
          operationId !== this.operationId ? "interrupted" : "microphone-unavailable"
        );
        await this.cancelStart(operationId, "capture-error");
        return false;
      }

      const modeResult = await this.options.sendCommand({
        type: "voice.setMode",
        payload: { mode: "ptt" }
      });
      if (!modeResult.ok || operationId !== this.operationId) {
        this.options.onStartFailure?.(
          operationId !== this.operationId
            ? "interrupted"
            : "voice-mode-unavailable",
          modeResult.ok ? undefined : modeResult.error
        );
        await this.cancelStart(operationId, "capture-error");
        return false;
      }

      const sessionResult = await this.options.sendCommand({
        type: "voice.startPtt",
        payload: { captureId }
      });
      if (!sessionResult.ok || operationId !== this.operationId) {
        this.options.onStartFailure?.(
          operationId !== this.operationId
            ? "interrupted"
            : "voice-session-unavailable",
          sessionResult.ok ? undefined : sessionResult.error
        );
        await this.cancelStart(operationId, "capture-error");
        return false;
      }

      this.setState("recording");
      return true;
    } catch {
      await this.cancelStart(operationId, "capture-error");
      return false;
    }
  }

  public async stop(reason: PttStopReason): Promise<boolean> {
    if (
      this.state === "idle" ||
      this.state === "stopping" ||
      this.state === "disposed"
    ) {
      return false;
    }

    const captureId = this.captureId;
    this.operationId += 1;
    this.setState("stopping");

    try {
      await this.options.capture.stop();
      const result = await this.options.sendCommand(
        reason === "release"
          ? {
              type: "voice.stopPtt",
              payload: {
                ...(captureId ? { captureId } : {})
              }
            }
          : {
              type: "voice.cancel",
              payload: { reason: commandCancelReason(reason) }
            }
      );
      if (!result.ok && isSecondaryErroredStop(result.error)) {
        await this.options.sendCommand({
          type: "voice.cancel",
          payload: { reason: "user" }
        });
      } else if (!result.ok) {
        this.options.onCommandFailure?.(result.error);
        if (reason === "release") {
          await this.options.sendCommand({
            type: "voice.cancel",
            payload: { reason: "user" }
          });
        }
      }
    } finally {
      this.captureId = undefined;
      this.setState("idle");
    }
    return true;
  }

  public async dispose(): Promise<boolean> {
    if (this.state === "disposed") {
      return false;
    }

    const wasActive = this.state !== "idle";
    this.operationId += 1;
    this.captureId = undefined;
    this.setState("disposed");
    await this.options.capture.dispose();
    if (wasActive) {
      try {
        await this.options.sendCommand({
          type: "voice.cancel",
          payload: { reason: "shutdown" }
        });
      } catch {
        // Renderer teardown must still release capture when IPC is unavailable.
      }
    }
    return true;
  }

  private async cancelStart(
    operationId: number,
    reason: Extract<PttStopReason, "capture-error">
  ): Promise<void> {
    if (operationId !== this.operationId) {
      return;
    }
    this.operationId += 1;
    try {
      await this.options.capture.stop();
      await this.options.sendCommand({
        type: "voice.cancel",
        payload: { reason }
      });
    } finally {
      this.captureId = undefined;
      this.setState("idle");
    }
  }

  private resetIfCurrent(operationId: number): void {
    if (operationId === this.operationId) {
      this.captureId = undefined;
      this.setState("idle");
    }
  }

  private setState(state: PttCaptureState): void {
    this.state = state;
    this.options.onStateChange?.(state);
  }
}

function commandCancelReason(
  reason: Exclude<PttStopReason, "release">
): "user" | "window-blur" | "capture-error" | "shutdown" {
  return reason === "user-cancel" ? "user" : reason;
}

function isSecondaryErroredStop(error: PttCommandError | undefined): boolean {
  return (
    error?.code === "VOICE_STATE_INVALID" &&
    error.message.includes("state is error")
  );
}
