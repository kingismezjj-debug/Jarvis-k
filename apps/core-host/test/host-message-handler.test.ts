import { describe, expect, it, vi } from "vitest";
import type {
  CommandEnvelope,
  CommandResult,
  CoreOutboundMessage,
} from "@jarvis-k/contracts";
import {
  CoreHostMessageHandler,
  type CoreHostMessageSource,
} from "../src/host/host-message-handler";

describe("CoreHostMessageHandler", () => {
  it("registers only one listener on duplicate start", () => {
    const harness = createHarness();

    harness.handler.start();
    harness.handler.start();

    expect(harness.source.listenerCount()).toBe(1);
  });

  it("routes configuration messages through the runtime configuration controller", async () => {
    const harness = createHarness();
    harness.handler.handleRawMessage({
      kind: "command-router-product-mode.configure",
      providerId: "intent-router.deterministic.rules",
      mode: "production_rules",
      enabled: true,
      directActionEnabled: false,
      realQwenRuntimeEnabled: false,
      networkAccessApproved: false,
    });
    await harness.handler.waitForIdle();

    expect(
      harness.runtimeConfigurationController.applyMessage,
    ).toHaveBeenCalledWith({
      kind: "command-router-product-mode.configure",
      configuration: { enabled: true },
    });
    expect(harness.runtime.handle).not.toHaveBeenCalled();
  });

  it("sends command results for ordinary core inbound messages", async () => {
    const harness = createHarness();
    harness.handler.handleRawMessage({
      kind: "command",
      envelope: createCommandEnvelope("cmd-1"),
    });
    await harness.handler.waitForIdle();

    expect(harness.runtime.handle).toHaveBeenCalledWith(
      createCommandEnvelope("cmd-1"),
    );
    expect(harness.sent).toEqual([
      {
        kind: "result",
        envelope: createResult("cmd-1"),
      },
    ]);
  });

  it("forwards voice audio frames without invoking command runtime", async () => {
    const harness = createHarness();
    const frame = {
      metadata: {
        captureId: "capture-1",
        sequenceId: 0,
        capturedAt: "2026-08-15T00:00:00.000Z",
        sampleRate: 16_000,
        channels: 1,
        encoding: "pcm_s16le",
        byteLength: 2,
      },
      pcm: new Uint8Array([0, 0]),
    } as const;

    harness.handler.handleRawMessage({
      kind: "voice-audio",
      frame,
    });
    await harness.handler.waitForIdle();

    expect(harness.voiceEngine.acceptAudioFrame).toHaveBeenCalledWith(frame);
    expect(harness.runtime.handle).not.toHaveBeenCalled();
  });

  it("processes messages in queue order", async () => {
    const harness = createHarness();
    const deferred = createDeferred<CommandResult>();
    const order: string[] = [];
    harness.runtime.handle.mockImplementationOnce(async () => {
      order.push("first-start");
      return deferred.promise;
    });
    harness.runtime.handle.mockImplementationOnce(async (envelope) => {
      order.push("second-start");
      return createResult(envelope.commandId);
    });

    harness.handler.handleRawMessage({
      kind: "command",
      envelope: createCommandEnvelope("cmd-1"),
    });
    harness.handler.handleRawMessage({
      kind: "command",
      envelope: createCommandEnvelope("cmd-2"),
    });
    await Promise.resolve();

    expect(order).toEqual(["first-start"]);
    deferred.resolve(createResult("cmd-1"));
    await harness.handler.waitForIdle();

    expect(order).toEqual(["first-start", "second-start"]);
    expect(harness.sent.map((message) => message.envelope.commandId)).toEqual([
      "cmd-1",
      "cmd-2",
    ]);
  });

  it("does not block later messages after a handler failure", async () => {
    const harness = createHarness();
    harness.runtime.handle.mockRejectedValueOnce(
      new Error("secret-runtime-failure"),
    );
    harness.handler.handleRawMessage({
      kind: "command",
      envelope: createCommandEnvelope("cmd-1"),
    });
    harness.handler.handleRawMessage({
      kind: "command",
      envelope: createCommandEnvelope("cmd-2"),
    });
    await harness.handler.waitForIdle();

    expect(harness.sent).toEqual([
      {
        kind: "result",
        envelope: createResult("cmd-2"),
      },
    ]);
    expect(JSON.stringify(harness.loggedErrors)).not.toContain(
      "secret-runtime-failure",
    );
  });

  it("rejects malformed and shutdown-like messages without runtime execution", async () => {
    const harness = createHarness();
    harness.handler.handleRawMessage({ kind: "shutdown" });
    harness.handler.handleRawMessage({ kind: "command", envelope: {} });
    await harness.handler.waitForIdle();

    expect(harness.runtime.handle).not.toHaveBeenCalled();
    expect(harness.sent).toEqual([]);
    expect(harness.loggedErrors).toEqual([
      ["[core-host] Rejected invalid supervisor message."],
      ["[core-host] Rejected invalid supervisor message."],
    ]);
  });

  it("does not process new source messages after dispose", async () => {
    const harness = createHarness();
    harness.handler.start();
    await harness.handler.dispose();

    harness.source.emit({
      kind: "command",
      envelope: createCommandEnvelope("cmd-1"),
    });
    await harness.handler.waitForIdle();

    expect(harness.runtime.handle).not.toHaveBeenCalled();
    expect(harness.sent).toEqual([]);
    expect(
      harness.runtimeConfigurationController.dispose,
    ).toHaveBeenCalledTimes(1);
    expect(harness.source.listenerCount()).toBe(0);
  });
});

function createHarness() {
  const source = new FakeMessageSource();
  const sent: CoreOutboundMessage[] = [];
  const loggedErrors: unknown[][] = [];
  const runtime = {
    handle: vi.fn(async (envelope: CommandEnvelope) =>
      createResult(envelope.commandId),
    ),
  };
  const voiceEngine = {
    acceptAudioFrame: vi.fn(async () => undefined),
  };
  const runtimeConfigurationController = {
    applyMessage: vi.fn(async () => true),
    dispose: vi.fn(),
  };
  const handler = new CoreHostMessageHandler({
    runtime,
    voiceEngine,
    runtimeConfigurationController,
    messageSource: source,
    send: (message) => {
      sent.push(message);
    },
    logger: {
      error: (...args: unknown[]) => {
        loggedErrors.push(args);
      },
    },
  });
  return {
    source,
    sent,
    loggedErrors,
    runtime,
    voiceEngine,
    runtimeConfigurationController,
    handler,
  };
}

function createCommandEnvelope(commandId: string): CommandEnvelope {
  return {
    protocolVersion: 1,
    commandId,
    correlationId: `corr-${commandId}`,
    createdAt: "2026-08-15T00:00:00.000Z",
    command: {
      type: "agent.runBrainCommand",
      payload: {
        source: "text",
        text: "open notepad",
      },
    },
  };
}

function createResult(commandId: string): CommandResult {
  return {
    protocolVersion: 1,
    commandId,
    correlationId: `corr-${commandId}`,
    completedAt: "2026-08-15T00:00:00.000Z",
    ok: true,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

class FakeMessageSource implements CoreHostMessageSource {
  private listeners = new Set<(message: unknown) => void>();

  public onMessage(listener: (message: unknown) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit(message: unknown): void {
    for (const listener of this.listeners) {
      listener(message);
    }
  }

  public listenerCount(): number {
    return this.listeners.size;
  }
}
