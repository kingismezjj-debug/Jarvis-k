import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-2b",
  "settings-v2-theme-fix",
);

const baseEnv = {
  ...process.env,
  JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
};

const scenarios = [
  {
    name: "signal-shell-settings-v2",
    width: 1440,
    height: 940,
    category: "general",
    theme: "signal",
  },
  {
    name: "harbor-shell-settings-v2",
    width: 1440,
    height: 940,
    category: "general",
    theme: "harbor",
  },
  {
    name: "ember-shell-settings-v2",
    width: 1440,
    height: 940,
    category: "general",
    theme: "ember",
  },
  {
    name: "harbor-theme-dialog",
    width: 1440,
    height: 940,
    category: "appearance_pet",
    theme: "harbor",
    dialog: "theme",
  },
  {
    name: "harbor-narrow",
    width: 390,
    height: 980,
    category: "general",
    theme: "harbor",
  },
  {
    name: "migrated-legacy-harbor-v2",
    width: 1440,
    height: 940,
    category: "general",
    theme: "signal",
    uiThemeExplicitlyConfigured: false,
    legacyTheme: "harbor",
  },
];

async function launchApp({ settingsV2Enabled, chromiumArgs = [], settings = {} }) {
  const tempUserData = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-theme-"),
  );
  await writeFile(
    path.join(tempUserData, "jarvis-k-desktop-settings.json"),
    JSON.stringify(
      {
        closeButtonBehavior: "minimize_to_tray",
        closeToTrayNoticeShown: false,
        launchAtLoginEnabled: false,
        uiTheme: settings.uiTheme ?? "signal",
        uiThemeExplicitlyConfigured:
          settings.uiThemeExplicitlyConfigured ??
          settings.uiTheme !== undefined,
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
  return { electronApp, tempUserData };
}

async function waitForAppReady(page) {
  await page.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await page.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });
}

async function openSettings(page, testId) {
  await waitForAppReady(page);
  await page.getByTestId("general-settings").click();
  await page.getByTestId(testId).waitFor({ timeout: 10_000 });
}

async function setCategory(page, category) {
  if (!category || category === "general") return;
  const navButton = page
    .locator('[data-testid="settings-v2-category-nav"] button')
    .filter({ hasText: category === "appearance_pet" ? "Appearance & Pet" : "General" });
  if ((await navButton.count()) > 0 && (await navButton.first().isVisible())) {
    await navButton.first().click();
    return;
  }
  await page.locator(".settings-v2-narrow-category select").selectOption(category);
}

async function seedLegacyThemeAndReload(page, legacyTheme) {
  if (!legacyTheme) return;
  await page.evaluate((theme) => {
    window.localStorage.setItem("jarvis-k-ui-theme", theme);
  }, legacyTheme);
  await page.reload();
  await openSettings(page, "settings-v2-view");
  await page.waitForFunction(
    () => document.documentElement.dataset.jarvisTheme === "harbor",
    undefined,
    { timeout: 5_000 },
  );
}

async function assertThemeScope(page, expectedTheme, scenarioName) {
  const result = await page.evaluate(() => {
    const app = document.querySelector('[data-testid="jarvis-app"]');
    const settings = document.querySelector(".settings-v2-shell");
    return {
      documentTheme: document.documentElement.dataset.jarvisTheme,
      appTheme: app?.getAttribute("data-skin-theme"),
      settingsTheme: settings?.getAttribute("data-jarvis-theme"),
      bodyBackground: getComputedStyle(document.body).backgroundColor,
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

async function assertLayout(page, scenarioName) {
  const result = await page.evaluate(() => {
    const selectors = [
      ".settings-v2-shell",
      ".jk-setting-row",
      ".jk-category-button",
      ".jk-button",
      ".jk-dialog",
    ];
    const clippingCandidates = selectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .filter((element) => element.scrollWidth > element.clientWidth + 1).length;
    return {
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      clippingCandidates,
      settingsV2Visible: Boolean(document.querySelector(".settings-v2-shell")),
      forbiddenInternalText:
        /\b(PROTOTYPE DATA|DANGER ZONE|control type|fixture)\b/.test(
          document.body.innerText,
        ),
    };
  });
  if (
    result.bodyHorizontalOverflow ||
    result.clippingCandidates > 0 ||
    !result.settingsV2Visible ||
    result.forbiddenInternalText
  ) {
    throw new Error(
      `Settings V2 screenshot guard failed for ${scenarioName}: ${JSON.stringify(
        result,
      )}`,
    );
  }
  return result;
}

async function captureScenario(page, scenario) {
  await page.setViewportSize({ width: scenario.width, height: scenario.height });
  await setCategory(page, scenario.category);
  if (scenario.dialog === "theme") {
    await page.getByRole("button", { name: /Choose theme/ }).click();
    await page.getByTestId("settings-v2-theme-dialog").waitFor();
  }
  const expectedTheme = scenario.legacyTheme ?? scenario.theme;
  const layout = await assertLayout(page, scenario.name);
  const themeScope = await assertThemeScope(page, expectedTheme, scenario.name);
  const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return {
    name: scenario.name,
    path: screenshotPath,
    layout,
    themeScope,
  };
}

await mkdir(outputDirectory, { recursive: true });

const captured = [];
for (const scenario of scenarios) {
  const run = await launchApp({
    settingsV2Enabled: true,
    settings: {
      uiTheme: scenario.theme,
      uiThemeExplicitlyConfigured: scenario.uiThemeExplicitlyConfigured,
    },
  });
  try {
    const page = await run.electronApp.firstWindow();
    await openSettings(page, "settings-v2-view");
    await seedLegacyThemeAndReload(page, scenario.legacyTheme);
    captured.push(await captureScenario(page, scenario));
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

const zoomed = await launchApp({
  settingsV2Enabled: true,
  settings: { uiTheme: "harbor", uiThemeExplicitlyConfigured: true },
});
try {
  const page = await zoomed.electronApp.firstWindow();
  await openSettings(page, "settings-v2-view");
  const webContentsZoomFactor = await zoomed.electronApp.evaluate(
    ({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows().find(
        (window) => !window.isDestroyed(),
      );
      mainWindow?.webContents.setZoomFactor(2);
      return mainWindow?.webContents.getZoomFactor() ?? 1;
    },
  );
  captured.push({
    ...(await captureScenario(page, {
      name: "harbor-zoom200",
      width: 780,
      height: 980,
      category: "general",
      theme: "harbor",
    })),
    webContentsZoomFactor,
    devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
    visualViewportScale: await page.evaluate(
      () => window.visualViewport?.scale ?? 1,
    ),
  });
} finally {
  await zoomed.electronApp.close();
  await rm(zoomed.tempUserData, { force: true, recursive: true });
}

const disabled = await launchApp({
  settingsV2Enabled: false,
  settings: { uiTheme: "harbor", uiThemeExplicitlyConfigured: true },
});
try {
  const page = await disabled.electronApp.firstWindow();
  await page.setViewportSize({ width: 1440, height: 940 });
  await openSettings(page, "settings-view");
  const legacyTheme = await page.getByTestId("jarvis-app").evaluate((node) => ({
    appTheme: node.getAttribute("data-skin-theme"),
    documentTheme: document.documentElement.dataset.jarvisTheme,
  }));
  if (
    legacyTheme.appTheme !== "harbor" ||
    legacyTheme.documentTheme !== "harbor"
  ) {
    throw new Error(
      `Legacy gate-off theme guard failed: ${JSON.stringify(legacyTheme)}`,
    );
  }
  const screenshotPath = path.join(outputDirectory, "legacy-harbor-gate-off.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  captured.push({
    name: "legacy-harbor-gate-off",
    path: screenshotPath,
    layout: { legacySettingsVisible: true },
    themeScope: legacyTheme,
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
