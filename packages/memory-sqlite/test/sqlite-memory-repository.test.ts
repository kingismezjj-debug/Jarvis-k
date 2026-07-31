import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import initSqlJs from "sql.js";
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

  it("reports health for usable and corrupt databases", async () => {
    const repository = new SqliteMemoryRepository();
    await repository.initialize();

    expect(await repository.checkHealth()).toMatchObject({
      status: "ok"
    });
    await repository.close();

    const corruptPath = createTempDatabasePath();
    fs.writeFileSync(corruptPath, "not a sqlite database");
    const corruptRepository = new SqliteMemoryRepository({
      filePath: corruptPath
    });

    expect(await corruptRepository.checkHealth()).toMatchObject({
      status: "degraded",
      code: "MEMORY_UNAVAILABLE"
    });
    await corruptRepository.close();
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

  it("returns bounded recent messages in chronological order", async () => {
    const repository = new SqliteMemoryRepository();
    await repository.initialize();
    await repository.appendMessage(message("msg-a", "primary", "00.001Z"));
    await repository.appendMessage(message("msg-b", "primary", "00.001Z"));
    await repository.appendMessage(message("msg-x", "other", "00.002Z"));
    await repository.appendMessage(message("msg-c", "primary", "00.003Z"));

    expect(
      (
        await repository.listRecentMessages({
          conversationId: "primary",
          limit: 2
        })
      ).map((item) => item.id)
    ).toEqual(["msg-b", "msg-c"]);
    await repository.close();
  });

  it("persists conversation metadata and active selection", async () => {
    const filePath = createTempDatabasePath();
    const first = new SqliteMemoryRepository({ filePath });
    await first.initialize();
    await first.upsertConversation({
      id: "primary",
      title: "Primary chat",
      createdAt: "2026-07-30T00:00:00.000Z",
      updatedAt: "2026-07-30T00:00:00.000Z"
    });
    await first.updateConversation({
      id: "primary",
      title: "Renamed chat",
      updatedAt: "2026-07-30T00:00:01.000Z"
    });
    await first.setActiveConversationId("primary");
    await first.close();

    const second = new SqliteMemoryRepository({ filePath });
    await second.initialize();

    expect(await second.listConversations()).toEqual([
      {
        id: "primary",
        title: "Renamed chat",
        createdAt: "2026-07-30T00:00:00.000Z",
        updatedAt: "2026-07-30T00:00:01.000Z"
      }
    ]);
    expect(await second.getActiveConversationId()).toBe("primary");
    await second.close();
  });

  it("creates and updates conversation timestamps when messages are appended", async () => {
    const repository = new SqliteMemoryRepository();
    await repository.initialize();
    await repository.appendMessage(
      message("msg-1", "primary", "00.001Z", "First title")
    );
    await repository.appendMessage(
      message("msg-2", "primary", "00.003Z", "Keep title")
    );
    await repository.appendMessage(
      message("msg-3", "secondary", "00.002Z", "Other chat")
    );
    await repository.upsertConversation({
      id: "primary",
      title: "Retitled",
      createdAt: "2026-07-30T00:00:00.001Z",
      updatedAt: "2026-07-30T00:00:00.004Z"
    });

    expect(await repository.listConversations()).toEqual([
      {
        id: "primary",
        title: "Retitled",
        createdAt: "2026-07-30T00:00:00.001Z",
        updatedAt: "2026-07-30T00:00:00.004Z",
        lastMessageAt: "2026-07-30T00:00:00.003Z"
      },
      {
        id: "secondary",
        title: "Other chat",
        createdAt: "2026-07-30T00:00:00.002Z",
        updatedAt: "2026-07-30T00:00:00.002Z",
        lastMessageAt: "2026-07-30T00:00:00.002Z"
      }
    ]);
    await repository.close();
  });

  it("migrates legacy message-only databases with conversation metadata", async () => {
    const filePath = createTempDatabasePath();
    await createLegacyMessageDatabase(filePath);

    const repository = new SqliteMemoryRepository({ filePath });
    await repository.initialize();

    expect(await repository.listConversations()).toEqual([
      {
        id: "primary",
        title: "primary",
        createdAt: "2026-07-30T00:00:00.001Z",
        updatedAt: "2026-07-30T00:00:00.003Z",
        lastMessageAt: "2026-07-30T00:00:00.003Z"
      }
    ]);
    expect((await repository.listMessages()).map((item) => item.id))
      .toEqual(["msg-1", "msg-2"]);
    await repository.close();
  });

  it("persists summaries and upgrades v1 databases", async () => {
    const filePath = createTempDatabasePath();
    await createConversationMetadataDatabaseV1(filePath);

    const first = new SqliteMemoryRepository({ filePath });
    await first.initialize();
    expect(await first.listSummaries()).toEqual([]);
    await first.upsertSummary({
      id: "sum-1",
      conversationId: "primary",
      text: "The user is building durable local memory.",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
      fromMessageId: "msg-1",
      toMessageId: "msg-2"
    });
    await first.upsertSummary({
      id: "sum-2",
      conversationId: "other",
      text: "Other conversation summary.",
      createdAt: "2026-07-31T00:00:01.000Z",
      updatedAt: "2026-07-31T00:00:01.000Z"
    });
    await first.close();

    const second = new SqliteMemoryRepository({ filePath });
    await second.initialize();

    expect(await second.listSummaries({ conversationId: "primary" }))
      .toEqual([
        {
          id: "sum-1",
          conversationId: "primary",
          text: "The user is building durable local memory.",
          createdAt: "2026-07-31T00:00:00.000Z",
          updatedAt: "2026-07-31T00:00:00.000Z",
          fromMessageId: "msg-1",
          toMessageId: "msg-2"
        }
      ]);
    expect((await second.listConversations()).map((item) => item.id))
      .toEqual(["other", "primary"]);
    await second.close();
  });

  it("restores snapshots atomically", async () => {
    const repository = new SqliteMemoryRepository();
    await repository.initialize();
    await repository.appendMessage(message("msg-old", "primary", "00.000Z"));

    await repository.restoreSnapshot({
      messages: [
        message("msg-2", "primary", "00.002Z"),
        message("msg-1", "primary", "00.001Z")
      ],
      summaries: [
        {
          id: "sum-1",
          conversationId: "primary",
          text: "Snapshot summary.",
          createdAt: "2026-07-31T00:00:00.000Z",
          updatedAt: "2026-07-31T00:00:00.000Z",
          fromMessageId: "msg-1",
          toMessageId: "msg-2"
        }
      ],
      activeConversationId: "primary"
    });

    expect((await repository.getSnapshot()).messages.map((item) => item.id))
      .toEqual(["msg-1", "msg-2"]);
    expect((await repository.getSnapshot()).summaries.map((item) => item.id))
      .toEqual(["sum-1"]);
    expect(await repository.getActiveConversationId()).toBe("primary");
    await repository.close();
  });

  it("exports and imports provider-neutral snapshots", async () => {
    const source = new SqliteMemoryRepository();
    await source.initialize();
    await source.appendMessage(message("msg-1", "primary", "00.001Z"));
    await source.upsertSummary({
      id: "sum-1",
      conversationId: "primary",
      text: "Portable summary.",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z"
    });

    const target = new SqliteMemoryRepository();
    await target.initialize();
    await target.importSnapshot(await source.exportSnapshot());

    expect((await target.listMessages()).map((item) => item.id))
      .toEqual(["msg-1"]);
    expect((await target.listSummaries()).map((item) => item.id))
      .toEqual(["sum-1"]);
    await source.close();
    await target.close();
  });

  it("recovers corrupt file-backed databases through snapshot import", async () => {
    const filePath = createTempDatabasePath();
    fs.writeFileSync(filePath, "not a sqlite database");
    const repository = new SqliteMemoryRepository({ filePath });

    await repository.importSnapshot({
      messages: [message("msg-1", "primary", "00.001Z")]
    });

    expect((await repository.listMessages()).map((item) => item.id))
      .toEqual(["msg-1"]);
    expect(await repository.checkHealth()).toMatchObject({
      status: "ok"
    });
    await repository.close();
  });
});

function message(
  id: string,
  conversationId: string,
  suffix: string,
  text = id
) {
  return {
    id,
    conversationId,
    role: "user" as const,
    text,
    createdAt: `2026-07-30T00:00:${suffix}`
  };
}

async function createLegacyMessageDatabase(filePath: string): Promise<void> {
  const sql = await initSqlJs();
  const database = new sql.Database();
  database.run(`
    CREATE TABLE messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    INSERT INTO messages
      (id, conversation_id, role, text, created_at)
    VALUES
      ('msg-2', 'primary', 'user', 'Second', '2026-07-30T00:00:00.003Z'),
      ('msg-1', 'primary', 'user', 'First', '2026-07-30T00:00:00.001Z');
  `);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, database.export());
  database.close();
}

async function createConversationMetadataDatabaseV1(
  filePath: string
): Promise<void> {
  const sql = await initSqlJs();
  const database = new sql.Database();
  database.run(`
    CREATE TABLE messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE conversations (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_message_at TEXT
    );
    CREATE TABLE memory_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    INSERT INTO messages
      (id, conversation_id, role, text, created_at)
    VALUES
      ('msg-1', 'primary', 'user', 'First', '2026-07-30T00:00:00.001Z'),
      ('msg-2', 'primary', 'user', 'Second', '2026-07-30T00:00:00.002Z');
    INSERT INTO conversations
      (id, title, created_at, updated_at, last_message_at)
    VALUES
      (
        'primary',
        'Primary',
        '2026-07-30T00:00:00.001Z',
        '2026-07-30T00:00:00.002Z',
        '2026-07-30T00:00:00.002Z'
      );
    PRAGMA user_version = 1;
  `);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, database.export());
  database.close();
}

function createTempDatabasePath(): string {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "jarvis-k-memory-")
  );
  tempDirectories.push(directory);
  return path.join(directory, "memory.sqlite");
}
