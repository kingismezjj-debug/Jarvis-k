import path from "node:path";
import {
  BrowserWindow,
  app,
  ipcMain,
  shell
} from "electron";
import {
  CommandEnvelopeSchema,
  CommandResult,
  IPC_COMMAND_CHANNEL,
  IPC_EVENT_CHANNEL,
  PROTOCOL_VERSION,
  createId
} from "@jarvis-k/contracts";
import { CoreSupervisor } from "./supervisor";

let mainWindow: BrowserWindow | null = null;
let supervisor: CoreSupervisor | null = null;

function invalidCommandResult(rawValue: unknown): CommandResult {
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
      retryable: false
    }
  };
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: "#11110f",
    title: "Jarvis-K",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (url !== window.webContents.getURL()) {
      event.preventDefault();
    }
  });
  window.once("ready-to-show", () => window.show());
  void window.loadFile(
    path.join(__dirname, "..", "..", "ui", "dist", "index.html")
  );
  return window;
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });

  void app.whenReady().then(() => {
    const coreEntry = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "packages",
      "core",
      "dist",
      "index.js"
    );
    supervisor = new CoreSupervisor({ coreEntry });
    supervisor.onEvent((event) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_EVENT_CHANNEL, event);
      }
    });
    supervisor.start();

    ipcMain.handle(IPC_COMMAND_CHANNEL, (_event, rawEnvelope: unknown) => {
      const parsed = CommandEnvelopeSchema.safeParse(rawEnvelope);
      if (!parsed.success || !supervisor) {
        return invalidCommandResult(rawEnvelope);
      }
      return supervisor.request(parsed.data);
    });

    mainWindow = createMainWindow();
    mainWindow.on("closed", () => {
      mainWindow = null;
    });

    app.on("activate", () => {
      if (!mainWindow) {
        mainWindow = createMainWindow();
      }
    });
  });
}

app.on("before-quit", () => {
  supervisor?.stop();
});

app.on("window-all-closed", () => {
  app.quit();
});
