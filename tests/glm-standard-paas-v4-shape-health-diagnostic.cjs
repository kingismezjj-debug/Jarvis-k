const path = require("node:path");
const { app, safeStorage } = require("electron");
const {
  FetchGlmProviderHealthDiagnosticTransport,
  GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS,
  GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS,
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  GLM_STANDARD_PAAS_V4_ENDPOINT,
  GlmRuntimeHeavyPlannerTransportFailure,
  classifyGlmProviderHealthHttpStatus,
  classifyGlmProviderHealthResponseShape,
  createGlmProviderHealthDiagnosticRequest
} = require("../packages/inference-adapter-glm-runtime/dist/index.js");
const {
  SecureHeavyPlannerProviderStore
} = require("../apps/desktop/dist/secure-heavy-planner-provider-store.js");

const STANDARD_PROFILE_ID = "standard_paas_v4";
const APPROVAL_GATE_ENVS = [
  "JARVIS_K_ENABLE_HEAVY_PLANNER_GLM",
  "JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_SHAPE_HEALTH_ONE_WINDOW_APPROVED"
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
    block("GLM_STANDARD_SHAPE_HEALTH_APPROVAL_GATE_MISSING");
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
    block("GLM_STANDARD_SHAPE_HEALTH_SECURE_CREDENTIAL_MISSING");
    return;
  }

  secureStoreForCleanup = store;
  report.cleanup = "in_progress";
  const configuration = await store.load();
  if (!configuration || configuration.provider !== "glm") {
    block("GLM_STANDARD_SHAPE_HEALTH_SECURE_CREDENTIAL_MISSING");
    return;
  }

  diagnosticStage = "runtime_diagnostic";
  const request = createGlmProviderHealthDiagnosticRequest(
    configuration.credentials,
    { profileId: STANDARD_PROFILE_ID }
  );
  if (request.url !== GLM_STANDARD_PAAS_V4_ENDPOINT) {
    throw new Error("GLM_STANDARD_SHAPE_HEALTH_ENDPOINT_MISMATCH");
  }
  if (request.body.model !== GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID) {
    throw new Error("GLM_STANDARD_SHAPE_HEALTH_MODEL_MISMATCH");
  }
  if (request.timeoutMs !== GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS) {
    throw new Error("GLM_STANDARD_SHAPE_HEALTH_TIMEOUT_MISMATCH");
  }
  if (
    request.body.max_tokens !==
    GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS
  ) {
    throw new Error("GLM_STANDARD_SHAPE_HEALTH_OUTPUT_BOUND_MISMATCH");
  }

  const transport = new FetchGlmProviderHealthDiagnosticTransport(
    GLM_STANDARD_PAAS_V4_ENDPOINT
  );
  const startedAt = Date.now();
  report.requestCount = 1;
  let response;
  try {
    response = await transport.send(request);
  } catch (error) {
    const elapsedMs = Math.max(0, Date.now() - startedAt);
    const category =
      error instanceof GlmRuntimeHeavyPlannerTransportFailure
        ? error.category
        : "unknown";
    const diagnosticStatus =
      category === "timeout"
        ? "timeout"
        : category === "connection"
          ? "connection_failed"
          : "unavailable";
    report = {
      ...report,
      status: "degraded",
      accepted: false,
      diagnosticStatus,
      requestCount: 1,
      networkAttempted: true,
      elapsedMs,
      transportFailureCounts: transportFailureCountsFor(category),
      reasonCodes: [
        `GLM_STANDARD_SHAPE_HEALTH_${diagnosticStatus.toUpperCase()}`
      ]
    };
    process.exitCode = 1;
    return;
  }
  const elapsedMs = Math.max(0, Date.now() - startedAt);
  const diagnosticStatus = classifyGlmProviderHealthHttpStatus(response.status);
  if (diagnosticStatus !== undefined) {
    report = {
      ...report,
      status: "degraded",
      accepted: false,
      diagnosticStatus,
      requestCount: 1,
      networkAttempted: true,
      elapsedMs,
      httpFailureCounts: httpFailureCountsFor(diagnosticStatus),
      reasonCodes: [`GLM_STANDARD_SHAPE_HEALTH_${diagnosticStatus.toUpperCase()}`]
    };
    process.exitCode = 1;
    return;
  }

  const responseShape = classifyGlmProviderHealthResponseShape(response.body);
  const unsafeOutput = responseShape.healthSignalShape === "unsafe_output";
  report = {
    ...report,
    status: unsafeOutput ? "degraded" : "shape_captured",
    accepted: !unsafeOutput,
    diagnosticStatus: unsafeOutput ? "unavailable" : "shape_captured",
    requestCount: 1,
    networkAttempted: true,
    elapsedMs,
    responseShape,
    reasonCodes: unsafeOutput
      ? ["GLM_STANDARD_SHAPE_HEALTH_UNSAFE_OUTPUT"]
      : ["GLM_STANDARD_SHAPE_HEALTH_SHAPE_CAPTURED"]
  };
  if (unsafeOutput) {
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
      markCleanupFailed("GLM_STANDARD_SHAPE_HEALTH_CLEANUP_VERIFICATION_FAILED");
      return;
    }
    report.cleanup = "complete";
  } catch {
    markCleanupFailed("GLM_STANDARD_SHAPE_HEALTH_CLEANUP_FAILED");
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
      runtime_diagnostic:
        "GLM_STANDARD_SHAPE_HEALTH_RUNTIME_DIAGNOSTIC_FAILED",
      preflight: "GLM_STANDARD_SHAPE_HEALTH_PREFLIGHT_FAILED"
    }[stage] ?? "GLM_STANDARD_SHAPE_HEALTH_DIAGNOSTIC_FAILED"
  );
}

function httpFailureCountsFor(status) {
  return {
    authenticationRejected:
      status === "http_authentication_rejected" ? 1 : 0,
    rateLimited: status === "http_rate_limited" ? 1 : 0,
    modelUnavailable: status === "http_model_unavailable" ? 1 : 0,
    providerUnavailable: status === "http_provider_unavailable" ? 1 : 0
  };
}

function transportFailureCountsFor(category) {
  return {
    timeout: category === "timeout" ? 1 : 0,
    connection: category === "connection" ? 1 : 0,
    unknown: category === "unknown" ? 1 : 0
  };
}

function createInitialReport() {
  return {
    scopeId: "glm-standard-paas-v4-shape-health-diagnostic",
    status: "blocked",
    accepted: false,
    diagnosticStatus: "blocked_preflight",
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    profileId: STANDARD_PROFILE_ID,
    modelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    endpoint: GLM_STANDARD_PAAS_V4_ENDPOINT,
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
    responseShape: undefined,
    rawRequestPersisted: false,
    rawResponsePersisted: false,
    rawContentPersisted: false,
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
  return status === "shape_captured" ? 0 : status === "blocked" ? 2 : 1;
}

function writeLine(stream, value) {
  return new Promise((resolve) => {
    stream.write(`${value}\n`, resolve);
  });
}
