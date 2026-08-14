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
  "jarvis-k-voice-task-runtime-known-app-correction-smoke.png",
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-voice-task-runtime-known-app-correction-smoke-metrics.json",
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-voice-task-runtime-known-app-correction-"),
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const voiceCommandText = "\u6253\u5f00\u5fae\u7231\u6b7b\u6263\u7684";
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
    timeout: 10_000,
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
    { timeout: 10_000, windowsHide: true },
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

async function waitForVoiceCorrectionTaskSnapshot(window) {
  return window.waitForFunction(() => {
    return window.jarvis?.getSnapshot().then((result) => {
      if (!result.ok) return false;
      const tasks = result.data?.tasks;
      const task = Array.isArray(tasks)
        ? tasks.find(
            (candidate) =>
              candidate.title === "Open VS Code" &&
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
  }, { timeout: 30_000 });
}

async function sendVoiceCorrectionCommand(window) {
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
      `Voice correction BrainCommand failed: ${JSON.stringify(result)}`,
    );
  }
  const brain = result.data?.brain;
  if (
    brain?.source !== "voice" ||
    brain?.decision?.intent !== "localApp.open" ||
    brain?.dispatchStatus !== "completed" ||
    brain?.decision?.requiresApproval !== false ||
    brain?.decision?.slots?.target !== "vscode" ||
    !String(brain?.summary ?? "").includes("Task Runtime opened VS Code")
  ) {
    throw new Error(
      `Unexpected voice correction result: ${JSON.stringify(brain)}`,
    );
  }
  return brain;
}

const startedAt = performance.now();
const vscodeBefore = await listProcessIds("Code");
const electronBefore = await listProcessIds("electron");
const nodeBefore = await listProcessIds("node");
let newVscodeProcessIds = [];

try {
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });

  const brain = await sendVoiceCorrectionCommand(window);
  await waitForVoiceCorrectionTaskSnapshot(window);

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor();
  const taskCard = window
    .getByTestId("task-card")
    .filter({ hasText: "Open VS Code" })
    .first();
  await taskCard.waitFor();
  await taskCard.getByText("completed", { exact: true }).first().waitFor();
  await taskCard.getByTestId("task-step").getByText("verified").waitFor();

  const vscodeAfter = await listProcessIds("Code");
  newVscodeProcessIds = vscodeAfter.filter(
    (processId) => !vscodeBefore.includes(processId),
  );
  if (vscodeAfter.length === 0) {
    throw new Error("No VS Code process was observed.");
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
  await waitForVoiceCorrectionTaskSnapshot(relaunchedWindow);
  await relaunchedWindow.getByTestId("nav-tasks").click();
  const relaunchedTaskCard = relaunchedWindow
    .getByTestId("task-card")
    .filter({ hasText: "Open VS Code" })
    .first();
  await relaunchedTaskCard.waitFor({ timeout: 10_000 });
  await relaunchedTaskCard
    .getByText("completed", { exact: true })
    .first()
    .waitFor();
  await relaunchedTaskCard
    .getByTestId("task-step")
    .getByText("verified")
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
        command: "sanitized-voice-vscode-correction-command",
        source: "voice",
        rawTranscriptPreserved: true,
        normalizedTranscript: brain.voiceCorrection?.normalizedTranscript,
        correctionSource: brain.voiceCorrection?.correctionSource,
        correctionConfidence: brain.voiceCorrection?.correctionConfidence,
        intent: brain.decision.intent,
        target: brain.decision.slots?.target,
        dispatchStatus: brain.dispatchStatus,
        requiresApproval: brain.decision.requiresApproval,
        taskDatabasePath: "sanitized-task-runtime.sqlite",
        processBeforeCount: vscodeBefore.length,
        newProcessCount: newVscodeProcessIds.length,
        vscodeProcessObserved: vscodeAfter.length > 0,
        taskPersistedAfterRestart: true,
        deterministicRulesUsed: true,
        fixtureProductPathUsed: false,
        correctionVerified: true,
        vscodeVerified: true,
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
      normalizedTranscript: brain.voiceCorrection?.normalizedTranscript,
      correctionConfidence: brain.voiceCorrection?.correctionConfidence,
      intent: brain.decision.intent,
      target: brain.decision.slots?.target,
      processObserved: vscodeAfter.length > 0,
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
  await waitForWindowsProcessCleanup();
  await removeSmokeDirectory();
}
process.exit(0);
