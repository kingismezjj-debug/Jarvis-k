import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const screenshotPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-5-fixture-inference-smoke.png"
);
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-5-fixture-inference-smoke-metrics.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-fixture-inference-smoke-")
);
const smokeMemoryDatabasePath = path.join(
  smokeUserDataDirectory,
  "memory.sqlite"
);
const smokeModelDirectoryPath = path.join(smokeUserDataDirectory, "models");
let electronApp;
const metricTimeoutMs = process.env.CI ? 45_000 : 10_000;
const coreStartupTimeoutMs = process.env.CI ? 45_000 : 15_000;

const expectedMetrics = {
  "FIXTURE": "available",
  "INTENT ROUTER": "available",
  "OCR": "available",
  "RERANKER": "available",
  "VECTOR DIMS": "4",
  "VECTORS": "1",
  "INFERENCE": "completed",
  "INTENT": "memory.search",
  "ROUTE": "completed",
  "OCR TEXT": "fixture ocr text",
  "OCR BLOCKS": "1",
  "OCR OPS": "completed",
  "TOP DOC": "doc-model-ports",
  "RERANKED": "1",
  "RERANK OPS": "completed"
};

async function readModelGovernanceMetrics(window) {
  return window.evaluate(() => {
    const rows = [
      ...document.querySelectorAll('[data-testid="model-governance"] dt')
    ];
    return Object.fromEntries(
      rows.map((label) => [
        label.textContent?.trim() ?? "",
        label.nextElementSibling?.textContent?.trim() ?? ""
      ])
    );
  });
}

async function waitForMetric(window, label, value) {
  await window.waitForFunction(
    ([expectedLabel, expectedValue]) => {
      const rows = [
        ...document.querySelectorAll('[data-testid="model-governance"] dt')
      ];
      const metrics = Object.fromEntries(
        rows.map((item) => [
          item.textContent?.trim(),
          item.nextElementSibling?.textContent?.trim()
        ])
      );
      return metrics[expectedLabel] === expectedValue;
    },
    [label, value],
    { timeout: metricTimeoutMs }
  );
}

async function waitForButtonEnabled(window, testId) {
  await window.waitForFunction(
    (buttonTestId) => {
      const button = document.querySelector(
        `[data-testid="${buttonTestId}"]`
      );
      return button instanceof HTMLButtonElement && !button.disabled;
    },
    testId,
    { timeout: metricTimeoutMs }
  );
}

try {
  electronApp = await electron.launch({
    args: [
      `--user-data-dir=${smokeUserDataDirectory}`,
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      "apps/desktop/dist/main.js"
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_ENABLE_FIXTURE_INFERENCE: "1",
      JARVIS_K_MEMORY_DB_PATH: smokeMemoryDatabasePath,
      JARVIS_K_MODEL_DIR: smokeModelDirectoryPath
    }
  });

  const startedAt = performance.now();
  const window = await electronApp.firstWindow();
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: coreStartupTimeoutMs
  });
  const startupMs = Math.round(performance.now() - startedAt);

  await window.getByTestId("refresh-model-governance").click();
  await waitForMetric(window, "FIXTURE", "available");
  await waitForMetric(window, "INTENT ROUTER", "available");
  await waitForMetric(window, "OCR", "available");
  await waitForMetric(window, "RERANKER", "available");

  await waitForButtonEnabled(window, "run-fixture-embedding");
  await window.getByTestId("run-fixture-embedding").click();
  await waitForMetric(window, "VECTOR DIMS", "4");
  await waitForMetric(window, "VECTORS", "1");
  await waitForMetric(window, "INFERENCE", "completed");

  await waitForButtonEnabled(window, "run-fixture-intent");
  await window.getByTestId("run-fixture-intent").click();
  await waitForMetric(window, "INTENT", "memory.search");
  await waitForMetric(window, "ROUTE", "completed");

  await waitForButtonEnabled(window, "run-fixture-ocr");
  await window.getByTestId("run-fixture-ocr").click();
  await waitForMetric(window, "OCR TEXT", "fixture ocr text");
  await waitForMetric(window, "OCR BLOCKS", "1");
  await waitForMetric(window, "OCR OPS", "completed");

  await waitForButtonEnabled(window, "run-fixture-reranker");
  await window.getByTestId("run-fixture-reranker").click();
  await waitForMetric(window, "TOP DOC", "doc-model-ports");
  await waitForMetric(window, "RERANKED", "1");
  await waitForMetric(window, "RERANK OPS", "completed");

  const metrics = await readModelGovernanceMetrics(window);
  for (const [label, value] of Object.entries(expectedMetrics)) {
    if (metrics[label] !== value) {
      throw new Error(
        `Fixture inference smoke expected ${label}=${value}, got ${metrics[label]}.`
      );
    }
  }

  await mkdir(artifactsDirectory, { recursive: true });
  await window.screenshot({ path: screenshotPath, fullPage: true });
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        fixtureInferenceEnabled: true,
        metrics
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
