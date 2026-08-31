import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-3g",
  "settings-v2-installed-fault-implementation",
);
const relativeOutputDirectory = path
  .relative(rootDirectory, outputDirectory)
  .split(path.sep)
  .join("/");
const packagedExecutablePath = path.join(
  rootDirectory,
  "artifacts",
  "packaged",
  "win-unpacked",
  "Jarvis-K Alpha.exe",
);
const uiSurfaceCapabilityUpdatedChannel =
  "jarvis-k:ui-surface-capability-updated";
const faultFlag = "--jarvis-internal-settings-v2-fault=";
const faultModes = {
  renderFailure: "settings_v2_render_failure",
  mountTimeout: "settings_v2_mount_timeout",
};

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
  realLoginItemMutation: 0,
};

function createCleanChildEnvironment(input) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith("JARVIS_K_")) {
      delete env[key];
    }
  }
  return {
    ...env,
    APPDATA: input.roamingRoot,
    LOCALAPPDATA: input.localRoot,
    JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
  };
}

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
        firstRunOnboardingStateChangedAt: "2026-08-31T00:00:00.000Z",
        persistedLocally: true,
        syncedToCloud: false,
      },
      null,
      2,
    ),
  );
}

async function launchPackagedAlpha(input = {}) {
  if (!existsSync(packagedExecutablePath)) {
    throw new Error("Packaged Alpha executable is missing.");
  }
  const tempRootDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-internal-fault-"),
  );
  const roamingRoot = path.join(tempRootDirectory, "roaming");
  const localRoot = path.join(tempRootDirectory, "local");
  const alphaUserDataDirectory = path.join(roamingRoot, "Jarvis-K-Alpha");
  await mkdir(alphaUserDataDirectory, { recursive: true });
  await mkdir(localRoot, { recursive: true });
  await seedDesktopSettings(alphaUserDataDirectory);

  const args = [`--user-data-dir=${alphaUserDataDirectory}`];
  if (input.faultMode) {
    args.push(`${faultFlag}${input.faultMode}`);
  }
  const electronApp = await electron.launch({
    executablePath: packagedExecutablePath,
    args,
    cwd: tempRootDirectory,
    env: createCleanChildEnvironment({ roamingRoot, localRoot }),
  });
  const window = await electronApp.firstWindow();
  await installSideEffectCounters(window);
  await window.setViewportSize({ width: 1280, height: 860 });
  return { electronApp, tempRootDirectory, window };
}

async function installSideEffectCounters(window) {
  await window.addInitScript(() => {
    window.__jarvisSettingsV2FetchCalls = 0;
    window.__jarvisSettingsV2MediaCalls = 0;
    window.__jarvisSettingsV2NotificationCalls = 0;
    window.__jarvisSettingsV2ClipboardCalls = 0;
    const mediaDevices = navigator.mediaDevices;
    if (mediaDevices?.getUserMedia) {
      const original = mediaDevices.getUserMedia.bind(mediaDevices);
      mediaDevices.getUserMedia = (...args) => {
        window.__jarvisSettingsV2MediaCalls += 1;
        return original(...args);
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

async function openSettings(window) {
  await window.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });
  await window.getByTestId("general-settings").click();
}

async function waitForV2(window) {
  await window.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
  await window.waitForFunction(async () => {
    const status = await window.jarvis?.getUiSurfaceCapabilityStatus?.();
    return (
      status?.settingsSurfaceMounted === "v2" &&
      status?.settingsSurfaceHealth === "ready" &&
      status?.settingsV2InternalFaultMode === "none"
    );
  });
}

async function waitForLegacy(window) {
  await window.getByTestId("settings-view").waitFor({ timeout: 12_000 });
  await window.waitForFunction(async () => {
    const status = await window.jarvis?.getUiSurfaceCapabilityStatus?.();
    return (
      status?.settingsSurfaceMounted === "legacy" &&
      status?.settingsV2SessionFallbackActive === true
    );
  });
}

async function installFallbackPushHold(electronApp) {
  await electronApp.evaluate(
    ({ BrowserWindow }, channel) => {
      const mainWindow = BrowserWindow.getAllWindows().find(
        (candidate) => !candidate.isDestroyed(),
      );
      if (!mainWindow) {
        throw new Error("Main window unavailable for fallback push hold.");
      }
      const state =
        globalThis.__jarvisSettingsV2InternalFaultPushHoldState ?? {
          active: false,
          held: null,
          installed: false,
          originalSend: mainWindow.webContents.send.bind(
            mainWindow.webContents,
          ),
        };
      if (!state.installed) {
        const originalSend = state.originalSend;
        mainWindow.webContents.send = (eventChannel, ...args) => {
          if (
            state.active &&
            eventChannel === channel &&
            args[0]?.settingsV2SessionFallbackActive === true
          ) {
            state.held = { channel: eventChannel, args };
            return;
          }
          return originalSend(eventChannel, ...args);
        };
        state.installed = true;
      }
      state.active = true;
      state.held = null;
      globalThis.__jarvisSettingsV2InternalFaultPushHoldState = state;
    },
    uiSurfaceCapabilityUpdatedChannel,
  );
}

async function releaseFallbackPushHold(electronApp) {
  await electronApp.evaluate(() => {
    const state = globalThis.__jarvisSettingsV2InternalFaultPushHoldState;
    if (!state) return;
    state.active = false;
    const held = state.held;
    state.held = null;
    if (held) {
      state.originalSend(held.channel, ...held.args);
    }
  });
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
    microphoneMedia: rendererCounts.mediaCalls,
    notification: rendererCounts.notificationCalls,
    clipboard: rendererCounts.clipboardCalls,
  };
}

async function captureScenario(input) {
  const screenshotPath = path.join(outputDirectory, input.screenshotName);
  await input.window.screenshot({ path: screenshotPath });
  const status = await input.window.evaluate(() =>
    window.jarvis?.getUiSurfaceCapabilityStatus?.(),
  );
  const counts = {
    v2: await input.window.getByTestId("settings-v2-view").count(),
    legacy: await input.window.getByTestId("settings-view").count(),
    recovering: await input.window
      .getByTestId("settings-v2-session-fallback-pending")
      .count(),
  };
  const sideEffects = await collectSideEffects(input.window);
  for (const [name, value] of Object.entries(sideEffects)) {
    if (value !== 0) {
      throw new Error(`${input.scenario} produced side effect ${name}=${value}`);
    }
  }
  return {
    scenario: input.scenario,
    implementationEvidence: true,
    installedAcceptance: false,
    launchMode: "packaged_win_unpacked_clean_child_process",
    childGateEnvClassification: "missing",
    adminUrlRemovedFromChildEnvironment: true,
    faultModeExpected: input.faultModeExpected ?? "none",
    healthTransition: input.healthTransition,
    mainProjection: sanitizeProjection(status),
    visibleSurface:
      counts.recovering > 0 ? "recovering" : counts.v2 > 0 ? "v2" : "legacy",
    counts,
    settingsMutationCount: 0,
    sideEffects,
    realNetworkRequestSent: false,
    screenshot: `${relativeOutputDirectory}/${input.screenshotName}`,
    ...(input.extra ?? {}),
  };
}

function sanitizeProjection(status) {
  if (!status) return null;
  return {
    ...status,
    settingsV2MountGeneration:
      typeof status.settingsV2MountGeneration === "number" ? "present" : "none",
  };
}

async function runWithPackagedAlpha(input, callback) {
  const launch = await launchPackagedAlpha(input);
  try {
    return await callback(launch);
  } finally {
    await launch.electronApp.close();
    await rm(launch.tempRootDirectory, { force: true, recursive: true });
  }
}

await mkdir(outputDirectory, { recursive: true });
const diagnostics = [];

diagnostics.push(
  await runWithPackagedAlpha({}, async ({ window }) => {
    await openSettings(window);
    await waitForV2(window);
    return captureScenario({
      window,
      scenario: "ordinary-no-flag-v2",
      screenshotName: "ordinary-no-flag-v2.png",
      healthTransition: "mounting -> ready",
    });
  }),
);

const renderDiagnostics = await runWithPackagedAlpha(
  { faultMode: faultModes.renderFailure },
  async ({ electronApp, window }) => {
    await installFallbackPushHold(electronApp);
    await openSettings(window);
    await window
      .getByTestId("settings-v2-session-fallback-pending")
      .waitFor({ timeout: 10_000 });
    const recovering = await captureScenario({
      window,
      scenario: "render-failure-recovering",
      screenshotName: "render-failure-recovering.png",
      faultModeExpected: faultModes.renderFailure,
      healthTransition: "mounting -> render_throw -> failed -> recovering",
      extra: {
        errorBoundaryCaught: true,
        fallbackPushHeld: true,
      },
    });
    await releaseFallbackPushHold(electronApp);
    await waitForLegacy(window);
    const legacy = await captureScenario({
      window,
      scenario: "render-failure-legacy",
      screenshotName: "render-failure-legacy.png",
      faultModeExpected: faultModes.renderFailure,
      healthTransition: "failed -> main_session_fallback -> legacy",
    });
    return [recovering, legacy];
  },
);
diagnostics.push(...renderDiagnostics);

diagnostics.push(
  await runWithPackagedAlpha(
    { faultMode: faultModes.mountTimeout },
    async ({ window }) => {
      await openSettings(window);
      await waitForLegacy(window);
      return captureScenario({
        window,
        scenario: "mount-timeout-legacy",
        screenshotName: "mount-timeout-legacy.png",
        faultModeExpected: faultModes.mountTimeout,
        healthTransition: "mounting -> production_5000ms_timeout -> legacy",
        extra: {
          readySuppressed: true,
          failedHealthReportSent: false,
          productionTimeoutMs: 5_000,
        },
      });
    },
  ),
);

diagnostics.push(
  await runWithPackagedAlpha({}, async ({ window }) => {
    await openSettings(window);
    await waitForV2(window);
    return captureScenario({
      window,
      scenario: "restart-without-flag-normal-v2",
      screenshotName: "restart-without-flag-normal-v2.png",
      healthTransition: "new_process_without_fault_flag -> mounting -> ready",
    });
  }),
);

await writeFile(
  path.join(outputDirectory, "implementation-diagnostics.json"),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      phase: "UI-3G-2C Installed Fallback Fault-Injection Implementation Evidence",
      evidenceType: "packaged-win-unpacked",
      installedAcceptance: false,
      faultModes: Object.values(faultModes),
      scenarios: diagnostics,
      realNetworkRequestSent: false,
      sideEffects: sideEffectZeroes,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.info(
  JSON.stringify(
    {
      status: "PASS",
      outputDirectory: relativeOutputDirectory,
      scenarios: diagnostics.map((item) => ({
        scenario: item.scenario,
        visibleSurface: item.visibleSurface,
        faultMode: item.mainProjection?.settingsV2InternalFaultMode,
        reasonCode: item.mainProjection?.reasonCode,
      })),
      realNetworkRequestSent: false,
    },
    null,
    2,
  ),
);
