import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");

async function runScenario({ evaluationEnabled }) {
  const userDataDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-ui-surface-mode-")
  );
  let electronApp;
  try {
    electronApp = await electron.launch({
      args: [
        `--user-data-dir=${userDataDirectory}`,
        "apps/desktop/dist/main.js"
      ],
      cwd: rootDirectory,
      env: {
        ...process.env,
        JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
        JARVIS_K_MEMORY_DB_PATH: path.join(userDataDirectory, "memory.sqlite"),
        JARVIS_K_MODEL_DIR: path.join(userDataDirectory, "models"),
        ...(evaluationEnabled ? { JARVIS_K_ENABLE_EVALUATION_UI: "1" } : {})
      }
    });

    const window = await electronApp.firstWindow();
    await window.setViewportSize({ width: 1440, height: 900 });
    await window.getByTestId("jarvis-app").waitFor();
    await window.getByTestId("core-status").getByText("ONLINE").waitFor({
      timeout: 15_000
    });

    if ((await window.getByTestId("nav-developer").count()) !== 0) {
      throw new Error("Developer navigation should be hidden by default.");
    }
    if ((await window.getByTestId("voice-regression-panel").count()) !== 0) {
      throw new Error("Evaluation panel should not mount in product mode.");
    }

    await window.getByTestId("general-settings").click();
    await window.getByTestId("settings-view").waitFor({ timeout: 5_000 });
    window.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await window.getByTestId("settings-developer-mode-toggle").click();
    await window.getByTestId("nav-developer").waitFor({ timeout: 5_000 });
    await window.getByTestId("nav-developer").click();
    await window.getByTestId("developer-view").waitFor({ timeout: 5_000 });

    const evaluationPanelCount = await window
      .getByTestId("voice-regression-panel")
      .count();
    const evaluationHiddenCount = await window
      .getByTestId("evaluation-surface-hidden")
      .count();

    if (evaluationEnabled) {
      if (evaluationPanelCount !== 1 || evaluationHiddenCount !== 0) {
        throw new Error("Evaluation capability did not mount evaluation panel.");
      }
    } else if (evaluationPanelCount !== 0 || evaluationHiddenCount !== 1) {
      throw new Error("Developer mode without capability exposed evaluation.");
    }

    return {
      evaluationEnabled,
      evaluationPanelCount,
      evaluationHiddenCount
    };
  } finally {
    if (electronApp) {
      await electronApp.close();
    }
    await rm(userDataDirectory, { force: true, recursive: true });
  }
}

const developerOnly = await runScenario({ evaluationEnabled: false });
const evaluation = await runScenario({ evaluationEnabled: true });

console.log(
  JSON.stringify({
    status: "PASS",
    developerOnly,
    evaluation
  })
);
