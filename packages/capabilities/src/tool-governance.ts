import {
  ToolAuditRecordSchema,
  ToolDescriptorSchema,
  ToolExecutionResultSchema,
  ToolInvocationRequestSchema,
  ToolPolicyDecisionSchema,
  ToolPolicySchema,
  type ToolDescriptor,
  type ToolExecutionResult,
  type ToolInvocationRequest,
  type ToolPolicy,
  type ToolPolicyDecision
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
    private readonly fixtureImplementationAvailable = true
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
        decision: "denied"
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
      return ToolExecutionResultSchema.parse({
        requestId: request.requestId,
        toolId: request.toolId,
        status:
          decision.status === "needs_confirmation"
            ? "needs_confirmation"
            : "denied",
        resultCode: decision.reasonCode,
        startedAt: input.evaluatedAt,
        completedAt: input.evaluatedAt,
        audit: decision.audit
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
        decision: "degraded"
      });
    }

    return ToolExecutionResultSchema.parse({
      requestId: request.requestId,
      toolId: request.toolId,
      status: "completed",
      resultCode: request.dryRun ? "FIXTURE_DRY_RUN" : "FIXTURE_EXECUTED",
      startedAt: input.evaluatedAt,
      completedAt: input.evaluatedAt,
      audit: decision.audit
    });
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
  status: ToolExecutionResult["status"];
  resultCode: ToolExecutionResult["resultCode"];
  startedAt: string;
  completedAt: string;
  policyVersion: string;
  confirmationRequired: boolean;
  confirmationGranted: boolean;
  decision: "allowed" | "needs_confirmation" | "denied" | "degraded";
}): ToolExecutionResult {
  return ToolExecutionResultSchema.parse({
    requestId: input.request.requestId,
    toolId: input.request.toolId,
    status: input.status,
    resultCode: input.resultCode,
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
