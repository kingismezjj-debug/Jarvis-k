import zlib from "node:zlib";
import type { AsrTranscriptUpdate } from "@jarvis-k/voice";

export const VOLCENGINE_BIGMODEL_ASR_URL =
  "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async";
export const VOLCENGINE_DEFAULT_RESOURCE_ID =
  "volc.seedasr.sauc.duration";

export const VOLCENGINE_RESOURCE_FALLBACKS = new Map<string, string>([
  ["volc.seedasr.sauc.duration", "volc.bigasr.sauc.duration"],
  ["volc.seedasr.sauc.concurrent", "volc.bigasr.sauc.concurrent"]
]);

const PROTOCOL_VERSION = 0x1;
const HEADER_SIZE_WORDS = 0x1;
const SERIALIZATION_NONE = 0x0;
const SERIALIZATION_JSON = 0x1;
const COMPRESSION_GZIP = 0x1;
const MESSAGE_FULL_CLIENT_REQUEST = 0x1;
const MESSAGE_AUDIO_ONLY_REQUEST = 0x2;
const MESSAGE_FULL_SERVER_RESPONSE = 0x9;
const MESSAGE_ERROR = 0xf;
const FLAG_NO_SEQUENCE = 0x0;
const FLAG_LAST_NO_SEQUENCE = 0x2;

export type VolcengineParseResult =
  | {
      kind: "response";
      body: unknown;
      isLast: boolean;
    }
  | {
      kind: "error";
      providerCode: string;
      message: string;
    };

export function createVolcengineFullClientRequest(
  uid = "jarvis-k"
): Uint8Array {
  const payload = Buffer.from(
    JSON.stringify({
      user: { uid },
      audio: {
        format: "pcm",
        codec: "raw",
        rate: 16_000,
        bits: 16,
        channel: 1
      },
      request: {
        model_name: "bigmodel",
        enable_itn: true,
        enable_punc: true,
        enable_ddc: false,
        result_type: "full",
        show_utterances: true
      }
    }),
    "utf8"
  );
  return createVolcengineFrame(
    MESSAGE_FULL_CLIENT_REQUEST,
    FLAG_NO_SEQUENCE,
    SERIALIZATION_JSON,
    payload
  );
}

export function createVolcengineAudioFrame(
  pcm: Uint8Array,
  isLast = false
): Uint8Array {
  return createVolcengineFrame(
    MESSAGE_AUDIO_ONLY_REQUEST,
    isLast ? FLAG_LAST_NO_SEQUENCE : FLAG_NO_SEQUENCE,
    SERIALIZATION_NONE,
    Buffer.from(pcm)
  );
}

export function parseVolcengineResponse(
  data: Uint8Array | ArrayBuffer | Buffer
): VolcengineParseResult | null {
  const buffer =
    data instanceof ArrayBuffer
      ? Buffer.from(new Uint8Array(data))
      : Buffer.from(data);
  if (buffer.length < 8) {
    return null;
  }

  const headerSize = (buffer[0]! & 0x0f) * 4;
  const messageType = (buffer[1]! >> 4) & 0x0f;
  const flags = buffer[1]! & 0x0f;
  const compression = buffer[2]! & 0x0f;
  let offset = headerSize;

  if (messageType === MESSAGE_ERROR) {
    if (buffer.length < offset + 8) {
      return {
        kind: "error",
        providerCode: "unknown",
        message: "Volcengine ASR returned a malformed error frame."
      };
    }
    const code = buffer.readUInt32BE(offset);
    offset += 4;
    const size = buffer.readUInt32BE(offset);
    offset += 4;
    const message = buffer.slice(offset, offset + size).toString("utf8");
    return {
      kind: "error",
      providerCode: String(code),
      message: sanitizeText(message || "Volcengine ASR provider error.")
    };
  }

  if (messageType !== MESSAGE_FULL_SERVER_RESPONSE) {
    return null;
  }
  if (flags === 0x1 || flags === 0x3) {
    offset += 4;
  }
  if (buffer.length < offset + 4) {
    return null;
  }

  const size = buffer.readUInt32BE(offset);
  offset += 4;
  let payload = buffer.slice(offset, offset + size);
  if (compression === COMPRESSION_GZIP && payload.length > 0) {
    payload = zlib.gunzipSync(payload);
  }
  const text = payload.toString("utf8");
  if (!text) {
    return null;
  }
  return {
    kind: "response",
    body: JSON.parse(text) as unknown,
    isLast: flags === 0x3
  };
}

export function extractVolcengineTranscripts(
  body: unknown,
  isLast: boolean,
  sessionId: string
): AsrTranscriptUpdate[] {
  const results = asArray(getProperty(body, "result"));
  const utterances = results.flatMap((result) =>
    asArray(getProperty(result, "utterances"))
  );

  if (utterances.length > 0) {
    return utterances.flatMap((utterance, index) => {
      const text = getString(utterance, "text");
      if (!text) {
        return [];
      }
      return [
        {
          text,
          isFinal: getProperty(utterance, "definite") === true,
          providerId: "volcengine",
          segmentId: `volc:${sessionId}:${index}`
        }
      ];
    });
  }

  const text = results
    .map((result) => getString(result, "text"))
    .filter((value): value is string => Boolean(value))
    .join("");
  return text
    ? [
        {
          text,
          isFinal: isLast,
          providerId: "volcengine",
          segmentId: `volc:${sessionId}:full`
        }
      ]
    : [];
}

export function createVolcengineError(
  code: string,
  message: string,
  retryable: boolean,
  details: Record<string, unknown> = {}
) {
  return {
    code,
    message: sanitizeText(message),
    retryable,
    ...(Object.keys(details).length > 0
      ? { details: sanitizeDetails(details) }
      : {})
  };
}

function createVolcengineFrame(
  messageType: number,
  flags: number,
  serialization: number,
  payload: Buffer
): Uint8Array {
  const body = zlib.gzipSync(payload.length > 0 ? payload : Buffer.alloc(0));
  const size = Buffer.alloc(4);
  size.writeUInt32BE(body.length, 0);
  return Buffer.concat([
    Buffer.from([
      (PROTOCOL_VERSION << 4) | HEADER_SIZE_WORDS,
      (messageType << 4) | flags,
      (serialization << 4) | COMPRESSION_GZIP,
      0x00
    ]),
    size,
    body
  ]);
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null ? [] : [value];
}

function getProperty(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

function getString(value: unknown, key: string): string | undefined {
  const property = getProperty(value, key);
  return typeof property === "string" && property.trim().length > 0
    ? property.trim()
    : undefined;
}

function sanitizeDetails(
  details: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeText(value);
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function sanitizeText(value: string): string {
  return value
    .replace(/(api[_-]?key|app[_-]?key|access[_-]?key|secret|token|authorization)=\S+/gi, "$1=[redacted]")
    .replace(/\b(sk|ak|asr|api)[_-][A-Za-z0-9_-]{12,}\b/g, "[redacted]")
    .slice(0, 512);
}
