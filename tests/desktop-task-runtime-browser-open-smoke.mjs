import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const scenarioName = process.argv[2] ?? "allowed";
const scenarios = {
  allowed: {
    slug: "allowed",
    command: "open https://example.com",
    sanitizedHost: "example.com",
    targetClass: "https_public",
    expectedTaskState: "completed",
    expectedVerificationStatus: "verified",
    expectNewBrowserProcess: false
  },
  blocked: {
    slug: "blocked",
    command: "open http://example.com",
    sanitizedHost: "example.com",
    targetClass: "blocked_http_public",
    expectedTaskState: "failed",
    expectedVerificationStatus: "verification_failed",
    expectNewBrowserProcess: false
  }
};
const scenario = scenarios[scenarioName];
if (!scenario) {
  throw new Error(`Unsupported browser smoke scenario: ${scenarioName}`);
}

const screenshotPath = path.join(
  artifactsDirectory,
  `jarvis-k-task-runtime-browser-open-${scenario.slug}-smoke.png`
);
const metricsPath = path.join(
  artifactsDirectory,
  `jarvis-k-task-runtime-browser-open-${scenario.slug}-smoke-metrics.json`
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), `jarvis-k-task-runtime-browser-${scenario.slug}-`)
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const browserProcessNames = ["msedge", "chrome", "firefox", "brave"];
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

async function listBrowserProcessIds() {
  const entries = await Promise.all(
    browserProcessNames.map(async (name) => [name, await listProcessIds(name)])
  );
  return Object.fromEntries(entries);
}

function diffProcessIds(before, after) {
  const result = {};
  for (const name of browserProcessNames) {
    const beforeIds = new Set(before[name] ?? []);
    const newIds = (after[name] ?? []).filter((id) => !beforeIds.has(id));
    if (newIds.length > 0) {
      result[name] = newIds;
    }
  }
  return result;
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

async function configureWindow(window) {
  await window.evaluate(
    ({ expectedTaskState, expectedVerificationStatus }) => {
      window.__browserSmokeExpectedTaskState = expectedTaskState;
      window.__browserSmokeExpectedVerificationStatus =
        expectedVerificationStatus;
    },
    {
      expectedTaskState: scenario.expectedTaskState,
      expectedVerificationStatus: scenario.expectedVerificationStatus
    }
  );
}

async function waitForTaskSnapshot(window) {
  return window.waitForFunction(() => {
    return window.jarvis?.getSnapshot().then((result) => {
      if (!result.ok) return false;
      const tasks = result.data?.tasks;
      const task = Array.isArray(tasks)
        ? tasks.find((candidate) => candidate.title === "Open Browser URL")
        : undefined;
      return Boolean(
        task &&
          task.state === window.__browserSmokeExpectedTaskState &&
          task.routeSource === "intent-router.deterministic.rules" &&
          task.steps?.some(
            (step) =>
              step.verificationStatus ===
              window.__browserSmokeExpectedVerificationStatus
          )
      );
    });
  }, { timeout: 20_000 });
}

const startedAt = performance.now();
const electronBefore = await listProcessIds("electron");
const nodeBefore = await listProcessIds("node");
const browserBefore = await listBrowserProcessIds();

try {
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await configureWindow(window);
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });

  await window.getByTestId("command-input").fill(scenario.command);
  await window.getByTestId("send-command").click();
  await waitForTaskSnapshot(window);

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor();
  await window.getByTestId("task-card").getByText("Open Browser URL").waitFor();
  await window
    .getByTestId("task-card")
    .getByText(scenario.expectedTaskState, { exact: true })
    .first()
    .waitFor();
  await window
    .getByTestId("task-step")
    .getByText(scenario.expectedVerificationStatus)
    .waitFor();

  const browserAfter = await listBrowserProcessIds();
  const newBrowserProcessIds = diffProcessIds(browserBefore, browserAfter);
  if (
    scenario.expectNewBrowserProcess === false &&
    scenario.expectedTaskState === "failed" &&
    Object.keys(newBrowserProcessIds).length > 0
  ) {
    throw new Error("Blocked browser URL smoke launched a browser process.");
  }

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
    .getByText("Open Browser URL")
    .waitFor({ timeout: 10_000 });
  await relaunchedWindow
    .getByTestId("task-card")
    .getByText(scenario.expectedTaskState, { exact: true })
    .first()
    .waitFor();
  await relaunchedWindow
    .getByTestId("task-step")
    .getByText(scenario.expectedVerificationStatus)
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
        scenario: scenario.slug,
        sanitizedHost: scenario.sanitizedHost,
        targetClass: scenario.targetClass,
        taskDatabasePath: "sanitized-task-runtime.sqlite",
        expectedTaskState: scenario.expectedTaskState,
        expectedVerificationStatus: scenario.expectedVerificationStatus,
        fixtureProductPathUsed: false,
        taskPersistedAfterRestart: true,
        browserUrlPolicyVerified:
          scenario.expectedVerificationStatus === "verified",
        newBrowserProcessObserved:
          Object.keys(newBrowserProcessIds).length > 0,
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
      scenario: scenario.slug,
      startupMs,
      newBrowserProcessObserved: Object.keys(newBrowserProcessIds).length > 0,
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
  await removeSmokeDirectory();
}
