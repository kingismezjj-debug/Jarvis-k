import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-2d",
  "settings-v2-models-intelligence",
);

const baseEnv = {
  ...process.env,
  JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
  JARVIS_K_ENABLE_SETTINGS_V2: "1",
};

const scenarios = [
  ["signal-models-wide", 1440, 940, "en", "signal", "models_intelligence"],
  ["harbor-models-wide", 1440, 940, "en", "harbor", "models_intelligence"],
  ["ember-models-wide", 1440, 940, "en", "ember", "models_intelligence"],
  ["en-models-narrow", 390, 980, "en", "harbor", "models_intelligence"],
  ["zh-models-narrow", 390, 980, "zh", "harbor", "models_intelligence"],
  ["provider-not-configured", 1440, 940, "en", "harbor", "models_intelligence"],
  ["local-model-missing", 1440, 940, "en", "harbor", "models_intelligence"],
  ["model-operations-entry", 1440, 940, "en", "harbor", "models_intelligence"],
  ["models-search-en", 1440, 940, "en", "harbor", "models_intelligence", "model"],
  ["models-search-zh", 1440, 940, "zh", "harbor", "models_intelligence", "模型"],
  ["search-empty", 1440, 940, "en", "harbor", "models_intelligence", "zz-no-match"],
];

async function seedDesktopSettings(userDataDirectory, { theme }) {
  await writeFile(
    path.join(userDataDirectory, "jarvis-k-desktop-settings.json"),
    JSON.stringify(
      {
        closeButtonBehavior: "minimize_to_tray",
        closeToTrayNoticeShown: true,
        launchAtLoginEnabled: false,
        uiTheme: theme,
        uiThemeExplicitlyConfigured: true,
        desktopPetEnabled: false,
        desktopPetAlwaysOnTop: true,
        desktopPetReducedMotion: "system",
        firstRunOnboardingVersion: 1,
        firstRunOnboardingState: "completed",
        firstRunOnboardingStateChangedAt: "2026-08-29T00:00:00.000Z",
        persistedLocally: true,
        syncedToCloud: false,
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function launchApp({ theme, locale, settingsV2Enabled = true, chromiumArgs = [] }) {
  const tempUserData = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-models-"),
  );
  await seedDesktopSettings(tempUserData, { theme });
  const electronApp = await electron.launch({
    args: [
      ...chromiumArgs,
      `--user-data-dir=${tempUserData}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...baseEnv,
      JARVIS_K_ENABLE_SETTINGS_V2: settingsV2Enabled ? "1" : "0",
      JARVIS_K_USER_DATA_PATH: tempUserData,
      JARVIS_K_LOCAL_DATA_PATH: tempUserData,
      JARVIS_K_MEMORY_DB_PATH: path.join(tempUserData, "memory.sqlite"),
      JARVIS_K_MODEL_DIR: path.join(tempUserData, "models"),
      JARVIS_K_VOICE_REGRESSION_PATH: path.join(
        tempUserData,
        "voice-regression.json",
      ),
    },
  });
  const page = await electronApp.firstWindow();
  await page.addInitScript((language) => {
    window.localStorage.setItem("jarvis-k-ui-language", language);
    window.__jarvisUi2dMediaCalls = 0;
    window.__jarvisUi2dFetchCalls = 0;
    const mediaDevices = navigator.mediaDevices;
    if (mediaDevices?.getUserMedia) {
      const original = mediaDevices.getUserMedia.bind(mediaDevices);
      mediaDevices.getUserMedia = (constraints) => {
        window.__jarvisUi2dMediaCalls += 1;
        return original(constraints);
      };
    }
    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args) => {
      window.__jarvisUi2dFetchCalls += 1;
      return originalFetch(...args);
    };
  }, locale);
  await page.reload();
  return { electronApp, page, tempUserData };
}

async function waitForAppReady(page) {
  await page.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await page.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });
}

async function openSettings(page) {
  await waitForAppReady(page);
  await page.getByTestId("general-settings").click();
  await page.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
}

async function setModelsCategory(page) {
  const navButtons = page.locator('[data-testid="settings-v2-category-nav"] button');
  if ((await navButtons.count()) > 0 && (await navButtons.first().isVisible())) {
    await navButtons.nth(3).click();
  } else {
    await page.locator(".settings-v2-narrow-category select").selectOption("models_intelligence");
  }
  await page.getByTestId("settings-v2-models-intelligence").waitFor({
    timeout: 5_000,
  });
}

async function assertLayout(page, scenarioName, { expectModelsVisible = true } = {}) {
  const result = await page.evaluate(() => {
    const selectors = [
      ".settings-v2-shell",
      ".jk-setting-row",
      ".jk-category-button",
      ".jk-button",
      ".settings-v2-models-status-grid",
    ];
    const clippingCandidates = selectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .filter((element) => element.scrollWidth > element.clientWidth + 1).length;
    const text = document.body.innerText;
    return {
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      clippingCandidates,
      settingsV2Visible: Boolean(document.querySelector(".settings-v2-shell")),
      modelsVisible: Boolean(
        document.querySelector('[data-testid="settings-v2-models-intelligence"]'),
      ),
      searchVisible: Boolean(
        document.querySelector('[data-testid="settings-v2-search-results"]'),
      ),
      forbiddenInternalText:
        /\b(PROTOTYPE DATA|DANGER ZONE|control type|fixture|Evaluation|Cloud Acceptance|acceptance|settingId|capabilityId|profileId|providerId|resourceId)\b/.test(
          text,
        ),
      rawModelPath: /[A-Z]:\\|\/Users\/|node_modules|\.env/.test(text),
      mediaCalls: window.__jarvisUi2dMediaCalls ?? 0,
      fetchCalls: window.__jarvisUi2dFetchCalls ?? 0,
    };
  });
  if (
    result.bodyHorizontalOverflow ||
    result.clippingCandidates > 0 ||
    !result.settingsV2Visible ||
    (expectModelsVisible && !result.modelsVisible) ||
    (!expectModelsVisible && !result.searchVisible) ||
    result.forbiddenInternalText ||
    result.rawModelPath ||
    result.mediaCalls !== 0 ||
    result.fetchCalls !== 0
  ) {
    throw new Error(
      `Settings V2 Models screenshot guard failed for ${scenarioName}: ${JSON.stringify(
        result,
      )}`,
    );
  }
  return result;
}

async function assertThemeScope(page, expectedTheme, scenarioName) {
  const result = await page.evaluate(() => {
    const app = document.querySelector('[data-testid="jarvis-app"]');
    const settings = document.querySelector(".settings-v2-shell");
    return {
      documentTheme: document.documentElement.dataset.jarvisTheme,
      appTheme: app?.getAttribute("data-skin-theme"),
      settingsTheme: settings?.getAttribute("data-jarvis-theme"),
      settingsBackground: settings
        ? getComputedStyle(settings).backgroundColor
        : "",
    };
  });
  if (
    result.documentTheme !== expectedTheme ||
    result.appTheme !== expectedTheme ||
    result.settingsTheme !== expectedTheme
  ) {
    throw new Error(
      `Theme scope guard failed for ${scenarioName}: ${JSON.stringify(result)}`,
    );
  }
  return result;
}

async function captureScenario([
  name,
  width,
  height,
  locale,
  theme,
  category,
  search,
]) {
  const run = await launchApp({ theme, locale });
  try {
    await run.page.setViewportSize({ width, height });
    await openSettings(run.page);
    if (category === "models_intelligence") {
      await setModelsCategory(run.page);
    }
    if (search) {
      await run.page.getByTestId("settings-v2-search").fill(search);
      await run.page.getByTestId("settings-v2-search-results").waitFor();
    } else {
      await run.page.getByText(/No model load|打开本页不会加载/).first().waitFor({
        timeout: 5_000,
      });
    }
    const layout = await assertLayout(run.page, name, {
      expectModelsVisible: !search,
    });
    const themeScope = await assertThemeScope(run.page, theme, name);
    const screenshotPath = path.join(outputDirectory, `${name}.png`);
    await run.page.screenshot({ path: screenshotPath, fullPage: true });
    return { name, path: screenshotPath, layout, themeScope };
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

await mkdir(outputDirectory, { recursive: true });

const screenshots = [];
for (const scenario of scenarios) {
  screenshots.push(await captureScenario(scenario));
}

const zoomed = await launchApp({ theme: "harbor", locale: "en" });
try {
  await zoomed.page.setViewportSize({ width: 780, height: 980 });
  await openSettings(zoomed.page);
  await setModelsCategory(zoomed.page);
  const webContentsZoomFactor = await zoomed.electronApp.evaluate(
    ({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows().find(
        (window) => !window.isDestroyed(),
      );
      mainWindow?.webContents.setZoomFactor(2);
      return mainWindow?.webContents.getZoomFactor() ?? 1;
    },
  );
  const name = "harbor-models-zoom200";
  const layout = await assertLayout(zoomed.page, name);
  const themeScope = await assertThemeScope(zoomed.page, "harbor", name);
  const screenshotPath = path.join(outputDirectory, `${name}.png`);
  await zoomed.page.screenshot({ path: screenshotPath, fullPage: true });
  screenshots.push({
    name,
    path: screenshotPath,
    layout,
    themeScope,
    webContentsZoomFactor,
    devicePixelRatio: await zoomed.page.evaluate(() => window.devicePixelRatio),
  });
} finally {
  await zoomed.electronApp.close();
  await rm(zoomed.tempUserData, { force: true, recursive: true });
}

const gateOff = await launchApp({
  theme: "harbor",
  locale: "en",
  settingsV2Enabled: false,
});
try {
  await gateOff.page.setViewportSize({ width: 1440, height: 940 });
  await waitForAppReady(gateOff.page);
  await gateOff.page.getByTestId("general-settings").click();
  await gateOff.page.getByTestId("settings-view").waitFor({ timeout: 10_000 });
  const settingsV2Count = await gateOff.page.getByTestId("settings-v2-view").count();
  if (settingsV2Count !== 0) {
    throw new Error("Settings V2 mounted while gate was disabled.");
  }
  const screenshotPath = path.join(outputDirectory, "gate-off-legacy-models.png");
  await gateOff.page.screenshot({ path: screenshotPath, fullPage: true });
  screenshots.push({
    name: "gate-off-legacy-models",
    path: screenshotPath,
    settingsV2Count,
    legacyVisible: true,
  });
} finally {
  await gateOff.electronApp.close();
  await rm(gateOff.tempUserData, { force: true, recursive: true });
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      outputDirectory,
      screenshots,
      modelLoadStarted: false,
      modelDownloadStarted: false,
      modelDeleteStarted: false,
      realNetworkRequestSent: false,
      windowsExecutorInvoked: false,
      microphonePermissionPromptShown: false,
    },
    null,
    2,
  ),
);
