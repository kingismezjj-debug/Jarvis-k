import {
  type StructuredError,
  type VoiceEvent,
  type VoiceAudioFrame,
  type VoiceMode,
  type VoicePermissionState,
  type VoiceSnapshot,
  type VoiceState,
  type VoiceTranscript,
  createId
} from "@jarvis-k/contracts";
import type {
  AsrProviderCallbacks,
  AsrProviderPort,
  AsrSessionPort,
  Clock,
  TtsPlaybackPort,
  VoiceActionResult,
  VoiceAudioAcceptance,
  VoiceEngineDependencies,
  VoiceEnginePort,
  VoiceEventSink
} from "./ports";
import { ContinuousListeningStrategy } from "./continuous-listening-strategy";

const allowedTransitions: Record<VoiceState, ReadonlySet<VoiceState>> = {
  idle: new Set(["connecting", "idle"]),
  connecting: new Set(["ready", "recovering", "error", "idle"]),
  ready: new Set(["recording", "speaking", "recovering", "error", "idle"]),
  recording: new Set(["finalizing", "ready", "recovering", "error", "idle"]),
  finalizing: new Set(["ready", "recovering", "error", "idle"]),
  speaking: new Set(["interrupted", "ready", "recovering", "error", "idle"]),
  interrupted: new Set(["ready", "recovering", "error", "idle"]),
  recovering: new Set(["connecting", "ready", "error", "idle"]),
  error: new Set(["connecting", "recovering", "idle"])
};

export class VoiceEngine implements VoiceEnginePort {
  private readonly provider: AsrProviderPort;
  private readonly ttsPlayback: TtsPlaybackPort;
  private readonly eventSink: VoiceEventSink;
  private readonly clock: Clock;
  private readonly continuousStrategy: ContinuousListeningStrategy;
  private mode: VoiceMode = "disabled";
  private state: VoiceState = "idle";
  private permission: VoicePermissionState = "unknown";
  private session: AsrSessionPort | null = null;
  private sessionId: string | undefined;
  private transcript: VoiceTranscript | undefined;
  private playbackId: string | undefined;
  private connectionAttempt = 0;

  public constructor(dependencies: VoiceEngineDependencies) {
    this.provider = dependencies.provider;
    this.ttsPlayback = dependencies.ttsPlayback;
    this.eventSink = dependencies.eventSink;
    this.clock = dependencies.clock;
    this.continuousStrategy = new ContinuousListeningStrategy({
      scheduler: dependencies.scheduler,
      onInactivity: () => void this.recoverContinuousAfterInactivity(),
      ...(dependencies.continuousInactivityMs !== undefined
        ? { inactivityMs: dependencies.continuousInactivityMs }
        : {})
    });
  }

  public getSnapshot(): VoiceSnapshot {
    return {
      state: this.state,
      mode: this.mode,
      permission: this.permission,
      ...(this.sessionId ? { sessionId: this.sessionId } : {}),
      ...(this.transcript ? { transcript: { ...this.transcript } } : {})
    };
  }

  public async setMode(mode: VoiceMode): Promise<VoiceActionResult> {
    if (
      mode === this.mode &&
      !["recovering", "error"].includes(this.state)
    ) {
      return this.success();
    }

    if (mode === "disabled") {
      this.mode = "disabled";
      this.continuousStrategy.deactivate();
      this.connectionAttempt += 1;
      await this.closeSession();
      this.sessionId = undefined;
      this.transcript = undefined;
      this.playbackId = undefined;
      this.transition("idle");
      return this.success();
    }

    if (!["idle", "ready", "error"].includes(this.state)) {
      return this.failure(
        "VOICE_BUSY",
        `Voice mode cannot change while state is ${this.state}.`,
        true
      );
    }

    const previousMode = this.mode;
    this.mode = mode;
    if (this.session) {
      this.applyIdleModeStrategy(previousMode, mode);
      this.emitState();
      return this.success();
    }

    this.transition("connecting");
    const connectionAttempt = ++this.connectionAttempt;
    try {
      const session = await this.provider.connect(this.providerCallbacks());
      if (connectionAttempt !== this.connectionAttempt) {
        await session.close();
        return this.failure(
          "VOICE_CONNECT_CANCELLED",
          "Voice provider connection was cancelled.",
          true
        );
      }
      this.session = session;
      this.applyIdleModeStrategy(previousMode, mode);
      this.transition("ready");
      return this.success();
    } catch (error) {
      return this.handleFailure(
        this.normalizeError(error, "VOICE_PROVIDER_CONNECT_FAILED")
      );
    }
  }

  public startPtt(captureId?: string): VoiceActionResult {
    if (this.mode !== "ptt" && this.mode !== "continuous") {
      return this.failure(
        "VOICE_MODE_INVALID",
        "PTT requires ptt or continuous voice mode.",
        false
      );
    }
    if (this.state !== "ready" || !this.session) {
      return this.failure(
        "VOICE_STATE_INVALID",
        `PTT cannot start while state is ${this.state}.`,
        true
      );
    }

    if (this.mode === "continuous") {
      if (
        !this.sessionId ||
        (captureId !== undefined && captureId !== this.sessionId)
      ) {
        return this.failure(
          "VOICE_CAPTURE_MISMATCH",
          "PTT overlay must reuse the continuous capture identity.",
          false
        );
      }
      if (!this.continuousStrategy.beginPttOverlay()) {
        return this.failure(
          "VOICE_STATE_INVALID",
          "Continuous listening is not ready for a PTT overlay.",
          true
        );
      }
    } else {
      this.sessionId = captureId ?? createId("voice");
    }
    this.transcript = undefined;
    this.transition("recording");
    return this.success();
  }

  public async acceptAudioFrame(
    frame: VoiceAudioFrame
  ): Promise<VoiceAudioAcceptance> {
    if (this.mode === "continuous") {
      if (!this.session || !this.sessionId) {
        return { accepted: false, reason: "session-unavailable" };
      }
      const decision = this.continuousStrategy.decideAudio(
        frame.metadata.captureId
      );
      if (decision === "drop-capture-mismatch") {
        return { accepted: false, reason: "capture-mismatch" };
      }
      if (decision !== "upload") {
        return { accepted: false, reason: "not-recording" };
      }
      return this.sendAudioFrame(frame);
    }

    if (this.state !== "recording") {
      return { accepted: false, reason: "not-recording" };
    }
    if (!this.session || !this.sessionId) {
      return { accepted: false, reason: "session-unavailable" };
    }
    if (frame.metadata.captureId !== this.sessionId) {
      return { accepted: false, reason: "capture-mismatch" };
    }

    return this.sendAudioFrame(frame);
  }

  public async stopPtt(): Promise<VoiceActionResult> {
    if (this.state !== "recording" || !this.session) {
      return this.failure(
        "VOICE_STATE_INVALID",
        `PTT cannot stop while state is ${this.state}.`,
        false
      );
    }

    this.transition("finalizing");
    try {
      await this.session.finalizeSegment();
      return this.success();
    } catch (error) {
      return this.handleFailure(
        this.normalizeError(error, "VOICE_FINALIZE_FAILED")
      );
    }
  }

  public async cancel(): Promise<VoiceActionResult> {
    if (
      this.state === "connecting" ||
      this.state === "recovering" ||
      this.state === "error"
    ) {
      this.connectionAttempt += 1;
      this.mode = "disabled";
      await this.closeSession();
      this.sessionId = undefined;
      this.transcript = undefined;
      this.playbackId = undefined;
      this.transition("idle");
      return this.success();
    }

    if (
      this.session &&
      (this.state === "recording" || this.state === "finalizing")
    ) {
      try {
        await this.session.cancelSegment();
      } catch (error) {
        return this.handleFailure(
          this.normalizeError(error, "VOICE_CANCEL_FAILED")
        );
      }
    }

    if (this.mode === "continuous") {
      this.continuousStrategy.resumeAfterPttOverlay();
    } else {
      this.sessionId = undefined;
    }
    this.transcript = undefined;
    this.playbackId = undefined;
    this.transition(this.mode === "disabled" ? "idle" : "ready");
    return this.success();
  }

  public suspendForTts(playbackId: string): VoiceActionResult {
    if (this.state !== "ready") {
      return this.failure(
        "VOICE_STATE_INVALID",
        `TTS cannot suspend voice while state is ${this.state}.`,
        true
      );
    }

    this.playbackId = playbackId;
    if (this.mode === "continuous") {
      this.continuousStrategy.suspendForTts();
    }
    this.transition("speaking");
    return this.success();
  }

  public async resumeAfterTts(
    playbackId: string,
    interrupted: boolean
  ): Promise<VoiceActionResult> {
    if (this.state !== "speaking" || this.playbackId !== playbackId) {
      return this.failure(
        "VOICE_PLAYBACK_INVALID",
        "TTS resume does not match the active playback.",
        false
      );
    }

    if (interrupted) {
      try {
        await this.ttsPlayback.interrupt(playbackId);
      } catch (error) {
        return this.handleFailure(
          this.normalizeError(error, "VOICE_TTS_INTERRUPT_FAILED")
        );
      }
      this.transition("interrupted");
      this.publish({
        type: "voice.playback.interrupted",
        payload: {
          playbackId,
          reason: "barge-in"
        }
      });
    }

    this.playbackId = undefined;
    if (this.mode === "continuous") {
      this.continuousStrategy.resumeAfterTts();
    }
    this.transition("ready");
    return this.success();
  }

  public reportPermission(permission: VoicePermissionState): VoiceActionResult {
    this.permission = permission;
    this.publish({
      type: "voice.permission.changed",
      payload: { permission }
    });
    return this.success();
  }

  private providerCallbacks(): AsrProviderCallbacks {
    return {
      onTranscript: (update) => {
        if (!this.sessionId) {
          return;
        }
        this.transcript = {
          sessionId: this.sessionId,
          text: update.text,
          isFinal: update.isFinal,
          updatedAt: this.clock.now().toISOString(),
          ...(update.segmentId ? { segmentId: update.segmentId } : {})
        };
        this.publish({
          type: "voice.transcript.updated",
          payload: this.transcript
        });
        if (update.isFinal && this.state === "finalizing") {
          if (this.mode === "continuous") {
            this.continuousStrategy.resumeAfterPttOverlay();
          }
          this.transition("ready");
        }
      },
      onError: (error) => {
        this.handleFailure(error);
      },
      onClose: () => {
        this.session = null;
        if (this.mode !== "disabled" && this.state !== "error") {
          this.transition("recovering");
        }
      }
    };
  }

  private transition(nextState: VoiceState): void {
    if (!allowedTransitions[this.state].has(nextState)) {
      throw new Error(
        `Invalid Voice Engine transition ${this.state} -> ${nextState}.`
      );
    }
    this.state = nextState;
    this.emitState();
  }

  private applyIdleModeStrategy(
    previousMode: VoiceMode,
    nextMode: VoiceMode
  ): void {
    if (previousMode === "continuous" && nextMode !== "continuous") {
      this.continuousStrategy.deactivate();
      this.sessionId = undefined;
    }
    if (nextMode === "continuous") {
      if (!this.sessionId) {
        this.sessionId = createId("continuous");
      }
      this.continuousStrategy.activate(this.sessionId);
    }
  }

  private async recoverContinuousAfterInactivity(): Promise<void> {
    if (
      this.mode !== "continuous" ||
      this.state !== "ready" ||
      !this.session ||
      !this.sessionId
    ) {
      return;
    }

    const recoveryAttempt = ++this.connectionAttempt;
    const previousSession = this.session;
    this.session = null;
    this.transition("recovering");

    try {
      await previousSession.close();
      if (
        recoveryAttempt !== this.connectionAttempt ||
        this.mode !== "continuous"
      ) {
        return;
      }

      const replacement = await this.provider.connect(
        this.providerCallbacks()
      );
      if (
        recoveryAttempt !== this.connectionAttempt ||
        this.mode !== "continuous"
      ) {
        await replacement.close();
        return;
      }

      this.session = replacement;
      this.continuousStrategy.markRecovered();
      this.transition("ready");
    } catch (error) {
      if (recoveryAttempt === this.connectionAttempt) {
        this.handleFailure(
          this.normalizeError(error, "VOICE_CONTINUOUS_RECOVERY_FAILED")
        );
      }
    }
  }

  private async sendAudioFrame(
    frame: VoiceAudioFrame
  ): Promise<VoiceAudioAcceptance> {
    if (!this.session) {
      return { accepted: false, reason: "session-unavailable" };
    }
    try {
      await this.session.sendAudio(frame);
      return { accepted: true };
    } catch (error) {
      this.handleFailure(
        this.normalizeError(error, "VOICE_AUDIO_SEND_FAILED")
      );
      return { accepted: false, reason: "provider-send-failed" };
    }
  }

  private emitState(): void {
    this.publish({
      type: "voice.state.changed",
      payload: {
        state: this.state,
        mode: this.mode,
        ...(this.sessionId ? { sessionId: this.sessionId } : {})
      }
    });
  }

  private publish(event: VoiceEvent): void {
    this.eventSink.publish(event);
  }

  private async closeSession(): Promise<void> {
    const current = this.session;
    this.session = null;
    if (current) {
      await current.close();
    }
  }

  private handleFailure(error: StructuredError): VoiceActionResult {
    if (this.state !== "error") {
      this.transition("error");
    }
    this.publish({
      type: "voice.error",
      payload: {
        state: this.state,
        error
      }
    });
    return {
      ok: false,
      error,
      snapshot: this.getSnapshot()
    };
  }

  private normalizeError(error: unknown, code: string): StructuredError {
    return {
      code,
      message: error instanceof Error ? error.message : "Unknown voice error.",
      retryable: true
    };
  }

  private success(): VoiceActionResult {
    return {
      ok: true,
      snapshot: this.getSnapshot()
    };
  }

  private failure(
    code: string,
    message: string,
    retryable: boolean
  ): VoiceActionResult {
    return {
      ok: false,
      error: {
        code,
        message,
        retryable
      },
      snapshot: this.getSnapshot()
    };
  }
}
