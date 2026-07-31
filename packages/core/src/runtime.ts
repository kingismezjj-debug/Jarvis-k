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
  VoiceCommand,
  VoiceEvent,
  createId
} from "@jarvis-k/contracts";
import type {
  VoiceActionResult,
  VoiceEnginePort
} from "@jarvis-k/voice";

type EventSink = (event: EventEnvelope) => void;

export class CoreRuntime {
  private readonly coreInstanceId = createId("core");
  private readonly startedAt: string;
  private readonly messages: Message[] = [];
  private sequenceId = 0;
  private activeVoiceCorrelationId: string | undefined;

  public constructor(
    private readonly eventSink: EventSink,
    private readonly voiceEngine: VoiceEnginePort,
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
      voice: this.voiceEngine.getSnapshot(),
      messages: this.messages.map((message) => ({ ...message })),
      tasks: []
    };
  }

  public async handle(rawEnvelope: unknown): Promise<CommandResult> {
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
      case "voice.startPtt":
      case "voice.stopPtt":
      case "voice.cancel":
      case "voice.suspendForTts":
      case "voice.resumeAfterTts":
      case "voice.reportPermission":
        return this.handleVoiceCommand(envelope, envelope.command);
    }
  }

  public handleVoiceEvent(event: VoiceEvent): void {
    this.publish(event, this.activeVoiceCorrelationId);
    this.publishSnapshot(this.activeVoiceCorrelationId);
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

  private async handleVoiceCommand(
    envelope: CommandEnvelope,
    command: VoiceCommand
  ): Promise<CommandResult> {
    this.activeVoiceCorrelationId = envelope.correlationId;
    let result: VoiceActionResult;
    try {
      switch (command.type) {
        case "voice.setMode":
          result = await this.voiceEngine.setMode(command.payload.mode);
          break;
        case "voice.startPtt":
          result = this.voiceEngine.startPtt(command.payload.captureId);
          break;
        case "voice.stopPtt":
          result = await this.voiceEngine.stopPtt();
          break;
        case "voice.cancel":
          result = await this.voiceEngine.cancel();
          break;
        case "voice.suspendForTts":
          result = this.voiceEngine.suspendForTts(
            command.payload.playbackId
          );
          break;
        case "voice.resumeAfterTts":
          result = await this.voiceEngine.resumeAfterTts(
            command.payload.playbackId,
            command.payload.interrupted
          );
          break;
        case "voice.reportPermission":
          result = this.voiceEngine.reportPermission(
            command.payload.permission
          );
          break;
      }
    } finally {
      this.activeVoiceCorrelationId = undefined;
    }

    if (!result.ok) {
      return this.failure(envelope, result.error);
    }

    this.publishSnapshot(envelope.correlationId);
    return this.success(envelope, {
      voice: result.snapshot
    });
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
