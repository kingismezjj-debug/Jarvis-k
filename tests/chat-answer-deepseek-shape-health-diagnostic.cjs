const path = require("node:path");
const { app, safeStorage } = require("electron");
const {
  classifyOpenAiCompatibleChatAnswerResponseShape,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_MAX_OUTPUT_TOKENS,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_PROFILE_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
  FetchOpenAiCompatibleChatAnswerRuntimeTransport,
  OpenAiCompatibleChatAnswerRuntimeTransportFailure,
  createDeepseekChatAnswerRuntimeCompletionRequest
} = require("../packages/inference-adapter-glm-chat-answer-runtime/dist/index.js");
const {
  SecureChatAnswerProviderStore
} = require("../apps/desktop/dist/secure-chat-answer-provider-store.js");

const REQUIRED_ENVS = [
  "JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK",
  "JARVIS_K_CHAT_ANSWER_DEEPSEEK_SHAPE_DIAGNOSTIC"
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
      report.reasonCodes = ["DEEPSEEK_CHAT_ANSWER_SHAPE_DIAGNOSTIC_FAILED"];
    }
    report.status = blocked ? "blocked" : "degraded";
    report.accepted = false;
    process.exitCode = blocked ? 2 : 1;
  } finally {
    await cleanupCredential();
    await writeLine(process.stdout, JSON.stringify(report));
    app.exit(report.status === "shape_captured" ? 0 : report.status === "blocked" ? 2 : 1);
  }
}

async function run() {
  if (!REQUIRED_ENVS.every((name) => process.env[name] === "1")) {
    block("DEEPSEEK_CHAT_ANSWER_SHAPE_DIAGNOSTIC_GATE_MISSING");
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
    block("DEEPSEEK_CHAT_ANSWER_SHAPE_SECURE_CREDENTIAL_MISSING");
    return;
  }

  secureStoreForCleanup = store;
  report.cleanup = "in_progress";
  const configuration = await store.load();
  if (
    !configuration ||
    configuration.provider !== DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID
  ) {
    block("DEEPSEEK_CHAT_ANSWER_SHAPE_SECURE_CREDENTIAL_MISSING");
    return;
  }

  const transport = new FetchOpenAiCompatibleChatAnswerRuntimeTransport();
  const request = {
    profileId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROFILE_ID,
    url: DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
    headers: {
      Authorization: `Bearer ${configuration.credentials.apiKey}`,
      "Content-Type": "application/json"
    },
    body: createDeepseekChatAnswerRuntimeCompletionRequest({
      providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
      utterance: "Provide a concise availability status.",
      source: "text",
      routedAt: "2026-08-09T00:00:00.000Z",
      routerDecision: {
        intent: "chat.answer",
        confidence: 0.99,
        requiresApproval: false,
        slots: {},
        reason: "Fixed DeepSeek shape-only diagnostic."
      }
    }),
    timeoutMs: 30_000
  };
  report.requestCount = 1;
  const startedAt = Date.now();
  let response;
  try {
    response = await transport.send(request);
  } catch (error) {
    const category =
      error instanceof OpenAiCompatibleChatAnswerRuntimeTransportFailure
        ? error.category
        : "unknown";
    report.status = "degraded";
    report.accepted = false;
    report.networkAttempted = true;
    report.elapsedMs = Math.max(0, Date.now() - startedAt);
    report.transportFailureCounts = {
      timeout: category === "timeout" ? 1 : 0,
      connection: category === "connection" ? 1 : 0,
      unknown: category === "unknown" ? 1 : 0
    };
    report.reasonCodes = [
      `DEEPSEEK_CHAT_ANSWER_SHAPE_${category.toUpperCase()}`
    ];
    process.exitCode = 1;
    return;
  }

  report.networkAttempted = true;
  report.elapsedMs = Math.max(0, Date.now() - startedAt);
  report.responseShape = classifyOpenAiCompatibleChatAnswerResponseShape(
    response.body
  );
  report.status = "shape_captured";
  report.accepted = true;
  report.reasonCodes = ["DEEPSEEK_CHAT_ANSWER_SHAPE_CAPTURED"];
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
          "DEEPSEEK_CHAT_ANSWER_SHAPE_CLEANUP_VERIFICATION_FAILED"
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
        "DEEPSEEK_CHAT_ANSWER_SHAPE_CLEANUP_FAILED"
      ])
    ];
    process.exitCode = 1;
  }
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
    scopeId: "deepseek-chat-answer-shape-health-diagnostic",
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
    responseShape: undefined,
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
