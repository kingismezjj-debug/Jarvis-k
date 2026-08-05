import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  createPinnedLocalEmbeddingArtifactPlan,
  LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES
} from "../packages/inference-adapter-embedding-local/dist/index.js";
import { runMemoryProviderVectorBoundedTesterExpansionExecution } from "../apps/core-host/dist/memory-provider-vector-retrieval-bounded-tester-expansion-execution-run.js";

const tempRoot = await fs.mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-phase-8-37-min-")
);
const artifactRoot = path.join(tempRoot, "artifacts");
const cacheRoot = path.join(tempRoot, "cache");
const memoryDatabasePath = path.join(tempRoot, "memory.sqlite");

const report = {
  phase: "8.37",
  mode: "provider_vector_retrieval_bounded_tester_expansion_temporary_artifact",
  status: "degraded",
  accepted: false,
  artifactMaterialization: "not_started",
  artifactDigestVerification: "not_started",
  artifactCount: 0,
  manifestSizeMatched: false,
  execution: undefined,
  cleanupStatus: "not_started",
  reasonCodes: []
};

try {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.mkdir(cacheRoot, { recursive: true });

  const pythonExecutable = resolvePythonExecutable();
  if (pythonExecutable === undefined) {
    report.artifactMaterialization = "not_run";
    report.artifactDigestVerification = "not_run";
    report.reasonCodes.push("runtime_python_missing");
  } else if (!isRuntimeDependencyReady(pythonExecutable)) {
    report.artifactMaterialization = "not_run";
    report.artifactDigestVerification = "not_run";
    report.reasonCodes.push("runtime_dependencies_missing");
  } else {
    const artifactSummary = await downloadAndVerifyArtifacts(
      artifactRoot,
      createPinnedLocalEmbeddingArtifactPlan()
    );
    report.artifactMaterialization = "passed";
    report.artifactDigestVerification = "passed";
    report.artifactCount = artifactSummary.artifactCount;
    report.manifestSizeMatched = artifactSummary.manifestSizeMatched;

    const execution = await runMemoryProviderVectorBoundedTesterExpansionExecution(
      {
        env: {
          ...process.env,
          JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA:
            "1",
          JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING: "1",
          JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR: "1",
          JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES: "1",
          JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS: "1",
          JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER: "1",
          JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION: "1",
          JARVIS_K_ENABLE_LOCAL_EMBEDDING_SESSION_REUSE: "1",
          JARVIS_K_RUNTIME_PYTHON: pythonExecutable,
          JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR: artifactRoot,
          JARVIS_K_MEMORY_DB_PATH: memoryDatabasePath,
          HF_HOME: cacheRoot,
          HF_HUB_CACHE: path.join(cacheRoot, "hub"),
          TRANSFORMERS_CACHE: path.join(cacheRoot, "transformers")
        },
        productApprovalGranted: true,
        securityApprovalGranted: true,
        releaseApprovalGranted: true,
        phase836PreflightComplete: true,
        testers: [
          {
            testerId: "tester-1",
            messageTexts: [
              "Jarvis-K Phase 8.37 minimum diagnostic synthetic message."
            ]
          }
        ]
      }
    );

    report.execution = execution;
    report.status = execution.status;
    report.accepted = execution.accepted;
    report.reasonCodes = [...execution.reasonCodes];
  }
} catch {
  report.status = "degraded";
  report.accepted = false;
  report.reasonCodes = ["temporary_artifact_execution_failed"];
} finally {
  try {
    await fs.rm(tempRoot, { recursive: true, force: true });
    report.cleanupStatus = "passed";
  } catch {
    report.status = "degraded";
    report.accepted = false;
    report.cleanupStatus = "degraded";
    report.reasonCodes = [
      ...new Set([...report.reasonCodes, "temporary_cleanup_failed"])
    ];
  }
}

console.log(JSON.stringify(report));

if (report.status !== "passed" || report.cleanupStatus !== "passed") {
  process.exitCode = 1;
}

async function downloadAndVerifyArtifacts(root, plan) {
  let artifactBytes = 0;

  for (const artifact of plan.artifacts) {
    if (
      typeof artifact.key !== "string" ||
      typeof artifact.revision !== "string" ||
      typeof artifact.upstreamPath !== "string" ||
      typeof artifact.sha256 !== "string"
    ) {
      throw new Error("ARTIFACT_PIN_INVALID");
    }

    const targetPath = safeArtifactPath(root, artifact.key);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    const modelPath = plan.modelId.split("/").map(encodeURIComponent).join("/");
    const encodedArtifactPath = artifact.upstreamPath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    const sourceUrl = `https://huggingface.co/${modelPath}/resolve/${encodeURIComponent(artifact.revision)}/${encodedArtifactPath}`;
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(30 * 60 * 1000)
    });
    if (!response.ok || response.body === null) {
      throw new Error("ARTIFACT_FETCH_FAILED");
    }

    const file = await fs.open(targetPath, "w");
    const hash = createHash("sha256");
    let bytes = 0;
    try {
      for await (const chunk of response.body) {
        const buffer = Buffer.from(chunk);
        hash.update(buffer);
        bytes += buffer.length;
        await file.write(buffer);
      }
    } finally {
      await file.close();
    }

    if (hash.digest("hex") !== artifact.sha256) {
      await fs.rm(targetPath, { force: true });
      throw new Error("ARTIFACT_DIGEST_MISMATCH");
    }
    artifactBytes += bytes;
  }

  if (artifactBytes !== LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES) {
    throw new Error("ARTIFACT_MANIFEST_SIZE_MISMATCH");
  }

  return {
    artifactCount: plan.artifacts.length,
    manifestSizeMatched: true
  };
}

function safeArtifactPath(root, artifactKey) {
  if (
    artifactKey.length === 0 ||
    artifactKey.includes("\\") ||
    artifactKey.includes(":") ||
    artifactKey.split("/").some((segment) =>
      segment === "" || segment === "." || segment === ".."
    )
  ) {
    throw new Error("ARTIFACT_PATH_INVALID");
  }

  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, artifactKey);
  if (
    resolvedTarget !== resolvedRoot &&
    !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error("ARTIFACT_PATH_INVALID");
  }
  return resolvedTarget;
}

function resolvePythonExecutable() {
  const explicit = process.env.JARVIS_K_RUNTIME_PYTHON?.trim();
  if (explicit && canRunPython(explicit)) {
    return explicit;
  }

  const tempRuntimePython = path.join(
    os.tmpdir(),
    "jarvis-k-transformers-runtime",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python"
  );
  if (canRunPython(tempRuntimePython)) {
    return tempRuntimePython;
  }

  try {
    const command = process.platform === "win32" ? "where" : "which";
    const output = execFileSync(command, ["python"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
      timeout: 5_000
    })
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .find(Boolean);
    return output && canRunPython(output) ? output : undefined;
  } catch {
    return undefined;
  }
}

function canRunPython(pythonExecutable) {
  try {
    execFileSync(pythonExecutable, ["-c", "print('ok')"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
      timeout: 5_000
    });
    return true;
  } catch {
    return false;
  }
}

function isRuntimeDependencyReady(pythonExecutable) {
  try {
    const output = execFileSync(
      pythonExecutable,
      [
        "-c",
        "import importlib.util; print('1' if all(importlib.util.find_spec(x) for x in ['torch','transformers','safetensors']) else '0')"
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true,
        timeout: 30_000
      }
    ).trim();
    return output === "1";
  } catch {
    return false;
  }
}
