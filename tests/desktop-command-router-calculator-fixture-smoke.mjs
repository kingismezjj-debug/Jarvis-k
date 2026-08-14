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
  "jarvis-k-command-router-calculator-fixture-smoke.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-command-router-calculator-fixture-smoke-metrics.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-command-router-calculator-fixture-")
);
let electronApp;

async function listProcessIds(processName) {
  const command = [
    "-NoProfile",
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

async function expectTestIdText(window, testId, expectedText) {
  await window.getByTestId(testId).getByText(expectedText).waitFor({
    timeout: 10_000
  });
  return window.getByTestId(testId).innerText();
}

try {
  const calculatorBefore = await listProcessIds("CalculatorApp");

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
    .getByTestId("settings-command-router-product-mode-toggle")
    .click();
  await window.getByTestId("settings-view").getByText("control on").waitFor({
    timeout: 5_000
  });

  await window.getByTestId("nav-conversation").click();
  await window.getByTestId("command-input").fill("open calculator");
  await window.getByTestId("send-command").click();

  await window.getByTestId("brain-dispatch-panel").waitFor({
    timeout: 10_000
  });
  const brainIntent = await expectTestIdText(
    window,
    "brain-intent",
    "localApp.open"
  );
  const selectedProvider = await expectTestIdText(
    window,
    "command-router-selected-provider",
    "intent-router.deterministic.fixture"
  );
  const directAction = await expectTestIdText(
    window,
    "command-router-direct-action",
    "disabled"
  );
  const toolLoopSelectedTool = await expectTestIdText(
    window,
    "tool-loop-selected-tool",
    "localApp.open"
  );
  const toolLoopSafety = await expectTestIdText(
    window,
    "tool-loop-safety",
    "ALLOWED"
  );
  const toolLoopResult = await expectTestIdText(
    window,
    "tool-loop-result",
    "FIXTURE_DRY_RUN"
  );
  await window
    .getByTestId("confirm-command-router-local-app-launch")
    .getByText("Confirm launch calculator")
    .waitFor({ timeout: 5_000 });
  const confirmLaunchVisible = await window
    .getByTestId("confirm-command-router-local-app-launch")
    .innerText();

  const calculatorAfter = await listProcessIds("CalculatorApp");
  const newCalculatorProcessIds = calculatorAfter.filter(
    (processId) => !calculatorBefore.includes(processId)
  );
  if (newCalculatorProcessIds.length > 0) {
    throw new Error(
      `Command Router fixture smoke launched calculator process(es): ${newCalculatorProcessIds.join(", ")}.`
    );
  }

  await mkdir(artifactsDirectory, { recursive: true });
  await window.screenshot({ path: screenshotPath, fullPage: true });
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        command: "open calculator",
        calculatorBefore,
        calculatorAfter,
        newCalculatorProcessIds,
        brainIntent,
        selectedProvider,
        directAction,
        toolLoopSelectedTool,
        toolLoopSafety,
        toolLoopResult,
        confirmLaunchVisible
      },
      null,
      2
    )}\n`
  );

  console.log(
    JSON.stringify({
      status: "PASS",
      startupMs,
      screenshotPath,
      metricsPath,
      newCalculatorProcessIds
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
