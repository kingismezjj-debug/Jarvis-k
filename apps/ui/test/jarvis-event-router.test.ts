import type { CoreSnapshot, EventEnvelope } from "@jarvis-k/contracts";
import { describe, expect, it, vi } from "vitest";
import {
  prependBoundedEvent,
  routeJarvisEvent,
} from "../src/hooks/jarvis-event-router";

function eventEnvelope(event: EventEnvelope["event"]): EventEnvelope {
  return {
    id: `event-${event.type}`,
    createdAt: "2026-08-15T00:00:00.000Z",
    event,
  } as EventEnvelope;
}

function snapshot(
  transcript?: NonNullable<CoreSnapshot["voice"]["transcript"]>,
): CoreSnapshot {
  return {
    conversations: [],
    activeConversationId: null,
    messages: [],
    tasks: [],
    providers: [],
    capabilities: [],
    memoryHealthStatus: "unknown",
    memoryAlpha: null,
    runtime: {
      health: "ready",
      mode: "standard",
      acceleratedBackends: [],
      gpuCount: 0,
      voiceEngine: "idle",
      microphonePermission: "unknown",
      voiceFrames: 0,
      voiceRms: 0,
      voicePeak: 0,
      transport: "ipc",
      sequenceId: 1,
    },
    voice: {
      state: "idle",
      transcript,
    },
    textOnlyAcceptance: {
      enabled: false,
    },
  } as CoreSnapshot;
}

describe("jarvis event router", () => {
  it("keeps a bounded newest-first event list without mutating input", () => {
    const original = Array.from({ length: 3 }, (_, index) =>
      eventEnvelope({
        type: "system.core.lifecycle",
        payload: { status: "online", sequenceId: index },
      }),
    );
    const nextEvent = eventEnvelope({
      type: "system.core.lifecycle",
      payload: { status: "failed", sequenceId: 9 },
    });

    const result = prependBoundedEvent(original, nextEvent, 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(nextEvent);
    expect(original).toHaveLength(3);
    expect(original[0]?.event.payload.sequenceId).toBe(0);
  });

  it("routes snapshot before final voice transcript exactly once", () => {
    const calls: string[] = [];
    const transcript = {
      sessionId: "voice-session",
      segmentId: "segment-1",
      text: "open notepad",
      isFinal: true,
      confidence: 0.9,
    };
    const handlers = {
      appendEvent: vi.fn(() => calls.push("append")),
      applySnapshot: vi.fn(() => calls.push("snapshot")),
      applyModelOperation: vi.fn(() => calls.push("model")),
      applyFinalVoiceTranscript: vi.fn(() => calls.push("voice")),
      applyLifecycleStatus: vi.fn(() => calls.push("lifecycle")),
    };

    routeJarvisEvent(
      eventEnvelope({
        type: "state.snapshot",
        payload: snapshot(transcript),
      }),
      handlers,
    );

    expect(calls).toEqual(["append", "snapshot", "voice"]);
    expect(handlers.applyFinalVoiceTranscript).toHaveBeenCalledTimes(1);
    expect(handlers.applyLifecycleStatus).not.toHaveBeenCalled();
  });

  it("routes known event domains and ignores unknown events after appending", () => {
    const handlers = {
      appendEvent: vi.fn(),
      applySnapshot: vi.fn(),
      applyModelOperation: vi.fn(),
      applyFinalVoiceTranscript: vi.fn(),
      applyLifecycleStatus: vi.fn(),
    };

    routeJarvisEvent(
      eventEnvelope({
        type: "model.operation.updated",
        payload: { operationId: "op-1" },
      } as EventEnvelope["event"]),
      handlers,
    );
    routeJarvisEvent(
      eventEnvelope({
        type: "system.core.lifecycle",
        payload: { status: "restarting", sequenceId: 2 },
      }),
      handlers,
    );
    routeJarvisEvent(
      eventEnvelope({
        type: "voice.transcript.updated",
        payload: {
          sessionId: "voice-session",
          segmentId: "segment-2",
          text: "hello",
          isFinal: true,
        },
      }),
      handlers,
    );
    routeJarvisEvent(
      eventEnvelope({
        type: "unknown.event",
        payload: {},
      } as EventEnvelope["event"]),
      handlers,
    );

    expect(handlers.appendEvent).toHaveBeenCalledTimes(4);
    expect(handlers.applyModelOperation).toHaveBeenCalledTimes(1);
    expect(handlers.applyLifecycleStatus).toHaveBeenCalledWith("restarting");
    expect(handlers.applyFinalVoiceTranscript).toHaveBeenCalledTimes(1);
    expect(handlers.applySnapshot).not.toHaveBeenCalled();
  });
});
