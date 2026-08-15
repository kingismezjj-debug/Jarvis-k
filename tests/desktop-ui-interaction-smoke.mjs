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

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor({ timeout: 5_000 });
  const tasksStatus = await expectActionStatus(window, "Tasks view active");

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

  await window.getByTestId("language-zh").click();
  await window.getByTestId("jarvis-app").evaluate((node) => {
    if (node.getAttribute("data-ui-language") !== "zh") {
      throw new Error("UI language did not switch to Chinese.");
    }
  });
  const zhSettingsTitle = await window
    .getByRole("heading", { name: "设置" })
    .innerText();
  const zhLanguageStatus = await window
    .getByTestId("last-action-status")
    .innerText();
  await window.getByTestId("settings-view").getByText("核心状态").waitFor({
    timeout: 5_000
  });
  await window.getByTestId("settings-view").getByText("运行模式").waitFor({
    timeout: 5_000
  });
  const zhGeneralMetric = await window
    .getByTestId("settings-view")
    .getByText("核心状态")
    .innerText();
  await window.getByTestId("runtime-inspector").getByText("核心状态").waitFor({
    timeout: 5_000
  });
  await window.getByTestId("runtime-inspector").getByText("语音引擎").waitFor({
    timeout: 5_000
  });
  const zhInspectorMetric = await window
    .getByTestId("runtime-inspector")
    .getByText("核心状态")
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

  await window.getByTestId("nav-conversation").click();
  await window.getByTestId("command-input").fill("打开 GitHub");
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
    .getByTestId("tool-loop-selected-tool")
    .getByText("none")
    .waitFor({ timeout: 5_000 });
  await window
    .getByTestId("tool-loop-safety")
    .getByText("blocked")
    .waitFor({ timeout: 5_000 });
  await window
    .getByTestId("tool-loop-result")
    .getByText("not_run")
    .waitFor({ timeout: 5_000 });
  const brainIntent = await window.getByTestId("brain-intent").innerText();
  const toolLoopSelectedTool = await window
    .getByTestId("tool-loop-selected-tool")
    .innerText();
  const toolLoopSafety = await window.getByTestId("tool-loop-safety").innerText();
  const toolLoopResult = await window.getByTestId("tool-loop-result").innerText();

  await window.getByTestId("send-command").click();
  const emptySendStatus = await expectActionStatus(
    window,
    "Type a command first"
  );

  await window.getByTestId("disable-memory-alpha").click();
  const disableMemoryAlphaStatus = await expectActionStatus(
    window,
    "Memory alpha is disabled"
  );

  await window.getByTestId("run-fixture-embedding").click();
  const fixtureEmbeddingStatus = await expectActionStatus(
    window,
    "Fixture embedding provider unavailable"
  );

  console.log(
    JSON.stringify({
      status: "PASS",
      tasksStatus,
      activityStatus,
      settingsStatus,
      zhSettingsTitle,
      zhLanguageStatus,
      zhGeneralMetric,
      zhInspectorMetric,
      enSettingsTitle,
      brainIntent,
      toolLoopSelectedTool,
      toolLoopSafety,
      toolLoopResult,
      emptySendStatus,
      disableMemoryAlphaStatus,
      fixtureEmbeddingStatus
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
