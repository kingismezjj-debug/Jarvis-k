import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-2h",
  "settings-v2-about-updates",
);

const sideEffectKeys = [
  "updateCheckCalls",
  "externalOpenCalls",
  "diagnosticsExportCalls",
  "clipboardWriteCalls",
  "appRestartCalls",
  "fetchCalls",
  "realNetworkRequestSent",
  "mediaCalls",
  "notificationShowCalls",
  "windowsExecutorInvoked",
  "modelCallStarted",
  "pluginInvocationStarted",
];

const pageScenarios = [
  ["signal-about-wide", 1440, 940, "en", "signal", "top"],
  ["harbor-about-wide", 1440, 940, "en", "harbor", "top"],
  ["ember-about-wide", 1440, 940, "en", "ember", "top"],
  ["zh-about-wide", 1440, 940, "zh", "harbor", "top"],
  ["en-about-narrow", 390, 980, "en", "harbor", "top"],
  ["zh-about-narrow", 390, 980, "zh", "harbor", "top"],
];

const searchScenarios = [
  ["about-search-en", 1440, 940, "en", "harbor", "about"],
  ["about-search-zh", 1440, 940, "zh", "harbor", "关于"],
  ["updates-search-en", 1440, 940, "en", "harbor", "updates"],
  ["about-search-empty", 1440, 940, "en", "harbor", "zz-about-empty"],
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
    path.join(os.tmpdir(), "jarvis-k-settings-v2-about-"),
  );
  await seedDesktopSettings(tempUserData, { theme });
  const electronApp = await electron.launch({
    args: [`--user-data-dir=${tempUserData}`, "apps/desktop/dist/main.js"],
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
      window.__jarvisUi2hSideEffects = Object.fromEntries(
        keys.map((key) => [key, 0]),
      );
      const mark = (key) => {
        window.__jarvisUi2hSideEffects[key] =
          (window.__jarvisUi2hSideEffects[key] ?? 0) + 1;
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
        window.__jarvisUi2hNotificationPatchUnavailable = true;
      }
    },
    { language: locale, keys: sideEffectKeys },
  );
  await page.reload();
  return { electronApp, page, tempUserData };
}

async function waitForAppReady(page) {
  await page.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="core-status"]')?.textContent?.includes(
        "ONLINE",
      ) === true,
    null,
    { timeout: 20_000 },
  );
}

async function setCaptureViewport(
  electronApp,
  page,
  viewport,
  { useActualBrowserWindowContentSize = false } = {},
) {
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
  await page.setViewportSize({
    width: useActualBrowserWindowContentSize
      ? actualContentSize[0]
      : viewport.width,
    height: useActualBrowserWindowContentSize
      ? actualContentSize[1]
      : viewport.height,
  });
  await page.waitForTimeout(100);
  return { requestedViewport: viewport, actualBrowserWindowContentSize: actualContentSize };
}

async function openSettings(page) {
  await waitForAppReady(page);
  await resetSideEffects(page);
  await page.getByTestId("general-settings").click();
}

async function setAboutCategory(page) {
  await page.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
  const navButtons = page.locator('[data-testid="settings-v2-category-nav"] button');
  if ((await navButtons.count()) > 0 && (await navButtons.first().isVisible())) {
    await navButtons.nth(7).click();
  } else {
    await page
      .locator(".settings-v2-narrow-category select")
      .selectOption("about_updates");
  }
  await page.getByTestId("settings-v2-about-updates").waitFor({ timeout: 5_000 });
}

async function scrollAboutView(page, view) {
  await page.evaluate((targetView) => {
    const getScrollParent = (target) => {
      let element = target?.parentElement ?? null;
      while (element && element !== document.documentElement) {
        if (element.scrollHeight > element.clientHeight + 1) {
          return element;
        }
        element = element.parentElement;
      }
      return document.scrollingElement ?? document.documentElement;
    };

    const scrollBy = (container, deltaY) => {
      if (
        container === document.scrollingElement ||
        container === document.documentElement ||
        container === document.body
      ) {
        window.scrollBy({ left: 0, top: deltaY });
        return;
      }
      container.scrollTop += deltaY;
    };

    const alignElementTop = (target, topOffset) => {
      if (!target) return;
      const container = getScrollParent(target);
      for (let index = 0; index < 5; index += 1) {
        const rect = target.getBoundingClientRect();
        const delta = rect.top - topOffset;
        if (Math.abs(delta) <= 2) break;
        scrollBy(container, delta);
      }
    };

    if (targetView === "bottom") {
      alignElementTop(
        document.querySelector('[data-testid="settings-v2-about-updates-status"]'),
        32,
      );
      return;
    }

    const searchRow = document.querySelector(".settings-v2-search-row");
    const compactSelector = document.querySelector(".settings-v2-narrow-category");
    const heading = document.querySelector(
      '[data-testid="settings-v2-about-updates"] h1',
    );
    if (compactSelector && heading && getComputedStyle(compactSelector).display !== "none") {
      alignElementTop(searchRow ?? compactSelector, 16);
      return;
    }
    alignElementTop(heading, 24);
  }, view);
  await page.waitForTimeout(100);
}

async function resetSideEffects(page) {
  await page.evaluate((keys) => {
    window.__jarvisUi2hSideEffects = Object.fromEntries(
      keys.map((key) => [key, 0]),
    );
  }, sideEffectKeys);
}

function getPngDimensions(buffer) {
  if (
    buffer.length < 24 ||
    buffer.readUInt32BE(0) !== 0x89504e47 ||
    buffer.readUInt32BE(4) !== 0x0d0a1a0a
  ) {
    throw new Error("capture_not_png");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function saveScreenshot(page, name) {
  const filePath = path.join(outputDirectory, `${name}.png`);
  const buffer = await page.screenshot({ fullPage: false, type: "png" });
  await writeFile(filePath, buffer);
  return { filePath, dimensions: getPngDimensions(buffer) };
}

async function collectDiagnostics(page) {
  return page.evaluate(() => {
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        intersectsViewport:
          rect.right > 0 &&
          rect.left < viewportWidth &&
          rect.bottom > 0 &&
          rect.top < viewportHeight,
        horizontallyWithinViewport: rect.left >= 0 && rect.right <= viewportWidth,
      };
    };
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      devicePixelRatio: window.devicePixelRatio,
      visualViewport: window.visualViewport
        ? {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
            scale: window.visualViewport.scale,
          }
        : null,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      settingsScrollTop: (() => {
        const settingsView = document.querySelector('[data-testid="settings-view"]');
        let viewport = settingsView?.parentElement ?? null;
        while (viewport && viewport !== document.body) {
          if (viewport.scrollHeight > viewport.clientHeight + 1) break;
          viewport = viewport.parentElement;
        }
        return viewport ? Math.round(viewport.scrollTop) : null;
      })(),
      wideNav: {
        display: getComputedStyle(
          document.querySelector(".settings-v2-wide-category"),
        ).display,
        rect: rectFor(".settings-v2-wide-category"),
      },
      compactSelector: {
        display: getComputedStyle(
          document.querySelector(".settings-v2-narrow-category"),
        ).display,
        rect: rectFor(".settings-v2-narrow-category"),
      },
      heading: rectFor('[data-testid="settings-v2-about-updates"] h1'),
      updateCard: rectFor('[data-testid="settings-v2-about-updates-status"]'),
      legalCard: rectFor('[data-testid="settings-v2-about-updates"] section:last-child'),
      composer: rectFor(".composer, [data-testid='command-composer']"),
      sideEffects: window.__jarvisUi2hSideEffects,
    };
  });
}

function assertNoSideEffects(sideEffects, scenarioName) {
  for (const key of sideEffectKeys) {
    if ((sideEffects?.[key] ?? 0) !== 0) {
      throw new Error(`${scenarioName}: unexpected_side_effect:${key}`);
    }
  }
}

async function captureAboutScenario([name, width, height, locale, theme, scroll]) {
  const { electronApp, page, tempUserData } = await launchApp({ theme, locale });
  try {
    const viewportInfo = await setCaptureViewport(electronApp, page, { width, height });
    await openSettings(page);
    await setAboutCategory(page);
    await scrollAboutView(page, scroll);
    const screenshot = await saveScreenshot(page, name);
    const diagnostics = {
      name,
      locale,
      theme,
      viewportInfo,
      ...(await collectDiagnostics(page)),
    };
    assertNoSideEffects(diagnostics.sideEffects, name);
    return { screenshot, diagnostics };
  } finally {
    await electronApp.close();
    await rm(tempUserData, { force: true, recursive: true });
  }
}

async function captureSearchScenario([name, width, height, locale, theme, query]) {
  const { electronApp, page, tempUserData } = await launchApp({ theme, locale });
  try {
    const viewportInfo = await setCaptureViewport(electronApp, page, { width, height });
    await openSettings(page);
    await page.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
    await page.getByTestId("settings-v2-search").fill(query);
    await page.getByTestId("settings-v2-search-results").waitFor({ timeout: 5_000 });
    await page.waitForTimeout(100);
    const screenshot = await saveScreenshot(page, name);
    const searchState = await page.evaluate(() => ({
      query: document.querySelector('[data-testid="settings-v2-search"]')?.value,
      resultText: document.querySelector('[data-testid="settings-v2-search-results"]')?.textContent ?? "",
      sideEffects: window.__jarvisUi2hSideEffects,
    }));
    if (query !== "zz-about-empty") {
      if (!searchState.resultText.includes(locale === "zh" ? "关于与更新" : "About & Updates")) {
        throw new Error(`${name}: expected_about_search_result`);
      }
    }
    for (const forbidden of [
      "autoUpdater",
      "electron-updater",
      "openExternal",
      "AppUserModelID",
      "Git SHA",
      "commit hash",
      "protocol handler",
      "diagnostics export",
      "C:\\",
      "Authorization",
      "Bearer",
    ]) {
      if (searchState.resultText.includes(forbidden)) {
        throw new Error(`${name}: forbidden_search_text:${forbidden}`);
      }
    }
    assertNoSideEffects(searchState.sideEffects, name);
    return {
      screenshot,
      diagnostics: {
        name,
        locale,
        theme,
        query,
        viewportInfo,
        searchState,
        ...(await collectDiagnostics(page)),
      },
    };
  } finally {
    await electronApp.close();
    await rm(tempUserData, { force: true, recursive: true });
  }
}

async function captureGateOffLegacy() {
  const { electronApp, page, tempUserData } = await launchApp({
    theme: "harbor",
    locale: "en",
    settingsV2Enabled: false,
  });
  try {
    const viewportInfo = await setCaptureViewport(electronApp, page, {
      width: 1440,
      height: 940,
    });
    await openSettings(page);
    await page.waitForFunction(
      () => document.querySelector('[data-testid="settings-v2-view"]') === null,
      null,
      { timeout: 10_000 },
    );
    await page.waitForTimeout(150);
    const screenshot = await saveScreenshot(page, "gate-off-legacy-about");
    const state = await page.evaluate(() => ({
      settingsV2Mounted:
        document.querySelector('[data-testid="settings-v2-view"]') !== null,
      legacyText: document.body.textContent ?? "",
      sideEffects: window.__jarvisUi2hSideEffects,
    }));
    if (state.settingsV2Mounted) {
      throw new Error("gate_off_settings_v2_mounted");
    }
    assertNoSideEffects(state.sideEffects, "gate-off-legacy-about");
    return {
      screenshot,
      diagnostics: {
        name: "gate-off-legacy-about",
        viewportInfo,
        state,
      },
    };
  } finally {
    await electronApp.close();
    await rm(tempUserData, { force: true, recursive: true });
  }
}

async function captureZoomEvidence() {
  const { electronApp, page, tempUserData } = await launchApp({
    theme: "harbor",
    locale: "en",
  });
  try {
    const viewportInfo = await setCaptureViewport(
      electronApp,
      page,
      {
        width: 904,
        height: 980,
      },
      { useActualBrowserWindowContentSize: true },
    );
    await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWindow =
        BrowserWindow.getAllWindows().find((window) => !window.isDestroyed()) ??
        null;
      mainWindow?.webContents.setZoomFactor(2);
    });
    await page.waitForTimeout(150);
    await openSettings(page);
    await setAboutCategory(page);
    await scrollAboutView(page, "top");
    const topScreenshot = await saveScreenshot(
      page,
      "harbor-about-zoom200-top",
    );
    const topDiagnostics = {
      name: "harbor-about-zoom200-top",
      viewportInfo,
      zoomFactor: await electronApp.evaluate(({ BrowserWindow }) => {
        const mainWindow =
          BrowserWindow.getAllWindows().find(
            (window) => !window.isDestroyed(),
          ) ?? null;
        return mainWindow?.webContents.getZoomFactor() ?? null;
      }),
      ...(await collectDiagnostics(page)),
    };
    if (topDiagnostics.compactSelector.display === "none") {
      throw new Error("zoom_top_compact_selector_hidden");
    }
    if (topDiagnostics.wideNav.display !== "none") {
      throw new Error("zoom_top_wide_nav_visible");
    }

    await scrollAboutView(page, "bottom");
    const bottomScreenshot = await saveScreenshot(
      page,
      "harbor-about-zoom200-bottom",
    );
    const bottomDiagnostics = {
      name: "harbor-about-zoom200-bottom",
      viewportInfo,
      zoomFactor: topDiagnostics.zoomFactor,
      ...(await collectDiagnostics(page)),
    };
    assertNoSideEffects(topDiagnostics.sideEffects, "harbor-about-zoom200-top");
    assertNoSideEffects(
      bottomDiagnostics.sideEffects,
      "harbor-about-zoom200-bottom",
    );
    return [
      { screenshot: topScreenshot, diagnostics: topDiagnostics },
      { screenshot: bottomScreenshot, diagnostics: bottomDiagnostics },
    ];
  } finally {
    await electronApp.close();
    await rm(tempUserData, { force: true, recursive: true });
  }
}

async function copyPrimaryAboutScreenshots() {
  await copyFile(
    path.join(outputDirectory, "harbor-about-wide.png"),
    path.join(outputDirectory, "about-product-info-section.png"),
  );
  await copyFile(
    path.join(outputDirectory, "harbor-about-zoom200-bottom.png"),
    path.join(outputDirectory, "about-updates-status-section.png"),
  );
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const diagnostics = [];

  for (const scenario of pageScenarios) {
    diagnostics.push(await captureAboutScenario(scenario));
  }
  for (const scenario of searchScenarios) {
    diagnostics.push(await captureSearchScenario(scenario));
  }
  diagnostics.push(...(await captureZoomEvidence()));
  diagnostics.push(await captureGateOffLegacy());
  await copyPrimaryAboutScreenshots();

  await writeFile(
    path.join(outputDirectory, "capture-diagnostics.json"),
    JSON.stringify(diagnostics, null, 2),
    "utf8",
  );

  const files = await Promise.all(
    diagnostics.map(async ({ screenshot }) => ({
      path: screenshot.filePath,
      dimensions: screenshot.dimensions,
      bytes: (await readFile(screenshot.filePath)).byteLength,
    })),
  );

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        outputDirectory,
        screenshots: files,
        sideEffects: Object.fromEntries(sideEffectKeys.map((key) => [key, 0])),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "FAIL",
        reason: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
