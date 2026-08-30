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
        uiTheme: "signal",
        uiThemeExplicitlyConfigured: true,
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

async function launchDesktop({ settingsV2EnvValue }) {
  const userDataDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-real-entry-"),
  );
  await seedDesktopSettings(userDataDirectory);
  const env = {
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
  };
  delete env.JARVIS_K_ENABLE_SETTINGS_V2;
  if (settingsV2EnvValue !== undefined) {
    env.JARVIS_K_ENABLE_SETTINGS_V2 = settingsV2EnvValue;
  }
  const electronApp = await electron.launch({
    args: [
      `--user-data-dir=${userDataDirectory}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env,
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
    settingsV2EnvValue: undefined,
  });
  try {
    const window = await electronApp.firstWindow();
    await window.addInitScript(() => {
      window.__jarvisSettingsV2MediaCalls = 0;
      window.__jarvisSettingsV2FetchCalls = 0;
      const mediaDevices = navigator.mediaDevices;
      if (mediaDevices?.getUserMedia) {
        const original = mediaDevices.getUserMedia.bind(mediaDevices);
        mediaDevices.getUserMedia = (constraints) => {
          window.__jarvisSettingsV2MediaCalls += 1;
          return original(constraints);
        };
      }
      const originalFetch = window.fetch.bind(window);
      window.fetch = (...args) => {
        window.__jarvisSettingsV2FetchCalls += 1;
        return originalFetch(...args);
      };
    });
    await window.reload();
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
    await window
      .locator('[data-testid="settings-v2-category-nav"] button')
      .filter({ hasText: "Appearance & Pet" })
      .click();
    await window.getByTestId("settings-v2-appearance-pet").waitFor({
      timeout: 5_000,
    });
    await window.getByText("Interface theme").waitFor({ timeout: 5_000 });
    await window.getByText("Show Desktop Pet").waitFor({ timeout: 5_000 });
    await window
      .locator('[data-testid="settings-v2-category-nav"] button')
      .filter({ hasText: "Voice & Audio" })
      .click();
    await window.getByTestId("settings-v2-voice-audio").waitFor({
      timeout: 5_000,
    });
    await window.getByText("Speech recognition service").waitFor({
      timeout: 5_000,
    });
    await window.getByText("Not configured").first().waitFor({
      timeout: 5_000,
    });
    await window.getByRole("heading", { name: "Wake word" }).waitFor({
      timeout: 5_000,
    });
    await window
      .locator('[data-testid="settings-v2-category-nav"] button')
      .filter({ hasText: "Models & Intelligence" })
      .click();
    await window.getByTestId("settings-v2-models-intelligence").waitFor({
      timeout: 5_000,
    });
    await window.getByRole("heading", { name: "Fast command understanding" }).waitFor({
      timeout: 5_000,
    });
    await window.getByText("Online answer service", { exact: true }).waitFor({
      timeout: 5_000,
    });
    await window.getByRole("heading", { name: "Local models" }).waitFor({
      timeout: 5_000,
    });
    await window
      .getByText(
        "Opening this page does not connect online services or load, download, or delete models.",
        { exact: true },
      )
      .waitFor({
        timeout: 5_000,
      });
    await window
      .locator('[data-testid="settings-v2-category-nav"] button')
      .filter({ hasText: "Tools & Plugins" })
      .click();
    await window.getByTestId("settings-v2-tools-plugins").waitFor({
      timeout: 5_000,
    });
    await window.getByText("Automation safeguards").waitFor({
      timeout: 5_000,
    });
    await window
      .getByTestId("settings-v2-tools-section-plugins")
      .getByRole("heading", { name: "Plugins" })
      .waitFor({
        timeout: 5_000,
      });
    await window
      .getByTestId("settings-v2-tools-section-mcp")
      .getByRole("heading", { name: "External tool connections" })
      .waitFor({
      timeout: 5_000,
      });
    await window
      .getByText(
        "Opening or viewing this page does not run tools, launch apps, open websites, search files, invoke plugins, or connect external tools. Some plugins and external tools may use non-local connections only after separate setup and confirmation.",
        { exact: true },
      )
      .waitFor({
        timeout: 5_000,
      });
    await window
      .locator('[data-testid="settings-v2-category-nav"] button')
      .filter({ hasText: "Memory & Privacy" })
      .click();
    await window.getByTestId("settings-v2-memory-privacy").waitFor({
      timeout: 5_000,
    });
    const memorySection = window.getByTestId("settings-v2-memory-privacy");
    await memorySection.getByText("Personal memory features").waitFor({
      timeout: 5_000,
    });
    await memorySection
      .locator(".jk-setting-title")
      .filter({ hasText: "Manage saved information" })
      .waitFor({
        timeout: 5_000,
      });
    await memorySection
      .locator(".jk-value-action")
      .filter({ hasText: "Manage" })
      .waitFor({
        timeout: 5_000,
      });
    await memorySection
      .getByText(
        "Opening this page does not read full conversation content, call a model, connect to online services, or start the microphone.",
        { exact: true },
      )
      .waitFor({
        timeout: 5_000,
      });
    const mediaCalls = await window.evaluate(
      () => window.__jarvisSettingsV2MediaCalls ?? 0,
    );
    const fetchCalls = await window.evaluate(
      () => window.__jarvisSettingsV2FetchCalls ?? 0,
    );
    const legacyCount = await window.getByTestId("settings-view").count();
    const skinStudioCount = await countVisibleText(window, "Pet Skin Studio");
    const voiceRegressionCount = await countVisibleText(window, "Voice Regression");
    const pilotCount = await countVisibleText(window, "Pilot");
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
    if (voiceRegressionCount !== 0 || pilotCount !== 0) {
      throw new Error(
        `Settings V2 Voice & Audio exposed evaluation text: voiceRegression=${voiceRegressionCount} pilot=${pilotCount}`,
      );
    }
    if (developerNavCount !== 0 || evaluationHiddenCount !== 0) {
      throw new Error("Settings V2 product entry exposed Developer/Evaluation.");
    }
    if (mediaCalls !== 0) {
      throw new Error(`Settings V2 started media capture: ${mediaCalls}`);
    }
    if (fetchCalls !== 0) {
      throw new Error(`Settings V2 made renderer network requests: ${fetchCalls}`);
    }
    if (projection.reasonCode !== "development_default_enabled") {
      throw new Error(
        `Settings V2 default-on reason mismatch: ${projection.reasonCode}`,
      );
    }
    if (projection.settingsV2EnvRequested !== false) {
      throw new Error("Settings V2 default-on was reported as an env request.");
    }
    const screenshotPath = path.join(
      outputDirectory,
      "real-settings-v2-development-default-on.png",
    );
    await window.screenshot({ path: screenshotPath, fullPage: true });
    return {
      projection,
      screenshotPath,
      categoryCount,
      legacyCount,
      skinStudioCount,
      voiceRegressionCount,
      pilotCount,
      developerNavCount,
      evaluationHiddenCount,
      mediaCalls,
      fetchCalls,
    };
  } finally {
    await electronApp.close();
    await rm(userDataDirectory, { force: true, recursive: true });
  }
}

async function runGateOffScenario() {
  const { electronApp, userDataDirectory } = await launchDesktop({
    settingsV2EnvValue: "0",
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
    if (projection.reasonCode !== "flag_disabled") {
      throw new Error(
        `Settings V2 explicit-off reason mismatch: ${projection.reasonCode}`,
      );
    }
    if (projection.settingsV2ReleaseAllowed !== true) {
      throw new Error("Settings V2 explicit-off did not run in development.");
    }
    const screenshotPath = path.join(
      outputDirectory,
      "real-settings-legacy-explicit-off.png",
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
