import type { EventEnvelope, TaskState } from "@jarvis-k/contracts";

export const activeModelOperationPhases = new Set([
  "queued",
  "prechecking",
  "downloading",
  "verifying",
  "loading",
  "executing",
  "releasing",
  "removing",
]);

export function eventLabel(envelope: EventEnvelope) {
  const event = envelope.event;
  switch (event.type) {
    case "system.core.ready":
      return `Core instance ${event.payload.coreInstanceId.slice(-8)}`;
    case "system.health":
      return `Health ${event.payload.status} / ${Math.round(event.payload.uptimeMs)} ms`;
    case "system.core.lifecycle":
      return `Supervisor ${event.payload.status}`;
    case "state.snapshot":
      return `Snapshot synchronized / ${event.payload.sequenceId}`;
    case "model.operation.updated":
      return `Model ${event.payload.phase} / ${event.payload.modelId}`;
    case "agent.message.accepted":
      return `Message accepted / ${event.payload.id.slice(-8)}`;
    case "voice.state.changed":
      return `Voice ${event.payload.mode} / ${event.payload.state}`;
    case "voice.transcript.updated":
      return `${event.payload.isFinal ? "Final" : "Partial"} transcript / ${
        event.payload.text || "empty"
      }`;
    case "voice.permission.changed":
      return `Microphone permission ${event.payload.permission}`;
    case "voice.playback.interrupted":
      return `Playback interrupted / ${event.payload.reason}`;
    case "voice.diagnostic":
      return `Voice diagnostic / ${event.payload.code}`;
    case "voice.error":
      return `Voice error / ${event.payload.error.message}`;
  }
}

export function formatEventTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function isTaskCancellationEligible(state: TaskState): boolean {
  return (
    state === "queued" ||
    state === "planning" ||
    state === "awaiting_confirmation"
  );
}

export function isTaskApprovalEligible(state: TaskState): boolean {
  return state === "awaiting_confirmation";
}

export function formatGib(value: number | undefined) {
  if (value === undefined) return "unknown";
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GiB`;
}

export function formatActionError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return message.replace(/\s+/gu, " ").trim().slice(0, 120);
}

export function formatPttCommandError(error: {
  code: string;
  details?: unknown;
  message: string;
}) {
  const providerCode =
    typeof error.details === "object" &&
    error.details !== null &&
    "providerCode" in error.details &&
    typeof (error.details as { providerCode?: unknown }).providerCode ===
      "string"
      ? ` / provider ${String((error.details as { providerCode: string }).providerCode)}`
      : "";
  const providerMessage =
    typeof error.details === "object" &&
    error.details !== null &&
    "providerMessage" in error.details &&
    typeof (error.details as { providerMessage?: unknown }).providerMessage ===
      "string"
      ? ` / ${String((error.details as { providerMessage: string }).providerMessage)}`
      : "";
  return `${error.code}${providerCode}: ${error.message}${providerMessage}`;
}

export function isSecondaryVoiceStopError(
  error: { code: string; message: string } | null,
) {
  return (
    error?.code === "VOICE_STATE_INVALID" &&
    error.message.includes("state is error")
  );
}

export function commandRouterAllowedRealLocalAppTarget(
  target: string,
): "notepad" | "calculator" | null {
  const normalized = target.trim().replace(/\s+/gu, " ").toLowerCase();
  if (normalized === "notepad") {
    return "notepad";
  }
  if (normalized === "calculator" || normalized === "calc") {
    return "calculator";
  }
  return null;
}

export function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatVoiceCorrectionSlots(slots: Record<string, unknown>) {
  const parts = Object.entries(slots)
    .filter(([, value]) => value !== undefined && value !== null)
    .slice(0, 3)
    .map(([key, value]) => `${key}=${formatVoiceCorrectionSlotValue(value)}`);
  return parts.length > 0 ? parts.join(", ") : "no slots";
}

export function formatVoiceCorrectionSlotValue(value: unknown) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `${value.length} items`;
  }
  if (typeof value === "object" && value !== null) {
    return "object";
  }
  return "unknown";
}
