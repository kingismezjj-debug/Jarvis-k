import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-plugin-management-ui-smoke.png",
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-plugin-management-ui-smoke-metrics.json",
);
const smokeRootDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-plugin-management-ui-"),
);
const localPluginDirectory = path.join(
  smokeRootDirectory,
  "local-readonly-plugin",
);
const invalidLocalPluginDirectory = path.join(
  smokeRootDirectory,
  "invalid-local-plugin",
);
const taskDatabasePath = path.join(smokeRootDirectory, "task-runtime.sqlite");
const memoryDatabasePath = path.join(smokeRootDirectory, "memory.sqlite");
let electronApp;

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

async function writeLocalManifestOnlyPlugin() {
  await mkdir(path.join(localPluginDirectory, "schemas"), { recursive: true });
  await writeFile(
    path.join(localPluginDirectory, "manifest.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        id: "cn.example.local-readonly-smoke",
        name: "Local Read-only Smoke Plugin",
        version: "0.1.0",
        apiVersion: "1",
        entry: "dist/main.js",
        runtime: "node-worker",
        capabilities: [
          {
            name: "local.lookup",
            description: "Read-only local manifest discovery smoke capability.",
            inputSchema: "schemas/input.json",
            outputSchema: "schemas/output.json",
            risk: "read_only",
            readOnly: true,
          },
        ],
        permissions: ["network:https:api.example.com"],
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

async function writeInvalidLocalManifestPlugin() {
  await mkdir(invalidLocalPluginDirectory, { recursive: true });
  await writeFile(
    path.join(invalidLocalPluginDirectory, "manifest.json"),
    "{ invalid-json",
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
      JARVIS_K_LOCAL_PLUGIN_DIRS: [
        localPluginDirectory,
        invalidLocalPluginDirectory,
      ].join(path.delimiter),
      JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
      JARVIS_K_MODEL_DIR: path.join(smokeRootDirectory, "models"),
      JARVIS_K_TASK_DB_PATH: taskDatabasePath,
    },
  });
}

const startedAt = performance.now();

try {
  await writeLocalManifestOnlyPlugin();
  await writeInvalidLocalManifestPlugin();
  electronApp = await launchApp();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });
  await window.evaluate(() => {
    window.__pluginManagementSmokeCommands = [];
    const originalSendCommand = window.jarvis?.sendCommand?.bind(window.jarvis);
    if (!originalSendCommand) {
      return;
    }
    window.jarvis.sendCommand = async (command) => {
      window.__pluginManagementSmokeCommands.push(command.type);
      return originalSendCommand(command);
    };
  });

  await window.getByTestId("nav-plugins").click();
  await window.getByTestId("plugins-view").waitFor();
  await window.getByTestId("refresh-plugins").click();
  await window
    .getByTestId("plugin-card")
    .getByText("Stock Analysis Sample")
    .waitFor({ timeout: 15_000 });
  await window
    .getByTestId("plugin-card")
    .getByText("E-commerce Product Comparison Sample")
    .waitFor({ timeout: 15_000 });
  await window
    .getByTestId("plugin-card")
    .getByText("Local Read-only Smoke Plugin")
    .waitFor({ timeout: 15_000 });
  await window
    .getByTestId("plugin-risk-reason")
    .getByText("THIRD_PARTY_EXECUTION_DISABLED")
    .waitFor({ timeout: 15_000 });
  await window
    .getByTestId("plugin-card")
    .getByText("network_https")
    .waitFor({ timeout: 15_000 });
  await window
    .getByTestId("plugin-card")
    .getByText("disabled_by_policy")
    .waitFor({ timeout: 15_000 });
  await window
    .getByTestId("plugin-management-safety")
    .getByText("Unknown code execution")
    .waitFor();
  await window
    .getByTestId("plugin-management-safety")
    .getByText("Marketplace access")
    .waitFor();
  await window
    .getByTestId("plugin-mcp-adapter-status")
    .getByText("MCP Adapter Alpha")
    .waitFor();
  await window
    .getByTestId("plugin-mcp-adapter-status")
    .getByText("STATUS ONLY")
    .waitFor();
  await window
    .getByTestId("plugin-mcp-adapter-status")
    .getByText("TOOL FORWARDING")
    .waitFor();
  await window
    .getByTestId("plugin-mcp-adapter-reason")
    .getByText("MCP_EXTERNAL_EXECUTION_DISABLED")
    .waitFor();
  await window
    .getByTestId("local-plugin-manifest-developer-status")
    .getByText("Local Manifest DX")
    .waitFor();
  await window
    .getByTestId("local-plugin-manifest-directory-status")
    .filter({ hasText: "local-plugin-dir-01" })
    .first()
    .waitFor();
  await window
    .getByTestId("local-plugin-manifest-directory-status")
    .filter({ hasText: "local-plugin-dir-02" })
    .first()
    .waitFor();
  await window
    .getByTestId("local-plugin-manifest-issue")
    .getByText("MANIFEST_JSON_INVALID")
    .waitFor();

  const evidence = await window.evaluate(async (smokeRoot) => {
    const status = await window.jarvis.sendCommand({
      type: "agent.getPluginManagementStatus",
      payload: {},
    });
    const localManifestDeveloperStatus = await window.jarvis.sendCommand({
      type: "agent.getLocalPluginManifestDeveloperStatus",
      payload: {},
    });
    const commands = window.__pluginManagementSmokeCommands ?? [];
    const visibleText = document.body.innerText;
    return {
      status,
      localManifestDeveloperStatus,
      commands,
      visible: {
        bundledVisible: visibleText.includes("bundled"),
        disabledVisible: visibleText.includes("disabled"),
        enabledVisible: visibleText.includes("enabled"),
        listOnlyVisible:
          visibleText.includes("list_only") ||
          visibleText.includes("LIST_ONLY"),
        localManifestVisible: visibleText.includes("local_manifest"),
        mediumRiskVisible: visibleText.includes("medium"),
        blockedPolicyVisible:
          visibleText.includes("blocked") || visibleText.includes("BLOCKED"),
        permissionGateVisible: visibleText.includes("network_https"),
        localManifestDxVisible: visibleText.includes("Local Manifest DX"),
        localManifestFirstRefVisible: visibleText.includes(
          "local-plugin-dir-01",
        ),
        localManifestSecondRefVisible: visibleText.includes(
          "local-plugin-dir-02",
        ),
        manifestJsonInvalidVisible: visibleText.includes(
          "MANIFEST_JSON_INVALID",
        ),
        mcpAdapterVisible: visibleText.includes("MCP Adapter Alpha"),
        mcpStatusOnlyVisible: visibleText.includes("STATUS ONLY"),
        mcpServerStartupVisible: visibleText.includes("SERVER STARTUP"),
        mcpToolExecutionVisible: visibleText.includes("TOOL EXECUTION"),
        mcpToolForwardingVisible: visibleText.includes("TOOL FORWARDING"),
        mcpPermissionLayerVisible: visibleText.includes("PERMISSION LAYER"),
        mcpReasonVisible: visibleText.includes(
          "MCP_EXTERNAL_EXECUTION_DISABLED",
        ),
        rawSmokePathHidden: !visibleText.includes(smokeRoot),
      },
    };
  }, smokeRootDirectory);

  if (!evidence.status.ok || !evidence.localManifestDeveloperStatus.ok) {
    throw new Error("Plugin management command failed closed unexpectedly.");
  }
  const plugins = evidence.status.data?.plugins?.plugins ?? [];
  const localPlugin = plugins.find(
    (plugin) => plugin.manifest.id === "cn.example.local-readonly-smoke",
  );
  const bundledPlugins = plugins.filter(
    (plugin) => plugin.source === "bundled",
  );
  if (
    bundledPlugins.length < 2 ||
    !localPlugin ||
    localPlugin.state !== "disabled" ||
    localPlugin.executionMode !== "list_only" ||
    localPlugin.executable !== false ||
    localPlugin.routeSelectable !== false ||
    localPlugin.riskAssessment.declaredRiskTier !== "medium" ||
    localPlugin.riskAssessment.confirmationPolicy !== "blocked" ||
    localPlugin.riskAssessment.permissionStatuses[0]?.category !==
      "network_https" ||
    localPlugin.riskAssessment.permissionStatuses[0]?.permissionState !==
      "disabled_by_policy" ||
    evidence.status.data.plugins.thirdPartyCodeExecuted !== false ||
    evidence.status.data.plugins.marketplaceAccessed !== false ||
    evidence.status.data.plugins.mcpAdapter.status !== "disabled" ||
    evidence.status.data.plugins.mcpAdapter.mode !==
      "compatibility_status_only" ||
    evidence.status.data.plugins.mcpAdapter.externalServerStartupAllowed !==
      false ||
    evidence.status.data.plugins.mcpAdapter.externalToolExecutionAllowed !==
      false ||
    evidence.status.data.plugins.mcpAdapter.toolCallForwardingAllowed !==
      false ||
    evidence.status.data.plugins.mcpAdapter.permissionLayerRequired !== true ||
    evidence.status.data.plugins.mcpAdapter.credentialExposed !== false ||
    evidence.status.data.plugins.mcpAdapter.rawToolOutputPersisted !== false ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.validManifestCount !== 1 ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.invalidManifestCount !== 1 ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.rawPathsExposed !== false ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.thirdPartyCodeExecuted !== false ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.marketplaceAccessed !== false ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.installOrEnableActionExposed !==
      false ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.directories[0]?.directoryRef !==
      "local-plugin-dir-01" ||
    evidence.localManifestDeveloperStatus.data
      .localPluginManifestDeveloperStatus.directories[1]?.issueCodes[0] !==
      "MANIFEST_JSON_INVALID" ||
    evidence.commands.includes("agent.invokePlugin") ||
    Object.values(evidence.visible).some((value) => value !== true)
  ) {
    throw new Error(
      `Plugin management UI smoke did not pass: ${JSON.stringify(evidence)}`,
    );
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
        bundledPluginCount: bundledPlugins.length,
        localManifestPluginCount: 1,
        localManifestState: "disabled",
        localManifestExecutionMode: "list_only",
        localManifestDeclaredRiskTier: "medium",
        localManifestConfirmationPolicy: "blocked",
        localManifestPermissionState: "disabled_by_policy",
        localManifestDeveloperDiscoveryStatus:
          evidence.localManifestDeveloperStatus.data
            .localPluginManifestDeveloperStatus.discoveryStatus,
        localManifestDeveloperValidCount:
          evidence.localManifestDeveloperStatus.data
            .localPluginManifestDeveloperStatus.validManifestCount,
        localManifestDeveloperInvalidCount:
          evidence.localManifestDeveloperStatus.data
            .localPluginManifestDeveloperStatus.invalidManifestCount,
        localManifestDeveloperIssueCode:
          evidence.localManifestDeveloperStatus.data
            .localPluginManifestDeveloperStatus.directories[1]?.issueCodes[0],
        mcpAdapterStatus: evidence.status.data.plugins.mcpAdapter.status,
        mcpAdapterMode: evidence.status.data.plugins.mcpAdapter.mode,
        mcpServerStartupAllowed:
          evidence.status.data.plugins.mcpAdapter.externalServerStartupAllowed,
        mcpToolExecutionAllowed:
          evidence.status.data.plugins.mcpAdapter.externalToolExecutionAllowed,
        mcpToolForwardingAllowed:
          evidence.status.data.plugins.mcpAdapter.toolCallForwardingAllowed,
        mcpPermissionLayerRequired:
          evidence.status.data.plugins.mcpAdapter.permissionLayerRequired,
        mcpCredentialExposed:
          evidence.status.data.plugins.mcpAdapter.credentialExposed,
        mcpRawToolOutputPersisted:
          evidence.status.data.plugins.mcpAdapter.rawToolOutputPersisted,
        rawPathsExposed:
          evidence.localManifestDeveloperStatus.data
            .localPluginManifestDeveloperStatus.rawPathsExposed,
        installOrEnableActionExposed:
          evidence.localManifestDeveloperStatus.data
            .localPluginManifestDeveloperStatus.installOrEnableActionExposed,
        thirdPartyCodeExecuted: false,
        marketplaceAccessed: false,
        invokeCommandObserved: evidence.commands.includes("agent.invokePlugin"),
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
      bundledPluginCount: bundledPlugins.length,
      localManifestState: "disabled",
      screenshotPath,
      metricsPath,
    }),
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await removeSmokeDirectory();
}
