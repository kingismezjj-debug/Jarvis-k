import type {
  CommandEnvelope,
  CommandResult,
  CoreInboundMessage,
  CoreOutboundMessage,
} from "@jarvis-k/contracts";
import type { VoiceEngine } from "@jarvis-k/voice";
import { parseCoreHostMessage } from "./host-message-schema";
import type { CoreHostParsedMessage } from "./host-message-schema";

export interface CoreHostRuntimePort {
  handle(envelope: CommandEnvelope): Promise<CommandResult>;
}

export interface CoreHostMessageSource {
  onMessage(listener: (message: unknown) => void): () => void;
}

export interface RuntimeConfigurationControllerPort {
  applyMessage(message: CoreHostParsedMessage): Promise<boolean>;
  dispose(): void;
}

export interface CoreHostMessageHandlerInput {
  readonly runtime: CoreHostRuntimePort;
  readonly voiceEngine: Pick<VoiceEngine, "acceptAudioFrame">;
  readonly runtimeConfigurationController: RuntimeConfigurationControllerPort;
  readonly messageSource: CoreHostMessageSource;
  readonly send: (message: CoreOutboundMessage) => void;
  readonly logger?: Pick<typeof console, "error">;
}

export class CoreHostMessageHandler {
  private readonly logger: Pick<typeof console, "error">;
  private queue = Promise.resolve();
  private stopListening: (() => void) | undefined;
  private disposed = false;

  public constructor(private readonly input: CoreHostMessageHandlerInput) {
    this.logger = input.logger ?? console;
  }

  public start(): void {
    if (this.disposed || this.stopListening) {
      return;
    }
    this.stopListening = this.input.messageSource.onMessage((message) => {
      this.handleRawMessage(message);
    });
  }

  public handleRawMessage(message: unknown): void {
    if (this.disposed) {
      return;
    }

    const parsedMessage = parseCoreHostMessage(message);
    if (!parsedMessage.accepted) {
      this.logger.error("[core-host] Rejected invalid supervisor message.");
      return;
    }

    this.enqueue(async () => {
      if (parsedMessage.message.kind !== "core-inbound") {
        const applied =
          await this.input.runtimeConfigurationController.applyMessage(
            parsedMessage.message,
          );
        if (!applied) {
          throw new Error("UNEXPECTED_RUNTIME_CONFIGURATION_MESSAGE");
        }
        return;
      }

      await this.handleCoreInbound(parsedMessage.message.message);
    });
  }

  public async waitForIdle(): Promise<void> {
    await this.queue;
  }

  public async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.stopListening?.();
    this.stopListening = undefined;
    await this.waitForIdle();
    this.input.runtimeConfigurationController.dispose();
  }

  private enqueue(task: () => Promise<void>): void {
    this.queue = this.queue
      .then(async () => {
        if (this.disposed) {
          return;
        }
        await task();
      })
      .catch(() => {
        this.logger.error("[core-host] Inbound message handling failed.");
      });
  }

  private async handleCoreInbound(message: CoreInboundMessage): Promise<void> {
    if (message.kind === "voice-audio") {
      await this.input.voiceEngine.acceptAudioFrame(message.frame);
      return;
    }

    const result = await this.input.runtime.handle(message.envelope);
    this.input.send({
      kind: "result",
      envelope: result,
    });
  }
}

export function createProcessMessageSource(
  processLike: Pick<NodeJS.Process, "on" | "off">,
): CoreHostMessageSource {
  return {
    onMessage(listener) {
      processLike.on("message", listener);
      return () => {
        processLike.off("message", listener);
      };
    },
  };
}
