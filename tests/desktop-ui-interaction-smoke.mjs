import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-desktop-ui-interaction-")
);
let electronApp;

async function expectActionStatus(window, expectedText) {
  await window.getByTestId("last-action-status").getByText(expectedText).waitFor({
    timeout: 5_000
  });
  return window.getByTestId("last-action-status").innerText();
}

async function expectAbsent(window, testId) {
  const count = await window.getByTestId(testId).count();
  if (count !== 0) {
    throw new Error(`Expected ${testId} to be hidden in Product UI.`);
  }
  return count;
}

try {
  electronApp = await electron.launch({
    args: [
      `--user-data-dir=${smokeUserDataDirectory}`,
      "apps/desktop/dist/main.js"
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_MEMORY_DB_PATH: path.join(
        smokeUserDataDirectory,
        "memory.sqlite"
      ),
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_MODEL_DIR: path.join(smokeUserDataDirectory, "models")
    }
  });

  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });

  const productDeveloperNavCount = await expectAbsent(window, "nav-developer");
  const productInspectorToggleCount = await expectAbsent(
    window,
    "toggle-inspector"
  );
  const productRuntimeInspectorCount = await expectAbsent(
    window,
    "runtime-inspector"
  );

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor({ timeout: 5_000 });
  const tasksStatus = await expectActionStatus(window, "Tasks view active");
  const productModelOperationsCount = await expectAbsent(
    window,
    "model-operation-list"
  );

  await window.getByTestId("nav-activity").click();
  await window.getByTestId("activity-view").waitFor({ timeout: 5_000 });
  const activityStatus = await expectActionStatus(
    window,
    "Activity view active"
  );

  await window.getByTestId("general-settings").click();
  await window.getByTestId("settings-view").waitFor({ timeout: 5_000 });
  const settingsStatus = await expectActionStatus(
    window,
    "Settings view active"
  );
  await window.getByTestId("settings-open-voice-settings").waitFor({
    timeout: 5_000
  });
  const productSettingsInspectorCount = await expectAbsent(
    window,
    "settings-toggle-inspector"
  );
  const productSettingsProbeCount = await expectAbsent(
    window,
    "settings-probe-core"
  );

  await window.getByTestId("language-zh").click();
  await window.getByTestId("jarvis-app").evaluate((node) => {
    if (node.getAttribute("data-ui-language") !== "zh") {
      throw new Error("UI language did not switch to Chinese.");
    }
  });
  const zhLanguageStatus = await window
    .getByTestId("last-action-status")
    .innerText();

  await window.getByTestId("language-en").click();
  await window.getByTestId("jarvis-app").evaluate((node) => {
    if (node.getAttribute("data-ui-language") !== "en") {
      throw new Error("UI language did not switch to English.");
    }
  });
  const enSettingsTitle = await window
    .getByRole("heading", { name: "Settings" })
    .innerText();

  await window.getByTestId("nav-voice").click();
  await window.getByTestId("voice-view").waitFor({ timeout: 5_000 });
  const productVoiceRegressionCount = await expectAbsent(
    window,
    "voice-regression-panel"
  );

  await window.getByTestId("nav-conversation").click();
  await window.getByTestId("command-input").fill("Open GitHub");
  await window.getByTestId("send-command").click();
  await window.getByTestId("brain-dispatch-panel").waitFor({
    timeout: 5_000
  });
  await window.getByTestId("brain-intent").getByText("browser.open").waitFor({
    timeout: 5_000
  });
  await window.getByTestId("tool-product-loop-panel").waitFor({
    timeout: 5_000
  });
  await window
    .getByTestId("tool-loop-result")
    .getByText("not_run")
    .waitFor({ timeout: 5_000 });
  const brainIntent = await window.getByTestId("brain-intent").innerText();
  const toolLoopResult = await window.getByTestId("tool-loop-result").innerText();

  await window.getByTestId("send-command").click();
  const emptySendStatus = await expectActionStatus(
    window,
    "Type a command first"
  );

  console.log(
    JSON.stringify({
      status: "PASS",
      tasksStatus,
      activityStatus,
      settingsStatus,
      zhLanguageStatus,
      enSettingsTitle,
      brainIntent,
      toolLoopResult,
      emptySendStatus,
      productDeveloperNavCount,
      productInspectorToggleCount,
      productRuntimeInspectorCount,
      productModelOperationsCount,
      productSettingsInspectorCount,
      productSettingsProbeCount,
      productVoiceRegressionCount
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
