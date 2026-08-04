import { fork, type ChildProcess } from "node:child_process";
import path from "node:path";
import {
  CommandResultSchema,
  CoreOutboundMessageSchema,
  createCommandEnvelope,
  type CommandResult
} from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import {
  isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled,
  MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV
} from "./memory-provider-vector-retrieval-developer-alpha-plan";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
  readLocalEmbeddingModelDirectory,
  readRuntimePythonExecutable,
  verifyLocalEmbeddingModelArtifacts
} from "./local-embedding-runtime-session-factory";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV } from "./memory-provider-vector-retrieval-preflight";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "./memory-provider-vector-write-approval-gate";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "./core-memory-retrieval-env-wiring-approval-gate";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "./memory-retrieval-provider-query-vector-approval-gate";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "./local-embedding-composition";

export const MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_USAGE_MAX_MESSAGES = 5;
export const MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_USAGE_DEFAULT_TIMEOUT_MS =
  180_000;

const MEMORY_DATABASE_PATH_ENV = "JARVIS_K_MEMORY_DB_PATH";

export type MemoryProviderVectorDeveloperAlphaUsageStatus =
  | "blocked"
  | "degraded"
  | "passed";

export type MemoryProviderVectorDeveloperAlphaUsageReasonCode =
  | "usage_not_approved"
  | "developer_alpha_opt_in_missing"
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
  | "artifact_verification_failed"
  | "core_host_startup_failed"
  | "core_host_message_failed"
  | "core_host_cleanup_failed"
  | "provider_vector_write_missing"
  | "provider_vector_rollback_failed"
  | "provider_vector_retrieval_missing"
  | "provider_vector_retrieval_degraded"
  | "unsafe_side_effect_requested";

export interface MemoryProviderVectorDeveloperAlphaUsageRecall {
  status: "ok" | "degraded";
  mode?: "provider_vector";
  matchCount?: number;
  queryDimensions?: number;
}

export interface MemoryProviderVectorDeveloperAlphaUsageProductPathInput {
  messageTexts: readonly string[];
  timeoutMs: number;
  coreHostScriptPath: string;
  env: Readonly<Record<string, string | undefined>>;
}

export interface MemoryProviderVectorDeveloperAlphaUsageProductPathResult {
  ok: boolean;
  acceptedMessageIds: readonly string[];
  recalls: readonly MemoryProviderVectorDeveloperAlphaUsageRecall[];
  cleanupStatus: "passed" | "degraded";
  reasonCode?: MemoryProviderVectorDeveloperAlphaUsageReasonCode;
}

export interface MemoryProviderVectorDeveloperAlphaUsageRollbackInput {
  memoryDatabasePath: string;
  sourceIds: readonly string[];
}

export interface MemoryProviderVectorDeveloperAlphaUsageRollbackResult {
  vectorWriteCount: number;
  dimensionCount: number;
  deletedCount: number;
  cleanupStatus: "passed" | "degraded";
}

export interface MemoryProviderVectorDeveloperAlphaUsageInput {
  env?: Readonly<Record<string, string | undefined>>;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  releaseApprovalGranted?: boolean;
  phase827ImplementationComplete?: boolean;
  messageTexts?: readonly string[];
  timeoutMs?: number;
  coreHostScriptPath?: string;
  verifyModelArtifacts?: (modelDirectory: string) => Promise<void>;
  executeProductPath?: (
    input: MemoryProviderVectorDeveloperAlphaUsageProductPathInput
  ) => Promise<MemoryProviderVectorDeveloperAlphaUsageProductPathResult>;
  rollbackProviderVectors?: (
      input: MemoryProviderVectorDeveloperAlphaUsageRollbackInput
  ) => Promise<MemoryProviderVectorDeveloperAlphaUsageRollbackResult>;
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

export interface MemoryProviderVectorDeveloperAlphaUsageReport {
  phase: "8.29";
  mode: "provider_vector_retrieval_developer_alpha_usage_session";
  status: MemoryProviderVectorDeveloperAlphaUsageStatus;
  accepted: boolean;
  messageCount: number;
  acceptedMessageCount: number;
  providerVectorWriteCount: number;
  providerVectorDimensionCount: number;
  recallStatus: "unknown" | "ok" | "degraded";
  recallMode: "unknown" | "provider_vector";
  recallMatchCount: number;
  queryDimensionCount: number;
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
  reasonCodes: MemoryProviderVectorDeveloperAlphaUsageReasonCode[];
}

export async function runMemoryProviderVectorDeveloperAlphaUsage(
  input: MemoryProviderVectorDeveloperAlphaUsageInput = {}
): Promise<MemoryProviderVectorDeveloperAlphaUsageReport> {
  const report = createInitialReport();
  const env = input.env ?? process.env;
  const messageTexts = sanitizeUsageMessages(input.messageTexts);
  report.messageCount = messageTexts.length;

  const approvalReason = findApprovalFailure(input);
  if (approvalReason !== undefined) {
    report.status = "blocked";
    report.reasonCodes.push(approvalReason);
    return report;
  }

  const unsafeReason = findUnsafeSideEffect(input);
  if (unsafeReason !== undefined) {
    report.status = "blocked";
    report.reasonCodes.push(unsafeReason);
    return report;
  }

  const gateReason = findMissingGate(env);
  if (gateReason !== undefined) {
    report.status = "degraded";
    report.reasonCodes.push(gateReason);
    return report;
  }
  if (messageTexts.length < 1) {
    report.status = "degraded";
    report.reasonCodes.push("usage_messages_invalid");
    return report;
  }

  const memoryDatabasePath = readMemoryDatabasePath(env);
  if (memoryDatabasePath === undefined) {
    report.status = "degraded";
    report.reasonCodes.push("memory_database_path_missing");
    return report;
  }

  const modelDirectory = readLocalEmbeddingModelDirectory(env);
  if (modelDirectory === undefined) {
    report.status = "degraded";
    report.reasonCodes.push("model_directory_missing");
    return report;
  }

  try {
    await (input.verifyModelArtifacts ?? verifyLocalEmbeddingModelArtifacts)(
      modelDirectory
    );
  } catch {
    report.status = "degraded";
    report.reasonCodes.push("artifact_verification_failed");
    return report;
  }

  let productResult: MemoryProviderVectorDeveloperAlphaUsageProductPathResult;
  try {
    productResult = await (
      input.executeProductPath ??
      runCoreHostMemoryProviderVectorDeveloperAlphaProductPath
    )({
      messageTexts,
      timeoutMs:
        input.timeoutMs ??
        MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_USAGE_DEFAULT_TIMEOUT_MS,
      coreHostScriptPath:
        input.coreHostScriptPath ?? resolveCoreHostScriptPath(),
      env: createSafeCoreHostChildEnvironment(env, memoryDatabasePath)
    });
  } catch {
    report.status = "degraded";
    report.reasonCodes.push("core_host_message_failed");
    return report;
  }

  report.acceptedMessageCount = productResult.acceptedMessageIds.length;
  report.cleanupStatus = productResult.cleanupStatus;
  addRecallObservations(report, productResult.recalls);
  if (productResult.reasonCode !== undefined) {
    report.reasonCodes.push(productResult.reasonCode);
  }

  try {
    const rollback = await (
      input.rollbackProviderVectors ?? rollbackProviderVectorRecords
    )({
      memoryDatabasePath,
      sourceIds: productResult.acceptedMessageIds
    });
    report.providerVectorWriteCount = rollback.vectorWriteCount;
    report.providerVectorDimensionCount = rollback.dimensionCount;
    report.rollbackDeletedCount = rollback.deletedCount;
    report.rollbackStatus =
      rollback.cleanupStatus === "passed" ? "passed" : "degraded";
    if (rollback.cleanupStatus !== "passed") {
      report.cleanupStatus = "degraded";
      report.reasonCodes.push("provider_vector_rollback_failed");
    }
  } catch {
    report.rollbackStatus = "degraded";
    report.cleanupStatus = "degraded";
    report.reasonCodes.push("provider_vector_rollback_failed");
  }

  if (report.cleanupStatus !== "passed") {
    report.status = "degraded";
    if (!report.reasonCodes.includes("core_host_cleanup_failed")) {
      report.reasonCodes.push("core_host_cleanup_failed");
    }
    return report;
  }
  if (
    productResult.acceptedMessageIds.length !== messageTexts.length ||
    report.providerVectorWriteCount !== messageTexts.length
  ) {
    report.status = "degraded";
    report.reasonCodes.push("provider_vector_write_missing");
    return report;
  }
  if (report.recallMode !== "provider_vector") {
    report.status = "degraded";
    report.reasonCodes.push("provider_vector_retrieval_missing");
    return report;
  }
  if (report.recallStatus !== "ok") {
    report.status = "degraded";
    report.reasonCodes.push("provider_vector_retrieval_degraded");
    return report;
  }

  report.status = "passed";
  report.accepted = true;
  return report;
}

export async function runCoreHostMemoryProviderVectorDeveloperAlphaProductPath(
  input: MemoryProviderVectorDeveloperAlphaUsageProductPathInput
): Promise<MemoryProviderVectorDeveloperAlphaUsageProductPathResult> {
  const child = fork(input.coreHostScriptPath, [], {
    env: sanitizeProcessEnv(input.env),
    stdio: ["ignore", "ignore", "ignore", "ipc"]
  });
  const acceptedMessageIds: string[] = [];
  const recalls: MemoryProviderVectorDeveloperAlphaUsageRecall[] = [];
  let cleanupStatus: "passed" | "degraded" = "passed";
  let reasonCode:
    | MemoryProviderVectorDeveloperAlphaUsageReasonCode
    | undefined;

  try {
    await waitForCoreHostReady(child, input.timeoutMs);
    for (const text of input.messageTexts) {
      const result = await sendMessageCommand(child, text, input.timeoutMs);
      const sanitized = sanitizeMessageResult(result);
      if (!sanitized.accepted || sanitized.messageId === undefined) {
        reasonCode = "core_host_message_failed";
        break;
      }
      acceptedMessageIds.push(sanitized.messageId);
      recalls.push(sanitized.recall);
    }
  } catch {
    reasonCode ??= "core_host_message_failed";
  } finally {
    cleanupStatus = await closeCoreHostChild(child);
    if (cleanupStatus !== "passed") {
      reasonCode = "core_host_cleanup_failed";
    }
  }

  return {
    ok:
      reasonCode === undefined &&
      acceptedMessageIds.length === input.messageTexts.length,
    acceptedMessageIds,
    recalls,
    cleanupStatus,
    ...(reasonCode === undefined ? {} : { reasonCode })
  };
}

export async function rollbackProviderVectorRecords(
  input: MemoryProviderVectorDeveloperAlphaUsageRollbackInput
): Promise<MemoryProviderVectorDeveloperAlphaUsageRollbackResult> {
  const repository = new SqliteMemoryRepository({
    filePath: input.memoryDatabasePath,
    allowedEmbeddingModelIds: [LOCAL_EMBEDDING_MODEL_ID]
  });
  let vectorWriteCount = 0;
  let dimensionCount = 0;
  let deletedCount = 0;
  try {
    await repository.initialize();
    for (const sourceId of input.sourceIds) {
      const metadata = await repository.inspectEmbeddingRecordMetadata({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        sourceType: "message",
        sourceId
      });
      if (metadata.status !== "ok") {
        return {
          vectorWriteCount,
          dimensionCount,
          deletedCount,
          cleanupStatus: "degraded"
        };
      }
      vectorWriteCount += metadata.recordCount;
      dimensionCount = Math.max(dimensionCount, metadata.dimensionCount);
      const deleted = await repository.deleteEmbeddingRecordsForSource({
        modelId: LOCAL_EMBEDDING_MODEL_ID,
        sourceType: "message",
        sourceId
      });
      if (deleted.status !== "accepted") {
        return {
          vectorWriteCount,
          dimensionCount,
          deletedCount,
          cleanupStatus: "degraded"
        };
      }
      deletedCount += deleted.deletedCount;
    }
    return {
      vectorWriteCount,
      dimensionCount,
      deletedCount,
      cleanupStatus: "passed"
    };
  } finally {
    await repository.close().catch(() => undefined);
  }
}

function createInitialReport(): MemoryProviderVectorDeveloperAlphaUsageReport {
  return {
    phase: "8.29",
    mode: "provider_vector_retrieval_developer_alpha_usage_session",
    status: "degraded",
    accepted: false,
    messageCount: 0,
    acceptedMessageCount: 0,
    providerVectorWriteCount: 0,
    providerVectorDimensionCount: 0,
    recallStatus: "unknown",
    recallMode: "unknown",
    recallMatchCount: 0,
    queryDimensionCount: 0,
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
  input: MemoryProviderVectorDeveloperAlphaUsageInput
): MemoryProviderVectorDeveloperAlphaUsageReasonCode | undefined {
  return input.productApprovalGranted === true &&
    input.securityApprovalGranted === true &&
    input.releaseApprovalGranted === true &&
    input.phase827ImplementationComplete === true
    ? undefined
    : "usage_not_approved";
}

function findUnsafeSideEffect(
  input: MemoryProviderVectorDeveloperAlphaUsageInput
): MemoryProviderVectorDeveloperAlphaUsageReasonCode | undefined {
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
): MemoryProviderVectorDeveloperAlphaUsageReasonCode | undefined {
  const checks: readonly [
    string,
    MemoryProviderVectorDeveloperAlphaUsageReasonCode,
    boolean
  ][] = [
    [
      MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
      "developer_alpha_opt_in_missing",
      isMemoryProviderVectorRetrievalDeveloperAlphaOptInEnabled(env)
    ],
    [
      MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV,
      "memory_retrieval_routing_opt_in_missing",
      isExactOptIn(env, MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV)
    ],
    [
      MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV,
      "provider_query_vector_opt_in_missing",
      isExactOptIn(env, MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV)
    ],
    [
      MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV,
      "provider_vector_write_opt_in_missing",
      isExactOptIn(env, MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV)
    ],
    [
      MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV,
      "provider_vector_read_opt_in_missing",
      isExactOptIn(env, MEMORY_PROVIDER_VECTOR_RETRIEVAL_OPT_IN_ENV)
    ],
    [
      LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV,
      "provider_opt_in_missing",
      isExactOptIn(env, LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV)
    ],
    [
      LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
      "provider_execution_opt_in_missing",
      isExactOptIn(env, LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV)
    ]
  ];
  for (const [, reasonCode, enabled] of checks) {
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
    messages.length > MEMORY_PROVIDER_VECTOR_DEVELOPER_ALPHA_USAGE_MAX_MESSAGES
  ) {
    return [];
  }
  const sanitized = messages.map((message) =>
    message
      .replace(/[\u0000-\u001f\u007f]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim()
      .slice(0, 500)
      .trim()
  );
  return sanitized.every((message) => message.length > 0) ? sanitized : [];
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

function sanitizeMessageResult(rawResult: CommandResult): {
  accepted: boolean;
  messageId?: string;
  recall: MemoryProviderVectorDeveloperAlphaUsageRecall;
} {
  const result = CommandResultSchema.parse(rawResult);
  if (!result.ok || !isRecord(result.data)) {
    return {
      accepted: false,
      recall: { status: "degraded" }
    };
  }
  const messageId =
    typeof result.data.messageId === "string" ? result.data.messageId : undefined;
  const recall = sanitizeRecall(result.data.memoryRecall);
  return {
    accepted: result.data.accepted === true,
    ...(messageId === undefined ? {} : { messageId }),
    recall
  };
}

function sanitizeRecall(value: unknown): MemoryProviderVectorDeveloperAlphaUsageRecall {
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

function addRecallObservations(
  report: MemoryProviderVectorDeveloperAlphaUsageReport,
  recalls: readonly MemoryProviderVectorDeveloperAlphaUsageRecall[]
): void {
  for (const recall of recalls) {
    if (recall.mode === "provider_vector") {
      report.recallMode = "provider_vector";
    }
    if (recall.status === "ok") {
      report.recallStatus = "ok";
    } else if (report.recallStatus === "unknown") {
      report.recallStatus = "degraded";
    }
    if (recall.matchCount !== undefined) {
      report.recallMatchCount = Math.max(
        report.recallMatchCount,
        recall.matchCount
      );
    }
    if (recall.queryDimensions !== undefined) {
      report.queryDimensionCount = Math.max(
        report.queryDimensionCount,
        recall.queryDimensions
      );
    }
  }
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
): Promise<CommandResult> {
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
      resolve(parsed.data.envelope);
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
