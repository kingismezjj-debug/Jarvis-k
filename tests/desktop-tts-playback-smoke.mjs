import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-tts-playback-smoke.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-tts-playback-smoke-metrics.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-tts-playback-")
);
let electronApp;

async function readTtsUiState(window) {
  return window.evaluate(async () => {
    const bridgeStatus =
      typeof window.jarvis?.getTtsServiceStatus === "function"
        ? await window.jarvis.getTtsServiceStatus().catch((error) => ({
            error: error instanceof Error ? error.message : "status failed"
          }))
        : null;
    const localTtsButton = document.querySelector(
      '[data-testid="stage5-local-tts"]'
    );
    const terms = [
      ...document.querySelectorAll('[data-testid="stage5-alpha-panel"] dt')
    ].map((label) => [
      label.textContent?.trim() ?? "",
      label.nextElementSibling?.textContent?.trim() ?? ""
    ]);
    return {
      buttonDisabled:
        localTtsButton instanceof HTMLButtonElement
          ? localTtsButton.disabled
          : null,
      stage5TtsStatus:
        document.querySelector('[data-testid="stage5-tts-status"]')
          ?.textContent ?? null,
      stage5Terms: Object.fromEntries(terms),
      bridgeStatus,
      ttsError:
        document.querySelector('[data-testid="stage5-tts-error"]')
          ?.textContent ?? null,
      visibleText: document.body.textContent?.slice(0, 3000) ?? ""
    };
  });
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
  electronApp = await electron.launch({
    args: [
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
  await window.getByTestId("command-input").fill("open notepad");
  await window.getByTestId("send-command").click();
  await window.getByTestId("brain-intent").getByText("localApp.open").waitFor({
    timeout: 10_000
  });
  await window.getByTestId("tool-loop-result").getByText("FIXTURE_DRY_RUN").waitFor({
    timeout: 10_000
  });
  const statusBeforePlay = await readTtsUiState(window);
  try {
    await window.waitForFunction(() => {
      const button = document.querySelector('[data-testid="stage5-local-tts"]');
      return button instanceof HTMLButtonElement && !button.disabled;
    });
  } catch (error) {
    const state = await readTtsUiState(window);
    throw new Error(
      `TTS playback button did not become enabled: ${JSON.stringify(state)}`
    );
  }

  await window.getByTestId("stage5-local-tts").click();
  try {
    await window.getByTestId("stage5-tts-status").getByText("played").waitFor({
      timeout: 30_000
    });
  } catch (error) {
    const state = await readTtsUiState(window);
    throw new Error(
      `TTS playback did not reach played: ${JSON.stringify({
        statusBeforePlay,
        statusAfterPlay: state
      })}`
    );
  }

  const ttsStatus = await window.getByTestId("stage5-tts-status").innerText();
  const ttsError = await window.evaluate(
    () =>
      document.querySelector('[data-testid="stage5-tts-error"]')?.textContent ??
      null
  );
  await mkdir(artifactsDirectory, { recursive: true });
  await window.screenshot({ path: screenshotPath, fullPage: true });
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        command: "open notepad",
        ttsStatus,
        ttsError,
        credentialExposed: false
      },
      null,
      2
    )}\n`
  );

  console.log(
    JSON.stringify({
      status: "PASS",
      startupMs,
      ttsStatus,
      ttsError,
      screenshotPath,
      metricsPath,
      credentialExposed: false
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
