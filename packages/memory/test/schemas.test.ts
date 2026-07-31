import { describe, expect, it } from "vitest";
import { MemorySnapshotSchema } from "../src";

describe("MemorySnapshotSchema", () => {
  it("validates provider-neutral message snapshots", () => {
    const snapshot = MemorySnapshotSchema.parse({
      messages: [
        {
          id: "msg-1",
          conversationId: "primary",
          role: "user",
          text: "Persist this",
          createdAt: "2026-07-30T00:00:00.000Z"
        }
      ]
    });

    expect(snapshot.messages[0]?.id).toBe("msg-1");
  });
});
