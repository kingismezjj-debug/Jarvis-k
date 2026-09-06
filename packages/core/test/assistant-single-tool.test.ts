import { describe, expect, it, vi } from "vitest";
import { AssistantModelAdapterEventSchema, ToolDecisionSchema, ToolExecutionRequestSchema, ToolResultSchema,
  ChatAnswerPreferenceProjectionSchema, type AssistantToolContinuation, type AssistantModelAdapterEvent,
  type ToolProposal } from "@jarvis-k/contracts";
import { AssistantRuntime, type AssistantTextModelAdapter } from "../src/assistant-runtime";

const now = () => new Date("2026-09-06T00:00:00.000Z");
function deferred() { let release = () => undefined; const promise = new Promise<void>(resolve => { release = resolve; }); return { promise, release }; }
type Phase = "before_provider" | "before_execution" | "executing" | "continuing" | "none";
function harness(phase: Phase, duplicate = false, secondProposal = false, staleResult = false) {
  const gate = deferred();
  const saved: string[] = [];
  let calls = 0;
  let executed = 0;
  let continued = 0;
  let stage = "idle";
  let id = 0;
  let lastProposal: ToolProposal;
  const adapter: AssistantTextModelAdapter = {
    startTextTurn: async function* (_request, context) {
      if (++calls > 1) { yield { type: "final", text: "Retry done." }; return; }
      stage = "before_provider";
      if (phase === stage) await gate.promise;
      const event = AssistantModelAdapterEventSchema.parse({ type: "tool_proposal", proposal: { turnId: context.tool!.turnId, proposalId: context.tool!.proposalId,
        toolId: "model.status", risk: "read_only", arguments: {}, proposedAt: now().toISOString(), safeSummary: "Check status." } });
      if (event.type !== "tool_proposal") throw new Error("test proposal");
      lastProposal = event.proposal;
      yield event;
      if (duplicate) yield event;
    },
    continueTextTurn: async function* (_result: AssistantToolContinuation) {
      continued++;
      stage = "continuing";
      if (phase === stage) await gate.promise;
      if (secondProposal) { yield { type: "tool_proposal", proposal: lastProposal }; return; }
      yield { type: "delta", delta: { kind: "text", text: "Status ready." } };
      yield { type: "final", text: "Status ready." };
      yield { type: "final", text: "Late duplicate." };
    },
  };
  const runtime = new AssistantRuntime({ getProviderId: () => "chat-answer.openai-compatible.deepseek", getModelAdapter: () => adapter,
    now, createId: prefix => `${prefix}-${++id}`, publishProjection: () => undefined,
    persistFinalMessage: async (text, conversationId) => {
      saved.push(text); return { id: "message-test", role: "assistant", conversationId, text, createdAt: now().toISOString() };
    },
    executeTool: async (proposal, executionId, signal, publish) => {
      stage = "before_execution";
      if (phase === stage) await gate.promise;
      if (!signal.aborted) {
        publish({ type: "tool.decided", decision: ToolDecisionSchema.parse({ proposalId: proposal.proposalId,
          taskId: "task-test", decision: "allowed", policyVersion: "test", reasonCode: "ALLOWED", decidedAt: now().toISOString() }) });
        publish({ type: "execution.started", request: ToolExecutionRequestSchema.parse({ turnId: proposal.turnId,
          taskId: "task-test", proposalId: proposal.proposalId, executionId, toolId: "model.status", arguments: {},
          requestedAt: now().toISOString(), timeoutMs: 1000, owner: "core" }) });
        executed++;
      }
      stage = "executing";
      if (phase === stage) await gate.promise;
      return ToolResultSchema.parse({ turnId: proposal.turnId, taskId: staleResult ? "task-other" : "task-test",
        proposalId: proposal.proposalId, executionId, toolId: "model.status", resultClass: "structured", status: "completed",
        structuredResult: { runtimeMode: "lite", operationCount: 0, activeOperationCount: 0 }, resultedAt: now().toISOString() });
    },
  });
  const start = () => runtime.startTextTurn({ assistantInput: { kind: "text", text: "Check status.", source: "user" },
    source: "text", text: "Check status.", decision: { intent: "chat.answer", confidence: 1, requiresApproval: false, slots: {}, reason: "test" },
    conversationId: "primary", correlationId: "correlation-test",
    preferenceProjection: ChatAnswerPreferenceProjectionSchema.parse({ status: "none", appliesTo: "chat.answer", source: "none",
      rawContentExposed: false, vectorRetrievalUsed: false, providerNeutral: true }) });
  return { runtime, gate, saved, start, stage: () => stage, executed: () => executed, continued: () => continued };
}

describe("single tool assistant cancellation and limits", () => {
  it.each(["before_provider", "before_execution", "executing", "continuing"] as const)("cancels at %s, discards stale work and permits a new turn", async phase => {
    const h = harness(phase);
    const first = h.start();
    if (!first.ok) throw new Error("Turn not started");
    await vi.waitFor(() => expect(h.stage()).toBe(phase));
    expect(h.runtime.cancel(first.turnId).ok).toBe(true);
    h.gate.release();
    await new Promise(resolve => setTimeout(resolve, 5));
    expect(h.runtime.getProjection()?.status).toBe("cancelled");
    expect(h.saved).toEqual([]);
    expect(h.executed()).toBe(["before_provider", "before_execution"].includes(phase) ? 0 : 1);
    expect(h.continued()).toBe(phase === "continuing" ? 1 : 0);
    expect(h.start().ok).toBe(true);
    await vi.waitFor(() => expect(h.saved).toEqual(["Retry done."]));
  });
  it.each([
    ["duplicate proposal", true, false, false, 0],
    ["second iteration", false, true, false, 1],
    ["mismatched task result", false, false, true, 1],
  ] as const)("rejects %s without a final", async (_label, duplicate, second, stale, executed) => {
    const h = harness("none", duplicate, second, stale);
    h.start();
    await vi.waitFor(() => expect(h.runtime.getProjection()?.status).toBe("failed"));
    expect(h.saved).toEqual([]);
    expect(h.executed()).toBe(executed);
  });
  it("persists exactly one final and records exactly one tool iteration", async () => {
    const h = harness("none"); h.start();
    await vi.waitFor(() => expect(h.runtime.getProjection()?.status).toBe("completed"));
    expect(h.saved).toEqual(["Status ready."]);
    expect(h.executed()).toBe(1);
    expect(h.continued()).toBe(1);
    expect(h.runtime.getProjection()?.finalAnswer?.usedToolIterations).toBe(1);
  });
  it("bounds an unresponsive tool and ignores its late result", async () => {
    const h = harness("executing"); h.start();
    await vi.waitFor(() => expect(h.stage()).toBe("executing"));
    await vi.waitFor(() => expect(h.runtime.getProjection()?.status).toBe("failed"), { timeout: 2000 });
    h.gate.release();
    await new Promise(resolve => setTimeout(resolve, 5));
    expect(h.continued()).toBe(0);
    expect(h.saved).toEqual([]);
  });
});
