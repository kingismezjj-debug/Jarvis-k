import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-8-16-memory-retrieval-provider-query-vector-smoke.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-memory-provider-query-vector-smoke-")
);
const smokeMemoryDatabasePath = path.join(
  smokeUserDataDirectory,
  "memory.sqlite"
);
const smokeModelDirectoryPath = path.join(smokeUserDataDirectory, "models");
let electronApp;

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
      JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING: "1",
      JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR: "1",
      JARVIS_K_MEMORY_DB_PATH: smokeMemoryDatabasePath,
      JARVIS_K_MODEL_DIR: smokeModelDirectoryPath
    }
  });

  const startedAt = performance.now();
  const window = await electronApp.firstWindow();
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  const startupMs = Math.round(performance.now() - startedAt);

  const messageText =
    "Provider query vector smoke should degrade without exposing text.";
  const sendResult = await window.evaluate(async (text) => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable.");
    }
    return window.jarvis.sendCommand({
      type: "agent.sendMessage",
      payload: {
        conversationId: "primary",
        text
      }
    });
  }, messageText);

  if (!sendResult.ok) {
    throw new Error("Provider query vector smoke sendMessage failed.");
  }

  const recall = sendResult.data?.memoryRecall;
  if (!recall || recall.mode !== "fixture_only") {
    throw new Error("Provider query vector smoke did not return recall.");
  }
  if (recall.status !== "degraded") {
    throw new Error("Provider query vector smoke did not fail closed.");
  }
  if (
    recall.reasonCode !== "MEMORY_RETRIEVAL_ROUTING_FAILED" ||
    recall.matchCount !== 0 ||
    !Array.isArray(recall.matches) ||
    recall.matches.length !== 0
  ) {
    throw new Error("Provider query vector smoke returned unsafe recall.");
  }

  const serialized = JSON.stringify(sendResult);
  if (
    serialized.includes(messageText) ||
    /https?:\/\//u.test(serialized) ||
    /[A-Za-z]:\\/u.test(serialized) ||
    /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu.test(
      serialized
    ) ||
    /raw(?:Vector|Text|Diagnostics)/u.test(serialized)
  ) {
    throw new Error("Provider query vector smoke exposed unsafe content.");
  }

  await mkdir(artifactsDirectory, { recursive: true });
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        providerQueryVectorOptInEnabled: true,
        providerExecutionOptInEnabled: false,
        recallStatus: recall.status,
        recallMode: recall.mode,
        recallReasonCode: recall.reasonCode,
        recallMatchCount: recall.matchCount,
        unsafeContentExposed: false
      },
      null,
      2
    )}\n`
  );

  console.log(
    JSON.stringify({
      status: "PASS",
      startupMs,
      metricsPath
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
