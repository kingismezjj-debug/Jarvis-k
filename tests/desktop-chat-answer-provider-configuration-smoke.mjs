import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-chat-answer-provider-config-"),
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const fakeSecret = "not-a-credential-local-smoke-key";
let electronApp;

async function seedDesktopSettings() {
  await writeFile(
    path.join(smokeUserDataDirectory, "jarvis-k-desktop-settings.json"),
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
        firstRunOnboardingStateChangedAt: "2026-09-04T00:00:00.000Z",
        persistedLocally: true,
        syncedToCloud: false,
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function listProcessIds(processName) {
  const command = [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    [
      `$items = Get-Process -Name '${processName}' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id`,
      "if ($null -eq $items) { '[]' } else { $items | ConvertTo-Json -Compress }",
    ].join("; "),
  ];
  const { stdout } = await execFileAsync("powershell.exe", command, {
    windowsHide: true,
  });
  const trimmed = stdout.trim();
  if (trimmed.length === 0 || trimmed === "[]") {
    return [];
  }
  const parsed = JSON.parse(trimmed);
  return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
}

async function stopNewProcessIds(processName, beforeProcessIds) {
  const afterProcessIds = await listProcessIds(processName);
  const newProcessIds = afterProcessIds.filter(
    (processId) => !beforeProcessIds.includes(processId),
  );
  if (newProcessIds.length > 0) {
    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Stop-Process -Id ${newProcessIds.map((id) => Number(id)).join(",")} -Force -ErrorAction SilentlyContinue`,
      ],
      { windowsHide: true },
    ).catch(() => undefined);
  }
  return newProcessIds;
}

await seedDesktopSettings();
const electronBefore = await listProcessIds("electron");
const nodeBefore = await listProcessIds("node");

try {
  electronApp = await electron.launch({
    args: [
      `--user-data-dir=${smokeUserDataDirectory}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_ENABLE_SETTINGS_V2: "1",
      JARVIS_K_USER_DATA_PATH: smokeUserDataDirectory,
      JARVIS_K_LOCAL_DATA_PATH: smokeUserDataDirectory,
      JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
      JARVIS_K_TASK_DB_PATH: taskDatabasePath,
      JARVIS_K_MODEL_DIR: path.join(smokeUserDataDirectory, "models"),
      JARVIS_K_VOICE_REGRESSION_PATH: path.join(
        smokeUserDataDirectory,
        "voice-regression.json",
      ),
    },
  });
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 980 });
  await window.addInitScript(() => {
    window.__jarvisProviderConfigSmokeFetchCalls = 0;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args) => {
      window.__jarvisProviderConfigSmokeFetchCalls += 1;
      return originalFetch(...args);
    };
  });
  await window.reload();
  await window.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });
  await window.getByTestId("general-settings").click();
  await window.getByTestId("settings-v2-view").waitFor({ timeout: 10_000 });

  const navButtons = window.locator('[data-testid="settings-v2-category-nav"] button');
  if ((await navButtons.count()) > 0 && (await navButtons.first().isVisible())) {
    await navButtons.nth(3).click();
  } else {
    await window
      .locator(".settings-v2-narrow-category select")
      .selectOption("models_intelligence");
  }
  await window.getByTestId("settings-v2-models-intelligence").waitFor({
    timeout: 5_000,
  });
  await window.getByRole("button", { name: "Configure" }).click();
  await window
    .getByTestId("settings-v2-answer-provider-service-url")
    .fill("https://api.deepseek.com/chat/completions");
  await window
    .getByTestId("settings-v2-answer-provider-model-id")
    .fill("deepseek-v4-flash");
  await window.getByTestId("settings-v2-answer-provider-api-key").fill(fakeSecret);
  await window.getByRole("button", { name: "Save configuration" }).click();
  await window.waitForFunction(() =>
    window.jarvis.getChatAnswerProviderConfigurationStatus().then((status) => {
      return (
        status.configured === true &&
        status.credentialConfigured === true &&
        status.credentialExposed === false
      );
    }),
  );

  const status = await window.evaluate(() =>
    window.jarvis.getChatAnswerProviderConfigurationStatus(),
  );
  const bodyText = await window.locator("body").innerText();
  const counters = await window.evaluate(() => ({
    fetchCalls: window.__jarvisProviderConfigSmokeFetchCalls ?? 0,
  }));
  const result = {
    configured: status.configured === true,
    credentialConfigured: status.credentialConfigured === true,
    credentialNotExposed: status.credentialExposed === false,
    runtimeDisarmed: status.runtimeArmed === false,
    connectionTestStatus: status.connectionTestStatus,
    publicConfigurationPresent: Boolean(status.publicConfiguration),
    fakeSecretVisible: bodyText.includes(fakeSecret),
    fetchCalls: counters.fetchCalls,
  };
  if (
    !result.configured ||
    !result.credentialConfigured ||
    !result.credentialNotExposed ||
    !result.publicConfigurationPresent ||
    !result.runtimeDisarmed ||
    result.connectionTestStatus !== "not_tested" ||
    result.fakeSecretVisible ||
    result.fetchCalls !== 0
  ) {
    throw new Error(
      `Chat Answer provider configuration smoke failed: ${JSON.stringify(result)}`,
    );
  }
  console.log(JSON.stringify({ status: "PASS", ...result }));
} finally {
  if (electronApp) {
    await electronApp.close().catch(() => undefined);
  }
  await stopNewProcessIds("electron", electronBefore);
  await stopNewProcessIds("node", nodeBefore);
  await new Promise((resolve) => setTimeout(resolve, 500));
  await rm(smokeUserDataDirectory, { force: true, recursive: true }).catch(
    () => undefined,
  );
}
