import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";
import { requireRealWindowsExecution } from "./helpers/windows-real-execution-guard.mjs";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const acceptance = requireRealWindowsExecution({
  scriptName: "desktop-task-runtime-notepad-write",
  argv: process.argv.slice(2),
  plannedActions: [{ id: "write_notepad_text", software: ["Notepad"] }],
});
if (acceptance.dryRun) {
  process.exit(0);
}
const smokeText = "Jarvis-K smoke text";
const smokeCommand = `write ${smokeText} in notepad`;
const taskTitle = "Write Text In Notepad";
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-task-runtime-notepad-write-smoke.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-task-runtime-notepad-write-smoke-metrics.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-task-runtime-notepad-write-")
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

async function waitForNotepadWriteTask(window) {
  return window.waitForFunction((expectedTaskTitle) => {
    return window.jarvis?.getSnapshot().then((result) => {
      if (!result.ok) return false;
      const tasks = result.data?.tasks;
      const task = Array.isArray(tasks)
        ? tasks.find((candidate) => candidate.title === expectedTaskTitle)
        : undefined;
      return Boolean(
        task &&
          task.state === "completed" &&
          task.intent === "notepad.write_text" &&
          task.routeSource === "intent-router.deterministic.rules" &&
          task.verificationSummary?.includes("verification passed") &&
          !JSON.stringify(task).includes("Jarvis-K smoke text") &&
          task.steps?.some(
            (step) =>
              step.state === "completed" &&
              step.verificationStatus === "verified"
          )
      );
    });
  }, taskTitle, { timeout: 25_000 });
}

function getNotepadWriteTaskCard(window) {
  return window.getByTestId("task-card").filter({ hasText: taskTitle }).first();
}

const startedAt = performance.now();
const notepadBefore = await listProcessIds("notepad");
const electronBefore = await listProcessIds("electron");
const nodeBefore = await listProcessIds("node");
let newNotepadProcessIds = [];

try {
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });

  await window.getByTestId("command-input").fill(smokeCommand);
  await window.getByTestId("send-command").click();
  await waitForNotepadWriteTask(window);

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor();
  const taskCard = getNotepadWriteTaskCard(window);
  await taskCard.getByText(taskTitle).waitFor();
  try {
    await taskCard.getByText("completed", { exact: true }).first().waitFor({
      timeout: 10_000
    });
  } catch (error) {
    const renderedTaskText = await taskCard.innerText().catch(() => "");
    const sanitizedSnapshot = await window.evaluate((expectedTaskTitle) =>
      window.jarvis?.getSnapshot().then((result) => {
        const tasks = result.ok ? result.data?.tasks ?? [] : [];
        const task = tasks.find((candidate) => candidate.title === expectedTaskTitle);
        return task
          ? {
              title: task.title,
              state: task.state,
              intent: task.intent,
              routeSource: task.routeSource,
              verificationSummary: task.verificationSummary,
              steps: task.steps.map((step) => ({
                title: step.title,
                state: step.state,
                verificationStatus: step.verificationStatus,
                resultSummary: step.resultSummary,
                failureReason: step.failureReason
              }))
            }
          : null;
      }), taskTitle);
    throw new Error(
      `Task card did not render completed state. Card=${JSON.stringify(renderedTaskText)} Snapshot=${JSON.stringify(sanitizedSnapshot)} Cause=${error}`
    );
  }
  await taskCard.getByTestId("task-step").getByText("verified").waitFor();

  const notepadAfter = await listProcessIds("notepad");
  newNotepadProcessIds = notepadAfter.filter(
    (processId) => !notepadBefore.includes(processId)
  );
  if (notepadAfter.length === 0) {
    throw new Error("No Notepad process was observed.");
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
  await relaunchedWindow.getByTestId("nav-tasks").click();
  const relaunchedTaskCard = getNotepadWriteTaskCard(relaunchedWindow);
  await relaunchedTaskCard.getByText(taskTitle).waitFor({
    timeout: 10_000
  });
  await relaunchedTaskCard.getByText("completed", { exact: true }).first().waitFor();
  await relaunchedTaskCard.getByTestId("task-step").getByText("verified").waitFor();

  await mkdir(artifactsDirectory, { recursive: true });
  await relaunchedWindow.screenshot({ path: screenshotPath, fullPage: true });
  const startupMs = Math.round(performance.now() - startedAt);
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        command: "sanitized-notepad-write-command",
        taskDatabasePath: "sanitized-task-runtime.sqlite",
        newProcessCount: newNotepadProcessIds.length,
        notepadProcessObserved: notepadAfter.length > 0,
        existingNotepadReused: notepadBefore.length > 0,
        fixtureProductPathUsed: false,
        taskPersistedAfterRestart: true,
        notepadWriteVerified: true,
        rawWriteTextPersistedInTask: false,
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
      newProcessCount: newNotepadProcessIds.length,
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
  await stopNewProcessIds("notepad", notepadBefore);
  await stopProcessIds(newNotepadProcessIds);
  await waitForWindowsProcessCleanup();
  await removeSmokeDirectory();
}
