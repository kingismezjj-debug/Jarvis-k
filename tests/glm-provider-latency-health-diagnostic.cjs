const path = require("node:path");
const { app, safeStorage } = require("electron");
const {
  FetchGlmProviderHealthDiagnosticTransport,
  GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS,
  GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS,
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  runGlmProviderHealthDiagnostic
} = require("../packages/inference-adapter-glm-runtime/dist/index.js");
const {
  SecureHeavyPlannerProviderStore
} = require("../apps/desktop/dist/secure-heavy-planner-provider-store.js");

const APPROVAL_GATE_ENVS = [
  "JARVIS_K_ENABLE_HEAVY_PLANNER_GLM",
  "JARVIS_K_HEAVY_PLANNER_GLM_HEALTH_ONE_WINDOW_APPROVED"
];

let report = createInitialReport();
let secureStoreForCleanup;
let explicitlyBlocked = false;
let diagnosticStage = "preflight";

void main();

async function main() {
  try {
    await app.whenReady();
    await run();
  } catch {
    handleFailure(diagnosticStage);
  } finally {
    await finalizeCredentialCleanup();
    await writeLine(process.stdout, JSON.stringify(report));
    app.exit(exitCodeFor(report.status));
  }
}

async function run() {
  if (!APPROVAL_GATE_ENVS.every((name) => process.env[name] === "1")) {
    block("GLM_PROVIDER_HEALTH_APPROVAL_GATE_MISSING");
    return;
  }

  const store = new SecureHeavyPlannerProviderStore(
    path.join(
      app.getPath("userData"),
      "jarvis-k-heavy-planner-glm-provider.json"
    ),
    {
      isAvailable: () => safeStorage.isEncryptionAvailable(),
      encrypt: (value) => safeStorage.encryptString(value),
      decrypt: (value) => safeStorage.decryptString(value)
    },
    "glm"
  );
  const status = await store.status();
  report.secureStore = {
    available: safeStorage.isEncryptionAvailable(),
    credentialConfigured: status.credentialConfigured,
    credentialExposed: false
  };
  if (!status.credentialConfigured || !safeStorage.isEncryptionAvailable()) {
    block("GLM_PROVIDER_HEALTH_SECURE_CREDENTIAL_MISSING");
    return;
  }

  secureStoreForCleanup = store;
  report.cleanup = "in_progress";
  const configuration = await store.load();
  if (!configuration || configuration.provider !== "glm") {
    block("GLM_PROVIDER_HEALTH_SECURE_CREDENTIAL_MISSING");
    return;
  }

  diagnosticStage = "runtime_diagnostic";
  const transport = new FetchGlmProviderHealthDiagnosticTransport();
  const result = await runGlmProviderHealthDiagnostic({
    credential: configuration.credentials,
    transport: {
      send: async (request) => {
        if (report.requestCount >= 1) {
          throw new Error("GLM_PROVIDER_HEALTH_REQUEST_LIMIT_EXCEEDED");
        }
        report.requestCount += 1;
        return transport.send(request);
      }
    }
  });

  report = {
    ...report,
    status: result.diagnosticStatus === "healthy" ? "healthy" : "degraded",
    accepted: result.diagnosticStatus === "healthy",
    diagnosticStatus: result.diagnosticStatus,
    requestCount: result.requestCount,
    networkAttempted: result.networkAttempted,
    elapsedMs: result.elapsedMs,
    transportFailureCounts: result.transportFailureCounts,
    httpFailureCounts: result.httpFailureCounts,
    rawRequestPersisted: false,
    rawResponsePersisted: false,
    credentialExposed: false,
    directActionAttempted: false,
    coreRuntimePlannerActivated: false,
    defaultBehaviorChanged: false,
    uiIpcBehaviorChanged: false,
    telemetryChanged: false,
    releaseBehaviorChanged: false,
    reasonCodes:
      result.diagnosticStatus === "healthy"
        ? ["GLM_PROVIDER_HEALTHY"]
        : [`GLM_PROVIDER_HEALTH_${result.diagnosticStatus.toUpperCase()}`]
  };
  if (!report.accepted) {
    process.exitCode = 1;
  }
}

function handleFailure(stage) {
  report.status = explicitlyBlocked ? "blocked" : "degraded";
  report.accepted = false;
  if (report.reasonCodes.length === 0) {
    report.reasonCodes = [failureReasonCodeFor(stage)];
  }
  if (report.status !== "blocked") {
    process.exitCode = 1;
  }
}

async function finalizeCredentialCleanup() {
  const store = secureStoreForCleanup;
  if (!store) {
    return;
  }

  try {
    await store.clear();
    const status = await store.status();
    const cleared =
      status.status === "unconfigured" &&
      status.credentialConfigured === false;
    report.credentialCleared = cleared;
    if (!cleared) {
      markCleanupFailed("GLM_PROVIDER_HEALTH_CLEANUP_VERIFICATION_FAILED");
      return;
    }
    report.cleanup = "complete";
  } catch {
    markCleanupFailed("GLM_PROVIDER_HEALTH_CLEANUP_FAILED");
  }
}

function markCleanupFailed(reasonCode) {
  report.status = "degraded";
  report.accepted = false;
  report.cleanup = "failed";
  report.credentialCleared = false;
  report.reasonCodes = [...new Set([...report.reasonCodes, reasonCode])];
  process.exitCode = 1;
}

function block(reasonCode) {
  explicitlyBlocked = true;
  report.status = "blocked";
  report.accepted = false;
  report.diagnosticStatus = "blocked_preflight";
  report.reasonCodes = [reasonCode];
  report.cleanup = "not_needed";
  process.exitCode = 2;
}

function failureReasonCodeFor(stage) {
  return (
    {
      runtime_diagnostic: "GLM_PROVIDER_HEALTH_RUNTIME_DIAGNOSTIC_FAILED",
      preflight: "GLM_PROVIDER_HEALTH_PREFLIGHT_FAILED"
    }[stage] ?? "GLM_PROVIDER_HEALTH_DIAGNOSTIC_FAILED"
  );
}

function createInitialReport() {
  return {
    scopeId: "glm-provider-latency-health-diagnostic",
    status: "blocked",
    accepted: false,
    diagnosticStatus: "blocked_preflight",
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    modelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    timeoutMs: GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS,
    maxOutputTokens: GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS,
    secureStore: {
      available: false,
      credentialConfigured: false,
      credentialExposed: false
    },
    credentialCleared: false,
    requestCount: 0,
    networkAttempted: false,
    elapsedMs: 0,
    transportFailureCounts: {
      timeout: 0,
      connection: 0,
      unknown: 0
    },
    httpFailureCounts: {
      authenticationRejected: 0,
      rateLimited: 0,
      modelUnavailable: 0,
      providerUnavailable: 0
    },
    rawRequestPersisted: false,
    rawResponsePersisted: false,
    credentialExposed: false,
    directActionAttempted: false,
    coreRuntimePlannerActivated: false,
    defaultBehaviorChanged: false,
    uiIpcBehaviorChanged: false,
    telemetryChanged: false,
    releaseBehaviorChanged: false,
    cleanup: "not_needed",
    reasonCodes: []
  };
}

function exitCodeFor(status) {
  return status === "healthy" ? 0 : status === "blocked" ? 2 : 1;
}

function writeLine(stream, value) {
  return new Promise((resolve) => {
    stream.write(`${value}\n`, resolve);
  });
}
