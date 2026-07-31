import { describe, expect, it } from "vitest";
import {
  type Message,
  type EventEnvelope,
  type VoiceEvent,
  type VoiceMode,
  type VoicePermissionState,
  type VoiceSnapshot,
  createCommandEnvelope
} from "@jarvis-k/contracts";
import type {
  MemoryRepository,
  MemorySnapshot,
  MessageListOptions
} from "@jarvis-k/memory";
import type {
  VoiceActionResult,
  VoiceEnginePort
} from "@jarvis-k/voice";
import { CoreRuntime } from "../src/runtime";

class FakeVoiceEngine implements VoiceEnginePort {
  private eventSink: ((event: VoiceEvent) => void) | undefined;
  private snapshot: VoiceSnapshot = {
    state: "idle",
    mode: "disabled",
    permission: "unknown"
  };

  public getSnapshot(): VoiceSnapshot {
    return { ...this.snapshot };
  }

  public async setMode(mode: VoiceMode): Promise<VoiceActionResult> {
    this.snapshot = {
      ...this.snapshot,
      mode,
      state: mode === "disabled" ? "idle" : "ready"
    };
    this.emitState();
    return this.success();
  }

  public startPtt(_captureId?: string): VoiceActionResult {
    if (this.snapshot.mode !== "ptt") {
      return this.failure("VOICE_MODE_INVALID");
    }
    this.snapshot = {
      ...this.snapshot,
      state: "recording"
    };
    this.emitState();
    return this.success();
  }

  public async acceptAudioFrame(): Promise<{ accepted: true }> {
    return { accepted: true };
  }

  public async stopPtt(): Promise<VoiceActionResult> {
    this.snapshot = {
      ...this.snapshot,
      state: "finalizing"
    };
    this.emitState();
    return this.success();
  }

  public async cancel(): Promise<VoiceActionResult> {
    this.snapshot = {
      ...this.snapshot,
      state: "ready"
    };
    this.emitState();
    return this.success();
  }

  public suspendForTts(): VoiceActionResult {
    this.snapshot = {
      ...this.snapshot,
      state: "speaking"
    };
    this.emitState();
    return this.success();
  }

  public async resumeAfterTts(): Promise<VoiceActionResult> {
    this.snapshot = {
      ...this.snapshot,
      state: "ready"
    };
    this.emitState();
    return this.success();
  }

  public reportPermission(
    permission: VoicePermissionState
  ): VoiceActionResult {
    this.snapshot = {
      ...this.snapshot,
      permission
    };
    return this.success();
  }

  public setEventSink(eventSink: (event: VoiceEvent) => void): void {
    this.eventSink = eventSink;
  }

  public applyEvent(event: VoiceEvent): void {
    if (event.type === "voice.transcript.updated") {
      this.snapshot = {
        ...this.snapshot,
        transcript: event.payload
      };
    }
  }

  private success(): VoiceActionResult {
    return {
      ok: true,
      snapshot: this.getSnapshot()
    };
  }

  private emitState(): void {
    this.eventSink?.({
      type: "voice.state.changed",
      payload: {
        state: this.snapshot.state,
        mode: this.snapshot.mode
      }
    });
  }

  private failure(code: string): VoiceActionResult {
    return {
      ok: false,
      error: {
        code,
        message: code,
        retryable: false
      },
      snapshot: this.getSnapshot()
    };
  }
}

class FakeMemoryRepository implements MemoryRepository {
  public initialized = false;
  public readonly messages: Message[];

  public constructor(seed: Message[] = []) {
    this.messages = seed.map((message) => ({ ...message }));
  }

  public async initialize(): Promise<void> {
    this.initialized = true;
  }

  public async appendMessage(message: Message): Promise<Message> {
    this.messages.push({ ...message });
    return { ...message };
  }

  public async listMessages(
    options: MessageListOptions = {}
  ): Promise<Message[]> {
    return this.messages
      .filter((message) =>
        options.conversationId
          ? message.conversationId === options.conversationId
          : true
      )
      .slice(0, options.limit)
      .map((message) => ({ ...message }));
  }

  public async getSnapshot(): Promise<MemorySnapshot> {
    return {
      messages: await this.listMessages()
    };
  }

  public async restoreSnapshot(snapshot: MemorySnapshot): Promise<void> {
    this.messages.splice(
      0,
      this.messages.length,
      ...snapshot.messages.map((message) => ({ ...message }))
    );
  }

  public async close(): Promise<void> {
    return;
  }
}

function createRuntime(memoryRepository?: MemoryRepository) {
  const events: EventEnvelope[] = [];
  const voiceEngine = new FakeVoiceEngine();
  const runtime = new CoreRuntime(
    (event) => events.push(event),
    voiceEngine,
    undefined,
    memoryRepository
  );
  voiceEngine.setEventSink((event) => runtime.handleVoiceEvent(event));
  return { events, runtime, voiceEngine };
}

describe("CoreRuntime", () => {
  it("accepts a typed message command and publishes a recoverable snapshot", async () => {
    const { events, runtime } = createRuntime();

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.sendMessage",
        payload: {
          conversationId: "primary",
          text: "Run phase two"
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(runtime.getSnapshot().messages).toHaveLength(1);
    expect(
      events.some((event) => event.event.type === "state.snapshot")
    ).toBe(true);
  });

  it("hydrates and persists messages through an injected memory repository", async () => {
    const memoryRepository = new FakeMemoryRepository([
      {
        id: "msg-seed",
        conversationId: "primary",
        role: "system",
        text: "Recovered from disk",
        createdAt: "2026-07-30T00:00:00.000Z"
      }
    ]);
    const { runtime } = createRuntime(memoryRepository);

    await runtime.hydrateMemory();

    expect(runtime.getSnapshot().messages.map((message) => message.id))
      .toEqual(["msg-seed"]);

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.sendMessage",
        payload: {
          conversationId: "primary",
          text: "Persist me"
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(memoryRepository.messages).toHaveLength(2);
    expect(runtime.getSnapshot().messages).toHaveLength(2);
  });

  it("delegates voice commands to the injected engine", async () => {
    const { runtime } = createRuntime();

    const invalidStart = await runtime.handle(
      createCommandEnvelope({
        type: "voice.startPtt",
        payload: {}
      })
    );
    expect(invalidStart.ok).toBe(false);

    await runtime.handle(
      createCommandEnvelope({
        type: "voice.setMode",
        payload: { mode: "ptt" }
      })
    );
    const start = await runtime.handle(
      createCommandEnvelope({
        type: "voice.startPtt",
        payload: {}
      })
    );

    expect(start.ok).toBe(true);
    expect(runtime.getSnapshot().voice.state).toBe("recording");
  });

  it("maps Voice Engine events into correlated Core envelopes", async () => {
    const { events, runtime, voiceEngine } = createRuntime();
    const transcriptEvent: VoiceEvent = {
      type: "voice.transcript.updated",
      payload: {
        sessionId: "voice-1",
        text: "Core mapped transcript",
        isFinal: true,
        updatedAt: "2026-07-29T00:00:00.000Z"
      }
    };
    voiceEngine.applyEvent(transcriptEvent);
    runtime.handleVoiceEvent(transcriptEvent);

    expect(events.at(-2)?.event.type).toBe("voice.transcript.updated");
    expect(events.at(-1)?.event.type).toBe("state.snapshot");
    expect(runtime.getSnapshot().voice.transcript?.isFinal).toBe(true);
  });

  it("correlates events emitted during a voice command", async () => {
    const { events, runtime } = createRuntime();
    await runtime.handle(
      createCommandEnvelope({
        type: "voice.setMode",
        payload: { mode: "ptt" }
      })
    );
    events.length = 0;
    const command = createCommandEnvelope({
      type: "voice.startPtt",
      payload: {}
    });

    await runtime.handle(command);

    const voiceEvent = events.find(
      (event) => event.event.type === "voice.state.changed"
    );
    expect(voiceEvent?.correlationId).toBe(command.correlationId);
    expect(
      events
        .filter((event) => event.event.type === "state.snapshot")
        .every((event) => event.correlationId === command.correlationId)
    ).toBe(true);
  });
});
