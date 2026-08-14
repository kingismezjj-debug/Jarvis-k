import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-chat-answer-real-provider-ui-")
);
const taskDatabasePath = path.join(smokeUserDataDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-chat-answer-real-provider-ui-smoke-metrics.json"
);
const fixedUtterance =
  "Answer in one short sentence: what is Jarvis-K?";
let electronApp;
let finalStatus = "blocked";

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
    args: ["apps/desktop/dist/main.js"],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK: "1",
      JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_PRODUCT_MANUAL_ACCEPTANCE: "1",
      JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER: "0",
      JARVIS_K_ENABLE_LOCAL_SMOKE_CHAT_ANSWER: "0",
      JARVIS_K_ENABLE_QWEN_FAST_ROUTER: "0",
      JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
      JARVIS_K_TASK_DB_PATH: taskDatabasePath,
      JARVIS_K_MODEL_DIR: path.join(smokeUserDataDirectory, "models")
    }
  });
}

async function writeMetrics(metrics) {
  await mkdir(artifactsDirectory, { recursive: true });
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        providerId: "chat-answer.openai-compatible.deepseek",
        profileId: "deepseek.v4-flash.compact_json_object_256",
        commandClass: "chat.general.fixed_real_provider_ui_acceptance",
        qwenRuntimeUsed: false,
        qwenRouteRequired: false,
        fixtureProductPathUsed: false,
        taskRuntimeUsed: false,
        directActionAttempted: false,
        rawProviderResponsePersisted: false,
        credentialExposed: false,
        ...metrics,
        metricsPath
      },
      null,
      2
    )}\n`
  );
}

const startedAt = performance.now();
const electronBefore = await listProcessIds("electron");
const nodeBefore = await listProcessIds("node");

realProviderAcceptance: try {
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });

  const initialStatus = await window.evaluate(() =>
    window.jarvis.getChatAnswerProductModeStatus()
  );
  if (
    initialStatus.secureStorageAvailable !== true ||
    initialStatus.credentialConfigured !== true
  ) {
    await writeMetrics({
      status: "blocked",
      reasonCode: initialStatus.secureStorageAvailable
        ? "CHAT_ANSWER_PRODUCT_MODE_CREDENTIAL_MISSING"
        : "CHAT_ANSWER_PRODUCT_MODE_SECURE_STORE_UNAVAILABLE",
      credentialConfigured: initialStatus.credentialConfigured === true,
      secureStorageAvailable: initialStatus.secureStorageAvailable === true,
      networkAccessApproved: false,
      realProviderRuntimeEnabled: false,
      startupMs: Math.round(performance.now() - startedAt)
    });
    console.log(
      JSON.stringify({
        status: "BLOCKED",
        reasonCode: initialStatus.secureStorageAvailable
          ? "CHAT_ANSWER_PRODUCT_MODE_CREDENTIAL_MISSING"
          : "CHAT_ANSWER_PRODUCT_MODE_SECURE_STORE_UNAVAILABLE",
        metricsPath
      })
    );
    process.exitCode = 2;
    break realProviderAcceptance;
  }

  const enabledResult = await window.evaluate(() =>
    window.jarvis.setChatAnswerProductModeEnabled(true)
  );
  if (
    enabledResult.ok !== true ||
    enabledResult.status.realProviderRuntimeEnabled !== true ||
    enabledResult.status.networkAccessApproved !== true
  ) {
    await writeMetrics({
      status: "blocked",
      reasonCode: "CHAT_ANSWER_PRODUCT_MODE_REAL_RUNTIME_LOCKED",
      credentialConfigured: enabledResult.status.credentialConfigured === true,
      secureStorageAvailable:
        enabledResult.status.secureStorageAvailable === true,
      networkAccessApproved:
        enabledResult.status.networkAccessApproved === true,
      realProviderRuntimeEnabled:
        enabledResult.status.realProviderRuntimeEnabled === true,
      startupMs: Math.round(performance.now() - startedAt)
    });
    console.log(
      JSON.stringify({
        status: "BLOCKED",
        reasonCode: "CHAT_ANSWER_PRODUCT_MODE_REAL_RUNTIME_LOCKED",
        metricsPath
      })
    );
    process.exitCode = 2;
    break realProviderAcceptance;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  const commandResult = await window.evaluate((text) =>
    window.jarvis.sendCommand({
      type: "agent.runBrainCommand",
      payload: {
        source: "text",
        text
      }
    }),
    fixedUtterance
  );
  if (!commandResult.ok || !commandResult.data?.brain) {
    await writeMetrics({
      status: "degraded",
      reasonCode: "CHAT_ANSWER_REAL_PROVIDER_UI_COMMAND_FAILED",
      credentialConfigured: true,
      secureStorageAvailable: true,
      networkAccessApproved: true,
      realProviderRuntimeEnabled: true,
      startupMs: Math.round(performance.now() - startedAt)
    });
    console.log(
      JSON.stringify({
        status: "DEGRADED",
        reasonCode: "CHAT_ANSWER_REAL_PROVIDER_UI_COMMAND_FAILED",
        metricsPath
      })
    );
    process.exitCode = 1;
    break realProviderAcceptance;
  }
  await window.evaluate((brain) => {
    window.__realProviderChatAnswerBrain = brain;
  }, commandResult.data.brain);

  await window.waitForFunction(() =>
    window.jarvis.getSnapshot().then((result) => {
      if (!result.ok) return false;
      return Array.isArray(result.data?.tasks) && result.data.tasks.length === 0;
    })
  );

  const finalBrain = await window.evaluate(() => ({
    dispatchStatus: window.__realProviderChatAnswerBrain.dispatchStatus,
    chatAnswerStatus: window.__realProviderChatAnswerBrain.chatAnswer.status,
    reasonCode: window.__realProviderChatAnswerBrain.chatAnswer.reasonCode,
    failureClass: window.__realProviderChatAnswerBrain.chatAnswer.failureClass,
    directActionAttempted:
      window.__realProviderChatAnswerBrain.chatAnswer.directActionAttempted,
    rawProviderResponsePersisted:
      window.__realProviderChatAnswerBrain.chatAnswer.rawProviderResponsePersisted,
    credentialExposed:
      window.__realProviderChatAnswerBrain.chatAnswer.credentialExposed,
    toolDirectActionAttempted:
      window.__realProviderChatAnswerBrain.toolProductLoop.directActionAttempted
  }));
  if (
    finalBrain.dispatchStatus !== "completed" ||
    finalBrain.chatAnswerStatus !== "answered" ||
    finalBrain.directActionAttempted !== false ||
    finalBrain.rawProviderResponsePersisted !== false ||
    finalBrain.credentialExposed !== false ||
    finalBrain.toolDirectActionAttempted !== false
  ) {
    await writeMetrics({
      status: "degraded",
      startupMs: Math.round(performance.now() - startedAt),
      credentialConfigured: true,
      secureStorageAvailable: true,
      networkAccessApproved: true,
      realProviderRuntimeEnabled: true,
      expectedDispatchStatus: "completed",
      expectedChatAnswerStatus: "answered",
      result: finalBrain
    });
    console.log(
      JSON.stringify({
        status: "DEGRADED",
        reasonCode: finalBrain.reasonCode,
        failureClass: finalBrain.failureClass,
        metricsPath
      })
    );
    process.exitCode = 1;
    break realProviderAcceptance;
  }
  await window.waitForFunction((assistantMessageId) =>
    window.jarvis.getSnapshot().then((result) => {
      if (!result.ok) return false;
      const conversations = result.data?.conversations;
      const messages = Array.isArray(conversations)
        ? conversations.flatMap((conversation) => conversation.messages ?? [])
        : [];
      return messages.some(
        (message) =>
          message.id === assistantMessageId && message.role === "assistant"
      );
    }),
    commandResult.data.brain.assistantMessageId,
    { timeout: 10_000 }
  );
  finalStatus = "passed";
  await writeMetrics({
    status: "passed",
    startupMs: Math.round(performance.now() - startedAt),
    credentialConfigured: true,
    secureStorageAvailable: true,
    networkAccessApproved: true,
    realProviderRuntimeEnabled: true,
    expectedDispatchStatus: "completed",
    expectedChatAnswerStatus: "answered",
    assistantMessageVisibleInUiSnapshot: true,
    result: finalBrain
  });
  console.log(
    JSON.stringify({
      status: "PASS",
      startupMs: Math.round(performance.now() - startedAt),
      metricsPath
    })
  );
} finally {
  if (electronApp) {
    await electronApp
      .firstWindow()
      .then((window) =>
        window.evaluate(() =>
          window.jarvis?.setChatAnswerProductModeEnabled(false)
        )
      )
      .catch(() => undefined);
    electronApp.process().kill();
  }
  await stopNewProcessIds("electron", electronBefore);
  await stopNewProcessIds("node", nodeBefore);
  await waitForWindowsProcessCleanup();
  await removeSmokeDirectory();
  if (finalStatus !== "passed" && process.exitCode === undefined) {
    process.exitCode = 2;
  }
}
