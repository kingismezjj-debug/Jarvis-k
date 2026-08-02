import {
  createId,
  EmbeddingGenerationRequestSchema,
  EmbeddingGenerationResultSchema,
  LocalModelCapabilitySchema,
  type EmbeddingGenerationRequest,
  type EmbeddingGenerationResult,
  type LocalModelCapability
} from "@jarvis-k/contracts";
import {
  TRANSFORMERS_LOCAL_RUNTIME,
  TRANSFORMERS_LOCAL_RUNTIME_UNAVAILABLE_REASON
} from "./runtime-constants";

export const RUNTIME_HELPER_PROTOCOL_VERSION = 1 as const;
export const RUNTIME_HELPER_IPC_MODE = "private-child-process-ipc" as const;
export const RUNTIME_HELPER_SUPERVISOR = "apps/core-host" as const;

export type RuntimeHelperOperation =
  | "health"
  | "load"
  | "embed"
  | "shutdown";

export type RuntimeHelperShutdownReason =
  | "app_shutdown"
  | "supervisor_restart"
  | "request_cancelled"
  | "test";

export type RuntimeHelperHealthStatus =
  | "unavailable"
  | "starting"
  | "ready"
  | "stopping"
  | "stopped"
  | "failed";

export type RuntimeHelperProcessState =
  | "not_started"
  | "starting"
  | "ready"
  | "stopping"
  | "stopped"
  | "failed";

export type RuntimeHelperErrorCode =
  | "HELPER_UNAVAILABLE"
  | "HELPER_STARTUP_TIMEOUT"
  | "HELPER_SHUTDOWN_TIMEOUT"
  | "HELPER_REQUEST_TIMEOUT"
  | "HELPER_PROTOCOL_INVALID"
  | "RESOURCE_LEASE_REQUIRED"
  | "MODEL_LOAD_UNAVAILABLE"
  | "RUNTIME_DEPENDENCY_UNAVAILABLE"
  | "MODEL_ARTIFACT_UNAVAILABLE"
  | "MODEL_RUNTIME_INCOMPATIBLE"
  | "EMBEDDING_DIMENSIONS_UNSUPPORTED"
  | "EMBEDDING_EXECUTION_DISABLED"
  | "HELPER_PROCESS_EXITED"
  | "HELPER_INTERNAL";

export interface RuntimeHelperTimeoutPolicy {
  startupTimeoutMs: number;
  requestTimeoutMs: number;
  shutdownTimeoutMs: number;
}

export interface RuntimeHelperProtocolPolicy {
  protocolVersion: typeof RUNTIME_HELPER_PROTOCOL_VERSION;
  transport: typeof RUNTIME_HELPER_IPC_MODE;
  supervisor: typeof RUNTIME_HELPER_SUPERVISOR;
  privateChildProcessOnly: true;
  requestCorrelationRequired: true;
  resourceLeaseRequiredBeforeLoad: true;
  resourceLeaseRequiredBeforeEmbed: true;
  directShellExecutionAllowed: false;
  modelOutputActionPolicy: "validated_intent_only";
  sanitizedErrorsRequired: true;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  modelArtifactsAccessed: false;
  timeoutPolicy: RuntimeHelperTimeoutPolicy;
}

export interface RuntimeHelperHealth {
  runtime: typeof TRANSFORMERS_LOCAL_RUNTIME;
  status: RuntimeHelperHealthStatus;
  processState: RuntimeHelperProcessState;
  transport: typeof RUNTIME_HELPER_IPC_MODE;
  resourceLeaseRequired: true;
  directShellExecutionAllowed: false;
  runtimeDependenciesIntroduced: boolean;
  downloadEnabled: false;
  executionEnabled: boolean;
  modelArtifactsAccessed: boolean;
  reasons: string[];
}

interface RuntimeHelperRequestBase {
  protocolVersion: typeof RUNTIME_HELPER_PROTOCOL_VERSION;
  requestId: string;
  correlationId: string;
  createdAt: string;
}

export interface RuntimeHelperHealthRequest
  extends RuntimeHelperRequestBase {
  operation: "health";
  payload: Record<string, never>;
}

export interface RuntimeHelperLoadRequest extends RuntimeHelperRequestBase {
  operation: "load";
  payload: {
    modelId: string;
    capability: LocalModelCapability;
    resourceLeaseId: string;
  };
}

export interface RuntimeHelperEmbedRequest extends RuntimeHelperRequestBase {
  operation: "embed";
  payload: {
    sessionId: string;
    resourceLeaseId: string;
    request: EmbeddingGenerationRequest;
  };
}

export interface RuntimeHelperShutdownRequest
  extends RuntimeHelperRequestBase {
  operation: "shutdown";
  payload: {
    reason: RuntimeHelperShutdownReason;
  };
}

export type RuntimeHelperRequest =
  | RuntimeHelperHealthRequest
  | RuntimeHelperLoadRequest
  | RuntimeHelperEmbedRequest
  | RuntimeHelperShutdownRequest;

export interface RuntimeHelperHealthResponse {
  protocolVersion: typeof RUNTIME_HELPER_PROTOCOL_VERSION;
  requestId: string;
  correlationId: string;
  operation: "health";
  completedAt: string;
  ok: true;
  payload: RuntimeHelperHealth;
}

export interface RuntimeHelperLoadResponse {
  protocolVersion: typeof RUNTIME_HELPER_PROTOCOL_VERSION;
  requestId: string;
  correlationId: string;
  operation: "load";
  completedAt: string;
  ok: true;
  payload: {
    sessionId: string;
    modelId: string;
    capability: LocalModelCapability;
    loadedAt: string;
  };
}

export interface RuntimeHelperEmbedResponse {
  protocolVersion: typeof RUNTIME_HELPER_PROTOCOL_VERSION;
  requestId: string;
  correlationId: string;
  operation: "embed";
  completedAt: string;
  ok: true;
  payload: EmbeddingGenerationResult;
}

export interface RuntimeHelperShutdownResponse {
  protocolVersion: typeof RUNTIME_HELPER_PROTOCOL_VERSION;
  requestId: string;
  correlationId: string;
  operation: "shutdown";
  completedAt: string;
  ok: true;
  payload: {
    status: "stopped";
  };
}

export interface RuntimeHelperErrorResponse {
  protocolVersion: typeof RUNTIME_HELPER_PROTOCOL_VERSION;
  requestId: string;
  correlationId: string;
  operation: RuntimeHelperOperation;
  completedAt: string;
  ok: false;
  error: RuntimeHelperSanitizedError;
}

export type RuntimeHelperResponse =
  | RuntimeHelperHealthResponse
  | RuntimeHelperLoadResponse
  | RuntimeHelperEmbedResponse
  | RuntimeHelperShutdownResponse
  | RuntimeHelperErrorResponse;

export interface RuntimeHelperSanitizedError {
  code: RuntimeHelperErrorCode;
  message: string;
  retryable: boolean;
}

export interface RuntimeHelperRequestIdentity {
  requestId?: string;
  correlationId?: string;
  createdAt?: string;
}

export interface RuntimeHelperLoadRequestInput
  extends RuntimeHelperRequestIdentity {
  modelId: string;
  capability: LocalModelCapability;
  resourceLeaseId: string;
}

export interface RuntimeHelperEmbedRequestInput
  extends RuntimeHelperRequestIdentity {
  sessionId: string;
  resourceLeaseId: string;
  request: EmbeddingGenerationRequest;
}

export interface RuntimeHelperShutdownRequestInput
  extends RuntimeHelperRequestIdentity {
  reason: RuntimeHelperShutdownReason;
}

const DEFAULT_TIMEOUT_POLICY: RuntimeHelperTimeoutPolicy = {
  startupTimeoutMs: 10_000,
  requestTimeoutMs: 30_000,
  shutdownTimeoutMs: 5_000
};

const ERROR_MESSAGES: Record<RuntimeHelperErrorCode, string> = {
  HELPER_UNAVAILABLE: "Runtime helper is unavailable.",
  HELPER_STARTUP_TIMEOUT: "Runtime helper startup timed out.",
  HELPER_SHUTDOWN_TIMEOUT: "Runtime helper shutdown timed out.",
  HELPER_REQUEST_TIMEOUT: "Runtime helper request timed out.",
  HELPER_PROTOCOL_INVALID: "Runtime helper protocol message is invalid.",
  RESOURCE_LEASE_REQUIRED: "A resource lease is required before runtime use.",
  MODEL_LOAD_UNAVAILABLE: "Runtime helper cannot load the requested model.",
  RUNTIME_DEPENDENCY_UNAVAILABLE:
    "Runtime helper dependencies are unavailable.",
  MODEL_ARTIFACT_UNAVAILABLE:
    "Runtime helper model artifacts are unavailable.",
  MODEL_RUNTIME_INCOMPATIBLE:
    "Runtime helper model is incompatible with the configured runtime.",
  EMBEDDING_DIMENSIONS_UNSUPPORTED:
    "Requested embedding dimensions are not supported by the loaded model.",
  EMBEDDING_EXECUTION_DISABLED:
    "Embedding execution remains disabled by the runtime gate.",
  HELPER_PROCESS_EXITED: "Runtime helper process exited unexpectedly.",
  HELPER_INTERNAL: "Runtime helper failed with a sanitized error."
};

const RETRYABLE_ERRORS = new Set<RuntimeHelperErrorCode>([
  "HELPER_UNAVAILABLE",
  "HELPER_STARTUP_TIMEOUT",
  "HELPER_REQUEST_TIMEOUT",
  "HELPER_PROCESS_EXITED",
  "HELPER_INTERNAL",
  "RUNTIME_DEPENDENCY_UNAVAILABLE"
]);

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u;
const SENSITIVE_TEXT_PATTERN =
  /(?:https?:\/\/|[A-Za-z]:\\|\\\\|(?:^|[\s"'=])(?:token|api[_-]?key|secret|password)=)/iu;

export function createRuntimeHelperTimeoutPolicy(
  overrides: Partial<RuntimeHelperTimeoutPolicy> = {}
): RuntimeHelperTimeoutPolicy {
  const policy: RuntimeHelperTimeoutPolicy = {
    startupTimeoutMs:
      overrides.startupTimeoutMs ?? DEFAULT_TIMEOUT_POLICY.startupTimeoutMs,
    requestTimeoutMs:
      overrides.requestTimeoutMs ?? DEFAULT_TIMEOUT_POLICY.requestTimeoutMs,
    shutdownTimeoutMs:
      overrides.shutdownTimeoutMs ?? DEFAULT_TIMEOUT_POLICY.shutdownTimeoutMs
  };

  if (!isRuntimeHelperTimeoutPolicy(policy)) {
    throw new Error("HELPER_TIMEOUT_POLICY_INVALID");
  }

  return policy;
}

export function isRuntimeHelperTimeoutPolicy(
  value: unknown
): value is RuntimeHelperTimeoutPolicy {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isTimeoutMs(value.startupTimeoutMs) &&
    isTimeoutMs(value.requestTimeoutMs) &&
    isTimeoutMs(value.shutdownTimeoutMs)
  );
}

export function createRuntimeHelperProtocolPolicy(): RuntimeHelperProtocolPolicy {
  return {
    protocolVersion: RUNTIME_HELPER_PROTOCOL_VERSION,
    transport: RUNTIME_HELPER_IPC_MODE,
    supervisor: RUNTIME_HELPER_SUPERVISOR,
    privateChildProcessOnly: true,
    requestCorrelationRequired: true,
    resourceLeaseRequiredBeforeLoad: true,
    resourceLeaseRequiredBeforeEmbed: true,
    directShellExecutionAllowed: false,
    modelOutputActionPolicy: "validated_intent_only",
    sanitizedErrorsRequired: true,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    modelArtifactsAccessed: false,
    timeoutPolicy: createRuntimeHelperTimeoutPolicy()
  };
}

export function isRuntimeHelperProtocolPolicyApproved(
  policy: RuntimeHelperProtocolPolicy
): boolean {
  return (
    policy.protocolVersion === RUNTIME_HELPER_PROTOCOL_VERSION &&
    policy.transport === RUNTIME_HELPER_IPC_MODE &&
    policy.supervisor === RUNTIME_HELPER_SUPERVISOR &&
    policy.privateChildProcessOnly === true &&
    policy.requestCorrelationRequired === true &&
    policy.resourceLeaseRequiredBeforeLoad === true &&
    policy.resourceLeaseRequiredBeforeEmbed === true &&
    policy.directShellExecutionAllowed === false &&
    policy.modelOutputActionPolicy === "validated_intent_only" &&
    policy.sanitizedErrorsRequired === true &&
    policy.runtimeDependenciesIntroduced === false &&
    policy.downloadEnabled === false &&
    policy.executionEnabled === false &&
    policy.modelArtifactsAccessed === false &&
    isRuntimeHelperTimeoutPolicy(policy.timeoutPolicy)
  );
}

export function createRuntimeHelperUnavailableHealth(): RuntimeHelperHealth {
  return {
    runtime: TRANSFORMERS_LOCAL_RUNTIME,
    status: "unavailable",
    processState: "not_started",
    transport: RUNTIME_HELPER_IPC_MODE,
    resourceLeaseRequired: true,
    directShellExecutionAllowed: false,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    modelArtifactsAccessed: false,
    reasons: [
      TRANSFORMERS_LOCAL_RUNTIME_UNAVAILABLE_REASON,
      "No runtime dependencies, downloads, model artifacts, or execution are enabled."
    ]
  };
}

export function createRuntimeHelperHealthRequest(
  identity: RuntimeHelperRequestIdentity = {}
): RuntimeHelperHealthRequest {
  return parseRuntimeHelperRequest({
    ...createRequestIdentity(identity),
    operation: "health",
    payload: {}
  }) as RuntimeHelperHealthRequest;
}

export function createRuntimeHelperLoadRequest(
  input: RuntimeHelperLoadRequestInput
): RuntimeHelperLoadRequest {
  return parseRuntimeHelperRequest({
    ...createRequestIdentity(input),
    operation: "load",
    payload: {
      modelId: input.modelId,
      capability: input.capability,
      resourceLeaseId: input.resourceLeaseId
    }
  }) as RuntimeHelperLoadRequest;
}

export function createRuntimeHelperEmbedRequest(
  input: RuntimeHelperEmbedRequestInput
): RuntimeHelperEmbedRequest {
  return parseRuntimeHelperRequest({
    ...createRequestIdentity(input),
    operation: "embed",
    payload: {
      sessionId: input.sessionId,
      resourceLeaseId: input.resourceLeaseId,
      request: input.request
    }
  }) as RuntimeHelperEmbedRequest;
}

export function createRuntimeHelperShutdownRequest(
  input: RuntimeHelperShutdownRequestInput
): RuntimeHelperShutdownRequest {
  return parseRuntimeHelperRequest({
    ...createRequestIdentity(input),
    operation: "shutdown",
    payload: {
      reason: input.reason
    }
  }) as RuntimeHelperShutdownRequest;
}

export function parseRuntimeHelperRequest(
  input: unknown
): RuntimeHelperRequest {
  const record = expectRecord(input);
  if (
    !hasOnlyKeys(record, [
      "protocolVersion",
      "requestId",
      "correlationId",
      "createdAt",
      "operation",
      "payload"
    ])
  ) {
    throwProtocolError();
  }

  const base = parseMessageBase(record);
  const operation = parseOperation(record.operation);
  const payload = expectRecord(record.payload);

  switch (operation) {
    case "health":
      if (!isEmptyRecord(payload)) {
        throwProtocolError();
      }
      return {
        ...base,
        operation,
        payload: {}
      };
    case "load":
      if (
        !hasOnlyKeys(payload, ["modelId", "capability", "resourceLeaseId"])
      ) {
        throwProtocolError();
      }
      return {
        ...base,
        operation,
        payload: {
          modelId: parseModelId(payload.modelId),
          capability: parseCapability(payload.capability),
          resourceLeaseId: parseIdentifier(payload.resourceLeaseId)
        }
      };
    case "embed": {
      if (
        !hasOnlyKeys(payload, ["sessionId", "resourceLeaseId", "request"])
      ) {
        throwProtocolError();
      }
      const parsedRequest = EmbeddingGenerationRequestSchema.safeParse(
        payload.request
      );
      if (!parsedRequest.success) {
        throwProtocolError();
      }
      return {
        ...base,
        operation,
        payload: {
          sessionId: parseIdentifier(payload.sessionId),
          resourceLeaseId: parseIdentifier(payload.resourceLeaseId),
          request: {
            ...parsedRequest.data,
            modelId: parseModelId(parsedRequest.data.modelId)
          }
        }
      };
    }
    case "shutdown":
      if (!hasOnlyKeys(payload, ["reason"])) {
        throwProtocolError();
      }
      return {
        ...base,
        operation,
        payload: {
          reason: parseShutdownReason(payload.reason)
        }
      };
  }
}

export function isRuntimeHelperRequest(
  input: unknown
): input is RuntimeHelperRequest {
  try {
    parseRuntimeHelperRequest(input);
    return true;
  } catch {
    return false;
  }
}

export function parseRuntimeHelperResponse(
  input: unknown
): RuntimeHelperResponse {
  const record = expectRecord(input);
  if (
    !hasOnlyKeys(record, [
      "protocolVersion",
      "requestId",
      "correlationId",
      "operation",
      "completedAt",
      "ok",
      "payload",
      "error"
    ])
  ) {
    throwProtocolError();
  }

  const base = parseResponseBase(record);
  const operation = parseOperation(record.operation);

  if (record.ok === false) {
    if (record.payload !== undefined) {
      throwProtocolError();
    }
    return {
      ...base,
      operation,
      ok: false,
      error: parseSanitizedError(record.error)
    };
  }

  if (record.ok !== true || record.error !== undefined) {
    throwProtocolError();
  }

  switch (operation) {
    case "health":
      return {
        ...base,
        operation,
        ok: true,
        payload: parseHealth(record.payload)
      };
    case "load":
      return {
        ...base,
        operation,
        ok: true,
        payload: parseLoadResponse(record.payload)
      };
    case "embed":
      return {
        ...base,
        operation,
        ok: true,
        payload: parseEmbeddingResponse(record.payload)
      };
    case "shutdown":
      return {
        ...base,
        operation,
        ok: true,
        payload: parseShutdownResponse(record.payload)
      };
  }
}

export function isRuntimeHelperResponse(
  input: unknown
): input is RuntimeHelperResponse {
  try {
    parseRuntimeHelperResponse(input);
    return true;
  } catch {
    return false;
  }
}

export function createRuntimeHelperSanitizedError(
  code: RuntimeHelperErrorCode
): RuntimeHelperSanitizedError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    retryable: RETRYABLE_ERRORS.has(code)
  };
}

export function mapRuntimeHelperError(
  error: unknown,
  operation: RuntimeHelperOperation
): RuntimeHelperSanitizedError {
  if (error instanceof Error) {
    if (error.name === "TimeoutError") {
      return createRuntimeHelperSanitizedError(
        operation === "shutdown"
          ? "HELPER_SHUTDOWN_TIMEOUT"
          : operation === "health"
            ? "HELPER_STARTUP_TIMEOUT"
            : "HELPER_REQUEST_TIMEOUT"
      );
    }

    if (isRuntimeHelperErrorCode(error.message)) {
      return createRuntimeHelperSanitizedError(error.message);
    }
  }

  return createRuntimeHelperSanitizedError("HELPER_INTERNAL");
}

export function createRuntimeHelperErrorResponse(
  request: RuntimeHelperRequest,
  code: RuntimeHelperErrorCode,
  completedAt = new Date().toISOString()
): RuntimeHelperErrorResponse {
  const parsedRequest = parseRuntimeHelperRequest(request);
  return parseRuntimeHelperResponse({
    protocolVersion: RUNTIME_HELPER_PROTOCOL_VERSION,
    requestId: parsedRequest.requestId,
    correlationId: parsedRequest.correlationId,
    operation: parsedRequest.operation,
    completedAt,
    ok: false,
    error: createRuntimeHelperSanitizedError(code)
  }) as RuntimeHelperErrorResponse;
}

function createRequestIdentity(
  identity: RuntimeHelperRequestIdentity
): RuntimeHelperRequestBase {
  return {
    protocolVersion: RUNTIME_HELPER_PROTOCOL_VERSION,
    requestId: identity.requestId ?? createId("runtime-request"),
    correlationId: identity.correlationId ?? createId("runtime-correlation"),
    createdAt: identity.createdAt ?? new Date().toISOString()
  };
}

function parseMessageBase(
  record: Record<string, unknown>
): RuntimeHelperRequestBase {
  if (record.protocolVersion !== RUNTIME_HELPER_PROTOCOL_VERSION) {
    throwProtocolError();
  }

  return {
    protocolVersion: RUNTIME_HELPER_PROTOCOL_VERSION,
    requestId: parseIdentifier(record.requestId),
    correlationId: parseIdentifier(record.correlationId),
    createdAt: parseDateTime(record.createdAt)
  };
}

function parseResponseBase(
  record: Record<string, unknown>
): Omit<
  RuntimeHelperHealthResponse,
  "operation" | "ok" | "payload"
> {
  if (record.protocolVersion !== RUNTIME_HELPER_PROTOCOL_VERSION) {
    throwProtocolError();
  }

  return {
    protocolVersion: RUNTIME_HELPER_PROTOCOL_VERSION,
    requestId: parseIdentifier(record.requestId),
    correlationId: parseIdentifier(record.correlationId),
    completedAt: parseDateTime(record.completedAt)
  };
}

function parseOperation(value: unknown): RuntimeHelperOperation {
  if (
    value === "health" ||
    value === "load" ||
    value === "embed" ||
    value === "shutdown"
  ) {
    return value;
  }
  throwProtocolError();
}

function parseShutdownReason(
  value: unknown
): RuntimeHelperShutdownReason {
  if (
    value === "app_shutdown" ||
    value === "supervisor_restart" ||
    value === "request_cancelled" ||
    value === "test"
  ) {
    return value;
  }
  throwProtocolError();
}

function parseHealth(value: unknown): RuntimeHelperHealth {
  const record = expectRecord(value);
  if (
    !hasOnlyKeys(record, [
      "runtime",
      "status",
      "processState",
      "transport",
      "resourceLeaseRequired",
      "directShellExecutionAllowed",
      "runtimeDependenciesIntroduced",
      "downloadEnabled",
      "executionEnabled",
      "modelArtifactsAccessed",
      "reasons"
    ])
  ) {
    throwProtocolError();
  }

  if (
    record.runtime !== TRANSFORMERS_LOCAL_RUNTIME ||
    record.transport !== RUNTIME_HELPER_IPC_MODE ||
    record.resourceLeaseRequired !== true ||
    record.directShellExecutionAllowed !== false ||
    record.downloadEnabled !== false
  ) {
    throwProtocolError();
  }

  if (
    !isHealthStatus(record.status) ||
    !isProcessState(record.processState) ||
    typeof record.runtimeDependenciesIntroduced !== "boolean" ||
    typeof record.executionEnabled !== "boolean" ||
    typeof record.modelArtifactsAccessed !== "boolean"
  ) {
    throwProtocolError();
  }

  return {
    runtime: TRANSFORMERS_LOCAL_RUNTIME,
    status: record.status,
    processState: record.processState,
    transport: RUNTIME_HELPER_IPC_MODE,
    resourceLeaseRequired: true,
    directShellExecutionAllowed: false,
    runtimeDependenciesIntroduced: record.runtimeDependenciesIntroduced,
    downloadEnabled: false,
    executionEnabled: record.executionEnabled,
    modelArtifactsAccessed: record.modelArtifactsAccessed,
    reasons: parseReasons(record.reasons)
  };
}

function parseLoadResponse(
  value: unknown
): RuntimeHelperLoadResponse["payload"] {
  const record = expectRecord(value);
  if (
    !hasOnlyKeys(record, ["sessionId", "modelId", "capability", "loadedAt"])
  ) {
    throwProtocolError();
  }

  return {
    sessionId: parseIdentifier(record.sessionId),
    modelId: parseModelId(record.modelId),
    capability: parseCapability(record.capability),
    loadedAt: parseDateTime(record.loadedAt)
  };
}

function parseEmbeddingResponse(
  value: unknown
): EmbeddingGenerationResult {
  const parsed = EmbeddingGenerationResultSchema.safeParse(value);
  if (!parsed.success || !isSafeModelId(parsed.data.modelId)) {
    throwProtocolError();
  }
  return parsed.data;
}

function parseShutdownResponse(
  value: unknown
): RuntimeHelperShutdownResponse["payload"] {
  const record = expectRecord(value);
  if (!hasOnlyKeys(record, ["status"]) || record.status !== "stopped") {
    throwProtocolError();
  }
  return { status: "stopped" };
}

function parseSanitizedError(
  value: unknown
): RuntimeHelperSanitizedError {
  const record = expectRecord(value);
  if (!hasOnlyKeys(record, ["code", "message", "retryable"])) {
    throwProtocolError();
  }

  if (!isRuntimeHelperErrorCode(record.code)) {
    throwProtocolError();
  }

  const expectedMessage = ERROR_MESSAGES[record.code];
  if (
    record.message !== expectedMessage ||
    record.retryable !== RETRYABLE_ERRORS.has(record.code)
  ) {
    throwProtocolError();
  }

  return {
    code: record.code,
    message: expectedMessage,
    retryable: record.retryable
  };
}

function parseIdentifier(value: unknown): string {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throwProtocolError();
  }
  return value;
}

function parseModelId(value: unknown): string {
  if (!isSafeModelId(value)) {
    throwProtocolError();
  }
  return value;
}

function parseCapability(value: unknown): LocalModelCapability {
  const parsed = LocalModelCapabilitySchema.safeParse(value);
  if (!parsed.success) {
    throwProtocolError();
  }
  return parsed.data;
}

function parseDateTime(value: unknown): string {
  if (
    typeof value !== "string" ||
    !DATE_TIME_PATTERN.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    throwProtocolError();
  }
  return value;
}

function parseReasons(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.length > 32 ||
    !value.every((reason) => isSanitizedText(reason, 500))
  ) {
    throwProtocolError();
  }
  return [...value];
}

function isSafeModelId(value: unknown): value is string {
  return (
    isSanitizedText(value, 300) &&
    !value.includes("\\") &&
    !value.includes("://") &&
    !value.includes("?") &&
    !value.includes("#") &&
    !/^[A-Za-z]:/u.test(value)
  );
}

function isSanitizedText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= maxLength &&
    !/[\u0000-\u001f\u007f]/u.test(value) &&
    !SENSITIVE_TEXT_PATTERN.test(value)
  );
}

function isRuntimeHelperErrorCode(
  value: unknown
): value is RuntimeHelperErrorCode {
  return (
    value === "HELPER_UNAVAILABLE" ||
    value === "HELPER_STARTUP_TIMEOUT" ||
    value === "HELPER_SHUTDOWN_TIMEOUT" ||
    value === "HELPER_REQUEST_TIMEOUT" ||
    value === "HELPER_PROTOCOL_INVALID" ||
    value === "RESOURCE_LEASE_REQUIRED" ||
    value === "MODEL_LOAD_UNAVAILABLE" ||
    value === "RUNTIME_DEPENDENCY_UNAVAILABLE" ||
    value === "MODEL_ARTIFACT_UNAVAILABLE" ||
    value === "MODEL_RUNTIME_INCOMPATIBLE" ||
    value === "EMBEDDING_DIMENSIONS_UNSUPPORTED" ||
    value === "EMBEDDING_EXECUTION_DISABLED" ||
    value === "HELPER_PROCESS_EXITED" ||
    value === "HELPER_INTERNAL"
  );
}

function isHealthStatus(value: unknown): value is RuntimeHelperHealthStatus {
  return (
    value === "unavailable" ||
    value === "starting" ||
    value === "ready" ||
    value === "stopping" ||
    value === "stopped" ||
    value === "failed"
  );
}

function isProcessState(
  value: unknown
): value is RuntimeHelperProcessState {
  return (
    value === "not_started" ||
    value === "starting" ||
    value === "ready" ||
    value === "stopping" ||
    value === "stopped" ||
    value === "failed"
  );
}

function isTimeoutMs(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 100 &&
    value <= 120_000
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throwProtocolError();
  }
  return value;
}

function hasOnlyKeys(
  record: Record<string, unknown>,
  keys: readonly string[]
): boolean {
  const allowed = new Set(keys);
  return Object.keys(record).every((key) => allowed.has(key));
}

function isEmptyRecord(record: Record<string, unknown>): boolean {
  return Object.keys(record).length === 0;
}

function throwProtocolError(): never {
  throw new Error("HELPER_PROTOCOL_INVALID");
}
