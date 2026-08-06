import {
  ToolAuditRecordSchema,
  ToolDescriptorSchema,
  ToolExecutionResultSchema,
  ToolInvocationRequestSchema,
  ToolPolicyDecisionSchema,
  ToolPolicySchema,
  type ToolDescriptor,
  type ToolExecutionResult,
  type ToolExecutionCounters,
  type ToolExecutionLifecycleStatus,
  type ToolFailureClass,
  type ToolInvocationRequest,
  type ToolPolicy,
  type ToolPolicyDecision,
  type ToolReasonCode,
  type ToolRollbackState,
  type ToolCleanupState
} from "@jarvis-k/contracts";

export interface ToolGovernanceDecisionInput {
  policy: ToolPolicy;
  descriptor: ToolDescriptor;
  request: ToolInvocationRequest;
  confirmationGranted?: boolean;
  evaluatedAt: string;
}

export interface ToolExecutionInput {
  request: ToolInvocationRequest;
  confirmationGranted?: boolean;
  evaluatedAt: string;
}

export interface FixtureToolExecutorOptions {
  simulateTimeout?: boolean;
  simulateCancellation?: boolean;
  simulateSandboxScopeViolation?: boolean;
  simulateRollbackFailure?: boolean;
  simulateCleanupFailure?: boolean;
  simulateSensitiveOutput?: boolean;
}

export interface ToolGovernancePort {
  decide(input: ToolGovernanceDecisionInput): ToolPolicyDecision;
}

export interface ToolExecutorPort {
  execute(input: ToolExecutionInput): Promise<ToolExecutionResult>;
}

export function decideToolInvocation(
  input: ToolGovernanceDecisionInput
): ToolPolicyDecision {
  const policy = ToolPolicySchema.parse(input.policy);
  const descriptor = ToolDescriptorSchema.parse(input.descriptor);
  const request = ToolInvocationRequestSchema.parse(input.request);
  const confirmationGranted = input.confirmationGranted === true;
  const evaluatedAt = new Date(input.evaluatedAt).toISOString();
  const confirmationRequired =
    descriptor.requiresConfirmation ||
    policy.confirmationRequiredFor.includes(descriptor.risk);

  if (request.toolId !== descriptor.id) {
    return createDecision({
      policy,
      request,
      status: "denied",
      allowed: false,
      confirmationRequired,
      reasonCode: "INVALID_TOOL_REQUEST",
      confirmationGranted,
      evaluatedAt
    });
  }
  if (policy.blockedToolIds.includes(descriptor.id)) {
    return createDecision({
      policy,
      request,
      status: "denied",
      allowed: false,
      confirmationRequired,
      reasonCode: "TOOL_BLOCKED",
      confirmationGranted,
      evaluatedAt
    });
  }
  if (!policy.allowedToolIds.includes(descriptor.id)) {
    return createDecision({
      policy,
      request,
      status: "denied",
      allowed: false,
      confirmationRequired,
      reasonCode: "TOOL_NOT_ALLOWLISTED",
      confirmationGranted,
      evaluatedAt
    });
  }
  if (
    descriptor.requiredPermissions.some(
      (permission) => !policy.allowedPermissionScopes.includes(permission)
    )
  ) {
    return createDecision({
      policy,
      request,
      status: "denied",
      allowed: false,
      confirmationRequired,
      reasonCode: "PERMISSION_DENIED",
      confirmationGranted,
      evaluatedAt
    });
  }
  if (descriptor.requiredPermissions.includes("process.execute")) {
    return createDecision({
      policy,
      request,
      status: "denied",
      allowed: false,
      confirmationRequired,
      reasonCode: "SHELL_EXECUTION_DISABLED",
      confirmationGranted,
      evaluatedAt
    });
  }
  if (
    descriptor.requiredPermissions.includes("filesystem.read") ||
    descriptor.requiredPermissions.includes("filesystem.write") ||
    descriptor.requiredPermissions.includes("screen.capture") ||
    descriptor.requiredPermissions.includes("clipboard.read") ||
    descriptor.requiredPermissions.includes("clipboard.write")
  ) {
    return createDecision({
      policy,
      request,
      status: "denied",
      allowed: false,
      confirmationRequired,
      reasonCode: "EXECUTION_DISABLED",
      confirmationGranted,
      evaluatedAt
    });
  }
  if (
    descriptor.id.includes(".network.") ||
    descriptor.inputSchemaId.includes(".network.")
  ) {
    return createDecision({
      policy,
      request,
      status: "denied",
      allowed: false,
      confirmationRequired,
      reasonCode: "NETWORK_EXECUTION_DISABLED",
      confirmationGranted,
      evaluatedAt
    });
  }
  if (descriptor.execution === "windows") {
    return createDecision({
      policy,
      request,
      status: "denied",
      allowed: false,
      confirmationRequired,
      reasonCode: "WINDOWS_EXECUTION_DISABLED",
      confirmationGranted,
      evaluatedAt
    });
  }
  if (
    descriptor.execution === "disabled" ||
    !policy.fixtureExecutionEnabled
  ) {
    return createDecision({
      policy,
      request,
      status: "denied",
      allowed: false,
      confirmationRequired,
      reasonCode: "EXECUTION_DISABLED",
      confirmationGranted,
      evaluatedAt
    });
  }
  if (confirmationRequired && !confirmationGranted) {
    return createDecision({
      policy,
      request,
      status: "needs_confirmation",
      allowed: false,
      confirmationRequired,
      reasonCode: "CONFIRMATION_REQUIRED",
      confirmationGranted,
      evaluatedAt
    });
  }

  return createDecision({
    policy,
    request,
    status: "allowed",
    allowed: true,
    confirmationRequired,
    reasonCode: "ALLOWED",
    confirmationGranted,
    evaluatedAt
  });
}

export class FixtureToolExecutor implements ToolExecutorPort {
  public constructor(
    private readonly descriptors: ToolDescriptor[],
    private readonly policy: ToolPolicy,
    private readonly fixtureImplementationAvailable = true,
    private readonly options: FixtureToolExecutorOptions = {}
  ) {}

  public async execute(input: ToolExecutionInput): Promise<ToolExecutionResult> {
    const request = ToolInvocationRequestSchema.parse(input.request);
    const descriptor = this.descriptors.find(
      (candidate) => candidate.id === request.toolId
    );
    if (!descriptor) {
      return createExecutionResult({
        request,
        status: "denied",
        resultCode: "TOOL_NOT_ALLOWLISTED",
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        policyVersion: this.policy.policyVersion,
        confirmationRequired: false,
        confirmationGranted: input.confirmationGranted === true,
        decision: "denied",
        rollbackState: "not_required",
        cleanupState: "not_required"
      });
    }

    const decision = decideToolInvocation({
      policy: this.policy,
      descriptor,
      request,
      ...(input.confirmationGranted === undefined
        ? {}
        : { confirmationGranted: input.confirmationGranted }),
      evaluatedAt: input.evaluatedAt
    });
    if (!decision.allowed) {
      return createExecutionResult({
        request,
        status:
          decision.status === "needs_confirmation"
            ? "needs_confirmation"
            : "denied",
        resultCode: decision.reasonCode,
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        policyVersion: this.policy.policyVersion,
        confirmationRequired: decision.confirmationRequired,
        confirmationGranted: input.confirmationGranted === true,
        decision:
          decision.status === "needs_confirmation"
            ? "needs_confirmation"
            : "denied",
        rollbackState: "not_required",
        cleanupState: "not_required"
      });
    }
    if (!this.fixtureImplementationAvailable) {
      return createExecutionResult({
        request,
        status: "degraded",
        resultCode: "FIXTURE_EXECUTOR_UNAVAILABLE",
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        policyVersion: this.policy.policyVersion,
        confirmationRequired: decision.confirmationRequired,
        confirmationGranted: input.confirmationGranted === true,
        decision: "degraded",
        rollbackState: "not_required",
        cleanupState: "not_required"
      });
    }
    const fixtureFailure = this.createFixtureFailureResult({
      request,
      decision,
      evaluatedAt: input.evaluatedAt,
      confirmationGranted: input.confirmationGranted === true
    });
    if (fixtureFailure !== undefined) {
      return fixtureFailure;
    }

    return createExecutionResult({
      request,
      status: "completed",
      resultCode: request.dryRun ? "FIXTURE_DRY_RUN" : "FIXTURE_EXECUTED",
      startedAt: input.evaluatedAt,
      completedAt: input.evaluatedAt,
      policyVersion: this.policy.policyVersion,
      confirmationRequired: decision.confirmationRequired,
      confirmationGranted: input.confirmationGranted === true,
      decision: "allowed",
      rollbackState: "not_required",
      cleanupState: "passed"
    });
  }

  private createFixtureFailureResult(input: {
    request: ToolInvocationRequest;
    decision: ToolPolicyDecision;
    evaluatedAt: string;
    confirmationGranted: boolean;
  }): ToolExecutionResult | undefined {
    if (this.options.simulateTimeout === true) {
      return createExecutionResult({
        request: input.request,
        status: "timed_out",
        resultCode: "TOOL_EXECUTION_TIMED_OUT",
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        policyVersion: this.policy.policyVersion,
        confirmationRequired: input.decision.confirmationRequired,
        confirmationGranted: input.confirmationGranted,
        decision: "degraded",
        timeoutOccurred: true,
        rollbackState: "not_required",
        cleanupState: "passed"
      });
    }
    if (this.options.simulateCancellation === true) {
      return createExecutionResult({
        request: input.request,
        status: "cancelled",
        resultCode: "TOOL_EXECUTION_CANCELLED",
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        policyVersion: this.policy.policyVersion,
        confirmationRequired: input.decision.confirmationRequired,
        confirmationGranted: input.confirmationGranted,
        decision: "degraded",
        cancelled: true,
        rollbackState: "not_required",
        cleanupState: "passed"
      });
    }
    if (this.options.simulateSandboxScopeViolation === true) {
      return createExecutionResult({
        request: input.request,
        status: "blocked",
        resultCode: "TOOL_SANDBOX_SCOPE_VIOLATION",
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        policyVersion: this.policy.policyVersion,
        confirmationRequired: input.decision.confirmationRequired,
        confirmationGranted: input.confirmationGranted,
        decision: "denied",
        rollbackState: "not_required",
        cleanupState: "passed"
      });
    }
    if (this.options.simulateSensitiveOutput === true) {
      return createExecutionResult({
        request: input.request,
        status: "blocked",
        resultCode: "SENSITIVE_OUTPUT_DETECTED",
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        policyVersion: this.policy.policyVersion,
        confirmationRequired: input.decision.confirmationRequired,
        confirmationGranted: input.confirmationGranted,
        decision: "denied",
        rollbackState: "not_required",
        cleanupState: "passed"
      });
    }
    if (this.options.simulateRollbackFailure === true) {
      return createExecutionResult({
        request: input.request,
        status: "degraded",
        resultCode: "TOOL_ROLLBACK_FAILED",
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        policyVersion: this.policy.policyVersion,
        confirmationRequired: input.decision.confirmationRequired,
        confirmationGranted: input.confirmationGranted,
        decision: "degraded",
        rollbackState: "failed",
        cleanupState: "passed"
      });
    }
    if (this.options.simulateCleanupFailure === true) {
      return createExecutionResult({
        request: input.request,
        status: "degraded",
        resultCode: "TOOL_CLEANUP_FAILED",
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        policyVersion: this.policy.policyVersion,
        confirmationRequired: input.decision.confirmationRequired,
        confirmationGranted: input.confirmationGranted,
        decision: "degraded",
        rollbackState: "not_required",
        cleanupState: "failed"
      });
    }
    return undefined;
  }
}

function createDecision(input: {
  policy: ToolPolicy;
  request: ToolInvocationRequest;
  status: ToolPolicyDecision["status"];
  allowed: boolean;
  confirmationRequired: boolean;
  reasonCode: ToolPolicyDecision["reasonCode"];
  confirmationGranted: boolean;
  evaluatedAt: string;
}): ToolPolicyDecision {
  return ToolPolicyDecisionSchema.parse({
    requestId: input.request.requestId,
    toolId: input.request.toolId,
    status: input.status,
    allowed: input.allowed,
    confirmationRequired: input.confirmationRequired,
    reasonCode: input.reasonCode,
    audit: ToolAuditRecordSchema.parse({
      policyVersion: input.policy.policyVersion,
      requestId: input.request.requestId,
      toolId: input.request.toolId,
      decision: input.status,
      reasonCode: input.reasonCode,
      confirmationRequired: input.confirmationRequired,
      confirmationGranted: input.confirmationGranted,
      evaluatedAt: input.evaluatedAt
    })
  });
}

function createExecutionResult(input: {
  request: ToolInvocationRequest;
  status: ToolExecutionLifecycleStatus;
  resultCode: ToolReasonCode;
  startedAt: string;
  completedAt: string;
  policyVersion: string;
  confirmationRequired: boolean;
  confirmationGranted: boolean;
  decision: "allowed" | "needs_confirmation" | "denied" | "degraded";
  timeoutOccurred?: boolean;
  cancelled?: boolean;
  rollbackState: ToolRollbackState;
  cleanupState: ToolCleanupState;
}): ToolExecutionResult {
  const reasonCodes = createReasonCodes(input.resultCode, {
    rollbackState: input.rollbackState,
    cleanupState: input.cleanupState
  });
  const failureClasses = createFailureClasses(input.resultCode);
  return ToolExecutionResultSchema.parse({
    requestId: input.request.requestId,
    toolId: input.request.toolId,
    status: input.status,
    resultCode: input.resultCode,
    reasonCodes,
    failureClasses,
    timeoutOccurred: input.timeoutOccurred === true,
    cancelled: input.cancelled === true,
    rollbackState: input.rollbackState,
    cleanupState: input.cleanupState,
    counters: createExecutionCounters(input.status, reasonCodes, failureClasses),
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    audit: {
      policyVersion: input.policyVersion,
      requestId: input.request.requestId,
      toolId: input.request.toolId,
      decision: input.decision,
      reasonCode: input.resultCode,
      confirmationRequired: input.confirmationRequired,
      confirmationGranted: input.confirmationGranted,
      evaluatedAt: input.completedAt
    }
  });
}

function createReasonCodes(
  resultCode: ToolReasonCode,
  states: {
    rollbackState: ToolRollbackState;
    cleanupState: ToolCleanupState;
  }
): ToolReasonCode[] {
  const reasonCodes = [resultCode];
  if (states.rollbackState === "not_required") {
    reasonCodes.push("TOOL_ROLLBACK_NOT_REQUIRED");
  } else if (states.rollbackState === "passed") {
    reasonCodes.push("TOOL_ROLLBACK_PASSED");
  } else if (states.rollbackState === "failed") {
    reasonCodes.push("TOOL_ROLLBACK_FAILED");
  }
  if (states.cleanupState === "passed") {
    reasonCodes.push("TOOL_CLEANUP_PASSED");
  } else if (states.cleanupState === "failed") {
    reasonCodes.push("TOOL_CLEANUP_FAILED");
  }
  return [...new Set(reasonCodes)];
}

function createFailureClasses(
  resultCode: ToolReasonCode
): ToolFailureClass[] {
  if (
    resultCode === "TOOL_NOT_ALLOWLISTED" ||
    resultCode === "TOOL_BLOCKED" ||
    resultCode === "PERMISSION_DENIED" ||
    resultCode === "INVALID_TOOL_REQUEST"
  ) {
    return ["POLICY_DENIED"];
  }
  if (resultCode === "CONFIRMATION_REQUIRED") {
    return ["CONFIRMATION_MISSING"];
  }
  if (
    resultCode === "EXECUTION_DISABLED" ||
    resultCode === "WINDOWS_EXECUTION_DISABLED" ||
    resultCode === "SHELL_EXECUTION_DISABLED" ||
    resultCode === "NETWORK_EXECUTION_DISABLED"
  ) {
    return ["EXECUTION_DISABLED"];
  }
  if (resultCode === "FIXTURE_EXECUTOR_UNAVAILABLE") {
    return ["FIXTURE_UNAVAILABLE"];
  }
  if (
    resultCode === "TOOL_EXECUTION_TIMED_OUT" ||
    resultCode === "TOOL_EXECUTION_CANCELLED"
  ) {
    return ["TIMEOUT_OR_CANCELLATION"];
  }
  if (resultCode === "TOOL_SANDBOX_SCOPE_VIOLATION") {
    return ["SANDBOX_SCOPE_VIOLATION"];
  }
  if (resultCode === "TOOL_ROLLBACK_FAILED") {
    return ["ROLLBACK_FAILED"];
  }
  if (resultCode === "TOOL_CLEANUP_FAILED") {
    return ["CLEANUP_FAILED"];
  }
  if (resultCode === "SENSITIVE_OUTPUT_DETECTED") {
    return ["SENSITIVE_OUTPUT_DETECTED"];
  }
  if (resultCode === "UNKNOWN_SANITIZED_FAILURE") {
    return ["UNKNOWN_SANITIZED_FAILURE"];
  }
  return [];
}

function createExecutionCounters(
  status: ToolExecutionLifecycleStatus,
  reasonCodes: readonly ToolReasonCode[],
  failureClasses: readonly ToolFailureClass[]
): ToolExecutionCounters {
  return {
    invocationCount: 1,
    startedCount: status === "started" ? 1 : 0,
    completedCount: status === "completed" ? 1 : 0,
    deniedCount:
      status === "denied" || status === "needs_confirmation" ? 1 : 0,
    degradedCount: status === "degraded" ? 1 : 0,
    blockedCount: status === "blocked" ? 1 : 0,
    timedOutCount: status === "timed_out" ? 1 : 0,
    cancelledCount: status === "cancelled" ? 1 : 0,
    rollbackCount: reasonCodes.some((code) => code.startsWith("TOOL_ROLLBACK_"))
      ? 1
      : 0,
    cleanupCount: reasonCodes.some((code) => code.startsWith("TOOL_CLEANUP_"))
      ? 1
      : 0,
    reasonCodeCount: reasonCodes.length,
    failureClassCount: failureClasses.length
  };
}
