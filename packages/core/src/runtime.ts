import {
  AppEvent,
  CommandEnvelope,
  CommandEnvelopeSchema,
  CommandResult,
  CoreSnapshot,
  EventEnvelope,
  Message,
  PROTOCOL_VERSION,
  StructuredError,
  createId
} from "@jarvis-k/contracts";

type EventSink = (event: EventEnvelope) => void;

export class CoreRuntime {
  private readonly coreInstanceId = createId("core");
  private readonly startedAt: string;
  private readonly messages: Message[] = [];
  private sequenceId = 0;
  private voice: CoreSnapshot["voice"] = {
    state: "idle",
    mode: "disabled"
  };

  public constructor(
    private readonly eventSink: EventSink,
    private readonly now: () => Date = () => new Date()
  ) {
    this.startedAt = this.now().toISOString();
  }

  public announceReady(): void {
    this.publish(
      {
        type: "system.core.ready",
        payload: {
          coreInstanceId: this.coreInstanceId,
          startedAt: this.startedAt
        }
      },
      undefined
    );
    this.publishSnapshot();
  }

  public getSnapshot(): CoreSnapshot {
    return {
      protocolVersion: PROTOCOL_VERSION,
      coreInstanceId: this.coreInstanceId,
      sequenceId: this.sequenceId,
      health: "ready",
      startedAt: this.startedAt,
      updatedAt: this.now().toISOString(),
      voice: { ...this.voice },
      messages: this.messages.map((message) => ({ ...message })),
      tasks: []
    };
  }

  public handle(rawEnvelope: unknown): CommandResult {
    const envelope = CommandEnvelopeSchema.parse(rawEnvelope);

    switch (envelope.command.type) {
      case "agent.ping":
        this.publish(
          {
            type: "system.health",
            payload: {
              status: "ready",
              uptimeMs: Math.max(
                0,
                this.now().getTime() - new Date(this.startedAt).getTime()
              )
            }
          },
          envelope.correlationId
        );
        return this.success(envelope, {
          coreInstanceId: this.coreInstanceId,
          status: "ready"
        });

      case "agent.getSnapshot": {
        const snapshot = this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, snapshot);
      }

      case "agent.sendMessage": {
        const message: Message = {
          id: createId("msg"),
          conversationId: envelope.command.payload.conversationId,
          role: "user",
          text: envelope.command.payload.text,
          createdAt: this.now().toISOString()
        };
        this.messages.push(message);
        this.publish(
          {
            type: "agent.message.accepted",
            payload: message
          },
          envelope.correlationId
        );
        this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, {
          accepted: true,
          messageId: message.id
        });
      }

      case "voice.setMode":
        this.voice = {
          mode: envelope.command.payload.mode,
          state:
            envelope.command.payload.mode === "disabled" ? "idle" : "ready"
        };
        this.publishVoiceState(envelope.correlationId);
        this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, { voice: this.voice });

      case "voice.startPtt":
        if (this.voice.mode !== "ptt") {
          return this.failure(envelope, {
            code: "VOICE_MODE_INVALID",
            message: "PTT requires voice mode to be set to ptt.",
            retryable: false
          });
        }
        this.voice = {
          ...this.voice,
          state: "recording"
        };
        this.publishVoiceState(envelope.correlationId);
        this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, { voice: this.voice });

      case "voice.stopPtt":
        if (this.voice.state !== "recording") {
          return this.failure(envelope, {
            code: "VOICE_STATE_INVALID",
            message: "PTT can only stop while recording.",
            retryable: false
          });
        }
        this.voice = {
          ...this.voice,
          state: "finalizing"
        };
        this.publishVoiceState(envelope.correlationId);
        this.voice = {
          ...this.voice,
          state: "ready"
        };
        this.publishVoiceState(envelope.correlationId);
        this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, { voice: this.voice });
    }
  }

  private publishVoiceState(correlationId: string): void {
    this.publish(
      {
        type: "voice.state.changed",
        payload: { ...this.voice }
      },
      correlationId
    );
  }

  private publishSnapshot(correlationId?: string): CoreSnapshot {
    const nextSequenceId = this.sequenceId + 1;
    const snapshot = {
      ...this.getSnapshot(),
      sequenceId: nextSequenceId
    };
    this.publish(
      {
        type: "state.snapshot",
        payload: snapshot
      },
      correlationId
    );
    return snapshot;
  }

  private publish(event: AppEvent, correlationId: string | undefined): void {
    this.sequenceId += 1;
    const envelope: EventEnvelope = {
      protocolVersion: PROTOCOL_VERSION,
      eventId: createId("evt"),
      sequenceId: this.sequenceId,
      createdAt: this.now().toISOString(),
      source: "core",
      event,
      ...(correlationId ? { correlationId } : {})
    };
    this.eventSink(envelope);
  }

  private success(
    envelope: CommandEnvelope,
    data?: unknown
  ): CommandResult {
    return {
      protocolVersion: PROTOCOL_VERSION,
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      completedAt: this.now().toISOString(),
      ok: true,
      ...(data === undefined ? {} : { data })
    };
  }

  private failure(
    envelope: CommandEnvelope,
    error: StructuredError
  ): CommandResult {
    return {
      protocolVersion: PROTOCOL_VERSION,
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      completedAt: this.now().toISOString(),
      ok: false,
      error
    };
  }
}
