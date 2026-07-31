import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-2-wave-2-5-desktop.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-2-wave-2-5-metrics.json"
);
const pcmFixture = JSON.parse(
  await readFile(
    path.join(rootDirectory, "tests", "fixtures", "voice-pcm.json"),
    "utf8"
  )
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
    "  $_.CommandLine -match 'apps[\\\\/]core-host[\\\\/]dist[\\\\/]index\\.js'",
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
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "apps/desktop/dist/main.js",
  ],
  cwd: rootDirectory,
  env: {
    ...process.env,
    JARVIS_K_SMOKE_VOICE: "1",
    JARVIS_K_SMOKE_PROVIDER_FAULT: "1",
  },
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

  await window.evaluate(() => {
    localStorage.setItem("jarvis-k-smoke-capture-stop-count", "0");
    localStorage.setItem("jarvis-k-smoke-capture-request-count", "0");
    localStorage.removeItem("jarvis-k-smoke-deny-permission");
  });
  await window.addInitScript(() => {
    const stopCountKey = "jarvis-k-smoke-capture-stop-count";
    const requestCountKey = "jarvis-k-smoke-capture-request-count";
    const denyPermissionKey = "jarvis-k-smoke-deny-permission";
    const mediaDevices = navigator.mediaDevices;
    const originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
    Object.defineProperty(mediaDevices, "getUserMedia", {
      configurable: true,
      value: async (constraints) => {
        const requestCount = Number(
          localStorage.getItem(requestCountKey) ?? "0"
        );
        localStorage.setItem(requestCountKey, String(requestCount + 1));
        if (localStorage.getItem(denyPermissionKey) === "1") {
          throw new DOMException(
            "Microphone permission denied by smoke test.",
            "NotAllowedError"
          );
        }
        const stream = await originalGetUserMedia(constraints);
        for (const track of stream.getTracks()) {
          const originalStop = track.stop.bind(track);
          track.stop = () => {
            const current = Number(localStorage.getItem(stopCountKey) ?? "0");
            localStorage.setItem(stopCountKey, String(current + 1));
            originalStop();
          };
        }
        return stream;
      },
    });
  });
  await window.reload();
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });
  await window.getByTestId("message-list").getByText(message).waitFor();

  const pushToTalk = window.getByTestId("push-to-talk");
  await pushToTalk.focus();
  await window.keyboard.down("Space");
  await window.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "Space",
        key: " ",
        repeat: true,
        bubbles: true
      })
    );
  });
  await pushToTalk.waitFor({ state: "visible" });
  await window.waitForFunction(() => {
    return (
      document.querySelector('[data-testid="push-to-talk"]')?.getAttribute(
        "data-capture-state"
      ) === "recording"
    );
  }, undefined, { timeout: 15_000 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.waitForFunction(() => {
    return (
      document
        .querySelector('[data-testid="jarvis-app"]')
        ?.getAttribute("data-voice-permission") === "granted"
    );
  });
  const firstCaptureRequestCount = await window.evaluate(() =>
    Number(
      localStorage.getItem("jarvis-k-smoke-capture-request-count") ?? "0"
    )
  );
  if (firstCaptureRequestCount !== 1) {
    throw new Error(
      `Repeated keydown created ${firstCaptureRequestCount} capture requests.`
    );
  }
  await window.keyboard.up("Space");
  await window.waitForFunction(() => {
    return (
      document.querySelector('[data-testid="push-to-talk"]')?.getAttribute(
        "data-capture-state"
      ) === "idle"
    );
  });

  await pushToTalk.focus();
  await window.keyboard.down("Space");
  await window.waitForFunction(() => {
    return (
      document.querySelector('[data-testid="push-to-talk"]')?.getAttribute(
        "data-capture-state"
      ) === "recording"
    );
  });
  await window.reload();
  await window.keyboard.up("Space");
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000,
  });
  const releasedCaptureTracks = await window.evaluate(() =>
    Number(localStorage.getItem("jarvis-k-smoke-capture-stop-count") ?? "0")
  );
  if (releasedCaptureTracks < 2) {
    throw new Error("Renderer reload did not release the microphone track.");
  }

  await window.evaluate(() => {
    localStorage.setItem("jarvis-k-smoke-deny-permission", "1");
  });
  const deniedPushToTalk = window.getByTestId("push-to-talk");
  await deniedPushToTalk.focus();
  await window.keyboard.down("Space");
  await window.waitForFunction(() => {
    const app = document.querySelector('[data-testid="jarvis-app"]');
    const button = document.querySelector('[data-testid="push-to-talk"]');
    return (
      app?.getAttribute("data-voice-permission") === "denied" &&
      button?.getAttribute("data-capture-state") === "idle"
    );
  });
  await window.keyboard.up("Space");

  const fixtureResult = await window.evaluate(async (fixture) => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable for PCM fixture.");
    }
    const captureId = "capture-pcm-fixture";
    const modeResult = await window.jarvis.sendCommand({
      type: "voice.setMode",
      payload: { mode: "ptt" }
    });
    if (!modeResult.ok) {
      throw new Error(modeResult.error.message);
    }
    const startResult = await window.jarvis.sendCommand({
      type: "voice.startPtt",
      payload: { captureId }
    });
    if (!startResult.ok) {
      throw new Error(startResult.error.message);
    }

    fixture.frames.forEach((bytes, sequenceId) => {
      const pcm = new Uint8Array(bytes);
      window.jarvis.sendVoiceAudio({
        metadata: {
          captureId,
          sequenceId,
          capturedAt: new Date(
            Date.UTC(2026, 6, 29, 0, 0, sequenceId)
          ).toISOString(),
          sampleRate: fixture.sampleRate,
          channels: fixture.channels,
          encoding: fixture.encoding,
          byteLength: pcm.byteLength
        },
        pcm
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const stopResult = await window.jarvis.sendCommand({
      type: "voice.stopPtt",
      payload: { captureId }
    });
    if (!stopResult.ok) {
      throw new Error(stopResult.error.message);
    }
    return {
      captureId,
      frameCount: fixture.frames.length
    };
  }, pcmFixture);
  await window.waitForFunction(
    (expectedText) => {
      const app = document.querySelector('[data-testid="jarvis-app"]');
      return (
        app?.getAttribute("data-voice-transcript") === expectedText &&
        app?.getAttribute("data-voice-transcript-final") === "true" &&
        app?.getAttribute("data-voice-state") === "ready"
      );
    },
    `deterministic fixture frames=${fixtureResult.frameCount}`
  );

  const coreInstanceBeforeFault = await window
    .getByTestId("core-instance")
    .innerText();
  const faultResult = await window.evaluate(async (fixture) => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable for provider fault fixture.");
    }
    const captureId = "capture-provider-fault";
    for (const command of [
      {
        type: "voice.setMode",
        payload: { mode: "ptt" }
      },
      {
        type: "voice.startPtt",
        payload: { captureId }
      }
    ]) {
      const result = await window.jarvis.sendCommand(command);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
    }

    fixture.faultFrames.forEach((bytes, sequenceId) => {
      const pcm = new Uint8Array(bytes);
      window.jarvis.sendVoiceAudio({
        metadata: {
          captureId,
          sequenceId,
          capturedAt: new Date(
            Date.UTC(2026, 6, 29, 1, 0, sequenceId)
          ).toISOString(),
          sampleRate: fixture.sampleRate,
          channels: fixture.channels,
          encoding: fixture.encoding,
          byteLength: pcm.byteLength
        },
        pcm
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    const stopResult = await window.jarvis.sendCommand({
      type: "voice.stopPtt",
      payload: { captureId }
    });
    if (!stopResult.ok) {
      throw new Error(stopResult.error.message);
    }
    return { frameCount: fixture.faultFrames.length };
  }, pcmFixture);
  await window.waitForFunction(
    () => {
      const app = document.querySelector('[data-testid="jarvis-app"]');
      return (
        app
          ?.getAttribute("data-voice-transcript")
          ?.startsWith("deterministic fault frames=3 recoveries=1 ") &&
        app?.getAttribute("data-voice-transcript-final") === "true" &&
        app?.getAttribute("data-voice-state") === "ready"
      );
    }
  );
  const faultTranscript = await window
    .getByTestId("jarvis-app")
    .getAttribute("data-voice-transcript");
  const faultMetrics = faultTranscript?.match(
    /^deterministic fault frames=3 recoveries=1 recoveryMs=(\d+) connections=(\d+) maxActive=(\d+)$/
  );
  if (!faultMetrics) {
    throw new Error("Provider fault metrics did not match the expected format.");
  }
  const recoveryMs = Number(faultMetrics[1]);
  const providerConnectionCount = Number(faultMetrics[2]);
  const providerMaxActiveSessions = Number(faultMetrics[3]);
  if (providerConnectionCount !== 1 || providerMaxActiveSessions !== 1) {
    throw new Error("Provider fault created overlapping provider resources.");
  }
  const coreInstanceAfterFault = await window
    .getByTestId("core-instance")
    .innerText();
  if (coreInstanceAfterFault !== coreInstanceBeforeFault) {
    throw new Error("Provider fault restarted the Core process.");
  }

  const mainMemoryBeforeSoak = await electronApp.evaluate(() =>
    process.memoryUsage()
  );
  const coreBeforeSoak = await findCoreProcess(electronApp.process().pid);
  const soakStartedAt = performance.now();
  const soakResult = await window.evaluate(async (cycleCount) => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable for PTT soak.");
    }
    const modeResult = await window.jarvis.sendCommand({
      type: "voice.setMode",
      payload: { mode: "ptt" }
    });
    if (!modeResult.ok) {
      throw new Error(modeResult.error.message);
    }

    for (let cycle = 1; cycle <= cycleCount; cycle += 1) {
      const captureId = `capture-soak-${cycle}`;
      const startResult = await window.jarvis.sendCommand({
        type: "voice.startPtt",
        payload: { captureId }
      });
      if (!startResult.ok) {
        throw new Error(
          `PTT soak start ${cycle} failed: ${startResult.error.message}`
        );
      }
      const pcm = new Uint8Array([126, cycle, 0, 0]);
      window.jarvis.sendVoiceAudio({
        metadata: {
          captureId,
          sequenceId: 0,
          capturedAt: new Date(
            Date.UTC(2026, 6, 29, 2, 0, 0, cycle)
          ).toISOString(),
          sampleRate: 16_000,
          channels: 1,
          encoding: "pcm_s16le",
          byteLength: pcm.byteLength
        },
        pcm
      });
      await new Promise((resolve) => setTimeout(resolve, 5));
      const stopResult = await window.jarvis.sendCommand({
        type: "voice.stopPtt",
        payload: { captureId }
      });
      if (!stopResult.ok) {
        throw new Error(
          `PTT soak stop ${cycle} failed: ${stopResult.error.message}`
        );
      }
    }
    return { completedCycles: cycleCount };
  }, 100);
  const soakDurationMs = Math.round(performance.now() - soakStartedAt);
  const expectedSoakTranscript =
    "deterministic soak cycle=100 connections=1 maxActive=1";
  await window.waitForFunction(
    (expectedText) =>
      document
        .querySelector('[data-testid="jarvis-app"]')
        ?.getAttribute("data-voice-transcript") === expectedText,
    expectedSoakTranscript
  );
  const mainMemoryAfterSoak = await electronApp.evaluate(() =>
    process.memoryUsage()
  );
  const coreAfterSoak = await findCoreProcess(electronApp.process().pid);

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
        captureRequestCount: await window.evaluate(() =>
          Number(
            localStorage.getItem(
              "jarvis-k-smoke-capture-request-count"
            ) ?? "0"
          )
        ),
        releasedCaptureTracks,
        permissionScenarios: ["granted", "denied"],
        pcmFixtureFrames: fixtureResult.frameCount,
        pcmFixtureTranscript: `deterministic fixture frames=${fixtureResult.frameCount}`,
        providerFaultRecoveries: 1,
        providerFaultTranscript: faultTranscript,
        providerFaultRestartedCore: false,
        providerConnectionCount,
        providerMaxActiveSessions,
        providerRecoveryMs: recoveryMs,
        soakCycles: soakResult.completedCycles,
        soakDurationMs,
        soakConnectLimitErrors: 0,
        mainProcessRssBeforeSoakBytes: mainMemoryBeforeSoak.rss,
        mainProcessRssAfterSoakBytes: mainMemoryAfterSoak.rss,
        mainProcessRssDeltaBytes:
          mainMemoryAfterSoak.rss - mainMemoryBeforeSoak.rss,
        coreWorkingSetBeforeSoakBytes: coreBeforeSoak.WorkingSet64,
        coreWorkingSetAfterSoakBytes: coreAfterSoak.WorkingSet64,
        coreWorkingSetDeltaBytes:
          coreAfterSoak.WorkingSet64 - coreBeforeSoak.WorkingSet64,
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
