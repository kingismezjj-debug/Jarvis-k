import type { CoreSnapshot, EventEnvelope } from "@jarvis-k/contracts";

export const MAX_JARVIS_EVENTS = 40;

export interface JarvisEventRouterHandlers {
  appendEvent(envelope: EventEnvelope): void;
  applySnapshot(snapshot: CoreSnapshot): void;
  applyModelOperation(payload: unknown): void;
  applyFinalVoiceTranscript(
    transcript: NonNullable<CoreSnapshot["voice"]["transcript"]>,
  ): void;
  applyLifecycleStatus(status: "online" | "starting" | "restarting" | "stopped" | "failed"): void;
}

export function prependBoundedEvent(
  current: readonly EventEnvelope[],
  envelope: EventEnvelope,
  maxEvents = MAX_JARVIS_EVENTS,
): EventEnvelope[] {
  return [envelope, ...current].slice(0, maxEvents);
}

export function routeJarvisEvent(
  envelope: EventEnvelope,
  handlers: JarvisEventRouterHandlers,
): void {
  handlers.appendEvent(envelope);

  if (envelope.event.type === "state.snapshot") {
    handlers.applySnapshot(envelope.event.payload);
    if (envelope.event.payload.voice.transcript) {
      handlers.applyFinalVoiceTranscript(envelope.event.payload.voice.transcript);
    }
    return;
  }

  if (envelope.event.type === "model.operation.updated") {
    handlers.applyModelOperation(envelope.event.payload);
    return;
  }

  if (envelope.event.type === "voice.transcript.updated") {
    handlers.applyFinalVoiceTranscript(envelope.event.payload);
    return;
  }

  if (envelope.event.type === "system.core.lifecycle") {
    handlers.applyLifecycleStatus(envelope.event.payload.status);
  }
}
