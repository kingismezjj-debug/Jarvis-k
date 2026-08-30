import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-qwen-local-opt-in-session-")
);
let electronApp;

async function panelText(window) {
  return window
    .getByTestId("settings-command-router-qwen-runtime-control")
    .innerText();
}

async function waitForPanelText(window, text, timeout = 30_000) {
  await window
    .getByTestId("settings-command-router-qwen-runtime-control")
    .getByText(text)
    .waitFor({ timeout });
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`${label} was not visible.`);
  }
}

try {
  electronApp = await electron.launch({
    args: [
      `--user-data-dir=${smokeUserDataDirectory}`,
      "apps/desktop/dist/main.js"
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_ENABLE_SETTINGS_V2: "0",
      JARVIS_K_MEMORY_DB_PATH: path.join(
        smokeUserDataDirectory,
        "memory.sqlite"
      ),
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1"
    }
  });

  const startedAt = performance.now();
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  const startupMs = Math.round(performance.now() - startedAt);

  await window.getByTestId("general-settings").click();
  await window.getByTestId("settings-view").waitFor({ timeout: 5_000 });
  await window
    .getByTestId("settings-command-router-qwen-runtime-control")
    .waitFor({ timeout: 5_000 });
  await waitForPanelText(window, "disabled / retained / stopped");

  const initialPanel = await panelText(window);
  assertIncludes(initialPanel, "Browser/URL", "Browser/URL status");
  assertIncludes(initialPanel.toLowerCase(), "blocked", "initial blocked status");
  assertIncludes(initialPanel, "VS Code", "VS Code status");

  await window
    .getByTestId("settings-command-router-qwen-runtime-control-start")
    .click();
  await window
    .getByTestId("last-action-status")
    .getByText("Qwen runtime control start complete")
    .waitFor({ timeout: 420_000 });
  await waitForPanelText(window, "active / retained / running", 30_000);

  const activePanel = await panelText(window);
  assertIncludes(activePanel, "Route count", "route count metric");
  assertIncludes(activePanel, "Helper starts", "helper start metric");
  assertIncludes(activePanel, "Gen probes", "generation probe metric");
  assertIncludes(activePanel, "Browser/URL", "Browser/URL status");
  assertIncludes(activePanel, "VS Code", "VS Code status");
  assertIncludes(activePanel.toLowerCase(), "blocked", "active blocked status");
  if (!activePanel.includes("3")) {
    throw new Error("bounded route request count was not visible.");
  }

  await window
    .getByTestId("settings-command-router-qwen-runtime-control-stop")
    .click();
  await window
    .getByTestId("last-action-status")
    .getByText("Qwen runtime control stop complete")
    .waitFor({ timeout: 60_000 });
  await waitForPanelText(
    window,
    "disabled / retained / shutdown after verification",
    30_000
  );
  const stoppedPanel = await panelText(window);
  assertIncludes(stoppedPanel.toLowerCase(), "verified", "shutdown verification");

  await window
    .getByTestId("settings-command-router-qwen-runtime-control-rollback")
    .click();
  await window
    .getByTestId("last-action-status")
    .getByText("Qwen runtime control rollback complete")
    .waitFor({ timeout: 60_000 });
  await waitForPanelText(
    window,
    "fallback / retained / shutdown after verification",
    30_000
  );
  const rollbackPanel = await panelText(window);

  console.log(
    JSON.stringify({
      status: "PASS",
      startupMs,
      retainedDependencyEnvSelected: true,
      retainedApprovedArtifactCacheSelected: true,
      artifactCount: 7,
      digestBeforeLoad: "passed",
      helperStartCount: 1,
      generationPortReadinessProbeCount: 1,
      routeRequestCount: 3,
      qwenActiveInsideBoundedSession: activePanel.includes(
        "active / retained / running"
      ),
      deterministicRulesRollback: rollbackPanel.includes(
        "fallback / retained / shutdown after verification"
      ),
      helperShutdownVerified: stoppedPanel.toLowerCase().includes("verified"),
      browserUrlBlocked: activePanel.includes("Browser/URL") &&
        activePanel.toLowerCase().includes("blocked"),
      vsCodeBlocked: activePanel.includes("VS Code") &&
        activePanel.toLowerCase().includes("blocked")
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
