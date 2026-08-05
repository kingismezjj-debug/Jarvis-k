import { z } from "zod";

export const OBSERVABILITY_MAX_OBSERVATIONS = 64 as const;
export const OBSERVABILITY_MAX_REASON_CODES = 32 as const;
export const OBSERVABILITY_MAX_FAILURE_CLASSES = 32 as const;
export const OBSERVABILITY_MAX_COUNTER = 1_024 as const;

const uniqueEnumArray = <T extends z.ZodTypeAny>(
  itemSchema: T,
  maximum: number,
  label: string
) =>
  z
    .array(itemSchema)
    .max(maximum)
    .refine(
      (items) => new Set(items).size === items.length,
      `${label} must be unique.`
    );

export const ObservabilityOperationDomainSchema = z.enum([
  "model_lifecycle",
  "helper_session"
]);
export type ObservabilityOperationDomain = z.infer<
  typeof ObservabilityOperationDomainSchema
>;

export const ObservabilityCorrelationIdSchema = z
  .string()
  .regex(/^(?:corr|obs)-[A-Za-z0-9_-]{1,96}$/u)
  .max(101);
export type ObservabilityCorrelationId = z.infer<
  typeof ObservabilityCorrelationIdSchema
>;

export const ObservabilityPhaseSchema = z.enum([
  "preflight",
  "artifact_verification",
  "install",
  "health_check",
  "load",
  "embed",
  "activation",
  "preservation",
  "rollback",
  "release",
  "cleanup",
  "complete"
]);
export type ObservabilityPhase = z.infer<typeof ObservabilityPhaseSchema>;

export const ObservabilityOperationStatusSchema = z.enum([
  "started",
  "passed",
  "degraded",
  "blocked",
  "failed",
  "stopped"
]);
export type ObservabilityOperationStatus = z.infer<
  typeof ObservabilityOperationStatusSchema
>;

export const ObservabilityHealthStateSchema = z.enum([
  "not_started",
  "passed",
  "degraded",
  "failed"
]);
export type ObservabilityHealthState = z.infer<
  typeof ObservabilityHealthStateSchema
>;

export const ObservabilityActivationStateSchema = z.enum([
  "not_attempted",
  "committed",
  "not_committed",
  "failed"
]);
export type ObservabilityActivationState = z.infer<
  typeof ObservabilityActivationStateSchema
>;

export const ObservabilityPreservationStateSchema = z.enum([
  "not_checked",
  "preserved",
  "not_preserved",
  "unknown"
]);
export type ObservabilityPreservationState = z.infer<
  typeof ObservabilityPreservationStateSchema
>;

export const ObservabilityRollbackStateSchema = z.enum([
  "not_started",
  "not_required",
  "passed",
  "degraded",
  "failed"
]);
export type ObservabilityRollbackState = z.infer<
  typeof ObservabilityRollbackStateSchema
>;

export const ObservabilityCleanupStateSchema = z.enum([
  "not_started",
  "not_required",
  "passed",
  "degraded",
  "failed"
]);
export type ObservabilityCleanupState = z.infer<
  typeof ObservabilityCleanupStateSchema
>;

export const ObservabilityFailureClassSchema = z.enum([
  "APPROVAL_OR_SCOPE_BLOCKED",
  "INPUT_VERIFICATION_FAILED",
  "HELPER_HEALTH_FAILED",
  "HELPER_LOAD_FAILED",
  "HELPER_EMBED_FAILED",
  "HELPER_RELEASE_FAILED",
  "TIMEOUT_OR_CANCELLATION",
  "ACTIVATION_FAILED",
  "PRESERVATION_FAILED",
  "ROLLBACK_FAILED",
  "CLEANUP_FAILED",
  "SENSITIVE_OUTPUT_DETECTED",
  "UNKNOWN_SANITIZED_FAILURE"
]);
export type ObservabilityFailureClass = z.infer<
  typeof ObservabilityFailureClassSchema
>;

export const ObservabilityStopReasonSchema = z.enum([
  "approval_missing",
  "scope_violation",
  "timeout",
  "cancellation",
  "health_failed",
  "load_failed",
  "embed_failed",
  "release_failed",
  "artifact_verification_failed",
  "activation_failed",
  "preservation_failed",
  "rollback_failed",
  "cleanup_failed",
  "sensitive_output_detected",
  "unexpected_failure"
]);
export type ObservabilityStopReason = z.infer<
  typeof ObservabilityStopReasonSchema
>;

export const ObservabilityReasonCodeSchema = z.enum([
  "OBSERVATION_STARTED",
  "OBSERVATION_COMPLETED",
  "OBSERVATION_DEGRADED",
  "OBSERVATION_BLOCKED",
  "OBSERVATION_FAILED",
  "OBSERVATION_STOPPED",
  "OBSERVATION_NO_INPUT",
  "OBSERVATION_INPUT_INVALID",
  "OBSERVATION_CORRELATION_MISMATCH",
  "OBSERVATION_BOUNDS_EXCEEDED",
  "OBSERVATION_COLLECTOR_RELEASED",
  "HELPER_HEALTH_PASSED",
  "HELPER_LOAD_PASSED",
  "HELPER_EMBED_PASSED",
  "HELPER_EMBED_FAILED",
  "HELPER_RELEASE_PASSED",
  "HELPER_TIMEOUT",
  "HELPER_CANCELLED",
  "HELPER_STOPPED",
  "MODEL_ACTIVATION_COMMITTED",
  "MODEL_ACTIVATION_FAILED",
  "MODEL_HEALTH_CHECK_FAILED",
  "MODEL_VERSION_PRESERVED",
  "MODEL_PRESERVATION_FAILED",
  "MODEL_ROLLBACK_COMMITTED",
  "MODEL_ROLLBACK_NOT_REQUIRED",
  "MODEL_ROLLBACK_FAILED",
  "MODEL_CLEANUP_PASSED",
  "MODEL_CLEANUP_FAILED"
]);
export type ObservabilityReasonCode = z.infer<
  typeof ObservabilityReasonCodeSchema
>;

const ObservabilityReasonCodesSchema = uniqueEnumArray(
  ObservabilityReasonCodeSchema,
  OBSERVABILITY_MAX_REASON_CODES,
  "Observation reason codes"
);

const ObservabilityFailureClassesSchema = uniqueEnumArray(
  ObservabilityFailureClassSchema,
  OBSERVABILITY_MAX_FAILURE_CLASSES,
  "Observation failure classes"
);

const ObservabilityDomainsSchema = uniqueEnumArray(
  ObservabilityOperationDomainSchema,
  2,
  "Observation domains"
);

export const ObservabilityObservationSchema = z
  .object({
    correlationId: ObservabilityCorrelationIdSchema,
    domain: ObservabilityOperationDomainSchema,
    phase: ObservabilityPhaseSchema,
    status: ObservabilityOperationStatusSchema,
    healthState: ObservabilityHealthStateSchema.optional(),
    loadState: ObservabilityHealthStateSchema.optional(),
    releaseState: ObservabilityHealthStateSchema.optional(),
    activationState: ObservabilityActivationStateSchema.optional(),
    preservationState: ObservabilityPreservationStateSchema.optional(),
    rollbackState: ObservabilityRollbackStateSchema.optional(),
    cleanupState: ObservabilityCleanupStateSchema.optional(),
    timeoutOccurred: z.boolean(),
    stopReason: ObservabilityStopReasonSchema.optional(),
    reasonCodes: ObservabilityReasonCodesSchema,
    failureClasses: ObservabilityFailureClassesSchema
  })
  .strict();
export type ObservabilityObservation = z.infer<
  typeof ObservabilityObservationSchema
>;

const BoundedCounterSchema = z
  .number()
  .int()
  .min(0)
  .max(OBSERVABILITY_MAX_COUNTER);

export const ObservabilityCountersSchema = z
  .object({
    observationCount: BoundedCounterSchema.max(OBSERVABILITY_MAX_OBSERVATIONS),
    rejectedObservationCount: BoundedCounterSchema,
    startedCount: BoundedCounterSchema,
    passedCount: BoundedCounterSchema,
    degradedCount: BoundedCounterSchema,
    blockedCount: BoundedCounterSchema,
    failedCount: BoundedCounterSchema,
    stoppedCount: BoundedCounterSchema,
    timeoutCount: BoundedCounterSchema,
    reasonCodeCount: BoundedCounterSchema,
    failureClassCount: BoundedCounterSchema
  })
  .strict();
export type ObservabilityCounters = z.infer<
  typeof ObservabilityCountersSchema
>;

export const ObservabilitySummarySchema = z
  .object({
    correlationId: ObservabilityCorrelationIdSchema,
    domains: ObservabilityDomainsSchema,
    currentPhase: ObservabilityPhaseSchema,
    status: ObservabilityOperationStatusSchema,
    healthState: ObservabilityHealthStateSchema,
    loadState: ObservabilityHealthStateSchema,
    releaseState: ObservabilityHealthStateSchema,
    activationState: ObservabilityActivationStateSchema,
    preservationState: ObservabilityPreservationStateSchema,
    rollbackState: ObservabilityRollbackStateSchema,
    cleanupState: ObservabilityCleanupStateSchema,
    timeoutOccurred: z.boolean(),
    stopReason: ObservabilityStopReasonSchema.optional(),
    reasonCodes: ObservabilityReasonCodesSchema,
    failureClasses: ObservabilityFailureClassesSchema,
    counters: ObservabilityCountersSchema,
    released: z.boolean(),
    persisted: z.literal(false),
    rawDiagnosticsExposed: z.literal(false)
  })
  .strict();
export type ObservabilitySummary = z.infer<
  typeof ObservabilitySummarySchema
>;
