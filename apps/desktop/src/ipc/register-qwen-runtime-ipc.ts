import type { BrowserWindow, IpcMain } from "electron";
import {
  IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL,
  IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import type { QwenRuntimeController } from "../qwen-runtime/qwen-runtime-controller";

export interface RegisterQwenRuntimeIpcOptions {
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  qwenRuntimeController: QwenRuntimeController;
  getMainWindow: () => BrowserWindow | null;
}

export function registerQwenRuntimeIpc(
  options: RegisterQwenRuntimeIpcOptions,
): () => void {
  unregisterQwenRuntimeIpc(options.ipcMain);

  options.ipcMain.handle(IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL, () =>
    options.qwenRuntimeController.getStatus(),
  );
  options.ipcMain.handle(
    IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL,
    (event, rawInput) => {
      const mainWindow = options.getMainWindow();
      return options.qwenRuntimeController.setAction({
        senderId: event.sender.id,
        expectedSenderId:
          mainWindow && !mainWindow.isDestroyed()
            ? mainWindow.webContents.id
            : null,
        rawInput,
      });
    },
  );

  return () => {
    unregisterQwenRuntimeIpc(options.ipcMain);
  };
}

export function unregisterQwenRuntimeIpc(
  ipcMain: Pick<IpcMain, "removeHandler">,
): void {
  ipcMain.removeHandler(IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL);
  ipcMain.removeHandler(IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL);
}
