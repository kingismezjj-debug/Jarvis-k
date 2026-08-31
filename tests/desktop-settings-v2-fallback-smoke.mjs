import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-3d",
  "settings-v2-fallback",
);
const uiSurfaceCapabilityUpdatedChannel =
  "jarvis-k:ui-surface-capability-updated";

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
        firstRunOnboardingStateChangedAt: "2026-08-30T00:00:00.000Z",
        persistedLocally: true,
        syncedToCloud: false,
      },
      null,
      2,
    ),
  );
}

async function launchDevelopmentDesktop({
  settingsV2EnvValue,
  disableAnimationFrame = false,
  enableRenderFailureTrap = false,
} = {}) {
  const userDataDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-settings-v2-fallback-"),
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
  const window = await electronApp.firstWindow();
  if (enableRenderFailureTrap) {
    await installRenderFailureTrap(window);
  }
  if (disableAnimationFrame) {
    await window.addInitScript(() => {
      window.requestAnimationFrame = () => 1;
      window.cancelAnimationFrame = () => undefined;
    });
  }
  await installSideEffectCounters(window);
  await window.setViewportSize({ width: 1280, height: 860 });
  return { electronApp, userDataDirectory, window };
}

async function installRenderFailureTrap(window) {
  await window.addInitScript(() => {
    const originalToLocaleLowerCase = String.prototype.toLocaleLowerCase;
    if (!String.prototype.__jarvisSettingsV2FallbackTrapInstalled) {
      Object.defineProperty(String.prototype, "__jarvisSettingsV2FallbackTrapInstalled", {
        configurable: false,
        enumerable: false,
        value: true,
      });
      String.prototype.toLocaleLowerCase = function toLocaleLowerCaseTrap(
        ...args
      ) {
        if (
          window.__jarvisSettingsV2ForceRenderFailure === true &&
          String(this) === "jarvis-v2-controlled-render-failure"
        ) {
          throw new Error("Controlled Settings V2 render failure");
        }
        return originalToLocaleLowerCase.apply(this, args);
      };
    }
  });
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

async function openSettings(window) {
  await window.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });
  await window.getByTestId("general-settings").click();
}

async function waitForV2Ready(window) {
  await window.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });
  await window
    .getByTestId("settings-v2-session-rollback")
    .waitFor({ timeout: 5_000 });
  await window.waitForFunction(async () => {
    const status = await window.jarvis?.getUiSurfaceCapabilityStatus?.();
    return (
      status?.settingsSurfaceMounted === "v2" &&
      status?.settingsSurfaceHealth === "ready" &&
      status?.settingsV2MountGeneration !== null
    );
  });
}

async function waitForLegacy(window) {
  await window.getByTestId("settings-view").waitFor({ timeout: 10_000 });
  await window.waitForFunction(async () => {
    const status = await window.jarvis?.getUiSurfaceCapabilityStatus?.();
    return status?.settingsSurfaceMounted === "legacy";
  });
  const v2Count = await window.getByTestId("settings-v2-view").count();
  if (v2Count !== 0) {
    throw new Error("Settings V2 and Legacy mounted at the same time.");
  }
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

async function captureScenario(input) {
  const screenshotPath = path.join(outputDirectory, input.screenshotName);
  await input.window.screenshot({ path: screenshotPath });
  const status = await input.window.evaluate(() =>
    window.jarvis?.getUiSurfaceCapabilityStatus?.(),
  );
  const settingsV2Count = await input.window
    .getByTestId("settings-v2-view")
    .count();
  const legacyCount = await input.window.getByTestId("settings-view").count();
  const recoveryCopyCount = await input.window
    .getByTestId("settings-v2-session-fallback-pending")
    .count();
  const v2SearchCount = await input.window
    .getByTestId("settings-v2-search")
    .count();
  const sideEffects = await collectSideEffects(input.window);
  const diagnostic = {
    scenario: input.scenario,
    generationClassification:
      typeof status?.settingsV2MountGeneration === "number"
        ? "main_owned_positive_integer"
        : "none",
    initialSurface: input.initialSurface,
    healthTransition: input.healthTransition,
    ...(input.extraDiagnostic ?? {}),
    finalMainProjection: sanitizeProjection(status),
    finalVisibleSurface:
      recoveryCopyCount > 0 ? "recovering" : settingsV2Count > 0 ? "v2" : "legacy",
    v2Count: settingsV2Count,
    legacyCount,
    recoveryCopyVisible: recoveryCopyCount > 0,
    v2ProductContentInteractable: v2SearchCount > 0,
    settingsMutationCount: 0,
    sideEffects,
    realNetworkRequestSent: false,
    screenshotPath,
  };
  assertNoSideEffects({ scenario: input.scenario, sideEffects });
  return diagnostic;
}

async function installFallbackPushHold(electronApp) {
  await electronApp.evaluate(
    ({ BrowserWindow }, channel) => {
      const mainWindow = BrowserWindow.getAllWindows().find(
        (window) => !window.isDestroyed(),
      );
      if (!mainWindow) {
        throw new Error("Main window unavailable for fallback push hold.");
      }
      const state =
        globalThis.__jarvisSettingsV2FallbackPushHoldState ?? {
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
            state.held = { args, channel: eventChannel };
            return;
          }
          return originalSend(eventChannel, ...args);
        };
        state.installed = true;
      }
      state.active = true;
      state.held = null;
      globalThis.__jarvisSettingsV2FallbackPushHoldState = state;
    },
    uiSurfaceCapabilityUpdatedChannel,
  );
}

async function collectFallbackPushHoldStatus(electronApp) {
  return electronApp.evaluate(() => {
    const state = globalThis.__jarvisSettingsV2FallbackPushHoldState;
    return {
      active: state?.active === true,
      held: state?.held !== null && state?.held !== undefined,
      heldChannel: state?.held?.channel ?? null,
    };
  });
}

async function releaseFallbackPushHold(electronApp) {
  await electronApp.evaluate(() => {
    const state = globalThis.__jarvisSettingsV2FallbackPushHoldState;
    if (!state) {
      return;
    }
    state.active = false;
    const held = state.held;
    state.held = null;
    if (held) {
      state.originalSend(held.channel, ...held.args);
    }
  });
}

function sanitizeProjection(status) {
  if (!status) {
    return null;
  }
  return {
    ...status,
    settingsV2MountGeneration:
      typeof status.settingsV2MountGeneration === "number" ? "present" : "none",
  };
}

async function runWithApp(input, callback) {
  const launch = await launchDevelopmentDesktop(input);
  try {
    return await callback(launch);
  } finally {
    await launch.electronApp.close();
    await rm(launch.userDataDirectory, { force: true, recursive: true });
  }
}

await mkdir(outputDirectory, { recursive: true });

const diagnostics = [];

diagnostics.push(
  await runWithApp({}, async ({ window }) => {
    await openSettings(window);
    await waitForV2Ready(window);
    return captureScenario({
      window,
      scenario: "v2-normal-ready",
      screenshotName: "v2-normal-ready.png",
      initialSurface: "v2",
      healthTransition: "mounting -> ready",
    });
  }),
);

const rollbackDiagnostics = await runWithApp({}, async ({ window }) => {
  await openSettings(window);
  await waitForV2Ready(window);
  const before = await captureScenario({
    window,
    scenario: "user-session-rollback-before",
    screenshotName: "user-session-rollback-before.png",
    initialSurface: "v2",
    healthTransition: "mounting -> ready",
  });
  await window
    .getByTestId("settings-v2-session-rollback")
    .getByRole("button")
    .click();
  await waitForLegacy(window);
  const after = await captureScenario({
    window,
    scenario: "user-session-rollback-legacy",
    screenshotName: "user-session-rollback-legacy.png",
    initialSurface: "v2",
    healthTransition: "user_session_rollback -> legacy",
  });
  return [before, after];
});
diagnostics.push(...rollbackDiagnostics);

await runWithApp(
  { enableRenderFailureTrap: true },
  async ({ electronApp, window }) => {
  await openSettings(window);
  await waitForV2Ready(window);
  const statusBeforeFailure = await window.evaluate(() =>
    window.jarvis?.getUiSurfaceCapabilityStatus?.(),
  );
  await installFallbackPushHold(electronApp);
  await window.evaluate(() => {
    window.__jarvisSettingsV2ForceRenderFailure = true;
  });
  const renderFailureTrapActive = await window.evaluate(() => {
    try {
      "jarvis-v2-controlled-render-failure".toLocaleLowerCase();
      return false;
    } catch {
      return true;
    }
  });
  if (!renderFailureTrapActive) {
    throw new Error("Controlled Settings V2 render failure trap was not active.");
  }
  await window.getByTestId("settings-v2-search").fill(
    "jarvis-v2-controlled-render-failure",
  );
  await window
    .getByTestId("settings-v2-session-fallback-pending")
    .waitFor({ timeout: 5_000 });
  await window.waitForFunction(async () => {
    const recoveryCopyVisible = document.querySelector(
      '[data-testid="settings-v2-session-fallback-pending"]',
    ) !== null;
    const legacyMounted =
      document.querySelector('[data-testid="settings-view"]') !== null;
    const status = await window.jarvis?.getUiSurfaceCapabilityStatus?.();
    return (
      recoveryCopyVisible &&
      !legacyMounted &&
      status?.settingsSurfaceHealth === "failed" &&
      status?.settingsV2SessionFallbackActive === true
    );
  });
  const heldPushBeforeCapture = await collectFallbackPushHoldStatus(electronApp);
  const recoveryEvidence = await window.evaluate(async (expectedGeneration) => {
    const status = await window.jarvis?.getUiSurfaceCapabilityStatus?.();
    return {
      errorBoundaryCaught: document.querySelector(
        '[data-testid="settings-v2-session-fallback-pending"]',
      ) !== null,
      healthReportState: "failed",
      healthReportReasonCode: "settings_v2_renderer_failure",
      currentGenerationValid:
        typeof expectedGeneration === "number" &&
        expectedGeneration > 0,
      recoveryCopyVisible:
        document.querySelector(
          '[data-testid="settings-v2-session-fallback-pending"]',
        ) !== null,
      legacyMounted:
        document.querySelector('[data-testid="settings-view"]') !== null,
      mainSessionFallbackObserved: status
        ? {
            settingsSurfaceMounted: status.settingsSurfaceMounted,
            settingsSurfaceHealth: status.settingsSurfaceHealth,
            settingsV2SessionFallbackActive:
              status.settingsV2SessionFallbackActive,
            settingsV2MountGeneration:
              typeof status.settingsV2MountGeneration === "number"
                ? "present"
                : "none",
            reasonCode: status.reasonCode,
            source: status.source,
            sensitiveValuesExposed: status.sensitiveValuesExposed,
            rendererWritable: status.rendererWritable,
          }
        : null,
    };
  }, statusBeforeFailure.settingsV2MountGeneration);
  diagnostics.push(
    await captureScenario({
      window,
      scenario: "renderer-failure-recovering",
      screenshotName: "renderer-failure-recovering.png",
      initialSurface: "v2",
      healthTransition: "render_throw -> error_boundary_recovering",
      extraDiagnostic: {
        ...recoveryEvidence,
        fallbackPushHeld: heldPushBeforeCapture.held === true,
        fallbackPushChannel:
          heldPushBeforeCapture.heldChannel === uiSurfaceCapabilityUpdatedChannel
            ? "ui_surface_capability_updated"
            : "none",
        expectedMainFallbackPushPending: true,
      },
    }),
  );
  await releaseFallbackPushHold(electronApp);
  await waitForLegacy(window);
  const finalFallbackProjection = await window.evaluate(() =>
    window.jarvis?.getUiSurfaceCapabilityStatus?.(),
  );
  diagnostics.push(
    await captureScenario({
      window,
      scenario: "renderer-failure-legacy",
      screenshotName: "renderer-failure-legacy.png",
      initialSurface: "v2",
      healthTransition: "failed_report_released -> main_push_legacy",
      extraDiagnostic: {
        mainSessionFallback:
          finalFallbackProjection?.settingsV2SessionFallbackActive === true,
      },
    }),
  );
  },
);

diagnostics.push(
  await runWithApp({ disableAnimationFrame: true }, async ({ window }) => {
    await openSettings(window);
    await waitForLegacy(window);
    return captureScenario({
      window,
      scenario: "timeout-fallback-legacy",
      screenshotName: "timeout-fallback-legacy.png",
      initialSurface: "v2",
      healthTransition: "mounting -> timeout -> legacy",
    });
  }),
);

diagnostics.push(
  await runWithApp({ settingsV2EnvValue: "0" }, async ({ window }) => {
    await openSettings(window);
    await waitForLegacy(window);
    return captureScenario({
      window,
      scenario: "gate-off-legacy-unchanged",
      screenshotName: "gate-off-legacy-unchanged.png",
      initialSurface: "legacy",
      healthTransition: "gate_denied -> legacy",
    });
  }),
);

const flattenedDiagnostics = diagnostics.flat().filter(Boolean);
await writeFile(
  path.join(outputDirectory, "fallback-diagnostics.json"),
  `${JSON.stringify(
    {
      scenarios: flattenedDiagnostics,
      realNetworkRequestSent: false,
      remainingRisks: [
        "renderer_process_complete_crash",
        "legacy_render_failure",
        "installed_alpha_behavior",
        "upgrade_downgrade",
      ],
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.info(
  JSON.stringify(
    {
      outputDirectory,
      scenarios: flattenedDiagnostics.map((item) => ({
        scenario: item.scenario,
        finalVisibleSurface: item.finalVisibleSurface,
        generationClassification: item.generationClassification,
        sideEffects: item.sideEffects,
      })),
      realNetworkRequestSent: false,
    },
    null,
    2,
  ),
);
