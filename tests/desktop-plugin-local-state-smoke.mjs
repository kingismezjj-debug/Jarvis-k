import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-plugin-local-state-smoke.png",
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-plugin-local-state-smoke-metrics.json",
);
const smokeRootDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-plugin-local-state-"),
);
const localPluginDirectory = path.join(
  smokeRootDirectory,
  "safe-local-readonly-plugin",
);
const taskDatabasePath = path.join(smokeRootDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeRootDirectory, "memory.sqlite");
const localPluginStatePath = path.join(
  smokeRootDirectory,
  "local-plugin-state.json",
);

async function waitForWindowsProcessCleanup() {
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function removeSmokeDirectory() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await rm(smokeRootDirectory, { force: true, recursive: true });
      return;
    } catch (error) {
      if (attempt === 7) {
        throw error;
      }
      await waitForWindowsProcessCleanup();
    }
  }
}

async function writeSafeLocalManifestPlugin() {
  await mkdir(path.join(localPluginDirectory, "schemas"), { recursive: true });
  await writeFile(
    path.join(localPluginDirectory, "manifest.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        id: "cn.example.safe-local-state-smoke",
        name: "Safe Local State Smoke Plugin",
        version: "0.1.0",
        apiVersion: "1",
        entry: "dist/main.js",
        runtime: "node-worker",
        capabilities: [
          {
            name: "safe.lookup",
            description:
              "Read-only local manifest state persistence smoke capability.",
            inputSchema: "schemas/input.json",
            outputSchema: "schemas/output.json",
            risk: "read_only",
            readOnly: true,
          },
        ],
        permissions: [],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(localPluginDirectory, "schemas", "input.json"),
    `${JSON.stringify({ type: "object", additionalProperties: false }, null, 2)}\n`,
  );
  await writeFile(
    path.join(localPluginDirectory, "schemas", "output.json"),
    `${JSON.stringify({ type: "object", additionalProperties: false }, null, 2)}\n`,
  );
}

async function launchApp() {
  return electron.launch({
    args: [
      `--user-data-dir=${smokeRootDirectory}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS: "1",
      JARVIS_K_LOCAL_PLUGIN_DIRS: localPluginDirectory,
      JARVIS_K_LOCAL_PLUGIN_STATE_PATH: localPluginStatePath,
      JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
      JARVIS_K_MODEL_DIR: path.join(smokeRootDirectory, "models"),
      JARVIS_K_TASK_DB_PATH: taskDatabasePath,
    },
  });
}

async function openPluginsView(app) {
  const window = await app.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });
  await window.evaluate(() => {
    window.__pluginLocalStateSmokeCommands = [];
    const originalSendCommand = window.jarvis?.sendCommand?.bind(window.jarvis);
    if (!originalSendCommand) {
      return;
    }
    window.jarvis.sendCommand = async (command) => {
      window.__pluginLocalStateSmokeCommands.push(command.type);
      return originalSendCommand(command);
    };
  });
  await window.getByTestId("nav-plugins").click();
  await window.getByTestId("plugins-view").waitFor();
  await window.getByTestId("refresh-plugins").click();
  await window
    .getByTestId("plugin-card")
    .getByText("Safe Local State Smoke Plugin")
    .waitFor({ timeout: 15_000 });
  return window;
}

async function getPluginEvidence(window) {
  return window.evaluate(async (smokeRoot) => {
    const status = await window.jarvis.sendCommand({
      type: "agent.getPluginManagementStatus",
      payload: {},
    });
    const localManifestDeveloperStatus = await window.jarvis.sendCommand({
      type: "agent.getLocalPluginManifestDeveloperStatus",
      payload: {},
    });
    const commands = window.__pluginLocalStateSmokeCommands ?? [];
    const visibleText = document.body.innerText;
    return {
      status,
      localManifestDeveloperStatus,
      commands,
      visible: {
        pluginVisible: visibleText.includes("Safe Local State Smoke Plugin"),
        enabledVisible: visibleText.includes("enabled"),
        listOnlyVisible:
          visibleText.includes("list_only") ||
          visibleText.includes("LIST_ONLY"),
        stateOnlyVisible: visibleText.includes("state_only"),
        noPermissionsVisible: visibleText.includes("NO_DECLARED_PERMISSIONS"),
        rawSmokePathHidden: !visibleText.includes(smokeRoot),
      },
    };
  }, smokeRootDirectory);
}

function assertSafeLocalPluginEvidence(evidence, expectedState) {
  if (!evidence.status.ok || !evidence.localManifestDeveloperStatus.ok) {
    throw new Error("Local plugin state smoke command failed.");
  }
  const plugins = evidence.status.data?.plugins?.plugins ?? [];
  const localPlugin = plugins.find(
    (plugin) => plugin.manifest.id === "cn.example.safe-local-state-smoke",
  );
  if (
    !localPlugin ||
    localPlugin.state !== expectedState ||
    localPlugin.stateSource !== "local_state_store" ||
    localPlugin.statePersisted !== true ||
    localPlugin.stateToggleAvailable !== true ||
    localPlugin.executionMode !== "list_only" ||
    localPlugin.executable !== false ||
    localPlugin.routeSelectable !== false ||
    localPlugin.riskAssessment.declaredRiskTier !== "low" ||
    localPlugin.riskAssessment.permissionStatuses.length !== 0 ||
    evidence.status.data.plugins.thirdPartyCodeExecuted !== false ||
    evidence.status.data.plugins.marketplaceAccessed !== false ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.installOrEnableActionExposed !==
      false ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.stateToggleActionExposed !== true ||
    evidence.commands.includes("agent.invokePlugin") ||
    Object.values(evidence.visible).some((value) => value !== true)
  ) {
    throw new Error(
      `Local plugin state smoke did not pass: ${JSON.stringify(evidence)}`,
    );
  }
}

const startedAt = performance.now();
let app;

try {
  await writeSafeLocalManifestPlugin();
  app = await launchApp();
  let window = await openPluginsView(app);
  const card = window
    .getByTestId("plugin-card")
    .filter({ hasText: "Safe Local State Smoke Plugin" })
    .first();
  await card.getByTestId("local-plugin-state-toggle").click();
  await card.getByText("enabled", { exact: true }).waitFor({
    timeout: 15_000,
  });
  await card.getByText("local_state_store").waitFor({ timeout: 15_000 });
  const firstEvidence = await getPluginEvidence(window);
  assertSafeLocalPluginEvidence(firstEvidence, "enabled");
  await app.close();
  app = undefined;
  await waitForWindowsProcessCleanup();

  app = await launchApp();
  window = await openPluginsView(app);
  await window
    .getByTestId("plugin-card")
    .filter({ hasText: "Safe Local State Smoke Plugin" })
    .first()
    .getByText("local_state_store")
    .waitFor({ timeout: 15_000 });
  const restartEvidence = await getPluginEvidence(window);
  assertSafeLocalPluginEvidence(restartEvidence, "enabled");

  await mkdir(artifactsDirectory, { recursive: true });
  await window.screenshot({ path: screenshotPath, fullPage: true });
  const startupMs = Math.round(performance.now() - startedAt);
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        localManifestPluginCount: 1,
        persistedStateAfterRestart: "enabled",
        stateSource: "local_state_store",
        executionMode: "list_only",
        executable: false,
        routeSelectable: false,
        installOrEnableActionExposed: false,
        stateToggleActionExposed: true,
        thirdPartyCodeExecuted: false,
        marketplaceAccessed: false,
        invokeCommandObserved:
          restartEvidence.commands.includes("agent.invokePlugin") ||
          firstEvidence.commands.includes("agent.invokePlugin"),
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
      persistedStateAfterRestart: "enabled",
      screenshotPath,
      metricsPath,
    }),
  );
} finally {
  if (app) {
    await app.close();
  }
  await removeSmokeDirectory();
}
