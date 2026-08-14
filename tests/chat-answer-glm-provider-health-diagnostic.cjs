const path = require("node:path");
const { app, safeStorage } = require("electron");
const {
  FetchGlmChatAnswerRuntimeTransport,
  GlmChatAnswerRuntimeTransportFailure,
  GLM_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS,
  GLM_CHAT_ANSWER_RUNTIME_MODEL_ID,
  GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
  GLM_CHAT_ANSWER_RUNTIME_STRATEGY_ID,
  GLM_CHAT_ANSWER_RUNTIME_TIMEOUT_MS
} = require("../packages/inference-adapter-glm-chat-answer-runtime/dist/index.js");
const {
  createCoreHostGlmChatAnswerRuntimeComposition
} = require("../apps/core-host/dist/glm-chat-answer-runtime-composition.js");
const {
  SecureChatAnswerProviderStore
} = require("../apps/desktop/dist/secure-chat-answer-provider-store.js");

const REQUIRED_ENVS = [
  "JARVIS_K_ENABLE_CHAT_ANSWER_GLM",
  "JARVIS_K_CHAT_ANSWER_GLM_HEALTH_DIAGNOSTIC"
];

let report = createInitialReport();
let secureStoreForCleanup;
let blocked = false;

void main();

async function main() {
  try {
    await app.whenReady();
    await run();
  } catch {
    if (report.reasonCodes.length === 0) {
      report.reasonCodes = ["GLM_CHAT_ANSWER_HEALTH_DIAGNOSTIC_FAILED"];
    }
    report.status = blocked ? "blocked" : "degraded";
    report.accepted = false;
    process.exitCode = blocked ? 2 : 1;
  } finally {
    await cleanupCredential();
    await writeLine(process.stdout, JSON.stringify(report));
    app.exit(report.status === "passed" ? 0 : report.status === "blocked" ? 2 : 1);
  }
}

async function run() {
  if (!REQUIRED_ENVS.every((name) => process.env[name] === "1")) {
    block("GLM_CHAT_ANSWER_HEALTH_DIAGNOSTIC_GATE_MISSING");
    return;
  }

  const store = new SecureChatAnswerProviderStore(
    path.join(
      app.getPath("userData"),
      "jarvis-k-chat-answer-glm-provider.json"
    ),
    {
      isAvailable: () => safeStorage.isEncryptionAvailable(),
      encrypt: (value) => safeStorage.encryptString(value),
      decrypt: (value) => safeStorage.decryptString(value)
    }
  );
  const storeStatus = await store.status();
  report.secureStore = {
    available: safeStorage.isEncryptionAvailable(),
    credentialConfigured: storeStatus.credentialConfigured,
    credentialExposed: false
  };
  if (!storeStatus.credentialConfigured || !safeStorage.isEncryptionAvailable()) {
    block("GLM_CHAT_ANSWER_HEALTH_SECURE_CREDENTIAL_MISSING");
    return;
  }

  secureStoreForCleanup = store;
  report.cleanup = "in_progress";
  const configuration = await store.load();
  if (
    !configuration ||
    configuration.provider !== GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID
  ) {
    block("GLM_CHAT_ANSWER_HEALTH_SECURE_CREDENTIAL_MISSING");
    return;
  }

  const fetchTransport = new FetchGlmChatAnswerRuntimeTransport();
  const composition = createCoreHostGlmChatAnswerRuntimeComposition({
    enabled: true,
    providerId: GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    modelId: GLM_CHAT_ANSWER_RUNTIME_MODEL_ID,
    fixedProfileApproved: true,
    secureCredentialStoreAvailable: true,
    credential: configuration.credentials,
    credentialExposed: false,
    networkWindowApproved: true,
    contractReady: true,
    parserReady: true,
    timeoutAndOutputBoundsReady: true,
    defaultOffPreserved: true,
    fixtureFallbackPreserved: true,
    executorOnlySideEffectsPreserved: true,
    transport: {
      send: async (request) => {
        if (report.requestCount >= 1) {
          throw new Error("GLM_CHAT_ANSWER_HEALTH_CALL_LIMIT_EXCEEDED");
        }
        report.requestCount += 1;
        try {
          return await fetchTransport.send(request);
        } catch (error) {
          recordTransportFailure(error);
          throw error;
        }
      }
    }
  });
  report.composition = {
    status: composition.compositionReport.status,
    gates: composition.compositionReport.gates,
    reasonCodes: composition.compositionReport.reasonCodes
  };
  if (!composition.provider) {
    block("GLM_CHAT_ANSWER_HEALTH_COMPOSITION_UNAVAILABLE");
    return;
  }

  const startedAt = performance.now();
  const result = await composition.provider.answer({
    providerId: GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    utterance: "Provide a concise availability status.",
    source: "text",
    routedAt: "2026-08-09T00:00:00.000Z",
    routerDecision: {
      intent: "chat.answer",
      confidence: 0.99,
      requiresApproval: false,
      slots: {},
      reason: "Fixed minimal provider health diagnostic."
    }
  });
  report.elapsedMs = Math.round(performance.now() - startedAt);
  report.networkAttempted = report.requestCount === 1;
  report.result = {
    status: result.status,
    reasonCode: result.reasonCode,
    failureClass: result.failureClass,
    directActionAttempted: result.directActionAttempted
  };
  report.status = result.status === "answered" ? "passed" : "degraded";
  report.accepted = report.status === "passed";
  report.reasonCodes = report.accepted
    ? ["GLM_CHAT_ANSWER_HEALTH_ANSWERED"]
    : [
        result.status === "unavailable"
          ? "GLM_CHAT_ANSWER_HEALTH_UNAVAILABLE"
          : "GLM_CHAT_ANSWER_HEALTH_UNEXPECTED_RESULT"
      ];
  if (!report.accepted) {
    process.exitCode = 1;
  }
}

async function cleanupCredential() {
  if (!secureStoreForCleanup) return;
  try {
    await secureStoreForCleanup.clear();
    const status = await secureStoreForCleanup.status();
    report.credentialCleared =
      status.status === "unconfigured" &&
      status.credentialConfigured === false;
    report.cleanup = report.credentialCleared ? "complete" : "failed";
    if (!report.credentialCleared) {
      report.status = "degraded";
      report.accepted = false;
      report.reasonCodes = [
        ...new Set([
          ...report.reasonCodes,
          "GLM_CHAT_ANSWER_HEALTH_CLEANUP_VERIFICATION_FAILED"
        ])
      ];
      process.exitCode = 1;
    }
  } catch {
    report.status = "degraded";
    report.accepted = false;
    report.cleanup = "failed";
    report.credentialCleared = false;
    report.reasonCodes = [
      ...new Set([
        ...report.reasonCodes,
        "GLM_CHAT_ANSWER_HEALTH_CLEANUP_FAILED"
      ])
    ];
    process.exitCode = 1;
  }
}

function recordTransportFailure(error) {
  const category =
    error instanceof GlmChatAnswerRuntimeTransportFailure
      ? error.category
      : "unknown";
  report.transportFailureCounts[category] += 1;
}

function block(reasonCode) {
  blocked = true;
  report.status = "blocked";
  report.accepted = false;
  report.reasonCodes = [reasonCode];
  report.cleanup = "not_needed";
  process.exitCode = 2;
}

function createInitialReport() {
  return {
    scopeId: "glm-chat-answer-provider-health-diagnostic",
    status: "blocked",
    accepted: false,
    providerId: GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    modelId: GLM_CHAT_ANSWER_RUNTIME_MODEL_ID,
    strategyProfileId: GLM_CHAT_ANSWER_RUNTIME_STRATEGY_ID,
    maxOutputTokens: GLM_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS,
    timeoutMs: GLM_CHAT_ANSWER_RUNTIME_TIMEOUT_MS,
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
    composition: undefined,
    result: undefined,
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

function writeLine(stream, value) {
  return new Promise((resolve) => {
    stream.write(`${value}\n`, resolve);
  });
}
