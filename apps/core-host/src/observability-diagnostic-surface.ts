import {
  ObservabilitySummarySchema,
  type ObservabilityActivationState,
  type ObservabilityCleanupState,
  type ObservabilityCounters,
  type ObservabilityFailureClass,
  type ObservabilityHealthState,
  type ObservabilityOperationStatus,
  type ObservabilityPhase,
  type ObservabilityPreservationState,
  type ObservabilityReasonCode,
  type ObservabilityRollbackState,
  type ObservabilityStopReason,
  type ObservabilitySummary
} from "@jarvis-k/contracts";

export type CoreHostObservabilityDiagnosticReason =
  | "observability_summary_attached"
  | "observability_summary_missing"
  | "observability_summary_rejected"
  | "observability_summary_not_requested";

export interface CoreHostObservabilityDiagnosticSubreport {
  observabilityAttached: boolean;
  diagnosticReason: CoreHostObservabilityDiagnosticReason;
  status?: ObservabilityOperationStatus;
  currentPhase?: ObservabilityPhase;
  healthState?: ObservabilityHealthState;
  loadState?: ObservabilityHealthState;
  releaseState?: ObservabilityHealthState;
  activationState?: ObservabilityActivationState;
  preservationState?: ObservabilityPreservationState;
  rollbackState?: ObservabilityRollbackState;
  cleanupState?: ObservabilityCleanupState;
  timeoutOccurred?: boolean;
  stopReason?: ObservabilityStopReason;
  reasonCodes: readonly ObservabilityReasonCode[];
  failureClasses: readonly ObservabilityFailureClass[];
  counters?: ObservabilityCounters;
  released?: boolean;
  persisted: false;
  rawDiagnosticsExposed: false;
}

export type CoreHostObservabilityAttachmentResult =
  | {
      attached: true;
      report: Record<string, unknown> & {
        observability: CoreHostObservabilityDiagnosticSubreport;
      };
    }
  | {
      attached: false;
      reason: CoreHostObservabilityDiagnosticReason;
      observability: CoreHostObservabilityDiagnosticSubreport;
    };

export interface CreateCoreHostObservabilityDiagnosticSurfaceOptions {
  requested: boolean;
  expectedCorrelationId?: string;
  summary?: unknown;
}

export interface AttachCoreHostObservabilityDiagnosticSurfaceOptions
  extends CreateCoreHostObservabilityDiagnosticSurfaceOptions {
  report: unknown;
}

const SAFE_REPORT_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/u;
const SENSITIVE_KEY_PATTERN =
  /(?:path|url|credential|secret|token|digest|sha256|model|vector|source|text|diagnostic|exception|stack|command|script|env|cache|artifact|error|message|process|pid|host|user|tester)/iu;
const UNSAFE_STRING_PATTERN =
  /(?:https?:\/\/|[A-Za-z]:\\|\\\\|\bBearer\b|BEGIN [A-Z ]+KEY)/iu;
const OBSERVABILITY_SUMMARY_KEYS = new Set([
  "correlationId",
  "domains",
  "currentPhase",
  "status",
  "healthState",
  "loadState",
  "releaseState",
  "activationState",
  "preservationState",
  "rollbackState",
  "cleanupState",
  "timeoutOccurred",
  "stopReason",
  "reasonCodes",
  "failureClasses",
  "counters",
  "released",
  "persisted",
  "rawDiagnosticsExposed"
]);
const OBSERVABILITY_COUNTER_KEYS = new Set([
  "observationCount",
  "rejectedObservationCount",
  "startedCount",
  "passedCount",
  "degradedCount",
  "blockedCount",
  "failedCount",
  "stoppedCount",
  "timeoutCount",
  "reasonCodeCount",
  "failureClassCount"
]);

export function createCoreHostObservabilityDiagnosticSurface(
  options: CreateCoreHostObservabilityDiagnosticSurfaceOptions
): CoreHostObservabilityDiagnosticSubreport {
  if (!options.requested) {
    return emptySubreport("observability_summary_not_requested");
  }

  if (options.summary === undefined) {
    return emptySubreport("observability_summary_missing");
  }

  if (containsSensitiveSummaryField(options.summary)) {
    return rejectedSubreport("SENSITIVE_OUTPUT_DETECTED");
  }

  const parsed = ObservabilitySummarySchema.safeParse(options.summary);
  if (!parsed.success) {
    return rejectedSubreport("INPUT_VERIFICATION_FAILED");
  }

  if (
    options.expectedCorrelationId !== undefined &&
    parsed.data.correlationId !== options.expectedCorrelationId
  ) {
    return rejectedSubreport("APPROVAL_OR_SCOPE_BLOCKED");
  }

  return summarySubreport(parsed.data);
}

export function attachCoreHostObservabilityDiagnosticSurface(
  options: AttachCoreHostObservabilityDiagnosticSurfaceOptions
): CoreHostObservabilityAttachmentResult {
  const observability = createCoreHostObservabilityDiagnosticSurface(options);
  if (!observability.observabilityAttached) {
    return {
      attached: false,
      reason: observability.diagnosticReason,
      observability
    };
  }

  const sanitizedReport = sanitizeReportShape(options.report);
  if (sanitizedReport === undefined) {
    const rejected = rejectedSubreport("SENSITIVE_OUTPUT_DETECTED");
    return {
      attached: false,
      reason: rejected.diagnosticReason,
      observability: rejected
    };
  }

  return {
    attached: true,
    report: {
      ...sanitizedReport,
      observability
    }
  };
}

function summarySubreport(
  summary: ObservabilitySummary
): CoreHostObservabilityDiagnosticSubreport {
  return {
    observabilityAttached: true,
    diagnosticReason: "observability_summary_attached",
    status: summary.status,
    currentPhase: summary.currentPhase,
    healthState: summary.healthState,
    loadState: summary.loadState,
    releaseState: summary.releaseState,
    activationState: summary.activationState,
    preservationState: summary.preservationState,
    rollbackState: summary.rollbackState,
    cleanupState: summary.cleanupState,
    timeoutOccurred: summary.timeoutOccurred,
    ...(summary.stopReason === undefined
      ? {}
      : { stopReason: summary.stopReason }),
    reasonCodes: [...summary.reasonCodes],
    failureClasses: [...summary.failureClasses],
    counters: { ...summary.counters },
    released: summary.released,
    persisted: false,
    rawDiagnosticsExposed: false
  };
}

function emptySubreport(
  diagnosticReason: Exclude<
    CoreHostObservabilityDiagnosticReason,
    "observability_summary_attached" | "observability_summary_rejected"
  >
): CoreHostObservabilityDiagnosticSubreport {
  return {
    observabilityAttached: false,
    diagnosticReason,
    reasonCodes: [],
    failureClasses: [],
    persisted: false,
    rawDiagnosticsExposed: false
  };
}

function rejectedSubreport(
  failureClass: ObservabilityFailureClass
): CoreHostObservabilityDiagnosticSubreport {
  return {
    observabilityAttached: false,
    diagnosticReason: "observability_summary_rejected",
    status: "blocked",
    currentPhase: "preflight",
    timeoutOccurred: false,
    stopReason:
      failureClass === "SENSITIVE_OUTPUT_DETECTED"
        ? "sensitive_output_detected"
        : "scope_violation",
    reasonCodes: ["OBSERVATION_INPUT_INVALID"],
    failureClasses: [failureClass],
    persisted: false,
    rawDiagnosticsExposed: false
  };
}

function sanitizeReportShape(
  report: unknown
): Record<string, unknown> | undefined {
  if (!isPlainRecord(report) || Object.keys(report).length > 64) {
    return undefined;
  }
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(report)) {
    if (
      !SAFE_REPORT_KEY_PATTERN.test(key) ||
      SENSITIVE_KEY_PATTERN.test(key) ||
      value === undefined ||
      !isSafeReportValue(value)
    ) {
      return undefined;
    }
    sanitized[key] = cloneSafeReportValue(value);
  }
  return sanitized;
}

function isSafeReportValue(value: unknown, depth = 0): boolean {
  if (depth > 2) {
    return false;
  }
  if (typeof value === "string") {
    return (
      value.length <= 500 &&
      !UNSAFE_STRING_PATTERN.test(value) &&
      !/[\u0000-\u001f\u007f]/u.test(value)
    );
  }
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0 && value <= 1_024;
  }
  if (typeof value === "boolean" || value === null) {
    return true;
  }
  if (Array.isArray(value)) {
    return (
      value.length <= 32 &&
      value.every((item) => isSafeReportValue(item, depth + 1))
    );
  }
  if (isPlainRecord(value)) {
    return (
      Object.keys(value).length <= 32 &&
      Object.entries(value).every(
        ([key, item]) =>
          SAFE_REPORT_KEY_PATTERN.test(key) &&
          !SENSITIVE_KEY_PATTERN.test(key) &&
          isSafeReportValue(item, depth + 1)
      )
    );
  }
  return false;
}

function cloneSafeReportValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneSafeReportValue(item));
  }
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        cloneSafeReportValue(item)
      ])
    );
  }
  return value;
}

function containsSensitiveSummaryField(value: unknown): boolean {
  if (!isRecord(value)) {
    return typeof value === "string" && UNSAFE_STRING_PATTERN.test(value);
  }
  return Object.entries(value).some(([key, item]) => {
    if (!OBSERVABILITY_SUMMARY_KEYS.has(key)) {
      return SENSITIVE_KEY_PATTERN.test(key) || containsUnsafeString(item);
    }
    if (key === "counters") {
      return containsSensitiveCounterField(item);
    }
    return containsUnsafeString(item);
  });
}

function containsSensitiveCounterField(value: unknown): boolean {
  if (!isRecord(value)) {
    return true;
  }
  return Object.entries(value).some(
    ([key, item]) =>
      !OBSERVABILITY_COUNTER_KEYS.has(key) || containsUnsafeString(item)
  );
}

function containsUnsafeString(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsUnsafeString(item));
  }
  if (!isRecord(value)) {
    return typeof value === "string" && UNSAFE_STRING_PATTERN.test(value);
  }
  return Object.entries(value).some(
    ([key, item]) =>
      SENSITIVE_KEY_PATTERN.test(key) || containsUnsafeString(item)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.getPrototypeOf(value) === Object.prototype;
}
