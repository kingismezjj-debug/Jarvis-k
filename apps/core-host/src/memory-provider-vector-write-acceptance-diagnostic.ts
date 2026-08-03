import { fork, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  CommandResultSchema,
  CoreOutboundMessageSchema,
  createCommandEnvelope,
  type CommandResult
} from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import {
  SqliteMemoryRepository,
  type EmbeddingRecordMetadataInspection
} from "@jarvis-k/memory-sqlite";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "./core-memory-retrieval-env-wiring-approval-gate";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "./local-embedding-composition";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
  readLocalEmbeddingModelDirectory,
  readRuntimePythonExecutable,
  verifyLocalEmbeddingModelArtifacts
} from "./local-embedding-runtime-session-factory";
import { MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV } from "./memory-provider-vector-write-approval-gate";

export const MEMORY_PROVIDER_VECTOR_WRITE_ACCEPTANCE_ENV =
  "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITE_ACCEPTANCE";

export type MemoryProviderVectorWriteAcceptanceStatus =
  | "blocked"
  | "degraded"
  | "passed";

export type MemoryProviderVectorWriteAcceptanceReasonCode =
  | "acceptance_not_approved"
  | "acceptance_opt_in_missing"
  | "phase_8_20_wiring_missing"
  | "memory_retrieval_routing_opt_in_missing"
  | "provider_vector_write_opt_in_missing"
  | "provider_opt_in_missing"
  | "provider_execution_opt_in_missing"
  | "runtime_python_missing"
  | "model_directory_missing"
  | "unsafe_side_effect_requested"
  | "artifact_verification_failed"
  | "core_host_startup_failed"
  | "core_host_command_failed"
  | "vector_write_missing"
  | "vector_write_degraded"
  | "vector_dimensions_invalid"
  | "core_host_cleanup_failed";

export interface MemoryProviderVectorWriteAcceptanceInput {
  env?: Readonly<Record<string, string | undefined>>;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase820ProviderVectorWriteComplete?: boolean;
  timeoutMs?: number;
  diagnosticMessageText?: string;
  coreHostScriptPath?: string;
  childEnv?: Readonly<Record<string, string | undefined>>;
  temporaryMemoryDatabasePath?: string;
  temporaryModelDirectoryPath?: string;
  verifyModelArtifacts?: (modelDirectory: string) => Promise<void>;
  executeProductPath?: (
    input: MemoryProviderVectorWriteProductPathInput
  ) => Promise<MemoryProviderVectorWriteProductPathResult>;
  inspectMemoryWrite?: (
    input: MemoryProviderVectorWriteInspectionInput
  ) => Promise<EmbeddingRecordMetadataInspection>;
  rawVectorsReturned?: boolean;
  rawVectorsLoggedOrExposed?: boolean;
  rawTextExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposureEnabled?: boolean;
  signedUrlOrCredentialPersistenceEnabled?: boolean;
  downloadsEnabled?: boolean;
  persistentCacheWritesEnabled?: boolean;
  phase743VectorsPersisted?: boolean;
  realRuntimeVectorsPersisted?: boolean;
  persistentMemoryVectorDataWritten?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  providerDefaultOptInChanged?: boolean;
  historicalBatchIndexingEnabled?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface MemoryProviderVectorWriteProductPathInput {
  messageText: string;
  timeoutMs: number;
  coreHostScriptPath: string;
  env: Readonly<Record<string, string | undefined>>;
}

export interface MemoryProviderVectorWriteProductPathResult {
  ok: boolean;
  messageId?: string;
}

export interface MemoryProviderVectorWriteInspectionInput {
  memoryDatabasePath: string;
  sourceId: string;
}

export interface MemoryProviderVectorWriteAcceptanceReport {
  phase: "8.21";
  mode: "provider_vector_write_acceptance_diagnostic";
  provider: "embedding.local.qwen3";
  modelId: typeof LOCAL_EMBEDDING_MODEL_ID;
  status: MemoryProviderVectorWriteAcceptanceStatus;
  accepted: boolean;
  productPathCommandCalled: boolean;
  artifactDigestVerification: "not_run" | "passed" | "failed";
  productPathMessage: "not_run" | "passed" | "failed";
  writeStatus: "not_run" | "accepted" | "missing" | "degraded";
  memoryVectorWriteScope: "none" | "temporary_db";
  cleanupStatus: "not_started" | "passed" | "degraded";
  recordCount: number;
  dimensionCount: number;
  rawVectorsReturned: false;
  rawVectorsLoggedOrExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathExposureEnabled: false;
  signedUrlOrCredentialPersistenceEnabled: false;
  downloadsEnabled: false;
  persistentCacheWritesEnabled: false;
  phase743VectorsPersisted: false;
  realRuntimeVectorsPersisted: false;
  persistentMemoryVectorDataWritten: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  providerDefaultOptInChanged: false;
  historicalBatchIndexingEnabled: false;
  modelOutputShellExecutionEnabled: false;
  reasonCodes: MemoryProviderVectorWriteAcceptanceReasonCode[];
}

const DEFAULT_DIAGNOSTIC_MESSAGE =
  "Jarvis-K memory provider vector write acceptance";

export async function runMemoryProviderVectorWriteAcceptanceDiagnostic(
  input: MemoryProviderVectorWriteAcceptanceInput = {}
): Promise<MemoryProviderVectorWriteAcceptanceReport> {
  const report = createInitialReport();
  const unsafeReason = findUnsafeSideEffect(input);
  if (unsafeReason !== undefined) {
    report.status = "blocked";
    report.reasonCodes.push(unsafeReason);
    return report;
  }

  const env = input.env ?? process.env;
  const missingGate = findMissingGate(input, env);
  if (missingGate !== undefined) {
    report.status = "degraded";
    report.reasonCodes.push(missingGate);
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
    report.artifactDigestVerification = "passed";
  } catch {
    report.status = "degraded";
    report.artifactDigestVerification = "failed";
    report.reasonCodes.push("artifact_verification_failed");
    return report;
  }

  try {
    report.productPathCommandCalled = true;
    const productResult = await (
      input.executeProductPath ?? runCoreHostMemoryProviderVectorWriteProductPath
    )({
      messageText: input.diagnosticMessageText ?? DEFAULT_DIAGNOSTIC_MESSAGE,
      timeoutMs: input.timeoutMs ?? 180_000,
      coreHostScriptPath:
        input.coreHostScriptPath ?? resolveCoreHostScriptPath(),
      env: createCoreHostChildEnvironment(input, env)
    });
    report.cleanupStatus = "passed";

    if (!productResult.ok || !isSafeMessageId(productResult.messageId)) {
      report.status = "degraded";
      report.productPathMessage = "failed";
      report.reasonCodes.push("core_host_command_failed");
      return report;
    }
    report.productPathMessage = "passed";

    const memoryDatabasePath = input.temporaryMemoryDatabasePath;
    if (!memoryDatabasePath) {
      report.status = "degraded";
      report.writeStatus = "degraded";
      report.reasonCodes.push("vector_write_degraded");
      return report;
    }

    const inspection = await (
      input.inspectMemoryWrite ?? inspectTemporaryProviderVectorWrite
    )({
      memoryDatabasePath,
      sourceId: productResult.messageId
    });
    report.recordCount = inspection.recordCount;
    report.dimensionCount = inspection.dimensionCount;

    const writeFailureReason = findWriteFailureReason(inspection);
    if (writeFailureReason !== undefined) {
      report.status = "degraded";
      report.writeStatus =
        writeFailureReason === "vector_write_missing"
          ? "missing"
          : "degraded";
      report.reasonCodes.push(writeFailureReason);
      return report;
    }

    report.status = "passed";
    report.accepted = true;
    report.writeStatus = "accepted";
    report.memoryVectorWriteScope = "temporary_db";
    return report;
  } catch (error) {
    report.status = "degraded";
    report.productPathMessage = "failed";
    if (
      error instanceof CoreHostProductPathFailure &&
      error.reasonCode === "core_host_cleanup_failed"
    ) {
      report.cleanupStatus = "degraded";
    }
    report.reasonCodes.push(
      error instanceof CoreHostProductPathFailure
        ? error.reasonCode
        : "core_host_command_failed"
    );
    return report;
  }
}

export async function runCoreHostMemoryProviderVectorWriteProductPath(
  input: MemoryProviderVectorWriteProductPathInput
): Promise<MemoryProviderVectorWriteProductPathResult> {
  const child = fork(input.coreHostScriptPath, [], {
    env: sanitizeProcessEnv(input.env),
    stdio: ["ignore", "ignore", "ignore", "ipc"]
  });
  let closed = false;
  try {
    await waitForCoreHostReady(child, input.timeoutMs);
    const result = await sendMessageCommand(child, input);
    return sanitizeCommandResult(result);
  } finally {
    closed = await closeCoreHostChild(child);
    if (!closed) {
      throw new CoreHostProductPathFailure("core_host_cleanup_failed");
    }
  }
}

export async function inspectTemporaryProviderVectorWrite(
  input: MemoryProviderVectorWriteInspectionInput
): Promise<EmbeddingRecordMetadataInspection> {
  if (!fs.existsSync(input.memoryDatabasePath)) {
    return {
      status: "degraded",
      recordCount: 0,
      dimensionCount: 0,
      reasonCode: "VECTOR_METADATA_QUERY_FAILED"
    };
  }

  const repository = new SqliteMemoryRepository({
    filePath: input.memoryDatabasePath,
    allowedEmbeddingModelIds: [LOCAL_EMBEDDING_MODEL_ID]
  });
  try {
    await repository.initialize();
    return await repository.inspectEmbeddingRecordMetadata({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      sourceType: "message",
      sourceId: input.sourceId
    });
  } catch {
    return {
      status: "degraded",
      recordCount: 0,
      dimensionCount: 0,
      reasonCode: "VECTOR_METADATA_QUERY_FAILED"
    };
  } finally {
    await repository.close().catch(() => undefined);
  }
}

function createInitialReport(): MemoryProviderVectorWriteAcceptanceReport {
  return {
    phase: "8.21",
    mode: "provider_vector_write_acceptance_diagnostic",
    provider: "embedding.local.qwen3",
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    status: "degraded",
    accepted: false,
    productPathCommandCalled: false,
    artifactDigestVerification: "not_run",
    productPathMessage: "not_run",
    writeStatus: "not_run",
    memoryVectorWriteScope: "none",
    cleanupStatus: "not_started",
    recordCount: 0,
    dimensionCount: 0,
    rawVectorsReturned: false,
    rawVectorsLoggedOrExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathExposureEnabled: false,
    signedUrlOrCredentialPersistenceEnabled: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    phase743VectorsPersisted: false,
    realRuntimeVectorsPersisted: false,
    persistentMemoryVectorDataWritten: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    providerDefaultOptInChanged: false,
    historicalBatchIndexingEnabled: false,
    modelOutputShellExecutionEnabled: false,
    reasonCodes: []
  };
}

function findMissingGate(
  input: MemoryProviderVectorWriteAcceptanceInput,
  env: Readonly<Record<string, string | undefined>>
): MemoryProviderVectorWriteAcceptanceReasonCode | undefined {
  if (
    input.productApprovalGranted !== true ||
    input.securityApprovalGranted !== true
  ) {
    return "acceptance_not_approved";
  }
  if (input.phase820ProviderVectorWriteComplete !== true) {
    return "phase_8_20_wiring_missing";
  }
  if (env[MEMORY_PROVIDER_VECTOR_WRITE_ACCEPTANCE_ENV]?.trim() !== "1") {
    return "acceptance_opt_in_missing";
  }
  if (env[MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]?.trim() !== "1") {
    return "memory_retrieval_routing_opt_in_missing";
  }
  if (env[MEMORY_PROVIDER_VECTOR_WRITE_OPT_IN_ENV]?.trim() !== "1") {
    return "provider_vector_write_opt_in_missing";
  }
  if (env[LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]?.trim() !== "1") {
    return "provider_opt_in_missing";
  }
  if (env[LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]?.trim() !== "1") {
    return "provider_execution_opt_in_missing";
  }
  if (readRuntimePythonExecutable(env) === undefined) {
    return "runtime_python_missing";
  }
  if (readLocalEmbeddingModelDirectory(env) === undefined) {
    return "model_directory_missing";
  }
  return undefined;
}

function findUnsafeSideEffect(
  input: MemoryProviderVectorWriteAcceptanceInput
): MemoryProviderVectorWriteAcceptanceReasonCode | undefined {
  return input.rawVectorsReturned === true ||
    input.rawVectorsLoggedOrExposed === true ||
    input.rawTextExposed === true ||
    input.rawDiagnosticsExposed === true ||
    input.privatePathExposureEnabled === true ||
    input.signedUrlOrCredentialPersistenceEnabled === true ||
    input.downloadsEnabled === true ||
    input.persistentCacheWritesEnabled === true ||
    input.phase743VectorsPersisted === true ||
    input.realRuntimeVectorsPersisted === true ||
    input.persistentMemoryVectorDataWritten === true ||
    input.sqliteSchemaMigrationEnabled === true ||
    input.desktopIpcChanged === true ||
    input.uiBehaviorChanged === true ||
    input.providerVisibilityChanged === true ||
    input.providerDefaultOptInChanged === true ||
    input.historicalBatchIndexingEnabled === true ||
    input.modelOutputShellExecutionEnabled === true
    ? "unsafe_side_effect_requested"
    : undefined;
}

function findWriteFailureReason(
  inspection: EmbeddingRecordMetadataInspection
): MemoryProviderVectorWriteAcceptanceReasonCode | undefined {
  if (inspection.status !== "ok") {
    return "vector_write_degraded";
  }
  if (inspection.recordCount !== 1) {
    return "vector_write_missing";
  }
  if (
    !Number.isInteger(inspection.dimensionCount) ||
    inspection.dimensionCount <= 0 ||
    inspection.dimensionCount > 8192
  ) {
    return "vector_dimensions_invalid";
  }
  return undefined;
}

function createCoreHostChildEnvironment(
  input: MemoryProviderVectorWriteAcceptanceInput,
  env: Readonly<Record<string, string | undefined>>
): Readonly<Record<string, string | undefined>> {
  return {
    ...process.env,
    ...env,
    ...(input.childEnv ?? {}),
    ...(input.temporaryMemoryDatabasePath === undefined
      ? {}
      : { JARVIS_K_MEMORY_DB_PATH: input.temporaryMemoryDatabasePath }),
    ...(input.temporaryModelDirectoryPath === undefined
      ? {}
      : { JARVIS_K_MODEL_DIR: input.temporaryModelDirectoryPath })
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

function waitForCoreHostReady(
  child: ChildProcess,
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new CoreHostProductPathFailure("core_host_startup_failed"));
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
      reject(new CoreHostProductPathFailure("core_host_startup_failed"));
    };
    const onError = (): void => {
      cleanup();
      reject(new CoreHostProductPathFailure("core_host_startup_failed"));
    };
    child.on("message", onMessage);
    child.once("exit", onExit);
    child.once("error", onError);
  });
}

function sendMessageCommand(
  child: ChildProcess,
  input: MemoryProviderVectorWriteProductPathInput
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const envelope = createCommandEnvelope({
      type: "agent.sendMessage",
      payload: {
        conversationId: "primary",
        text: input.messageText
      }
    });
    const timer = setTimeout(() => {
      cleanup();
      reject(new CoreHostProductPathFailure("core_host_command_failed"));
    }, input.timeoutMs);
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
      reject(new CoreHostProductPathFailure("core_host_command_failed"));
    };
    const onError = (): void => {
      cleanup();
      reject(new CoreHostProductPathFailure("core_host_command_failed"));
    };
    child.on("message", onMessage);
    child.once("exit", onExit);
    child.once("error", onError);
    child.send({ kind: "command", envelope }, (error) => {
      if (error) {
        cleanup();
        reject(new CoreHostProductPathFailure("core_host_command_failed"));
      }
    });
  });
}

function sanitizeCommandResult(
  rawResult: CommandResult
): MemoryProviderVectorWriteProductPathResult {
  const result = CommandResultSchema.parse(rawResult);
  if (!result.ok || !isRecord(result.data)) {
    return { ok: false };
  }
  return {
    ok: result.data.accepted === true,
    ...(typeof result.data.messageId === "string"
      ? { messageId: result.data.messageId }
      : {})
  };
}

async function closeCoreHostChild(child: ChildProcess): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return true;
  }
  if (child.connected) {
    child.disconnect();
  }
  if (!child.kill()) {
    return child.exitCode !== null || child.signalCode !== null;
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 5_000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

function resolveCoreHostScriptPath(): string {
  return path.resolve(__dirname, "index.js");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSafeMessageId(value: string | undefined): value is string {
  return value !== undefined && value.length > 0 && value.length <= 128;
}

class CoreHostProductPathFailure extends Error {
  public constructor(
    public readonly reasonCode: MemoryProviderVectorWriteAcceptanceReasonCode
  ) {
    super(reasonCode);
  }
}
