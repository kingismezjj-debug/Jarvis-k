import {
  FixtureToolExecutor,
  decideToolInvocation,
  type FixtureToolExecutorOptions
} from "@jarvis-k/capabilities";
import {
  ToolDescriptorSchema,
  ToolExecutionResultSchema,
  ToolInvocationRequestSchema,
  ToolPolicyDecisionSchema,
  ToolPolicySchema,
  type ToolDescriptor,
  type ToolExecutionResult,
  type ToolInvocationRequest,
  type ToolPolicy,
  type ToolPolicyDecision,
  type ToolReasonCode
} from "@jarvis-k/contracts";

export interface CoreHostToolExecutionFixtureSessionOptions {
  descriptors: readonly unknown[];
  policy: unknown;
  fixtureImplementationAvailable?: boolean;
  executorOptions?: FixtureToolExecutorOptions;
  evaluatedAt?: string;
}

export interface CoreHostToolExecutionEvaluateInput {
  request: unknown;
  confirmationGranted?: boolean;
  evaluatedAt?: string;
}

export interface CoreHostToolExecutionExecuteInput {
  request: unknown;
  confirmationGranted?: boolean;
  evaluatedAt?: string;
}

export interface CoreHostToolExecutionDecisionReport {
  accepted: boolean;
  status: "evaluated" | "blocked" | "released";
  reasonCode: ToolReasonCode;
  toolCount: number;
  sessionReleased: boolean;
  decision?: ToolPolicyDecision;
}

export interface CoreHostToolExecutionResultReport {
  accepted: boolean;
  status: "executed" | "blocked" | "released";
  reasonCode: ToolReasonCode;
  toolCount: number;
  sessionReleased: boolean;
  result?: ToolExecutionResult;
}

export interface CoreHostToolExecutionFixtureSession {
  evaluate(
    input: CoreHostToolExecutionEvaluateInput
  ): CoreHostToolExecutionDecisionReport;
  execute(
    input: CoreHostToolExecutionExecuteInput
  ): Promise<CoreHostToolExecutionResultReport>;
  release(): void;
  summarize(): {
    toolCount: number;
    decisionCount: number;
    executionCount: number;
    sessionReleased: boolean;
    persisted: false;
    rawDiagnosticsExposed: false;
  };
}

const DEFAULT_EVALUATED_AT = "2026-08-01T00:00:00.000Z";

export function createCoreHostToolExecutionFixtureSession(
  options: CoreHostToolExecutionFixtureSessionOptions
): CoreHostToolExecutionFixtureSession {
  const descriptors = parseDescriptors(options.descriptors);
  const policy = ToolPolicySchema.safeParse(options.policy);
  const sessionState = {
    released: false,
    decisionCount: 0,
    executionCount: 0
  };

  if (!policy.success) {
    return createRejectedSession(sessionState, "INVALID_TOOL_REQUEST");
  }

  return createSession({
    descriptors,
    policy: policy.data,
    fixtureImplementationAvailable:
      options.fixtureImplementationAvailable ?? true,
    executorOptions: options.executorOptions ?? {},
    evaluatedAt: sanitizeEvaluatedAt(options.evaluatedAt),
    sessionState
  });
}

function createSession(input: {
  descriptors: ToolDescriptor[];
  policy: ToolPolicy;
  fixtureImplementationAvailable: boolean;
  executorOptions: FixtureToolExecutorOptions;
  evaluatedAt: string;
  sessionState: {
    released: boolean;
    decisionCount: number;
    executionCount: number;
  };
}): CoreHostToolExecutionFixtureSession {
  return {
    evaluate(
      evaluation: CoreHostToolExecutionEvaluateInput
    ): CoreHostToolExecutionDecisionReport {
      if (input.sessionState.released) {
        return blockedDecisionReport(input, "EXECUTION_DISABLED", "released");
      }

      const request = ToolInvocationRequestSchema.safeParse(evaluation.request);
      if (!request.success) {
        return blockedDecisionReport(input, "INVALID_TOOL_REQUEST", "blocked");
      }
      const descriptor = input.descriptors.find(
        (candidate) => candidate.id === request.data.toolId
      );
      if (descriptor === undefined) {
        return blockedDecisionReport(input, "TOOL_NOT_ALLOWLISTED", "blocked");
      }

      const decision = ToolPolicyDecisionSchema.parse(
        decideToolInvocation({
          policy: input.policy,
          descriptor,
          request: request.data,
          ...(evaluation.confirmationGranted === undefined
            ? {}
            : { confirmationGranted: evaluation.confirmationGranted }),
          evaluatedAt: sanitizeEvaluatedAt(
            evaluation.evaluatedAt ?? input.evaluatedAt
          )
        })
      );
      input.sessionState.decisionCount += 1;
      return {
        accepted: decision.allowed,
        status: "evaluated",
        reasonCode: decision.reasonCode,
        toolCount: input.descriptors.length,
        sessionReleased: false,
        decision
      };
    },

    async execute(
      execution: CoreHostToolExecutionExecuteInput
    ): Promise<CoreHostToolExecutionResultReport> {
      if (input.sessionState.released) {
        return blockedResultReport(input, "EXECUTION_DISABLED", "released");
      }

      const request = ToolInvocationRequestSchema.safeParse(execution.request);
      if (!request.success) {
        return blockedResultReport(input, "INVALID_TOOL_REQUEST", "blocked");
      }

      const executor = new FixtureToolExecutor(
        input.descriptors,
        input.policy,
        input.fixtureImplementationAvailable,
        input.executorOptions
      );
      const result = ToolExecutionResultSchema.parse(
        await executor.execute({
          request: request.data,
          ...(execution.confirmationGranted === undefined
            ? {}
            : { confirmationGranted: execution.confirmationGranted }),
          evaluatedAt: sanitizeEvaluatedAt(
            execution.evaluatedAt ?? input.evaluatedAt
          )
        })
      );
      input.sessionState.executionCount += 1;
      return {
        accepted: result.status === "completed",
        status: "executed",
        reasonCode: result.resultCode,
        toolCount: input.descriptors.length,
        sessionReleased: false,
        result
      };
    },

    release(): void {
      input.sessionState.released = true;
      input.sessionState.decisionCount = 0;
      input.sessionState.executionCount = 0;
    },

    summarize() {
      return {
        toolCount: input.sessionState.released ? 0 : input.descriptors.length,
        decisionCount: input.sessionState.decisionCount,
        executionCount: input.sessionState.executionCount,
        sessionReleased: input.sessionState.released,
        persisted: false as const,
        rawDiagnosticsExposed: false as const
      };
    }
  };
}

function createRejectedSession(
  sessionState: {
    released: boolean;
    decisionCount: number;
    executionCount: number;
  },
  reasonCode: ToolReasonCode
): CoreHostToolExecutionFixtureSession {
  const input = {
    descriptors: [],
    policy: defaultDenyPolicy(),
    fixtureImplementationAvailable: false,
    executorOptions: {},
    evaluatedAt: DEFAULT_EVALUATED_AT,
    sessionState
  };
  return {
    evaluate(): CoreHostToolExecutionDecisionReport {
      return blockedDecisionReport(input, reasonCode, "blocked");
    },
    async execute(): Promise<CoreHostToolExecutionResultReport> {
      return blockedResultReport(input, reasonCode, "blocked");
    },
    release(): void {
      sessionState.released = true;
      sessionState.decisionCount = 0;
      sessionState.executionCount = 0;
    },
    summarize() {
      return {
        toolCount: 0,
        decisionCount: sessionState.decisionCount,
        executionCount: sessionState.executionCount,
        sessionReleased: sessionState.released,
        persisted: false as const,
        rawDiagnosticsExposed: false as const
      };
    }
  };
}

function blockedDecisionReport(
  input: {
    descriptors: readonly ToolDescriptor[];
    sessionState: { released: boolean };
  },
  reasonCode: ToolReasonCode,
  status: "blocked" | "released"
): CoreHostToolExecutionDecisionReport {
  return {
    accepted: false,
    status,
    reasonCode,
    toolCount: input.sessionState.released ? 0 : input.descriptors.length,
    sessionReleased: input.sessionState.released
  };
}

function blockedResultReport(
  input: {
    descriptors: readonly ToolDescriptor[];
    sessionState: { released: boolean };
  },
  reasonCode: ToolReasonCode,
  status: "blocked" | "released"
): CoreHostToolExecutionResultReport {
  return {
    accepted: false,
    status,
    reasonCode,
    toolCount: input.sessionState.released ? 0 : input.descriptors.length,
    sessionReleased: input.sessionState.released
  };
}

function parseDescriptors(descriptors: readonly unknown[]): ToolDescriptor[] {
  const parsed: ToolDescriptor[] = [];
  for (const descriptor of descriptors) {
    const result = ToolDescriptorSchema.safeParse(descriptor);
    if (result.success) {
      parsed.push(result.data);
    }
  }
  return parsed;
}

function sanitizeEvaluatedAt(value: string | undefined): string {
  if (value === undefined) {
    return DEFAULT_EVALUATED_AT;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return DEFAULT_EVALUATED_AT;
  }
  return date.toISOString();
}

function defaultDenyPolicy(): ToolPolicy {
  return {
    policyVersion: "1.0.0",
    allowedToolIds: [],
    blockedToolIds: [],
    allowedPermissionScopes: [],
    confirmationRequiredFor: ["mutating", "destructive"],
    fixtureExecutionEnabled: false,
    windowsExecutionEnabled: false,
    networkAccessAllowed: false,
    shellExecutionAllowed: false
  };
}
