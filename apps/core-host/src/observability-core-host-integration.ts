import {
  createObservabilityCollector,
  classifyObservabilityFailure,
  type ObservabilityCollector,
  type ObservabilityObserveResult
} from "@jarvis-k/capabilities";
import type {
  ObservabilityActivationState,
  ObservabilityCleanupState,
  ObservabilityFailureClass,
  ObservabilityHealthState,
  ObservabilityObservation,
  ObservabilityOperationStatus,
  ObservabilityPhase,
  ObservabilityReasonCode,
  ObservabilityRollbackState,
  ObservabilityStopReason,
  ObservabilitySummary
} from "@jarvis-k/contracts";
import type {
  ModelLifecycleCleanupStatus,
  ModelLifecycleOperation,
  ModelLifecycleOperationStatus,
  ModelLifecycleReasonCode,
  ModelLifecycleRollbackStatus
} from "./file-system-model-lifecycle";

export interface CoreHostObservabilityLifecycleReport {
  operation: ModelLifecycleOperation;
  status: ModelLifecycleOperationStatus;
  cleanupStatus: ModelLifecycleCleanupStatus;
  rollbackStatus: ModelLifecycleRollbackStatus | "not_required";
  previousVersionPreserved: boolean;
  reasonCodes: readonly ModelLifecycleReasonCode[];
}

export type CoreHostObservabilityHelperOperation =
  | "preflight"
  | "artifact_verification"
  | "health"
  | "load"
  | "embed"
  | "release";

export type CoreHostObservabilityHelperStatus =
  | "not_started"
  | "passed"
  | "degraded"
  | "blocked"
  | "failed"
  | "timeout"
  | "cancelled";

export interface CoreHostObservabilityHelperReport {
  operation: CoreHostObservabilityHelperOperation;
  status: CoreHostObservabilityHelperStatus;
  timeoutOccurred?: boolean;
  cancelled?: boolean;
}

export interface CoreHostObservabilitySession {
  observeLifecycleReport(report: unknown): ObservabilityObserveResult;
  observeHelperReport(report: unknown): ObservabilityObserveResult;
  summarize(): ObservabilitySummary;
  release(): void;
}

const LIFECYCLE_REPORT_KEYS = new Set([
  "operation",
  "status",
  "cleanupStatus",
  "rollbackStatus",
  "previousVersionPreserved",
  "reasonCodes"
]);

const HELPER_REPORT_KEYS = new Set([
  "operation",
  "status",
  "timeoutOccurred",
  "cancelled"
]);

const SENSITIVE_KEY_PATTERN =
  /(?:path|url|credential|secret|token|digest|sha256|model|vector|source|text|diagnostic|exception|stack|command|script|env|cache|artifact|error|message)/iu;

const UNSAFE_STRING_PATTERN = /(?:https?:\/\/|[A-Za-z]:\\|\\\\|\bBearer\b)/iu;

export function createCoreHostObservabilitySession(
  correlationId: string
): CoreHostObservabilitySession {
  const collector = createObservabilityCollector(correlationId);

  return {
    observeLifecycleReport(report: unknown): ObservabilityObserveResult {
      return observeLifecycleReport(collector, correlationId, report);
    },
    observeHelperReport(report: unknown): ObservabilityObserveResult {
      return observeHelperReport(collector, correlationId, report);
    },
    summarize(): ObservabilitySummary {
      return collector.summarize();
    },
    release(): void {
      collector.release();
    }
  };
}

export function observeLifecycleReport(
  collector: ObservabilityCollector,
  correlationId: string,
  report: unknown
): ObservabilityObserveResult {
  const parsed = parseLifecycleReport(report);
  if (!parsed.accepted) {
    return collector.observe(
      createBlockedObservation(correlationId, parsed.failureClass, [
        parsed.reasonCode
      ])
    );
  }

  return collector.observe(
    createLifecycleObservation(correlationId, parsed.report)
  );
}

export function observeHelperReport(
  collector: ObservabilityCollector,
  correlationId: string,
  report: unknown
): ObservabilityObserveResult {
  const parsed = parseHelperReport(report);
  if (!parsed.accepted) {
    return collector.observe(
      createBlockedObservation(correlationId, parsed.failureClass, [
        parsed.reasonCode
      ])
    );
  }

  return collector.observe(
    createHelperObservation(correlationId, parsed.report)
  );
}

type ParsedLifecycleReport =
  | {
      accepted: true;
      report: CoreHostObservabilityLifecycleReport;
    }
  | {
      accepted: false;
      reasonCode: ObservabilityReasonCode;
      failureClass: ObservabilityFailureClass;
    };

type ParsedHelperReport =
  | {
      accepted: true;
      report: CoreHostObservabilityHelperReport;
    }
  | {
      accepted: false;
      reasonCode: ObservabilityReasonCode;
      failureClass: ObservabilityFailureClass;
    };

function parseLifecycleReport(report: unknown): ParsedLifecycleReport {
  if (!isSafeRecordWithKeys(report, LIFECYCLE_REPORT_KEYS)) {
    return rejected("OBSERVATION_INPUT_INVALID", classifyObservabilityFailure(report));
  }

  if (
    !isModelLifecycleOperation(report.operation) ||
    !isModelLifecycleOperationStatus(report.status) ||
    !isModelLifecycleCleanupStatus(report.cleanupStatus) ||
    !isModelLifecycleRollbackStatus(report.rollbackStatus) ||
    typeof report.previousVersionPreserved !== "boolean" ||
    !isLifecycleReasonCodeArray(report.reasonCodes)
  ) {
    return rejected("OBSERVATION_INPUT_INVALID", "INPUT_VERIFICATION_FAILED");
  }

  return {
    accepted: true,
    report: {
      operation: report.operation,
      status: report.status,
      cleanupStatus: report.cleanupStatus,
      rollbackStatus: report.rollbackStatus,
      previousVersionPreserved: report.previousVersionPreserved,
      reasonCodes: [...report.reasonCodes]
    }
  };
}

function parseHelperReport(report: unknown): ParsedHelperReport {
  if (!isSafeRecordWithKeys(report, HELPER_REPORT_KEYS)) {
    return rejected("OBSERVATION_INPUT_INVALID", classifyObservabilityFailure(report));
  }

  if (
    !isHelperOperation(report.operation) ||
    !isHelperStatus(report.status) ||
    (report.timeoutOccurred !== undefined &&
      typeof report.timeoutOccurred !== "boolean") ||
    (report.cancelled !== undefined && typeof report.cancelled !== "boolean")
  ) {
    return rejected("OBSERVATION_INPUT_INVALID", "INPUT_VERIFICATION_FAILED");
  }

  return {
    accepted: true,
    report: {
      operation: report.operation,
      status: report.status,
      ...(report.timeoutOccurred === undefined
        ? {}
        : { timeoutOccurred: report.timeoutOccurred }),
      ...(report.cancelled === undefined ? {} : { cancelled: report.cancelled })
    }
  };
}

function createLifecycleObservation(
  correlationId: string,
  report: CoreHostObservabilityLifecycleReport
): ObservabilityObservation {
  const reasonCodes = mapLifecycleReasonCodes(report);
  const failureClasses = mapLifecycleFailureClasses(report);
  const stopReason = lifecycleStopReason(report);

  return {
    correlationId,
    domain: "model_lifecycle",
    phase: lifecyclePhase(report),
    status: mapLifecycleStatus(report.status),
    ...(report.reasonCodes.includes("MODEL_HEALTH_CHECK_FAILED")
      ? { healthState: "degraded" as const }
      : {}),
    activationState: lifecycleActivationState(report),
    preservationState: report.previousVersionPreserved
      ? "preserved"
      : report.status === "passed"
        ? "not_checked"
        : "unknown",
    rollbackState: lifecycleRollbackState(report.rollbackStatus),
    cleanupState: lifecycleCleanupState(report.cleanupStatus),
    timeoutOccurred: false,
    ...(stopReason === undefined ? {} : { stopReason }),
    reasonCodes: [...reasonCodes],
    failureClasses
  };
}

function createHelperObservation(
  correlationId: string,
  report: CoreHostObservabilityHelperReport
): ObservabilityObservation {
  const status = mapHelperStatus(report);
  const stopReason = helperStopReason(report);
  const failureClasses = helperFailureClasses(report);

  return {
    correlationId,
    domain: "helper_session",
    phase: helperPhase(report.operation),
    status,
    ...(report.operation === "health"
      ? { healthState: helperState(report.status) }
      : {}),
    ...(report.operation === "load"
      ? { loadState: helperState(report.status) }
      : {}),
    ...(report.operation === "release"
      ? { releaseState: helperState(report.status) }
      : {}),
    timeoutOccurred: report.timeoutOccurred === true || report.status === "timeout",
    ...(stopReason === undefined ? {} : { stopReason }),
    reasonCodes: helperReasonCodes(report),
    failureClasses
  };
}

function createBlockedObservation(
  correlationId: string,
  failureClass: ObservabilityFailureClass,
  reasonCodes: readonly ObservabilityReasonCode[]
): ObservabilityObservation {
  return {
    correlationId,
    domain: "model_lifecycle",
    phase: "preflight",
    status: "blocked",
    timeoutOccurred: false,
    stopReason:
      failureClass === "SENSITIVE_OUTPUT_DETECTED"
        ? "sensitive_output_detected"
        : "scope_violation",
    reasonCodes: [...reasonCodes],
    failureClasses: [failureClass]
  };
}

function lifecyclePhase(
  report: CoreHostObservabilityLifecycleReport
): ObservabilityPhase {
  if (report.cleanupStatus === "degraded") {
    return "cleanup";
  }
  if (report.rollbackStatus === "passed" || report.rollbackStatus === "degraded") {
    return "rollback";
  }
  if (report.reasonCodes.includes("MODEL_HEALTH_CHECK_FAILED")) {
    return "health_check";
  }
  if (
    report.reasonCodes.includes("MODEL_ACTIVATION_COMMITTED") ||
    report.reasonCodes.includes("MODEL_ACTIVATION_COMMIT_FAILED") ||
    report.reasonCodes.includes("MODEL_ALREADY_ACTIVE")
  ) {
    return "activation";
  }
  return report.operation === "rollback" ? "rollback" : "install";
}

function mapLifecycleStatus(
  status: ModelLifecycleOperationStatus
): ObservabilityOperationStatus {
  if (status === "passed") {
    return "passed";
  }
  if (status === "degraded") {
    return "degraded";
  }
  return "blocked";
}

function lifecycleActivationState(
  report: CoreHostObservabilityLifecycleReport
): ObservabilityActivationState {
  if (report.reasonCodes.includes("MODEL_ACTIVATION_COMMITTED")) {
    return "committed";
  }
  if (report.reasonCodes.includes("MODEL_ACTIVATION_COMMIT_FAILED")) {
    return "failed";
  }
  if (report.operation === "activate" || report.operation === "install_and_activate") {
    return report.status === "passed" ? "committed" : "not_committed";
  }
  return "not_attempted";
}

function lifecycleRollbackState(
  status: CoreHostObservabilityLifecycleReport["rollbackStatus"]
): ObservabilityRollbackState {
  if (status === "not_required") {
    return "not_required";
  }
  if (status === "passed") {
    return "passed";
  }
  if (status === "degraded") {
    return "degraded";
  }
  return "not_started";
}

function lifecycleCleanupState(
  status: ModelLifecycleCleanupStatus
): ObservabilityCleanupState {
  if (status === "passed") {
    return "passed";
  }
  if (status === "degraded") {
    return "degraded";
  }
  return status;
}

function mapLifecycleReasonCodes(
  report: CoreHostObservabilityLifecycleReport
): ObservabilityReasonCode[] {
  const codes: ObservabilityReasonCode[] = [];
  for (const reasonCode of report.reasonCodes) {
    const mapped = lifecycleReasonCodeMap[reasonCode];
    if (mapped !== undefined && !codes.includes(mapped)) {
      codes.push(mapped);
    }
  }
  if (codes.length === 0) {
    codes.push(
      report.status === "passed"
        ? "OBSERVATION_COMPLETED"
        : report.status === "degraded"
          ? "OBSERVATION_DEGRADED"
          : "OBSERVATION_BLOCKED"
    );
  }
  return codes;
}

function mapLifecycleFailureClasses(
  report: CoreHostObservabilityLifecycleReport
): ObservabilityFailureClass[] {
  const classes: ObservabilityFailureClass[] = [];
  for (const reasonCode of report.reasonCodes) {
    const mapped = lifecycleFailureClassMap[reasonCode];
    if (mapped !== undefined && !classes.includes(mapped)) {
      classes.push(mapped);
    }
  }
  if (
    !report.previousVersionPreserved &&
    report.status !== "passed" &&
    !classes.includes("PRESERVATION_FAILED")
  ) {
    classes.push("PRESERVATION_FAILED");
  }
  if (
    report.status !== "passed" &&
    classes.length === 0
  ) {
    classes.push("UNKNOWN_SANITIZED_FAILURE");
  }
  return classes;
}

function lifecycleStopReason(
  report: CoreHostObservabilityLifecycleReport
): ObservabilityStopReason | undefined {
  if (report.status === "passed") {
    return undefined;
  }
  if (report.cleanupStatus === "degraded") {
    return "cleanup_failed";
  }
  if (report.rollbackStatus === "degraded") {
    return "rollback_failed";
  }
  if (report.reasonCodes.includes("MODEL_HEALTH_CHECK_FAILED")) {
    return "health_failed";
  }
  if (report.reasonCodes.includes("MODEL_ACTIVATION_COMMIT_FAILED")) {
    return "activation_failed";
  }
  if (!report.previousVersionPreserved) {
    return "preservation_failed";
  }
  return report.status === "blocked" ? "scope_violation" : "unexpected_failure";
}

function helperPhase(
  operation: CoreHostObservabilityHelperOperation
): ObservabilityPhase {
  if (operation === "preflight") {
    return "preflight";
  }
  if (operation === "artifact_verification") {
    return "artifact_verification";
  }
  if (operation === "health") {
    return "health_check";
  }
  return operation;
}

function mapHelperStatus(
  report: CoreHostObservabilityHelperReport
): ObservabilityOperationStatus {
  if (report.status === "passed") {
    return "passed";
  }
  if (report.status === "not_started") {
    return "started";
  }
  if (report.status === "blocked") {
    return "blocked";
  }
  if (report.status === "timeout" || report.status === "cancelled") {
    return "stopped";
  }
  return report.status;
}

function helperState(
  status: CoreHostObservabilityHelperStatus
): ObservabilityHealthState {
  if (status === "passed" || status === "degraded" || status === "failed") {
    return status;
  }
  if (status === "not_started") {
    return "not_started";
  }
  return "failed";
}

function helperReasonCodes(
  report: CoreHostObservabilityHelperReport
): ObservabilityReasonCode[] {
  if (report.status === "timeout") {
    return ["HELPER_TIMEOUT", "OBSERVATION_STOPPED"];
  }
  if (report.status === "cancelled" || report.cancelled === true) {
    return ["HELPER_CANCELLED", "OBSERVATION_STOPPED"];
  }
  if (report.status === "degraded") {
    return ["OBSERVATION_DEGRADED"];
  }
  if (report.status === "failed") {
    if (report.operation === "embed") {
      return ["HELPER_EMBED_FAILED"];
    }
    return ["OBSERVATION_FAILED"];
  }
  if (report.status === "blocked") {
    return ["OBSERVATION_BLOCKED"];
  }
  if (report.operation === "health" && report.status === "passed") {
    return ["HELPER_HEALTH_PASSED"];
  }
  if (report.operation === "load" && report.status === "passed") {
    return ["HELPER_LOAD_PASSED"];
  }
  if (report.operation === "embed" && report.status === "passed") {
    return ["HELPER_EMBED_PASSED"];
  }
  if (report.operation === "release" && report.status === "passed") {
    return ["HELPER_RELEASE_PASSED"];
  }
  if (
    (report.operation === "preflight" ||
      report.operation === "artifact_verification") &&
    report.status === "passed"
  ) {
    return ["OBSERVATION_COMPLETED"];
  }
  return ["OBSERVATION_STARTED"];
}

function helperFailureClasses(
  report: CoreHostObservabilityHelperReport
): ObservabilityFailureClass[] {
  if (
    report.status === "timeout" ||
    report.status === "cancelled" ||
    report.cancelled === true
  ) {
    return ["TIMEOUT_OR_CANCELLATION"];
  }
  if (report.status === "passed" || report.status === "not_started") {
    return [];
  }
  if (report.status === "blocked" || report.operation === "preflight") {
    return ["APPROVAL_OR_SCOPE_BLOCKED"];
  }
  if (report.operation === "artifact_verification") {
    return ["INPUT_VERIFICATION_FAILED"];
  }
  if (report.operation === "health") {
    return ["HELPER_HEALTH_FAILED"];
  }
  if (report.operation === "load") {
    return ["HELPER_LOAD_FAILED"];
  }
  if (report.operation === "embed") {
    return ["HELPER_EMBED_FAILED"];
  }
  return ["HELPER_RELEASE_FAILED"];
}

function helperStopReason(
  report: CoreHostObservabilityHelperReport
): ObservabilityStopReason | undefined {
  if (report.status === "timeout" || report.timeoutOccurred === true) {
    return "timeout";
  }
  if (report.status === "cancelled" || report.cancelled === true) {
    return "cancellation";
  }
  if (
    report.status !== "failed" &&
    report.status !== "degraded" &&
    report.status !== "blocked"
  ) {
    return undefined;
  }
  if (report.operation === "preflight") {
    return "scope_violation";
  }
  if (report.operation === "artifact_verification") {
    return "artifact_verification_failed";
  }
  if (report.operation === "health") {
    return "health_failed";
  }
  if (report.operation === "load") {
    return "load_failed";
  }
  if (report.operation === "embed") {
    return "embed_failed";
  }
  return "release_failed";
}

const lifecycleReasonCodeMap: Record<
  ModelLifecycleReasonCode,
  ObservabilityReasonCode | undefined
> = {
  MODEL_ACTIVATION_COMMITTED: "MODEL_ACTIVATION_COMMITTED",
  MODEL_ALREADY_ACTIVE: "OBSERVATION_COMPLETED",
  MODEL_ACTIVE_VERSION_NOT_VERIFIED: "OBSERVATION_INPUT_INVALID",
  MODEL_ARTIFACT_FETCH_FAILED: "OBSERVATION_FAILED",
  MODEL_ARTIFACT_INVENTORY_WRITE_FAILED: "OBSERVATION_FAILED",
  MODEL_ARTIFACT_SHA256_MISMATCH: "OBSERVATION_INPUT_INVALID",
  MODEL_ACTIVATION_COMMIT_FAILED: "MODEL_ACTIVATION_FAILED",
  MODEL_CLEANUP_FAILED: "MODEL_CLEANUP_FAILED",
  MODEL_DEVICE_CAPABILITY_REQUIRED: "OBSERVATION_BLOCKED",
  MODEL_FAILED_UPDATE_CLEANED: "MODEL_CLEANUP_PASSED",
  MODEL_HEALTH_CHECK_FAILED: "MODEL_HEALTH_CHECK_FAILED",
  MODEL_INSTALLATION_BLOCKED: "OBSERVATION_BLOCKED",
  MODEL_NO_PREVIOUS_VERSION: "MODEL_ROLLBACK_FAILED",
  MODEL_ROLLBACK_COMMITTED: "MODEL_ROLLBACK_COMMITTED",
  MODEL_ROLLBACK_VERSION_NOT_VERIFIED: "MODEL_ROLLBACK_FAILED",
  MODEL_SHA256_REQUIRED: "OBSERVATION_INPUT_INVALID",
  MODEL_VERSION_NOT_FOUND: "OBSERVATION_INPUT_INVALID",
  MODEL_VERSION_NOT_VERIFIED: "OBSERVATION_INPUT_INVALID"
};

const lifecycleFailureClassMap: Record<
  ModelLifecycleReasonCode,
  ObservabilityFailureClass | undefined
> = {
  MODEL_ACTIVATION_COMMITTED: undefined,
  MODEL_ALREADY_ACTIVE: undefined,
  MODEL_ACTIVE_VERSION_NOT_VERIFIED: "INPUT_VERIFICATION_FAILED",
  MODEL_ARTIFACT_FETCH_FAILED: "INPUT_VERIFICATION_FAILED",
  MODEL_ARTIFACT_INVENTORY_WRITE_FAILED: "INPUT_VERIFICATION_FAILED",
  MODEL_ARTIFACT_SHA256_MISMATCH: "INPUT_VERIFICATION_FAILED",
  MODEL_ACTIVATION_COMMIT_FAILED: "ACTIVATION_FAILED",
  MODEL_CLEANUP_FAILED: "CLEANUP_FAILED",
  MODEL_DEVICE_CAPABILITY_REQUIRED: "APPROVAL_OR_SCOPE_BLOCKED",
  MODEL_FAILED_UPDATE_CLEANED: undefined,
  MODEL_HEALTH_CHECK_FAILED: "HELPER_HEALTH_FAILED",
  MODEL_INSTALLATION_BLOCKED: "APPROVAL_OR_SCOPE_BLOCKED",
  MODEL_NO_PREVIOUS_VERSION: "ROLLBACK_FAILED",
  MODEL_ROLLBACK_COMMITTED: undefined,
  MODEL_ROLLBACK_VERSION_NOT_VERIFIED: "ROLLBACK_FAILED",
  MODEL_SHA256_REQUIRED: "INPUT_VERIFICATION_FAILED",
  MODEL_VERSION_NOT_FOUND: "INPUT_VERIFICATION_FAILED",
  MODEL_VERSION_NOT_VERIFIED: "INPUT_VERIFICATION_FAILED"
};

function isSafeRecordWithKeys(
  value: unknown,
  allowedKeys: ReadonlySet<string>
): value is Record<string, unknown> {
  if (!isPlainRecord(value)) {
    return false;
  }
  for (const [key, item] of Object.entries(value)) {
    if (
      !allowedKeys.has(key) ||
      SENSITIVE_KEY_PATTERN.test(key) ||
      hasUnsafeStringValue(item)
    ) {
      return false;
    }
  }
  return true;
}

function hasUnsafeStringValue(value: unknown): boolean {
  if (typeof value === "string") {
    return UNSAFE_STRING_PATTERN.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((item) => hasUnsafeStringValue(item));
  }
  if (isRecord(value)) {
    return Object.values(value).some((item) => hasUnsafeStringValue(item));
  }
  return false;
}

function rejected(
  reasonCode: ObservabilityReasonCode,
  failureClass: ObservabilityFailureClass
): ParsedLifecycleReport & ParsedHelperReport {
  return {
    accepted: false,
    reasonCode,
    failureClass
  };
}

function isLifecycleReasonCodeArray(
  value: unknown
): value is ModelLifecycleReasonCode[] {
  return (
    Array.isArray(value) &&
    value.length <= 32 &&
    value.every((item) => isModelLifecycleReasonCode(item)) &&
    new Set(value).size === value.length
  );
}

function isModelLifecycleOperation(
  value: unknown
): value is ModelLifecycleOperation {
  return (
    value === "install_and_activate" ||
    value === "activate" ||
    value === "rollback"
  );
}

function isModelLifecycleOperationStatus(
  value: unknown
): value is ModelLifecycleOperationStatus {
  return value === "blocked" || value === "degraded" || value === "passed";
}

function isModelLifecycleCleanupStatus(
  value: unknown
): value is ModelLifecycleCleanupStatus {
  return (
    value === "not_started" ||
    value === "not_required" ||
    value === "passed" ||
    value === "degraded"
  );
}

function isModelLifecycleRollbackStatus(
  value: unknown
): value is CoreHostObservabilityLifecycleReport["rollbackStatus"] {
  return (
    value === "not_started" ||
    value === "not_required" ||
    value === "passed" ||
    value === "degraded"
  );
}

function isModelLifecycleReasonCode(
  value: unknown
): value is ModelLifecycleReasonCode {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(lifecycleReasonCodeMap, value)
  );
}

function isHelperOperation(
  value: unknown
): value is CoreHostObservabilityHelperOperation {
  return (
    value === "preflight" ||
    value === "artifact_verification" ||
    value === "health" ||
    value === "load" ||
    value === "embed" ||
    value === "release"
  );
}

function isHelperStatus(
  value: unknown
): value is CoreHostObservabilityHelperStatus {
  return (
    value === "not_started" ||
    value === "passed" ||
    value === "degraded" ||
    value === "blocked" ||
    value === "failed" ||
    value === "timeout" ||
    value === "cancelled"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.getPrototypeOf(value) === Object.prototype;
}
