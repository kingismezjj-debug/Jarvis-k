import WebSocket, { type RawData } from "ws";
import type {
  XunfeiSocketFactory,
  XunfeiSocketHandlers,
  XunfeiSocketPort
} from "@jarvis-k/voice-adapter-xunfei";

export class NodeWebSocketFactory implements XunfeiSocketFactory {
  public create(
    url: string,
    handlers: XunfeiSocketHandlers
  ): XunfeiSocketPort {
    const socket = new WebSocket(url);
    socket.on("message", (data: RawData) => {
      handlers.onMessage(decodeRawData(data));
    });
    socket.on("error", (error: Error) => {
      handlers.onError(
        error instanceof Error
          ? error
          : new Error("Xunfei RTASR WebSocket error.")
      );
    });
    socket.on("close", (code, reason) =>
      handlers.onClose({
        code,
        reason: reason.toString("utf8")
      })
    );

    return {
      send: (data) => {
        socket.send(data);
      },
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

function decodeRawData(data: RawData): string {
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(data)).toString("utf8");
  }
  if (Array.isArray(data)) {
    return Buffer.concat(data.map((chunk) => Buffer.from(chunk))).toString(
      "utf8"
    );
  }
  return Buffer.from(data).toString("utf8");
}
