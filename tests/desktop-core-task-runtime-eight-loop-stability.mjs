import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-core-task-runtime-eight-loop-stability-metrics.json",
);
const iterations = Number.parseInt(process.env.JARVIS_K_STABILITY_RUNS ?? "10", 10);
const nodeBin = process.execPath;

const loops = [
  {
    id: "text_open_notepad",
    label: "Text opens Notepad",
    args: ["tests/desktop-task-runtime-notepad-smoke.mjs", "notepad"],
  },
  {
    id: "voice_open_notepad",
    label: "Voice opens Notepad",
    args: ["tests/desktop-voice-task-runtime-notepad-smoke.mjs"],
  },
  {
    id: "voice_corrected_known_app",
    label: "Incorrect voice app name corrected to VS Code",
    args: ["tests/desktop-voice-task-runtime-known-app-correction-smoke.mjs"],
  },
  {
    id: "write_notepad_text",
    label: "Write text into Notepad",
    args: ["tests/desktop-task-runtime-notepad-write-smoke.mjs"],
  },
  {
    id: "open_vscode",
    label: "Open VS Code",
    args: ["tests/desktop-task-runtime-notepad-smoke.mjs", "vscode"],
  },
  {
    id: "open_allowlisted_browser_url",
    label: "Open allowlisted browser URL",
    args: ["tests/desktop-task-runtime-browser-open-smoke.mjs", "allowed"],
  },
  {
    id: "search_local_file",
    label: "Search local file",
    args: ["tests/desktop-task-runtime-filesystem-search-smoke.mjs"],
  },
  {
    id: "invoke_readonly_plugin",
    label: "Invoke read-only sample plugin",
    args: ["tests/desktop-plugin-local-template-runtime-smoke.mjs"],
    timeoutMs: 150_000,
  },
];

function parseLastJsonLine(stdout) {
  const lines = stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines.reverse()) {
    try {
      return JSON.parse(line);
    } catch {
      // Ignore non-JSON progress output from child smoke scripts.
    }
  }
  return undefined;
}

async function runAttempt(loop, iteration) {
  const startedAt = performance.now();
  try {
    const { stdout, stderr } = await execFileAsync(nodeBin, loop.args, {
      cwd: rootDirectory,
      env: {
        ...process.env,
        JARVIS_K_CORE_LOOP_ID: loop.id,
        JARVIS_K_CORE_LOOP_ITERATION: String(iteration),
      },
      timeout: loop.timeoutMs ?? 120_000,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8,
    });
    return {
      iteration,
      exitCode: 0,
      durationMs: Math.round(performance.now() - startedAt),
      childResult: parseLastJsonLine(stdout),
      stderr: stderr.trim(),
    };
  } catch (error) {
    return {
      iteration,
      exitCode: typeof error.code === "number" ? error.code : 1,
      durationMs: Math.round(performance.now() - startedAt),
      childResult: parseLastJsonLine(String(error.stdout ?? "")),
      stderr: String(error.stderr ?? "").trim(),
      failureReason: String(error.message ?? error),
    };
  }
}

const startedAt = performance.now();
const results = [];

for (const loop of loops) {
  const attempts = [];
  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    process.stdout.write(
      `[${loop.id}] iteration ${iteration}/${iterations} running\n`,
    );
    const attempt = await runAttempt(loop, iteration);
    attempts.push(attempt);
    process.stdout.write(
      `[${loop.id}] iteration ${iteration}/${iterations} exit=${attempt.exitCode}\n`,
    );
  }
  const successCount = attempts.filter((attempt) => attempt.exitCode === 0).length;
  results.push({
    id: loop.id,
    label: loop.label,
    successCount,
    failureCount: attempts.length - successCount,
    stableL4Ready: successCount === iterations,
    attempts,
  });
}

const failedLoops = results.filter((loop) => loop.failureCount > 0);
const metrics = {
  capturedAt: new Date().toISOString(),
  platform: process.platform,
  iterationsPerLoop: iterations,
  totalLoops: loops.length,
  totalAttempts: loops.length * iterations,
  successAttempts: results.reduce((sum, loop) => sum + loop.successCount, 0),
  failedAttempts: results.reduce((sum, loop) => sum + loop.failureCount, 0),
  status: failedLoops.length === 0 ? "PASS" : "FAIL",
  fixtureOrFakeExecutorCountsAsRealExecution: false,
  requiredStateDistinctions: [
    "routed",
    "queued",
    "running",
    "succeeded",
    "failed",
    "interrupted",
    "simulated",
    "executed",
    "verified",
    "verification_failed",
  ],
  realWindowsVerificationAttempted: process.platform === "win32",
  elapsedMs: Math.round(performance.now() - startedAt),
  loops: results,
};

await mkdir(artifactsDirectory, { recursive: true });
await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);

console.log(
  JSON.stringify({
    status: metrics.status,
    totalAttempts: metrics.totalAttempts,
    successAttempts: metrics.successAttempts,
    failedAttempts: metrics.failedAttempts,
    metricsPath,
  }),
);

if (failedLoops.length > 0) {
  process.exitCode = 1;
}
