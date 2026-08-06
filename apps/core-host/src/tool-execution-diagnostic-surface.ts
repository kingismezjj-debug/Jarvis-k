import {
  ToolExecutionResultSchema,
  ToolPolicyDecisionSchema,
  ToolReasonCodeSchema,
  type ToolCleanupState,
  type ToolExecutionCounters,
  type ToolExecutionLifecycleStatus,
  type ToolExecutionResult,
  type ToolFailureClass,
  type ToolPolicyDecision,
  type ToolReasonCode,
  type ToolRollbackState
} from "@jarvis-k/contracts";

export type CoreHostToolExecutionDiagnosticReason =
  | "tool_execution_summary_attached"
  | "tool_execution_summary_missing"
  | "tool_execution_summary_rejected"
  | "tool_execution_summary_not_requested";

export type CoreHostToolExecutionDiagnosticStatus =
  | ToolExecutionLifecycleStatus
  | ToolPolicyDecision["status"]
  | "evaluated"
  | "executed"
  | "blocked"
  | "released";

export interface CoreHostToolExecutionDiagnosticCounters
  extends Partial<ToolExecutionCounters> {
  toolCount?: number;
  decisionCount?: number;
  executionCount?: number;
}

export interface CoreHostToolExecutionDiagnosticSubreport {
  toolExecutionAttached: boolean;
  diagnosticReason: CoreHostToolExecutionDiagnosticReason;
  toolId?: string;
  status?: CoreHostToolExecutionDiagnosticStatus;
  wrapperStatus?: "evaluated" | "executed" | "blocked" | "released";
  resultCode?: ToolReasonCode;
  reasonCodes: readonly ToolReasonCode[];
  failureClasses: readonly ToolFailureClass[];
  timeoutOccurred?: boolean;
  cancelled?: boolean;
  rollbackState?: ToolRollbackState;
  cleanupState?: ToolCleanupState;
  confirmationRequired?: boolean;
  confirmationGranted?: boolean;
  counters?: CoreHostToolExecutionDiagnosticCounters;
  sessionReleased?: boolean;
  persisted: false;
  rawDiagnosticsExposed: false;
}

export type CoreHostToolExecutionAttachmentResult =
  | {
      attached: true;
      report: Record<string, unknown> & {
        toolExecution: CoreHostToolExecutionDiagnosticSubreport;
      };
    }
  | {
      attached: false;
      reason: CoreHostToolExecutionDiagnosticReason;
      toolExecution: CoreHostToolExecutionDiagnosticSubreport;
    };

export interface CreateCoreHostToolExecutionDiagnosticSurfaceOptions {
  requested: boolean;
  summary?: unknown;
}

export interface AttachCoreHostToolExecutionDiagnosticSurfaceOptions
  extends CreateCoreHostToolExecutionDiagnosticSurfaceOptions {
  report: unknown;
}

const SAFE_REPORT_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/u;
const UNSAFE_STRING_PATTERN =
  /(?:https?:\/\/|[A-Za-z]:\\|\\\\|\bBearer\b|BEGIN [A-Z ]+KEY)/iu;
const SENSITIVE_KEY_PATTERN =
  /(?:path|url|credential|secret|token|digest|sha256|model|vector|source|text|diagnostic|exception|stack|command|script|env|cache|artifact|error|message|process|pid|host|user|tester|stdout|stderr|output|input|descriptor|policy|memory|raw)/iu;
const ALLOWED_SUMMARY_KEYS = new Set([
  "requestId",
  "toolId",
  "status",
  "resultCode",
  "reasonCode",
  "reasonCodes",
  "failureClasses",
  "timeoutOccurred",
  "cancelled",
  "rollbackState",
  "cleanupState",
  "counters",
  "startedAt",
  "completedAt",
  "audit",
  "policyVersion",
  "decision",
  "confirmationRequired",
  "confirmationGranted",
  "evaluatedAt",
  "allowed",
  "accepted",
  "toolCount",
  "decisionCount",
  "executionCount",
  "sessionReleased",
  "persisted",
  "rawDiagnosticsExposed",
  "result"
]);
const SESSION_SUMMARY_KEYS = new Set([
  "toolCount",
  "decisionCount",
  "executionCount",
  "sessionReleased",
  "persisted",
  "rawDiagnosticsExposed"
]);
const WRAPPER_STATUS_VALUES = new Set([
  "evaluated",
  "executed",
  "blocked",
  "released"
]);

export function createCoreHostToolExecutionDiagnosticSurface(
  options: CreateCoreHostToolExecutionDiagnosticSurfaceOptions
): CoreHostToolExecutionDiagnosticSubreport {
  if (!options.requested) {
    return emptySubreport("tool_execution_summary_not_requested");
  }

  if (options.summary === undefined) {
    return emptySubreport("tool_execution_summary_missing");
  }

  if (containsSensitiveSummaryField(options.summary)) {
    return rejectedSubreport("SENSITIVE_OUTPUT_DETECTED");
  }

  const parsed = parseDiagnosticSummary(options.summary);
  if (parsed === undefined) {
    return rejectedSubreport("UNKNOWN_SANITIZED_FAILURE");
  }
  return parsed;
}

export function attachCoreHostToolExecutionDiagnosticSurface(
  options: AttachCoreHostToolExecutionDiagnosticSurfaceOptions
): CoreHostToolExecutionAttachmentResult {
  const toolExecution = createCoreHostToolExecutionDiagnosticSurface(options);
  if (!toolExecution.toolExecutionAttached) {
    return {
      attached: false,
      reason: toolExecution.diagnosticReason,
      toolExecution
    };
  }

  const sanitizedReport = sanitizeReportShape(options.report);
  if (sanitizedReport === undefined) {
    const rejected = rejectedSubreport("SENSITIVE_OUTPUT_DETECTED");
    return {
      attached: false,
      reason: rejected.diagnosticReason,
      toolExecution: rejected
    };
  }

  return {
    attached: true,
    report: {
      ...sanitizedReport,
      toolExecution
    }
  };
}

function parseDiagnosticSummary(
  summary: unknown
): CoreHostToolExecutionDiagnosticSubreport | undefined {
  const result = ToolExecutionResultSchema.safeParse(summary);
  if (result.success) {
    return executionResultSubreport(result.data);
  }

  const decision = ToolPolicyDecisionSchema.safeParse(summary);
  if (decision.success) {
    return policyDecisionSubreport(decision.data);
  }

  const wrapper = parseWrapperReport(summary);
  if (wrapper !== undefined) {
    return wrapper;
  }

  return parseSessionSummary(summary);
}

function parseWrapperReport(
  summary: unknown
): CoreHostToolExecutionDiagnosticSubreport | undefined {
  if (!isPlainRecord(summary)) {
    return undefined;
  }
  if (
    typeof summary.accepted !== "boolean" ||
    typeof summary.status !== "string" ||
    !WRAPPER_STATUS_VALUES.has(summary.status) ||
    typeof summary.toolCount !== "number" ||
    !isBoundedCounter(summary.toolCount) ||
    typeof summary.sessionReleased !== "boolean"
  ) {
    return undefined;
  }
  const wrapperStatus = summary.status as
    | "evaluated"
    | "executed"
    | "blocked"
    | "released";
  const reasonCode = ToolReasonCodeSchema.safeParse(summary.reasonCode);
  if (!reasonCode.success) {
    return undefined;
  }

  if (summary.result !== undefined) {
    const result = ToolExecutionResultSchema.safeParse(summary.result);
    if (!result.success) {
      return undefined;
    }
    return {
      ...executionResultSubreport(result.data),
      wrapperStatus,
      sessionReleased: summary.sessionReleased,
      counters: {
        ...result.data.counters,
        toolCount: summary.toolCount
      }
    };
  }

  if (summary.decision !== undefined) {
    const decision = ToolPolicyDecisionSchema.safeParse(summary.decision);
    if (!decision.success) {
      return undefined;
    }
    return {
      ...policyDecisionSubreport(decision.data),
      wrapperStatus,
      sessionReleased: summary.sessionReleased,
      counters: {
        toolCount: summary.toolCount,
        decisionCount: 1,
        reasonCodeCount: 1,
        failureClassCount: classifyToolFailure(decision.data.reasonCode).length
      }
    };
  }

  return {
    toolExecutionAttached: true,
    diagnosticReason: "tool_execution_summary_attached",
    status: wrapperStatus,
    wrapperStatus,
    resultCode: reasonCode.data,
    reasonCodes: [reasonCode.data],
    failureClasses: classifyToolFailure(reasonCode.data),
    counters: {
      toolCount: summary.toolCount,
      reasonCodeCount: 1,
      failureClassCount: classifyToolFailure(reasonCode.data).length
    },
    sessionReleased: summary.sessionReleased,
    persisted: false,
    rawDiagnosticsExposed: false
  };
}

function parseSessionSummary(
  summary: unknown
): CoreHostToolExecutionDiagnosticSubreport | undefined {
  if (!isPlainRecord(summary)) {
    return undefined;
  }
  if (
    Object.keys(summary).some((key) => !SESSION_SUMMARY_KEYS.has(key)) ||
    !isBoundedCounter(summary.toolCount) ||
    !isBoundedCounter(summary.decisionCount) ||
    !isBoundedCounter(summary.executionCount) ||
    typeof summary.sessionReleased !== "boolean" ||
    summary.persisted !== false ||
    summary.rawDiagnosticsExposed !== false
  ) {
    return undefined;
  }
  return {
    toolExecutionAttached: true,
    diagnosticReason: "tool_execution_summary_attached",
    status: summary.sessionReleased ? "released" : "evaluated",
    reasonCodes: [],
    failureClasses: [],
    counters: {
      toolCount: summary.toolCount,
      decisionCount: summary.decisionCount,
      executionCount: summary.executionCount
    },
    sessionReleased: summary.sessionReleased,
    persisted: false,
    rawDiagnosticsExposed: false
  };
}

function executionResultSubreport(
  result: ToolExecutionResult
): CoreHostToolExecutionDiagnosticSubreport {
  return {
    toolExecutionAttached: true,
    diagnosticReason: "tool_execution_summary_attached",
    toolId: result.toolId,
    status: result.status,
    resultCode: result.resultCode,
    reasonCodes: [...result.reasonCodes],
    failureClasses: [...result.failureClasses],
    timeoutOccurred: result.timeoutOccurred,
    cancelled: result.cancelled,
    rollbackState: result.rollbackState,
    cleanupState: result.cleanupState,
    confirmationRequired: result.audit.confirmationRequired,
    confirmationGranted: result.audit.confirmationGranted,
    counters: { ...result.counters },
    persisted: false,
    rawDiagnosticsExposed: false
  };
}

function policyDecisionSubreport(
  decision: ToolPolicyDecision
): CoreHostToolExecutionDiagnosticSubreport {
  const failureClasses = classifyToolFailure(decision.reasonCode);
  return {
    toolExecutionAttached: true,
    diagnosticReason: "tool_execution_summary_attached",
    toolId: decision.toolId,
    status: decision.status,
    resultCode: decision.reasonCode,
    reasonCodes: [decision.reasonCode],
    failureClasses,
    confirmationRequired: decision.confirmationRequired,
    confirmationGranted: decision.audit.confirmationGranted,
    counters: {
      decisionCount: 1,
      reasonCodeCount: 1,
      failureClassCount: failureClasses.length
    },
    persisted: false,
    rawDiagnosticsExposed: false
  };
}

function emptySubreport(
  diagnosticReason: Exclude<
    CoreHostToolExecutionDiagnosticReason,
    "tool_execution_summary_attached" | "tool_execution_summary_rejected"
  >
): CoreHostToolExecutionDiagnosticSubreport {
  return {
    toolExecutionAttached: false,
    diagnosticReason,
    reasonCodes: [],
    failureClasses: [],
    persisted: false,
    rawDiagnosticsExposed: false
  };
}

function rejectedSubreport(
  failureClass: ToolFailureClass
): CoreHostToolExecutionDiagnosticSubreport {
  const resultCode =
    failureClass === "SENSITIVE_OUTPUT_DETECTED"
      ? "SENSITIVE_OUTPUT_DETECTED"
      : "UNKNOWN_SANITIZED_FAILURE";
  return {
    toolExecutionAttached: false,
    diagnosticReason: "tool_execution_summary_rejected",
    status: "blocked",
    resultCode,
    reasonCodes: [resultCode],
    failureClasses: [failureClass],
    timeoutOccurred: false,
    persisted: false,
    rawDiagnosticsExposed: false
  };
}

function classifyToolFailure(reasonCode: ToolReasonCode): ToolFailureClass[] {
  if (
    reasonCode === "TOOL_NOT_ALLOWLISTED" ||
    reasonCode === "TOOL_BLOCKED" ||
    reasonCode === "PERMISSION_DENIED" ||
    reasonCode === "INVALID_TOOL_REQUEST"
  ) {
    return ["POLICY_DENIED"];
  }
  if (reasonCode === "CONFIRMATION_REQUIRED") {
    return ["CONFIRMATION_MISSING"];
  }
  if (
    reasonCode === "EXECUTION_DISABLED" ||
    reasonCode === "WINDOWS_EXECUTION_DISABLED" ||
    reasonCode === "SHELL_EXECUTION_DISABLED" ||
    reasonCode === "NETWORK_EXECUTION_DISABLED"
  ) {
    return ["EXECUTION_DISABLED"];
  }
  if (reasonCode === "FIXTURE_EXECUTOR_UNAVAILABLE") {
    return ["FIXTURE_UNAVAILABLE"];
  }
  if (
    reasonCode === "TOOL_EXECUTION_TIMED_OUT" ||
    reasonCode === "TOOL_EXECUTION_CANCELLED"
  ) {
    return ["TIMEOUT_OR_CANCELLATION"];
  }
  if (reasonCode === "TOOL_SANDBOX_SCOPE_VIOLATION") {
    return ["SANDBOX_SCOPE_VIOLATION"];
  }
  if (reasonCode === "TOOL_ROLLBACK_FAILED") {
    return ["ROLLBACK_FAILED"];
  }
  if (reasonCode === "TOOL_CLEANUP_FAILED") {
    return ["CLEANUP_FAILED"];
  }
  if (reasonCode === "SENSITIVE_OUTPUT_DETECTED") {
    return ["SENSITIVE_OUTPUT_DETECTED"];
  }
  if (reasonCode === "UNKNOWN_SANITIZED_FAILURE") {
    return ["UNKNOWN_SANITIZED_FAILURE"];
  }
  return [];
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

function containsSensitiveSummaryField(value: unknown): boolean {
  if (typeof value === "string") {
    return UNSAFE_STRING_PATTERN.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsSensitiveSummaryField(item));
  }
  if (!isRecord(value)) {
    return false;
  }
  return Object.entries(value).some(([key, item]) => {
    if (
      !ALLOWED_SUMMARY_KEYS.has(key) &&
      (SENSITIVE_KEY_PATTERN.test(key) || containsUnsafeString(item))
    ) {
      return true;
    }
    return containsSensitiveSummaryField(item);
  });
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
    return isBoundedCounter(value);
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

function containsUnsafeString(value: unknown): boolean {
  if (typeof value === "string") {
    return UNSAFE_STRING_PATTERN.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsUnsafeString(item));
  }
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).some((item) => containsUnsafeString(item));
}

function isBoundedCounter(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 1_024
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.getPrototypeOf(value) === Object.prototype;
}
