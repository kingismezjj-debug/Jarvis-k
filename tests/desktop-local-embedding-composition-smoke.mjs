import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { _electron as electron } from "playwright";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const artifactsDirectory = path.join(rootDirectory, "artifacts");
const metricsPath = path.join(
  artifactsDirectory,
  "jarvis-k-phase-7-33-local-embedding-composition-smoke.json"
);
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-local-embedding-composition-smoke-")
);
const smokeMemoryDatabasePath = path.join(
  smokeUserDataDirectory,
  "memory.sqlite"
);
const smokeModelDirectoryPath = path.join(smokeUserDataDirectory, "models");
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
    "[pscustomobject]@{ ProcessId = $core.ProcessId } | ConvertTo-Json -Compress",
  ].join("\n");
  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { windowsHide: true }
  );
  return JSON.parse(stdout.trim());
}

async function queryLocalEmbeddingState(window) {
  return window.evaluate(async () => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable.");
    }

    const [manifestsResult, adaptersResult, providersResult, requirementsResult] =
      await Promise.all([
        window.jarvis.sendCommand({
          type: "agent.listModelManifests",
          payload: {}
        }),
        window.jarvis.sendCommand({
          type: "agent.listModelRuntimeAdapters",
          payload: {}
        }),
        window.jarvis.sendCommand({
          type: "agent.listInferenceProviders",
          payload: {}
        }),
        window.jarvis.sendCommand({
          type: "agent.listInferenceProviderRequirements",
          payload: {}
        })
      ]);

    for (const result of [
      manifestsResult,
      adaptersResult,
      providersResult,
      requirementsResult
    ]) {
      if (!result.ok) {
        throw new Error(result.error.message);
      }
    }

    const manifests = manifestsResult.data?.manifests;
    const runtimeAdapters = adaptersResult.data?.runtimeAdapters;
    const providers = providersResult.data?.providers;
    const reports = requirementsResult.data?.reports;
    if (
      !Array.isArray(manifests) ||
      !Array.isArray(runtimeAdapters) ||
      !Array.isArray(providers) ||
      !Array.isArray(reports)
    ) {
      throw new Error("Core returned invalid local embedding registry data.");
    }

    const localManifest = manifests.find(
      (manifest) => manifest.id === "Qwen/Qwen3-Embedding-0.6B"
    );
    const localProvider = providers.find(
      (provider) => provider.provider === "embedding.local.qwen3"
    );
    const fixtureProvider = providers.find(
      (provider) => provider.provider === "embedding.fixture"
    );
    const localReport = reports.find(
      (report) => report.provider === "embedding.local.qwen3"
    );
    const transformersAdapter = runtimeAdapters.find(
      (adapter) => adapter.runtime === "transformers"
    );

    return {
      manifestPresent: Boolean(localManifest),
      localProviderStatus: localProvider?.status,
      localProviderExecution: localProvider?.execution,
      fixtureProviderStatus: fixtureProvider?.status,
      runtimeAdapterCount: runtimeAdapters.length,
      transformersAdapterCapabilities:
        transformersAdapter?.capabilities ?? [],
      localRequirementConfiguredCount:
        localReport?.requirements.filter((item) => item.configured).length ?? 0,
      localRequirementCount: localReport?.requirements.length ?? 0,
      executionRequirementConfigured:
        localReport?.requirements.find(
          (item) =>
            item.key ===
            "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION"
        )?.configured ?? false
    };
  });
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
      JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER: "1",
      JARVIS_K_MEMORY_DB_PATH: smokeMemoryDatabasePath,
      JARVIS_K_MODEL_DIR: smokeModelDirectoryPath
    }
  });

  const window = await electronApp.firstWindow();
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });

  const state = await queryLocalEmbeddingState(window);
  if (
    !state.manifestPresent ||
    state.localProviderStatus !== "available" ||
    state.localProviderExecution !== "local" ||
    state.fixtureProviderStatus === "available" ||
    state.runtimeAdapterCount !== 1 ||
    !state.transformersAdapterCapabilities.includes("embedding") ||
    state.executionRequirementConfigured ||
    state.localRequirementConfiguredCount !== state.localRequirementCount - 1
  ) {
    throw new Error("Local embedding opt-in composition state was invalid.");
  }

  const executionFailure = await window.evaluate(async () => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable.");
    }
    const result = await window.jarvis.sendCommand({
      type: "agent.generateEmbeddings",
      payload: {
        modelId: "Qwen/Qwen3-Embedding-0.6B",
        inputs: [
          {
            id: "local-composition-smoke",
            text: "Jarvis-K local embedding composition smoke"
          }
        ],
        dimensions: 4
      }
    });
    return result.ok
      ? { ok: true }
      : {
          ok: false,
          code: result.error.code,
          message: result.error.message
        };
  });
  const serializedFailure = JSON.stringify(executionFailure);
  if (
    executionFailure.ok ||
    executionFailure.code !== "EMBEDDING_GENERATION_FAILED" ||
    !serializedFailure.includes("Unable to generate embeddings.") ||
    /https?:\/\//u.test(serializedFailure) ||
    /[A-Za-z]:\\/u.test(serializedFailure) ||
    /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu.test(
      serializedFailure
    )
  ) {
    throw new Error("Local embedding execution failure was not sanitized.");
  }

  const resourceDiagnostics = await window.evaluate(async () => {
    if (!window.jarvis) {
      throw new Error("Desktop bridge unavailable.");
    }
    const result = await window.jarvis.sendCommand({
      type: "agent.getResourceDiagnostics",
      payload: {}
    });
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    return result.data?.resourceDiagnostics;
  });
  if (resourceDiagnostics?.activeLeaseCount !== 0) {
    throw new Error("Local embedding composition leaked a resource lease.");
  }

  const coreInstanceBeforeRestart = await window
    .getByTestId("core-instance")
    .innerText();
  const coreProcess = await findCoreProcess(electronApp.process().pid);
  process.kill(coreProcess.ProcessId);
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  await window.waitForFunction(
    (previousInstance) => {
      const current = document.querySelector(
        '[data-testid="core-instance"]'
      )?.textContent;
      return Boolean(current && current !== previousInstance);
    },
    coreInstanceBeforeRestart,
    { timeout: 15_000 }
  );
  const restartedState = await queryLocalEmbeddingState(window);
  if (
    restartedState.localProviderStatus !== "available" ||
    restartedState.runtimeAdapterCount !== 1
  ) {
    throw new Error("Local embedding composition did not survive Core restart.");
  }

  await mkdir(artifactsDirectory, { recursive: true });
  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        localProviderStatus: state.localProviderStatus,
        localProviderExecution: state.localProviderExecution,
        runtimeAdapterCount: state.runtimeAdapterCount,
        failureCode: executionFailure.code,
        activeLeaseCountAfterFailure:
          resourceDiagnostics.activeLeaseCount,
        restartedProviderStatus: restartedState.localProviderStatus
      },
      null,
      2
    )}\n`
  );

  console.log(
    JSON.stringify({
      status: "PASS",
      localProviderStatus: state.localProviderStatus,
      runtimeAdapterCount: state.runtimeAdapterCount,
      failureCode: executionFailure.code
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
