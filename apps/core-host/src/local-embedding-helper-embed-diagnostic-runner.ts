import {
  type ResourceLease,
  type ResourceScheduler
} from "@jarvis-k/capabilities";
import path from "node:path";
import {
  EmbeddingGenerationRequestSchema,
  type EmbeddingGenerationRequest
} from "@jarvis-k/contracts";
import {
  LOCAL_EMBEDDING_MODEL_ID
} from "@jarvis-k/inference-adapter-embedding-local";
import {
  RuntimeHelperClient,
  RuntimeHelperClientError,
  createRuntimeHelperTimeoutPolicy,
  createTransformersLocalRuntimeProcessTransport,
  type RuntimeHelperErrorCode,
  type RuntimeHelperTimeoutPolicy,
  type RuntimeHelperTransport,
  type TransformersLocalRuntimeProcessOptions
} from "@jarvis-k/inference-runtime-transformers-local";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
  readLocalEmbeddingModelDirectory,
  readRuntimePythonExecutable,
  verifyLocalEmbeddingModelArtifacts
} from "./local-embedding-runtime-session-factory";
import {
  createCoreHostObservabilityDiagnosticSurface,
  type CoreHostObservabilityDiagnosticSubreport
} from "./observability-diagnostic-surface";

export const LOCAL_EMBEDDING_HELPER_EMBED_DIAGNOSTIC_OPT_IN_ENV =
  "JARVIS_K_ENABLE_LOCAL_EMBEDDING_EMBED_DIAGNOSTIC";

export type CoreHostLocalEmbeddingHelperEmbedDiagnosticStatus =
  | "blocked"
  | "degraded"
  | "passed";

export type CoreHostLocalEmbeddingHelperEmbedDiagnosticReasonCode =
  | "diagnostic_not_approved"
  | "diagnostic_opt_in_missing"
  | "phase_7_38_preflight_missing"
  | "phase_7_39_preflight_missing"
  | "runtime_python_missing"
  | "model_directory_missing"
  | "unsafe_side_effect_requested"
  | "artifact_verification_failed"
  | "helper_health_unavailable"
  | "helper_load_failed"
  | "helper_embed_failed"
  | "embedding_shape_invalid"
  | "helper_cleanup_failed"
  | RuntimeHelperErrorCode;

export interface CoreHostLocalEmbeddingHelperEmbedDiagnosticInput {
  env?: Readonly<Record<string, string | undefined>>;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  phase738PreflightComplete?: boolean;
  phase739PreflightComplete?: boolean;
  diagnosticCases?: readonly EmbeddingGenerationRequest["inputs"][number][];
  dimensions?: number;
  resourceScheduler: ResourceScheduler;
  helperScriptPath?: string;
  timeoutPolicy?: RuntimeHelperTimeoutPolicy;
  createTransport?: (
    options: TransformersLocalRuntimeProcessOptions
  ) => RuntimeHelperTransport;
  verifyModelArtifacts?: (modelDirectory: string) => Promise<void>;
  productInferenceEnabled?: boolean;
  vectorsRoutedToMemory?: boolean;
  vectorsPersisted?: boolean;
  vectorsLoggedOrExposed?: boolean;
  memorySchemaMigrationEnabled?: boolean;
  providerRegistrationChanged?: boolean;
  defaultOptInChanged?: boolean;
  uiVisibilityChanged?: boolean;
  downloadsEnabled?: boolean;
  persistentCacheWritesEnabled?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposureEnabled?: boolean;
  signedUrlOrCredentialPersistenceEnabled?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
  observabilityAttachmentRequested?: boolean;
  observabilitySummary?: unknown;
  observabilityCorrelationId?: string;
}

export interface CoreHostLocalEmbeddingHelperEmbedDiagnosticReport {
  phase: "7.40";
  mode: "helper_embed_diagnostic";
  provider: "embedding.local.qwen3";
  modelId: typeof LOCAL_EMBEDDING_MODEL_ID;
  status: CoreHostLocalEmbeddingHelperEmbedDiagnosticStatus;
  accepted: boolean;
  helperEmbedCalled: boolean;
  realEmbeddingVectorsReturned: false;
  vectorValuesExposed: false;
  rawInputsExposed: false;
  productInferenceEnabled: false;
  vectorsRoutedToMemory: false;
  vectorsPersisted: false;
  vectorsLoggedOrExposed: false;
  memorySchemaMigrationEnabled: false;
  providerRegistrationChanged: false;
  defaultOptInChanged: false;
  uiVisibilityChanged: false;
  downloadsEnabled: false;
  persistentCacheWritesEnabled: false;
  rawDiagnosticsExposed: false;
  privatePathExposureEnabled: false;
  signedUrlOrCredentialPersistenceEnabled: false;
  modelOutputShellExecutionEnabled: false;
  artifactDigestVerification: "not_run" | "passed" | "failed";
  helperLoad: "not_run" | "passed" | "failed";
  helperEmbed: "not_run" | "passed" | "failed";
  cleanupStatus: "not_started" | "passed" | "degraded";
  caseCount: number;
  passedCount: number;
  degradedCount: number;
  failedCount: number;
  reasonCodes: CoreHostLocalEmbeddingHelperEmbedDiagnosticReasonCode[];
  observability?: CoreHostObservabilityDiagnosticSubreport;
}

type CoreHostLocalEmbeddingHelperEmbedDiagnosticStage =
  | "artifact"
  | "health"
  | "load"
  | "embed";

const DEFAULT_DIAGNOSTIC_CASES: EmbeddingGenerationRequest["inputs"] = [
  { id: "diagnostic-1", text: "Jarvis-K local embedding diagnostic" },
  { id: "diagnostic-2", text: "Runtime helper supervised embed check" }
];

export async function runCoreHostLocalEmbeddingHelperEmbedDiagnostic(
  input: CoreHostLocalEmbeddingHelperEmbedDiagnosticInput
): Promise<CoreHostLocalEmbeddingHelperEmbedDiagnosticReport> {
  const report = createInitialReport(input);
  const unsafeReason = findUnsafeSideEffect(input);
  if (unsafeReason !== undefined) {
    report.status = "blocked";
    report.failedCount = report.caseCount;
    report.reasonCodes.push(unsafeReason);
    return attachObservabilityIfRequested(report, input);
  }

  const env = input.env ?? process.env;
  const preflightReason = findMissingPreflightReason(input, env);
  if (preflightReason !== undefined) {
    report.status = "degraded";
    report.degradedCount = report.caseCount;
    report.reasonCodes.push(preflightReason);
    return attachObservabilityIfRequested(report, input);
  }

  const pythonExecutable = readRuntimePythonExecutable(env);
  if (pythonExecutable === undefined) {
    report.status = "degraded";
    report.degradedCount = report.caseCount;
    report.reasonCodes.push("runtime_python_missing");
    return attachObservabilityIfRequested(report, input);
  }
  const modelDirectory = readLocalEmbeddingModelDirectory(env);
  if (modelDirectory === undefined) {
    report.status = "degraded";
    report.degradedCount = report.caseCount;
    report.reasonCodes.push("model_directory_missing");
    return attachObservabilityIfRequested(report, input);
  }

  let resourceLease: ResourceLease | undefined;
  let client: RuntimeHelperClient | undefined;
  let stage: CoreHostLocalEmbeddingHelperEmbedDiagnosticStage = "artifact";
  try {
    stage = "artifact";
    try {
      await (input.verifyModelArtifacts ?? verifyLocalEmbeddingModelArtifacts)(
        modelDirectory
      );
    } catch {
      throw new DiagnosticFailure("artifact_verification_failed");
    }
    report.artifactDigestVerification = "passed";

    resourceLease = await input.resourceScheduler.acquire({
      capability: "embedding",
      modelId: LOCAL_EMBEDDING_MODEL_ID
    });
    const transportFactory =
      input.createTransport ?? createTransformersLocalRuntimeProcessTransport;
    client = new RuntimeHelperClient({
      transport: transportFactory({
        pythonExecutable,
        helperScript:
          input.helperScriptPath ??
          resolveHelperScriptPath(),
        modelDirectory
      }),
      timeoutPolicy:
        input.timeoutPolicy ??
        createRuntimeHelperTimeoutPolicy({
          startupTimeoutMs: 60_000,
          requestTimeoutMs: 120_000,
          shutdownTimeoutMs: 10_000
        })
    });

    stage = "health";
    const health = await client.health();
    if (
      health.status !== "ready" ||
      health.processState !== "ready" ||
      health.executionEnabled !== true ||
      health.downloadEnabled !== false ||
      health.directShellExecutionAllowed !== false ||
      health.resourceLeaseRequired !== true
    ) {
      throw new DiagnosticFailure("helper_health_unavailable");
    }

    stage = "load";
    const loaded = await client.load({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      capability: "embedding",
      resourceLeaseId: resourceLease.leaseId,
      modelDirectory
    });
    report.helperLoad = "passed";

    stage = "embed";
    const embedded = await client.embed({
      sessionId: loaded.sessionId,
      resourceLeaseId: resourceLease.leaseId,
      request: createDiagnosticRequest(input)
    });
    report.helperEmbedCalled = true;
    report.helperEmbed = "passed";
    if (!isEmbeddingShapeValid(embedded, report.caseCount)) {
      throw new DiagnosticFailure("embedding_shape_invalid");
    }

    report.status = "passed";
    report.accepted = true;
    report.passedCount = report.caseCount;
    return report;
  } catch (error) {
    report.status = "degraded";
    report.accepted = false;
    report.degradedCount = report.caseCount;
    const reasonCode = sanitizeDiagnosticError(error, stage);
    if (stage === "artifact") {
      report.artifactDigestVerification = "failed";
    } else if (stage === "load") {
      report.helperLoad = "failed";
    } else if (stage === "embed") {
      report.helperEmbed = "failed";
    }
    report.reasonCodes.push(reasonCode);
    return report;
  } finally {
    let cleanupFailed = false;
    if (client !== undefined) {
      await client.shutdown({ reason: "test" }).catch(() => {
        cleanupFailed = true;
      });
      client.dispose();
    }
    if (resourceLease !== undefined) {
      await resourceLease.release().catch(() => {
        cleanupFailed = true;
      });
    }
    if (client !== undefined || resourceLease !== undefined) {
      report.cleanupStatus = cleanupFailed ? "degraded" : "passed";
      if (cleanupFailed) {
        report.reasonCodes.push("helper_cleanup_failed");
        if (report.status === "passed") {
          report.status = "degraded";
          report.accepted = false;
          report.passedCount = 0;
          report.degradedCount = report.caseCount;
        }
      }
    }
  }
}

function createInitialReport(
  input: CoreHostLocalEmbeddingHelperEmbedDiagnosticInput
): CoreHostLocalEmbeddingHelperEmbedDiagnosticReport {
  const caseCount = createDiagnosticRequest(input).inputs.length;
  return {
    phase: "7.40",
    mode: "helper_embed_diagnostic",
    provider: "embedding.local.qwen3",
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    status: "degraded",
    accepted: false,
    helperEmbedCalled: false,
    realEmbeddingVectorsReturned: false,
    vectorValuesExposed: false,
    rawInputsExposed: false,
    productInferenceEnabled: false,
    vectorsRoutedToMemory: false,
    vectorsPersisted: false,
    vectorsLoggedOrExposed: false,
    memorySchemaMigrationEnabled: false,
    providerRegistrationChanged: false,
    defaultOptInChanged: false,
    uiVisibilityChanged: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    rawDiagnosticsExposed: false,
    privatePathExposureEnabled: false,
    signedUrlOrCredentialPersistenceEnabled: false,
    modelOutputShellExecutionEnabled: false,
    artifactDigestVerification: "not_run",
    helperLoad: "not_run",
    helperEmbed: "not_run",
    cleanupStatus: "not_started",
    caseCount,
    passedCount: 0,
    degradedCount: 0,
    failedCount: 0,
    reasonCodes: []
  };
}

function createDiagnosticRequest(
  input: CoreHostLocalEmbeddingHelperEmbedDiagnosticInput
): EmbeddingGenerationRequest {
  return EmbeddingGenerationRequestSchema.parse({
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    inputs:
      input.diagnosticCases !== undefined
        ? [...input.diagnosticCases]
        : DEFAULT_DIAGNOSTIC_CASES,
    ...(input.dimensions === undefined ? {} : { dimensions: input.dimensions })
  });
}

function findMissingPreflightReason(
  input: CoreHostLocalEmbeddingHelperEmbedDiagnosticInput,
  env: Readonly<Record<string, string | undefined>>
): CoreHostLocalEmbeddingHelperEmbedDiagnosticReasonCode | undefined {
  if (
    input.productApprovalGranted !== true ||
    input.securityApprovalGranted !== true
  ) {
    return "diagnostic_not_approved";
  }
  if (env[LOCAL_EMBEDDING_HELPER_EMBED_DIAGNOSTIC_OPT_IN_ENV]?.trim() !== "1") {
    return "diagnostic_opt_in_missing";
  }
  if (input.phase738PreflightComplete !== true) {
    return "phase_7_38_preflight_missing";
  }
  if (input.phase739PreflightComplete !== true) {
    return "phase_7_39_preflight_missing";
  }
  return undefined;
}

function findUnsafeSideEffect(
  input: CoreHostLocalEmbeddingHelperEmbedDiagnosticInput
): CoreHostLocalEmbeddingHelperEmbedDiagnosticReasonCode | undefined {
  return input.productInferenceEnabled === true ||
    input.vectorsRoutedToMemory === true ||
    input.vectorsPersisted === true ||
    input.vectorsLoggedOrExposed === true ||
    input.memorySchemaMigrationEnabled === true ||
    input.providerRegistrationChanged === true ||
    input.defaultOptInChanged === true ||
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

function attachObservabilityIfRequested(
  report: CoreHostLocalEmbeddingHelperEmbedDiagnosticReport,
  input: CoreHostLocalEmbeddingHelperEmbedDiagnosticInput
): CoreHostLocalEmbeddingHelperEmbedDiagnosticReport {
  if (input.observabilityAttachmentRequested !== true) {
    return report;
  }
  return {
    ...report,
    observability: createCoreHostObservabilityDiagnosticSurface({
      requested: true,
      summary: input.observabilitySummary,
      ...(input.observabilityCorrelationId === undefined
        ? {}
        : { expectedCorrelationId: input.observabilityCorrelationId })
    })
  };
}

function isEmbeddingShapeValid(
  result: Awaited<ReturnType<RuntimeHelperClient["embed"]>>,
  expectedCaseCount: number
): boolean {
  return (
    result.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    result.vectors.length === expectedCaseCount &&
    result.vectors.every(
      (vector) =>
        vector.values.length === result.dimensions &&
        vector.values.every((value) => Number.isFinite(value))
    )
  );
}

function sanitizeDiagnosticError(
  error: unknown,
  stage: CoreHostLocalEmbeddingHelperEmbedDiagnosticStage
): CoreHostLocalEmbeddingHelperEmbedDiagnosticReasonCode {
  if (error instanceof DiagnosticFailure) {
    return error.reasonCode;
  }
  if (error instanceof RuntimeHelperClientError) {
    if (error.code === "MODEL_ARTIFACT_UNAVAILABLE") {
      return "artifact_verification_failed";
    }
    if (error.code === "MODEL_LOAD_UNAVAILABLE") {
      return "helper_load_failed";
    }
    if (
      stage === "health" &&
      (error.code === "HELPER_STARTUP_TIMEOUT" ||
        error.code === "HELPER_PROTOCOL_INVALID" ||
        error.code === "HELPER_PROCESS_EXITED" ||
        error.code === "HELPER_INTERNAL")
    ) {
      return "helper_health_unavailable";
    }
    if (
      error.code === "EMBEDDING_DIMENSIONS_UNSUPPORTED" ||
      error.code === "HELPER_REQUEST_TIMEOUT" ||
      error.code === "HELPER_INTERNAL" ||
      error.code === "HELPER_PROCESS_EXITED"
    ) {
      return "helper_embed_failed";
    }
    return error.code;
  }
  if (error instanceof Error) {
    if (error.message === "MODEL_ARTIFACT_UNAVAILABLE") {
      return "artifact_verification_failed";
    }
    if (error.message === "HELPER_UNAVAILABLE") {
      return "HELPER_UNAVAILABLE";
    }
  }
  return "helper_embed_failed";
}

class DiagnosticFailure extends Error {
  public constructor(
    public readonly reasonCode: CoreHostLocalEmbeddingHelperEmbedDiagnosticReasonCode
  ) {
    super(reasonCode);
  }
}

function resolveHelperScriptPath(): string {
  return path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "packages",
    "inference-runtime-transformers-local",
    "runtime",
    "transformers_helper.py"
  );
}
