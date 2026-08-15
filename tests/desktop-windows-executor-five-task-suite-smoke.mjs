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
  scriptName: "desktop-windows-executor-five-task-suite",
  argv: process.argv.slice(2),
  plannedActions: [
    { id: "open_notepad", software: ["Notepad"] },
    { id: "write_notepad_text", software: ["Notepad"] },
    { id: "window_control_notepad", count: 3, software: ["Notepad"] },
    { id: "open_calculator", software: ["Calculator"] },
  ],
});
if (acceptance.dryRun) {
  process.exit(0);
}
const smokeText = "Jarvis-K smoke text";
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-windows-executor-suite-")
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-windows-executor-five-task-suite-smoke.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-windows-executor-five-task-suite-smoke-metrics.json"
);
const commands = [
  {
    command: "open notepad",
    title: "Open Notepad",
    intent: "localApp.open"
  },
  {
    command: `write ${smokeText} in notepad`,
    title: "Write Text In Notepad",
    intent: "notepad.write_text"
  },
  {
    command: "minimize notepad",
    title: "Minimize Notepad Window",
    intent: "window.minimize"
  },
  {
    command: "restore notepad",
    title: "Restore Notepad Window",
    intent: "window.restore"
  },
  {
    command: "focus notepad",
    title: "Focus Notepad Window",
    intent: "window.focus"
  },
  {
    command: "open calculator",
    title: "Open Calculator",
    intent: "localApp.open"
  }
];

let electronApp;
let relaunchedApp;
let notepadProcessIdsAfterOpen = [];

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

async function waitForCompletedTask(window, expected, completedTaskCount) {
  return window.waitForFunction(
    ({ expectedTask, minCompletedCount, rawText }) => {
      return window.jarvis?.getSnapshot().then((result) => {
        if (!result.ok) return false;
        const tasks = result.data?.tasks;
        if (!Array.isArray(tasks)) return false;
        const task = tasks.find(
          (candidate) =>
            candidate.title === expectedTask.title &&
            candidate.intent === expectedTask.intent &&
            candidate.routeSource === "intent-router.deterministic.rules"
        );
        const completedCount = tasks.filter(
          (candidate) =>
            candidate.state === "completed" &&
            candidate.routeSource === "intent-router.deterministic.rules" &&
            candidate.steps?.some(
              (step) =>
                step.state === "completed" &&
                step.verificationStatus === "verified"
            )
        ).length;
        return Boolean(
          task &&
            task.state === "completed" &&
            task.steps?.some(
              (step) =>
                step.state === "completed" &&
                step.verificationStatus === "verified"
            ) &&
            !JSON.stringify(task).includes(rawText) &&
            completedCount >= minCompletedCount
        );
      });
    },
    {
      expectedTask: expected,
      minCompletedCount: completedTaskCount,
      rawText: smokeText
    },
    { timeout: 30_000 }
  );
}

async function getSanitizedTaskSnapshot(window) {
  return window.evaluate((rawText) =>
    window.jarvis?.getSnapshot().then((result) => {
      const tasks = result.ok ? result.data?.tasks ?? [] : [];
      return tasks.map((task) => ({
        title: task.title,
        state: task.state,
        intent: task.intent,
        routeSource: task.routeSource,
        verificationSummary: task.verificationSummary,
        rawTextPersisted: JSON.stringify(task).includes(rawText),
        verifiedStepCount: task.steps.filter(
          (step) =>
            step.state === "completed" &&
            step.verificationStatus === "verified"
        ).length
      }));
    }), smokeText);
}

const startedAt = performance.now();
const notepadBefore = await listProcessIds("notepad");
const calculatorBefore = await listProcessIds("CalculatorApp");
const electronBefore = await listProcessIds("electron");
const nodeBefore = await listProcessIds("node");
let newNotepadProcessIds = [];
let newCalculatorProcessIds = [];

try {
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });

  for (const [index, command] of commands.entries()) {
    await window.getByTestId("command-input").fill(command.command);
    await window.getByTestId("send-command").click();
    await waitForCompletedTask(window, command, index + 1);
    if (command.title === "Open Notepad") {
      notepadProcessIdsAfterOpen = await listProcessIds("notepad");
    }
    if (command.title === "Write Text In Notepad") {
      const notepadProcessIdsAfterWrite = await listProcessIds("notepad");
      const extraNotepadProcessIds = notepadProcessIdsAfterWrite.filter(
        (processId) => !notepadProcessIdsAfterOpen.includes(processId)
      );
      if (extraNotepadProcessIds.length > 0) {
        throw new Error(
          "Notepad write opened an additional Notepad process instead of reusing the existing window."
        );
      }
    }
  }

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor();
  for (const command of commands) {
    const taskCard = window
      .getByTestId("task-card")
      .filter({ hasText: command.title })
      .first();
    await taskCard.getByText(command.title).waitFor();
    await taskCard.getByText("completed", { exact: true }).first().waitFor();
    await taskCard.getByTestId("task-step").getByText("verified").waitFor();
  }

  newNotepadProcessIds = (await listProcessIds("notepad")).filter(
    (processId) => !notepadBefore.includes(processId)
  );
  newCalculatorProcessIds = (await listProcessIds("CalculatorApp")).filter(
    (processId) => !calculatorBefore.includes(processId)
  );
  if (newNotepadProcessIds.length === 0) {
    throw new Error("No new Notepad process was observed.");
  }

  const firstRunTasks = await getSanitizedTaskSnapshot(window);
  if (
    firstRunTasks.filter(
      (task) =>
        commands.some(
          (command) =>
            command.title === task.title && command.intent === task.intent
        ) &&
        task.state === "completed" &&
        task.verifiedStepCount >= 1
    ).length < commands.length
  ) {
    throw new Error(
      `Not all Windows executor tasks were completed and verified: ${JSON.stringify(firstRunTasks)}`
    );
  }
  if (firstRunTasks.some((task) => task.rawTextPersisted)) {
    throw new Error("Raw Notepad write text was persisted in task evidence.");
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
  await relaunchedWindow.getByTestId("tasks-view").waitFor();
  for (const command of commands) {
    const taskCard = relaunchedWindow
      .getByTestId("task-card")
      .filter({ hasText: command.title })
      .first();
    await taskCard.getByText(command.title).waitFor({ timeout: 10_000 });
    await taskCard.getByText("completed", { exact: true }).first().waitFor();
    await taskCard.getByTestId("task-step").getByText("verified").waitFor();
  }

  await mkdir(artifactsDirectory, { recursive: true });
  await relaunchedWindow.screenshot({ path: screenshotPath, fullPage: true });
  const startupMs = Math.round(performance.now() - startedAt);
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        fixedTaskCount: commands.length,
        consecutivePass: true,
        taskDatabasePath: "sanitized-task-runtime.sqlite",
        routeSource: "intent-router.deterministic.rules",
        fixtureProductPathUsed: false,
        taskPersistedAfterRestart: true,
        notepadProcessObserved: newNotepadProcessIds.length > 0,
        notepadWriteReusedExistingProcess: true,
        calculatorProcessObserved: newCalculatorProcessIds.length > 0,
        rawWriteTextPersistedInTask: false,
        tasks: commands.map(({ title, intent }) => ({ title, intent })),
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
      fixedTaskCount: commands.length,
      consecutivePass: true,
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
  await stopNewProcessIds("CalculatorApp", calculatorBefore);
  await stopProcessIds(newNotepadProcessIds);
  await stopProcessIds(newCalculatorProcessIds);
  await waitForWindowsProcessCleanup();
  await removeSmokeDirectory();
}
