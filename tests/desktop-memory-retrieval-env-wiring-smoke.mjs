import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-8-14-memory-retrieval-env-wiring-smoke.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-memory-retrieval-wiring-smoke-")
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

  const messageText = "Memory retrieval env wiring smoke should stay private.";
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
    throw new Error("Memory retrieval env wiring sendMessage failed.");
  }

  const recall = sendResult.data?.memoryRecall;
  if (!recall || recall.mode !== "fixture_only") {
    throw new Error("Memory retrieval env wiring did not return fixture-only recall.");
  }
  if (!["ok", "degraded"].includes(recall.status)) {
    throw new Error("Memory retrieval env wiring returned invalid recall status.");
  }
  if (recall.modelId !== "fixture/core-host-memory-retrieval") {
    throw new Error("Memory retrieval env wiring returned a non-fixture model.");
  }
  if (recall.matchCount !== 0 || !Array.isArray(recall.matches)) {
    throw new Error("Memory retrieval env wiring returned unexpected matches.");
  }
  if (recall.matches.length !== 0) {
    throw new Error("Memory retrieval env wiring exposed unexpected recall matches.");
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
    throw new Error("Memory retrieval env wiring smoke exposed unsafe content.");
  }

  await mkdir(artifactsDirectory, { recursive: true });
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        startupMs,
        memoryRetrievalRoutingEnabled: true,
        recallStatus: recall.status,
        recallMode: recall.mode,
        recallModelId: recall.modelId,
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
