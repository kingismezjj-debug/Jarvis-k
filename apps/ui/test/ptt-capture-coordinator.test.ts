import { describe, expect, it, vi } from "vitest";
import type { AppCommand } from "@jarvis-k/contracts";
import {
  PttCaptureCoordinator,
  type PttCommandResult,
  type PttCapturePort
} from "../src/voice/ptt-capture-coordinator";

function createHarness(
  sendCommand: (command: AppCommand) => Promise<boolean | PttCommandResult> = async () => true,
  captureStart: () => Promise<boolean> = async () => true
) {
  const order: string[] = [];
  const startFailures: string[] = [];
  const commandFailures: unknown[] = [];
  const capture: PttCapturePort = {
    start: vi.fn(async () => {
      order.push("capture.start");
      return captureStart();
    }),
    stop: vi.fn(async () => {
      order.push("capture.stop");
      return true;
    }),
    dispose: vi.fn(async () => {
      order.push("capture.dispose");
      return true;
    })
  };
  const commands: AppCommand[] = [];
  const coordinator = new PttCaptureCoordinator({
    capture,
    createCaptureId: () => "capture-1",
    onStartFailure: (reason) => startFailures.push(reason),
    onCommandFailure: (error) => commandFailures.push(error),
    sendCommand: async (command) => {
      commands.push(command);
      order.push(command.type);
      const result = await sendCommand(command);
      if (typeof result === "boolean") {
        return result ? { ok: true } : { ok: false };
      }
      return result;
    }
  });
  return { capture, commandFailures, commands, coordinator, order, startFailures };
}

describe("PttCaptureCoordinator", () => {
  it("coalesces repeated starts into one capture owner", async () => {
    const harness = createHarness();

    const firstStart = harness.coordinator.start();
    const secondStart = harness.coordinator.start();

    expect(await firstStart).toBe(true);
    expect(await secondStart).toBe(false);
    expect(harness.capture.start).toHaveBeenCalledTimes(1);
    expect(
      harness.commands.filter((command) => command.type === "voice.startPtt")
    ).toHaveLength(1);
  });

  it("starts local microphone capture before remote PTT setup", async () => {
    const harness = createHarness();

    expect(await harness.coordinator.start()).toBe(true);
    expect(harness.order.slice(0, 3)).toEqual([
      "capture.start",
      "voice.setMode",
      "voice.startPtt"
    ]);
  });

  it.each([
    ["window-blur", "window-blur"],
    ["user-cancel", "user"],
    ["capture-error", "capture-error"]
  ] as const)(
    "routes %s through the same stop path",
    async (reason, commandReason) => {
      const harness = createHarness();
      await harness.coordinator.start();

      expect(await harness.coordinator.stop(reason)).toBe(true);
      expect(harness.order.slice(-2)).toEqual([
        "capture.stop",
        "voice.cancel"
      ]);
      expect(harness.commands.at(-1)).toEqual({
        type: "voice.cancel",
        payload: { reason: commandReason }
      });
    }
  );

  it("stops microphone upload before sending the PTT release", async () => {
    const harness = createHarness();
    await harness.coordinator.start();

    await harness.coordinator.stop("release");

    expect(harness.order.slice(-2)).toEqual([
      "capture.stop",
      "voice.stopPtt"
    ]);
    expect(harness.commands.at(-1)).toEqual({
      type: "voice.stopPtt",
      payload: { captureId: "capture-1" }
    });
  });

  it("reports command errors from the PTT release path", async () => {
    const harness = createHarness(async (command) =>
      command.type === "voice.stopPtt"
        ? {
            ok: false,
            error: {
              code: "VOICE_FINALIZE_FAILED",
              message: "ASR finalize failed.",
              retryable: true
            }
          }
        : true
    );
    await harness.coordinator.start();

    await harness.coordinator.stop("release");

    expect(harness.commandFailures).toEqual([
      {
        code: "VOICE_FINALIZE_FAILED",
        message: "ASR finalize failed.",
        retryable: true
      }
    ]);
  });

  it("suppresses secondary stop errors after the voice engine is already errored", async () => {
    const harness = createHarness(async (command) =>
      command.type === "voice.stopPtt"
        ? {
            ok: false,
            error: {
              code: "VOICE_STATE_INVALID",
              message: "PTT cannot stop while state is error.",
              retryable: false
            }
          }
        : true
    );
    await harness.coordinator.start();

    await harness.coordinator.stop("release");

    expect(harness.commandFailures).toEqual([]);
    expect(harness.commands.slice(-2)).toEqual([
      {
        type: "voice.stopPtt",
        payload: { captureId: "capture-1" }
      },
      {
        type: "voice.cancel",
        payload: { reason: "user" }
      }
    ]);
  });

  it("preserves capture-layer failures instead of overwriting their diagnosis", async () => {
    const harness = createHarness(
      async () => true,
      async () => {
        throw new DOMException("Permission denied.", "NotAllowedError");
      }
    );

    expect(await harness.coordinator.start()).toBe(false);

    expect(harness.startFailures).toEqual([]);
    expect(harness.commands.at(-1)).toEqual({
      type: "voice.cancel",
      payload: { reason: "capture-error" }
    });
  });

  it("cancels a start that is still waiting for Core", async () => {
    let resolveMode: ((accepted: boolean) => void) | undefined;
    const modePending = new Promise<boolean>((resolve) => {
      resolveMode = resolve;
    });
    const harness = createHarness((command) =>
      command.type === "voice.setMode" ? modePending : Promise.resolve(true)
    );

    const starting = harness.coordinator.start();
    await Promise.resolve();
    await harness.coordinator.stop("window-blur");
    resolveMode?.(true);

    expect(await starting).toBe(false);
    expect(harness.capture.start).toHaveBeenCalledTimes(1);
    expect(harness.capture.stop).toHaveBeenCalledTimes(1);
    expect(harness.commands.at(-1)).toEqual({
      type: "voice.cancel",
      payload: { reason: "window-blur" }
    });
  });

  it("reports when Core cannot enter PTT mode after local capture starts", async () => {
    const harness = createHarness(async (command) =>
      command.type === "voice.setMode" ? false : true
    );

    expect(await harness.coordinator.start()).toBe(false);
    expect(harness.capture.start).toHaveBeenCalledTimes(1);
    expect(harness.capture.stop).toHaveBeenCalledTimes(1);
    expect(harness.startFailures).toEqual(["voice-mode-unavailable"]);
  });

  it("reports when Core cannot start a PTT session after local capture starts", async () => {
    const harness = createHarness(async (command) =>
      command.type === "voice.startPtt" ? false : true
    );

    expect(await harness.coordinator.start()).toBe(false);
    expect(harness.capture.start).toHaveBeenCalledTimes(1);
    expect(harness.capture.stop).toHaveBeenCalledTimes(1);
    expect(harness.startFailures).toEqual(["voice-session-unavailable"]);
  });

  it("disposes the capture owner once during renderer teardown", async () => {
    const harness = createHarness();
    await harness.coordinator.start();

    expect(await harness.coordinator.dispose()).toBe(true);
    expect(await harness.coordinator.dispose()).toBe(false);
    expect(harness.capture.dispose).toHaveBeenCalledTimes(1);
    expect(harness.commands.at(-1)).toEqual({
      type: "voice.cancel",
      payload: { reason: "shutdown" }
    });
  });
});
