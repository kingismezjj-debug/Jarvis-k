import {
  OBSERVABILITY_MAX_FAILURE_CLASSES,
  OBSERVABILITY_MAX_OBSERVATIONS,
  OBSERVABILITY_MAX_REASON_CODES,
  ObservabilityCorrelationIdSchema,
  ObservabilityFailureClassSchema,
  ObservabilityObservationSchema,
  ObservabilitySummarySchema,
  createId,
  type ObservabilityCorrelationId,
  type ObservabilityFailureClass,
  type ObservabilityActivationState,
  type ObservabilityCleanupState,
  type ObservabilityHealthState,
  type ObservabilityObservation,
  type ObservabilityOperationDomain,
  type ObservabilityOperationStatus,
  type ObservabilityPreservationState,
  type ObservabilityReasonCode,
  type ObservabilityRollbackState,
  type ObservabilitySummary
} from "@jarvis-k/contracts";

const SENSITIVE_KEY_PATTERN =
  /(?:path|url|credential|secret|token|digest|sha256|model|vector|source|text|diagnostic|exception|stack|command|script|env|cache|artifact|error|message)/iu;

export interface ObservabilityAcceptedResult {
  accepted: true;
  observationCount: number;
}

export interface ObservabilityRejectedResult {
  accepted: false;
  reasonCode: ObservabilityReasonCode;
  failureClass: ObservabilityFailureClass;
}

export type ObservabilityObserveResult =
  | ObservabilityAcceptedResult
  | ObservabilityRejectedResult;

export type ObservabilitySanitizationResult =
  | {
      accepted: true;
      observation: ObservabilityObservation;
    }
  | ObservabilityRejectedResult;

export interface ObservabilityCollector {
  observe(input: unknown): ObservabilityObserveResult;
  summarize(): ObservabilitySummary;
  release(): void;
}

export function createObservabilityCorrelationId(): ObservabilityCorrelationId {
  return ObservabilityCorrelationIdSchema.parse(createId("obs"));
}

export function sanitizeObservabilityObservation(
  input: unknown
): ObservabilitySanitizationResult {
  if (!isRecord(input)) {
    return rejected("OBSERVATION_INPUT_INVALID", "INPUT_VERIFICATION_FAILED");
  }

  if (hasSensitiveKey(input)) {
    return rejected(
      "OBSERVATION_INPUT_INVALID",
      "SENSITIVE_OUTPUT_DETECTED"
    );
  }

  const parsed = ObservabilityObservationSchema.safeParse(input);
  if (!parsed.success) {
    return rejected("OBSERVATION_INPUT_INVALID", "INPUT_VERIFICATION_FAILED");
  }

  return {
    accepted: true,
    observation: cloneObservation(parsed.data)
  };
}

export function classifyObservabilityFailure(
  input: unknown
): ObservabilityFailureClass {
  if (!isRecord(input)) {
    return "UNKNOWN_SANITIZED_FAILURE";
  }
  if (hasSensitiveKey(input)) {
    return "SENSITIVE_OUTPUT_DETECTED";
  }

  const existingFailureClass = ObservabilityFailureClassSchema.safeParse(
    input.failureClass
  );
  if (existingFailureClass.success) {
    return existingFailureClass.data;
  }

  if (
    input.timeoutOccurred === true ||
    input.stopReason === "timeout" ||
    input.stopReason === "cancellation"
  ) {
    return "TIMEOUT_OR_CANCELLATION";
  }
  if (input.status === "blocked" || input.stopReason === "approval_missing") {
    return "APPROVAL_OR_SCOPE_BLOCKED";
  }
  if (input.stopReason === "health_failed") {
    return input.domain === "helper_session"
      ? "HELPER_HEALTH_FAILED"
      : "INPUT_VERIFICATION_FAILED";
  }
  if (input.stopReason === "load_failed") {
    return "HELPER_LOAD_FAILED";
  }
  if (input.stopReason === "release_failed") {
    return "HELPER_RELEASE_FAILED";
  }
  if (input.stopReason === "activation_failed") {
    return "ACTIVATION_FAILED";
  }
  if (input.stopReason === "preservation_failed") {
    return "PRESERVATION_FAILED";
  }
  if (input.stopReason === "rollback_failed") {
    return "ROLLBACK_FAILED";
  }
  if (input.stopReason === "cleanup_failed") {
    return "CLEANUP_FAILED";
  }

  return "UNKNOWN_SANITIZED_FAILURE";
}

export function createObservabilityCollector(
  correlationId: string = createObservabilityCorrelationId()
): ObservabilityCollector {
  const normalizedCorrelationId =
    ObservabilityCorrelationIdSchema.parse(correlationId);
  let observations: ObservabilityObservation[] = [];
  let reasonCodes: ObservabilityReasonCode[] = [];
  let failureClasses: ObservabilityFailureClass[] = [];
  let rejectedObservationCount = 0;
  let released = false;

  return {
    observe(input: unknown): ObservabilityObserveResult {
      if (released) {
        return rejected(
          "OBSERVATION_COLLECTOR_RELEASED",
          "APPROVAL_OR_SCOPE_BLOCKED"
        );
      }

      const sanitized = sanitizeObservabilityObservation(input);
      if (!sanitized.accepted) {
        return recordRejection(sanitized);
      }

      if (sanitized.observation.correlationId !== normalizedCorrelationId) {
        return recordRejection(
          rejected(
            "OBSERVATION_CORRELATION_MISMATCH",
            "APPROVAL_OR_SCOPE_BLOCKED"
          )
        );
      }

      if (observations.length >= OBSERVABILITY_MAX_OBSERVATIONS) {
        return recordRejection(
          rejected("OBSERVATION_BOUNDS_EXCEEDED", "APPROVAL_OR_SCOPE_BLOCKED")
        );
      }

      const nextReasonCodes = uniqueValues([
        ...reasonCodes,
        ...sanitized.observation.reasonCodes
      ]);
      const nextFailureClasses = uniqueValues([
        ...failureClasses,
        ...sanitized.observation.failureClasses
      ]);

      if (
        nextReasonCodes.length > OBSERVABILITY_MAX_REASON_CODES ||
        nextFailureClasses.length > OBSERVABILITY_MAX_FAILURE_CLASSES
      ) {
        return recordRejection(
          rejected("OBSERVATION_BOUNDS_EXCEEDED", "APPROVAL_OR_SCOPE_BLOCKED")
        );
      }

      observations = [...observations, cloneObservation(sanitized.observation)];
      reasonCodes = nextReasonCodes;
      failureClasses = nextFailureClasses;

      return {
        accepted: true,
        observationCount: observations.length
      };
    },

    summarize(): ObservabilitySummary {
      if (released) {
        return createEmptySummary(
          normalizedCorrelationId,
          true,
          ["OBSERVATION_COLLECTOR_RELEASED"],
          [],
          0
        );
      }

      if (observations.length === 0) {
        return createEmptySummary(
          normalizedCorrelationId,
          false,
          reasonCodes.length > 0 ? reasonCodes : ["OBSERVATION_NO_INPUT"],
          failureClasses,
          rejectedObservationCount
        );
      }

      const statusCounts = {
        started: 0,
        passed: 0,
        degraded: 0,
        blocked: 0,
        failed: 0,
        stopped: 0
      } satisfies Record<ObservabilityOperationStatus, number>;
      const domains: ObservabilityOperationDomain[] = [];
      const firstObservation = observations[0];
      if (firstObservation === undefined) {
        return createEmptySummary(
          normalizedCorrelationId,
          false,
          ["OBSERVATION_NO_INPUT"],
          [],
          0
        );
      }
      let currentPhase = firstObservation.phase;
      let healthState: ObservabilityHealthState = "not_started";
      let loadState: ObservabilityHealthState = "not_started";
      let releaseState: ObservabilityHealthState = "not_started";
      let activationState: ObservabilityActivationState = "not_attempted";
      let preservationState: ObservabilityPreservationState = "not_checked";
      let rollbackState: ObservabilityRollbackState = "not_started";
      let cleanupState: ObservabilityCleanupState = "not_started";
      let timeoutOccurred = false;
      let stopReason: ObservabilitySummary["stopReason"];

      for (const observation of observations) {
        statusCounts[observation.status] += 1;
        currentPhase = observation.phase;
        timeoutOccurred ||= observation.timeoutOccurred;

        if (!domains.includes(observation.domain)) {
          domains.push(observation.domain);
        }
        if (observation.healthState !== undefined) {
          healthState = observation.healthState;
        }
        if (observation.loadState !== undefined) {
          loadState = observation.loadState;
        }
        if (observation.releaseState !== undefined) {
          releaseState = observation.releaseState;
        }
        if (observation.activationState !== undefined) {
          activationState = observation.activationState;
        }
        if (observation.preservationState !== undefined) {
          preservationState = observation.preservationState;
        }
        if (observation.rollbackState !== undefined) {
          rollbackState = observation.rollbackState;
        }
        if (observation.cleanupState !== undefined) {
          cleanupState = observation.cleanupState;
        }
        if (observation.stopReason !== undefined) {
          stopReason = observation.stopReason;
        }
      }

      return ObservabilitySummarySchema.parse({
        correlationId: normalizedCorrelationId,
        domains,
        currentPhase,
        status: aggregateStatus(statusCounts),
        healthState,
        loadState,
        releaseState,
        activationState,
        preservationState,
        rollbackState,
        cleanupState,
        timeoutOccurred,
        ...(stopReason === undefined ? {} : { stopReason }),
        reasonCodes,
        failureClasses,
        counters: {
          observationCount: observations.length,
          rejectedObservationCount,
          startedCount: statusCounts.started,
          passedCount: statusCounts.passed,
          degradedCount: statusCounts.degraded,
          blockedCount: statusCounts.blocked,
          failedCount: statusCounts.failed,
          stoppedCount: statusCounts.stopped,
          timeoutCount: observations.filter(
            (observation) => observation.timeoutOccurred
          ).length,
          reasonCodeCount: reasonCodes.length,
          failureClassCount: failureClasses.length
        },
        released: false,
        persisted: false,
        rawDiagnosticsExposed: false
      });
    },

    release(): void {
      observations = [];
      reasonCodes = [];
      failureClasses = [];
      rejectedObservationCount = 0;
      released = true;
    }
  };

  function recordRejection(
    result: ObservabilityRejectedResult
  ): ObservabilityRejectedResult {
    rejectedObservationCount = Math.min(
      rejectedObservationCount + 1,
      OBSERVABILITY_MAX_OBSERVATIONS
    );
    if (
      !reasonCodes.includes(result.reasonCode) &&
      reasonCodes.length < OBSERVABILITY_MAX_REASON_CODES
    ) {
      reasonCodes = [...reasonCodes, result.reasonCode];
    }
    if (
      !failureClasses.includes(result.failureClass) &&
      failureClasses.length < OBSERVABILITY_MAX_FAILURE_CLASSES
    ) {
      failureClasses = [...failureClasses, result.failureClass];
    }
    return result;
  }
}

function createEmptySummary(
  correlationId: ObservabilityCorrelationId,
  released: boolean,
  reasonCodes: readonly ObservabilityReasonCode[],
  failureClasses: readonly ObservabilityFailureClass[],
  rejectedObservationCount: number
): ObservabilitySummary {
  return ObservabilitySummarySchema.parse({
    correlationId,
    domains: [],
    currentPhase: "preflight",
    status: "blocked",
    healthState: "not_started",
    loadState: "not_started",
    releaseState: "not_started",
    activationState: "not_attempted",
    preservationState: "not_checked",
    rollbackState: "not_started",
    cleanupState: "not_started",
    timeoutOccurred: false,
    reasonCodes: uniqueValues(reasonCodes),
    failureClasses: uniqueValues(failureClasses),
    counters: {
      observationCount: 0,
      rejectedObservationCount,
      startedCount: 0,
      passedCount: 0,
      degradedCount: 0,
      blockedCount: 0,
      failedCount: 0,
      stoppedCount: 0,
      timeoutCount: 0,
      reasonCodeCount: uniqueValues(reasonCodes).length,
      failureClassCount: uniqueValues(failureClasses).length
    },
    released,
    persisted: false,
    rawDiagnosticsExposed: false
  });
}

function aggregateStatus(
  counts: Record<ObservabilityOperationStatus, number>
): ObservabilityOperationStatus {
  if (counts.stopped > 0) {
    return "stopped";
  }
  if (counts.failed > 0) {
    return "failed";
  }
  if (counts.blocked > 0) {
    return "blocked";
  }
  if (counts.degraded > 0) {
    return "degraded";
  }
  if (counts.passed > 0) {
    return "passed";
  }
  return "started";
}

function rejected(
  reasonCode: ObservabilityReasonCode,
  failureClass: ObservabilityFailureClass
): ObservabilityRejectedResult {
  return {
    accepted: false,
    reasonCode,
    failureClass
  };
}

function uniqueValues<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function cloneObservation(
  observation: ObservabilityObservation
): ObservabilityObservation {
  return {
    correlationId: observation.correlationId,
    domain: observation.domain,
    phase: observation.phase,
    status: observation.status,
    ...(observation.healthState === undefined
      ? {}
      : { healthState: observation.healthState }),
    ...(observation.loadState === undefined
      ? {}
      : { loadState: observation.loadState }),
    ...(observation.releaseState === undefined
      ? {}
      : { releaseState: observation.releaseState }),
    ...(observation.activationState === undefined
      ? {}
      : { activationState: observation.activationState }),
    ...(observation.preservationState === undefined
      ? {}
      : { preservationState: observation.preservationState }),
    ...(observation.rollbackState === undefined
      ? {}
      : { rollbackState: observation.rollbackState }),
    ...(observation.cleanupState === undefined
      ? {}
      : { cleanupState: observation.cleanupState }),
    timeoutOccurred: observation.timeoutOccurred,
    ...(observation.stopReason === undefined
      ? {}
      : { stopReason: observation.stopReason }),
    reasonCodes: [...observation.reasonCodes],
    failureClasses: [...observation.failureClasses]
  };
}

function hasSensitiveKey(record: Record<string, unknown>): boolean {
  return Object.keys(record).some((key) => SENSITIVE_KEY_PATTERN.test(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
