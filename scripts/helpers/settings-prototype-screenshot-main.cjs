const { BrowserWindow, app } = require("electron");

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const width = Number(process.env.JARVIS_K_SETTINGS_PROTOTYPE_WIDTH ?? "1440");
  const height = Number(process.env.JARVIS_K_SETTINGS_PROTOTYPE_HEIGHT ?? "940");
  const url = process.env.JARVIS_K_SETTINGS_PROTOTYPE_URL;
  if (!url) {
    throw new Error("Missing prototype URL.");
  }
  const window = new BrowserWindow({
    backgroundColor: "#101215",
    height,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    width,
  });
  await window.loadURL(url);
  window.showInactive();
});
