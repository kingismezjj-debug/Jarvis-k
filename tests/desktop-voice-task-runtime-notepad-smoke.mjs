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
  "jarvis-k-voice-task-runtime-notepad-smoke.png",
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-voice-task-runtime-notepad-smoke-metrics.json",
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-voice-task-runtime-notepad-"),
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const voiceCommandText = "\u6253\u5f00\u8bb0\u4e8b\u672c\u3002";
let electronApp;
let relaunchedApp;

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
      `Stop-Process -Id ${processIds.map((id) => Number(id)).join(",")} -Force -ErrorAction SilentlyContinue`,
    ],
    { windowsHide: true },
  ).catch(() => undefined);
}

async function stopNewProcessIds(processName, beforeProcessIds) {
  const afterProcessIds = await listProcessIds(processName);
  const newProcessIds = afterProcessIds.filter(
    (processId) => !beforeProcessIds.includes(processId),
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
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
      JARVIS_K_TASK_DB_PATH: taskDatabasePath,
      JARVIS_K_MODEL_DIR: path.join(smokeUserDataDirectory, "models"),
    },
  });
}

async function waitForVoiceTaskSnapshot(window) {
  return window.waitForFunction(() => {
    return window.jarvis?.getSnapshot().then((result) => {
      if (!result.ok) return false;
      const tasks = result.data?.tasks;
      const task = Array.isArray(tasks)
        ? tasks.find(
            (candidate) =>
              candidate.title === "Open Notepad" &&
              candidate.intent === "localApp.open" &&
              candidate.source === "voice",
          )
        : undefined;
      return Boolean(
        task &&
          task.state === "completed" &&
          task.routeSource === "intent-router.deterministic.rules" &&
          task.steps?.some(
            (step) =>
              step.state === "completed" &&
              step.verificationStatus === "verified",
          ),
      );
    });
  }, { timeout: 20_000 });
}

async function sendVoiceSourceCommand(window) {
  const result = await window.evaluate(async (text) => {
    return window.jarvis?.sendCommand({
      type: "agent.runBrainCommand",
      payload: {
        source: "voice",
        text,
      },
    });
  }, voiceCommandText);
  if (!result?.ok) {
    throw new Error(
      `Voice-source BrainCommand failed: ${JSON.stringify(result)}`,
    );
  }
  const brain = result.data?.brain;
  if (
    brain?.source !== "voice" ||
    brain?.decision?.intent !== "localApp.open" ||
    brain?.dispatchStatus !== "completed" ||
    brain?.decision?.requiresApproval !== false ||
    !String(brain?.summary ?? "").includes("Task Runtime opened Notepad")
  ) {
    throw new Error(
      `Unexpected voice BrainCommand result: ${JSON.stringify(brain)}`,
    );
  }
  return brain;
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
    timeout: 15_000,
  });

  const brain = await sendVoiceSourceCommand(window);
  await waitForVoiceTaskSnapshot(window);

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor();
  await window.getByTestId("task-card").getByText("Open Notepad").waitFor();
  await window
    .getByTestId("task-card")
    .getByText("completed", { exact: true })
    .first()
    .waitFor();
  await window.getByTestId("task-step").getByText("verified").waitFor();

  const notepadAfter = await listProcessIds("notepad");
  newNotepadProcessIds = notepadAfter.filter(
    (processId) => !notepadBefore.includes(processId),
  );
  if (newNotepadProcessIds.length === 0) {
    throw new Error("No new notepad process was observed.");
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
    timeout: 15_000,
  });
  await relaunchedWindow.getByTestId("nav-tasks").click();
  await relaunchedWindow
    .getByTestId("task-card")
    .getByText("Open Notepad")
    .waitFor({ timeout: 10_000 });
  await relaunchedWindow
    .getByTestId("task-card")
    .getByText("completed", { exact: true })
    .first()
    .waitFor();
  await relaunchedWindow.getByTestId("task-step").getByText("verified").waitFor();

  await mkdir(artifactsDirectory, { recursive: true });
  await relaunchedWindow.screenshot({ path: screenshotPath, fullPage: true });
  const startupMs = Math.round(performance.now() - startedAt);
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        command: "sanitized-voice-notepad-command",
        source: "voice",
        intent: brain.decision.intent,
        dispatchStatus: brain.dispatchStatus,
        requiresApproval: brain.decision.requiresApproval,
        taskDatabasePath: "sanitized-task-runtime.sqlite",
        newProcessCount: newNotepadProcessIds.length,
        taskPersistedAfterRestart: true,
        deterministicRulesUsed: true,
        fixtureProductPathUsed: false,
        notepadVerified: true,
        ttsEligible: brain.alphaHardening?.tts?.status === "eligible",
        screenshotPath,
        metricsPath,
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    JSON.stringify({
      status: "PASS",
      startupMs,
      source: "voice",
      intent: brain.decision.intent,
      newProcessCount: newNotepadProcessIds.length,
      screenshotPath,
      metricsPath,
    }),
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
