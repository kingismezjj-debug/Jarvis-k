import { describe, expect, it } from "vitest";
import { parseXunfeiResult } from "../src";

describe("Xunfei RTASR parser", () => {
  it("normalizes partial transcript groups", () => {
    expect(
      parseXunfeiResult({
        seg_id: 7,
        cn: {
          st: {
            type: "1",
            rt: [
              {
                ws: [
                  { cw: [{ w: "Jarvis" }] },
                  { cw: [{ w: " ready" }] }
                ]
              }
            ]
          }
        }
      })
    ).toEqual({
      text: "Jarvis ready",
      isFinal: false,
      segmentId: "7"
    });
  });

  it("normalizes final transcripts from JSON payloads", () => {
    expect(
      parseXunfeiResult(
        JSON.stringify({
          segId: "segment-8",
          cn: {
            st: {
              type: "0",
              rt: [{ ws: [{ cw: [{ w: "complete" }] }] }]
            }
          }
        })
      )
    ).toEqual({
      text: "complete",
      isFinal: true,
      segmentId: "segment-8"
    });
  });

  it("ignores malformed or empty provider payloads", () => {
    expect(parseXunfeiResult("{invalid")).toBeNull();
    expect(parseXunfeiResult({ cn: { st: { type: "1", rt: [] } } })).toBeNull();
  });
});
