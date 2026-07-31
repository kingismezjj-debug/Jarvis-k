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
  "jarvis-k-memory-degraded-smoke.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-memory-degraded-smoke-metrics.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-memory-degraded-smoke-")
);
const smokeMemoryDatabasePath = path.join(
  smokeUserDataDirectory,
  "memory.sqlite"
);
let electronApp;

async function findCoreProcess(electronProcessId) {
  const script = [
    `$rootPid = ${electronProcessId}`,
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
    "$core = $processes | Where-Object {",
    "  $descendantIds.Contains([int]$_.ProcessId) -and",
    "  $_.CommandLine -match 'apps[\\\\/]core-host[\\\\/]dist[\\\\/]index\\.js'",
    "} | Select-Object -First 1",
    "if (-not $core) { exit 3 }",
    "$process = Get-Process -Id $core.ProcessId",
    '[pscustomobject]@{ ProcessId = $core.ProcessId; WorkingSet64 = $process.WorkingSet64 } | ConvertTo-Json -Compress'
  ].join("\n");
  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { windowsHide: true }
  );
  return JSON.parse(stdout.trim());
}

const startedAt = performance.now();

try {
  await writeFile(smokeMemoryDatabasePath, "not a sqlite database");
  electronApp = await electron.launch({
    args: [
      `--user-data-dir=${smokeUserDataDirectory}`,
      "apps/desktop/dist/main.js"
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_MEMORY_DB_PATH: smokeMemoryDatabasePath
    }
  });

  const window = await electronApp.firstWindow();
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  const startupMs = Math.round(performance.now() - startedAt);
  const coreProcess = await findCoreProcess(electronApp.process().pid);

  const degradedSnapshot = await window.waitForFunction(async () => {
    if (!window.jarvis) {
      return null;
    }
    const result = await window.jarvis.getSnapshot();
    if (!result.ok) {
      return null;
    }
    const snapshot = result.data;
    return snapshot?.health === "degraded" &&
      snapshot.memoryHealth?.status === "degraded"
      ? snapshot
      : null;
  });
  const snapshot = await degradedSnapshot.jsonValue();

  const pingResult = await window.evaluate(async () => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable for degraded ping.");
    }
    return window.jarvis.sendCommand({
      type: "agent.ping",
      payload: { sentAt: new Date().toISOString() }
    });
  });
  if (!pingResult.ok || pingResult.data?.status !== "degraded") {
    throw new Error("Core ping did not report degraded health.");
  }

  const writeResult = await window.evaluate(async () => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable for degraded write.");
    }
    return window.jarvis.sendCommand({
      type: "agent.sendMessage",
      payload: { text: "This write should fail while memory is degraded." }
    });
  });
  if (writeResult.ok || writeResult.error?.code !== "MEMORY_WRITE_FAILED") {
    throw new Error("Degraded memory write did not fail structurally.");
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
  const coreProcessAfterWrite = await findCoreProcess(
    electronApp.process().pid
  );
  if (coreProcessAfterWrite.ProcessId !== coreProcess.ProcessId) {
    throw new Error("Degraded memory path restarted the Core process.");
  }

  await mkdir(artifactsDirectory, { recursive: true });
  await window.screenshot({ path: screenshotPath, fullPage: true });
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        memoryHealth: snapshot.memoryHealth,
        pingStatus: pingResult.data.status,
        writeErrorCode: writeResult.error.code,
        coreRestarted: false,
        coreProcessWorkingSetBytes: coreProcessAfterWrite.WorkingSet64
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
      metricsPath
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
