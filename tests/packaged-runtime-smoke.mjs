import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const executablePath = path.join(
  rootDirectory,
  "artifacts",
  "packaged",
  "win-unpacked",
  "Jarvis-K Alpha.exe",
);
const packagedAppDirectory = path.join(
  rootDirectory,
  "artifacts",
  "packaged",
  "win-unpacked",
  "resources",
  "app",
);

async function descendantProcessSnapshot(rootPid) {
  const script = [
    `$rootPid = ${rootPid}`,
    "$processes = Get-CimInstance Win32_Process",
    "$descendantIds = [System.Collections.Generic.HashSet[int]]::new()",
    "[void]$descendantIds.Add($rootPid)",
    "do {",
    "  $foundChild = $false",
    "  foreach ($candidate in $processes) {",
    "    if ($descendantIds.Contains([int]$candidate.ParentProcessId) -and -not $descendantIds.Contains([int]$candidate.ProcessId)) {",
    "      [void]$descendantIds.Add([int]$candidate.ProcessId)",
    "      $foundChild = $true",
    "    }",
    "  }",
    "} while ($foundChild)",
    "$descendants = $processes | Where-Object { $descendantIds.Contains([int]$_.ProcessId) -and [int]$_.ProcessId -ne $rootPid }",
    "$descendants | Select-Object ProcessId, ParentProcessId, Name, CommandLine | ConvertTo-Json -Compress",
  ].join("\n");
  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { windowsHide: true },
    );
    const trimmed = stdout.trim();
    if (!trimmed) return [];
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function coreHostProcesses(processes) {
  return processes.filter((processInfo) =>
    String(processInfo.CommandLine ?? "").includes(
      "apps\\core-host\\dist\\index.js",
    ) ||
    String(processInfo.CommandLine ?? "").includes(
      "apps/core-host/dist/index.js",
    ),
  );
}

function fail(message) {
  console.error(JSON.stringify({ status: "FAIL", message }, null, 2));
  process.exit(1);
}

if (!existsSync(executablePath)) {
  fail(`Packaged executable is missing: ${executablePath}`);
}
if (!existsSync(packagedAppDirectory)) {
  fail(`Packaged app directory is missing: ${packagedAppDirectory}`);
}

const userDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-packaged-runtime-"),
);
let electronApp;
try {
  electronApp = await electron.launch({
    args: [packagedAppDirectory, `--user-data-dir=${userDataDirectory}`],
    env: {
      ...process.env,
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_USER_DATA_PATH: userDataDirectory,
      JARVIS_K_LOCAL_DATA_PATH: userDataDirectory,
      JARVIS_K_MEMORY_DB_PATH: path.join(userDataDirectory, "memory.sqlite"),
      JARVIS_K_MODEL_DIR: path.join(userDataDirectory, "models"),
    },
  });
  const window = await electronApp.firstWindow();
  await window.setViewportSize({ width: 1280, height: 820 });
  await window.getByTestId("jarvis-app").waitFor({ timeout: 20_000 });
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });

  const initialSettings = await window.evaluate(async () => {
    if (!window.jarvis) throw new Error("Desktop bridge unavailable.");
    return window.jarvis.getDesktopSettings();
  });
  if (initialSettings.firstRunOnboardingState !== "pending") {
    throw new Error("First-run onboarding did not start pending.");
  }
  if (initialSettings.closeButtonBehavior !== "minimize_to_tray") {
    throw new Error("Packaged app default close behavior is not tray mode.");
  }

  await window.getByTestId("first-run-onboarding").waitFor({ timeout: 5_000 });
  for (let step = 0; step < 3; step += 1) {
    await window.getByTestId("first-run-next").click();
  }
  await window.getByTestId("first-run-finish").click();
  await window.getByTestId("first-run-onboarding").waitFor({
    state: "detached",
    timeout: 5_000,
  });
  const completedSettings = await window.evaluate(async () => {
    if (!window.jarvis) throw new Error("Desktop bridge unavailable.");
    return window.jarvis.getDesktopSettings();
  });
  if (completedSettings.firstRunOnboardingState !== "completed") {
    throw new Error("First-run completion was not persisted.");
  }

  const rootPid = electronApp.process().pid;
  const coreBeforeHide = coreHostProcesses(
    await descendantProcessSnapshot(rootPid),
  ).map((processInfo) => processInfo.ProcessId);
  if (coreBeforeHide.length !== 1) {
    throw new Error(`Expected one Core Host: ${JSON.stringify(coreBeforeHide)}`);
  }

  await electronApp.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.close();
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const hiddenState = await electronApp.evaluate(({ BrowserWindow }) => {
    const browserWindow = BrowserWindow.getAllWindows()[0];
    return {
      windowCount: BrowserWindow.getAllWindows().length,
      visible: browserWindow?.isVisible() ?? false,
      destroyed: browserWindow?.isDestroyed() ?? true,
    };
  });
  if (
    hiddenState.windowCount !== 1 ||
    hiddenState.visible ||
    hiddenState.destroyed
  ) {
    throw new Error(`Packaged close-to-tray failed: ${JSON.stringify(hiddenState)}`);
  }

  await electronApp.evaluate(({ BrowserWindow }) => {
    const browserWindow = BrowserWindow.getAllWindows()[0];
    browserWindow?.show();
    browserWindow?.focus();
  });
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 20_000,
  });
  const coreAfterRestore = coreHostProcesses(
    await descendantProcessSnapshot(rootPid),
  ).map((processInfo) => processInfo.ProcessId);
  if (coreAfterRestore.join(",") !== coreBeforeHide.join(",")) {
    throw new Error("Packaged restore restarted Core Host.");
  }

  await window.evaluate(async () => {
    if (!window.jarvis) throw new Error("Desktop bridge unavailable.");
    const result = await window.jarvis.setDesktopCloseButtonBehavior("quit");
    if (!result.ok) throw new Error(result.message ?? "settings rejected");
  });
  const closePromise = window.waitForEvent("close", { timeout: 10_000 });
  await electronApp.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.close();
  });
  await closePromise.catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 750));
  const childrenAfterQuit = await descendantProcessSnapshot(rootPid);
  const coreHostAfterQuit = coreHostProcesses(childrenAfterQuit);
  if (coreHostAfterQuit.length !== 0) {
    throw new Error(
      `Packaged quit left Core Host children: ${JSON.stringify(coreHostAfterQuit)}`,
    );
  }
  electronApp = null;

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        executablePath,
        packagedAppDirectory,
        userDataDirectory,
        onboarding: "completed",
        closeToTrayWindowCount: hiddenState.windowCount,
        coreStableAcrossRestore: true,
        coreHostAfterQuit: 0,
      },
      null,
      2,
    ),
  );
} finally {
  if (electronApp) {
    await electronApp.close().catch(() => undefined);
  }
  await rm(userDataDirectory, { force: true, recursive: true });
}
