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
  "jarvis-k-command-router-local-app-blocked-smoke.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-command-router-local-app-blocked-smoke-metrics.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-command-router-local-app-blocked-")
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

async function enableCommandRouterProductMode(window) {
  await window.getByTestId("general-settings").click();
  await window.getByTestId("settings-view").waitFor({ timeout: 5_000 });
  await window.getByTestId("settings-command-router-product-mode-notice")
    .getByText("Approved local app launches remain")
    .waitFor({ timeout: 5_000 });
  await window.waitForFunction(() => {
    const toggle = document.querySelector(
      '[data-testid="settings-command-router-product-mode-toggle"]'
    );
    return toggle instanceof HTMLInputElement && !toggle.checked;
  });
  await window.getByTestId("settings-command-router-product-mode-toggle").click();
  await window.getByTestId("settings-view").getByText("control on").waitFor({
    timeout: 5_000
  });
}

try {
  const codeBefore = await listProcessIds("Code");

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

  await enableCommandRouterProductMode(window);
  await window.getByTestId("nav-conversation").click();
  await window.getByTestId("command-input").fill("open vscode");
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
    "intent-router.deterministic.rules"
  );
  const directAction = await expectTestIdText(
    window,
    "command-router-direct-action",
    "disabled"
  );
  await window.getByTestId("tool-loop-selected-tool").waitFor({
    timeout: 5_000
  });
  const toolLoopSelectedTool = await window
    .getByTestId("tool-loop-selected-tool")
    .innerText();
  const toolLoopSafety = await window
    .getByTestId("tool-loop-safety")
    .innerText();
  const toolLoopResult = await window
    .getByTestId("tool-loop-result")
    .innerText();
  const brainDispatch = await window
    .getByTestId("brain-dispatch-panel")
    .innerText();
  if (brainDispatch.includes("intent-router.deterministic.fixture")) {
    throw new Error("Production blocked smoke displayed the fixture provider.");
  }
  if (brainDispatch.includes("FIXTURE_DRY_RUN")) {
    throw new Error("Production blocked smoke executed fixture dry-run semantics.");
  }

  const codeAfter = await listProcessIds("Code");
  const newCodeProcessIds = codeAfter.filter(
    (processId) => !codeBefore.includes(processId)
  );
  if (newCodeProcessIds.length > 0) {
    throw new Error(
      `Command Router blocked smoke launched VS Code process(es): ${newCodeProcessIds.join(", ")}.`
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
        command: "open vscode",
        codeBefore,
        codeAfter,
        newCodeProcessIds,
        brainIntent,
        selectedProvider,
        directAction,
        toolLoopSelectedTool,
        toolLoopSafety,
        toolLoopResult,
        brainDispatch
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
      newCodeProcessIds
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
