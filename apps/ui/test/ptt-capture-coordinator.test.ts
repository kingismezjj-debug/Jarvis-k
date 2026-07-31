import { describe, expect, it, vi } from "vitest";
import type { AppCommand } from "@jarvis-k/contracts";
import {
  PttCaptureCoordinator,
  type PttCapturePort
} from "../src/voice/ptt-capture-coordinator";

function createHarness(
  sendCommand: (command: AppCommand) => Promise<boolean> = async () => true
) {
  const order: string[] = [];
  const capture: PttCapturePort = {
    start: vi.fn(async () => {
      order.push("capture.start");
      return true;
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
    sendCommand: async (command) => {
      commands.push(command);
      order.push(command.type);
      return sendCommand(command);
    }
  });
  return { capture, commands, coordinator, order };
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
    expect(harness.capture.start).not.toHaveBeenCalled();
    expect(harness.commands.at(-1)).toEqual({
      type: "voice.cancel",
      payload: { reason: "window-blur" }
    });
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
