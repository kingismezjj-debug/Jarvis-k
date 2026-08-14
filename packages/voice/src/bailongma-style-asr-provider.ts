import type { StructuredError, VoiceAudioFrame } from "@jarvis-k/contracts";
import type {
  AsrProviderCallbacks,
  AsrProviderPort,
  AsrSessionPort
} from "./ports";

export interface BailongmaStyleAsrProviderOptions {
  upstream: AsrProviderPort;
  maxBufferedFrames?: number;
  maxBufferedBytes?: number;
}

interface QueuedFrame {
  frame: VoiceAudioFrame;
}

const DEFAULT_MAX_BUFFERED_FRAMES = 96;
const DEFAULT_MAX_BUFFERED_BYTES = 4 * 1024 * 1024;

export class BailongmaStyleAsrProvider implements AsrProviderPort {
  public constructor(
    private readonly options: BailongmaStyleAsrProviderOptions
  ) {}

  public async connect(
    callbacks: AsrProviderCallbacks
  ): Promise<AsrSessionPort> {
    return new BailongmaStyleAsrSession({
      upstream: this.options.upstream,
      callbacks,
      maxBufferedFrames:
        this.options.maxBufferedFrames ?? DEFAULT_MAX_BUFFERED_FRAMES,
      maxBufferedBytes:
        this.options.maxBufferedBytes ?? DEFAULT_MAX_BUFFERED_BYTES
    });
  }
}

interface BailongmaStyleAsrSessionOptions {
  upstream: AsrProviderPort;
  callbacks: AsrProviderCallbacks;
  maxBufferedFrames: number;
  maxBufferedBytes: number;
}

class BailongmaStyleAsrSession implements AsrSessionPort {
  private readonly queue: QueuedFrame[] = [];
  private bufferedBytes = 0;
  private upstreamSession: AsrSessionPort | undefined;
  private connecting: Promise<AsrSessionPort> | undefined;
  private draining: Promise<void> | undefined;
  private connectFailure: StructuredError | undefined;
  private closed = false;
  private overflowReported = false;

  public constructor(
    private readonly options: BailongmaStyleAsrSessionOptions
  ) {}

  public async sendAudio(frame: VoiceAudioFrame): Promise<void> {
    this.assertOpen();
    if (this.connectFailure) {
      throw structuredErrorToError(this.connectFailure);
    }

    this.enqueue(frame);
    void this.flushQueuedFrames().catch(() => undefined);
  }

  public async finalizeSegment(): Promise<void> {
    this.assertOpen();
    const session = await this.ensureConnected();
    await this.flushQueuedFrames(session);
    await session.finalizeSegment();
  }

  public async cancelSegment(): Promise<void> {
    this.queue.length = 0;
    this.bufferedBytes = 0;
    if (this.upstreamSession) {
      await this.upstreamSession.cancelSegment();
    }
  }

  public async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.queue.length = 0;
    this.bufferedBytes = 0;
    if (this.upstreamSession) {
      await this.upstreamSession.close();
      return;
    }
    if (this.connecting) {
      try {
        const session = await this.connecting;
        await session.close();
      } catch {
        // The failure has already been reported through onError.
      }
    }
  }

  private enqueue(frame: VoiceAudioFrame): void {
    const queuedFrame = {
      frame: cloneFrame(frame)
    };
    this.queue.push(queuedFrame);
    this.bufferedBytes += queuedFrame.frame.metadata.byteLength;

    while (
      this.queue.length > this.options.maxBufferedFrames ||
      this.bufferedBytes > this.options.maxBufferedBytes
    ) {
      const dropped = this.queue.shift();
      this.bufferedBytes -= dropped?.frame.metadata.byteLength ?? 0;
      this.reportOverflowOnce();
    }
  }

  private async flushQueuedFrames(
    knownSession?: AsrSessionPort
  ): Promise<void> {
    if (this.draining) {
      await this.draining;
      return;
    }

    this.draining = this.drain(knownSession).finally(() => {
      this.draining = undefined;
    });
    await this.draining;
  }

  private async drain(knownSession?: AsrSessionPort): Promise<void> {
    const session = knownSession ?? (await this.ensureConnected());
    while (!this.closed && this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) {
        continue;
      }
      this.bufferedBytes -= next.frame.metadata.byteLength;
      await session.sendAudio(next.frame);
    }
  }

  private async ensureConnected(): Promise<AsrSessionPort> {
    if (this.upstreamSession) {
      return this.upstreamSession;
    }
    if (this.connectFailure) {
      throw structuredErrorToError(this.connectFailure);
    }
    if (!this.connecting) {
      this.connecting = this.options.upstream
        .connect({
          onTranscript: (update) => this.options.callbacks.onTranscript(update),
          onError: (error) =>
            this.options.callbacks.onError(sanitizeProviderError(error)),
          onClose: () => {
            if (!this.closed) {
              this.options.callbacks.onClose();
            }
          }
        })
        .then((session) => {
          if (this.closed) {
            void session.close();
          }
          this.upstreamSession = session;
          return session;
        })
        .catch((error: unknown) => {
          const structured = normalizeProviderError(error);
          this.connectFailure = structured;
          this.options.callbacks.onError(structured);
          throw structuredErrorToError(structured);
        });
    }
    return this.connecting;
  }

  private reportOverflowOnce(): void {
    if (this.overflowReported) {
      return;
    }
    this.overflowReported = true;
    this.options.callbacks.onError({
      code: "VOICE_ASR_BUFFER_OVERFLOW",
      message:
        "Voice audio buffer overflowed while waiting for the ASR provider.",
      retryable: true
    });
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new Error("Bailongma-style ASR session is closed.");
    }
  }
}

function cloneFrame(frame: VoiceAudioFrame): VoiceAudioFrame {
  return {
    metadata: { ...frame.metadata },
    pcm: new Uint8Array(frame.pcm)
  };
}

function normalizeProviderError(error: unknown): StructuredError {
  if (isStructuredError(error)) {
    return sanitizeProviderError(error);
  }
  return {
    code: "VOICE_PROVIDER_CONNECT_FAILED",
    message:
      error instanceof Error
        ? sanitizeMessage(error.message)
        : "Voice provider connection failed.",
    retryable: true
  };
}

function sanitizeProviderError(error: StructuredError): StructuredError {
  return {
    code: sanitizeCode(error.code),
    message: sanitizeMessage(error.message),
    retryable: error.retryable,
    ...(error.details ? { details: sanitizeDetails(error.details) } : {})
  };
}

function structuredErrorToError(error: StructuredError): Error {
  return new Error(`${error.code}: ${error.message}`);
}

function isStructuredError(value: unknown): value is StructuredError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Partial<StructuredError>).code === "string" &&
    typeof (value as Partial<StructuredError>).message === "string" &&
    typeof (value as Partial<StructuredError>).retryable === "boolean"
  );
}

function sanitizeCode(value: string): string {
  return value.replace(/[^A-Z0-9_:-]/gi, "_").slice(0, 96);
}

function sanitizeMessage(value: string): string {
  return value
    .replace(/(api[_-]?key|app[_-]?id|secret|token|authorization)=\S+/gi, "$1=[redacted]")
    .replace(/\b(sk|ak|asr|api)[_-][A-Za-z0-9_-]{12,}\b/g, "[redacted]")
    .slice(0, 512);
}

function sanitizeDetails(
  details: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    const sanitizedKey = sanitizeCode(key);
    if (typeof value === "string") {
      sanitized[sanitizedKey] = sanitizeMessage(value);
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[sanitizedKey] = value;
    }
  }
  return sanitized;
}
