const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const P = require('./profile.cjs');
const { AssistantJournalEventSchema } = require('@jarvis-k/contracts');
const { SqliteTaskRepository } = require('../../apps/core-host/dist/sqlite-task-repository.js');
const { SqliteMemoryRepository } = require('@jarvis-k/memory-sqlite');
const { recoverAssistantTurns } = require('../../packages/core/dist/assistant-turn-repository.js');
const now = () => new Date('2026-09-07T00:00:00.000Z');
async function repositories(p) {
  p = P.load(p.id);
  assert.ok(!fs.existsSync(path.join(p.control, 'launch.lock')), 'REPOSITORY_REQUIRES_CLOSED_PROFILE');
  const tasks = new SqliteTaskRepository({ filePath: path.join(p.localData, 'task-runtime.sqlite') });
  const memory = new SqliteMemoryRepository({ filePath: path.join(p.localData, 'memory.sqlite') });
  await tasks.initialize(); await memory.initialize(); return { tasks, memory };
}
function history(scenario) {
  const data = [
    ['turn.accepted', { conversationId: 'primary', correlationId: 'synthetic-command', finalMessageId: 'synthetic-final' }],
    ['tool.proposed', { proposalId: 'synthetic-proposal', toolId: scenario === 'A' ? 'model.status' : 'localApp.open' }],
    ['tool.decided', { proposalId: 'synthetic-proposal', taskId: 'synthetic-task', decision: scenario === 'A' ? 'allowed' : 'requires_approval', ...(scenario === 'A' ? {} : { approvalRequestId: 'synthetic-approval' }) }],
    ['approval.resolved', { proposalId: 'synthetic-proposal', approvalRequestId: 'synthetic-approval', resolution: 'approved' }],
    ['execution.started', { proposalId: 'synthetic-proposal', taskId: 'synthetic-task', executionId: 'synthetic-execution' }],
    ['tool.resulted', { proposalId: 'synthetic-proposal', taskId: 'synthetic-task', executionId: 'synthetic-execution', status: 'completed', verification: 'verified' }],
    ['provider.continued', {}],
  ];
  return data.slice(0, { A: 3, C: 5, D: 6, E: 7, F: 2 }[scenario]).map(([type, body], sequence) => AssistantJournalEventSchema.parse({ schemaVersion: 1, turnId: 'synthetic-turn', sequence, occurredAt: now().toISOString(), type, data: body }));
}
async function seed(p) {
  p = P.load(p.id); assert.ok(!fs.existsSync(path.join(p.control, 'seeded')), 'ALREADY_SEEDED');
  const { tasks, memory } = await repositories(p);
  await memory.upsertConversation({ id: 'primary', title: 'Synthetic recovery', createdAt: now().toISOString() });
  await memory.setActiveConversationId('primary');
  if (p.scenario !== 'B') {
    await tasks.createTask({ id: 'synthetic-task', title: 'Synthetic recovery task', state: p.scenario === 'A' ? 'queued' : 'running', createdAt: now().toISOString(), updatedAt: now().toISOString() });
    for (const e of history(p.scenario)) await tasks.assistantTurns.append(e);
    if (p.scenario === 'E') await memory.appendMessage({ id: 'synthetic-final', conversationId: 'primary', role: 'assistant', text: 'Synthetic completed response.', createdAt: now().toISOString() });
    if (p.scenario === 'F') {
      await tasks.assistantTurns.append(AssistantJournalEventSchema.parse({ ...history('A')[0], turnId: 'synthetic-control', data: { conversationId: 'primary', correlationId: 'synthetic-control-command', finalMessageId: 'synthetic-control-final' } }));
      await tasks.assistantTurns.append(AssistantJournalEventSchema.parse({ schemaVersion: 1, turnId: 'synthetic-control', sequence: 1, occurredAt: now().toISOString(), type: 'turn.cancelled', data: {} }));
      await require('./synthetic-corruption.cjs').corrupt(p);
    }
  }
  fs.writeFileSync(path.join(p.control, 'seeded'), 'synthetic', { flag: 'wx' });
}
async function recoverOffline(p) {
  const { tasks, memory } = await repositories(p);
  P.count(p, 'recoveryRuns'); await tasks.recoverRunningTasksAsInterrupted(now().toISOString());
  return recoverAssistantTurns({ repository: tasks.assistantTurns, now, finalMessageExists: async (id, conversationId) => {
    const m = await memory.getMessage(id); assert.ok(!m || m.conversationId === conversationId && m.role === 'assistant'); return !!m;
  } });
}
// Inspection reads only this owned synthetic database; it never initializes/migrates it.
async function inspect(p) {
  p = P.load(p.id); const SQL = await require('sql.js')();
  function read(name, query) {
    const file = P.canonical(path.join(p.localData, name)); const db = new SQL.Database(fs.readFileSync(file));
    try { return db.exec(query)[0]?.values ?? []; } finally { db.close(); }
  }
  const turns = read('task-runtime.sqlite', 'SELECT state,quarantine_class FROM assistant_turns ORDER BY turn_id');
  return { classification: turns.some(t => t[0] === 'quarantined') ? 'invalid_journal' : turns.some(t => t[0] === 'open') ? 'unfinished' : 'terminal',
    terminalCount: turns.filter(t => t[0] === 'terminal').length, quarantineCount: turns.filter(t => t[0] === 'quarantined').length,
    eventCount: Number(read('task-runtime.sqlite', 'SELECT COUNT(*) FROM assistant_turn_events')[0][0]),
    taskRecoveryCount: Number(read('task-runtime.sqlite', "SELECT COUNT(*) FROM task_events WHERE type='interrupted'")[0][0]),
    finalMessageCount: Number(read('memory.sqlite', "SELECT COUNT(*) FROM messages WHERE role='assistant'")[0][0]),
    messageCount: Number(read('memory.sqlite', 'SELECT COUNT(*) FROM messages')[0][0]) };
}
module.exports = { now, repositories, history, seed, recoverOffline, inspect };
