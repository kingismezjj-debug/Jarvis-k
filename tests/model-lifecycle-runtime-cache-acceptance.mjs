import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  createReadStream,
  createWriteStream,
  existsSync
} from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import {
  createApprovedLocalEmbeddingManifest,
  createPinnedLocalEmbeddingArtifactPlan,
  LOCAL_EMBEDDING_MANIFEST_ARTIFACT_SET_SHA256,
  LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES,
  LOCAL_EMBEDDING_MODEL_ID
} from "../packages/inference-adapter-embedding-local/dist/index.js";
import {
  createRuntimeHelperTimeoutPolicy,
  createTransformersLocalRuntimeProcessTransport,
  RuntimeHelperClient
} from "../packages/inference-runtime-transformers-local/dist/index.js";
import { FileSystemModelLifecycleManager } from "../apps/core-host/dist/file-system-model-lifecycle.js";

const APPROVAL_GATE_ENV = "JARVIS_K_PHASE_12_5_RUNTIME_CACHE_APPROVED";
const REQUIRED_ARTIFACT_COUNT = 10;
const HELPER_SCRIPT = path.resolve(
  "packages/inference-runtime-transformers-local/runtime/transformers_helper.py"
);
const LIFECYCLE_LEASE_ID = "phase-12-5-lifecycle-lease";
const FORBIDDEN_RUNTIME_FLAGS = [
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING",
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE",
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES",
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS",
  "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION"
];
const PERSISTENT_CACHE_KEYS = [
  "HF_HOME",
  "HF_HUB_CACHE",
  "HUGGINGFACE_HUB_CACHE",
  "TRANSFORMERS_CACHE",
  "PIP_CACHE_DIR"
];

let tempRoot;
let helperClient;
let activePhase = "preflight";
let cleanupStatus = "not_started";
let helperReleaseStatus = "not_started";
let helperLoadStatus = "not_started";
let lifecycleReport;
let report = createInitialReport();

try {
  const preflight = runPreflight();
  if (!preflight.passed) {
    report.status = "blocked";
    report.reasonCodes = preflight.reasonCodes;
    process.exitCode = 2;
  } else {
    report.runtime.dependencyStatus = "passed";
    tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-phase-12-5-")
    );
    await runAcceptance(preflight.pythonExecutable);
    report.status = "passed";
    report.accepted = true;
  }
} catch (error) {
  report.status = "degraded";
  report.accepted = false;
  report.reasonCodes = [mapFailureReason(error)];
  process.exitCode = 1;
} finally {
  if (helperClient !== undefined) {
    try {
      const stopped = await helperClient.shutdown({
        reason: "request_cancelled"
      });
      helperReleaseStatus =
        stopped.status === "stopped" ? "passed" : "degraded";
      helperClient = undefined;
    } catch {
      helperReleaseStatus = "degraded";
      try {
        helperClient.dispose();
      } catch {
        // The fixed failure status is retained.
      }
      helperClient = undefined;
    }
  }

  if (tempRoot !== undefined) {
    try {
      await fs.rm(tempRoot, { force: true, recursive: true });
      await fs.stat(tempRoot);
      cleanupStatus = "degraded";
    } catch (error) {
      if (isFileNotFoundError(error)) {
        cleanupStatus = "passed";
      } else {
        cleanupStatus = "degraded";
      }
    }
  } else {
    cleanupStatus = "not_started";
  }

  report.cleanupStatus = cleanupStatus;
  report.helper.release = helperReleaseStatus;
  report.helper.load = helperLoadStatus;
  if (cleanupStatus === "degraded") {
    report.status = "degraded";
    report.accepted = false;
    report.reasonCodes = dedupe([
      ...report.reasonCodes,
      "MODEL_CLEANUP_FAILED"
    ]);
    process.exitCode = 1;
  }

  console.log(JSON.stringify(report));
}

async function runAcceptance(pythonExecutable) {
  const artifactRoot = path.join(tempRoot, "artifacts");
  const lifecycleRoot = path.join(tempRoot, "lifecycle-cache");
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.mkdir(lifecycleRoot, { recursive: true });

  activePhase = "artifact_materialization";
  const plan = createPinnedLocalEmbeddingArtifactPlan();
  const artifactSummary = await materializeAndVerifyArtifacts(
    artifactRoot,
    plan
  );
  report.artifacts = {
    materialization: "passed",
    digestVerification: "passed",
    artifactCount: artifactSummary.artifactCount,
    manifestSizeMatched: artifactSummary.manifestSizeMatched
  };

  activePhase = "helper_health";
  const transport = createTransformersLocalRuntimeProcessTransport({
    pythonExecutable,
    helperScript: HELPER_SCRIPT,
    modelDirectory: artifactRoot
  });
  helperClient = new RuntimeHelperClient({
    transport,
    timeoutPolicy: createRuntimeHelperTimeoutPolicy({
      startupTimeoutMs: 60_000,
      requestTimeoutMs: 120_000,
      shutdownTimeoutMs: 10_000
    })
  });

  const health = await helperClient.health();
  if (
    health.status !== "ready" ||
    health.processState !== "ready" ||
    health.downloadEnabled !== false ||
    health.directShellExecutionAllowed !== false ||
    health.modelArtifactsAccessed !== false
  ) {
    throw new AcceptanceFailure("HELPER_LIFECYCLE_FAILED");
  }
  report.helper.health = "passed";

  activePhase = "lifecycle_activation";
  const weightArtifact = plan.artifacts.find(
    (artifact) => artifact.key === "model.safetensors"
  );
  if (
    weightArtifact === undefined ||
    weightArtifact.sha256 === undefined ||
    weightArtifact.revision === undefined
  ) {
    throw new AcceptanceFailure("MODEL_VERSION_NOT_VERIFIED");
  }

  const weightPath = safeArtifactPath(artifactRoot, weightArtifact.key);
  const weightStats = await fs.stat(weightPath);
  const approvedManifest = createApprovedLocalEmbeddingManifest();
  const lifecycleManifest = {
    ...approvedManifest,
    sizeBytes: weightStats.size,
    sha256: weightArtifact.sha256
  };

  let helperLoaded = false;
  const fetchArtifact = async (request) => {
    if (
      request.manifest.revision !== weightArtifact.revision ||
      request.manifest.sha256 !== weightArtifact.sha256
    ) {
      throw new AcceptanceFailure("MODEL_VERSION_NOT_VERIFIED");
    }

    await copyWithResume(
      weightPath,
      request.targetPath,
      request.resumeFromBytes
    );
  };
  const manager = new FileSystemModelLifecycleManager({
    rootDirectory: lifecycleRoot,
    fetchArtifact
  });

  lifecycleReport = await manager.installAndActivate(
    lifecycleManifest,
    {
      device: deviceCapability(),
      allowYellowRisk: true
    },
    async () => {
      if (!helperLoaded) {
        const loaded = await helperClient.load({
          modelId: LOCAL_EMBEDDING_MODEL_ID,
          capability: "embedding",
          resourceLeaseId: LIFECYCLE_LEASE_ID,
          modelDirectory: artifactRoot
        });
        helperLoaded =
          loaded.modelId === LOCAL_EMBEDDING_MODEL_ID &&
          loaded.capability === "embedding" &&
          loaded.sessionId.length > 0;
        helperLoadStatus = helperLoaded ? "passed" : "degraded";
      }
      return helperLoaded;
    }
  );

  report.lifecycle = {
    installAndActivate: lifecycleReport.status,
    managerLoad: "not_started",
    managerRelease: "not_started",
    reopen: "not_started",
    activeVersionRecovered: false,
    previousVersionPreserved: lifecycleReport.previousVersionPreserved,
    rollbackStatus: "not_required",
    reasonCodes: [...lifecycleReport.reasonCodes]
  };
  if (lifecycleReport.status !== "passed") {
    throw new AcceptanceFailure(
      lifecycleReport.reasonCodes.includes("MODEL_HEALTH_CHECK_FAILED")
        ? "MODEL_HEALTH_CHECK_FAILED"
        : "MODEL_ACTIVATION_COMMIT_FAILED"
    );
  }

  activePhase = "lifecycle_load_release";
  const loadedInventory = await manager.load(LOCAL_EMBEDDING_MODEL_ID);
  if (loadedInventory.status !== "loaded") {
    throw new AcceptanceFailure("MODEL_VERSION_NOT_VERIFIED");
  }
  report.lifecycle.managerLoad = "passed";

  await manager.release(LOCAL_EMBEDDING_MODEL_ID);
  report.lifecycle.managerRelease = "passed";

  activePhase = "lifecycle_reopen";
  const reopenedManager = new FileSystemModelLifecycleManager({
    rootDirectory: lifecycleRoot,
    fetchArtifact
  });
  const activeInventory = await reopenedManager.getActiveInventory(
    LOCAL_EMBEDDING_MODEL_ID
  );
  const reopenedVerified = await reopenedManager.verify(
    LOCAL_EMBEDDING_MODEL_ID
  );
  if (
    activeInventory?.manifest.revision !== lifecycleManifest.revision ||
    activeInventory?.status !== "available" ||
    !reopenedVerified
  ) {
    throw new AcceptanceFailure("MODEL_VERSION_NOT_VERIFIED");
  }
  report.lifecycle.reopen = "passed";
  report.lifecycle.activeVersionRecovered = true;

  activePhase = "helper_release";
  const stopped = await helperClient.shutdown({ reason: "request_cancelled" });
  helperReleaseStatus = stopped.status === "stopped" ? "passed" : "degraded";
  if (helperReleaseStatus !== "passed") {
    throw new AcceptanceFailure("HELPER_LIFECYCLE_FAILED");
  }
  helperClient = undefined;
}

function runPreflight() {
  const plan = createPinnedLocalEmbeddingArtifactPlan();
  const manifest = createApprovedLocalEmbeddingManifest();
  const approvalGate =
    process.env[APPROVAL_GATE_ENV]?.trim() === "1";
  const forbiddenFlagEnabled = FORBIDDEN_RUNTIME_FLAGS.some(
    (key) => process.env[key]?.trim() === "1"
  );
  const persistentCacheConfigured = PERSISTENT_CACHE_KEYS.some(
    (key) => process.env[key]?.trim()
  );
  const planReady =
    plan.status === "pinned" &&
    plan.artifacts.length === REQUIRED_ARTIFACT_COUNT &&
    plan.artifacts.every(
      (artifact) =>
        artifact.required &&
        artifact.pinned &&
        typeof artifact.revision === "string" &&
        typeof artifact.sha256 === "string" &&
        typeof artifact.upstreamPath === "string"
    );
  const manifestReady =
    manifest.id === LOCAL_EMBEDDING_MODEL_ID &&
    manifest.capability === "embedding" &&
    manifest.runtime === "transformers" &&
    manifest.sha256 === LOCAL_EMBEDDING_MANIFEST_ARTIFACT_SET_SHA256 &&
    manifest.sizeBytes === LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES;
  const helperReady = fsExists(HELPER_SCRIPT);
  const runtimeCandidates = runtimePythonCandidates();
  const pythonExecutable = runtimeCandidates.find(
    (candidate) =>
      fsExists(candidate) &&
      canRunPython(candidate) &&
      runtimeDependenciesReady(candidate)
  );
  const reasonCodes = [];
  if (!approvalGate) {
    reasonCodes.push("MISSING_RUNTIME_CACHE_APPROVAL");
  }
  if (!planReady || !manifestReady) {
    reasonCodes.push("MODEL_VERSION_NOT_VERIFIED");
  }
  if (!helperReady) {
    reasonCodes.push("HELPER_LIFECYCLE_FAILED");
  }
  if (pythonExecutable === undefined) {
    reasonCodes.push("RUNTIME_DEPENDENCY_UNAVAILABLE");
  }
  if (forbiddenFlagEnabled) {
    reasonCodes.push("SCOPE_VIOLATION");
  }
  if (persistentCacheConfigured) {
    reasonCodes.push("PERSISTENT_CACHE_DETECTED");
  }
  return {
    passed: reasonCodes.length === 0,
    pythonExecutable,
    reasonCodes: dedupe(reasonCodes)
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
      throw new AcceptanceFailure("MODEL_VERSION_NOT_VERIFIED");
    }

    const targetPath = safeArtifactPath(root, artifact.key);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await downloadArtifact(
      artifact.revision,
      artifact.upstreamPath,
      artifact.sha256,
      targetPath
    );
    const firstPass = await hashFile(targetPath);
    const secondPass = await hashFile(targetPath);
    if (
      firstPass.sha256 !== artifact.sha256 ||
      secondPass.sha256 !== artifact.sha256 ||
      firstPass.sha256 !== secondPass.sha256
    ) {
      await fs.rm(targetPath, { force: true });
      throw new AcceptanceFailure("MODEL_ARTIFACT_SHA256_MISMATCH");
    }
    artifactBytes += firstPass.bytes;
  }

  if (artifactBytes !== LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES) {
    throw new AcceptanceFailure("MODEL_ARTIFACT_INVENTORY_WRITE_FAILED");
  }
  return {
    artifactCount: plan.artifacts.length,
    manifestSizeMatched: true
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
  let response;
  try {
    response = await fetch(sourceUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(30 * 60 * 1000)
    });
  } catch {
    throw new AcceptanceFailure("MODEL_ARTIFACT_FETCH_FAILED");
  }
  if (!response.ok || response.body === null) {
    throw new AcceptanceFailure("MODEL_ARTIFACT_FETCH_FAILED");
  }

  const file = await fs.open(targetPath, "w");
  const hash = createHash("sha256");
  try {
    for await (const chunk of response.body) {
      const buffer = Buffer.from(chunk);
      hash.update(buffer);
      await file.write(buffer);
    }
  } catch {
    throw new AcceptanceFailure("MODEL_ARTIFACT_FETCH_FAILED");
  } finally {
    await file.close();
  }

  if (hash.digest("hex") !== expectedSha256) {
    await fs.rm(targetPath, { force: true });
    throw new AcceptanceFailure("MODEL_ARTIFACT_SHA256_MISMATCH");
  }
}

async function copyWithResume(sourcePath, targetPath, resumeFromBytes) {
  const sourceStats = await fs.stat(sourcePath);
  if (
    !Number.isInteger(resumeFromBytes) ||
    resumeFromBytes < 0 ||
    resumeFromBytes > sourceStats.size
  ) {
    throw new AcceptanceFailure("MODEL_ARTIFACT_FETCH_FAILED");
  }
  await pipeline(
    createReadStream(sourcePath, { start: resumeFromBytes }),
    createWriteStream(targetPath, { flags: "a" })
  );
}

function runtimePythonCandidates() {
  const candidates = [];
  const explicit = process.env.JARVIS_K_RUNTIME_PYTHON?.trim();
  if (explicit) {
    candidates.push(explicit);
  }
  candidates.push(
    path.join(
      os.tmpdir(),
      "jarvis-k-transformers-runtime",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python"
    )
  );
  try {
    const command = process.platform === "win32" ? "where" : "which";
    const discovered = execFileSync(command, ["python"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
      timeout: 5_000
    })
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .find(Boolean);
    if (discovered) {
      candidates.push(discovered);
    }
  } catch {
    // Fixed candidate list remains sufficient for the approved runtime.
  }
  return dedupe(candidates);
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

function deviceCapability() {
  return {
    checkedAt: new Date().toISOString(),
    platform: "win32",
    arch: process.arch === "x64" ? "x64" : "x64",
    cpuLogicalCores: Math.max(1, os.cpus().length),
    totalMemoryBytes: os.totalmem(),
    availableMemoryBytes: os.freemem(),
    gpus: [],
    accelerationBackends: ["cpu"],
    recommendedMode: "local_enhanced",
    reasons: []
  };
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
    throw new AcceptanceFailure("SCOPE_VIOLATION");
  }
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, artifactKey);
  if (
    resolvedTarget !== resolvedRoot &&
    !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new AcceptanceFailure("SCOPE_VIOLATION");
  }
  return resolvedTarget;
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

function createInitialReport() {
  return {
    phase: "12.5",
    scope: "model_lifecycle_runtime_cache",
    status: "blocked",
    accepted: false,
    approvalGate: "exact_scope",
    artifacts: {
      materialization: "not_started",
      digestVerification: "not_started",
      artifactCount: 0,
      manifestSizeMatched: false
    },
    runtime: {
      dependencyStatus: "approved_temporary_runtime",
      persistentCacheDetected: false
    },
    helper: {
      health: "not_started",
      load: "not_started",
      release: "not_started",
      embedCalled: false,
      rawDiagnosticsExposed: false
    },
    lifecycle: {
      installAndActivate: "not_started",
      managerLoad: "not_started",
      managerRelease: "not_started",
      reopen: "not_started",
      activeVersionRecovered: false,
      previousVersionPreserved: false,
      rollbackStatus: "not_required",
      reasonCodes: []
    },
    temporaryCacheOnly: true,
    memoryRouteComposed: false,
    providerRegistrationChanged: false,
    defaultOptInChanged: false,
    cleanupStatus: "not_started",
    reasonCodes: []
  };
}

function mapFailureReason(error) {
  if (error instanceof AcceptanceFailure) {
    return error.code;
  }
  if (activePhase.startsWith("artifact")) {
    return "MODEL_ARTIFACT_FETCH_FAILED";
  }
  if (activePhase.startsWith("helper")) {
    return "HELPER_LIFECYCLE_FAILED";
  }
  if (activePhase.startsWith("lifecycle")) {
    return "MODEL_ACTIVATION_COMMIT_FAILED";
  }
  return "HELPER_LIFECYCLE_FAILED";
}

function dedupe(values) {
  return [...new Set(values)];
}

function fsExists(filePath) {
  return existsSync(filePath);
}

function isFileNotFoundError(error) {
  return error && typeof error === "object" && error.code === "ENOENT";
}

class AcceptanceFailure extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
