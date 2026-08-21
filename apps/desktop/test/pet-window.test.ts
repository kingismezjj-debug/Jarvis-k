import { describe, expect, it } from "vitest";
import { createPetWindowOptions } from "../src/pet/pet-window";

describe("Pet window options", () => {
  it("uses a locked-down transparent BrowserWindow configuration", () => {
    const options = createPetWindowOptions({
      position: { x: 10, y: 20 },
      alwaysOnTop: true,
      preloadPath: "pet-preload.cjs",
    });

    expect(options).toMatchObject({
      x: 10,
      y: 20,
      width: 112,
      height: 112,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
      show: false,
      webPreferences: {
        preload: "pet-preload.cjs",
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
  });
});
