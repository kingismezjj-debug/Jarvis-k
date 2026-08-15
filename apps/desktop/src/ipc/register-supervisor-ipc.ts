import type { IpcMain } from "electron";
import {
  CommandEnvelopeSchema,
  type CommandResult,
  IPC_COMMAND_CHANNEL,
  PROTOCOL_VERSION,
  createId,
} from "@jarvis-k/contracts";
import type { DesktopSupervisorController } from "../core-supervisor/desktop-supervisor-controller";

export interface RegisterSupervisorIpcOptions {
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  supervisorController: DesktopSupervisorController;
}

export function registerSupervisorIpc(
  options: RegisterSupervisorIpcOptions,
): () => void {
  unregisterSupervisorIpc(options.ipcMain);

  options.ipcMain.handle(
    IPC_COMMAND_CHANNEL,
    async (_event, rawEnvelope: unknown) => {
      const parsed = CommandEnvelopeSchema.safeParse(rawEnvelope);
      if (!parsed.success) {
        return invalidCommandResult(rawEnvelope);
      }
      return options.supervisorController.request(parsed.data);
    },
  );

  return () => {
    unregisterSupervisorIpc(options.ipcMain);
  };
}

export function unregisterSupervisorIpc(
  ipcMain: Pick<IpcMain, "removeHandler">,
): void {
  ipcMain.removeHandler(IPC_COMMAND_CHANNEL);
}

export function invalidCommandResult(rawValue: unknown): CommandResult {
  const raw =
    typeof rawValue === "object" && rawValue !== null
      ? (rawValue as Record<string, unknown>)
      : {};
  const commandId =
    typeof raw.commandId === "string" ? raw.commandId : createId("cmd");
  const correlationId =
    typeof raw.correlationId === "string"
      ? raw.correlationId
      : createId("corr");

  return {
    protocolVersion: PROTOCOL_VERSION,
    commandId,
    correlationId,
    completedAt: new Date().toISOString(),
    ok: false,
    error: {
      code: "IPC_SCHEMA_INVALID",
      message: "The renderer sent an invalid command envelope.",
      retryable: false,
    },
  };
}
