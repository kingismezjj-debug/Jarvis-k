import {
  VoiceAudioFrameMetadataSchema,
  type VoiceAudioFrameMetadata
} from "@jarvis-k/contracts";
import {
  VOICE_TARGET_SAMPLE_RATE,
  convertFloat32ToPcm16
} from "./pcm";

export type BrowserCaptureState =
  | "idle"
  | "starting"
  | "active"
  | "suspended"
  | "stopping"
  | "disposed";

export interface BrowserAudioSamples {
  samples: Float32Array;
  sampleRate: number;
  capturedAt?: Date;
}

export interface BrowserCaptureSessionPort {
  suspend(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
}

export interface BrowserCaptureBackendPort {
  start(
    onSamples: (samples: BrowserAudioSamples) => void,
    options: { deviceId?: string }
  ): Promise<BrowserCaptureSessionPort>;
}

export interface BrowserCaptureFrame {
  metadata: VoiceAudioFrameMetadata;
  pcm: Int16Array;
  diagnostics: {
    rms: number;
    peak: number;
  };
}

export interface BrowserCaptureClock {
  now(): Date;
}

export interface BrowserCaptureControllerOptions {
  backend: BrowserCaptureBackendPort;
  frameSink: (frame: BrowserCaptureFrame) => void;
  clock: BrowserCaptureClock;
  targetFrameSamples?: number;
}

export class BrowserCaptureController {
  private readonly backend: BrowserCaptureBackendPort;
  private readonly frameSink: (frame: BrowserCaptureFrame) => void;
  private readonly clock: BrowserCaptureClock;
  private readonly targetFrameSamples: number;
  private readonly pendingPcm: number[] = [];
  private pendingCapturedAt: Date | undefined;
  private state: BrowserCaptureState = "idle";
  private session: BrowserCaptureSessionPort | null = null;
  private captureId: string | undefined;
  private sequenceId = 0;
  private startAttempt = 0;

  public constructor(options: BrowserCaptureControllerOptions) {
    this.backend = options.backend;
    this.frameSink = options.frameSink;
    this.clock = options.clock;
    this.targetFrameSamples = options.targetFrameSamples ?? 640;
    if (this.targetFrameSamples <= 0) {
      throw new RangeError("Capture frame sample target must be positive.");
    }
  }

  public getState(): BrowserCaptureState {
    return this.state;
  }

  public getCaptureId(): string | undefined {
    return this.captureId;
  }

  public async start(options: {
    captureId: string;
    deviceId?: string;
  }): Promise<boolean> {
    this.ensureNotDisposed();

    if (
      (this.state === "active" || this.state === "suspended") &&
      this.captureId === options.captureId
    ) {
      return false;
    }
    if (this.state !== "idle") {
      throw new Error(`Capture cannot start while state is ${this.state}.`);
    }

    this.state = "starting";
    this.captureId = options.captureId;
    this.sequenceId = 0;
    this.pendingPcm.length = 0;
    this.pendingCapturedAt = undefined;
    const startAttempt = ++this.startAttempt;

    try {
      const session = await this.backend.start(
        (samples) => this.handleSamples(startAttempt, samples),
        {
          ...(options.deviceId ? { deviceId: options.deviceId } : {})
        }
      );

      if (startAttempt !== this.startAttempt) {
        await session.stop();
        return false;
      }

      this.session = session;
      this.state = "active";
      return true;
    } catch (error) {
      if (startAttempt === this.startAttempt) {
        this.captureId = undefined;
        this.state = "idle";
      }
      throw error;
    }
  }

  public async suspend(): Promise<boolean> {
    this.ensureNotDisposed();
    if (this.state === "suspended") {
      return false;
    }
    if (this.state !== "active" || !this.session) {
      throw new Error(`Capture cannot suspend while state is ${this.state}.`);
    }

    await this.session.suspend();
    this.state = "suspended";
    return true;
  }

  public async resume(): Promise<boolean> {
    this.ensureNotDisposed();
    if (this.state === "active") {
      return false;
    }
    if (this.state !== "suspended" || !this.session) {
      throw new Error(`Capture cannot resume while state is ${this.state}.`);
    }

    await this.session.resume();
    this.state = "active";
    return true;
  }

  public async stop(): Promise<boolean> {
    if (this.state === "disposed" || this.state === "idle") {
      return false;
    }

    this.state = "stopping";
    this.startAttempt += 1;
    const session = this.session;
    this.session = null;
    this.flushPendingPcm();
    this.captureId = undefined;
    this.sequenceId = 0;
    if (session) {
      await session.stop();
    }
    this.state = "idle";
    return true;
  }

  public async dispose(): Promise<boolean> {
    if (this.state === "disposed") {
      return false;
    }

    this.startAttempt += 1;
    const session = this.session;
    this.session = null;
    this.flushPendingPcm();
    this.captureId = undefined;
    this.sequenceId = 0;
    if (session) {
      await session.stop();
    }
    this.state = "disposed";
    return true;
  }

  private handleSamples(
    startAttempt: number,
    audio: BrowserAudioSamples
  ): void {
    if (
      startAttempt !== this.startAttempt ||
      !this.captureId ||
      (this.state !== "starting" && this.state !== "active")
    ) {
      return;
    }

    const pcm = convertFloat32ToPcm16(
      audio.samples,
      audio.sampleRate,
      VOICE_TARGET_SAMPLE_RATE
    );
    if (pcm.byteLength === 0) {
      return;
    }

    this.appendPcm(pcm, audio.capturedAt ?? this.clock.now());
  }

  private appendPcm(pcm: Int16Array, capturedAt: Date): void {
    if (pcm.length === 0) {
      return;
    }
    this.pendingCapturedAt ??= capturedAt;
    for (const sample of pcm) {
      this.pendingPcm.push(sample);
      if (this.pendingPcm.length >= this.targetFrameSamples) {
        this.emitPcmFrame(
          this.pendingPcm.splice(0, this.targetFrameSamples),
          this.pendingCapturedAt
        );
        this.pendingCapturedAt = capturedAt;
      }
    }
  }

  private flushPendingPcm(): void {
    if (this.pendingPcm.length === 0 || !this.captureId) {
      this.pendingPcm.length = 0;
      this.pendingCapturedAt = undefined;
      return;
    }
    this.emitPcmFrame(
      this.pendingPcm.splice(0),
      this.pendingCapturedAt ?? this.clock.now()
    );
    this.pendingCapturedAt = undefined;
  }

  private emitPcmFrame(samples: number[], capturedAt: Date): void {
    if (!this.captureId || samples.length === 0) {
      return;
    }
    const pcm = Int16Array.from(samples);
    const metadata = VoiceAudioFrameMetadataSchema.parse({
      captureId: this.captureId,
      sequenceId: this.sequenceId,
      capturedAt: capturedAt.toISOString(),
      sampleRate: VOICE_TARGET_SAMPLE_RATE,
      channels: 1,
      encoding: "pcm_s16le",
      byteLength: pcm.byteLength
    });
    this.sequenceId += 1;
    this.frameSink({
      metadata,
      pcm,
      diagnostics: calculatePcmDiagnostics(pcm)
    });
  }

  private ensureNotDisposed(): void {
    if (this.state === "disposed") {
      throw new Error("Capture controller has been disposed.");
    }
  }
}

function calculatePcmDiagnostics(pcm: Int16Array): {
  rms: number;
  peak: number;
} {
  let sumSquares = 0;
  let peak = 0;
  for (const sample of pcm) {
    const normalized = Math.abs(sample) / 32_768;
    peak = Math.max(peak, normalized);
    sumSquares += normalized * normalized;
  }
  const rms = Math.sqrt(sumSquares / pcm.length);
  return {
    rms,
    peak
  };
}
