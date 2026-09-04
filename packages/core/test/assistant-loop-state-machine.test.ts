import { describe, expect, it } from "vitest";
import {
  ASSISTANT_LOOP_CONTRACT_VERSION,
  AssistantEventSchema,
  AssistantTurnProjectionSchema,
  type AssistantEvent,
  type AssistantTurnProjection,
} from "@jarvis-k/contracts";
import {
  reduceAssistantTurnProjection,
  type AssistantTransitionRejectionCode,
} from "../src/assistant-loop-state-machine";

const now = "2026-09-04T00:00:00.000Z";
const turnId = "turn-22222222-2222-4222-8222-222222222222";
const otherTurnId = "turn-33333333-3333-4333-8333-333333333333";
const proposalId = "tprop-22222222-2222-4222-8222-22222222222";
const executionId = "texec-22222222-2222-4222-8222-22222222222";

function idle(id = turnId): AssistantTurnProjection {
  return AssistantTurnProjectionSchema.parse({
    contractVersion: ASSISTANT_LOOP_CONTRACT_VERSION,
    turnId: id,
    status: "idle",
    lastSequence: -1,
    toolIterationCount: 0,
    proposals: [],
    executions: [],
  });
}

function event(
  sequence: number,
  type: AssistantEvent["type"],
  payload: unknown,
  extra: Record<string, unknown> = {},
): AssistantEvent {
  return AssistantEventSchema.parse({
    eventId: `aevt-${sequence}-${type.replace(".", "-")}`,
    turnId,
    sequence,
    occurredAt: now,
    type,
    payload,
    ...extra,
  });
}

function textInput() {
  return {
    kind: "text",
    text: "What is the current status?",
    source: "user",
    conversationId: "primary",
  } as const;
}

function proposal(id = proposalId) {
  return {
    proposalId: id,
    turnId,
    toolId: "filesystem.search",
    risk: "read_only",
    arguments: { query: "project" },
    proposedAt: now,
    safeSummary: "Search allowed local files.",
  } as const;
}

function decision(decisionValue: "allowed" | "requires_approval" | "denied") {
  return {
    proposalId,
    decision: decisionValue,
    decidedAt: now,
    policyVersion: "assistant-loop-policy-v1",
    reasonCode: decisionValue === "allowed" ? "ALLOWED" : "APPROVAL_REQUIRED",
    ...(decisionValue === "requires_approval"
      ? { approvalRequestId: "approval-1" }
      : {}),
  } as const;
}

function execution(id = executionId, idProposal = proposalId) {
  return {
    executionId: id,
    proposalId: idProposal,
    turnId,
    toolId: "filesystem.search",
    arguments: { query: "project" },
    requestedAt: now,
    timeoutMs: 30_000,
    owner: "desktop_host",
  } as const;
}

function result(id = executionId, idProposal = proposalId) {
  return {
    executionId: id,
    proposalId: idProposal,
    toolId: "filesystem.search",
    resultClass: "safe_summary",
    status: "completed",
    safeSummary: "Search completed.",
    resultedAt: now,
  } as const;
}

function finalAnswer() {
  return {
    turnId,
    text: "Done.",
    completedAt: now,
    usedToolIterations: 0,
    rawProviderResponsePersisted: false,
    providerRawPayloadExposed: false,
  } as const;
}

function failure(reasonCode = "PROVIDER_FAILED") {
  return {
    turnId,
    failureClass: "provider",
    reasonCode,
    safeMessage: "Provider failed safely.",
    retryable: true,
    failedAt: now,
  } as const;
}

function applyOk(
  current: AssistantTurnProjection,
  nextEvent: AssistantEvent,
): AssistantTurnProjection {
  const resultValue = reduceAssistantTurnProjection(current, nextEvent);
  expect(resultValue.ok).toBe(true);
  if (!resultValue.ok) {
    throw new Error(resultValue.code);
  }
  return resultValue.projection;
}

function expectRejected(
  current: AssistantTurnProjection,
  nextEvent: AssistantEvent,
  code: AssistantTransitionRejectionCode,
): void {
  const resultValue = reduceAssistantTurnProjection(current, nextEvent);
  expect(resultValue).toMatchObject({ ok: false, code });
}

function accepted(): AssistantTurnProjection {
  return applyOk(
    idle(),
    event(0, "turn.accepted", {
      input: textInput(),
    }),
  );
}

function withAllowedProposal(): AssistantTurnProjection {
  let projection = accepted();
  projection = applyOk(
    projection,
    event(1, "tool.proposed", { proposal: proposal() }, { proposalId }),
  );
  return applyOk(
    projection,
    event(2, "tool.decided", { decision: decision("allowed") }, { proposalId }),
  );
}

describe("assistant loop state machine", () => {
  it("runs the text-only final answer happy path", () => {
    let projection = accepted();
    projection = applyOk(
      projection,
      event(1, "provider.started", {
        adapterId: "chat-answer.openai-compatible.deepseek",
      }),
    );
    projection = applyOk(
      projection,
      event(2, "provider.delta", {
        delta: { kind: "text", text: "Working" },
      }),
    );
    projection = applyOk(
      projection,
      event(3, "turn.completed", {
        finalAnswer: finalAnswer(),
      }),
    );

    expect(projection.status).toBe("completed");
    expect(projection.streamText).toBe("Working");
    expect(projection.finalAnswer?.text).toBe("Done.");
  });

  it("runs proposal to result re-entry to final answer", () => {
    let projection = withAllowedProposal();
    projection = applyOk(
      projection,
      event(3, "execution.started", { request: execution() }, {
        proposalId,
        executionId,
      }),
    );
    projection = applyOk(
      projection,
      event(4, "tool.resulted", { result: result() }, {
        proposalId,
        executionId,
      }),
    );
    projection = applyOk(
      projection,
      event(5, "provider.continued", {
        adapterId: "chat-answer.openai-compatible.deepseek",
        toolResultExecutionIds: [executionId],
      }),
    );
    projection = applyOk(
      projection,
      event(6, "turn.completed", {
        finalAnswer: { ...finalAnswer(), usedToolIterations: 1 },
      }),
    );

    expect(projection.status).toBe("completed");
    expect(projection.executions[0]).toMatchObject({
      executionId,
      resulted: true,
      status: "completed",
    });
  });

  it("holds and resolves an approval-required path", () => {
    let projection = accepted();
    projection = applyOk(
      projection,
      event(1, "tool.proposed", { proposal: proposal() }, { proposalId }),
    );
    projection = applyOk(
      projection,
      event(2, "tool.decided", { decision: decision("requires_approval") }, {
        proposalId,
      }),
    );
    expect(projection.status).toBe("awaiting_approval");
    projection = applyOk(
      projection,
      event(3, "approval.requested", {
        approval: {
          approvalRequestId: "approval-1",
          proposalId,
          requestedAt: now,
          safeSummary: "Approve the read-only tool.",
        },
      }, { proposalId }),
    );
    projection = applyOk(
      projection,
      event(4, "approval.resolved", {
        approval: {
          approvalRequestId: "approval-1",
          proposalId,
          resolution: "approved",
          resolvedAt: now,
          reasonCode: "USER_APPROVED",
        },
      }, { proposalId }),
    );
    projection = applyOk(
      projection,
      event(5, "execution.started", { request: execution() }, {
        proposalId,
        executionId,
      }),
    );

    expect(projection.status).toBe("executing");
    expect(projection.proposals[0].approvalStatus).toBe("approved");
  });

  it("records approval denial without creating parallel approval state", () => {
    let projection = accepted();
    projection = applyOk(
      projection,
      event(1, "tool.proposed", { proposal: proposal() }, { proposalId }),
    );
    projection = applyOk(
      projection,
      event(2, "tool.decided", { decision: decision("requires_approval") }, {
        proposalId,
      }),
    );
    projection = applyOk(
      projection,
      event(3, "approval.requested", {
        approval: {
          approvalRequestId: "approval-1",
          proposalId,
          requestedAt: now,
          safeSummary: "Approve the read-only tool.",
        },
      }, { proposalId }),
    );
    projection = applyOk(
      projection,
      event(4, "approval.resolved", {
        approval: {
          approvalRequestId: "approval-1",
          proposalId,
          resolution: "denied",
          resolvedAt: now,
          reasonCode: "USER_DENIED",
        },
      }, { proposalId }),
    );

    expect(projection.status).toBe("thinking");
    expect(projection.proposals[0].approvalStatus).toBe("denied");
    expectRejected(
      projection,
      event(5, "execution.started", { request: execution() }, {
        proposalId,
        executionId,
      }),
      "EXECUTION_NOT_ALLOWED",
    );
  });

  it("cancels at thinking, approval, and executing states", () => {
    const cancellationPayload = {
      cancellation: {
        kind: "user_requested",
        requestedBy: "renderer",
        cancelledAt: now,
      },
    };
    expect(
      applyOk(accepted(), event(1, "turn.cancelled", cancellationPayload)).status,
    ).toBe("cancelled");

    let awaiting = accepted();
    awaiting = applyOk(
      awaiting,
      event(1, "tool.proposed", { proposal: proposal() }, { proposalId }),
    );
    awaiting = applyOk(
      awaiting,
      event(2, "tool.decided", { decision: decision("requires_approval") }, {
        proposalId,
      }),
    );
    expect(
      applyOk(awaiting, event(3, "turn.cancelled", cancellationPayload)).status,
    ).toBe("cancelled");

    const executing = applyOk(
      withAllowedProposal(),
      event(3, "execution.started", { request: execution() }, {
        proposalId,
        executionId,
      }),
    );
    expect(
      applyOk(executing, event(4, "turn.cancelled", cancellationPayload)).status,
    ).toBe("cancelled");
  });

  it("handles provider failure and interrupted execution as terminal states", () => {
    const failed = applyOk(
      accepted(),
      event(1, "turn.failed", {
        failure: failure(),
      }),
    );
    expect(failed.status).toBe("failed");

    const executing = applyOk(
      withAllowedProposal(),
      event(3, "execution.started", { request: execution() }, {
        proposalId,
        executionId,
      }),
    );
    const interrupted = applyOk(
      executing,
      event(4, "turn.interrupted", {
        failure: { ...failure("PROCESS_RESTARTED"), failureClass: "interrupted" },
      }),
    );
    expect(interrupted.status).toBe("interrupted");
  });

  it("rejects wrong turn id", () => {
    expectRejected(
      idle(otherTurnId),
      event(0, "turn.accepted", { input: textInput() }),
      "WRONG_TURN_ID",
    );
  });

  it("rejects sequence duplicate, backward, and gap events", () => {
    const projection = accepted();
    expectRejected(
      projection,
      event(0, "provider.started", {
        adapterId: "chat-answer.openai-compatible.deepseek",
      }),
      "SEQUENCE_DUPLICATE_OR_BACKWARD",
    );
    expectRejected(
      projection,
      event(3, "provider.started", {
        adapterId: "chat-answer.openai-compatible.deepseek",
      }),
      "SEQUENCE_GAP",
    );
  });

  it("rejects wrong proposal and execution correlations", () => {
    let projection = accepted();
    expectRejected(
      projection,
      event(1, "tool.decided", { decision: decision("allowed") }, { proposalId }),
      "PROPOSAL_NOT_FOUND",
    );

    projection = withAllowedProposal();
    expectRejected(
      projection,
      event(3, "execution.started", {
        request: execution(executionId, "tprop-stale"),
      }, { proposalId, executionId }),
      "PROPOSAL_NOT_FOUND",
    );
    expectRejected(
      projection,
      event(3, "execution.started", {
        request: { ...execution(), toolId: "localApp.open" },
      }, { proposalId, executionId }),
      "EXECUTION_CORRELATION_STALE",
    );
  });

  it("rejects result without matching proposal or execution", () => {
    const projection = withAllowedProposal();
    expectRejected(
      projection,
      event(3, "tool.resulted", { result: result() }, {
        proposalId,
        executionId,
      }),
      "RESULT_WITHOUT_EXECUTION",
    );

    const executing = applyOk(
      projection,
      event(3, "execution.started", { request: execution() }, {
        proposalId,
        executionId,
      }),
    );
    expectRejected(
      executing,
      event(4, "tool.resulted", {
        result: result(executionId, "tprop-stale"),
      }, { proposalId, executionId }),
      "EXECUTION_CORRELATION_STALE",
    );
  });

  it("rejects duplicate execution, result, and final answer", () => {
    let projection = withAllowedProposal();
    projection = applyOk(
      projection,
      event(3, "execution.started", { request: execution() }, {
        proposalId,
        executionId,
      }),
    );
    expectRejected(
      projection,
      event(4, "execution.started", {
        request: execution(),
      }, { proposalId, executionId }),
      "EXECUTION_ALREADY_EXISTS",
    );

    projection = applyOk(
      projection,
      event(4, "tool.resulted", { result: result() }, {
        proposalId,
        executionId,
      }),
    );
    expectRejected(
      projection,
      event(5, "tool.resulted", { result: result() }, {
        proposalId,
        executionId,
      }),
      "EXECUTION_ALREADY_RESULTED",
    );

    projection = applyOk(
      projection,
      event(5, "turn.completed", {
        finalAnswer: { ...finalAnswer(), usedToolIterations: 1 },
      }),
    );
    expectRejected(
      projection,
      event(6, "turn.completed", {
        finalAnswer: { ...finalAnswer(), usedToolIterations: 1 },
      }),
      "TERMINAL_STATE_IMMUTABLE",
    );
  });

  it("keeps terminal states immutable including cancellation after terminal", () => {
    const completed = applyOk(
      accepted(),
      event(1, "turn.completed", {
        finalAnswer: finalAnswer(),
      }),
    );
    expectRejected(
      completed,
      event(2, "turn.cancelled", {
        cancellation: {
          kind: "user_requested",
          requestedBy: "renderer",
          cancelledAt: now,
        },
      }),
      "TERMINAL_STATE_IMMUTABLE",
    );
  });

  it("enforces max tool iterations of four", () => {
    let projection = accepted();
    for (let index = 0; index < 4; index += 1) {
      const id = `tprop-limit-${index}`;
      projection = applyOk(
        projection,
        event(index + 1, "tool.proposed", {
          proposal: proposal(id),
        }, { proposalId: id }),
      );
    }
    expect(projection.toolIterationCount).toBe(4);
    expectRejected(
      projection,
      event(5, "tool.proposed", {
        proposal: proposal("tprop-limit-overflow"),
      }, { proposalId: "tprop-limit-overflow" }),
      "TOOL_ITERATION_LIMIT_EXCEEDED",
    );
  });

  it("rejects provider continuation before a referenced tool result exists", () => {
    const projection = applyOk(
      withAllowedProposal(),
      event(3, "execution.started", { request: execution() }, {
        proposalId,
        executionId,
      }),
    );
    expectRejected(
      projection,
      event(4, "provider.continued", {
        adapterId: "chat-answer.openai-compatible.deepseek",
        toolResultExecutionIds: [executionId],
      }),
      "EXECUTION_NOT_FOUND",
    );
  });
});
