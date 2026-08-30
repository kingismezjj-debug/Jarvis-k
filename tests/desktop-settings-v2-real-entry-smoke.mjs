import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-3b",
  "settings-v2-gate",
);
const packagedExecutablePath = path.join(
  rootDirectory,
  "artifacts",
  "packaged",
  "win-unpacked",
  "Jarvis-K Alpha.exe",
);
const sideEffectZeroes = {
  fetch: 0,
  realNetwork: 0,
  microphoneMedia: 0,
  modelProvider: 0,
  taskBackground: 0,
  pluginMcp: 0,
  appBrowserFile: 0,
  notification: 0,
  updater: 0,
  externalUrl: 0,
  clipboard: 0,
  windowsExecutor: 0,
};

async function seedDesktopSettings(userDataDirectory) {
  await writeFile(
    path.join(userDataDirectory, "jarvis-k-desktop-settings.json"),
    JSON.stringify(
      {
        closeButtonBehavior: "minimize_to_tray",
        closeToTrayNoticeShown: true,
        launchAtLoginEnabled: false,
        uiTheme: "signal",
        uiThemeExplicitlyConfigured: true,
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
  );
}

async function launchDevelopmentDesktop({ settingsV2EnvValue }) {
  const userDataDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-real-entry-"),
  );
  await seedDesktopSettings(userDataDirectory);
  const env = {
    ...process.env,
    JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
    JARVIS_K_USER_DATA_PATH: userDataDirectory,
    JARVIS_K_LOCAL_DATA_PATH: userDataDirectory,
    JARVIS_K_MEMORY_DB_PATH: path.join(userDataDirectory, "memory.sqlite"),
    JARVIS_K_MODEL_DIR: path.join(userDataDirectory, "models"),
    JARVIS_K_VOICE_REGRESSION_PATH: path.join(
      userDataDirectory,
      "voice-regression.json",
    ),
  };
  delete env.JARVIS_K_ENABLE_SETTINGS_V2;
  if (settingsV2EnvValue !== undefined) {
    env.JARVIS_K_ENABLE_SETTINGS_V2 = settingsV2EnvValue;
  }
  const electronApp = await electron.launch({
    args: [
      `--user-data-dir=${userDataDirectory}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env,
  });
  return { electronApp, userDataDirectory };
}

async function ensurePackagedAlphaExecutable() {
  const builder =
    process.platform === "win32"
      ? path.join(rootDirectory, "node_modules", ".bin", "electron-builder.cmd")
      : path.join(rootDirectory, "node_modules", ".bin", "electron-builder");
  if (!existsSync(builder)) {
    throw new Error(`electron-builder executable is missing: ${builder}`);
  }
  await execFileAsync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "& $env:JARVIS_K_ELECTRON_BUILDER --win --x64 --dir",
    ],
    {
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_ELECTRON_BUILDER: builder,
      JARVIS_K_ENABLE_SETTINGS_V2: "0",
    },
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 20,
    },
  );
  if (!existsSync(packagedExecutablePath)) {
    throw new Error(`Packaged Alpha executable is missing: ${packagedExecutablePath}`);
  }
}

async function launchPackagedAlphaDesktop({ settingsV2EnvValue }) {
  const tempRootDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-alpha-gate-"),
  );
  const roamingRoot = path.join(tempRootDirectory, "roaming");
  const localRoot = path.join(tempRootDirectory, "local");
  const alphaUserDataDirectory = path.join(roamingRoot, "Jarvis-K-Alpha");
  await mkdir(alphaUserDataDirectory, { recursive: true });
  await mkdir(localRoot, { recursive: true });
  await seedDesktopSettings(alphaUserDataDirectory);
  const env = {
    ...process.env,
    APPDATA: roamingRoot,
    LOCALAPPDATA: localRoot,
    JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
  };
  delete env.NODE_ENV;
  delete env.VITEST;
  delete env.JARVIS_K_USER_DATA_PATH;
  delete env.JARVIS_K_LOCAL_DATA_PATH;
  delete env.JARVIS_K_MEMORY_DB_PATH;
  delete env.JARVIS_K_MODEL_DIR;
  delete env.JARVIS_K_VOICE_REGRESSION_PATH;
  delete env.JARVIS_K_ENABLE_SETTINGS_V2;
  if (settingsV2EnvValue !== undefined) {
    env.JARVIS_K_ENABLE_SETTINGS_V2 = settingsV2EnvValue;
  }
  const electronApp = await electron.launch({
    executablePath: packagedExecutablePath,
    args: [`--user-data-dir=${alphaUserDataDirectory}`],
    cwd: tempRootDirectory,
    env,
  });
  return {
    electronApp,
    userDataDirectory: tempRootDirectory,
  };
}

async function openSettings(window) {
  await window.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });
  await window.getByTestId("general-settings").click();
}

async function countVisibleText(window, text) {
  return window.getByText(text, { exact: false }).count();
}

async function installSideEffectCounters(window) {
  await window.addInitScript(() => {
    window.__jarvisSettingsV2MediaCalls = 0;
    window.__jarvisSettingsV2FetchCalls = 0;
    window.__jarvisSettingsV2NotificationCalls = 0;
    window.__jarvisSettingsV2ClipboardCalls = 0;
    const mediaDevices = navigator.mediaDevices;
    if (mediaDevices?.getUserMedia) {
      const original = mediaDevices.getUserMedia.bind(mediaDevices);
      mediaDevices.getUserMedia = (constraints) => {
        window.__jarvisSettingsV2MediaCalls += 1;
        return original(constraints);
      };
    }
    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args) => {
      window.__jarvisSettingsV2FetchCalls += 1;
      return originalFetch(...args);
    };
    const OriginalNotification = window.Notification;
    if (typeof OriginalNotification === "function") {
      window.Notification = function Notification(...args) {
        window.__jarvisSettingsV2NotificationCalls += 1;
        return Reflect.construct(OriginalNotification, args, new.target);
      };
      Object.setPrototypeOf(window.Notification, OriginalNotification);
      window.Notification.prototype = OriginalNotification.prototype;
      Object.defineProperty(window.Notification, "permission", {
        configurable: true,
        get: () => OriginalNotification.permission,
      });
      window.Notification.requestPermission = (...args) => {
        window.__jarvisSettingsV2NotificationCalls += 1;
        return OriginalNotification.requestPermission(...args);
      };
    }
    if (navigator.clipboard?.writeText) {
      const originalWriteText = navigator.clipboard.writeText.bind(
        navigator.clipboard,
      );
      navigator.clipboard.writeText = (...args) => {
        window.__jarvisSettingsV2ClipboardCalls += 1;
        return originalWriteText(...args);
      };
    }
  });
  await window.reload();
}

async function collectSideEffects(window) {
  const rendererCounts = await window.evaluate(() => ({
    mediaCalls: window.__jarvisSettingsV2MediaCalls ?? 0,
    fetchCalls: window.__jarvisSettingsV2FetchCalls ?? 0,
    notificationCalls: window.__jarvisSettingsV2NotificationCalls ?? 0,
    clipboardCalls: window.__jarvisSettingsV2ClipboardCalls ?? 0,
  }));
  return {
    ...sideEffectZeroes,
    fetch: rendererCounts.fetchCalls,
    realNetwork: 0,
    microphoneMedia: rendererCounts.mediaCalls,
    notification: rendererCounts.notificationCalls,
    clipboard: rendererCounts.clipboardCalls,
  };
}

function assertNoSideEffects(input) {
  for (const [name, count] of Object.entries(input.sideEffects)) {
    if (count !== 0) {
      throw new Error(`${input.scenario} produced side effect ${name}=${count}`);
    }
  }
}

async function assertSettingsV2Coverage(window) {
  await window.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
  await window.getByText("Jarvis Control Center").waitFor({
    timeout: 5_000,
  });

  const categoryCount = await window
    .locator('[data-testid="settings-v2-category-nav"] button')
    .count();
  await window
    .locator('[data-testid="settings-v2-category-nav"] button')
    .filter({ hasText: "Appearance & Pet" })
    .click();
  await window.getByTestId("settings-v2-appearance-pet").waitFor({
    timeout: 5_000,
  });
  await window.getByText("Interface theme").waitFor({ timeout: 5_000 });
  await window.getByText("Show Desktop Pet").waitFor({ timeout: 5_000 });
  await window
    .locator('[data-testid="settings-v2-category-nav"] button')
    .filter({ hasText: "Voice & Audio" })
    .click();
  await window.getByTestId("settings-v2-voice-audio").waitFor({
    timeout: 5_000,
  });
  await window.getByText("Speech recognition service").waitFor({
    timeout: 5_000,
  });
  await window.getByText("Not configured").first().waitFor({
    timeout: 5_000,
  });
  await window.getByRole("heading", { name: "Wake word" }).waitFor({
    timeout: 5_000,
  });
  await window
    .locator('[data-testid="settings-v2-category-nav"] button')
    .filter({ hasText: "Models & Intelligence" })
    .click();
  await window.getByTestId("settings-v2-models-intelligence").waitFor({
    timeout: 5_000,
  });
  await window
    .getByRole("heading", { name: "Fast command understanding" })
    .waitFor({
      timeout: 5_000,
    });
  await window.getByText("Online answer service", { exact: true }).waitFor({
    timeout: 5_000,
  });
  await window.getByRole("heading", { name: "Local models" }).waitFor({
    timeout: 5_000,
  });
  await window
    .getByText(
      "Opening this page does not connect online services or load, download, or delete models.",
      { exact: true },
    )
    .waitFor({
      timeout: 5_000,
    });
  await window
    .locator('[data-testid="settings-v2-category-nav"] button')
    .filter({ hasText: "Tools & Plugins" })
    .click();
  await window.getByTestId("settings-v2-tools-plugins").waitFor({
    timeout: 5_000,
  });
  await window.getByText("Automation safeguards").waitFor({
    timeout: 5_000,
  });
  await window
    .getByTestId("settings-v2-tools-section-plugins")
    .getByRole("heading", { name: "Plugins" })
    .waitFor({
      timeout: 5_000,
    });
  await window
    .getByTestId("settings-v2-tools-section-mcp")
    .getByRole("heading", { name: "External tool connections" })
    .waitFor({
      timeout: 5_000,
    });
  await window
    .getByText(
      "Opening or viewing this page does not run tools, launch apps, open websites, search files, invoke plugins, or connect external tools. Some plugins and external tools may use non-local connections only after separate setup and confirmation.",
      { exact: true },
    )
    .waitFor({
      timeout: 5_000,
    });
  await window
    .locator('[data-testid="settings-v2-category-nav"] button')
    .filter({ hasText: "Memory & Privacy" })
    .click();
  await window.getByTestId("settings-v2-memory-privacy").waitFor({
    timeout: 5_000,
  });
  const memorySection = window.getByTestId("settings-v2-memory-privacy");
  await memorySection.getByText("Personal memory features").waitFor({
    timeout: 5_000,
  });
  await memorySection
    .locator(".jk-setting-title")
    .filter({ hasText: "Manage saved information" })
    .waitFor({
      timeout: 5_000,
    });
  await memorySection
    .locator(".jk-value-action")
    .filter({ hasText: "Manage" })
    .waitFor({
      timeout: 5_000,
    });
  await memorySection
    .getByText(
      "Opening this page does not read full conversation content, call a model, connect to online services, or start the microphone.",
      { exact: true },
    )
    .waitFor({
      timeout: 5_000,
    });

  const legacyCount = await window.getByTestId("settings-view").count();
  const skinStudioCount = await countVisibleText(window, "Pet Skin Studio");
  const voiceRegressionCount = await countVisibleText(window, "Voice Regression");
  const pilotCount = await countVisibleText(window, "Pilot");
  const developerNavCount = await window.getByTestId("nav-developer").count();
  const evaluationHiddenCount = await window
    .getByTestId("evaluation-surface-hidden")
    .count();
  if (categoryCount !== 8) {
    throw new Error(`Settings V2 category count mismatch: ${categoryCount}`);
  }
  if (legacyCount !== 0 || skinStudioCount !== 0) {
    throw new Error(
      `Settings V2 mounted with legacy surface present: legacy=${legacyCount} skinStudio=${skinStudioCount}`,
    );
  }
  if (voiceRegressionCount !== 0 || pilotCount !== 0) {
    throw new Error(
      `Settings V2 Voice & Audio exposed evaluation text: voiceRegression=${voiceRegressionCount} pilot=${pilotCount}`,
    );
  }
  if (developerNavCount !== 0 || evaluationHiddenCount !== 0) {
    throw new Error("Settings V2 product entry exposed Developer/Evaluation.");
  }
  await window
    .locator('[data-testid="settings-v2-category-nav"] button')
    .filter({ hasText: "General" })
    .click();
  await window.getByTestId("settings-v2-general").waitFor({ timeout: 5_000 });
  return {
    categoryCount,
    legacyCount,
    skinStudioCount,
    voiceRegressionCount,
    pilotCount,
    developerNavCount,
    evaluationHiddenCount,
  };
}

function mapScenarioDiagnostic(input) {
  return {
    scenario: input.scenario,
    runtimeEnvironment: input.runtimeEnvironment,
    packaged: input.packaged,
    envClassification: input.envClassification,
    capabilityAvailable: input.projection.settingsV2CapabilityAvailable,
    envRequested: input.projection.settingsV2EnvRequested,
    enabled: input.mountedSurface === "v2",
    reasonCode: input.projection.reasonCode,
    mountedSurface: input.mountedSurface,
    settingsV2Count: input.settingsV2Count,
    legacyCount: input.legacyCount,
    sideEffects: input.sideEffects,
    realNetworkRequestSent: false,
  };
}

async function runGateScenario(input) {
  const launcher = input.packaged
    ? launchPackagedAlphaDesktop
    : launchDevelopmentDesktop;
  const { electronApp, userDataDirectory } = await launcher({
    settingsV2EnvValue: input.settingsV2EnvValue,
  });
  try {
    const window = await electronApp.firstWindow();
    await installSideEffectCounters(window);
    await window.setViewportSize({ width: 1440, height: 940 });
    const projection = await window.evaluate(() =>
      window.jarvis?.getUiSurfaceCapabilityStatus(),
    );
    await openSettings(window);

    let mountedSurface;
    let coverage = {};
    if (input.expectedMountedSurface === "v2") {
      coverage = await assertSettingsV2Coverage(window);
      mountedSurface = "v2";
    } else {
      await window.getByTestId("settings-view").waitFor({ timeout: 10_000 });
      const settingsV2Count = await window.getByTestId("settings-v2-view").count();
      if (settingsV2Count !== 0) {
        throw new Error("Settings V2 mounted while Legacy was expected.");
      }
      mountedSurface = "legacy";
    }
    const settingsV2Count = await window.getByTestId("settings-v2-view").count();
    const legacyCount = await window.getByTestId("settings-view").count();
    const sideEffects = await collectSideEffects(window);
    const scenarioResult = {
      scenario: input.scenario,
      runtimeEnvironment: input.runtimeEnvironment,
      packaged: input.packaged,
      envClassification: input.envClassification,
      projection,
      mountedSurface,
      settingsV2Count,
      legacyCount,
      sideEffects,
      coverage,
    };
    if (mountedSurface !== input.expectedMountedSurface) {
      throw new Error(
        `${input.scenario} mounted ${mountedSurface}, expected ${input.expectedMountedSurface}`,
      );
    }
    if (projection.reasonCode !== input.expectedReasonCode) {
      throw new Error(
        `${input.scenario} reason mismatch: ${projection.reasonCode}`,
      );
    }
    if (
      projection.settingsV2CapabilityAvailable !==
      (input.expectedMountedSurface === "v2")
    ) {
      throw new Error(`${input.scenario} capability did not match surface.`);
    }
    assertNoSideEffects(scenarioResult);
    const screenshotPath = path.join(
      outputDirectory,
      input.screenshotName,
    );
    await window.screenshot({ path: screenshotPath, fullPage: true });
    return {
      ...scenarioResult,
      screenshotPath,
      diagnostic: mapScenarioDiagnostic(scenarioResult),
    };
  } finally {
    await electronApp.close();
    await rm(userDataDirectory, { force: true, recursive: true });
  }
}

await mkdir(outputDirectory, { recursive: true });
await ensurePackagedAlphaExecutable();

const scenarios = [
  {
    scenario: "development-default-v2",
    runtimeEnvironment: "development",
    packaged: false,
    envClassification: "missing",
    settingsV2EnvValue: undefined,
    expectedMountedSurface: "v2",
    expectedReasonCode: "development_default_enabled",
    screenshotName: "development-default-v2.png",
  },
  {
    scenario: "development-explicit-zero-legacy",
    runtimeEnvironment: "development",
    packaged: false,
    envClassification: "zero",
    settingsV2EnvValue: "0",
    expectedMountedSurface: "legacy",
    expectedReasonCode: "flag_disabled",
    screenshotName: "development-explicit-zero-legacy.png",
  },
  {
    scenario: "development-explicit-one-v2",
    runtimeEnvironment: "development",
    packaged: false,
    envClassification: "one",
    settingsV2EnvValue: "1",
    expectedMountedSurface: "v2",
    expectedReasonCode: "enabled",
    screenshotName: "development-explicit-one-v2.png",
  },
  {
    scenario: "development-invalid-legacy",
    runtimeEnvironment: "development",
    packaged: false,
    envClassification: "invalid",
    settingsV2EnvValue: "invalid-ui3b-evidence-value",
    expectedMountedSurface: "legacy",
    expectedReasonCode: "invalid_flag",
    screenshotName: "development-invalid-legacy.png",
  },
  {
    scenario: "packaged-alpha-env-one-legacy",
    runtimeEnvironment: "alpha",
    packaged: true,
    envClassification: "one",
    settingsV2EnvValue: "1",
    expectedMountedSurface: "legacy",
    expectedReasonCode: "release_channel_not_allowed",
    screenshotName: "packaged-alpha-env-one-legacy.png",
  },
];

const results = [];
for (const scenario of scenarios) {
  results.push(await runGateScenario(scenario));
}

const diagnostics = {
  generatedAt: new Date().toISOString(),
  outputDirectory,
  realNetworkRequestSent: false,
  scenarios: results.map((result) => result.diagnostic),
  sideEffectTotals: results.reduce(
    (totals, result) => {
      for (const [name, count] of Object.entries(result.sideEffects)) {
        totals[name] = (totals[name] ?? 0) + count;
      }
      return totals;
    },
    { ...sideEffectZeroes },
  ),
};

await writeFile(
  path.join(outputDirectory, "gate-rollout-diagnostics.json"),
  JSON.stringify(diagnostics, null, 2),
);

console.log(
  JSON.stringify(
    {
      status: "PASS",
      outputDirectory,
      diagnostics,
      screenshots: results.map((result) => ({
        scenario: result.scenario,
        path: result.screenshotPath,
      })),
      realNetworkRequestSent: false,
      windowsExecutorInvoked: false,
    },
    null,
    2,
  ),
);
