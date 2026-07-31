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
  type MemoryRepository,
  type MemorySnapshot,
  MemorySnapshotSchema,
  type MessageListOptions,
  cloneMessage
} from "@jarvis-k/memory";

export interface SqliteMemoryRepositoryOptions {
  filePath?: string;
}

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
    this.database.run(`
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
    `);
    this.initialized = true;
    await this.flush();
  }

  public async appendMessage(message: Message): Promise<Message> {
    const parsed = MessageSchema.parse(message);
    const database = await this.getDatabase();
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
        : `LIMIT ${this.normalizeLimit(options.limit)}`;
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

  public async getSnapshot(): Promise<MemorySnapshot> {
    return MemorySnapshotSchema.parse({
      messages: await this.listMessages()
    });
  }

  public async restoreSnapshot(snapshot: MemorySnapshot): Promise<void> {
    const parsed = MemorySnapshotSchema.parse(snapshot);
    const database = await this.getDatabase();
    database.run("BEGIN IMMEDIATE TRANSACTION");
    try {
      database.run("DELETE FROM messages");
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
      database.run("COMMIT");
    } catch (error) {
      database.run("ROLLBACK");
      throw error;
    }
    await this.flush();
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

  private async getDatabase(): Promise<Database> {
    await this.initialize();
    if (!this.database) {
      throw new Error("SQLite memory repository is not initialized.");
    }
    return this.database;
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

  private normalizeLimit(limit: number): number {
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new Error("Message list limit must be an integer from 1 to 500.");
    }
    return limit;
  }

  private async flush(): Promise<void> {
    if (!this.options.filePath || !this.database) {
      return;
    }
    fs.mkdirSync(path.dirname(this.options.filePath), { recursive: true });
    fs.writeFileSync(this.options.filePath, this.database.export());
  }
}
