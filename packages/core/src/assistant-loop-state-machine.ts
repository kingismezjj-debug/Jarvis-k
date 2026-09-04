import {
  ASSISTANT_LOOP_MAX_TOOL_ITERATIONS,
  AssistantEventSchema,
  AssistantTurnProjectionSchema,
  type AssistantEvent,
  type AssistantTurnProjection,
} from "@jarvis-k/contracts";

export type AssistantTransitionRejectionCode =
  | "WRONG_TURN_ID"
  | "SEQUENCE_DUPLICATE_OR_BACKWARD"
  | "SEQUENCE_GAP"
  | "TERMINAL_STATE_IMMUTABLE"
  | "TURN_ALREADY_ACCEPTED"
  | "TURN_NOT_ACCEPTED"
  | "STREAM_BUFFER_LIMIT_EXCEEDED"
  | "TOOL_ITERATION_LIMIT_EXCEEDED"
  | "PROPOSAL_ALREADY_EXISTS"
  | "PROPOSAL_NOT_FOUND"
  | "PROPOSAL_CORRELATION_STALE"
  | "PROPOSAL_ALREADY_DECIDED"
  | "APPROVAL_NOT_REQUIRED"
  | "APPROVAL_ALREADY_RESOLVED"
  | "APPROVAL_CORRELATION_STALE"
  | "EXECUTION_NOT_ALLOWED"
  | "EXECUTION_ALREADY_EXISTS"
  | "EXECUTION_NOT_FOUND"
  | "EXECUTION_ALREADY_RESULTED"
  | "EXECUTION_CORRELATION_STALE"
  | "RESULT_WITHOUT_EXECUTION"
  | "DUPLICATE_FINAL_ANSWER";

export interface AssistantTransitionRejection {
  ok: false;
  code: AssistantTransitionRejectionCode;
  message: string;
}

export type AssistantTransitionResult =
  | {
      ok: true;
      projection: AssistantTurnProjection;
    }
  | AssistantTransitionRejection;

const terminalStatuses = new Set([
  "completed",
  "cancelled",
  "failed",
  "interrupted",
]);

export function reduceAssistantTurnProjection(
  currentInput: AssistantTurnProjection,
  eventInput: AssistantEvent,
): AssistantTransitionResult {
  const current = AssistantTurnProjectionSchema.parse(currentInput);
  const event = AssistantEventSchema.parse(eventInput);

  const preflight = rejectInvalidEnvelope(current, event);
  if (preflight) {
    return preflight;
  }

  switch (event.type) {
    case "turn.accepted":
      return acceptTurn(current, event);
    case "provider.started":
      return acceptNext(current, event, {
        status: "thinking",
        activeProviderAdapterId: event.payload.adapterId,
      });
    case "provider.delta":
      return applyProviderDelta(current, event);
    case "tool.proposed":
      return applyToolProposed(current, event);
    case "tool.decided":
      return applyToolDecision(current, event);
    case "approval.requested":
      return applyApprovalRequested(current, event);
    case "approval.resolved":
      return applyApprovalResolved(current, event);
    case "execution.started":
      return applyExecutionStarted(current, event);
    case "tool.resulted":
      return applyToolResult(current, event);
    case "provider.continued":
      return applyProviderContinued(current, event);
    case "turn.completed":
      return completeTurn(current, event);
    case "turn.cancelled":
      return acceptNext(current, event, {
        status: "cancelled",
        cancellationReason: event.payload.cancellation,
      });
    case "turn.failed":
      return acceptNext(current, event, {
        status: "failed",
        failure: event.payload.failure,
      });
    case "turn.interrupted":
      return acceptNext(current, event, {
        status: "interrupted",
        failure: event.payload.failure,
      });
  }
}

function rejectInvalidEnvelope(
  current: AssistantTurnProjection,
  event: AssistantEvent,
): AssistantTransitionRejection | undefined {
  if (event.turnId !== current.turnId) {
    return reject(
      "WRONG_TURN_ID",
      "Assistant event turnId does not match the current projection.",
    );
  }
  const expectedSequence = current.lastSequence + 1;
  if (event.sequence < expectedSequence) {
    return reject(
      "SEQUENCE_DUPLICATE_OR_BACKWARD",
      "Assistant event sequence is duplicate or older than the current projection.",
    );
  }
  if (event.sequence > expectedSequence) {
    return reject("SEQUENCE_GAP", "Assistant event sequence must be contiguous.");
  }
  if (terminalStatuses.has(current.status)) {
    return reject(
      "TERMINAL_STATE_IMMUTABLE",
      "Assistant terminal projections cannot accept additional events.",
    );
  }
  if (current.status === "idle" && event.type !== "turn.accepted") {
    return reject("TURN_NOT_ACCEPTED", "The first assistant event must accept the turn.");
  }
  if (current.status !== "idle" && event.type === "turn.accepted") {
    return reject("TURN_ALREADY_ACCEPTED", "Assistant turn was already accepted.");
  }
  return undefined;
}

function acceptTurn(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "turn.accepted" }>,
): AssistantTransitionResult {
  return acceptNext(current, event, {
    status: "thinking",
    acceptedInput: event.payload.input,
    conversationId: event.conversationId ?? event.payload.input.conversationId,
    createdAt: event.occurredAt,
  });
}

function applyProviderDelta(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "provider.delta" }>,
): AssistantTransitionResult {
  const streamText =
    event.payload.delta.kind === "text"
      ? `${current.streamText}${event.payload.delta.text}`
      : current.streamText;
  if (streamText.length > 8_000) {
    return reject(
      "STREAM_BUFFER_LIMIT_EXCEEDED",
      "Assistant stream projection exceeded the bounded in-memory buffer.",
    );
  }
  return acceptNext(current, event, {
    status: "streaming",
    streamText,
  });
}

function applyToolProposed(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "tool.proposed" }>,
): AssistantTransitionResult {
  const proposal = event.payload.proposal;
  if (current.toolIterationCount >= ASSISTANT_LOOP_MAX_TOOL_ITERATIONS) {
    return reject(
      "TOOL_ITERATION_LIMIT_EXCEEDED",
      "Assistant tool iteration limit exceeded.",
    );
  }
  if (event.proposalId && event.proposalId !== proposal.proposalId) {
    return reject(
      "PROPOSAL_CORRELATION_STALE",
      "Assistant event proposalId does not match its payload.",
    );
  }
  if (proposal.turnId !== current.turnId) {
    return reject(
      "PROPOSAL_CORRELATION_STALE",
      "Tool proposal turnId does not match the current projection.",
    );
  }
  if (current.proposals.some((candidate) => candidate.proposalId === proposal.proposalId)) {
    return reject("PROPOSAL_ALREADY_EXISTS", "Tool proposal was already observed.");
  }
  return acceptNext(current, event, {
    status: "thinking",
    toolIterationCount: current.toolIterationCount + 1,
    proposals: [
      ...current.proposals,
      {
        proposalId: proposal.proposalId,
        toolId: proposal.toolId,
        risk: proposal.risk,
        decisionStatus: "pending" as const,
        approvalStatus: "not_required" as const,
      },
    ],
  });
}

function applyToolDecision(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "tool.decided" }>,
): AssistantTransitionResult {
  const decision = event.payload.decision;
  if (event.proposalId && event.proposalId !== decision.proposalId) {
    return reject(
      "PROPOSAL_CORRELATION_STALE",
      "Assistant event proposalId does not match its decision.",
    );
  }
  const proposal = current.proposals.find(
    (candidate) => candidate.proposalId === decision.proposalId,
  );
  if (!proposal) {
    return reject("PROPOSAL_NOT_FOUND", "Tool decision references an unknown proposal.");
  }
  if (proposal.decisionStatus !== "pending") {
    return reject("PROPOSAL_ALREADY_DECIDED", "Tool proposal already has a decision.");
  }
  const approvalStatus =
    decision.decision === "requires_approval" ? "pending" : "not_required";
  return acceptNext(current, event, {
    status: decision.decision === "requires_approval" ? "awaiting_approval" : "thinking",
    proposals: current.proposals.map((candidate) =>
      candidate.proposalId === proposal.proposalId
        ? {
            ...candidate,
            decisionStatus: decision.decision,
            approvalStatus,
            ...(decision.approvalRequestId
              ? { approvalRequestId: decision.approvalRequestId }
              : {}),
          }
        : candidate,
    ),
  });
}

function applyApprovalRequested(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "approval.requested" }>,
): AssistantTransitionResult {
  const approval = event.payload.approval;
  const proposal = current.proposals.find(
    (candidate) => candidate.proposalId === approval.proposalId,
  );
  if (!proposal) {
    return reject("PROPOSAL_NOT_FOUND", "Approval request references an unknown proposal.");
  }
  if (proposal.decisionStatus !== "requires_approval") {
    return reject(
      "APPROVAL_NOT_REQUIRED",
      "Approval request must follow a requires-approval tool decision.",
    );
  }
  if (
    proposal.approvalRequestId !== undefined &&
    proposal.approvalRequestId !== approval.approvalRequestId
  ) {
    return reject(
      "APPROVAL_CORRELATION_STALE",
      "Approval request id does not match the tool decision.",
    );
  }
  return acceptNext(current, event, {
    status: "awaiting_approval",
    proposals: current.proposals.map((candidate) =>
      candidate.proposalId === proposal.proposalId
        ? {
            ...candidate,
            approvalStatus: "pending" as const,
            approvalRequestId: approval.approvalRequestId,
          }
        : candidate,
    ),
  });
}

function applyApprovalResolved(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "approval.resolved" }>,
): AssistantTransitionResult {
  const approval = event.payload.approval;
  const proposal = current.proposals.find(
    (candidate) => candidate.proposalId === approval.proposalId,
  );
  if (!proposal) {
    return reject("PROPOSAL_NOT_FOUND", "Approval resolution references an unknown proposal.");
  }
  if (proposal.approvalStatus !== "pending") {
    return reject("APPROVAL_ALREADY_RESOLVED", "Approval was already resolved.");
  }
  if (proposal.approvalRequestId !== approval.approvalRequestId) {
    return reject(
      "APPROVAL_CORRELATION_STALE",
      "Approval resolution id does not match the pending approval request.",
    );
  }
  return acceptNext(current, event, {
    status: "thinking",
    proposals: current.proposals.map((candidate) =>
      candidate.proposalId === proposal.proposalId
        ? {
            ...candidate,
            approvalStatus: approval.resolution,
          }
        : candidate,
    ),
  });
}

function applyExecutionStarted(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "execution.started" }>,
): AssistantTransitionResult {
  const request = event.payload.request;
  if (event.executionId && event.executionId !== request.executionId) {
    return reject(
      "EXECUTION_CORRELATION_STALE",
      "Assistant event executionId does not match its request.",
    );
  }
  const proposal = current.proposals.find(
    (candidate) => candidate.proposalId === request.proposalId,
  );
  if (!proposal) {
    return reject("PROPOSAL_NOT_FOUND", "Execution request references an unknown proposal.");
  }
  if (request.turnId !== current.turnId || request.toolId !== proposal.toolId) {
    return reject(
      "EXECUTION_CORRELATION_STALE",
      "Execution request does not match the current turn or proposal.",
    );
  }
  if (current.executions.some((candidate) => candidate.executionId === request.executionId)) {
    return reject("EXECUTION_ALREADY_EXISTS", "Execution was already started.");
  }
  const allowed =
    proposal.decisionStatus === "allowed" ||
    (proposal.decisionStatus === "requires_approval" &&
      proposal.approvalStatus === "approved");
  if (!allowed) {
    return reject(
      "EXECUTION_NOT_ALLOWED",
      "Execution cannot start before policy allows it or approval resolves.",
    );
  }
  return acceptNext(current, event, {
    status: "executing",
    proposals: current.proposals.map((candidate) =>
      candidate.proposalId === proposal.proposalId
        ? {
            ...candidate,
            executionId: request.executionId,
            resultStatus: "pending" as const,
          }
        : candidate,
    ),
    executions: [
      ...current.executions,
      {
        executionId: request.executionId,
        proposalId: request.proposalId,
        toolId: request.toolId,
        status: "running" as const,
        resulted: false,
      },
    ],
  });
}

function applyToolResult(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "tool.resulted" }>,
): AssistantTransitionResult {
  const result = event.payload.result;
  if (event.executionId && event.executionId !== result.executionId) {
    return reject(
      "EXECUTION_CORRELATION_STALE",
      "Assistant event executionId does not match its result.",
    );
  }
  const execution = current.executions.find(
    (candidate) => candidate.executionId === result.executionId,
  );
  if (!execution) {
    return reject("RESULT_WITHOUT_EXECUTION", "Tool result references no known execution.");
  }
  if (execution.resulted) {
    return reject("EXECUTION_ALREADY_RESULTED", "Execution already produced a result.");
  }
  if (
    execution.proposalId !== result.proposalId ||
    execution.toolId !== result.toolId
  ) {
    return reject(
      "EXECUTION_CORRELATION_STALE",
      "Tool result does not match the recorded execution.",
    );
  }
  return acceptNext(current, event, {
    status: "thinking",
    proposals: current.proposals.map((candidate) =>
      candidate.proposalId === execution.proposalId
        ? {
            ...candidate,
            resultStatus: result.status,
          }
        : candidate,
    ),
    executions: current.executions.map((candidate) =>
      candidate.executionId === execution.executionId
        ? {
            ...candidate,
            status: result.status,
            resulted: true,
          }
        : candidate,
    ),
  });
}

function applyProviderContinued(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "provider.continued" }>,
): AssistantTransitionResult {
  const missing = event.payload.toolResultExecutionIds.find((executionId) => {
    const execution = current.executions.find(
      (candidate) => candidate.executionId === executionId,
    );
    return !execution?.resulted;
  });
  if (missing) {
    return reject(
      "EXECUTION_NOT_FOUND",
      "Provider continuation references an unknown or unfinished tool result.",
    );
  }
  return acceptNext(current, event, {
    status: "thinking",
    activeProviderAdapterId: event.payload.adapterId,
  });
}

function completeTurn(
  current: AssistantTurnProjection,
  event: Extract<AssistantEvent, { type: "turn.completed" }>,
): AssistantTransitionResult {
  if (current.finalAnswer) {
    return reject("DUPLICATE_FINAL_ANSWER", "Assistant turn already has a final answer.");
  }
  if (event.payload.finalAnswer.turnId !== current.turnId) {
    return reject(
      "WRONG_TURN_ID",
      "Assistant final answer turnId does not match the current projection.",
    );
  }
  return acceptNext(current, event, {
    status: "completed",
    finalAnswer: event.payload.finalAnswer,
  });
}

function acceptNext(
  current: AssistantTurnProjection,
  event: AssistantEvent,
  patch: Partial<AssistantTurnProjection>,
): AssistantTransitionResult {
  return {
    ok: true,
    projection: AssistantTurnProjectionSchema.parse({
      ...current,
      ...patch,
      lastSequence: event.sequence,
      updatedAt: event.occurredAt,
    }),
  };
}

function reject(
  code: AssistantTransitionRejectionCode,
  message: string,
): AssistantTransitionRejection {
  return { ok: false, code, message };
}
