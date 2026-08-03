import fs from "node:fs";
import path from "node:path";
import initSqlJs, {
  type Database,
  type SqlJsStatic
} from "sql.js";
import {
  type Message,
  MessageSchema
} from "@jarvis-k/contracts";
import {
  type Conversation,
  ConversationSchema,
  type ConversationCreateInput,
  type ConversationListOptions,
  type ConversationUpdateInput,
  type MemoryHealth,
  MemoryHealthSchema,
  type MemorySummary,
  MemorySummarySchema,
  type MemoryRepository,
  type MemorySnapshot,
  type MemorySnapshotInput,
  MemorySnapshotSchema,
  type MessageListOptions,
  type RecentMessageListOptions,
  type SummaryListOptions,
  type SummaryWriteInput,
  type EmbeddingMemoryRecord,
  type EmbeddingMemoryVectorWriteResult,
  cloneConversation,
  cloneMessage,
  validateEmbeddingMemoryVectorWriteInput
} from "@jarvis-k/memory";

export interface SqliteMemoryRepositoryOptions {
  filePath?: string;
  now?: () => Date;
}

const ACTIVE_CONVERSATION_KEY = "active_conversation_id";
const SCHEMA_VERSION = 3;

export class SqliteMemoryRepository implements MemoryRepository {
  private sql: SqlJsStatic | undefined;
  private database: Database | undefined;
  private initialized = false;

  public constructor(
    private readonly options: SqliteMemoryRepositoryOptions = {}
  ) {}

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.sql = await initSqlJs();
    const existingBytes =
      this.options.filePath && fs.existsSync(this.options.filePath)
        ? fs.readFileSync(this.options.filePath)
        : undefined;
    this.database = existingBytes
      ? new this.sql.Database(existingBytes)
      : new this.sql.Database();
    this.migrate(this.database);
    this.initialized = true;
    await this.flush();
  }

  public async checkHealth(): Promise<MemoryHealth> {
    try {
      const database = await this.getDatabase();
      const rows = database.exec("PRAGMA integrity_check");
      const value = rows[0]?.values[0]?.[0];
      if (value !== "ok") {
        return this.degradedHealth(
          "MEMORY_INTEGRITY_CHECK_FAILED",
          "Memory store integrity check failed."
        );
      }
      return MemoryHealthSchema.parse({
        status: "ok",
        checkedAt: this.nowIso()
      });
    } catch {
      return this.degradedHealth(
        "MEMORY_UNAVAILABLE",
        "Memory store is unavailable."
      );
    }
  }

  public async upsertConversation(
    input: ConversationCreateInput
  ): Promise<Conversation> {
    const now = this.nowIso();
    const parsed = ConversationSchema.parse({
      id: input.id,
      title: input.title,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? input.createdAt ?? now,
      ...(input.lastMessageAt ? { lastMessageAt: input.lastMessageAt } : {})
    });
    const database = await this.getDatabase();
    database.run(
      `INSERT INTO conversations
        (id, title, created_at, updated_at, last_message_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        updated_at = excluded.updated_at,
        last_message_at = COALESCE(
          excluded.last_message_at,
          conversations.last_message_at
        )`,
      [
        parsed.id,
        parsed.title,
        parsed.createdAt,
        parsed.updatedAt,
        parsed.lastMessageAt ?? null
      ]
    );
    const stored = await this.getConversation(parsed.id);
    if (!stored) {
      throw new Error(`Conversation ${parsed.id} was not persisted.`);
    }
    await this.flush();
    return stored;
  }

  public async updateConversation(
    input: ConversationUpdateInput
  ): Promise<Conversation> {
    const database = await this.getDatabase();
    const existing = await this.getConversation(input.id);
    if (!existing) {
      throw new Error(`Conversation ${input.id} does not exist.`);
    }
    const updated = ConversationSchema.parse({
      ...existing,
      ...(input.title ? { title: input.title } : {}),
      updatedAt: input.updatedAt ?? this.nowIso()
    });
    database.run(
      `UPDATE conversations
       SET title = ?, updated_at = ?
       WHERE id = ?`,
      [updated.title, updated.updatedAt, updated.id]
    );
    await this.flush();
    return cloneConversation(updated);
  }

  public async listConversations(
    options: ConversationListOptions = {}
  ): Promise<Conversation[]> {
    const database = await this.getDatabase();
    const limit =
      options.limit === undefined
        ? ""
        : `LIMIT ${this.normalizeLimit(options.limit, "Conversation")}`;
    const rows = database.exec(
      `SELECT id, title, created_at, updated_at, last_message_at
       FROM conversations
       ORDER BY updated_at DESC, id ASC
       ${limit}`
    );
    return this.toConversations(rows);
  }

  public async getActiveConversationId(): Promise<string | undefined> {
    const database = await this.getDatabase();
    const rows = database.exec(
      `SELECT value
       FROM memory_settings
       WHERE key = ?`,
      [ACTIVE_CONVERSATION_KEY]
    );
    const [result] = rows;
    const value = result?.values[0]?.[0];
    return typeof value === "string" ? value : undefined;
  }

  public async setActiveConversationId(
    conversationId: string
  ): Promise<void> {
    const database = await this.getDatabase();
    if (!(await this.getConversation(conversationId))) {
      throw new Error(`Conversation ${conversationId} does not exist.`);
    }
    database.run(
      `INSERT INTO memory_settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [ACTIVE_CONVERSATION_KEY, conversationId]
    );
    await this.flush();
  }

  public async appendMessage(message: Message): Promise<Message> {
    const parsed = MessageSchema.parse(message);
    const database = await this.getDatabase();
    database.run("BEGIN IMMEDIATE TRANSACTION");
    try {
      this.ensureConversationForMessage(database, parsed);
      database.run(
        `INSERT INTO messages
          (id, conversation_id, role, text, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          parsed.id,
          parsed.conversationId,
          parsed.role,
          parsed.text,
          parsed.createdAt
        ]
      );
      database.run("COMMIT");
    } catch (error) {
      database.run("ROLLBACK");
      throw error;
    }
    await this.flush();
    return cloneMessage(parsed);
  }

  public async listMessages(
    options: MessageListOptions = {}
  ): Promise<Message[]> {
    const database = await this.getDatabase();
    const where = options.conversationId
      ? "WHERE conversation_id = ?"
      : "";
    const limit =
      options.limit === undefined
        ? ""
        : `LIMIT ${this.normalizeLimit(options.limit, "Message")}`;
    const params = options.conversationId ? [options.conversationId] : [];
    const rows = database.exec(
      `SELECT id, conversation_id, role, text, created_at
       FROM messages
       ${where}
       ORDER BY created_at ASC, id ASC
       ${limit}`,
      params
    );
    return this.toMessages(rows);
  }

  public async listRecentMessages(
    options: RecentMessageListOptions
  ): Promise<Message[]> {
    const database = await this.getDatabase();
    const where = options.conversationId
      ? "WHERE conversation_id = ?"
      : "";
    const params = options.conversationId ? [options.conversationId] : [];
    const rows = database.exec(
      `SELECT id, conversation_id, role, text, created_at
       FROM messages
       ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT ${this.normalizeLimit(options.limit, "Recent message")}`,
      params
    );
    return this.toMessages(rows).reverse();
  }

  public async upsertSummary(
    input: SummaryWriteInput
  ): Promise<MemorySummary> {
    const now = this.nowIso();
    const parsed = MemorySummarySchema.parse({
      id: input.id,
      conversationId: input.conversationId,
      text: input.text,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? input.createdAt ?? now,
      ...(input.fromMessageId
        ? { fromMessageId: input.fromMessageId }
        : {}),
      ...(input.toMessageId ? { toMessageId: input.toMessageId } : {})
    });
    const database = await this.getDatabase();
    database.run("BEGIN IMMEDIATE TRANSACTION");
    try {
      this.ensureConversationForSummary(database, parsed);
      database.run(
        `INSERT INTO summaries
          (
            id,
            conversation_id,
            text,
            created_at,
            updated_at,
            from_message_id,
            to_message_id
          )
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
          conversation_id = excluded.conversation_id,
          text = excluded.text,
          updated_at = excluded.updated_at,
          from_message_id = excluded.from_message_id,
          to_message_id = excluded.to_message_id`,
        [
          parsed.id,
          parsed.conversationId,
          parsed.text,
          parsed.createdAt,
          parsed.updatedAt,
          parsed.fromMessageId ?? null,
          parsed.toMessageId ?? null
        ]
      );
      database.run("COMMIT");
    } catch (error) {
      database.run("ROLLBACK");
      throw error;
    }
    const stored = await this.getSummary(parsed.id);
    if (!stored) {
      throw new Error(`Summary ${parsed.id} was not persisted.`);
    }
    await this.flush();
    return stored;
  }

  public async listSummaries(
    options: SummaryListOptions = {}
  ): Promise<MemorySummary[]> {
    const database = await this.getDatabase();
    const where = options.conversationId
      ? "WHERE conversation_id = ?"
      : "";
    const limit =
      options.limit === undefined
        ? ""
        : `LIMIT ${this.normalizeLimit(options.limit, "Summary")}`;
    const params = options.conversationId ? [options.conversationId] : [];
    const rows = database.exec(
      `SELECT
        id,
        conversation_id,
        text,
        created_at,
        updated_at,
        from_message_id,
        to_message_id
       FROM summaries
       ${where}
       ORDER BY updated_at ASC, id ASC
       ${limit}`,
      params
    );
    return this.toSummaries(rows);
  }

  public async getSnapshot(): Promise<MemorySnapshot> {
    return MemorySnapshotSchema.parse({
      messages: await this.listMessages(),
      conversations: await this.listConversations(),
      summaries: await this.listSummaries(),
      activeConversationId: await this.getActiveConversationId()
    });
  }

  public async restoreSnapshot(snapshot: MemorySnapshotInput): Promise<void> {
    const parsed = MemorySnapshotSchema.parse(snapshot);
    const conversations = this.conversationsForSnapshot(parsed);
    const database = await this.getDatabaseForRestore();
    database.run("BEGIN IMMEDIATE TRANSACTION");
    try {
      database.run("DELETE FROM memory_settings");
      database.run("DELETE FROM memory_embeddings");
      database.run("DELETE FROM summaries");
      database.run("DELETE FROM messages");
      database.run("DELETE FROM conversations");
      for (const conversation of conversations) {
        database.run(
          `INSERT INTO conversations
            (id, title, created_at, updated_at, last_message_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            conversation.id,
            conversation.title,
            conversation.createdAt,
            conversation.updatedAt,
            conversation.lastMessageAt ?? null
          ]
        );
      }
      for (const message of parsed.messages) {
        database.run(
          `INSERT INTO messages
            (id, conversation_id, role, text, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            message.id,
            message.conversationId,
            message.role,
            message.text,
            message.createdAt
          ]
        );
      }
      for (const summary of parsed.summaries) {
        database.run(
          `INSERT INTO summaries
            (
              id,
              conversation_id,
              text,
              created_at,
              updated_at,
              from_message_id,
              to_message_id
            )
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            summary.id,
            summary.conversationId,
            summary.text,
            summary.createdAt,
            summary.updatedAt,
            summary.fromMessageId ?? null,
            summary.toMessageId ?? null
          ]
        );
      }
      if (parsed.activeConversationId) {
        database.run(
          `INSERT INTO memory_settings (key, value)
           VALUES (?, ?)`,
          [ACTIVE_CONVERSATION_KEY, parsed.activeConversationId]
        );
      }
      database.run("COMMIT");
    } catch (error) {
      database.run("ROLLBACK");
      throw error;
    }
    await this.flush();
  }

  public async exportSnapshot(): Promise<MemorySnapshot> {
    return this.getSnapshot();
  }

  public async importSnapshot(
    snapshot: MemorySnapshotInput
  ): Promise<void> {
    await this.restoreSnapshot(snapshot);
  }

  public async writeEmbeddingRecord(
    record: EmbeddingMemoryRecord
  ): Promise<EmbeddingMemoryVectorWriteResult> {
    const parsed = this.parseEmbeddingRecord(record);
    if (!parsed) {
      return this.degradedVectorWrite("VECTOR_RECORD_INVALID");
    }
    if (!this.isFixtureEmbeddingModel(parsed.modelId)) {
      return this.degradedVectorWrite("VECTOR_NON_FIXTURE_WRITE_BLOCKED");
    }

    const database = await this.getDatabase();
    if (this.readSchemaVersion(database) < 3) {
      return this.degradedVectorWrite("VECTOR_SCHEMA_UNAVAILABLE");
    }
    if (this.hasEmbeddingForSource(database, parsed)) {
      return this.degradedVectorWrite("VECTOR_DUPLICATE_SOURCE");
    }

    database.run("BEGIN IMMEDIATE TRANSACTION");
    try {
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
          parsed.id,
          parsed.conversationId,
          parsed.sourceType,
          parsed.sourceId,
          parsed.modelId,
          parsed.dimensions,
          this.serializeEmbeddingVector(parsed.vector),
          parsed.createdAt
        ]
      );
      database.run("COMMIT");
    } catch {
      database.run("ROLLBACK");
      return this.degradedVectorWrite("VECTOR_WRITE_FAILED");
    }

    await this.flush();
    return {
      status: "accepted",
      recordId: parsed.id
    };
  }

  public async close(): Promise<void> {
    if (!this.database) {
      return;
    }
    await this.flush();
    this.database.close();
    this.database = undefined;
    this.initialized = false;
  }

  private migrate(database: Database): void {
    database.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        text TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_order
        ON messages (conversation_id, created_at, id);
      CREATE INDEX IF NOT EXISTS idx_messages_order
        ON messages (created_at, id);
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_message_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_conversations_updated
        ON conversations (updated_at DESC, id);
      CREATE TABLE IF NOT EXISTS memory_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS summaries (
        id TEXT PRIMARY KEY NOT NULL,
        conversation_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        from_message_id TEXT,
        to_message_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_summaries_conversation_order
        ON summaries (conversation_id, updated_at, id);
      CREATE INDEX IF NOT EXISTS idx_summaries_order
        ON summaries (updated_at, id);
      CREATE TABLE IF NOT EXISTS memory_embeddings (
        id TEXT PRIMARY KEY NOT NULL,
        conversation_id TEXT NOT NULL,
        source_type TEXT NOT NULL CHECK (source_type IN ('message', 'summary')),
        source_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        dimensions INTEGER NOT NULL CHECK (dimensions >= 1 AND dimensions <= 8192),
        vector_payload BLOB NOT NULL CHECK (length(vector_payload) > 0),
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memory_embeddings_model_conversation
        ON memory_embeddings (model_id, conversation_id, created_at, id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_embeddings_source
        ON memory_embeddings (model_id, source_type, source_id);
    `);

    const version = this.readSchemaVersion(database);
    if (version < 1) {
      database.run(
        `INSERT OR IGNORE INTO conversations
          (id, title, created_at, updated_at, last_message_at)
        SELECT
          conversation_id,
          conversation_id,
          MIN(created_at),
          MAX(created_at),
          MAX(created_at)
        FROM messages
        GROUP BY conversation_id;`
      );
    }

    if (version < SCHEMA_VERSION) {
      database.run(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    }
  }

  private readSchemaVersion(database: Database): number {
    const rows = database.exec("PRAGMA user_version");
    const value = rows[0]?.values[0]?.[0];
    return typeof value === "number" ? value : 0;
  }

  private parseEmbeddingRecord(
    record: EmbeddingMemoryRecord
  ): EmbeddingMemoryRecord | undefined {
    try {
      return validateEmbeddingMemoryVectorWriteInput(record);
    } catch {
      return undefined;
    }
  }

  private isFixtureEmbeddingModel(modelId: string): boolean {
    return modelId.startsWith("fixture/");
  }

  private hasEmbeddingForSource(
    database: Database,
    record: EmbeddingMemoryRecord
  ): boolean {
    const rows = database.exec(
      `SELECT id
       FROM memory_embeddings
       WHERE model_id = ?
        AND source_type = ?
        AND source_id = ?
       LIMIT 1`,
      [record.modelId, record.sourceType, record.sourceId]
    );
    return (rows[0]?.values.length ?? 0) > 0;
  }

  private serializeEmbeddingVector(vector: readonly number[]): Uint8Array {
    const payload = new Float32Array(vector);
    return new Uint8Array(payload.buffer);
  }

  private degradedVectorWrite(
    reasonCode: string
  ): EmbeddingMemoryVectorWriteResult {
    return {
      status: "degraded",
      reasonCode
    };
  }

  private async getConversation(
    conversationId: string
  ): Promise<Conversation | undefined> {
    const database = await this.getDatabase();
    const rows = database.exec(
      `SELECT id, title, created_at, updated_at, last_message_at
       FROM conversations
       WHERE id = ?`,
      [conversationId]
    );
    return this.toConversations(rows)[0];
  }

  private ensureConversationForMessage(
    database: Database,
    message: Message
  ): void {
    database.run(
      `INSERT INTO conversations
        (id, title, created_at, updated_at, last_message_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        updated_at = CASE
          WHEN excluded.last_message_at > conversations.updated_at
          THEN excluded.last_message_at
          ELSE conversations.updated_at
        END,
        last_message_at = CASE
          WHEN conversations.last_message_at IS NULL
            OR excluded.last_message_at > conversations.last_message_at
          THEN excluded.last_message_at
          ELSE conversations.last_message_at
        END`,
      [
        message.conversationId,
        this.defaultConversationTitle(message),
        message.createdAt,
        message.createdAt,
        message.createdAt
      ]
    );
  }

  private ensureConversationForSummary(
    database: Database,
    summary: MemorySummary
  ): void {
    database.run(
      `INSERT INTO conversations
        (id, title, created_at, updated_at, last_message_at)
       VALUES (?, ?, ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET
        updated_at = CASE
          WHEN excluded.updated_at > conversations.updated_at
          THEN excluded.updated_at
          ELSE conversations.updated_at
        END`,
      [
        summary.conversationId,
        summary.conversationId,
        summary.createdAt,
        summary.updatedAt
      ]
    );
  }

  private conversationsForSnapshot(
    snapshot: MemorySnapshot
  ): Conversation[] {
    const conversations = new Map<string, Conversation>();
    for (const conversation of snapshot.conversations) {
      conversations.set(conversation.id, cloneConversation(conversation));
    }

    for (const message of snapshot.messages) {
      const existing = conversations.get(message.conversationId);
      if (!existing) {
        conversations.set(message.conversationId, {
          id: message.conversationId,
          title: this.defaultConversationTitle(message),
          createdAt: message.createdAt,
          updatedAt: message.createdAt,
          lastMessageAt: message.createdAt
        });
        continue;
      }
      if (
        existing.lastMessageAt === undefined ||
        message.createdAt > existing.lastMessageAt
      ) {
        conversations.set(message.conversationId, {
          ...existing,
          createdAt:
            message.createdAt < existing.createdAt
              ? message.createdAt
              : existing.createdAt,
          updatedAt:
            message.createdAt > existing.updatedAt
              ? message.createdAt
              : existing.updatedAt,
          lastMessageAt: message.createdAt
        });
      }
    }

    for (const summary of snapshot.summaries) {
      const existing = conversations.get(summary.conversationId);
      if (!existing) {
        conversations.set(summary.conversationId, {
          id: summary.conversationId,
          title: summary.conversationId,
          createdAt: summary.createdAt,
          updatedAt: summary.updatedAt
        });
        continue;
      }
      conversations.set(summary.conversationId, {
        ...existing,
        createdAt:
          summary.createdAt < existing.createdAt
            ? summary.createdAt
            : existing.createdAt,
        updatedAt:
          summary.updatedAt > existing.updatedAt
            ? summary.updatedAt
            : existing.updatedAt
      });
    }

    if (
      snapshot.activeConversationId &&
      !conversations.has(snapshot.activeConversationId)
    ) {
      throw new Error(
        `Active conversation ${snapshot.activeConversationId} does not exist.`
      );
    }

    return [...conversations.values()].sort((left, right) =>
      left.updatedAt === right.updatedAt
        ? left.id.localeCompare(right.id)
        : right.updatedAt.localeCompare(left.updatedAt)
    );
  }

  private async getDatabase(): Promise<Database> {
    await this.initialize();
    if (!this.database) {
      throw new Error("SQLite memory repository is not initialized.");
    }
    return this.database;
  }

  private async getDatabaseForRestore(): Promise<Database> {
    try {
      return await this.getDatabase();
    } catch (error) {
      if (!this.options.filePath) {
        throw error;
      }
      this.database?.close();
      this.sql ??= await initSqlJs();
      this.database = new this.sql.Database();
      this.initialized = true;
      this.migrate(this.database);
      return this.database;
    }
  }

  private toMessages(
    rows: Array<{ columns: string[]; values: unknown[][] }>
  ): Message[] {
    const [result] = rows;
    if (!result) {
      return [];
    }
    return result.values.map((row) =>
      MessageSchema.parse({
        id: row[0],
        conversationId: row[1],
        role: row[2],
        text: row[3],
        createdAt: row[4]
      })
    );
  }

  private toConversations(
    rows: Array<{ columns: string[]; values: unknown[][] }>
  ): Conversation[] {
    const [result] = rows;
    if (!result) {
      return [];
    }
    return result.values.map((row) =>
      ConversationSchema.parse({
        id: row[0],
        title: row[1],
        createdAt: row[2],
        updatedAt: row[3],
        ...(typeof row[4] === "string" ? { lastMessageAt: row[4] } : {})
      })
    );
  }

  private async getSummary(
    summaryId: string
  ): Promise<MemorySummary | undefined> {
    const database = await this.getDatabase();
    const rows = database.exec(
      `SELECT
        id,
        conversation_id,
        text,
        created_at,
        updated_at,
        from_message_id,
        to_message_id
       FROM summaries
       WHERE id = ?`,
      [summaryId]
    );
    return this.toSummaries(rows)[0];
  }

  private toSummaries(
    rows: Array<{ columns: string[]; values: unknown[][] }>
  ): MemorySummary[] {
    const [result] = rows;
    if (!result) {
      return [];
    }
    return result.values.map((row) =>
      MemorySummarySchema.parse({
        id: row[0],
        conversationId: row[1],
        text: row[2],
        createdAt: row[3],
        updatedAt: row[4],
        ...(typeof row[5] === "string" ? { fromMessageId: row[5] } : {}),
        ...(typeof row[6] === "string" ? { toMessageId: row[6] } : {})
      })
    );
  }

  private normalizeLimit(limit: number, label: string): number {
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new Error(`${label} list limit must be an integer from 1 to 500.`);
    }
    return limit;
  }

  private defaultConversationTitle(message: Message): string {
    const text = message.text.trim().replace(/\s+/g, " ");
    return text.length > 0 ? text.slice(0, 80) : message.conversationId;
  }

  private nowIso(): string {
    return (this.options.now?.() ?? new Date()).toISOString();
  }

  private degradedHealth(code: string, message: string): MemoryHealth {
    return MemoryHealthSchema.parse({
      status: "degraded",
      checkedAt: this.nowIso(),
      code,
      message
    });
  }

  private async flush(): Promise<void> {
    if (!this.options.filePath || !this.database) {
      return;
    }
    fs.mkdirSync(path.dirname(this.options.filePath), { recursive: true });
    fs.writeFileSync(this.options.filePath, this.database.export());
  }
}
