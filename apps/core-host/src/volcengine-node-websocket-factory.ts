import WebSocket, { type RawData } from "ws";
import type {
  VolcengineSocketFactory,
  VolcengineSocketHandlers,
  VolcengineSocketPort
} from "@jarvis-k/voice-adapter-volcengine";

export class VolcengineNodeWebSocketFactory implements VolcengineSocketFactory {
  public create(
    url: string,
    headers: Record<string, string>,
    handlers: VolcengineSocketHandlers
  ): VolcengineSocketPort {
    const socket = new WebSocket(url, { headers });
    socket.on("open", () => handlers.onOpen());
    socket.on("message", (data: RawData) => {
      handlers.onMessage(toUint8Array(data));
    });
    socket.on("error", (error: Error) => {
      handlers.onError(
        error instanceof Error
          ? error
          : new Error("Volcengine ASR WebSocket error.")
      );
    });
    socket.on("close", (code, reason) => {
      handlers.onClose({
        code,
        reason: reason.toString("utf8")
      });
    });

    return {
      send: (data) => socket.send(Buffer.from(data)),
      close: () => {
        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close();
        }
      }
    };
  }
}

function toUint8Array(data: RawData): Uint8Array {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (Array.isArray(data)) {
    return new Uint8Array(Buffer.concat(data.map((chunk) => Buffer.from(chunk))));
  }
  return new Uint8Array(Buffer.from(data));
}
