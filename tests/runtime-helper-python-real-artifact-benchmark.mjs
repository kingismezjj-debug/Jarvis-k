import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

import {
  createPinnedLocalEmbeddingArtifactPlan,
  LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES,
  LOCAL_EMBEDDING_MODEL_ID
} from "../packages/inference-adapter-embedding-local/dist/index.js";
import {
  createRuntimeHelperTimeoutPolicy,
  createTransformersLocalRuntimeProcessTransport,
  RuntimeHelperClient
} from "../packages/inference-runtime-transformers-local/dist/index.js";


const pythonExecutable = process.env.JARVIS_K_RUNTIME_PYTHON;
if (!pythonExecutable) {
  console.error(
    "FAIL approved runtime benchmark: configured Python environment is unavailable."
  );
  process.exit(2);
}

const artifactPlan = createPinnedLocalEmbeddingArtifactPlan();
const helperScript = path.resolve(
  "packages/inference-runtime-transformers-local/runtime/transformers_helper.py"
);
const artifactRoot = await fs.mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-qwen-runtime-")
);
let client;
let report;

try {
  const artifactSummary = await downloadAndVerifyArtifacts(
    artifactRoot,
    artifactPlan
  );

  const transport = createTransformersLocalRuntimeProcessTransport({
    pythonExecutable,
    helperScript,
    modelDirectory: artifactRoot
  });
  client = new RuntimeHelperClient({
    transport,
    timeoutPolicy: createRuntimeHelperTimeoutPolicy({
      startupTimeoutMs: 60_000,
      requestTimeoutMs: 120_000,
      shutdownTimeoutMs: 10_000
    })
  });

  const runtimeSummary = await runRuntimeBenchmark(
    client,
    transport,
    pythonExecutable
  );
  await client.shutdown({ reason: "test" });
  client = undefined;

  report = {
    phase: "7.26",
    mode: "approved_artifact_temporary",
    model: "embedding",
    artifactVerification: "passed",
    artifactCount: artifactSummary.artifactCount,
    artifactBytes: artifactSummary.artifactBytes,
    manifestSizeMatched: artifactSummary.manifestSizeMatched,
    runtime: runtimeSummary.runtime,
    benchmark: runtimeSummary.benchmark,
    quality: runtimeSummary.quality,
    resource: runtimeSummary.resource,
    policy: {
      providerRegistered: false,
      executionDefaultChanged: false,
      signedUrlsPersisted: false,
      credentialsPersisted: false
    }
  };
} catch {
  console.error(
    "FAIL approved runtime benchmark: artifact verification or local runtime execution failed."
  );
  process.exitCode = 1;
} finally {
  client?.dispose();
  await fs.rm(artifactRoot, { recursive: true, force: true });
}

if (report !== undefined) {
  console.log(JSON.stringify({ ...report, cleanup: "passed" }));
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

async function downloadArtifact(revision, artifactPath, expectedSha256, targetPath) {
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
    artifactKey.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
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

async function runRuntimeBenchmark(
  runtimeClient,
  runtimeTransport,
  pythonExecutable
) {
  const memorySamples = [];
  sampleProcessMemory(runtimeTransport, pythonExecutable, memorySamples);

  const healthStarted = performance.now();
  const health = await runtimeClient.health();
  const healthMs = roundMilliseconds(performance.now() - healthStarted);
  if (health.status !== "ready" || health.executionEnabled !== true) {
    throw new Error("RUNTIME_HEALTH_UNAVAILABLE");
  }

  const loadStarted = performance.now();
  const loaded = await runtimeClient.load({
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    capability: "embedding",
    resourceLeaseId: "phase-7-26-benchmark-lease"
  });
  const modelLoadMs = roundMilliseconds(performance.now() - loadStarted);
  sampleProcessMemory(runtimeTransport, pythonExecutable, memorySamples);

  const inputs = [
    { id: "en-similar-1", text: "Jarvis-K local embedding runtime" },
    { id: "en-similar-2", text: "Jarvis-K embedding runtime process" },
    { id: "zh-smoke-1", text: "Jarvis-K 本地嵌入运行时" },
    { id: "zh-smoke-2", text: "桌面智能体的本地模型能力" },
    { id: "regression-1", text: "The supervised helper loads a local model." }
  ];
  const request = {
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    inputs
  };

  const firstEmbedStarted = performance.now();
  const firstEmbedding = await runtimeClient.embed({
    sessionId: loaded.sessionId,
    resourceLeaseId: "phase-7-26-benchmark-lease",
    request
  });
  const firstEmbedMs = roundMilliseconds(
    performance.now() - firstEmbedStarted
  );
  sampleProcessMemory(runtimeTransport, pythonExecutable, memorySamples);

  const warmLatencies = [];
  let lastEmbedding = firstEmbedding;
  for (let index = 0; index < 5; index += 1) {
    const warmStarted = performance.now();
    lastEmbedding = await runtimeClient.embed({
      sessionId: loaded.sessionId,
      resourceLeaseId: "phase-7-26-benchmark-lease",
      request
    });
    warmLatencies.push(roundMilliseconds(performance.now() - warmStarted));
    sampleProcessMemory(runtimeTransport, pythonExecutable, memorySamples);
  }

  const quality = evaluateQuality(firstEmbedding, lastEmbedding, inputs.length);
  return {
    runtime: {
      health: "ready",
      healthMs,
      modelLoaded: true,
      sessionEstablished: loaded.sessionId.length > 0
    },
    benchmark: {
      modelLoadMs,
      firstEmbedMs,
      warmEmbedMs: {
        p50: percentile(warmLatencies, 0.5),
        p95: percentile(warmLatencies, 0.95),
        samples: warmLatencies.length
      },
      dimensions: firstEmbedding.dimensions,
      vectorCount: firstEmbedding.vectors.length
    },
    quality,
    resource: createResourceSummary(memorySamples)
  };
}

function sampleProcessMemory(runtimeTransport, pythonExecutable, samples) {
  const pid = runtimeTransport.pid;
  if (!Number.isInteger(pid) || pid <= 0) {
    return;
  }

  try {
    const output = execFileSync(
      pythonExecutable,
      ["-c", PROCESS_MEMORY_PROBE, String(pid)],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true
      }
    ).trim();
    const bytes = Number(output);
    if (Number.isSafeInteger(bytes) && bytes > 0) {
      samples.push(bytes);
    }
  } catch {
    // Resource capture is optional; benchmark failure remains sanitized.
  }
}

function createResourceSummary(samples) {
  if (samples.length === 0) {
    return {
      memoryPeakCaptured: false,
      status: "deferred",
      reason: "Child-process memory sampling was unavailable."
    };
  }

  return {
    memoryPeakCaptured: true,
    status: "captured",
    sampleCount: samples.length,
    peakWorkingSetBytes: Math.max(...samples)
  };
}

function evaluateQuality(firstEmbedding, lastEmbedding, expectedCount) {
  const vectors = firstEmbedding.vectors.map((vector) => vector.values);
  const norms = vectors.map((values) =>
    Math.sqrt(values.reduce((sum, value) => sum + value * value, 0))
  );
  const normalized =
    vectors.length === expectedCount &&
    vectors.every(
      (values, index) =>
        values.length === firstEmbedding.dimensions &&
        Math.abs((norms[index] ?? Number.NaN) - 1) < 0.001
    );
  const stable = cosine(
    vectors[0] ?? [],
    lastEmbedding.vectors[0]?.values ?? []
  );

  return {
    passed:
      firstEmbedding.vectors.length === expectedCount &&
      normalized &&
      Number.isFinite(stable) &&
      stable >= 0.999,
    normalized,
    vectorLengths: vectors.map((values) => values.length),
    normMin: roundNumber(Math.min(...norms)),
    normMax: roundNumber(Math.max(...norms)),
    stableCosine: roundNumber(stable),
    finiteValues: vectors.every((values) =>
      values.every((value) => Number.isFinite(value))
    )
  };
}

function cosine(left, right) {
  if (left.length === 0 || left.length !== right.length) {
    return Number.NaN;
  }
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  if (leftNorm === 0 || rightNorm === 0) {
    return Number.NaN;
  }
  return dot / Math.sqrt(leftNorm * rightNorm);
}

function percentile(values, quantile) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * quantile) - 1)
  );
  return sorted[index] ?? 0;
}

function roundMilliseconds(value) {
  return Math.round(value * 100) / 100;
}

function roundNumber(value) {
  return Number.isFinite(value) ? Math.round(value * 1_000_000) / 1_000_000 : null;
}

const PROCESS_MEMORY_PROBE = `
import ctypes
import sys

if sys.platform != "win32":
    raise SystemExit(1)

class ProcessMemoryCounters(ctypes.Structure):
    _fields_ = [
        ("cb", ctypes.c_uint32),
        ("PageFaultCount", ctypes.c_uint32),
        ("PeakWorkingSetSize", ctypes.c_size_t),
        ("WorkingSetSize", ctypes.c_size_t),
        ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
        ("QuotaPagedPoolUsage", ctypes.c_size_t),
        ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
        ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
        ("PagefileUsage", ctypes.c_size_t),
        ("PeakPagefileUsage", ctypes.c_size_t),
    ]

pid = int(sys.argv[1])
process_query_limited_information = 0x1000
psapi = ctypes.CDLL("psapi.dll")
kernel32 = ctypes.CDLL("kernel32.dll")
kernel32.OpenProcess.argtypes = [
    ctypes.c_uint32,
    ctypes.c_int,
    ctypes.c_uint32,
]
kernel32.OpenProcess.restype = ctypes.c_void_p
kernel32.CloseHandle.argtypes = [ctypes.c_void_p]
kernel32.CloseHandle.restype = ctypes.c_int
psapi.GetProcessMemoryInfo.argtypes = [
    ctypes.c_void_p,
    ctypes.POINTER(ProcessMemoryCounters),
    ctypes.c_uint32,
]
psapi.GetProcessMemoryInfo.restype = ctypes.c_int

handle = kernel32.OpenProcess(process_query_limited_information, False, pid)
if not handle:
    raise SystemExit(1)

try:
    counters = ProcessMemoryCounters()
    counters.cb = ctypes.sizeof(ProcessMemoryCounters)
    if not psapi.GetProcessMemoryInfo(
        handle,
        ctypes.byref(counters),
        counters.cb,
    ):
        raise SystemExit(1)
    print(int(counters.WorkingSetSize))
finally:
    kernel32.CloseHandle(handle)
`;
