import { describe, expect, it } from "vitest";
import type { StructuredError, VoiceAudioFrame } from "@jarvis-k/contracts";
import {
  BailongmaStyleAsrProvider,
  type AsrProviderCallbacks,
  type AsrProviderPort,
  type AsrSessionPort
} from "../src";

class FakeSession implements AsrSessionPort {
  public readonly audioFrames: VoiceAudioFrame[] = [];
  public finalizeCount = 0;
  public cancelCount = 0;
  public closeCount = 0;

  public async sendAudio(frame: VoiceAudioFrame): Promise<void> {
    this.audioFrames.push(frame);
  }

  public async finalizeSegment(): Promise<void> {
    this.finalizeCount += 1;
  }

  public async cancelSegment(): Promise<void> {
    this.cancelCount += 1;
  }

  public async close(): Promise<void> {
    this.closeCount += 1;
  }
}

class DeferredProvider implements AsrProviderPort {
  public callbacks: AsrProviderCallbacks | undefined;
  public connectCount = 0;
  private resolveConnection: ((session: AsrSessionPort) => void) | undefined;
  private rejectConnection: ((error: unknown) => void) | undefined;

  public async connect(
    callbacks: AsrProviderCallbacks
  ): Promise<AsrSessionPort> {
    this.connectCount += 1;
    this.callbacks = callbacks;
    return new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
    });
  }

  public resolve(session: AsrSessionPort): void {
    this.resolveConnection?.(session);
  }

  public reject(error: unknown): void {
    this.rejectConnection?.(error);
  }
}

function createFrame(sequenceId: number): VoiceAudioFrame {
  return {
    metadata: {
      captureId: "capture-1",
      sequenceId,
      capturedAt: "2026-08-06T00:00:00.000Z",
      sampleRate: 16_000,
      channels: 1,
      encoding: "pcm_s16le",
      byteLength: 2
    },
    pcm: new Uint8Array([sequenceId, 1])
  };
}

function createCallbacks() {
  const errors: StructuredError[] = [];
  const transcripts: string[] = [];
  let closeCount = 0;
  return {
    callbacks: {
      onTranscript: (update) => transcripts.push(update.text),
      onError: (error) => errors.push(error),
      onClose: () => {
        closeCount += 1;
      }
    },
    errors,
    transcripts,
    get closeCount() {
      return closeCount;
    }
  };
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("BailongmaStyleAsrProvider", () => {
  it("returns a Jarvis-K ASR session without waiting for upstream cloud connect", async () => {
    const upstream = new DeferredProvider();
    const provider = new BailongmaStyleAsrProvider({ upstream });
    const harness = createCallbacks();

    const session = await provider.connect(harness.callbacks);

    expect(session).toBeDefined();
    expect(upstream.connectCount).toBe(0);
  });

  it("buffers early PTT audio and flushes it in order before finalizing", async () => {
    const upstream = new DeferredProvider();
    const provider = new BailongmaStyleAsrProvider({ upstream });
    const harness = createCallbacks();
    const upstreamSession = new FakeSession();
    const session = await provider.connect(harness.callbacks);

    await session.sendAudio(createFrame(1));
    await session.sendAudio(createFrame(2));

    expect(upstream.connectCount).toBe(1);
    expect(upstreamSession.audioFrames).toHaveLength(0);

    const finalize = session.finalizeSegment();
    let finalized = false;
    void finalize.then(() => {
      finalized = true;
    });
    await settle();
    expect(finalized).toBe(false);

    upstream.resolve(upstreamSession);
    await finalize;

    expect(upstreamSession.audioFrames.map((frame) => frame.metadata.sequenceId)).toEqual([
      1,
      2
    ]);
    expect(upstreamSession.finalizeCount).toBe(1);
  });

  it("redacts provider connection failures before surfacing diagnostics", async () => {
    const upstream = new DeferredProvider();
    const provider = new BailongmaStyleAsrProvider({ upstream });
    const harness = createCallbacks();
    const session = await provider.connect(harness.callbacks);

    await session.sendAudio(createFrame(1));
    upstream.reject(new Error("handshake failed apiKey=secret-value sk-12345678901234567890"));
    await settle();

    expect(harness.errors).toHaveLength(1);
    expect(harness.errors[0]).toMatchObject({
      code: "VOICE_PROVIDER_CONNECT_FAILED",
      retryable: true
    });
    expect(harness.errors[0]?.message).toContain("apiKey=[redacted]");
    expect(harness.errors[0]?.message).not.toContain("secret-value");
    expect(harness.errors[0]?.message).not.toContain("sk-12345678901234567890");
  });

  it("preserves sanitized provider error details from the upstream session", async () => {
    const upstream = new DeferredProvider();
    const provider = new BailongmaStyleAsrProvider({ upstream });
    const harness = createCallbacks();
    const upstreamSession = new FakeSession();
    const session = await provider.connect(harness.callbacks);

    await session.sendAudio(createFrame(1));
    upstream.resolve(upstreamSession);
    await settle();
    upstream.callbacks?.onError({
      code: "XUNFEI_PROVIDER_ERROR",
      message: "provider failed apiKey=secret-value",
      retryable: false,
      details: {
        providerCode: "10105",
        providerMessage: "auth failed apiKey=secret-value",
        nested: { ignored: "secret-value" }
      }
    });

    expect(harness.errors.at(-1)).toEqual({
      code: "XUNFEI_PROVIDER_ERROR",
      message: "provider failed apiKey=[redacted]",
      retryable: false,
      details: {
        providerCode: "10105",
        providerMessage: "auth failed apiKey=[redacted]"
      }
    });
  });
});
