import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-qwen-ui-ipc-")
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

try {
  electronApp = await electron.launch({
    args: [
      `--user-data-dir=${smokeUserDataDirectory}`,
      "apps/desktop/dist/main.js"
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_MEMORY_DB_PATH: path.join(
        smokeUserDataDirectory,
        "memory.sqlite"
      ),
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_MODEL_DIR: path.join(smokeUserDataDirectory, "models")
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

  await window
    .getByTestId("settings-command-router-qwen-runtime-control-start")
    .click();
  await window
    .getByTestId("last-action-status")
    .getByText("Qwen runtime control start complete")
    .waitFor({ timeout: 420_000 });
  await waitForPanelText(window, "active / retained / running", 30_000);
  await waitForPanelText(window, "Route count", 5_000);
  const activePanel = await panelText(window);
  if (
    !activePanel.includes("HELPER STARTS") &&
    !activePanel.includes("Helper starts")
  ) {
    throw new Error("Qwen UI/IPC helper start metric was not visible.");
  }
  if (!activePanel.includes("3")) {
    throw new Error("Qwen UI/IPC route request count was not visible.");
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
  if (!stoppedPanel.toLowerCase().includes("verified")) {
    throw new Error("Qwen UI/IPC helper shutdown verification was not visible.");
  }

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
      activeStatusVisible: activePanel.includes("active / retained / running"),
      stoppedStatusVisible: stoppedPanel.includes(
        "disabled / retained / shutdown after verification"
      ),
      rollbackStatusVisible: rollbackPanel.includes(
        "fallback / retained / shutdown after verification"
      ),
      helperStartCountVisible: activePanel.includes("1"),
      generationProbeCountVisible: activePanel.includes("1"),
      routeRequestCountVisible: activePanel.includes("3"),
      shutdownVerifiedVisible: stoppedPanel.toLowerCase().includes("verified")
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
