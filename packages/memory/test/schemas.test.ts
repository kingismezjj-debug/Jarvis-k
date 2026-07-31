import { describe, expect, it } from "vitest";
import {
  ConversationSchema,
  MemoryHealthSchema,
  MemorySnapshotSchema,
  MemorySummarySchema
} from "../src";

describe("ConversationSchema", () => {
  it("validates provider-neutral conversation metadata", () => {
    const conversation = ConversationSchema.parse({
      id: "primary",
      title: "Primary chat",
      createdAt: "2026-07-30T00:00:00.000Z",
      updatedAt: "2026-07-30T00:00:01.000Z",
      lastMessageAt: "2026-07-30T00:00:01.000Z"
    });

    expect(conversation.id).toBe("primary");
  });
});

describe("MemoryHealthSchema", () => {
  it("validates provider-neutral health checks", () => {
    const health = MemoryHealthSchema.parse({
      status: "degraded",
      checkedAt: "2026-07-31T00:00:00.000Z",
      code: "MEMORY_CORRUPT",
      message: "Memory store is unavailable."
    });

    expect(health.status).toBe("degraded");
  });
});

describe("MemorySummarySchema", () => {
  it("validates provider-neutral summary records", () => {
    const summary = MemorySummarySchema.parse({
      id: "sum-1",
      conversationId: "primary",
      text: "The user wants durable local memory.",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
      fromMessageId: "msg-1",
      toMessageId: "msg-3"
    });

    expect(summary.toMessageId).toBe("msg-3");
  });
});

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
      ],
      conversations: [
        {
          id: "primary",
          title: "Primary chat",
          createdAt: "2026-07-30T00:00:00.000Z",
          updatedAt: "2026-07-30T00:00:00.000Z"
        }
      ],
      summaries: [
        {
          id: "sum-1",
          conversationId: "primary",
          text: "Persist this request.",
          createdAt: "2026-07-31T00:00:00.000Z",
          updatedAt: "2026-07-31T00:00:00.000Z"
        }
      ],
      activeConversationId: "primary"
    });

    expect(snapshot.messages[0]?.id).toBe("msg-1");
    expect(snapshot.conversations[0]?.id).toBe("primary");
    expect(snapshot.summaries[0]?.id).toBe("sum-1");
    expect(snapshot.activeConversationId).toBe("primary");
  });

  it("defaults older message-only snapshots to no conversations", () => {
    const snapshot = MemorySnapshotSchema.parse({
      messages: []
    });

    expect(snapshot.conversations).toEqual([]);
    expect(snapshot.summaries).toEqual([]);
  });
});
