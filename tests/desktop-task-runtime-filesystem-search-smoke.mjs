import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-task-runtime-filesystem-search-smoke.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-task-runtime-filesystem-search-smoke-metrics.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-task-runtime-filesystem-search-")
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const smokeSearchFilename = `jarvis-k-smoke-contract-alpha-${process.pid}.txt`;
const smokeSearchQuery = `jarvis smoke contract ${process.pid}`;
const userProfileDirectory = process.env.USERPROFILE ?? os.homedir();
const documentsDirectory = path.join(userProfileDirectory, "Documents");
const smokeSearchFilePath = path.join(documentsDirectory, smokeSearchFilename);
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
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function removeSmokeDirectory() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      await rm(smokeUserDataDirectory, { force: true, recursive: true });
      return;
    } catch (error) {
      if (attempt === 11) {
        throw error;
      }
      await waitForWindowsProcessCleanup();
    }
  }
}

async function prepareAllowedSearchRoots() {
  await mkdir(documentsDirectory, { recursive: true });
  await writeFile(
    smokeSearchFilePath,
    "sanitized smoke search target\n"
  );
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

async function configureWindow(window) {
  await window.evaluate((filename) => {
    window.__filesystemSearchTaskTitle = "Search Filesystem";
    window.__filesystemSearchFilename = filename;
  }, smokeSearchFilename);
}

async function waitForTaskSnapshot(window) {
  return window.waitForFunction(() => {
    return window.jarvis?.getSnapshot().then((result) => {
      if (!result.ok) return false;
      const tasks = result.data?.tasks;
      const task = Array.isArray(tasks)
        ? tasks.find(
            (candidate) => candidate.title === window.__filesystemSearchTaskTitle
          )
        : undefined;
      return Boolean(
        task &&
          task.state === "completed" &&
          task.intent === "filesystem.search" &&
          task.routeSource === "intent-router.deterministic.rules" &&
          task.verificationSummary?.includes(window.__filesystemSearchFilename) &&
          !task.verificationSummary?.includes("\\") &&
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
const electronBefore = await listProcessIds("electron");
const nodeBefore = await listProcessIds("node");

try {
  await prepareAllowedSearchRoots();
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await configureWindow(window);
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });

  await window.getByTestId("command-input").fill(`find ${smokeSearchQuery}`);
  await window.getByTestId("send-command").click();
  await waitForTaskSnapshot(window);

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor();
  await window.getByTestId("task-card").getByText("Search Filesystem").waitFor();
  await window
    .getByTestId("task-card")
    .getByText("completed", { exact: true })
    .first()
    .waitFor();
  await window.getByTestId("task-step").getByText("verified").waitFor();
  await window
    .getByTestId("task-card")
    .getByText(smokeSearchFilename)
    .first()
    .waitFor();

  electronApp.process().kill();
  electronApp = undefined;
  await stopNewProcessIds("electron", electronBefore);
  await stopNewProcessIds("node", nodeBefore);
  await waitForWindowsProcessCleanup();

  relaunchedApp = await launchApp();
  const relaunchedWindow = await relaunchedApp.firstWindow();
  await configureWindow(relaunchedWindow);
  await relaunchedWindow.getByTestId("jarvis-app").waitFor();
  await relaunchedWindow.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  await relaunchedWindow.getByTestId("nav-tasks").click();
  await relaunchedWindow
    .getByTestId("task-card")
    .getByText("Search Filesystem")
    .waitFor({ timeout: 10_000 });
  await relaunchedWindow
    .getByTestId("task-card")
    .getByText("completed", { exact: true })
    .first()
    .waitFor();
  await relaunchedWindow.getByTestId("task-step").getByText("verified").waitFor();
  await relaunchedWindow
    .getByTestId("task-card")
    .getByText(smokeSearchFilename)
    .first()
    .waitFor();

  await mkdir(artifactsDirectory, { recursive: true });
  await relaunchedWindow.screenshot({ path: screenshotPath, fullPage: true });
  const startupMs = Math.round(performance.now() - startedAt);
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        commandClass: "filesystem.search.allowed_documents_filename",
        sanitizedQueryClass: "jarvis_smoke_contract_pid",
        sanitizedCandidateEvidence: [smokeSearchFilename],
        taskDatabasePath: "sanitized-task-runtime.sqlite",
        expectedTaskState: "completed",
        expectedVerificationStatus: "verified",
        fixtureProductPathUsed: false,
        taskPersistedAfterRestart: true,
        filesystemSearchVerified: true,
        openedOrExecutedFiles: false,
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
      sanitizedCandidateCount: 1,
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
  await waitForWindowsProcessCleanup();
  await rm(smokeSearchFilePath, { force: true }).catch(() => undefined);
  await removeSmokeDirectory();
}
