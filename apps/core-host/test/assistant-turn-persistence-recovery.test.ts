import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import initSqlJs from "sql.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantJournalEventSchema, AssistantModelAdapterEventSchema, ChatAnswerPreferenceProjectionSchema,
  ToolDecisionSchema, ToolExecutionRequestSchema, ToolResultSchema, type AssistantJournalEvent } from "@jarvis-k/contracts";
import { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import { AssistantRuntime, type AssistantTextModelAdapter } from "../../../packages/core/src/assistant-runtime";
import { recoverAssistantTurns, type AssistantTurnRepository } from "../../../packages/core/src/assistant-turn-repository";
import { BoundedNotepadTaskService } from "../../../packages/core/src/bounded-notepad-task-service";
import { PlannerDraftService } from "../../../packages/core/src/planner/planner-draft-service";
import { PlannerApprovalService } from "../../../packages/core/src/planner/planner-approval-service";
import { TaskDispatchService } from "../../../packages/core/src/task-dispatch-service";
import { SqliteTaskRepository } from "../src/sqlite-task-repository";

const now = () => new Date("2026-09-07T00:00:00.000Z");
const directories: string[] = [];
function directory() { const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jarvis-assistant-journal-test-")); directories.push(dir); return dir; }
beforeEach(() => { vi.spyOn(globalThis, "fetch").mockImplementation(async () => { throw new Error("Real network forbidden"); }); });
afterEach(() => {
  expect(globalThis.fetch).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  for (const dir of directories.splice(0)) {
    const resolved = path.resolve(dir);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("jarvis-assistant-journal-test-")) throw new Error("Unsafe test cleanup");
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
function event(sequence: number, type: string, data: unknown = {}, turnId = "turn-test") {
  return AssistantJournalEventSchema.parse({ schemaVersion: 1, turnId, sequence, occurredAt: now().toISOString(), type, data });
}
function history() {
  return [
    event(0, "turn.accepted", { conversationId: "primary", correlationId: "command-test", finalMessageId: "msg-final" }),
    event(1, "tool.proposed", { proposalId: "tprop-test", toolId: "localApp.open" }),
    event(2, "tool.decided", { proposalId: "tprop-test", taskId: "task-test", decision: "requires_approval", approvalRequestId: "approval-test" }),
    event(3, "approval.resolved", { proposalId: "tprop-test", approvalRequestId: "approval-test", resolution: "approved" }),
    event(4, "execution.started", { proposalId: "tprop-test", executionId: "texec-test", taskId: "task-test" }),
    event(5, "tool.resulted", { proposalId: "tprop-test", executionId: "texec-test", taskId: "task-test", status: "completed", verification: "verified" }),
    event(6, "provider.continued"),
  ];
}
async function storage() {
  const dir = directory(); const filePath = path.join(dir, "tasks.sqlite");
  const tasks = new SqliteTaskRepository({ filePath }); await tasks.initialize();
  const memory = new SqliteMemoryRepository({ filePath: path.join(dir, "messages.sqlite") }); await memory.initialize();
  return { tasks, memory, filePath, restart: () => new SqliteTaskRepository({ filePath }) };
}
async function recover(repository: AssistantTurnRepository, memory: SqliteMemoryRepository, limit = 100) {
  return recoverAssistantTurns({ repository, now, limit, finalMessageExists: async (id, conversationId) => {
    const message = await memory.getMessage(id); return message?.role === "assistant" && message.conversationId === conversationId;
  } });
}
async function seed(repository: AssistantTurnRepository, events: AssistantJournalEvent[]) {
  for (const item of events) await repository.append(item);
}

describe("synthetic SQLite assistant recovery", () => {
  it("migrates the existing version two Task database without replacing its facts", async () => {
    const h = await storage();
    await h.tasks.createTask({ id: "task-existing", title: "Synthetic existing task", state: "completed", createdAt: now().toISOString(), updatedAt: now().toISOString() });
    const sql = await initSqlJs(); const db = new sql.Database(fs.readFileSync(h.filePath));
    db.run("DROP TABLE assistant_turn_events; DROP TABLE assistant_turns; PRAGMA user_version=2");
    fs.writeFileSync(h.filePath, db.export()); db.close();
    const migrated = h.restart(); await migrated.initialize();
    expect((await migrated.listTasks()).map(task => task.id)).toEqual(["task-existing"]);
    await migrated.assistantTurns.append(history()[0]!);
    const inspected = new sql.Database(fs.readFileSync(h.filePath));
    expect(inspected.exec("PRAGMA user_version")[0]?.values[0]?.[0]).toBe(3); inspected.close();
  });

  it("rejects a noncausal execution and a sequence gap before either can become durable", async () => {
    const h = await storage(); await seed(h.tasks.assistantTurns, history().slice(0, 3));
    await expect(h.tasks.assistantTurns.append({ ...history()[4]!, sequence: 3 })).rejects.toThrow();
    expect(await h.tasks.assistantTurns.hasUnfinishedOrQuarantined()).toBe(true);
    const other = await storage(); await other.tasks.assistantTurns.append(history()[0]!);
    await expect(other.tasks.assistantTurns.append({ ...history()[1]!, sequence: 2 })).rejects.toThrow();
  });

  it("quarantines an interruption classification that would conceal an unknown execution result", async () => {
    const h = await storage(); await seed(h.tasks.assistantTurns, history().slice(0, 5));
    await expect(h.tasks.assistantTurns.append(event(5, "turn.interrupted", { classification: "interrupted_before_execution" }))).rejects.toThrow();
    expect((await recover(h.tasks.assistantTurns, h.memory)).blocked).toBe(true);
  });
  it.each([
    [1, "interrupted_before_execution"], [2, "interrupted_before_execution"],
    [3, "interrupted_while_awaiting_approval"], [4, "interrupted_before_execution"],
    [5, "interrupted_unknown_execution_result"], [6, "interrupted_after_tool_result"],
    [7, "interrupted_after_tool_result"],
  ] as const)("recovers crash after %s events as %s without replay", async (count, classification) => {
    const h = await storage(); await seed(h.tasks.assistantTurns, history().slice(0, count));
    const restarted = h.restart();
    const first = await recover(restarted.assistantTurns, h.memory);
    expect(first).toEqual({ blocked: false, notices: [{ turnId: "turn-test", conversationId: "primary", classification }] });
    const before = fs.readFileSync(h.filePath);
    expect(await recover(h.restart().assistantTurns, h.memory)).toEqual(first);
    expect(fs.readFileSync(h.filePath)).toEqual(before);
    expect(await h.memory.listMessages()).toEqual([]);
    expect(await restarted.assistantTurns.scanUnfinished(100)).toEqual([]);
  });

  it("reconciles a canonical final committed before the terminal event exactly once", async () => {
    const h = await storage(); await seed(h.tasks.assistantTurns, history());
    await h.memory.appendMessage({ id: "msg-final", conversationId: "primary", role: "assistant", text: "Synthetic final", createdAt: now().toISOString() });
    expect((await recover(h.restart().assistantTurns, h.memory)).notices).toEqual([]);
    expect((await recover(h.restart().assistantTurns, h.memory)).notices).toEqual([]);
    expect(await h.memory.listMessages()).toHaveLength(1);
    const sql = await initSqlJs(); const db = new sql.Database(fs.readFileSync(h.filePath));
    expect(db.exec("SELECT COUNT(*) FROM assistant_turn_events")[0]?.values[0]?.[0]).toBe(8); db.close();
  });

  it.each(["turn.cancelled", "turn.failed", "turn.completed"])("ignores terminal %s", async type => {
    const h = await storage(); await h.tasks.assistantTurns.append(history()[0]!);
    await h.tasks.assistantTurns.append(event(1, type, type === "turn.completed" ? { messageId: "msg-final" } : {}));
    const exists = vi.fn(async () => false);
    await recoverAssistantTurns({ repository: h.restart().assistantTurns, finalMessageExists: exists, now });
    expect(exists).not.toHaveBeenCalled();
  });

  it("bounds scans and orders them deterministically, leaving excess work blocked", async () => {
    const h = await storage();
    for (const turnId of ["turn-c", "turn-a", "turn-b"]) await h.tasks.assistantTurns.append({ ...history()[0]!, turnId });
    expect((await h.tasks.assistantTurns.scanUnfinished(2)).map(events => events[0]?.turnId)).toEqual(["turn-a", "turn-b"]);
    expect((await recover(h.tasks.assistantTurns, h.memory, 2)).blocked).toBe(true);
    expect((await recover(h.tasks.assistantTurns, h.memory, 2)).blocked).toBe(false);
    await expect(h.tasks.assistantTurns.scanUnfinished(101)).rejects.toThrow();
  });

  it("expires the existing persisted Task approval and does not duplicate Task recovery events", async () => {
    const h = await storage();
    await h.tasks.createTask({ id: "task-test", title: "Synthetic task", state: "awaiting_confirmation", createdAt: now().toISOString(), updatedAt: now().toISOString() });
    await h.tasks.createStep({ id: "step-test", taskId: "task-test", title: "Synthetic step", state: "pending", verificationStatus: "pending" });
    await seed(h.tasks.assistantTurns, history().slice(0, 3));
    const restarted = h.restart(); await restarted.recoverRunningTasksAsInterrupted(now().toISOString());
    await recover(restarted.assistantTurns, h.memory);
    const executeStep = vi.fn(); const approvals = new PlannerApprovalService({ repository: restarted, now });
    expect((await approvals.approve({ taskId: "task-test", executeStep })).ok).toBe(false);
    expect(executeStep).not.toHaveBeenCalled();
    await restarted.recoverRunningTasksAsInterrupted(now().toISOString());
    const task = (await restarted.listTasks())[0]!;
    expect(task.state).toBe("interrupted");
    expect(task.events.filter(e => e.type === "interrupted")).toHaveLength(1);
    expect(task.steps[0]?.state).toBe("cancelled");
  });

  it.each(["json", "version", "sequence", "projection"])("quarantines %s corruption without deleting history", async kind => {
    const h = await storage(); await seed(h.tasks.assistantTurns, history().slice(0, 2));
    const sql = await initSqlJs(); const db = new sql.Database(fs.readFileSync(h.filePath));
    db.run("DROP TRIGGER assistant_events_no_update");
    if (kind === "json") db.run("UPDATE assistant_turn_events SET event_json='invalid' WHERE sequence=1");
    if (kind === "version") db.run("UPDATE assistant_turn_events SET event_json=replace(event_json,'\"schemaVersion\":1','\"schemaVersion\":9') WHERE sequence=1");
    if (kind === "sequence") db.run("UPDATE assistant_turn_events SET sequence=3 WHERE sequence=1");
    if (kind === "projection") db.run("UPDATE assistant_turns SET last_sequence=9");
    fs.writeFileSync(h.filePath, db.export()); db.close();
    const restarted = h.restart(); expect((await recover(restarted.assistantTurns, h.memory)).blocked).toBe(true);
    expect(await restarted.assistantTurns.scanUnfinished(100)).toEqual([]);
    const inspected = new sql.Database(fs.readFileSync(h.filePath));
    expect(inspected.exec("SELECT COUNT(*) FROM assistant_turn_events")[0]?.values[0]?.[0]).toBe(2);
    expect(inspected.exec("SELECT quarantine_class FROM assistant_turns")[0]?.values[0]?.[0]).toBe("invalid_journal"); inspected.close();
  });

  it.each([-1, 99])("rejects unknown database version %s without rewriting the file", async version => {
    const h = await storage(); const sql = await initSqlJs(); const db = new sql.Database(fs.readFileSync(h.filePath));
    db.run(`PRAGMA user_version=${version}`); fs.writeFileSync(h.filePath, db.export()); db.close();
    const before = fs.readFileSync(h.filePath);
    await expect(h.restart().initialize()).rejects.toThrow("TASK_SCHEMA_UNSUPPORTED");
    expect(fs.readFileSync(h.filePath)).toEqual(before);
  });

  it("enforces append-only, exact duplicate idempotency and conflicting duplicate quarantine", async () => {
    const h = await storage(); await h.tasks.assistantTurns.append(history()[0]!);
    await h.tasks.assistantTurns.append(history()[0]!);
    const sql = await initSqlJs(); const db = new sql.Database(fs.readFileSync(h.filePath));
    expect(() => db.run("DELETE FROM assistant_turn_events")).toThrow("append only"); db.close();
    await expect(h.tasks.assistantTurns.append(event(0, "turn.accepted", { conversationId: "other", correlationId: "command-test", finalMessageId: "msg-final" }))).rejects.toThrow();
    expect(await h.tasks.assistantTurns.hasUnfinishedOrQuarantined()).toBe(true);
  });

  it("keeps the previous durable database after a filesystem flush failure and poisons the writer", async () => {
    const h = await storage(); await h.tasks.assistantTurns.append(history()[0]!);
    const before = fs.readFileSync(h.filePath);
    vi.spyOn(fs, "fsyncSync").mockImplementationOnce(() => { throw new Error("synthetic flush failure"); });
    await expect(h.tasks.assistantTurns.append(history()[1]!)).rejects.toThrow("TASK_STORAGE_WRITE_FAILED");
    expect(fs.readFileSync(h.filePath)).toEqual(before);
    await expect(h.tasks.assistantTurns.append(history()[1]!)).rejects.toThrow("TASK_STORAGE_UNAVAILABLE");
    expect((await recover(h.restart().assistantTurns, h.memory)).notices[0]?.classification).toBe("interrupted_before_execution");
  });
});

async function runtimeHarness(mode: "text" | "status" | "notepad", failAt?: string) {
  const h = await storage(); const saved: string[] = []; const written: AssistantJournalEvent[] = [];
  let launches = 0; let continuations = 0; let requests = 0; let id = 0;
  const journal: AssistantTurnRepository = { ...{
    scanUnfinished: h.tasks.assistantTurns.scanUnfinished.bind(h.tasks.assistantTurns),
    listRecoveryNotices: h.tasks.assistantTurns.listRecoveryNotices.bind(h.tasks.assistantTurns),
    hasUnfinishedOrQuarantined: h.tasks.assistantTurns.hasUnfinishedOrQuarantined.bind(h.tasks.assistantTurns),
  }, append: async item => {
    if (item.type === failAt) throw new Error("Synthetic repository fault");
    await h.tasks.assistantTurns.append(item); written.push(item);
  } };
  const service = new BoundedNotepadTaskService({ enabled: true, repository: h.tasks,
    descriptor: { id: "localApp.open", version: "1.0.0", description: "Synthetic", risk: "mutating", execution: "bounded_desktop",
      requiredPermissions: [], requiresConfirmation: true, inputSchemaId: "tool.localapp.open.input" },
    policy: { policyVersion: "1.0.0", allowedToolIds: ["localApp.open"], blockedToolIds: [], allowedPermissionScopes: [],
      confirmationRequiredFor: ["mutating", "destructive"], fixtureExecutionEnabled: false, windowsExecutionEnabled: false,
      boundedNotepadExecutionEnabled: true, networkAccessAllowed: false, shellExecutionAllowed: false },
    drafts: new PlannerDraftService({ repository: h.tasks, now, allowedToolIds: ["localApp.open"] }),
    approvals: new PlannerApprovalService({ repository: h.tasks, now }), dispatch: new TaskDispatchService({ repository: h.tasks, now }),
    now, progress: async () => undefined, onExecute: () => undefined,
    executor: { openBrowser: async () => { throw new Error("Forbidden"); }, openLocalApp: async () => {
      expect(written.at(-1)?.type).toBe("execution.started"); launches++;
      return { status: "completed", verificationStatus: "verified", label: "notepad", reasonCode: "ALLOWLISTED_TARGET_OPENED" };
    } } });
  const adapter: AssistantTextModelAdapter = {
    startTextTurn: async function* (_request, context) {
      expect(written[0]?.type).toBe("turn.accepted"); requests++;
      if (mode === "text") { yield { type: "delta", delta: { kind: "text", text: "Synthetic private answer" } }; yield { type: "final", text: "Synthetic private answer" }; return; }
      yield AssistantModelAdapterEventSchema.parse({ type: "tool_proposal", proposal: { turnId: context.tool!.turnId,
        proposalId: context.tool!.proposalId, toolId: mode === "status" ? "model.status" : "localApp.open",
        risk: mode === "status" ? "read_only" : "mutating", arguments: mode === "status" ? {} : { app: "notepad" },
        proposedAt: now().toISOString(), safeSummary: "Synthetic proposal" } });
    },
    continueTextTurn: async function* () {
      expect(written.some(item => item.type === "tool.resulted")).toBe(true); continuations++;
      yield { type: "final", text: "Synthetic final" };
    },
  };
  const runtime = new AssistantRuntime({ repository: journal, getProviderId: () => "chat-answer.openai-compatible.deepseek",
    getModelAdapter: () => adapter, now, createId: prefix => `${prefix}-${++id}`, publishProjection: () => undefined,
    persistFinalMessage: async (text, conversationId, messageId) => {
      const message = await h.memory.appendMessage({ id: messageId!, text, conversationId, role: "assistant", createdAt: now().toISOString() });
      saved.push(message.id);
      if (failAt === "after_message") throw new Error("Synthetic canonical commit interruption");
      return message;
    }, executeTool: async (proposal, executionId, signal, publish) => {
      if (mode === "notepad") return service.execute(proposal, executionId, signal, publish);
      await publish({ type: "tool.decided", decision: ToolDecisionSchema.parse({ proposalId: proposal.proposalId, taskId: "task-status",
        decision: "allowed", reasonCode: "ALLOWED", policyVersion: "1.0.0", decidedAt: now().toISOString() }) });
      await publish({ type: "execution.started", request: ToolExecutionRequestSchema.parse({ proposalId: proposal.proposalId,
        taskId: "task-status", turnId: proposal.turnId, executionId, toolId: "model.status", arguments: {}, owner: "core", timeoutMs: 1000, requestedAt: now().toISOString() }) });
      return ToolResultSchema.parse({ proposalId: proposal.proposalId, taskId: "task-status", turnId: proposal.turnId, executionId,
        toolId: "model.status", status: "completed", resultClass: "structured", structuredResult: { runtimeMode: "standard", operationCount: 0, activeOperationCount: 0 }, resultedAt: now().toISOString() });
    } });
  const start = () => runtime.startTextTurn({ assistantInput: { kind: "text", source: "user", text: "Synthetic private question" },
    source: "text", text: "Synthetic private question", decision: { intent: "chat.answer", confidence: 1, requiresApproval: false, slots: {}, reason: "test" },
    conversationId: "primary", correlationId: "command-test", preferenceProjection: ChatAnswerPreferenceProjectionSchema.parse({ status: "none", appliesTo: "chat.answer",
      source: "none", rawContentExposed: false, vectorRetrievalUsed: false, providerNeutral: true }) });
  return { ...h, runtime, service, start, written, saved, launches: () => launches, continuations: () => continuations, requests: () => requests };
}

describe("AssistantRuntime durability barriers with fake provider and fake Desktop", () => {
  it.each(["text", "status", "deny", "allow"] as const)("persists %s completion without deltas or content duplication", async mode => {
    const h = await runtimeHarness(mode === "text" ? "text" : mode === "status" ? "status" : "notepad"); h.start();
    if (mode === "deny" || mode === "allow") {
      await vi.waitFor(() => expect(h.runtime.getProjection()?.status).toBe("awaiting_approval"));
      await h.runtime.settledPersistence();
      expect(h.launches()).toBe(0); expect(h.saved).toEqual([]);
      const task = (await h.tasks.listTasks())[0]!;
      if (mode === "deny") await h.service.deny(task.id); else await h.service.approve(task.id, "command-allow");
    }
    await vi.waitFor(() => expect(h.runtime.getProjection()?.status).toBe("completed"));
    await h.runtime.settledPersistence();
    expect(h.saved).toHaveLength(1); expect(h.launches()).toBe(mode === "allow" ? 1 : 0);
    expect(h.continuations()).toBe(mode === "text" ? 0 : 1);
    expect(h.written.at(-1)?.type).toBe("turn.completed");
    const encoded = JSON.stringify(h.written);
    expect(encoded).not.toMatch(/Synthetic|stream|delta|utterance|reasoning|Authorization|credential|arguments|structuredResult|runtimeMode|pid|[a-z]:\\/i);
    expect((await recover(h.restart().assistantTurns, h.memory)).notices).toEqual([]);
  });

  it.each(["turn.accepted", "tool.proposed", "tool.decided", "approval.resolved", "execution.started", "tool.resulted", "provider.continued", "turn.completed", "after_message"])
  ("fails closed at %s and restart never repeats the bounded action", async failAt => {
    const h = await runtimeHarness("notepad", failAt); h.start();
    if (!["turn.accepted", "tool.proposed", "tool.decided"].includes(failAt)) {
      await vi.waitFor(() => expect(h.runtime.getProjection()?.status).toBe("awaiting_approval"));
      await h.runtime.settledPersistence();
      await h.service.approve((await h.tasks.listTasks())[0]!.id, "command-allow");
    }
    await vi.waitFor(() => expect(h.runtime.getProjection()?.status).toBe("interrupted"));
    const didExecute = ["tool.resulted", "provider.continued", "turn.completed", "after_message"].includes(failAt);
    expect(h.launches()).toBe(didExecute ? 1 : 0);
    expect(h.continuations()).toBe(["turn.completed", "after_message"].includes(failAt) ? 1 : 0);
    const requests = h.requests(); const continued = h.continuations();
    const restarted = h.restart(); await restarted.recoverRunningTasksAsInterrupted(now().toISOString());
    const result = await recover(restarted.assistantTurns, h.memory);
    if (failAt === "tool.resulted") expect(result.notices[0]?.classification).toBe("interrupted_unknown_execution_result");
    if (failAt === "provider.continued") expect(result.notices[0]?.classification).toBe("interrupted_after_tool_result");
    if (["turn.completed", "after_message"].includes(failAt)) { expect(result.notices).toEqual([]); expect(await h.memory.listMessages()).toHaveLength(1); }
    await recover(h.restart().assistantTurns, h.memory);
    expect(h.launches()).toBe(didExecute ? 1 : 0); expect(h.requests()).toBe(requests); expect(h.continuations()).toBe(continued);
    expect(h.start().ok).toBe(false);
  });

  it("rejects sensitive or unbounded extra fields at the durable boundary", () => {
    for (const field of ["credential", "Authorization", "reasoning_content", "rawPayload", "pid", "path", "prompt", "answer", "arguments"]) {
      const first = history()[0]!;
      expect(AssistantJournalEventSchema.safeParse({ ...first, data: { ...first.data, [field]: "synthetic" } }).success).toBe(false);
    }
    expect(AssistantJournalEventSchema.safeParse({ ...history()[0], turnId: "C:\\synthetic\\file" }).success).toBe(false);
  });
});
