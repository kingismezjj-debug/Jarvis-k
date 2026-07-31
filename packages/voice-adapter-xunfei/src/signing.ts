import crypto from "node:crypto";

const XUNFEI_RTASR_ENDPOINT = "wss://rtasr.xfyun.cn/v1/ws";

export interface XunfeiRtasrCredentials {
  appId: string;
  apiKey: string;
}

export interface XunfeiRtasrClock {
  now(): Date;
}

export interface XunfeiSignedUrlOptions {
  credentials: XunfeiRtasrCredentials;
  clock: XunfeiRtasrClock;
  language?: "zh" | "en";
}

export function createXunfeiSignedUrl(
  options: XunfeiSignedUrlOptions
): string {
  const appId = requireCredential(
    options.credentials.appId,
    "Xunfei app ID"
  );
  const apiKey = requireCredential(
    options.credentials.apiKey,
    "Xunfei API key"
  );
  const now = options.clock.now();
  if (!Number.isFinite(now.getTime())) {
    throw new RangeError("Xunfei signing clock returned an invalid date.");
  }

  const timestamp = Math.floor(now.getTime() / 1_000).toString();
  const md5Base = crypto
    .createHash("md5")
    .update(appId + timestamp)
    .digest("hex");
  const signature = crypto
    .createHmac("sha1", apiKey)
    .update(md5Base)
    .digest("base64");
  const url = new URL(XUNFEI_RTASR_ENDPOINT);
  url.searchParams.set("appid", appId);
  url.searchParams.set("ts", timestamp);
  url.searchParams.set(
    "lang",
    options.language === "en" ? "en" : "cn"
  );
  url.searchParams.set("signa", signature);
  return url.toString();
}

function requireCredential(value: string, label: string): string {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  return value;
}
