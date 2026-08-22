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

  it("projects all six formal states through safe state summaries", () => {
    const cases = [
      createDesktopPetState({ nowIso, coreOnline: true }),
      createDesktopPetState({
        nowIso,
        coreOnline: true,
        snapshot: snapshot({ voiceState: "recording" }),
      }),
      createDesktopPetState({
        nowIso,
        coreOnline: true,
        snapshot: snapshot({ taskState: "running" }),
      }),
      createDesktopPetState({
        nowIso,
        nowMs: 0,
        coreOnline: true,
        recentState: {
          state: "success",
          untilMs: 100,
          reasonCategory: "recent_success",
        },
      }),
      createDesktopPetState({
        nowIso,
        nowMs: 0,
        coreOnline: true,
        recentState: {
          state: "error",
          untilMs: 100,
          reasonCategory: "recent_error",
        },
      }),
      createDesktopPetState({ nowIso, coreOnline: false }),
    ];

    expect(cases.map((projected) => projected.state)).toEqual([
      "idle",
      "listening",
      "thinking",
      "success",
      "error",
      "offline",
    ]);
    for (const projected of cases) {
      expect(projected.sensitiveContentExposed).toBe(false);
      expect(Object.keys(projected).sort()).toEqual(
        expect.arrayContaining(["sensitiveContentExposed", "state", "updatedAt"]),
      );
    }
  });

  it("keeps offline and active error above live activity, but live activity above recent success", () => {
    const recentError = {
      state: "error" as const,
      untilMs: 100,
      reasonCategory: "recent_error" as const,
    };
    const recentSuccess = {
      state: "success" as const,
      untilMs: 100,
      reasonCategory: "recent_success" as const,
    };

    expect(
      createDesktopPetState({
        nowIso,
        nowMs: 0,
        coreOnline: false,
        snapshot: snapshot({ voiceState: "recording" }),
        recentState: recentError,
      }),
    ).toMatchObject({ state: "offline" });
    expect(
      createDesktopPetState({
        nowIso,
        nowMs: 0,
        coreOnline: true,
        snapshot: snapshot({ voiceState: "recording" }),
        recentState: recentError,
      }),
    ).toMatchObject({ state: "error" });
    expect(
      createDesktopPetState({
        nowIso,
        nowMs: 0,
        coreOnline: true,
        snapshot: snapshot({ taskState: "running" }),
        recentState: recentSuccess,
      }),
    ).toMatchObject({ state: "thinking" });
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

  it("recovers from expired temporary state to the current live state", () => {
    expect(
      createDesktopPetState({
        nowIso,
        nowMs: 150,
        coreOnline: true,
        snapshot: snapshot({ voiceState: "finalizing" }),
        recentState: {
          state: "success",
          untilMs: 100,
          reasonCategory: "recent_success",
        },
      }),
    ).toMatchObject({ state: "listening", reasonCategory: "voice" });
  });

  it("does not project user-derived text fields", () => {
    const userUrl = ["https", "://", "example.invalid", "/private"].join("");
    const userPath = ["C:", "\\", "Users", "\\", "example"].join("");
    const projected = createDesktopPetState({
      nowIso,
      nowMs: 0,
      coreOnline: true,
      snapshot: {
        ...snapshot({ voiceState: "recording", taskState: "running" }),
        voice: {
          state: "recording",
          mode: "command",
          transcript: `open ${userUrl} ${userPath}`,
        },
      } as never,
      recentState: {
        state: "error",
        untilMs: 100,
        reasonCategory: "recent_error",
      },
    });
    const serialized = JSON.stringify(projected).toLowerCase();
    expect(serialized).not.toContain("transcript");
    expect(serialized).not.toContain("slot");
    expect(serialized).not.toContain("https");
    expect(serialized).not.toContain("example.invalid");
    expect(serialized).not.toContain("users");
  });
});
