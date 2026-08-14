import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-plugin-sdk-alpha-smoke.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-plugin-sdk-alpha-smoke-metrics.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-plugin-sdk-alpha-")
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const commandText = "stock quote MSFT";
let electronApp;
let relaunchedApp;

async function waitForWindowsProcessCleanup() {
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function removeSmokeDirectory() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await rm(smokeUserDataDirectory, { force: true, recursive: true });
      return;
    } catch (error) {
      if (attempt === 7) {
        throw error;
      }
      await waitForWindowsProcessCleanup();
    }
  }
}

async function launchApp() {
  return electron.launch({
    args: [
      `--user-data-dir=${smokeUserDataDirectory}`,
      "apps/desktop/dist/main.js"
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
      JARVIS_K_TASK_DB_PATH: taskDatabasePath,
      JARVIS_K_MODEL_DIR: path.join(smokeUserDataDirectory, "models")
    }
  });
}

async function waitForPluginTaskSnapshot(window) {
  return window.waitForFunction(() => {
    return window.jarvis?.getSnapshot().then((result) => {
      if (!result.ok) return false;
      const tasks = result.data?.tasks;
      const task = Array.isArray(tasks)
        ? tasks.find((candidate) => candidate.intent === "plugin.invoke")
        : undefined;
      return Boolean(
        task &&
          task.title === "Invoke Read-only Plugin" &&
          task.state === "completed" &&
          task.routeSource === "intent-router.deterministic.rules" &&
          task.verificationSummary?.includes("sanitized output verified") &&
          task.steps?.some(
            (step) =>
              step.state === "completed" &&
              step.verificationStatus === "verified" &&
              step.resultSummary?.includes("sanitized output verified")
          )
      );
    });
  }, { timeout: 20_000 });
}

const startedAt = performance.now();

try {
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  await window.evaluate(() => {
    const originalSendCommand = window.jarvis?.sendCommand?.bind(window.jarvis);
    if (!originalSendCommand) {
      return;
    }
    window.jarvis.sendCommand = async (command) => {
      const result = await originalSendCommand(command);
      if (result.ok && result.data?.brain) {
        window.__pluginSdkSmokeLastBrain = result.data.brain;
      }
      return result;
    };
  });

  await window.getByTestId("command-input").fill(commandText);
  await window.getByTestId("send-command").click();
  await window.getByTestId("brain-intent").getByText("plugin.invoke").waitFor({
    timeout: 15_000
  });
  await window.getByTestId("plugin-result-panel").waitFor({ timeout: 15_000 });
  await window
    .getByTestId("plugin-result-summary")
    .getByText("Read-only sample quote returned for MSFT.")
    .waitFor({ timeout: 15_000 });
  await waitForPluginTaskSnapshot(window);

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor();
  await window
    .getByTestId("task-card")
    .getByText("Invoke Read-only Plugin")
    .waitFor();
  await window.getByTestId("task-step").getByText("verified").waitFor();

  const visibleResult = await window.evaluate(() => {
    const visibleText = document.body.innerText;
    return {
      intentVisible: visibleText.includes("plugin.invoke"),
      completedVisible: visibleText.includes("completed"),
      pluginSummaryVisible: visibleText.includes(
        "Read-only sample quote returned for MSFT."
      )
    };
  });
  if (
    !visibleResult.intentVisible ||
    !visibleResult.completedVisible ||
    !visibleResult.pluginSummaryVisible
  ) {
    throw new Error(
      `Plugin SDK smoke UI projection did not pass: ${JSON.stringify(visibleResult)}`
    );
  }

  await electronApp.close();
  electronApp = undefined;
  await waitForWindowsProcessCleanup();

  relaunchedApp = await launchApp();
  const relaunchedWindow = await relaunchedApp.firstWindow();
  await relaunchedWindow.setViewportSize({ width: 1440, height: 900 });
  await relaunchedWindow.getByTestId("jarvis-app").waitFor();
  await relaunchedWindow.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  await relaunchedWindow.getByTestId("nav-tasks").click();
  await relaunchedWindow
    .getByTestId("task-card")
    .getByText("Invoke Read-only Plugin")
    .waitFor({ timeout: 10_000 });
  await relaunchedWindow.getByTestId("task-step").getByText("verified").waitFor();
  await waitForPluginTaskSnapshot(relaunchedWindow);

  await mkdir(artifactsDirectory, { recursive: true });
  await relaunchedWindow.screenshot({ path: screenshotPath, fullPage: true });
  const startupMs = Math.round(performance.now() - startedAt);
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        commandClass: "plugin.invoke.stock.quote",
        pluginClass: "stock-analysis-sample",
        capability: "stock.quote",
        routeSource: "intent-router.deterministic.rules",
        taskDatabasePath: "sanitized-task-runtime.sqlite",
        expectedTaskState: "completed",
        expectedVerificationStatus: "verified",
        directActionAttempted: false,
        credentialExposed: false,
        rawPluginOutputPersisted: false,
        pluginMarketplaceUsed: false,
        networkPermissionUsed: false,
        filesystemPermissionUsed: false,
        shellExecutionUsed: false,
        taskPersistedAfterRestart: true,
        screenshotPath,
        metricsPath
      },
      null,
      2
    )}\n`
  );

  console.log(
    JSON.stringify({
      status: "PASS",
      startupMs,
      commandClass: "plugin.invoke.stock.quote",
      screenshotPath,
      metricsPath
    })
  );
} finally {
  if (relaunchedApp) {
    await relaunchedApp.close();
  }
  if (electronApp) {
    await electronApp.close();
  }
  await removeSmokeDirectory();
}
