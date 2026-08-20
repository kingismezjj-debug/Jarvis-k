import { EventEmitter } from "node:events";
import { ChildProcess, fork, spawn } from "node:child_process";
import {
  CommandEnvelope,
  CommandEnvelopeSchema,
  CommandResult,
  CoreOutboundMessageSchema,
  EventEnvelope,
  EventEnvelopeSchema,
  PROTOCOL_VERSION,
  StructuredError,
  createCommandEnvelope,
  createId
} from "@jarvis-k/contracts";
import {
  BoundedVoiceAudioQueue,
  type VoiceAudioEnqueueResult
} from "./audio-transport";
import type { VoiceProviderConfiguration } from "./secure-voice-provider-store";
import type { HeavyPlannerProviderConfiguration } from "./secure-heavy-planner-provider-store";
import type { ChatAnswerProviderConfiguration } from "./secure-chat-answer-provider-store";

interface PendingRequest {
  resolve: (result: CommandResult) => void;
  timer: NodeJS.Timeout;
  envelope: CommandEnvelope;
}

export interface CoreSupervisorOptions {
  coreEntry: string;
  requestTimeoutMs?: number;
  brainCommandRequestTimeoutMs?: number;
  healthIntervalMs?: number;
  restartBaseDelayMs?: number;
  maxRestartAttempts?: number;
  maxAudioQueueFrames?: number;
  maxAudioQueueBytes?: number;
  env?: NodeJS.ProcessEnv;
  loadVoiceProviderConfiguration?: () => Promise<VoiceProviderConfiguration | null>;
  loadHeavyPlannerProviderConfiguration?: () => Promise<HeavyPlannerProviderConfiguration | null>;
  loadChatAnswerProviderConfiguration?: () => Promise<ChatAnswerProviderConfiguration | null>;
}

export class CoreSupervisor {
  private readonly emitter = new EventEmitter();
  private readonly pending = new Map<string, PendingRequest>();
  private readonly requestTimeoutMs: number;
  private readonly brainCommandRequestTimeoutMs: number;
  private readonly healthIntervalMs: number;
  private readonly restartBaseDelayMs: number;
  private readonly maxRestartAttempts: number;
  private readonly voiceAudioQueue: BoundedVoiceAudioQueue;
  private child: ChildProcess | null = null;
  private healthTimer: NodeJS.Timeout | null = null;
  private restartTimer: NodeJS.Timeout | null = null;
  private stopping = false;
  private healthRequestInFlight = false;
  private restartAttempt = 0;
  private transportSequenceId = 0;
  private restartReason = "unexpected-exit";
  private commandRouterProductMode = { enabled: false };

  public constructor(private readonly options: CoreSupervisorOptions) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? 5_000;
    this.brainCommandRequestTimeoutMs =
      options.brainCommandRequestTimeoutMs ?? 60_000;
    this.healthIntervalMs = options.healthIntervalMs ?? 5_000;
    this.restartBaseDelayMs = options.restartBaseDelayMs ?? 250;
    this.maxRestartAttempts = options.maxRestartAttempts ?? 5;
    this.voiceAudioQueue = new BoundedVoiceAudioQueue({
      maxFrames: options.maxAudioQueueFrames ?? 24,
      maxBytes: options.maxAudioQueueBytes ?? 512 * 1_024,
      send: (message, onComplete) => {
        const child = this.child;
        if (!child?.connected) {
          onComplete(new Error("Agent Core is not connected."));
          return;
        }
        child.send(message, onComplete);
      },
      onSendError: (error) => {
        process.stderr.write(
          `[supervisor] Audio IPC send failed: ${error.message}\n`
        );
      }
    });
  }

  public start(): void {
    if (this.child || this.restartTimer) {
      return;
    }
    this.stopping = false;
    this.launch("startup");
    this.startHealthMonitor();
  }

  public stop(): void {
    this.stopping = true;
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.rejectPending({
      code: "CORE_STOPPED",
      message: "Agent Core stopped before the request completed.",
      retryable: true
    });
    this.voiceAudioQueue.reset();
    const child = this.child;
    if (child) {
      const childPid = child.pid;
      let exited = false;
      child.once("exit", () => {
        exited = true;
      });
      child.stdout?.destroy();
      child.stderr?.destroy();
      if (child.connected) {
        child.disconnect();
      }
      child.kill();
      child.unref();
      const forceTimer = setTimeout(() => {
        if (exited || childPid === undefined) {
          return;
        }
        const killer = spawn(
          "taskkill.exe",
          ["/PID", String(childPid), "/T", "/F"],
          {
            shell: false,
            stdio: "ignore",
            windowsHide: true
          }
        );
        killer.unref();
      }, 1500);
      forceTimer.unref();
    } else {
      this.emitLifecycle("stopped", "supervisor-stop");
    }
  }

  public restart(reason = "manual-restart"): void {
    if (this.stopping) {
      return;
    }
    this.restartReason = reason;
    this.emitLifecycle("restarting", reason);
    if (this.child) {
      this.child.kill();
      return;
    }
    this.scheduleRestart(reason);
  }

  public onEvent(listener: (event: EventEnvelope) => void): () => void {
    this.emitter.on("event", listener);
    return () => this.emitter.off("event", listener);
  }

  public enqueueVoiceAudio(rawFrame: unknown): VoiceAudioEnqueueResult {
    return this.voiceAudioQueue.enqueue(rawFrame);
  }

  public configureChatAnswerProductMode(input: {
    enabled: boolean;
    configuration?: ChatAnswerProviderConfiguration;
  }): void {
    const child = this.child;
    if (!child?.connected) {
      return;
    }
    const credentialIncluded =
      input.enabled === true && input.configuration !== undefined;
    child.send(
      {
        kind: "chat-answer-product-mode.configure",
        enabled: input.enabled,
        providerId: "chat-answer.openai-compatible.deepseek",
        profileId: "deepseek.v4-flash.compact_json_object_256",
        runtimeLocked: !credentialIncluded,
        credentialIncluded,
        ...(credentialIncluded
          ? { configuration: input.configuration }
          : {})
      },
      (error) => {
        if (error) {
          process.stderr.write(
            "[supervisor] Chat Answer product mode delivery failed.\n"
          );
        }
      }
    );
  }

  public configureCommandRouterProductMode(input: {
    enabled: boolean;
  }): void {
    this.commandRouterProductMode = { enabled: input.enabled };
    const child = this.child;
    if (!child?.connected) {
      return;
    }
    child.send(
      {
        kind: "command-router-product-mode.configure",
        providerId: "intent-router.deterministic.rules",
        mode: "production_rules",
        enabled: input.enabled,
        directActionEnabled: false,
        realQwenRuntimeEnabled: false,
        networkAccessApproved: false
      },
      (error) => {
        if (error) {
          process.stderr.write(
            "[supervisor] Command Router product mode delivery failed.\n"
          );
        }
      }
    );
  }

  public request(rawEnvelope: unknown): Promise<CommandResult> {
    const envelope = CommandEnvelopeSchema.parse(rawEnvelope);

    if (!this.child?.connected) {
      return Promise.resolve(
        this.failure(envelope, {
          code: "CORE_UNAVAILABLE",
          message: "Agent Core is not connected.",
          retryable: true
        })
      );
    }

    return new Promise((resolve) => {
      const requestTimeoutMs = this.timeoutForRequest(envelope);
      const timer = setTimeout(() => {
        this.pending.delete(envelope.commandId);
        resolve(
          this.failure(envelope, {
            code: "CORE_REQUEST_TIMEOUT",
            message: `Agent Core did not respond within ${requestTimeoutMs} ms.`,
            retryable: true
          })
        );
      }, requestTimeoutMs);

      this.pending.set(envelope.commandId, {
        resolve,
        timer,
        envelope
      });

      this.child?.send(
        {
          kind: "command",
          envelope
        },
        (error) => {
          if (!error) {
            return;
          }
          const pendingRequest = this.pending.get(envelope.commandId);
          if (!pendingRequest) {
            return;
          }
          clearTimeout(pendingRequest.timer);
          this.pending.delete(envelope.commandId);
          pendingRequest.resolve(
            this.failure(envelope, {
              code: "CORE_SEND_FAILED",
              message: "Core could not accept the request.",
              retryable: true
            })
          );
        }
      );
    });
  }

  private timeoutForRequest(envelope: CommandEnvelope): number {
    if (envelope.command.type === "agent.runBrainCommand") {
      return this.brainCommandRequestTimeoutMs;
    }
    return this.requestTimeoutMs;
  }

  private hasBrainCommandRequestInFlight(): boolean {
    for (const pendingRequest of this.pending.values()) {
      if (pendingRequest.envelope.command.type === "agent.runBrainCommand") {
        return true;
      }
    }
    return false;
  }

  private launch(reason: string): void {
    if (this.stopping) {
      return;
    }

    this.emitLifecycle("starting", reason);
    const child = fork(this.options.coreEntry, [], {
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      serialization: "advanced",
      env: {
        ...process.env,
        ...(this.options.env ?? {})
      }
    });
    this.child = child;

    child.stdout?.on("data", (chunk: Buffer) => {
      process.stdout.write(`[core] ${chunk.toString()}`);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(`[core] ${chunk.toString()}`);
    });
    child.on("message", (message: unknown) => {
      this.handleCoreMessage(message);
    });
    child.on("error", (error) => {
      process.stderr.write(`[supervisor] Core process error: ${error.message}\n`);
    });
    child.on("exit", (code, signal) => {
      if (this.child === child) {
        this.child = null;
      }
      this.rejectPending({
        code: "CORE_EXITED",
        message: `Agent Core exited with code ${String(code)} and signal ${String(signal)}.`,
        retryable: true
      });
      this.voiceAudioQueue.reset();

      if (this.stopping) {
        this.emitLifecycle("stopped", "supervisor-stop");
        return;
      }

      const reasonForRestart = this.restartReason;
      this.restartReason = "unexpected-exit";
      this.scheduleRestart(reasonForRestart);
    });
    void this.configureProviders(child);
    this.configureCommandRouterProductMode(this.commandRouterProductMode);
  }

  private async configureProviders(child: ChildProcess): Promise<void> {
    await Promise.all([
      this.configureVoiceProvider(child),
      this.configureHeavyPlannerProvider(child),
      this.configureChatAnswerProvider(child)
    ]);
  }

  private async configureVoiceProvider(child: ChildProcess): Promise<void> {
    const loadConfiguration = this.options.loadVoiceProviderConfiguration;
    if (!loadConfiguration) {
      return;
    }

    const configuration = await loadConfiguration();
    if (!configuration || !child.connected || this.child !== child) {
      return;
    }

    child.send(
      {
        kind: "voice-provider.configure",
        configuration
      },
      (error) => {
        if (error) {
          process.stderr.write(
            "[supervisor] Voice provider configuration delivery failed.\n"
          );
        }
      }
    );
  }

  private async configureHeavyPlannerProvider(
    child: ChildProcess
  ): Promise<void> {
    const loadConfiguration =
      this.options.loadHeavyPlannerProviderConfiguration;
    if (!loadConfiguration) {
      return;
    }

    const configuration = await loadConfiguration();
    if (!configuration || !child.connected || this.child !== child) {
      return;
    }

    child.send(
      {
        kind: "heavy-planner-provider.configure",
        configuration
      },
      (error) => {
        if (error) {
          process.stderr.write(
            "[supervisor] Heavy Planner provider configuration delivery failed.\n"
          );
        }
      }
    );
  }

  private async configureChatAnswerProvider(
    child: ChildProcess
  ): Promise<void> {
    const loadConfiguration =
      this.options.loadChatAnswerProviderConfiguration;
    if (!loadConfiguration) {
      return;
    }

    const configuration = await loadConfiguration();
    if (!configuration || !child.connected || this.child !== child) {
      return;
    }

    child.send(
      {
        kind: "chat-answer-provider.configure",
        configuration
      },
      (error) => {
        if (error) {
          process.stderr.write(
            "[supervisor] Chat Answer provider configuration delivery failed.\n"
          );
        }
      }
    );
  }

  private handleCoreMessage(message: unknown): void {
    const parsed = CoreOutboundMessageSchema.safeParse(message);
    if (!parsed.success) {
      process.stderr.write("[supervisor] Rejected invalid Core message.\n");
      return;
    }

    if (parsed.data.kind === "result") {
      const pendingRequest = this.pending.get(
        parsed.data.envelope.commandId
      );
      if (!pendingRequest) {
        return;
      }
      clearTimeout(pendingRequest.timer);
      this.pending.delete(parsed.data.envelope.commandId);
      pendingRequest.resolve(parsed.data.envelope);
      return;
    }

    const event = this.forwardEvent(parsed.data.envelope);
    if (event.event.type === "system.core.ready") {
      this.restartAttempt = 0;
      this.emitLifecycle("online", undefined, this.child?.pid);
    }
  }

  private forwardEvent(event: EventEnvelope): EventEnvelope {
    this.transportSequenceId += 1;
    const forwarded = EventEnvelopeSchema.parse({
      ...event,
      sequenceId: this.transportSequenceId
    });
    this.emitter.emit("event", forwarded);
    return forwarded;
  }

  private scheduleRestart(reason: string): void {
    if (this.stopping || this.restartTimer) {
      return;
    }

    this.restartAttempt += 1;
    if (this.restartAttempt > this.maxRestartAttempts) {
      this.emitLifecycle("failed", "restart-limit-exceeded");
      return;
    }

    const delay = Math.min(
      this.restartBaseDelayMs * 2 ** (this.restartAttempt - 1),
      5_000
    );
    this.emitLifecycle("restarting", reason);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      this.launch(reason);
    }, delay);
  }

  private startHealthMonitor(): void {
    if (this.healthIntervalMs <= 0 || this.healthTimer) {
      return;
    }

    this.healthTimer = setInterval(async () => {
      if (
        this.stopping ||
        this.healthRequestInFlight ||
        this.hasBrainCommandRequestInFlight() ||
        !this.child?.connected
      ) {
        return;
      }

      this.healthRequestInFlight = true;
      const result = await this.request(
        createCommandEnvelope({
          type: "agent.ping",
          payload: {
            sentAt: new Date().toISOString()
          }
        })
      );
      this.healthRequestInFlight = false;

      if (!result.ok) {
        this.restart("health-check-failed");
      }
    }, this.healthIntervalMs);
    this.healthTimer.unref();
  }

  private emitLifecycle(
    status: "starting" | "online" | "restarting" | "stopped" | "failed",
    reason: string | undefined,
    processId?: number
  ): void {
    this.transportSequenceId += 1;
    const event = EventEnvelopeSchema.parse({
      protocolVersion: PROTOCOL_VERSION,
      eventId: createId("evt"),
      sequenceId: this.transportSequenceId,
      createdAt: new Date().toISOString(),
      source: "supervisor",
      event: {
        type: "system.core.lifecycle",
        payload: {
          status,
          attempt: this.restartAttempt,
          ...(reason ? { reason } : {}),
          ...(processId ? { processId } : {})
        }
      }
    });
    this.emitter.emit("event", event);
  }

  private rejectPending(error: StructuredError): void {
    for (const pendingRequest of this.pending.values()) {
      clearTimeout(pendingRequest.timer);
      pendingRequest.resolve(
        this.failure(pendingRequest.envelope, error)
      );
    }
    this.pending.clear();
  }

  private failure(
    envelope: CommandEnvelope,
    error: StructuredError
  ): CommandResult {
    return {
      protocolVersion: PROTOCOL_VERSION,
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      completedAt: new Date().toISOString(),
      ok: false,
      error
    };
  }
}
