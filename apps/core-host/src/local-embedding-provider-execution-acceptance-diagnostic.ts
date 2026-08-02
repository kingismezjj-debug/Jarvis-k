import { fork, type ChildProcess } from "node:child_process";
import path from "node:path";
import {
  CommandResultSchema,
  CoreOutboundMessageSchema,
  EmbeddingGenerationResultSchema,
  createCommandEnvelope,
  type CommandResult,
  type EmbeddingGenerationRequest
} from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "./local-embedding-composition";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
  readLocalEmbeddingModelDirectory,
  readRuntimePythonExecutable,
  verifyLocalEmbeddingModelArtifacts
} from "./local-embedding-runtime-session-factory";

export const LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE_OPT_IN_ENV =
  "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE";

export type CoreHostLocalEmbeddingProviderExecutionAcceptanceStatus =
  | "blocked"
  | "degraded"
  | "passed";

export type CoreHostLocalEmbeddingProviderExecutionAcceptanceReasonCode =
  | "acceptance_not_approved"
  | "acceptance_opt_in_missing"
  | "phase_7_42_wiring_missing"
  | "provider_opt_in_missing"
  | "provider_execution_opt_in_missing"
  | "runtime_python_missing"
  | "model_directory_missing"
  | "unsafe_side_effect_requested"
  | "artifact_verification_failed"
  | "core_host_startup_failed"
  | "core_host_command_failed"
  | "product_embedding_shape_invalid"
  | "core_host_cleanup_failed";

export interface CoreHostLocalEmbeddingProviderExecutionAcceptanceInput {
  env?: Readonly<Record<string, string | undefined>>;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase742ProviderExecutionWiringComplete?: boolean;
  acceptanceRequest?: EmbeddingGenerationRequest;
  timeoutMs?: number;
  coreHostScriptPath?: string;
  childEnv?: Readonly<Record<string, string | undefined>>;
  temporaryMemoryDatabasePath?: string;
  temporaryModelDirectoryPath?: string;
  verifyModelArtifacts?: (modelDirectory: string) => Promise<void>;
  executeProductPath?: (
    input: CoreHostLocalEmbeddingProviderExecutionProductPathInput
  ) => Promise<CoreHostLocalEmbeddingProviderExecutionProductPathResult>;
  vectorsRoutedToMemory?: boolean;
  vectorsPersisted?: boolean;
  vectorsLoggedOrExposed?: boolean;
  memorySchemaMigrationEnabled?: boolean;
  providerDefaultOptInChanged?: boolean;
  providerVisibilityChanged?: boolean;
  uiVisibilityChanged?: boolean;
  downloadsEnabled?: boolean;
  persistentCacheWritesEnabled?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposureEnabled?: boolean;
  signedUrlOrCredentialPersistenceEnabled?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface CoreHostLocalEmbeddingProviderExecutionProductPathInput {
  request: EmbeddingGenerationRequest;
  timeoutMs: number;
  coreHostScriptPath: string;
  env: Readonly<Record<string, string | undefined>>;
}

export interface CoreHostLocalEmbeddingProviderExecutionProductPathResult {
  ok: boolean;
  vectorCount?: number;
  dimensionCount?: number;
  operationPhase?: string;
}

export interface CoreHostLocalEmbeddingProviderExecutionAcceptanceReport {
  phase: "7.43";
  mode: "provider_execution_acceptance_diagnostic";
  provider: "embedding.local.qwen3";
  modelId: typeof LOCAL_EMBEDDING_MODEL_ID;
  status: CoreHostLocalEmbeddingProviderExecutionAcceptanceStatus;
  accepted: boolean;
  productPathCommandCalled: boolean;
  artifactDigestVerification: "not_run" | "passed" | "failed";
  productPathEmbedding: "not_run" | "passed" | "failed";
  cleanupStatus: "not_started" | "passed" | "degraded";
  vectorCount: number;
  dimensionCount: number;
  operationPhase: "unknown" | "completed" | "failed";
  rawVectorsExposed: false;
  rawInputsExposed: false;
  vectorsRoutedToMemory: false;
  vectorsPersisted: false;
  vectorsLoggedOrExposed: false;
  memorySchemaMigrationEnabled: false;
  providerDefaultOptInChanged: false;
  providerVisibilityChanged: false;
  uiVisibilityChanged: false;
  downloadsEnabled: false;
  persistentCacheWritesEnabled: false;
  rawDiagnosticsExposed: false;
  privatePathExposureEnabled: false;
  signedUrlOrCredentialPersistenceEnabled: false;
  modelOutputShellExecutionEnabled: false;
  reasonCodes: CoreHostLocalEmbeddingProviderExecutionAcceptanceReasonCode[];
}

const DEFAULT_ACCEPTANCE_REQUEST: EmbeddingGenerationRequest = {
  modelId: LOCAL_EMBEDDING_MODEL_ID,
  inputs: [
    {
      id: "phase-7-43-acceptance",
      text: "Jarvis-K local embedding provider execution acceptance"
    }
  ]
};

export async function runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic(
  input: CoreHostLocalEmbeddingProviderExecutionAcceptanceInput = {}
): Promise<CoreHostLocalEmbeddingProviderExecutionAcceptanceReport> {
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
      input.executeProductPath ?? runCoreHostGenerateEmbeddingsProductPath
    )({
      request: input.acceptanceRequest ?? DEFAULT_ACCEPTANCE_REQUEST,
      timeoutMs: input.timeoutMs ?? 180_000,
      coreHostScriptPath:
        input.coreHostScriptPath ?? resolveCoreHostScriptPath(),
      env: createCoreHostChildEnvironment(input, env)
    });

    const vectorCount = result.vectorCount;
    const dimensionCount = result.dimensionCount;
    if (
      result.ok !== true ||
      vectorCount === undefined ||
      dimensionCount === undefined ||
      !Number.isInteger(vectorCount) ||
      !Number.isInteger(dimensionCount) ||
      vectorCount <= 0 ||
      dimensionCount <= 0
    ) {
      report.status = "degraded";
      report.productPathEmbedding = "failed";
      report.operationPhase =
        result.operationPhase === "failed" ? "failed" : "unknown";
      report.reasonCodes.push(
        result.ok ? "product_embedding_shape_invalid" : "core_host_command_failed"
      );
      return report;
    }

    report.status = "passed";
    report.accepted = true;
    report.productPathEmbedding = "passed";
    report.cleanupStatus = "passed";
    report.vectorCount = vectorCount;
    report.dimensionCount = dimensionCount;
    report.operationPhase =
      result.operationPhase === "completed" ? "completed" : "unknown";
    return report;
  } catch (error) {
    report.status = "degraded";
    report.productPathEmbedding = "failed";
    report.operationPhase = "failed";
    report.reasonCodes.push(
      error instanceof CoreHostProductPathFailure
        ? error.reasonCode
        : "core_host_command_failed"
    );
    return report;
  }
}

export async function runCoreHostGenerateEmbeddingsProductPath(
  input: CoreHostLocalEmbeddingProviderExecutionProductPathInput
): Promise<CoreHostLocalEmbeddingProviderExecutionProductPathResult> {
  const child = fork(input.coreHostScriptPath, [], {
    env: sanitizeProcessEnv(input.env),
    stdio: ["ignore", "ignore", "ignore", "ipc"]
  });
  let closed = false;
  try {
    await waitForCoreHostReady(child, input.timeoutMs);
    const result = await sendGenerateEmbeddingsCommand(child, input);
    return sanitizeCommandResult(result);
  } finally {
    closed = await closeCoreHostChild(child);
    if (!closed) {
      throw new CoreHostProductPathFailure("core_host_cleanup_failed");
    }
  }
}

function createInitialReport(): CoreHostLocalEmbeddingProviderExecutionAcceptanceReport {
  return {
    phase: "7.43",
    mode: "provider_execution_acceptance_diagnostic",
    provider: "embedding.local.qwen3",
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    status: "degraded",
    accepted: false,
    productPathCommandCalled: false,
    artifactDigestVerification: "not_run",
    productPathEmbedding: "not_run",
    cleanupStatus: "not_started",
    vectorCount: 0,
    dimensionCount: 0,
    operationPhase: "unknown",
    rawVectorsExposed: false,
    rawInputsExposed: false,
    vectorsRoutedToMemory: false,
    vectorsPersisted: false,
    vectorsLoggedOrExposed: false,
    memorySchemaMigrationEnabled: false,
    providerDefaultOptInChanged: false,
    providerVisibilityChanged: false,
    uiVisibilityChanged: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    rawDiagnosticsExposed: false,
    privatePathExposureEnabled: false,
    signedUrlOrCredentialPersistenceEnabled: false,
    modelOutputShellExecutionEnabled: false,
    reasonCodes: []
  };
}

function findMissingGate(
  input: CoreHostLocalEmbeddingProviderExecutionAcceptanceInput,
  env: Readonly<Record<string, string | undefined>>
): CoreHostLocalEmbeddingProviderExecutionAcceptanceReasonCode | undefined {
  if (
    input.productApprovalGranted !== true ||
    input.securityApprovalGranted !== true
  ) {
    return "acceptance_not_approved";
  }
  if (
    env[LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE_OPT_IN_ENV]?.trim() !==
    "1"
  ) {
    return "acceptance_opt_in_missing";
  }
  if (input.phase742ProviderExecutionWiringComplete !== true) {
    return "phase_7_42_wiring_missing";
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
  input: CoreHostLocalEmbeddingProviderExecutionAcceptanceInput
): CoreHostLocalEmbeddingProviderExecutionAcceptanceReasonCode | undefined {
  return input.vectorsRoutedToMemory === true ||
    input.vectorsPersisted === true ||
    input.vectorsLoggedOrExposed === true ||
    input.memorySchemaMigrationEnabled === true ||
    input.providerDefaultOptInChanged === true ||
    input.providerVisibilityChanged === true ||
    input.uiVisibilityChanged === true ||
    input.downloadsEnabled === true ||
    input.persistentCacheWritesEnabled === true ||
    input.rawDiagnosticsExposed === true ||
    input.privatePathExposureEnabled === true ||
    input.signedUrlOrCredentialPersistenceEnabled === true ||
    input.modelOutputShellExecutionEnabled === true
    ? "unsafe_side_effect_requested"
    : undefined;
}

function createCoreHostChildEnvironment(
  input: CoreHostLocalEmbeddingProviderExecutionAcceptanceInput,
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

function sendGenerateEmbeddingsCommand(
  child: ChildProcess,
  input: CoreHostLocalEmbeddingProviderExecutionProductPathInput
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const envelope = createCommandEnvelope({
      type: "agent.generateEmbeddings",
      payload: input.request
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
): CoreHostLocalEmbeddingProviderExecutionProductPathResult {
  const result = CommandResultSchema.parse(rawResult);
  if (!result.ok) {
    return {
      ok: false,
      operationPhase: "failed"
    };
  }
  if (!isRecord(result.data)) {
    return {
      ok: false,
      operationPhase: "failed"
    };
  }
  const parsed = EmbeddingGenerationResultSchema.safeParse(
    result.data.result
  );
  if (!parsed.success) {
    return {
      ok: false,
      operationPhase: "failed"
    };
  }
  return {
    ok: true,
    vectorCount: parsed.data.vectors.length,
    dimensionCount: parsed.data.dimensions,
    operationPhase: readOperationPhase(result.data.operation)
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

function readOperationPhase(value: unknown): "unknown" | "completed" | "failed" {
  if (!isRecord(value)) {
    return "unknown";
  }
  return value.phase === "completed"
    ? "completed"
    : value.phase === "failed"
      ? "failed"
      : "unknown";
}

function resolveCoreHostScriptPath(): string {
  return path.resolve(__dirname, "index.js");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

class CoreHostProductPathFailure extends Error {
  public constructor(
    public readonly reasonCode: CoreHostLocalEmbeddingProviderExecutionAcceptanceReasonCode
  ) {
    super(reasonCode);
  }
}
