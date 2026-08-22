import type {
  CoreSnapshot,
  DesktopPetState,
  DesktopPetStateName,
  EventEnvelope,
} from "@jarvis-k/contracts";

export interface PetProjectionInput {
  readonly nowIso: string;
  readonly coreOnline: boolean;
  readonly snapshot?: CoreSnapshot | null;
  readonly recentState?: RecentDesktopPetState | null;
  readonly nowMs?: number;
}

export interface RecentDesktopPetState {
  readonly state: Extract<DesktopPetStateName, "success" | "error">;
  readonly untilMs: number;
  readonly reasonCategory: "recent_success" | "recent_error";
  readonly signature?: string;
}

const ACTIVE_TASK_STATES = new Set([
  "queued",
  "planning",
  "awaiting_confirmation",
  "running",
]);

export function createDesktopPetState(
  input: PetProjectionInput,
): DesktopPetState {
  if (!input.coreOnline) {
    return state("offline", input.nowIso, "core");
  }

  const liveState = projectLiveState(input);
  const recent = input.recentState;
  const recentActive = recent && (input.nowMs ?? 0) < recent.untilMs;
  if (recentActive && recent.state === "error") {
    return state("error", input.nowIso, recent.reasonCategory);
  }
  if (liveState.state === "listening" || liveState.state === "thinking") {
    return liveState;
  }

  if (recentActive && recent.state === "success") {
    return state("success", input.nowIso, recent.reasonCategory);
  }

  return liveState;
}

export function projectLiveState(input: PetProjectionInput): DesktopPetState {
  const snapshot = input.snapshot;
  if (snapshot?.voice.state === "recording" || snapshot?.voice.state === "finalizing") {
    return state("listening", input.nowIso, "voice");
  }

  if (snapshot?.tasks.some((task) => ACTIVE_TASK_STATES.has(task.state))) {
    return state("thinking", input.nowIso, "task");
  }

  return state("idle", input.nowIso);
}

export function recentPetStateFromEvent(
  envelope: EventEnvelope,
  nowMs: number,
  durationMs = 1_500,
): RecentDesktopPetState | null {
  const event = envelope.event;
  if (event.type === "voice.error") {
    return {
      state: "error",
      untilMs: nowMs + durationMs,
      reasonCategory: "recent_error",
      signature: `voice.error:${envelope.sequenceId}`,
    };
  }
  if (event.type === "state.snapshot") {
    const failedTasks = event.payload.tasks
      .filter((task) => task.state === "failed" || task.state === "interrupted")
      .map((task) => `${task.id}:${task.state}`)
      .sort();
    if (failedTasks.length > 0) {
      return {
        state: "error",
        untilMs: nowMs + durationMs,
        reasonCategory: "recent_error",
        signature: `snapshot:error:${failedTasks.join("|")}`,
      };
    }
    const completedTasks = event.payload.tasks
      .filter((task) => task.state === "completed")
      .map((task) => `${task.id}:${task.state}`)
      .sort();
    if (completedTasks.length > 0) {
      return {
        state: "success",
        untilMs: nowMs + durationMs,
        reasonCategory: "recent_success",
        signature: `snapshot:success:${completedTasks.join("|")}`,
      };
    }
  }
  if (event.type === "agent.message.accepted") {
    return {
      state: "success",
      untilMs: nowMs + durationMs,
      reasonCategory: "recent_success",
      signature: `agent.message.accepted:${envelope.sequenceId}`,
    };
  }
  return null;
}

function state(
  value: DesktopPetStateName,
  updatedAt: string,
  reasonCategory?: DesktopPetState["reasonCategory"],
): DesktopPetState {
  return {
    state: value,
    updatedAt,
    ...(reasonCategory ? { reasonCategory } : {}),
    sensitiveContentExposed: false,
  };
}
