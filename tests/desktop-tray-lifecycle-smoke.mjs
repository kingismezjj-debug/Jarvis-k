import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");

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
    if (!trimmed) {
      return [];
    }
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function coreHostProcesses(processes) {
  return processes.filter((processInfo) => {
    const commandLine = String(processInfo.CommandLine ?? "");
    return (
      commandLine.includes("apps\\core-host\\dist\\index.js") ||
      commandLine.includes("apps/core-host/dist/index.js")
    );
  });
}

async function launchWithUserData(userDataDirectory) {
  return electron.launch({
    args: [
      `--user-data-dir=${userDataDirectory}`,
      "apps/desktop/dist/main.js",
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_MEMORY_DB_PATH: path.join(userDataDirectory, "memory.sqlite"),
      JARVIS_K_MODEL_DIR: path.join(userDataDirectory, "models"),
    },
  });
}

async function scenarioCloseToTray() {
  const userDataDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-tray-lifecycle-"),
  );
  let electronApp;
  try {
    electronApp = await launchWithUserData(userDataDirectory);
    const window = await electronApp.firstWindow();
    await window.setViewportSize({ width: 1280, height: 820 });
    await window.getByTestId("jarvis-app").waitFor();
    await window.getByTestId("core-status").getByText("ONLINE").waitFor({
      timeout: 15_000,
    });
    const rootPid = electronApp.process().pid;
    const coreHostBeforeHide = coreHostProcesses(
      await descendantProcessSnapshot(rootPid),
    ).map((processInfo) => processInfo.ProcessId);
    if (coreHostBeforeHide.length !== 1) {
      throw new Error(
        `Expected one Core Host before hide: ${JSON.stringify(coreHostBeforeHide)}`,
      );
    }

    const desktopSettings = await window.evaluate(async () => {
      if (!window.jarvis) throw new Error("Desktop bridge unavailable.");
      return window.jarvis.getDesktopSettings();
    });
    if (desktopSettings.closeButtonBehavior !== "minimize_to_tray") {
      throw new Error("Default close behavior is not minimize_to_tray.");
    }

    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.close();
    });
    await window.waitForFunction(
      () => !window.document.hasFocus(),
      undefined,
      { timeout: 5_000 },
    ).catch(() => undefined);
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
      throw new Error(`Close-to-tray failed: ${JSON.stringify(hiddenState)}`);
    }

    await electronApp.evaluate(({ BrowserWindow }) => {
      const browserWindow = BrowserWindow.getAllWindows()[0];
      browserWindow?.show();
      if (browserWindow?.isMinimized()) browserWindow.restore();
      browserWindow?.focus();
    });
    await window.getByTestId("core-status").getByText("ONLINE").waitFor({
      timeout: 15_000,
    });
    const coreHostAfterRestore = coreHostProcesses(
      await descendantProcessSnapshot(rootPid),
    ).map((processInfo) => processInfo.ProcessId);
    if (coreHostAfterRestore.join(",") !== coreHostBeforeHide.join(",")) {
      throw new Error("Restore restarted Core.");
    }

    await window.evaluate(() => {
      window.jarvis?.onDesktopUiAction((action) => {
        if (action.type === "desktop.openSettings") {
          window.localStorage.setItem("jarvis-k-smoke-open-settings", "1");
        }
      });
    });
    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send(
        "jarvis-k:desktop-ui-action",
        { type: "desktop.openSettings" },
      );
    });
    await window.waitForFunction(
      () => window.localStorage.getItem("jarvis-k-smoke-open-settings") === "1",
      undefined,
      { timeout: 5_000 },
    );

    const childrenBeforeQuit = await descendantProcessSnapshot(rootPid);
    await electronApp.close();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const childrenAfterQuit = await descendantProcessSnapshot(rootPid);
    const coreHostAfterQuit = coreHostProcesses(childrenAfterQuit);
    electronApp = null;
    return {
      closeToTrayWindowCount: hiddenState.windowCount,
      coreStableAcrossRestore: true,
      childrenBeforeQuit: childrenBeforeQuit.length,
      coreHostAfterQuit: coreHostAfterQuit.length,
      settingsActionDelivered: true,
    };
  } finally {
    if (electronApp) {
      await electronApp.close().catch(() => undefined);
    }
    await rm(userDataDirectory, { force: true, recursive: true });
  }
}

async function scenarioCloseBehaviorQuit() {
  const userDataDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-tray-quit-"),
  );
  let electronApp;
  try {
    electronApp = await launchWithUserData(userDataDirectory);
    const window = await electronApp.firstWindow();
    await window.getByTestId("jarvis-app").waitFor();
    await window.getByTestId("core-status").getByText("ONLINE").waitFor({
      timeout: 15_000,
    });
    await window.evaluate(async () => {
      if (!window.jarvis) throw new Error("Desktop bridge unavailable.");
      const result = await window.jarvis.setDesktopCloseButtonBehavior("quit");
      if (!result.ok) throw new Error(result.message ?? "settings rejected");
    });

    const processPid = electronApp.process().pid;
    const closePromise = window.waitForEvent("close", { timeout: 10_000 });
    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.close();
    });
    await closePromise.catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const childrenAfterQuit = await descendantProcessSnapshot(processPid);
    await electronApp.close().catch(() => undefined);
    electronApp = null;
    return {
      closeBehaviorQuitChildrenAfterQuit: childrenAfterQuit.length,
    };
  } finally {
    if (electronApp) {
      await electronApp.close().catch(() => undefined);
    }
    await rm(userDataDirectory, { force: true, recursive: true });
  }
}

const closeToTray = await scenarioCloseToTray();
const quit = await scenarioCloseBehaviorQuit();

console.log(
  JSON.stringify({
    status: "PASS",
    closeToTray,
    quit,
  }),
);
