import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createPinnedLocalEmbeddingArtifactPlan,
  LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES,
  LOCAL_EMBEDDING_MODEL_ID
} from "../packages/inference-adapter-embedding-local/dist/index.js";
import {
  PHASE_13_5_OBSERVABILITY_RUNTIME_ACCEPTANCE_ENV,
  runCoreHostLocalEmbeddingHelperEmbedDiagnostic
} from "../apps/core-host/dist/local-embedding-helper-embed-diagnostic-runner.js";

const observabilityAcceptanceApproved =
  process.env[PHASE_13_5_OBSERVABILITY_RUNTIME_ACCEPTANCE_ENV]?.trim() === "1";

let tempRoot;
let report;

try {
  if (observabilityAcceptanceApproved) {
    tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-phase-13-5-")
    );
    const artifactRoot = path.join(tempRoot, "artifacts");
    await fs.mkdir(artifactRoot, { recursive: true });
    const pythonExecutable = resolvePythonExecutable();
    if (pythonExecutable === undefined) {
      report = createConfigurationMissingReport("runtime_python_missing");
      process.exitCode = 1;
    } else if (!runtimeDependenciesReady(pythonExecutable)) {
      report = createConfigurationMissingReport("runtime_python_missing");
      process.exitCode = 1;
    } else {
      await materializeAndVerifyArtifacts(
        artifactRoot,
        createPinnedLocalEmbeddingArtifactPlan()
      );
      report = await runDiagnostic({
        ...process.env,
        JARVIS_K_ENABLE_LOCAL_EMBEDDING_EMBED_DIAGNOSTIC: "1",
        JARVIS_K_RUNTIME_PYTHON: pythonExecutable,
        JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR: artifactRoot,
        [PHASE_13_5_OBSERVABILITY_RUNTIME_ACCEPTANCE_ENV]: "1"
      });
    }
  } else {
    report = await runDiagnostic(process.env);
  }
} catch {
  report = createConfigurationMissingReport("artifact_verification_failed");
  process.exitCode = 1;
} finally {
  if (tempRoot !== undefined) {
    report.temporaryArtifactCleanupStatus = await cleanupTemporaryRoot(
      tempRoot
    );
    if (report.temporaryArtifactCleanupStatus !== "passed") {
      report.status = "degraded";
      report.accepted = false;
      report.reasonCodes = [
        ...new Set([...report.reasonCodes, "helper_cleanup_failed"])
      ];
      process.exitCode = 1;
    }
  }
}

console.log(JSON.stringify(report));
if (report.status !== "passed" && !isLocalConfigurationMissing(report)) {
  process.exitCode = 1;
}

function isLocalConfigurationMissing(report) {
  return (
    report.reasonCodes.includes("diagnostic_opt_in_missing") ||
    report.reasonCodes.includes("runtime_python_missing") ||
    report.reasonCodes.includes("model_directory_missing")
  );
}

function createDiagnosticResourceScheduler() {
  return {
    async acquire(input) {
      return {
        leaseId: "phase-7-40-diagnostic-lease",
        capability: input.capability,
        modelId: input.modelId,
        createdAt: new Date().toISOString(),
        release: async () => undefined
      };
    },
    async diagnostics() {
      return {
        checkedAt: new Date().toISOString(),
        totalMemoryBytes: 0,
        availableMemoryBytes: 0,
        leasedMemoryBytes: 0,
        totalVramBytes: 0,
        availableVramBytes: 0,
        leasedVramBytes: 0,
        activeLeaseCount: 0,
        exclusiveGpuLeaseActive: false
      };
    }
  };
}

async function runDiagnostic(env) {
  return runCoreHostLocalEmbeddingHelperEmbedDiagnostic({
    env,
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase738PreflightComplete: true,
    phase739PreflightComplete: true,
    resourceScheduler: createDiagnosticResourceScheduler(),
    observabilityRuntimeAcceptanceRequested: observabilityAcceptanceApproved,
    observabilityRuntimeProductApprovalGranted: observabilityAcceptanceApproved,
    observabilityRuntimeSecurityApprovalGranted: observabilityAcceptanceApproved,
    observabilityRuntimeReleaseApprovalGranted: observabilityAcceptanceApproved
  });
}

function createConfigurationMissingReport(reasonCode) {
  return {
    phase: "7.40",
    mode: "helper_embed_diagnostic",
    provider: "embedding.local.qwen3",
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    status: "degraded",
    accepted: false,
    helperEmbedCalled: false,
    realEmbeddingVectorsReturned: false,
    vectorValuesExposed: false,
    rawInputsExposed: false,
    productInferenceEnabled: false,
    vectorsRoutedToMemory: false,
    vectorsPersisted: false,
    vectorsLoggedOrExposed: false,
    memorySchemaMigrationEnabled: false,
    providerRegistrationChanged: false,
    defaultOptInChanged: false,
    uiVisibilityChanged: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    rawDiagnosticsExposed: false,
    privatePathExposureEnabled: false,
    signedUrlOrCredentialPersistenceEnabled: false,
    modelOutputShellExecutionEnabled: false,
    artifactDigestVerification:
      reasonCode === "artifact_verification_failed" ? "failed" : "not_run",
    helperLoad: "not_run",
    helperEmbed: "not_run",
    cleanupStatus: "not_started",
    caseCount: 0,
    passedCount: 0,
    degradedCount: 0,
    failedCount: 0,
    reasonCodes: [reasonCode],
    temporaryArtifactCleanupStatus: "not_started"
  };
}

async function materializeAndVerifyArtifacts(root, plan) {
  let artifactBytes = 0;
  for (const artifact of plan.artifacts) {
    if (
      !artifact.pinned ||
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

  if (artifactBytes !== LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES) {
    throw new Error("ARTIFACT_SIZE_MISMATCH");
  }
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
  try {
    for await (const chunk of response.body) {
      const buffer = Buffer.from(chunk);
      hash.update(buffer);
      await file.write(buffer);
    }
  } finally {
    await file.close();
  }

  if (hash.digest("hex") !== expectedSha256) {
    await fs.rm(targetPath, { force: true });
    throw new Error("ARTIFACT_DIGEST_MISMATCH");
  }
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
    bytes += chunk.length;
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
  const tempCandidate = path.join(
    os.tmpdir(),
    "jarvis-k-transformers-runtime",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python"
  );
  if (fsExists(tempCandidate)) {
    return tempCandidate;
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

function runtimeDependenciesReady(pythonExecutable) {
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

function fsExists(filePath) {
  return Boolean(filePath) && existsSync(filePath);
}

async function cleanupTemporaryRoot(root) {
  try {
    await fs.rm(root, { recursive: true, force: true });
    await fs.stat(root);
    return "degraded";
  } catch (error) {
    return error && typeof error === "object" && error.code === "ENOENT"
      ? "passed"
      : "degraded";
  }
}
