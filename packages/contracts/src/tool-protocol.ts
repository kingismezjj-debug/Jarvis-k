import { z } from "zod";

export const ToolIdSchema = z
  .string()
  .regex(/^[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+$/u)
  .max(128);
export type ToolId = z.infer<typeof ToolIdSchema>;

const ToolVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/u)
  .max(32);

const ToolArgumentKeySchema = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/u);

const ToolArgumentValueSchema = z.union([
  z.string().max(2_000),
  z.number().finite(),
  z.boolean()
]);

const unsafeToolArgumentKeyPattern =
  /(?:command|script|powershell|shell|cmd|token|credential|secret|apikey|signed.?url|download|network|path|process|env|stdout|stderr|output|exception|stack|raw)/iu;

const unsafeToolArgumentStringPattern =
  /(?:https?:\/\/|[A-Za-z]:\\|\\\\|\bBearer\b|BEGIN [A-Z ]+KEY)/iu;

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

const BoundedToolCounterSchema = z.number().int().min(0).max(1_024);

export const ToolRiskSchema = z.enum([
  "read_only",
  "mutating",
  "destructive"
]);
export type ToolRisk = z.infer<typeof ToolRiskSchema>;

export const ToolExecutionModeSchema = z.enum([
  "fixture",
  "windows",
  "disabled"
]);
export type ToolExecutionMode = z.infer<typeof ToolExecutionModeSchema>;

export const ToolPermissionScopeSchema = z.enum([
  "memory.read",
  "memory.write",
  "filesystem.read",
  "filesystem.write",
  "process.execute",
  "screen.capture",
  "clipboard.read",
  "clipboard.write"
]);
export type ToolPermissionScope = z.infer<
  typeof ToolPermissionScopeSchema
>;

export const ToolDescriptorSchema = z
  .object({
    id: ToolIdSchema,
    version: ToolVersionSchema,
    description: z.string().trim().min(1).max(500),
    risk: ToolRiskSchema,
    execution: ToolExecutionModeSchema,
    requiredPermissions: z
      .array(ToolPermissionScopeSchema)
      .max(16)
      .refine(
        (scopes) => new Set(scopes).size === scopes.length,
        "Tool permission scopes must be unique."
      ),
    requiresConfirmation: z.boolean(),
    inputSchemaId: z
      .string()
      .regex(/^[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+$/u)
      .max(128)
  })
  .strict();
export type ToolDescriptor = z.infer<typeof ToolDescriptorSchema>;

export const ToolArgumentsSchema = z
  .record(ToolArgumentKeySchema, ToolArgumentValueSchema)
  .superRefine((input, ctx) => {
    if (Object.keys(input).length > 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tool input must not contain more than 32 arguments."
      });
    }
    for (const key of Object.keys(input)) {
      if (unsafeToolArgumentKeyPattern.test(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "Tool input contains a restricted execution or secret field."
        });
      }
    }
    for (const [key, value] of Object.entries(input)) {
      if (
        typeof value === "string" &&
        unsafeToolArgumentStringPattern.test(value)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message:
            "Tool input contains a restricted path, network, or secret value."
        });
      }
    }
  });
export type ToolArguments = z.infer<typeof ToolArgumentsSchema>;

export const ToolInvocationRequestSchema = z
  .object({
    requestId: z.string().min(1).max(128),
    toolId: ToolIdSchema,
    input: ToolArgumentsSchema,
    dryRun: z.boolean()
  })
  .strict();
export type ToolInvocationRequest = z.infer<
  typeof ToolInvocationRequestSchema
>;

export const ToolReasonCodeSchema = z.enum([
  "ALLOWED",
  "TOOL_NOT_ALLOWLISTED",
  "TOOL_BLOCKED",
  "PERMISSION_DENIED",
  "CONFIRMATION_REQUIRED",
  "EXECUTION_DISABLED",
  "WINDOWS_EXECUTION_DISABLED",
  "SHELL_EXECUTION_DISABLED",
  "NETWORK_EXECUTION_DISABLED",
  "INVALID_TOOL_REQUEST",
  "FIXTURE_EXECUTOR_UNAVAILABLE",
  "FIXTURE_EXECUTED",
  "FIXTURE_DRY_RUN",
  "TOOL_EXECUTION_STARTED",
  "TOOL_EXECUTION_TIMED_OUT",
  "TOOL_EXECUTION_CANCELLED",
  "TOOL_SANDBOX_SCOPE_VIOLATION",
  "TOOL_ROLLBACK_NOT_REQUIRED",
  "TOOL_ROLLBACK_PASSED",
  "TOOL_ROLLBACK_FAILED",
  "TOOL_CLEANUP_PASSED",
  "TOOL_CLEANUP_FAILED",
  "SENSITIVE_OUTPUT_DETECTED",
  "UNKNOWN_SANITIZED_FAILURE"
]);
export type ToolReasonCode = z.infer<typeof ToolReasonCodeSchema>;

export const ToolFailureClassSchema = z.enum([
  "POLICY_DENIED",
  "CONFIRMATION_MISSING",
  "EXECUTION_DISABLED",
  "FIXTURE_UNAVAILABLE",
  "TIMEOUT_OR_CANCELLATION",
  "SANDBOX_SCOPE_VIOLATION",
  "ROLLBACK_FAILED",
  "CLEANUP_FAILED",
  "SENSITIVE_OUTPUT_DETECTED",
  "UNKNOWN_SANITIZED_FAILURE"
]);
export type ToolFailureClass = z.infer<typeof ToolFailureClassSchema>;

export const ToolExecutionLifecycleStatusSchema = z.enum([
  "started",
  "completed",
  "needs_confirmation",
  "denied",
  "degraded",
  "blocked",
  "timed_out",
  "cancelled"
]);
export type ToolExecutionLifecycleStatus = z.infer<
  typeof ToolExecutionLifecycleStatusSchema
>;

export const ToolRollbackStateSchema = z.enum([
  "not_started",
  "not_required",
  "passed",
  "degraded",
  "failed"
]);
export type ToolRollbackState = z.infer<typeof ToolRollbackStateSchema>;

export const ToolCleanupStateSchema = z.enum([
  "not_started",
  "not_required",
  "passed",
  "degraded",
  "failed"
]);
export type ToolCleanupState = z.infer<typeof ToolCleanupStateSchema>;

const ToolReasonCodesSchema = uniqueEnumArray(
  ToolReasonCodeSchema,
  16,
  "Tool reason codes"
);

const ToolFailureClassesSchema = uniqueEnumArray(
  ToolFailureClassSchema,
  16,
  "Tool failure classes"
);

export const ToolExecutionCountersSchema = z
  .object({
    invocationCount: BoundedToolCounterSchema,
    startedCount: BoundedToolCounterSchema,
    completedCount: BoundedToolCounterSchema,
    deniedCount: BoundedToolCounterSchema,
    degradedCount: BoundedToolCounterSchema,
    blockedCount: BoundedToolCounterSchema,
    timedOutCount: BoundedToolCounterSchema,
    cancelledCount: BoundedToolCounterSchema,
    rollbackCount: BoundedToolCounterSchema,
    cleanupCount: BoundedToolCounterSchema,
    reasonCodeCount: BoundedToolCounterSchema,
    failureClassCount: BoundedToolCounterSchema
  })
  .strict();
export type ToolExecutionCounters = z.infer<
  typeof ToolExecutionCountersSchema
>;

export const ToolPolicySchema = z
  .object({
    policyVersion: ToolVersionSchema,
    allowedToolIds: z
      .array(ToolIdSchema)
      .max(128)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Allowed tool IDs must be unique."
      ),
    blockedToolIds: z
      .array(ToolIdSchema)
      .max(128)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Blocked tool IDs must be unique."
      ),
    allowedPermissionScopes: z
      .array(ToolPermissionScopeSchema)
      .max(16)
      .refine(
        (scopes) => new Set(scopes).size === scopes.length,
        "Allowed permission scopes must be unique."
      ),
    confirmationRequiredFor: z
      .array(ToolRiskSchema)
      .min(1)
      .max(3)
      .refine(
        (risks) => new Set(risks).size === risks.length,
        "Confirmation risks must be unique."
      ),
    fixtureExecutionEnabled: z.boolean(),
    windowsExecutionEnabled: z.literal(false),
    networkAccessAllowed: z.literal(false),
    shellExecutionAllowed: z.literal(false)
  })
  .strict();
export type ToolPolicy = z.infer<typeof ToolPolicySchema>;

export const ToolAuditRecordSchema = z
  .object({
    policyVersion: ToolVersionSchema,
    requestId: z.string().min(1).max(128),
    toolId: ToolIdSchema,
    decision: z.enum([
      "allowed",
      "needs_confirmation",
      "denied",
      "degraded"
    ]),
    reasonCode: ToolReasonCodeSchema,
    confirmationRequired: z.boolean(),
    confirmationGranted: z.boolean(),
    evaluatedAt: z.string().datetime()
  })
  .strict();
export type ToolAuditRecord = z.infer<typeof ToolAuditRecordSchema>;

export const ToolPolicyDecisionSchema = z
  .object({
    requestId: z.string().min(1).max(128),
    toolId: ToolIdSchema,
    status: z.enum([
      "allowed",
      "needs_confirmation",
      "denied",
      "degraded"
    ]),
    allowed: z.boolean(),
    confirmationRequired: z.boolean(),
    reasonCode: ToolReasonCodeSchema,
    audit: ToolAuditRecordSchema
  })
  .strict();
export type ToolPolicyDecision = z.infer<
  typeof ToolPolicyDecisionSchema
>;

export const ToolExecutionResultSchema = z
  .object({
    requestId: z.string().min(1).max(128),
    toolId: ToolIdSchema,
    status: ToolExecutionLifecycleStatusSchema,
    resultCode: ToolReasonCodeSchema,
    reasonCodes: ToolReasonCodesSchema,
    failureClasses: ToolFailureClassesSchema,
    timeoutOccurred: z.boolean(),
    cancelled: z.boolean(),
    rollbackState: ToolRollbackStateSchema,
    cleanupState: ToolCleanupStateSchema,
    counters: ToolExecutionCountersSchema,
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime(),
    audit: ToolAuditRecordSchema
  })
  .strict();
export type ToolExecutionResult = z.infer<
  typeof ToolExecutionResultSchema
>;
