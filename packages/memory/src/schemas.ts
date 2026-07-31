import { MessageSchema } from "@jarvis-k/contracts";
import { z } from "zod";

export const ConversationSchema = z
  .object({
    id: z.string().min(1).max(128),
    title: z.string().trim().min(1).max(200),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    lastMessageAt: z.string().datetime().optional()
  })
  .strict();

export type Conversation = z.infer<typeof ConversationSchema>;

export const MemorySummarySchema = z
  .object({
    id: z.string().min(1).max(128),
    conversationId: z.string().min(1).max(128),
    text: z.string().trim().min(1).max(20_000),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    fromMessageId: z.string().min(1).max(128).optional(),
    toMessageId: z.string().min(1).max(128).optional()
  })
  .strict();

export type MemorySummary = z.infer<typeof MemorySummarySchema>;

export const MemoryHealthSchema = z
  .object({
    status: z.enum(["ok", "degraded"]),
    checkedAt: z.string().datetime(),
    code: z.string().min(1).max(128).optional(),
    message: z.string().min(1).max(2_000).optional()
  })
  .strict();

export type MemoryHealth = z.infer<typeof MemoryHealthSchema>;

export const MemorySnapshotSchema = z
  .object({
    messages: z.array(MessageSchema),
    conversations: z.array(ConversationSchema).default([]),
    summaries: z.array(MemorySummarySchema).default([]),
    activeConversationId: z.string().min(1).max(128).optional()
  })
  .strict();

export type MemorySnapshot = z.infer<typeof MemorySnapshotSchema>;
export type MemorySnapshotInput = z.input<typeof MemorySnapshotSchema>;

export function cloneMessage(message: z.infer<typeof MessageSchema>) {
  return MessageSchema.parse(message);
}

export function cloneConversation(conversation: Conversation): Conversation {
  return ConversationSchema.parse(conversation);
}

export function cloneMemorySummary(summary: MemorySummary): MemorySummary {
  return MemorySummarySchema.parse(summary);
}

export function cloneMemoryHealth(health: MemoryHealth): MemoryHealth {
  return MemoryHealthSchema.parse(health);
}
