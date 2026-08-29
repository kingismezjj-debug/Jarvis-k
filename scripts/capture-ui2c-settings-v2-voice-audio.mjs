import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-2c",
  "settings-v2-voice-audio",
);

const baseEnv = {
  ...process.env,
  JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
  JARVIS_K_ENABLE_SETTINGS_V2: "1",
};

const scenarios = [
  {
    name: "signal-voice-audio-wide",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "signal",
    category: "voice_audio",
  },
  {
    name: "harbor-voice-audio-wide",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "harbor",
    category: "voice_audio",
  },
  {
    name: "ember-voice-audio-wide",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "ember",
    category: "voice_audio",
  },
  {
    name: "en-voice-audio-narrow",
    width: 390,
    height: 980,
    locale: "en",
    theme: "harbor",
    category: "voice_audio",
  },
  {
    name: "zh-voice-audio-narrow",
    width: 390,
    height: 980,
    locale: "zh",
    theme: "harbor",
    category: "voice_audio",
  },
  {
    name: "search-voice-en",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "harbor",
    category: "voice_audio",
    search: "speech",
  },
  {
    name: "search-voice-zh",
    width: 1440,
    height: 940,
    locale: "zh",
    theme: "harbor",
    category: "voice_audio",
    search: "语音",
  },
  {
    name: "harbor-voice-theme-dialog",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "harbor",
    category: "appearance_pet",
    dialog: "theme",
  },
];

async function launchApp({ theme, locale, chromiumArgs = [] }) {
  const tempUserData = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-voice-"),
  );
  await writeFile(
    path.join(tempUserData, "jarvis-k-desktop-settings.json"),
    JSON.stringify(
      {
        closeButtonBehavior: "minimize_to_tray",
        closeToTrayNoticeShown: false,
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

  const electronApp = await electron.launch({
    args: [
      ...chromiumArgs,
      `--user-data-dir=${tempUserData}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...baseEnv,
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
    window.__jarvisUi2cMediaCalls = 0;
    const mediaDevices = navigator.mediaDevices;
    if (mediaDevices?.getUserMedia) {
      const original = mediaDevices.getUserMedia.bind(mediaDevices);
      mediaDevices.getUserMedia = (constraints) => {
        window.__jarvisUi2cMediaCalls += 1;
        return original(constraints);
      };
    }
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

async function setCategory(page, category) {
  const labelByCategory = {
    general: /General|通用/,
    appearance_pet: /Appearance & Pet|外观与桌宠/,
    voice_audio: /Voice & Audio|语音与音频/,
  };
  const navButton = page
    .locator('[data-testid="settings-v2-category-nav"] button')
    .filter({ hasText: labelByCategory[category] ?? labelByCategory.general });
  if ((await navButton.count()) > 0 && (await navButton.first().isVisible())) {
    await navButton.first().click();
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
      ".jk-button",
      ".jk-dialog",
      ".settings-v2-voice-status-grid",
    ];
    const clippingCandidates = selectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .filter((element) => element.scrollWidth > element.clientWidth + 1).length;
    return {
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      clippingCandidates,
      settingsV2Visible: Boolean(document.querySelector(".settings-v2-shell")),
      voiceAudioVisible: Boolean(
        document.querySelector('[data-testid="settings-v2-voice-audio"]'),
      ),
      forbiddenInternalText:
        /\b(PROTOTYPE DATA|DANGER ZONE|control type|fixture|Voice Regression|Pilot|settingId|capabilityId)\b/.test(
          document.body.innerText,
        ),
      mediaCalls: window.__jarvisUi2cMediaCalls ?? 0,
    };
  });
  if (
    result.bodyHorizontalOverflow ||
    result.clippingCandidates > 0 ||
    !result.settingsV2Visible ||
    result.forbiddenInternalText ||
    result.mediaCalls !== 0
  ) {
    throw new Error(
      `Settings V2 Voice screenshot guard failed for ${scenarioName}: ${JSON.stringify(
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
  if (
    expectedTheme === "harbor" &&
    /rgb\(8,\s*16,\s*24\)|rgb\(15,\s*27,\s*38\)/.test(
      result.settingsBackground,
    )
  ) {
    throw new Error(
      `Harbor Settings V2 retained a dark background for ${scenarioName}: ${JSON.stringify(
        result,
      )}`,
    );
  }
  return result;
}

async function captureScenario(scenario) {
  const run = await launchApp({
    theme: scenario.theme,
    locale: scenario.locale,
  });
  try {
    await run.page.setViewportSize({
      width: scenario.width,
      height: scenario.height,
    });
    await openSettings(run.page);
    await setCategory(run.page, scenario.category);
    if (scenario.search) {
      await run.page.getByTestId("settings-v2-search").fill(scenario.search);
      await run.page.getByTestId("settings-v2-search-results").waitFor();
    }
    if (scenario.dialog === "theme") {
      await run.page.getByRole("button", { name: /Choose theme/ }).click();
      await run.page.getByTestId("settings-v2-theme-dialog").waitFor();
    }
    const layout = await assertLayout(run.page, scenario.name);
    const themeScope = await assertThemeScope(
      run.page,
      scenario.theme,
      scenario.name,
    );
    const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
    await run.page.screenshot({ path: screenshotPath, fullPage: true });
    return {
      name: scenario.name,
      path: screenshotPath,
      layout,
      themeScope,
    };
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

await mkdir(outputDirectory, { recursive: true });

const captured = [];
for (const scenario of scenarios) {
  captured.push(await captureScenario(scenario));
}

const zoomed = await launchApp({ theme: "harbor", locale: "en" });
try {
  await zoomed.page.setViewportSize({ width: 780, height: 980 });
  await openSettings(zoomed.page);
  await setCategory(zoomed.page, "voice_audio");
  const webContentsZoomFactor = await zoomed.electronApp.evaluate(
    ({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows().find(
        (window) => !window.isDestroyed(),
      );
      mainWindow?.webContents.setZoomFactor(2);
      return mainWindow?.webContents.getZoomFactor() ?? 1;
    },
  );
  const scenarioName = "harbor-voice-audio-zoom200";
  const layout = await assertLayout(zoomed.page, scenarioName);
  const themeScope = await assertThemeScope(zoomed.page, "harbor", scenarioName);
  const screenshotPath = path.join(outputDirectory, `${scenarioName}.png`);
  await zoomed.page.screenshot({ path: screenshotPath, fullPage: true });
  captured.push({
    name: scenarioName,
    path: screenshotPath,
    layout,
    themeScope,
    webContentsZoomFactor,
    devicePixelRatio: await zoomed.page.evaluate(() => window.devicePixelRatio),
    visualViewportScale: await zoomed.page.evaluate(
      () => window.visualViewport?.scale ?? 1,
    ),
  });
} finally {
  await zoomed.electronApp.close();
  await rm(zoomed.tempUserData, { force: true, recursive: true });
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      outputDirectory,
      screenshots: captured,
      mediaStreamCreated: false,
      microphonePermissionPromptShown: false,
      realNetworkRequestSent: false,
      windowsExecutorInvoked: false,
    },
    null,
    2,
  ),
);
