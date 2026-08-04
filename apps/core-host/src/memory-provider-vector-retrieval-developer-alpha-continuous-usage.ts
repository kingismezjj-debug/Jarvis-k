import { fork, type ChildProcess } from "node:child_process";
import path from "node:path";
import {
  CommandResultSchema,
  CoreOutboundMessageSchema,
  createCommandEnvelope,
  type CommandResult
} from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
  isLocalEmbeddingProviderExecutionOptInEnabled,
  readLocalEmbeddingModelDirectory,
  readRuntimePythonExecutable,
  verifyLocalEmbeddingModelArtifacts
} from "./local-embedding-runtime-session-factory";
import {
  LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV,
  isLocalEmbeddingProviderOptInEnabled
} from "./local-embedding-composition";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "./core-memory-retrieval-env-wiring-approval-gate";
import {
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
  isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled
} from "./memory-provider-vector-retrieval-developer-alpha-plan";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV } from "./memory-provider-vector-retrieval-preflight";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "./memory-provider-vector-write-approval-gate";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "./memory-retrieval-provider-query-vector-approval-gate";
import { rollbackProviderVectorRecords } from "./memory-provider-vector-retrieval-developer-alpha-usage";

export const MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_CONTINUOUS_MAX_MESSAGES = 5;
export const MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_CONTINUOUS_DEFAULT_TIMEOUT_MS =
  180_000;

const MEMORY_DATABASE_PATH_ENV = "JARVIS_K_MEMORY_DB_PATH";

export type MemoryProviderVectorDeveloperAlphaContinuousStatus =
  | "blocked"
  | "degraded"
  | "active"
  | "stopped"
  | "passed";

export type MemoryProviderVectorDeveloperAlphaContinuousStopReason =
  | "not_started"
  | "completed"
  | "disabled_by_operator"
  | "continuous_alpha_opt_in_missing"
  | "degraded_recall"
  | "message_failed"
  | "message_limit_reached"
  | "usage_message_invalid";

export type MemoryProviderVectorDeveloperAlphaContinuousReasonCode =
  | "usage_not_approved"
  | "phase830_preflight_missing"
  | "continuous_alpha_opt_in_missing"
  | "memory_retrieval_routing_opt_in_missing"
  | "provider_query_vector_opt_in_missing"
  | "provider_vector_write_opt_in_missing"
  | "provider_vector_read_opt_in_missing"
  | "provider_opt_in_missing"
  | "provider_execution_opt_in_missing"
  | "runtime_python_missing"
  | "model_directory_missing"
  | "memory_database_path_missing"
  | "usage_messages_invalid"
  | "usage_window_invalid"
  | "artifact_verification_failed"
  | "core_host_startup_failed"
  | "core_host_message_failed"
  | "core_host_cleanup_failed"
  | "provider_vector_write_missing"
  | "provider_vector_rollback_failed"
  | "provider_vector_retrieval_degraded"
  | "session_disabled"
  | "session_stopped"
  | "unsafe_side_effect_requested";

export interface MemoryProviderVectorDeveloperAlphaContinuousRecall {
  status: "ok" | "degraded";
  mode?: "provider_vector";
  matchCount?: number;
  queryDimensions?: number;
}

export interface MemoryProviderVectorDeveloperAlphaContinuousObservation {
  status: "ok" | "degraded" | "blocked";
  mode: "unknown" | "provider_vector";
  matchCount: number;
  queryDimensions: number;
  reasonCodes: MemoryProviderVectorDeveloperAlphaContinuousReasonCode[];
}

export interface MemoryProviderVectorDeveloperAlphaContinuousTransport {
  waitUntilReady(timeoutMs: number): Promise<void>;
  sendMessage(
    text: string,
    timeoutMs: number
  ): Promise<{
    accepted: boolean;
    messageId?: string;
    recall: MemoryProviderVectorDeveloperAlphaContinuousRecall;
  }>;
  close(): Promise<"passed" | "degraded">;
}

export interface MemoryProviderVectorDeveloperAlphaContinuousRollbackResult {
  vectorWriteCount: number;
  dimensionCount: number;
  deletedCount: number;
  cleanupStatus: "passed" | "degraded";
}

export interface MemoryProviderVectorDeveloperAlphaContinuousSession {
  sendMessage(
    text: string
  ): Promise<MemoryProviderVectorDeveloperAlphaContinuousObservation>;
  stop(): Promise<MemoryProviderVectorDeveloperAlphaContinuousReport>;
  disable(): Promise<MemoryProviderVectorDeveloperAlphaContinuousReport>;
  getReport(): MemoryProviderVectorDeveloperAlphaContinuousReport;
}

export interface MemoryProviderVectorDeveloperAlphaContinuousStartResult {
  session?: MemoryProviderVectorDeveloperAlphaContinuousSession;
  report: MemoryProviderVectorDeveloperAlphaContinuousReport;
}

export interface MemoryProviderVectorDeveloperAlphaContinuousInput {
  env?: Readonly<Record<string, string | undefined>>;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  releaseApprovalGranted?: boolean;
  phase830PreflightComplete?: boolean;
  maxMessages?: number;
  stopOnDegraded?: boolean;
  timeoutMs?: number;
  coreHostScriptPath?: string;
  verifyModelArtifacts?: (modelDirectory: string) => Promise<void>;
  createTransport?: (
    input: MemoryProviderVectorDeveloperAlphaContinuousTransportInput
  ) => Promise<MemoryProviderVectorDeveloperAlphaContinuousTransport>;
  rollbackProviderVectors?: (
    input: MemoryProviderVectorDeveloperAlphaContinuousRollbackInput
  ) => Promise<MemoryProviderVectorDeveloperAlphaContinuousRollbackResult>;
  rawVectorsExposed?: boolean;
  rawTextExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposed?: boolean;
  signedUrlOrCredentialPersisted?: boolean;
  downloadsEnabled?: boolean;
  persistentCacheWritesEnabled?: boolean;
  historicalBatchIndexingEnabled?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  defaultOptInChanged?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface MemoryProviderVectorDeveloperAlphaContinuousTransportInput {
  coreHostScriptPath: string;
  env: Readonly<Record<string, string | undefined>>;
}

export interface MemoryProviderVectorDeveloperAlphaContinuousRollbackInput {
  memoryDatabasePath: string;
  sourceIds: readonly string[];
}

export interface MemoryProviderVectorDeveloperAlphaContinuousRunInput
  extends MemoryProviderVectorDeveloperAlphaContinuousInput {
  messageTexts?: readonly string[];
}

export interface MemoryProviderVectorDeveloperAlphaContinuousReport {
  phase: "8.31";
  mode: "provider_vector_retrieval_developer_alpha_continuous_usage_session";
  status: MemoryProviderVectorDeveloperAlphaContinuousStatus;
  accepted: boolean;
  sessionState: "not_started" | "active" | "stopped" | "disabled";
  messageCount: number;
  acceptedMessageCount: number;
  observationCount: number;
  providerVectorWriteCount: number;
  providerVectorDimensionCount: number;
  recallStatus: "unknown" | "ok" | "degraded";
  recallMode: "unknown" | "provider_vector";
  recallMatchCount: number;
  queryDimensionCount: number;
  stopReason: MemoryProviderVectorDeveloperAlphaContinuousStopReason;
  rollbackStatus: "not_started" | "passed" | "degraded";
  rollbackDeletedCount: number;
  cleanupStatus: "not_started" | "passed" | "degraded";
  rawVectorsExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathExposed: false;
  signedUrlOrCredentialPersisted: false;
  downloadsEnabled: false;
  persistentCacheWritesEnabled: false;
  historicalBatchIndexingEnabled: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  modelOutputShellExecutionEnabled: false;
  reasonCodes: MemoryProviderVectorDeveloperAlphaContinuousReasonCode[];
}

export async function startMemoryProviderVectorDeveloperAlphaContinuousSession(
  input: MemoryProviderVectorDeveloperAlphaContinuousInput = {}
): Promise<MemoryProviderVectorDeveloperAlphaContinuousStartResult> {
  const report = createInitialReport();
  const env = input.env ?? process.env;
  const maxMessages = input.maxMessages ?? 5;

  const approvalReason = findApprovalFailure(input);
  if (approvalReason !== undefined) {
    report.status = "blocked";
    report.reasonCodes.push(approvalReason);
    return { report };
  }

  const unsafeReason = findUnsafeSideEffect(input);
  if (unsafeReason !== undefined) {
    report.status = "blocked";
    report.reasonCodes.push(unsafeReason);
    return { report };
  }

  if (
    !Number.isInteger(maxMessages) ||
    maxMessages < 1 ||
    maxMessages > MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_CONTINUOUS_MAX_MESSAGES
  ) {
    report.status = "degraded";
    report.reasonCodes.push("usage_window_invalid");
    return { report };
  }

  const gateReason = findMissingGate(env);
  if (gateReason !== undefined) {
    report.status = "degraded";
    report.reasonCodes.push(gateReason);
    return { report };
  }

  const memoryDatabasePath = readMemoryDatabasePath(env);
  const modelDirectory = readLocalEmbeddingModelDirectory(env);
  if (memoryDatabasePath === undefined) {
    report.status = "degraded";
    report.reasonCodes.push("memory_database_path_missing");
    return { report };
  }
  if (modelDirectory === undefined) {
    report.status = "degraded";
    report.reasonCodes.push("model_directory_missing");
    return { report };
  }

  try {
    await (input.verifyModelArtifacts ?? verifyLocalEmbeddingModelArtifacts)(
      modelDirectory
    );
  } catch {
    report.status = "degraded";
    report.reasonCodes.push("artifact_verification_failed");
    return { report };
  }

  let transport:
    | MemoryProviderVectorDeveloperAlphaContinuousTransport
    | undefined;
  try {
    transport = await (
      input.createTransport ?? createCoreHostContinuousTransport
    )({
      coreHostScriptPath:
        input.coreHostScriptPath ?? resolveCoreHostScriptPath(),
      env: createSafeCoreHostChildEnvironment(env, memoryDatabasePath)
    });
    await transport.waitUntilReady(
      input.timeoutMs ??
        MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_CONTINUOUS_DEFAULT_TIMEOUT_MS
    );
  } catch {
    await transport?.close().catch(() => undefined);
    report.status = "degraded";
    report.reasonCodes.push("core_host_startup_failed");
    return { report };
  }

  report.status = "active";
  report.sessionState = "active";
  return {
    report,
    session: createSession({
      env,
      maxMessages,
      stopOnDegraded: input.stopOnDegraded ?? true,
      timeoutMs:
        input.timeoutMs ??
        MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_CONTINUOUS_DEFAULT_TIMEOUT_MS,
      memoryDatabasePath,
      transport,
      rollbackProviderVectors:
        input.rollbackProviderVectors ?? rollbackProviderVectorRecords,
      report
    })
  };
}

export async function runMemoryProviderVectorDeveloperAlphaContinuousUsage(
  input: MemoryProviderVectorDeveloperAlphaContinuousRunInput = {}
): Promise<MemoryProviderVectorDeveloperAlphaContinuousReport> {
  const earlyReport = createInitialReport();
  const approvalReason = findApprovalFailure(input);
  if (approvalReason !== undefined) {
    earlyReport.status = "blocked";
    earlyReport.reasonCodes.push(approvalReason);
    return earlyReport;
  }
  const unsafeReason = findUnsafeSideEffect(input);
  if (unsafeReason !== undefined) {
    earlyReport.status = "blocked";
    earlyReport.reasonCodes.push(unsafeReason);
    return earlyReport;
  }

  const messages = sanitizeUsageMessages(input.messageTexts);
  if (messages.length < 1) {
    earlyReport.status = "degraded";
    earlyReport.reasonCodes.push("usage_messages_invalid");
    return earlyReport;
  }

  const start = await startMemoryProviderVectorDeveloperAlphaContinuousSession(
    input
  );
  if (!start.session) {
    return start.report;
  }

  for (const message of messages) {
    const observation = await start.session.sendMessage(message);
    if (
      observation.status !== "ok" &&
      (input.stopOnDegraded ?? true)
    ) {
      return start.session.getReport();
    }
  }

  return start.session.stop();
}

function createSession(input: {
  env: Readonly<Record<string, string | undefined>>;
  maxMessages: number;
  stopOnDegraded: boolean;
  timeoutMs: number;
  memoryDatabasePath: string;
  transport: MemoryProviderVectorDeveloperAlphaContinuousTransport;
  rollbackProviderVectors: (
    input: MemoryProviderVectorDeveloperAlphaContinuousRollbackInput
  ) => Promise<MemoryProviderVectorDeveloperAlphaContinuousRollbackResult>;
  report: MemoryProviderVectorDeveloperAlphaContinuousReport;
}): MemoryProviderVectorDeveloperAlphaContinuousSession {
  const acceptedMessageIds: string[] = [];
  let finalReport: MemoryProviderVectorDeveloperAlphaContinuousReport | undefined;
  let stopPromise:
    | Promise<MemoryProviderVectorDeveloperAlphaContinuousReport>
    | undefined;

  const sendMessage = async (
    text: string
  ): Promise<MemoryProviderVectorDeveloperAlphaContinuousObservation> => {
    if (finalReport) {
      return createSessionStateObservation(finalReport);
    }
    const gateReason = findMissingGate(input.env);
    if (gateReason !== undefined) {
      input.report.reasonCodes.push(gateReason);
      await stop("continuous_alpha_opt_in_missing");
      return {
        status: "blocked",
        mode: "unknown",
        matchCount: 0,
        queryDimensions: 0,
        reasonCodes: [gateReason]
      };
    }

    if (input.report.messageCount >= input.maxMessages) {
      input.report.reasonCodes.push("usage_messages_invalid");
      await stop("message_limit_reached");
      return {
        status: "blocked",
        mode: "unknown",
        matchCount: 0,
        queryDimensions: 0,
        reasonCodes: ["usage_messages_invalid"]
      };
    }

    const sanitizedText = sanitizeUsageMessage(text);
    if (sanitizedText === undefined) {
      input.report.reasonCodes.push("usage_messages_invalid");
      await stop("usage_message_invalid");
      return {
        status: "blocked",
        mode: "unknown",
        matchCount: 0,
        queryDimensions: 0,
        reasonCodes: ["usage_messages_invalid"]
      };
    }

    input.report.messageCount += 1;
    try {
      const result = await input.transport.sendMessage(
        sanitizedText,
        input.timeoutMs
      );
      const observation = createObservation(result.recall);
      input.report.observationCount += 1;
      if (!result.accepted || result.messageId === undefined) {
        input.report.reasonCodes.push("core_host_message_failed");
        await stop("message_failed");
        return {
          ...observation,
          status: "degraded",
          reasonCodes: ["core_host_message_failed"]
        };
      }

      acceptedMessageIds.push(result.messageId);
      input.report.acceptedMessageCount += 1;
      addRecallObservation(input.report, observation);
      if (observation.status === "degraded") {
        input.report.reasonCodes.push("provider_vector_retrieval_degraded");
        if (input.stopOnDegraded) {
          await stop("degraded_recall");
        }
      }
      return observation;
    } catch {
      input.report.reasonCodes.push("core_host_message_failed");
      await stop("message_failed");
      return {
        status: "degraded",
        mode: "unknown",
        matchCount: 0,
        queryDimensions: 0,
        reasonCodes: ["core_host_message_failed"]
      };
    }
  };

  const stop = async (
    reason: MemoryProviderVectorDeveloperAlphaContinuousStopReason = "completed"
  ): Promise<MemoryProviderVectorDeveloperAlphaContinuousReport> => {
    if (finalReport) {
      return finalReport;
    }
    if (stopPromise) {
      return stopPromise;
    }

    stopPromise = (async () => {
      input.report.sessionState =
        reason === "disabled_by_operator" ? "disabled" : "stopped";
      input.report.stopReason = reason;

      let cleanupStatus: "passed" | "degraded" = "passed";
      try {
        cleanupStatus = await input.transport.close();
      } catch {
        cleanupStatus = "degraded";
      }
      if (cleanupStatus !== "passed") {
        input.report.reasonCodes.push("core_host_cleanup_failed");
      }

      if (acceptedMessageIds.length > 0) {
        try {
          const rollback = await input.rollbackProviderVectors({
            memoryDatabasePath: input.memoryDatabasePath,
            sourceIds: acceptedMessageIds
          });
          input.report.providerVectorWriteCount = rollback.vectorWriteCount;
          input.report.providerVectorDimensionCount = rollback.dimensionCount;
          input.report.rollbackDeletedCount = rollback.deletedCount;
          input.report.rollbackStatus =
            rollback.cleanupStatus === "passed" ? "passed" : "degraded";
          if (rollback.cleanupStatus !== "passed") {
            input.report.reasonCodes.push("provider_vector_rollback_failed");
          }
          if (rollback.deletedCount !== acceptedMessageIds.length) {
            input.report.reasonCodes.push("provider_vector_rollback_failed");
          }
          if (rollback.vectorWriteCount !== acceptedMessageIds.length) {
            input.report.reasonCodes.push("provider_vector_write_missing");
          }
        } catch {
          input.report.rollbackStatus = "degraded";
          input.report.reasonCodes.push("provider_vector_rollback_failed");
        }
      } else {
        input.report.rollbackStatus = "passed";
      }

      input.report.cleanupStatus =
        cleanupStatus === "passed" &&
        input.report.rollbackStatus !== "degraded"
          ? "passed"
          : "degraded";
      if (input.report.cleanupStatus !== "passed") {
        input.report.reasonCodes.push("core_host_cleanup_failed");
      }

      const uniqueReasonCodes = [
        ...new Set(input.report.reasonCodes)
      ] as MemoryProviderVectorDeveloperAlphaContinuousReasonCode[];
      input.report.reasonCodes = uniqueReasonCodes;
      input.report.status =
        input.report.reasonCodes.length > 0
          ? "degraded"
          : reason === "completed"
            ? "passed"
            : reason === "disabled_by_operator"
              ? "stopped"
              : "degraded";
      input.report.accepted = input.report.status === "passed";
      finalReport = input.report;
      return finalReport;
    })();

    return stopPromise;
  };

  return {
    sendMessage,
    stop,
    disable: () => stop("disabled_by_operator"),
    getReport: () => finalReport ?? input.report
  };
}

function createInitialReport(): MemoryProviderVectorDeveloperAlphaContinuousReport {
  return {
    phase: "8.31",
    mode: "provider_vector_retrieval_developer_alpha_continuous_usage_session",
    status: "degraded",
    accepted: false,
    sessionState: "not_started",
    messageCount: 0,
    acceptedMessageCount: 0,
    observationCount: 0,
    providerVectorWriteCount: 0,
    providerVectorDimensionCount: 0,
    recallStatus: "unknown",
    recallMode: "unknown",
    recallMatchCount: 0,
    queryDimensionCount: 0,
    stopReason: "not_started",
    rollbackStatus: "not_started",
    rollbackDeletedCount: 0,
    cleanupStatus: "not_started",
    rawVectorsExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathExposed: false,
    signedUrlOrCredentialPersisted: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    historicalBatchIndexingEnabled: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    modelOutputShellExecutionEnabled: false,
    reasonCodes: []
  };
}

function findApprovalFailure(
  input: MemoryProviderVectorDeveloperAlphaContinuousInput
): MemoryProviderVectorDeveloperAlphaContinuousReasonCode | undefined {
  if (
    input.productApprovalGranted !== true ||
    input.securityApprovalGranted !== true ||
    input.releaseApprovalGranted !== true
  ) {
    return "usage_not_approved";
  }
  if (input.phase830PreflightComplete !== true) {
    return "phase830_preflight_missing";
  }
  return undefined;
}

function findUnsafeSideEffect(
  input: MemoryProviderVectorDeveloperAlphaContinuousInput
): MemoryProviderVectorDeveloperAlphaContinuousReasonCode | undefined {
  return input.rawVectorsExposed === true ||
    input.rawTextExposed === true ||
    input.rawDiagnosticsExposed === true ||
    input.privatePathExposed === true ||
    input.signedUrlOrCredentialPersisted === true ||
    input.downloadsEnabled === true ||
    input.persistentCacheWritesEnabled === true ||
    input.historicalBatchIndexingEnabled === true ||
    input.sqliteSchemaMigrationEnabled === true ||
    input.desktopIpcChanged === true ||
    input.uiBehaviorChanged === true ||
    input.providerVisibilityChanged === true ||
    input.defaultOptInChanged === true ||
    input.modelOutputShellExecutionEnabled === true
    ? "unsafe_side_effect_requested"
    : undefined;
}

function findMissingGate(
  env: Readonly<Record<string, string | undefined>>
): MemoryProviderVectorDeveloperAlphaContinuousReasonCode | undefined {
  const checks: readonly [
    MemoryProviderVectorDeveloperAlphaContinuousReasonCode,
    boolean
  ][] = [
    [
      "continuous_alpha_opt_in_missing",
      isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled(env)
    ],
    [
      "memory_retrieval_routing_opt_in_missing",
      isExactOptIn(env, MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV)
    ],
    [
      "provider_query_vector_opt_in_missing",
      isExactOptIn(env, MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV)
    ],
    [
      "provider_vector_write_opt_in_missing",
      isExactOptIn(env, MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV)
    ],
    [
      "provider_vector_read_opt_in_missing",
      isExactOptIn(env, MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV)
    ],
    [
      "provider_opt_in_missing",
      isLocalEmbeddingProviderOptInEnabled(env)
    ],
    [
      "provider_execution_opt_in_missing",
      isLocalEmbeddingProviderExecutionOptInEnabled(env)
    ]
  ];
  for (const [reasonCode, enabled] of checks) {
    if (!enabled) {
      return reasonCode;
    }
  }
  if (readRuntimePythonExecutable(env) === undefined) {
    return "runtime_python_missing";
  }
  if (readLocalEmbeddingModelDirectory(env) === undefined) {
    return "model_directory_missing";
  }
  if (readMemoryDatabasePath(env) === undefined) {
    return "memory_database_path_missing";
  }
  return undefined;
}

function sanitizeUsageMessages(
  messages: readonly string[] | undefined
): string[] {
  if (!Array.isArray(messages)) {
    return [];
  }
  if (
    messages.length < 1 ||
    messages.length >
      MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_CONTINUOUS_MAX_MESSAGES
  ) {
    return [];
  }
  const sanitized = messages.map((message) => sanitizeUsageMessage(message));
  return sanitized.every(
    (message): message is string => message !== undefined
  )
    ? sanitized
    : [];
}

function sanitizeUsageMessage(text: string): string | undefined {
  if (typeof text !== "string") {
    return undefined;
  }
  const sanitized = text
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 500)
    .trim();
  return sanitized.length > 0 ? sanitized : undefined;
}

function readMemoryDatabasePath(
  env: Readonly<Record<string, string | undefined>>
): string | undefined {
  const value = env[MEMORY_DATABASE_PATH_ENV]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function isExactOptIn(
  env: Readonly<Record<string, string | undefined>>,
  key: string
): boolean {
  return env[key]?.trim() === "1";
}

function createSafeCoreHostChildEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  memoryDatabasePath: string
): Readonly<Record<string, string | undefined>> {
  const allowedSystemKeys = [
    "PATH",
    "SystemRoot",
    "WINDIR",
    "ComSpec",
    "OS",
    "TEMP",
    "TMP",
    "LOCALAPPDATA",
    "USERPROFILE",
    "HOMEDRIVE",
    "HOMEPATH",
    "NUMBER_OF_PROCESSORS",
    "PROCESSOR_ARCHITECTURE"
  ];
  const safeEnv: Record<string, string | undefined> = {};
  for (const key of allowedSystemKeys) {
    if (env[key] !== undefined) {
      safeEnv[key] = env[key];
    }
  }
  for (const key of [
    MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
    MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV,
    MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV,
    MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV,
    MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV,
    LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV,
    LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
    LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
    LOCAL_EMBEDDING_MODEL_DIR_ENV
  ]) {
    if (env[key] !== undefined) {
      safeEnv[key] = env[key];
    }
  }
  safeEnv[MEMORY_DATABASE_PATH_ENV] = memoryDatabasePath;
  return safeEnv;
}

async function createCoreHostContinuousTransport(
  input: MemoryProviderVectorDeveloperAlphaContinuousTransportInput
): Promise<MemoryProviderVectorDeveloperAlphaContinuousTransport> {
  const child = fork(input.coreHostScriptPath, [], {
    env: sanitizeProcessEnv(input.env),
    stdio: ["ignore", "ignore", "ignore", "ipc"]
  });
  return createTransportForChild(child);
}

function createTransportForChild(
  child: ChildProcess
): MemoryProviderVectorDeveloperAlphaContinuousTransport {
  return {
    waitUntilReady: (timeoutMs) => waitForCoreHostReady(child, timeoutMs),
    sendMessage: (text, timeoutMs) =>
      sendMessageCommand(child, text, timeoutMs),
    close: () => closeCoreHostChild(child)
  };
}

function sanitizeProcessEnv(
  env: Readonly<Record<string, string | undefined>>
): NodeJS.ProcessEnv {
  const nextEnv: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) {
      nextEnv[key] = value;
    }
  }
  return nextEnv;
}

function sanitizeCommandResult(
  rawResult: CommandResult
): {
  accepted: boolean;
  messageId?: string;
  recall: MemoryProviderVectorDeveloperAlphaContinuousRecall;
} {
  const result = CommandResultSchema.parse(rawResult);
  if (!result.ok || !isRecord(result.data)) {
    return {
      accepted: false,
      recall: { status: "degraded" }
    };
  }
  const messageId =
    typeof result.data.messageId === "string"
      ? result.data.messageId
      : undefined;
  return {
    accepted: result.data.accepted === true,
    ...(messageId === undefined ? {} : { messageId }),
    recall: sanitizeRecall(result.data.memoryRecall)
  };
}

function sanitizeRecall(
  value: unknown
): MemoryProviderVectorDeveloperAlphaContinuousRecall {
  if (!isRecord(value)) {
    return { status: "degraded" };
  }
  const status =
    value.status === "ok" || value.status === "degraded"
      ? value.status
      : "degraded";
  const matchCount =
    typeof value.matchCount === "number" &&
    Number.isInteger(value.matchCount) &&
    value.matchCount >= 0 &&
    value.matchCount <= 5
      ? value.matchCount
      : undefined;
  const queryDimensions =
    typeof value.queryDimensions === "number" &&
    Number.isInteger(value.queryDimensions) &&
    value.queryDimensions >= 0 &&
    value.queryDimensions <= 8192
      ? value.queryDimensions
      : undefined;
  return {
    status,
    ...(value.mode === "provider_vector"
      ? { mode: value.mode }
      : {}),
    ...(matchCount === undefined ? {} : { matchCount }),
    ...(queryDimensions === undefined ? {} : { queryDimensions })
  };
}

function createObservation(
  recall: MemoryProviderVectorDeveloperAlphaContinuousRecall
): MemoryProviderVectorDeveloperAlphaContinuousObservation {
  return {
    status: recall.status,
    mode: recall.mode ?? "unknown",
    matchCount: recall.matchCount ?? 0,
    queryDimensions: recall.queryDimensions ?? 0,
    reasonCodes:
      recall.status === "ok"
        ? []
        : ["provider_vector_retrieval_degraded"]
  };
}

function createSessionStateObservation(
  report: MemoryProviderVectorDeveloperAlphaContinuousReport
): MemoryProviderVectorDeveloperAlphaContinuousObservation {
  const reasonCode =
    report.status === "blocked"
      ? "session_disabled"
      : "session_stopped";
  return {
    status: "blocked",
    mode: report.recallMode,
    matchCount: 0,
    queryDimensions: 0,
    reasonCodes: [reasonCode]
  };
}

function addRecallObservation(
  report: MemoryProviderVectorDeveloperAlphaContinuousReport,
  observation: MemoryProviderVectorDeveloperAlphaContinuousObservation
): void {
  if (observation.mode === "provider_vector") {
    report.recallMode = "provider_vector";
  }
  if (observation.status === "ok") {
    report.recallStatus = "ok";
  } else if (report.recallStatus === "unknown") {
    report.recallStatus = "degraded";
  }
  report.recallMatchCount = Math.max(
    report.recallMatchCount,
    observation.matchCount
  );
  report.queryDimensionCount = Math.max(
    report.queryDimensionCount,
    observation.queryDimensions
  );
}

function waitForCoreHostReady(
  child: ChildProcess,
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("core_host_startup_failed"));
    }, timeoutMs);
    const cleanup = (): void => {
      clearTimeout(timer);
      child.off("message", onMessage);
      child.off("exit", onExit);
      child.off("error", onError);
    };
    const onMessage = (message: unknown): void => {
      const parsed = CoreOutboundMessageSchema.safeParse(message);
      if (
        parsed.success &&
        parsed.data.kind === "event" &&
        parsed.data.envelope.event.type === "system.core.ready"
      ) {
        cleanup();
        resolve();
      }
    };
    const onExit = (): void => {
      cleanup();
      reject(new Error("core_host_startup_failed"));
    };
    const onError = (): void => {
      cleanup();
      reject(new Error("core_host_startup_failed"));
    };
    child.on("message", onMessage);
    child.once("exit", onExit);
    child.once("error", onError);
  });
}

function sendMessageCommand(
  child: ChildProcess,
  text: string,
  timeoutMs: number
): Promise<{
  accepted: boolean;
  messageId?: string;
  recall: MemoryProviderVectorDeveloperAlphaContinuousRecall;
}> {
  return new Promise((resolve, reject) => {
    const envelope = createCommandEnvelope({
      type: "agent.sendMessage",
      payload: {
        conversationId: "primary",
        text
      }
    });
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("core_host_message_failed"));
    }, timeoutMs);
    const cleanup = (): void => {
      clearTimeout(timer);
      child.off("message", onMessage);
      child.off("exit", onExit);
      child.off("error", onError);
    };
    const onMessage = (message: unknown): void => {
      const parsed = CoreOutboundMessageSchema.safeParse(message);
      if (
        !parsed.success ||
        parsed.data.kind !== "result" ||
        parsed.data.envelope.commandId !== envelope.commandId
      ) {
        return;
      }
      cleanup();
      try {
        resolve(sanitizeCommandResult(parsed.data.envelope));
      } catch {
        reject(new Error("core_host_message_failed"));
      }
    };
    const onExit = (): void => {
      cleanup();
      reject(new Error("core_host_message_failed"));
    };
    const onError = (): void => {
      cleanup();
      reject(new Error("core_host_message_failed"));
    };
    child.on("message", onMessage);
    child.once("exit", onExit);
    child.once("error", onError);
    child.send({ kind: "command", envelope }, (error) => {
      if (error) {
        cleanup();
        reject(new Error("core_host_message_failed"));
      }
    });
  });
}

async function closeCoreHostChild(
  child: ChildProcess
): Promise<"passed" | "degraded"> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return "passed";
  }
  if (child.connected) {
    child.disconnect();
  }
  if (!child.kill()) {
    return child.exitCode !== null || child.signalCode !== null
      ? "passed"
      : "degraded";
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve("degraded"), 5_000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve("passed");
    });
  });
}

function resolveCoreHostScriptPath(): string {
  return path.resolve(__dirname, "index.js");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
