import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-3e",
  "settings-v2-product-cleanup",
);

const sideEffectKeys = [
  "fetchCalls",
  "realNetworkRequestSent",
  "mediaCalls",
  "notificationShowCalls",
  "clipboardWriteCalls",
  "modelProviderCalls",
  "taskBackgroundCalls",
  "pluginMcpCalls",
  "appBrowserFileCalls",
  "updaterCalls",
  "externalUrlCalls",
  "windowsExecutorCalls",
];

const scenarios = [
  ["signal-settings-clean-wide", 1440, 940, "en", "signal", "general"],
  ["harbor-settings-clean-wide", 1440, 940, "en", "harbor", "general"],
  ["zh-settings-clean-wide", 1440, 940, "zh", "harbor", "general"],
  ["en-settings-clean-narrow-top", 390, 980, "en", "harbor", "general"],
  ["zh-settings-clean-narrow-top", 390, 980, "zh", "harbor", "general"],
  ["reset-search-empty-en", 1440, 940, "en", "harbor", "search-reset"],
  ["reset-search-empty-zh", 1440, 940, "zh", "harbor", "search-reset"],
  ["preview-search-empty-en", 1440, 940, "en", "harbor", "search-preview"],
  ["classic-settings-entry-en", 1440, 940, "en", "harbor", "classic-entry"],
  ["classic-settings-entry-zh", 1440, 940, "zh", "harbor", "classic-entry"],
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
        firstRunOnboardingStateChangedAt: "2026-08-30T00:00:00.000Z",
        persistedLocally: true,
        syncedToCloud: false,
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function launchApp({ theme, locale, settingsV2Enabled = true }) {
  const tempUserData = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-product-cleanup-"),
  );
  await seedDesktopSettings(tempUserData, { theme });
  const electronApp = await electron.launch({
    args: [`--user-data-dir=${tempUserData}`, rootDirectory],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
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
  await page.addInitScript(
    ({ language, keys }) => {
      window.localStorage.setItem("jarvis-k-ui-language", language);
      window.__jarvisUi3eSideEffects = Object.fromEntries(
        keys.map((key) => [key, 0]),
      );
      const mark = (key) => {
        window.__jarvisUi3eSideEffects[key] =
          (window.__jarvisUi3eSideEffects[key] ?? 0) + 1;
      };
      const originalFetch = window.fetch.bind(window);
      window.fetch = (...args) => {
        mark("fetchCalls");
        mark("realNetworkRequestSent");
        return originalFetch(...args);
      };
      if (navigator.mediaDevices?.getUserMedia) {
        const originalGetUserMedia =
          navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = (...args) => {
          mark("mediaCalls");
          return originalGetUserMedia(...args);
        };
      }
      if (navigator.clipboard?.writeText) {
        const originalWriteText = navigator.clipboard.writeText.bind(
          navigator.clipboard,
        );
        navigator.clipboard.writeText = (...args) => {
          mark("clipboardWriteCalls");
          return originalWriteText(...args);
        };
      }
      try {
        const OriginalNotification = window.Notification;
        if (OriginalNotification) {
          const WrappedNotification = function WrappedNotification(...args) {
            mark("notificationShowCalls");
            return new OriginalNotification(...args);
          };
          WrappedNotification.permission = OriginalNotification.permission;
          WrappedNotification.maxActions = OriginalNotification.maxActions;
          WrappedNotification.requestPermission =
            OriginalNotification.requestPermission?.bind(OriginalNotification);
          Object.defineProperty(window, "Notification", {
            configurable: true,
            value: WrappedNotification,
          });
        }
      } catch {
        window.__jarvisUi3eNotificationPatchUnavailable = true;
      }
    },
    { language: locale, keys: sideEffectKeys },
  );
  await page.reload();
  return { electronApp, page, tempUserData };
}

async function setCaptureViewport(electronApp, page, viewport) {
  const actualContentSize = await electronApp.evaluate(
    ({ BrowserWindow }, size) => {
      const mainWindow =
        BrowserWindow.getAllWindows().find((window) => !window.isDestroyed()) ??
        null;
      mainWindow?.setContentSize(size.width, size.height);
      return mainWindow?.getContentSize() ?? [size.width, size.height];
    },
    viewport,
  );
  await page.setViewportSize(viewport);
  await page.waitForTimeout(100);
  return { requestedViewport: viewport, actualContentSize };
}

async function waitForAppReady(page) {
  await page.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="core-status"]')
        ?.textContent?.includes("ONLINE") === true,
    null,
    { timeout: 20_000 },
  );
}

async function openSettings(page) {
  await waitForAppReady(page);
  await resetSideEffects(page);
  await page.getByTestId("general-settings").click();
}

async function collectSideEffects(page) {
  const rendererCounts = await page.evaluate(() => ({
    ...(window.__jarvisUi3eSideEffects ?? {}),
  }));
  return Object.fromEntries(
    sideEffectKeys.map((key) => [key, rendererCounts[key] ?? 0]),
  );
}

async function resetSideEffects(page) {
  await page.evaluate((keys) => {
    window.__jarvisUi3eSideEffects = Object.fromEntries(
      keys.map((key) => [key, 0]),
    );
  }, sideEffectKeys);
}

function assertNoSideEffects({ scenario, sideEffects }) {
  for (const [name, value] of Object.entries(sideEffects)) {
    if (value !== 0) {
      throw new Error(`${scenario} produced side effect ${name}=${value}`);
    }
  }
}

async function assertCleanProductCopy(page, locale) {
  const text = await page.locator("body").innerText();
  const forbidden = [
    "Settings preview",
    "Available in this preview",
    "preview registry",
    "migration preview",
    "Coming later",
    "Restore default settings",
    "Reset & Recovery",
    "Settings V2",
    "capability projection",
    "development default",
    "internal reason code",
    "Gate OFF",
    "设置预览",
    "当前预览已开放",
    "后续提供",
    "恢复默认设置",
    "重置与恢复",
    "状态投影",
    "内部状态来源",
  ];
  for (const term of forbidden) {
    if (text.includes(term)) {
      throw new Error(`Unexpected Product copy term in ${locale}: ${term}`);
    }
  }
}

async function assertGeneralClean(page, locale) {
  await page.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
  await page.getByTestId("settings-v2-general").waitFor({ timeout: 5_000 });
  await page
    .getByText(
      locale === "zh"
        ? "管理这台设备上的 Jarvis 设置。"
        : "Manage Jarvis settings for this device.",
      { exact: true },
    )
    .waitFor({ timeout: 5_000 });
  await page.getByTestId("settings-v2-session-rollback").waitFor({
    timeout: 5_000,
  });
  await assertCleanProductCopy(page, locale);
}

async function runSearch(page, { locale, mode }) {
  const query =
    mode === "search-preview"
      ? locale === "zh"
        ? "预览"
        : "preview"
      : locale === "zh"
        ? "恢复默认"
        : "reset";
  await page.getByTestId("settings-v2-search").fill(query);
  await page.getByTestId("settings-v2-search-results").waitFor({
    timeout: 5_000,
  });
  await page.getByTestId("settings-v2-search-empty").waitFor({
    timeout: 5_000,
  });
  const resultTitles = await page
    .locator(".jk-search-result h3")
    .evaluateAll((elements) =>
      elements.map((element) => element.textContent?.trim() ?? ""),
    );
  if (resultTitles.length !== 0) {
    throw new Error(
      `Expected no search results for ${query}, received ${JSON.stringify(
        resultTitles,
      )}`,
    );
  }
  await assertCleanProductCopy(page, locale);
  return { query, resultTitles };
}

async function collectLayout(page) {
  return page.evaluate(() => {
    const wideNav = document.querySelector('[data-testid="settings-v2-category-nav"]');
    const compact = document.querySelector(".settings-v2-narrow-category");
    const rollback = document.querySelector(
      '[data-testid="settings-v2-session-rollback"]',
    );
    const main = document.querySelector(".settings-v2-content");
    const rectOf = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        display: getComputedStyle(element).display,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        visibility: getComputedStyle(element).visibility,
        width: rect.width,
      };
    };
    return {
      bodyScrollWidth: document.body.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      compactCategory: rectOf(compact),
      main: rectOf(main),
      rollback: rectOf(rollback),
      scrollWidth: document.documentElement.scrollWidth,
      viewport: {
        devicePixelRatio: window.devicePixelRatio,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        visualHeight: window.visualViewport?.height ?? null,
        visualWidth: window.visualViewport?.width ?? null,
      },
      wideCategoryNav: rectOf(wideNav),
    };
  });
}

async function captureScenario([name, width, height, locale, theme, mode]) {
  const run = await launchApp({ theme, locale });
  try {
    const viewport = await setCaptureViewport(run.electronApp, run.page, {
      width,
      height,
    });
    await openSettings(run.page);
    let search = null;
    if (mode.startsWith("search-")) {
      search = await runSearch(run.page, { locale, mode });
    } else {
      await assertGeneralClean(run.page, locale);
    }

    if (mode === "classic-entry") {
      await run.page.getByTestId("settings-v2-session-rollback").waitFor({
        timeout: 5_000,
      });
    }

    const screenshotPath = path.join(outputDirectory, `${name}.png`);
    await run.page.screenshot({ path: screenshotPath, fullPage: false });
    const sideEffects = await collectSideEffects(run.page);
    const layout = await collectLayout(run.page);
    assertNoSideEffects({ scenario: name, sideEffects });
    return {
      name,
      mode,
      locale,
      theme,
      screenshotPath,
      search,
      sideEffects,
      layout,
      viewport,
    };
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

async function captureGateOffLegacy() {
  const run = await launchApp({
    theme: "harbor",
    locale: "en",
    settingsV2Enabled: false,
  });
  try {
    const viewport = await setCaptureViewport(run.electronApp, run.page, {
      width: 1440,
      height: 940,
    });
    await openSettings(run.page);
    await run.page.getByTestId("settings-view").waitFor({ timeout: 10_000 });
    const settingsV2Count = await run.page.getByTestId("settings-v2-view").count();
    if (settingsV2Count !== 0) {
      throw new Error("Gate-off scenario mounted Settings V2.");
    }
    const screenshotPath = path.join(outputDirectory, "gate-off-legacy-unchanged.png");
    await run.page.screenshot({ path: screenshotPath, fullPage: false });
    const sideEffects = await collectSideEffects(run.page);
    assertNoSideEffects({ scenario: "gate-off-legacy-unchanged", sideEffects });
    return {
      name: "gate-off-legacy-unchanged",
      mode: "legacy",
      locale: "en",
      theme: "harbor",
      screenshotPath,
      sideEffects,
      settingsV2Count,
      legacyCount: await run.page.getByTestId("settings-view").count(),
      viewport,
    };
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

await mkdir(outputDirectory, { recursive: true });

const results = [];
for (const scenario of scenarios) {
  results.push(await captureScenario(scenario));
}
results.push(await captureGateOffLegacy());

const totals = Object.fromEntries(sideEffectKeys.map((key) => [key, 0]));
for (const result of results) {
  for (const key of sideEffectKeys) {
    totals[key] += result.sideEffects?.[key] ?? 0;
  }
}

const diagnostics = {
  generatedAt: new Date().toISOString(),
  outputDirectory,
  productDefinitions: {
    resetPresent: false,
    previewCopyPresent: false,
    classicSettingsEntryPresent: true,
  },
  scenarios: results,
  sideEffectTotals: totals,
  realNetworkRequestSent: totals.realNetworkRequestSent > 0,
};

await writeFile(
  path.join(outputDirectory, "product-copy-cleanup-diagnostics.json"),
  JSON.stringify(diagnostics, null, 2),
  "utf8",
);

console.log(JSON.stringify(diagnostics, null, 2));
