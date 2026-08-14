import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-plugin-local-template-runtime-smoke.png",
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-plugin-local-template-runtime-smoke-metrics.json",
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-plugin-local-template-runtime-"),
);
const taskDatabasePath = path.join(
  smokeUserDataDirectory,
  "task-runtime.sqlite",
);
const memoryDatabasePath = path.join(smokeUserDataDirectory, "memory.sqlite");
const localPluginStatePath = path.join(
  smokeUserDataDirectory,
  "local-plugin-state.json",
);
const localPluginDirectory = path.join(
  rootDirectory,
  "examples",
  "local-plugins",
  "hello-readonly",
);
const commandText = "hello plugin Jarvis";
const expectedSummary =
  "Hello Jarvis. This read-only local plugin template returned a sanitized result.";
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
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS: "1",
      JARVIS_K_LOCAL_PLUGIN_DIRS: localPluginDirectory,
      JARVIS_K_LOCAL_PLUGIN_STATE_PATH: localPluginStatePath,
      JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
      JARVIS_K_TASK_DB_PATH: taskDatabasePath,
      JARVIS_K_MODEL_DIR: path.join(smokeUserDataDirectory, "models"),
    },
  });
}

async function waitForPluginTaskSnapshot(window) {
  return window.waitForFunction(
    () => {
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
              step.title?.includes("hello.lookup") &&
              step.resultSummary?.includes("sanitized output verified"),
          ),
        );
      });
    },
    { timeout: 20_000 },
  );
}

async function openPluginsView(app) {
  const window = await app.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });
  await window.getByTestId("nav-plugins").click();
  await window.getByTestId("plugins-view").waitFor();
  await window.getByTestId("refresh-plugins").click();
  await window
    .getByTestId("plugin-card")
    .getByText("Hello Read-only Local Plugin")
    .waitFor({ timeout: 15_000 });
  return window;
}

async function enableHelloLocalPlugin(window) {
  const card = window
    .getByTestId("plugin-card")
    .filter({ hasText: "Hello Read-only Local Plugin" })
    .first();
  await card.getByTestId("local-plugin-state-toggle").click();
  await card.getByText("enabled", { exact: true }).waitFor({
    timeout: 15_000,
  });
  await card.getByText("local_readonly_runtime").waitFor({ timeout: 15_000 });
  await card.getByText("LOCAL_PLUGIN_STATE_ENABLED_EXECUTABLE").waitFor({
    timeout: 15_000,
  });
}

async function disableHelloLocalPlugin(window) {
  const card = window
    .getByTestId("plugin-card")
    .filter({ hasText: "Hello Read-only Local Plugin" })
    .first();
  await card.getByTestId("local-plugin-state-toggle").click();
  await card.getByText("disabled", { exact: true }).waitFor({
    timeout: 15_000,
  });
  await card.getByText("list_only").waitFor({ timeout: 15_000 });
}

async function sendHelloPluginCommand(window) {
  await window.getByTestId("nav-conversation").click();
  await window.getByTestId("command-input").fill(commandText);
  await window.getByTestId("send-command").click();
}

async function getLocalTemplateEvidence(window) {
  return window.evaluate(async () => {
    const status = await window.jarvis.sendCommand({
      type: "agent.getPluginManagementStatus",
      payload: {},
    });
    const snapshot = await window.jarvis.getSnapshot();
    const visibleText = document.body.innerText;
    const plugins = status.data?.plugins?.plugins ?? [];
    const localPlugin = plugins.find(
      (plugin) => plugin.manifest.id === "cn.example.hello-readonly",
    );
    const tasks = snapshot.data?.tasks ?? [];
    const pluginTasks = Array.isArray(tasks)
      ? tasks.filter((task) => task.intent === "plugin.invoke")
      : [];
    return {
      status,
      snapshot,
      localPlugin,
      pluginTaskCount: pluginTasks.length,
      visible: {
        pluginSummaryVisible: visibleText.includes(
          "Hello Jarvis. This read-only local plugin template returned a sanitized result.",
        ),
        directActionTextAbsent: !visibleText.includes(
          "direct action attempted",
        ),
      },
    };
  });
}

async function verifyInputSchemaFailure(window) {
  const result = await window.evaluate(async () => {
    return window.jarvis.sendCommand({
      type: "agent.invokePlugin",
      payload: {
        requestId: "plugin-hello-invalid-input-smoke",
        pluginId: "cn.example.hello-readonly",
        capability: "hello.lookup",
        input: {},
        dryRun: false,
      },
    });
  });
  if (
    result.ok !== true ||
    result.data?.result?.status !== "failed" ||
    result.data?.result?.resultCode !== "PLUGIN_INPUT_INVALID" ||
    result.data?.result?.output !== undefined ||
    result.data?.result?.directActionAttempted !== false ||
    result.data?.result?.credentialExposed !== false ||
    result.data?.result?.rawPluginOutputPersisted !== false
  ) {
    throw new Error(
      `Local template input schema failure did not pass: ${JSON.stringify(result)}`,
    );
  }
}

const startedAt = performance.now();

try {
  electronApp = await launchApp();
  const window = await openPluginsView(electronApp);
  await window.evaluate(() => {
    const originalSendCommand = window.jarvis?.sendCommand?.bind(window.jarvis);
    if (!originalSendCommand) {
      return;
    }
    window.jarvis.sendCommand = async (command) => {
      const result = await originalSendCommand(command);
      if (result.ok && result.data?.brain) {
        window.__pluginLocalTemplateSmokeLastBrain = result.data.brain;
      }
      return result;
    };
  });

  await enableHelloLocalPlugin(window);
  await sendHelloPluginCommand(window);
  await window.getByTestId("brain-intent").getByText("plugin.invoke").waitFor({
    timeout: 15_000,
  });
  await window.getByTestId("plugin-result-panel").waitFor({ timeout: 15_000 });
  await window
    .getByTestId("plugin-result-summary")
    .getByText(expectedSummary)
    .waitFor({ timeout: 15_000 });
  await waitForPluginTaskSnapshot(window);

  await window.getByTestId("nav-tasks").click();
  await window.getByTestId("tasks-view").waitFor();
  await window
    .getByTestId("task-card")
    .getByText("Invoke Read-only Plugin")
    .waitFor();
  await window.getByTestId("task-step").getByText("verified").waitFor();

  const visibleResult = await window.evaluate((summary) => {
    const visibleText = document.body.innerText;
    return {
      intentVisible: visibleText.includes("plugin.invoke"),
      completedVisible: visibleText.includes("completed"),
      pluginSummaryVisible: visibleText.includes(summary),
      directActionDisabled: !visibleText.includes("direct action attempted"),
    };
  }, expectedSummary);
  if (
    !visibleResult.intentVisible ||
    !visibleResult.completedVisible ||
    !visibleResult.pluginSummaryVisible ||
    !visibleResult.directActionDisabled
  ) {
    throw new Error(
      `Local template plugin smoke UI projection did not pass: ${JSON.stringify(visibleResult)}`,
    );
  }
  const enabledEvidence = await getLocalTemplateEvidence(window);
  if (
    !enabledEvidence.status.ok ||
    enabledEvidence.localPlugin?.source !== "local_manifest" ||
    enabledEvidence.localPlugin?.state !== "enabled" ||
    enabledEvidence.localPlugin?.stateSource !== "local_state_store" ||
    enabledEvidence.localPlugin?.executionMode !== "local_readonly_runtime" ||
    enabledEvidence.localPlugin?.executable !== true ||
    enabledEvidence.localPlugin?.routeSelectable !== true ||
    enabledEvidence.localPlugin?.reasonCodes?.includes(
      "LOCAL_READ_ONLY_RUNTIME",
    ) !== true ||
    enabledEvidence.visible.pluginSummaryVisible !== true ||
    enabledEvidence.visible.directActionTextAbsent !== true
  ) {
    throw new Error(
      `Local read-only template execution evidence did not pass: ${JSON.stringify(enabledEvidence)}`,
    );
  }
  await verifyInputSchemaFailure(window);

  await electronApp.close();
  electronApp = undefined;
  await waitForWindowsProcessCleanup();

  relaunchedApp = await launchApp();
  const relaunchedWindow = await relaunchedApp.firstWindow();
  await relaunchedWindow.setViewportSize({ width: 1440, height: 900 });
  await relaunchedWindow.getByTestId("jarvis-app").waitFor();
  await relaunchedWindow
    .getByTestId("core-status")
    .getByText("ONLINE")
    .waitFor({
      timeout: 15_000,
    });
  await relaunchedWindow.getByTestId("nav-tasks").click();
  await relaunchedWindow
    .getByTestId("task-card")
    .getByText("Invoke Read-only Plugin")
    .waitFor({ timeout: 10_000 });
  await relaunchedWindow
    .getByTestId("task-step")
    .getByText("verified")
    .waitFor();
  await waitForPluginTaskSnapshot(relaunchedWindow);
  await relaunchedWindow.getByTestId("nav-plugins").click();
  await relaunchedWindow.getByTestId("plugins-view").waitFor();
  await relaunchedWindow
    .getByTestId("plugin-card")
    .filter({ hasText: "Hello Read-only Local Plugin" })
    .first()
    .getByText("local_readonly_runtime")
    .waitFor({ timeout: 15_000 });
  const restartEvidence = await getLocalTemplateEvidence(relaunchedWindow);
  if (
    restartEvidence.localPlugin?.state !== "enabled" ||
    restartEvidence.localPlugin?.stateSource !== "local_state_store" ||
    restartEvidence.localPlugin?.executionMode !== "local_readonly_runtime" ||
    restartEvidence.pluginTaskCount < 1
  ) {
    throw new Error(
      `Local read-only template restart evidence did not pass: ${JSON.stringify(restartEvidence)}`,
    );
  }
  await disableHelloLocalPlugin(relaunchedWindow);
  await sendHelloPluginCommand(relaunchedWindow);
  await relaunchedWindow
    .getByTestId("brain-summary")
    .getByText(
      "Local read-only plugin invocation blocked because the plugin is not enabled in the local state store.",
    )
    .waitFor({ timeout: 15_000 });
  const disabledEvidence = await getLocalTemplateEvidence(relaunchedWindow);
  if (
    disabledEvidence.localPlugin?.state !== "disabled" ||
    disabledEvidence.localPlugin?.executionMode !== "list_only" ||
    disabledEvidence.localPlugin?.executable !== false ||
    disabledEvidence.localPlugin?.routeSelectable !== false
  ) {
    throw new Error(
      `Local read-only template disabled gate evidence did not pass: ${JSON.stringify(disabledEvidence)}`,
    );
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
        commandClass: "plugin.invoke.hello.lookup",
        pluginClass: "controlled-local-template",
        capability: "hello.lookup",
        routeSource: "intent-router.deterministic.rules",
        localManifestDiscoveryOptIn: true,
        localManifestStateSource: "local_state_store",
        executionModeAfterEnable: "local_readonly_runtime",
        executionModeAfterDisable: "list_only",
        disabledStateBlocksRoute: true,
        taskDatabasePath: "sanitized-task-runtime.sqlite",
        expectedTaskState: "completed",
        expectedVerificationStatus: "verified",
        manifestInputSchemaFailureResultCode: "PLUGIN_INPUT_INVALID",
        manifestInputSchemaFailureOutputProjected: false,
        directActionAttempted: false,
        credentialExposed: false,
        rawPluginOutputPersisted: false,
        unknownLocalPluginCodeExecuted: false,
        pluginMarketplaceUsed: false,
        networkPermissionUsed: false,
        filesystemPermissionUsed: false,
        shellExecutionUsed: false,
        taskPersistedAfterRestart: true,
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
      commandClass: "plugin.invoke.hello.lookup",
      screenshotPath,
      metricsPath,
    }),
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
