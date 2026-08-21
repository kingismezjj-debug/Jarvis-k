import type { BrowserWindow } from "electron";
import {
  type CommandEnvelope,
  type CommandResult,
  type EventEnvelope,
  IPC_EVENT_CHANNEL,
} from "@jarvis-k/contracts";
import {
  CoreSupervisor,
  type CoreSupervisorOptions,
} from "../supervisor";
import type { VoiceAudioEnqueueResult } from "../audio-transport";
import type { ChatAnswerProviderConfiguration } from "../secure-chat-answer-provider-store";

export interface DesktopSupervisorControllerOptions
  extends CoreSupervisorOptions {
  getMainWindow: () => BrowserWindow | null;
  onSafeEvent?: (event: EventEnvelope) => void;
}

export class DesktopSupervisorController {
  private readonly supervisor: CoreSupervisor;
  private readonly disposeEventForwarding: () => void;

  public constructor(
    private readonly options: DesktopSupervisorControllerOptions,
  ) {
    this.supervisor = new CoreSupervisor(options);
    this.disposeEventForwarding = this.supervisor.onEvent((event) => {
      this.options.onSafeEvent?.(event);
      const mainWindow = this.options.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_EVENT_CHANNEL, event);
      }
    });
  }

  public start(): void {
    this.supervisor.start();
  }

  public stop(): void {
    this.disposeEventForwarding();
    this.supervisor.stop();
  }

  public restart(reason = "manual-restart"): void {
    this.supervisor.restart(reason);
  }

  public request(envelope: CommandEnvelope): Promise<CommandResult> {
    return this.supervisor.request(envelope);
  }

  public enqueueVoiceAudio(rawFrame: unknown): VoiceAudioEnqueueResult {
    return this.supervisor.enqueueVoiceAudio(rawFrame);
  }

  public configureCommandRouterProductMode(input: {
    enabled: boolean;
  }): void {
    this.supervisor.configureCommandRouterProductMode(input);
  }

  public configureChatAnswerProductMode(input: {
    enabled: boolean;
    configuration?: ChatAnswerProviderConfiguration;
  }): void {
    this.supervisor.configureChatAnswerProductMode(input);
  }
}
