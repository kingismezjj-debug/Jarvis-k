import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-1-desktop.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-1-metrics.json"
);

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
    "  $_.CommandLine -match 'packages[\\\\/]core[\\\\/]dist[\\\\/]index\\.js'",
    "} | Select-Object -First 1",
    "if (-not $core) { exit 3 }",
    "$process = Get-Process -Id $core.ProcessId",
    '[pscustomobject]@{ ProcessId = $core.ProcessId; WorkingSet64 = $process.WorkingSet64 } | ConvertTo-Json -Compress',
  ].join("\n");
  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { windowsHide: true }
  );
  return JSON.parse(stdout.trim());
}

const startedAt = performance.now();
const electronApp = await electron.launch({
  args: ["apps/desktop/dist/main.js"],
  cwd: rootDirectory,
});

try {
  const window = await electronApp.firstWindow();
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });
  const startupMs = Math.round(performance.now() - startedAt);
  const initialInstance = await window.getByTestId("core-instance").innerText();
  const coreProcess = await findCoreProcess(electronApp.process().pid);

  const message = `Desktop smoke ${new Date().toISOString()}`;
  await window.getByTestId("command-input").fill(message);
  await window.getByTestId("send-command").click();
  await window.getByTestId("message-list").getByText(message).waitFor();

  await window.reload();
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });
  await window.getByTestId("message-list").getByText(message).waitFor();

  process.kill(coreProcess.ProcessId);
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });
  await window.waitForFunction(
    (previousInstance) => {
      const current = document.querySelector(
        '[data-testid="core-instance"]'
      )?.textContent;
      return Boolean(current && current !== previousInstance);
    },
    initialInstance,
    { timeout: 15_000 }
  );

  const restartedCoreProcess = await findCoreProcess(electronApp.process().pid);
  const mainMemory = await electronApp.evaluate(() => process.memoryUsage());

  await mkdir(artifactsDirectory, { recursive: true });
  await window.screenshot({ path: screenshotPath, fullPage: true });
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        mainProcessRssBytes: mainMemory.rss,
        coreProcessWorkingSetBytes: restartedCoreProcess.WorkingSet64,
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
    })
  );
} finally {
  await electronApp.close();
}
