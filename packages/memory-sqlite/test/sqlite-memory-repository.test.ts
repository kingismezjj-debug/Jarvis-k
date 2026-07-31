import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { SqliteMemoryRepository } from "../src";

const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe("SqliteMemoryRepository", () => {
  it("persists messages and restores them from disk", async () => {
    const filePath = createTempDatabasePath();
    const first = new SqliteMemoryRepository({ filePath });
    await first.initialize();
    await first.appendMessage({
      id: "msg-1",
      conversationId: "primary",
      role: "user",
      text: "Remember this",
      createdAt: "2026-07-30T00:00:00.000Z"
    });
    await first.close();

    const second = new SqliteMemoryRepository({ filePath });
    await second.initialize();

    expect(await second.listMessages()).toEqual([
      {
        id: "msg-1",
        conversationId: "primary",
        role: "user",
        text: "Remember this",
        createdAt: "2026-07-30T00:00:00.000Z"
      }
    ]);
    await second.close();
  });

  it("returns deterministic ordering across conversations", async () => {
    const repository = new SqliteMemoryRepository();
    await repository.initialize();
    await repository.appendMessage(message("msg-c", "other", "00.200Z"));
    await repository.appendMessage(message("msg-b", "primary", "00.100Z"));
    await repository.appendMessage(message("msg-a", "primary", "00.100Z"));

    expect((await repository.listMessages()).map((item) => item.id)).toEqual([
      "msg-a",
      "msg-b",
      "msg-c"
    ]);
    expect(
      (
        await repository.listMessages({
          conversationId: "primary",
          limit: 1
        })
      ).map((item) => item.id)
    ).toEqual(["msg-a"]);
    await repository.close();
  });

  it("restores snapshots atomically", async () => {
    const repository = new SqliteMemoryRepository();
    await repository.initialize();
    await repository.appendMessage(message("msg-old", "primary", "00.000Z"));

    await repository.restoreSnapshot({
      messages: [
        message("msg-2", "primary", "00.002Z"),
        message("msg-1", "primary", "00.001Z")
      ]
    });

    expect((await repository.getSnapshot()).messages.map((item) => item.id))
      .toEqual(["msg-1", "msg-2"]);
    await repository.close();
  });
});

function message(id: string, conversationId: string, suffix: string) {
  return {
    id,
    conversationId,
    role: "user" as const,
    text: id,
    createdAt: `2026-07-30T00:00:${suffix}`
  };
}

function createTempDatabasePath(): string {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "jarvis-k-memory-")
  );
  tempDirectories.push(directory);
  return path.join(directory, "memory.sqlite");
}
