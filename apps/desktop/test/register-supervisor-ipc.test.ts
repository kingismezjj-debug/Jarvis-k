import { describe, expect, it, vi } from "vitest";
import {
  IPC_COMMAND_CHANNEL,
  createCommandEnvelope,
} from "@jarvis-k/contracts";
import {
  invalidCommandResult,
  registerSupervisorIpc,
} from "../src/ipc/register-supervisor-ipc";
import type { DesktopSupervisorController } from "../src/core-supervisor/desktop-supervisor-controller";

class FakeIpcMain {
  public readonly handlers = new Map<string, (...args: unknown[]) => unknown>();

  public handle(channel: string, handler: (...args: unknown[]) => unknown): void {
    this.handlers.set(channel, handler);
  }

  public removeHandler(channel: string): void {
    this.handlers.delete(channel);
  }

  public async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler(...args);
  }
}

function createSupervisorController(): DesktopSupervisorController {
  return {
    request: vi.fn().mockResolvedValue({
      protocolVersion: 1,
      commandId: "cmd_1",
      correlationId: "corr_1",
      completedAt: "2026-08-15T00:00:00.000Z",
      ok: true,
      value: { accepted: true },
    }),
  } as unknown as DesktopSupervisorController;
}

describe("registerSupervisorIpc", () => {
  it("routes valid command envelopes through the supervisor controller", async () => {
    const ipcMain = new FakeIpcMain();
    const supervisorController = createSupervisorController();
    const envelope = createCommandEnvelope({
      type: "agent.runBrainCommand",
      payload: {
        source: "text",
        text: "open notepad",
      },
    });

    registerSupervisorIpc({
      ipcMain,
      supervisorController,
    });

    await expect(
      ipcMain.invoke(IPC_COMMAND_CHANNEL, {}, envelope),
    ).resolves.toMatchObject({ ok: true });
    expect(supervisorController.request).toHaveBeenCalledWith(envelope);
  });

  it("keeps invalid command envelopes in the IPC schema failure path", async () => {
    const ipcMain = new FakeIpcMain();
    const supervisorController = createSupervisorController();

    registerSupervisorIpc({
      ipcMain,
      supervisorController,
    });

    await expect(
      ipcMain.invoke(IPC_COMMAND_CHANNEL, {}, { bad: true }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "IPC_SCHEMA_INVALID",
      },
    });
    expect(supervisorController.request).not.toHaveBeenCalled();
  });

  it("disposes the command handler", () => {
    const ipcMain = new FakeIpcMain();
    const supervisorController = createSupervisorController();

    const dispose = registerSupervisorIpc({
      ipcMain,
      supervisorController,
    });

    dispose();

    expect(ipcMain.handlers.has(IPC_COMMAND_CHANNEL)).toBe(false);
  });
});

describe("invalidCommandResult", () => {
  it("preserves caller identifiers when present", () => {
    expect(
      invalidCommandResult({
        commandId: "cmd_existing",
        correlationId: "corr_existing",
      }),
    ).toMatchObject({
      commandId: "cmd_existing",
      correlationId: "corr_existing",
      ok: false,
      error: { code: "IPC_SCHEMA_INVALID" },
    });
  });
});
