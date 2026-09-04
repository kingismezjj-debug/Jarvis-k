import { describe, expect, it } from "vitest";
import {
  ASSISTANT_LOOP_CONTRACT_VERSION,
  ASSISTANT_LOOP_MAX_TOOL_ITERATIONS,
  AssistantEventIdSchema,
  AssistantEventSchema,
  AssistantFailureSchema,
  AssistantFinalAnswerSchema,
  AssistantInputSchema,
  AssistantJsonObjectSchema,
  AssistantLoopExistingSchemaReuseMap,
  AssistantLoopFoundationCompatibilitySchema,
  AssistantStreamDeltaSchema,
  AssistantTurnIdSchema,
  AssistantTurnProjectionSchema,
  AssistantTurnSchema,
  CancellationReasonSchema,
  ToolDecisionSchema,
  ToolExecutionIdSchema,
  ToolExecutionRequestSchema,
  ToolProposalIdSchema,
  ToolProposalSchema,
  ToolResultSchema,
} from "../src";

const now = "2026-09-04T00:00:00.000Z";
const turnId = "turn-11111111-1111-4111-8111-111111111111";
const eventId = "aevt-11111111-1111-4111-8111-111111111111";
const proposalId = "tprop-11111111-1111-4111-8111-11111111111";
const executionId = "texec-11111111-1111-4111-8111-11111111111";

function input() {
  return {
    kind: "text",
    text: "Open a safe status page.",
    source: "user",
    conversationId: "primary",
  } as const;
}

function proposal() {
  return {
    proposalId,
    turnId,
    toolId: "filesystem.search",
    risk: "read_only",
    arguments: {
      query: "project notes",
      limit: 3,
      nested: {
        labels: ["alpha", "status"],
      },
    },
    proposedAt: now,
    safeSummary: "Search allowed local files for project notes.",
  } as const;
}

function decision(decisionValue: "allowed" | "requires_approval" | "denied") {
  return {
    proposalId,
    decision: decisionValue,
    decidedAt: now,
    policyVersion: "assistant-loop-policy-v1",
    reasonCode:
      decisionValue === "allowed" ? "ALLOWED" : "APPROVAL_REQUIRED",
    ...(decisionValue === "requires_approval"
      ? { approvalRequestId: "approval-1" }
      : {}),
  } as const;
}

describe("assistant loop protocol", () => {
  it("validates branded assistant loop ids", () => {
    expect(AssistantTurnIdSchema.parse(turnId)).toBe(turnId);
    expect(AssistantEventIdSchema.parse(eventId)).toBe(eventId);
    expect(ToolProposalIdSchema.parse(proposalId)).toBe(proposalId);
    expect(ToolExecutionIdSchema.parse(executionId)).toBe(executionId);
    expect(() => AssistantTurnIdSchema.parse(now)).toThrow();
  });

  it("validates every minimal schema", () => {
    const parsedInput = AssistantInputSchema.parse(input());
    const parsedProposal = ToolProposalSchema.parse(proposal());
    const parsedDecision = ToolDecisionSchema.parse(decision("allowed"));
    const request = ToolExecutionRequestSchema.parse({
      executionId,
      proposalId,
      turnId,
      toolId: "filesystem.search",
      arguments: { query: "project notes" },
      requestedAt: now,
      timeoutMs: 30_000,
      owner: "desktop_host",
    });
    const result = ToolResultSchema.parse({
      executionId,
      proposalId,
      toolId: "filesystem.search",
      resultClass: "structured",
      status: "completed",
      structuredResult: { matchCount: 0 },
      resultedAt: now,
    });
    const finalAnswer = AssistantFinalAnswerSchema.parse({
      turnId,
      text: "Done.",
      completedAt: now,
      usedToolIterations: 1,
      rawProviderResponsePersisted: false,
      providerRawPayloadExposed: false,
    });
    const failure = AssistantFailureSchema.parse({
      turnId,
      failureClass: "provider",
      reasonCode: "PROVIDER_FAILED",
      safeMessage: "The provider failed safely.",
      retryable: true,
      failedAt: now,
    });
    const cancellation = CancellationReasonSchema.parse({
      kind: "user_requested",
      requestedBy: "renderer",
      cancelledAt: now,
    });
    const delta = AssistantStreamDeltaSchema.parse({
      kind: "text",
      text: "Hello",
    });
    const turn = AssistantTurnSchema.parse({
      contractVersion: ASSISTANT_LOOP_CONTRACT_VERSION,
      turnId,
      conversationId: "primary",
      input: parsedInput,
      status: "thinking",
      createdAt: now,
      updatedAt: now,
    });

    expect(parsedProposal.toolId).toBe("filesystem.search");
    expect(parsedDecision.decision).toBe("allowed");
    expect(request.timeoutMs).toBe(30_000);
    expect(result.structuredResult?.matchCount).toBe(0);
    expect(finalAnswer.rawProviderResponsePersisted).toBe(false);
    expect(failure.retryable).toBe(true);
    expect(cancellation.kind).toBe("user_requested");
    expect(delta.kind).toBe("text");
    expect(turn.maxToolIterations).toBe(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS);
  });

  it("rejects unknown keys in public contracts", () => {
    expect(() =>
      AssistantInputSchema.parse({
        ...input(),
        providerPayload: {},
      }),
    ).toThrow();
    expect(() =>
      AssistantEventSchema.parse({
        eventId,
        turnId,
        sequence: 0,
        occurredAt: now,
        type: "turn.accepted",
        payload: { input: input() },
        rawProviderResponse: {},
      }),
    ).toThrow();
    expect(() =>
      ToolResultSchema.parse({
        executionId,
        proposalId,
        toolId: "filesystem.search",
        resultClass: "safe_summary",
        status: "completed",
        safeSummary: "Done.",
        stdout: "raw output",
        resultedAt: now,
      }),
    ).toThrow();
  });

  it("bounds tool arguments and rejects sensitive or executable fields", () => {
    expect(AssistantJsonObjectSchema.parse({ query: "project", limit: 3 })).toEqual({
      query: "project",
      limit: 3,
    });
    expect(() => AssistantJsonObjectSchema.parse({ token: "abc" })).toThrow();
    expect(() => AssistantJsonObjectSchema.parse({ envName: "PATH" })).toThrow();
    expect(() =>
      AssistantJsonObjectSchema.parse({ query: "https://example.invalid" }),
    ).toThrow();
    expect(() =>
      AssistantJsonObjectSchema.parse({ query: "C:\\Users\\Name\\file.txt" }),
    ).toThrow();
    expect(() =>
      AssistantJsonObjectSchema.parse({ code: "function run() {}" }),
    ).toThrow();
    expect(() =>
      AssistantJsonObjectSchema.parse(
        Object.fromEntries(Array.from({ length: 25 }, (_, index) => [`k${index}`, index])),
      ),
    ).toThrow();
    expect(() =>
      AssistantJsonObjectSchema.parse({
        a: { b: { c: { d: { e: { f: "too deep" } } } } },
      }),
    ).toThrow();
  });

  it("validates each assistant event kind", () => {
    const events = [
      {
        eventId,
        turnId,
        sequence: 0,
        occurredAt: now,
        type: "turn.accepted",
        payload: { input: input() },
      },
      {
        eventId: "aevt-provider",
        turnId,
        sequence: 1,
        occurredAt: now,
        type: "provider.started",
        payload: { adapterId: "chat-answer.openai-compatible.deepseek" },
      },
      {
        eventId: "aevt-delta",
        turnId,
        sequence: 2,
        occurredAt: now,
        type: "provider.delta",
        payload: { delta: { kind: "text", text: "Hello" } },
      },
      {
        eventId: "aevt-proposed",
        turnId,
        sequence: 3,
        occurredAt: now,
        proposalId,
        type: "tool.proposed",
        payload: { proposal: proposal() },
      },
      {
        eventId: "aevt-decided",
        turnId,
        sequence: 4,
        occurredAt: now,
        proposalId,
        type: "tool.decided",
        payload: { decision: decision("requires_approval") },
      },
      {
        eventId: "aevt-approval-requested",
        turnId,
        sequence: 5,
        occurredAt: now,
        proposalId,
        type: "approval.requested",
        payload: {
          approval: {
            approvalRequestId: "approval-1",
            proposalId,
            requestedAt: now,
            safeSummary: "Please approve the read-only tool.",
          },
        },
      },
      {
        eventId: "aevt-approval-resolved",
        turnId,
        sequence: 6,
        occurredAt: now,
        proposalId,
        type: "approval.resolved",
        payload: {
          approval: {
            approvalRequestId: "approval-1",
            proposalId,
            resolution: "approved",
            resolvedAt: now,
            reasonCode: "USER_APPROVED",
          },
        },
      },
      {
        eventId: "aevt-execution-started",
        turnId,
        sequence: 7,
        occurredAt: now,
        proposalId,
        executionId,
        type: "execution.started",
        payload: {
          request: {
            executionId,
            proposalId,
            turnId,
            toolId: "filesystem.search",
            arguments: { query: "project" },
            requestedAt: now,
            timeoutMs: 30_000,
            owner: "desktop_host",
          },
        },
      },
      {
        eventId: "aevt-resulted",
        turnId,
        sequence: 8,
        occurredAt: now,
        proposalId,
        executionId,
        type: "tool.resulted",
        payload: {
          result: {
            executionId,
            proposalId,
            toolId: "filesystem.search",
            resultClass: "safe_summary",
            status: "completed",
            safeSummary: "Search completed.",
            resultedAt: now,
          },
        },
      },
      {
        eventId: "aevt-continued",
        turnId,
        sequence: 9,
        occurredAt: now,
        type: "provider.continued",
        payload: {
          adapterId: "chat-answer.openai-compatible.deepseek",
          toolResultExecutionIds: [executionId],
        },
      },
      {
        eventId: "aevt-completed",
        turnId,
        sequence: 10,
        occurredAt: now,
        type: "turn.completed",
        payload: {
          finalAnswer: {
            turnId,
            text: "Done.",
            completedAt: now,
            usedToolIterations: 1,
            rawProviderResponsePersisted: false,
            providerRawPayloadExposed: false,
          },
        },
      },
      {
        eventId: "aevt-cancelled",
        turnId,
        sequence: 10,
        occurredAt: now,
        type: "turn.cancelled",
        payload: {
          cancellation: {
            kind: "user_requested",
            requestedBy: "renderer",
            cancelledAt: now,
          },
        },
      },
      {
        eventId: "aevt-failed",
        turnId,
        sequence: 10,
        occurredAt: now,
        type: "turn.failed",
        payload: {
          failure: {
            turnId,
            failureClass: "provider",
            reasonCode: "PROVIDER_FAILED",
            safeMessage: "Provider failed.",
            retryable: true,
            failedAt: now,
          },
        },
      },
      {
        eventId: "aevt-interrupted",
        turnId,
        sequence: 10,
        occurredAt: now,
        type: "turn.interrupted",
        payload: {
          failure: {
            turnId,
            failureClass: "interrupted",
            reasonCode: "PROCESS_RESTARTED",
            safeMessage: "Turn interrupted during recovery.",
            retryable: true,
            failedAt: now,
          },
        },
      },
    ];

    for (const event of events) {
      expect(AssistantEventSchema.safeParse(event).success).toBe(true);
    }
  });

  it("validates projection and compatibility foundation metadata", () => {
    expect(
      AssistantTurnProjectionSchema.parse({
        contractVersion: ASSISTANT_LOOP_CONTRACT_VERSION,
        turnId,
        status: "idle",
        lastSequence: -1,
        toolIterationCount: 0,
        proposals: [],
        executions: [],
      }).status,
    ).toBe("idle");
    expect(AssistantLoopExistingSchemaReuseMap.CommandEnvelopeSchema).toBe("reuse");
    expect(
      AssistantLoopFoundationCompatibilitySchema.parse({
        productionIntegrationFoundationOnly: true,
        existingRuntimeBehaviorChanged: false,
        parallelTaskRuntimeIntroduced: false,
        parallelApprovalRuntimeIntroduced: false,
        providerRawPayloadInPublicContracts: false,
      }).productionIntegrationFoundationOnly,
    ).toBe(true);
  });

  it("keeps provider raw payload and credential names out of exported contract text", () => {
    const serialized = JSON.stringify({
      input: AssistantInputSchema.description,
      turn: AssistantTurnSchema.description,
      event: AssistantEventSchema.description,
      proposal: ToolProposalSchema.description,
      result: ToolResultSchema.description,
    });

    expect(serialized).not.toMatch(/credential|token|authorization|header|rawProviderPayload/iu);
  });
});
