import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createPinnedLocalEmbeddingArtifactPlan,
  LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES,
  LOCAL_EMBEDDING_MODEL_ID
} from "../packages/inference-adapter-embedding-local/dist/index.js";
import { runMemoryProviderVectorDeveloperAlphaContinuousUsage } from "../apps/core-host/dist/memory-provider-vector-retrieval-developer-alpha-continuous-usage.js";

const tempRoot = await fs.mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-memory-continuous-alpha-")
);
const artifactRoot = path.join(tempRoot, "artifacts");
const tempMemoryPath = path.join(tempRoot, "memory.sqlite");

let report = createInitialReport();

try {
  await fs.mkdir(artifactRoot, { recursive: true });

  const pythonExecutable = resolvePythonExecutable();
  if (!pythonExecutable) {
    report.reasonCodes.push("runtime_python_missing");
    process.exitCode = 1;
  } else if (!isRuntimeDependencyReady(pythonExecutable)) {
    report.reasonCodes.push("runtime_dependencies_missing");
    process.exitCode = 1;
  } else {
    const artifactSummary = await downloadAndVerifyArtifacts(
      artifactRoot,
      createPinnedLocalEmbeddingArtifactPlan()
    );
    report.artifactMaterialization = "passed";
    report.artifactDigestVerification = "passed";
    report.artifactCount = artifactSummary.artifactCount;
    report.artifactBytes = artifactSummary.artifactBytes;
    report.manifestSizeMatched = artifactSummary.manifestSizeMatched;

    const acceptance = await runMemoryProviderVectorDeveloperAlphaContinuousUsage({
      env: {
        ...process.env,
        JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA: "1",
        JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING: "1",
        JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR: "1",
        JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES: "1",
        JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS: "1",
        JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER: "1",
        JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION: "1",
        JARVIS_K_RUNTIME_PYTHON: pythonExecutable,
        JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR: artifactRoot,
        JARVIS_K_MEMORY_DB_PATH: tempMemoryPath
      },
      productApprovalGranted: true,
      securityApprovalGranted: true,
      releaseApprovalGranted: true,
      phase830PreflightComplete: true,
      messageTexts: [
        "Jarvis-K continuous alpha synthetic topic one.",
        "Jarvis-K continuous alpha synthetic topic two."
      ]
    });

    report.acceptance = acceptance;
    report.status = acceptance.status;
    report.accepted = acceptance.accepted;
    report.reasonCodes = [...acceptance.reasonCodes];
    if (acceptance.status !== "passed") {
      process.exitCode = 1;
    }
  }
} catch {
  report.status = "degraded";
  if (report.artifactMaterialization === "not_run") {
    report.artifactMaterialization = "failed";
  }
  if (report.artifactDigestVerification === "not_run") {
    report.artifactDigestVerification = "failed";
  }
  report.reasonCodes = ["temporary_artifact_continuous_acceptance_failed"];
  process.exitCode = 1;
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
  report.cleanupStatus = "passed";
}

console.log(JSON.stringify(report));

function createInitialReport() {
  return {
    phase: "8.32",
    mode: "provider_vector_retrieval_continuous_alpha_temporary_artifact_acceptance",
    provider: "embedding.local.qwen3",
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    status: "degraded",
    accepted: false,
    artifactMaterialization: "not_run",
    artifactDigestVerification: "not_run",
    artifactCount: 0,
    artifactBytes: 0,
    manifestSizeMatched: false,
    cleanupStatus: "not_started",
    temporaryArtifactDirectoryPersisted: false,
    temporaryMemoryDatabasePersisted: false,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathExposureEnabled: false,
    signedUrlOrCredentialPersistenceEnabled: false,
    downloadsLimitedToApprovedArtifacts: true,
    persistentCacheWritesEnabled: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    providerDefaultOptInChanged: false,
    historicalBatchIndexingEnabled: false,
    modelOutputShellExecutionEnabled: false,
    reasonCodes: []
  };
}

async function downloadAndVerifyArtifacts(root, plan) {
  let artifactBytes = 0;

  for (const artifact of plan.artifacts) {
    if (
      artifact.revision === undefined ||
      artifact.sha256 === undefined ||
      artifact.upstreamPath === undefined
    ) {
      throw new Error("ARTIFACT_PIN_INVALID");
    }

    const targetPath = safeArtifactPath(root, artifact.key);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await downloadArtifact(
      artifact.revision,
      artifact.upstreamPath,
      artifact.sha256,
      targetPath
    );

    const verified = await hashFile(targetPath);
    if (verified.sha256 !== artifact.sha256) {
      await fs.rm(targetPath, { force: true });
      throw new Error("ARTIFACT_DIGEST_MISMATCH");
    }
    artifactBytes += verified.bytes;
  }

  return {
    artifactCount: plan.artifacts.length,
    artifactBytes,
    manifestSizeMatched: artifactBytes === LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES
  };
}

async function downloadArtifact(
  revision,
  artifactPath,
  expectedSha256,
  targetPath
) {
  const modelPath = LOCAL_EMBEDDING_MODEL_ID.split("/");
  const encodedModelPath = modelPath.map(encodeURIComponent).join("/");
  const encodedArtifactPath = artifactPath
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  const sourceUrl = `https://huggingface.co/${encodedModelPath}/resolve/${encodeURIComponent(revision)}/${encodedArtifactPath}`;
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

  const firstDigest = hash.digest("hex");
  if (firstDigest !== expectedSha256) {
    await fs.rm(targetPath, { force: true });
    throw new Error("ARTIFACT_DIGEST_MISMATCH");
  }

  return bytes;
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(filePath)) {
    const buffer = Buffer.from(chunk);
    hash.update(buffer);
    bytes += buffer.length;
  }
  return { sha256: hash.digest("hex"), bytes };
}

function safeArtifactPath(root, artifactKey) {
  if (
    artifactKey.length === 0 ||
    artifactKey.includes("\\") ||
    artifactKey.includes(":") ||
    artifactKey
      .split("/")
      .some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error("ARTIFACT_PATH_INVALID");
  }

  const rootPath = path.resolve(root);
  const targetPath = path.resolve(rootPath, artifactKey);
  if (
    targetPath !== rootPath &&
    !targetPath.startsWith(`${rootPath}${path.sep}`)
  ) {
    throw new Error("ARTIFACT_PATH_INVALID");
  }
  return targetPath;
}

function resolvePythonExecutable() {
  const explicit = process.env.JARVIS_K_RUNTIME_PYTHON?.trim();
  if (explicit) {
    return explicit;
  }

  const tempRuntimePython = path.join(
    os.tmpdir(),
    "jarvis-k-transformers-runtime",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python"
  );
  try {
    execFileSync(tempRuntimePython, ["-c", "print('ok')"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
      timeout: 5_000
    });
    return tempRuntimePython;
  } catch {
    // Fall through to system Python discovery.
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
    return output || undefined;
  } catch {
    return undefined;
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
