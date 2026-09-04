import { describe, expect, it } from "vitest";
import {
  AssistantTurnIdSchema,
  ChatAnswerPreferenceProjectionSchema,
  type AssistantModelAdapterEvent,
  type ChatAnswerRequest,
  type Message,
} from "@jarvis-k/contracts";
import {
  AssistantRuntime,
  type AssistantTextModelAdapter,
} from "../src/assistant-runtime";

const fixedNow = new Date("2026-09-04T00:00:00.000Z");
const preferenceProjection = ChatAnswerPreferenceProjectionSchema.parse({
  status: "none",
  appliesTo: "chat.answer",
  source: "none",
  rawContentExposed: false,
  vectorRetrievalUsed: false,
  providerNeutral: true,
});

describe("assistant runtime streaming loop", () => {
  it("projects multi-delta streaming and persists one canonical final message", async () => {
    const harness = createHarness([
      delta("Hello "),
      delta("世界"),
      final("Hello 世界"),
      final("ignored duplicate"),
    ]);

    const started = harness.start();
    expect(started.ok).toBe(true);
    await harness.waitForStatus("completed");

    expect(harness.persistedMessages).toHaveLength(1);
    expect(harness.persistedMessages[0]?.text).toBe("Hello世界");
    expect(harness.lastProjection()?.status).toBe("completed");
    expect(harness.lastProjection()?.streamText).toBe("Hello世界");
    expect(harness.lastProjection()?.finalAnswer?.text).toBe("Hello世界");
  });

  it("flushes the first text projection immediately and batches later deltas", async () => {
    const deferred = createDeferred<void>();
    const harness = createHarness([
      delta("A"),
      async () => {
        await deferred.promise;
        return delta("B");
      },
      delta("C"),
      final("ABC"),
    ]);

    const started = harness.start();
    expect(started.ok).toBe(true);
    await harness.waitForText("A");

    const publishCountAfterFirstToken = harness.projections.length;
    deferred.resolve();
    await harness.waitForStatus("completed");

    expect(publishCountAfterFirstToken).toBeGreaterThanOrEqual(2);
    expect(harness.scheduler.pendingCount()).toBeLessThanOrEqual(1);
    expect(harness.lastProjection()?.streamText).toBe("ABC");
  });

  it("ignores empty deltas and accepts a no-delta final replacement", async () => {
    const harness = createHarness([
      { type: "delta", delta: { kind: "status", message: "thinking" } },
      { type: "final", text: "Final without prior delta." },
    ]);

    const started = harness.start();
    expect(started.ok).toBe(true);
    await harness.waitForStatus("completed");

    expect(harness.persistedMessages).toHaveLength(1);
    expect(harness.persistedMessages[0]?.text).toBe("Final without prior delta.");
    expect(harness.lastProjection()?.streamText).toBe("");
  });

  it("cancels before the first token and ignores stale provider output", async () => {
    const release = createDeferred<void>();
    const harness = createHarness([
      async () => {
        await release.promise;
        return delta("stale");
      },
      final("stale"),
    ]);

    const started = harness.start();
    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error("expected started turn");

    const cancelled = harness.runtime.cancel(started.turnId);
    release.resolve();
    await harness.waitForStatus("cancelled");

    expect(cancelled.ok).toBe(true);
    expect(harness.adapter.signal?.aborted).toBe(true);
    expect(harness.persistedMessages).toHaveLength(0);
    expect(harness.lastProjection()?.streamText).toBe("");
  });

  it("cancels mid-stream, rejects wrong-turn cancellation, and ignores stale final", async () => {
    const release = createDeferred<void>();
    const harness = createHarness([
      delta("partial"),
      async () => {
        await release.promise;
        return delta(" stale");
      },
      final("partial stale"),
    ]);

    const started = harness.start();
    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error("expected started turn");
    await harness.waitForText("partial");

    const staleTurnId = AssistantTurnIdSchema.parse("turn-stale");
    expect(harness.runtime.cancel(staleTurnId)).toMatchObject({
      ok: false,
      code: "ASSISTANT_TURN_ID_STALE",
    });
    expect(harness.runtime.cancel(started.turnId)).toMatchObject({ ok: true });
    release.resolve();
    await harness.waitForStatus("cancelled");

    expect(harness.persistedMessages).toHaveLength(0);
    expect(harness.lastProjection()?.streamText).toBe("partial");
  });

  it("normalizes malformed, timeout, disconnect, and unsupported tool-call failures", async () => {
    await expectFailure([{ type: "failure", reason: "malformed_response", safeMessage: "bad stream", retryable: true }], "MALFORMED_RESPONSE");
    await expectFailure([{ type: "failure", reason: "provider_timeout", safeMessage: "timed out", retryable: true }], "PROVIDER_TIMEOUT");
    await expectFailure([{ type: "failure", reason: "streaming_not_supported", safeMessage: "streaming unsupported", retryable: true }], "STREAMING_NOT_SUPPORTED");
    await expectFailure([delta("partial")], "MALFORMED_RESPONSE");
    await expectFailure([{ type: "failure", reason: "unsupported_tool_call", safeMessage: "tool calls unsupported", retryable: false }], "UNSUPPORTED_TOOL_CALL");
  });

  it("rejects concurrent turns while one turn is active", () => {
    const harness = createHarness([
      async () => {
        await new Promise(() => undefined);
        return final("never");
      },
    ]);

    const first = harness.start();
    const second = harness.start();

    expect(first.ok).toBe(true);
    expect(second).toMatchObject({
      ok: false,
      code: "ASSISTANT_TURN_ALREADY_ACTIVE",
    });
  });

  it("does not expose credentials or raw provider payloads in projections", async () => {
    const harness = createHarness([delta("safe answer"), final("safe answer")]);

    const started = harness.start();
    expect(started.ok).toBe(true);
    await harness.waitForStatus("completed");

    const serialized = JSON.stringify(harness.projections);
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("apiKey");
    expect(serialized).not.toContain("Bearer");
    expect(harness.lastProjection()?.finalAnswer).toMatchObject({
      rawProviderResponsePersisted: false,
      providerRawPayloadExposed: false,
    });
  });
});

async function expectFailure(
  events: AssistantModelAdapterEvent[],
  reasonCode: string,
): Promise<void> {
  const harness = createHarness(events);
  expect(harness.start().ok).toBe(true);
  await harness.waitForStatus("failed");
  expect(harness.lastProjection()?.failure?.reasonCode).toBe(reasonCode);
  expect(harness.persistedMessages).toHaveLength(0);
}

function createHarness(
  events: Array<
    AssistantModelAdapterEvent | (() => Promise<AssistantModelAdapterEvent>)
  >,
) {
  const adapter = new FakeStreamingAdapter(events);
  const scheduler = new FakeScheduler();
  const projections: ReturnType<AssistantRuntime["getProjection"]>[] = [];
  const persistedMessages: Message[] = [];
  let idCounter = 0;
  const runtime = new AssistantRuntime({
    getProviderId: () => "chat-answer.openai-compatible.deepseek",
    getModelAdapter: () => adapter,
    persistFinalMessage: async (text, conversationId) => {
      const message: Message = {
        id: `msg-${idCounter}`,
        conversationId,
        role: "assistant",
        text,
        createdAt: fixedNow.toISOString(),
      };
      persistedMessages.push(message);
      return message;
    },
    publishProjection: (projection) => {
      projections.push(projection);
    },
    createId: (prefix) => {
      idCounter += 1;
      return `${prefix}-${idCounter}`;
    },
    now: () => fixedNow,
    scheduler,
  });

  const start = () =>
    runtime.startTextTurn({
      assistantInput: {
        kind: "text",
        text: "Say hello.",
        source: "user",
        conversationId: "primary",
      },
      source: "text",
      text: "Say hello.",
      decision: {
        intent: "chat.answer",
        confidence: 0.99,
        requiresApproval: false,
        slots: {},
        reason: "test",
      },
      conversationId: "primary",
      correlationId: "corr-test",
      preferenceProjection,
    });

  return {
    adapter,
    persistedMessages,
    projections,
    runtime,
    scheduler,
    start,
    lastProjection: () => projections.at(-1),
    waitForStatus: (status: string) =>
      waitFor(() => projections.at(-1)?.status === status, scheduler),
    waitForText: (text: string) =>
      waitFor(() => projections.at(-1)?.streamText === text, scheduler),
  };
}

class FakeStreamingAdapter implements AssistantTextModelAdapter {
  public signal: AbortSignal | undefined;

  public constructor(
    private readonly events: Array<
      AssistantModelAdapterEvent | (() => Promise<AssistantModelAdapterEvent>)
    >,
  ) {}

  public async *startTextTurn(
    _request: ChatAnswerRequest,
    _context: Record<string, never>,
    signal: AbortSignal,
  ): AsyncIterable<AssistantModelAdapterEvent> {
    this.signal = signal;
    for (const event of this.events) {
      const resolved = typeof event === "function" ? await event() : event;
      yield resolved;
    }
  }
}

class FakeScheduler {
  private pending: Array<() => void> = [];

  public setTimeout(callback: () => void): unknown {
    this.pending.push(callback);
    return callback;
  }

  public clearTimeout(handle: unknown): void {
    this.pending = this.pending.filter((callback) => callback !== handle);
  }

  public flushOne(): void {
    const callback = this.pending.shift();
    callback?.();
  }

  public pendingCount(): number {
    return this.pending.length;
  }
}

function delta(text: string): AssistantModelAdapterEvent {
  return { type: "delta", delta: { kind: "text", text } };
}

function final(text: string): AssistantModelAdapterEvent {
  return { type: "final", text };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function waitFor(
  predicate: () => boolean,
  scheduler: FakeScheduler,
): Promise<void> {
  for (let index = 0; index < 50; index += 1) {
    if (predicate()) {
      return;
    }
    scheduler.flushOne();
    await Promise.resolve();
  }
  throw new Error("Timed out waiting for assistant runtime condition.");
}
