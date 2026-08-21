import { describe, expect, it } from "vitest";
import { createDesktopPetState } from "../src/pet/pet-state-projector";

const nowIso = "2026-08-20T00:00:00.000Z";

function snapshot(
  input: { health?: string; voiceState?: string; taskState?: string } = {},
) {
  return {
    protocolVersion: 1,
    coreInstanceId: "core-1",
    sequenceId: 1,
    health: input.health ?? "ready",
    startedAt: nowIso,
    updatedAt: nowIso,
    voice: {
      state: input.voiceState ?? "idle",
      mode: "disabled",
    },
    messages: [],
    conversations: [],
    sessionHistory: [],
    tasks: input.taskState
      ? [
          {
            id: "task-1",
            title: "Safe task",
            state: input.taskState,
            createdAt: nowIso,
            updatedAt: nowIso,
            routeSource: "unknown",
            steps: [],
            events: [],
          },
        ]
      : [],
  } as never;
}

describe("Pet state projector", () => {
  it("projects offline when Core is not available", () => {
    expect(
      createDesktopPetState({ nowIso, coreOnline: false }),
    ).toMatchObject({
      state: "offline",
      reasonCategory: "core",
      sensitiveContentExposed: false,
    });
  });

  it("does not project degraded Core health as offline", () => {
    expect(
      createDesktopPetState({
        nowIso,
        coreOnline: true,
        snapshot: snapshot({ health: "degraded" }),
      }),
    ).toMatchObject({
      state: "idle",
      sensitiveContentExposed: false,
    });
  });

  it("projects listening from bounded voice state without transcript text", () => {
    const projected = createDesktopPetState({
      nowIso,
      coreOnline: true,
      snapshot: snapshot({ voiceState: "recording" }),
    });
    expect(projected).toMatchObject({
      state: "listening",
      reasonCategory: "voice",
      sensitiveContentExposed: false,
    });
    expect(JSON.stringify(projected)).not.toContain("transcript");
  });

  it("projects thinking from active tasks", () => {
    expect(
      createDesktopPetState({
        nowIso,
        coreOnline: true,
        snapshot: snapshot({ taskState: "running" }),
      }),
    ).toMatchObject({ state: "thinking", reasonCategory: "task" });
  });

  it("projects temporary success and then returns to idle", () => {
    expect(
      createDesktopPetState({
        nowIso,
        nowMs: 50,
        coreOnline: true,
        recentState: {
          state: "success",
          untilMs: 100,
          reasonCategory: "recent_success",
        },
      }),
    ).toMatchObject({ state: "success" });
    expect(
      createDesktopPetState({
        nowIso,
        nowMs: 150,
        coreOnline: true,
        recentState: {
          state: "success",
          untilMs: 100,
          reasonCategory: "recent_success",
        },
      }),
    ).toMatchObject({ state: "idle" });
  });
});
