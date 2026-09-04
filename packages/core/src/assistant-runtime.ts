import {
  ASSISTANT_LOOP_CONTRACT_VERSION,
  ASSISTANT_LOOP_MAX_TOOL_ITERATIONS,
  AssistantTurnIdSchema,
  AssistantEventSchema,
  AssistantFailureSchema,
  AssistantFinalAnswerSchema,
  AssistantInputSchema,
  AssistantModelAdapterEventSchema,
  AssistantTurnProjectionSchema,
  ChatAnswerRequestSchema,
  type AssistantEvent,
  type AssistantInput,
  type AssistantModelAdapterEvent,
  type AssistantProviderFailureReason,
  type AssistantTurnId,
  type AssistantTurnProjection,
  type ChatAnswerPreferenceProjection,
  type ChatAnswerRequest,
  type Message,
} from "@jarvis-k/contracts";
import type { BrainRouterDecision } from "@jarvis-k/contracts";
import { reduceAssistantTurnProjection } from "./assistant-loop-state-machine";

export interface AssistantTextModelAdapter {
  startTextTurn(
    request: ChatAnswerRequest,
    context: Record<string, never>,
    signal: AbortSignal,
  ): AsyncIterable<AssistantModelAdapterEvent>;
}

export interface AssistantRuntimeScheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface AssistantRuntimeOptions {
  readonly getProviderId: () => string;
  readonly getModelAdapter: () => AssistantTextModelAdapter | undefined;
  readonly persistFinalMessage: (
    text: string,
    conversationId: string,
  ) => Promise<Message>;
  readonly publishProjection: (
    projection: AssistantTurnProjection,
    correlationId: string,
  ) => void;
  readonly createId: (prefix: string) => string;
  readonly now: () => Date;
  readonly scheduler?: AssistantRuntimeScheduler;
  readonly batchWindowMs?: number;
}

export type AssistantStartResult =
  | {
      ok: true;
      turnId: AssistantTurnId;
      projection: AssistantTurnProjection;
    }
  | {
      ok: false;
      code:
        | "ASSISTANT_PROVIDER_UNAVAILABLE"
        | "ASSISTANT_TURN_ALREADY_ACTIVE"
        | "ASSISTANT_INPUT_INVALID";
      message: string;
    };

export type AssistantCancelResult =
  | {
      ok: true;
      turnId: AssistantTurnId;
      status: "cancelled";
    }
  | {
      ok: false;
      code:
        | "ASSISTANT_TURN_NOT_ACTIVE"
        | "ASSISTANT_TURN_ID_STALE"
        | "ASSISTANT_TURN_TERMINAL";
      message: string;
    };

interface ActiveAssistantTurn {
  readonly turnId: AssistantTurnId;
  readonly correlationId: string;
  readonly controller: AbortController;
  readonly runId: number;
}

const terminalStatuses = new Set(["completed", "cancelled", "failed", "interrupted"]);

const FAILURE_REASON_CODES: Record<AssistantProviderFailureReason, string> = {
  authentication_failed: "AUTHENTICATION_FAILED",
  access_forbidden: "ACCESS_FORBIDDEN",
  rate_limited: "RATE_LIMITED",
  provider_unavailable: "PROVIDER_UNAVAILABLE",
  streaming_not_supported: "STREAMING_NOT_SUPPORTED",
  provider_timeout: "PROVIDER_TIMEOUT",
  malformed_response: "MALFORMED_RESPONSE",
  unsupported_tool_call: "UNSUPPORTED_TOOL_CALL",
  cancelled: "CANCELLED",
  transport_failed: "TRANSPORT_FAILED",
  unknown_provider_failure: "UNKNOWN_PROVIDER_FAILURE",
};

export class AssistantRuntime {
  private projection: AssistantTurnProjection | undefined;
  private active: ActiveAssistantTurn | undefined;
  private nextRunId = 0;
  private pendingFlush: unknown;
  private firstDeltaFlushedForTurnId: AssistantTurnId | undefined;
  private readonly scheduler: AssistantRuntimeScheduler;
  private readonly batchWindowMs: number;

  public constructor(private readonly options: AssistantRuntimeOptions) {
    this.scheduler =
      options.scheduler ?? {
        setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
        clearTimeout: (handle) => clearTimeout(handle as NodeJS.Timeout),
      };
    this.batchWindowMs = options.batchWindowMs ?? 32;
  }

  public getProjection(): AssistantTurnProjection | undefined {
    return this.projection
      ? AssistantTurnProjectionSchema.parse(this.projection)
      : undefined;
  }

  public hasActiveTurn(): boolean {
    return this.active !== undefined && !isTerminal(this.projection);
  }

  public startTextTurn(input: {
    assistantInput: AssistantInput;
    source: "text" | "voice";
    text: string;
    decision: BrainRouterDecision;
    conversationId: string;
    correlationId: string;
    preferenceProjection: ChatAnswerPreferenceProjection;
  }): AssistantStartResult {
    const adapter = this.options.getModelAdapter();
    if (!adapter) {
      return {
        ok: false,
        code: "ASSISTANT_PROVIDER_UNAVAILABLE",
        message: "Assistant streaming provider is unavailable.",
      };
    }
    if (this.active && !isTerminal(this.projection)) {
      return {
        ok: false,
        code: "ASSISTANT_TURN_ALREADY_ACTIVE",
        message: "An assistant answer is still being generated.",
      };
    }
    const parsedInput = AssistantInputSchema.safeParse(input.assistantInput);
    if (!parsedInput.success) {
      return {
        ok: false,
        code: "ASSISTANT_INPUT_INVALID",
        message: "Assistant input did not match the text-only contract.",
      };
    }

    const turnId = this.parseTurnId(this.options.createId("turn"));
    const runId = this.nextRunId + 1;
    this.nextRunId = runId;
    this.firstDeltaFlushedForTurnId = undefined;
    this.projection = AssistantTurnProjectionSchema.parse({
      contractVersion: ASSISTANT_LOOP_CONTRACT_VERSION,
      turnId,
      conversationId: input.conversationId,
      status: "idle",
      lastSequence: -1,
      toolIterationCount: 0,
      proposals: [],
      executions: [],
    });
    this.active = {
      turnId,
      correlationId: input.correlationId,
      controller: new AbortController(),
      runId,
    };
    const accepted = this.applyEvent({
      type: "turn.accepted",
      payload: {
        input: parsedInput.data,
        maxToolIterations: ASSISTANT_LOOP_MAX_TOOL_ITERATIONS,
      },
      correlationId: input.correlationId,
      flush: "immediate",
    });
    if (!accepted.ok) {
      this.active = undefined;
      return {
        ok: false,
        code: "ASSISTANT_INPUT_INVALID",
        message: accepted.message,
      };
    }
    void this.runProvider({
      adapter,
      runId,
      turnId,
      conversationId: input.conversationId,
      correlationId: input.correlationId,
      request: ChatAnswerRequestSchema.parse({
        providerId: this.options.getProviderId(),
        utterance: input.text,
        source: input.source,
        routedAt: this.options.now().toISOString(),
        routerDecision: input.decision,
        preferenceProjection: input.preferenceProjection,
      }),
    });
    return {
      ok: true,
      turnId,
      projection: this.projection,
    };
  }

  public cancel(
    turnId: AssistantTurnId,
    requestedBy: "renderer" | "core" = "renderer",
  ): AssistantCancelResult {
    const active = this.active;
    if (!active) {
      return {
        ok: false,
        code: isTerminal(this.projection)
          ? "ASSISTANT_TURN_TERMINAL"
          : "ASSISTANT_TURN_NOT_ACTIVE",
        message: "No active assistant turn can be cancelled.",
      };
    }
    if (active.turnId !== turnId) {
      return {
        ok: false,
        code: "ASSISTANT_TURN_ID_STALE",
        message: "Assistant cancellation turnId does not match the active turn.",
      };
    }
    active.controller.abort();
    const cancelled = this.applyEvent({
      type: "turn.cancelled",
      payload: {
        cancellation: {
          kind: "user_requested",
          requestedBy,
          cancelledAt: this.options.now().toISOString(),
        },
      },
      correlationId: active.correlationId,
      flush: "immediate",
    });
    this.active = undefined;
    return cancelled.ok
      ? {
          ok: true,
          turnId,
          status: "cancelled",
        }
      : {
          ok: false,
          code: "ASSISTANT_TURN_TERMINAL",
          message: cancelled.message,
        };
  }

  private async runProvider(input: {
    adapter: AssistantTextModelAdapter;
    runId: number;
    turnId: AssistantTurnId;
    conversationId: string;
    correlationId: string;
    request: ChatAnswerRequest;
  }): Promise<void> {
    const active = this.active;
    if (!active || active.runId !== input.runId) {
      return;
    }
    this.applyEvent({
      type: "provider.started",
      payload: {
        adapterId: input.request.providerId,
      },
      correlationId: input.correlationId,
      flush: "batched",
    });
    try {
      for await (const rawEvent of input.adapter.startTextTurn(
        input.request,
        {},
        active.controller.signal,
      )) {
        if (!this.isCurrentRun(input.runId, input.turnId)) {
          return;
        }
        const event = AssistantModelAdapterEventSchema.parse(rawEvent);
        if (event.type === "delta") {
          if (event.delta.kind !== "text" || event.delta.text.trim().length === 0) {
            continue;
          }
          this.applyEvent({
            type: "provider.delta",
            payload: { delta: event.delta },
            correlationId: input.correlationId,
            flush:
              this.firstDeltaFlushedForTurnId === input.turnId
                ? "batched"
                : "immediate",
          });
          this.firstDeltaFlushedForTurnId = input.turnId;
          continue;
        }
        if (event.type === "failure") {
          this.failTurn(input, event.reason, event.safeMessage, event.retryable);
          return;
        }
        await this.completeTurn(input, event.text);
        return;
      }
      if (!this.isCurrentRun(input.runId, input.turnId)) {
        return;
      }
      this.failTurn(
        input,
        "malformed_response",
        "The provider disconnected before producing a final answer.",
        true,
      );
    } catch {
      if (!this.isCurrentRun(input.runId, input.turnId)) {
        return;
      }
      this.failTurn(
        input,
        active.controller.signal.aborted ? "cancelled" : "unknown_provider_failure",
        active.controller.signal.aborted
          ? "The answer was cancelled."
          : "The provider failed while generating the answer.",
        !active.controller.signal.aborted,
      );
    }
  }

  private async completeTurn(
    input: {
      runId: number;
      turnId: AssistantTurnId;
      conversationId: string;
      correlationId: string;
    },
    adapterFinalText: string,
  ): Promise<void> {
    if (!this.isCurrentRun(input.runId, input.turnId)) {
      return;
    }
    const finalText =
      this.projection?.streamText.trim() || adapterFinalText.trim();
    if (!finalText) {
      this.failTurn(
        input,
        "malformed_response",
        "The provider completed without answer text.",
        true,
      );
      return;
    }
    try {
      const message = await this.options.persistFinalMessage(
        finalText,
        input.conversationId,
      );
      if (!this.isCurrentRun(input.runId, input.turnId)) {
        return;
      }
      this.applyEvent({
        type: "turn.completed",
        payload: {
          finalAnswer: AssistantFinalAnswerSchema.parse({
            turnId: input.turnId,
            text: finalText,
            messageId: message.id,
            completedAt: this.options.now().toISOString(),
            usedToolIterations: 0,
            rawProviderResponsePersisted: false,
            providerRawPayloadExposed: false,
          }),
        },
        correlationId: input.correlationId,
        flush: "immediate",
      });
    } catch {
      this.failTurn(
        input,
        "unknown_provider_failure",
        "The final answer could not be saved.",
        true,
      );
      return;
    } finally {
      if (this.active?.runId === input.runId) {
        this.active = undefined;
      }
    }
  }

  private failTurn(
    input: {
      runId: number;
      turnId: AssistantTurnId;
      correlationId: string;
    },
    reason: AssistantProviderFailureReason,
    safeMessage: string,
    retryable: boolean,
  ): void {
    if (!this.isCurrentRun(input.runId, input.turnId)) {
      return;
    }
    this.applyEvent({
      type: reason === "cancelled" ? "turn.cancelled" : "turn.failed",
      payload:
        reason === "cancelled"
          ? {
              cancellation: {
                kind: "user_requested",
                requestedBy: "core",
                safeMessage,
                cancelledAt: this.options.now().toISOString(),
              },
            }
          : {
              failure: AssistantFailureSchema.parse({
                turnId: input.turnId,
                failureClass:
                  reason === "unsupported_tool_call" ? "policy" : "provider",
                reasonCode: FAILURE_REASON_CODES[reason],
                safeMessage,
                retryable,
                failedAt: this.options.now().toISOString(),
              }),
            },
      correlationId: input.correlationId,
      flush: "immediate",
    });
    if (this.active?.runId === input.runId) {
      this.active = undefined;
    }
  }

  private applyEvent(input: {
    type: AssistantEvent["type"];
    payload: unknown;
    correlationId: string;
    flush: "immediate" | "batched";
  }):
    | { ok: true; projection: AssistantTurnProjection }
    | { ok: false; message: string } {
    if (!this.projection) {
      return { ok: false, message: "Assistant projection is unavailable." };
    }
    const event = AssistantEventSchema.parse({
      eventId: this.options.createId("aevt"),
      turnId: this.projection.turnId,
      sequence: this.projection.lastSequence + 1,
      occurredAt: this.options.now().toISOString(),
      type: input.type,
      payload: input.payload,
    });
    const reduced = reduceAssistantTurnProjection(this.projection, event);
    if (!reduced.ok) {
      return { ok: false, message: reduced.message };
    }
    this.projection = reduced.projection;
    if (input.flush === "immediate") {
      this.flush(input.correlationId);
    } else {
      this.scheduleFlush(input.correlationId);
    }
    return { ok: true, projection: reduced.projection };
  }

  private scheduleFlush(correlationId: string): void {
    if (this.pendingFlush !== undefined) {
      return;
    }
    this.pendingFlush = this.scheduler.setTimeout(() => {
      this.pendingFlush = undefined;
      this.flush(correlationId);
    }, this.batchWindowMs);
  }

  private flush(correlationId: string): void {
    if (this.pendingFlush !== undefined) {
      this.scheduler.clearTimeout(this.pendingFlush);
      this.pendingFlush = undefined;
    }
    if (this.projection) {
      this.options.publishProjection(this.projection, correlationId);
    }
  }

  private isCurrentRun(runId: number, turnId: AssistantTurnId): boolean {
    return this.active?.runId === runId && this.active.turnId === turnId;
  }

  private parseTurnId(value: string): AssistantTurnId {
    return AssistantTurnIdSchema.parse(value);
  }
}

export function isAssistantTextModelAdapter(
  value: unknown,
): value is AssistantTextModelAdapter {
  return (
    typeof value === "object" &&
    value !== null &&
    "startTextTurn" in value &&
    typeof (value as { startTextTurn?: unknown }).startTextTurn === "function"
  );
}

function isTerminal(
  projection: AssistantTurnProjection | undefined,
): boolean {
  return projection !== undefined && terminalStatuses.has(projection.status);
}
