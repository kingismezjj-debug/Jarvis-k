import type { AsrTranscriptUpdate } from "@jarvis-k/voice";

export function parseXunfeiResult(
  rawData: unknown
): AsrTranscriptUpdate | null {
  const parsed = parseJsonValue(rawData);
  if (!isRecord(parsed)) {
    return null;
  }

  const nested = isRecord(parsed.cn) && isRecord(parsed.cn.st)
    ? parsed.cn.st
    : parsed;
  const groups = Array.isArray(nested.rt)
    ? nested.rt
    : [{ ws: Array.isArray(nested.ws) ? nested.ws : [] }];
  const text = groups
    .flatMap((group) =>
      isRecord(group) && Array.isArray(group.ws) ? group.ws : []
    )
    .flatMap((word) =>
      isRecord(word) && Array.isArray(word.cw) ? word.cw : []
    )
    .map((candidate) =>
      isRecord(candidate) && typeof candidate.w === "string"
        ? candidate.w
        : ""
    )
    .join("");
  if (!text) {
    return null;
  }

  const segmentValue = parsed.seg_id ?? parsed.segId;
  const segmentId =
    typeof segmentValue === "string" || typeof segmentValue === "number"
      ? String(segmentValue)
      : undefined;
  return {
    text,
    isFinal: String(nested.type) === "0",
    ...(segmentId ? { segmentId } : {})
  };
}

function parseJsonValue(rawData: unknown): unknown {
  if (typeof rawData !== "string") {
    return rawData;
  }
  try {
    return JSON.parse(rawData);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
