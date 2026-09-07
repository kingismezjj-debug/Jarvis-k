import { z } from "zod";

// Deliberately independent of the live event envelope: no input, delta or output payloads.
const id = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/);
export const AssistantRecoveryClassificationSchema = z.enum([
  "interrupted_before_execution", "interrupted_while_awaiting_approval",
  "interrupted_unknown_execution_result", "interrupted_after_tool_result",
]);
export type AssistantRecoveryClassification = z.infer<typeof AssistantRecoveryClassificationSchema>;
const meta = z.object({ schemaVersion: z.literal(1), turnId: id,
  sequence: z.number().int().min(0).max(31), occurredAt: z.string().datetime() });
const proposal = { proposalId: id };
const execution = { ...proposal, executionId: id, taskId: id.optional() };
export const AssistantJournalEventSchema = z.discriminatedUnion("type", [
  meta.extend({ type: z.literal("turn.accepted"), data: z.object({ conversationId: id,
    correlationId: id, finalMessageId: id }).strict() }).strict(),
  meta.extend({ type: z.literal("tool.proposed"), data: z.object({ ...proposal,
    toolId: z.enum(["model.status", "localApp.open"]) }).strict() }).strict(),
  meta.extend({ type: z.literal("tool.decided"), data: z.object({ ...proposal, taskId: id.optional(),
    decision: z.enum(["allowed", "denied", "requires_approval"]), approvalRequestId: id.optional() }).strict() }).strict(),
  meta.extend({ type: z.literal("approval.resolved"), data: z.object({ ...proposal, approvalRequestId: id,
    resolution: z.enum(["approved", "denied", "timed_out"]) }).strict() }).strict(),
  meta.extend({ type: z.literal("execution.started"), data: z.object(execution).strict() }).strict(),
  meta.extend({ type: z.literal("tool.resulted"), data: z.object({ ...execution,
    status: z.enum(["completed", "failed", "blocked", "timed_out", "cancelled"]),
    verification: z.enum(["verified", "not_verified", "not_applicable"]) }).strict() }).strict(),
  meta.extend({ type: z.literal("provider.continued"), data: z.object({}).strict() }).strict(),
  meta.extend({ type: z.literal("turn.completed"), data: z.object({ messageId: id }).strict() }).strict(),
  meta.extend({ type: z.literal("turn.cancelled"), data: z.object({}).strict() }).strict(),
  meta.extend({ type: z.literal("turn.failed"), data: z.object({}).strict() }).strict(),
  meta.extend({ type: z.literal("turn.interrupted"), data: z.object({ classification: AssistantRecoveryClassificationSchema }).strict() }).strict(),
]);
export type AssistantJournalEvent = z.infer<typeof AssistantJournalEventSchema>;
export const AssistantRecoveryNoticeSchema = z.object({ turnId: id, conversationId: id,
  classification: AssistantRecoveryClassificationSchema }).strict();
export type AssistantRecoveryNotice = z.infer<typeof AssistantRecoveryNoticeSchema>;
