import type {
  AsrProviderCallbacks,
  AsrProviderPort,
  AsrSessionPort
} from "@jarvis-k/voice";
import {
  XunfeiConnectionReservation,
  type XunfeiReservationScheduler
} from "./connection-reservation";
import {
  XunfeiRtasrConnection,
  type XunfeiConnectionScheduler,
  type XunfeiSocketFactory
} from "./rtasr-connection";
import {
  XunfeiSegmentController,
  type XunfeiSegmentScheduler
} from "./segment-controller";
import {
  createXunfeiSignedUrl,
  type XunfeiRtasrClock,
  type XunfeiRtasrCredentials
} from "./signing";

export interface XunfeiProviderScheduler
  extends XunfeiReservationScheduler,
    XunfeiConnectionScheduler,
    XunfeiSegmentScheduler {}

export interface XunfeiRtasrProviderOptions {
  credentials: XunfeiRtasrCredentials;
  language?: "zh" | "en";
  clock: XunfeiRtasrClock;
  scheduler: XunfeiProviderScheduler;
  socketFactory: XunfeiSocketFactory;
  idleReleaseMs?: number;
  maxBufferedFrames?: number;
  unexpectedCloseRetryMs?: number;
  maxUnexpectedCloseRetries?: number;
}

export class XunfeiRtasrProvider implements AsrProviderPort {
  private readonly reservation: XunfeiConnectionReservation<XunfeiRtasrConnection>;
  private activeSession: XunfeiRtasrSession | undefined;
  private activeCallbacks: AsrProviderCallbacks | undefined;

  public constructor(private readonly options: XunfeiRtasrProviderOptions) {
    this.reservation = new XunfeiConnectionReservation({
      connect: async () => {
        const connection = new XunfeiRtasrConnection({
          createSignedUrl: () =>
            createXunfeiSignedUrl({
              credentials: options.credentials,
              clock: options.clock,
              ...(options.language ? { language: options.language } : {})
            }),
          socketFactory: options.socketFactory,
          scheduler: options.scheduler,
          ...(options.maxBufferedFrames
            ? { maxBufferedFrames: options.maxBufferedFrames }
            : {}),
          ...(options.unexpectedCloseRetryMs !== undefined
            ? {
                unexpectedCloseRetryMs:
                  options.unexpectedCloseRetryMs
              }
            : {}),
          ...(options.maxUnexpectedCloseRetries !== undefined
            ? {
                maxUnexpectedCloseRetries:
                  options.maxUnexpectedCloseRetries
              }
            : {}),
          callbacks: {
            onTranscript: (update) =>
              this.activeSession?.handleTranscript(update),
            onError: (error) => this.activeCallbacks?.onError(error),
            onClose: () => this.activeCallbacks?.onClose()
          }
        });
        connection.connect();
        await connection.waitUntilReady();
        return connection;
      },
      close: async (connection) => {
        connection.close();
      },
      scheduler: options.scheduler,
      ...(options.idleReleaseMs
        ? { idleReleaseMs: options.idleReleaseMs }
        : {})
    });
  }

  public async connect(
    callbacks: AsrProviderCallbacks
  ): Promise<AsrSessionPort> {
    this.activeCallbacks = callbacks;
    const session = new XunfeiRtasrSession(this);
    this.activeSession = session;
    await session.ensureConnection();
    return session;
  }

  public async acquireConnection(): Promise<XunfeiRtasrConnection> {
    return this.reservation.acquire();
  }

  public releaseWhenIdle(): void {
    this.reservation.releaseWhenIdle();
  }

  public clearSession(session: XunfeiRtasrSession): void {
    if (this.activeSession === session) {
      this.activeSession = undefined;
      this.activeCallbacks = undefined;
    }
  }

  public createSegmentController(
    session: XunfeiRtasrSession
  ): XunfeiSegmentController {
    return new XunfeiSegmentController({
      scheduler: this.options.scheduler,
      sendSilence: (frame) => session.sendSilence(frame),
      publishTranscript: (update) =>
        this.activeCallbacks?.onTranscript(update)
    });
  }
}

class XunfeiRtasrSession implements AsrSessionPort {
  private readonly segment: XunfeiSegmentController;
  private connection: XunfeiRtasrConnection | undefined;
  private closed = false;

  public constructor(private readonly provider: XunfeiRtasrProvider) {
    this.segment = provider.createSegmentController(this);
  }

  public async ensureConnection(): Promise<XunfeiRtasrConnection> {
    if (this.closed) {
      throw new Error("Xunfei RTASR session is closed.");
    }
    this.connection = await this.provider.acquireConnection();
    return this.connection;
  }

  public async sendAudio(frame: {
    pcm: Uint8Array;
  }): Promise<void> {
    const connection = await this.ensureConnection();
    this.segment.beginSegment();
    connection.sendAudio(frame.pcm);
  }

  public async finalizeSegment(): Promise<void> {
    await this.ensureConnection();
    this.segment.beginSegment();
    await this.segment.finalizeSegment();
    this.provider.releaseWhenIdle();
  }

  public async cancelSegment(): Promise<void> {
    this.segment.cancelSegment();
    this.provider.releaseWhenIdle();
  }

  public async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.segment.cancelSegment();
    this.provider.clearSession(this);
    this.provider.releaseWhenIdle();
  }

  public handleTranscript(update: Parameters<AsrProviderCallbacks["onTranscript"]>[0]): void {
    this.segment.handleTranscript(update);
  }

  public sendSilence(frame: Uint8Array): void {
    this.connection?.sendAudio(frame);
  }
}
