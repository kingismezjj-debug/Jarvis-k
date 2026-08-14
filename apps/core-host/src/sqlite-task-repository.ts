import fs from "node:fs";
import path from "node:path";
import initSqlJs, {
  type Database,
  type SqlJsStatic
} from "sql.js";
import {
  TaskEventSchema,
  TaskSchema,
  TaskStepSchema,
  type Task,
  type TaskEvent,
  type TaskStep
} from "@jarvis-k/contracts";
import type {
  TaskCreateInput,
  TaskEventCreateInput,
  TaskRepository,
  TaskStepCreateInput
} from "@jarvis-k/core";

export interface SqliteTaskRepositoryOptions {
  filePath: string;
}

const SCHEMA_VERSION = 2;

export class SqliteTaskRepository implements TaskRepository {
  private sql: SqlJsStatic | undefined;
  private database: Database | undefined;
  private initialized = false;

  public constructor(private readonly options: SqliteTaskRepositoryOptions) {}

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.sql = await initSqlJs();
    const existingBytes = fs.existsSync(this.options.filePath)
      ? fs.readFileSync(this.options.filePath)
      : undefined;
    this.database = existingBytes
      ? new this.sql.Database(existingBytes)
      : new this.sql.Database();
    this.migrate(this.database);
    this.initialized = true;
    await this.flush();
  }

  public async recoverRunningTasksAsInterrupted(now: string): Promise<void> {
    const database = await this.getDatabase();
    database.run("BEGIN IMMEDIATE TRANSACTION");
    try {
      database.run(
        `UPDATE task_steps
         SET state = 'cancelled',
          verification_status = CASE
            WHEN verification_status = 'verified' THEN verification_status
            ELSE 'unverified'
          END,
          completed_at = COALESCE(completed_at, ?),
          failure_reason = COALESCE(
            failure_reason,
            'Step was interrupted during startup recovery; side-effecting work was not replayed.'
          )
         WHERE state IN ('pending', 'running')
          AND task_id IN (
            SELECT id FROM tasks
            WHERE state IN (
              'queued', 'planning', 'awaiting_confirmation', 'running',
              'rolling_back', 'interrupted'
            )
          )`,
        [now]
      );
      database.run(
        `UPDATE tasks
         SET state = 'interrupted',
          updated_at = ?
         WHERE state IN ('queued', 'planning', 'awaiting_confirmation', 'running', 'rolling_back')`,
        [now]
      );
      database.run(
        `INSERT INTO task_events (id, task_id, type, message, created_at)
         SELECT
          'event-recovery-' || id,
          id,
          'interrupted',
          'Task was interrupted during startup recovery; side-effecting steps were not replayed.',
          ?
         FROM tasks
         WHERE state = 'interrupted'
          AND NOT EXISTS (
            SELECT 1 FROM task_events
            WHERE task_events.task_id = tasks.id
             AND task_events.type = 'interrupted'
          )`,
        [now]
      );
      database.run("COMMIT");
    } catch {
      database.run("ROLLBACK");
      throw new Error("Task recovery migration failed.");
    }
    await this.flush();
  }

  public async createTask(input: TaskCreateInput): Promise<Task> {
    const database = await this.getDatabase();
    database.run(
      `INSERT INTO tasks
        (id, title, state, created_at, updated_at, started_at, completed_at,
         source, intent, route_source, verification_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.title,
        input.state,
        input.createdAt,
        input.updatedAt,
        null,
        null,
        input.source ?? null,
        input.intent ?? null,
        input.routeSource ?? "unknown",
        null
      ]
    );
    await this.flush();
    const task = await this.getTask(input.id);
    if (!task) {
      throw new Error("Task was not persisted.");
    }
    return task;
  }

  public async updateTask(input: {
    id: string;
    state: Task["state"];
    updatedAt: string;
    startedAt?: string;
    completedAt?: string;
    verificationSummary?: string;
  }): Promise<Task> {
    const database = await this.getDatabase();
    database.run(
      `UPDATE tasks
       SET state = ?,
        updated_at = ?,
        started_at = COALESCE(?, started_at),
        completed_at = COALESCE(?, completed_at),
        verification_summary = COALESCE(?, verification_summary)
       WHERE id = ?`,
      [
        input.state,
        input.updatedAt,
        input.startedAt ?? null,
        input.completedAt ?? null,
        input.verificationSummary ?? null,
        input.id
      ]
    );
    await this.flush();
    const task = await this.getTask(input.id);
    if (!task) {
      throw new Error("Task does not exist.");
    }
    return task;
  }

  public async createStep(input: TaskStepCreateInput): Promise<TaskStep> {
    const database = await this.getDatabase();
    database.run(
      `INSERT INTO task_steps
        (id, task_id, title, state, verification_status, started_at,
         completed_at, result_summary, failure_reason, tool_id, tool_input_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.taskId,
        input.title,
        input.state,
        input.verificationStatus,
        input.startedAt ?? null,
        input.completedAt ?? null,
        input.resultSummary ?? null,
        input.failureReason ?? null,
        input.toolId ?? null,
        input.toolInput ? JSON.stringify(input.toolInput) : null
      ]
    );
    await this.flush();
    const step = (await this.listSteps(input.taskId)).find(
      (candidate) => candidate.id === input.id
    );
    if (!step) {
      throw new Error("Task step was not persisted.");
    }
    return step;
  }

  public async updateStep(input: {
    id: string;
    taskId: string;
    state: TaskStep["state"];
    verificationStatus: TaskStep["verificationStatus"];
    completedAt?: string;
    resultSummary?: string;
    failureReason?: string;
  }): Promise<TaskStep> {
    const database = await this.getDatabase();
    database.run(
      `UPDATE task_steps
       SET state = ?,
        verification_status = ?,
        completed_at = COALESCE(?, completed_at),
        result_summary = COALESCE(?, result_summary),
        failure_reason = COALESCE(?, failure_reason)
       WHERE id = ? AND task_id = ?`,
      [
        input.state,
        input.verificationStatus,
        input.completedAt ?? null,
        input.resultSummary ?? null,
        input.failureReason ?? null,
        input.id,
        input.taskId
      ]
    );
    await this.flush();
    const step = (await this.listSteps(input.taskId)).find(
      (candidate) => candidate.id === input.id
    );
    if (!step) {
      throw new Error("Task step does not exist.");
    }
    return step;
  }

  public async createEvent(input: TaskEventCreateInput): Promise<TaskEvent> {
    const database = await this.getDatabase();
    database.run(
      `INSERT INTO task_events
        (id, task_id, step_id, type, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.taskId,
        input.stepId ?? null,
        input.type,
        input.message,
        input.createdAt
      ]
    );
    await this.flush();
    const event = (await this.listEvents(input.taskId)).find(
      (candidate) => candidate.id === input.id
    );
    if (!event) {
      throw new Error("Task event was not persisted.");
    }
    return event;
  }

  public async listTasks(): Promise<Task[]> {
    const database = await this.getDatabase();
    const rows = database.exec(
      `SELECT id, title, state, created_at, updated_at, started_at,
        completed_at, source, intent, route_source, verification_summary
       FROM tasks
       ORDER BY updated_at DESC, id ASC`
    );
    const values = rows[0]?.values ?? [];
    return values.map((row) => {
      const id = String(row[0]);
      return TaskSchema.parse({
        id,
        title: String(row[1]),
        state: String(row[2]),
        createdAt: String(row[3]),
        updatedAt: String(row[4]),
        ...(typeof row[5] === "string" ? { startedAt: row[5] } : {}),
        ...(typeof row[6] === "string" ? { completedAt: row[6] } : {}),
        ...(typeof row[7] === "string" ? { source: row[7] } : {}),
        ...(typeof row[8] === "string" ? { intent: row[8] } : {}),
        routeSource: typeof row[9] === "string" ? row[9] : "unknown",
        ...(typeof row[10] === "string"
          ? { verificationSummary: row[10] }
          : {}),
        steps: [],
        events: []
      });
    }).map((task) =>
      TaskSchema.parse({
        ...task,
        steps: this.listStepsSync(database, task.id),
        events: this.listEventsSync(database, task.id)
      })
    );
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

  private async getTask(taskId: string): Promise<Task | undefined> {
    return (await this.listTasks()).find((task) => task.id === taskId);
  }

  private async listSteps(taskId: string): Promise<TaskStep[]> {
    const database = await this.getDatabase();
    return this.listStepsSync(database, taskId);
  }

  private listStepsSync(database: Database, taskId: string): TaskStep[] {
    const rows = database.exec(
      `SELECT id, task_id, title, state, verification_status, started_at,
        completed_at, result_summary, failure_reason, tool_id, tool_input_json
       FROM task_steps
       WHERE task_id = ?
       ORDER BY rowid ASC`,
      [taskId]
    );
    return (rows[0]?.values ?? []).map((row) =>
      TaskStepSchema.parse({
        id: String(row[0]),
        taskId: String(row[1]),
        title: String(row[2]),
        state: String(row[3]),
        verificationStatus: String(row[4]),
        ...(typeof row[5] === "string" ? { startedAt: row[5] } : {}),
        ...(typeof row[6] === "string" ? { completedAt: row[6] } : {}),
        ...(typeof row[7] === "string" ? { resultSummary: row[7] } : {}),
        ...(typeof row[8] === "string" ? { failureReason: row[8] } : {}),
        ...(typeof row[9] === "string" ? { toolId: row[9] } : {}),
        ...(typeof row[10] === "string"
          ? { toolInput: parseJsonRecord(row[10]) }
          : {})
      })
    );
  }

  private async listEvents(taskId: string): Promise<TaskEvent[]> {
    const database = await this.getDatabase();
    return this.listEventsSync(database, taskId);
  }

  private listEventsSync(database: Database, taskId: string): TaskEvent[] {
    const rows = database.exec(
      `SELECT id, task_id, step_id, type, message, created_at
       FROM task_events
       WHERE task_id = ?
       ORDER BY created_at ASC, rowid ASC`,
      [taskId]
    );
    return (rows[0]?.values ?? []).map((row) =>
      TaskEventSchema.parse({
        id: String(row[0]),
        taskId: String(row[1]),
        ...(typeof row[2] === "string" ? { stepId: row[2] } : {}),
        type: String(row[3]),
        message: String(row[4]),
        createdAt: String(row[5])
      })
    );
  }

  private async getDatabase(): Promise<Database> {
    await this.initialize();
    if (!this.database) {
      throw new Error("Task database is unavailable.");
    }
    return this.database;
  }

  private migrate(database: Database): void {
    database.run("BEGIN IMMEDIATE TRANSACTION");
    try {
      database.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          state TEXT NOT NULL CHECK (state IN (
            'queued', 'planning', 'awaiting_confirmation', 'running',
            'completed', 'failed', 'cancelled', 'interrupted',
            'rolling_back', 'rolled_back'
          )),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          started_at TEXT,
          completed_at TEXT,
          source TEXT,
          intent TEXT,
          route_source TEXT NOT NULL,
          verification_summary TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_updated
          ON tasks (updated_at DESC, id);
        CREATE TABLE IF NOT EXISTS task_steps (
          id TEXT PRIMARY KEY NOT NULL,
          task_id TEXT NOT NULL,
          title TEXT NOT NULL,
          state TEXT NOT NULL CHECK (state IN (
            'pending', 'running', 'completed', 'failed', 'cancelled', 'blocked'
          )),
          verification_status TEXT NOT NULL CHECK (verification_status IN (
            'pending', 'verified', 'unverified', 'verification_failed',
            'not_applicable'
          )),
          started_at TEXT,
          completed_at TEXT,
          result_summary TEXT,
          failure_reason TEXT,
          tool_id TEXT,
          tool_input_json TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_task_steps_task
          ON task_steps (task_id, id);
        CREATE TABLE IF NOT EXISTS task_events (
          id TEXT PRIMARY KEY NOT NULL,
          task_id TEXT NOT NULL,
          step_id TEXT,
          type TEXT NOT NULL CHECK (type IN (
            'created', 'state_changed', 'step_started', 'step_completed',
            'verification_completed', 'verification_failed', 'interrupted',
            'failed', 'cancelled'
          )),
          message TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_task_events_task
          ON task_events (task_id, created_at, id);
      `);
      const version = this.readSchemaVersion(database);
      if (version < 2) {
        this.addColumnIfMissing(database, "task_steps", "tool_id", "TEXT");
        this.addColumnIfMissing(
          database,
          "task_steps",
          "tool_input_json",
          "TEXT"
        );
      }
      if (version < SCHEMA_VERSION) {
        database.run(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      }
      database.run("COMMIT");
    } catch {
      database.run("ROLLBACK");
      throw new Error("Task schema migration failed.");
    }
  }

  private readSchemaVersion(database: Database): number {
    const rows = database.exec("PRAGMA user_version");
    const value = rows[0]?.values[0]?.[0];
    return typeof value === "number" ? value : 0;
  }

  private addColumnIfMissing(
    database: Database,
    tableName: string,
    columnName: string,
    definition: string
  ): void {
    const rows = database.exec(`PRAGMA table_info(${tableName})`);
    const columns = new Set(
      (rows[0]?.values ?? []).map((row) => String(row[1]))
    );
    if (!columns.has(columnName)) {
      database.run(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
      );
    }
  }

  private async flush(): Promise<void> {
    if (!this.database) {
      return;
    }
    const directory = path.dirname(this.options.filePath);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(this.options.filePath, Buffer.from(this.database.export()));
  }
}

function parseJsonRecord(value: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
