import { describe, expect, it, vi } from "vitest";
import type { VoiceAudioFrame } from "@jarvis-k/contracts";
import {
  XunfeiRtasrProvider,
  type XunfeiProviderScheduler,
  type XunfeiSocketFactory,
  type XunfeiSocketHandlers,
  type XunfeiSocketPort
} from "../src";

class FakeSocket implements XunfeiSocketPort {
  public readonly sent: Array<string | Uint8Array> = [];
  public closeCount = 0;
  public isOpen = true;

  public constructor(public readonly handlers: XunfeiSocketHandlers) {}

  public send(data: string | Uint8Array): void {
    this.sent.push(data);
  }

  public close(): void {
    this.closeCount += 1;
    this.isOpen = false;
  }

  public message(data: unknown): void {
    this.handlers.onMessage(data);
  }

  public disconnect(): void {
    this.isOpen = false;
    this.handlers.onClose();
  }
}

class FakeSocketFactory implements XunfeiSocketFactory {
  public readonly sockets: FakeSocket[] = [];

  public create(_url: string, handlers: XunfeiSocketHandlers): XunfeiSocketPort {
    const socket = new FakeSocket(handlers);
    this.sockets.push(socket);
    return socket;
  }
}

class FakeScheduler implements XunfeiProviderScheduler {
  private nowMs = 0;
  private nextId = 1;
  private readonly timers = new Map<
    number,
    { callback: () => void; dueAt: number }
  >();

  public setTimeout(callback: () => void, delayMs: number): unknown {
    const id = this.nextId++;
    this.timers.set(id, {
      callback,
      dueAt: this.nowMs + delayMs
    });
    return id;
  }

  public clearTimeout(handle: unknown): void {
    this.timers.delete(Number(handle));
  }

  public advanceBy(delayMs: number): void {
    const target = this.nowMs + delayMs;
    while (true) {
      const next = [...this.timers.entries()]
        .filter(([, timer]) => timer.dueAt <= target)
        .sort((left, right) => left[1].dueAt - right[1].dueAt)[0];
      if (!next) {
        break;
      }
      const [id, timer] = next;
      this.nowMs = timer.dueAt;
      this.timers.delete(id);
      timer.callback();
    }
    this.nowMs = target;
  }
}

function audioFrame(
  captureId: string,
  sequenceId: number,
  sample = sequenceId
): VoiceAudioFrame {
  return {
    metadata: {
      captureId,
      sequenceId,
      capturedAt: "2026-07-29T00:00:00.000Z",
      sampleRate: 16_000,
      channels: 1,
      encoding: "pcm_s16le",
      byteLength: 4
    },
    pcm: new Uint8Array([sample])
  };
}

describe("XunfeiRtasrProvider", () => {
  it("reuses one RTASR connection across repeated PTT cycles", async () => {
    const socketFactory = new FakeSocketFactory();
    const scheduler = new FakeScheduler();
    const transcripts = vi.fn();
    const provider = new XunfeiRtasrProvider({
      credentials: {
        appId: "test-app",
        apiKey: "test-key"
      },
      clock: {
        now: () => new Date("2026-07-29T00:00:00.000Z")
      },
      scheduler,
      socketFactory
    });

    const sessionPromise = provider.connect({
      onTranscript: transcripts,
      onError: vi.fn(),
      onClose: vi.fn()
    });
    socketFactory.sockets[0]!.message({ action: "started", code: "0" });
    const session = await sessionPromise;

    await session.sendAudio(audioFrame("capture-1", 0));
    const firstFinalization = session.finalizeSegment();
    socketFactory.sockets[0]!.message({
      action: "result",
      data: {
        seg_id: 1,
        cn: {
          st: {
            type: "0",
            rt: [{ ws: [{ cw: [{ w: "first" }] }] }]
          }
        }
      }
    });
    await firstFinalization;

    scheduler.advanceBy(10_000);
    await session.sendAudio(audioFrame("capture-2", 0));
    const secondFinalization = session.finalizeSegment();
    socketFactory.sockets[0]!.message({
      action: "result",
      data: {
        seg_id: 2,
        cn: {
          st: {
            type: "0",
            rt: [{ ws: [{ cw: [{ w: "second" }] }] }]
          }
        }
      }
    });
    await secondFinalization;

    expect(socketFactory.sockets).toHaveLength(1);
    expect(transcripts).toHaveBeenCalledTimes(2);
    expect(socketFactory.sockets[0]!.closeCount).toBe(0);

    scheduler.advanceBy(30_000);
    await Promise.resolve();
    expect(socketFactory.sockets[0]!.closeCount).toBe(1);
  });

  it("recovers one active PTT segment with bounded audio and no parallel socket", async () => {
    const socketFactory = new FakeSocketFactory();
    const scheduler = new FakeScheduler();
    const transcripts = vi.fn();
    const closed = vi.fn();
    const provider = new XunfeiRtasrProvider({
      credentials: {
        appId: "test-app",
        apiKey: "test-key"
      },
      clock: {
        now: () => new Date("2026-07-29T00:00:00.000Z")
      },
      scheduler,
      socketFactory,
      maxBufferedFrames: 3,
      unexpectedCloseRetryMs: 250
    });

    const sessionPromise = provider.connect({
      onTranscript: transcripts,
      onError: vi.fn(),
      onClose: closed
    });
    const firstSocket = socketFactory.sockets[0]!;
    firstSocket.message({ action: "started", code: "0" });
    const session = await sessionPromise;

    await session.sendAudio(audioFrame("capture-1", 0, 1));
    firstSocket.disconnect();
    await session.sendAudio(audioFrame("capture-1", 1, 2));
    await session.sendAudio(audioFrame("capture-1", 2, 3));
    await session.sendAudio(audioFrame("capture-1", 3, 4));
    await session.sendAudio(audioFrame("capture-1", 4, 5));

    expect(socketFactory.sockets).toHaveLength(1);
    expect(socketFactory.sockets.filter((socket) => socket.isOpen)).toHaveLength(0);

    scheduler.advanceBy(250);
    expect(socketFactory.sockets).toHaveLength(2);
    expect(socketFactory.sockets.filter((socket) => socket.isOpen)).toHaveLength(1);

    const recoveredSocket = socketFactory.sockets[1]!;
    recoveredSocket.message({ action: "started", code: "0" });
    expect(
      recoveredSocket.sent.map((item) => Array.from(item as Uint8Array))
    ).toEqual([[3], [4], [5]]);

    const finalization = session.finalizeSegment();
    recoveredSocket.message({
      action: "result",
      data: {
        seg_id: 3,
        cn: {
          st: {
            type: "0",
            rt: [{ ws: [{ cw: [{ w: "recovered" }] }] }]
          }
        }
      }
    });
    await finalization;

    expect(transcripts).toHaveBeenCalledWith({
      text: "recovered",
      isFinal: true,
      segmentId: "3"
    });
    expect(closed).not.toHaveBeenCalled();
  });
});
