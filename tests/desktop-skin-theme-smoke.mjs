import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-skin-theme-smoke.png",
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-skin-theme-smoke-metrics.json",
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-skin-theme-"),
);
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const taskDatabasePath = path.join(smokeUserDataDirectory, "tasks.sqlite");
let electronApp;

async function launchApp() {
  return electron.launch({
    args: [
      `--user-data-dir=${smokeUserDataDirectory}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
      JARVIS_K_MODEL_DIR: path.join(smokeUserDataDirectory, "models"),
      JARVIS_K_TASK_DB_PATH: taskDatabasePath,
    },
  });
}

async function waitForReady(window) {
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });
}

async function assertTheme(window, expectedTheme) {
  await window.getByTestId("jarvis-app").evaluate(
    (node, theme) => {
      if (node.getAttribute("data-skin-theme") !== theme) {
        throw new Error(`Expected app theme ${theme}.`);
      }
      if (document.documentElement.dataset.jarvisTheme !== theme) {
        throw new Error(`Expected document theme ${theme}.`);
      }
    },
    expectedTheme,
  );
}

try {
  await mkdir(artifactsDirectory, { recursive: true });

  electronApp = await launchApp();
  let window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await waitForReady(window);

  await window.getByTestId("general-settings").click();
  await window.getByTestId("settings-view").waitFor({ timeout: 5_000 });
  await window.getByTestId("skin-theme-settings").waitFor({ timeout: 5_000 });
  await assertTheme(window, "signal");

  await window.getByTestId("skin-theme-harbor").click();
  await assertTheme(window, "harbor");
  await window
    .getByTestId("skin-theme-current")
    .getByText("Harbor")
    .waitFor({ timeout: 5_000 });
  const storedHarborSettings = await window.evaluate(async () => {
    if (!window.jarvis) throw new Error("Desktop bridge unavailable.");
    return window.jarvis.getDesktopSettings();
  });
  if (
    storedHarborSettings.uiTheme !== "harbor" ||
    storedHarborSettings.uiThemeExplicitlyConfigured !== true
  ) {
    throw new Error("Harbor theme was not persisted to Desktop Settings.");
  }

  await window.screenshot({ path: screenshotPath, fullPage: true });
  await electronApp.close();
  electronApp = undefined;

  electronApp = await launchApp();
  window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await waitForReady(window);
  await assertTheme(window, "harbor");
  const persistedAfterRestart = await window.evaluate(async () => {
    if (!window.jarvis) throw new Error("Desktop bridge unavailable.");
    return window.jarvis.getDesktopSettings();
  });

  await window.evaluate(() => {
    window.localStorage.setItem("jarvis-k-ui-theme", "external-script-theme");
  });
  await window.reload();
  await waitForReady(window);
  await assertTheme(window, "harbor");
  const storedAfterInvalidRecovery = await window.evaluate(() =>
    window.localStorage.getItem("jarvis-k-ui-theme"),
  );

  const metrics = {
    status: "PASS",
    defaultTheme: "signal",
    selectedTheme: "harbor",
    persistedAfterRestart: persistedAfterRestart.uiTheme,
    recoveredThemeAfterInvalidStorage: "harbor",
    invalidStoredThemeIgnored: storedAfterInvalidRecovery === "external-script-theme",
    executableSkinCodeLoaded: false,
    externalSkinUrlLoaded: false,
    screenshotPath,
  };
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);
  console.log(JSON.stringify({ ...metrics, metricsPath }));
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
