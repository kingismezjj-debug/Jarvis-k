import path from "node:path";
import { BrowserWindow, type BrowserWindowConstructorOptions } from "electron";
import { DESKTOP_PET_SIZE } from "./pet-position";

export interface CreatePetWindowOptions {
  readonly position: { x: number; y: number };
  readonly alwaysOnTop: boolean;
  readonly preloadPath?: string;
  readonly petHtmlPath?: string;
}

export function createPetWindow(options: CreatePetWindowOptions): BrowserWindow {
  const window = new BrowserWindow(createPetWindowOptions(options));
  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });
  window.webContents.session.setPermissionCheckHandler(() => false);
  window.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false);
    },
  );
  window.once("ready-to-show", () => {
    window.show();
  });
  void window.loadFile(options.petHtmlPath ?? defaultPetHtmlPath());
  return window;
}

export function createPetWindowOptions(
  options: CreatePetWindowOptions,
): BrowserWindowConstructorOptions {
  return {
    x: options.position.x,
    y: options.position.y,
    width: DESKTOP_PET_SIZE.width,
    height: DESKTOP_PET_SIZE.height,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: options.alwaysOnTop,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    show: false,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: options.preloadPath ?? defaultPetPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
}

function defaultPetPreloadPath(): string {
  return path.join(__dirname, "..", "pet-preload.cjs");
}

function defaultPetHtmlPath(): string {
  return path.join(
    __dirname,
    "..",
    "..",
    "..",
    "ui",
    "dist",
    "pet.html",
  );
}
