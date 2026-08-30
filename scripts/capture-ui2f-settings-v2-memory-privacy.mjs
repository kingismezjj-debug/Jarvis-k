import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-2f",
  "settings-v2-memory-privacy",
);

const baseEnv = {
  ...process.env,
  JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
};

const sideEffectKeys = [
  "listUserControlledMemoriesStarted",
  "deleteUserControlledMemoryStarted",
  "memoryRecallStarted",
  "memoryProbeStarted",
  "memoryImportStarted",
  "memoryExportStarted",
  "memoryMutationStarted",
  "modelCallStarted",
  "embeddingStarted",
  "realNetworkRequestSent",
  "mediaCalls",
  "fetchCalls",
  "windowsExecutorInvoked",
  "appLaunchStarted",
  "browserOpenStarted",
  "fileSearchStarted",
  "pluginInvocationStarted",
  "mcpConnectOrStartStarted",
];

const memoryPageScenarios = [
  {
    name: "signal-memory-privacy-wide",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "signal",
  },
  {
    name: "harbor-memory-privacy-wide",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "harbor",
  },
  {
    name: "ember-memory-privacy-wide",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "ember",
  },
  {
    name: "zh-memory-privacy-wide",
    width: 1440,
    height: 940,
    locale: "zh",
    theme: "harbor",
  },
  {
    name: "en-memory-privacy-narrow-top",
    width: 390,
    height: 980,
    locale: "en",
    theme: "harbor",
    view: "top",
  },
  {
    name: "en-memory-privacy-narrow-bottom",
    width: 390,
    height: 980,
    locale: "en",
    theme: "harbor",
    view: "bottom",
  },
  {
    name: "zh-memory-privacy-narrow-top",
    width: 390,
    height: 980,
    locale: "zh",
    theme: "harbor",
    view: "top",
  },
  {
    name: "zh-memory-privacy-narrow-bottom",
    width: 390,
    height: 980,
    locale: "zh",
    theme: "harbor",
    view: "bottom",
  },
  {
    name: "harbor-memory-privacy-zoom200-top",
    width: 904,
    height: 980,
    locale: "en",
    theme: "harbor",
    zoomFactor: 2,
    view: "top",
  },
  {
    name: "harbor-memory-privacy-zoom200-bottom",
    width: 904,
    height: 980,
    locale: "en",
    theme: "harbor",
    zoomFactor: 2,
    view: "bottom",
  },
];

const searchScenarios = [
  {
    name: "memory-search-en",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "harbor",
    search: "saved information",
  },
  {
    name: "memory-search-zh",
    width: 1440,
    height: 940,
    locale: "zh",
    theme: "harbor",
    search: "Jarvis",
  },
  {
    name: "memory-search-empty",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "harbor",
    search: "zz-no-match-memory",
  },
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

async function launchApp({
  theme,
  locale,
  zoomFactor,
  settingsV2Enabled = true,
}) {
  const tempUserData = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-memory-"),
  );
  await seedDesktopSettings(tempUserData, { theme });
  const electronApp = await electron.launch({
    args: [`--user-data-dir=${tempUserData}`, "apps/desktop/dist/main.js"],
    cwd: rootDirectory,
    env: {
      ...baseEnv,
      JARVIS_K_ENABLE_SETTINGS_V2: settingsV2Enabled ? "1" : "",
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
      window.__jarvisUi2fSideEffects = Object.fromEntries(
        keys.map((key) => [key, 0]),
      );
      const mark = (key) => {
        window.__jarvisUi2fSideEffects[key] =
          (window.__jarvisUi2fSideEffects[key] ?? 0) + 1;
      };
      const installCommandRecorder = () => {
        if (!window.jarvis || window.__jarvisUi2fCommandRecorderInstalled) {
          return;
        }
        window.__jarvisUi2fCommandRecorderInstalled = true;
        const originalSendCommand = window.jarvis.sendCommand?.bind(window.jarvis);
        if (originalSendCommand) {
          window.jarvis.sendCommand = async (command) => {
            const type = typeof command?.type === "string" ? command.type : "";
            if (type === "agent.listUserControlledMemories") {
              mark("listUserControlledMemoriesStarted");
            }
            if (type === "agent.deleteUserControlledMemory") {
              mark("deleteUserControlledMemoryStarted");
              mark("memoryMutationStarted");
            }
            if (type === "agent.probeMemoryAlphaRecall") {
              mark("memoryRecallStarted");
              mark("memoryProbeStarted");
            }
            if (type === "agent.importMemorySnapshot") {
              mark("memoryImportStarted");
              mark("memoryMutationStarted");
            }
            if (type === "agent.exportMemorySnapshot") {
              mark("memoryExportStarted");
            }
            if (
              /Model|Inference|Qwen|GLM|DeepSeek|CloudProvider|Acceptance/u.test(
                type,
              )
            ) {
              mark("modelCallStarted");
            }
            if (/Embedding|embedding/u.test(type)) {
              mark("embeddingStarted");
            }
            if (/windows|Executor/u.test(type)) {
              mark("windowsExecutorInvoked");
            }
            if (/desktop\.open|appLaunch/u.test(type)) {
              mark("appLaunchStarted");
            }
            if (/browser\.open|openUrl/u.test(type)) {
              mark("browserOpenStarted");
            }
            if (/filesystem\.search|fileSearch/u.test(type)) {
              mark("fileSearchStarted");
            }
            if (/Plugin/u.test(type)) {
              mark("pluginInvocationStarted");
            }
            if (/Mcp|MCP|mcp/u.test(type)) {
              mark("mcpConnectOrStartStarted");
            }
            return originalSendCommand(command);
          };
        }
      };
      const originalFetch = window.fetch.bind(window);
      window.fetch = (...args) => {
        mark("fetchCalls");
        mark("realNetworkRequestSent");
        return originalFetch(...args);
      };
      const mediaDevices = navigator.mediaDevices;
      if (mediaDevices?.getUserMedia) {
        const originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
        mediaDevices.getUserMedia = (constraints) => {
          mark("mediaCalls");
          return originalGetUserMedia(constraints);
        };
      }
      window.__jarvisUi2fInstallCommandRecorder = installCommandRecorder;
      const interval = window.setInterval(() => {
        installCommandRecorder();
        if (window.__jarvisUi2fCommandRecorderInstalled) {
          window.clearInterval(interval);
        }
      }, 5);
    },
    { language: locale, keys: sideEffectKeys },
  );
  await page.reload();
  if (zoomFactor) {
    await electronApp.evaluate(({ BrowserWindow }, factor) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      mainWindow?.webContents.setZoomFactor(factor);
    }, zoomFactor);
  }
  return { electronApp, page, tempUserData };
}

async function setCaptureViewport(electronApp, page, viewport, { zoomFactor } = {}) {
  if (viewport.width < 900 && !zoomFactor) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(100);
    return viewport.width && viewport.height
      ? [viewport.width, viewport.height]
      : null;
  }
  const actualContentSize = await electronApp.evaluate(
    ({ BrowserWindow }, size) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      mainWindow?.setContentSize(size.width, size.height);
      return mainWindow?.getContentSize() ?? [size.width, size.height];
    },
    viewport,
  );
  await page.setViewportSize({
    width: actualContentSize[0],
    height: actualContentSize[1],
  });
  await page.waitForTimeout(100);
  return actualContentSize;
}

async function waitForAppReady(page) {
  await page.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await page.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });
}

async function resetSideEffects(page) {
  await page.evaluate((keys) => {
    window.__jarvisUi2fInstallCommandRecorder?.();
    for (const key of keys) {
      window.__jarvisUi2fSideEffects[key] = 0;
    }
  }, sideEffectKeys);
}

async function openSettings(page) {
  await page.getByTestId("general-settings").click();
  await page.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
}

async function setMemoryCategory(page) {
  const navButtons = page.locator('[data-testid="settings-v2-category-nav"] button');
  if ((await navButtons.count()) > 0 && (await navButtons.first().isVisible())) {
    await navButtons.nth(5).click();
  } else {
    await page
      .locator(".settings-v2-narrow-category select")
      .selectOption("memory_privacy");
  }
  await page.getByTestId("settings-v2-memory-privacy").waitFor({
    timeout: 5_000,
  });
}

async function scrollMemoryView(page, view) {
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
      for (let index = 0; index < 4; index += 1) {
        const rect = target.getBoundingClientRect();
        const delta = rect.top - topOffset;
        if (Math.abs(delta) <= 2) break;
        scrollBy(container, delta);
      }
    };

    if (targetView === "bottom") {
      alignElementTop(
        document.querySelector('[data-testid="settings-v2-memory-saved-status"]'),
        32,
      );
      return;
    }

    const compactSelector = document.querySelector(".settings-v2-narrow-category");
    const heading = document.querySelector(
      '[data-testid="settings-v2-memory-privacy"] h1',
    );
    if (compactSelector && heading && getComputedStyle(compactSelector).display !== "none") {
      alignElementTop(compactSelector, 24);
      return;
    }
    alignElementTop(heading, 24);
  }, view);
  await page.waitForTimeout(100);
}

function rectangleToObject(rect) {
  if (!rect) return null;
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    top: Math.round(rect.top),
    right: Math.round(rect.right),
    bottom: Math.round(rect.bottom),
    left: Math.round(rect.left),
  };
}

async function readPngSize(filePath) {
  const buffer = await readFile(filePath);
  if (
    buffer.length < 24 ||
    buffer.readUInt32BE(0) !== 0x89504e47 ||
    buffer.readUInt32BE(4) !== 0x0d0a1a0a
  ) {
    throw new Error(`${filePath} is not a PNG file.`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
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
    screenshot: await readPngSize(screenshotPath),
  };
}

function assertNoPageSideEffects(name, sideEffects) {
  for (const [key, value] of Object.entries(sideEffects ?? {})) {
    if (value !== 0) {
      throw new Error(`${name} side effect ${key}=${value}`);
    }
  }
}

async function collectMemoryDiagnostics(page, scenario, screenshotPath) {
  const result = await page.evaluate((activeLocale) => {
    const text = document.body.innerText;
    const visualWidth = window.visualViewport?.width ?? window.innerWidth;
    const visualHeight = window.visualViewport?.height ?? window.innerHeight;
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
      };
    };
    const intersects = (rect) =>
      Boolean(
        rect &&
          rect.right > 0 &&
          rect.left < visualWidth &&
          rect.bottom > 0 &&
          rect.top < visualHeight,
      );
    const horizontallyInside = (rect) =>
      Boolean(rect && rect.left >= -1 && rect.right <= visualWidth + 1);
    const scrollContainers = Array.from(document.querySelectorAll("*"))
      .filter((element) => element.scrollHeight > element.clientHeight + 1)
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        testId: element.getAttribute("data-testid"),
        className:
          typeof element.className === "string"
            ? element.className.split(/\s+/u).slice(0, 3).join(" ")
            : "",
        scrollTop: Math.round(element.scrollTop),
        clientHeight: Math.round(element.clientHeight),
        scrollHeight: Math.round(element.scrollHeight),
      }));
    const forbiddenInternal = [
      "Memory Alpha",
      "memory-recall",
      "route alias",
      "voice alias",
      "vector store",
      "embedding",
      "provider runtime",
      "RAW_HIDDEN",
      "PROVIDER_NEUTRAL",
      "retention mutation",
      "raw snapshot",
      "fixture",
      "schema",
      "IPC",
      "boundary metrics",
      "SQLite",
      "runtime status",
      "trusted runtime",
      "snapshot",
      "projection",
      "source of truth",
      "existing feature binding",
      "可信运行状态",
      "状态投影",
      "内部状态来源",
    ];
    const wideNavRect = rectFor(".settings-v2-wide-category");
    const compactSelectorRect = rectFor(".settings-v2-narrow-category");
    const headingRect = rectFor('[data-testid="settings-v2-memory-privacy"] h1');
    const personalRect = rectFor('[data-testid="settings-v2-memory-personal-status"]');
    const savedRect = rectFor('[data-testid="settings-v2-memory-saved-status"]');
    const storageRect = rectFor('[data-testid="settings-v2-memory-storage-status"]');
    const composerInputRect = rectFor('[data-testid="command-input"]');
    const sendButtonRect = rectFor('[data-testid="send-command"]');
    return {
      text,
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      memoryVisible: Boolean(
        document.querySelector('[data-testid="settings-v2-memory-privacy"]'),
      ),
      memoryCenterMounted: Boolean(
        document.querySelector('[data-testid="memory-view"]'),
      ),
      productCopyReady:
        text.includes(
          activeLocale === "zh"
            ? "Jarvis 可以使用已保存的信息"
            : "Jarvis can use saved information",
        ) &&
        text.includes(activeLocale === "zh" ? "管理已保存的信息" : "Manage saved information") &&
        text.includes(activeLocale === "zh" ? "当前未启用云端同步。" : "Cloud sync is not currently enabled."),
      manageValueReady: text.includes(activeLocale === "zh" ? "管理" : "Manage"),
      forbiddenInternalText: forbiddenInternal.some((term) => text.includes(term)),
      sideEffects: window.__jarvisUi2fSideEffects,
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        dpr: window.devicePixelRatio,
        visualViewportWidth: window.visualViewport?.width ?? null,
        visualViewportHeight: window.visualViewport?.height ?? null,
        visualViewportScale: window.visualViewport?.scale ?? null,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        scrollContainers,
      },
      wideNav: getComputedStyle(
        document.querySelector(".settings-v2-wide-category"),
      ).display,
      compactSelector: getComputedStyle(
        document.querySelector(".settings-v2-narrow-category"),
      ).display,
      rects: {
        wideNav: wideNavRect,
        compactSelector: compactSelectorRect,
        heading: headingRect,
        personalStatus: personalRect,
        savedStatus: savedRect,
        storageStatus: storageRect,
        composerInput: composerInputRect,
        sendButton: sendButtonRect,
      },
      intersections: {
        compactSelector: intersects(compactSelectorRect),
        heading: intersects(headingRect),
        personalStatus: intersects(personalRect),
        savedStatus: intersects(savedRect),
        storageStatus: intersects(storageRect),
        composerInput: intersects(composerInputRect),
        sendButton: intersects(sendButtonRect),
        savedHorizontalInside: horizontallyInside(savedRect),
        storageHorizontalInside: horizontallyInside(storageRect),
        sendButtonHorizontalInside: horizontallyInside(sendButtonRect),
      },
    };
  }, scenario.locale);

  const screenshotSize = await readPngSize(screenshotPath);
  result.screenshot = screenshotSize;
  result.rects = Object.fromEntries(
    Object.entries(result.rects).map(([key, rect]) => [key, rectangleToObject(rect)]),
  );

  if (
    !result.memoryVisible ||
    result.memoryCenterMounted ||
    !result.productCopyReady ||
    !result.manageValueReady ||
    result.forbiddenInternalText
  ) {
    throw new Error(
      `${scenario.name} failed Memory product copy guard: ${JSON.stringify(result)}`,
    );
  }
  if (result.bodyHorizontalOverflow) {
    throw new Error(`${scenario.name} has horizontal overflow.`);
  }
  if ((scenario.width < 900 || scenario.zoomFactor) && result.wideNav !== "none") {
    throw new Error(`${scenario.name} did not hide the wide navigation.`);
  }
  if ((scenario.width < 900 || scenario.zoomFactor) && result.compactSelector === "none") {
    throw new Error(`${scenario.name} did not show the compact selector.`);
  }
  if (scenario.view === "top") {
    if (!result.intersections.compactSelector || !result.intersections.heading) {
      throw new Error(
        `${scenario.name} top evidence is missing key content: ${JSON.stringify(result)}`,
      );
    }
  }
  if (scenario.view === "bottom") {
    if (
      !result.intersections.savedStatus ||
      !result.intersections.storageStatus ||
      !result.intersections.composerInput ||
      !result.intersections.sendButton ||
      !result.intersections.storageHorizontalInside ||
      !result.intersections.sendButtonHorizontalInside
    ) {
      throw new Error(`${scenario.name} bottom evidence is missing key content.`);
    }
  }
  assertNoPageSideEffects(scenario.name, result.sideEffects);
  return result;
}

async function runMemoryScenario(scenario) {
  const { electronApp, page, tempUserData } = await launchApp(scenario);
  try {
    const actualContentSize = await setCaptureViewport(
      electronApp,
      page,
      { width: scenario.width, height: scenario.height },
      { zoomFactor: scenario.zoomFactor },
    );
    await waitForAppReady(page);
    await resetSideEffects(page);
    await openSettings(page);
    await setMemoryCategory(page);
    await scrollMemoryView(page, scenario.view);
    const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
    const surfaceCapture = scenario.zoomFactor
      ? await captureVisibleOperatingSystemWindow(electronApp, screenshotPath)
      : null;
    if (!surfaceCapture) {
      await page.screenshot({ path: screenshotPath });
    }
    const assertions = await collectMemoryDiagnostics(page, scenario, screenshotPath);
    return {
      name: scenario.name,
      screenshotPath,
      actualContentSize,
      surfaceCapture,
      assertions,
    };
  } finally {
    await electronApp.close();
    await rm(tempUserData, { force: true, recursive: true });
  }
}

async function assertSearchLayout(page, scenario, screenshotPath) {
  const result = await page.evaluate((activeLocale) => {
    const text = document.body.innerText;
    const noResult = Boolean(
      document.querySelector('[data-testid="settings-v2-search-empty"]'),
    );
    const resultList = Boolean(
      document.querySelector('[data-testid="settings-v2-search-results"]'),
    );
    const resultText = document.querySelector(
      '[data-testid="settings-v2-search-results"]',
    )?.textContent ?? "";
    return {
      resultList,
      noResult,
      memoryResult:
        text.includes(activeLocale === "zh" ? "记忆与隐私" : "Memory & Privacy") &&
        text.includes(activeLocale === "zh" ? "管理已保存的信息" : "Manage saved information"),
      actionHasCurrentValue:
        resultText.includes(
          activeLocale === "zh"
            ? "当前值：现有记忆中心"
            : "Current value: Existing Memory Center",
        ) ||
        resultText.includes(
          activeLocale === "zh" ? "当前值: 现有记忆中心" : "Current value: Existing Memory Center",
        ) ||
        resultText.includes(activeLocale === "zh" ? "当前值：管理" : "Current value: Manage"),
      stateHasCurrentValue:
        resultText.includes(
          activeLocale === "zh" ? "当前值" : "Current value",
        ) &&
        resultText.includes(activeLocale === "zh" ? "当前未启用" : "Not currently enabled"),
      forbiddenInternalText: /\b(Memory Alpha|memory-recall|route alias|voice alias|vector store|embedding|provider runtime|fixture|schema|IPC|runtime status|trusted runtime|snapshot|projection|source of truth|existing feature binding)\b/u.test(
        text,
      ) || text.includes("可信运行状态") || text.includes("状态投影"),
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      sideEffects: window.__jarvisUi2fSideEffects,
    };
  }, scenario.locale);
  const screenshot = await readPngSize(screenshotPath);
  result.screenshot = screenshot;
  if (scenario.search.includes("zz-no-match")) {
    if (!result.noResult) {
      throw new Error(`${scenario.name} did not show the empty search state.`);
    }
  } else if (
    !result.resultList ||
    !result.memoryResult ||
    result.actionHasCurrentValue ||
    !result.stateHasCurrentValue
  ) {
    throw new Error(
      `${scenario.name} did not show safe Memory search results: ${JSON.stringify(result)}`,
    );
  }
  if (result.forbiddenInternalText || result.bodyHorizontalOverflow) {
    throw new Error(`${scenario.name} failed search guard: ${JSON.stringify(result)}`);
  }
  assertNoPageSideEffects(scenario.name, result.sideEffects);
  return result;
}

async function runSearchScenario(scenario) {
  const { electronApp, page, tempUserData } = await launchApp(scenario);
  try {
    const actualContentSize = await setCaptureViewport(electronApp, page, {
      width: scenario.width,
      height: scenario.height,
    });
    await waitForAppReady(page);
    await resetSideEffects(page);
    await openSettings(page);
    await page.getByTestId("settings-v2-search").fill(scenario.search);
    await page.getByTestId("settings-v2-search-results").waitFor({
      timeout: 5_000,
    });
    const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
    await page.screenshot({ path: screenshotPath });
    const assertions = await assertSearchLayout(page, scenario, screenshotPath);
    return {
      name: scenario.name,
      screenshotPath,
      actualContentSize,
      assertions,
    };
  } finally {
    await electronApp.close();
    await rm(tempUserData, { force: true, recursive: true });
  }
}

async function runManageNavigationScenario() {
  const scenario = {
    name: "memory-manage-navigation",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "harbor",
  };
  const { electronApp, page, tempUserData } = await launchApp(scenario);
  try {
    const actualContentSize = await setCaptureViewport(electronApp, page, {
      width: scenario.width,
      height: scenario.height,
    });
    await waitForAppReady(page);
    await resetSideEffects(page);
    await openSettings(page);
    await setMemoryCategory(page);
    await page.locator(".jk-value-action").filter({ hasText: "Manage" }).click();
    await page.getByTestId("memory-view").waitFor({ timeout: 5_000 });
    const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
    await page.screenshot({ path: screenshotPath });
    const assertions = await page.evaluate(() => ({
      memoryCenterMounted: Boolean(document.querySelector('[data-testid="memory-view"]')),
      settingsV2MemoryMounted: Boolean(
        document.querySelector('[data-testid="settings-v2-memory-privacy"]'),
      ),
      realUserContentVisible: false,
      sideEffects: window.__jarvisUi2fSideEffects,
      textHasMemoryCenterHeading: document.body.innerText.includes(
        "User-controlled memory",
      ),
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
    }));
    assertions.screenshot = await readPngSize(screenshotPath);
    if (
      !assertions.memoryCenterMounted ||
      assertions.settingsV2MemoryMounted ||
      !assertions.textHasMemoryCenterHeading ||
      assertions.bodyHorizontalOverflow
    ) {
      throw new Error(
        `Memory manage navigation failed: ${JSON.stringify(assertions)}`,
      );
    }
    for (const [key, value] of Object.entries(assertions.sideEffects ?? {})) {
      const allowedSafeNavigationList =
        key === "listUserControlledMemoriesStarted" && value >= 0;
      if (!allowedSafeNavigationList && value !== 0) {
        throw new Error(`Manage navigation side effect ${key}=${value}`);
      }
    }
    return {
      name: scenario.name,
      screenshotPath,
      actualContentSize,
      assertions,
    };
  } finally {
    await electronApp.close();
    await rm(tempUserData, { force: true, recursive: true });
  }
}

async function runGateOffScenario() {
  const scenario = {
    name: "gate-off-legacy-memory",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "harbor",
    settingsV2Enabled: false,
  };
  const { electronApp, page, tempUserData } = await launchApp(scenario);
  try {
    const actualContentSize = await setCaptureViewport(electronApp, page, {
      width: scenario.width,
      height: scenario.height,
    });
    await waitForAppReady(page);
    await resetSideEffects(page);
    await page.getByTestId("general-settings").click();
    await page.getByTestId("settings-view").waitFor({ timeout: 10_000 });
    const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
    await page.screenshot({ path: screenshotPath });
    const assertions = await page.evaluate(() => ({
      legacyMounted: Boolean(document.querySelector('[data-testid="settings-view"]')),
      settingsV2Mounted: Boolean(
        document.querySelector('[data-testid="settings-v2-view"]'),
      ),
      sideEffects: window.__jarvisUi2fSideEffects,
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
    }));
    assertions.screenshot = await readPngSize(screenshotPath);
    if (
      !assertions.legacyMounted ||
      assertions.settingsV2Mounted ||
      assertions.bodyHorizontalOverflow
    ) {
      throw new Error(`Gate-off legacy failed: ${JSON.stringify(assertions)}`);
    }
    assertNoPageSideEffects(scenario.name, assertions.sideEffects);
    return {
      name: scenario.name,
      screenshotPath,
      actualContentSize,
      assertions,
    };
  } finally {
    await electronApp.close();
    await rm(tempUserData, { force: true, recursive: true });
  }
}

async function main() {
  await rm(outputDirectory, { force: true, recursive: true });
  await mkdir(outputDirectory, { recursive: true });
  const results = [];
  for (const scenario of memoryPageScenarios) {
    results.push(await runMemoryScenario(scenario));
  }
  for (const scenario of searchScenarios) {
    results.push(await runSearchScenario(scenario));
  }
  results.push(await runManageNavigationScenario());
  results.push(await runGateOffScenario());
  console.log(JSON.stringify({ outputDirectory, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
