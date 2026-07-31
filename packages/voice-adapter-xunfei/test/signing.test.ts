import { describe, expect, it } from "vitest";
import { createXunfeiSignedUrl } from "../src";

describe("Xunfei RTASR signing", () => {
  it("creates the verified MD5 and HMAC-SHA1 query from an injected clock", () => {
    const signedUrl = createXunfeiSignedUrl({
      credentials: {
        appId: "test-app",
        apiKey: "test-key"
      },
      clock: {
        now: () => new Date("2026-07-29T00:00:00.000Z")
      },
      language: "zh"
    });
    const url = new URL(signedUrl);

    expect(`${url.protocol}//${url.host}${url.pathname}`).toBe(
      "wss://rtasr.xfyun.cn/v1/ws"
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      appid: "test-app",
      ts: "1785283200",
      lang: "cn",
      signa: "UgVXZSWOtSXf105uQfaTkO8SUkw="
    });
  });

  it("maps English explicitly and rejects missing credentials", () => {
    const url = new URL(
      createXunfeiSignedUrl({
        credentials: {
          appId: "test-app",
          apiKey: "test-key"
        },
        clock: {
          now: () => new Date("2026-07-29T00:00:00.000Z")
        },
        language: "en"
      })
    );

    expect(url.searchParams.get("lang")).toBe("en");
    expect(() =>
      createXunfeiSignedUrl({
        credentials: {
          appId: "",
          apiKey: "redacted-test-key"
        },
        clock: { now: () => new Date() }
      })
    ).toThrow("app ID is required");
  });
});
