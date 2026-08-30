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
  "ui-2e",
  "settings-v2-tools-plugins",
);

const baseEnv = {
  ...process.env,
  JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
  JARVIS_K_ENABLE_SETTINGS_V2: "1",
};

const scenarios = [
  ["signal-tools-plugins-wide", 1440, 940, "en", "signal", ""],
  ["harbor-tools-plugins-wide", 1440, 940, "en", "harbor", ""],
  ["ember-tools-plugins-wide", 1440, 940, "en", "ember", ""],
  ["zh-tools-plugins-wide", 1440, 1200, "zh", "harbor", ""],
  ["zh-tools-plugins-narrow", 390, 1100, "zh", "harbor", ""],
  ["en-tools-plugins-narrow", 390, 1100, "en", "harbor", ""],
  ["tools-plugins-search-en", 1440, 940, "en", "harbor", "plugin"],
  ["tools-plugins-search-zh", 1440, 940, "zh", "harbor", "插件"],
  ["search-empty", 1440, 940, "en", "harbor", "zz-no-match"],
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
    path.join(os.tmpdir(), "jarvis-k-settings-v2-tools-"),
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
    window.__jarvisUi2eMediaCalls = 0;
    window.__jarvisUi2eFetchCalls = 0;
    const mediaDevices = navigator.mediaDevices;
    if (mediaDevices?.getUserMedia) {
      const original = mediaDevices.getUserMedia.bind(mediaDevices);
      mediaDevices.getUserMedia = (constraints) => {
        window.__jarvisUi2eMediaCalls += 1;
        return original(constraints);
      };
    }
    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args) => {
      window.__jarvisUi2eFetchCalls += 1;
      return originalFetch(...args);
    };
  }, locale);
  await page.reload();
  return { electronApp, page, tempUserData };
}

async function waitForAppReady(page) {
  await page.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await page.waitForFunction(() => {
    const status = document.querySelector('[data-testid="core-status"]');
    return status?.textContent?.includes("ONLINE") === true;
  }, null, {
    timeout: 20_000,
  });
}

async function setCaptureViewport(
  electronApp,
  page,
  viewport,
  { useActualBrowserWindowContentSize = false } = {},
) {
  const actualContentSize = await electronApp.evaluate(
    ({ BrowserWindow }, size) => {
      const windows = BrowserWindow.getAllWindows().filter(
        (window) => !window.isDestroyed(),
      );
      const mainWindow =
        windows.find((window) => window.isVisible()) ?? windows[0] ?? null;
      mainWindow?.setContentSize(size.width, size.height);
      return mainWindow?.getContentSize() ?? [size.width, size.height];
    },
    viewport,
  );
  const effectiveViewport = useActualBrowserWindowContentSize
    ? { width: actualContentSize[0], height: actualContentSize[1] }
    : viewport;
  await page.setViewportSize(effectiveViewport);
  await page.waitForTimeout(100);
  return {
    requestedViewport: viewport,
    actualBrowserWindowContentSize: actualContentSize,
    effectiveViewport,
  };
}

async function openSettings(page) {
  await waitForAppReady(page);
  await page.getByTestId("general-settings").click();
  await page.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
}

async function setToolsCategory(page) {
  const navButtons = page.locator('[data-testid="settings-v2-category-nav"] button');
  if ((await navButtons.count()) > 0 && (await navButtons.first().isVisible())) {
    await navButtons.nth(4).click();
  } else {
    await page
      .locator(".settings-v2-narrow-category select")
      .selectOption("tools_plugins");
  }
  await page.getByTestId("settings-v2-tools-plugins").waitFor({
    timeout: 5_000,
  });
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

async function captureVisibleBrowserWindow(electronApp, screenshotPath) {
  const capture = await electronApp.evaluate(async ({ BrowserWindow }) => {
    const windows = BrowserWindow.getAllWindows().filter(
      (window) => !window.isDestroyed(),
    );
    const mainWindow =
      windows.find((window) => window.isVisible()) ?? windows[0] ?? null;
    if (!mainWindow) {
      throw new Error("No BrowserWindow is available for capture.");
    }
    const image = await mainWindow.webContents.capturePage();
    return {
      base64: image.toPNG().toString("base64"),
      browserWindowBounds: mainWindow.getBounds(),
      browserWindowContentBounds: mainWindow.getContentBounds(),
      browserWindowSize: mainWindow.getSize(),
      browserWindowContentSize: mainWindow.getContentSize(),
      webContentsZoomFactor: mainWindow.webContents.getZoomFactor(),
    };
  });
  const buffer = Buffer.from(capture.base64, "base64");
  await writeFile(screenshotPath, buffer);
  return {
    ...capture,
    base64: undefined,
    screenshotDimensions: getPngDimensions(buffer),
  };
}

function escapePowerShellSingleQuoted(value) {
  return String(value).replaceAll("'", "''");
}

async function captureVisibleOperatingSystemWindow(electronApp, screenshotPath) {
  const capture = await electronApp.evaluate(
    async ({ BrowserWindow, screen }) => {
      const windows = BrowserWindow.getAllWindows().filter(
        (window) => !window.isDestroyed(),
      );
      const mainWindow =
        windows.find((window) => window.isVisible()) ?? windows[0] ?? null;
      if (!mainWindow) {
        throw new Error("No BrowserWindow is available for OS surface capture.");
      }
      mainWindow.show();
      mainWindow.focus();
      await new Promise((resolve) => setTimeout(resolve, 150));
      const contentBounds = mainWindow.getContentBounds();
      const display = screen.getDisplayMatching(contentBounds);
      mainWindow.setAlwaysOnTop(true, "screen-saver");
      mainWindow.setPosition(display.workArea.x, display.workArea.y);
      await new Promise((resolve) => setTimeout(resolve, 150));
      const updatedContentBounds = mainWindow.getContentBounds();
      const scaleFactor = display.scaleFactor || 1;
      const screenCaptureBounds = {
        x: Math.round(updatedContentBounds.x * scaleFactor),
        y: Math.round(updatedContentBounds.y * scaleFactor),
        width: Math.round(updatedContentBounds.width * scaleFactor),
        height: Math.round(updatedContentBounds.height * scaleFactor),
      };
      return {
        browserWindowBounds: mainWindow.getBounds(),
        browserWindowContentBounds: updatedContentBounds,
        browserWindowSize: mainWindow.getSize(),
        browserWindowContentSize: mainWindow.getContentSize(),
        displayScaleFactor: scaleFactor,
        screenCaptureBounds,
        webContentsZoomFactor: mainWindow.webContents.getZoomFactor(),
      };
    },
  );
  const outputPath = escapePowerShellSingleQuoted(screenshotPath);
  const bounds = capture.screenCaptureBounds;
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
    {
      maxBuffer: 1024 * 1024,
      timeout: 10_000,
      windowsHide: true,
    },
  );
  return {
    ...capture,
    screenshotDimensions: await readPngDimensionsFromFile(screenshotPath),
  };
}

async function collectCaptureDiagnostics(
  page,
  electronApp,
  {
    screenshotPath,
    screenshotDimensions,
    screenCaptureBounds = null,
    screenshotUsesClip = false,
    screenshotClip = null,
    screenshotSource = "playwright-page",
  },
) {
  const playwrightViewportSize = page.viewportSize();
  const browserWindow = await electronApp.evaluate(({ BrowserWindow }) => {
    const windows = BrowserWindow.getAllWindows().filter(
      (window) => !window.isDestroyed(),
    );
    const mainWindow =
      windows.find((window) => window.isVisible()) ?? windows[0] ?? null;
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
    const rectSnapshot = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        selector,
        display: style.display,
        visibility: style.visibility,
        visible:
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
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
      cssMediaQueries: {
        max900: window.matchMedia("(max-width: 900px)").matches,
        max640: window.matchMedia("(max-width: 640px)").matches,
        max520: window.matchMedia("(max-width: 520px)").matches,
      },
      appHeaderRect: rectSnapshot("header:first-of-type"),
      viewHeaderRect: rectSnapshot('[data-testid="last-action-status"]'),
      wideNavigationRect: rectSnapshot(".settings-v2-wide-category"),
      compactCategorySelectorRect: rectSnapshot(".settings-v2-narrow-category"),
      toolsHeadingRect: rectSnapshot(
        '[data-testid="settings-v2-tools-plugins"] .jk-settings-page-header h1',
      ),
      firstToolsCardRect: rectSnapshot(
        '[data-testid="settings-v2-tools-plugins"] .jk-inline-notice',
      ),
      settingsMainRect: rectSnapshot(".settings-v2-content"),
      pluginsSectionRect: rectSnapshot(
        '[data-testid="settings-v2-tools-section-plugins"]',
      ),
      externalConnectionsSectionRect: rectSnapshot(
        '[data-testid="settings-v2-tools-section-mcp"]',
      ),
      composerInputRect: rectSnapshot('[data-testid="command-input"]'),
      composerSendRect: rectSnapshot('[data-testid="send-command"]'),
      settingsScrollViewportRect: rectSnapshot(
        '[data-slot="scroll-area-viewport"]:has([data-testid="settings-view"])',
      ),
      scrollX: Math.round(window.scrollX),
      scrollY: Math.round(window.scrollY),
      settingsScrollTop: (() => {
        const settingsView = document.querySelector('[data-testid="settings-view"]');
        let viewport = settingsView?.parentElement ?? null;
        while (viewport && viewport !== document.body) {
          if (viewport.scrollHeight > viewport.clientHeight + 1) break;
          viewport = viewport.parentElement;
        }
        return viewport ? Math.round(viewport.scrollTop) : null;
      })(),
    };
  });
  return {
    ...dom,
    electronWebContentsZoomFactor: browserWindow?.webContentsZoomFactor ?? null,
    playwrightViewportSize,
    browserWindowBounds: browserWindow?.bounds ?? null,
    browserWindowContentBounds: browserWindow?.contentBounds ?? null,
    browserWindowSize: browserWindow?.size ?? null,
    browserWindowContentSize: browserWindow?.contentSize ?? null,
    screenshot: {
      path: screenshotPath,
      source: screenshotSource,
      pixelWidth: screenshotDimensions.pixelWidth,
      pixelHeight: screenshotDimensions.pixelHeight,
      screenCaptureBounds,
      usesClip: screenshotUsesClip,
      clip: screenshotClip,
      clipCoordinateSpace: screenshotUsesClip ? "css-pixels" : "none",
    },
  };
}

function assertVisualScreenshotCoverage(
  diagnostics,
  scenarioName,
  {
    requireAppHeader = true,
    requireCompactCategorySelector = true,
    requireToolsHeading = true,
    requireFirstToolsSection = true,
    requirePluginsSection = false,
    requireExternalConnectionsSection = false,
    requireComposer = true,
  } = {},
) {
  const cssWidth =
    diagnostics.visualViewportWidth ??
    diagnostics.windowInnerWidth ??
    diagnostics.documentElementClientWidth;
  const cssHeight =
    diagnostics.visualViewportHeight ??
    diagnostics.windowInnerHeight ??
    diagnostics.documentElementClientHeight;
  const scaleX = diagnostics.screenshot.pixelWidth / cssWidth;
  const scaleY = diagnostics.screenshot.pixelHeight / cssHeight;
  const rectIntersectsViewport = (rect) =>
    Boolean(
      rect &&
        rect.visible &&
        rect.right > 0 &&
        rect.left < cssWidth &&
        rect.bottom > 0 &&
        rect.top < cssHeight,
    );
  const rectHorizontallyFitsViewport = (rect) =>
    Boolean(
      rect &&
        rect.visible &&
        rect.left >= -1 &&
        rect.right <= cssWidth + 1,
    );
  const failures = [];
  if (diagnostics.screenshot.usesClip) failures.push("screenshot_used_clip");
  const widthMismatch =
    diagnostics.playwrightViewportSize?.width !==
    diagnostics.browserWindowContentSize?.[0];
  const heightMismatch =
    diagnostics.playwrightViewportSize?.height !==
    diagnostics.browserWindowContentSize?.[1];
  if (widthMismatch || heightMismatch) {
    failures.push("browser_window_content_size_mismatch");
  }
  if (!diagnostics.compactCategorySelectorRect?.visible) {
    failures.push("compact_selector_not_visible");
  }
  if (diagnostics.wideNavigationRect?.visible) {
    failures.push("wide_settings_navigation_visible");
  }
  if (requireAppHeader && !rectIntersectsViewport(diagnostics.appHeaderRect)) {
    failures.push("app_header_outside_screenshot");
  }
  if (
    requireCompactCategorySelector &&
    !rectIntersectsViewport(diagnostics.compactCategorySelectorRect)
  ) {
    failures.push("compact_selector_outside_current_viewport");
  }
  if (requireToolsHeading && !rectIntersectsViewport(diagnostics.toolsHeadingRect)) {
    failures.push("tools_heading_outside_current_viewport");
  }
  if (requireFirstToolsSection && !rectIntersectsViewport(diagnostics.firstToolsCardRect)) {
    failures.push("first_tools_card_outside_current_viewport");
  }
  if (
    requirePluginsSection &&
    !rectIntersectsViewport(diagnostics.pluginsSectionRect)
  ) {
    failures.push("plugins_card_outside_current_viewport");
  }
  if (
    requireExternalConnectionsSection &&
    !rectIntersectsViewport(diagnostics.externalConnectionsSectionRect)
  ) {
    failures.push("external_connections_card_outside_current_viewport");
  }
  if (!rectIntersectsViewport(diagnostics.settingsMainRect)) {
    failures.push("settings_main_not_in_current_viewport");
  }
  if (requireComposer && !rectIntersectsViewport(diagnostics.composerInputRect)) {
    failures.push("composer_input_outside_current_viewport");
  }
  if (requireComposer && !rectIntersectsViewport(diagnostics.composerSendRect)) {
    failures.push("composer_send_outside_current_viewport");
  }
  if (!rectHorizontallyFitsViewport(diagnostics.firstToolsCardRect)) {
    failures.push("first_tools_card_horizontal_clipping");
  }
  if (!rectHorizontallyFitsViewport(diagnostics.settingsMainRect)) {
    failures.push("settings_main_horizontal_clipping");
  }
  if (requireComposer && !rectHorizontallyFitsViewport(diagnostics.composerSendRect)) {
    failures.push("composer_send_right_edge_clipped");
  }
  if (failures.length > 0) {
    throw new Error(
      `Settings V2 visual screenshot guard failed for ${scenarioName}: ${JSON.stringify(
        { failures, diagnostics },
      )}`,
    );
  }
  return {
    cssWidth,
    cssHeight,
    scaleX,
    scaleY,
    scrollX: diagnostics.scrollX,
    scrollY: diagnostics.scrollY,
    intersections: {
      appHeader: rectIntersectsViewport(diagnostics.appHeaderRect),
      compactCategorySelector: rectIntersectsViewport(
        diagnostics.compactCategorySelectorRect,
      ),
      toolsHeading: rectIntersectsViewport(diagnostics.toolsHeadingRect),
      firstToolsCard: rectIntersectsViewport(diagnostics.firstToolsCardRect),
      pluginsSection: rectIntersectsViewport(diagnostics.pluginsSectionRect),
      externalConnectionsSection: rectIntersectsViewport(
        diagnostics.externalConnectionsSectionRect,
      ),
      settingsMain: rectIntersectsViewport(diagnostics.settingsMainRect),
      composerInput: rectIntersectsViewport(diagnostics.composerInputRect),
      composerSend: rectIntersectsViewport(diagnostics.composerSendRect),
    },
    failures,
  };
}

async function scrollSettingsViewportForZoomEvidence(page, targetName) {
  const position = await page.evaluate((target) => {
    const targetSelector =
      target === "external"
        ? '[data-testid="settings-v2-tools-section-mcp"]'
        : target === "bottom"
        ? '[data-testid="settings-v2-tools-section-plugins"]'
        : '[data-testid="settings-v2-tools-plugins"] .jk-settings-page-header h1';
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      throw new Error(`Zoom capture target is unavailable: ${targetSelector}`);
    }
    targetElement.scrollIntoView({
      block: target === "external" ? "center" : target === "bottom" ? "start" : "end",
      inline: "nearest",
      behavior: "instant",
    });
    let viewport = targetElement.parentElement;
    while (viewport && viewport !== document.body) {
      if (viewport.scrollTop > 0 || viewport.scrollHeight > viewport.clientHeight + 1) {
        break;
      }
      viewport = viewport.parentElement;
    }
    return {
      target,
      targetSelector,
      scrollX: Math.round(window.scrollX),
      scrollY: Math.round(window.scrollY),
      settingsScrollTop: viewport ? Math.round(viewport.scrollTop) : null,
    };
  }, targetName);
  await page.waitForTimeout(150);
  return {
    ...position,
    ...(await page.evaluate(() => {
      const settingsView = document.querySelector('[data-testid="settings-view"]');
      let viewport = settingsView?.parentElement ?? null;
      while (viewport && viewport !== document.body) {
        if (viewport.scrollHeight > viewport.clientHeight + 1) break;
        viewport = viewport.parentElement;
      }
      return {
        scrollX: Math.round(window.scrollX),
        scrollY: Math.round(window.scrollY),
        settingsScrollTop: viewport ? Math.round(viewport.scrollTop) : null,
      };
    })),
  };
}

async function assertLayout(page, scenarioName, { expectToolsVisible = true } = {}) {
  const result = await page.evaluate(() => {
    const viewport = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };
    const rectSnapshot = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        selector,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        withinViewport:
          rect.left >= -1 &&
          rect.right <= viewport.width + 1,
      };
    };
    const selectors = [
      ".settings-v2-shell",
      ".jk-setting-row",
      ".jk-category-button",
      ".jk-button",
      ".settings-v2-tools-status-grid",
    ];
    const clippingCandidates = selectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .filter((element) => element.scrollWidth > element.clientWidth + 1).length;
    const text = document.body.innerText;
    const keyCards = [
      '[data-testid="settings-v2-tools-section-plugins"]',
      '[data-testid="settings-v2-tools-section-mcp"]',
      '[data-testid="settings-v2-search-results"]',
    ]
      .map(rectSnapshot)
      .filter(Boolean);
    const settingsMainRect = rectSnapshot(".settings-v2-content");
    const searchResultTitles = [
      ...document.querySelectorAll(".jk-search-result h3"),
    ].map((element) => element.textContent?.trim() ?? "");
    return {
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      documentHorizontalOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
      bodyHorizontalOverflow:
        document.body.scrollWidth > document.body.clientWidth + 1,
      clippingCandidates,
      settingsV2Visible: Boolean(document.querySelector(".settings-v2-shell")),
      toolsVisible: Boolean(
        document.querySelector('[data-testid="settings-v2-tools-plugins"]'),
      ),
      searchVisible: Boolean(
        document.querySelector('[data-testid="settings-v2-search-results"]'),
      ),
      narrowCategoryVisible:
        document.querySelector(".settings-v2-narrow-category") !== null &&
        getComputedStyle(document.querySelector(".settings-v2-narrow-category")).display !==
          "none",
      wideCategoryVisible:
        document.querySelector(".settings-v2-wide-category") !== null &&
        getComputedStyle(document.querySelector(".settings-v2-wide-category")).display !==
          "none",
      settingsMainRect,
      keyCards,
      keyCardsOutsideViewport: keyCards.filter((rect) => !rect.withinViewport)
        .length,
      searchResultTitles,
      forbiddenInternalText:
        /\b(PROTOTYPE DATA|DANGER ZONE|control type|fixture|Evaluation|Cloud Acceptance|acceptance|settingId|capabilityId|providerId|resourceId|fallback|manifest|digest|transport|stdio|spawn|route trace|Agent Core|Memory alpha|this slice|boundary is not connected|developer example|management service|raw descriptor)\b/i.test(
          text,
        ) ||
        /本切片|边界尚未接入|开发示例|插件管理服务|原始描述|测试夹具|评测/u.test(
          text,
        ) ||
        /\bSETTINGS\b/u.test(text) ||
        text.includes("compatibility_status_only") ||
        text.includes("MCP_ADAPTER_STATUS_ONLY") ||
        text.includes("cn.jarvis-k.") ||
        text.includes("stock.quote"),
      rawPathOrEnv:
        /[A-Z]:\\|\/Users\/|node_modules|\.env|JARVIS_K_/u.test(text),
      mediaCalls: window.__jarvisUi2eMediaCalls ?? 0,
      fetchCalls: window.__jarvisUi2eFetchCalls ?? 0,
      viewportWidth: window.innerWidth,
    };
  });
  const narrowLayoutInvalid =
    result.viewportWidth <= 900 &&
    (!result.narrowCategoryVisible || result.wideCategoryVisible);
  if (
    result.bodyHorizontalOverflow ||
    result.documentHorizontalOverflow ||
    result.clippingCandidates > 0 ||
    result.settingsMainRect?.withinViewport === false ||
    result.keyCardsOutsideViewport > 0 ||
    narrowLayoutInvalid ||
    !result.settingsV2Visible ||
    (expectToolsVisible && !result.toolsVisible) ||
    (!expectToolsVisible && !result.searchVisible) ||
    result.forbiddenInternalText ||
    result.rawPathOrEnv ||
    result.mediaCalls !== 0 ||
    result.fetchCalls !== 0
  ) {
    throw new Error(
      `Settings V2 Tools screenshot guard failed for ${scenarioName}: ${JSON.stringify(
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

async function assertShellLayout(page, scenarioName, locale) {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const visibleRect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return null;
      const rect = element.getBoundingClientRect();
      return {
        selector,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const rects = [
      visibleRect('[data-testid="core-status"]'),
      visibleRect('[data-testid="last-action-status"]'),
      visibleRect('[data-testid="command-input"]'),
      visibleRect('[data-testid="send-command"]'),
    ].filter(Boolean);
    const overlaps = [];
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i];
        const b = rects[j];
        const separated =
          a.right <= b.left + 1 ||
          b.right <= a.left + 1 ||
          a.bottom <= b.top + 1 ||
          b.bottom <= a.top + 1;
        if (!separated) overlaps.push([a.selector, b.selector]);
      }
    }
    const input = rects.find(
      (rect) => rect.selector === '[data-testid="command-input"]',
    );
    const send = rects.find(
      (rect) => rect.selector === '[data-testid="send-command"]',
    );
    return {
      viewportWidth,
      rects,
      overlaps,
      composerVisible: Boolean(input && send),
      composerInputWidth: input?.width ?? 0,
      composerInputBeforeSend: Boolean(input && send && input.right <= send.left + 2),
      sendWithinViewport: Boolean(send && send.right <= viewportWidth + 1),
      composerPlaceholder:
        document
          .querySelector('[data-testid="command-input"]')
          ?.getAttribute("placeholder") ?? "",
    };
  });
  const expectedPlaceholder =
    locale === "zh" ? "向 Jarvis 发送消息" : "Message Jarvis";
  if (
    result.overlaps.length > 0 ||
    !result.composerVisible ||
    result.composerInputWidth < 120 ||
    !result.composerInputBeforeSend ||
    !result.sendWithinViewport ||
    result.composerPlaceholder !== expectedPlaceholder ||
    result.composerPlaceholder.endsWith("...")
  ) {
    throw new Error(
      `Settings V2 shell layout guard failed for ${scenarioName}: ${JSON.stringify(
        result,
      )}`,
    );
  }
  return result;
}

async function assertSearchResults(page, scenarioName, locale) {
  const result = await page.evaluate(() => ({
    titles: [...document.querySelectorAll(".jk-search-result h3")].map(
      (element) => element.textContent?.trim() ?? "",
    ),
    text: document.body.innerText,
  }));
  const resetTitle = locale === "zh" ? "恢复默认设置" : "Restore default settings";
  const pluginTitle = locale === "zh" ? "插件" : "Plugins";
  if (!result.titles.includes(pluginTitle) || result.titles.includes(resetTitle)) {
    throw new Error(
      `Settings V2 search guard failed for ${scenarioName}: ${JSON.stringify({
        titles: result.titles,
      })}`,
    );
  }
  if (
    /this slice|boundary is not connected|developer example|management service|raw descriptor/i.test(
      result.text,
    ) ||
    /本切片|边界尚未接入|开发示例|插件管理服务|原始描述/u.test(result.text)
  ) {
    throw new Error(
      `Settings V2 search internal copy guard failed for ${scenarioName}: ${JSON.stringify(
        result.titles,
      )}`,
    );
  }
  return { titles: result.titles };
}

async function captureScenario([name, width, height, locale, theme, search]) {
  const run = await launchApp({ theme, locale });
  try {
    await setCaptureViewport(run.electronApp, run.page, { width, height });
    await openSettings(run.page);
    await setToolsCategory(run.page);
    if (search) {
      await run.page.getByTestId("settings-v2-search").fill(search);
      await run.page.getByTestId("settings-v2-search-results").waitFor();
    } else {
      await run.page
        .getByText(
          /Safe viewing|安全查看/,
        )
        .first()
        .waitFor({ timeout: 5_000 });
    }
    const layout = await assertLayout(run.page, name, {
      expectToolsVisible: !search,
    });
    const shellLayout = await assertShellLayout(run.page, name, locale);
    const searchResults = search && name.startsWith("tools-plugins-search")
      ? await assertSearchResults(run.page, name, locale)
      : null;
    const themeScope = await assertThemeScope(run.page, theme, name);
    const screenshotPath = path.join(outputDirectory, `${name}.png`);
    await run.page.screenshot({ path: screenshotPath, fullPage: true });
    const screenshotDimensions = await readPngDimensionsFromFile(screenshotPath);
    return {
      name,
      path: screenshotPath,
      screenshotDimensions,
      layout,
      shellLayout,
      searchResults,
      themeScope,
    };
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

async function captureSection(
  page,
  screenshotName,
  testId,
  { electronApp = null, captureVisibleWindow = false } = {},
) {
  const locator = page.getByTestId(testId);
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await page.waitForTimeout(50);
  const rect = await locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      left: Math.round(box.left),
      right: Math.round(box.right),
      top: Math.round(box.top),
      bottom: Math.round(box.bottom),
      width: Math.round(box.width),
      height: Math.round(box.height),
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: document.documentElement.clientHeight,
      withinViewport:
        box.left >= -1 &&
        box.right <= document.documentElement.clientWidth + 1 &&
        box.top >= -1 &&
        box.bottom <= document.documentElement.clientHeight + 1,
    };
  });
  if (!rect.withinViewport) {
    throw new Error(
      `Section ${testId} is outside viewport for ${screenshotName}: ${JSON.stringify(
        rect,
      )}`,
    );
  }
  const screenshotPath = path.join(outputDirectory, `${screenshotName}.png`);
  const browserWindowCapture =
    captureVisibleWindow && electronApp
      ? await captureVisibleBrowserWindow(electronApp, screenshotPath)
      : null;
  if (!browserWindowCapture) {
    await locator.screenshot({ path: screenshotPath });
  }
  const screenshotDimensions =
    browserWindowCapture?.screenshotDimensions ??
    (await readPngDimensionsFromFile(screenshotPath));
  return {
    name: screenshotName,
    path: screenshotPath,
    section: testId,
    rect,
    screenshotDimensions,
    screenshotSource: browserWindowCapture
      ? "electron-webContents.capturePage"
      : "playwright-locator",
  };
}

async function captureSectionSet({
  locale,
  theme,
  viewport,
  prefix,
  zoomFactor,
  useActualBrowserWindowContentSize = false,
}) {
  const run = await launchApp({ theme, locale });
  const screenshots = [];
  try {
    await setCaptureViewport(run.electronApp, run.page, viewport, {
      useActualBrowserWindowContentSize,
    });
    await openSettings(run.page);
    await setToolsCategory(run.page);
    if (zoomFactor) {
      await run.electronApp.evaluate(
        ({ BrowserWindow }, factor) => {
          const mainWindow = BrowserWindow.getAllWindows().find(
            (window) => !window.isDestroyed(),
          );
          mainWindow?.webContents.setZoomFactor(factor);
        },
        zoomFactor,
      );
    }
    await assertLayout(run.page, `${prefix}-top`);
    screenshots.push(
      await captureSection(
        run.page,
        `${prefix}-plugins-section`,
        "settings-v2-tools-section-plugins",
        {
          electronApp: run.electronApp,
          captureVisibleWindow: Boolean(zoomFactor),
        },
      ),
    );
    screenshots.push(
      await captureSection(
        run.page,
        `${prefix}-external-connections-section`,
        "settings-v2-tools-section-mcp",
        {
          electronApp: run.electronApp,
          captureVisibleWindow: Boolean(zoomFactor),
        },
      ),
    );
    return screenshots;
  } finally {
    await run.electronApp.close();
    await rm(run.tempUserData, { force: true, recursive: true });
  }
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const screenshots = [];
for (const scenario of scenarios) {
  screenshots.push(await captureScenario(scenario));
}

const zoomed = await launchApp({ theme: "harbor", locale: "en" });
try {
  const zoomViewport = await setCaptureViewport(
    zoomed.electronApp,
    zoomed.page,
    {
      width: 780,
      height: 980,
    },
    { useActualBrowserWindowContentSize: true },
  );
  await openSettings(zoomed.page);
  await setToolsCategory(zoomed.page);
  const webContentsZoomFactor = await zoomed.electronApp.evaluate(
    ({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows().find(
        (window) => !window.isDestroyed(),
      );
      mainWindow?.webContents.setZoomFactor(2);
      return mainWindow?.webContents.getZoomFactor() ?? 1;
    },
  );
  const zoomLayout = await assertLayout(zoomed.page, "harbor-tools-plugins-zoom200");
  const zoomThemeScope = await assertThemeScope(
    zoomed.page,
    "harbor",
    "harbor-tools-plugins-zoom200",
  );
  const zoomScreenshots = [
      {
        name: "harbor-tools-plugins-zoom200-top",
        scrollTarget: "top",
        coverage: {
          requireCompactCategorySelector: true,
          requireToolsHeading: true,
          requireFirstToolsSection: false,
          requireComposer: false,
        },
      },
    {
      name: "harbor-tools-plugins-zoom200-bottom",
      scrollTarget: "external",
      coverage: {
        requireCompactCategorySelector: false,
        requireToolsHeading: false,
        requireFirstToolsSection: false,
        requirePluginsSection: true,
        requireExternalConnectionsSection: true,
        requireAppHeader: false,
        requireComposer: true,
      },
    },
  ];
  for (const zoomScreenshot of zoomScreenshots) {
    const zoomScrollPosition = await scrollSettingsViewportForZoomEvidence(
      zoomed.page,
      zoomScreenshot.scrollTarget,
    );
    const screenshotPath = path.join(outputDirectory, `${zoomScreenshot.name}.png`);
    const browserWindowCapture = await captureVisibleOperatingSystemWindow(
      zoomed.electronApp,
      screenshotPath,
    );
    const captureDiagnostics = await collectCaptureDiagnostics(
      zoomed.page,
      zoomed.electronApp,
      {
        screenshotPath,
        screenshotDimensions: browserWindowCapture.screenshotDimensions,
        screenCaptureBounds: browserWindowCapture.screenCaptureBounds,
        screenshotSource: "windows-screen-copyfromscreen",
      },
    );
    const visualScreenshotCoverage = assertVisualScreenshotCoverage(
      captureDiagnostics,
      zoomScreenshot.name,
      zoomScreenshot.coverage,
    );
    screenshots.push({
      name: zoomScreenshot.name,
      path: screenshotPath,
      layout: zoomLayout,
      themeScope: zoomThemeScope,
      browserWindowCapture,
      captureDiagnostics,
      zoomViewport,
      zoomScrollPosition,
      visualScreenshotCoverage,
      webContentsZoomFactor,
      devicePixelRatio: await zoomed.page.evaluate(() => window.devicePixelRatio),
    });
    if (zoomScreenshot.scrollTarget === "top") {
      await copyFile(
        screenshotPath,
        path.join(outputDirectory, "harbor-tools-plugins-zoom200.png"),
      );
    }
  }
} finally {
  await zoomed.electronApp.close();
  await rm(zoomed.tempUserData, { force: true, recursive: true });
}

screenshots.push(
  ...(await captureSectionSet({
    locale: "zh",
    theme: "harbor",
    viewport: { width: 1440, height: 940 },
    prefix: "zh-tools",
  })),
  ...(await captureSectionSet({
    locale: "en",
    theme: "harbor",
    viewport: { width: 1440, height: 940 },
    prefix: "en-tools",
  })),
  ...(await captureSectionSet({
    locale: "zh",
    theme: "harbor",
    viewport: { width: 390, height: 900 },
    prefix: "zh-tools-narrow",
  })),
  ...(await captureSectionSet({
    locale: "en",
    theme: "harbor",
    viewport: { width: 390, height: 900 },
    prefix: "en-tools-narrow",
  })),
  ...(await captureSectionSet({
    locale: "en",
    theme: "harbor",
    viewport: { width: 780, height: 980 },
    prefix: "harbor-tools-zoom200",
    zoomFactor: 2,
    useActualBrowserWindowContentSize: true,
  })),
);

const gateOff = await launchApp({
  theme: "harbor",
  locale: "en",
  settingsV2Enabled: false,
});
try {
  await setCaptureViewport(gateOff.electronApp, gateOff.page, {
    width: 1440,
    height: 940,
  });
  await waitForAppReady(gateOff.page);
  await gateOff.page.getByTestId("general-settings").click();
  await gateOff.page.getByTestId("settings-view").waitFor({ timeout: 10_000 });
  const settingsV2Count = await gateOff.page.getByTestId("settings-v2-view").count();
  if (settingsV2Count !== 0) {
    throw new Error("Settings V2 mounted while gate was disabled.");
  }
  const screenshotPath = path.join(outputDirectory, "gate-off-legacy-tools.png");
  await gateOff.page.screenshot({ path: screenshotPath, fullPage: true });
  const screenshotDimensions = await readPngDimensionsFromFile(screenshotPath);
  screenshots.push({
    name: "gate-off-legacy-tools",
    path: screenshotPath,
    screenshotDimensions,
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
      toolExecutionStarted: false,
      windowsExecutorInvoked: false,
      appLaunchStarted: false,
      browserOpenStarted: false,
      fileSearchStarted: false,
      userFilesReadOrModified: false,
      pluginInvocationStarted: false,
      pluginInstallOrActivationStarted: false,
      mcpConnectOrStartStarted: false,
      realNetworkRequestSent: false,
    },
    null,
    2,
  ),
);
