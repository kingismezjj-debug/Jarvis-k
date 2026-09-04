import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const scenarioName = process.argv[2] ?? "answered";
const scenarios = {
  answered: {
    slug: "answered",
    command: "Explain API gateway in one short sentence.",
    expectedText:
      "Smoke Chat Answer: Jarvis-K routed this general question through the bounded chat answer provider path.",
    expectedDispatchStatus: "running",
    expectedChatAnswerStatus: undefined,
    expectsStreaming: true,
    enableSmokeProvider: true
  },
  unavailable: {
    slug: "unavailable",
    command: "Explain API gateway in one short sentence.",
    expectedText:
      "Chat answer generation is unavailable; deterministic rules remain active.",
    expectedDispatchStatus: "degraded",
    expectedChatAnswerStatus: "unavailable",
    expectsStreaming: false,
    enableSmokeProvider: false
  }
};
const scenario = scenarios[scenarioName];
if (!scenario) {
  throw new Error(`Unsupported chat answer smoke scenario: ${scenarioName}`);
}

const screenshotPath = path.join(
  artifactsDirectory,
  `jarvis-k-chat-answer-${scenario.slug}-smoke.png`
);
const metricsPath = path.join(
  artifactsDirectory,
  `jarvis-k-chat-answer-${scenario.slug}-smoke-metrics.json`
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), `jarvis-k-chat-answer-${scenario.slug}-`)
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
let electronApp;

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
      JARVIS_K_ENABLE_LOCAL_SMOKE_CHAT_ANSWER: scenario.enableSmokeProvider
        ? "1"
        : "0",
      JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER: "0",
      JARVIS_K_ENABLE_QWEN_FAST_ROUTER: "0",
      JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
      JARVIS_K_TASK_DB_PATH: taskDatabasePath,
      JARVIS_K_MODEL_DIR: path.join(smokeUserDataDirectory, "models")
    }
  });
}

async function waitForBrainResult(window) {
  return window.waitForFunction(() => {
    return window.jarvis?.getSnapshot().then((result) => {
      if (!result.ok) return false;
      const tasks = result.data?.tasks;
      const brain = window.__chatAnswerSmokeLastBrain;
      if (window.__chatAnswerSmokeExpected.expectsStreaming) {
        const assistantTurn = result.data?.assistantTurn;
        const messages = Array.isArray(result.data?.messages)
          ? result.data.messages
          : [];
        return Boolean(
          Array.isArray(tasks) &&
            tasks.length === 0 &&
            brain &&
            brain.decision?.intent === "chat.answer" &&
            brain.dispatchStatus === "running" &&
            brain.assistantTurnId === assistantTurn?.turnId &&
            assistantTurn?.status === "completed" &&
            assistantTurn?.finalAnswer?.rawProviderResponsePersisted === false &&
            assistantTurn?.finalAnswer?.providerRawPayloadExposed === false &&
            messages.filter((message) => message.role === "assistant")
              .length === 1
        );
      }
      return Boolean(
        Array.isArray(tasks) &&
          tasks.length === 0 &&
          brain &&
          brain.decision?.intent === "chat.answer" &&
          brain.dispatchStatus ===
            window.__chatAnswerSmokeExpected.expectedDispatchStatus &&
          brain.chatAnswer?.status ===
            window.__chatAnswerSmokeExpected.expectedChatAnswerStatus &&
          brain.toolProductLoop?.directActionAttempted === false
      );
    });
  }, { timeout: 15_000 });
}

const startedAt = performance.now();
const electronBefore = await listProcessIds("electron");
const nodeBefore = await listProcessIds("node");

try {
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  await window.evaluate((expected) => {
    window.__chatAnswerSmokeExpected = expected;
    const originalSendCommand = window.jarvis?.sendCommand?.bind(window.jarvis);
    if (!originalSendCommand) {
      return;
    }
    window.jarvis.sendCommand = async (command) => {
      const result = await originalSendCommand(command);
      if (result.ok && result.data?.brain) {
        window.__chatAnswerSmokeLastBrain = result.data.brain;
      }
      return result;
    };
  }, scenario);

  await window.getByTestId("command-input").fill(scenario.command);
  await window.getByTestId("send-command").click();
  await window
    .getByText(scenario.expectedText)
    .first()
    .waitFor({ timeout: 20_000 });
  await waitForBrainResult(window);

  const brainResult = await window.evaluate(() => {
    const visibleText = document.body.innerText;
    return {
      visibleText,
      expectedTextVisible: visibleText.includes(
        window.__chatAnswerSmokeExpected.expectedText
      )
    };
  });
  if (!brainResult.expectedTextVisible) {
    throw new Error("Expected chat answer text was not visible.");
  }

  await mkdir(artifactsDirectory, { recursive: true });
  await window.screenshot({ path: screenshotPath, fullPage: true });
  const startupMs = Math.round(performance.now() - startedAt);
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        scenario: scenario.slug,
        commandClass: "chat.general",
        expectedDispatchStatus: scenario.expectedDispatchStatus,
        ...(scenario.expectedChatAnswerStatus
          ? { expectedChatAnswerStatus: scenario.expectedChatAnswerStatus }
          : {}),
        assistantRuntimeStreamingExpected: scenario.expectsStreaming === true,
        providerClass: scenario.enableSmokeProvider
          ? "local_smoke_chat_answer_provider"
          : "unconfigured_provider",
        realNetworkRequestSent: false,
        qwenRuntimeUsed: false,
        qwenRouteRequired: false,
        fixtureProductPathUsed: false,
        taskRuntimeUsed: false,
        directActionAttempted: false,
        rawProviderResponsePersisted: false,
        credentialExposed: false,
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
      screenshotPath,
      metricsPath
    })
  );
} finally {
  if (electronApp) {
    electronApp.process().kill();
  }
  await stopNewProcessIds("electron", electronBefore);
  await stopNewProcessIds("node", nodeBefore);
  await waitForWindowsProcessCleanup();
  await removeSmokeDirectory();
}
