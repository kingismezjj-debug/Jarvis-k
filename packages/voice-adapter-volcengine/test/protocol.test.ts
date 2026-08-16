import zlib from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  createVolcengineAudioFrame,
  createVolcengineFullClientRequest,
  extractVolcengineTranscripts,
  parseVolcengineResponse
} from "../src";

describe("Volcengine ASR protocol", () => {
  it("creates gzipped client request and audio frames", () => {
    const request = Buffer.from(createVolcengineFullClientRequest("test-user"));
    const audio = Buffer.from(
      createVolcengineAudioFrame(new Uint8Array([1, 2, 3, 4]), true)
    );

    expect(request[0]).toBe(0x11);
    expect(request[1]).toBe(0x10);
    expect(request[2]).toBe(0x11);
    expect(JSON.parse(zlib.gunzipSync(request.slice(8)).toString("utf8"))).toMatchObject({
      user: { uid: "test-user" },
      audio: { format: "pcm", rate: 16_000, channel: 1 },
      request: { model_name: "bigmodel", show_utterances: true }
    });
    expect(audio[0]).toBe(0x11);
    expect(audio[1]).toBe(0x22);
  });

  it("parses response utterances into provider-neutral transcript updates", () => {
    const parsed = parseVolcengineResponse(
      createServerResponse({
        result: [
          {
            utterances: [
              { text: "hello", definite: true },
              { text: " world", definite: false }
            ]
          }
        ]
      })
    );

    expect(parsed).toMatchObject({ kind: "response", isLast: false });
    expect(
      parsed?.kind === "response"
        ? extractVolcengineTranscripts(parsed.body, parsed.isLast, "session-1")
        : []
    ).toEqual([
      {
        text: "hello",
        isFinal: true,
        providerId: "volcengine",
        segmentId: "volc:session-1:0"
      },
      {
        text: "world",
        isFinal: false,
        providerId: "volcengine",
        segmentId: "volc:session-1:1"
      }
    ]);
  });

  it("parses provider error frames without exposing credential-like values", () => {
    const parsed = parseVolcengineResponse(
      createServerError(401, "auth failed apiKey=secret-value")
    );

    expect(parsed).toEqual({
      kind: "error",
      providerCode: "401",
      message: "auth failed apiKey=[redacted]"
    });
  });
});

function createServerResponse(body: unknown): Uint8Array {
  const payload = zlib.gzipSync(Buffer.from(JSON.stringify(body), "utf8"));
  const size = Buffer.alloc(4);
  size.writeUInt32BE(payload.length, 0);
  return Buffer.concat([
    Buffer.from([0x11, 0x90, 0x11, 0x00]),
    size,
    payload
  ]);
}

function createServerError(code: number, message: string): Uint8Array {
  const payload = Buffer.from(message, "utf8");
  const size = Buffer.alloc(4);
  size.writeUInt32BE(payload.length, 0);
  const codeBytes = Buffer.alloc(4);
  codeBytes.writeUInt32BE(code, 0);
  return Buffer.concat([
    Buffer.from([0x11, 0xf0, 0x00, 0x00]),
    codeBytes,
    size,
    payload
  ]);
}
