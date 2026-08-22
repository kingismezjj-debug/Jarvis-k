import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const userDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-desktop-pet-smoke-"),
);
let electronApp;

async function waitForPetWindow() {
  await electronApp.waitForEvent("window", {
    predicate: (page) => page.url().includes("pet.html"),
    timeout: 10_000,
  }).catch(() => undefined);
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const petPage = electronApp
      .windows()
      .find((page) => page.url().includes("pet.html"));
    if (petPage) {
      return petPage;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Desktop Pet window did not appear.");
}

try {
  electronApp = await electron.launch({
    args: [
      `--user-data-dir=${userDataDirectory}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_USER_DATA_PATH: userDataDirectory,
      JARVIS_K_LOCAL_DATA_PATH: userDataDirectory,
      JARVIS_K_MEMORY_DB_PATH: path.join(userDataDirectory, "memory.sqlite"),
      JARVIS_K_MODEL_DIR: path.join(userDataDirectory, "models"),
      JARVIS_K_VOICE_REGRESSION_PATH: path.join(
        userDataDirectory,
        "voice-regression.json",
      ),
    },
  });

  const mainPage = await electronApp.firstWindow();
  await mainPage.setViewportSize({ width: 1280, height: 820 });
  await mainPage.getByTestId("jarvis-app").waitFor();
  await mainPage.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });

  const initialSettings = await mainPage.evaluate(async () => {
    if (!window.jarvis) throw new Error("Jarvis bridge unavailable.");
    return window.jarvis.getDesktopSettings();
  });
  if (initialSettings.desktopPetEnabled !== false) {
    throw new Error("Desktop Pet default is not OFF.");
  }

  const enableResult = await mainPage.evaluate(async () => {
    if (!window.jarvis) throw new Error("Jarvis bridge unavailable.");
    return window.jarvis.setDesktopPetEnabled(true);
  });
  if (!enableResult.ok || enableResult.settings.desktopPetEnabled !== true) {
    throw new Error(`Desktop Pet enable failed: ${JSON.stringify(enableResult)}`);
  }

  const petPage = await waitForPetWindow();
  await petPage.locator(".pet-shell").waitFor({ timeout: 10_000 });
  const petBridgeSurface = await petPage.evaluate(() => ({
    hasMainBridge: typeof window.jarvis !== "undefined",
    petKeys: Object.keys(window.jarvisPet ?? {}).sort(),
  }));
  const expectedPetKeys = [
    "getPetSettings",
    "getPetState",
    "hidePet",
    "onPetState",
    "openMainWindow",
    "requestContextMenu",
    "savePosition",
  ];
  if (petBridgeSurface.hasMainBridge) {
    throw new Error("Pet renderer can access the full Jarvis bridge.");
  }
  for (const key of expectedPetKeys) {
    if (!petBridgeSurface.petKeys.includes(key)) {
      throw new Error(
        `Pet bridge missing ${key}: ${JSON.stringify(petBridgeSurface)}`,
      );
    }
  }
  const petSurface = await petPage.evaluate(() => {
    const shell = document.querySelector(".pet-shell");
    return {
      bodyBackground: window.getComputedStyle(document.body).backgroundColor,
      rootBackground: window.getComputedStyle(
        document.getElementById("pet-root"),
      ).backgroundColor,
      shellBackground: shell
        ? window.getComputedStyle(shell).backgroundColor
        : null,
      shellCursor: shell ? window.getComputedStyle(shell).cursor : null,
      hasDragHandle: Boolean(document.querySelector(".pet-drag-handle")),
      hasHideButton: Boolean(document.querySelector(".pet-hide")),
    };
  });
  if (
    !["rgba(0, 0, 0, 0)", "transparent"].includes(petSurface.bodyBackground) ||
    !["rgba(0, 0, 0, 0)", "transparent"].includes(petSurface.rootBackground) ||
    petSurface.shellCursor !== "grab" ||
    petSurface.hasDragHandle ||
    petSurface.hasHideButton
  ) {
    throw new Error(`Unexpected Pet transparent/drag surface: ${JSON.stringify(petSurface)}`);
  }

  const petWindowState = await electronApp.evaluate(({ BrowserWindow }) => {
    const petWindow = BrowserWindow.getAllWindows().find((candidate) =>
      candidate.webContents.getURL().includes("pet.html"),
    );
    return {
      count: BrowserWindow.getAllWindows().filter((candidate) =>
        candidate.webContents.getURL().includes("pet.html"),
      ).length,
      visible: petWindow?.isVisible() ?? false,
      alwaysOnTop: petWindow?.isAlwaysOnTop() ?? false,
      resizable: petWindow?.isResizable() ?? true,
      bounds: petWindow?.getBounds(),
    };
  });
  if (
    petWindowState.count !== 1 ||
    !petWindowState.visible ||
    !petWindowState.alwaysOnTop ||
    petWindowState.resizable
  ) {
    throw new Error(`Unexpected Pet window state: ${JSON.stringify(petWindowState)}`);
  }

  const shellBox = await petPage.locator(".pet-shell").boundingBox();
  if (!shellBox) {
    throw new Error("Pet shell bounds unavailable before drag.");
  }
  await petPage.mouse.move(shellBox.x + 56, shellBox.y + 56);
  await petPage.mouse.down();
  await petPage.mouse.move(shellBox.x + 88, shellBox.y + 86, { steps: 5 });
  await petPage.mouse.up();
  await mainPage.waitForTimeout(650);
  const movedBounds = await electronApp.evaluate(({ BrowserWindow }) => {
    const petWindow = BrowserWindow.getAllWindows().find((candidate) =>
      candidate.webContents.getURL().includes("pet.html"),
    );
    return petWindow?.getBounds();
  });
  const settingsAfterMove = await mainPage.evaluate(async () => {
    if (!window.jarvis) throw new Error("Jarvis bridge unavailable.");
    return window.jarvis.getDesktopSettings();
  });
  if (
    settingsAfterMove.desktopPetPosition?.x !== movedBounds.x ||
    settingsAfterMove.desktopPetPosition?.y !== movedBounds.y
  ) {
    throw new Error(
      `Pet position did not persist after move: ${JSON.stringify({
        movedBounds,
        position: settingsAfterMove.desktopPetPosition,
      })}`,
    );
  }

  const reducedMotionResult = await mainPage.evaluate(async () => {
    if (!window.jarvis) throw new Error("Jarvis bridge unavailable.");
    return window.jarvis.setDesktopPetReducedMotion("on");
  });
  if (
    !reducedMotionResult.ok ||
    reducedMotionResult.settings.desktopPetReducedMotion !== "on"
  ) {
    throw new Error(
      `Desktop Pet reduced motion enable failed: ${JSON.stringify(reducedMotionResult)}`,
    );
  }
  await petPage.waitForFunction(
    () =>
      document
        .querySelector(".pet-shell")
        ?.getAttribute("data-motion") === "reduced",
    undefined,
    { timeout: 5_000 },
  );
  const reducedMotionState = await petPage.evaluate(() => {
    const shell = document.querySelector(".pet-shell");
    const orb = document.querySelector(".pet-orb");
    return {
      motion: shell?.getAttribute("data-motion"),
      orbAnimationName: orb ? window.getComputedStyle(orb).animationName : null,
    };
  });
  if (
    reducedMotionState.motion !== "reduced" ||
    reducedMotionState.orbAnimationName !== "none"
  ) {
    throw new Error(`Reduced motion did not apply: ${JSON.stringify(reducedMotionState)}`);
  }

  await electronApp.evaluate(({ BrowserWindow }) => {
    const mainWindow = BrowserWindow.getAllWindows().find((candidate) =>
      candidate.webContents.getURL().includes("index.html"),
    );
    mainWindow?.hide();
  });
  await petPage.locator(".pet-shell").click();
  await mainPage.waitForFunction(() => document.hasFocus(), undefined, {
    timeout: 5_000,
  }).catch(() => undefined);
  const mainVisibleAfterPetClick = await electronApp.evaluate(({ BrowserWindow }) => {
    const mainWindow = BrowserWindow.getAllWindows().find((candidate) =>
      candidate.webContents.getURL().includes("index.html"),
    );
    return mainWindow?.isVisible() ?? false;
  });
  if (!mainVisibleAfterPetClick) {
    throw new Error("Pet click did not restore the main window.");
  }

  const hideResult = await mainPage.evaluate(async () => {
    if (!window.jarvis) throw new Error("Jarvis bridge unavailable.");
    return window.jarvis.setDesktopPetEnabled(false);
  });
  if (!hideResult.ok) {
    throw new Error(`Pet hide failed: ${JSON.stringify(hideResult)}`);
  }
  await mainPage.waitForTimeout(500);
  const petCountAfterHide = await electronApp.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows().filter((candidate) =>
      candidate.webContents.getURL().includes("pet.html"),
    ).length,
  );
  if (petCountAfterHide !== 0) {
    throw new Error("Pet window remained after hide.");
  }

  const finalSettings = await mainPage.evaluate(async () => {
    if (!window.jarvis) throw new Error("Jarvis bridge unavailable.");
    return window.jarvis.getDesktopSettings();
  });
  if (finalSettings.desktopPetEnabled !== false) {
    throw new Error("Desktop Pet setting stayed enabled after hide.");
  }

  console.log(
    JSON.stringify({
      status: "PASS",
      desktopPetDefault: "OFF",
      petSurface,
      petBridgeSurface,
      petWindowState,
      movedBounds,
      persistedPosition: settingsAfterMove.desktopPetPosition,
      reducedMotionState,
      mainVisibleAfterPetClick,
      petCountAfterHide,
      desktopPetFinal: "OFF",
    }),
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(userDataDirectory, { force: true, recursive: true });
}
