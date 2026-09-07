import type { Database } from "sql.js";
import { AssistantJournalEventSchema, type AssistantJournalEvent, type AssistantRecoveryNotice } from "@jarvis-k/contracts";
import { validateAssistantJournal, type AssistantTurnRepository } from "@jarvis-k/core";

export const ASSISTANT_JOURNAL_MIGRATION = `
  CREATE TABLE IF NOT EXISTS assistant_turns (
    turn_id TEXT PRIMARY KEY NOT NULL CHECK(length(turn_id) BETWEEN 1 AND 128),
    last_sequence INTEGER NOT NULL CHECK(last_sequence BETWEEN 0 AND 31),
    state TEXT NOT NULL CHECK(state IN ('open','terminal','quarantined')),
    quarantine_class TEXT CHECK(quarantine_class = 'invalid_journal')
  );
  CREATE INDEX IF NOT EXISTS idx_assistant_turns_scan ON assistant_turns(state, turn_id);
  CREATE TABLE IF NOT EXISTS assistant_turn_events (
    turn_id TEXT NOT NULL REFERENCES assistant_turns(turn_id),
    sequence INTEGER NOT NULL CHECK(sequence BETWEEN 0 AND 31),
    schema_version INTEGER NOT NULL CHECK(schema_version = 1),
    event_json TEXT NOT NULL CHECK(length(event_json) BETWEEN 1 AND 2048),
    PRIMARY KEY(turn_id, sequence)
  );
  CREATE TRIGGER IF NOT EXISTS assistant_events_no_update BEFORE UPDATE ON assistant_turn_events
    BEGIN SELECT RAISE(ABORT, 'append only'); END;
  CREATE TRIGGER IF NOT EXISTS assistant_events_no_delete BEFORE DELETE ON assistant_turn_events
    BEGIN SELECT RAISE(ABORT, 'append only'); END;
`;

// Uses the existing Task database and its durability boundary; owns no Task facts.
export class SqliteAssistantTurnJournal implements AssistantTurnRepository {
  public constructor(private readonly database: () => Promise<Database>, private readonly flush: () => void) {}

  private history(db: Database, turnId: string): AssistantJournalEvent[] {
    const rows = db.exec(`SELECT sequence, schema_version, event_json FROM assistant_turn_events
      WHERE turn_id = ? ORDER BY sequence LIMIT 33`, [turnId])[0]?.values ?? [];
    const events = rows.map(row => {
      const event = AssistantJournalEventSchema.parse(JSON.parse(String(row[2])));
      if (row[0] !== event.sequence || row[1] !== event.schemaVersion || event.turnId !== turnId) throw new Error("ASSISTANT_JOURNAL_INVALID");
      return event;
    });
    const parsed = validateAssistantJournal(events);
    const projection = db.exec("SELECT last_sequence, state FROM assistant_turns WHERE turn_id = ?", [turnId])[0]?.values[0];
    const last = parsed.at(-1)!;
    if (!projection || projection[0] !== last.sequence ||
      (projection[1] !== "quarantined" && projection[1] !== (isTerminal(last) ? "terminal" : "open"))) throw new Error("ASSISTANT_JOURNAL_INVALID");
    return parsed;
  }

  public async append(raw: AssistantJournalEvent): Promise<void> {
    const event = AssistantJournalEventSchema.parse(raw);
    const db = await this.database();
    const projection = db.exec("SELECT state FROM assistant_turns WHERE turn_id = ?", [event.turnId])[0]?.values[0];
    if (projection?.[0] === "quarantined") throw new Error("ASSISTANT_JOURNAL_QUARANTINED");
    let history: AssistantJournalEvent[] = [];
    try {
      if (projection) history = this.history(db, event.turnId);
      const existing = history[event.sequence];
      if (existing) {
        if (JSON.stringify(existing) === JSON.stringify(event)) return;
        throw new Error("ASSISTANT_JOURNAL_CONFLICT");
      }
      validateAssistantJournal([...history, event]);
    } catch {
      if (projection) this.quarantine(db, event.turnId);
      throw new Error("ASSISTANT_JOURNAL_INVALID");
    }
    db.run("BEGIN IMMEDIATE TRANSACTION");
    try {
      db.run(`INSERT INTO assistant_turns(turn_id,last_sequence,state) VALUES(?,?,?)
        ON CONFLICT(turn_id) DO UPDATE SET last_sequence=excluded.last_sequence, state=excluded.state`,
      [event.turnId, event.sequence, isTerminal(event) ? "terminal" : "open"]);
      db.run("INSERT INTO assistant_turn_events(turn_id,sequence,schema_version,event_json) VALUES(?,?,?,?)",
        [event.turnId, event.sequence, event.schemaVersion, JSON.stringify(event)]);
      db.run("COMMIT");
    } catch { db.run("ROLLBACK"); throw new Error("ASSISTANT_JOURNAL_WRITE_FAILED"); }
    this.flush();
  }

  public async scanUnfinished(limit: number): Promise<AssistantJournalEvent[][]> {
    checkLimit(limit);
    const db = await this.database();
    const rows = db.exec("SELECT turn_id FROM assistant_turns WHERE state='open' ORDER BY turn_id LIMIT ?", [limit])[0]?.values ?? [];
    const result: AssistantJournalEvent[][] = [];
    for (const row of rows) {
      try { result.push(this.history(db, String(row[0]))); }
      catch { this.quarantine(db, String(row[0])); }
    }
    return result;
  }

  public async listRecoveryNotices(limit: number): Promise<AssistantRecoveryNotice[]> {
    checkLimit(limit);
    const db = await this.database();
    // Fetch only interrupted terminals, so ordinary completed turns cannot hide notices.
    const rows = db.exec(`SELECT t.turn_id FROM assistant_turns t JOIN assistant_turn_events e
      ON e.turn_id=t.turn_id AND e.sequence=t.last_sequence
      WHERE t.state='terminal' AND e.event_json LIKE '%"type":"turn.interrupted"%'
      ORDER BY t.turn_id LIMIT ?`, [limit])[0]?.values ?? [];
    const notices: AssistantRecoveryNotice[] = [];
    for (const row of rows) {
      try {
        const events = this.history(db, String(row[0]));
        const first = events[0]!; const last = events.at(-1)!;
        if (first.type === "turn.accepted" && last.type === "turn.interrupted") notices.push({ turnId: first.turnId,
          conversationId: first.data.conversationId, classification: last.data.classification });
      } catch { this.quarantine(db, String(row[0])); }
    }
    return notices;
  }

  public async hasUnfinishedOrQuarantined(): Promise<boolean> {
    const db = await this.database();
    return !!db.exec("SELECT 1 FROM assistant_turns WHERE state IN ('open','quarantined') LIMIT 1")[0]?.values.length;
  }

  private quarantine(db: Database, turnId: string): void {
    db.run("UPDATE assistant_turns SET state='quarantined', quarantine_class='invalid_journal' WHERE turn_id=?", [turnId]);
    this.flush();
  }
}
function isTerminal(event: AssistantJournalEvent): boolean {
  return ["turn.completed", "turn.cancelled", "turn.failed", "turn.interrupted"].includes(event.type);
}
function checkLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("ASSISTANT_RECOVERY_LIMIT_INVALID");
}
