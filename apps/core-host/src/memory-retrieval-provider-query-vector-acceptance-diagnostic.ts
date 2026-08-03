import { fork, type ChildProcess } from "node:child_process";
import path from "node:path";
import {
  CommandResultSchema,
  CoreOutboundMessageSchema,
  createCommandEnvelope,
  type CommandResult
} from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "./local-embedding-composition";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
  readLocalEmbeddingModelDirectory,
  readRuntimePythonExecutable,
  verifyLocalEmbeddingModelArtifacts
} from "./local-embedding-runtime-session-factory";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV } from "./memory-retrieval-provider-query-vector-acceptance-preflight";
import { MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV } from "./memory-retrieval-provider-query-vector-approval-gate";
import { MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV } from "./core-memory-retrieval-env-wiring-approval-gate";

export type MemoryRetrievalProviderQueryVectorAcceptanceStatus =
  | "blocked"
  | "degraded"
  | "passed";

export type MemoryRetrievalProviderQueryVectorAcceptanceReasonCode =
  | "acceptance_not_approved"
  | "acceptance_opt_in_missing"
  | "phase_8_16_wiring_missing"
  | "memory_retrieval_routing_opt_in_missing"
  | "provider_query_vector_opt_in_missing"
  | "provider_opt_in_missing"
  | "provider_execution_opt_in_missing"
  | "runtime_python_missing"
  | "model_directory_missing"
  | "unsafe_side_effect_requested"
  | "artifact_verification_failed"
  | "core_host_startup_failed"
  | "core_host_command_failed"
  | "memory_recall_missing"
  | "memory_recall_degraded"
  | "query_dimensions_invalid"
  | "core_host_cleanup_failed";

export interface MemoryRetrievalProviderQueryVectorAcceptanceInput {
  env?: Readonly<Record<string, string | undefined>>;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase816ProviderBackedQueryVectorComplete?: boolean;
  timeoutMs?: number;
  diagnosticMessageText?: string;
  coreHostScriptPath?: string;
  childEnv?: Readonly<Record<string, string | undefined>>;
  temporaryMemoryDatabasePath?: string;
  temporaryModelDirectoryPath?: string;
  verifyModelArtifacts?: (modelDirectory: string) => Promise<void>;
  executeProductPath?: (
    input: MemoryRetrievalProviderQueryVectorProductPathInput
  ) => Promise<MemoryRetrievalProviderQueryVectorProductPathResult>;
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
  memoryVectorDataWritten?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  providerDefaultOptInChanged?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface MemoryRetrievalProviderQueryVectorProductPathInput {
  messageText: string;
  timeoutMs: number;
  coreHostScriptPath: string;
  env: Readonly<Record<string, string | undefined>>;
}

export interface MemoryRetrievalProviderQueryVectorProductPathResult {
  ok: boolean;
  recallStatus?: "ok" | "degraded";
  recallMode?: "fixture_only";
  recallMatchCount?: number;
  queryDimensionCount?: number;
  reasonCode?: string;
}

export interface MemoryRetrievalProviderQueryVectorAcceptanceReport {
  phase: "8.18";
  mode: "provider_query_vector_acceptance_diagnostic";
  status: MemoryRetrievalProviderQueryVectorAcceptanceStatus;
  accepted: boolean;
  productPathCommandCalled: boolean;
  artifactDigestVerification: "not_run" | "passed" | "failed";
  productPathRecall: "not_run" | "passed" | "failed";
  cleanupStatus: "not_started" | "passed" | "degraded";
  recallStatus: "unknown" | "ok" | "degraded";
  recallMode: "unknown" | "fixture_only";
  recallMatchCount: number;
  queryDimensionCount: number;
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
  memoryVectorDataWritten: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  providerDefaultOptInChanged: false;
  modelOutputShellExecutionEnabled: false;
  reasonCodes: MemoryRetrievalProviderQueryVectorAcceptanceReasonCode[];
}

const DEFAULT_DIAGNOSTIC_MESSAGE =
  "Jarvis-K memory retrieval provider query vector acceptance";

export async function runMemoryRetrievalProviderQueryVectorAcceptanceDiagnostic(
  input: MemoryRetrievalProviderQueryVectorAcceptanceInput = {}
): Promise<MemoryRetrievalProviderQueryVectorAcceptanceReport> {
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
    const result = await (
      input.executeProductPath ??
      runCoreHostMemoryRetrievalProviderQueryVectorProductPath
    )({
      messageText: input.diagnosticMessageText ?? DEFAULT_DIAGNOSTIC_MESSAGE,
      timeoutMs: input.timeoutMs ?? 180_000,
      coreHostScriptPath:
        input.coreHostScriptPath ?? resolveCoreHostScriptPath(),
      env: createCoreHostChildEnvironment(input, env)
    });

    report.recallStatus = result.recallStatus ?? "unknown";
    report.recallMode = result.recallMode ?? "unknown";
    report.recallMatchCount = result.recallMatchCount ?? 0;
    report.queryDimensionCount = result.queryDimensionCount ?? 0;

    const failureReason = findProductPathFailureReason(result);
    if (failureReason !== undefined) {
      report.status = "degraded";
      report.productPathRecall = "failed";
      report.reasonCodes.push(failureReason);
      return report;
    }

    report.status = "passed";
    report.accepted = true;
    report.productPathRecall = "passed";
    report.cleanupStatus = "passed";
    return report;
  } catch (error) {
    report.status = "degraded";
    report.productPathRecall = "failed";
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

export async function runCoreHostMemoryRetrievalProviderQueryVectorProductPath(
  input: MemoryRetrievalProviderQueryVectorProductPathInput
): Promise<MemoryRetrievalProviderQueryVectorProductPathResult> {
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

function createInitialReport(): MemoryRetrievalProviderQueryVectorAcceptanceReport {
  return {
    phase: "8.18",
    mode: "provider_query_vector_acceptance_diagnostic",
    status: "degraded",
    accepted: false,
    productPathCommandCalled: false,
    artifactDigestVerification: "not_run",
    productPathRecall: "not_run",
    cleanupStatus: "not_started",
    recallStatus: "unknown",
    recallMode: "unknown",
    recallMatchCount: 0,
    queryDimensionCount: 0,
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
    memoryVectorDataWritten: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    providerDefaultOptInChanged: false,
    modelOutputShellExecutionEnabled: false,
    reasonCodes: []
  };
}

function findMissingGate(
  input: MemoryRetrievalProviderQueryVectorAcceptanceInput,
  env: Readonly<Record<string, string | undefined>>
): MemoryRetrievalProviderQueryVectorAcceptanceReasonCode | undefined {
  if (
    input.productApprovalGranted !== true ||
    input.securityApprovalGranted !== true
  ) {
    return "acceptance_not_approved";
  }
  if (
    input.phase816ProviderBackedQueryVectorComplete !== true
  ) {
    return "phase_8_16_wiring_missing";
  }
  if (
    env[MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE_ENV]?.trim() !==
    "1"
  ) {
    return "acceptance_opt_in_missing";
  }
  if (env[MEMORY_RETRIEVAL_ROUTING_OPT_IN_ENV]?.trim() !== "1") {
    return "memory_retrieval_routing_opt_in_missing";
  }
  if (env[MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_OPT_IN_ENV]?.trim() !== "1") {
    return "provider_query_vector_opt_in_missing";
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
  input: MemoryRetrievalProviderQueryVectorAcceptanceInput
): MemoryRetrievalProviderQueryVectorAcceptanceReasonCode | undefined {
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
    input.memoryVectorDataWritten === true ||
    input.sqliteSchemaMigrationEnabled === true ||
    input.desktopIpcChanged === true ||
    input.uiBehaviorChanged === true ||
    input.providerVisibilityChanged === true ||
    input.providerDefaultOptInChanged === true ||
    input.modelOutputShellExecutionEnabled === true
    ? "unsafe_side_effect_requested"
    : undefined;
}

function findProductPathFailureReason(
  result: MemoryRetrievalProviderQueryVectorProductPathResult
): MemoryRetrievalProviderQueryVectorAcceptanceReasonCode | undefined {
  if (result.ok !== true) {
    return "core_host_command_failed";
  }
  if (result.recallStatus === undefined || result.recallMode === undefined) {
    return "memory_recall_missing";
  }
  if (result.recallStatus !== "ok") {
    return "memory_recall_degraded";
  }
  if (result.recallMode !== "fixture_only") {
    return "memory_recall_missing";
  }
  if (
    result.queryDimensionCount === undefined ||
    !Number.isInteger(result.queryDimensionCount) ||
    result.queryDimensionCount <= 0 ||
    result.queryDimensionCount > 8192
  ) {
    return "query_dimensions_invalid";
  }
  if (
    result.recallMatchCount === undefined ||
    !Number.isInteger(result.recallMatchCount) ||
    result.recallMatchCount < 0 ||
    result.recallMatchCount > 5
  ) {
    return "memory_recall_missing";
  }
  return undefined;
}

function createCoreHostChildEnvironment(
  input: MemoryRetrievalProviderQueryVectorAcceptanceInput,
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
  input: MemoryRetrievalProviderQueryVectorProductPathInput
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
): MemoryRetrievalProviderQueryVectorProductPathResult {
  const result = CommandResultSchema.parse(rawResult);
  if (!result.ok || !isRecord(result.data)) {
    return { ok: false };
  }
  const recall = result.data.memoryRecall;
  if (!isRecord(recall)) {
    return { ok: true };
  }
  const recallStatus =
    recall.status === "ok" || recall.status === "degraded"
      ? recall.status
      : undefined;
  const recallMode = recall.mode === "fixture_only" ? recall.mode : undefined;
  return {
    ok: true,
    ...(recallStatus === undefined ? {} : { recallStatus }),
    ...(recallMode === undefined ? {} : { recallMode }),
    ...(Number.isInteger(recall.matchCount)
      ? { recallMatchCount: recall.matchCount as number }
      : {}),
    ...(Number.isInteger(recall.queryDimensions)
      ? { queryDimensionCount: recall.queryDimensions as number }
      : {}),
    ...(typeof recall.reasonCode === "string"
      ? { reasonCode: recall.reasonCode }
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

class CoreHostProductPathFailure extends Error {
  public constructor(
    public readonly reasonCode: MemoryRetrievalProviderQueryVectorAcceptanceReasonCode
  ) {
    super(reasonCode);
  }
}
