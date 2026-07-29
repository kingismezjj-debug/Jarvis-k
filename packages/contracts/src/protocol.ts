import { z } from "zod";

export const PROTOCOL_VERSION = 1 as const;
export const IPC_COMMAND_CHANNEL = "jarvis-k:command";
export const IPC_EVENT_CHANNEL = "jarvis-k:event";

export const TaskStateSchema = z.enum([
  "queued",
  "running",
  "waiting_approval",
  "paused",
  "completed",
  "failed",
  "cancelled"
]);

export type TaskState = z.infer<typeof TaskStateSchema>;

export const VoiceStateSchema = z.enum([
  "idle",
  "connecting",
  "ready",
  "recording",
  "finalizing",
  "speaking",
  "interrupted",
  "recovering",
  "error"
]);

export type VoiceState = z.infer<typeof VoiceStateSchema>;

export const VoiceModeSchema = z.enum(["disabled", "ptt", "continuous"]);
export type VoiceMode = z.infer<typeof VoiceModeSchema>;

const EmptyPayloadSchema = z.object({}).strict();

export const AgentCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("agent.ping"),
    payload: z.object({ sentAt: z.string().datetime() }).strict()
  }),
  z.object({
    type: z.literal("agent.getSnapshot"),
    payload: EmptyPayloadSchema
  }),
  z.object({
    type: z.literal("agent.sendMessage"),
    payload: z
      .object({
        conversationId: z.string().min(1).max(128),
        text: z.string().trim().min(1).max(20_000)
      })
      .strict()
  })
]);

export type AgentCommand = z.infer<typeof AgentCommandSchema>;

export const VoiceCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("voice.setMode"),
    payload: z.object({ mode: VoiceModeSchema }).strict()
  }),
  z.object({
    type: z.literal("voice.startPtt"),
    payload: EmptyPayloadSchema
  }),
  z.object({
    type: z.literal("voice.stopPtt"),
    payload: EmptyPayloadSchema
  })
]);

export type VoiceCommand = z.infer<typeof VoiceCommandSchema>;

export const AppCommandSchema = z.union([
  AgentCommandSchema,
  VoiceCommandSchema
]);

export type AppCommand = z.infer<typeof AppCommandSchema>;

export const CommandEnvelopeSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    commandId: z.string().min(1).max(128),
    correlationId: z.string().min(1).max(128),
    createdAt: z.string().datetime(),
    command: AppCommandSchema
  })
  .strict();

export type CommandEnvelope = z.infer<typeof CommandEnvelopeSchema>;

export const StructuredErrorSchema = z
  .object({
    code: z.string().min(1).max(128),
    message: z.string().min(1).max(2_000),
    retryable: z.boolean(),
    details: z.record(z.unknown()).optional()
  })
  .strict();

export type StructuredError = z.infer<typeof StructuredErrorSchema>;

export const CommandResultSchema = z.union([
  z
    .object({
      protocolVersion: z.literal(PROTOCOL_VERSION),
      commandId: z.string().min(1),
      correlationId: z.string().min(1),
      completedAt: z.string().datetime(),
      ok: z.literal(true),
      data: z.unknown().optional()
    })
    .strict(),
  z
    .object({
      protocolVersion: z.literal(PROTOCOL_VERSION),
      commandId: z.string().min(1),
      correlationId: z.string().min(1),
      completedAt: z.string().datetime(),
      ok: z.literal(false),
      error: StructuredErrorSchema
    })
    .strict()
]);

export type CommandResult = z.infer<typeof CommandResultSchema>;

export const MessageSchema = z
  .object({
    id: z.string().min(1),
    conversationId: z.string().min(1),
    role: z.enum(["user", "assistant", "system"]),
    text: z.string(),
    createdAt: z.string().datetime()
  })
  .strict();

export type Message = z.infer<typeof MessageSchema>;

export const TaskSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    state: TaskStateSchema,
    updatedAt: z.string().datetime()
  })
  .strict();

export type Task = z.infer<typeof TaskSchema>;

export const CoreSnapshotSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    coreInstanceId: z.string().min(1),
    sequenceId: z.number().int().nonnegative(),
    health: z.enum(["starting", "ready", "degraded"]),
    startedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    voice: z
      .object({
        state: VoiceStateSchema,
        mode: VoiceModeSchema
      })
      .strict(),
    messages: z.array(MessageSchema),
    tasks: z.array(TaskSchema)
  })
  .strict();

export type CoreSnapshot = z.infer<typeof CoreSnapshotSchema>;

export const AgentEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("system.core.ready"),
    payload: z
      .object({
        coreInstanceId: z.string().min(1),
        startedAt: z.string().datetime()
      })
      .strict()
  }),
  z.object({
    type: z.literal("system.health"),
    payload: z
      .object({
        status: z.enum(["ready", "degraded"]),
        uptimeMs: z.number().nonnegative()
      })
      .strict()
  }),
  z.object({
    type: z.literal("system.core.lifecycle"),
    payload: z
      .object({
        status: z.enum([
          "starting",
          "online",
          "restarting",
          "stopped",
          "failed"
        ]),
        attempt: z.number().int().nonnegative(),
        reason: z.string().optional(),
        processId: z.number().int().positive().optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("state.snapshot"),
    payload: CoreSnapshotSchema
  }),
  z.object({
    type: z.literal("agent.message.accepted"),
    payload: MessageSchema
  })
]);

export type AgentEvent = z.infer<typeof AgentEventSchema>;

export const VoiceEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("voice.state.changed"),
    payload: z
      .object({
        state: VoiceStateSchema,
        mode: VoiceModeSchema
      })
      .strict()
  })
]);

export type VoiceEvent = z.infer<typeof VoiceEventSchema>;

export const AppEventSchema = z.union([
  AgentEventSchema,
  VoiceEventSchema
]);

export type AppEvent = z.infer<typeof AppEventSchema>;

export const EventEnvelopeSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    eventId: z.string().min(1),
    sequenceId: z.number().int().nonnegative(),
    correlationId: z.string().min(1).optional(),
    createdAt: z.string().datetime(),
    source: z.enum(["core", "supervisor"]),
    event: AppEventSchema
  })
  .strict();

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

export const CoreInboundMessageSchema = z
  .object({
    kind: z.literal("command"),
    envelope: CommandEnvelopeSchema
  })
  .strict();

export type CoreInboundMessage = z.infer<typeof CoreInboundMessageSchema>;

export const CoreOutboundMessageSchema = z.union([
  z
    .object({
      kind: z.literal("result"),
      envelope: CommandResultSchema
    })
    .strict(),
  z
    .object({
      kind: z.literal("event"),
      envelope: EventEnvelopeSchema
    })
    .strict()
]);

export type CoreOutboundMessage = z.infer<typeof CoreOutboundMessageSchema>;

function fallbackId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
}

export function createId(prefix: string): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  return randomUuid ? `${prefix}-${randomUuid}` : fallbackId(prefix);
}

export function createCommandEnvelope(
  command: AppCommand
): CommandEnvelope {
  return CommandEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    commandId: createId("cmd"),
    correlationId: createId("corr"),
    createdAt: new Date().toISOString(),
    command
  });
}

export interface JarvisBridge {
  sendCommand(command: AppCommand): Promise<CommandResult>;
  getSnapshot(): Promise<CommandResult>;
  onEvent(listener: (event: EventEnvelope) => void): () => void;
}
