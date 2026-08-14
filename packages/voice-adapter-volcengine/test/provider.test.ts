import { describe, expect, it, vi } from "vitest";
import {
  VolcengineAsrProvider,
  type VolcengineSocketFactory,
  type VolcengineSocketHandlers,
  type VolcengineSocketPort
} from "../src";

class FakeSocket implements VolcengineSocketPort {
  public readonly sent: Uint8Array[] = [];
  public closeCount = 0;

  public constructor(public readonly handlers: VolcengineSocketHandlers) {}

  public send(data: Uint8Array): void {
    this.sent.push(data);
  }

  public close(): void {
    this.closeCount += 1;
  }

  public open(): void {
    this.handlers.onOpen();
  }
}

class FakeSocketFactory implements VolcengineSocketFactory {
  public readonly headers: Record<string, string>[] = [];
  public readonly sockets: FakeSocket[] = [];
  public readonly urls: string[] = [];

  public create(
    url: string,
    headers: Record<string, string>,
    handlers: VolcengineSocketHandlers
  ): VolcengineSocketPort {
    this.urls.push(url);
    this.headers.push(headers);
    const socket = new FakeSocket(handlers);
    this.sockets.push(socket);
    return socket;
  }
}

describe("VolcengineAsrProvider", () => {
  it("connects with ApiKey/resource headers and sends the start frame on open", async () => {
    const factory = new FakeSocketFactory();
    const provider = new VolcengineAsrProvider({
      credentials: {
        apiKey: "test-key",
        resourceId: "volc.seedasr.sauc.duration"
      },
      socketFactory: factory,
      uid: "test-user"
    });

    const connecting = provider.connect({
      onTranscript: vi.fn(),
      onError: vi.fn(),
      onClose: vi.fn()
    });
    expect(factory.headers[0]).toMatchObject({
      "X-Api-Key": "test-key",
      "X-Api-Resource-Id": "volc.seedasr.sauc.duration",
      "X-Api-Sequence": "-1"
    });

    factory.sockets[0]!.open();
    const session = await connecting;
    await session.sendAudio({ pcm: new Uint8Array([1, 2]) });

    expect(factory.sockets[0]!.sent).toHaveLength(2);
  });

  it("falls back from Seed ASR duration resource to Big ASR duration on 403", async () => {
    const factory = new FakeSocketFactory();
    const provider = new VolcengineAsrProvider({
      credentials: {
        apiKey: "test-key",
        resourceId: "volc.seedasr.sauc.duration"
      },
      socketFactory: factory
    });

    const connecting = provider.connect({
      onTranscript: vi.fn(),
      onError: vi.fn(),
      onClose: vi.fn()
    });
    factory.sockets[0]!.handlers.onError(
      new Error("Unexpected server response: 403")
    );
    factory.sockets[0]!.handlers.onClose({
      code: 1006,
      reason: "old socket closed after fallback"
    });
    factory.sockets[1]!.open();

    await expect(connecting).resolves.toBeDefined();
    expect(factory.headers.map((headers) => headers["X-Api-Resource-Id"])).toEqual([
      "volc.seedasr.sauc.duration",
      "volc.bigasr.sauc.duration"
    ]);
    expect(factory.sockets[0]!.closeCount).toBe(1);
  });

  it("surfaces socket errors without leaking ApiKey-like text", async () => {
    const factory = new FakeSocketFactory();
    const errors = vi.fn();
    const provider = new VolcengineAsrProvider({
      credentials: {
        apiKey: "test-key",
        resourceId: "volc.bigasr.sauc.duration"
      },
      socketFactory: factory
    });

    const connecting = provider.connect({
      onTranscript: vi.fn(),
      onError: errors,
      onClose: vi.fn()
    });
    factory.sockets[0]!.handlers.onError(
      new Error("bad apiKey=secret-value")
    );

    await expect(connecting).rejects.toThrow(
      "Volcengine ASR socket error"
    );
    expect(errors).toHaveBeenCalledWith({
      code: "VOLCENGINE_ASR_SOCKET_ERROR",
      message: "Volcengine ASR socket error: bad apiKey=[redacted]",
      retryable: true,
      details: {
        resourceId: "volc.bigasr.sauc.duration"
      }
    });
  });
});
