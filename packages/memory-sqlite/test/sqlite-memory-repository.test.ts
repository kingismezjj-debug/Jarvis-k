import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import initSqlJs, { type Database } from "sql.js";
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

  it("creates the v3 vector table and indexes without enabling vector writes", async () => {
    const filePath = createTempDatabasePath();
    const repository = new SqliteMemoryRepository({ filePath });
    await repository.initialize();

    expect(
      "writeEmbeddingRecord" in
        (repository as unknown as Record<string, unknown>)
    ).toBe(false);
    expect(
      "querySimilar" in (repository as unknown as Record<string, unknown>)
    ).toBe(false);
    await repository.close();

    const schema = await inspectVectorSchema(filePath);
    expect(schema.userVersion).toBe(3);
    expect(schema.columns).toEqual([
      "id",
      "conversation_id",
      "source_type",
      "source_id",
      "model_id",
      "dimensions",
      "vector_payload",
      "created_at"
    ]);
    expect(schema.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "idx_memory_embeddings_model_conversation",
          unique: false
        }),
        expect.objectContaining({
          name: "idx_memory_embeddings_source",
          unique: true
        })
      ])
    );
    expect(schema.rowCount).toBe(0);
  });

  it("upgrades v2 databases to the vector schema while preserving existing records", async () => {
    const filePath = createTempDatabasePath();
    await createSummaryDatabaseV2(filePath);

    const repository = new SqliteMemoryRepository({ filePath });
    await repository.initialize();

    expect((await repository.listMessages()).map((item) => item.id))
      .toEqual(["msg-1"]);
    expect((await repository.listSummaries()).map((item) => item.id))
      .toEqual(["sum-1"]);
    expect(await repository.checkHealth()).toMatchObject({
      status: "ok"
    });
    await repository.close();

    const schema = await inspectVectorSchema(filePath);
    expect(schema.userVersion).toBe(3);
    expect(schema.tableExists).toBe(true);
    expect(schema.rowCount).toBe(0);
  });

  it("enforces vector table source, dimension, payload, and duplicate guards", async () => {
    const filePath = createTempDatabasePath();
    const repository = new SqliteMemoryRepository({ filePath });
    await repository.initialize();
    await repository.close();

    await withDatabase(filePath, (database) => {
      insertFixtureEmbedding(database, "embedding-1");
      expect(() => insertFixtureEmbedding(database, "embedding-2")).toThrow();
      expect(() =>
        insertFixtureEmbedding(database, "embedding-invalid-source", {
          sourceType: "document"
        })
      ).toThrow();
      expect(() =>
        insertFixtureEmbedding(database, "embedding-invalid-dimensions", {
          dimensions: 0
        })
      ).toThrow();
      expect(() =>
        insertFixtureEmbedding(database, "embedding-empty-payload", {
          vectorPayload: new Uint8Array()
        })
      ).toThrow();
    });
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

  it("clears vector rows on snapshot restore and excludes them from export", async () => {
    const filePath = createTempDatabasePath();
    const first = new SqliteMemoryRepository({ filePath });
    await first.initialize();
    await first.appendMessage(message("msg-old", "primary", "00.001Z"));
    await first.close();

    await withDatabase(filePath, (database) => {
      insertFixtureEmbedding(database, "embedding-old");
    });

    const second = new SqliteMemoryRepository({ filePath });
    await second.initialize();
    await second.restoreSnapshot({
      messages: [message("msg-new", "primary", "00.002Z")]
    });
    const exported = await second.exportSnapshot();
    await second.close();

    expect((await inspectVectorSchema(filePath)).rowCount).toBe(0);
    expect(exported.messages.map((item) => item.id)).toEqual(["msg-new"]);
    expect(JSON.stringify(exported)).not.toContain("embedding-old");
    expect(JSON.stringify(exported)).not.toContain("fixture/embedding");
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

async function createSummaryDatabaseV2(filePath: string): Promise<void> {
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
    CREATE TABLE summaries (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      from_message_id TEXT,
      to_message_id TEXT
    );
    INSERT INTO messages
      (id, conversation_id, role, text, created_at)
    VALUES
      ('msg-1', 'primary', 'user', 'First', '2026-07-30T00:00:00.001Z');
    INSERT INTO conversations
      (id, title, created_at, updated_at, last_message_at)
    VALUES
      (
        'primary',
        'Primary',
        '2026-07-30T00:00:00.001Z',
        '2026-07-30T00:00:00.001Z',
        '2026-07-30T00:00:00.001Z'
      );
    INSERT INTO summaries
      (
        id,
        conversation_id,
        text,
        created_at,
        updated_at,
        from_message_id,
        to_message_id
      )
    VALUES
      (
        'sum-1',
        'primary',
        'V2 summary',
        '2026-07-31T00:00:00.000Z',
        '2026-07-31T00:00:00.000Z',
        'msg-1',
        'msg-1'
      );
    PRAGMA user_version = 2;
  `);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, database.export());
  database.close();
}

interface VectorSchemaInspection {
  userVersion: number;
  tableExists: boolean;
  columns: string[];
  indexes: Array<{ name: string; unique: boolean }>;
  rowCount: number;
}

async function inspectVectorSchema(
  filePath: string
): Promise<VectorSchemaInspection> {
  return withDatabase(filePath, (database) => {
    const tableInfo = database.exec("PRAGMA table_info(memory_embeddings)");
    const indexInfo = database.exec("PRAGMA index_list(memory_embeddings)");
    const userVersionRow = database.exec("PRAGMA user_version");
    const countRow = database.exec("SELECT COUNT(*) FROM memory_embeddings");

    return {
      userVersion: Number(userVersionRow[0]?.values[0]?.[0] ?? 0),
      tableExists: (tableInfo[0]?.values.length ?? 0) > 0,
      columns: (tableInfo[0]?.values ?? []).map((row) => String(row[1])),
      indexes: (indexInfo[0]?.values ?? [])
        .map((row) => ({
          name: String(row[1]),
          unique: row[2] === 1
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
      rowCount: Number(countRow[0]?.values[0]?.[0] ?? 0)
    };
  });
}

async function withDatabase<T>(
  filePath: string,
  callback: (database: Database) => T
): Promise<T> {
  const sql = await initSqlJs();
  const database = new sql.Database(fs.readFileSync(filePath));
  try {
    const result = callback(database);
    fs.writeFileSync(filePath, database.export());
    return result;
  } finally {
    database.close();
  }
}

function insertFixtureEmbedding(
  database: Database,
  id: string,
  options: {
    sourceType?: string;
    dimensions?: number;
    vectorPayload?: Uint8Array;
  } = {}
): void {
  database.run(
    `INSERT INTO memory_embeddings
      (
        id,
        conversation_id,
        source_type,
        source_id,
        model_id,
        dimensions,
        vector_payload,
        created_at
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      "primary",
      options.sourceType ?? "message",
      "msg-old",
      "fixture/embedding",
      options.dimensions ?? 2,
      options.vectorPayload ?? new Uint8Array([1, 2, 3, 4]),
      "2026-08-03T00:00:00.000Z"
    ]
  );
}

function createTempDatabasePath(): string {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "jarvis-k-memory-")
  );
  tempDirectories.push(directory);
  return path.join(directory, "memory.sqlite");
}
