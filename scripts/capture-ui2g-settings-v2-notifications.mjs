import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-2g",
  "settings-v2-notifications",
);

const baseEnv = {
  ...process.env,
  JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
  JARVIS_K_ENABLE_SETTINGS_V2: "1",
};

const sideEffectKeys = [
  "notificationShowCalls",
  "notificationPermissionRequestCalls",
  "windowsSettingsOpenCalls",
  "soundPlaybackCalls",
  "ttsStartCalls",
  "mediaCalls",
  "fetchCalls",
  "realNetworkRequestSent",
  "backgroundTaskStarted",
  "modelCallStarted",
  "windowsExecutorInvoked",
  "appLaunchStarted",
  "browserOpenStarted",
  "fileSearchStarted",
  "pluginInvocationStarted",
  "mcpConnectOrStartStarted",
];

const pageScenarios = [
  ["signal-notifications-wide", 1440, 940, "en", "signal", "top"],
  ["harbor-notifications-wide", 1440, 940, "en", "harbor", "top"],
  ["ember-notifications-wide", 1440, 940, "en", "ember", "top"],
  ["zh-notifications-wide", 1440, 940, "zh", "harbor", "top"],
  ["en-notifications-narrow-top", 390, 980, "en", "harbor", "top"],
  ["en-notifications-narrow-bottom", 390, 980, "en", "harbor", "bottom"],
  ["zh-notifications-narrow-top", 390, 980, "zh", "harbor", "top"],
  ["zh-notifications-narrow-bottom", 390, 980, "zh", "harbor", "bottom"],
];

const searchScenarios = [
  ["notifications-search-en", 1440, 940, "en", "harbor", "notification"],
  ["notifications-search-zh", 1440, 940, "zh", "harbor", "通知"],
  ["notifications-search-empty", 1440, 940, "en", "harbor", "zz-notification-empty"],
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

async function launchApp({ theme, locale, settingsV2Enabled = true }) {
  const tempUserData = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-notifications-"),
  );
  await seedDesktopSettings(tempUserData, { theme });
  const electronApp = await electron.launch({
    args: [
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
  await page.addInitScript(({ language, keys }) => {
    window.localStorage.setItem("jarvis-k-ui-language", language);
    window.__jarvisUi2gSideEffects = Object.fromEntries(
      keys.map((key) => [key, 0]),
    );
    const mark = (key) => {
      window.__jarvisUi2gSideEffects[key] =
        (window.__jarvisUi2gSideEffects[key] ?? 0) + 1;
    };
    if (navigator.mediaDevices?.getUserMedia) {
      const originalGetUserMedia =
        navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = (...args) => {
        mark("mediaCalls");
        return originalGetUserMedia(...args);
      };
    }
    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args) => {
      mark("fetchCalls");
      mark("realNetworkRequestSent");
      return originalFetch(...args);
    };
    const originalAudioPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function patchedPlay(...args) {
      mark("soundPlaybackCalls");
      return originalAudioPlay.apply(this, args);
    };
    if (window.speechSynthesis?.speak) {
      const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = (...args) => {
        mark("ttsStartCalls");
        return originalSpeak(...args);
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
        WrappedNotification.requestPermission = (...args) => {
          mark("notificationPermissionRequestCalls");
          return OriginalNotification.requestPermission(...args);
        };
        Object.defineProperty(window, "Notification", {
          configurable: true,
          value: WrappedNotification,
        });
      }
    } catch {
      window.__jarvisUi2gNotificationPatchUnavailable = true;
    }
  }, { language: locale, keys: sideEffectKeys });
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
  await page.setViewportSize(
    useActualBrowserWindowContentSize
      ? { width: actualContentSize[0], height: actualContentSize[1] }
      : viewport,
  );
  await page.waitForTimeout(100);
  return { requestedViewport: viewport, actualBrowserWindowContentSize: actualContentSize };
}

async function openSettings(page) {
  await waitForAppReady(page);
  await resetSideEffects(page);
  await page.getByTestId("general-settings").click();
  await page.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
}

async function setNotificationsCategory(page) {
  const navButtons = page.locator('[data-testid="settings-v2-category-nav"] button');
  if ((await navButtons.count()) > 0 && (await navButtons.first().isVisible())) {
    await navButtons.nth(6).click();
  } else {
    await page
      .locator(".settings-v2-narrow-category select")
      .selectOption("notifications");
  }
  await page.getByTestId("settings-v2-notifications").waitFor({ timeout: 5_000 });
}

async function resetSideEffects(page) {
  await page.evaluate((keys) => {
    window.__jarvisUi2gSideEffects = Object.fromEntries(
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
    throw new Error("Screenshot output is not a PNG.");
  }
  return {
    pixelWidth: buffer.readUInt32BE(16),
    pixelHeight: buffer.readUInt32BE(20),
  };
}

async function readPngDimensionsFromFile(filePath) {
  return getPngDimensions(await readFile(filePath));
}

function escapePowerShellSingleQuoted(value) {
  return String(value).replaceAll("'", "''");
}

async function captureVisibleOperatingSystemWindow(electronApp, screenshotPath) {
  const capture = await electronApp.evaluate(
    async ({ BrowserWindow, screen }) => {
      const mainWindow =
        BrowserWindow.getAllWindows().find(
          (window) => !window.isDestroyed() && window.isVisible(),
        ) ??
        BrowserWindow.getAllWindows().find((window) => !window.isDestroyed()) ??
        null;
      if (!mainWindow) {
        throw new Error("No BrowserWindow is available for OS surface capture.");
      }
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(true, "screen-saver");
      const display = screen.getDisplayMatching(mainWindow.getContentBounds());
      mainWindow.setPosition(display.workArea.x, display.workArea.y);
      await new Promise((resolve) => setTimeout(resolve, 150));
      const contentBounds = mainWindow.getContentBounds();
      const scaleFactor = display.scaleFactor || 1;
      return {
        browserWindowBounds: mainWindow.getBounds(),
        browserWindowContentBounds: contentBounds,
        browserWindowSize: mainWindow.getSize(),
        browserWindowContentSize: mainWindow.getContentSize(),
        displayScaleFactor: scaleFactor,
        webContentsZoomFactor: mainWindow.webContents.getZoomFactor(),
        screenCaptureBounds: {
          x: Math.round(contentBounds.x * scaleFactor),
          y: Math.round(contentBounds.y * scaleFactor),
          width: Math.round(contentBounds.width * scaleFactor),
          height: Math.round(contentBounds.height * scaleFactor),
        },
      };
    },
  );
  const bounds = capture.screenCaptureBounds;
  const outputPath = escapePowerShellSingleQuoted(screenshotPath);
  const script = `
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap(${bounds.width}, ${bounds.height})
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.CopyFromScreen(${bounds.x}, ${bounds.y}, 0, 0, $bitmap.Size)
  $bitmap.Save('${outputPath}', [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
`;
  await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    { maxBuffer: 1024 * 1024, timeout: 10_000, windowsHide: true },
  );
  return {
    ...capture,
    screenshotDimensions: await readPngDimensionsFromFile(screenshotPath),
  };
}

async function scrollSettingsViewport(page, view) {
  const targetSelector =
    view === "bottom"
      ? '[data-testid="settings-v2-notifications-section-privacy"]'
      : '[data-testid="settings-v2-notifications"] .jk-settings-page-header h1';
  const position = await page.evaluate(({ selector, mode }) => {
    const target = document.querySelector(selector);
    if (!target) throw new Error(`Missing scroll target: ${selector}`);
    target.scrollIntoView({
      block: mode === "bottom" ? "center" : "end",
      inline: "nearest",
      behavior: "instant",
    });
    const settingsView = document.querySelector('[data-testid="settings-view"]');
    let viewport = settingsView?.parentElement ?? null;
    while (viewport && viewport !== document.body) {
      if (viewport.scrollHeight > viewport.clientHeight + 1) break;
      viewport = viewport.parentElement;
    }
    return {
      targetSelector: selector,
      scrollX: Math.round(window.scrollX),
      scrollY: Math.round(window.scrollY),
      settingsScrollTop: viewport ? Math.round(viewport.scrollTop) : null,
    };
  }, { selector: targetSelector, mode: view });
  await page.waitForTimeout(150);
  return position;
}

function assertNoSideEffects(name, sideEffects) {
  const nonZero = Object.entries(sideEffects ?? {}).filter(([, value]) => value !== 0);
  if (nonZero.length > 0) {
    throw new Error(`Unexpected Notifications side effects for ${name}: ${JSON.stringify(nonZero)}`);
  }
}

async function collectDiagnostics(page, electronApp, screenshotPath, screenshotDimensions) {
  const browserWindow = await electronApp.evaluate(({ BrowserWindow }) => {
    const mainWindow =
      BrowserWindow.getAllWindows().find((window) => !window.isDestroyed()) ??
      null;
    if (!mainWindow) return null;
    return {
      bounds: mainWindow.getBounds(),
      contentBounds: mainWindow.getContentBounds(),
      size: mainWindow.getSize(),
      contentSize: mainWindow.getContentSize(),
      webContentsZoomFactor: mainWindow.webContents.getZoomFactor(),
    };
  });
  const dom = await page.evaluate(() => {
    const viewport = {
      width: window.visualViewport?.width ?? document.documentElement.clientWidth,
      height: window.visualViewport?.height ?? document.documentElement.clientHeight,
    };
    const rectSnapshot = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const visible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0;
      return {
        selector,
        display: style.display,
        visibility: style.visibility,
        visible,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        intersectsViewport:
          visible &&
          rect.right > 0 &&
          rect.left < viewport.width &&
          rect.bottom > 0 &&
          rect.top < viewport.height,
        horizontallyFitsViewport:
          visible && rect.left >= -1 && rect.right <= viewport.width + 1,
      };
    };
    return {
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      windowOuterWidth: window.outerWidth,
      windowOuterHeight: window.outerHeight,
      documentElementClientWidth: document.documentElement.clientWidth,
      documentElementClientHeight: document.documentElement.clientHeight,
      documentElementScrollWidth: document.documentElement.scrollWidth,
      documentElementScrollHeight: document.documentElement.scrollHeight,
      bodyClientWidth: document.body.clientWidth,
      bodyClientHeight: document.body.clientHeight,
      bodyScrollWidth: document.body.scrollWidth,
      bodyScrollHeight: document.body.scrollHeight,
      devicePixelRatio: window.devicePixelRatio,
      visualViewportWidth: window.visualViewport?.width ?? null,
      visualViewportHeight: window.visualViewport?.height ?? null,
      visualViewportScale: window.visualViewport?.scale ?? null,
      scrollX: Math.round(window.scrollX),
      scrollY: Math.round(window.scrollY),
      cssMediaQueries: {
        max900: window.matchMedia("(max-width: 900px)").matches,
        max640: window.matchMedia("(max-width: 640px)").matches,
        max520: window.matchMedia("(max-width: 520px)").matches,
      },
      wideNavigationRect: rectSnapshot(".settings-v2-wide-category"),
      compactCategorySelectorRect: rectSnapshot(".settings-v2-narrow-category"),
      notificationsHeadingRect: rectSnapshot(
        '[data-testid="settings-v2-notifications"] .jk-settings-page-header h1',
      ),
      safeViewingRect: rectSnapshot(
        '[data-testid="settings-v2-notifications-section-safe-viewing"]',
      ),
      currentFeaturesRect: rectSnapshot(
        '[data-testid="settings-v2-notifications-section-current"]',
      ),
      inAppRect: rectSnapshot(
        '[data-testid="settings-v2-notifications-section-in-app"]',
      ),
      trayRect: rectSnapshot(
        '[data-testid="settings-v2-notifications-section-tray"]',
      ),
      privacyRect: rectSnapshot(
        '[data-testid="settings-v2-notifications-section-privacy"]',
      ),
      composerInputRect: rectSnapshot('[data-testid="command-input"]'),
      composerSendRect: rectSnapshot('[data-testid="send-command"]'),
      settingsMainRect: rectSnapshot(".settings-v2-content"),
      sideEffects: window.__jarvisUi2gSideEffects ?? {},
      pageText: document.body.innerText,
    };
  });
  return {
    ...dom,
    electronWebContentsZoomFactor: browserWindow?.webContentsZoomFactor ?? null,
    playwrightViewportSize: page.viewportSize(),
    browserWindowBounds: browserWindow?.bounds ?? null,
    browserWindowContentBounds: browserWindow?.contentBounds ?? null,
    browserWindowSize: browserWindow?.size ?? null,
    browserWindowContentSize: browserWindow?.contentSize ?? null,
    screenshot: {
      path: screenshotPath,
      pixelWidth: screenshotDimensions.pixelWidth,
      pixelHeight: screenshotDimensions.pixelHeight,
      usesClip: false,
    },
  };
}

function assertProductCopy(name, diagnostics) {
  const forbidden = [
    "Notification API",
    "permission state",
    "dispatch",
    "toast payload",
    "renderer event",
    "task lifecycle",
    "IPC",
    "channel",
    "fixture",
    "debounce",
    "event bus",
    "capability probe",
    "Windows AppUserModelID",
    "closeToTrayNoticeShown",
    "Notification.isSupported",
    "source of truth",
    "projection",
    "runtime binding",
    "通知接口",
    "权限状态字段",
    "分发器",
    "消息载荷",
    "渲染进程事件",
    "事件总线",
    "能力探针",
    "内部状态来源",
    "状态投影",
    "运行时绑定",
    "托盘提醒已显示标记",
    "请求权限",
    "测试通知",
    "勿扰模式",
  ];
  const found = forbidden.filter((term) => diagnostics.pageText.includes(term));
  if (found.length > 0) {
    throw new Error(`Notifications Product copy guard failed for ${name}: ${found.join(", ")}`);
  }
}

function assertLayout(name, diagnostics, { compactExpected = false, bottomExpected = false } = {}) {
  const overflow =
    diagnostics.documentElementScrollWidth >
      diagnostics.documentElementClientWidth + 1 ||
    diagnostics.bodyScrollWidth > diagnostics.bodyClientWidth + 1;
  const failures = [];
  if (overflow) failures.push("horizontal_overflow");
  if (!diagnostics.settingsMainRect?.horizontallyFitsViewport) {
    failures.push("settings_main_horizontal_cutoff");
  }
  if (compactExpected && !diagnostics.compactCategorySelectorRect?.visible) {
    failures.push("compact_selector_hidden");
  }
  if (compactExpected && diagnostics.wideNavigationRect?.visible) {
    failures.push("wide_nav_visible");
  }
  if (!bottomExpected && !diagnostics.notificationsHeadingRect?.intersectsViewport) {
    failures.push("heading_outside_viewport");
  }
  if (bottomExpected) {
    for (const [label, rect] of [
      ["tray", diagnostics.trayRect],
      ["privacy", diagnostics.privacyRect],
      ["composer_input", diagnostics.composerInputRect],
      ["composer_send", diagnostics.composerSendRect],
    ]) {
      if (!rect?.intersectsViewport) failures.push(`${label}_outside_viewport`);
      if (!rect?.horizontallyFitsViewport) failures.push(`${label}_horizontal_cutoff`);
    }
  }
  if (diagnostics.composerSendRect?.right > diagnostics.documentElementClientWidth + 1) {
    failures.push("composer_send_cutoff");
  }
  if (failures.length > 0) {
    throw new Error(
      `Notifications layout guard failed for ${name}: ${JSON.stringify({
        failures,
        diagnostics,
      })}`,
    );
  }
}

async function captureScenario([name, width, height, locale, theme, view]) {
  const run = await launchApp({ theme, locale });
  try {
    await setCaptureViewport(run.electronApp, run.page, { width, height });
    await openSettings(run.page);
    await setNotificationsCategory(run.page);
    const scrollPosition = await scrollSettingsViewport(run.page, view);
    const screenshotPath = path.join(outputDirectory, `${name}.png`);
    await run.page.screenshot({ path: screenshotPath, fullPage: false });
    const screenshotDimensions = await readPngDimensionsFromFile(screenshotPath);
    const diagnostics = await collectDiagnostics(
      run.page,
      run.electronApp,
      screenshotPath,
      screenshotDimensions,
    );
    assertNoSideEffects(name, diagnostics.sideEffects);
    assertProductCopy(name, diagnostics);
    assertLayout(name, diagnostics, {
      compactExpected: width <= 900,
      bottomExpected: view === "bottom",
    });
    return { name, path: screenshotPath, screenshotDimensions, scrollPosition, diagnostics };
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

async function captureSearchScenario([name, width, height, locale, theme, query]) {
  const run = await launchApp({ theme, locale });
  try {
    await setCaptureViewport(run.electronApp, run.page, { width, height });
    await openSettings(run.page);
    await setNotificationsCategory(run.page);
    await run.page.getByTestId("settings-v2-search").fill(query);
    await run.page.waitForTimeout(150);
    const screenshotPath = path.join(outputDirectory, `${name}.png`);
    await run.page.screenshot({ path: screenshotPath, fullPage: false });
    const screenshotDimensions = await readPngDimensionsFromFile(screenshotPath);
    const assertions = await run.page.evaluate((expectedQuery) => {
      const resultsRoot = document.querySelector('[data-testid="settings-v2-search-results"]');
      const resultRows = [...document.querySelectorAll(".jk-search-result")].map((element) => ({
        text: element.textContent?.trim() ?? "",
        breadcrumb: element.querySelector(".jk-search-result__breadcrumb")?.textContent?.trim() ?? "",
        title: element.querySelector("h3")?.textContent?.trim() ?? "",
        value: element.querySelector(".jk-setting-value")?.textContent?.trim(),
      }));
      return {
        query: document
          .querySelector('[data-testid="settings-v2-search"]')
          ?.value,
        resultRows,
        resultCount: resultRows.length,
        resultsVisible: Boolean(resultsRoot),
        noResultsVisible:
          document.body.innerText.includes("No matching settings") ||
          document.body.innerText.includes("没有匹配的设置"),
        sideEffects: window.__jarvisUi2gSideEffects ?? {},
        matchesExpectedQuery:
          document.querySelector('[data-testid="settings-v2-search"]')?.value ===
          expectedQuery,
      };
    }, query);
    if (!assertions.matchesExpectedQuery) {
      throw new Error(`Search query mismatch for ${name}: ${JSON.stringify(assertions)}`);
    }
    const isEmpty = name.includes("empty");
    if (!isEmpty) {
      if (assertions.resultCount < 2) {
        throw new Error(`Expected notification results for ${name}: ${JSON.stringify(assertions)}`);
      }
      const nonNotification = assertions.resultRows.filter(
        (row) =>
          !/^(Notifications|通知)\s*\//.test(row.breadcrumb) &&
          !/^(Notifications|通知)\s*\//.test(row.text),
      );
      if (nonNotification.length > 0) {
        throw new Error(`Non-Notifications search result for ${name}: ${JSON.stringify(nonNotification)}`);
      }
    } else if (!assertions.noResultsVisible) {
      throw new Error(`Expected empty search state for ${name}: ${JSON.stringify(assertions)}`);
    }
    assertNoSideEffects(name, assertions.sideEffects);
    return { name, path: screenshotPath, screenshotDimensions, assertions };
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

async function captureZoomScenario(name, view) {
  const run = await launchApp({ theme: "harbor", locale: "en" });
  try {
    const viewport = await setCaptureViewport(
      run.electronApp,
      run.page,
      {
        width: 904,
        height: 980,
      },
      { useActualBrowserWindowContentSize: true },
    );
    await openSettings(run.page);
    await setNotificationsCategory(run.page);
    const zoomFactor = await run.electronApp.evaluate(({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows().find(
        (window) => !window.isDestroyed(),
      );
      mainWindow?.webContents.setZoomFactor(2);
      return mainWindow?.webContents.getZoomFactor() ?? 1;
    });
    const scrollPosition = await scrollSettingsViewport(run.page, view);
    const screenshotPath = path.join(outputDirectory, `${name}.png`);
    const browserWindowCapture = await captureVisibleOperatingSystemWindow(
      run.electronApp,
      screenshotPath,
    );
    const diagnostics = await collectDiagnostics(
      run.page,
      run.electronApp,
      screenshotPath,
      browserWindowCapture.screenshotDimensions,
    );
    assertNoSideEffects(name, diagnostics.sideEffects);
    assertProductCopy(name, diagnostics);
    assertLayout(name, diagnostics, {
      compactExpected: true,
      bottomExpected: view === "bottom",
    });
    return {
      name,
      path: screenshotPath,
      viewport,
      zoomFactor,
      scrollPosition,
      browserWindowCapture,
      diagnostics,
    };
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

async function captureGateOffScenario() {
  const run = await launchApp({
    theme: "harbor",
    locale: "en",
    settingsV2Enabled: false,
  });
  try {
    await setCaptureViewport(run.electronApp, run.page, { width: 1440, height: 940 });
    await waitForAppReady(run.page);
    await resetSideEffects(run.page);
    await run.page.getByTestId("general-settings").click();
    await run.page.getByTestId("settings-view").waitFor({ timeout: 10_000 });
    const settingsV2Count = await run.page.getByTestId("settings-v2-view").count();
    if (settingsV2Count !== 0) {
      throw new Error("Settings V2 mounted while gate was disabled.");
    }
    const screenshotPath = path.join(outputDirectory, "gate-off-legacy-notifications.png");
    await run.page.screenshot({ path: screenshotPath, fullPage: false });
    const screenshotDimensions = await readPngDimensionsFromFile(screenshotPath);
    const sideEffects = await run.page.evaluate(() => window.__jarvisUi2gSideEffects ?? {});
    assertNoSideEffects("gate-off-legacy-notifications", sideEffects);
    return {
      name: "gate-off-legacy-notifications",
      path: screenshotPath,
      screenshotDimensions,
      settingsV2Count,
      legacyVisible: true,
      sideEffects,
    };
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

async function main() {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  const results = [];
  for (const scenario of pageScenarios) {
    results.push(await captureScenario(scenario));
  }
  for (const scenario of searchScenarios) {
    results.push(await captureSearchScenario(scenario));
  }
  results.push(await captureZoomScenario("harbor-notifications-zoom200-top", "top"));
  await copyFile(
    path.join(outputDirectory, "harbor-notifications-zoom200-top.png"),
    path.join(outputDirectory, "harbor-notifications-zoom200.png"),
  );
  results.push(await captureZoomScenario("harbor-notifications-zoom200-bottom", "bottom"));
  results.push(await captureGateOffScenario());
  const diagnosticsPath = path.join(outputDirectory, "notifications-capture-diagnostics.json");
  await writeFile(
    diagnosticsPath,
    JSON.stringify(
      {
        outputDirectory,
        generatedAt: new Date().toISOString(),
        sideEffectKeys,
        results,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(JSON.stringify({ outputDirectory, diagnosticsPath, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
