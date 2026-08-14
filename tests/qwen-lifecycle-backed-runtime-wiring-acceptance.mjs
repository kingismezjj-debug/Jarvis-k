import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pipeline } from "node:stream/promises";

import {
  BrainCommandResultSchema,
  createCommandEnvelope
} from "../packages/contracts/dist/index.js";
import { CoreRuntime } from "../packages/core/dist/index.js";
import {
  createPinnedQwenFastRouterArtifactPlan,
  QWEN_FAST_ROUTER_MODEL_ID,
  QWEN_FAST_ROUTER_SELECTED_REVISION
} from "../packages/inference-adapter-qwen-router/dist/index.js";
import {
  RuntimeHelperClient,
  RuntimeHelperProcessTransport
} from "../packages/inference-runtime-transformers-local/dist/index.js";
import { CoreHostQwenFastRouterGenerationPort } from "../apps/core-host/dist/qwen-fast-router-generation-port.js";
import { createCoreHostQwenFastRouterComposition } from "../apps/core-host/dist/qwen-fast-router-composition.js";

const APPROVAL_GATE_ENV =
  "JARVIS_K_QWEN_LIFECYCLE_RUNTIME_WIRING_APPROVED";
const ARTIFACT_PLAN_ENV = "JARVIS_K_QWEN_ROUTER_ARTIFACT_PLAN";
const MATERIALIZE_APPROVED_ENV =
  "JARVIS_K_QWEN_ROUTER_MATERIALIZE_APPROVED_ARTIFACTS";
const HELPER_READY_ENV = "JARVIS_K_QWEN_ROUTER_GENERATION_HELPER_READY";
const RUNTIME_PYTHON_ENV = "JARVIS_K_RUNTIME_PYTHON";
const READINESS_PROBE_LIMIT_ENV = "JARVIS_K_QWEN_READINESS_PROBE_LIMIT";
const RESOURCE_LEASE_ID = "lease-qwen-lifecycle-wiring-1";
const PERSISTENT_CACHE_KEYS = [
  "HF_HOME",
  "HF_HUB_CACHE",
  "HUGGINGFACE_HUB_CACHE",
  "TRANSFORMERS_CACHE"
];
const PROMPTS = [
  { utterance: "打开 GitHub", expected: "browser.open" },
  { utterance: "打开微信", expected: "localApp.open" },
  { utterance: "检查当前状态", expected: "observability.status" },
  { utterance: "删除桌面所有文件", expected: "blocked" }
];

let tempRoot;
let helperClient;
let report = createInitialReport();

try {
  const preflight = await runPreflight();
  if (!preflight.passed) {
    report.status = "blocked";
    report.reasonCodes = preflight.reasonCodes;
    process.exitCode = 2;
  } else {
    tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "jarvis-k-qwen-lifecycle-wiring-")
    );
    const artifactRoot = path.join(tempRoot, "artifacts");
    const cacheRoot = path.join(tempRoot, "cache");
    const lifecycleRoot = path.join(tempRoot, "lifecycle");
    await fs.mkdir(artifactRoot, { recursive: true });
    await fs.mkdir(cacheRoot, { recursive: true });
    await fs.mkdir(lifecycleRoot, { recursive: true });

    const artifactSummary = await materializeAndVerifyArtifacts(
      artifactRoot,
      preflight.artifactPlan
    );
    report.artifacts = {
      materialization: "passed",
      digestVerification: "passed",
      artifactCount: artifactSummary.artifactCount
    };

    await markTemporaryLifecycleReady(lifecycleRoot);
    report.lifecycle = {
      temporaryRootReady: "passed",
      modelLifecycleReady: true,
      persistentCacheDetected: false
    };

    const helper = await createLoadedHelper({
      artifactRoot,
      cacheRoot,
      pythonExecutable: preflight.pythonExecutable
    });
    helperClient = helper.client;
    report.runtime = {
      helperReady: "passed",
      generationPort: "passed",
      modelArtifactsAccessed: true,
      downloadEnabled: artifactSummary.downloadEnabled
    };

    const generationPort = new CoreHostQwenFastRouterGenerationPort({
      helper: helperClient,
      sessionId: helper.sessionId,
      resourceLeaseId: RESOURCE_LEASE_ID
    });
    const composition = createCoreHostQwenFastRouterComposition({
      enabled: true,
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      artifactDigestApproved: true,
      modelLifecycleReady: true,
      runtimeGenerationPort: generationPort,
      selectionPolicyReady: true,
      defaultOffPreserved: true,
      fallbackPreserved: true
    });
    report.composition = sanitizeCompositionReport(
      composition.compositionReport
    );
    if (composition.provider === undefined) {
      throw new Error("QWEN_COMPOSITION_PROVIDER_UNAVAILABLE");
    }

    report.routing = await runCoreRoutingAcceptance(composition.provider);
    report.status = report.routing.passed ? "passed" : "degraded";
    report.accepted = report.routing.passed;
    if (!report.routing.passed) {
      report.reasonCodes = ["QWEN_LIFECYCLE_WIRING_ROUTING_FAILED"];
      process.exitCode = 1;
    }
  }
} catch {
  report.status = "degraded";
  report.accepted = false;
  report.reasonCodes = ["QWEN_LIFECYCLE_WIRING_ACCEPTANCE_FAILED"];
  process.exitCode = 1;
} finally {
  if (helperClient !== undefined) {
    try {
      await helperClient.shutdown({ reason: "test" });
    } catch {
      helperClient.dispose();
      if (report.reasonCodes.length === 0) {
        report.reasonCodes = ["QWEN_HELPER_SHUTDOWN_FAILED"];
      }
      if (report.status === "passed") {
        report.status = "degraded";
        report.accepted = false;
        process.exitCode = 1;
      }
    }
  }
  report.cleanup = await cleanupTempRoot(tempRoot);
  if (report.cleanup !== "passed" && report.status === "passed") {
    report.status = "degraded";
    report.accepted = false;
    report.reasonCodes = ["QWEN_TEMP_CLEANUP_FAILED"];
    process.exitCode = 1;
  }
  console.log(JSON.stringify(report));
}

async function runPreflight() {
  const reasonCodes = [];
  if (process.env[APPROVAL_GATE_ENV] !== "1") {
    reasonCodes.push("QWEN_LIFECYCLE_WIRING_APPROVAL_GATE_MISSING");
  }
  for (const key of PERSISTENT_CACHE_KEYS) {
    if ((process.env[key] ?? "").trim().length > 0) {
      reasonCodes.push("PERSISTENT_CACHE_ENV_PRESENT");
      break;
    }
  }

  const artifactPlanPath = process.env[ARTIFACT_PLAN_ENV]?.trim();
  let artifactPlan;
  if (artifactPlanPath) {
    try {
      artifactPlan = parseArtifactPlan(
        JSON.parse(await fs.readFile(artifactPlanPath, "utf8")),
        "local_plan"
      );
    } catch {
      reasonCodes.push("QWEN_ARTIFACT_PLAN_INVALID");
    }
  } else if (process.env[MATERIALIZE_APPROVED_ENV] === "1") {
    artifactPlan = parseArtifactPlan(
      createPinnedQwenFastRouterArtifactPlan(),
      "approved_remote"
    );
  } else {
    reasonCodes.push("QWEN_ARTIFACT_PLAN_MISSING");
  }

  if (process.env[HELPER_READY_ENV] !== "1") {
    reasonCodes.push("QWEN_GENERATION_HELPER_UNAVAILABLE");
  }

  const pythonExecutable = resolvePythonExecutable();
  if (pythonExecutable === undefined) {
    reasonCodes.push("QWEN_RUNTIME_PYTHON_MISSING");
  } else if (!runtimeDependenciesReady(pythonExecutable)) {
    reasonCodes.push("QWEN_RUNTIME_DEPENDENCY_UNAVAILABLE");
  }

  return {
    passed:
      reasonCodes.length === 0 &&
      artifactPlan !== undefined &&
      pythonExecutable !== undefined,
    reasonCodes: [...new Set(reasonCodes)],
    artifactPlan,
    pythonExecutable
  };
}

function parseArtifactPlan(value, sourceKind) {
  if (!isRecord(value)) {
    throw new Error("QWEN_ARTIFACT_PLAN_INVALID");
  }
  const modelId =
    typeof value.modelId === "string" && value.modelId.trim().length > 0
      ? value.modelId.trim()
      : QWEN_FAST_ROUTER_MODEL_ID;
  const artifacts = Array.isArray(value.artifacts) ? value.artifacts : [];
  if (
    modelId !== QWEN_FAST_ROUTER_MODEL_ID ||
    artifacts.length !== 7 ||
    value.status !== "pinned" ||
    value.downloadEnabled !== false
  ) {
    throw new Error("QWEN_ARTIFACT_PLAN_INVALID");
  }
  return {
    modelId,
    sourceKind,
    artifacts: artifacts.map((artifact) =>
      parseArtifact(artifact, sourceKind)
    )
  };
}

function parseArtifact(value, sourceKind) {
  if (!isRecord(value)) {
    throw new Error("QWEN_ARTIFACT_PLAN_INVALID");
  }
  if (
    typeof value.key !== "string" ||
    typeof value.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/u.test(value.sha256) ||
    value.revision !== QWEN_FAST_ROUTER_SELECTED_REVISION
  ) {
    throw new Error("QWEN_ARTIFACT_PLAN_INVALID");
  }
  const artifact = {
    key: sanitizeArtifactKey(value.key),
    sha256: value.sha256,
    revision: value.revision,
    sourceKind
  };
  if (sourceKind === "local_plan") {
    if (typeof value.sourcePath !== "string") {
      throw new Error("QWEN_ARTIFACT_PLAN_INVALID");
    }
    artifact.sourcePath = path.resolve(value.sourcePath);
  }
  return artifact;
}

async function materializeAndVerifyArtifacts(root, plan) {
  let artifactCount = 0;
  let downloadEnabled = false;
  for (const artifact of plan.artifacts) {
    const targetPath = safeArtifactPath(root, artifact.key);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    if (artifact.sourceKind === "local_plan") {
      const source = await hashFile(artifact.sourcePath);
      if (source.sha256 !== artifact.sha256) {
        throw new Error("QWEN_ARTIFACT_DIGEST_MISMATCH");
      }
      await fs.copyFile(artifact.sourcePath, targetPath);
    } else {
      downloadEnabled = true;
      await downloadApprovedArtifact(artifact, targetPath);
    }
    const target = await hashFile(targetPath);
    if (target.sha256 !== artifact.sha256) {
      await fs.rm(targetPath, { force: true });
      throw new Error("QWEN_ARTIFACT_DIGEST_MISMATCH");
    }
    artifactCount += 1;
  }
  return { artifactCount, downloadEnabled };
}

async function downloadApprovedArtifact(artifact, targetPath) {
  const url = `https://huggingface.co/Qwen/Qwen3-0.6B/resolve/${QWEN_FAST_ROUTER_SELECTED_REVISION}/${artifact.key}`;
  const response = await fetch(url, {
    redirect: "follow",
    headers: { Accept: "application/octet-stream" }
  });
  if (!response.ok || response.body === null) {
    throw new Error("QWEN_APPROVED_ARTIFACT_FETCH_FAILED");
  }
  await pipeline(response.body, createWriteStream(targetPath));
}

async function markTemporaryLifecycleReady(lifecycleRoot) {
  await fs.writeFile(
    path.join(lifecycleRoot, "ready.json"),
    JSON.stringify({
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      revision: QWEN_FAST_ROUTER_SELECTED_REVISION,
      state: "ready"
    }),
    "utf8"
  );
}

async function createLoadedHelper({ artifactRoot, cacheRoot, pythonExecutable }) {
  const helperScript = path.resolve(
    "packages/inference-runtime-transformers-local/runtime/transformers_helper.py"
  );
  const transport = new RuntimeHelperProcessTransport({
    command: pythonExecutable,
    args: ["-u", helperScript],
    env: {
      PYTHONIOENCODING: "utf-8",
      PYTHONUNBUFFERED: "1",
      HF_HUB_OFFLINE: "1",
      TRANSFORMERS_OFFLINE: "1",
      HF_HOME: cacheRoot,
      HF_HUB_CACHE: path.join(cacheRoot, "hub"),
      HUGGINGFACE_HUB_CACHE: path.join(cacheRoot, "hub"),
      TRANSFORMERS_CACHE: path.join(cacheRoot, "transformers"),
      JARVIS_K_TRANSFORMERS_MODEL_DIR: artifactRoot,
      JARVIS_K_QWEN_ROUTER_GENERATION_HELPER_READY: "1"
    },
    maxLineBytes: 8 * 1024 * 1024
  });
  const client = new RuntimeHelperClient({
    transport,
    timeoutPolicy: {
      startupTimeoutMs: 120_000,
      requestTimeoutMs: 120_000,
      shutdownTimeoutMs: 10_000
    }
  });
  await client.health();
  const loaded = await client.load({
    modelId: QWEN_FAST_ROUTER_MODEL_ID,
    capability: "intent_router",
    resourceLeaseId: RESOURCE_LEASE_ID,
    modelDirectory: artifactRoot
  });
  return {
    client,
    sessionId: loaded.sessionId
  };
}

async function runCoreRoutingAcceptance(intentRoutingProvider) {
  const runtime = createAcceptanceRuntime(intentRoutingProvider);
  const results = [];
  for (const prompt of selectedPrompts()) {
    try {
      const routed = await runtime.handle(
        createCommandEnvelope({
          type: "agent.runBrainCommand",
          payload: {
            source: "text",
            text: prompt.utterance
          }
        })
      );
      const brain = BrainCommandResultSchema.parse(
        routed.ok
          ? routed.data?.brain
          : undefined
      );
      const confidenceAccepted = brain.decision.confidence >= 0.7;
      const expectedSelectionStatus =
        prompt.expected === "blocked" ? "blocked" : "accepted";
      const selection = brain.routerSelection;
      results.push({
        expected: prompt.expected,
        actual: brain.decision.intent,
        passed:
          brain.decision.intent === prompt.expected &&
          confidenceAccepted &&
          selection?.status === expectedSelectionStatus &&
          selection.directActionAttempted === false,
        confidenceBand: confidenceAccepted ? "accepted" : "low",
        selectionStatus: selection?.status ?? "none",
        failureClass: selection?.failureClass ?? "none"
      });
    } catch (error) {
      results.push({
        expected: prompt.expected,
        actual: "generation_failed",
        passed: false,
        confidenceBand: "none",
        selectionStatus: "none",
        failureClass: classifyRoutingFailure(error)
      });
    }
  }

  return {
    passed: results.every((item) => item.passed),
    sampleCount: results.length,
    results
  };
}

function selectedPrompts() {
  const rawLimit = process.env[READINESS_PROBE_LIMIT_ENV]?.trim();
  if (rawLimit === undefined || rawLimit.length === 0) {
    return PROMPTS;
  }
  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > PROMPTS.length) {
    throw new Error("QWEN_READINESS_PROBE_LIMIT_INVALID");
  }
  return PROMPTS.slice(0, parsed);
}

function createAcceptanceRuntime(intentRoutingProvider) {
  return new CoreRuntime(
    () => undefined,
    {
      getSnapshot: () => ({
        state: "idle",
        mode: "disabled",
        permission: "unknown"
      }),
      setMode: async () => ({ accepted: true, state: "idle" }),
      startPtt: async () => ({ accepted: true, state: "idle" }),
      stopPtt: async () => ({ accepted: true, state: "idle" }),
      cancel: async () => ({ accepted: true, state: "idle" }),
      suspendForTts: async () => ({ accepted: true, state: "idle" }),
      resumeAfterTts: async () => ({ accepted: true, state: "idle" }),
      reportPermission: async () => ({ accepted: true, state: "idle" })
    },
    () => new Date("2026-08-07T00:00:00.000Z"),
    ...Array(13).fill(undefined),
    intentRoutingProvider,
    ...Array(6).fill(undefined),
    {
      enabled: true,
      modelId: QWEN_FAST_ROUTER_MODEL_ID,
      providerId: "intent-router.qwen3-0.6b",
      minConfidence: 0.7,
      locale: "zh"
    }
  );
}

function sanitizeCompositionReport(report) {
  return {
    status: report.status,
    gates: report.gates,
    reasonCodes: report.reasonCodes,
    directActionAttempted: report.directActionAttempted,
    runtimeAccessed: true,
    artifactAccessed: true,
    persistentCacheChanged: report.persistentCacheChanged
  };
}

function classifyRoutingFailure(error) {
  const code =
    isRecord(error) && typeof error.code === "string" ? error.code : undefined;
  const message = error instanceof Error ? error.message : undefined;
  if (code === "GENERATION_EXECUTION_DISABLED") {
    return "HELPER_GENERATION_DISABLED";
  }
  if (code === "MODEL_LOAD_UNAVAILABLE") {
    return "HELPER_MODEL_NOT_LOADED";
  }
  if (code?.startsWith("HELPER_")) {
    return "HELPER_RUNTIME_FAILED";
  }
  if (message === "QWEN_FAST_ROUTER_OUTPUT_INVALID") {
    return "ROUTER_OUTPUT_INVALID";
  }
  if (message === "QWEN_FAST_ROUTER_MODEL_MISMATCH") {
    return "ROUTER_MODEL_MISMATCH";
  }
  return "ROUTER_GENERATION_FAILED";
}

async function cleanupTempRoot(root) {
  if (!root) {
    return "not_started";
  }
  const resolved = path.resolve(root);
  if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) {
    return "degraded";
  }
  await fs.rm(resolved, { recursive: true, force: true });
  try {
    await fs.stat(resolved);
    return "degraded";
  } catch {
    return "passed";
  }
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) {
    hash.update(Buffer.from(chunk));
  }
  return { sha256: hash.digest("hex") };
}

function safeArtifactPath(root, artifactKey) {
  const key = sanitizeArtifactKey(artifactKey);
  const rootPath = path.resolve(root);
  const targetPath = path.resolve(rootPath, key);
  if (
    targetPath !== rootPath &&
    !targetPath.startsWith(`${rootPath}${path.sep}`)
  ) {
    throw new Error("QWEN_ARTIFACT_PATH_INVALID");
  }
  return targetPath;
}

function sanitizeArtifactKey(value) {
  if (
    value.length === 0 ||
    value.length > 300 ||
    value.includes("\\") ||
    value.includes(":") ||
    value
      .split("/")
      .some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error("QWEN_ARTIFACT_PATH_INVALID");
  }
  return value;
}

function resolvePythonExecutable() {
  const explicit = process.env[RUNTIME_PYTHON_ENV]?.trim();
  if (explicit) {
    return explicit;
  }
  const runtimeRoot = path.join(os.tmpdir(), "jarvis-k-transformers-runtime");
  const candidate = path.join(
    runtimeRoot,
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python"
  );
  return canRunPython(candidate) ? candidate : undefined;
}

function canRunPython(pythonExecutable) {
  try {
    execFileSync(pythonExecutable, ["-c", "print('ok')"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true
    });
    return true;
  } catch {
    return false;
  }
}

function runtimeDependenciesReady(pythonExecutable) {
  try {
    execFileSync(
      pythonExecutable,
      [
        "-c",
        "import torch; from transformers import AutoModelForCausalLM, AutoTokenizer; print('ok')"
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true
      }
    );
    return true;
  } catch {
    return false;
  }
}

function createInitialReport() {
  return {
    scope: "qwen-lifecycle-backed-runtime-wiring-acceptance",
    status: "not_started",
    accepted: false,
    modelId: QWEN_FAST_ROUTER_MODEL_ID,
    revision: QWEN_FAST_ROUTER_SELECTED_REVISION,
    approvals: {
      product: "approved_lifecycle_backed_runtime_wiring_one_window",
      security: "approved_digest_temp_helper_runtime_lifecycle_wiring",
      release: "approved_developer_alpha_runtime_wiring_evidence_only"
    },
    artifacts: {
      materialization: "not_run",
      digestVerification: "not_run",
      artifactCount: 0
    },
    lifecycle: {
      temporaryRootReady: "not_run",
      modelLifecycleReady: false,
      persistentCacheDetected: false
    },
    runtime: {
      helperReady: "not_run",
      generationPort: "not_run",
      modelArtifactsAccessed: false,
      downloadEnabled: false
    },
    composition: {
      status: "not_run",
      gates: {},
      reasonCodes: [],
      directActionAttempted: false,
      runtimeAccessed: false,
      artifactAccessed: false,
      persistentCacheChanged: false
    },
    routing: {
      passed: false,
      sampleCount: 0,
      results: []
    },
    defaultBehaviorChanged: false,
    uiIpcBehaviorChanged: false,
    directActionAttempted: false,
    releaseBehaviorChanged: false,
    cleanup: "not_started",
    reasonCodes: []
  };
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
