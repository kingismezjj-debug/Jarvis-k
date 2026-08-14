import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const knownAppTarget = process.argv[2] ?? "notepad";
const knownApps = {
  notepad: {
    slug: "notepad",
    processName: "notepad",
    taskTitle: "Open Notepad",
    command: "\u6253\u5f00\u8bb0\u4e8b\u672c",
    verifiedMetricName: "notepadVerified"
  },
  calculator: {
    slug: "calculator",
    processName: "CalculatorApp",
    taskTitle: "Open Calculator",
    command: "open calculator",
    verifiedMetricName: "calculatorVerified"
  },
  vscode: {
    slug: "vscode",
    processName: "Code",
    taskTitle: "Open VS Code",
    command: "open vscode",
    verifiedMetricName: "vscodeVerified",
    requireNewProcess: false
  }
};
const knownApp = knownApps[knownAppTarget];
if (!knownApp) {
  throw new Error(`Unsupported known app smoke target: ${knownAppTarget}`);
}
const screenshotPath = path.join(
  artifactsDirectory,
  `jarvis-k-task-runtime-${knownApp.slug}-smoke.png`
);
const metricsPath = path.join(
  artifactsDirectory,
  `jarvis-k-task-runtime-${knownApp.slug}-smoke-metrics.json`
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), `jarvis-k-task-runtime-${knownApp.slug}-`)
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
let electronApp;
let relaunchedApp;

async function listProcessIds(processName) {
  const command = [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    [
      `$items = Get-Process -Name '${processName}' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id`,
      "if ($null -eq $items) { '[]' } else { $items | ConvertTo-Json -Compress }"
    ].join("; ")
  ];
  const { stdout } = await execFileAsync("powershell.exe", command, {
    windowsHide: true
  });
  const trimmed = stdout.trim();
  if (trimmed.length === 0 || trimmed === "[]") {
    return [];
  }
  const parsed = JSON.parse(trimmed);
  return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
}

async function stopProcessIds(processIds) {
  if (processIds.length === 0) {
    return;
  }
  await execFileAsync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Stop-Process -Id ${processIds.map((id) => Number(id)).join(",")} -Force -ErrorAction SilentlyContinue`
    ],
    { windowsHide: true }
  ).catch(() => undefined);
}

async function stopNewProcessIds(processName, beforeProcessIds) {
  const afterProcessIds = await listProcessIds(processName);
  const newProcessIds = afterProcessIds.filter(
    (processId) => !beforeProcessIds.includes(processId)
  );
  await stopProcessIds(newProcessIds);
  return newProcessIds;
}

async function waitForWindowsProcessCleanup() {
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function removeSmokeDirectory() {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await rm(smokeUserDataDirectory, { force: true, recursive: true });
      return;
    } catch (error) {
      if (attempt === 3) {
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

async function waitForTaskSnapshot(window) {
  return window.waitForFunction(() => {
    return window.jarvis?.getSnapshot().then((result) => {
      if (!result.ok) return false;
      const tasks = result.data?.tasks;
      const task = Array.isArray(tasks)
        ? tasks.find((candidate) => candidate.title === window.__knownAppTaskTitle)
        : undefined;
      return Boolean(
        task &&
          task.state === "completed" &&
          task.routeSource === "intent-router.deterministic.rules" &&
          task.steps?.some(
            (step) =>
              step.state === "completed" &&
              step.verificationStatus === "verified"
          )
      );
    });
  }, { timeout: 20_000 });
}

const startedAt = performance.now();
const appBefore = await listProcessIds(knownApp.processName);
const electronBefore = await listProcessIds("electron");
const nodeBefore = await listProcessIds("node");
let newAppProcessIds = [];
const smokeCommand = knownApp.command;

try {
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.evaluate((taskTitle) => {
    window.__knownAppTaskTitle = taskTitle;
  }, knownApp.taskTitle);
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });

  await window.getByTestId("command-input").fill(smokeCommand);
  await window.getByTestId("send-command").click();
  await waitForTaskSnapshot(window);

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor();
  const taskCard = window
    .getByTestId("task-card")
    .filter({ hasText: knownApp.taskTitle })
    .first();
  await taskCard.waitFor();
  await taskCard.getByTestId("task-step").first().waitFor();

  const appAfter = await listProcessIds(knownApp.processName);
  newAppProcessIds = appAfter.filter(
    (processId) => !appBefore.includes(processId)
  );
  if (newAppProcessIds.length === 0 && knownApp.requireNewProcess !== false) {
    throw new Error(`No new ${knownApp.processName} process was observed.`);
  }

  electronApp.process().kill();
  electronApp = undefined;
  await stopNewProcessIds("electron", electronBefore);
  await stopNewProcessIds("node", nodeBefore);
  await waitForWindowsProcessCleanup();

  relaunchedApp = await launchApp();
  const relaunchedWindow = await relaunchedApp.firstWindow();
  await relaunchedWindow.getByTestId("jarvis-app").waitFor();
  await relaunchedWindow.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  await relaunchedWindow.evaluate((taskTitle) => {
    window.__knownAppTaskTitle = taskTitle;
  }, knownApp.taskTitle);
  await waitForTaskSnapshot(relaunchedWindow);
  await relaunchedWindow.getByTestId("nav-tasks").click();
  const relaunchedTaskCard = relaunchedWindow
    .getByTestId("task-card")
    .filter({ hasText: knownApp.taskTitle })
    .first();
  await relaunchedTaskCard.waitFor({ timeout: 10_000 });
  await relaunchedTaskCard.getByTestId("task-step").first().waitFor();

  await mkdir(artifactsDirectory, { recursive: true });
  await relaunchedWindow.screenshot({ path: screenshotPath, fullPage: true });
  const startupMs = Math.round(performance.now() - startedAt);
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        command: smokeCommand,
        knownApp: knownApp.slug,
        taskDatabasePath: "sanitized-task-runtime.sqlite",
        processBeforeCount: appBefore.length,
        newProcessCount: newAppProcessIds.length,
        fixtureProductPathUsed: false,
        taskPersistedAfterRestart: true,
        knownAppVerified: true,
        [knownApp.verifiedMetricName]: true,
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
      knownApp: knownApp.slug,
      newProcessCount: newAppProcessIds.length,
      screenshotPath,
      metricsPath
    })
  );
} finally {
  if (relaunchedApp) {
    relaunchedApp.process().kill();
  }
  if (electronApp) {
    electronApp.process().kill();
  }
  await stopNewProcessIds("electron", electronBefore);
  await stopNewProcessIds("node", nodeBefore);
  await stopNewProcessIds(knownApp.processName, appBefore);
  await stopProcessIds(newAppProcessIds);
  await waitForWindowsProcessCleanup();
  await removeSmokeDirectory();
}
