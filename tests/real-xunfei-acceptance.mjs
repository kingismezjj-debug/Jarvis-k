import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { _electron as electron } from "playwright";

if (process.env.JARVIS_K_REAL_PROVIDER_ACCEPTANCE !== "1") {
  throw new Error(
    "Real Xunfei acceptance is opt-in. Set JARVIS_K_REAL_PROVIDER_ACCEPTANCE=1."
  );
}

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-2-real-xunfei-metrics.json"
);
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-2-real-xunfei.png"
);

const startedAt = performance.now();
const electronApp = await electron.launch({
  cwd: rootDirectory,
  args: ["apps/desktop/dist/main.js"]
});

try {
  const window = await electronApp.firstWindow();
  await window.getByTestId("jarvis-app").waitFor({ timeout: 15_000 });
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });

  const result = await window.evaluate(async () => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable.");
    }

    const status = await window.jarvis.getVoiceServiceStatus();
    if (!status.configured || !status.secureStorageAvailable) {
      throw new Error("Xunfei credentials are not configured securely.");
    }

    const modeStartedAt = performance.now();
    const modeResult = await window.jarvis.sendCommand({
      type: "voice.setMode",
      payload: { mode: "ptt" }
    });
    const connectMs = Math.round(performance.now() - modeStartedAt);
    if (!modeResult.ok) {
      throw new Error(modeResult.error.message);
    }

    const cycleCount = 3;
    const cycleResults = [];
    for (let cycle = 1; cycle <= cycleCount; cycle += 1) {
      const captureId = `real-xunfei-acceptance-${cycle}`;
      const cycleStartedAt = performance.now();
      const startResult = await window.jarvis.sendCommand({
        type: "voice.startPtt",
        payload: { captureId }
      });
      if (!startResult.ok) {
        throw new Error(startResult.error.message);
      }

      for (let sequenceId = 0; sequenceId < 12; sequenceId += 1) {
        const pcm = new Uint8Array(1280);
        window.jarvis.sendVoiceAudio({
          metadata: {
            captureId,
            sequenceId,
            capturedAt: new Date().toISOString(),
            sampleRate: 16_000,
            channels: 1,
            encoding: "pcm_s16le",
            byteLength: pcm.byteLength
          },
          pcm
        });
        await new Promise((resolve) => setTimeout(resolve, 40));
      }

      const stopResult = await window.jarvis.sendCommand({
        type: "voice.stopPtt",
        payload: { captureId }
      });
      if (!stopResult.ok) {
        throw new Error(stopResult.error.message);
      }

      cycleResults.push({
        cycle,
        durationMs: Math.round(performance.now() - cycleStartedAt)
      });
    }

    const snapshotResult = await window.jarvis.getSnapshot();
    if (!snapshotResult.ok) {
      throw new Error(snapshotResult.error.message);
    }

    return {
      configured: status.configured,
      secureStorageAvailable: status.secureStorageAvailable,
      language: status.language ?? "zh",
      connectMs,
      cycles: cycleResults,
      voiceState: snapshotResult.data?.voice?.state ?? "unknown",
      transcriptFinal:
        snapshotResult.data?.voice?.transcript?.isFinal === true,
      transcriptLength:
        typeof snapshotResult.data?.voice?.transcript?.text === "string"
          ? snapshotResult.data.voice.transcript.text.length
          : 0
    };
  });

  if (result.voiceState !== "ready") {
    throw new Error(`Voice state did not return to ready: ${result.voiceState}`);
  }

  await mkdir(artifactsDirectory, { recursive: true });
  await window.screenshot({ path: screenshotPath, fullPage: true });
  const metrics = {
    capturedAt: new Date().toISOString(),
    startupMs: Math.round(performance.now() - startedAt),
    ...result,
    screenshotPath
  };
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);
  console.log(
    JSON.stringify({
      status: "PASS",
      startupMs: metrics.startupMs,
      connectMs: metrics.connectMs,
      cycles: metrics.cycles.length,
      metricsPath,
      screenshotPath
    })
  );
} finally {
  await electronApp.close();
}
