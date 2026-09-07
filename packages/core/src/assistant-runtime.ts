import { AssistantJournalEventSchema, type AssistantJournalEvent } from "@jarvis-k/contracts";
import type { AssistantTurnRepository } from "./assistant-turn-repository";
import { LocalAppOpenArgumentsSchema } from "@jarvis-k/contracts";
import {
  ASSISTANT_LOOP_CONTRACT_VERSION,
  AssistantTurnIdSchema,
  AssistantEventSchema,
  AssistantFailureSchema,
  AssistantFinalAnswerSchema,
  AssistantInputSchema,
  AssistantModelAdapterEventSchema,
  AssistantTurnProjectionSchema,
  ChatAnswerRequestSchema,
  AssistantToolContinuationSchema,
  AssistantModelStatusArgumentsSchema,
  ToolProposalIdSchema,
  ToolResultSchema,
  ToolExecutionIdSchema,
  type ToolProposal,
  type ToolResult,
  type ToolDecision,
  type ToolExecutionRequest,
  type AssistantToolContext,
  type AssistantToolContinuation,
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
    context: AssistantToolContext,
    signal: AbortSignal,
  ): AsyncIterable<AssistantModelAdapterEvent>;
  continueTextTurn?(continuation: AssistantToolContinuation, signal: AbortSignal): AsyncIterable<AssistantModelAdapterEvent>;
}

export interface AssistantRuntimeScheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface AssistantRuntimeOptions {
  repository?: AssistantTurnRepository;
  canStart?: () => boolean;
  readonly executeTool?: (proposal: ToolProposal, executionId: ToolExecutionRequest["executionId"], signal: AbortSignal,
    publish: (event: { type: "tool.decided"; decision: ToolDecision } | { type: "execution.started"; request: ToolExecutionRequest } | { type: "approval.resolved"; approval: import("@jarvis-k/contracts").AssistantApprovalResolution }) => Promise<void>,
  ) => Promise<ToolResult>;
  readonly getProviderId: () => string;
  readonly getModelAdapter: () => AssistantTextModelAdapter | undefined;
  readonly persistFinalMessage: (
    text: string,
    conversationId: string,
    messageId?: string,
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
        | "ASSISTANT_INPUT_INVALID"
        | "ASSISTANT_STORAGE_UNAVAILABLE";
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
  finalizing: boolean;
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
  private durability: Promise<void> = Promise.resolve();
  private persistenceUnavailable = false;
  private durableSequence = 0;
  private finalMessageId = "";

  public async settledPersistence(): Promise<void> { await this.durability; }

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
    if (this.persistenceUnavailable || this.options.canStart?.() === false) return {
      ok: false, code: "ASSISTANT_STORAGE_UNAVAILABLE", message: "Conversation recovery requires attention.",
    };
    const adapter = this.options.getModelAdapter();
    if (!adapter) {
      return {
        ok: false,
        code: "ASSISTANT_PROVIDER_UNAVAILABLE",
        message: "Assistant streaming provider is unavailable.",
      };
    }
    if (this.active && (this.active.finalizing || !isTerminal(this.projection))) {
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
    this.durableSequence = 0;
    this.finalMessageId = this.options.createId("msg");
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
      finalizing: false,
    };
    const accepted = this.applyEvent({
      type: "turn.accepted",
      payload: {
        input: parsedInput.data,
        maxToolIterations: 1,
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
    if (active.finalizing) {
      return {
        ok: false,
        code: "ASSISTANT_TURN_TERMINAL",
        message: "The answer has finished and is being saved.",
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
    continuation?: AssistantToolContinuation;
  }): Promise<void> {
    const active = this.active;
    if (!active || active.runId !== input.runId) {
      return;
    }
    if (!input.continuation) this.applyEvent({
      type: "provider.started",
      payload: {
        adapterId: input.request.providerId,
      },
      correlationId: input.correlationId,
      flush: "batched",
    });
    try {
      if (this.options.repository) await this.durability;
      if (!this.isCurrentRun(input.runId, input.turnId)) return;
      const proposalId = ToolProposalIdSchema.parse(this.options.createId("tprop"));
      const events = input.continuation && input.adapter.continueTextTurn
        ? input.adapter.continueTextTurn(input.continuation, active.controller.signal)
        : input.adapter.startTextTurn(input.request,
          this.options.executeTool && input.adapter.continueTextTurn ? { tool: { turnId: input.turnId, proposalId,
            toolIds: ["model.status", "localApp.open"] } } : {},
          active.controller.signal);
      const iterator = events[Symbol.asyncIterator]();
      for await (const rawEvent of { [Symbol.asyncIterator]: () => iterator }) {
        if (!this.isCurrentRun(input.runId, input.turnId)) {
          return;
        }
        const event = AssistantModelAdapterEventSchema.parse(rawEvent);
        if (event.type === "tool_proposal") {
          const proposal = event.proposal;
          if (input.continuation || this.projection!.toolIterationCount >= 1 ||
            !this.options.executeTool || !input.adapter.continueTextTurn ||
            proposal.turnId !== input.turnId || proposal.proposalId !== proposalId ||
            !(proposal.toolId === "localApp.open" && proposal.risk === "mutating" && LocalAppOpenArgumentsSchema.safeParse(proposal.arguments).success ||
              proposal.toolId === "model.status" &&
                proposal.risk === "read_only" && AssistantModelStatusArgumentsSchema.safeParse(proposal.arguments).success)) {
            this.failTurn(input, "unsupported_tool_call", "This operation is unsupported.", false);
            return;
          }
          // Do not execute until the adapter has ended its proposal response.
          // A duplicate proposal or mixed final in that response fails closed.
          const afterProposal = await iterator.next();
          if (!this.isCurrentRun(input.runId, input.turnId)) return;
          if (!afterProposal.done) {
            this.failTurn(input, "unsupported_tool_call", "Multiple operations are unsupported.", false);
            return;
          }
          await this.requireEvent({ type: "tool.proposed", payload: { proposal }, correlationId: input.correlationId, flush: "immediate" });
          const executionId = ToolExecutionIdSchema.parse(this.options.createId("texec"));
          const result = ToolResultSchema.parse(await this.waitForTool(this.options.executeTool(proposal, executionId, active.controller.signal, async update => {
            if (!this.isCurrentRun(input.runId, input.turnId)) throw new Error("CANCELLED");
            await this.requireEvent({ type: update.type,
              payload: update.type === "tool.decided" ? { decision: update.decision } : update.type === "approval.resolved" ? { approval: update.approval } : { request: update.request },
              correlationId: input.correlationId, flush: "immediate" });
            if (!this.isCurrentRun(input.runId, input.turnId)) throw new Error("CANCELLED");
          }), active.controller, proposal.toolId === "localApp.open" ? 130000 : 1000));
          if (!this.isCurrentRun(input.runId, input.turnId)) return;
          const continuation = AssistantToolContinuationSchema.parse({ turnId: input.turnId, proposal, result });
          if (result.executionId !== executionId ||
            result.taskId !== this.projection?.proposals.find(item => item.proposalId === proposal.proposalId)?.taskId) {
            throw new Error("RESULT_CORRELATION");
          }
          await this.requireEvent({ type: "tool.resulted", payload: { result }, correlationId: input.correlationId, flush: "immediate" });
          await this.requireEvent({ type: "provider.continued", payload: { adapterId: input.request.providerId,
            toolResultExecutionIds: [executionId] }, correlationId: input.correlationId, flush: "immediate" });
          await this.runProvider({ ...input, continuation });
          return;
        }
        if (event.type === "delta") {
          // An action preamble is not evidence of execution. Keep it private until the tool round-trip.
          if (!input.continuation && input.request.routerDecision.intent === "localApp.open") continue;
          if (event.delta.kind !== "text" || event.delta.text.length === 0) {
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
        if (!input.continuation && input.request.routerDecision.intent === "localApp.open") {
          this.failTurn(input, "unsupported_tool_call", "The action was not executed. No approved tool result was received.", false);
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
    } catch (error) {
      if (this.persistenceUnavailable) return;
      if (!this.isCurrentRun(input.runId, input.turnId)) {
        return;
      }
      if (error instanceof Error && error.message === "CANCELLED") {
        this.cancel(input.turnId);
        return;
      }
      if (error instanceof Error && error.message === "MODEL_STATUS_TIMEOUT") {
        this.failTurn(input, "provider_timeout", "The operation timed out.", false);
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
      // Completion wins before persistence starts. A later cancel must not report
      // success while a canonical message is already being committed.
      if (this.active) this.active.finalizing = true;
      await this.durability;
      const message = await this.options.persistFinalMessage(
        finalText,
        input.conversationId,
        this.finalMessageId,
      );
      if (!this.isCurrentRun(input.runId, input.turnId)) {
        return;
      }
      await this.requireEvent({
        type: "turn.completed",
        payload: {
          finalAnswer: AssistantFinalAnswerSchema.parse({
            turnId: input.turnId,
            text: finalText,
            messageId: message.id,
            completedAt: this.options.now().toISOString(),
            usedToolIterations: this.projection?.toolIterationCount ?? 0,
            rawProviderResponsePersisted: false,
            providerRawPayloadExposed: false,
          }),
        },
        correlationId: input.correlationId,
        flush: "immediate",
      });
    } catch {
      if (this.options.repository) {
        // A canonical Message may already be durable. Leave the journal open for
        // startup reconciliation instead of falsely committing a failed terminal.
        this.stopForStorageFailure();
        return;
      }
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

  private async waitForTool(work: Promise<ToolResult>, controller: AbortController, timeoutMs: number): Promise<ToolResult> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abort: () => void = () => undefined;
    const limit = new Promise<never>((_resolve, reject) => {
      abort = () => reject(new Error("CANCELLED"));
      if (controller.signal.aborted) { abort(); return; }
      controller.signal.addEventListener("abort", abort, { once: true });
      timer = setTimeout(() => { reject(new Error("MODEL_STATUS_TIMEOUT")); controller.abort(); }, timeoutMs);
    });
    try { return await Promise.race([work, limit]); }
    finally {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", abort);
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
    this.active?.controller.abort();
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
    this.queueJournal(event);
    this.projection = reduced.projection;
    if (input.flush === "immediate") {
      this.flush(input.correlationId);
    } else {
      this.scheduleFlush(input.correlationId);
    }
    return { ok: true, projection: reduced.projection };
  }

  private async requireEvent(input: Parameters<AssistantRuntime["applyEvent"]>[0]): Promise<void> {
    if (!this.applyEvent(input).ok) throw new Error("ASSISTANT_EVENT_REJECTED");
    await this.durability;
  }

  private queueJournal(event: AssistantEvent): void {
    const repository = this.options.repository;
    if (!repository) return;
    let data: unknown;
    switch (event.type) {
      case "turn.accepted": data = { conversationId: this.projection!.conversationId,
        correlationId: this.active!.correlationId, finalMessageId: this.finalMessageId }; break;
      case "tool.proposed": data = { proposalId: event.payload.proposal.proposalId, toolId: event.payload.proposal.toolId }; break;
      case "tool.decided": {
        const { proposalId, taskId, decision, approvalRequestId } = event.payload.decision;
        data = { proposalId, taskId, decision, approvalRequestId }; break;
      }
      case "approval.resolved": {
        const { proposalId, approvalRequestId, resolution } = event.payload.approval;
        data = { proposalId, approvalRequestId, resolution }; break;
      }
      case "execution.started": {
        const { proposalId, executionId, taskId } = event.payload.request;
        data = { proposalId, executionId, taskId }; break;
      }
      case "tool.resulted": {
        const { proposalId, executionId, taskId, status, toolId, structuredResult } = event.payload.result;
        data = { proposalId, executionId, taskId, status, verification: toolId !== "localApp.open" ? "not_applicable" :
          status === "completed" && structuredResult?.verified === true ? "verified" : "not_verified" }; break;
      }
      case "turn.completed": data = { messageId: event.payload.finalAnswer.messageId }; break;
      case "turn.cancelled": case "turn.failed": case "provider.continued": data = {}; break;
      default: return; // In particular, never persist input/deltas/provider envelopes.
    }
    const raw = { schemaVersion: 1, turnId: event.turnId, sequence: this.durableSequence++,
      occurredAt: event.occurredAt, type: event.type, data };
    this.durability = this.durability.then(async () => {
      const safe: AssistantJournalEvent = AssistantJournalEventSchema.parse(raw);
      await repository.append(safe);
    });
    void this.durability.catch(() => this.stopForStorageFailure());
  }

  private stopForStorageFailure(): void {
    this.persistenceUnavailable = true;
    this.active?.controller.abort();
    this.active = undefined;
    if (this.projection) {
      this.projection = AssistantTurnProjectionSchema.parse({ ...this.projection, status: "interrupted", streamText: "",
        failure: undefined, finalAnswer: undefined });
      this.flush("assistant-storage-unavailable");
    }
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
