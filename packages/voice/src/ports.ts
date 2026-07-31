import type {
  StructuredError,
  VoiceEvent,
  VoiceAudioFrame,
  VoiceMode,
  VoicePermissionState,
  VoiceSnapshot
} from "@jarvis-k/contracts";

export type VoiceActionResult =
  | {
      ok: true;
      snapshot: VoiceSnapshot;
    }
  | {
      ok: false;
      error: StructuredError;
      snapshot: VoiceSnapshot;
    };

export interface AsrTranscriptUpdate {
  text: string;
  isFinal: boolean;
  segmentId?: string;
}

export interface AsrProviderCallbacks {
  onTranscript(update: AsrTranscriptUpdate): void;
  onError(error: StructuredError): void;
  onClose(): void;
}

export interface AsrSessionPort {
  sendAudio(frame: VoiceAudioFrame): Promise<void>;
  finalizeSegment(): Promise<void>;
  cancelSegment(): Promise<void>;
  close(): Promise<void>;
}

export interface AsrProviderPort {
  connect(callbacks: AsrProviderCallbacks): Promise<AsrSessionPort>;
}

export interface TtsPlaybackPort {
  interrupt(playbackId: string): Promise<void>;
}

export interface VoiceEventSink {
  publish(event: VoiceEvent): void;
}

export interface Clock {
  now(): Date;
}

export interface Scheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface VoiceEngineDependencies {
  provider: AsrProviderPort;
  ttsPlayback: TtsPlaybackPort;
  eventSink: VoiceEventSink;
  clock: Clock;
  scheduler: Scheduler;
  continuousInactivityMs?: number;
}

export interface VoiceEnginePort {
  getSnapshot(): VoiceSnapshot;
  setMode(mode: VoiceMode): Promise<VoiceActionResult>;
  startPtt(captureId?: string): VoiceActionResult;
  acceptAudioFrame(frame: VoiceAudioFrame): Promise<VoiceAudioAcceptance>;
  stopPtt(): Promise<VoiceActionResult>;
  cancel(): Promise<VoiceActionResult>;
  suspendForTts(playbackId: string): VoiceActionResult;
  resumeAfterTts(
    playbackId: string,
    interrupted: boolean
  ): Promise<VoiceActionResult>;
  reportPermission(permission: VoicePermissionState): VoiceActionResult;
}

export type VoiceAudioAcceptance =
  | { accepted: true }
  | {
      accepted: false;
      reason:
        | "not-recording"
        | "capture-mismatch"
        | "session-unavailable"
        | "provider-send-failed";
    };

export interface VoicePermissionReporter {
  reportPermission(permission: VoicePermissionState): void;
}
