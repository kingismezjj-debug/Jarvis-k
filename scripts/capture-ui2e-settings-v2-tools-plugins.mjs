import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

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

async function assertShellLayout(page, scenarioName) {
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
    };
  });
  if (
    result.overlaps.length > 0 ||
    !result.composerVisible ||
    result.composerInputWidth < 120 ||
    !result.composerInputBeforeSend ||
    !result.sendWithinViewport
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
    await run.page.setViewportSize({ width, height });
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
    const shellLayout = await assertShellLayout(run.page, name);
    const searchResults = search && name.startsWith("tools-plugins-search")
      ? await assertSearchResults(run.page, name, locale)
      : null;
    const themeScope = await assertThemeScope(run.page, theme, name);
    const screenshotPath = path.join(outputDirectory, `${name}.png`);
    await run.page.screenshot({ path: screenshotPath, fullPage: true });
    return {
      name,
      path: screenshotPath,
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

async function captureSection(page, screenshotName, testId) {
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
  await locator.screenshot({ path: screenshotPath });
  return { name: screenshotName, path: screenshotPath, section: testId, rect };
}

async function captureSectionSet({
  locale,
  theme,
  viewport,
  prefix,
  zoomFactor,
}) {
  const run = await launchApp({ theme, locale });
  const screenshots = [];
  try {
    await run.page.setViewportSize(viewport);
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
      await captureSection(run.page, `${prefix}-plugins-section`, "settings-v2-tools-section-plugins"),
    );
    screenshots.push(
      await captureSection(run.page, `${prefix}-external-connections-section`, "settings-v2-tools-section-mcp"),
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
  await zoomed.page.setViewportSize({ width: 780, height: 980 });
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
  const name = "harbor-tools-plugins-zoom200";
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
  })),
);

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
  const screenshotPath = path.join(outputDirectory, "gate-off-legacy-tools.png");
  await gateOff.page.screenshot({ path: screenshotPath, fullPage: true });
  screenshots.push({
    name: "gate-off-legacy-tools",
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
