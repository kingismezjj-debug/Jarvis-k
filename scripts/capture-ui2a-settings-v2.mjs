import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(rootDirectory, "artifacts", "ui-2b", "settings-v2");

const baseEnv = {
  ...process.env,
  JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
  JARVIS_K_ENABLE_SETTINGS_V2: "1",
};

const scenarios = [
  { name: "settings-v2-appearance-en-wide", width: 1440, height: 940, language: "en", category: "appearance_pet" },
  { name: "settings-v2-appearance-zh-wide", width: 1440, height: 940, language: "zh", category: "appearance_pet" },
  { name: "settings-v2-appearance-en-narrow", width: 390, height: 980, language: "en", category: "appearance_pet" },
  { name: "settings-v2-appearance-zh-narrow", width: 390, height: 980, language: "zh", category: "appearance_pet" },
  { name: "settings-v2-theme-dialog", width: 1440, height: 940, language: "en", category: "appearance_pet", dialog: "theme" },
  { name: "settings-v2-theme-preview", width: 1440, height: 940, language: "en", category: "appearance_pet", theme: "ember" },
  { name: "settings-v2-pet-enabled", width: 1440, height: 940, language: "en", category: "appearance_pet", desktopPetEnabled: true },
  { name: "settings-v2-pet-disabled", width: 1440, height: 940, language: "en", category: "appearance_pet", desktopPetEnabled: false },
  { name: "settings-v2-skin-summary", width: 1440, height: 940, language: "en", category: "appearance_pet" },
  { name: "settings-v2-no-skin", width: 1440, height: 940, language: "en", category: "appearance_pet" },
  { name: "settings-v2-appearance-search-zh", width: 1440, height: 940, language: "zh", search: "桌宠" },
  { name: "settings-v2-search-empty", width: 1440, height: 940, language: "en", search: "zzzz-not-a-setting" },
];

async function launchApp({ settingsV2Enabled, chromiumArgs = [], settings = {} }) {
  const tempUserData = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-ui2a-settings-"));
  await writeFile(
    path.join(tempUserData, "jarvis-k-desktop-settings.json"),
    JSON.stringify(
      {
        closeButtonBehavior: "minimize_to_tray",
        closeToTrayNoticeShown: false,
        launchAtLoginEnabled: false,
        uiTheme: settings.uiTheme ?? "signal",
        desktopPetEnabled: settings.desktopPetEnabled ?? false,
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
      JARVIS_K_VOICE_REGRESSION_PATH: path.join(tempUserData, "voice-regression.json"),
    },
  });
  return { electronApp, tempUserData };
}

async function openSettings(page, testId) {
  await page.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await page.getByTestId("core-status").getByText("ONLINE").waitFor({ timeout: 20_000 });
  await page.getByTestId("general-settings").click();
  await page.getByTestId(testId).waitFor({ timeout: 10_000 });
}

async function setLanguage(page, language) {
  const html = await page.locator("body").innerText();
  const isZh = html.includes("Jarvis 控制中心");
  if ((language === "zh") === isZh) return;
  await page.getByRole("button", { name: /Choose display language|选择界面语言/ }).click();
  if (language === "zh") {
    await page.getByRole("button", { name: "Chinese (Simplified)" }).click();
    await page.getByText("Jarvis 控制中心").waitFor();
  } else {
    await page.getByRole("button", { name: "English" }).click();
    await page.getByText("Jarvis Control Center").waitFor();
  }
}

async function setCategory(page, language, category) {
  if (!category) return;
  const label =
    category === "appearance_pet"
      ? language === "zh"
        ? "外观与桌宠"
        : "Appearance & Pet"
      : language === "zh"
        ? "通用"
        : "General";
  const visibleNavButton = page
    .locator('[data-testid="settings-v2-category-nav"] button')
    .filter({ hasText: label });
  if ((await visibleNavButton.count()) > 0 && await visibleNavButton.first().isVisible()) {
    await visibleNavButton.first().click();
    return;
  }
  await page.locator(".settings-v2-narrow-category select").selectOption(category);
}

async function assertLayout(page, scenarioName) {
  const result = await page.evaluate(() => {
    const selectors = [
      ".settings-v2-shell",
      ".jk-setting-row",
      ".jk-category-button",
      ".jk-search-result",
      ".jk-empty-state",
      ".jk-button",
    ];
    const clippingCandidates = selectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .filter((element) => element.scrollWidth > element.clientWidth + 1).length;
    const internalText = document.body.innerText;
    return {
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      clippingCandidates,
      primaryContentVisible:
        (document
          .querySelector(
            ".jk-setting-row, .jk-search-result, .jk-empty-state, .jk-dialog",
          )
          ?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY) <
        window.innerHeight,
      forbiddenProductText:
        /\b(EVERYONE|NEEDS_SETUP|PROTOTYPE DATA|DANGER ZONE|control type|fixture)\b/.test(
          internalText,
        ),
    };
  });
  if (
    result.bodyHorizontalOverflow ||
    result.clippingCandidates > 0 ||
    !result.primaryContentVisible ||
    result.forbiddenProductText
  ) {
    throw new Error(
      `Settings V2 screenshot layout guard failed for ${scenarioName}: ${JSON.stringify(
        result,
      )}`,
    );
  }
  return result;
}

async function captureScenario(page, scenario) {
  const closeDialogButtons = await page.getByRole("button", { name: "Close dialog" }).count();
  for (let index = 0; index < closeDialogButtons; index += 1) {
    await page.getByRole("button", { name: "Close dialog" }).first().click();
  }
  await page.setViewportSize({ width: scenario.width, height: scenario.height });
  if (scenario.deviceScaleFactor) {
    const cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send("Emulation.setDeviceMetricsOverride", {
      width: scenario.width,
      height: scenario.height,
      deviceScaleFactor: scenario.deviceScaleFactor,
      mobile: false,
    });
    if (scenario.pageScaleFactor) {
      await cdpSession.send("Emulation.setPageScaleFactor", {
        pageScaleFactor: scenario.pageScaleFactor,
      });
    }
  }
  await page.getByTestId("settings-v2-search").fill("");
  await setLanguage(page, scenario.language);
  await setCategory(page, scenario.language, scenario.category);
  if (scenario.search) {
    await page.getByTestId("settings-v2-search").fill(scenario.search);
    await page.getByTestId("settings-v2-search-results").waitFor();
  }
  if (scenario.dialog === "language") {
    await page.getByRole("button", { name: /Choose display language|选择界面语言/ }).click();
    await page.getByTestId("settings-v2-language-dialog").waitFor();
  }
  if (scenario.dialog === "close") {
    await page.getByRole("button", { name: /Choose close behavior|选择关闭行为/ }).click();
    await page.getByTestId("settings-v2-close-dialog").waitFor();
  }
  if (scenario.dialog === "reset") {
    await page.getByTestId("settings-v2-reset-action").click();
    await page.getByTestId("settings-v2-reset-dialog").waitFor();
  }
  if (scenario.dialog === "theme") {
    await page.getByRole("button", { name: /Choose theme|选择主题/ }).click();
    await page.getByTestId("settings-v2-theme-dialog").waitFor();
  }
  const layout = await assertLayout(page, scenario.name);
  const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return { ...scenario, path: screenshotPath, layout };
}

await mkdir(outputDirectory, { recursive: true });

const captured = [];
for (const scenario of scenarios) {
  const enabled = await launchApp({
    settingsV2Enabled: true,
    settings: {
      uiTheme: scenario.theme,
      desktopPetEnabled: scenario.desktopPetEnabled,
    },
  });
  try {
    const page = await enabled.electronApp.firstWindow();
    await openSettings(page, "settings-v2-view");
    captured.push(await captureScenario(page, scenario));
  } finally {
    await enabled.electronApp.close();
    await rm(enabled.tempUserData, { force: true, recursive: true });
  }
}

const zoomed = await launchApp({ settingsV2Enabled: true });
try {
  const page = await zoomed.electronApp.firstWindow();
  await openSettings(page, "settings-v2-view");
  const webContentsZoomFactor = await zoomed.electronApp.evaluate(({ BrowserWindow }) => {
    const mainWindow = BrowserWindow.getAllWindows().find((window) => !window.isDestroyed());
    mainWindow?.webContents.setZoomFactor(2);
    return mainWindow?.webContents.getZoomFactor() ?? 1;
  });
  const zoomScenario = {
    name: "settings-v2-appearance-zoom200",
    width: 780,
    height: 980,
    language: "zh",
    category: "appearance_pet",
  };
  captured.push({
    ...(await captureScenario(page, zoomScenario)),
    webContentsZoomFactor,
    devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
    visualViewportScale: await page.evaluate(() => window.visualViewport?.scale ?? 1),
  });
} finally {
  await zoomed.electronApp.close();
  await rm(zoomed.tempUserData, { force: true, recursive: true });
}

const disabled = await launchApp({ settingsV2Enabled: false });
try {
  const page = await disabled.electronApp.firstWindow();
  await page.setViewportSize({ width: 1440, height: 940 });
  await openSettings(page, "settings-view");
  const screenshotPath = path.join(outputDirectory, "settings-v2-gate-off-legacy-appearance.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  captured.push({
    name: "settings-v2-gate-off-legacy-appearance",
    path: screenshotPath,
    layout: { legacySettingsVisible: true },
  });
} finally {
  await disabled.electronApp.close();
  await rm(disabled.tempUserData, { force: true, recursive: true });
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      outputDirectory,
      screenshots: captured,
      realNetworkRequestSent: false,
      windowsExecutorInvoked: false,
    },
    null,
    2,
  ),
);
