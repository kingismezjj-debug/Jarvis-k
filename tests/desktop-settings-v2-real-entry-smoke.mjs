import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-2a",
  "settings-v2-real-entry",
);

async function seedDesktopSettings(userDataDirectory) {
  await writeFile(
    path.join(userDataDirectory, "jarvis-k-desktop-settings.json"),
    JSON.stringify(
      {
        closeButtonBehavior: "minimize_to_tray",
        closeToTrayNoticeShown: true,
        launchAtLoginEnabled: false,
        desktopPetEnabled: false,
        desktopPetAlwaysOnTop: true,
        desktopPetReducedMotion: "system",
        firstRunOnboardingVersion: 1,
        firstRunOnboardingState: "completed",
        firstRunOnboardingStateChangedAt: "2026-08-28T00:00:00.000Z",
        persistedLocally: true,
        syncedToCloud: false,
      },
      null,
      2,
    ),
  );
}

async function launchDesktop({ settingsV2Enabled }) {
  const userDataDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-real-entry-"),
  );
  await seedDesktopSettings(userDataDirectory);
  const electronApp = await electron.launch({
    args: [
      `--user-data-dir=${userDataDirectory}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_ENABLE_SETTINGS_V2: settingsV2Enabled ? "1" : "0",
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
  return { electronApp, userDataDirectory };
}

async function openSettings(window) {
  await window.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });
  await window.getByTestId("general-settings").click();
}

async function countVisibleText(window, text) {
  return window.getByText(text, { exact: false }).count();
}

async function runGateOnScenario() {
  const { electronApp, userDataDirectory } = await launchDesktop({
    settingsV2Enabled: true,
  });
  try {
    const window = await electronApp.firstWindow();
    await window.setViewportSize({ width: 1440, height: 940 });
    const projection = await window.evaluate(() =>
      window.jarvis?.getUiSurfaceCapabilityStatus(),
    );
    await openSettings(window);
    await window.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
    await window.getByText("Jarvis Control Center").waitFor({
      timeout: 5_000,
    });

    const categoryCount = await window
      .locator('[data-testid="settings-v2-category-nav"] button')
      .count();
    const legacyCount = await window.getByTestId("settings-view").count();
    const skinStudioCount = await countVisibleText(window, "Pet Skin Studio");
    const developerNavCount = await window.getByTestId("nav-developer").count();
    const evaluationHiddenCount = await window
      .getByTestId("evaluation-surface-hidden")
      .count();
    if (categoryCount !== 8) {
      throw new Error(`Settings V2 category count mismatch: ${categoryCount}`);
    }
    if (legacyCount !== 0 || skinStudioCount !== 0) {
      throw new Error(
        `Settings V2 mounted with legacy surface present: legacy=${legacyCount} skinStudio=${skinStudioCount}`,
      );
    }
    if (developerNavCount !== 0 || evaluationHiddenCount !== 0) {
      throw new Error("Settings V2 product entry exposed Developer/Evaluation.");
    }
    const screenshotPath = path.join(outputDirectory, "real-settings-v2-gate-on.png");
    await window.screenshot({ path: screenshotPath, fullPage: true });
    return {
      projection,
      screenshotPath,
      categoryCount,
      legacyCount,
      skinStudioCount,
      developerNavCount,
      evaluationHiddenCount,
    };
  } finally {
    await electronApp.close();
    await rm(userDataDirectory, { force: true, recursive: true });
  }
}

async function runGateOffScenario() {
  const { electronApp, userDataDirectory } = await launchDesktop({
    settingsV2Enabled: false,
  });
  try {
    const window = await electronApp.firstWindow();
    await window.setViewportSize({ width: 1440, height: 940 });
    const projection = await window.evaluate(() =>
      window.jarvis?.getUiSurfaceCapabilityStatus(),
    );
    await openSettings(window);
    await window.getByTestId("settings-view").waitFor({ timeout: 10_000 });
    const settingsV2Count = await window.getByTestId("settings-v2-view").count();
    if (settingsV2Count !== 0) {
      throw new Error("Settings V2 mounted while gate was disabled.");
    }
    const screenshotPath = path.join(
      outputDirectory,
      "real-settings-legacy-gate-off.png",
    );
    await window.screenshot({ path: screenshotPath, fullPage: true });
    return {
      projection,
      screenshotPath,
      settingsV2Count,
      legacyVisible: true,
    };
  } finally {
    await electronApp.close();
    await rm(userDataDirectory, { force: true, recursive: true });
  }
}

await mkdir(outputDirectory, { recursive: true });

const gateOn = await runGateOnScenario();
const gateOff = await runGateOffScenario();

console.log(
  JSON.stringify(
    {
      status: "PASS",
      outputDirectory,
      gateOn,
      gateOff,
      realNetworkRequestSent: false,
      windowsExecutorInvoked: false,
    },
    null,
    2,
  ),
);
