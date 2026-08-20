import path from "node:path";
import { BrowserWindow, shell } from "electron";

export interface CreateMainWindowOptions {
  readonly showOnReady?: boolean;
}

export function createMainWindow(
  options: CreateMainWindowOptions = {},
): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: "#11110f",
    title: "Jarvis-K",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  window.setMenuBarVisibility(false);
  window.webContents.session.setPermissionCheckHandler(
    (webContents, permission) =>
      webContents?.id === window.webContents.id && permission === "media",
  );
  window.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      callback(
        webContents.id === window.webContents.id &&
          permission === "media" &&
          "mediaTypes" in details &&
          Array.isArray(details.mediaTypes) &&
          details.mediaTypes.includes("audio") &&
          !details.mediaTypes.includes("video"),
      );
    },
  );
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (url !== window.webContents.getURL()) {
      event.preventDefault();
    }
  });
  window.once("ready-to-show", () => {
    if (options.showOnReady !== false) {
      window.show();
    }
  });
  void window.loadFile(
    path.join(__dirname, "..", "..", "..", "ui", "dist", "index.html"),
  );
  return window;
}
