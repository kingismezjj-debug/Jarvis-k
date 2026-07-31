import { describe, expect, it, vi } from "vitest";
import {
  XunfeiRtasrConnection,
  type XunfeiConnectionScheduler,
  type XunfeiSocketFactory,
  type XunfeiSocketHandlers,
  type XunfeiSocketPort
} from "../src";

class FakeSocket implements XunfeiSocketPort {
  public readonly sent: Array<string | Uint8Array> = [];
  public closeCount = 0;

  public constructor(public readonly handlers: XunfeiSocketHandlers) {}

  public send(data: string | Uint8Array): void {
    this.sent.push(data);
  }

  public close(): void {
    this.closeCount += 1;
  }

  public message(data: unknown): void {
    this.handlers.onMessage(data);
  }
}

class FakeSocketFactory implements XunfeiSocketFactory {
  public readonly sockets: FakeSocket[] = [];
  public readonly urls: string[] = [];

  public create(url: string, handlers: XunfeiSocketHandlers): XunfeiSocketPort {
    this.urls.push(url);
    const socket = new FakeSocket(handlers);
    this.sockets.push(socket);
    return socket;
  }
}

class FakeScheduler implements XunfeiConnectionScheduler {
  private callback: (() => void) | undefined;
  public lastDelayMs: number | undefined;

  public setTimeout(callback: () => void, delayMs: number): unknown {
    this.callback = callback;
    this.lastDelayMs = delayMs;
    return 1;
  }

  public clearTimeout(): void {
    this.callback = undefined;
  }

  public run(): void {
    const callback = this.callback;
    this.callback = undefined;
    callback?.();
  }
}

function createHarness(maxBufferedFrames = 2) {
  const factory = new FakeSocketFactory();
  const scheduler = new FakeScheduler();
  const transcripts = vi.fn();
  const errors = vi.fn();
  const closed = vi.fn();
  const diagnostics = vi.fn();
  const connection = new XunfeiRtasrConnection({
    createSignedUrl: () => "wss://redacted.invalid/rtasr",
    socketFactory: factory,
    scheduler,
    callbacks: {
      onTranscript: transcripts,
      onError: errors,
      onClose: closed
    },
    onDiagnostic: diagnostics,
    maxBufferedFrames
  });
  return {
    closed,
    connection,
    diagnostics,
    errors,
    factory,
    scheduler,
    transcripts
  };
}

describe("XunfeiRtasrConnection", () => {
  it("buffers bounded audio until the provider reports started", () => {
    const harness = createHarness(2);
    harness.connection.connect();
    const socket = harness.factory.sockets[0]!;

    harness.connection.sendAudio(new Uint8Array([1]));
    harness.connection.sendAudio(new Uint8Array([2]));
    harness.connection.sendAudio(new Uint8Array([3]));

    expect(harness.connection.getBufferedFrameCount()).toBe(2);
    socket.message({ action: "started", code: "0" });
    expect(socket.sent.map((item) => Array.from(item as Uint8Array))).toEqual([
      [2],
      [3]
    ]);
    expect(harness.connection.getState()).toBe("ready");
  });

  it("waits 4500 ms before retrying provider code 10800", () => {
    const harness = createHarness();
    harness.connection.connect();
    const firstSocket = harness.factory.sockets[0]!;

    firstSocket.message({ action: "error", code: "10800" });

    expect(firstSocket.closeCount).toBe(1);
    expect(harness.connection.getState()).toBe("retry-wait");
    expect(harness.scheduler.lastDelayMs).toBe(4_500);
    expect(harness.factory.sockets).toHaveLength(1);
    expect(harness.diagnostics).toHaveBeenCalledWith({
      code: "CONNECT_LIMIT_RETRY",
      attempt: 1,
      delayMs: 4_500
    });

    harness.scheduler.run();
    expect(harness.factory.sockets).toHaveLength(2);
    expect(harness.connection.getState()).toBe("connecting");
  });

  it("forwards normalized transcripts through provider-neutral callbacks", () => {
    const harness = createHarness();
    harness.connection.connect();
    const socket = harness.factory.sockets[0]!;
    socket.message({ action: "started", code: 0 });
    socket.message({
      action: "result",
      data: JSON.stringify({
        seg_id: 9,
        cn: {
          st: {
            type: "0",
            rt: [{ ws: [{ cw: [{ w: "ready" }] }] }]
          }
        }
      })
    });

    expect(harness.transcripts).toHaveBeenCalledWith({
      text: "ready",
      isFinal: true,
      segmentId: "9"
    });
  });

  it("cancels retry and buffered audio when closed", () => {
    const harness = createHarness();
    harness.connection.connect();
    harness.connection.sendAudio(new Uint8Array([1]));
    harness.factory.sockets[0]!.message({
      action: "error",
      code: "10800"
    });

    expect(harness.connection.close()).toBe(true);
    harness.scheduler.run();

    expect(harness.factory.sockets).toHaveLength(1);
    expect(harness.connection.getBufferedFrameCount()).toBe(0);
    expect(harness.connection.getState()).toBe("closed");
  });
});
