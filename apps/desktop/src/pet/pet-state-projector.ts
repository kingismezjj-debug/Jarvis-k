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
  readonly recentState?: {
    readonly state: Extract<DesktopPetStateName, "success" | "error">;
    readonly untilMs: number;
    readonly reasonCategory: "recent_success" | "recent_error";
  } | null;
  readonly nowMs?: number;
}

export function createDesktopPetState(
  input: PetProjectionInput,
): DesktopPetState {
  if (!input.coreOnline) {
    return state("offline", input.nowIso, "core");
  }

  const recent = input.recentState;
  if (recent && (input.nowMs ?? 0) < recent.untilMs) {
    return state(recent.state, input.nowIso, recent.reasonCategory);
  }

  const snapshot = input.snapshot;
  if (snapshot?.voice.state === "recording" || snapshot?.voice.state === "finalizing") {
    return state("listening", input.nowIso, "voice");
  }

  if (
    snapshot?.tasks.some((task) =>
      ["queued", "planning", "awaiting_confirmation", "running"].includes(
        task.state,
      ),
    )
  ) {
    return state("thinking", input.nowIso, "task");
  }

  return state("idle", input.nowIso);
}

export function recentPetStateFromEvent(
  envelope: EventEnvelope,
  nowMs: number,
  durationMs = 1_500,
):
  | {
      readonly state: Extract<DesktopPetStateName, "success" | "error">;
      readonly untilMs: number;
      readonly reasonCategory: "recent_success" | "recent_error";
    }
  | null {
  const event = envelope.event;
  if (event.type === "voice.error") {
    return {
      state: "error",
      untilMs: nowMs + durationMs,
      reasonCategory: "recent_error",
    };
  }
  if (event.type === "state.snapshot") {
    const hasFailedTask = event.payload.tasks.some(
      (task) => task.state === "failed" || task.state === "interrupted",
    );
    if (hasFailedTask) {
      return {
        state: "error",
        untilMs: nowMs + durationMs,
        reasonCategory: "recent_error",
      };
    }
    const hasCompletedTask = event.payload.tasks.some(
      (task) => task.state === "completed",
    );
    if (hasCompletedTask) {
      return {
        state: "success",
        untilMs: nowMs + durationMs,
        reasonCategory: "recent_success",
      };
    }
  }
  if (event.type === "agent.message.accepted") {
    return {
      state: "success",
      untilMs: nowMs + durationMs,
      reasonCategory: "recent_success",
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
