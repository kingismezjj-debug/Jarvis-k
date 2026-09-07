import { AssistantJournalEventSchema, type AssistantJournalEvent, type AssistantRecoveryClassification,
  type AssistantRecoveryNotice } from "@jarvis-k/contracts";

export interface AssistantTurnRepository {
  append(event: AssistantJournalEvent): Promise<void>;
  scanUnfinished(limit: number): Promise<AssistantJournalEvent[][]>;
  listRecoveryNotices(limit: number): Promise<AssistantRecoveryNotice[]>;
  hasUnfinishedOrQuarantined(): Promise<boolean>;
}

// The repository validates the entire bounded history on both append and recovery.
// Correlations are facts, not a second Task or Approval store.
export function validateAssistantJournal(raw: unknown[]): AssistantJournalEvent[] {
  const events = raw.map(value => AssistantJournalEventSchema.parse(value));
  const first = events[0];
  if (!first || first.type !== "turn.accepted" || events.length > 32) throw new Error("ASSISTANT_JOURNAL_INVALID");
  let proposed: Extract<AssistantJournalEvent, { type: "tool.proposed" }> | undefined;
  let decision: Extract<AssistantJournalEvent, { type: "tool.decided" }> | undefined;
  let resolution: string | undefined;
  let started: Extract<AssistantJournalEvent, { type: "execution.started" }> | undefined;
  let resulted = false;
  let continued = false;
  let terminal = false;
  for (const [sequence, event] of events.entries()) {
    if (terminal || event.sequence !== sequence || event.turnId !== first.turnId) throw new Error("ASSISTANT_JOURNAL_INVALID");
    if ("proposalId" in event.data && event.type !== "tool.proposed" && event.data.proposalId !== proposed?.data.proposalId) throw new Error("ASSISTANT_JOURNAL_INVALID");
    switch (event.type) {
      case "turn.accepted": if (sequence !== 0) throw new Error("ASSISTANT_JOURNAL_INVALID"); break;
      case "tool.proposed": if (proposed) throw new Error("ASSISTANT_JOURNAL_INVALID"); proposed = event; break;
      case "tool.decided":
        if (decision || !proposed || (event.data.decision === "requires_approval" && (!event.data.approvalRequestId || !event.data.taskId)) ||
          (proposed.data.toolId === "localApp.open" && event.data.decision === "allowed")) throw new Error("ASSISTANT_JOURNAL_INVALID");
        decision = event; break;
      case "approval.resolved":
        if (resolution || decision?.data.decision !== "requires_approval" || event.data.approvalRequestId !== decision.data.approvalRequestId) throw new Error("ASSISTANT_JOURNAL_INVALID");
        resolution = event.data.resolution; break;
      case "execution.started":
        if (started || resulted || !event.data.taskId || event.data.taskId !== decision?.data.taskId ||
          !(decision?.data.decision === "allowed" || resolution === "approved")) throw new Error("ASSISTANT_JOURNAL_INVALID");
        started = event; break;
      case "tool.resulted":
        if (resulted || event.data.taskId !== decision?.data.taskId ||
          !(started ? started.data.executionId === event.data.executionId : resolution === "denied" && event.data.status === "blocked")) throw new Error("ASSISTANT_JOURNAL_INVALID");
        resulted = true; break;
      case "provider.continued": if (!resulted || continued) throw new Error("ASSISTANT_JOURNAL_INVALID"); continued = true; break;
      case "turn.completed":
        if (event.data.messageId !== first.data.finalMessageId || (proposed && !continued)) throw new Error("ASSISTANT_JOURNAL_INVALID");
        terminal = true; break;
      case "turn.interrupted":
        if (event.data.classification !== classifyInterruptedTurn(events.slice(0, sequence))) throw new Error("ASSISTANT_JOURNAL_INVALID");
        terminal = true; break;
      case "turn.cancelled": case "turn.failed": terminal = true; break;
    }
  }
  return events;
}

export function classifyInterruptedTurn(events: AssistantJournalEvent[]): AssistantRecoveryClassification {
  if (events.some(event => event.type === "tool.resulted")) return "interrupted_after_tool_result";
  if (events.some(event => event.type === "execution.started")) return "interrupted_unknown_execution_result";
  if (events.some(event => event.type === "tool.decided" && event.data.decision === "requires_approval") &&
    !events.some(event => event.type === "approval.resolved")) return "interrupted_while_awaiting_approval";
  return "interrupted_before_execution";
}

// No provider or execution port is reachable from recovery. Canonical messages are
// looked up by the ID reserved before the first provider request, never recreated.
export async function recoverAssistantTurns(options: { repository: AssistantTurnRepository;
  finalMessageExists: (id: string, conversationId: string) => Promise<boolean>; now: () => Date; limit?: number }) {
  const limit = options.limit ?? 100;
  for (const raw of await options.repository.scanUnfinished(limit)) {
    const events = validateAssistantJournal(raw);
    const first = events[0]!;
    if (first.type !== "turn.accepted") throw new Error("ASSISTANT_JOURNAL_INVALID");
    const completed = await options.finalMessageExists(first.data.finalMessageId, first.data.conversationId);
    await options.repository.append(AssistantJournalEventSchema.parse({ schemaVersion: 1, turnId: first.turnId,
      sequence: events.length, occurredAt: options.now().toISOString(),
      ...(completed ? { type: "turn.completed", data: { messageId: first.data.finalMessageId } } :
        { type: "turn.interrupted", data: { classification: classifyInterruptedTurn(events) } }) }));
  }
  return { notices: await options.repository.listRecoveryNotices(limit),
    blocked: await options.repository.hasUnfinishedOrQuarantined() };
}
