import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

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
  JARVIS_K_ENABLE_SETTINGS_V2: "1",
};

const scenarios = [
  { name: "signal-memory-privacy-wide", width: 1440, height: 940, locale: "en", theme: "signal" },
  { name: "harbor-memory-privacy-wide", width: 1440, height: 940, locale: "en", theme: "harbor" },
  { name: "ember-memory-privacy-wide", width: 1440, height: 940, locale: "en", theme: "ember" },
  { name: "zh-memory-privacy-wide", width: 1440, height: 940, locale: "zh", theme: "harbor" },
  { name: "en-memory-privacy-narrow", width: 390, height: 980, locale: "en", theme: "harbor" },
  { name: "zh-memory-privacy-narrow", width: 390, height: 980, locale: "zh", theme: "harbor" },
  {
    name: "harbor-memory-privacy-zoom200",
    width: 904,
    height: 980,
    locale: "en",
    theme: "harbor",
    zoomFactor: 2,
  },
  {
    name: "memory-search-en",
    width: 1440,
    height: 940,
    locale: "en",
    theme: "harbor",
    search: "memory",
  },
  {
    name: "memory-search-zh",
    width: 1440,
    height: 940,
    locale: "zh",
    theme: "harbor",
    search: "记忆",
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

async function launchApp({ theme, locale, zoomFactor }) {
  const tempUserData = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-memory-"),
  );
  await seedDesktopSettings(tempUserData, { theme });
  const electronApp = await electron.launch({
    args: [`--user-data-dir=${tempUserData}`, "apps/desktop/dist/main.js"],
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
    window.__jarvisUi2fSideEffects = {
      listUserControlledMemoriesStarted: 0,
      deleteUserControlledMemoryStarted: 0,
      memoryRecallProbeStarted: 0,
      memoryImportStarted: 0,
      memoryExportStarted: 0,
      modelOperationStarted: 0,
      networkFetchStarted: 0,
      mediaStreamStarted: 0,
      windowsExecutorStarted: 0,
      appLaunchStarted: 0,
      browserOpenStarted: 0,
      fileSearchStarted: 0,
      pluginInvocationStarted: 0,
      mcpConnectStarted: 0,
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
          const effects = window.__jarvisUi2fSideEffects;
          if (type === "agent.listUserControlledMemories") {
            effects.listUserControlledMemoriesStarted += 1;
          }
          if (type === "agent.deleteUserControlledMemory") {
            effects.deleteUserControlledMemoryStarted += 1;
          }
          if (type === "agent.probeMemoryAlphaRecall") {
            effects.memoryRecallProbeStarted += 1;
          }
          if (type === "agent.importMemorySnapshot") {
            effects.memoryImportStarted += 1;
          }
          if (type === "agent.exportMemorySnapshot") {
            effects.memoryExportStarted += 1;
          }
          if (type.includes("Model") || type.includes("Inference")) {
            effects.modelOperationStarted += 1;
          }
          if (type.includes("windows") || type.includes("Executor")) {
            effects.windowsExecutorStarted += 1;
          }
          if (type.includes("Plugin")) {
            effects.pluginInvocationStarted += 1;
          }
          return originalSendCommand(command);
        };
      }
    };
    const installFetchRecorder = () => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (...args) => {
        window.__jarvisUi2fSideEffects.networkFetchStarted += 1;
        return originalFetch(...args);
      };
      const mediaDevices = navigator.mediaDevices;
      if (mediaDevices?.getUserMedia) {
        const originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
        mediaDevices.getUserMedia = (constraints) => {
          window.__jarvisUi2fSideEffects.mediaStreamStarted += 1;
          return originalGetUserMedia(constraints);
        };
      }
    };
    installFetchRecorder();
    window.__jarvisUi2fInstallCommandRecorder = installCommandRecorder;
    const interval = window.setInterval(() => {
      installCommandRecorder();
      if (window.__jarvisUi2fCommandRecorderInstalled) {
        window.clearInterval(interval);
      }
    }, 5);
  }, locale);
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
    return [viewport.width, viewport.height];
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

async function openSettings(page) {
  await waitForAppReady(page);
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

async function assertMemoryLayout(page, scenario) {
  const result = await page.evaluate((activeLocale) => {
    const text = document.body.innerText;
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
    ];
    const forbiddenZhInternal = [
      "记忆阿尔法",
      "召回服务",
      "路由别名",
      "向量库",
      "嵌入服务",
      "原始快照",
      "内部边界",
      "运行时绑定",
      "测试夹具",
      "数据库路径",
    ];
    return {
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      memoryVisible: Boolean(
        document.querySelector('[data-testid="settings-v2-memory-privacy"]'),
      ),
      memoryCenterMounted: Boolean(
        document.querySelector('[data-testid="memory-view"]'),
      ),
      productCopyReady:
        text.includes(activeLocale === "zh" ? "管理已保存的信息" : "Manage saved information") &&
        text.includes(activeLocale === "zh" ? "当前未启用云端同步。" : "Cloud sync is not currently enabled."),
      forbiddenInternalText: forbiddenInternal.some((term) => text.includes(term)),
      forbiddenZhInternalText:
        activeLocale === "zh" &&
        forbiddenZhInternal.some((term) => text.includes(term)),
      sideEffects: window.__jarvisUi2fSideEffects,
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        dpr: window.devicePixelRatio,
        visualViewportWidth: window.visualViewport?.width ?? null,
        visualViewportScale: window.visualViewport?.scale ?? null,
        scrollY: window.scrollY,
      },
      wideNav: getComputedStyle(
        document.querySelector(".settings-v2-wide-category"),
      ).display,
      compactSelector: getComputedStyle(
        document.querySelector(".settings-v2-narrow-category"),
      ).display,
    };
  }, scenario.locale);

  if (!result.memoryVisible || result.memoryCenterMounted) {
    throw new Error(
      `${scenario.name} mounted unexpected surface: ${JSON.stringify(result)}`,
    );
  }
  if (!result.productCopyReady || result.forbiddenInternalText || result.forbiddenZhInternalText) {
    throw new Error(`${scenario.name} failed product copy guard: ${JSON.stringify(result)}`);
  }
  if (result.bodyHorizontalOverflow) {
    throw new Error(`${scenario.name} has horizontal overflow.`);
  }
  for (const [key, value] of Object.entries(result.sideEffects ?? {})) {
    if (value !== 0) {
      throw new Error(`${scenario.name} side effect ${key}=${value}`);
    }
  }
  return result;
}

async function runScenario(scenario) {
  const { electronApp, page, tempUserData } = await launchApp(scenario);
  try {
    const actualContentSize = await setCaptureViewport(
      electronApp,
      page,
      {
        width: scenario.width,
        height: scenario.height,
      },
      { zoomFactor: scenario.zoomFactor },
    );
    await openSettings(page);
    await page.evaluate(() => {
      window.__jarvisUi2fInstallCommandRecorder?.();
      for (const key of Object.keys(window.__jarvisUi2fSideEffects)) {
        window.__jarvisUi2fSideEffects[key] = 0;
      }
    });
    if (scenario.search) {
      await page.getByTestId("settings-v2-search").fill(scenario.search);
      await page.getByTestId("settings-v2-search-results").waitFor({
        timeout: 5_000,
      });
    } else {
      await setMemoryCategory(page);
    }
    const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
    await page.screenshot({ path: screenshotPath });
    const assertions = scenario.search
      ? await assertSearchLayout(page, scenario)
      : await assertMemoryLayout(page, scenario);
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

async function assertSearchLayout(page, scenario) {
  const result = await page.evaluate((activeLocale) => {
    const text = document.body.innerText;
    const noResult = Boolean(
      document.querySelector('[data-testid="settings-v2-search-empty"]'),
    );
    const resultList = Boolean(
      document.querySelector('[data-testid="settings-v2-search-results"]'),
    );
    return {
      resultList,
      noResult,
      memoryResult:
        text.includes(activeLocale === "zh" ? "记忆与隐私" : "Memory & Privacy") &&
        text.includes(activeLocale === "zh" ? "管理已保存的信息" : "Manage saved information"),
      forbiddenInternalText: /\b(Memory Alpha|memory-recall|route alias|voice alias|vector store|embedding|provider runtime|fixture|schema|IPC)\b/u.test(
        text,
      ),
      bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      sideEffects: window.__jarvisUi2fSideEffects,
    };
  }, scenario.locale);
  if (scenario.search.includes("zz-no-match")) {
    if (!result.noResult) {
      throw new Error(`${scenario.name} did not show the empty search state.`);
    }
  } else if (!result.resultList || !result.memoryResult) {
    throw new Error(`${scenario.name} did not show safe Memory search results.`);
  }
  if (result.forbiddenInternalText || result.bodyHorizontalOverflow) {
    throw new Error(`${scenario.name} failed search guard: ${JSON.stringify(result)}`);
  }
  for (const [key, value] of Object.entries(result.sideEffects ?? {})) {
    if (value !== 0) {
      throw new Error(`${scenario.name} side effect ${key}=${value}`);
    }
  }
  return result;
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const results = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(scenario));
  }
  console.log(JSON.stringify({ outputDirectory, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
