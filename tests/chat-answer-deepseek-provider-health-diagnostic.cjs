const path = require("node:path");
const { app, safeStorage } = require("electron");
const {
  DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_PROFILE_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
  FetchOpenAiCompatibleChatAnswerRuntimeTransport,
  OpenAiCompatibleChatAnswerRuntimeTransportFailure
} = require("../packages/inference-adapter-glm-chat-answer-runtime/dist/index.js");
const {
  createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition
} = require("../apps/core-host/dist/openai-compatible-chat-answer-runtime-composition.js");
const {
  SecureChatAnswerProviderStore
} = require("../apps/desktop/dist/secure-chat-answer-provider-store.js");

const REQUIRED_ENVS = [
  "JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK",
  "JARVIS_K_CHAT_ANSWER_DEEPSEEK_HEALTH_DIAGNOSTIC"
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
      report.reasonCodes = ["DEEPSEEK_CHAT_ANSWER_HEALTH_DIAGNOSTIC_FAILED"];
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
    block("DEEPSEEK_CHAT_ANSWER_HEALTH_DIAGNOSTIC_GATE_MISSING");
    return;
  }

  const store = new SecureChatAnswerProviderStore(
    path.join(
      app.getPath("userData"),
      "jarvis-k-chat-answer-deepseek-provider.json"
    ),
    {
      isAvailable: () => safeStorage.isEncryptionAvailable(),
      encrypt: (value) => safeStorage.encryptString(value),
      decrypt: (value) => safeStorage.decryptString(value)
    },
    "chat-answer.openai-compatible.deepseek"
  );
  const storeStatus = await store.status();
  report.secureStore = {
    available: safeStorage.isEncryptionAvailable(),
    credentialConfigured: storeStatus.credentialConfigured,
    credentialExposed: false
  };
  if (!storeStatus.credentialConfigured || !safeStorage.isEncryptionAvailable()) {
    block("DEEPSEEK_CHAT_ANSWER_HEALTH_SECURE_CREDENTIAL_MISSING");
    return;
  }

  secureStoreForCleanup = store;
  report.cleanup = "in_progress";
  const configuration = await store.load();
  if (
    !configuration ||
    configuration.provider !== DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID
  ) {
    block("DEEPSEEK_CHAT_ANSWER_HEALTH_SECURE_CREDENTIAL_MISSING");
    return;
  }

  const fetchTransport = new FetchOpenAiCompatibleChatAnswerRuntimeTransport();
  const composition = createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition({
    enabled: true,
    profileId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROFILE_ID,
    providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    modelId: DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
    endpoint: DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
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
          throw new Error("DEEPSEEK_CHAT_ANSWER_HEALTH_CALL_LIMIT_EXCEEDED");
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
    block("DEEPSEEK_CHAT_ANSWER_HEALTH_COMPOSITION_UNAVAILABLE");
    return;
  }

  const startedAt = performance.now();
  const result = await composition.provider.answer({
    providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    utterance: "Provide a concise availability status.",
    source: "text",
    routedAt: "2026-08-09T00:00:00.000Z",
    routerDecision: {
      intent: "chat.answer",
      confidence: 0.99,
      requiresApproval: false,
      slots: {},
      reason: "Fixed minimal DeepSeek provider health diagnostic."
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
    ? ["DEEPSEEK_CHAT_ANSWER_HEALTH_ANSWERED"]
    : [
        result.status === "unavailable"
          ? "DEEPSEEK_CHAT_ANSWER_HEALTH_UNAVAILABLE"
          : "DEEPSEEK_CHAT_ANSWER_HEALTH_UNEXPECTED_RESULT"
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
          "DEEPSEEK_CHAT_ANSWER_HEALTH_CLEANUP_VERIFICATION_FAILED"
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
        "DEEPSEEK_CHAT_ANSWER_HEALTH_CLEANUP_FAILED"
      ])
    ];
    process.exitCode = 1;
  }
}

function recordTransportFailure(error) {
  const category =
    error instanceof OpenAiCompatibleChatAnswerRuntimeTransportFailure
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
    scopeId: "deepseek-chat-answer-provider-health-diagnostic",
    status: "blocked",
    accepted: false,
    providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    modelId: DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
    profileId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROFILE_ID,
    maxOutputTokens: DEEPSEEK_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS,
    timeoutMs: 30_000,
    endpoint: DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
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
